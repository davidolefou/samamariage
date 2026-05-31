// SamaMariage — PATCH / DELETE /api/ndawtal/[id]
//
// PATCH  → met à jour le statut (receiptSent, repaid) d'une entrée.
// DELETE → supprime une entrée.
// Les deux vérifient que l'entrée appartient à l'utilisateur connecté.
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const PatchSchema = z.object({
  receiptSent: z.boolean().optional(),
  repaid: z.boolean().optional(),
});

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
    const auth = await requireAuth(req.headers.get('authorization'));
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
    // Construire le patch sans clés `undefined` (exactOptionalPropertyTypes).
    const data: { receiptSent?: boolean; repaid?: boolean } = {};
    if (parsed.data.receiptSent !== undefined) data.receiptSent = parsed.data.receiptSent;
    if (parsed.data.repaid !== undefined) data.repaid = parsed.data.repaid;
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', message: 'Aucun champ à mettre à jour.' },
        { status: 400, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    // Scope à l'utilisateur : updateMany évite de révéler l'existence d'une autre entrée.
    const res = await prisma.ndawtalEntry.updateMany({
      where: { id, userId: auth.user.sub },
      data,
    });
    if (res.count === 0) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Entrée introuvable.' },
        { status: 404, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    const entry = await prisma.ndawtalEntry.findUnique({ where: { id } });
    return NextResponse.json({ ok: true, entry }, { headers: { 'x-request-id': ctx.requestId } });
  });
}

export async function DELETE(
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
    const auth = await requireAuth(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const { id } = await params;
    const res = await prisma.ndawtalEntry.deleteMany({
      where: { id, userId: auth.user.sub },
    });
    if (res.count === 0) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Entrée introuvable.' },
        { status: 404, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    return NextResponse.json({ ok: true }, { headers: { 'x-request-id': ctx.requestId } });
  });
}
