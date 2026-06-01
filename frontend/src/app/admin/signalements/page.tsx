'use client';

// SamaMariage — Console admin · Signalements — /admin/signalements.
// Port de admin-signalements.html, branché sur GET /api/admin/signalements +
// PATCH /api/admin/signalements/[id] (résoudre / classer sans suite).

import { useState } from 'react';
import { useApi, invalidateCache } from '@/lib/useApi';
import { api } from '@/lib/api';
import AdminShell from '@/components/admin/AdminShell';
import { useToast } from '@/contexts/ToastContext';

export const dynamic = 'force-static';

interface Signalement {
  id: string;
  targetType: string;
  targetLabel: string;
  severity: 'low' | 'med' | 'high';
  reason: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  outcome: string;
  reporterEmail: string | null;
  createdAt: string;
}
interface Response {
  ok: boolean;
  signalements: Signalement[];
  stats: { open: number; high: number; resolvedThisMonth: number };
}

type Tab = 'open' | 'resolved' | 'all';

const SEV: Record<string, { label: string; cls: string }> = {
  high: { label: 'Gravité haute', cls: 'bg-bordeaux/10 text-bordeaux' },
  med: { label: 'Moyenne', cls: 'bg-gold-400/20 text-gold-600' },
  low: { label: 'Faible', cls: 'bg-royal-50 text-royal-700' },
};
const TARGET_ICON: Record<string, string> = { Vendor: '🏪', Review: '⭐', User: '🚫', Message: '💬' };

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 3600) return `${Math.max(1, Math.floor(d / 60))} min`;
  if (d < 86400) return `${Math.floor(d / 3600)} h`;
  return `${Math.floor(d / 86400)} j`;
}

function Content({ data, tab, setTab, reload }: { data: Response; tab: Tab; setTab: (t: Tab) => void; reload: () => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function decide(s: Signalement, action: 'resolve' | 'dismiss', outcome?: string) {
    setBusy(s.id);
    try {
      await api(`/api/admin/signalements/${s.id}`, { method: 'PATCH', body: outcome ? { action, outcome } : { action } });
      toast(action === 'resolve' ? 'Signalement traité 🛡️' : 'Classé sans suite', action === 'resolve' ? 'success' : 'info');
      reload();
    } catch {
      toast('Action impossible', 'error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Modération · sécurité</div>
        <h1 className="mt-2 font-display text-3xl leading-tight text-royal-900 sm:text-4xl">
          Signalements à <em className="not-italic gold-shine">traiter</em>.
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink/65">Profils suspects, avis frauduleux, comportements abusifs. Garde la marketplace propre.</p>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl bg-gradient-to-br from-bordeaux to-bordeaux-900 p-4 text-gold-50 shadow-card ring-1 ring-bordeaux-900/30">
          <div className="font-mono text-[10px] uppercase tracking-widest text-gold-100/70">À traiter</div>
          <div className="mt-2 font-display text-3xl">{data.stats.open}</div>
        </div>
        <div className="rounded-2xl bg-paper p-4 shadow-card ring-1 ring-ink/5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Gravité haute</div>
          <div className="mt-2 font-display text-3xl text-bordeaux">{data.stats.high}</div>
        </div>
        <div className="rounded-2xl bg-paper p-4 shadow-card ring-1 ring-ink/5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Résolus ce mois</div>
          <div className="mt-2 font-display text-3xl text-royal-700">{data.stats.resolvedThisMonth}</div>
        </div>
        <div className="rounded-2xl bg-paper p-4 shadow-card ring-1 ring-ink/5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Total affiché</div>
          <div className="mt-2 font-display text-3xl text-royal-900">{data.signalements.length}</div>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-paper p-1 ring-1 ring-ink/8">
          {([['open', 'À traiter'], ['resolved', 'Traités'], ['all', 'Tous']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} className={'rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition ' + (tab === v ? 'bg-royal-700 text-gold-50' : 'text-ink/60 hover:text-royal-800')}>{l}</button>
          ))}
        </div>
      </section>

      {data.signalements.length === 0 ? (
        <div className="rounded-2xl bg-paper p-12 text-center shadow-card ring-1 ring-ink/5">
          <div className="text-4xl">🛡️</div>
          <h2 className="mt-2 font-display text-2xl text-royal-900">Rien à modérer</h2>
          <p className="mt-1 text-[13px] text-ink/55">La marketplace est propre.</p>
        </div>
      ) : (
        <section className="space-y-3">
          {data.signalements.map((s) => {
            const sev = SEV[s.severity] ?? SEV.med!;
            return (
              <article key={s.id} className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5">
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-bordeaux/10 text-xl">{TARGET_ICON[s.targetType] ?? '🚩'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-lg text-royal-900">{s.targetLabel || s.targetType}</span>
                        <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] text-ink/70">{s.targetType}</span>
                        <span className={'rounded-full px-2 py-0.5 text-[11px] font-medium ' + sev.cls}>{sev.label}</span>
                      </div>
                      <span className="font-mono text-[11px] text-ink/45">il y a {timeAgo(s.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 text-[13.5px] leading-snug text-ink/75">{s.reason}</p>
                    <div className="mt-2 text-[12px] text-ink/55">Signalé par <span className="text-royal-900">{s.reporterEmail ?? 'modération'}</span></div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {s.status === 'OPEN' ? (
                        <>
                          <button disabled={busy === s.id} onClick={() => decide(s, 'resolve', 'Action prise')} className="rounded-full bg-bordeaux px-4 py-1.5 text-[12px] font-medium text-gold-50 transition hover:bg-bordeaux-900 disabled:opacity-50">Traiter</button>
                          <button disabled={busy === s.id} onClick={() => decide(s, 'dismiss')} className="rounded-full bg-paper px-3 py-1.5 text-[12px] font-medium text-royal-800 ring-1 ring-royal-700/20 transition hover:bg-royal-50 disabled:opacity-50">Classer sans suite</button>
                        </>
                      ) : (
                        <span className="rounded-full bg-royal-50 px-2.5 py-1 text-[11px] font-medium text-royal-700">✓ {s.outcome || (s.status === 'DISMISSED' ? 'Classé sans suite' : 'Traité')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default function AdminSignalementsPage() {
  const [tab, setTab] = useState<Tab>('open');
  const path = `/api/admin/signalements?tab=${tab}`;
  const { data, loading, refresh } = useApi<Response>(path);
  const reload = () => {
    invalidateCache(path);
    void refresh();
  };
  return (
    <AdminShell active="signalements" breadcrumb="Signalements" search="" badges={data ? { signalements: data.stats.open } : {}}>
      {loading && !data ? (
        <div className="grid place-items-center py-32">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
        </div>
      ) : data ? (
        <Content data={data} tab={tab} setTab={setTab} reload={reload} />
      ) : (
        <p className="text-sm text-ink/55">Impossible de charger les signalements.</p>
      )}
    </AdminShell>
  );
}
