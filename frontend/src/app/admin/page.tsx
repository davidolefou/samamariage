'use client';

// SamaMariage — Console admin · Vue d'ensemble (/admin).
// Port de admin-dashboard.html, branché sur GET /api/admin/overview (réel).

import { useMemo } from 'react';
import Link from 'next/link';
import { useApi } from '@/lib/useApi';
import AdminShell from '@/components/admin/AdminShell';
import { CATEGORY_LABELS, type VendorCategory } from '@/lib/vendor';
import { fmtCompact } from '@/lib/wedding';

export const dynamic = 'force-static';

interface Overview {
  ok: boolean;
  kpis: {
    members: number;
    weddings: number;
    vendorsActive: number;
    vendorsPending: number;
    grossVolume: number;
    commission: number;
    commissionPct: number;
  };
  signupSeries: { label: string; count: number }[];
  vendorsByCategory: { category: string; count: number }[];
  topVendors: { id: string; businessName: string; category: string; rating: number; reviewCount: number }[];
  activity: { type: 'wedding' | 'vendor_pending' | 'booking'; label: string; amount?: number; at: string }[];
}

const CAT_COLORS = ['#1E5631', '#722F37', '#D4A574', '#173F24', '#B98548', '#3D181C', '#A8C4AE', '#0E2916', '#E9C9CC'];

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "à l'instant";
  if (d < 3600) return `${Math.floor(d / 60)} min`;
  if (d < 86400) return `${Math.floor(d / 3600)} h`;
  return `${Math.floor(d / 86400)} j`;
}

const ACTIVITY_META: Record<Overview['activity'][number]['type'], { icon: string; tone: string }> = {
  wedding: { icon: '💍', tone: 'bg-royal-50 text-royal-700' },
  vendor_pending: { icon: '🗂️', tone: 'bg-gold-400/20 text-gold-600' },
  booking: { icon: '🤝', tone: 'bg-royal-50 text-royal-700' },
};

function Kpi({ label, value, unit, sub, subTone = 'text-royal-700' }: { label: string; value: string; unit?: string; sub: string; subTone?: string }) {
  return (
    <div className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">{label}</div>
      <div className="mt-2 font-display text-4xl text-royal-900">
        {value}
        {unit && <span className="text-lg text-ink/45"> {unit}</span>}
      </div>
      <div className={'mt-1 text-[12px] ' + subTone}>{sub}</div>
    </div>
  );
}

function Content({ data }: { data: Overview }) {
  const k = data.kpis;
  const chartMax = useMemo(() => Math.max(1, ...data.signupSeries.map((s) => s.count)), [data.signupSeries]);
  const catMax = useMemo(() => Math.max(1, ...data.vendorsByCategory.map((c) => c.count)), [data.vendorsByCategory]);

  function activityLabel(a: Overview['activity'][number]): string {
    if (a.type === 'wedding') return `${a.label} a créé son espace`;
    if (a.type === 'vendor_pending') return `${a.label} a soumis un dossier`;
    return `${a.label} a réservé un prestataire${a.amount ? ` · ${fmtCompact(a.amount)} F` : ''}`;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Console admin</div>
          <h1 className="mt-2 font-display text-3xl leading-tight text-royal-900 sm:text-4xl">
            Bonjour, <em className="not-italic gold-shine">Sama</em>.
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-ink/65">
            Le pouls de la plateforme aujourd&apos;hui. {k.vendorsPending} dossier{k.vendorsPending > 1 ? 's' : ''} prestataire en attente de validation.
          </p>
        </div>
        <Link
          href="/admin/validation"
          className="inline-flex items-center gap-2 rounded-full bg-bordeaux px-5 py-3 text-[13px] font-medium text-gold-50 shadow-card transition hover:bg-bordeaux-900"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 12l2 2 4-4" /><path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6z" /></svg>
          {k.vendorsPending} à valider
        </Link>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Volume transactions" value={fmtCompact(k.grossVolume)} unit="F" sub="devis acceptés (cumulé)" subTone="text-ink/55" />
        <Kpi label="Mariées inscrites" value={String(k.weddings)} sub={`${k.members} comptes au total`} subTone="text-ink/55" />
        <Kpi label="Prestataires actifs" value={String(k.vendorsActive)} sub={`${k.vendorsPending} en validation`} />
        <Kpi label="Commissions Sama" value={fmtCompact(k.commission)} unit="F" sub={`≈ ${k.commissionPct}% du volume`} subTone="text-ink/55" />
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          {/* Croissance */}
          <section className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5">
            <div className="flex items-end justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">Croissance</div>
                <h2 className="mt-1 font-display text-2xl text-royal-900">Inscriptions mariées</h2>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl text-royal-900">+{data.signupSeries.at(-1)?.count ?? 0}</div>
                <div className="font-mono text-[11px] text-ink/50">ce mois</div>
              </div>
            </div>
            <div className="mt-6 flex h-44 items-end justify-between gap-2">
              {data.signupSeries.map((s) => (
                <div key={s.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="font-mono text-[10px] text-ink/50">{s.count}</div>
                  <div
                    className="w-full rounded-t-md transition-[height] duration-700"
                    style={{ height: `${Math.round((s.count / chartMax) * 140)}px`, background: 'linear-gradient(180deg,#1E5631,#2f7a46)' }}
                  />
                  <div className="font-mono text-[10px] uppercase tracking-widest text-ink/45">{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Catégories */}
          <section className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl text-royal-900">Prestataires par catégorie</h2>
              <Link href="/admin/prestataires" className="text-[12px] font-medium text-royal-700 hover:text-royal-900">Gérer →</Link>
            </div>
            <div className="mt-4 space-y-3">
              {data.vendorsByCategory.length === 0 ? (
                <p className="text-sm text-ink/55">Aucun prestataire publié pour l&apos;instant.</p>
              ) : (
                data.vendorsByCategory.map((c, i) => (
                  <div key={c.category} className="flex items-center gap-3">
                    <div className="w-36 shrink-0 text-[13px] text-ink/75">{CATEGORY_LABELS[c.category as VendorCategory] ?? c.category}</div>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-bone">
                      <div style={{ width: `${Math.round((c.count / catMax) * 100)}%`, height: '100%', background: CAT_COLORS[i % CAT_COLORS.length], borderRadius: 99 }} />
                    </div>
                    <div className="w-10 text-right font-mono text-[12px] text-royal-900">{c.count}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Colonne droite */}
        <div className="space-y-5">
          <section className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">En direct</div>
                <h2 className="mt-0.5 font-display text-xl text-royal-900">Activité récente</h2>
              </div>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-royal-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-royal-700 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-royal-700" />
                </span>
                live
              </span>
            </div>
            <ul className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {data.activity.length === 0 ? (
                <li className="text-sm text-ink/55">Pas encore d&apos;activité.</li>
              ) : (
                data.activity.map((a, i) => {
                  const m = ACTIVITY_META[a.type];
                  return (
                    <li key={i} className="flex gap-3">
                      <span className={'grid h-9 w-9 shrink-0 place-items-center rounded-xl text-base ' + m.tone}>{m.icon}</span>
                      <div className="min-w-0 flex-1 border-b border-ink/5 pb-3">
                        <div className="text-[13px] leading-snug text-ink/80">{activityLabel(a)}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-ink/40">il y a {timeAgo(a.at)}</div>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          <section className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5">
            <h2 className="font-display text-xl text-royal-900">Top prestataires</h2>
            <div className="mt-3 space-y-3">
              {data.topVendors.length === 0 ? (
                <p className="text-sm text-ink/55">Aucun prestataire noté.</p>
              ) : (
                data.topVendors.map((v) => (
                  <div key={v.id} className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-royal-700 to-gold-400 font-display text-sm text-paper">
                      {v.businessName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-royal-900">{v.businessName}</div>
                      <div className="text-[11px] text-ink/55">{CATEGORY_LABELS[v.category as VendorCategory] ?? v.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[12px] text-royal-900">★ {v.rating.toFixed(1)}</div>
                      <div className="font-mono text-[10px] text-ink/45">{v.reviewCount} avis</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const { data, loading } = useApi<Overview>('/api/admin/overview');
  return (
    <AdminShell active="overview" breadcrumb="Vue d'ensemble" badges={data ? { validation: data.kpis.vendorsPending } : {}}>
      {loading && !data ? (
        <div className="grid place-items-center py-32">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
        </div>
      ) : data ? (
        <Content data={data} />
      ) : (
        <p className="text-sm text-ink/55">Impossible de charger les données.</p>
      )}
    </AdminShell>
  );
}
