// SamaMariage — GET /api/admin/signalements
//
// File de modération (console admin). Liste filtrable (à traiter / traités /
// tous) + stats (à traiter, gravité haute, résolus ce mois). requireAdmin.
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/server/middleware';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const RESOLVED_STATUSES: ('RESOLVED' | 'DISMISSED')[] = ['RESOLVED', 'DISMISSED'];

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAdmin('ADMIN', req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const tab = req.nextUrl.searchParams.get('tab') ?? 'open';
    const where: Prisma.SignalementWhereInput =
      tab === 'open' ? { status: 'OPEN' } : tab === 'resolved' ? { status: { in: RESOLVED_STATUSES } } : {};

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const [rows, open, high, resolvedThisMonth] = await Promise.all([
      prisma.signalement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { reporter: { select: { email: true } } },
      }),
      prisma.signalement.count({ where: { status: 'OPEN' } }),
      prisma.signalement.count({ where: { status: 'OPEN', severity: 'high' } }),
      prisma.signalement.count({ where: { status: { in: RESOLVED_STATUSES }, resolvedAt: { gte: monthStart } } }),
    ]);

    const signalements = rows.map((s) => ({
      id: s.id,
      targetType: s.targetType,
      targetLabel: s.targetLabel,
      severity: s.severity,
      reason: s.reason,
      status: s.status,
      outcome: s.outcome,
      reporterEmail: s.reporter?.email ?? null,
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json(
      { ok: true, signalements, stats: { open, high, resolvedThisMonth } },
      { headers: { 'x-request-id': ctx.requestId } },
    );
  });
}
