'use client';

// SamaMariage — Console admin · Membres (mariées) — /admin/membres.
// Port de admin-membres.html, branché sur GET /api/admin/members (réel).

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useApi } from '@/lib/useApi';
import AdminShell from '@/components/admin/AdminShell';
import { useToast } from '@/contexts/ToastContext';
import { type Wedding, weddingDateLabel, countdownLabel, cityLabel, prepProgress } from '@/lib/wedding';

export const dynamic = 'force-static';

interface Member extends Omit<Wedding, 'phoneCountry' | 'phone' | 'partnerPronouns' | 'ceremonyDates' | 'fabric' | 'inspirationSources' | 'toAvoid' | 'updatedAt'> {
  email: string;
  accountStatus: string;
  since: string;
}
interface MembersResponse {
  ok: boolean;
  members: Member[];
  stats: { total: number; weddings: number; diaspora: number; onboardingDone: number };
}

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 86400) return "aujourd'hui";
  const days = Math.floor(d / 86400);
  if (days < 30) return `il y a ${days} j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  return `il y a ${Math.floor(months / 12)} an${months >= 24 ? 's' : ''}`;
}

function asWedding(m: Member): Wedding {
  return m as unknown as Wedding;
}

function Kpi({ label, value, sub, tone = 'text-royal-900', subTone = 'text-ink/55' }: { label: string; value: string; sub: string; tone?: string; subTone?: string }) {
  return (
    <div className="rounded-2xl bg-paper p-4 shadow-card ring-1 ring-ink/5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">{label}</div>
      <div className={'mt-2 font-display text-3xl ' + tone}>{value}</div>
      <div className={'mt-1 text-[12px] ' + subTone}>{sub}</div>
    </div>
  );
}

function Content({ data }: { data: MembersResponse }) {
  const { toast } = useToast();
  const [seg, setSeg] = useState<'all' | 'diaspora'>('all');
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.members.filter((m) => {
      if (seg === 'diaspora' && m.city !== 'diasp') return false;
      if (needle) {
        const hay = `${m.fullName} ${cityLabel(asWedding(m))}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [data.members, seg, q]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Communauté</div>
          <h1 className="mt-2 font-display text-3xl leading-tight text-royal-900 sm:text-4xl">
            Les <em className="not-italic gold-shine">mariées</em> de Sama.
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-ink/65">
            {data.stats.weddings} futures mariées pilotent leur mariage ici. Suis leur progression et leur activité.
          </p>
        </div>
        <button
          onClick={() => toast('Export CSV — bientôt 📄', 'info')}
          className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-3 text-[13px] font-medium text-royal-900 shadow-card ring-1 ring-ink/10 transition hover:bg-bone"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
          Exporter CSV
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total comptes" value={String(data.stats.total)} sub={`${data.stats.weddings} mariages créés`} />
        <Kpi label="Mariages" value={String(data.stats.weddings)} sub="profils complétés" />
        <Kpi label="Diaspora" value={String(data.stats.diaspora)} sub="pilotage à distance" tone="text-bordeaux" />
        <Kpi
          label="Onboarding"
          value={data.stats.weddings ? `${Math.round((data.stats.onboardingDone / data.stats.weddings) * 100)}%` : '—'}
          sub="profils finalisés"
          tone="text-gold-600"
          subTone="text-royal-700"
        />
      </section>

      <section className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-paper p-1 ring-1 ring-ink/8">
          {([['all', 'Toutes'], ['diaspora', 'Diaspora']] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setSeg(v)}
              className={'rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition ' + (seg === v ? 'bg-royal-700 text-gold-50' : 'text-ink/60 hover:text-royal-800')}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="ml-auto flex w-full items-center gap-2 rounded-full bg-paper px-3 py-2 ring-1 ring-ink/8 sm:w-64">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink/50" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Nom, ville…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink/35" />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-paper shadow-card ring-1 ring-ink/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-ink/8 text-left font-mono text-[10px] uppercase tracking-widest text-ink/45">
                <th className="px-5 py-3 font-medium">Mariée</th>
                <th className="px-3 py-3 font-medium">Date du mariage</th>
                <th className="px-3 py-3 font-medium">Ville</th>
                <th className="px-3 py-3 font-medium">Préparatifs</th>
                <th className="px-3 py-3 font-medium">Compte</th>
                <th className="px-5 py-3 text-right font-medium">Inscrite</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => {
                const w = asWedding(m);
                const prep = prepProgress(w);
                const init = m.fullName.split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <tr key={m.id} className="border-b border-ink/5 transition last:border-0 hover:bg-bone/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-bordeaux via-gold-400 to-royal-700 font-display text-xs text-paper">{init}</div>
                        <Link href={`/admin/membres/${m.id}`} className="font-medium text-royal-900 hover:text-royal-700 hover:underline">{m.fullName}</Link>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-royal-900">{weddingDateLabel(w)}</span> <span className="font-mono text-[11px] text-bordeaux">{countdownLabel(w)}</span>
                    </td>
                    <td className="px-3 py-3 text-ink/70">
                      {cityLabel(w)}
                      {m.city === 'diasp' && <span className="ml-1.5 rounded-full bg-bordeaux/10 px-2 py-0.5 text-[10px] font-medium text-bordeaux">Diaspora</span>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-bone">
                          <div className="h-full rounded-full bg-gradient-to-r from-royal-700 to-gold-400" style={{ width: prep + '%' }} />
                        </div>
                        <span className="font-mono text-[11px] text-ink/60">{prep}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {m.accountStatus === 'ACTIVE' ? (
                        <span className="rounded-full bg-royal-50 px-2 py-0.5 text-[11px] font-medium text-royal-700">● Actif</span>
                      ) : (
                        <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink/60">{m.accountStatus}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[12px] text-ink/55">{timeAgo(m.since)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {list.length === 0 && <div className="p-10 text-center text-[14px] text-ink/55">Aucun membre ne correspond.</div>}
      </section>
    </div>
  );
}

export default function AdminMembresPage() {
  const { data, loading } = useApi<MembersResponse>('/api/admin/members');
  return (
    <AdminShell active="membres" breadcrumb="Membres" search="Nom, ville…">
      {loading && !data ? (
        <div className="grid place-items-center py-32">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
        </div>
      ) : data ? (
        <Content data={data} />
      ) : (
        <p className="text-sm text-ink/55">Impossible de charger les membres.</p>
      )}
    </AdminShell>
  );
}
