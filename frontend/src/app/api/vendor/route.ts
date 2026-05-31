// SamaMariage — GET / PUT /api/vendor
//
// GET → profil Vendor de l'utilisateur connecté ({ ok, vendor: Vendor|null }).
// PUT → upsert du profil Vendor (onboarding pro + édition vitrine/paramètres).
// Réutilise l'auth standard (requireAuth + verifyCsrf + Zod). FCFA entier.
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const CATEGORIES = ['PHOTO', 'FOOD', 'DECOR', 'SALLE', 'DJ', 'TENUE', 'VOITURE', 'ANIM'] as const;

// category + businessName sont requis (un profil minimal) ; le reste a des
// défauts pour permettre une sauvegarde progressive depuis l'onboarding.
const UpsertSchema = z.object({
  category: z.enum(CATEGORIES),
  businessName: z.string().min(1).max(120),
  ownerName: z.string().max(120).default(''),
  phone: z.string().max(40).default(''),
  whatsapp: z.string().max(40).default(''),
  city: z.string().max(60).default('dakar'),
  serviceAreas: z.array(z.string().max(60)).max(30).default([]),
  services: z.array(z.string().max(80)).max(50).default([]),
  capacity: z.number().int().min(0).max(100000).default(0),
  priceFrom: z.number().int().min(0).max(1_000_000_000).default(0),
  priceLabel: z.string().max(80).default(''),
  depositPolicy: z.string().max(200).default(''),
  description: z.string().max(2000).default(''),
  portfolio: z.array(z.string().url().max(500)).max(20).default([]),
  coverVariant: z.string().max(20).default('cv-photo'),
  responseTime: z.string().max(40).default(''),
  vacationMode: z.boolean().default(false),
  payoutMethod: z.string().max(20).default(''),
  payoutAccount: z.string().max(120).default(''),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAuth(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const vendor = await prisma.vendor.findUnique({ where: { userId: auth.user.sub } });
    return NextResponse.json({ ok: true, vendor }, { headers: { 'x-request-id': ctx.requestId } });
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
    const parsed = UpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', issues: parsed.error.issues },
        { status: 400, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    const d = parsed.data;
    const data = {
      category: d.category,
      businessName: d.businessName.trim(),
      ownerName: d.ownerName.trim(),
      phone: d.phone.trim(),
      whatsapp: d.whatsapp.trim(),
      city: d.city,
      serviceAreas: d.serviceAreas,
      services: d.services,
      capacity: d.capacity,
      priceFrom: d.priceFrom,
      priceLabel: d.priceLabel.trim(),
      depositPolicy: d.depositPolicy,
      description: d.description,
      portfolio: d.portfolio,
      coverVariant: d.coverVariant,
      responseTime: d.responseTime,
      vacationMode: d.vacationMode,
      payoutMethod: d.payoutMethod,
      payoutAccount: d.payoutAccount.trim(),
    };
    // upsert scope-é à l'utilisateur. verified/rating/status restent gérés
    // ailleurs (admin / dérivés / soumission) — jamais via ce endpoint.
    const vendor = await prisma.vendor.upsert({
      where: { userId: auth.user.sub },
      create: { userId: auth.user.sub, ...data },
      update: data,
    });
    return NextResponse.json({ ok: true, vendor }, { headers: { 'x-request-id': ctx.requestId } });
  });
}
