'use client';

// SamaMariage — Console admin · Fiche mariée — /admin/membres/[id].
// Port de admin-membre-detail.html, branché sur GET /api/admin/members/[id].

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApi } from '@/lib/useApi';
import AdminShell from '@/components/admin/AdminShell';
import { type Wedding, weddingDateLabel, countdownLabel, cityLabel, prepProgress } from '@/lib/wedding';
import { CATEGORY_LABELS, type VendorCategory } from '@/lib/vendor';
import { fmtCompact, fmtFCFA } from '@/lib/wedding';

export const dynamic = 'force-static';

interface DetailResponse {
  ok: boolean;
  member: Record<string, unknown> & {
    id: string;
    fullName: string;
    partnerName: string;
    email: string;
    phone: string;
    phoneCountry: string;
    accountStatus: string;
    since: string;
    city: string;
  };
  kpis: {
    budget: number;
    budgetAllocated: number;
    budgetSpent: number;
    vendorsBooked: number;
    vendorsTotal: number;
    ndawtalTotal: number;
    guestsConfirmed: number;
    guestsTotal: number;
  };
  modules: { key: string; label: string; count: number; done?: number }[];
  vendorsBooked: { coupleName: string; amount: number; businessName: string; category: string }[];
}

function Content({ data }: { data: DetailResponse }) {
  const m = data.member;
  const w = m as unknown as Wedding;
  const k = data.kpis;
  const prep = prepProgress(w);
  const init = m.fullName.split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  const diaspora = m.city === 'diasp';

  return (
    <div className="space-y-6">
      <Link href="/admin/membres" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink/60 transition hover:text-royal-800">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 4 6 8l4 4" /></svg>
        Tous les membres
      </Link>

      {/* En-tête */}
      <section className="rounded-3xl bg-paper p-5 shadow-card ring-1 ring-ink/5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-bordeaux via-gold-400 to-royal-700 font-display text-2xl text-paper shadow-card ring-2 ring-paper">{init}</div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">Mariée{diaspora ? ' · diaspora' : ''}</div>
              <h1 className="mt-0.5 font-display text-3xl leading-tight text-royal-900">{m.fullName}</h1>
              <div className="mt-0.5 text-[13px] text-ink/55">
                {m.partnerName && <>♥ {m.partnerName} · </>}
                {weddingDateLabel(w)} <span className="font-mono text-bordeaux">{countdownLabel(w)}</span> · {cityLabel(w)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { v: prep + '%', l: 'préparatifs' },
            { v: m.budget != null && !(m as { budgetSkip?: boolean }).budgetSkip ? fmtCompact(k.budget) + ' F' : '—', l: 'budget prévu' },
            { v: `${k.vendorsBooked}/${k.vendorsTotal}`, l: 'prestataires' },
            { v: fmtCompact(k.ndawtalTotal) + ' F', l: 'ndawtal' },
            { v: String(k.guestsConfirmed), l: 'invités confirmés' },
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
          {/* Modules */}
          <section className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5 sm:p-6">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl text-royal-900">Modules utilisés</h2>
              <span className="text-[12px] text-ink/55">{data.modules.filter((mm) => mm.count > 0).length}/{data.modules.length} actifs</span>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {data.modules.map((mm) => {
                const used = mm.count > 0;
                return (
                  <div key={mm.key} className={'flex items-center justify-between rounded-xl px-3.5 py-3 ring-1 ' + (used ? 'bg-royal-50/50 ring-royal-700/10' : 'bg-bone/40 ring-ink/5')}>
                    <span className={'text-sm font-medium ' + (used ? 'text-royal-900' : 'text-ink/45')}>{mm.label}</span>
                    <span className={'font-mono text-[12px] ' + (used ? 'text-royal-700' : 'text-ink/40')}>
                      {used ? (mm.done != null ? `${mm.done}/${mm.count}` : mm.count) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Prestataires réservés */}
          <section className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5 sm:p-6">
            <h2 className="font-display text-2xl text-royal-900">Prestataires réservés</h2>
            <div className="mt-4 space-y-2.5">
              {data.vendorsBooked.length === 0 ? (
                <p className="text-sm text-ink/55">Aucune réservation confirmée pour l&apos;instant.</p>
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
          {/* Contact */}
          <section className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">Contact & infos</div>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-ink/55">Email</dt><dd className="truncate text-royal-900">{m.email || '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink/55">Téléphone</dt><dd className="text-royal-900">{m.phone ? `${m.phoneCountry} ${m.phone}` : '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink/55">Ville</dt><dd className="text-royal-900">{cityLabel(w)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink/55">Compte</dt><dd className="text-royal-900">{m.accountStatus === 'ACTIVE' ? 'Actif' : m.accountStatus}</dd></div>
            </dl>
          </section>

          {/* Engagement */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-royal-800 to-royal-900 p-5 text-gold-50 shadow-card ring-1 ring-royal-900/30">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold-400/15 blur-2xl" />
            <div className="relative">
              <div className="font-mono text-[10px] uppercase tracking-widest text-gold-400/90">Engagement</div>
              <div className="mt-2 font-display text-2xl">{prep >= 50 ? 'Mariée engagée' : prep > 0 ? 'En cours d’organisation' : 'Vient de commencer'}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-gold-100/85">
                Préparatifs à {prep}% · {k.vendorsBooked} prestataire{k.vendorsBooked > 1 ? 's' : ''} réservé{k.vendorsBooked > 1 ? 's' : ''} · {k.guestsConfirmed} invité{k.guestsConfirmed > 1 ? 's' : ''} confirmé{k.guestsConfirmed > 1 ? 's' : ''}.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AdminMembreDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data, loading } = useApi<DetailResponse>(`/api/admin/members/${id}`, { skip: !id });
  return (
    <AdminShell active="membres" breadcrumb="Fiche mariée" search="">
      {loading && !data ? (
        <div className="grid place-items-center py-32">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
        </div>
      ) : data ? (
        <Content data={data} />
      ) : (
        <p className="text-sm text-ink/55">Mariée introuvable.</p>
      )}
    </AdminShell>
  );
}
