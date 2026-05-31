// SamaMariage — GET /api/vendors  (PUBLIC)
//
// Catalogue des prestataires PUBLISHED pour la marketplace mariée.
// Filtres : ?category=PHOTO, ?q=texte, ?verified=1. Projection publique.
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import type { Prisma, VendorCategory } from '@prisma/client';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const CATEGORIES = ['PHOTO', 'FOOD', 'DECOR', 'SALLE', 'DJ', 'TENUE', 'VOITURE', 'BEAUTE', 'ANIM'];

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const q = (url.searchParams.get('q') ?? '').trim();
    const verifiedOnly = url.searchParams.get('verified') === '1';

    const where: Prisma.VendorWhereInput = { status: 'PUBLISHED' };
    if (category && CATEGORIES.includes(category)) where.category = category as VendorCategory;
    if (verifiedOnly) where.verified = true;
    if (q) {
      where.OR = [
        { businessName: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const rows = await prisma.vendor.findMany({
      where,
      orderBy: [{ verified: 'desc' }, { rating: 'desc' }, { reviewCount: 'desc' }],
      take: 200,
    });
    const vendors = rows.map((v) => ({
      id: v.id,
      category: v.category,
      businessName: v.businessName,
      city: v.city,
      services: v.services,
      priceFrom: v.priceFrom,
      priceLabel: v.priceLabel,
      description: v.description,
      coverVariant: v.coverVariant,
      responseTime: v.responseTime,
      verified: v.verified,
      rating: v.rating,
      reviewCount: v.reviewCount,
    }));
    return NextResponse.json({ ok: true, vendors }, { headers: { 'x-request-id': ctx.requestId } });
  });
}
