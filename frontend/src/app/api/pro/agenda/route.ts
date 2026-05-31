// SamaMariage — GET / POST /api/pro/agenda
//
// GET  → dates bloquées + réservations (QuoteRequest ACCEPTED datées) du pro.
// POST → bascule une date bloquée ({ date: 'YYYY-MM-DD' } → { blocked }).
// requireVendor (+ CSRF sur POST).
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireVendor } from '@/lib/server/middleware/require-vendor';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ToggleSchema = z.object({ date: z.string().regex(DATE_RE) });

function toUtcMidnight(s: string): Date {
  return new Date(s + 'T00:00:00.000Z');
}
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireVendor(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const [blocksRows, bookingRows] = await Promise.all([
      prisma.availabilityBlock.findMany({ where: { vendorId: auth.vendor.id }, orderBy: { date: 'asc' } }),
      prisma.quoteRequest.findMany({
        where: { vendorId: auth.vendor.id, status: 'ACCEPTED', eventDate: { not: null } },
        orderBy: { eventDate: 'asc' },
      }),
    ]);
    const blocks = blocksRows.map((b) => isoDate(b.date));
    const bookings = bookingRows
      .filter((r) => r.eventDate)
      .map((r) => ({ date: isoDate(r.eventDate as Date), coupleName: r.coupleName, city: r.city }));
    return NextResponse.json({ ok: true, blocks, bookings }, { headers: { 'x-request-id': ctx.requestId } });
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const csrfFail = verifyCsrf(req);
    if (csrfFail) {
      csrfFail.headers.set('x-request-id', ctx.requestId);
      return csrfFail;
    }
    const auth = await requireVendor(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const body = await req.json().catch(() => null);
    const parsed = ToggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', issues: parsed.error.issues },
        { status: 400, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    const date = toUtcMidnight(parsed.data.date);
    // Toggle : si déjà bloquée → on libère, sinon on bloque.
    const existing = await prisma.availabilityBlock.findUnique({
      where: { vendorId_date: { vendorId: auth.vendor.id, date } },
    });
    let blocked: boolean;
    if (existing) {
      await prisma.availabilityBlock.delete({ where: { id: existing.id } });
      blocked = false;
    } else {
      await prisma.availabilityBlock.create({ data: { vendorId: auth.vendor.id, date } });
      blocked = true;
    }
    return NextResponse.json({ ok: true, blocked }, { headers: { 'x-request-id': ctx.requestId } });
  });
}
