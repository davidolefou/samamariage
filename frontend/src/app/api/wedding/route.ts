// SamaMariage — GET / PUT /api/wedding
//
// Profil de mariage (onboarding 12 étapes), 1:1 avec l'utilisateur connecté.
// GET  → renvoie le Wedding de l'utilisateur (ou null).
// PUT  → upsert idempotent du profil (création ou mise à jour).
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const CeremoniesSchema = z.object({
  takk: z.boolean(),
  ceet: z.boolean(),
  civil: z.boolean(),
  reception: z.boolean(),
});
const CeremonyDatesSchema = z.object({
  takk: z.string(),
  ceet: z.string(),
  civil: z.string(),
  reception: z.string(),
});

const WeddingSchema = z.object({
  fullName: z.string().min(2).max(120),
  partnerName: z.string().min(2).max(120),
  partnerPronouns: z.enum(['il', 'elle', 'autre']).default('il'),
  phoneCountry: z.string().max(8).default('+221'),
  phone: z.string().max(40).default(''),
  dateMode: z.enum(['PRECISE', 'MONTH', 'UNKNOWN']).default('PRECISE'),
  datePrecise: z.string().optional(),
  dateMonth: z.string().optional(),
  dateInMonths: z.number().int().min(1).max(24).default(6),
  city: z.string().max(60).default('dakar'),
  cityOther: z.string().max(120).default(''),
  ceremonies: CeremoniesSchema,
  ceremonyDates: CeremonyDatesSchema,
  guests: z.number().int().min(1).max(10000).default(450),
  budget: z.number().int().min(0).max(1_000_000_000).default(12_000_000),
  budgetSkip: z.boolean().default(false),
  priorities: z.array(z.string().max(40)).max(6).default([]),
  styles: z.array(z.string().max(40)).max(10).default([]),
  fabric: z.string().max(40).default('bazin'),
  bridesmaids: z.number().int().min(0).max(60).default(12),
  inspirationSources: z.array(z.string().max(40)).max(10).default([]),
  toAvoid: z.string().max(200).default(''),
  completedOnboarding: z.boolean().default(true),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAuth(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const wedding = await prisma.wedding.findUnique({ where: { userId: auth.user.sub } });
    return NextResponse.json({ ok: true, wedding }, { headers: { 'x-request-id': ctx.requestId } });
  });
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
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
    const parsed = WeddingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', issues: parsed.error.issues },
        { status: 400, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    const d = parsed.data;
    const datePrecise =
      d.dateMode === 'PRECISE' && d.datePrecise ? new Date(`${d.datePrecise}T12:00:00Z`) : null;

    const data = {
      fullName: d.fullName,
      partnerName: d.partnerName,
      partnerPronouns: d.partnerPronouns,
      phoneCountry: d.phoneCountry,
      phone: d.phone,
      dateMode: d.dateMode,
      datePrecise,
      dateMonth: d.dateMode === 'MONTH' ? (d.dateMonth ?? null) : null,
      dateInMonths: d.dateInMonths,
      city: d.city,
      cityOther: d.cityOther,
      ceremonies: d.ceremonies,
      ceremonyDates: d.ceremonyDates,
      guests: d.guests,
      budget: d.budget,
      budgetSkip: d.budgetSkip,
      priorities: d.priorities,
      styles: d.styles,
      fabric: d.fabric,
      bridesmaids: d.bridesmaids,
      inspirationSources: d.inspirationSources,
      toAvoid: d.toAvoid,
      completedOnboarding: d.completedOnboarding,
    };

    const wedding = await prisma.wedding.upsert({
      where: { userId: auth.user.sub },
      create: { userId: auth.user.sub, ...data },
      update: data,
    });

    return NextResponse.json({ ok: true, wedding }, { headers: { 'x-request-id': ctx.requestId } });
  });
}
