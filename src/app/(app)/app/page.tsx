'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { formatFCFA } from '@/lib/utils'

const INIT_TASKS = [
  { id: 1, title: 'Confirmer le photographe ', bold: 'Adams Sidibé', sub: 'Confirmer pour les 3 cérémonies + livraison J+15', badge: 'J–5', variant: 'red' as const, done: false },
  { id: 2, title: 'Commander les ', bold: 'faire-part', sub: '450 exemplaires · imprimeur Mansour Print', badge: 'J–7', variant: 'red' as const, done: false },
  { id: 3, title: 'Validation finale traiteur ', bold: 'Le Carré', sub: 'Menu, quantités, allergies — RDV 14h', badge: 'J–10', variant: 'gold' as const, done: false },
  { id: 4, title: 'Choisir ', bold: 'tissu groupe demoiselles', sub: '2 finalistes : bazin riche bleu nuit · brodé or', badge: 'J–12', variant: 'gold' as const, done: false },
  { id: 5, title: 'RDV ', bold: 'tailleur essayage 2', sub: 'Tonton Modou, Sandaga · 16h30', badge: 'J–15', variant: 'royal' as const, done: true },
]

const VENDORS = [
  { initials: 'AS', name: 'Adams Sidibé', role: 'Photographe · 850 000 F', status: 'Confirmé', sv: 'royal' as const, gradient: 'linear-gradient(135deg, #1E5631, #D4A574)' },
  { initials: 'LC', name: 'Le Carré', role: 'Traiteur · 2 640 000 F', status: 'Confirmé', sv: 'royal' as const, gradient: 'linear-gradient(135deg, #722F37, #D4A574)' },
  { initials: 'AD', name: 'Aida Décor', role: 'Décoration · devis à 1 200 000 F', status: 'En cours', sv: 'gold' as const, gradient: 'linear-gradient(135deg, #D4A574, #1E5631)' },
  { initials: 'DB', name: 'DJ Bouba', role: 'Animation · devis reçu hier', status: 'Devis', sv: 'bordeaux' as const, gradient: 'linear-gradient(135deg, #0E2916, #722F37)' },
]

export default function DashboardPage() {
  const [tasks, setTasks] = useState(INIT_TASKS)

  const { data: wedding } = trpc.wedding.getMine.useQuery()
  const weddingId = wedding?.id ?? ''
  const { data: budget } = trpc.budget.get.useQuery({ weddingId }, { enabled: !!weddingId })
  const { data: ndawtalStats } = trpc.ndawtal.stats.useQuery({ weddingId }, { enabled: !!weddingId })

  const daysUntil    = wedding?.weddingDate ? Math.max(0, Math.ceil((new Date(wedding.weddingDate).getTime() - Date.now()) / 86400000)) : 216
  const totalSpent   = budget?.categories?.reduce((s, c) => s + c.amountSpent, 0) ?? 0
  const totalPlanned = budget?.totalPlanned ?? 0
  const budgetPct    = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 35
  const ndawtalTotal = ndawtalStats?.totalCollected ?? 0
  const ndawtalDonors = ndawtalStats?.donorCount ?? 0

  useEffect(() => {
    /* Donut segments animation */
    const C = 2 * Math.PI * 38
    document.querySelectorAll<SVGCircleElement>('.donut .seg').forEach((seg, i) => {
      const target = seg.getAttribute('data-target') ?? '0'
      seg.style.strokeDashoffset = String(C)
      setTimeout(() => {
        seg.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1)'
        seg.style.strokeDashoffset = target
      }, 250 + i * 120)
    })
    /* Scroll reveal */
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
    }, { threshold: 0.08 })
    document.querySelectorAll<HTMLElement>('.reveal').forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in')
      else io.observe(el)
    })
    const t = setTimeout(() => document.querySelectorAll('.reveal:not(.in)').forEach(el => el.classList.add('in')), 1200)
    return () => { io.disconnect(); clearTimeout(t) }
  }, [])

  return (
    <>
      {/* ── HERO KPI ── */}
      <section className="reveal relative overflow-hidden rounded-3xl text-[#F7E9CF] shadow-glow" style={{ background: 'linear-gradient(135deg, #173F24, #1E5631, #0E2916)' }}>
        <div className="absolute inset-0 wax-bg opacity-30" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full blur-3xl" style={{ background: 'rgba(212,165,116,.15)' }} />
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full blur-3xl" style={{ background: 'rgba(114,47,55,.3)' }} />

        <div className="relative p-6 sm:p-8 grid lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          <div className="lg:col-span-5">
            <div className="text-[10px] uppercase tracking-[.2em]" style={{ fontFamily: 'var(--font-jetbrains)', color: '#D4A574' }}>Ton mariage en chiffres</div>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl leading-[1.1]">
              J–{daysUntil} avant le grand jour.<br/>
              <span className="gold-shine italic font-normal">Tout est sous contrôle.</span>
            </h2>
            <p className="mt-3 max-w-sm text-sm" style={{ color: 'rgba(247,233,207,.8)' }}>
              {wedding?.ceremonies?.length
                ? wedding.ceremonies.map(c => c.type.charAt(0).toUpperCase() + c.type.slice(1)).join(' · ')
                : 'Takk · Céet · Réception'
              } — {wedding?.city ?? 'Dakar'}. Style&nbsp;:&nbsp;<span style={{ color: '#D4A574' }}>{wedding?.style ? wedding.style.charAt(0).toUpperCase() + wedding.style.slice(1) : 'Royal sénégalais'}</span>.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link href="/app/budget" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium hover:opacity-90 transition" style={{ background: '#D4A574', color: '#3D181C' }}>
                Continuer où j&apos;en étais
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
              </Link>
              <Link href="/app/planning" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium hover:bg-white/5 transition" style={{ borderColor: 'rgba(212,165,116,.3)', color: '#F7E9CF' }}>
                Voir le rétroplanning
              </Link>
            </div>
          </div>

          {/* KPI cards */}
          <div className="lg:col-span-7 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h3l3-8 4 16 3-8h5"/></svg>, label: 'Budget', main: totalPlanned > 0 ? `${(totalSpent/1_000_000).toFixed(1)}M` : '4,2M', sub: `sur ${totalPlanned > 0 ? Math.round(totalPlanned/1_000_000) : 12}M FCFA`, pct: budgetPct },
              { icon: <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="m4 12 5 5L20 6"/></svg>, label: 'Tâches', main: '23', sub: '/87 complétées', pct: 26 },
              { icon: <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>, label: 'Invités', main: '127', sub: '/450 confirmés', pct: 28 },
              { icon: <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>, label: 'Prestataires', main: '4', sub: '/12 bookés', pct: 33 },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-2xl backdrop-blur p-4 ring-1" style={{ background: 'rgba(255,255,255,.08)', outlineColor: 'rgba(255,255,255,.1)' }}>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(212,165,116,.9)' }}>
                  {kpi.icon}{kpi.label}
                </div>
                <div className="mt-2 font-display text-2xl leading-none" style={{ color: '#F7E9CF' }}>{kpi.main}</div>
                <div className="mt-0.5 text-[11px]" style={{ color: 'rgba(247,233,207,.7)' }}>{kpi.sub}</div>
                <div className="mt-3 bar" style={{ background: 'rgba(255,255,255,.15)' }}>
                  <i style={{ '--w': `${kpi.pct}%` } as React.CSSProperties} />
                </div>
                <div className="mt-1 text-[10px]" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(247,233,207,.6)' }}>{kpi.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6 CARDS GRID ── */}
      <section className="mt-6 grid md:grid-cols-2 gap-5">

        {/* CARD 1 — Tâches urgentes */}
        <article className="dashboard-card reveal d1 rounded-2xl bg-white p-5 sm:p-6 shadow-card ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#722F37' }}>Cette semaine</div>
              <h3 className="mt-1 font-display text-2xl" style={{ color: '#0E2916' }}>Tâches urgentes</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium shrink-0" style={{ background: 'rgba(114,47,55,.1)', color: '#722F37' }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#722F37' }} /> {tasks.filter(t => !t.done).length} à faire
            </span>
          </div>

          <ul className="mt-5 divide-y rounded-xl overflow-hidden" style={{ outline: '1px solid rgba(61,61,61,.06)' }}>
            {tasks.map(task => (
              <li
                key={task.id}
                className={`task-row flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[#FAF7F2]/60 transition ${task.done ? 'done' : ''}`}
                onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
              >
                <input
                  type="checkbox"
                  className="check"
                  checked={task.done}
                  onChange={e => { e.stopPropagation(); setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: e.target.checked } : t)) }}
                />
                <div className="flex-1 min-w-0">
                  <div className="task-title text-sm" style={{ color: '#0E2916' }}>{task.title}<strong>{task.bold}</strong></div>
                  <div className="text-[11px]" style={{ color: 'rgba(61,61,61,.5)' }}>{task.sub}</div>
                </div>
                <span className="text-[10px] rounded-full px-2 py-0.5 shrink-0" style={{
                  fontFamily: 'var(--font-jetbrains)',
                  background: task.variant === 'red' ? 'rgba(114,47,55,.1)' : task.variant === 'gold' ? '#FBF4EA' : '#EAF1EC',
                  color:      task.variant === 'red' ? '#722F37'            : task.variant === 'gold' ? '#B98548'  : '#1E5631',
                }}>{task.badge}</span>
              </li>
            ))}
          </ul>

          <Link href="/app/planning" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-75 transition" style={{ color: '#1E5631' }}>
            Voir toutes mes 87 tâches
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
          </Link>
        </article>

        {/* CARD 2 — Mood Board */}
        <article className="dashboard-card reveal d2 rounded-2xl bg-white p-5 sm:p-6 shadow-card ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#722F37' }}>Sama Mood</div>
              <h3 className="mt-1 font-display text-2xl" style={{ color: '#0E2916' }}>Ton mood board</h3>
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: '#EAF1EC', color: '#173F24' }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#1E5631' }} />
                {wedding?.style ? wedding.style.charAt(0).toUpperCase() + wedding.style.slice(1) : 'Royal sénégalais moderne'}
              </div>
            </div>
            <Link href="/app/mood" className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#EAF1EC] transition" style={{ background: '#FAF7F2' }}>
              <svg viewBox="0 0 20 20" className="h-4 w-4" style={{ color: '#1E5631' }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 4v12M4 10h12"/></svg>
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-1.5">
            <div className="ph ph-1 aspect-square rounded-xl" data-label="bazin bleu nuit" />
            <div className="ph ph-2 aspect-square rounded-xl row-span-2" data-label="céet décor" />
            <div className="ph ph-3 aspect-square rounded-xl" data-label="or & ivoire" />
            <div className="ph ph-4 aspect-square rounded-xl" data-label="bordeaux henné" />
            <div className="ph ph-5 aspect-square rounded-xl" data-label="lumières" />
            <div className="ph ph-6 aspect-square rounded-xl col-span-2" data-label="ambiance réception" />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-[12px]" style={{ color: 'rgba(61,61,61,.65)' }}><strong style={{ color: '#0E2916' }}>+12 inspirations</strong> cette semaine</div>
            <Link href="/app/mood" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium hover:opacity-90 transition" style={{ background: '#1E5631', color: '#F7E9CF' }}>
              Ouvrir <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
            </Link>
          </div>
        </article>

        {/* CARD 3 — Budget */}
        <article className="dashboard-card reveal d3 rounded-2xl bg-white p-5 sm:p-6 shadow-card ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#722F37' }}>Sama Budget</div>
              <h3 className="mt-1 font-display text-2xl" style={{ color: '#0E2916' }}>Répartition budget</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: 'rgba(114,47,55,.1)', color: '#722F37' }}>⚠ Alerte</span>
          </div>

          <div className="mt-5 flex items-center gap-5">
            <div className="relative shrink-0">
              <svg viewBox="0 0 100 100" className="donut h-32 w-32" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F4E4C1" strokeWidth="16"/>
                <circle className="seg" cx="50" cy="50" r="38" fill="none" stroke="#1E5631" strokeWidth="16" strokeDasharray="238.76" strokeDashoffset="171.91" data-target="171.91"/>
                <circle className="seg" cx="50" cy="50" r="38" fill="none" stroke="#D4A574" strokeWidth="16" strokeDasharray="238.76" strokeDashoffset="186.23" data-target="186.23" style={{ transform: 'rotate(100.8deg)', transformOrigin: 'center' }}/>
                <circle className="seg" cx="50" cy="50" r="38" fill="none" stroke="#722F37" strokeWidth="16" strokeDasharray="238.76" strokeDashoffset="202.95" data-target="202.95" style={{ transform: 'rotate(180deg)', transformOrigin: 'center' }}/>
                <circle className="seg" cx="50" cy="50" r="38" fill="none" stroke="#B98548" strokeWidth="16" strokeDasharray="238.76" strokeDashoffset="214.88" data-target="214.88" opacity=".5" style={{ transform: 'rotate(234deg)', transformOrigin: 'center' }}/>
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="font-display text-xl leading-none" style={{ color: '#0E2916' }}>
                    {totalPlanned > 0 ? `${(totalSpent/1_000_000).toFixed(1)}M` : '4,2M'}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.55)' }}>dépensés</div>
                </div>
              </div>
            </div>

            <ul className="flex-1 min-w-0 space-y-2.5 text-sm">
              {[
                { dot: '#1E5631', label: 'Lieu de réception', pct: '28%' },
                { dot: '#D4A574', label: 'Traiteur',          pct: '22%' },
                { dot: '#722F37', label: 'Tenues & ndaxal',   pct: '15%' },
                { dot: '#B98548', label: 'Autres (8 postes)', pct: '35%', muted: true },
              ].map(row => (
                <li key={row.label} className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: row.dot }} />
                  <span className="flex-1 truncate" style={{ color: row.muted ? 'rgba(61,61,61,.5)' : 'rgba(61,61,61,.85)' }}>{row.label}</span>
                  <span className="font-medium shrink-0" style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: row.muted ? 'rgba(61,61,61,.5)' : '#0E2916' }}>{row.pct}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl p-3" style={{ border: '1px solid rgba(114,47,55,.15)', background: 'rgba(114,47,55,.05)' }}>
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: '#722F37', color: '#FBF4EA' }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01M3 19h18L12 4 3 19z"/></svg>
            </div>
            <div className="flex-1 text-[12px] leading-snug">
              <div className="font-medium" style={{ color: '#3D181C' }}>Dépassement déco prévu de <strong>+8%</strong></div>
              <div style={{ color: 'rgba(61,61,61,.65)' }}>540 000 F au-dessus du budget alloué. Sama propose 3 ajustements.</div>
            </div>
          </div>

          <Link href="/app/budget" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-75 transition" style={{ color: '#1E5631' }}>
            Voir mon budget complet
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
          </Link>
        </article>

        {/* CARD 4 — Ndawtal */}
        <article className="dashboard-card reveal d4 relative overflow-hidden rounded-2xl text-[#F7E9CF] p-5 sm:p-6 ring-1" style={{ background: 'linear-gradient(135deg, #3D181C, #722F37, #0E2916)', outlineColor: '#3D181C' }}>
          <div className="absolute inset-0 wax-bg opacity-30" />
          <div className="absolute -right-12 -bottom-12 h-48 w-48 rounded-full blur-2xl" style={{ background: 'rgba(212,165,116,.15)' }} />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#D4A574' }}>Sama Ndawtal</div>
                <h3 className="mt-1 font-display text-2xl">Ton ndawtal en temps réel</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium shrink-0" style={{ background: 'rgba(212,165,116,.15)', color: '#D4A574' }}>
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#D4A574' }} /> Live
              </span>
            </div>

            <div className="mt-6 flex items-baseline gap-2">
              <div className="font-display text-5xl">{ndawtalTotal > 0 ? `${Math.round(ndawtalTotal/1000)}k` : '0'}</div>
              <div className="text-sm" style={{ color: 'rgba(247,233,207,.7)' }}>FCFA reçus</div>
            </div>
            <p className="mt-2 max-w-sm text-sm" style={{ color: 'rgba(247,233,207,.8)' }}>
              {ndawtalTotal > 0
                ? `${ndawtalDonors} donateur${ndawtalDonors > 1 ? 's' : ''} enregistré${ndawtalDonors > 1 ? 's' : ''}.`
                : 'Normal — le ndawtal commence bientôt. Sama prépare déjà le terrain.'}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { val: ndawtalDonors || 47, sub: 'confirmés présents' },
                { val: 12, sub: 'tontons/tantes VIP' },
              ].map((s, i) => (
                <div key={i} className="rounded-xl backdrop-blur p-3 ring-1" style={{ background: 'rgba(255,255,255,.08)', outlineColor: 'rgba(255,255,255,.1)' }}>
                  <div className="font-display text-2xl" style={{ color: '#F7E9CF' }}>{s.val}</div>
                  <div className="text-[11px]" style={{ color: 'rgba(247,233,207,.7)' }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <Link href="/app/ndawtal" className="mt-5 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium hover:opacity-90 transition" style={{ background: '#D4A574', color: '#3D181C' }}>
              {ndawtalTotal > 0 ? 'Voir mon ndawtal' : 'Configurer mon ndawtal'}
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
            </Link>
          </div>
        </article>

        {/* CARD 5 — Prestataires */}
        <article className="dashboard-card reveal d5 rounded-2xl bg-white p-5 sm:p-6 shadow-card ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#722F37' }}>Sama Prestataires</div>
              <h3 className="mt-1 font-display text-2xl" style={{ color: '#0E2916' }}>Mes prestataires</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: '#EAF1EC', color: '#173F24' }}>4 / 12 bookés</span>
          </div>

          <ul className="mt-5 space-y-2">
            {VENDORS.map(v => (
              <li key={v.initials} className="flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-[#FAF7F2]/60 transition">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-base text-white" style={{ background: v.gradient }}>{v.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium" style={{ color: '#0E2916' }}>{v.name}</span>
                    {v.sv === 'royal' && <svg viewBox="0 0 16 16" className="h-3 w-3" fill="#1E5631"><circle cx="8" cy="8" r="7"/><path d="m5 8 2 2 4-4" stroke="#F7E9CF" strokeWidth="1.6" fill="none"/></svg>}
                  </div>
                  <div className="text-[11px]" style={{ color: 'rgba(61,61,61,.6)' }}>{v.role}</div>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] shrink-0" style={{
                  fontFamily: 'var(--font-jetbrains)',
                  background: v.sv === 'royal' ? '#EAF1EC' : v.sv === 'gold' ? '#FBF4EA' : 'rgba(114,47,55,.1)',
                  color:      v.sv === 'royal' ? '#1E5631' : v.sv === 'gold' ? '#B98548' : '#722F37',
                }}>{v.status}</span>
              </li>
            ))}
          </ul>

          <Link href="/app/prestataires" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-75 transition" style={{ color: '#1E5631' }}>
            Explorer 500+ prestataires
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
          </Link>
        </article>

        {/* CARD 6 — Tenues / Ndaxal */}
        <article className="dashboard-card reveal d6 rounded-2xl bg-white p-5 sm:p-6 shadow-card ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#722F37' }}>Sama Tenues</div>
              <h3 className="mt-1 font-display text-2xl" style={{ color: '#0E2916' }}>Groupe ndaxal</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: '#EAF1EC', color: '#173F24' }}>15 amies</span>
          </div>

          <div className="mt-5 relative rounded-xl overflow-hidden">
            <div className="aspect-[3/1]" style={{ background: 'linear-gradient(135deg, #1B2A4E, #0E1A38, #0E2916)' }} />
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(212,165,116,.3) 0 2px, transparent 2px 16px), repeating-linear-gradient(-45deg, rgba(212,165,116,.2) 0 1px, transparent 1px 12px)' }} />
            <div className="absolute inset-x-0 bottom-0 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.6), transparent)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#D4A574' }}>Tissu choisi</div>
                  <div className="font-display text-base text-[#F7E9CF]">Bazin riche bleu nuit</div>
                </div>
                <span className="rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ background: '#D4A574', color: '#3D181C' }}>★ Voté</span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-sm" style={{ color: 'rgba(61,61,61,.75)' }}>Cotisations reçues</div>
              <div className="font-display text-xl" style={{ color: '#0E2916' }}>8<span className="text-sm" style={{ color: 'rgba(61,61,61,.4)' }}>/15</span></div>
            </div>
            <div className="bar"><i style={{ '--w': '53%' } as React.CSSProperties} /></div>
            <div className="mt-1.5 flex justify-between text-[11px]" style={{ fontFamily: 'var(--font-jetbrains)' }}>
              <span style={{ color: 'rgba(61,61,61,.55)' }}>53% reçues</span>
              <span style={{ color: '#1E5631' }}>{formatFCFA(425_000)} / {formatFCFA(800_000)}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex -space-x-2">
              {['linear-gradient(135deg,#722F37,#D4A574)', 'linear-gradient(135deg,#1E5631,#D4A574)', 'linear-gradient(135deg,#D4A574,#722F37)', 'linear-gradient(135deg,#0E2916,#722F37)', 'linear-gradient(135deg,#722F37,#1E5631)'].map((g, i) => (
                <div key={i} className="h-7 w-7 rounded-full ring-2 ring-white" style={{ background: g }} />
              ))}
              <div className="grid h-7 w-7 place-items-center rounded-full ring-2 ring-white text-[10px]" style={{ background: '#FAF7F2', fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.6)' }}>+10</div>
            </div>
            <div className="text-[12px]" style={{ color: 'rgba(61,61,61,.65)' }}>15 demoiselles d&apos;honneur</div>
          </div>

          <Link href="/app/tenues" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-75 transition" style={{ color: '#1E5631' }}>
            Gérer le groupe
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
          </Link>
        </article>
      </section>

      {/* ── COACH IA ── */}
      <section className="reveal mt-6 relative overflow-hidden rounded-3xl text-[#F7E9CF] p-6 sm:p-8 shadow-glow" style={{ background: 'linear-gradient(135deg, #0E2916, #1E5631, #3D181C)' }}>
        <div className="absolute inset-0 wax-bg opacity-25" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(212,165,116,.12)' }} />

        <div className="relative grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="h-16 w-16 rounded-2xl grid place-items-center" style={{ background: 'linear-gradient(135deg, #D4A574, #722F37, #1E5631)' }}>
                <span className="font-display text-2xl text-white">S</span>
              </div>
              <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full ring-2" style={{ background: '#D4A574', borderColor: '#0E2916' }}>
                <svg viewBox="0 0 16 16" className="h-3 w-3" style={{ color: '#3D181C' }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 8h.01M8 8h.01M12 8h.01"/></svg>
              </span>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#D4A574' }}>Sama Coach · IA</div>
              <div className="font-display text-2xl mt-1">Bonjour.</div>
              <p className="mt-1 text-sm" style={{ color: 'rgba(247,233,207,.8)' }}>Tu sembles stressée par le délai du traiteur. Voici 3 pistes pour respirer.</p>
              <div className="typing mt-2 text-[20px] leading-none" style={{ color: '#D4A574' }}>
                <span>·</span><span>·</span><span>·</span>
              </div>
            </div>
          </div>

          <ul className="lg:col-span-7 grid sm:grid-cols-3 gap-3">
            {[
              { n: '01', title: 'Bloque ton RDV avant vendredi', text: 'Le Carré a un créneau jeudi 14h. Signe les quantités définitives.' },
              { n: '02', title: 'Délègue à ta wedding planner', text: 'Ajoute Khady en co-pilote : elle peut négocier en ton nom. 2 clics.' },
              { n: '03', title: '4 min de respiration ce soir', text: 'Sama Sérénité a préparé une séance guidée wolof, 21h. Mérite ça.' },
            ].map(c => (
              <li key={c.n} className="rounded-2xl backdrop-blur p-4 ring-1" style={{ background: 'rgba(255,255,255,.08)', outlineColor: 'rgba(255,255,255,.1)' }}>
                <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#D4A574' }}>Conseil {c.n}</div>
                <h4 className="mt-2 font-display text-lg leading-tight" style={{ color: '#F7E9CF' }}>{c.title}</h4>
                <p className="mt-1.5 text-[12px] leading-snug" style={{ color: 'rgba(247,233,207,.75)' }}>{c.text}</p>
              </li>
            ))}
          </ul>

          <div className="lg:col-span-1 flex lg:justify-end">
            <Link href="/app/serenite" className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium hover:opacity-90 transition whitespace-nowrap" style={{ background: '#D4A574', color: '#3D181C' }}>
              Chatter
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
