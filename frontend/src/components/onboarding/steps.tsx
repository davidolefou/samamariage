'use client';

// SamaMariage — onboarding : atomes + 12 étapes (porté du design Claude).
// Composants contrôlés : tout l'état vit dans le parent (onboarding/page.tsx).

import type { ReactNode } from 'react';

export type CeremonyKey = 'takk' | 'ceet' | 'civil' | 'reception';
export type Dir = 'fwd' | 'bwd';

export interface WeddingData {
  fullName: string;
  partnerName: string;
  partnerPronouns: 'il' | 'elle' | 'autre';
  phoneCountry: string;
  phone: string;
  dateMode: 'PRECISE' | 'MONTH' | 'UNKNOWN';
  datePrecise: string;
  dateMonth: string;
  dateInMonths: number;
  city: string;
  cityOther: string;
  ceremonies: Record<CeremonyKey, boolean>;
  ceremonyDates: Record<CeremonyKey, string>;
  guests: number;
  budget: number;
  budgetSkip: boolean;
  priorities: string[];
  styles: string[];
  fabric: string;
  bridesmaids: number;
  inspirationSources: string[];
  toAvoid: string;
}

export interface StepProps {
  data: WeddingData;
  set: (patch: Partial<WeddingData>) => void;
  onNext: () => void;
  onBack: () => void;
  dir: Dir;
}

export const TOTAL = 12;

// ── Helpers ──
export const fmtFCFA = (n: number): string =>
  Math.round(n)
    .toLocaleString('fr-FR')
    .replace(/[\u202f\u00a0]/g, ' ');
export const fmtEUR = (n: number): string =>
  (n / 655.957).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
export const dayDiff = (iso: string): number | null => {
  if (!iso) return null;
  const d = new Date(iso + 'T12:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
};

// ── Atomes ──
function StepShell({
  step,
  onBack,
  children,
  cta,
  ctaDisabled,
  ctaLabel,
  dir,
}: {
  step: number;
  onBack: () => void;
  children: ReactNode;
  cta: () => void;
  ctaDisabled: boolean;
  ctaLabel: string;
  dir: Dir;
}) {
  const pct = Math.round((step / TOTAL) * 100);
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center gap-4 px-5 pt-5 sm:px-8 sm:pt-7">
        <button
          onClick={onBack}
          aria-label="Retour"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/70 text-ink/70 ring-1 ring-ink/10 backdrop-blur transition hover:bg-white"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-royal-50/70 ring-1 ring-ink/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-royal-700 via-gold-400 to-royal-700 transition-[width] duration-500 ease-out"
              style={{ width: pct + '%' }}
            />
          </div>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-royal-800/85 tabular-nums">
          {step}
          <span className="text-ink/35">/{TOTAL}</span>
        </div>
      </div>

      <div
        key={step}
        className={
          'flex-1 overflow-y-auto px-5 pb-32 pt-8 sm:px-8 sm:pt-12 ' +
          (dir === 'fwd' ? 'slide-fwd' : 'slide-bwd')
        }
      >
        <div className="mx-auto w-full max-w-[520px]">{children}</div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30">
        <div className="bg-gradient-to-t from-bone via-bone/95 to-bone/0 pb-5 pt-8 sm:pb-7">
          <div className="mx-auto w-full max-w-[520px] px-5 sm:px-8">
            <button
              onClick={cta}
              disabled={ctaDisabled}
              className={
                'flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-medium transition ' +
                (ctaDisabled
                  ? 'cursor-not-allowed bg-royal-50/80 text-royal-800/40'
                  : 'bg-royal-700 text-gold-50 shadow-cta ring-1 ring-gold-400/40 hover:bg-royal-800 active:scale-[.99]')
              }
            >
              {ctaLabel}
              {!ctaDisabled && (
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 10h12M11 5l5 5-5 5" />
                </svg>
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
  selected,
  onClick,
  icon,
  title,
  sub,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  sub: string;
  children?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={
        'block w-full rounded-2xl p-4 text-left transition ' +
        (selected
          ? 'bg-paper shadow-card ring-2 ring-royal-700'
          : 'bg-white/60 ring-1 ring-ink/10 backdrop-blur hover:bg-paper')
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            'grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ' +
            (selected ? 'bg-royal-700 text-gold-100' : 'bg-bone')
          }
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg leading-tight text-royal-900">{title}</div>
          <div className="text-[13px] text-ink/60">{sub}</div>
        </div>
        <span
          className={
            'mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full transition ' +
            (selected ? 'bg-royal-700' : 'bg-bone ring-1 ring-ink/15')
          }
        >
          {selected && <span className="h-2 w-2 rounded-full bg-gold-200" />}
        </span>
      </div>
      {children}
    </button>
  );
}

const INPUT_CLS =
  'w-full h-14 rounded-2xl bg-paper px-4 ring-1 ring-ink/10 focus:ring-2 focus:ring-royal-700 outline-none text-lg placeholder:text-ink/30 transition';

// ── Étape 1 : Identité ──
function StepIdentity({ data, set, onNext, onBack, dir }: StepProps) {
  const valid = data.fullName.trim().length >= 2;
  return (
    <StepShell step={1} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 1 / 12 · Toi</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">
        Comment t&apos;appelles-tu&nbsp;?
      </h2>
      <p className="mt-2 text-[15px] text-ink/70">On veut te connaître 😊</p>
      <div className="mt-8">
        <Field label="Prénom et nom" hint="Comme tu veux qu'on t'appelle">
          <input
            autoFocus
            type="text"
            value={data.fullName}
            onChange={(e) => set({ fullName: e.target.value })}
            placeholder="Aïssatou Diop"
            className={INPUT_CLS}
          />
        </Field>
      </div>
      <div className="mt-7 rounded-2xl bg-royal-50/60 p-4 text-[12px] leading-relaxed text-royal-900/80 ring-1 ring-royal-700/10">
        🔒 Tes données restent privées. Chiffrement bout-en-bout. Tu peux tout exporter ou supprimer en 1 clic.
      </div>
    </StepShell>
  );
}

// ── Étape 2 : Partenaire ──
const PRONOUNS: { id: WeddingData['partnerPronouns']; label: string }[] = [
  { id: 'il', label: 'Il' },
  { id: 'elle', label: 'Elle' },
  { id: 'autre', label: 'Iel · autre' },
];
function StepPartner({ data, set, onNext, onBack, dir }: StepProps) {
  const valid = data.partnerName.trim().length >= 2;
  return (
    <StepShell step={2} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 2 / 12 · Lui · Elle</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">
        Et <em className="not-italic gold-shine">ton·ta&nbsp;partenaire</em>&nbsp;?
      </h2>
      <p className="mt-2 text-[15px] text-ink/70">Pour qu&apos;on parle de vous deux, naturellement.</p>
      <div className="mt-8">
        <Field label="Prénom et nom de ton·ta partenaire" hint="Public dans tes invitations">
          <input
            autoFocus
            type="text"
            value={data.partnerName}
            onChange={(e) => set({ partnerName: e.target.value })}
            placeholder="Ousmane Diallo"
            className={INPUT_CLS}
          />
        </Field>
      </div>
      <div className="mt-6">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink/55">
          Comment je m&apos;adresse à ton·ta partenaire&nbsp;?
        </div>
        <div className="grid grid-cols-3 gap-2">
          {PRONOUNS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => set({ partnerPronouns: p.id })}
              className={
                'h-12 rounded-xl text-sm font-medium transition ' +
                (data.partnerPronouns === p.id
                  ? 'bg-royal-700 text-gold-50 shadow-card'
                  : 'bg-white/60 text-ink/75 ring-1 ring-ink/10 hover:bg-paper')
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </StepShell>
  );
}

// ── Étape 3 : Contact ──
const COUNTRIES = ['+221', '+33', '+39', '+1', '+44'];
const COUNTRY_LABEL: Record<string, string> = {
  '+221': '🇸🇳 +221',
  '+33': '🇫🇷 +33',
  '+39': '🇮🇹 +39',
  '+1': '🇺🇸 +1',
  '+44': '🇬🇧 +44',
};
function StepContact({ data, set, onNext, onBack, dir }: StepProps) {
  const valid = !data.phone || /^[0-9 +()-]{6,}$/.test(data.phone);
  return (
    <StepShell step={3} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 3 / 12 · Te joindre</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">Comment te joindre&nbsp;?</h2>
      <p className="mt-2 text-[15px] text-ink/70">Pour les rappels et le récap quotidien. Aucun spam, promis.</p>
      <div className="mt-8">
        <Field label="Téléphone (WhatsApp)" hint="Pour les rappels">
          <div className="flex gap-2">
            <select
              value={data.phoneCountry}
              onChange={(e) => set({ phoneCountry: e.target.value })}
              className="h-14 rounded-2xl bg-paper px-3 text-base outline-none ring-1 ring-ink/10 transition focus:ring-2 focus:ring-royal-700"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {COUNTRY_LABEL[c]}
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => set({ phone: e.target.value })}
              placeholder="77 000 00 00"
              className={'flex-1 ' + INPUT_CLS}
            />
          </div>
        </Field>
      </div>
      <div className="mt-7 rounded-2xl bg-royal-50/60 p-4 text-[12px] leading-relaxed text-royal-900/80 ring-1 ring-royal-700/10">
        💬 Le numéro est facultatif — tu créeras ton compte (email + mot de passe) à la fin.
      </div>
    </StepShell>
  );
}

// ── Étape 4 : Date ──
function StepDate({ data, set, onNext, onBack, dir }: StepProps) {
  const valid =
    data.dateMode === 'PRECISE'
      ? !!data.datePrecise
      : data.dateMode === 'MONTH'
        ? !!data.dateMonth
        : true;
  const diff = dayDiff(data.datePrecise);
  return (
    <StepShell step={4} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 4 / 12 · Date</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">Quand te maries-tu&nbsp;?</h2>
      <p className="mt-2 text-[15px] text-ink/70">Choisis ce qui te ressemble — tu pourras affiner plus tard.</p>
      <div className="mt-8 space-y-3">
        <RadioCard
          selected={data.dateMode === 'PRECISE'}
          onClick={() => set({ dateMode: 'PRECISE' })}
          icon="📅"
          title="J'ai une date précise"
          sub="Le grand jour est posé."
        >
          {data.dateMode === 'PRECISE' && (
            <div className="fade-up mt-3 border-t border-ink/5 pt-3">
              <input
                type="date"
                value={data.datePrecise}
                onChange={(e) => set({ datePrecise: e.target.value })}
                className="h-12 w-full rounded-xl bg-bone/60 px-3 text-base outline-none ring-1 ring-ink/10 focus:ring-2 focus:ring-royal-700"
              />
              {diff !== null && diff >= 0 && (
                <div className="mt-3 rounded-xl bg-gradient-to-r from-gold-200 to-sand px-4 py-2.5 text-sm text-bordeaux-900">
                  C&apos;est dans <strong className="font-mono">{diff}</strong> jours ! 🎉
                </div>
              )}
            </div>
          )}
        </RadioCard>
        <RadioCard
          selected={data.dateMode === 'MONTH'}
          onClick={() => set({ dateMode: 'MONTH' })}
          icon="🗓️"
          title="Un mois approximatif"
          sub="On affine ensemble plus tard."
        >
          {data.dateMode === 'MONTH' && (
            <div className="fade-up mt-3 border-t border-ink/5 pt-3">
              <input
                type="month"
                value={data.dateMonth}
                onChange={(e) => set({ dateMonth: e.target.value })}
                className="h-12 w-full rounded-xl bg-bone/60 px-3 text-base outline-none ring-1 ring-ink/10 focus:ring-2 focus:ring-royal-700"
              />
            </div>
          )}
        </RadioCard>
        <RadioCard
          selected={data.dateMode === 'UNKNOWN'}
          onClick={() => set({ dateMode: 'UNKNOWN' })}
          icon="🤔"
          title="Pas encore décidé"
          sub="Tu hésites — c'est normal."
        >
          {data.dateMode === 'UNKNOWN' && (
            <div className="fade-up mt-3 border-t border-ink/5 pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] text-ink/55">Dans environ</span>
                <span className="font-display text-2xl text-royal-900">
                  {data.dateInMonths} <span className="text-base text-ink/50">mois</span>
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={24}
                value={data.dateInMonths}
                onChange={(e) => set({ dateInMonths: parseInt(e.target.value, 10) })}
                className="sama mt-2"
                style={{ ['--p' as string]: ((data.dateInMonths - 1) / 23) * 100 + '%' }}
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-ink/40">
                <span>1 mois</span>
                <span>24 mois</span>
              </div>
            </div>
          )}
        </RadioCard>
      </div>
    </StepShell>
  );
}

// ── Étape 5 : Lieu ──
const CITIES = [
  { id: 'dakar', icon: '🏙️', label: 'Dakar', sub: 'capitale' },
  { id: 'thies', icon: '🌳', label: 'Thiès', sub: 'région' },
  { id: 'saly', icon: '🏖️', label: 'Saly / Mbour', sub: 'Petite Côte' },
  { id: 'autre', icon: '🇸🇳', label: 'Autre ville', sub: 'Saint-Louis, Touba…' },
  { id: 'diasp', icon: '🌍', label: "À l'étranger", sub: 'cérémonie hors Sénégal' },
];
function StepLocation({ data, set, onNext, onBack, dir }: StepProps) {
  const valid =
    !!data.city &&
    (data.city !== 'autre' && data.city !== 'diasp' ? true : data.cityOther.trim().length >= 2);
  return (
    <StepShell step={5} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 5 / 12 · Lieu</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">
        Où aura lieu <em className="not-italic gold-shine">le grand jour</em>&nbsp;?
      </h2>
      <p className="mt-2 text-[15px] text-ink/70">
        On adapte les recommandations à la région : prestataires, prix, traditions locales.
      </p>
      <div className="mt-8 space-y-3">
        {CITIES.map((c) => (
          <RadioCard
            key={c.id}
            selected={data.city === c.id}
            onClick={() => set({ city: c.id })}
            icon={c.icon}
            title={c.label}
            sub={c.sub}
          >
            {data.city === c.id && (c.id === 'autre' || c.id === 'diasp') && (
              <div className="fade-up mt-3 border-t border-ink/5 pt-3">
                <input
                  type="text"
                  autoFocus
                  value={data.cityOther}
                  onChange={(e) => set({ cityOther: e.target.value })}
                  placeholder={c.id === 'diasp' ? 'Paris, New York, Milan…' : 'Saint-Louis, Touba…'}
                  className="h-12 w-full rounded-xl bg-bone/60 px-3 text-base outline-none ring-1 ring-ink/10 focus:ring-2 focus:ring-royal-700"
                />
              </div>
            )}
          </RadioCard>
        ))}
      </div>
    </StepShell>
  );
}

// ── Étape 6 : Cérémonies ──
const CER_INFO: Record<CeremonyKey, { icon: string; label: string; sub: string; tt: string }> = {
  takk: { icon: '💍', label: 'Takk', sub: 'Religieuse / coutumière', tt: 'Nikkah ou union religieuse — la cérémonie officielle.' },
  ceet: { icon: '🏠', label: 'Céet', sub: 'Déménagement de la mariée', tt: 'Le déménagement traditionnel chez la belle-famille.' },
  civil: { icon: '📜', label: 'Mariage civil', sub: 'À la mairie', tt: "L'enregistrement civil — facultatif au Sénégal." },
  reception: { icon: '✨', label: 'Réception', sub: 'La grande fête', tt: 'La réception : invités, traiteur, danse, ndawtal.' },
};
const CER_KEYS: CeremonyKey[] = ['takk', 'ceet', 'civil', 'reception'];
function StepCeremonies({ data, set, onNext, onBack, dir }: StepProps) {
  const anySelected = CER_KEYS.some((k) => data.ceremonies[k]);
  return (
    <StepShell step={6} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!anySelected} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 6 / 12 · Cérémonies</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">
        Quelles cérémonies prévois-tu&nbsp;?
      </h2>
      <p className="mt-2 text-[15px] text-ink/70">Tu peux en cocher plusieurs.</p>
      <div className="mt-8 space-y-3">
        {CER_KEYS.map((key) => {
          const info = CER_INFO[key];
          const on = data.ceremonies[key];
          return (
            <div
              key={key}
              className={
                'rounded-2xl p-4 transition ' +
                (on ? 'bg-paper shadow-card ring-2 ring-royal-700' : 'bg-white/60 ring-1 ring-ink/10 backdrop-blur')
              }
            >
              <div className="flex items-center gap-3">
                <div
                  className={
                    'grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ' +
                    (on ? 'bg-royal-700 text-gold-100' : 'bg-bone')
                  }
                >
                  {info.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <div className="font-display text-lg leading-tight text-royal-900">{info.label}</div>
                    <span
                      className="tt grid h-5 w-5 cursor-help place-items-center rounded-full bg-bone font-mono text-[10px] text-ink/60"
                      data-tt={info.tt}
                    >
                      ⓘ
                    </span>
                  </div>
                  <div className="text-[13px] text-ink/60">{info.sub}</div>
                </div>
                <button
                  type="button"
                  aria-label={'Activer ' + info.label}
                  onClick={() => set({ ceremonies: { ...data.ceremonies, [key]: !on } })}
                  className={'switch ' + (on ? 'on' : '')}
                />
              </div>
              {on && (
                <div className="fade-up mt-3 border-t border-ink/5 pt-3">
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink/55">Date prévue</span>
                    <input
                      type="date"
                      value={data.ceremonyDates[key]}
                      onChange={(e) => set({ ceremonyDates: { ...data.ceremonyDates, [key]: e.target.value } })}
                      className="mt-1.5 h-11 w-full rounded-xl bg-bone/60 px-3 text-sm outline-none ring-1 ring-ink/10 focus:ring-2 focus:ring-royal-700"
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </StepShell>
  );
}

// ── Étape 7 : Invités ──
const GUESTS_MIN = 50;
const GUESTS_MAX = 2000;
function StepGuests({ data, set, onNext, onBack, dir }: StepProps) {
  const valid = data.guests >= GUESTS_MIN;
  const gp = ((data.guests - GUESTS_MIN) / (GUESTS_MAX - GUESTS_MIN)) * 100;
  const quick = [200, 400, 600, 800, 1000];
  return (
    <StepShell step={7} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 7 / 12 · Le monde</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">Combien d&apos;invités&nbsp;?</h2>
      <p className="mt-2 text-[15px] text-ink/70">Au total, toutes cérémonies confondues. Tu pourras ajuster plus tard.</p>
      <section className="mt-8 rounded-3xl bg-paper p-5 shadow-card ring-1 ring-ink/10">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink/55">Invités au total</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-5xl text-royal-900 tabular-nums sm:text-6xl">{data.guests}</span>
          <span className="text-ink/55">personnes</span>
        </div>
        <input
          type="range"
          min={GUESTS_MIN}
          max={GUESTS_MAX}
          step={10}
          value={data.guests}
          onChange={(e) => set({ guests: parseInt(e.target.value, 10) })}
          className="sama mt-4"
          style={{ ['--p' as string]: gp + '%' }}
        />
        <div className="mt-1 flex justify-between font-mono text-[10px] text-ink/40">
          <span>{GUESTS_MIN}</span>
          <span>{GUESTS_MAX}+</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {quick.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => set({ guests: q })}
              className={
                'rounded-full px-3 py-1.5 font-mono text-[12px] transition ' +
                (data.guests === q
                  ? 'bg-royal-700 text-gold-50'
                  : 'bg-bone text-ink/75 ring-1 ring-ink/10 hover:bg-royal-50')
              }
            >
              {q}
            </button>
          ))}
        </div>
      </section>
      <div className="mt-5 text-[12px] leading-relaxed text-ink/55">
        💡 Au Sénégal, les invités du mariage sont en général 2 à 4× plus nombreux qu&apos;en Europe. Ne te restreins pas.
      </div>
    </StepShell>
  );
}

// ── Étape 8 : Budget ──
const BUDGET_MIN = 1_000_000;
const BUDGET_MAX = 100_000_000;
function StepBudget({ data, set, onNext, onBack, dir }: StepProps) {
  const valid = data.budgetSkip || data.budget >= BUDGET_MIN;
  const bSliderToVal = (v: number) => Math.round(BUDGET_MIN + (BUDGET_MAX - BUDGET_MIN) * (v / 100) ** 1.6);
  const bValToSlider = (n: number) => Math.pow((n - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN), 1 / 1.6) * 100;
  const bs = bValToSlider(data.budget);
  return (
    <StepShell step={8} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 8 / 12 · L&apos;enveloppe</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">Ton budget approximatif&nbsp;?</h2>
      <p className="mt-2 text-[15px] text-ink/70">Sois honnête — ça reste entre toi et l&apos;IA. On t&apos;aidera à optimiser.</p>
      <section className="mt-8 rounded-3xl bg-paper p-5 shadow-card ring-1 ring-ink/10">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/55">Budget total</div>
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-ink/65">
            <button
              type="button"
              className={'switch ' + (data.budgetSkip ? 'on' : '')}
              onClick={() => set({ budgetSkip: !data.budgetSkip })}
              aria-label="Ne pas dire le budget"
            />
            <span>Je préfère ne pas dire</span>
          </label>
        </div>
        <div className={'mt-2 transition ' + (data.budgetSkip ? 'pointer-events-none opacity-30' : '')}>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-display text-4xl text-royal-900 tabular-nums sm:text-5xl">{fmtFCFA(data.budget)}</span>
            <span className="font-mono text-sm text-ink/55">FCFA</span>
          </div>
          <div className="mt-1 text-[12px] text-ink/55">
            ≈ <span className="font-mono">{fmtEUR(data.budget)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={bs}
            onChange={(e) => set({ budget: bSliderToVal(parseFloat(e.target.value)) })}
            className="sama mt-4"
            style={{ ['--p' as string]: bs + '%' }}
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-ink/40">
            <span>1M</span>
            <span>100M+</span>
          </div>
        </div>
      </section>
      <div className="mt-5 rounded-2xl bg-bordeaux/8 px-4 py-3 text-[13px] leading-relaxed text-bordeaux-900/85 ring-1 ring-bordeaux/15">
        <strong>Pas d&apos;inquiétude.</strong> Sama IA t&apos;aidera à éviter les pièges classiques (dépassement déco, traiteur, etc).
      </div>
    </StepShell>
  );
}

// ── Étape 9 : Priorités ──
const PRIORITY_OPTS = [
  { id: 'lieu', icon: '🏛️', label: 'Lieu / réception' },
  { id: 'food', icon: '🍽️', label: 'Traiteur & menu' },
  { id: 'photo', icon: '📸', label: 'Photographe & vidéo' },
  { id: 'decor', icon: '💐', label: 'Décoration' },
  { id: 'tenues', icon: '👗', label: 'Tenues & look' },
  { id: 'anim', icon: '🎵', label: 'Animation / DJ' },
];
function StepPriorities({ data, set, onNext, onBack, dir }: StepProps) {
  const valid = data.priorities.length === 3;
  function toggle(id: string) {
    const cur = data.priorities;
    if (cur.includes(id)) set({ priorities: cur.filter((x) => x !== id) });
    else if (cur.length < 3) set({ priorities: [...cur, id] });
  }
  return (
    <StepShell step={9} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 9 / 12 · Priorités</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">Ton top 3, dans l&apos;ordre.</h2>
      <p className="mt-2 text-[15px] text-ink/70">
        L&apos;IA donnera plus de budget et d&apos;attention à ces postes. Clique pour ranger.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-2.5">
        {PRIORITY_OPTS.map((p) => {
          const rank = data.priorities.indexOf(p.id) + 1;
          const sel = rank > 0;
          const rankColor =
            rank === 1
              ? 'bg-gold-400 text-bordeaux-900'
              : rank === 2
                ? 'bg-royal-700 text-gold-50'
                : rank === 3
                  ? 'bg-bordeaux text-gold-50'
                  : '';
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={
                'relative rounded-2xl p-4 text-left transition ' +
                (sel
                  ? 'bg-paper shadow-card ring-2 ring-royal-700'
                  : data.priorities.length >= 3
                    ? 'bg-white/40 text-ink/45 ring-1 ring-ink/10'
                    : 'bg-white/60 ring-1 ring-ink/10 hover:bg-paper')
              }
            >
              <div className="text-2xl">{p.icon}</div>
              <div className="mt-2 font-display text-base leading-tight text-royal-900">{p.label}</div>
              {sel && (
                <span
                  className={
                    'absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full font-display text-base ring-2 ring-bone ' +
                    rankColor
                  }
                >
                  {rank}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-5 text-center font-mono text-[12px] text-ink/55">{data.priorities.length} / 3 sélectionnés</div>
    </StepShell>
  );
}

// ── Étape 10 : Styles ──
const STYLES = [
  { id: 'trad', label: 'Traditionnel sénégalais', emoji: '🌟', bg: 'from-royal-700 to-royal-900', fg: 'text-gold-100' },
  { id: 'royal', label: 'Royal moderne', emoji: '👑', bg: 'from-bordeaux to-bordeaux-900', fg: 'text-gold-100' },
  { id: 'boho', label: 'Bohème champêtre', emoji: '🌿', bg: 'from-sand to-gold-400', fg: 'text-bordeaux-900' },
  { id: 'mini', label: 'Minimaliste élégant', emoji: '⚪', bg: 'from-bone to-royal-50', fg: 'text-royal-900' },
  { id: 'fusion', label: 'Fusion afro-occidentale', emoji: '🌍', bg: 'from-gold-600 via-bordeaux to-royal-900', fg: 'text-gold-100' },
  { id: 'glam', label: 'Glamour Hollywood', emoji: '✨', bg: 'from-royal-900 via-bordeaux to-gold-400', fg: 'text-gold-100' },
];
function StepStyles({ data, set, onNext, onBack, dir }: StepProps) {
  const valid = data.styles.length >= 1;
  function toggle(id: string) {
    set({ styles: data.styles.includes(id) ? data.styles.filter((x) => x !== id) : [...data.styles, id] });
  }
  return (
    <StepShell step={10} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 10 / 12 · Style</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">Quel style te ressemble&nbsp;?</h2>
      <p className="mt-2 text-[15px] text-ink/70">Choisis-en au moins 1 (ou plusieurs).</p>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {STYLES.map((s) => {
          const sel = data.styles.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className={
                'sty-card relative aspect-[3/4] overflow-hidden rounded-3xl bg-gradient-to-br p-4 text-left ' +
                s.bg +
                ' ' +
                s.fg +
                (sel ? ' sel' : '')
              }
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, rgba(255,255,255,.18) 1px, transparent 1.4px)',
                  backgroundSize: '12px 12px',
                }}
              />
              <div className="relative flex h-full flex-col justify-between">
                <div className="text-3xl">{s.emoji}</div>
                <div>
                  <div className="font-display text-[17px] leading-tight">{s.label}</div>
                  {sel && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 font-mono text-[10px] backdrop-blur">
                      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="m3 8 3 3 7-7" />
                      </svg>
                      choisi
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-6 text-center font-mono text-[12px] text-ink/55">
        {data.styles.length} sélectionné{data.styles.length > 1 ? 's' : ''}
      </div>
    </StepShell>
  );
}

// ── Étape 11 : Tenues / ndaxal ──
const FABRICS = [
  { id: 'bazin', label: 'Bazin riche', sw: ['#1B2A4E', '#0E1A38', '#D4A574'] },
  { id: 'wax', label: 'Wax / pagne', sw: ['#D4A574', '#722F37', '#1E5631'] },
  { id: 'dentelle', label: 'Dentelle', sw: ['#FAF7F2', '#F4E4C1', '#D4A574'] },
  { id: 'brode', label: 'Brodé or', sw: ['#722F37', '#D4A574', '#FBF4EA'] },
  { id: 'soie', label: 'Soie / satin', sw: ['#FBF4EA', '#EFD9B8', '#D4A574'] },
];
function StepOutfits({ data, set, onNext, onBack, dir }: StepProps) {
  const valid = !!data.fabric;
  const bp = ((data.bridesmaids - 1) / 29) * 100;
  return (
    <StepShell step={11} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 11 / 12 · Tenues</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">
        Tes <em className="not-italic gold-shine">tenues</em>, ton <em className="not-italic">ndaxal</em>.
      </h2>
      <p className="mt-2 text-[15px] text-ink/70">Tissu vedette + nombre de demoiselles d&apos;honneur.</p>
      <section className="mt-7">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink/55">Tissu vedette</div>
        <div className="grid grid-cols-1 gap-2">
          {FABRICS.map((f) => {
            const sel = data.fabric === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => set({ fabric: f.id })}
                className={
                  'flex items-center gap-3 rounded-2xl p-3 transition ' +
                  (sel ? 'bg-paper shadow-card ring-2 ring-royal-700' : 'bg-white/60 ring-1 ring-ink/10 hover:bg-paper')
                }
              >
                <div className="flex h-10 w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-ink/10">
                  {f.sw.map((c, i) => (
                    <span key={i} className="flex-1" style={{ background: c }} />
                  ))}
                </div>
                <div className="font-display text-base text-royal-900">{f.label}</div>
                <span
                  className={
                    'ml-auto grid h-5 w-5 place-items-center rounded-full transition ' +
                    (sel ? 'bg-royal-700' : 'bg-bone ring-1 ring-ink/15')
                  }
                >
                  {sel && <span className="h-2 w-2 rounded-full bg-gold-200" />}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <section className="mt-6 rounded-3xl bg-paper p-5 shadow-card ring-1 ring-ink/10">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink/55">Demoiselles d&apos;honneur (ndaxal)</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-4xl text-royal-900 tabular-nums">{data.bridesmaids}</span>
          <span className="text-ink/55">amies coordonnées</span>
        </div>
        <input
          type="range"
          min={1}
          max={30}
          value={data.bridesmaids}
          onChange={(e) => set({ bridesmaids: parseInt(e.target.value, 10) })}
          className="sama mt-4"
          style={{ ['--p' as string]: bp + '%' }}
        />
        <div className="mt-1 flex justify-between font-mono text-[10px] text-ink/40">
          <span>1</span>
          <span>30</span>
        </div>
      </section>
    </StepShell>
  );
}

// ── Étape 12 : Inspiration ──
const SOURCES = [
  { id: 'tiktok', label: '🎵 TikTok' },
  { id: 'pinterest', label: '📌 Pinterest' },
  { id: 'instagram', label: '📷 Instagram' },
  { id: 'irl', label: '👰 Un mariage récent' },
  { id: 'magazine', label: '📖 Magazines' },
  { id: 'famille', label: '🏡 Famille / amies' },
];
function StepInspiration({ data, set, onNext, onBack, dir }: StepProps) {
  const valid = data.inspirationSources.length >= 1;
  function toggleSrc(id: string) {
    set({
      inspirationSources: data.inspirationSources.includes(id)
        ? data.inspirationSources.filter((x) => x !== id)
        : [...data.inspirationSources, id],
    });
  }
  return (
    <StepShell step={12} dir={dir} onBack={onBack} cta={onNext} ctaDisabled={!valid} ctaLabel="Terminer">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Étape 12 / 12 · Inspiration</div>
      <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">
        D&apos;où vient ton <em className="not-italic gold-shine">inspiration</em>&nbsp;?
      </h2>
      <p className="mt-2 text-[15px] text-ink/70">Coche tout ce qui colle. L&apos;IA s&apos;en sert pour ton mood board.</p>
      <div className="mt-7">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink/55">Sources</div>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((s) => {
            const on = data.inspirationSources.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSrc(s.id)}
                className={
                  'rounded-full px-4 py-2.5 text-[13px] font-medium transition ' +
                  (on ? 'bg-royal-700 text-gold-50 shadow-card' : 'bg-white/60 text-ink/75 ring-1 ring-ink/10 hover:bg-paper')
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-7">
        <Field label="Une chose à éviter absolument" hint="(facultatif, max 200 car.)">
          <textarea
            maxLength={200}
            rows={3}
            value={data.toAvoid}
            onChange={(e) => set({ toAvoid: e.target.value })}
            placeholder="Ex : pas de couleurs flashy, pas de musique au-delà de minuit…"
            className="w-full rounded-2xl bg-paper px-4 py-3 text-base leading-snug outline-none ring-1 ring-ink/10 transition placeholder:text-ink/30 focus:ring-2 focus:ring-royal-700"
          />
        </Field>
        <div className="mt-1 text-right font-mono text-[11px] text-ink/40">{data.toAvoid.length} / 200</div>
      </div>
      <div className="mt-7 rounded-2xl bg-royal-50/60 p-4 text-[12px] leading-relaxed text-royal-900/80 ring-1 ring-royal-700/10">
        Dernière étape ! En cliquant <strong>Terminer</strong>, tu crées ton compte et l&apos;IA prépare ton univers.
      </div>
    </StepShell>
  );
}

export const STEP_COMPONENTS = [
  StepIdentity,
  StepPartner,
  StepContact,
  StepDate,
  StepLocation,
  StepCeremonies,
  StepGuests,
  StepBudget,
  StepPriorities,
  StepStyles,
  StepOutfits,
  StepInspiration,
];

export const INITIAL_DATA: WeddingData = {
  fullName: '',
  partnerName: '',
  partnerPronouns: 'il',
  phoneCountry: '+221',
  phone: '',
  dateMode: 'PRECISE',
  datePrecise: '',
  dateMonth: '',
  dateInMonths: 6,
  city: 'dakar',
  cityOther: '',
  ceremonies: { takk: true, ceet: true, civil: false, reception: true },
  ceremonyDates: { takk: '', ceet: '', civil: '', reception: '' },
  guests: 450,
  budget: 12_000_000,
  budgetSkip: false,
  priorities: [],
  styles: [],
  fabric: 'bazin',
  bridesmaids: 12,
  inspirationSources: [],
  toAvoid: '',
};
