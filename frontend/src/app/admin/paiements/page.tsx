'use client';

// SamaMariage — Console admin · Paiements & Ndawtal — /admin/paiements.
// Port de admin-paiements.html, branché sur GET /api/admin/payments (réel).

import { useMemo, useState } from 'react';
import { useApi } from '@/lib/useApi';
import AdminShell from '@/components/admin/AdminShell';
import { fmtCompact, fmtFCFA } from '@/lib/wedding';

export const dynamic = 'force-static';

interface PaymentsResponse {
  ok: boolean;
  kpis: { gross: number; commission: number; commissionPct: number; netToVendors: number; ndawtalTotal: number; weddings: number; pendingPayouts: number };
  transactions: { dir: 'in'; label: string; method: string; amount: number; at: string }[];
  payouts: { vendorId: string; businessName: string; net: number }[];
}

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 3600) return `${Math.max(1, Math.floor(d / 60))} min`;
  if (d < 86400) return `${Math.floor(d / 3600)} h`;
  return `${Math.floor(d / 86400)} j`;
}

function Kpi({ label, value, unit, sub, dark = false }: { label: string; value: string; unit?: string; sub: string; dark?: boolean }) {
  return (
    <div className={'rounded-2xl p-5 shadow-card ring-1 ' + (dark ? 'bg-gradient-to-br from-bordeaux to-bordeaux-900 text-gold-50 ring-bordeaux-900/30' : 'bg-paper ring-ink/5')}>
      <div className={'font-mono text-[10px] uppercase tracking-widest ' + (dark ? 'text-gold-100/70' : 'text-ink/50')}>{label}</div>
      <div className={'mt-2 font-display text-3xl ' + (dark ? '' : 'text-royal-900')}>{value}{unit && <span className={'text-base ' + (dark ? 'text-gold-100/60' : 'text-ink/45')}> {unit}</span>}</div>
      <div className={'mt-1 text-[12px] ' + (dark ? 'text-gold-100/80' : 'text-ink/55')}>{sub}</div>
    </div>
  );
}

function Content({ data }: { data: PaymentsResponse }) {
  const k = data.kpis;
  const [f, setF] = useState<'all' | 'in' | 'out'>('all');
  const tx = useMemo(() => data.transactions.filter((t) => f === 'all' || t.dir === f), [data.transactions, f]);

  return (
    <div className="space-y-6">
      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Finances</div>
        <h1 className="mt-2 font-display text-3xl leading-tight text-royal-900 sm:text-4xl">
          Paiements & <em className="not-italic gold-shine">Ndawtal</em>.
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink/65">Tout l&apos;argent qui transite par Sama : réservations, commissions, versements aux pros et ndawtal collecté.</p>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Volume total" value={fmtCompact(k.gross)} unit="F" sub="devis acceptés" />
        <Kpi label="Commissions Sama" value={fmtCompact(k.commission)} unit="F" sub={`${k.commissionPct}% du volume`} />
        <Kpi label="À reverser aux pros" value={fmtCompact(k.netToVendors)} unit="F" sub={`${k.pendingPayouts} prestataires`} dark />
        <Kpi label="Ndawtal collecté" value={fmtCompact(k.ndawtalTotal)} unit="F" sub={`${k.weddings} mariages`} />
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="overflow-hidden rounded-2xl bg-paper shadow-card ring-1 ring-ink/5">
          <div className="flex items-center justify-between border-b border-ink/8 px-5 py-4">
            <h2 className="font-display text-xl text-royal-900">Transactions récentes</h2>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-bone p-1 ring-1 ring-ink/8">
              {([['all', 'Toutes'], ['in', 'Entrées'], ['out', 'Sorties']] as const).map(([v, l]) => (
                <button key={v} onClick={() => setF(v)} className={'rounded-full px-3 py-1 text-[11.5px] font-medium transition ' + (f === v ? 'bg-royal-700 text-gold-50' : 'text-ink/60 hover:text-royal-800')}>{l}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-ink/8 text-left font-mono text-[10px] uppercase tracking-widest text-ink/45">
                  <th className="px-5 py-3 font-medium">Opération</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Quand</th>
                  <th className="px-5 py-3 text-right font-medium">Montant</th>
                </tr>
              </thead>
              <tbody>
                {tx.map((t, i) => (
                  <tr key={i} className="border-b border-ink/5 transition last:border-0 hover:bg-bone/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-royal-50 text-base">{t.method === 'Ndawtal' ? '🪙' : '💳'}</span>
                        <span className="text-royal-900">{t.label}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3"><span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] text-ink/70">{t.method}</span></td>
                    <td className="px-3 py-3 font-mono text-[12px] text-ink/55">il y a {timeAgo(t.at)}</td>
                    <td className="px-5 py-3 text-right font-mono text-royal-700">+{fmtFCFA(t.amount)} F</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {tx.length === 0 && <div className="p-10 text-center text-[14px] text-ink/55">Aucune transaction.</div>}
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-royal-900">Versements à effectuer</h2>
              <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-[11px] font-medium text-gold-600">{data.payouts.length}</span>
            </div>
            <div className="mt-3 space-y-3">
              {data.payouts.length === 0 ? (
                <p className="text-sm text-ink/55">Aucun versement en attente.</p>
              ) : (
                data.payouts.map((p) => (
                  <div key={p.vendorId} className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-royal-700 to-gold-400 font-display text-xs text-paper">{p.businessName.slice(0, 2).toUpperCase()}</div>
                    <div className="min-w-0 flex-1 truncate text-sm font-medium text-royal-900">{p.businessName}</div>
                    <div className="font-mono text-[13px] text-bordeaux">{fmtFCFA(p.net)} F</div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5">
            <h2 className="font-display text-xl text-royal-900">Commission Sama</h2>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-3xl text-royal-900">{k.commissionPct}%</span>
              <span className="text-[12px] text-ink/55">par réservation</span>
            </div>
            <p className="mt-2 text-[13px] text-ink/60">Prélevée sur chaque devis accepté. Réglable via <span className="font-mono text-bordeaux">VENDOR_COMMISSION_PCT</span>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AdminPaiementsPage() {
  const { data, loading } = useApi<PaymentsResponse>('/api/admin/payments');
  return (
    <AdminShell active="paiements" breadcrumb="Paiements & Ndawtal" search="">
      {loading && !data ? (
        <div className="grid place-items-center py-32">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
        </div>
      ) : data ? (
        <Content data={data} />
      ) : (
        <p className="text-sm text-ink/55">Impossible de charger les finances.</p>
      )}
    </AdminShell>
  );
}
