// SamaMariage — GET /api/admin/vendors
//
// Annuaire prestataires de la console admin. Par défaut : prestataires
// PUBLISHED + SUSPENDED, enrichis des revenus générés (devis ACCEPTED) et du
// nombre de réservations. `?queue=pending` → file de validation (PENDING_REVIEW).
// Toujours : stats (actifs, vérifiés, vedettes, suspendus, en attente).
// requireAdmin (lecture).
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server/middleware';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const SELECT = {
  id: true,
  businessName: true,
  category: true,
  city: true,
  rating: true,
  reviewCount: true,
  verified: true,
  featured: true,
  status: true,
  createdAt: true,
} as const;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAdmin('ADMIN', req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const queue = req.nextUrl.searchParams.get('queue');

    const [stats, statuses] = await Promise.all([
      Promise.all([
        prisma.vendor.count({ where: { status: 'PUBLISHED' } }),
        prisma.vendor.count({ where: { status: 'PUBLISHED', verified: true } }),
        prisma.vendor.count({ where: { featured: true } }),
        prisma.vendor.count({ where: { status: 'SUSPENDED' } }),
        prisma.vendor.count({ where: { status: 'PENDING_REVIEW' } }),
      ]),
      Promise.resolve(null),
    ]);
    const [active, verified, featured, suspended, pending] = stats;
    void statuses;

    if (queue === 'pending') {
      const rows = await prisma.vendor.findMany({
        where: { status: 'PENDING_REVIEW' },
        orderBy: { updatedAt: 'asc' },
        select: { ...SELECT, ownerName: true, phone: true, whatsapp: true, services: true, priceFrom: true, description: true, portfolio: true, updatedAt: true },
      });
      return NextResponse.json(
        { ok: true, vendors: rows, stats: { active, verified, featured, suspended, pending } },
        { headers: { 'x-request-id': ctx.requestId } },
      );
    }

    const rows = await prisma.vendor.findMany({
      where: { status: { in: ['PUBLISHED', 'SUSPENDED'] } },
      orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
      select: SELECT,
    });

    // Revenus + réservations par prestataire (devis ACCEPTED).
    const grouped = await prisma.quoteRequest.groupBy({
      by: ['vendorId'],
      where: { status: 'ACCEPTED' },
      _sum: { quoteAmount: true },
      _count: { _all: true },
    });
    const byVendor = new Map(grouped.map((g) => [g.vendorId, { revenue: g._sum.quoteAmount ?? 0, bookings: g._count._all }]));

    const vendors = rows.map((v) => ({
      ...v,
      createdAt: v.createdAt.toISOString(),
      revenue: byVendor.get(v.id)?.revenue ?? 0,
      bookings: byVendor.get(v.id)?.bookings ?? 0,
    }));

    return NextResponse.json(
      { ok: true, vendors, stats: { active, verified, featured, suspended, pending } },
      { headers: { 'x-request-id': ctx.requestId } },
    );
  });
}
