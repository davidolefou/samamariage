'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/AuthContext';
import { useApi } from '@/lib/useApi';
import ProShell from '@/components/pro/ProShell';
import { type VendorResponse, CATEGORY_LABELS } from '@/lib/vendor';
import { fmtFCFA, fmtDate } from '@/lib/ndawtal';

export const dynamic = 'force-static';

interface Tx { id: string; coupleName: string; status: 'ACCEPTED' | 'QUOTED'; date: string; gross: number; commission: number; net: number }
interface PaiementsResponse {
  ok: boolean;
  commissionPct: number;
  grossTotal: number;
  commission: number;
  net: number;
  pendingTotal: number;
  payoutMethod: string;
  payoutAccount: string;
  transactions: Tx[];
}

function Spinner() {
  return (
    <main className="grid min-h-screen place-items-center bg-bone">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
    </main>
  );
}

const PAYOUT_LABELS: Record<string, string> = { wave: 'Wave', om: 'Orange Money', free: 'Free Money', bank: 'Virement bancaire' };

function PaiementsContent() {
  const { data, loading } = useApi<PaiementsResponse>('/api/pro/paiements');
  if (loading || !data) {
    return <div className="grid place-items-center py-16"><span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" /></div>;
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Finances</div>
        <h1 className="mt-2 font-display text-3xl text-royal-900 sm:text-4xl"><em className="not-italic gold-shine">Paiements</em></h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink/65">Vos encaissements via Sama, nets de commission. Vous êtes payé, la mariée est protégée.</p>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.2fr]">
        {/* Solde */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-royal-800 to-royal-900 p-6 text-gold-50 shadow-glow ring-1 ring-royal-900/30">
          <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-gold-400/15 blur-2xl" />
          <div className="relative">
            <div className="font-mono text-[10px] uppercase tracking-widest text-gold-100/70">Net encaissé (après {data.commissionPct}%)</div>
            <div className="mt-2 font-display text-5xl">{fmtFCFA(data.net)} <span className="text-2xl text-gold-100/70">F</span></div>
            <div className="mt-1 text-[13px] text-gold-100/75">Brut {fmtFCFA(data.grossTotal)} F · commission {fmtFCFA(data.commission)} F</div>
            <div className="mt-5 flex items-center gap-3 border-t border-gold-400/15 pt-4">
              <span className="h-8 w-8 shrink-0 rounded-lg bg-gold-400/30" />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium">{data.payoutMethod ? PAYOUT_LABELS[data.payoutMethod] ?? data.payoutMethod : 'Compte non configuré'}</div>
                <div className="text-[11px] text-gold-100/60">{data.payoutAccount || 'Ajoutez votre compte de versement'}</div>
              </div>
              <Link href="/pro/parametres" className="text-[12px] text-gold-100/80 underline hover:text-gold-50">Changer</Link>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <div className="space-y-5">
          <section className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-paper p-4 shadow-card ring-1 ring-ink/5"><div className="font-mono text-[9px] uppercase tracking-widest text-ink/50">Encaissé (net)</div><div className="mt-1 font-display text-2xl text-royal-900">{fmtFCFA(data.net)}</div></div>
            <div className="rounded-2xl bg-paper p-4 shadow-card ring-1 ring-ink/5"><div className="font-mono text-[9px] uppercase tracking-widest text-ink/50">En attente</div><div className="mt-1 font-display text-2xl text-bordeaux">{fmtFCFA(data.pendingTotal)}</div></div>
            <div className="rounded-2xl bg-paper p-4 shadow-card ring-1 ring-ink/5"><div className="font-mono text-[9px] uppercase tracking-widest text-ink/50">Commission</div><div className="mt-1 font-display text-2xl text-royal-900">{data.commissionPct}%</div></div>
          </section>
          <section className="rounded-3xl bg-paper p-5 text-[13px] leading-relaxed text-ink/65 shadow-card ring-1 ring-ink/5">
            🔒 Les acomptes et soldes sont sécurisés par Sama : la mariée paie, vous êtes payé après la prestation. Les versements automatiques arrivent prochainement.
          </section>
        </div>
      </div>

      {/* Transactions */}
      <section>
        <h2 className="font-display text-2xl text-royal-900">Transactions</h2>
        <div className="mt-3 divide-y divide-ink/5 overflow-hidden rounded-3xl bg-paper shadow-card ring-1 ring-ink/5">
          {data.transactions.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-ink/55">Aucune transaction pour l’instant. Vos devis acceptés apparaîtront ici.</div>
          ) : (
            data.transactions.map((x) => {
              const accepted = x.status === 'ACCEPTED';
              return (
                <div key={x.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                  <div className={'grid h-10 w-10 shrink-0 place-items-center rounded-xl ' + (accepted ? 'bg-royal-50 text-royal-700' : 'bg-gold-400/20 text-gold-600')}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 19V5M5 12l7 7 7-7" /></svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium text-royal-900">{accepted ? 'Encaissé' : 'Devis en attente'} · {x.coupleName || 'Mariée'}</div>
                    <div className="truncate text-[12px] text-ink/55">{fmtDate(x.date)}</div>
                  </div>
                  <div className="text-right">
                    <div className={'font-mono text-[14px] ' + (accepted ? 'text-royal-700' : 'text-ink/55')}>+{fmtFCFA(x.gross)} F</div>
                    <div className="font-mono text-[11px] text-ink/45">net : {fmtFCFA(x.net)} F</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

export default function ProPaiementsPage() {
  const user = useUser('/pro/login');
  const router = useRouter();
  const { data, loading, error } = useApi<VendorResponse>('/api/vendor', { skip: !user });

  useEffect(() => {
    if (user && !loading && data && data.vendor === null) router.push('/pro/onboarding');
  }, [user, loading, data, router]);

  if (!user || loading || !data || error || !data.vendor) return <Spinner />;
  const v = data.vendor;

  return (
    <ProShell breadcrumb="Paiements" vendor={{ businessName: v.businessName, categoryLabel: CATEGORY_LABELS[v.category], verified: v.verified }}>
      <PaiementsContent />
    </ProShell>
  );
}
