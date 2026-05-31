// SamaMariage — PATCH / DELETE /api/outfits/[id]  (scope userId)
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const STATUSES = ['IDEA', 'CHOSEN', 'ORDERED', 'FITTING', 'READY'] as const;

const PatchSchema = z.object({
  ceremony: z.string().max(20).optional(),
  title: z.string().min(1).max(120).optional(),
  fabric: z.string().max(120).optional(),
  cost: z.number().int().min(0).max(1_000_000_000).optional(),
  status: z.enum(STATUSES).optional(),
  notes: z.string().max(500).optional(),
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
    if (p.ceremony !== undefined) data.ceremony = p.ceremony;
    if (p.title !== undefined) data.title = p.title.trim();
    if (p.fabric !== undefined) data.fabric = p.fabric.trim();
    if (p.cost !== undefined) data.cost = p.cost;
    if (p.status !== undefined) data.status = p.status;
    if (p.notes !== undefined) data.notes = p.notes;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'VALIDATION_FAILED', message: 'Aucun champ.' }, { status: 400, headers: { 'x-request-id': ctx.requestId } });
    }
    const res = await prisma.outfit.updateMany({ where: { id, userId: auth.user.sub }, data });
    if (res.count === 0) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Look introuvable.' }, { status: 404, headers: { 'x-request-id': ctx.requestId } });
    }
    const outfit = await prisma.outfit.findUnique({ where: { id } });
    return NextResponse.json({ ok: true, outfit }, { headers: { 'x-request-id': ctx.requestId } });
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
    const res = await prisma.outfit.deleteMany({ where: { id, userId: auth.user.sub } });
    if (res.count === 0) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Look introuvable.' }, { status: 404, headers: { 'x-request-id': ctx.requestId } });
    }
    return NextResponse.json({ ok: true }, { headers: { 'x-request-id': ctx.requestId } });
  });
}
