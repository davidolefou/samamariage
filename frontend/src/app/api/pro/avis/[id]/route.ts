// SamaMariage — PATCH /api/pro/avis/[id]
//
// Le prestataire répond à un avis. requireVendor + CSRF + scope vendorId.
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireVendor } from '@/lib/server/middleware/require-vendor';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const PatchSchema = z.object({ reply: z.string().min(1).max(1000) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const csrfFail = verifyCsrf(req);
    if (csrfFail) {
      csrfFail.headers.set('x-request-id', ctx.requestId);
      return csrfFail;
    }
    const auth = await requireVendor(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', issues: parsed.error.issues },
        { status: 400, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    const res = await prisma.review.updateMany({
      where: { id, vendorId: auth.vendor.id },
      data: { reply: parsed.data.reply.trim(), repliedAt: new Date() },
    });
    if (res.count === 0) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Avis introuvable.' },
        { status: 404, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    const review = await prisma.review.findUnique({ where: { id } });
    return NextResponse.json({ ok: true, review }, { headers: { 'x-request-id': ctx.requestId } });
  });
}
