// SamaMariage — GET /api/admin/members/[id]
//
// Fiche d'une mariée (id = Wedding.id) pour la console admin : profil + KPIs
// (préparatifs, budget, prestataires, ndawtal, invités) + modules utilisés +
// prestataires réservés (devis ACCEPTED). 100% agrégats RÉELS. requireAdmin.
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server/middleware';
import { prisma } from '@/lib/server/prisma';
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

    const wedding = await prisma.wedding.findUnique({
      where: { id },
      include: { user: { select: { email: true, status: true, createdAt: true } } },
    });
    if (!wedding) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: { 'x-request-id': ctx.requestId } });
    }
    const userId = wedding.userId;

    const [
      acceptedQuotes,
      totalQuotes,
      ndawtalAgg,
      ndawtalCount,
      guestsConfirmed,
      guestsTotal,
      moodCount,
      planningTotal,
      planningDone,
      budgetCats,
      outfitsCount,
      bridesmaidsCount,
      serenityCount,
    ] = await Promise.all([
      prisma.quoteRequest.findMany({
        where: { userId, status: 'ACCEPTED' },
        orderBy: { updatedAt: 'desc' },
        include: { vendor: { select: { businessName: true, category: true } } },
      }),
      prisma.quoteRequest.count({ where: { userId } }),
      prisma.ndawtalEntry.aggregate({ _sum: { amount: true }, where: { userId } }),
      prisma.ndawtalEntry.count({ where: { userId } }),
      prisma.guest.count({ where: { userId, rsvp: 'CONFIRMED' } }),
      prisma.guest.count({ where: { userId } }),
      prisma.moodItem.count({ where: { userId } }),
      prisma.planningTask.count({ where: { userId } }),
      prisma.planningTask.count({ where: { userId, done: true } }),
      prisma.budgetCategory.aggregate({ _sum: { allocated: true, spent: true }, _count: { _all: true }, where: { userId } }),
      prisma.outfit.count({ where: { userId } }),
      prisma.bridesmaid.count({ where: { userId } }),
      prisma.moodCheckin.count({ where: { userId } }),
    ]);

    const ndawtalTotal = ndawtalAgg._sum.amount ?? 0;
    const vendorsBooked = acceptedQuotes.map((q) => ({
      coupleName: q.coupleName,
      amount: q.quoteAmount ?? 0,
      businessName: q.vendor?.businessName ?? '—',
      category: (q.vendor?.category as string) ?? '',
    }));

    const modules = [
      { key: 'mood', label: 'Sama Mood', count: moodCount },
      { key: 'budget', label: 'Sama Budget', count: budgetCats._count._all },
      { key: 'planning', label: 'Sama Planning', count: planningTotal, done: planningDone },
      { key: 'prestataires', label: 'Sama Prestataires', count: totalQuotes },
      { key: 'ndawtal', label: 'Sama Ndawtal', count: ndawtalCount },
      { key: 'tenues', label: 'Sama Tenues', count: outfitsCount + bridesmaidsCount },
      { key: 'invites', label: 'Sama Invités', count: guestsTotal },
      { key: 'serenite', label: 'Sama Sérénité', count: serenityCount },
    ];

    return NextResponse.json(
      {
        ok: true,
        member: {
          id: wedding.id,
          userId,
          email: wedding.user?.email ?? '',
          phone: wedding.phone,
          phoneCountry: wedding.phoneCountry,
          accountStatus: wedding.user?.status ?? 'ACTIVE',
          since: (wedding.user?.createdAt ?? wedding.createdAt).toISOString(),
          // champs Wedding bruts (le client calcule prep/date/ville)
          fullName: wedding.fullName,
          partnerName: wedding.partnerName,
          dateMode: wedding.dateMode,
          datePrecise: wedding.datePrecise ? wedding.datePrecise.toISOString() : null,
          dateMonth: wedding.dateMonth,
          dateInMonths: wedding.dateInMonths,
          city: wedding.city,
          cityOther: wedding.cityOther,
          ceremonies: wedding.ceremonies,
          guests: wedding.guests,
          budget: wedding.budget,
          budgetSkip: wedding.budgetSkip,
          priorities: wedding.priorities,
          styles: wedding.styles,
          bridesmaids: wedding.bridesmaids,
          completedOnboarding: wedding.completedOnboarding,
          createdAt: wedding.createdAt.toISOString(),
        },
        kpis: {
          budget: wedding.budget,
          budgetAllocated: budgetCats._sum.allocated ?? 0,
          budgetSpent: budgetCats._sum.spent ?? 0,
          vendorsBooked: acceptedQuotes.length,
          vendorsTotal: totalQuotes,
          ndawtalTotal,
          guestsConfirmed,
          guestsTotal,
        },
        modules,
        vendorsBooked,
      },
      { headers: { 'x-request-id': ctx.requestId } },
    );
  });
}
