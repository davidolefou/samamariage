// SamaMariage — POST /api/signalements
//
// Un utilisateur connecté signale une cible (prestataire, avis, compte…).
// requireAuth + CSRF. Le traitement se fait côté admin (/api/admin/signalements).
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const Body = z.object({
  targetType: z.enum(['Vendor', 'Review', 'User', 'Message']),
  targetId: z.string().max(60).default(''),
  targetLabel: z.string().max(160).default(''),
  severity: z.enum(['low', 'med', 'high']).default('med'),
  reason: z.string().min(3).max(600),
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
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_FAILED', issues: parsed.error.issues }, { status: 400, headers: { 'x-request-id': ctx.requestId } });
    }
    const d = parsed.data;
    const created = await prisma.signalement.create({
      data: {
        reporterId: auth.user.sub,
        targetType: d.targetType,
        targetId: d.targetId,
        targetLabel: d.targetLabel,
        severity: d.severity,
        reason: d.reason,
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: created.id }, { status: 201, headers: { 'x-request-id': ctx.requestId } });
  });
}
