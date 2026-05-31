// SamaMariage — GET / POST /api/planning  (rétroplanning de la mariée)
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  phase: z.string().max(60).default('Général'),
  dueDate: z.string().optional(),
  done: z.boolean().default(false),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAuth(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const tasks = await prisma.planningTask.findMany({ where: { userId: auth.user.sub }, orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }] });
    const total = tasks.length;
    const done = tasks.filter((t) => t.done).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return NextResponse.json({ ok: true, tasks, progress: { total, done, pct } }, { headers: { 'x-request-id': ctx.requestId } });
  });
}

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
    const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_FAILED', issues: parsed.error.issues }, { status: 400, headers: { 'x-request-id': ctx.requestId } });
    }
    const d = parsed.data;
    const task = await prisma.planningTask.create({
      data: { userId: auth.user.sub, title: d.title.trim(), phase: d.phase.trim() || 'Général', dueDate: d.dueDate ? new Date(d.dueDate) : null, done: d.done },
    });
    return NextResponse.json({ ok: true, task }, { status: 201, headers: { 'x-request-id': ctx.requestId } });
  });
}
