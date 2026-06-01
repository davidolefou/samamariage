'use client';

// SamaMariage — Console admin · Validation prestataires — /admin/validation.
// File des dossiers PENDING_REVIEW (GET /api/admin/vendors?queue=pending) avec
// approbation (→ PUBLISHED + verified) ou rejet (→ DRAFT) via PATCH.

import { useState } from 'react';
import { useApi, invalidateCache } from '@/lib/useApi';
import { api } from '@/lib/api';
import AdminShell from '@/components/admin/AdminShell';
import { useToast } from '@/contexts/ToastContext';
import { CATEGORY_LABELS, type VendorCategory } from '@/lib/vendor';
import { fmtFCFA } from '@/lib/wedding';

export const dynamic = 'force-static';

interface PendingVendor {
  id: string;
  businessName: string;
  category: string;
  city: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  services: string[];
  priceFrom: number;
  description: string;
  portfolio: string[];
}
interface PendingResponse {
  ok: boolean;
  vendors: PendingVendor[];
  stats: { active: number; verified: number; featured: number; suspended: number; pending: number };
}

function Content({ data, reload }: { data: PendingResponse; reload: () => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function decide(v: PendingVendor, action: 'approve' | 'reject') {
    setBusy(v.id);
    try {
      await api(`/api/admin/vendors/${v.id}`, { method: 'PATCH', body: { action } });
      toast(action === 'approve' ? `${v.businessName} publié ✅` : `${v.businessName} renvoyé en brouillon`, action === 'approve' ? 'success' : 'info');
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
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Modération · file d&apos;attente</div>
        <h1 className="mt-2 font-display text-3xl leading-tight text-royal-900 sm:text-4xl">
          Dossiers à <em className="not-italic gold-shine">valider</em>.
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink/65">
          {data.vendors.length} prestataire{data.vendors.length > 1 ? 's' : ''} en attente de vérification avant publication dans la marketplace.
        </p>
      </section>

      {data.vendors.length === 0 ? (
        <div className="rounded-2xl bg-paper p-12 text-center shadow-card ring-1 ring-ink/5">
          <div className="text-5xl">✅</div>
          <h2 className="mt-3 font-display text-2xl text-royal-900">File vide</h2>
          <p className="mt-1 text-sm text-ink/60">Aucun dossier en attente. Tout est à jour.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.vendors.map((v) => (
            <article key={v.id} className="overflow-hidden rounded-2xl bg-paper shadow-card ring-1 ring-ink/5">
              <div className="flex items-start gap-3 border-b border-ink/5 p-5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-royal-700 to-gold-400 font-display text-base text-paper">{v.businessName.slice(0, 2).toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">{CATEGORY_LABELS[v.category as VendorCategory] ?? v.category}</div>
                  <h3 className="font-display text-xl text-royal-900">{v.businessName}</h3>
                  <div className="text-[12px] text-ink/55">{v.ownerName || '—'} · {v.city}{v.priceFrom ? ` · à partir de ${fmtFCFA(v.priceFrom)} F` : ''}</div>
                </div>
              </div>

              {v.portfolio.length > 0 && (
                <div className="grid grid-cols-4 gap-1 p-3">
                  {v.portfolio.slice(0, 4).map((url, i) => (
                    <img key={i} src={url} alt="" className="aspect-square w-full rounded-lg object-cover ring-1 ring-ink/5" />
                  ))}
                </div>
              )}

              <div className="px-5 pb-3">
                {v.description && <p className="line-clamp-3 text-[13px] text-ink/70">{v.description}</p>}
                {v.services.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {v.services.slice(0, 5).map((s) => (
                      <span key={s} className="rounded-full bg-bone px-2 py-0.5 text-[11px] text-ink/70 ring-1 ring-ink/5">{s}</span>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-3 text-[12px] text-ink/55">
                  {v.phone && <span>📞 {v.phone}</span>}
                  {v.whatsapp && <span>💬 {v.whatsapp}</span>}
                </div>
              </div>

              <div className="flex gap-2 border-t border-ink/5 p-4">
                <button disabled={busy === v.id} onClick={() => decide(v, 'approve')} className="flex-1 rounded-xl bg-royal-700 px-4 py-2.5 text-[13px] font-medium text-gold-50 transition hover:bg-royal-800 disabled:opacity-50">✓ Approuver & publier</button>
                <button disabled={busy === v.id} onClick={() => decide(v, 'reject')} className="rounded-xl bg-paper px-4 py-2.5 text-[13px] font-medium text-bordeaux ring-1 ring-bordeaux/25 transition hover:bg-bordeaux/5 disabled:opacity-50">Rejeter</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminValidationPage() {
  const { data, loading, refresh } = useApi<PendingResponse>('/api/admin/vendors?queue=pending');
  const reload = () => {
    invalidateCache('/api/admin/vendors?queue=pending');
    void refresh();
  };
  return (
    <AdminShell active="validation" breadcrumb="Validation prestataires" search="" badges={data ? { validation: data.stats.pending } : {}}>
      {loading && !data ? (
        <div className="grid place-items-center py-32">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
        </div>
      ) : data ? (
        <Content data={data} reload={reload} />
      ) : (
        <p className="text-sm text-ink/55">Impossible de charger la file.</p>
      )}
    </AdminShell>
  );
}
