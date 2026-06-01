'use client';

// SamaMariage — Console admin · Fiche prestataire — /admin/prestataires/[id].
// Port de admin-prestataire-detail.html, branché sur GET /api/admin/vendors/[id]
// + PATCH (vedette / suspendre / réactiver).

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApi, invalidateCache } from '@/lib/useApi';
import { api } from '@/lib/api';
import AdminShell from '@/components/admin/AdminShell';
import { useToast } from '@/contexts/ToastContext';
import { CATEGORY_LABELS, STATUS_LABELS, type VendorCategory, type VendorStatus } from '@/lib/vendor';
import { fmtCompact, fmtFCFA } from '@/lib/wedding';

export const dynamic = 'force-static';

interface VendorDetail {
  ok: boolean;
  vendor: {
    id: string;
    businessName: string;
    category: string;
    city: string;
    ownerName: string;
    phone: string;
    whatsapp: string;
    services: string[];
    priceFrom: number;
    priceLabel: string;
    description: string;
    portfolio: string[];
    responseTime: string;
    payoutMethod: string;
    payoutAccount: string;
    verified: boolean;
    featured: boolean;
    rating: number;
    reviewCount: number;
    status: VendorStatus;
  };
  revenue: number;
  bookings: number;
  recentBookings: { coupleName: string; amount: number; at: string }[];
}

function Content({ data, reload }: { data: VendorDetail; reload: () => void }) {
  const { toast } = useToast();
  const v = data.vendor;
  const [busy, setBusy] = useState(false);
  const suspended = v.status === 'SUSPENDED';

  async function act(action: 'feature' | 'unfeature' | 'suspend' | 'restore') {
    setBusy(true);
    try {
      await api(`/api/admin/vendors/${v.id}`, { method: 'PATCH', body: { action } });
      toast('Action appliquée ✓', 'success');
      reload();
    } catch {
      toast('Action impossible', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/prestataires" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink/60 transition hover:text-royal-800">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 4 6 8l4 4" /></svg>
        Tous les prestataires
      </Link>

      <section className="overflow-hidden rounded-3xl bg-paper shadow-card ring-1 ring-ink/5">
        <div className="h-28 bg-gradient-to-br from-royal-700 via-royal-800 to-gold-600 sm:h-36" />
        <div className="p-5 sm:p-7">
          <div className="-mt-16 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="flex min-w-0 items-end gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-royal-700 to-gold-400 font-display text-2xl text-paper shadow-card ring-4 ring-paper">{v.businessName.slice(0, 2).toUpperCase()}</div>
              <div className="min-w-0 pb-1">
                <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">{CATEGORY_LABELS[v.category as VendorCategory] ?? v.category}</div>
                <h1 className="mt-0.5 flex items-center gap-2 font-display text-3xl leading-tight text-royal-900">
                  {v.businessName}
                  {v.verified && <svg viewBox="0 0 16 16" className="h-4 w-4 text-royal-700" fill="currentColor"><circle cx="8" cy="8" r="7" /><path d="m5 8 2 2 4-4" stroke="#F7E9CF" strokeWidth="1.6" fill="none" /></svg>}
                </h1>
                <div className="mt-0.5 text-[13px] text-ink/55">{v.ownerName || '—'} · {v.city}</div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {suspended ? (
                <button disabled={busy} onClick={() => act('restore')} className="rounded-full bg-royal-700 px-4 py-2.5 text-[13px] font-medium text-gold-50 transition hover:bg-royal-800 disabled:opacity-50">Réactiver</button>
              ) : (
                <>
                  <button disabled={busy} onClick={() => act(v.featured ? 'unfeature' : 'feature')} className="rounded-full bg-paper px-4 py-2.5 text-[13px] font-medium text-gold-600 ring-1 ring-gold-400/40 transition hover:bg-gold-50 disabled:opacity-50">{v.featured ? '✓ En vedette' : '★ Mettre en avant'}</button>
                  <button disabled={busy} onClick={() => act('suspend')} className="rounded-full bg-paper px-4 py-2.5 text-[13px] font-medium text-bordeaux ring-1 ring-bordeaux/30 transition hover:bg-bordeaux/5 disabled:opacity-50">Suspendre</button>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { v: `★ ${v.rating.toFixed(1)}`, l: 'note moyenne' },
              { v: String(v.reviewCount), l: 'avis' },
              { v: String(data.bookings), l: 'réservations' },
              { v: fmtCompact(data.revenue) + ' F', l: 'revenus générés' },
              { v: v.responseTime || '—', l: 'délai réponse' },
            ].map((k) => (
              <div key={k.l} className="rounded-2xl bg-bone/60 p-3">
                <div className="font-display text-2xl text-royal-900">{k.v}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink/55">{k.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <section className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5 sm:p-6">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl text-royal-900">Portfolio</h2>
              <span className="text-[12px] text-ink/55">{v.portfolio.length} photo{v.portfolio.length > 1 ? 's' : ''}</span>
            </div>
            {v.portfolio.length === 0 ? (
              <p className="mt-4 text-sm text-ink/55">Aucune photo dans le portfolio.</p>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {v.portfolio.map((url, i) => (
                  <img key={i} src={url} alt="" className="aspect-square w-full rounded-xl object-cover ring-1 ring-ink/5" />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5 sm:p-6">
            <h2 className="font-display text-2xl text-royal-900">Réservations récentes</h2>
            <div className="mt-4 space-y-2.5">
              {data.recentBookings.length === 0 ? (
                <p className="text-sm text-ink/55">Aucune réservation confirmée.</p>
              ) : (
                data.recentBookings.map((b, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-bone/50 px-3.5 py-3">
                    <span className="text-sm text-royal-900">{b.coupleName || 'Mariage'}</span>
                    <span className="font-mono text-[13px] text-royal-900">{b.amount ? fmtFCFA(b.amount) + ' F' : '—'}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">Identité & contact</div>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-ink/55">Responsable</dt><dd className="text-royal-900">{v.ownerName || '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink/55">Téléphone</dt><dd className="text-royal-900">{v.phone || '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink/55">WhatsApp</dt><dd className="text-royal-900">{v.whatsapp || '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink/55">Versement</dt><dd className="text-royal-900">{v.payoutMethod ? `${v.payoutMethod} · ${v.payoutAccount || '—'}` : '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink/55">Tarif</dt><dd className="text-royal-900">{v.priceFrom ? `dès ${fmtFCFA(v.priceFrom)} F` : v.priceLabel || '—'}</dd></div>
            </dl>
          </section>

          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-royal-800 to-royal-900 p-5 text-gold-50 shadow-card ring-1 ring-royal-900/30">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold-400/15 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gold-400/20 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-gold-400">{STATUS_LABELS[v.status]}{v.featured ? ' · vedette' : ''}</span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-gold-100/85">
                {suspended ? 'Retiré de la marketplace — invisible pour les mariées.' : v.verified ? 'Vérifié et visible dans la marketplace.' : 'Visible mais non vérifié.'}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AdminPrestataireDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data, loading, refresh } = useApi<VendorDetail>(`/api/admin/vendors/${id}`, { skip: !id });
  const reload = () => {
    if (id) invalidateCache(`/api/admin/vendors/${id}`);
    void refresh();
  };
  return (
    <AdminShell active="prestataires" breadcrumb="Fiche prestataire" search="">
      {loading && !data ? (
        <div className="grid place-items-center py-32">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
        </div>
      ) : data ? (
        <Content data={data} reload={reload} />
      ) : (
        <p className="text-sm text-ink/55">Prestataire introuvable.</p>
      )}
    </AdminShell>
  );
}
