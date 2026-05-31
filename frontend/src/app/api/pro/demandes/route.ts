// SamaMariage — GET /api/pro/demandes
//
// Le prestataire connecté liste ses demandes de devis reçues + stats par statut.
// requireVendor (404 si pas de profil pro).
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { requireVendor } from '@/lib/server/middleware/require-vendor';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireVendor(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const requests = await prisma.quoteRequest.findMany({
      where: { vendorId: auth.vendor.id },
      orderBy: { createdAt: 'desc' },
    });
    const stats = { new: 0, quoted: 0, accepted: 0, declined: 0 };
    for (const r of requests) {
      if (r.status === 'NEW') stats.new += 1;
      else if (r.status === 'QUOTED') stats.quoted += 1;
      else if (r.status === 'ACCEPTED') stats.accepted += 1;
      else if (r.status === 'DECLINED') stats.declined += 1;
    }
    return NextResponse.json(
      { ok: true, requests, stats },
      { headers: { 'x-request-id': ctx.requestId } },
    );
  });
}
