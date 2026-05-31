'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/AuthContext';
import { useApi, invalidateCache } from '@/lib/useApi';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import ProShell from '@/components/pro/ProShell';
import { type VendorResponse, CATEGORY_LABELS } from '@/lib/vendor';
import { type QuoteListResponse, type QuoteRequest, type QuoteStatus, QUOTE_STATUS_LABELS } from '@/lib/quotes';
import { fmtFCFA, fmtDate } from '@/lib/ndawtal';

export const dynamic = 'force-static';

const TABS: { key: QuoteStatus; label: string }[] = [
  { key: 'NEW', label: 'Nouvelles' },
  { key: 'QUOTED', label: 'Devis envoyé' },
  { key: 'ACCEPTED', label: 'Acceptées' },
  { key: 'DECLINED', label: 'Refusées' },
];

function Spinner() {
  return (
    <main className="grid min-h-screen place-items-center bg-bone">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
    </main>
  );
}

function StatusPill({ status }: { status: QuoteStatus }) {
  const cls: Record<QuoteStatus, string> = {
    NEW: 'bg-gold-400/20 text-gold-600',
    QUOTED: 'bg-bordeaux/10 text-bordeaux',
    ACCEPTED: 'bg-royal-700/10 text-royal-800',
    DECLINED: 'bg-ink/5 text-ink/50',
    ARCHIVED: 'bg-ink/5 text-ink/50',
  };
  return <span className={'rounded-full px-2.5 py-1 text-[11px] font-medium ' + cls[status]}>{QUOTE_STATUS_LABELS[status]}</span>;
}

function QuoteModal({
  request, onClose, onSent,
}: {
  request: QuoteRequest;
  onClose: () => void;
  onSent: () => void;
}) {
  const { toast } = useToast();
  const seed = request.budget || 0;
  const [lines, setLines] = useState<{ label: string; amount: string }[]>([
    { label: 'Prestation principale', amount: String(Math.round(seed * 0.7)) },
    { label: 'Options & extras', amount: String(Math.round(seed * 0.3)) },
  ]);
  const [message, setMessage] = useState(
    `Bonjour ! Merci pour votre confiance. Voici ma proposition pour votre mariage. Je reste disponible pour en discuter.`,
  );
  const [sending, setSending] = useState(false);

  const total = lines.reduce((s, l) => s + (parseInt(l.amount.replace(/\D/g, ''), 10) || 0), 0);
  const deposit = Math.round(total * 0.3);

  function setLine(i: number, patch: Partial<{ label: string; amount: string }>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function send() {
    if (total <= 0) {
      toast('Indique un montant', 'error');
      return;
    }
    setSending(true);
    try {
      await api(`/api/pro/demandes/${request.id}`, {
        method: 'PATCH',
        body: { action: 'quote', quoteAmount: total, quoteMessage: message.trim() },
      });
      toast(`Devis envoyé à ${request.coupleName || 'la mariée'} 📨`, 'success');
      onSent();
    } catch {
      toast('Envoi impossible', 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[55] grid place-items-start overflow-y-auto" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-royal-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-auto mt-[5vh] w-[min(560px,94vw)] rounded-3xl bg-paper p-6 shadow-glow ring-1 ring-ink/10 sm:p-7">
        <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">Nouveau devis</div>
        <h2 className="mt-1 font-display text-2xl text-royal-900">Devis pour {request.coupleName || 'la mariée'}</h2>
        <div className="mt-0.5 text-[12px] text-ink/55">{[request.detail, request.eventDate ? fmtDate(request.eventDate) : '', request.city].filter(Boolean).join(' · ')}</div>

        <div className="mt-5 space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={l.label} onChange={(e) => setLine(i, { label: e.target.value })} placeholder="Prestation" className="h-11 flex-1 rounded-xl bg-bone px-3 text-sm outline-none ring-1 ring-ink/10 focus:ring-royal-700" />
              <input value={l.amount} onChange={(e) => setLine(i, { amount: e.target.value.replace(/\D/g, '') })} inputMode="numeric" placeholder="0" className="h-11 w-32 rounded-xl bg-bone px-3 text-right font-mono text-sm outline-none ring-1 ring-ink/10 focus:ring-royal-700" />
              <button onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))} aria-label="Retirer" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-bone text-ink/50 hover:text-bordeaux">
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg>
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => setLines((ls) => [...ls, { label: '', amount: '0' }])} className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-royal-700 hover:text-royal-900">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10" /></svg> Ajouter une ligne
        </button>

        <div className="mt-5 rounded-2xl bg-bone/60 p-4 ring-1 ring-ink/5">
          <div className="flex items-center justify-between"><span className="text-[13px] text-ink/65">Total</span><span className="font-display text-2xl text-royal-900">{fmtFCFA(total)} F</span></div>
          <div className="mt-2 flex items-center justify-between text-[12px]"><span className="text-ink/55">Acompte (30%)</span><span className="font-mono text-bordeaux">{fmtFCFA(deposit)} F</span></div>
        </div>

        <label className="mt-4 block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/55">Message à la mariée</span>
          <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1.5 w-full rounded-xl bg-bone px-3 py-2.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-royal-700" />
        </label>

        <div className="mt-5 flex items-center gap-2">
          <button onClick={send} disabled={sending} className="flex-1 rounded-full bg-royal-700 py-3 text-[14px] font-medium text-gold-50 transition hover:bg-royal-800 disabled:opacity-60">
            {sending ? 'Envoi…' : 'Envoyer le devis'}
          </button>
          <button onClick={onClose} className="rounded-full bg-paper px-5 py-3 text-[14px] font-medium text-ink/65 ring-1 ring-ink/10 transition hover:bg-bone">Annuler</button>
        </div>
      </div>
    </div>
  );
}

function DemandesContent() {
  const { toast } = useToast();
  const { data, loading, refresh } = useApi<QuoteListResponse>('/api/pro/demandes');
  const [tab, setTab] = useState<QuoteStatus>('NEW');
  const [quoting, setQuoting] = useState<QuoteRequest | null>(null);

  const requests = useMemo(() => data?.requests ?? [], [data]);
  const stats = data?.stats;
  const filtered = useMemo(() => requests.filter((r) => r.status === tab), [requests, tab]);

  function reload() {
    invalidateCache('/api/pro/demandes');
    void refresh();
  }

  async function decline(id: string) {
    try {
      await api(`/api/pro/demandes/${id}`, { method: 'PATCH', body: { action: 'decline' } });
      toast('Demande déclinée', 'info');
      reload();
    } catch {
      toast('Action impossible', 'error');
    }
  }

  const count = (k: QuoteStatus) =>
    k === 'NEW' ? stats?.new : k === 'QUOTED' ? stats?.quoted : k === 'ACCEPTED' ? stats?.accepted : stats?.declined;

  return (
    <div className="space-y-6">
      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Boîte de réception</div>
        <h1 className="mt-2 font-display text-3xl text-royal-900 sm:text-4xl">Demandes de <em className="not-italic gold-shine">devis</em></h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink/65">Répondez vite pour rester en tête. Chaque devis envoyé via Sama est suivi et sécurisé.</p>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const c = count(t.key);
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={'rounded-full px-4 py-2 text-[13px] font-medium transition ' + (tab === t.key ? 'bg-royal-700 text-gold-50' : 'bg-paper text-ink/60 ring-1 ring-ink/5 hover:text-royal-900')}
            >
              {t.label}{c ? <span className="ml-1 font-mono">{c}</span> : null}
            </button>
          );
        })}
      </div>

      {loading && requests.length === 0 ? (
        <div className="grid place-items-center py-16"><span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-paper p-10 text-center ring-1 ring-ink/5">
          <p className="font-display text-lg text-royal-900">Aucune demande dans cet onglet</p>
          <p className="mt-1 text-sm text-ink/55">Les demandes des mariées arriveront ici dès que votre vitrine est en ligne.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((r) => (
            <article key={r.id} className="rounded-2xl bg-paper p-4 shadow-card ring-1 ring-ink/5">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-royal-700 to-gold-400 font-display text-base text-white">
                  {(r.coupleName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-display text-lg leading-tight text-royal-900">{r.coupleName || 'Mariée'}</div>
                    <StatusPill status={r.status} />
                  </div>
                  {r.detail && <div className="mt-0.5 text-[13px] text-ink/65">{r.detail}</div>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px] text-ink/55">
                    {r.eventDate && <span>📅 {fmtDate(r.eventDate)}</span>}
                    {r.city && <span>📍 {r.city}</span>}
                    {r.guests > 0 && <span>👥 {r.guests}</span>}
                    {r.budget > 0 && <span className="text-royal-900">budget {fmtFCFA(r.budget)} F</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {r.status === 'NEW' && (
                      <>
                        <button onClick={() => setQuoting(r)} className="rounded-full bg-royal-700 px-4 py-1.5 text-[12px] font-medium text-gold-50 transition hover:bg-royal-800">Envoyer un devis</button>
                        <button onClick={() => decline(r.id)} className="rounded-full bg-paper px-3.5 py-1.5 text-[12px] font-medium text-ink/65 ring-1 ring-ink/10 transition hover:bg-bone">Décliner</button>
                      </>
                    )}
                    {r.status === 'QUOTED' && r.quoteAmount != null && (
                      <span className="text-[12px] text-ink/55">Devis : <span className="font-mono text-royal-900">{fmtFCFA(r.quoteAmount)} F</span></span>
                    )}
                    {r.status === 'ACCEPTED' && r.quoteAmount != null && (
                      <span className="text-[12px] text-ink/55">Réservé : <span className="font-mono text-royal-900">{fmtFCFA(r.quoteAmount)} F</span></span>
                    )}
                    {r.status === 'DECLINED' && <span className="text-[12px] text-ink/45">Demande clôturée</span>}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {quoting && <QuoteModal request={quoting} onClose={() => setQuoting(null)} onSent={() => { setQuoting(null); reload(); }} />}
    </div>
  );
}

export default function ProDemandesPage() {
  const user = useUser('/pro/login');
  const router = useRouter();
  const { data: vendorData, loading: vendorLoading, error: vendorError } = useApi<VendorResponse>('/api/vendor', { skip: !user });

  useEffect(() => {
    if (user && !vendorLoading && vendorData && vendorData.vendor === null) router.push('/pro/onboarding');
  }, [user, vendorLoading, vendorData, router]);

  if (!user || vendorLoading || !vendorData) return <Spinner />;
  if (vendorError) return <Spinner />;
  if (!vendorData.vendor) return <Spinner />;
  const v = vendorData.vendor;

  return (
    <ProShell breadcrumb="Demandes de devis" vendor={{ businessName: v.businessName, categoryLabel: CATEGORY_LABELS[v.category], verified: v.verified }}>
      <DemandesContent />
    </ProShell>
  );
}
