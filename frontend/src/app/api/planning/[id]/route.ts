// SamaMariage — PATCH / DELETE /api/planning/[id]  (scope userId)
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const PatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  phase: z.string().max(60).optional(),
  dueDate: z.string().nullable().optional(),
  done: z.boolean().optional(),
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
    if (p.title !== undefined) data.title = p.title.trim();
    if (p.phase !== undefined) data.phase = p.phase.trim() || 'Général';
    if (p.dueDate !== undefined) data.dueDate = p.dueDate ? new Date(p.dueDate) : null;
    if (p.done !== undefined) data.done = p.done;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'VALIDATION_FAILED', message: 'Aucun champ.' }, { status: 400, headers: { 'x-request-id': ctx.requestId } });
    }
    const res = await prisma.planningTask.updateMany({ where: { id, userId: auth.user.sub }, data });
    if (res.count === 0) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Tâche introuvable.' }, { status: 404, headers: { 'x-request-id': ctx.requestId } });
    }
    const task = await prisma.planningTask.findUnique({ where: { id } });
    return NextResponse.json({ ok: true, task }, { headers: { 'x-request-id': ctx.requestId } });
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
    const res = await prisma.planningTask.deleteMany({ where: { id, userId: auth.user.sub } });
    if (res.count === 0) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Tâche introuvable.' }, { status: 404, headers: { 'x-request-id': ctx.requestId } });
    }
    return NextResponse.json({ ok: true }, { headers: { 'x-request-id': ctx.requestId } });
  });
}
