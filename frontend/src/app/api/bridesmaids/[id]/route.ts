// SamaMariage — PATCH / DELETE /api/bridesmaids/[id]  (scope userId)
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const PatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(40).optional(),
  measurementsDone: z.boolean().optional(),
  cotisationAmount: z.number().int().min(0).max(1_000_000_000).optional(),
  cotisationPaid: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
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
    const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_FAILED', issues: parsed.error.issues }, { status: 400, headers: { 'x-request-id': ctx.requestId } });
    }
    const data: Record<string, unknown> = {};
    const p = parsed.data;
    if (p.name !== undefined) data.name = p.name.trim();
    if (p.phone !== undefined) data.phone = p.phone.trim();
    if (p.measurementsDone !== undefined) data.measurementsDone = p.measurementsDone;
    if (p.cotisationAmount !== undefined) data.cotisationAmount = p.cotisationAmount;
    if (p.cotisationPaid !== undefined) data.cotisationPaid = p.cotisationPaid;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'VALIDATION_FAILED', message: 'Aucun champ.' }, { status: 400, headers: { 'x-request-id': ctx.requestId } });
    }
    const res = await prisma.bridesmaid.updateMany({ where: { id, userId: auth.user.sub }, data });
    if (res.count === 0) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Demoiselle introuvable.' }, { status: 404, headers: { 'x-request-id': ctx.requestId } });
    }
    const bridesmaid = await prisma.bridesmaid.findUnique({ where: { id } });
    return NextResponse.json({ ok: true, bridesmaid }, { headers: { 'x-request-id': ctx.requestId } });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
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
    const res = await prisma.bridesmaid.deleteMany({ where: { id, userId: auth.user.sub } });
    if (res.count === 0) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Demoiselle introuvable.' }, { status: 404, headers: { 'x-request-id': ctx.requestId } });
    }
    return NextResponse.json({ ok: true }, { headers: { 'x-request-id': ctx.requestId } });
  });
}
