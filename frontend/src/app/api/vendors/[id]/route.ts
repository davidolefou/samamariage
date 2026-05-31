// SamaMariage — GET /api/vendors/[id]  (PUBLIC)
//
// Vitrine publique d'un prestataire PUBLISHED (vue mariée). Aucune auth.
// Projection publique : ni payout, ni userId, ni e-mail.
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const { id } = await params;
    const v = await prisma.vendor.findUnique({ where: { id } });
    if (!v || v.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Prestataire introuvable.' },
        { status: 404, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    // Projection publique uniquement.
    const vendor = {
      id: v.id,
      category: v.category,
      businessName: v.businessName,
      city: v.city,
      serviceAreas: v.serviceAreas,
      services: v.services,
      capacity: v.capacity,
      priceFrom: v.priceFrom,
      priceLabel: v.priceLabel,
      description: v.description,
      portfolio: v.portfolio,
      coverVariant: v.coverVariant,
      responseTime: v.responseTime,
      verified: v.verified,
      rating: v.rating,
      reviewCount: v.reviewCount,
      whatsapp: v.whatsapp,
    };
    return NextResponse.json({ ok: true, vendor }, { headers: { 'x-request-id': ctx.requestId } });
  });
}
