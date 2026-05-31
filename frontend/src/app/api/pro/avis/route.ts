// SamaMariage — GET /api/pro/avis
//
// Le prestataire liste ses avis + un résumé (moyenne, total, répartition 1..5).
// requireVendor.
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
    const reviews = await prisma.review.findMany({
      where: { vendorId: auth.vendor.id },
      orderBy: { createdAt: 'desc' },
    });
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const r of reviews) {
      distribution[r.rating] = (distribution[r.rating] ?? 0) + 1;
      sum += r.rating;
    }
    const count = reviews.length;
    const average = count ? Math.round((sum / count) * 10) / 10 : 0;
    return NextResponse.json(
      { ok: true, reviews, summary: { average, count, distribution } },
      { headers: { 'x-request-id': ctx.requestId } },
    );
  });
}
