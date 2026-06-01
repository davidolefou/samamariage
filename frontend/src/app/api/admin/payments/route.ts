// SamaMariage — GET /api/admin/payments
//
// Vue financière plateforme (console admin) : volume (devis ACCEPTED),
// commission Sama, net à reverser aux prestataires, ndawtal collecté,
// transactions récentes (entrées : réservations + ndawtal), versements dûs par
// prestataire. 100% dérivé du réel. requireAdmin (lecture).
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

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAdmin('ADMIN', req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const pct = commissionPct();

    const [grossAgg, ndawtalAgg, weddingsCount, byVendor, recentQuotes, recentNdawtal] = await Promise.all([
      prisma.quoteRequest.aggregate({ _sum: { quoteAmount: true }, where: { status: 'ACCEPTED' } }),
      prisma.ndawtalEntry.aggregate({ _sum: { amount: true } }),
      prisma.wedding.count(),
      prisma.quoteRequest.groupBy({ by: ['vendorId'], where: { status: 'ACCEPTED' }, _sum: { quoteAmount: true } }),
      prisma.quoteRequest.findMany({
        where: { status: 'ACCEPTED' },
        orderBy: { updatedAt: 'desc' },
        take: 8,
        select: { coupleName: true, quoteAmount: true, updatedAt: true, vendor: { select: { businessName: true } } },
      }),
      prisma.ndawtalEntry.findMany({ orderBy: { createdAt: 'desc' }, take: 8, select: { donorName: true, amount: true, createdAt: true } }),
    ]);

    const gross = grossAgg._sum.quoteAmount ?? 0;
    const commission = Math.round((gross * pct) / 100);
    const netToVendors = gross - commission;
    const ndawtalTotal = ndawtalAgg._sum.amount ?? 0;

    // Versements dûs par prestataire (net = brut - commission).
    const vendorIds = byVendor.map((g) => g.vendorId);
    const vendors = vendorIds.length
      ? await prisma.vendor.findMany({ where: { id: { in: vendorIds } }, select: { id: true, businessName: true } })
      : [];
    const nameById = new Map(vendors.map((v) => [v.id, v.businessName]));
    const payouts = byVendor
      .map((g) => {
        const grossV = g._sum.quoteAmount ?? 0;
        return { vendorId: g.vendorId, businessName: nameById.get(g.vendorId) ?? '—', net: grossV - Math.round((grossV * pct) / 100) };
      })
      .filter((p) => p.net > 0)
      .sort((a, b) => b.net - a.net)
      .slice(0, 8);

    // Transactions récentes (entrées réelles).
    type Tx = { dir: 'in'; label: string; method: string; amount: number; at: string };
    const transactions: Tx[] = [
      ...recentQuotes.map((q) => ({
        dir: 'in' as const,
        label: `Réservation · ${q.coupleName || 'mariage'} → ${q.vendor?.businessName ?? '—'}`,
        method: 'Devis',
        amount: q.quoteAmount ?? 0,
        at: q.updatedAt.toISOString(),
      })),
      ...recentNdawtal.map((n) => ({
        dir: 'in' as const,
        label: `Ndawtal · ${n.donorName || 'don'}`,
        method: 'Ndawtal',
        amount: n.amount,
        at: n.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 12);

    return NextResponse.json(
      {
        ok: true,
        kpis: { gross, commission, commissionPct: pct, netToVendors, ndawtalTotal, weddings: weddingsCount, pendingPayouts: payouts.length },
        transactions,
        payouts,
      },
      { headers: { 'x-request-id': ctx.requestId } },
    );
  });
}
