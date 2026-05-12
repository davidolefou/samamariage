'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'

// ── Helpers ──
const fmtFCFA = (n: number) =>
  Math.round(n).toLocaleString('fr-FR').replace(/[  ]/g, ' ')
const fmtEUR = (n: number) =>
  (n / 655.957).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
const dayDiff = (iso: string) => {
  if (!iso) return null
  const d = new Date(iso + 'T12:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

// ── Types ──
type Screen = 'welcome' | number | 'loading' | 'success'
interface OState {
  full_name: string
  partner_name: string
  partner_pronouns: 'il' | 'elle' | 'autre'
  email: string
  phone_country: string
  phone: string
  date_mode: 'precise' | 'month' | 'unknown'
  date_precise: string
  date_month: string
  date_in_months: number
  city: string
  city_other: string
  ceremonies: Record<string, boolean>
  ceremony_dates: Record<string, string>
  guests: number
  budget: number
  budget_skip: boolean
  priorities: string[]
  styles: string[]
  fabric: string
  bridesmaids: number
  inspiration_sources: string[]
  to_avoid: string
}

const STORAGE = 'sama:onboarding:v3'
const INITIAL: OState = {
  full_name: '', partner_name: '', partner_pronouns: 'il',
  email: '', phone_country: '+221', phone: '',
  date_mode: 'precise', date_precise: '', date_month: '', date_in_months: 6,
  city: 'dakar', city_other: '',
  ceremonies: { takk: true, ceet: true, civil: false, reception: true },
  ceremony_dates: { takk: '', ceet: '', civil: '', reception: '' },
  guests: 450, budget: 12_000_000, budget_skip: false,
  priorities: [], styles: [], fabric: 'bazin', bridesmaids: 12,
  inspiration_sources: [], to_avoid: '',
}

const TOTAL = 12
const INPUT = 'w-full h-14 rounded-2xl bg-white px-4 ring-1 focus:ring-2 focus:ring-[#1E5631] outline-none text-lg placeholder:text-[rgba(61,61,61,.3)] transition'
const INPUT_RING = 'ring-[rgba(61,61,61,.08)]'

// ── StepShell ──
function StepShell({ step, dir, onBack, onNext, ctaDisabled, ctaLabel, children }: {
  step: number; dir: 'fwd' | 'bwd'; onBack: () => void; onNext: () => void
  ctaDisabled: boolean; ctaLabel: string; children: React.ReactNode
}) {
  const pct = Math.round((step / TOTAL) * 100)
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="px-5 sm:px-8 pt-5 sm:pt-7 flex items-center gap-4">
        <button onClick={onBack} aria-label="Retour"
          className="grid h-10 w-10 place-items-center rounded-full ring-1 transition hover:bg-white"
          style={{ background: 'rgba(255,255,255,.7)', backdropFilter: 'blur(8px)', outlineColor: 'rgba(61,61,61,.08)', color: 'rgba(61,61,61,.7)' }}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 5l14 14M19 5L5 19"/></svg>
        </button>
        <div className="flex-1">
          <div className="h-1.5 rounded-full overflow-hidden ring-1" style={{ background: 'rgba(234,241,236,.7)', outlineColor: 'rgba(61,61,61,.05)' }}>
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #1E5631, #D4A574, #1E5631)' }} />
          </div>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest tabular-nums" style={{ fontFamily: 'Georgia', color: 'rgba(30,86,49,.85)' }}>
          {step}<span style={{ color: 'rgba(61,61,61,.35)' }}>/{TOTAL}</span>
        </div>
      </div>

      {/* Content */}
      <div key={step} className={`flex-1 overflow-y-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-32 ${dir === 'fwd' ? 'slide-fwd' : 'slide-bwd'}`}
        style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="mx-auto w-full max-w-[520px]">{children}</div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 pointer-events-none">
        <div className="pt-8 pb-5 sm:pb-7" style={{ background: 'linear-gradient(to top, #FAF7F2 60%, rgba(250,247,242,0) 100%)' }}>
          <div className="mx-auto w-full max-w-[520px] px-5 sm:px-8 pointer-events-auto">
            <button onClick={onNext} disabled={ctaDisabled}
              className="w-full h-14 rounded-2xl font-medium text-[15px] transition flex items-center justify-center gap-2 active:scale-[.99]"
              style={ctaDisabled
                ? { background: 'rgba(234,241,236,.8)', color: 'rgba(30,86,49,.4)', cursor: 'not-allowed' }
                : { background: '#1E5631', color: '#F7E9CF', boxShadow: '0 18px 40px -16px rgba(30,86,49,.5)', outline: '1px solid rgba(212,165,116,.4)' }}>
              {ctaLabel}
              {!ctaDisabled && <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RadioCard({ selected, onClick, icon, title, sub, children }: {
  selected: boolean; onClick: () => void; icon: string; title: string; sub: string; children?: React.ReactNode
}) {
  return (
    <button onClick={onClick} type="button" className="block w-full text-left rounded-2xl p-4 transition"
      style={selected
        ? { background: 'white', outline: '2px solid #1E5631', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 12px 32px -16px rgba(61,61,61,.18)' }
        : { background: 'rgba(255,255,255,.6)', backdropFilter: 'blur(8px)', outline: '1px solid rgba(61,61,61,.08)' }}>
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl"
          style={{ background: selected ? '#1E5631' : '#FAF7F2', color: selected ? '#F7E9CF' : undefined }}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg leading-tight" style={{ color: '#0E2916' }}>{title}</div>
          <div className="text-[13px]" style={{ color: 'rgba(61,61,61,.6)' }}>{sub}</div>
        </div>
        <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full transition"
          style={{ background: selected ? '#1E5631' : '#FAF7F2', outline: selected ? 'none' : '1px solid rgba(61,61,61,.15)' }}>
          {selected && <span className="h-2 w-2 rounded-full" style={{ background: '#EFD9B8' }} />}
        </span>
      </div>
      {children}
    </button>
  )
}

// ── Step 1: Identité ──
function Step1({ data, set, onNext, onBack, dir }: { data: OState; set: (p: Partial<OState>) => void; onNext: () => void; onBack: () => void; dir: 'fwd' | 'bwd' }) {
  return (
    <StepShell step={1} dir={dir} onBack={onBack} onNext={onNext} ctaDisabled={data.full_name.trim().length < 2} ctaLabel="Continuer">
      <div className="text-[11px] uppercase tracking-[.2em]" style={{ fontFamily: 'Georgia', color: '#722F37' }}>Étape 1 / 12 · Toi</div>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl leading-[1.1]" style={{ color: '#0E2916' }}>Comment t&apos;appelles-tu&nbsp;?</h2>
      <p className="mt-2 text-[15px]" style={{ color: 'rgba(61,61,61,.7)' }}>On veut te connaître <span>😊</span></p>
      <div className="mt-8">
        <label className="block">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-[11px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.55)' }}>Prénom et nom</span>
            <span className="text-[11px]" style={{ color: 'rgba(61,61,61,.45)' }}>Comme tu veux qu&apos;on t&apos;appelle</span>
          </div>
          <input autoFocus type="text" value={data.full_name} onChange={e => set({ full_name: e.target.value })}
            placeholder="Aïssatou Diop" className={`${INPUT} ${INPUT_RING}`} onKeyDown={e => e.key === 'Enter' && data.full_name.trim().length >= 2 && onNext()} />
        </label>
      </div>
      <div className="mt-7 rounded-2xl p-4 text-[12px] leading-relaxed" style={{ background: 'rgba(234,241,236,.6)', outline: '1px solid rgba(30,86,49,.08)', color: 'rgba(14,41,22,.8)' }}>
        🔒 Tes données restent privées. Chiffrement bout-en-bout. Tu peux tout exporter ou supprimer en 1 clic.
      </div>
    </StepShell>
  )
}

// ── Step 2: Partenaire ──
function Step2({ data, set, onNext, onBack, dir }: { data: OState; set: (p: Partial<OState>) => void; onNext: () => void; onBack: () => void; dir: 'fwd' | 'bwd' }) {
  return (
    <StepShell step={2} dir={dir} onBack={onBack} onNext={onNext} ctaDisabled={data.partner_name.trim().length < 2} ctaLabel="Continuer">
      <div className="text-[11px] uppercase tracking-[.2em]" style={{ fontFamily: 'Georgia', color: '#722F37' }}>Étape 2 / 12 · Lui · Elle</div>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl leading-[1.1]" style={{ color: '#0E2916' }}>
        Et <em className="not-italic gold-shine">ton·ta&nbsp;partenaire</em>&nbsp;?
      </h2>
      <p className="mt-2 text-[15px]" style={{ color: 'rgba(61,61,61,.7)' }}>Pour qu&apos;on parle de vous deux, naturellement.</p>
      <div className="mt-8">
        <label className="block">
          <span className="text-[11px] uppercase tracking-widest mb-1.5 block" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.55)' }}>Prénom et nom de ton·ta partenaire</span>
          <input autoFocus type="text" value={data.partner_name} onChange={e => set({ partner_name: e.target.value })}
            placeholder="Ousmane Diallo" className={`${INPUT} ${INPUT_RING}`} onKeyDown={e => e.key === 'Enter' && data.partner_name.trim().length >= 2 && onNext()} />
        </label>
      </div>
      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-widest mb-2" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.55)' }}>Comment je m&apos;adresse à ton·ta partenaire&nbsp;?</div>
        <div className="grid grid-cols-3 gap-2">
          {(['il', 'elle', 'autre'] as const).map(p => (
            <button key={p} type="button" onClick={() => set({ partner_pronouns: p })}
              className="h-12 rounded-xl text-sm font-medium transition"
              style={data.partner_pronouns === p
                ? { background: '#1E5631', color: '#F7E9CF', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 12px 32px -16px rgba(61,61,61,.18)' }
                : { background: 'rgba(255,255,255,.6)', outline: '1px solid rgba(61,61,61,.08)', color: 'rgba(61,61,61,.75)' }}>
              {p === 'autre' ? 'Iel · autre' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </StepShell>
  )
}

// ── Step 3: Contact ──
function Step3({ data, set, onNext, onBack, dir }: { data: OState; set: (p: Partial<OState>) => void; onNext: () => void; onBack: () => void; dir: 'fwd' | 'bwd' }) {
  const valid = !data.phone || /^[0-9 +()-]{6,}$/.test(data.phone)
  return (
    <StepShell step={3} dir={dir} onBack={onBack} onNext={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="text-[11px] uppercase tracking-[.2em]" style={{ fontFamily: 'Georgia', color: '#722F37' }}>Étape 3 / 12 · Te joindre</div>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl leading-[1.1]" style={{ color: '#0E2916' }}>Comment te joindre&nbsp;?</h2>
      <p className="mt-2 text-[15px]" style={{ color: 'rgba(61,61,61,.7)' }}>Pour les rappels et le récap quotidien. Aucun spam, promis.</p>
      <div className="mt-8 space-y-4">
        <label className="block">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-[11px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.55)' }}>Email</span>
            <span className="text-[11px]" style={{ color: 'rgba(61,61,61,.45)' }}>(facultatif)</span>
          </div>
          <input type="email" value={data.email} onChange={e => set({ email: e.target.value })}
            placeholder="aissatou@gmail.com" className={`${INPUT} ${INPUT_RING}`} />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-widest mb-1.5 block" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.55)' }}>Téléphone (WhatsApp)</span>
          <div className="flex gap-2">
            <select value={data.phone_country} onChange={e => set({ phone_country: e.target.value })}
              className="h-14 rounded-2xl bg-white px-3 ring-1 focus:ring-2 focus:ring-[#1E5631] outline-none text-base" style={{ outlineColor: 'rgba(61,61,61,.08)' }}>
              <option value="+221">🇸🇳 +221</option>
              <option value="+33">🇫🇷 +33</option>
              <option value="+39">🇮🇹 +39</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+44">🇬🇧 +44</option>
            </select>
            <input type="tel" value={data.phone} onChange={e => set({ phone: e.target.value })}
              placeholder="77 000 00 00" className={`flex-1 ${INPUT} ${INPUT_RING}`} />
          </div>
        </label>
      </div>
    </StepShell>
  )
}

// ── Step 4: Date ──
function Step4({ data, set, onNext, onBack, dir }: { data: OState; set: (p: Partial<OState>) => void; onNext: () => void; onBack: () => void; dir: 'fwd' | 'bwd' }) {
  const valid = data.date_mode === 'precise' ? !!data.date_precise : data.date_mode === 'month' ? !!data.date_month : true
  const diff = dayDiff(data.date_precise)
  const monthsPct = (data.date_in_months - 1) / 23 * 100
  return (
    <StepShell step={4} dir={dir} onBack={onBack} onNext={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="text-[11px] uppercase tracking-[.2em]" style={{ fontFamily: 'Georgia', color: '#722F37' }}>Étape 4 / 12 · Date</div>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl leading-[1.1]" style={{ color: '#0E2916' }}>Quand te maries-tu&nbsp;?</h2>
      <p className="mt-2 text-[15px]" style={{ color: 'rgba(61,61,61,.7)' }}>Choisis ce qui te ressemble — tu pourras affiner plus tard.</p>
      <div className="mt-8 space-y-3">
        <RadioCard selected={data.date_mode === 'precise'} onClick={() => set({ date_mode: 'precise' })} icon="📅" title="J'ai une date précise" sub="Le grand jour est posé.">
          {data.date_mode === 'precise' && (
            <div className="mt-3 pt-3 fade-up" style={{ borderTop: '1px solid rgba(61,61,61,.05)' }}>
              <input type="date" value={data.date_precise} onChange={e => set({ date_precise: e.target.value })}
                className="w-full h-12 rounded-xl px-3 ring-1 focus:ring-2 focus:ring-[#1E5631] outline-none text-base" style={{ background: 'rgba(250,247,242,.6)', outlineColor: 'rgba(61,61,61,.08)' }} />
              {diff !== null && diff >= 0 && (
                <div className="mt-3 rounded-xl px-4 py-2.5 text-sm fade-up" style={{ background: 'linear-gradient(90deg, #EFD9B8, #F4E4C1)', color: '#3D181C' }}>
                  C&apos;est dans <strong style={{ fontFamily: 'Georgia' }}>{diff}</strong> jours ! <span>🎉</span>
                </div>
              )}
            </div>
          )}
        </RadioCard>
        <RadioCard selected={data.date_mode === 'month'} onClick={() => set({ date_mode: 'month' })} icon="🗓️" title="Un mois approximatif" sub="On affine ensemble plus tard.">
          {data.date_mode === 'month' && (
            <div className="mt-3 pt-3 fade-up" style={{ borderTop: '1px solid rgba(61,61,61,.05)' }}>
              <input type="month" value={data.date_month} onChange={e => set({ date_month: e.target.value })}
                className="w-full h-12 rounded-xl px-3 ring-1 focus:ring-2 focus:ring-[#1E5631] outline-none text-base" style={{ background: 'rgba(250,247,242,.6)', outlineColor: 'rgba(61,61,61,.08)' }} />
            </div>
          )}
        </RadioCard>
        <RadioCard selected={data.date_mode === 'unknown'} onClick={() => set({ date_mode: 'unknown' })} icon="🤔" title="Pas encore décidé" sub="Tu hésites — c'est normal.">
          {data.date_mode === 'unknown' && (
            <div className="mt-3 pt-3 fade-up" style={{ borderTop: '1px solid rgba(61,61,61,.05)' }}>
              <div className="flex items-baseline justify-between">
                <span className="text-[12px]" style={{ color: 'rgba(61,61,61,.55)' }}>Dans environ</span>
                <span className="font-display text-2xl" style={{ color: '#0E2916' }}>{data.date_in_months} <span className="text-base" style={{ color: 'rgba(61,61,61,.5)' }}>mois</span></span>
              </div>
              <input type="range" min="1" max="24" value={data.date_in_months}
                onChange={e => set({ date_in_months: parseInt(e.target.value, 10) })}
                className="sama mt-2" style={{ '--p': `${monthsPct}%` } as React.CSSProperties} />
              <div className="mt-1 flex justify-between font-mono text-[10px]" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.4)' }}><span>1 mois</span><span>24 mois</span></div>
            </div>
          )}
        </RadioCard>
      </div>
    </StepShell>
  )
}

// ── Step 5: Lieu ──
const CITIES = [
  { id: 'dakar', icon: '🏙️', label: 'Dakar', sub: 'Capitale' },
  { id: 'thies', icon: '🌳', label: 'Thiès', sub: 'Région' },
  { id: 'saly', icon: '🏖️', label: 'Saly / Mbour', sub: 'Petite Côte' },
  { id: 'autre', icon: '🇸🇳', label: 'Autre ville', sub: 'Saint-Louis, Touba…' },
  { id: 'diasp', icon: '🌍', label: 'À l\'étranger', sub: 'Cérémonie hors Sénégal' },
]
function Step5({ data, set, onNext, onBack, dir }: { data: OState; set: (p: Partial<OState>) => void; onNext: () => void; onBack: () => void; dir: 'fwd' | 'bwd' }) {
  const valid = !!data.city && ((data.city !== 'autre' && data.city !== 'diasp') || data.city_other.trim().length >= 2)
  return (
    <StepShell step={5} dir={dir} onBack={onBack} onNext={onNext} ctaDisabled={!valid} ctaLabel="Continuer">
      <div className="text-[11px] uppercase tracking-[.2em]" style={{ fontFamily: 'Georgia', color: '#722F37' }}>Étape 5 / 12 · Lieu</div>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl leading-[1.1]" style={{ color: '#0E2916' }}>
        Où aura lieu <em className="not-italic gold-shine">le grand jour</em>&nbsp;?
      </h2>
      <p className="mt-2 text-[15px]" style={{ color: 'rgba(61,61,61,.7)' }}>On adapte les recommandations : prestataires, prix, traditions locales.</p>
      <div className="mt-8 space-y-3">
        {CITIES.map(c => (
          <RadioCard key={c.id} selected={data.city === c.id} onClick={() => set({ city: c.id })} icon={c.icon} title={c.label} sub={c.sub}>
            {data.city === c.id && (c.id === 'autre' || c.id === 'diasp') && (
              <div className="mt-3 pt-3 fade-up" style={{ borderTop: '1px solid rgba(61,61,61,.05)' }}>
                <input type="text" autoFocus value={data.city_other} onChange={e => set({ city_other: e.target.value })}
                  placeholder={c.id === 'diasp' ? 'Paris, New York, Milan…' : 'Saint-Louis, Touba…'}
                  className="w-full h-12 rounded-xl px-3 ring-1 focus:ring-2 focus:ring-[#1E5631] outline-none text-base" style={{ background: 'rgba(250,247,242,.6)', outlineColor: 'rgba(61,61,61,.08)' }} />
              </div>
            )}
          </RadioCard>
        ))}
      </div>
    </StepShell>
  )
}

// ── Step 6: Cérémonies ──
const CER = {
  takk:      { icon: '💍', label: 'Takk',          sub: 'Religieuse / coutumière',  tt: 'Nikkah ou union religieuse — la cérémonie officielle.' },
  ceet:      { icon: '🏠', label: 'Céet',          sub: 'Déménagement de la mariée', tt: 'Le déménagement traditionnel chez la belle-famille.' },
  civil:     { icon: '📜', label: 'Mariage civil', sub: 'À la mairie',               tt: 'L\'enregistrement civil — facultatif au Sénégal.' },
  reception: { icon: '✨', label: 'Réception',     sub: 'La grande fête',            tt: 'La réception : invités, traiteur, danse, ndawtal.' },
} as const
function Step6({ data, set, onNext, onBack, dir }: { data: OState; set: (p: Partial<OState>) => void; onNext: () => void; onBack: () => void; dir: 'fwd' | 'bwd' }) {
  const anySelected = Object.values(data.ceremonies).some(Boolean)
  return (
    <StepShell step={6} dir={dir} onBack={onBack} onNext={onNext} ctaDisabled={!anySelected} ctaLabel="Continuer">
      <div className="text-[11px] uppercase tracking-[.2em]" style={{ fontFamily: 'Georgia', color: '#722F37' }}>Étape 6 / 12 · Cérémonies</div>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl leading-[1.1]" style={{ color: '#0E2916' }}>Quelles cérémonies prévois-tu&nbsp;?</h2>
      <p className="mt-2 text-[15px]" style={{ color: 'rgba(61,61,61,.7)' }}>Tu peux en cocher plusieurs.</p>
      <div className="mt-8 space-y-3">
        {(Object.entries(CER) as [keyof typeof CER, typeof CER[keyof typeof CER]][]).map(([key, info]) => {
          const on = data.ceremonies[key]
          return (
            <div key={key} className="rounded-2xl p-4 transition"
              style={on
                ? { background: 'white', outline: '2px solid #1E5631', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 12px 32px -16px rgba(61,61,61,.18)' }
                : { background: 'rgba(255,255,255,.6)', backdropFilter: 'blur(8px)', outline: '1px solid rgba(61,61,61,.08)' }}>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl"
                  style={{ background: on ? '#1E5631' : '#FAF7F2', color: on ? '#F7E9CF' : undefined }}>{info.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="font-display text-lg leading-tight" style={{ color: '#0E2916' }}>{info.label}</div>
                    <span title={info.tt} className="grid h-5 w-5 place-items-center rounded-full text-[10px] cursor-help" style={{ background: '#FAF7F2', color: 'rgba(61,61,61,.6)', fontFamily: 'Georgia' }}>ⓘ</span>
                  </div>
                  <div className="text-[13px]" style={{ color: 'rgba(61,61,61,.6)' }}>{info.sub}</div>
                </div>
                <button type="button" onClick={() => set({ ceremonies: { ...data.ceremonies, [key]: !on } })}
                  className={`switch ${on ? 'on' : ''}`} aria-label={`Toggle ${info.label}`} />
              </div>
              {on && (
                <div className="mt-3 pt-3 fade-up" style={{ borderTop: '1px solid rgba(61,61,61,.05)' }}>
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.55)' }}>Date prévue</span>
                    <input type="date" value={data.ceremony_dates[key]}
                      onChange={e => set({ ceremony_dates: { ...data.ceremony_dates, [key]: e.target.value } })}
                      className="mt-1.5 w-full h-11 rounded-xl px-3 ring-1 focus:ring-2 focus:ring-[#1E5631] outline-none text-sm" style={{ background: 'rgba(250,247,242,.6)', outlineColor: 'rgba(61,61,61,.08)' }} />
                  </label>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </StepShell>
  )
}

// ── Step 7: Invités ──
const GUESTS_QUICK = [200, 400, 600, 800, 1000]
function Step7({ data, set, onNext, onBack, dir }: { data: OState; set: (p: Partial<OState>) => void; onNext: () => void; onBack: () => void; dir: 'fwd' | 'bwd' }) {
  const gp = (data.guests - 50) / (2000 - 50) * 100
  return (
    <StepShell step={7} dir={dir} onBack={onBack} onNext={onNext} ctaDisabled={false} ctaLabel="Continuer">
      <div className="text-[11px] uppercase tracking-[.2em]" style={{ fontFamily: 'Georgia', color: '#722F37' }}>Étape 7 / 12 · Le monde</div>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl leading-[1.1]" style={{ color: '#0E2916' }}>Combien d&apos;invités&nbsp;?</h2>
      <p className="mt-2 text-[15px]" style={{ color: 'rgba(61,61,61,.7)' }}>Au total, toutes cérémonies confondues. Tu pourras ajuster plus tard.</p>
      <section className="mt-8 rounded-3xl bg-white p-5 ring-1 shadow-card" style={{ outlineColor: 'rgba(61,61,61,.08)' }}>
        <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.55)' }}>Invités au total</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-5xl sm:text-6xl tabular-nums" style={{ color: '#0E2916' }}>{data.guests}</span>
          <span style={{ color: 'rgba(61,61,61,.55)' }}>personnes</span>
        </div>
        <input type="range" min="50" max="2000" step="10" value={data.guests}
          onChange={e => set({ guests: parseInt(e.target.value, 10) })}
          className="sama mt-4" style={{ '--p': `${gp}%` } as React.CSSProperties} />
        <div className="mt-1 flex justify-between text-[10px]" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.4)' }}><span>50</span><span>2000+</span></div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {GUESTS_QUICK.map(q => (
            <button key={q} type="button" onClick={() => set({ guests: q })}
              className="rounded-full px-3 py-1.5 text-[12px] transition"
              style={data.guests === q
                ? { background: '#1E5631', color: '#F7E9CF', fontFamily: 'Georgia' }
                : { background: '#FAF7F2', outline: '1px solid rgba(61,61,61,.08)', color: 'rgba(61,61,61,.75)', fontFamily: 'Georgia' }}>
              {q}
            </button>
          ))}
        </div>
      </section>
      <div className="mt-5 text-[12px] leading-relaxed" style={{ color: 'rgba(61,61,61,.55)' }}>
        💡 Au Sénégal, les invités sont souvent 2–4× plus nombreux qu&apos;en Europe. Ne te restreins pas.
      </div>
    </StepShell>
  )
}

// ── Step 8: Budget ──
const B_MIN = 1_000_000, B_MAX = 100_000_000
function bToSlider(n: number) { return Math.pow((n - B_MIN) / (B_MAX - B_MIN), 1 / 1.6) * 100 }
function sliderToB(v: number) { return Math.round(B_MIN + (B_MAX - B_MIN) * (v / 100) ** 1.6) }
function Step8({ data, set, onNext, onBack, dir }: { data: OState; set: (p: Partial<OState>) => void; onNext: () => void; onBack: () => void; dir: 'fwd' | 'bwd' }) {
  const bs = bToSlider(data.budget)
  return (
    <StepShell step={8} dir={dir} onBack={onBack} onNext={onNext} ctaDisabled={false} ctaLabel="Continuer">
      <div className="text-[11px] uppercase tracking-[.2em]" style={{ fontFamily: 'Georgia', color: '#722F37' }}>Étape 8 / 12 · L&apos;enveloppe</div>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl leading-[1.1]" style={{ color: '#0E2916' }}>Ton budget approximatif&nbsp;?</h2>
      <p className="mt-2 text-[15px]" style={{ color: 'rgba(61,61,61,.7)' }}>Sois honnête — ça reste entre toi et l&apos;IA. On t&apos;aidera à optimiser.</p>
      <section className="mt-8 rounded-3xl bg-white p-5 ring-1 shadow-card" style={{ outlineColor: 'rgba(61,61,61,.08)' }}>
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.55)' }}>Budget total</div>
          <label className="flex items-center gap-2 text-[12px] cursor-pointer" style={{ color: 'rgba(61,61,61,.65)' }}>
            <button type="button" className={`switch ${data.budget_skip ? 'on' : ''}`}
              onClick={() => set({ budget_skip: !data.budget_skip })} aria-label="Skip" />
            <span>Je préfère ne pas dire</span>
          </label>
        </div>
        <div className="mt-2 transition" style={{ opacity: data.budget_skip ? 0.3 : 1, pointerEvents: data.budget_skip ? 'none' : undefined }}>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-display text-4xl sm:text-5xl tabular-nums" style={{ color: '#0E2916' }}>{fmtFCFA(data.budget)}</span>
            <span className="text-sm" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.55)' }}>FCFA</span>
          </div>
          <div className="mt-1 text-[12px]" style={{ color: 'rgba(61,61,61,.55)' }}>≈ <span style={{ fontFamily: 'Georgia' }}>{fmtEUR(data.budget)}</span></div>
          <input type="range" min="0" max="100" step="1" value={bs}
            onChange={e => set({ budget: sliderToB(parseFloat(e.target.value)) })}
            className="sama mt-4" style={{ '--p': `${bs}%` } as React.CSSProperties} />
          <div className="mt-1 flex justify-between text-[10px]" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.4)' }}><span>1M</span><span>100M+</span></div>
        </div>
      </section>
      <div className="mt-5 rounded-2xl px-4 py-3 text-[13px] leading-relaxed" style={{ background: 'rgba(114,47,55,.08)', outline: '1px solid rgba(114,47,55,.15)', color: 'rgba(61,24,28,.85)' }}>
        <strong>Pas d&apos;inquiétude.</strong> Sama IA t&apos;aidera à éviter les pièges classiques (dépassement déco, traiteur, etc).
      </div>
    </StepShell>
  )
}

// ── Step 9: Priorités ──
const PRIO_OPTS = [
  { id: 'lieu', icon: '🏛️', label: 'Lieu / réception' },
  { id: 'food', icon: '🍽️', label: 'Traiteur & menu' },
  { id: 'photo', icon: '📸', label: 'Photographe & vidéo' },
  { id: 'decor', icon: '💐', label: 'Décoration' },
  { id: 'tenues', icon: '👗', label: 'Tenues & look' },
  { id: 'anim', icon: '🎵', label: 'Animation / DJ' },
]
function Step9({ data, set, onNext, onBack, dir }: { data: OState; set: (p: Partial<OState>) => void; onNext: () => void; onBack: () => void; dir: 'fwd' | 'bwd' }) {
  function toggle(id: string) {
    const cur = data.priorities
    if (cur.includes(id)) set({ priorities: cur.filter(x => x !== id) })
    else if (cur.length < 3) set({ priorities: [...cur, id] })
  }
  return (
    <StepShell step={9} dir={dir} onBack={onBack} onNext={onNext} ctaDisabled={data.priorities.length !== 3} ctaLabel="Continuer">
      <div className="text-[11px] uppercase tracking-[.2em]" style={{ fontFamily: 'Georgia', color: '#722F37' }}>Étape 9 / 12 · Priorités</div>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl leading-[1.1]" style={{ color: '#0E2916' }}>Ton top 3, dans l&apos;ordre.</h2>
      <p className="mt-2 text-[15px]" style={{ color: 'rgba(61,61,61,.7)' }}>L&apos;IA donnera plus de budget et d&apos;attention à ces postes. Clique pour ranger.</p>
      <div className="mt-8 grid grid-cols-2 gap-2.5">
        {PRIO_OPTS.map(p => {
          const rank = data.priorities.indexOf(p.id) + 1
          const sel = rank > 0
          const rankBg = rank === 1 ? '#D4A574' : rank === 2 ? '#1E5631' : '#722F37'
          const rankFg = rank === 1 ? '#3D181C' : '#F7E9CF'
          return (
            <button key={p.id} type="button" onClick={() => toggle(p.id)}
              className="relative rounded-2xl p-4 text-left transition"
              style={sel
                ? { background: 'white', outline: '2px solid #1E5631', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 12px 32px -16px rgba(61,61,61,.18)' }
                : data.priorities.length >= 3
                  ? { background: 'rgba(255,255,255,.4)', outline: '1px solid rgba(61,61,61,.08)', color: 'rgba(61,61,61,.45)' }
                  : { background: 'rgba(255,255,255,.6)', outline: '1px solid rgba(61,61,61,.08)' }}>
              <div className="text-2xl">{p.icon}</div>
              <div className="mt-2 font-display text-base leading-tight" style={{ color: '#0E2916' }}>{p.label}</div>
              {sel && (
                <span className="absolute -top-2 -right-2 grid h-7 w-7 place-items-center rounded-full font-display text-base ring-2 ring-[#FAF7F2]"
                  style={{ background: rankBg, color: rankFg }}>{rank}</span>
              )}
            </button>
          )
        })}
      </div>
      <div className="mt-5 text-center text-[12px]" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.55)' }}>
        {data.priorities.length} / 3 sélectionnés
      </div>
    </StepShell>
  )
}

// ── Step 10: Styles ──
const STYLES_OPT = [
  { id: 'trad',   label: 'Traditionnel sénégalais', emoji: '🌟', grad: 'linear-gradient(135deg, #1E5631, #0E2916)',            fg: '#F7E9CF' },
  { id: 'royal',  label: 'Royal moderne',           emoji: '👑', grad: 'linear-gradient(135deg, #722F37, #3D181C)',            fg: '#F7E9CF' },
  { id: 'boho',   label: 'Bohème champêtre',        emoji: '🌿', grad: 'linear-gradient(135deg, #F4E4C1, #D4A574)',            fg: '#3D181C' },
  { id: 'mini',   label: 'Minimaliste élégant',     emoji: '⚪', grad: 'linear-gradient(135deg, #FAF7F2, #EAF1EC)',            fg: '#0E2916' },
  { id: 'fusion', label: 'Fusion afro-occidentale', emoji: '🌍', grad: 'linear-gradient(135deg, #B98548, #722F37, #0E2916)',  fg: '#F7E9CF' },
  { id: 'glam',   label: 'Glamour Hollywood',       emoji: '✨', grad: 'linear-gradient(135deg, #0E2916, #722F37, #D4A574)',  fg: '#F7E9CF' },
]
function Step10({ data, set, onNext, onBack, dir }: { data: OState; set: (p: Partial<OState>) => void; onNext: () => void; onBack: () => void; dir: 'fwd' | 'bwd' }) {
  function toggle(id: string) {
    set({ styles: data.styles.includes(id) ? data.styles.filter(x => x !== id) : [...data.styles, id] })
  }
  return (
    <StepShell step={10} dir={dir} onBack={onBack} onNext={onNext} ctaDisabled={data.styles.length === 0} ctaLabel="Continuer">
      <div className="text-[11px] uppercase tracking-[.2em]" style={{ fontFamily: 'Georgia', color: '#722F37' }}>Étape 10 / 12 · Style</div>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl leading-[1.1]" style={{ color: '#0E2916' }}>Quel style te ressemble&nbsp;?</h2>
      <p className="mt-2 text-[15px]" style={{ color: 'rgba(61,61,61,.7)' }}>Choisis-en au moins 1 (ou plusieurs).</p>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {STYLES_OPT.map(s => {
          const sel = data.styles.includes(s.id)
          return (
            <button key={s.id} type="button" onClick={() => toggle(s.id)}
              className={`sty-card${sel ? ' sel' : ''} relative overflow-hidden rounded-3xl p-4 text-left`}
              style={{ background: s.grad, color: s.fg, aspectRatio: '3/4' }}>
              <div className="absolute inset-0 opacity-30"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.18) 1px, transparent 1.4px)', backgroundSize: '12px 12px' }} />
              <div className="relative h-full flex flex-col justify-between">
                <div className="text-3xl">{s.emoji}</div>
                <div>
                  <div className="font-display text-[17px] leading-tight">{s.label}</div>
                  {sel && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]" style={{ background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(4px)', fontFamily: 'Georgia' }}>
                      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m3 8 3 3 7-7"/></svg>
                      choisi
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <div className="mt-6 text-center text-[12px]" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.55)' }}>
        {data.styles.length} sélectionné{data.styles.length > 1 ? 's' : ''}
      </div>
    </StepShell>
  )
}

// ── Step 11: Tenues ──
const FABRICS = [
  { id: 'bazin',    label: 'Bazin riche',  sw: ['#1B2A4E', '#0E1A38', '#D4A574'] },
  { id: 'wax',      label: 'Wax / pagne',  sw: ['#D4A574', '#722F37', '#1E5631'] },
  { id: 'dentelle', label: 'Dentelle',     sw: ['#FAF7F2', '#F4E4C1', '#D4A574'] },
  { id: 'brode',    label: 'Brodé or',     sw: ['#722F37', '#D4A574', '#FBF4EA'] },
  { id: 'soie',     label: 'Soie / satin', sw: ['#FBF4EA', '#EFD9B8', '#D4A574'] },
]
function Step11({ data, set, onNext, onBack, dir }: { data: OState; set: (p: Partial<OState>) => void; onNext: () => void; onBack: () => void; dir: 'fwd' | 'bwd' }) {
  const bp = (data.bridesmaids - 1) / 29 * 100
  return (
    <StepShell step={11} dir={dir} onBack={onBack} onNext={onNext} ctaDisabled={!data.fabric} ctaLabel="Continuer">
      <div className="text-[11px] uppercase tracking-[.2em]" style={{ fontFamily: 'Georgia', color: '#722F37' }}>Étape 11 / 12 · Tenues</div>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl leading-[1.1]" style={{ color: '#0E2916' }}>Tes <em className="not-italic gold-shine">tenues</em>, ton <em className="not-italic" style={{ color: '#0E2916' }}>ndaxal</em>.</h2>
      <p className="mt-2 text-[15px]" style={{ color: 'rgba(61,61,61,.7)' }}>Tissu vedette + nombre de demoiselles d&apos;honneur.</p>
      <section className="mt-7">
        <div className="text-[10px] uppercase tracking-widest mb-2" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.55)' }}>Tissu vedette</div>
        <div className="space-y-2">
          {FABRICS.map(f => {
            const sel = data.fabric === f.id
            return (
              <button key={f.id} type="button" onClick={() => set({ fabric: f.id })}
                className="flex items-center gap-3 rounded-2xl p-3 w-full transition"
                style={sel
                  ? { background: 'white', outline: '2px solid #1E5631', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 12px 32px -16px rgba(61,61,61,.18)' }
                  : { background: 'rgba(255,255,255,.6)', outline: '1px solid rgba(61,61,61,.08)' }}>
                <div className="flex shrink-0 h-10 w-16 rounded-lg overflow-hidden ring-1" style={{ outlineColor: 'rgba(61,61,61,.1)' }}>
                  {f.sw.map((c, i) => <span key={i} className="flex-1 block" style={{ background: c }} />)}
                </div>
                <div className="font-display text-base" style={{ color: '#0E2916' }}>{f.label}</div>
                <span className="ml-auto grid h-5 w-5 place-items-center rounded-full transition"
                  style={{ background: sel ? '#1E5631' : '#FAF7F2', outline: sel ? 'none' : '1px solid rgba(61,61,61,.15)' }}>
                  {sel && <span className="h-2 w-2 rounded-full" style={{ background: '#EFD9B8' }} />}
                </span>
              </button>
            )
          })}
        </div>
      </section>
      <section className="mt-6 rounded-3xl bg-white p-5 ring-1 shadow-card" style={{ outlineColor: 'rgba(61,61,61,.08)' }}>
        <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.55)' }}>Demoiselles d&apos;honneur (ndaxal)</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-4xl tabular-nums" style={{ color: '#0E2916' }}>{data.bridesmaids}</span>
          <span style={{ color: 'rgba(61,61,61,.55)' }}>amies coordonnées</span>
        </div>
        <input type="range" min="1" max="30" value={data.bridesmaids}
          onChange={e => set({ bridesmaids: parseInt(e.target.value, 10) })}
          className="sama mt-4" style={{ '--p': `${bp}%` } as React.CSSProperties} />
        <div className="mt-1 flex justify-between text-[10px]" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.4)' }}><span>1</span><span>30</span></div>
      </section>
    </StepShell>
  )
}

// ── Step 12: Inspiration ──
const SOURCES = [
  { id: 'tiktok', label: '🎵 TikTok' },
  { id: 'pinterest', label: '📌 Pinterest' },
  { id: 'instagram', label: '📷 Instagram' },
  { id: 'irl', label: '👰 Un mariage récent' },
  { id: 'magazine', label: '📖 Magazines' },
  { id: 'famille', label: '🏡 Famille / amies' },
]
function Step12({ data, set, onNext, onBack, dir }: { data: OState; set: (p: Partial<OState>) => void; onNext: () => void; onBack: () => void; dir: 'fwd' | 'bwd' }) {
  return (
    <StepShell step={12} dir={dir} onBack={onBack} onNext={onNext} ctaDisabled={data.inspiration_sources.length === 0} ctaLabel="Terminer">
      <div className="text-[11px] uppercase tracking-[.2em]" style={{ fontFamily: 'Georgia', color: '#722F37' }}>Étape 12 / 12 · Inspiration</div>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl leading-[1.1]" style={{ color: '#0E2916' }}>D&apos;où vient ton <em className="not-italic gold-shine">inspiration</em>&nbsp;?</h2>
      <p className="mt-2 text-[15px]" style={{ color: 'rgba(61,61,61,.7)' }}>Coche tout ce qui colle. L&apos;IA s&apos;en sert pour ton mood board.</p>
      <div className="mt-7">
        <div className="text-[10px] uppercase tracking-widest mb-2" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.55)' }}>Sources</div>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map(s => {
            const on = data.inspiration_sources.includes(s.id)
            return (
              <button key={s.id} type="button"
                onClick={() => set({ inspiration_sources: on ? data.inspiration_sources.filter(x => x !== s.id) : [...data.inspiration_sources, s.id] })}
                className="rounded-full px-4 py-2.5 text-[13px] font-medium transition"
                style={on
                  ? { background: '#1E5631', color: '#F7E9CF', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 12px 32px -16px rgba(61,61,61,.18)' }
                  : { background: 'rgba(255,255,255,.6)', outline: '1px solid rgba(61,61,61,.10)', color: 'rgba(61,61,61,.75)' }}>
                {s.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="mt-7">
        <label className="block">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-[11px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.55)' }}>Une chose à éviter absolument</span>
            <span className="text-[11px]" style={{ color: 'rgba(61,61,61,.45)' }}>(facultatif)</span>
          </div>
          <textarea maxLength={200} rows={3} value={data.to_avoid}
            onChange={e => set({ to_avoid: e.target.value })}
            placeholder="Ex : pas de couleurs flashy, pas de musique après minuit…"
            className="w-full rounded-2xl bg-white px-4 py-3 ring-1 focus:ring-2 focus:ring-[#1E5631] outline-none text-base placeholder:text-[rgba(61,61,61,.3)] transition leading-snug"
            style={{ outlineColor: 'rgba(61,61,61,.08)' }} />
        </label>
        <div className="mt-1 text-right text-[11px]" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.4)' }}>{data.to_avoid.length} / 200</div>
      </div>
      <div className="mt-7 rounded-2xl p-4 text-[12px] leading-relaxed" style={{ background: 'rgba(234,241,236,.6)', outline: '1px solid rgba(30,86,49,.08)', color: 'rgba(14,41,22,.8)' }}>
        Dernière étape ! En cliquant <strong>Terminer</strong>, l&apos;IA va générer ton budget personnalisé et ton rétroplanning. Compte 5 secondes.
      </div>
    </StepShell>
  )
}

// ── Loading ──
const LOADING_MSGS = [
  'Création du budget personnalisé…',
  'Génération du rétroplanning…',
  'Sélection des meilleurs prestataires…',
  'Préparation du mood board…',
  'Configuration du Ndawtal…',
  'Coordination du groupe ndaxal…',
  'Finalisation de ton univers Sama…',
]
function LoadingScreen() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const ti = setInterval(() => setI(x => (x + 1) % LOADING_MSGS.length), 1100)
    return () => clearInterval(ti)
  }, [])
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="fade-up grid h-20 w-20 place-items-center rounded-3xl ring-2 shadow-glow" style={{ background: '#1E5631', outlineColor: 'rgba(212,165,116,.3)' }}>
        <svg viewBox="0 0 32 32" className="h-10 w-10" fill="none" stroke="#D4A574" strokeWidth="1.6">
          <path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z"/>
          <path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z"/>
          <path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3"/>
        </svg>
      </div>
      <h2 className="fade-up a1 mt-8 font-display text-3xl sm:text-4xl" style={{ color: '#0E2916' }}>Sama IA prépare ton mariage</h2>
      <div className="mt-5 flex items-center gap-2">
        <span className="l-dot h-3 w-3 rounded-full" style={{ background: '#D4A574' }} />
        <span className="l-dot ld2 h-3 w-3 rounded-full" style={{ background: '#D4A574' }} />
        <span className="l-dot ld3 h-3 w-3 rounded-full" style={{ background: '#D4A574' }} />
      </div>
      <div className="mt-8 h-6 relative max-w-md w-full">
        {LOADING_MSGS.map((m, idx) => (
          <p key={idx} className="absolute inset-0 text-[15px] transition-opacity duration-500" style={{ color: 'rgba(61,61,61,.7)', opacity: idx === i ? 1 : 0 }}>{m}</p>
        ))}
      </div>
    </div>
  )
}

// ── Confetti ──
function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 70 }, (_, i) => {
    const colors = ['#D4A574', '#1E5631', '#722F37', '#EFD9B8', '#F4E4C1', '#B98548']
    return { left: Math.random() * 100, bg: colors[i % colors.length], delay: Math.random() * 1.2, duration: 3 + Math.random() * 2.5, rotate: Math.random() * 360, w: 6 + Math.random() * 8, h: 10 + Math.random() * 12 }
  }), [])
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span key={i} className="confetti" style={{ left: `${p.left}%`, background: p.bg, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`, transform: `rotate(${p.rotate}deg)`, width: p.w, height: p.h }} />
      ))}
    </div>
  )
}

// ── Success ──
function SuccessScreen({ name }: { name: string }) {
  const first = (name || '').trim().split(/\s+/)[0] || 'belle mariée'
  return (
    <div className="min-h-screen flex flex-col">
      <Confetti />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10">
        <div className="fade-up text-7xl sm:text-8xl select-none">🎉</div>
        <div className="fade-up a1 mt-4 text-[11px] uppercase tracking-[.2em]" style={{ fontFamily: 'Georgia', color: '#722F37' }}>Bienvenue</div>
        <h1 className="fade-up a2 mt-2 font-display text-4xl sm:text-5xl leading-[1.1] text-balance" style={{ color: '#0E2916' }}>
          Bienvenue dans ton<br/><em className="not-italic gold-shine">Sama Mariage</em>, {first}&nbsp;!
        </h1>
        <p className="fade-up a3 mt-4 max-w-md text-[15px] leading-relaxed" style={{ color: 'rgba(61,61,61,.7)' }}>
          Ton budget et ton planning sont prêts. <strong style={{ color: '#722F37' }}>Découvrons-les ensemble.</strong>
        </p>
        <Link href="/app" className="fade-up a4 mt-9 w-full max-w-xs h-14 rounded-2xl font-medium text-[15px] transition flex items-center justify-center gap-2 active:scale-[.99] ring-1"
          style={{ background: '#1E5631', color: '#F7E9CF', boxShadow: '0 18px 40px -16px rgba(30,86,49,.5)', outlineColor: 'rgba(212,165,116,.4)' }}>
          Voir mon dashboard
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
        </Link>
        <button type="button" className="fade-up a4 mt-5 inline-flex items-center gap-2 text-[13px]" style={{ color: '#173F24' }}>
          <span className="grid h-6 w-6 place-items-center rounded-full text-white" style={{ background: '#25D366' }}>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2z"/></svg>
          </span>
          Activer les notifications WhatsApp <span className="text-[11px]" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.45)' }}>· recommandé</span>
        </button>
      </div>
    </div>
  )
}

// ── Welcome ──
function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="fade-up flex items-center gap-2.5">
          <span className="relative grid h-12 w-12 place-items-center rounded-2xl shadow-glow" style={{ background: '#1E5631' }}>
            <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="#D4A574" strokeWidth="1.6">
              <path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z"/>
              <path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z"/>
              <path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3"/>
            </svg>
          </span>
          <span className="font-display text-[26px] leading-none">
            <span style={{ color: '#1E5631' }}>Sama</span><span className="gold-shine font-semibold">Mariage</span>
          </span>
        </div>
        <div className="mt-12 sm:mt-16 relative">
          <div className="absolute inset-0 -m-4 rounded-full blur-2xl" style={{ background: 'linear-gradient(135deg, rgba(239,217,184,.6), rgba(114,47,55,.2))' }} />
          <div className="relative ring-breath font-display text-[88px] sm:text-[120px] leading-none select-none">💍</div>
        </div>
        <h1 className="fade-up a1 mt-8 font-display text-4xl sm:text-5xl leading-[1.05] text-balance" style={{ color: '#0E2916' }}>
          Félicitations<br/>pour ton <em className="not-italic gold-shine">mariage</em>.
        </h1>
        <p className="fade-up a2 mt-4 max-w-sm text-[15px] sm:text-base leading-relaxed" style={{ color: 'rgba(61,61,61,.7)' }}>
          Construisons ensemble le plus beau jour de ta vie. <span style={{ color: '#722F37' }}>Pas à pas, sans stress.</span>
        </p>
        <button onClick={onStart}
          className="fade-up a3 mt-10 w-full max-w-xs h-14 rounded-2xl font-medium text-[15px] transition flex items-center justify-center gap-2 active:scale-[.99] ring-1"
          style={{ background: 'linear-gradient(90deg, #B98548, #D4A574, #B98548)', color: '#3D181C', boxShadow: '0 18px 40px -16px rgba(30,86,49,.5)', outlineColor: 'rgba(212,165,116,.6)' }}>
          Commencer
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
        </button>
        <div className="fade-up a4 mt-5 inline-flex items-center gap-2 text-[11px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.55)' }}>
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="8" r="6.5"/><path d="M8 4.5V8l2.5 1.5"/></svg>
          6 min · 12 micro-étapes · sauvegarde auto
        </div>
      </div>
    </div>
  )
}

// ── Style → DB enum mapping ──
function mapStyle(styles: string[]): 'traditionnel' | 'moderne' | 'fusion' | 'royal' | 'boheme' {
  const MAP: Record<string, 'traditionnel' | 'moderne' | 'fusion' | 'royal' | 'boheme'> = {
    trad: 'traditionnel', royal: 'royal', boho: 'boheme', mini: 'moderne', fusion: 'fusion', glam: 'moderne',
  }
  for (const s of styles) if (MAP[s]) return MAP[s]
  return 'fusion'
}

// ── Main Page ──
export default function OnboardingPage() {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || 'null')
      if (saved?.screen !== undefined) return saved.screen
    } catch (_) {}
    return 'welcome'
  })
  const [dir, setDir] = useState<'fwd' | 'bwd'>('fwd')
  const [data, setData] = useState<OState>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || 'null')
      if (saved?.data) return { ...INITIAL, ...saved.data }
    } catch (_) {}
    return INITIAL
  })

  // Persist
  useEffect(() => {
    if (screen !== 'loading' && screen !== 'success') {
      localStorage.setItem(STORAGE, JSON.stringify({ screen, data }))
    }
  }, [screen, data])

  const set = useCallback((patch: Partial<OState>) => setData(d => ({ ...d, ...patch })), [])

  const completeOnboarding = trpc.auth.completeOnboarding.useMutation({
    onSuccess: () => {
      localStorage.removeItem(STORAGE)
      setScreen('success')
    },
    onError: (e) => {
      console.error(e)
      setScreen('success') // fallback: still show success
    },
  })

  function goto(s: Screen, d: 'fwd' | 'bwd' = 'fwd') { setDir(d); setScreen(s) }
  function next() {
    if (screen === 12) {
      // Submit to tRPC then go to loading
      const cerList = Object.entries(data.ceremonies).filter(([, v]) => v).map(([k]) => k) as ('takk' | 'ceet' | 'civil' | 'reception')[]
      const cityMap: Record<string, string> = { dakar: 'Dakar', thies: 'Thiès', saly: 'Saly', autre: data.city_other, diasp: data.city_other }
      completeOnboarding.mutate({
        fullName: data.full_name,
        weddingDate: data.date_mode === 'precise' ? data.date_precise || null : null,
        weddingDateApprox: data.date_mode === 'month' ? data.date_month : data.date_mode === 'unknown' ? `${data.date_in_months} mois` : null,
        guestCount: Math.max(10, data.guests),
        ceremonies: cerList.length > 0 ? cerList : ['reception'],
        style: mapStyle(data.styles),
        city: cityMap[data.city] || 'Dakar',
      })
      goto('loading', 'fwd')
    } else if (typeof screen === 'number') {
      goto(screen + 1, 'fwd')
    } else if (screen === 'welcome') {
      goto(1, 'fwd')
    }
  }
  function back() {
    if (typeof screen === 'number' && screen > 1) goto(screen - 1, 'bwd')
    else goto('welcome', 'bwd')
  }

  // Loading → success after delay
  useEffect(() => {
    if (screen === 'loading' && !completeOnboarding.isPending) {
      const t = setTimeout(() => goto('success', 'fwd'), 5800)
      return () => clearTimeout(t)
    }
  }, [screen, completeOnboarding.isPending])

  const stepProps = { data, set, onNext: next, onBack: back, dir }

  const bg = {
    background: `
      radial-gradient(60% 60% at 80% 0%, rgba(212,165,116,.35) 0%, transparent 60%),
      radial-gradient(80% 70% at 10% 100%, rgba(30,86,49,.18) 0%, transparent 70%),
      linear-gradient(180deg, #FAF7F2 0%, #F4E4C1 100%)
    `,
    backgroundAttachment: 'fixed',
  }

  return (
    <div className="min-h-screen relative" style={bg}>
      {/* Wax dot overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none wax-bg opacity-60" />

      <div className="relative z-10">
        {screen === 'welcome' && <Welcome onStart={next} />}
        {screen === 1  && <Step1  {...stepProps} />}
        {screen === 2  && <Step2  {...stepProps} />}
        {screen === 3  && <Step3  {...stepProps} />}
        {screen === 4  && <Step4  {...stepProps} />}
        {screen === 5  && <Step5  {...stepProps} />}
        {screen === 6  && <Step6  {...stepProps} />}
        {screen === 7  && <Step7  {...stepProps} />}
        {screen === 8  && <Step8  {...stepProps} />}
        {screen === 9  && <Step9  {...stepProps} />}
        {screen === 10 && <Step10 {...stepProps} />}
        {screen === 11 && <Step11 {...stepProps} />}
        {screen === 12 && <Step12 {...stepProps} />}
        {screen === 'loading' && <LoadingScreen />}
        {screen === 'success'  && <SuccessScreen name={data.full_name} />}
      </div>
    </div>
  )
}
