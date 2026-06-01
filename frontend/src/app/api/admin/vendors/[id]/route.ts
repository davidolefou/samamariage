// SamaMariage — GET / PATCH /api/admin/vendors/[id]
//
// GET : fiche prestataire complète + revenus/réservations (devis ACCEPTED).
// PATCH : actions de modération — feature/unfeature/suspend/restore/approve/
// reject — chacune auditée (logAdminAction). requireAdmin + CSRF.
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { logAdminAction } from '@/lib/server/admin/audit';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAdmin('ADMIN', req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const { id } = await params;
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: { 'x-request-id': ctx.requestId } });
    }
    const [agg, recentBookings] = await Promise.all([
      prisma.quoteRequest.aggregate({ _sum: { quoteAmount: true }, _count: { _all: true }, where: { vendorId: id, status: 'ACCEPTED' } }),
      prisma.quoteRequest.findMany({
        where: { vendorId: id, status: 'ACCEPTED' },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        select: { coupleName: true, quoteAmount: true, updatedAt: true },
      }),
    ]);
    return NextResponse.json(
      {
        ok: true,
        vendor: { ...vendor, createdAt: vendor.createdAt.toISOString(), updatedAt: vendor.updatedAt.toISOString() },
        revenue: agg._sum.quoteAmount ?? 0,
        bookings: agg._count._all,
        recentBookings: recentBookings.map((b) => ({ coupleName: b.coupleName, amount: b.quoteAmount ?? 0, at: b.updatedAt.toISOString() })),
      },
      { headers: { 'x-request-id': ctx.requestId } },
    );
  });
}

const ACTIONS = ['feature', 'unfeature', 'suspend', 'restore', 'approve', 'reject'] as const;
const Body = z.object({ action: z.enum(ACTIONS) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const csrfFail = verifyCsrf(req);
    if (csrfFail) {
      csrfFail.headers.set('x-request-id', ctx.requestId);
      return csrfFail;
    }
    const auth = await requireAdmin('ADMIN', req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const { id } = await params;
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_FAILED', issues: parsed.error.issues }, { status: 400, headers: { 'x-request-id': ctx.requestId } });
    }
    const existing = await prisma.vendor.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: { 'x-request-id': ctx.requestId } });
    }

    const action = parsed.data.action;
    const data: { featured?: boolean; status?: 'PUBLISHED' | 'SUSPENDED' | 'DRAFT'; verified?: boolean } = {};
    switch (action) {
      case 'feature': data.featured = true; break;
      case 'unfeature': data.featured = false; break;
      case 'suspend': data.status = 'SUSPENDED'; break;
      case 'restore': data.status = 'PUBLISHED'; break;
      case 'approve': data.status = 'PUBLISHED'; data.verified = true; break;
      case 'reject': data.status = 'DRAFT'; break;
    }

    const vendor = await prisma.vendor.update({ where: { id }, data });
    await logAdminAction(prisma, {
      actorId: auth.admin.id,
      action: `vendor.${action}`,
      targetType: 'Vendor',
      targetId: id,
    });

    return NextResponse.json(
      { ok: true, vendor: { id: vendor.id, status: vendor.status, featured: vendor.featured, verified: vendor.verified } },
      { headers: { 'x-request-id': ctx.requestId } },
    );
  });
}
