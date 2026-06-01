'use client';

// SamaMariage — Console admin · Prestataires actifs — /admin/prestataires.
// Port de admin-prestataires.html, branché sur GET /api/admin/vendors +
// PATCH /api/admin/vendors/[id] (vedette / suspendre / réactiver).

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useApi, invalidateCache } from '@/lib/useApi';
import { api } from '@/lib/api';
import AdminShell from '@/components/admin/AdminShell';
import { useToast } from '@/contexts/ToastContext';
import { CATEGORY_LABELS, type VendorCategory } from '@/lib/vendor';
import { fmtCompact } from '@/lib/wedding';

export const dynamic = 'force-static';

interface AdminVendorRow {
  id: string;
  businessName: string;
  category: string;
  city: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  featured: boolean;
  status: 'PUBLISHED' | 'SUSPENDED';
  revenue: number;
  bookings: number;
}
interface VendorsResponse {
  ok: boolean;
  vendors: AdminVendorRow[];
  stats: { active: number; verified: number; featured: number; suspended: number; pending: number };
}

type Seg = 'all' | 'active' | 'featured' | 'suspended';

function Kpi({ label, value, tone = 'text-royal-900' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl bg-paper p-4 shadow-card ring-1 ring-ink/5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">{label}</div>
      <div className={'mt-2 font-display text-3xl ' + tone}>{value}</div>
    </div>
  );
}

function StatusPill({ v }: { v: AdminVendorRow }) {
  if (v.status === 'SUSPENDED') return <span className="rounded-full bg-bordeaux/10 px-2 py-0.5 text-[11px] font-medium text-bordeaux">⏸ Suspendu</span>;
  if (v.featured) return <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-[11px] font-medium text-gold-600">★ En vedette</span>;
  return <span className="rounded-full bg-royal-50 px-2 py-0.5 text-[11px] font-medium text-royal-700">● Actif</span>;
}

function Content({ data, reload }: { data: VendorsResponse; reload: () => void }) {
  const { toast } = useToast();
  const [seg, setSeg] = useState<Seg>('all');
  const [cat, setCat] = useState<string>('all');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.vendors.filter((v) => {
      if (seg === 'active' && v.status !== 'PUBLISHED') return false;
      if (seg === 'featured' && !v.featured) return false;
      if (seg === 'suspended' && v.status !== 'SUSPENDED') return false;
      if (cat !== 'all' && v.category !== cat) return false;
      if (needle && !v.businessName.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [data.vendors, seg, cat, q]);

  async function act(v: AdminVendorRow, action: 'feature' | 'unfeature' | 'suspend' | 'restore') {
    setBusy(v.id);
    try {
      await api(`/api/admin/vendors/${v.id}`, { method: 'PATCH', body: { action } });
      const msg =
        action === 'suspend' ? `${v.businessName} suspendu` : action === 'restore' ? `${v.businessName} réactivé` : action === 'feature' ? `${v.businessName} mis en avant ✨` : 'Vedette retirée';
      toast(msg, 'success');
      reload();
    } catch {
      toast('Action impossible', 'error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Marketplace · annuaire</div>
          <h1 className="mt-2 font-display text-3xl leading-tight text-royal-900 sm:text-4xl">
            Prestataires <em className="not-italic gold-shine">actifs</em>.
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-ink/65">
            {data.stats.active} pros publiés. Mets en avant les meilleurs, suspends ceux qui posent problème.
          </p>
        </div>
        <Link href="/admin/validation" className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-3 text-[13px] font-medium text-royal-900 shadow-card ring-1 ring-ink/10 transition hover:bg-bone">
          + Valider un dossier{data.stats.pending ? ` (${data.stats.pending})` : ''}
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Actifs" value={String(data.stats.active)} />
        <Kpi label="Vérifiés" value={String(data.stats.verified)} tone="text-royal-700" />
        <Kpi label="En vedette" value={String(data.stats.featured)} tone="text-gold-600" />
        <Kpi label="Suspendus" value={String(data.stats.suspended)} tone="text-bordeaux" />
      </section>

      <section className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-paper p-1 ring-1 ring-ink/8">
          {([['all', 'Tous'], ['active', 'Actifs'], ['featured', 'En vedette'], ['suspended', 'Suspendus']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setSeg(v)} className={'rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition ' + (seg === v ? 'bg-royal-700 text-gold-50' : 'text-ink/60 hover:text-royal-800')}>{l}</button>
          ))}
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-full bg-paper px-3 py-2 text-sm ring-1 ring-ink/10">
          <option value="all">Toutes catégories</option>
          {(Object.keys(CATEGORY_LABELS) as VendorCategory[]).map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        <div className="ml-auto flex w-full items-center gap-2 rounded-full bg-paper px-3 py-2 ring-1 ring-ink/8 sm:w-64">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink/50" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Nom du prestataire…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink/35" />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-paper shadow-card ring-1 ring-ink/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-ink/8 text-left font-mono text-[10px] uppercase tracking-widest text-ink/45">
                <th className="px-5 py-3 font-medium">Prestataire</th>
                <th className="px-3 py-3 font-medium">Catégorie</th>
                <th className="px-3 py-3 font-medium">Ville</th>
                <th className="px-3 py-3 font-medium">Note</th>
                <th className="px-3 py-3 font-medium">Réservations</th>
                <th className="px-3 py-3 font-medium">Revenus générés</th>
                <th className="px-3 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((v) => (
                <tr key={v.id} className="border-b border-ink/5 transition last:border-0 hover:bg-bone/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-royal-700 to-gold-400 font-display text-xs text-paper">{v.businessName.slice(0, 2).toUpperCase()}</div>
                      <div className="flex items-center gap-1.5">
                        <Link href={`/admin/prestataires/${v.id}`} className="font-medium text-royal-900 hover:text-royal-700 hover:underline">{v.businessName}</Link>
                        {v.verified && (
                          <svg viewBox="0 0 16 16" className="h-3 w-3 text-royal-700" fill="currentColor"><circle cx="8" cy="8" r="7" /><path d="m5 8 2 2 4-4" stroke="#F7E9CF" strokeWidth="1.6" fill="none" /></svg>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-ink/70">{CATEGORY_LABELS[v.category as VendorCategory] ?? v.category}</td>
                  <td className="px-3 py-3 text-ink/70">{v.city}</td>
                  <td className="px-3 py-3 font-mono text-royal-900">★ {v.rating.toFixed(1)}</td>
                  <td className="px-3 py-3 font-mono text-ink/70">{v.bookings}</td>
                  <td className="px-3 py-3 font-mono text-royal-900">{fmtCompact(v.revenue)} F</td>
                  <td className="px-3 py-3"><StatusPill v={v} /></td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {v.status === 'SUSPENDED' ? (
                        <button disabled={busy === v.id} onClick={() => act(v, 'restore')} className="rounded-full bg-royal-700 px-3 py-1.5 text-[11px] font-medium text-gold-50 transition hover:bg-royal-800 disabled:opacity-50">Réactiver</button>
                      ) : (
                        <>
                          <button disabled={busy === v.id} onClick={() => act(v, v.featured ? 'unfeature' : 'feature')} className="rounded-full bg-paper px-3 py-1.5 text-[11px] font-medium text-gold-600 ring-1 ring-gold-400/40 transition hover:bg-gold-50 disabled:opacity-50">{v.featured ? '✓ Vedette' : '★ Mettre en avant'}</button>
                          <button disabled={busy === v.id} onClick={() => act(v, 'suspend')} className="rounded-full bg-paper px-3 py-1.5 text-[11px] font-medium text-bordeaux ring-1 ring-bordeaux/25 transition hover:bg-bordeaux/5 disabled:opacity-50">Suspendre</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && <div className="p-10 text-center text-[14px] text-ink/55">Aucun prestataire ne correspond.</div>}
      </section>
    </div>
  );
}

export default function AdminPrestatairesPage() {
  const { data, loading, refresh } = useApi<VendorsResponse>('/api/admin/vendors');
  const reload = () => {
    invalidateCache('/api/admin/vendors');
    void refresh();
  };
  return (
    <AdminShell active="prestataires" breadcrumb="Prestataires actifs" search="Nom du prestataire…" badges={data ? { validation: data.stats.pending } : {}}>
      {loading && !data ? (
        <div className="grid place-items-center py-32">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
        </div>
      ) : data ? (
        <Content data={data} reload={reload} />
      ) : (
        <p className="text-sm text-ink/55">Impossible de charger les prestataires.</p>
      )}
    </AdminShell>
  );
}
