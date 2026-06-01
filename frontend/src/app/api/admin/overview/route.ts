// SamaMariage — GET /api/admin/overview
//
// Agrégats RÉELS pour la console admin (Vue d'ensemble) : compteurs membres /
// mariages / prestataires, file de validation, volume & commission dérivés des
// devis ACCEPTED, répartition prestataires par catégorie, top prestataires,
// série d'inscriptions sur 6 mois, activité récente. requireAdmin (lecture).
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server/middleware';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

function commissionPct(): number {
  const raw = Number(process.env.VENDOR_COMMISSION_PCT);
  return Number.isFinite(raw) && raw >= 0 && raw <= 100 ? raw : 8;
}

/** Bornes [début, fin] des 6 derniers mois civils (du plus ancien au plus récent). */
function lastSixMonths(now: Date): { label: string; start: Date; end: Date }[] {
  const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const out: { label: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1));
    out.push({ label: MONTHS[start.getUTCMonth()] ?? '', start, end });
  }
  return out;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAdmin('ADMIN', req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }

    const pct = commissionPct();
    const months = lastSixMonths(new Date());

    const [members, weddings, vendorsActive, vendorsPending, grossAgg, byCategory, topVendors, recentWeddings, recentPendingVendors, recentAccepted, signupCounts] =
      await Promise.all([
        prisma.user.count(),
        prisma.wedding.count(),
        prisma.vendor.count({ where: { status: 'PUBLISHED' } }),
        prisma.vendor.count({ where: { status: 'PENDING_REVIEW' } }),
        prisma.quoteRequest.aggregate({ _sum: { quoteAmount: true }, where: { status: 'ACCEPTED' } }),
        prisma.vendor.groupBy({ by: ['category'], where: { status: 'PUBLISHED' }, _count: { _all: true } }),
        prisma.vendor.findMany({
          where: { status: 'PUBLISHED' },
          orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
          take: 4,
          select: { id: true, businessName: true, category: true, rating: true, reviewCount: true },
        }),
        prisma.wedding.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: { fullName: true, createdAt: true } }),
        prisma.vendor.findMany({
          where: { status: 'PENDING_REVIEW' },
          orderBy: { updatedAt: 'desc' },
          take: 6,
          select: { businessName: true, updatedAt: true },
        }),
        prisma.quoteRequest.findMany({
          where: { status: 'ACCEPTED' },
          orderBy: { updatedAt: 'desc' },
          take: 6,
          select: { coupleName: true, quoteAmount: true, updatedAt: true },
        }),
        Promise.all(
          months.map((m) => prisma.wedding.count({ where: { createdAt: { gte: m.start, lt: m.end } } })),
        ),
      ]);

    const grossVolume = grossAgg._sum.quoteAmount ?? 0;
    const commission = Math.round((grossVolume * pct) / 100);

    const vendorsByCategory = byCategory
      .map((c) => ({ category: c.category as string, count: c._count._all }))
      .sort((a, b) => b.count - a.count);

    const signupSeries = months.map((m, i) => ({ label: m.label, count: signupCounts[i] ?? 0 }));

    // Activité récente : fusion d'évènements réels, triés du plus récent.
    type Activity = { type: 'wedding' | 'vendor_pending' | 'booking'; label: string; amount?: number; at: string };
    const activity: Activity[] = [
      ...recentWeddings.map((w) => ({ type: 'wedding' as const, label: w.fullName, at: w.createdAt.toISOString() })),
      ...recentPendingVendors.map((v) => ({ type: 'vendor_pending' as const, label: v.businessName, at: v.updatedAt.toISOString() })),
      ...recentAccepted.map((q) => ({
        type: 'booking' as const,
        label: q.coupleName,
        ...(q.quoteAmount != null ? { amount: q.quoteAmount } : {}),
        at: q.updatedAt.toISOString(),
      })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 8);

    return NextResponse.json(
      {
        ok: true,
        kpis: { members, weddings, vendorsActive, vendorsPending, grossVolume, commission, commissionPct: pct },
        signupSeries,
        vendorsByCategory,
        topVendors,
        activity,
      },
      { headers: { 'x-request-id': ctx.requestId } },
    );
  });
}
