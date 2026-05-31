// SamaMariage — GET / POST /api/ndawtal
//
// GET  → { ok, entries[], stats } pour l'utilisateur connecté.
// POST → crée une entrée ndawtal (un don reçu).
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const RELATIONS = [
  'TANTE_MARIEE',
  'TANTE_MARIE',
  'COUSINE',
  'AMIE',
  'VOISINE',
  'FAMILLE_MARIEE',
  'FAMILLE_MARIE',
  'COLLEGUE',
  'AUTRE',
] as const;
const CEREMONIES = ['TAKK', 'CEET', 'RECEPTION', 'AUTRE'] as const;
const TYPES = ['CASH', 'CADEAU', 'SERVICE'] as const;

const CreateSchema = z.object({
  donorName: z.string().min(1).max(120),
  relationship: z.enum(RELATIONS).default('AUTRE'),
  ceremony: z.enum(CEREMONIES).default('RECEPTION'),
  type: z.enum(TYPES).default('CASH'),
  amount: z.number().int().min(0).max(1_000_000_000).default(0),
  donationDate: z.string().optional(), // ISO ; défaut = maintenant
  notes: z.string().max(300).default(''),
});

interface Stats {
  totalReceived: number;
  donorCount: number;
  average: number;
  topDonor: { name: string; amount: number } | null;
  byCeremony: Record<string, { amount: number; count: number }>;
  byFamily: { mariee: number; marie: number };
}

function computeStats(
  entries: { donorName: string; amount: number; ceremony: string; relationship: string }[],
): Stats {
  const totalReceived = entries.reduce((s, e) => s + e.amount, 0);
  const donorCount = entries.length;
  const average = donorCount ? Math.round(totalReceived / donorCount) : 0;

  let topDonor: Stats['topDonor'] = null;
  for (const e of entries) {
    if (!topDonor || e.amount > topDonor.amount) topDonor = { name: e.donorName, amount: e.amount };
  }

  const byCeremony: Stats['byCeremony'] = {};
  for (const c of CEREMONIES) byCeremony[c] = { amount: 0, count: 0 };
  for (const e of entries) {
    const slot = byCeremony[e.ceremony] ?? { amount: 0, count: 0 };
    slot.amount += e.amount;
    slot.count += 1;
    byCeremony[e.ceremony] = slot;
  }

  const marieeRels = new Set(['TANTE_MARIEE', 'FAMILLE_MARIEE', 'COUSINE', 'AMIE', 'VOISINE']);
  let mariee = 0;
  let marie = 0;
  for (const e of entries) {
    if (e.relationship === 'TANTE_MARIE' || e.relationship === 'FAMILLE_MARIE') marie += e.amount;
    else if (marieeRels.has(e.relationship)) mariee += e.amount;
  }

  return { totalReceived, donorCount, average, topDonor, byCeremony, byFamily: { mariee, marie } };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAuth(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const entries = await prisma.ndawtalEntry.findMany({
      where: { userId: auth.user.sub },
      orderBy: { donationDate: 'desc' },
    });
    const stats = computeStats(
      entries.map((e) => ({
        donorName: e.donorName,
        amount: e.amount,
        ceremony: e.ceremony,
        relationship: e.relationship,
      })),
    );
    return NextResponse.json({ ok: true, entries, stats }, { headers: { 'x-request-id': ctx.requestId } });
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
    const entry = await prisma.ndawtalEntry.create({
      data: {
        userId: auth.user.sub,
        donorName: d.donorName.trim(),
        relationship: d.relationship,
        ceremony: d.ceremony,
        type: d.type,
        amount: d.type === 'SERVICE' ? 0 : d.amount,
        donationDate: d.donationDate ? new Date(d.donationDate) : new Date(),
        notes: d.notes,
      },
    });
    return NextResponse.json(
      { ok: true, entry },
      { status: 201, headers: { 'x-request-id': ctx.requestId } },
    );
  });
}
