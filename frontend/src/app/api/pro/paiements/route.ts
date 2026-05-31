// SamaMariage — GET /api/pro/paiements
//
// Vue financière dérivée des devis : ACCEPTED = encaissé (brut), commission
// (défaut 8%, VENDOR_COMMISSION_PCT), net ; QUOTED = en attente. Lecture seule
// (le versement réel est géré hors de cet endpoint). requireVendor. FCFA entier.
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { requireVendor } from '@/lib/server/middleware/require-vendor';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

function commissionPct(): number {
  const raw = Number(process.env.VENDOR_COMMISSION_PCT);
  return Number.isFinite(raw) && raw >= 0 && raw <= 100 ? raw : 8;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireVendor(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const pct = commissionPct();
    const rows = await prisma.quoteRequest.findMany({
      where: { vendorId: auth.vendor.id, status: { in: ['ACCEPTED', 'QUOTED'] }, quoteAmount: { not: null } },
      orderBy: { updatedAt: 'desc' },
    });

    let grossTotal = 0;
    let pendingTotal = 0;
    const transactions = rows.map((r) => {
      const gross = r.quoteAmount ?? 0;
      const commission = Math.round((gross * pct) / 100);
      const net = gross - commission;
      if (r.status === 'ACCEPTED') grossTotal += gross;
      else pendingTotal += gross;
      return {
        id: r.id,
        coupleName: r.coupleName,
        status: r.status,
        date: (r.updatedAt as Date).toISOString(),
        gross,
        commission,
        net,
      };
    });
    const commission = Math.round((grossTotal * pct) / 100);
    const net = grossTotal - commission;

    return NextResponse.json(
      {
        ok: true,
        commissionPct: pct,
        grossTotal,
        commission,
        net,
        pendingTotal,
        payoutMethod: auth.vendor.payoutMethod,
        payoutAccount: auth.vendor.payoutAccount,
        transactions,
      },
      { headers: { 'x-request-id': ctx.requestId } },
    );
  });
}
