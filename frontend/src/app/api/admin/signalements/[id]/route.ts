// SamaMariage — PATCH /api/admin/signalements/[id]
//
// Traite un signalement : resolve (action prise) ou dismiss (classé sans
// suite). requireAdmin + CSRF + logAdminAction.
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { logAdminAction } from '@/lib/server/admin/audit';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const Body = z.object({
  action: z.enum(['resolve', 'dismiss']),
  outcome: z.string().max(120).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const csrfFail = verifyCsrf(req);
    if (csrfFail) {
      csrfFail.headers.set('x-request-id', ctx.requestId);
      return csrfFail;
    }
    const auth = await requireAdmin('ADMIN', req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const { id } = await params;
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_FAILED', issues: parsed.error.issues }, { status: 400, headers: { 'x-request-id': ctx.requestId } });
    }
    const existing = await prisma.signalement.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: { 'x-request-id': ctx.requestId } });
    }

    const status = parsed.data.action === 'resolve' ? 'RESOLVED' : 'DISMISSED';
    const outcome = parsed.data.outcome ?? (parsed.data.action === 'resolve' ? 'Traité' : 'Classé sans suite');
    const updated = await prisma.signalement.update({
      where: { id },
      data: { status, outcome, resolvedById: auth.admin.id, resolvedAt: new Date() },
    });
    await logAdminAction(prisma, {
      actorId: auth.admin.id,
      action: `signalement.${parsed.data.action}`,
      targetType: 'Signalement',
      targetId: id,
    });

    return NextResponse.json({ ok: true, signalement: { id: updated.id, status: updated.status, outcome: updated.outcome } }, { headers: { 'x-request-id': ctx.requestId } });
  });
}
