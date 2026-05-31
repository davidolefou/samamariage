'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/AuthContext';
import { useApi } from '@/lib/useApi';
import AppShell from '@/components/app/AppShell';
import { CATEGORY_LABELS, coverForCategory, type VendorCategory } from '@/lib/vendor';
import { QUOTE_STATUS_LABELS, type QuoteStatus } from '@/lib/quotes';
import { fmtFCFA } from '@/lib/ndawtal';

export const dynamic = 'force-static';

interface CatalogVendor {
  id: string;
  category: VendorCategory;
  businessName: string;
  city: string;
  services: string[];
  priceFrom: number;
  priceLabel: string;
  description: string;
  coverVariant: string;
  responseTime: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
}
interface MineRequest {
  id: string;
  status: QuoteStatus;
  quoteAmount: number | null;
  vendor: { id: string; businessName: string; category: VendorCategory; coverVariant: string };
}

const CATS: { id: VendorCategory; icon: string; label: string }[] = [
  { id: 'PHOTO', icon: '📸', label: 'Photo' },
  { id: 'FOOD', icon: '🍽️', label: 'Traiteur' },
  { id: 'DECOR', icon: '💐', label: 'Déco' },
  { id: 'SALLE', icon: '🏛️', label: 'Salle' },
  { id: 'DJ', icon: '🎵', label: 'DJ' },
  { id: 'TENUE', icon: '👗', label: 'Tenue' },
  { id: 'BEAUTE', icon: '💄', label: 'Beauté' },
  { id: 'VOITURE', icon: '🚗', label: 'Voiture' },
  { id: 'ANIM', icon: '🎤', label: 'Animation' },
];

function PrestatairesContent() {
  const { data: catalog } = useApi<{ vendors: CatalogVendor[] }>('/api/vendors');
  const { data: mine } = useApi<{ requests: MineRequest[] }>('/api/quote-requests');
  const [cat, setCat] = useState<VendorCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const vendors = useMemo(() => catalog?.vendors ?? [], [catalog]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    vendors.forEach((v) => m.set(v.category, (m.get(v.category) ?? 0) + 1));
    return m;
  }, [vendors]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vendors.filter((v) => {
      if (cat !== 'all' && v.category !== cat) return false;
      if (verifiedOnly && !v.verified) return false;
      if (q && !v.businessName.toLowerCase().includes(q) && !v.city.toLowerCase().includes(q) && !CATEGORY_LABELS[v.category].toLowerCase().includes(q)) return false;
      return true;
    });
  }, [vendors, cat, search, verifiedOnly]);

  const myReqs = mine?.requests ?? [];

  return (
    <div className="space-y-7">
      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Marketplace · prestataires vérifiés</div>
        <h1 className="mt-2 font-display text-3xl leading-tight text-royal-900 sm:text-4xl">Les meilleurs <em className="not-italic gold-shine">pros</em> de Dakar.</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink/65">Vérifiés, notés, payés en sécurité. Demande un devis en deux clics.</p>
      </section>

      {/* Catégories */}
      <section className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 lg:grid-cols-9">
        {CATS.map((c) => {
          const active = cat === c.id;
          return (
            <button key={c.id} onClick={() => setCat(active ? 'all' : c.id)} className={'rounded-2xl bg-paper p-3 text-left shadow-card ring-1 transition hover:-translate-y-0.5 ' + (active ? 'ring-2 ring-royal-700' : 'ring-ink/5')}>
              <div className="text-2xl">{c.icon}</div>
              <div className="mt-2 font-display text-sm leading-tight text-royal-900">{c.label}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink/45">{counts.get(c.id) ?? 0} pros</div>
            </button>
          );
        })}
      </section>

      {/* Mes prestataires */}
      {myReqs.length > 0 && (
        <section>
          <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">Mes prestataires</div>
          <h2 className="mt-1 font-display text-2xl text-royal-900">Mes demandes</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {myReqs.map((r) => (
              <Link key={r.id} href={`/prestataires/${r.vendor.id}`} className="rounded-2xl bg-paper p-4 shadow-card ring-1 ring-ink/5 transition hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <div className={'ph h-10 w-10 shrink-0 rounded-xl ' + (r.vendor.coverVariant || coverForCategory(r.vendor.category))} />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-royal-900">{r.vendor.businessName}</div>
                    <div className="text-[11px] text-ink/55">{CATEGORY_LABELS[r.vendor.category]}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full bg-royal-700/10 px-2.5 py-1 text-[11px] font-medium text-royal-800">{QUOTE_STATUS_LABELS[r.status]}</span>
                  {r.quoteAmount != null && <span className="font-mono text-[11px] text-royal-900">{fmtFCFA(r.quoteAmount)} F</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Découverte */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-2xl text-royal-900">Découverte</h2>
          <span className="text-[12px] text-ink/55"><span className="font-mono text-royal-900">{filtered.length}</span> prestataire{filtered.length > 1 ? 's' : ''}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={() => setVerifiedOnly((v) => !v)} className={'rounded-full px-3.5 py-1.5 text-[12px] font-medium transition ' + (verifiedOnly ? 'bg-royal-700 text-gold-50' : 'bg-paper text-ink/60 ring-1 ring-ink/5 hover:text-royal-900')}>★ Vérifiés</button>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Photographe, traiteur, ville…" className="ml-auto w-56 rounded-full bg-paper px-4 py-1.5 text-sm text-royal-900 outline-none ring-1 ring-ink/10 focus:ring-gold-400" />
        </div>

        {filtered.length === 0 ? (
          <div className="mt-5 rounded-2xl bg-paper p-10 text-center ring-1 ring-ink/5">
            <p className="font-display text-lg text-royal-900">Aucun prestataire pour l’instant</p>
            <p className="mt-1 text-sm text-ink/55">Les prestataires publiés apparaîtront ici. Reviens bientôt !</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((v) => (
              <article key={v.id} className="overflow-hidden rounded-2xl bg-paper shadow-card ring-1 ring-ink/5 transition hover:-translate-y-0.5 hover:shadow-glow">
                <div className={'ph relative h-40 ' + (v.coverVariant || coverForCategory(v.category))}>
                  {v.verified && <span className="absolute right-3 top-3 inline-grid h-7 w-7 place-items-center rounded-full bg-white/95 text-royal-700"><svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor"><circle cx="8" cy="8" r="7" /><path d="m5 8 2 2 4-4" stroke="#F7E9CF" strokeWidth="1.6" fill="none" /></svg></span>}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-display text-lg leading-tight text-royal-900">{v.businessName}</div>
                      <div className="text-[12px] text-ink/55">{CATEGORY_LABELS[v.category]} · {v.city}</div>
                    </div>
                    {v.reviewCount > 0 && (
                      <div className="shrink-0 text-right">
                        <div className="font-mono text-sm text-royal-900">★ {v.rating}</div>
                        <div className="font-mono text-[10px] text-ink/45">{v.reviewCount} avis</div>
                      </div>
                    )}
                  </div>
                  {v.description && <p className="mt-2 line-clamp-2 text-[12.5px] leading-snug text-ink/65">{v.description}</p>}
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="font-mono text-sm text-royal-900">{v.priceLabel || `dès ${fmtFCFA(v.priceFrom)} F`}</div>
                    <Link href={`/prestataires/${v.id}`} className="rounded-full bg-royal-700 px-3 py-1.5 text-[11px] font-medium text-gold-50 transition hover:bg-royal-800">Voir →</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function PrestatairesPage() {
  const user = useUser('/login');
  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-bone">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
      </main>
    );
  }
  return (
    <AppShell user={{ fullName: user.email.split('@')[0] ?? 'Mariée' }} topbarSubtitle="Vue d'ensemble › Sama Prestataires" topbarTitle="Sama Prestataires">
      <PrestatairesContent />
    </AppShell>
  );
}
