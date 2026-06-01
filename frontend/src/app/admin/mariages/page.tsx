'use client';

// SamaMariage — Console admin · Mariages — /admin/mariages.
// Port de admin-mariages.html. Un « mariage » = le Wedding d'une mariée →
// réutilise GET /api/admin/members. Filtres (imminents / à risque / diaspora)
// + KPIs calculés côté client à partir des données réelles.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useApi } from '@/lib/useApi';
import AdminShell from '@/components/admin/AdminShell';
import { type Wedding, weddingDateLabel, countdownLabel, cityLabel, prepProgress, daysUntil, ceremonyList, fmtCompact } from '@/lib/wedding';

export const dynamic = 'force-static';

interface Member extends Record<string, unknown> {
  id: string;
  fullName: string;
  partnerName: string;
  city: string;
  budget: number;
  budgetSkip: boolean;
}
interface MembersResponse {
  ok: boolean;
  members: Member[];
  stats: { total: number; weddings: number; diaspora: number; onboardingDone: number };
}

type Filter = 'all' | 'soon' | 'risk' | 'diaspora';

function asWedding(m: Member): Wedding {
  return m as unknown as Wedding;
}
function isSoon(m: Member): boolean {
  const d = daysUntil(asWedding(m));
  return d !== null && d <= 60;
}
function isRisk(m: Member): boolean {
  const d = daysUntil(asWedding(m));
  return d !== null && d < 120 && prepProgress(asWedding(m)) < 30;
}

function Kpi({ label, value, unit, tone = 'text-royal-900' }: { label: string; value: string; unit?: string; tone?: string }) {
  return (
    <div className="rounded-2xl bg-paper p-4 shadow-card ring-1 ring-ink/5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">{label}</div>
      <div className={'mt-2 font-display text-3xl ' + tone}>{value}{unit && <span className="text-base text-ink/45"> {unit}</span>}</div>
    </div>
  );
}

function Content({ data }: { data: MembersResponse }) {
  const [f, setF] = useState<Filter>('all');

  const withBudget = data.members.filter((m) => !m.budgetSkip && m.budget > 0);
  const avgBudget = withBudget.length ? Math.round(withBudget.reduce((s, m) => s + m.budget, 0) / withBudget.length) : 0;
  const riskCount = useMemo(() => data.members.filter(isRisk).length, [data.members]);

  const list = useMemo(() => {
    return data.members.filter((m) => {
      if (f === 'soon') return isSoon(m);
      if (f === 'risk') return isRisk(m);
      if (f === 'diaspora') return m.city === 'diasp';
      return true;
    });
  }, [data.members, f]);

  return (
    <div className="space-y-6">
      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Opérations</div>
        <h1 className="mt-2 font-display text-3xl leading-tight text-royal-900 sm:text-4xl">
          Les <em className="not-italic gold-shine">mariages</em> en cours.
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink/65">
          {data.stats.weddings} mariages pilotés. Budgets, avancement — repère ceux qui ont besoin d&apos;un coup de pouce.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="En cours" value={String(data.stats.weddings)} />
        <Kpi label="Diaspora" value={String(data.stats.diaspora)} tone="text-bordeaux" />
        <Kpi label="Budget moyen" value={avgBudget ? fmtCompact(avgBudget) : '—'} {...(avgBudget ? { unit: 'F' } : {})} />
        <Kpi label="À risque" value={String(riskCount)} tone="text-bordeaux" />
      </section>

      <section className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-paper p-1 ring-1 ring-ink/8">
          {([['all', 'Tous'], ['soon', 'Imminents'], ['risk', 'À risque'], ['diaspora', 'Diaspora']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setF(v)} className={'rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition ' + (f === v ? 'bg-royal-700 text-gold-50' : 'text-ink/60 hover:text-royal-800')}>{l}</button>
          ))}
        </div>
      </section>

      {list.length === 0 ? (
        <div className="rounded-2xl bg-paper p-10 text-center text-[14px] text-ink/55 shadow-card ring-1 ring-ink/5">Aucun mariage dans cette vue.</div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((m) => {
            const w = asWedding(m);
            const prep = prepProgress(w);
            const risk = isRisk(m);
            const diaspora = m.city === 'diasp';
            const couple = `${m.fullName.split(' ')[0]}${m.partnerName ? ' & ' + m.partnerName.split(' ')[0] : ''}`;
            const init = (m.fullName[0] ?? '') + (m.partnerName[0] ?? '');
            const cer = ceremonyList(w) || '—';
            return (
              <article key={m.id} className="overflow-hidden rounded-2xl bg-paper shadow-card ring-1 ring-ink/5 transition hover:-translate-y-0.5 hover:shadow-glow">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-bordeaux to-gold-400 font-display text-base text-paper">{init.toUpperCase()}</div>
                      <div className="min-w-0">
                        <div className="truncate font-display text-lg leading-tight text-royal-900">{couple}</div>
                        <div className="truncate text-[12px] text-ink/55">{cityLabel(w)}</div>
                      </div>
                    </div>
                    {risk ? (
                      <span className="rounded-full bg-bordeaux/10 px-2 py-0.5 text-[11px] font-medium text-bordeaux">⚠ À risque</span>
                    ) : diaspora ? (
                      <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-[11px] font-medium text-gold-600">✈ Diaspora</span>
                    ) : (
                      <span className="rounded-full bg-royal-50 px-2 py-0.5 text-[11px] font-medium text-royal-700">● En cours</span>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-bone/60 p-2.5">
                      <div className="font-display text-base text-royal-900">{weddingDateLabel(w).replace(/ \d{4}$/, '')}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">{countdownLabel(w)}</div>
                    </div>
                    <div className="rounded-xl bg-bone/60 p-2.5">
                      <div className="font-display text-base text-royal-900">{m.budgetSkip || !m.budget ? '—' : fmtCompact(m.budget) + ' F'}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-ink/55">budget</div>
                    </div>
                    <div className="rounded-xl bg-bone/60 p-2.5">
                      <div className="truncate font-display text-base text-royal-900">{cer.split(' · ').length}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-ink/55">cérém.</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between font-mono text-[11px] text-ink/55">
                      <span>Préparatifs</span>
                      <span className={prep < 30 ? 'text-bordeaux' : 'text-royal-700'}>{prep}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bone">
                      <div className="h-full rounded-full bg-gradient-to-r from-royal-700 to-gold-400" style={{ width: prep + '%' }} />
                    </div>
                  </div>
                  <Link href={`/admin/mariages/${m.id}`} className="mt-4 block rounded-full bg-royal-700 py-2 text-center text-[12px] font-medium text-gold-50 transition hover:bg-royal-800">Voir le détail</Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default function AdminMariagesPage() {
  const { data, loading } = useApi<MembersResponse>('/api/admin/members');
  return (
    <AdminShell active="mariages" breadcrumb="Mariages" search="Couple, ville…">
      {loading && !data ? (
        <div className="grid place-items-center py-32">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
        </div>
      ) : data ? (
        <Content data={data} />
      ) : (
        <p className="text-sm text-ink/55">Impossible de charger les mariages.</p>
      )}
    </AdminShell>
  );
}
