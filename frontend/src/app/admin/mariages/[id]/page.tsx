'use client';

// SamaMariage — Console admin · Fiche mariage — /admin/mariages/[id].
// Réutilise GET /api/admin/members/[id] (un mariage = le Wedding d'une mariée),
// présentation orientée évènement (cérémonies, date, budget, prestataires).

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApi } from '@/lib/useApi';
import AdminShell from '@/components/admin/AdminShell';
import { type Wedding, weddingDateLabel, countdownLabel, cityLabel, prepProgress, ceremonyList, fmtCompact, fmtFCFA } from '@/lib/wedding';
import { CATEGORY_LABELS, type VendorCategory } from '@/lib/vendor';

export const dynamic = 'force-static';

interface DetailResponse {
  ok: boolean;
  member: Record<string, unknown> & { id: string; userId: string; fullName: string; partnerName: string; city: string };
  kpis: { budget: number; budgetAllocated: number; budgetSpent: number; vendorsBooked: number; vendorsTotal: number; ndawtalTotal: number; guestsConfirmed: number; guestsTotal: number };
  vendorsBooked: { coupleName: string; amount: number; businessName: string; category: string }[];
}

function Content({ data }: { data: DetailResponse }) {
  const m = data.member;
  const w = m as unknown as Wedding;
  const k = data.kpis;
  const prep = prepProgress(w);
  const couple = `${m.fullName.split(' ')[0]}${m.partnerName ? ' & ' + m.partnerName.split(' ')[0] : ''}`;
  const init = ((m.fullName[0] ?? '') + (m.partnerName[0] ?? '')).toUpperCase();
  const budgetPct = k.budget > 0 ? Math.min(100, Math.round((k.budgetSpent / k.budget) * 100)) : 0;

  return (
    <div className="space-y-6">
      <Link href="/admin/mariages" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink/60 transition hover:text-royal-800">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 4 6 8l4 4" /></svg>
        Tous les mariages
      </Link>

      <section className="rounded-3xl bg-paper p-5 shadow-card ring-1 ring-ink/5 sm:p-7">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-bordeaux via-gold-400 to-royal-700 font-display text-2xl text-paper shadow-card ring-2 ring-paper">{init}</div>
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">{ceremonyList(w) || 'Mariage'}</div>
            <h1 className="mt-0.5 font-display text-3xl leading-tight text-royal-900">{couple}</h1>
            <div className="mt-0.5 text-[13px] text-ink/55">{weddingDateLabel(w)} <span className="font-mono text-bordeaux">{countdownLabel(w)}</span> · {cityLabel(w)}</div>
          </div>
          <Link href={`/admin/membres/${m.id}`} className="ml-auto hidden shrink-0 rounded-full bg-paper px-4 py-2.5 text-[13px] font-medium text-royal-900 ring-1 ring-ink/10 transition hover:bg-bone sm:block">Fiche mariée</Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { v: prep + '%', l: 'préparatifs' },
            { v: m.budget != null && !(m as { budgetSkip?: boolean }).budgetSkip ? fmtCompact(k.budget) + ' F' : '—', l: 'budget prévu' },
            { v: `${k.vendorsBooked}/${k.vendorsTotal}`, l: 'prestataires' },
            { v: fmtCompact(k.ndawtalTotal) + ' F', l: 'ndawtal' },
            { v: `${k.guestsConfirmed}/${k.guestsTotal}`, l: 'invités' },
          ].map((kpi) => (
            <div key={kpi.l} className="rounded-2xl bg-bone/60 p-3">
              <div className="font-display text-2xl text-royal-900">{kpi.v}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink/55">{kpi.l}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <section className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5 sm:p-6">
            <h2 className="font-display text-2xl text-royal-900">Prestataires réservés</h2>
            <div className="mt-4 space-y-2.5">
              {data.vendorsBooked.length === 0 ? (
                <p className="text-sm text-ink/55">Aucune réservation confirmée.</p>
              ) : (
                data.vendorsBooked.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl bg-bone/50 px-3.5 py-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-royal-700 to-gold-400 font-display text-sm text-paper">{v.businessName.slice(0, 2).toUpperCase()}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-royal-900">{v.businessName}</div>
                      <div className="text-[11px] text-ink/55">{CATEGORY_LABELS[v.category as VendorCategory] ?? v.category}</div>
                    </div>
                    <div className="font-mono text-[13px] text-royal-900">{v.amount ? fmtFCFA(v.amount) + ' F' : '—'}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">Budget</div>
            {k.budget > 0 ? (
              <>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-display text-2xl text-royal-900">{fmtFCFA(k.budgetSpent)} F</span>
                  <span className="font-mono text-[12px] text-ink/55">/ {fmtFCFA(k.budget)} F</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-bone">
                  <div className={'h-full rounded-full ' + (k.budgetSpent > k.budget ? 'bg-bordeaux' : 'bg-gradient-to-r from-royal-700 to-gold-400')} style={{ width: budgetPct + '%' }} />
                </div>
                <div className="mt-1.5 font-mono text-[11px] text-ink/55">alloué {fmtFCFA(k.budgetAllocated)} F</div>
              </>
            ) : (
              <p className="mt-3 text-sm text-ink/55">Budget non renseigné.</p>
            )}
          </section>

          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-royal-800 to-royal-900 p-5 text-gold-50 shadow-card ring-1 ring-royal-900/30">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold-400/15 blur-2xl" />
            <div className="relative">
              <div className="font-mono text-[10px] uppercase tracking-widest text-gold-400/90">Ndawtal</div>
              <div className="mt-2 font-display text-3xl">{fmtCompact(k.ndawtalTotal)} F</div>
              <p className="mt-1.5 text-[13px] text-gold-100/85">{k.guestsConfirmed} invité{k.guestsConfirmed > 1 ? 's' : ''} confirmé{k.guestsConfirmed > 1 ? 's' : ''} sur {k.guestsTotal}.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AdminMariageDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data, loading } = useApi<DetailResponse>(`/api/admin/members/${id}`, { skip: !id });
  return (
    <AdminShell active="mariages" breadcrumb="Fiche mariage" search="">
      {loading && !data ? (
        <div className="grid place-items-center py-32">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
        </div>
      ) : data ? (
        <Content data={data} />
      ) : (
        <p className="text-sm text-ink/55">Mariage introuvable.</p>
      )}
    </AdminShell>
  );
}
