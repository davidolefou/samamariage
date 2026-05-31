'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/AuthContext';
import { useApi, invalidateCache } from '@/lib/useApi';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import ProShell from '@/components/pro/ProShell';
import { type VendorResponse, type Vendor, CATEGORY_LABELS } from '@/lib/vendor';
import { fmtFCFA } from '@/lib/ndawtal';

export const dynamic = 'force-static';

const COOKIE_PREFIX = process.env.NEXT_PUBLIC_COOKIE_PREFIX || 'app';

function csrf(): string {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_PREFIX}-csrf=([^;]*)`));
  return m && m[1] ? decodeURIComponent(m[1]) : '';
}

function Spinner() {
  return (
    <main className="grid min-h-screen place-items-center bg-bone">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
    </main>
  );
}

function buildPayload(v: Vendor, o: Partial<Vendor>) {
  return {
    category: v.category,
    businessName: o.businessName ?? v.businessName,
    ownerName: v.ownerName,
    phone: v.phone,
    whatsapp: v.whatsapp,
    city: o.city ?? v.city,
    serviceAreas: v.serviceAreas,
    services: o.services ?? v.services,
    capacity: v.capacity,
    priceFrom: o.priceFrom ?? v.priceFrom,
    priceLabel: o.priceLabel ?? v.priceLabel,
    depositPolicy: v.depositPolicy,
    description: o.description ?? v.description,
    portfolio: o.portfolio ?? v.portfolio,
    coverVariant: v.coverVariant,
    responseTime: o.responseTime ?? v.responseTime,
    vacationMode: v.vacationMode,
    payoutMethod: v.payoutMethod,
    payoutAccount: v.payoutAccount,
  };
}

function VitrineContent({ vendor, reload }: { vendor: Vendor; reload: () => void }) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const published = vendor.status === 'PUBLISHED';

  const [form, setForm] = useState({
    businessName: vendor.businessName,
    description: vendor.description,
    services: vendor.services.join(', '),
    priceFrom: String(vendor.priceFrom),
    priceLabel: vendor.priceLabel,
    responseTime: vendor.responseTime,
    city: vendor.city,
  });

  async function save() {
    setSaving(true);
    try {
      await api('/api/vendor', {
        method: 'PUT',
        body: buildPayload(vendor, {
          businessName: form.businessName.trim(),
          description: form.description,
          services: form.services.split(',').map((s) => s.trim()).filter(Boolean),
          priceFrom: parseInt(form.priceFrom.replace(/\D/g, ''), 10) || 0,
          priceLabel: form.priceLabel.trim(),
          responseTime: form.responseTime.trim(),
          city: form.city.trim(),
        }),
      });
      toast('Vitrine mise à jour ✨', 'success');
      setEditing(false);
      reload();
    } catch {
      toast('Enregistrement impossible', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    setPublishing(true);
    try {
      await api('/api/pro/publish', { method: 'POST', body: { publish: !published } });
      toast(!published ? 'Vitrine publiée — visible par les mariées ✨' : 'Vitrine dépubliée', 'info');
      reload();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      toast(code === 'PROFILE_INCOMPLETE' ? 'Complétez nom, prestations et tarif avant de publier.' : 'Action impossible', 'error');
    } finally {
      setPublishing(false);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include', headers: { 'x-csrf-token': csrf() } });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { code?: string };
        toast(j.code === 'STORAGE_NOT_CONFIGURED' ? 'Stockage non configuré (Cloudinary).' : 'Upload impossible', 'error');
        return;
      }
      const { url } = (await res.json()) as { url: string };
      await api('/api/vendor', { method: 'PUT', body: buildPayload(vendor, { portfolio: [...vendor.portfolio, url].slice(0, 20) }) });
      toast('Photo ajoutée 📷', 'success');
      reload();
    } catch {
      toast('Upload impossible', 'error');
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto(url: string) {
    try {
      await api('/api/vendor', { method: 'PUT', body: buildPayload(vendor, { portfolio: vendor.portfolio.filter((p) => p !== url) }) });
      reload();
    } catch {
      toast('Suppression impossible', 'error');
    }
  }

  return (
    <div className="mx-auto max-w-[920px] space-y-5">
      {/* Bandeau statut */}
      <section className="flex flex-col justify-between gap-3 rounded-2xl bg-gradient-to-r from-royal-50 to-bone p-4 ring-1 ring-royal-700/10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-royal-700 text-gold-100">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
          </span>
          <div>
            <div className="text-[13px] font-semibold text-royal-900">Aperçu de votre vitrine</div>
            <div className="text-[12px] text-ink/55">Ce que voient les mariées · <span className={published ? 'text-royal-700' : 'text-bordeaux'}>{published ? 'En ligne' : 'Brouillon'}</span></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {published && (
            <Link href={`/prestataires/${vendor.id}`} className="rounded-full bg-paper px-4 py-2 text-[13px] font-medium text-royal-900 ring-1 ring-ink/10 transition hover:bg-bone">Voir en public</Link>
          )}
          <button onClick={togglePublish} disabled={publishing} className="rounded-full bg-royal-700 px-4 py-2 text-[13px] font-medium text-gold-50 transition hover:bg-royal-800 disabled:opacity-60">
            {publishing ? '…' : published ? 'Dépublier' : 'Publier'}
          </button>
        </div>
      </section>

      {/* Identité / À propos / Prestations / Tarifs */}
      {editing ? (
        <section className="space-y-4 rounded-3xl bg-paper p-5 shadow-card ring-1 ring-ink/5 sm:p-6">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Modifier ma vitrine</div>
          {[
            { k: 'businessName', label: "Nom de l'entreprise" },
            { k: 'priceLabel', label: 'Libellé tarif (ex : « dès 650k F · forfait »)' },
            { k: 'responseTime', label: 'Délai de réponse (ex : « < 2h »)' },
            { k: 'city', label: 'Ville' },
            { k: 'services', label: 'Prestations (séparées par des virgules)' },
          ].map((f) => (
            <label key={f.k} className="block">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink/55">{f.label}</span>
              <input
                value={form[f.k as keyof typeof form]}
                onChange={(e) => setForm((s) => ({ ...s, [f.k]: e.target.value }))}
                className="mt-1.5 h-11 w-full rounded-xl bg-bone px-3 text-sm outline-none ring-1 ring-ink/10 focus:ring-royal-700"
              />
            </label>
          ))}
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/55">Tarif de départ (FCFA)</span>
            <input value={form.priceFrom} onChange={(e) => setForm((s) => ({ ...s, priceFrom: e.target.value.replace(/\D/g, '') }))} inputMode="numeric" className="mt-1.5 h-11 w-full rounded-xl bg-bone px-3 font-mono text-sm outline-none ring-1 ring-ink/10 focus:ring-royal-700" />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/55">À propos</span>
            <textarea rows={4} value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} className="mt-1.5 w-full rounded-xl bg-bone px-3 py-2.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-royal-700" />
          </label>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="rounded-full bg-royal-700 px-5 py-2.5 text-[14px] font-medium text-gold-50 transition hover:bg-royal-800 disabled:opacity-60">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            <button onClick={() => setEditing(false)} className="rounded-full bg-paper px-5 py-2.5 text-[14px] font-medium text-ink/65 ring-1 ring-ink/10 transition hover:bg-bone">Annuler</button>
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl bg-paper shadow-card ring-1 ring-ink/5">
          <div className={'ph relative h-52 sm:h-64 ' + (vendor.coverVariant || 'cv-photo')} />
          <div className="relative p-5 sm:p-6">
            <button onClick={() => setEditing(true)} className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-bone px-3 py-1.5 text-[12px] font-medium text-royal-900 transition hover:bg-royal-50">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg> Modifier
            </button>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl text-royal-900">{vendor.businessName}</h1>
              {vendor.verified && <svg viewBox="0 0 16 16" className="h-5 w-5 text-royal-700" fill="currentColor"><circle cx="8" cy="8" r="7" /><path d="m5 8 2 2 4-4" stroke="#F7E9CF" strokeWidth="1.6" fill="none" /></svg>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink/60">
              <span className="font-mono text-[11px] uppercase tracking-widest text-bordeaux">{CATEGORY_LABELS[vendor.category]}</span>
              <span>📍 {vendor.city}</span>
              {vendor.reviewCount > 0 && <span className="font-medium text-royal-900">★ {vendor.rating} <span className="text-ink/45">({vendor.reviewCount} avis)</span></span>}
            </div>
            {vendor.description && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink/75">{vendor.description}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {vendor.services.map((s) => <span key={s} className="rounded-full bg-royal-700/10 px-3 py-1 text-[12px] text-royal-800">{s}</span>)}
            </div>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px] text-ink/70">
              <span className="font-display text-2xl text-royal-900">{fmtFCFA(vendor.priceFrom)} F</span>
              {vendor.priceLabel && <span className="text-ink/55">{vendor.priceLabel}</span>}
              {vendor.responseTime && <span>· réponse <span className="font-mono text-royal-900">{vendor.responseTime}</span></span>}
            </div>
          </div>
        </section>
      )}

      {/* Portfolio (upload réel) */}
      <section className="rounded-3xl bg-paper p-5 shadow-card ring-1 ring-ink/5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Portfolio · {vendor.portfolio.length} photo{vendor.portfolio.length > 1 ? 's' : ''}</div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {vendor.portfolio.map((url) => (
            <div key={url} className="group relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-ink/5">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button onClick={() => removePhoto(url)} aria-label="Retirer" className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-bordeaux opacity-0 transition group-hover:opacity-100">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg>
              </button>
            </div>
          ))}
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="grid aspect-[4/3] place-items-center rounded-2xl border-2 border-dashed border-royal-700/25 text-ink/45 transition hover:border-royal-700/50 hover:bg-royal-50/40 disabled:opacity-60">
            <span className="text-center">
              {uploading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="mx-auto h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 5v14M5 12h14" /></svg>
                  <span className="mt-1 block font-mono text-[9px] uppercase tracking-widest">Ajouter</span>
                </>
              )}
            </span>
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
      </section>
    </div>
  );
}

export default function ProVitrinePage() {
  const user = useUser('/pro/login');
  const router = useRouter();
  const { data, loading, error, refresh } = useApi<VendorResponse>('/api/vendor', { skip: !user });

  useEffect(() => {
    if (user && !loading && data && data.vendor === null) router.push('/pro/onboarding');
  }, [user, loading, data, router]);

  if (!user || loading || !data || error || !data.vendor) return <Spinner />;
  const v = data.vendor;

  function reload() {
    invalidateCache('/api/vendor');
    void refresh();
  }

  return (
    <ProShell breadcrumb="Ma vitrine" vendor={{ businessName: v.businessName, categoryLabel: CATEGORY_LABELS[v.category], verified: v.verified }}>
      <VitrineContent vendor={v} reload={reload} />
    </ProShell>
  );
}
