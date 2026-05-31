// SamaMariage — PATCH /api/pro/demandes/[id]
//
// Le prestataire répond à une demande : envoie un devis (QUOTED + montant +
// message), décline (DECLINED) ou archive (ARCHIVED). requireVendor + CSRF +
// scope vendorId (updateMany pour ne pas révéler une demande d'un autre pro).
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireVendor } from '@/lib/server/middleware/require-vendor';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const PatchSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('quote'),
    quoteAmount: z.number().int().min(0).max(1_000_000_000),
    quoteMessage: z.string().max(1000).default(''),
  }),
  z.object({ action: z.literal('decline') }),
  z.object({ action: z.literal('archive') }),
]);

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
    const p = parsed.data;
    const data =
      p.action === 'quote'
        ? { status: 'QUOTED' as const, quoteAmount: p.quoteAmount, quoteMessage: p.quoteMessage }
        : p.action === 'decline'
          ? { status: 'DECLINED' as const }
          : { status: 'ARCHIVED' as const };

    // Scope au prestataire : updateMany évite de toucher la demande d'un autre.
    const res = await prisma.quoteRequest.updateMany({
      where: { id, vendorId: auth.vendor.id },
      data,
    });
    if (res.count === 0) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Demande introuvable.' },
        { status: 404, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    const request = await prisma.quoteRequest.findUnique({ where: { id } });
    return NextResponse.json({ ok: true, request }, { headers: { 'x-request-id': ctx.requestId } });
  });
}
