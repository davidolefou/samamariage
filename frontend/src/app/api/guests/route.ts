// SamaMariage — GET / POST /api/guests
//
// GET  → { ok, guests[], stats } pour l'utilisateur connecté.
// POST → crée un·e invité·e.
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const SIDES = ['MARIEE', 'MARIE', 'COMMUN'] as const;
const RSVPS = ['PENDING', 'CONFIRMED', 'DECLINED', 'MAYBE'] as const;

const CreateSchema = z.object({
  fullName: z.string().min(1).max(120),
  phone: z.string().max(40).default(''),
  side: z.enum(SIDES).default('COMMUN'),
  rsvp: z.enum(RSVPS).default('PENDING'),
  seats: z.number().int().min(1).max(50).default(1),
  table: z.string().max(40).default(''),
  notes: z.string().max(300).default(''),
});

interface Stats {
  total: number;
  confirmed: number;
  declined: number;
  pending: number;
  maybe: number;
  confirmedSeats: number;
  bySide: Record<string, number>;
}

function computeStats(guests: { rsvp: string; seats: number; side: string }[]): Stats {
  const stats: Stats = {
    total: guests.length,
    confirmed: 0,
    declined: 0,
    pending: 0,
    maybe: 0,
    confirmedSeats: 0,
    bySide: { MARIEE: 0, MARIE: 0, COMMUN: 0 },
  };
  for (const g of guests) {
    if (g.rsvp === 'CONFIRMED') {
      stats.confirmed += 1;
      stats.confirmedSeats += g.seats;
    } else if (g.rsvp === 'DECLINED') stats.declined += 1;
    else if (g.rsvp === 'MAYBE') stats.maybe += 1;
    else stats.pending += 1;
    stats.bySide[g.side] = (stats.bySide[g.side] ?? 0) + 1;
  }
  return stats;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAuth(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const guests = await prisma.guest.findMany({
      where: { userId: auth.user.sub },
      orderBy: { createdAt: 'desc' },
    });
    const stats = computeStats(
      guests.map((g) => ({ rsvp: g.rsvp, seats: g.seats, side: g.side })),
    );
    return NextResponse.json({ ok: true, guests, stats }, { headers: { 'x-request-id': ctx.requestId } });
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
    const auth = await requireAuth(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', issues: parsed.error.issues },
        { status: 400, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    const d = parsed.data;
    const guest = await prisma.guest.create({
      data: {
        userId: auth.user.sub,
        fullName: d.fullName.trim(),
        phone: d.phone.trim(),
        side: d.side,
        rsvp: d.rsvp,
        seats: d.seats,
        table: d.table.trim(),
        notes: d.notes,
      },
    });
    return NextResponse.json(
      { ok: true, guest },
      { status: 201, headers: { 'x-request-id': ctx.requestId } },
    );
  });
}
