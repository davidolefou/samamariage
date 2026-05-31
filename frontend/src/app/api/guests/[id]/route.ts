// SamaMariage — PATCH / DELETE /api/guests/[id]
//
// PATCH  → met à jour un·e invité·e (RSVP, table, places, côté, contact…).
// DELETE → supprime un·e invité·e.
// Les deux vérifient que l'entrée appartient à l'utilisateur connecté.
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

const PatchSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  phone: z.string().max(40).optional(),
  side: z.enum(SIDES).optional(),
  rsvp: z.enum(RSVPS).optional(),
  seats: z.number().int().min(1).max(50).optional(),
  table: z.string().max(40).optional(),
  notes: z.string().max(300).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
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
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', issues: parsed.error.issues },
        { status: 400, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    // Construire le patch sans clés `undefined` (exactOptionalPropertyTypes).
    const data: {
      fullName?: string;
      phone?: string;
      side?: (typeof SIDES)[number];
      rsvp?: (typeof RSVPS)[number];
      seats?: number;
      table?: string;
      notes?: string;
    } = {};
    const p = parsed.data;
    if (p.fullName !== undefined) data.fullName = p.fullName.trim();
    if (p.phone !== undefined) data.phone = p.phone.trim();
    if (p.side !== undefined) data.side = p.side;
    if (p.rsvp !== undefined) data.rsvp = p.rsvp;
    if (p.seats !== undefined) data.seats = p.seats;
    if (p.table !== undefined) data.table = p.table.trim();
    if (p.notes !== undefined) data.notes = p.notes;
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', message: 'Aucun champ à mettre à jour.' },
        { status: 400, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    // Scope à l'utilisateur : updateMany évite de révéler l'existence d'une autre entrée.
    const res = await prisma.guest.updateMany({
      where: { id, userId: auth.user.sub },
      data,
    });
    if (res.count === 0) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Invité·e introuvable.' },
        { status: 404, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    const guest = await prisma.guest.findUnique({ where: { id } });
    return NextResponse.json({ ok: true, guest }, { headers: { 'x-request-id': ctx.requestId } });
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
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
    const { id } = await params;
    const res = await prisma.guest.deleteMany({
      where: { id, userId: auth.user.sub },
    });
    if (res.count === 0) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Invité·e introuvable.' },
        { status: 404, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    return NextResponse.json({ ok: true }, { headers: { 'x-request-id': ctx.requestId } });
  });
}
