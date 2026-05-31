'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/contexts/AuthContext';
import { useApi, invalidateCache } from '@/lib/useApi';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import ProShell from '@/components/pro/ProShell';
import { type VendorResponse, type Vendor, CATEGORY_LABELS } from '@/lib/vendor';

export const dynamic = 'force-static';

const PAYOUTS = [
  { id: 'wave', label: 'Wave' },
  { id: 'om', label: 'Orange Money' },
  { id: 'free', label: 'Free Money' },
  { id: 'bank', label: 'Virement bancaire' },
];

function Spinner() {
  return (
    <main className="grid min-h-screen place-items-center bg-bone">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
    </main>
  );
}

function payload(v: Vendor, o: Partial<Vendor>) {
  return {
    category: v.category, businessName: v.businessName, ownerName: v.ownerName, phone: v.phone, whatsapp: v.whatsapp,
    city: v.city, serviceAreas: v.serviceAreas, services: v.services, capacity: v.capacity, priceFrom: v.priceFrom,
    priceLabel: v.priceLabel, depositPolicy: v.depositPolicy, description: v.description, portfolio: v.portfolio,
    coverVariant: v.coverVariant, responseTime: v.responseTime, vacationMode: v.vacationMode,
    payoutMethod: v.payoutMethod, payoutAccount: v.payoutAccount, ...o,
  };
}

function ParamsContent({ vendor, reload }: { vendor: Vendor; reload: () => void }) {
  const { toast } = useToast();
  const { logout } = useAuth();
  const router = useRouter();
  const [method, setMethod] = useState(vendor.payoutMethod || 'wave');
  const [account, setAccount] = useState(vendor.payoutAccount);
  const [savingPayout, setSavingPayout] = useState(false);
  const [vacation, setVacation] = useState(vendor.vacationMode);
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  async function savePayout() {
    setSavingPayout(true);
    try {
      await api('/api/vendor', { method: 'PUT', body: payload(vendor, { payoutMethod: method, payoutAccount: account.trim() }) });
      toast('Compte de versement enregistré ✓', 'success');
      reload();
    } catch {
      toast('Enregistrement impossible', 'error');
    } finally {
      setSavingPayout(false);
    }
  }

  async function toggleVacation() {
    const next = !vacation;
    setVacation(next);
    try {
      await api('/api/vendor', { method: 'PUT', body: payload(vendor, { vacationMode: next }) });
      toast(next ? 'Mode vacances activé — vitrine masquée des recherches' : 'Mode vacances désactivé', 'info');
      reload();
    } catch {
      setVacation(!next);
      toast('Action impossible', 'error');
    }
  }

  async function deleteVendor() {
    setDeleting(true);
    try {
      await api('/api/vendor', { method: 'DELETE' });
      toast('Profil prestataire supprimé', 'info');
      router.push('/');
    } catch {
      toast('Suppression impossible', 'error');
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[760px] space-y-5">
      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Compte</div>
        <h1 className="mt-2 font-display text-3xl text-royal-900 sm:text-4xl">Paramètres</h1>
        <p className="mt-2 text-[15px] text-ink/65">Gérez votre compte de versement, vos disponibilités et votre sécurité.</p>
      </section>

      {/* Compte de versement */}
      <section className="rounded-3xl bg-paper p-5 shadow-card ring-1 ring-ink/5 sm:p-6">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Compte de versement</div>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {PAYOUTS.map((p) => (
            <button key={p.id} onClick={() => setMethod(p.id)} className={'rounded-2xl p-3 text-[13px] font-medium transition ' + (method === p.id ? 'bg-paper text-royal-900 shadow-card ring-2 ring-royal-700' : 'bg-bone text-ink/70 ring-1 ring-ink/8 hover:bg-royal-50/40')}>
              {p.label}
            </button>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/55">Numéro / IBAN du compte</span>
          <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="77 000 00 00 / SN..." className="mt-1.5 h-11 w-full rounded-xl bg-bone px-3 text-sm outline-none ring-1 ring-ink/10 focus:ring-royal-700" />
        </label>
        <button onClick={savePayout} disabled={savingPayout} className="mt-4 rounded-full bg-royal-700 px-5 py-2.5 text-[14px] font-medium text-gold-50 transition hover:bg-royal-800 disabled:opacity-60">{savingPayout ? 'Enregistrement…' : 'Enregistrer'}</button>
      </section>

      {/* Disponibilité */}
      <section className="flex items-center gap-3 rounded-3xl bg-paper p-5 shadow-card ring-1 ring-ink/5 sm:p-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-bone text-xl">🏝️</div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-base text-royal-900">Mode vacances</div>
          <div className="text-[12px] text-ink/55">Masque temporairement votre vitrine des recherches.</div>
        </div>
        <button onClick={toggleVacation} className={'switch ' + (vacation ? 'on' : '')} aria-label="Mode vacances" aria-pressed={vacation} />
      </section>

      {/* Vérification */}
      <section className="rounded-3xl bg-paper p-5 shadow-card ring-1 ring-ink/5 sm:p-6">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Vérification</div>
        {vendor.verified ? (
          <p className="mt-2 inline-flex items-center gap-2 text-[14px] text-royal-800">
            <svg viewBox="0 0 16 16" className="h-4 w-4 text-royal-700" fill="currentColor"><circle cx="8" cy="8" r="7" /><path d="m5 8 2 2 4-4" stroke="#F7E9CF" strokeWidth="1.6" fill="none" /></svg>
            Votre compte est vérifié — badge actif.
          </p>
        ) : (
          <p className="mt-2 text-[14px] text-ink/65">Votre vérification est en attente. L&apos;équipe Sama valide les documents sous 24–48h.</p>
        )}
      </section>

      {/* Sécurité */}
      <section className="rounded-3xl bg-paper p-5 shadow-card ring-1 ring-ink/5 sm:p-6">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Sécurité</div>
        <Link href="/settings" className="mt-2 inline-block text-[14px] font-medium text-royal-700 hover:text-royal-900">Changer mon mot de passe →</Link>
        <button onClick={() => { void logout().then(() => router.push('/pro/login')); }} className="ml-4 mt-2 inline-block text-[14px] font-medium text-ink/60 hover:text-royal-900">Se déconnecter</button>
      </section>

      {/* Zone de danger */}
      <section className="rounded-3xl bg-bordeaux/5 p-5 ring-1 ring-bordeaux/15 sm:p-6">
        <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">Zone de danger</div>
        <p className="mt-2 text-[14px] text-ink/70">Supprimer votre profil prestataire retire votre vitrine, vos demandes, avis et disponibilités. Votre compte utilisateur reste actif.</p>
        {confirmDel ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-medium text-bordeaux">Confirmer la suppression ?</span>
            <button onClick={deleteVendor} disabled={deleting} className="rounded-full bg-bordeaux px-4 py-2 text-[13px] font-medium text-white transition hover:bg-bordeaux-900 disabled:opacity-60">{deleting ? 'Suppression…' : 'Oui, supprimer'}</button>
            <button onClick={() => setConfirmDel(false)} className="rounded-full bg-paper px-4 py-2 text-[13px] font-medium text-ink/65 ring-1 ring-ink/10">Annuler</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)} className="mt-3 rounded-full bg-paper px-4 py-2 text-[13px] font-medium text-bordeaux ring-1 ring-bordeaux/20 transition hover:bg-bordeaux/10">Supprimer mon profil</button>
        )}
      </section>
    </div>
  );
}

export default function ProParametresPage() {
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
    <ProShell breadcrumb="Paramètres" vendor={{ businessName: v.businessName, categoryLabel: CATEGORY_LABELS[v.category], verified: v.verified }}>
      <ParamsContent vendor={v} reload={reload} />
    </ProShell>
  );
}
