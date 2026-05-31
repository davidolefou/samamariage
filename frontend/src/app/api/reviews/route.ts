// SamaMariage — POST /api/reviews
//
// Une mariée laisse (ou met à jour) un avis sur un prestataire (1 par couple/
// prestataire). Recalcule l'agrégat Vendor.rating + reviewCount dans une tx.
// requireAuth + CSRF + Zod.
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const CreateSchema = z.object({
  vendorId: z.string().min(1).max(60),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(2000).default(''),
  weddingLabel: z.string().max(120).default(''),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const csrfFail = verifyCsrf(req);
    if (csrfFail) {
      csrfFail.headers.set('x-request-id', ctx.requestId);
      return csrfFail;
    }
    const auth = await requireAuth(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', issues: parsed.error.issues },
        { status: 400, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    const d = parsed.data;
    const vendor = await prisma.vendor.findUnique({ where: { id: d.vendorId } });
    if (!vendor) {
      return NextResponse.json(
        { error: 'VENDOR_NOT_FOUND', message: 'Prestataire introuvable.' },
        { status: 404, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    // Upsert de l'avis + recalcul de l'agrégat dans une transaction.
    const review = await prisma.$transaction(async (tx) => {
      const r = await tx.review.upsert({
        where: { vendorId_userId: { vendorId: d.vendorId, userId: auth.user.sub } },
        create: { vendorId: d.vendorId, userId: auth.user.sub, rating: d.rating, text: d.text.trim(), weddingLabel: d.weddingLabel.trim() },
        update: { rating: d.rating, text: d.text.trim(), weddingLabel: d.weddingLabel.trim() },
      });
      const agg = await tx.review.aggregate({
        where: { vendorId: d.vendorId },
        _avg: { rating: true },
        _count: true,
      });
      await tx.vendor.update({
        where: { id: d.vendorId },
        data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count },
      });
      return r;
    });
    return NextResponse.json(
      { ok: true, review },
      { status: 201, headers: { 'x-request-id': ctx.requestId } },
    );
  });
}
