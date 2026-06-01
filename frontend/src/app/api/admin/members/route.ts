// SamaMariage — GET /api/admin/members
//
// Liste des MARIÉES (profils Wedding + compte User) pour la console admin.
// Données réelles : nom, date, ville, préparatifs (calculés côté client via les
// helpers Wedding), statut du compte, date d'inscription. Filtres : recherche
// (nom/ville) + diaspora. requireAdmin (lecture).
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server/middleware';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const MAX = 200;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAdmin('ADMIN', req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }

    const url = req.nextUrl;
    const q = (url.searchParams.get('q') ?? '').trim();
    const diasporaOnly = url.searchParams.get('diaspora') === '1';

    const where: Record<string, unknown> = {};
    if (diasporaOnly) where.city = 'diasp';
    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { partnerName: { contains: q, mode: 'insensitive' } },
        { cityOther: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [rows, total, weddingsCount, diasporaCount, onboardingDone] = await Promise.all([
      prisma.wedding.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: MAX,
        include: { user: { select: { email: true, status: true, createdAt: true } } },
      }),
      prisma.user.count(),
      prisma.wedding.count(),
      prisma.wedding.count({ where: { city: 'diasp' } }),
      prisma.wedding.count({ where: { completedOnboarding: true } }),
    ]);

    const members = rows.map((w) => ({
      id: w.id,
      userId: w.userId,
      email: w.user?.email ?? '',
      accountStatus: w.user?.status ?? 'ACTIVE',
      since: (w.user?.createdAt ?? w.createdAt).toISOString(),
      // Champs Wedding bruts → le client réutilise ses helpers (prep, date, ville).
      fullName: w.fullName,
      partnerName: w.partnerName,
      dateMode: w.dateMode,
      datePrecise: w.datePrecise ? w.datePrecise.toISOString() : null,
      dateMonth: w.dateMonth,
      dateInMonths: w.dateInMonths,
      city: w.city,
      cityOther: w.cityOther,
      ceremonies: w.ceremonies,
      guests: w.guests,
      budget: w.budget,
      budgetSkip: w.budgetSkip,
      priorities: w.priorities,
      styles: w.styles,
      bridesmaids: w.bridesmaids,
      completedOnboarding: w.completedOnboarding,
      createdAt: w.createdAt.toISOString(),
    }));

    return NextResponse.json(
      {
        ok: true,
        members,
        stats: { total, weddings: weddingsCount, diaspora: diasporaCount, onboardingDone },
      },
      { headers: { 'x-request-id': ctx.requestId } },
    );
  });
}
