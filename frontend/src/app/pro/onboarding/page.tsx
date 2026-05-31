'use client';

import { useState, useEffect, useMemo, type ReactNode, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { fmtFCFA, toEUR as fmtEUR } from '@/lib/ndawtal';

export const dynamic = 'force-static';

const STORAGE = 'sama:onboarding-pro:v1';
const PENDING_VENDOR = 'sama:vendor-pending';
const TOTAL = 11;

// ── Helpers ──
const pvar = (p: string): CSSProperties => ({ ['--p']: p }) as CSSProperties;

// ── Types ──
interface Data {
  category: string;
  business_name: string;
  tagline: string;
  years: number;
  owner_name: string;
  owner_role: string;
  email: string;
  phone_country: string;
  phone: string;
  base_city: string;
  base_city_other: string;
  zones: string[];
  services: string[];
  signature: string;
  team: number;
  max_events: number;
  price_from: number;
  price_model: string;
  photos: boolean[];
  style_tags: string[];
  resp_time: string;
  seasons: string[];
  instant_quote: boolean;
  diaspora: boolean;
  doc_id: boolean;
  doc_biz: boolean;
  payout: string;
  terms: boolean;
}

type StepProps = {
  data: Data;
  set: (patch: Partial<Data>) => void;
  onNext: () => void;
  onBack: () => void;
  dir: 'fwd' | 'bwd';
};

// ── Shared data ──
const CATS = [
  { id: 'photo', icon: '📸', label: 'Photo / Vidéo', sub: 'Reportage, studio, drone' },
  { id: 'food', icon: '🍽️', label: 'Traiteur', sub: 'Cuisine, service, buffet' },
  { id: 'decor', icon: '💐', label: 'Décoration', sub: 'Scéno, floral, location' },
  { id: 'salle', icon: '🏛️', label: 'Salle / Lieu', sub: 'Réception, hôtel, jardin' },
  { id: 'dj', icon: '🎵', label: 'DJ / Son', sub: 'Mix, sono, lumières' },
  { id: 'tenue', icon: '👗', label: 'Tenue / Couture', sub: 'Tailleur, créateur, bazin' },
  { id: 'voiture', icon: '🚗', label: 'Voiture', sub: 'Cortège, location, chauffeur' },
  { id: 'beaute', icon: '💄', label: 'Beauté', sub: 'Maquillage, coiffure, henné' },
  { id: 'anim', icon: '🎤', label: 'Animation', sub: 'MC, griots, ndawtal' },
];
const CAT_LABEL: Record<string, string> = Object.fromEntries(CATS.map((c) => [c.id, c.label]));
const CAT_ENUM: Record<string, string> = {
  photo: 'PHOTO', food: 'FOOD', decor: 'DECOR', salle: 'SALLE', dj: 'DJ',
  tenue: 'TENUE', voiture: 'VOITURE', beaute: 'BEAUTE', anim: 'ANIM',
};
const SERVICES_BY_CAT: Record<string, string[]> = {
  photo: ['Reportage journée', 'Séance couple', 'Vidéo cinématique', 'Drone', 'Album imprimé', 'Studio'],
  food: ['Cuisine sénégalaise', 'Buffet international', 'Service à table', 'Cocktail', 'Pâtisserie', 'Dégustation'],
  decor: ['Scénographie', 'Art floral', 'Location mobilier', 'Arches & plafonds', 'Éclairage', 'Papeterie'],
  salle: ['Salle climatisée', 'Jardin / extérieur', 'Hébergement', 'Parking', 'Traiteur intégré', 'Vue mer'],
  dj: ['Mbalax', 'Afrobeats', 'International', 'Sono incluse', 'Jeux de lumière', 'Animation micro'],
  tenue: ['Bazin riche', 'Broderie or', 'Sur-mesure', 'Ndaxal coordonné', 'Retouches', 'Location'],
  voiture: ['Berline luxe', 'Cortège', 'Chauffeur costumé', 'Décoration florale', 'Cabriolet', '4x4 prestige'],
  beaute: ['Maquillage mariée', 'Coiffure', 'Henné', 'Forfait ndaxal', 'Soins peau', 'À domicile'],
  anim: ['Maître de cérémonie', 'Griot', 'Bilingue wolof/fr', 'Jeux & animation', 'Lancement bouquet', 'Coordination'],
};
const COVERS = ['cv-photo', 'cv-food', 'cv-decor', 'cv-dj', 'cv-tenue', 'cv-salle'];
const RESP_LABEL: Record<string, string> = { '2h': '< 2h', '4h': '< 4h', '24h': '< 24h' };
const PRICE_MODEL_LABEL: Record<string, string> = {
  forfait: 'forfait', invite: '/ invité', jour: '/ journée', devis: 'sur devis',
};

const INPUT_CLS =
  'w-full h-14 rounded-2xl bg-paper px-4 ring-1 ring-ink/8 focus:ring-2 focus:ring-royal-700 outline-none text-lg placeholder:text-ink/30 transition';

// ── Vendor payload mapping (→ PUT /api/vendor) ──
function toVendorPayload(d: Data) {
  const city = (d.base_city === 'autre' ? d.base_city_other : d.base_city) || 'dakar';
  const cover = COVERS.includes('cv-' + d.category) ? 'cv-' + d.category : 'cv-photo';
  const priceLabel =
    d.price_model === 'devis'
      ? `Sur devis (à p. de ${fmtFCFA(d.price_from)} F)`
      : `À partir de ${fmtFCFA(d.price_from)} F ${PRICE_MODEL_LABEL[d.price_model] ?? ''}`.trim();
  const phone = `${d.phone_country} ${d.phone}`.trim();
  return {
    category: CAT_ENUM[d.category] ?? 'ANIM',
    businessName: d.business_name.trim(),
    ownerName: d.owner_name.trim(),
    phone,
    whatsapp: phone,
    city,
    serviceAreas: d.zones,
    services: d.services,
    capacity: d.max_events,
    priceFrom: d.price_from,
    priceLabel,
    depositPolicy: '',
    description: [d.tagline.trim(), d.signature.trim()].filter(Boolean).join(' — '),
    portfolio: [] as string[],
    coverVariant: cover,
    responseTime: RESP_LABEL[d.resp_time] ?? '',
    vacationMode: false,
    payoutMethod: d.payout,
    payoutAccount: '',
  };
}

// ── Shared atoms ──
function StepShell({
  step, onBack, children, cta, ctaDisabled, ctaLabel, dir,
}: {
  step: number;
  onBack: () => void;
  children: ReactNode;
  cta: () => void;
  ctaDisabled: boolean;
  ctaLabel: string;
  dir: 'fwd' | 'bwd';
}) {
  const pct = Math.round((step / TOTAL) * 100);
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center gap-4 px-5 pt-5 sm:px-8 sm:pt-7">
        <button onClick={onBack} aria-label="Retour" className="grid h-10 w-10 place-items-center rounded-full bg-white/70 text-ink/70 ring-1 ring-ink/8 backdrop-blur transition hover:bg-white">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-royal-50/70 ring-1 ring-ink/5">
            <div className="h-full rounded-full bg-gradient-to-r from-royal-700 via-gold-400 to-royal-700 transition-[width] duration-500 ease-out" style={{ width: pct + '%' }} />
          </div>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest tabular-nums text-royal-800/85">
          {step}<span className="text-ink/35">/{TOTAL}</span>
        </div>
      </div>

      <div key={step} className={'scroll-area flex-1 overflow-y-auto px-5 pb-32 pt-8 sm:px-8 sm:pt-12 ' + (dir === 'fwd' ? 'slide-fwd' : 'slide-bwd')}>
        <div className="mx-auto w-full max-w-[540px]">{children}</div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30">
        <div className="bg-gradient-to-t from-bone via-bone/95 to-bone/0 pb-5 pt-8 sm:pb-7">
          <div className="mx-auto w-full max-w-[540px] px-5 sm:px-8">
            <button
              onClick={cta}
              disabled={ctaDisabled}
              className={
                'flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-medium transition sm:h-[60px] ' +
                (ctaDisabled
                  ? 'cursor-not-allowed bg-royal-50/80 text-royal-800/40'
                  : 'bg-royal-700 text-gold-50 shadow-cta ring-1 ring-gold-400/40 hover:bg-royal-800 active:scale-[.99]')
              }
            >
              {ctaLabel}
              {!ctaDisabled && (
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest text-ink/55">{label}</span>
        {hint && <span className="text-[11px] text-ink/45">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

function RadioCard({
  selected, onClick, icon, title, sub, children,
}: {
  selected: boolean; onClick: () => void; icon: string; title: string; sub: string; children?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={'block w-full rounded-2xl p-4 text-left transition ' + (selected ? 'bg-paper shadow-card ring-2 ring-royal-700' : 'bg-white/60 ring-1 ring-ink/8 backdrop-blur hover:bg-paper')}
    >
      <div className="flex items-start gap-3">
        <div className={'grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ' + (selected ? 'bg-royal-700 text-gold-100' : 'bg-bone')}>{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg leading-tight text-royal-900">{title}</div>
          <div className="text-[13px] text-ink/60">{sub}</div>
        </div>
        <span className={'mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full transition ' + (selected ? 'bg-royal-700' : 'bg-bone ring-1 ring-ink/15')}>
          {selected && <span className="h-2 w-2 rounded-full bg-gold-200" />}
        </span>
      </div>
      {children}
    </button>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={'rounded-full px-4 py-2.5 text-[13px] font-medium transition ' + (on ? 'bg-royal-700 text-gold-50 shadow-card' : 'bg-white/60 text-ink/75 ring-1 ring-ink/10 hover:bg-paper')}
    >
      {children}
    </button>
  );
}

// ── Step 1 : Catégorie ──
function StepCategory({ data, set, onNext, onBack, dir }: StepProps) {
  return (
    <StepShell step={1} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!data.category} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 1 / 11 · Métier</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">Quel est votre <em className="not-italic gold-shine">métier</em>&nbsp;?</h2>
      <p className="mt-2 text-[15px] text-ink/70">Choisissez votre activité principale. Vous pourrez en ajouter d&apos;autres plus tard.</p>
      <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {CATS.map((c) => {
          const sel = data.category === c.id;
          return (
            <button key={c.id} type="button" onClick={() => set({ category: c.id, services: [] })}
              className={'rounded-2xl p-4 text-left transition ' + (sel ? 'bg-paper shadow-card ring-2 ring-royal-700' : 'bg-white/60 ring-1 ring-ink/8 hover:bg-paper')}>
              <div className="text-2xl">{c.icon}</div>
              <div className="mt-2 font-display text-[15px] leading-tight text-royal-900">{c.label}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-ink/55">{c.sub}</div>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}

// ── Step 2 : Entreprise ──
function StepBusiness({ data, set, onNext, onBack, dir }: StepProps) {
  const valid = data.business_name.trim().length >= 2;
  const yp = (data.years / 30) * 100;
  return (
    <StepShell step={2} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 2 / 11 · Votre marque</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">Présentez votre entreprise.</h2>
      <p className="mt-2 text-[15px] text-ink/70">C&apos;est le nom que les mariées verront sur la marketplace.</p>
      <div className="mt-8 space-y-5">
        <Field label="Nom de l'entreprise" hint="Public">
          <input autoFocus type="text" value={data.business_name} onChange={(e) => set({ business_name: e.target.value })} placeholder="Adams Sidibé Studio" className={INPUT_CLS} />
        </Field>
        <Field label="Accroche courte" hint="(facultatif, max 60 car.)">
          <input type="text" maxLength={60} value={data.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="Le mariage comme un film." className={INPUT_CLS} />
        </Field>
        <section className="rounded-3xl bg-paper p-5 shadow-card ring-1 ring-ink/8">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/55">Années d&apos;expérience</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-4xl tabular-nums text-royal-900">{data.years === 30 ? '30+' : data.years}</span>
            <span className="text-ink/55">{data.years > 1 ? 'ans' : 'an'} d&apos;activité</span>
          </div>
          <input type="range" min="0" max="30" value={data.years} onChange={(e) => set({ years: parseInt(e.target.value, 10) })} className="sama mt-4" style={pvar(yp + '%')} />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-ink/40"><span>Débute</span><span>30+ ans</span></div>
        </section>
      </div>
    </StepShell>
  );
}

// ── Step 3 : Responsable ──
const ROLES = [
  { id: 'gerant', label: 'Gérant·e' },
  { id: 'fondateur', label: 'Fondateur·rice' },
  { id: 'manager', label: 'Manager' },
  { id: 'artisan', label: 'Artisan·e' },
];
function StepOwner({ data, set, onNext, onBack, dir }: StepProps) {
  const valid = data.owner_name.trim().length >= 2;
  return (
    <StepShell step={3} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 3 / 11 · Le contact</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">Qui gère le compte&nbsp;?</h2>
      <p className="mt-2 text-[15px] text-ink/70">La personne qui répondra aux demandes des mariées.</p>
      <div className="mt-8 space-y-6">
        <Field label="Prénom et nom" hint="Interne, non public">
          <input autoFocus type="text" value={data.owner_name} onChange={(e) => set({ owner_name: e.target.value })} placeholder="Adams Sidibé" className={INPUT_CLS} />
        </Field>
        <div>
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink/55">Votre rôle</div>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button key={r.id} type="button" onClick={() => set({ owner_role: r.id })}
                className={'h-12 rounded-xl text-sm font-medium transition ' + (data.owner_role === r.id ? 'bg-royal-700 text-gold-50 shadow-card' : 'bg-white/60 text-ink/75 ring-1 ring-ink/8 hover:bg-paper')}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </StepShell>
  );
}

// ── Step 4 : Contact ──
function StepContact({ data, set, onNext, onBack, dir }: StepProps) {
  const valid = /^[0-9 +()-]{6,}$/.test(data.phone) && (!data.email || /.+@.+/.test(data.email));
  return (
    <StepShell step={4} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 4 / 11 · Vous joindre</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">Comment vous joindre&nbsp;?</h2>
      <p className="mt-2 text-[15px] text-ink/70">Les demandes de devis arrivent en priorité sur WhatsApp.</p>
      <div className="mt-8 space-y-4">
        <Field label="WhatsApp pro" hint="Requis">
          <div className="flex gap-2">
            <select value={data.phone_country} onChange={(e) => set({ phone_country: e.target.value })} className="h-14 rounded-2xl bg-paper px-3 text-base outline-none ring-1 ring-ink/8 focus:ring-2 focus:ring-royal-700">
              <option value="+221">🇸🇳 +221</option>
              <option value="+33">🇫🇷 +33</option>
              <option value="+39">🇮🇹 +39</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+44">🇬🇧 +44</option>
            </select>
            <input autoFocus type="tel" value={data.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="77 000 00 00" className={'flex-1 ' + INPUT_CLS} />
          </div>
        </Field>
        <Field label="Email professionnel" hint="(facultatif)">
          <input type="email" value={data.email} onChange={(e) => set({ email: e.target.value })} placeholder="contact@studio-sidibe.sn" className={INPUT_CLS} />
        </Field>
        <div className="rounded-2xl bg-royal-50/60 p-4 text-[12px] leading-relaxed text-royal-900/80 ring-1 ring-royal-700/8">
          💬 Activez les notifications WhatsApp : les pros qui répondent en moins de 2h reçoivent 3× plus de réservations.
        </div>
      </div>
    </StepShell>
  );
}

// ── Step 5 : Zone ──
const CITIES = [
  { id: 'dakar', icon: '🏙️', label: 'Dakar', sub: 'capitale' },
  { id: 'thies', icon: '🌳', label: 'Thiès', sub: 'région' },
  { id: 'saly', icon: '🏖️', label: 'Saly / Mbour', sub: 'Petite Côte' },
  { id: 'autre', icon: '🇸🇳', label: 'Autre ville', sub: 'Saint-Louis, Touba…' },
];
const ZONES = ['Dakar', 'Banlieue', 'Thiès', 'Saly / Mbour', 'Saint-Louis', 'Touba', 'Toute la région', 'Étranger'];
function StepZone({ data, set, onNext, onBack, dir }: StepProps) {
  const valid = !!data.base_city && (data.base_city !== 'autre' || data.base_city_other.trim().length >= 2);
  const toggleZone = (z: string) => set({ zones: data.zones.includes(z) ? data.zones.filter((x) => x !== z) : [...data.zones, z] });
  return (
    <StepShell step={5} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 5 / 11 · Zone</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">Où êtes-vous <em className="not-italic gold-shine">basé·e</em>&nbsp;?</h2>
      <p className="mt-2 text-[15px] text-ink/70">On vous propose aux mariées qui se marient près de chez vous.</p>
      <div className="mt-8 space-y-3">
        {CITIES.map((c) => (
          <RadioCard key={c.id} selected={data.base_city === c.id} onClick={() => set({ base_city: c.id })} icon={c.icon} title={c.label} sub={c.sub}>
            {data.base_city === c.id && c.id === 'autre' && (
              <div className="fade-up mt-3 border-t border-ink/5 pt-3">
                <input type="text" autoFocus value={data.base_city_other} onChange={(e) => set({ base_city_other: e.target.value })} placeholder="Saint-Louis, Touba…" className="h-12 w-full rounded-xl bg-bone/60 px-3 text-base outline-none ring-1 ring-ink/8 focus:ring-2 focus:ring-royal-700" />
              </div>
            )}
          </RadioCard>
        ))}
      </div>
      <div className="mt-7">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink/55">Zones où vous intervenez</div>
        <div className="flex flex-wrap gap-2">{ZONES.map((z) => <Chip key={z} on={data.zones.includes(z)} onClick={() => toggleZone(z)}>{z}</Chip>)}</div>
      </div>
    </StepShell>
  );
}

// ── Step 6 : Services ──
function StepServices({ data, set, onNext, onBack, dir }: StepProps) {
  const valid = data.services.length >= 1;
  const opts = SERVICES_BY_CAT[data.category] ?? [];
  const toggle = (s: string) => set({ services: data.services.includes(s) ? data.services.filter((x) => x !== s) : [...data.services, s] });
  return (
    <StepShell step={6} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 6 / 11 · Prestations</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">Que proposez-vous&nbsp;?</h2>
      <p className="mt-2 text-[15px] text-ink/70">Cochez vos prestations en <span className="text-bordeaux">{CAT_LABEL[data.category] ?? 'votre métier'}</span>. Au moins une.</p>
      <div className="mt-8 flex flex-wrap gap-2">{opts.map((s) => <Chip key={s} on={data.services.includes(s)} onClick={() => toggle(s)}>{s}</Chip>)}</div>
      <div className="mt-7">
        <Field label="Votre signature en une phrase" hint="(facultatif)">
          <textarea maxLength={180} rows={3} value={data.signature} onChange={(e) => set({ signature: e.target.value })} placeholder="Style cinématographique, livraison J+15, équipe de 2 photographes + 1 vidéaste." className="w-full rounded-2xl bg-paper px-4 py-3 text-base leading-snug outline-none ring-1 ring-ink/8 transition placeholder:text-ink/30 focus:ring-2 focus:ring-royal-700" />
        </Field>
        <div className="mt-1 text-right font-mono text-[11px] text-ink/40">{data.signature.length} / 180</div>
      </div>
    </StepShell>
  );
}

// ── Step 7 : Capacité ──
function StepCapacity({ data, set, onNext, onBack, dir }: StepProps) {
  const tp = ((data.team - 1) / 29) * 100;
  const ep = ((data.max_events - 1) / 11) * 100;
  return (
    <StepShell step={7} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={false} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 7 / 11 · Capacité</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">Quelle est votre capacité&nbsp;?</h2>
      <p className="mt-2 text-[15px] text-ink/70">Pour ne vous envoyer que des demandes que vous pouvez honorer.</p>
      <section className="mt-8 rounded-3xl bg-paper p-5 shadow-card ring-1 ring-ink/8">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink/55">Taille de l&apos;équipe</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-4xl tabular-nums text-royal-900">{data.team === 30 ? '30+' : data.team}</span>
          <span className="text-ink/55">{data.team > 1 ? 'personnes' : 'personne'}</span>
        </div>
        <input type="range" min="1" max="30" value={data.team} onChange={(e) => set({ team: parseInt(e.target.value, 10) })} className="sama mt-4" style={pvar(tp + '%')} />
        <div className="mt-1 flex justify-between font-mono text-[10px] text-ink/40"><span>Solo</span><span>30+</span></div>
      </section>
      <section className="mt-4 rounded-3xl bg-paper p-5 shadow-card ring-1 ring-ink/8">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink/55">Mariages gérables par mois</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-4xl tabular-nums text-royal-900">{data.max_events === 12 ? '12+' : data.max_events}</span>
          <span className="text-ink/55">en parallèle</span>
        </div>
        <input type="range" min="1" max="12" value={data.max_events} onChange={(e) => set({ max_events: parseInt(e.target.value, 10) })} className="sama mt-4" style={pvar(ep + '%')} />
        <div className="mt-1 flex justify-between font-mono text-[10px] text-ink/40"><span>1</span><span>12+</span></div>
      </section>
    </StepShell>
  );
}

// ── Step 8 : Tarifs ──
const PRICE_MODELS = [
  { id: 'forfait', icon: '📦', label: 'Forfait', sub: 'Un prix tout compris' },
  { id: 'invite', icon: '👥', label: 'Par invité', sub: 'Tarif × nombre de couverts' },
  { id: 'jour', icon: '📅', label: 'Par journée', sub: 'Facturation à la prestation' },
  { id: 'devis', icon: '✍️', label: 'Sur devis', sub: 'Personnalisé à chaque demande' },
];
const PRICE_MIN = 50000;
const PRICE_MAX = 10000000;
function StepPricing({ data, set, onNext, onBack, dir }: StepProps) {
  const valid = !!data.price_model;
  const sliderToVal = (v: number) => Math.round(PRICE_MIN + (PRICE_MAX - PRICE_MIN) * (v / 100) ** 1.7);
  const valToSlider = (n: number) => Math.pow((n - PRICE_MIN) / (PRICE_MAX - PRICE_MIN), 1 / 1.7) * 100;
  const bs = valToSlider(data.price_from);
  return (
    <StepShell step={8} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 8 / 11 · Tarifs</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">À partir de combien&nbsp;?</h2>
      <p className="mt-2 text-[15px] text-ink/70">Donnez un point de départ. Vous fixez chaque devis ensuite.</p>
      <section className="mt-8 rounded-3xl bg-paper p-5 shadow-card ring-1 ring-ink/8">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink/55">Tarif de départ</div>
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="text-sm text-ink/55">à partir de</span>
          <span className="font-display text-4xl tabular-nums text-royal-900 sm:text-5xl">{fmtFCFA(data.price_from)}</span>
          <span className="font-mono text-sm text-ink/55">FCFA</span>
        </div>
        <div className="mt-1 text-[12px] text-ink/55">≈ <span className="font-mono">{fmtEUR(data.price_from)}</span></div>
        <input type="range" min="0" max="100" step="1" value={bs} onChange={(e) => set({ price_from: sliderToVal(parseFloat(e.target.value)) })} className="sama mt-4" style={pvar(bs + '%')} />
        <div className="mt-1 flex justify-between font-mono text-[10px] text-ink/40"><span>50k</span><span>10M+</span></div>
      </section>
      <div className="mt-6">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink/55">Mode de facturation</div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {PRICE_MODELS.map((m) => (
            <RadioCard key={m.id} selected={data.price_model === m.id} onClick={() => set({ price_model: m.id })} icon={m.icon} title={m.label} sub={m.sub} />
          ))}
        </div>
      </div>
    </StepShell>
  );
}

// ── Step 9 : Portfolio ──
const PORTFOLIO_TAGS = ['Élégant', 'Royal', 'Moderne', 'Traditionnel', 'Bohème', 'Glamour', 'Minimaliste', 'Coloré'];
function StepPortfolio({ data, set, onNext, onBack, dir }: StepProps) {
  const filled = data.photos.filter(Boolean).length;
  const valid = filled >= 3;
  const toggleSlot = (i: number) => { const next = [...data.photos]; next[i] = !next[i]; set({ photos: next }); };
  const toggleTag = (t: string) => set({ style_tags: data.style_tags.includes(t) ? data.style_tags.filter((x) => x !== t) : [...data.style_tags, t] });
  return (
    <StepShell step={9} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 9 / 11 · Portfolio</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">Montrez votre <em className="not-italic gold-shine">travail</em>.</h2>
      <p className="mt-2 text-[15px] text-ink/70">Ajoutez au moins 3 photos. Les profils avec 6+ photos sont 4× plus contactés.</p>
      <div className="mt-8 grid grid-cols-3 gap-2.5">
        {data.photos.map((on, i) => (
          <button key={i} type="button" onClick={() => toggleSlot(i)}
            className={'ph relative aspect-square overflow-hidden rounded-2xl transition ' + (on ? (COVERS[i] ?? 'cv-photo') + ' shadow-card ring-1 ring-royal-700/30' : 'border-2 border-dashed border-royal-700/20 bg-bone hover:border-royal-700/40 hover:bg-royal-50/50')}>
            {on ? (
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-royal-700">
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m3 8 3 3 7-7" /></svg>
                </span>
              </span>
            ) : (
              <span className="absolute inset-0 grid place-items-center text-ink/40">
                <span className="text-center">
                  <svg viewBox="0 0 24 24" className="mx-auto h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 5v14M5 12h14" /></svg>
                  <span className="mt-1 block font-mono text-[9px] uppercase tracking-widest">Photo {i + 1}</span>
                </span>
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-3 text-center font-mono text-[12px] text-ink/55">{filled} / 6 ajoutées · 3 minimum</div>
      <div className="mt-7">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink/55">Votre style en mots-clés</div>
        <div className="flex flex-wrap gap-2">{PORTFOLIO_TAGS.map((t) => <Chip key={t} on={data.style_tags.includes(t)} onClick={() => toggleTag(t)}>{t}</Chip>)}</div>
      </div>
    </StepShell>
  );
}

// ── Step 10 : Disponibilités ──
const RESP_TIMES = [
  { id: '2h', label: '< 2h', sub: 'Réactif' },
  { id: '4h', label: '< 4h', sub: 'Rapide' },
  { id: '24h', label: '< 24h', sub: 'Sous un jour' },
];
const SEASONS = ['Saison sèche (nov–mai)', 'Hivernage (juin–oct)', 'Tabaski / fêtes', 'Week-ends', 'Jours fériés'];
function StepAvailability({ data, set, onNext, onBack, dir }: StepProps) {
  const valid = !!data.resp_time;
  const toggleSeason = (s: string) => set({ seasons: data.seasons.includes(s) ? data.seasons.filter((x) => x !== s) : [...data.seasons, s] });
  return (
    <StepShell step={10} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 10 / 11 · Disponibilité</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">Vos disponibilités.</h2>
      <p className="mt-2 text-[15px] text-ink/70">Aide les mariées à savoir quand et à quelle vitesse vous répondez.</p>
      <div className="mt-8">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink/55">Délai de réponse habituel</div>
        <div className="grid grid-cols-3 gap-2.5">
          {RESP_TIMES.map((r) => (
            <button key={r.id} type="button" onClick={() => set({ resp_time: r.id })}
              className={'rounded-2xl p-4 text-center transition ' + (data.resp_time === r.id ? 'bg-paper shadow-card ring-2 ring-royal-700' : 'bg-white/60 ring-1 ring-ink/8 hover:bg-paper')}>
              <div className="font-display text-xl text-royal-900">{r.label}</div>
              <div className="mt-0.5 text-[11px] text-ink/55">{r.sub}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-7">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink/55">Périodes où vous travaillez</div>
        <div className="flex flex-wrap gap-2">{SEASONS.map((s) => <Chip key={s} on={data.seasons.includes(s)} onClick={() => toggleSeason(s)}>{s}</Chip>)}</div>
      </div>
      <div className="mt-7 space-y-2.5">
        <div className="flex items-center gap-3 rounded-2xl bg-paper p-4 shadow-card ring-1 ring-ink/8">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-bone text-xl">⚡</div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-base leading-tight text-royal-900">Devis instantané</div>
            <div className="text-[12px] text-ink/55">Réponse auto avec votre tarif de départ</div>
          </div>
          <button type="button" onClick={() => set({ instant_quote: !data.instant_quote })} className={'switch ' + (data.instant_quote ? 'on' : '')} aria-label="Devis instantané" />
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-paper p-4 shadow-card ring-1 ring-ink/8">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-bone text-xl">🌍</div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-base leading-tight text-royal-900">Mariages diaspora</div>
            <div className="text-[12px] text-ink/55">Coordination à distance avec les familles à l&apos;étranger</div>
          </div>
          <button type="button" onClick={() => set({ diaspora: !data.diaspora })} className={'switch ' + (data.diaspora ? 'on' : '')} aria-label="Diaspora" />
        </div>
      </div>
    </StepShell>
  );
}

// ── Step 11 : Vérification ──
const PAYOUTS = [
  { id: 'wave', label: 'Wave', sw: '#1DC4FF' },
  { id: 'om', label: 'Orange Money', sw: '#FF7900' },
  { id: 'free', label: 'Free Money', sw: '#CC0000' },
  { id: 'bank', label: 'Virement bancaire', sw: '#1E5631' },
];
function DocSlot({ on, onClick, icon, label }: { on: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className={'flex w-full items-center gap-3 rounded-2xl p-4 text-left transition ' + (on ? 'bg-paper shadow-card ring-2 ring-royal-700' : 'border-2 border-dashed border-royal-700/20 bg-white/60 hover:border-royal-700/40 hover:bg-paper')}>
      <div className={'grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ' + (on ? 'bg-royal-700 text-gold-100' : 'bg-bone')}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-base leading-tight text-royal-900">{label}</div>
        <div className="text-[12px] text-ink/55">{on ? 'Document ajouté ✓' : 'Toucher pour téléverser'}</div>
      </div>
      <span className={'grid h-6 w-6 place-items-center rounded-full transition ' + (on ? 'bg-royal-700 text-gold-100' : 'bg-bone text-ink/40 ring-1 ring-ink/15')}>
        {on ? <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m3 8 3 3 7-7" /></svg>
          : <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10" /></svg>}
      </span>
    </button>
  );
}
function StepVerification({ data, set, onNext, onBack, dir }: StepProps) {
  const valid = data.doc_id && !!data.payout && data.terms;
  return (
    <StepShell step={11} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Publier mon profil">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 11 / 11 · Vérification</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">Obtenez le badge <em className="not-italic gold-shine">Vérifié</em>.</h2>
      <p className="mt-2 text-[15px] text-ink/70">Les pros vérifiés apparaissent en tête et inspirent confiance.</p>
      <div className="mt-8 space-y-2.5">
        <DocSlot on={data.doc_id} onClick={() => set({ doc_id: !data.doc_id })} icon="🪪" label="Pièce d'identité (CNI ou passeport)" />
        <DocSlot on={data.doc_biz} onClick={() => set({ doc_biz: !data.doc_biz })} icon="📄" label="NINEA / Registre de commerce (facultatif)" />
      </div>
      <div className="mt-7">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink/55">Recevoir mes paiements via</div>
        <div className="grid grid-cols-2 gap-2.5">
          {PAYOUTS.map((p) => (
            <button key={p.id} type="button" onClick={() => set({ payout: p.id })}
              className={'flex items-center gap-2.5 rounded-2xl p-3.5 transition ' + (data.payout === p.id ? 'bg-paper shadow-card ring-2 ring-royal-700' : 'bg-white/60 ring-1 ring-ink/8 hover:bg-paper')}>
              <span className="h-7 w-7 shrink-0 rounded-lg" style={{ background: p.sw }} />
              <span className="text-left font-medium leading-tight text-[14px] text-royal-900">{p.label}</span>
            </button>
          ))}
        </div>
      </div>
      <label className="mt-7 flex cursor-pointer items-start gap-3">
        <input type="checkbox" className="check mt-0.5" checked={data.terms} onChange={(e) => set({ terms: e.target.checked })} />
        <span className="text-[13px] leading-relaxed text-ink/70">
          J&apos;accepte les <a href="#" className="font-semibold text-royal-700 underline">conditions prestataires</a> et la commission de 8% sur les réservations confirmées via Sama.
        </span>
      </label>
      <div className="mt-6 rounded-2xl bg-royal-50/60 p-4 text-[12px] leading-relaxed text-royal-900/80 ring-1 ring-royal-700/8">
        🔒 Vos documents sont chiffrés et ne servent qu&apos;à la vérification. Validation sous 24–48h.
      </div>
    </StepShell>
  );
}

// ── Welcome ──
function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="fade-up flex items-center gap-2.5">
          <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-royal-700 shadow-glow">
            <svg viewBox="0 0 32 32" className="h-6 w-6 text-gold-400" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z" />
              <path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z" />
              <path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3" />
            </svg>
          </span>
          <span className="font-display text-[26px] leading-none"><span className="text-royal-700">Sama</span><span className="gold-shine font-semibold">Mariage</span></span>
          <span className="ml-1 rounded-md bg-bordeaux/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-bordeaux">Pro</span>
        </div>
        <div className="relative mt-12 sm:mt-16">
          <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-br from-gold-200/60 to-bordeaux/20 blur-2xl" />
          <div className="ring-breath relative select-none font-display text-[84px] leading-none sm:text-[112px]">🤝</div>
        </div>
        <h1 className="fade-up d1 mt-8 text-balance font-display text-4xl leading-[1.05] text-royal-900 sm:text-5xl">
          Faites grandir<br />votre <em className="not-italic gold-shine">activité</em>.
        </h1>
        <p className="fade-up d2 mt-4 max-w-sm text-[15px] leading-relaxed text-ink/70 sm:text-base">
          Rejoignez la marketplace des mariages au Sénégal. <span className="text-bordeaux">Des demandes qualifiées, des paiements sécurisés.</span>
        </p>
        <button onClick={onStart} className="fade-up d3 mt-10 flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 font-medium text-[15px] text-bordeaux-900 shadow-cta ring-1 ring-gold-200/60 transition hover:from-gold-400 hover:to-gold-400 active:scale-[.99] sm:h-[60px]">
          Référencer mon activité
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
        </button>
        <a href="/pro/login" className="fade-up d3 mt-4 text-[13px] text-ink/65 hover:text-royal-800">
          Déjà référencé ? <span className="font-semibold text-royal-700">Se connecter</span>
        </a>
        <div className="fade-up d4 mt-7 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink/55">
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="8" r="6.5" /><path d="M8 4.5V8l2.5 1.5" /></svg>
          5 min · 11 étapes · sauvegarde auto · gratuit
        </div>
      </div>
    </div>
  );
}

// ── Account (utilisateur pas encore connecté) ──
function AccountStep({ data, onBack, onCreated }: { data: Data; onBack: () => void; onCreated: (email: string) => void }) {
  const [email, setEmail] = useState(data.email);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = /.+@.+\..+/.test(email) && password.length >= 10;

  async function submit() {
    setError(null);
    if (!/.+@.+\..+/.test(email)) return setError('Email invalide.');
    if (password.length < 10) return setError('Mot de passe : 10 caractères minimum.');
    setSubmitting(true);
    try {
      await api('/api/auth/signup', { method: 'POST', body: { email: email.trim(), password } });
      // On met le profil vendor de côté : il sera créé après vérif email.
      try {
        localStorage.setItem(PENDING_VENDOR, JSON.stringify(toVendorPayload(data)));
        localStorage.removeItem(STORAGE);
      } catch {
        /* non bloquant */
      }
      onCreated(email.trim());
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      setError(code === 'VALIDATION_FAILED' ? 'Vérifie l’email et le mot de passe.' : 'Création impossible. Réessaie.');
      setSubmitting(false);
    }
  }

  return (
    <StepShell step={11} dir="fwd" onBack={onBack} cta={submit} ctaDisabled={!valid || submitting} ctaLabel={submitting ? 'Création…' : 'Créer mon compte pro'}>
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Dernière étape · Votre compte</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">Créez votre <em className="not-italic gold-shine">accès pro</em>.</h2>
      <p className="mt-2 text-[15px] text-ink/70">Pour gérer vos demandes et vos paiements en sécurité.</p>
      <div className="mt-8 space-y-4">
        <Field label="Email professionnel" hint="Requis">
          <input autoFocus type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@studio-sidibe.sn" className={INPUT_CLS} />
        </Field>
        <Field label="Mot de passe" hint="10 caractères minimum">
          <div className="flex items-center rounded-2xl bg-paper ring-1 ring-ink/8 transition focus-within:ring-2 focus-within:ring-royal-700">
            <input type={showPass ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••" className="h-14 w-full bg-transparent px-4 text-lg outline-none placeholder:text-ink/30" />
            <button type="button" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Masquer' : 'Afficher'} className="grid h-14 place-items-center px-4 text-ink/55 hover:text-royal-700">
              {showPass ? '🙈' : '👁'}
            </button>
          </div>
        </Field>
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl bg-bordeaux/8 px-3.5 py-3 text-[13px] text-bordeaux ring-1 ring-bordeaux/15"><span>⚠</span><span>{error}</span></div>
        )}
        <div className="rounded-2xl bg-royal-50/60 p-4 text-[12px] leading-relaxed text-royal-900/80 ring-1 ring-royal-700/8">
          📧 On vous envoie un code de vérification par email. Votre vitrine est mise en ligne juste après.
        </div>
      </div>
    </StepShell>
  );
}

// ── Loading ──
const LOADING_MSGS = [
  'Création de votre profil pro…',
  'Mise en page de votre portfolio…',
  'Indexation dans la marketplace…',
  'Calcul de votre score de visibilité…',
  'Recherche de mariées compatibles…',
  'Vérification de vos documents…',
  'Mise en ligne de votre vitrine…',
];
function Loading({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const ti = setInterval(() => setI((x) => (x + 1) % LOADING_MSGS.length), 1100);
    const tDone = setTimeout(onDone, 5800);
    return () => { clearInterval(ti); clearTimeout(tDone); };
  }, []);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="fade-up grid h-20 w-20 place-items-center rounded-3xl bg-royal-700 shadow-glow ring-2 ring-gold-400/30">
        <svg viewBox="0 0 32 32" className="h-10 w-10 text-gold-400" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z" />
          <path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z" />
          <path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3" />
        </svg>
      </div>
      <h2 className="fade-up d1 mt-8 font-display text-3xl text-royal-900 sm:text-4xl">On met votre profil en ligne</h2>
      <div className="mt-5 flex items-center gap-2">
        <span className="l-dot h-3 w-3 rounded-full bg-gold-400" />
        <span className="l-dot d2 h-3 w-3 rounded-full bg-gold-400" />
        <span className="l-dot d3 h-3 w-3 rounded-full bg-gold-400" />
      </div>
      <div className="relative mt-8 h-6 max-w-md">
        {LOADING_MSGS.map((m, idx) => (
          <p key={idx} className={'absolute inset-0 text-[15px] text-ink/70 transition-opacity duration-500 ' + (idx === i ? 'opacity-100' : 'opacity-0')}>{m}</p>
        ))}
      </div>
    </div>
  );
}

// ── Confetti + Success ──
function Confetti() {
  const pieces = useMemo(() => {
    const colors = ['#D4A574', '#1E5631', '#722F37', '#EFD9B8', '#F4E4C1', '#B98548'];
    // déterministe (pas de Math.random : SSR-safe + lint)
    return Array.from({ length: 70 }, (_, i) => ({
      left: (i * 37) % 100,
      bg: colors[i % colors.length] as string,
      delay: (i % 12) * 0.1,
      duration: 3 + ((i * 7) % 25) / 10,
      rotate: (i * 53) % 360,
      width: 6 + ((i * 5) % 8),
      height: 10 + ((i * 3) % 12),
    }));
  }, []);
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span key={i} className="confetti" style={{ left: p.left + '%', background: p.bg, animationDelay: p.delay + 's', animationDuration: p.duration + 's', transform: `rotate(${p.rotate}deg)`, width: p.width, height: p.height }} />
      ))}
    </div>
  );
}
function Success({ data }: { data: Data }) {
  const name = data.business_name.trim() || 'Votre studio';
  const cat = CAT_LABEL[data.category] ?? 'Prestataire';
  return (
    <div className="flex min-h-screen flex-col">
      <Confetti />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="fade-up select-none text-7xl sm:text-8xl">🎉</div>
        <div className="fade-up d1 mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Profil en ligne</div>
        <h1 className="fade-up d2 mt-2 text-balance font-display text-4xl leading-[1.1] text-royal-900 sm:text-5xl">
          <em className="not-italic gold-shine">{name}</em><br />est sur SamaMariage&nbsp;!
        </h1>
        <p className="fade-up d3 mt-4 max-w-md text-[15px] leading-relaxed text-ink/70">
          Votre vitrine <strong className="text-bordeaux">{cat}</strong> est visible par les mariées. La vérification arrive sous 24–48h.
        </p>
        <div className="fade-up d3 mt-7 grid w-full max-w-sm grid-cols-3 gap-2">
          {[['1 200', 'demandes / mois'], ['8%', 'commission'], ['24h', 'vérification']].map(([n, l]) => (
            <div key={l} className="rounded-2xl bg-paper p-3 shadow-card ring-1 ring-ink/8">
              <div className="font-display text-xl text-royal-900">{n}</div>
              <div className="mt-0.5 font-mono text-[10px] uppercase leading-tight tracking-widest text-ink/55">{l}</div>
            </div>
          ))}
        </div>
        <a href="/pro/dashboard" className="fade-up d4 mt-9 flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-royal-700 font-medium text-[15px] text-gold-50 shadow-cta ring-1 ring-gold-400/40 transition hover:bg-royal-800 active:scale-[.99] sm:h-[60px]">
          Accéder à mon espace pro
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
        </a>
      </div>
    </div>
  );
}

// ── App state ──
const initial: Data = {
  category: '',
  business_name: '',
  tagline: '',
  years: 5,
  owner_name: '',
  owner_role: 'gerant',
  email: '',
  phone_country: '+221',
  phone: '',
  base_city: 'dakar',
  base_city_other: '',
  zones: ['Dakar'],
  services: [],
  signature: '',
  team: 3,
  max_events: 4,
  price_from: 500000,
  price_model: 'forfait',
  photos: [false, false, false, false, false, false],
  style_tags: [],
  resp_time: '4h',
  seasons: ['Saison sèche (nov–mai)', 'Week-ends'],
  instant_quote: true,
  diaspora: true,
  doc_id: false,
  doc_biz: false,
  payout: 'wave',
  terms: false,
};

const STEP_COMPS = [
  StepCategory, StepBusiness, StepOwner, StepContact, StepZone,
  StepServices, StepCapacity, StepPricing, StepPortfolio, StepAvailability, StepVerification,
];
const ACCOUNT_STEP = 12;
const LOADING_STEP = 13;
const SUCCESS_STEP = 14;

export default function ProOnboardingPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<'fwd' | 'bwd'>('fwd');
  const [data, setData] = useState<Data>(initial);

  // Charge l'état sauvegardé au montage (localStorage).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || 'null');
      if (saved && typeof saved === 'object') setData((d) => ({ ...d, ...saved }));
    } catch {
      /* ignore */
    }
  }, []);

  // Persiste à chaque changement.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data]);

  const set = (patch: Partial<Data>) => setData((d) => ({ ...d, ...patch }));
  const goto = (s: number, d: 'fwd' | 'bwd' = 'fwd') => { setDir(d); setStep(s); };
  const back = () => goto(Math.max(step - 1, 0), 'bwd');

  async function publishAuthed() {
    try {
      await api('/api/vendor', { method: 'PUT', body: toVendorPayload(data) });
      try {
        localStorage.removeItem(STORAGE);
      } catch {
        /* ignore */
      }
      await refresh();
      goto(LOADING_STEP, 'fwd');
    } catch {
      toast('Publication impossible, réessaie', 'error');
    }
  }

  function next() {
    if (step === TOTAL) {
      // Fin des 11 étapes : déjà connecté → publie ; sinon → étape compte.
      if (user) void publishAuthed();
      else goto(ACCOUNT_STEP, 'fwd');
      return;
    }
    goto(Math.min(step + 1, TOTAL), 'fwd');
  }

  if (step === 0) return <Welcome onStart={() => goto(1, 'fwd')} />;
  if (step === ACCOUNT_STEP) {
    return (
      <AccountStep
        data={data}
        onBack={() => goto(TOTAL, 'bwd')}
        onCreated={(email) => router.push(`/verify-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent('/pro/dashboard')}`)}
      />
    );
  }
  if (step === LOADING_STEP) return <Loading onDone={() => goto(SUCCESS_STEP, 'fwd')} />;
  if (step === SUCCESS_STEP) return <Success data={data} />;

  const Comp = STEP_COMPS[step - 1];
  if (!Comp) return <Welcome onStart={() => goto(1, 'fwd')} />;
  return <Comp data={data} set={set} onNext={next} onBack={back} dir={dir} />;
}
