// SamaMariage — POST /api/quote-requests
//
// Une mariée connectée envoie une demande de devis à un prestataire publié.
// (Le pro liste/répond via /api/pro/demandes.) requireAuth + CSRF + Zod.
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
  coupleName: z.string().max(120).default(''),
  eventDate: z.string().optional(), // ISO
  city: z.string().max(60).default(''),
  guests: z.number().int().min(0).max(100000).default(0),
  budget: z.number().int().min(0).max(1_000_000_000).default(0),
  detail: z.string().max(400).default(''),
  message: z.string().max(1000).default(''),
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
    // Le prestataire ciblé doit exister et être publié.
    const vendor = await prisma.vendor.findUnique({ where: { id: d.vendorId } });
    if (!vendor || vendor.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'VENDOR_NOT_FOUND', message: 'Prestataire introuvable ou indisponible.' },
        { status: 404, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    const request = await prisma.quoteRequest.create({
      data: {
        vendorId: d.vendorId,
        userId: auth.user.sub,
        coupleName: d.coupleName.trim(),
        eventDate: d.eventDate ? new Date(d.eventDate) : null,
        city: d.city.trim(),
        guests: d.guests,
        budget: d.budget,
        detail: d.detail.trim(),
        message: d.message.trim(),
      },
    });
    return NextResponse.json(
      { ok: true, request },
      { status: 201, headers: { 'x-request-id': ctx.requestId } },
    );
  });
}
