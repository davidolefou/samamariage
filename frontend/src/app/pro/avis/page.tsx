'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/AuthContext';
import { useApi, invalidateCache } from '@/lib/useApi';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import ProShell from '@/components/pro/ProShell';
import { type VendorResponse, CATEGORY_LABELS } from '@/lib/vendor';
import { type ReviewListResponse, type Review } from '@/lib/reviews';
import { fmtDate } from '@/lib/ndawtal';

export const dynamic = 'force-static';

type Filter = 'all' | '5' | 'noreply' | 'reply';

function Spinner() {
  return (
    <main className="grid min-h-screen place-items-center bg-bone">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
    </main>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="text-gold-600">
      {'★'.repeat(n)}
      <span className="text-ink/20">{'★'.repeat(5 - n)}</span>
    </span>
  );
}

function ReviewCard({ r, onReply }: { r: Review; onReply: (id: string, reply: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    setSending(true);
    await onReply(r.id, text.trim());
    setSending(false);
    setOpen(false);
    setText('');
  }

  return (
    <article className="rounded-2xl bg-paper p-4 shadow-card ring-1 ring-ink/5 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-bordeaux to-gold-400" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-medium text-royal-900">{r.weddingLabel ? r.weddingLabel.split('·')[0]?.trim() || 'Mariée' : 'Mariée'}</div>
              {r.weddingLabel && <div className="font-mono text-[11px] text-ink/50">{r.weddingLabel}</div>}
            </div>
            <div className="text-right">
              <Stars n={r.rating} />
              <div className="font-mono text-[11px] text-ink/45">{fmtDate(r.createdAt)}</div>
            </div>
          </div>
          {r.text && <p className="mt-2 text-[14px] leading-relaxed text-ink/75">{r.text}</p>}
          {r.reply ? (
            <div className="mt-3 rounded-2xl bg-royal-50/60 p-3 ring-1 ring-royal-700/8">
              <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-royal-700">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 17l-5-5 5-5M4 12h11a4 4 0 0 1 4 4v2" /></svg>
                Votre réponse
              </div>
              <p className="mt-1 text-[13px] leading-snug text-ink/75">{r.reply}</p>
            </div>
          ) : open ? (
            <div className="mt-3">
              <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Remerciez la mariée…" className="w-full rounded-xl bg-bone px-3 py-2.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-royal-700" />
              <div className="mt-2 flex gap-2">
                <button onClick={submit} disabled={sending} className="rounded-full bg-royal-700 px-4 py-1.5 text-[12px] font-medium text-gold-50 transition hover:bg-royal-800 disabled:opacity-60">{sending ? '…' : 'Publier la réponse'}</button>
                <button onClick={() => setOpen(false)} className="rounded-full bg-paper px-4 py-1.5 text-[12px] font-medium text-ink/65 ring-1 ring-ink/10">Annuler</button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <button onClick={() => setOpen(true)} className="rounded-full bg-paper px-4 py-1.5 text-[12px] font-medium text-royal-900 ring-1 ring-ink/10 transition hover:bg-bone">Répondre</button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function AvisContent() {
  const { toast } = useToast();
  const { data, loading, refresh } = useApi<ReviewListResponse>('/api/pro/avis');
  const [filter, setFilter] = useState<Filter>('all');

  const reviews = useMemo(() => data?.reviews ?? [], [data]);
  const summary = data?.summary;

  const filtered = useMemo(
    () => reviews.filter((r) => (filter === 'all' ? true : filter === '5' ? r.rating === 5 : filter === 'reply' ? !!r.reply : !r.reply)),
    [reviews, filter],
  );

  async function reply(id: string, text: string) {
    try {
      await api(`/api/pro/avis/${id}`, { method: 'PATCH', body: { reply: text } });
      toast('Réponse publiée ✨', 'success');
      invalidateCache('/api/pro/avis');
      void refresh();
    } catch {
      toast('Réponse impossible', 'error');
    }
  }

  const total = summary?.count ?? 0;
  const FILTERS: { k: Filter; label: string }[] = [
    { k: 'all', label: 'Tous' },
    { k: '5', label: '5 ★' },
    { k: 'noreply', label: 'Sans réponse' },
    { k: 'reply', label: 'Avec réponse' },
  ];

  return (
    <div className="space-y-6">
      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Réputation</div>
        <h1 className="mt-2 font-display text-3xl text-royal-900 sm:text-4xl">Avis & <em className="not-italic gold-shine">notes</em></h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink/65">Répondre aux avis augmente votre confiance. Les pros qui répondent sont 2× plus contactés.</p>
      </section>

      <section className="grid gap-5 md:grid-cols-[260px_1fr]">
        <div className="rounded-3xl bg-gradient-to-br from-royal-800 to-royal-900 p-6 text-center text-gold-50 shadow-glow ring-1 ring-royal-900/30">
          <div className="font-display text-6xl">{summary?.average ?? 0}</div>
          <div className="mt-1 text-lg tracking-widest text-gold-400">{'★'.repeat(Math.round(summary?.average ?? 0)) || '—'}</div>
          <div className="mt-2 font-mono text-[13px] text-gold-100/75">{total} avis</div>
        </div>
        <div className="rounded-3xl bg-paper p-6 shadow-card ring-1 ring-ink/5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Répartition</div>
          <div className="mt-3 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const n = summary?.distribution[star] ?? 0;
              const pct = total ? Math.round((n / total) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-[12px]">
                  <span className="w-8 font-mono text-ink/60">{star} ★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-royal-50">
                    <div className="h-full rounded-full bg-gradient-to-r from-royal-700 to-gold-400" style={{ width: pct + '%' }} />
                  </div>
                  <span className="w-10 text-right font-mono text-ink/55">{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button key={f.k} onClick={() => setFilter(f.k)} className={'rounded-full px-4 py-2 text-[13px] font-medium transition ' + (filter === f.k ? 'bg-royal-700 text-gold-50' : 'bg-paper text-ink/60 ring-1 ring-ink/5 hover:text-royal-900')}>{f.label}</button>
        ))}
      </div>

      {loading && reviews.length === 0 ? (
        <div className="grid place-items-center py-16"><span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-paper p-10 text-center ring-1 ring-ink/5">
          <p className="font-display text-lg text-royal-900">{total === 0 ? 'Pas encore d’avis' : 'Aucun avis dans ce filtre'}</p>
          <p className="mt-1 text-sm text-ink/55">Les avis des mariées apparaîtront ici après vos prestations.</p>
        </div>
      ) : (
        <div className="space-y-3">{filtered.map((r) => <ReviewCard key={r.id} r={r} onReply={reply} />)}</div>
      )}
    </div>
  );
}

export default function ProAvisPage() {
  const user = useUser('/pro/login');
  const router = useRouter();
  const { data, loading, error } = useApi<VendorResponse>('/api/vendor', { skip: !user });

  useEffect(() => {
    if (user && !loading && data && data.vendor === null) router.push('/pro/onboarding');
  }, [user, loading, data, router]);

  if (!user || loading || !data || error || !data.vendor) return <Spinner />;
  const v = data.vendor;

  return (
    <ProShell breadcrumb="Avis & notes" vendor={{ businessName: v.businessName, categoryLabel: CATEGORY_LABELS[v.category], verified: v.verified }}>
      <AvisContent />
    </ProShell>
  );
}
