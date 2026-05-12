'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { formatFCFA } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const INIT_TASKS = [
  { id: 1, title: 'Confirmer le photographe', bold: 'Adams Sidibé', sub: 'Confirmer pour les 3 cérémonies + livraison J+15', badge: 'J–5', variant: 'red', done: false },
  { id: 2, title: 'Commander les ', bold: 'faire-part', sub: '450 exemplaires · imprimeur Mansour Print', badge: 'J–7', variant: 'red', done: false },
  { id: 3, title: 'Validation finale traiteur ', bold: 'Le Carré', sub: 'Menu, quantités, allergies — RDV 14h', badge: 'J–10', variant: 'gold', done: false },
  { id: 4, title: 'Choisir ', bold: 'tissu groupe demoiselles', sub: '2 finalistes : bazin riche bleu nuit · brodé or', badge: 'J–12', variant: 'gold', done: false },
  { id: 5, title: 'RDV ', bold: 'tailleur essayage 2', sub: 'Tonton Modou, Sandaga · 16h30', badge: 'J–15', variant: 'royal', done: true },
]

const VENDORS = [
  { initials: 'AS', name: 'Adams Sidibé', role: 'Photographe · 850 000 F', status: 'Confirmé', statusVariant: 'royal', gradient: 'from-[#1E5631] to-[#D4A574]' },
  { initials: 'LC', name: 'Le Carré', role: 'Traiteur · 2 640 000 F', status: 'Confirmé', statusVariant: 'royal', gradient: 'from-[#722F37] to-[#D4A574]' },
  { initials: 'AD', name: 'Aida Décor', role: 'Décoration · devis à 1 200 000 F', status: 'En cours', statusVariant: 'gold', gradient: 'from-[#D4A574] to-[#1E5631]' },
  { initials: 'DB', name: 'DJ Bouba', role: 'Animation · devis reçu hier', status: 'Devis', statusVariant: 'bordeaux', gradient: 'from-[#0E2916] to-[#722F37]' },
]

export default function DashboardPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [diasporaOn, setDiasporaOn] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [tasks, setTasks] = useState(INIT_TASKS)

  const { data: wedding } = trpc.wedding.getMine.useQuery()
  const weddingId = wedding?.id ?? ''
  const { data: budget } = trpc.budget.get.useQuery({ weddingId }, { enabled: !!weddingId })
  const { data: ndawtalStats } = trpc.ndawtal.stats.useQuery({ weddingId }, { enabled: !!weddingId })

  const daysUntil = wedding?.weddingDate
    ? Math.max(0, Math.ceil((new Date(wedding.weddingDate).getTime() - Date.now()) / 86400000))
    : 216

  const totalSpent = budget?.categories?.reduce((s, c) => s + c.amountSpent, 0) ?? 0
  const totalPlanned = budget?.totalPlanned ?? 0
  const budgetPct = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 35

  const ndawtalTotal = ndawtalStats?.totalCollected ?? 0
  const ndawtalDonors = ndawtalStats?.donorCount ?? 0

  useEffect(() => {
    // Donut animation
    const C = 2 * Math.PI * 38
    document.querySelectorAll<SVGCircleElement>('.donut .seg').forEach((seg, i) => {
      const target = seg.getAttribute('data-target') ?? '0'
      seg.style.strokeDashoffset = String(C)
      setTimeout(() => {
        seg.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1)'
        seg.style.strokeDashoffset = target
      }, 250 + i * 120)
    })
    // Scroll reveal
    const reveals = document.querySelectorAll<HTMLElement>('.reveal')
    const inView = (el: Element) => { const r = el.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0 }
    reveals.forEach(el => { if (inView(el)) el.classList.add('in') })
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
    }, { threshold: 0.1 })
    reveals.forEach(el => { if (!el.classList.contains('in')) io.observe(el) })
    const t = setTimeout(() => document.querySelectorAll('.reveal:not(.in)').forEach(el => el.classList.add('in')), 1200)
    // Close dropdowns on outside click
    const close = () => { setNotifOpen(false); setAvatarOpen(false) }
    document.addEventListener('click', close)
    return () => { io.disconnect(); clearTimeout(t); document.removeEventListener('click', close) }
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/connexion')
  }

  const navItems = [
    { href: '/app', label: 'Vue d\'ensemble', badge: null, icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg> },
    { href: '/app/mood', label: 'Sama Mood', badge: null, icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg> },
    { href: '/app/budget', label: 'Sama Budget', badge: budget && totalSpent > totalPlanned * 0.9 ? '!' : null, badgeVariant: 'bordeaux', icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h3l3-8 4 16 3-8h5"/></svg> },
    { href: '/app/planning', label: 'Sama Planning', badge: null, icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg> },
    { href: '/app/prestataires', label: 'Sama Prestataires', badge: null, icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h10M4 17h14"/></svg> },
    { href: '/app/ndawtal', label: 'Sama Ndawtal', badge: 'New', badgeVariant: 'gold', icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s-7-4-7-11a7 7 0 0 1 14 0c0 7-7 11-7 11z"/><circle cx="12" cy="10" r="3"/></svg> },
    { href: '/app/tenues', label: 'Sama Tenues', badge: null, icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 4l3 3h8l3-3M5 4l-1 6 8 10 8-10-1-6"/></svg> },
    { href: '/app/invites', label: 'Sama Invités', badge: null, icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 21c0-3 3-6 6-6s6 3 6 6M14 19c0-2 2-4 4-4s4 2 4 4"/></svg> },
    { href: '/app/serenite', label: 'Sama Sérénité', badge: null, icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s-7-4-7-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-11 11-11 11z"/></svg> },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#FAF7F2' }}>

      {/* Mobile drawer backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-[#0E2916]/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className="fixed left-0 top-0 z-50 h-screen w-[260px] flex flex-col border-r border-black/5 bg-white transition-transform duration-300"
        style={{ transform: sidebarOpen ? 'translateX(0)' : undefined }}
      >
        <style>{`@media(min-width:1024px){aside{transform:translateX(0)!important}}@media(max-width:1023px){aside{transform:translateX(-100%)}}`}</style>

        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b border-black/5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="relative grid h-9 w-9 place-items-center rounded-xl shadow-glow" style={{ background: '#1E5631' }}>
              <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" stroke="#D4A574" strokeWidth="1.6">
                <path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z"/>
                <path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z"/>
                <path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3"/>
              </svg>
            </span>
            <span className="font-display text-[20px] leading-none">
              <span style={{ color: '#1E5631' }}>Sama</span><span className="gold-shine font-semibold">Mariage</span>
            </span>
          </Link>
        </div>

        {/* Profile mini */}
        <div className="mx-3 mt-4 rounded-2xl p-3 ring-1 ring-black/5" style={{ background: 'linear-gradient(135deg, #FAF7F2, rgba(244,228,193,.4))' }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-11 w-11 rounded-full ring-2 ring-white" style={{ background: 'linear-gradient(135deg, #722F37, #D4A574, #1E5631)' }} />
              <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-white ring-1 ring-black/10">
                <span className="h-2 w-2 rounded-full" style={{ background: '#1E5631' }} />
              </span>
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold" style={{ color: '#0E2916' }}>
                {wedding?.partnerName ? `& ${wedding.partnerName}` : 'Mon mariage'}
              </div>
              <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: '#722F37' }}>
                J-{daysUntil} · {wedding?.weddingDate ? new Date(wedding.weddingDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' }) : '15 déc 2026'}
              </div>
            </div>
          </div>
          <div className="mt-3 h-1 rounded-full bg-white">
            <div className="h-full rounded-full" style={{ width: `${budgetPct || 35}%`, background: 'linear-gradient(90deg, #1E5631, #D4A574, #722F37)' }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px]" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.55)' }}>
            <span>Préparation</span><span>{budgetPct || 35}%</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="mt-5 px-3 flex-1 nice-scroll overflow-y-auto">
          <div className="px-2 text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.4)' }}>Mon mariage</div>
          <ul className="mt-2 space-y-0.5">
            {navItems.map(item => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link href={item.href} className={`nav-item ${isActive ? 'active' : 'text-[#3D3D3D]/75'}`} onClick={() => setSidebarOpen(false)}>
                    <span className="nav-icon">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      item.badgeVariant === 'gold'
                        ? <span className="rounded-full px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest" style={{ background: 'rgba(212,165,116,.2)', color: '#B98548' }}>{item.badge}</span>
                        : <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: 'rgba(114,47,55,.1)', color: '#722F37' }}>{item.badge}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom: diaspora + settings */}
        <div className="px-3 py-3 border-t border-black/5">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1" style={{ background: 'linear-gradient(135deg, rgba(114,47,55,.08), rgba(234,241,236,1))', borderColor: 'rgba(114,47,55,.1)' }}>
            <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: '#722F37', color: '#F7E9CF' }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold leading-tight" style={{ color: '#0E2916' }}>Mode Diaspora</div>
              <div className="text-[10px] leading-tight" style={{ color: 'rgba(61,61,61,.55)' }}>Pilote depuis l&apos;étranger</div>
            </div>
            <button
              onClick={() => setDiasporaOn(v => !v)}
              className={`switch ${diasporaOn ? 'on' : ''}`}
              aria-label="Mode diaspora"
            />
          </div>
          <ul className="mt-2 space-y-0.5">
            <li><Link href="#" className="nav-item text-[#3D3D3D]/70"><span className="nav-icon"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2.1-1.6-2-3.4-2.5 1a7 7 0 0 0-2.1-1.2L14 3h-4l-.4 2.6c-.8.3-1.5.7-2.1 1.2l-2.5-1-2 3.4 2.1 1.6A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2.1 1.6 2 3.4 2.5-1c.6.5 1.3.9 2.1 1.2L10 21h4l.4-2.6c.8-.3 1.5-.7 2.1-1.2l2.5 1 2-3.4-2.1-1.6c0-.4.1-.8.1-1.2z"/></svg></span>Paramètres</Link></li>
            <li><Link href="#" className="nav-item text-[#3D3D3D]/70"><span className="nav-icon"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 3c-1 .6-2 1.4-2 2.5M12 18h.01"/></svg></span>Aide & support</Link></li>
          </ul>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="lg:pl-[260px] min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-black/5 backdrop-blur-md" style={{ background: 'rgba(250,247,242,.88)' }}>
          <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3.5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden grid h-10 w-10 place-items-center rounded-xl border border-black/10 bg-white"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            </button>

            <div className="hidden sm:block flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: '#722F37' }}>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · J-{daysUntil}
              </div>
              <h1 className="font-display text-xl sm:text-2xl leading-tight truncate" style={{ color: '#0E2916' }}>
                Bonjour <span className="inline-block">👋</span>
              </h1>
            </div>
            <div className="sm:hidden flex-1 min-w-0">
              <h1 className="font-display text-lg leading-tight truncate" style={{ color: '#0E2916' }}>Bonjour 👋</h1>
              <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: '#722F37' }}>J-{daysUntil}</div>
            </div>

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 w-64 lg:w-80 rounded-xl bg-white px-3 py-2" style={{ outline: '1px solid rgba(61,61,61,.08)' }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" style={{ color: 'rgba(61,61,61,.5)' }} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              <input type="search" placeholder="Prestataire, invité, dépense…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#3D3D3D' }} />
              <kbd className="hidden lg:inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px]" style={{ fontFamily: 'Georgia', background: '#FAF7F2', color: 'rgba(61,61,61,.45)', outline: '1px solid rgba(61,61,61,.08)' }}>⌘K</kbd>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setAvatarOpen(false); setNotifOpen(v => !v) }}
                className="relative grid h-10 w-10 place-items-center rounded-xl bg-white transition hover:bg-[#FAF7F2]"
                style={{ outline: '1px solid rgba(61,61,61,.08)' }}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" style={{ color: 'rgba(61,61,61,.75)' }} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4"/></svg>
                <span className="absolute -top-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold ring-2" style={{ background: '#722F37', color: '#FBF4EA', borderColor: '#FAF7F2' }}>3</span>
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full ping-soft" style={{ background: 'rgba(114,47,55,.4)' }} />
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white shadow-card ring-1 overflow-hidden" style={{ outline: '1px solid rgba(61,61,61,.05)' }} onClick={e => e.stopPropagation()}>
                  <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between">
                    <div className="font-display text-base" style={{ color: '#0E2916' }}>Notifications</div>
                    <button className="text-[11px] uppercase tracking-widest hover:underline" style={{ fontFamily: 'Georgia', color: '#1E5631' }}>Tout lire</button>
                  </div>
                  <ul className="divide-y divide-black/5">
                    {[
                      { dot: '#722F37', text: <><strong style={{ color: '#0E2916' }}>Adams Sidibé</strong> a confirmé pour les 3 jours.</>, time: 'Il y a 12 min · Prestataires' },
                      { dot: '#722F37', text: <>3 nouvelles RSVP reçues. Total <strong style={{ color: '#0E2916' }}>127 / 450</strong>.</>, time: 'Il y a 2h · Invités' },
                      { dot: '#722F37', text: <>⚠ Dépassement <strong style={{ color: '#722F37' }}>décoration +8%</strong> détecté.</>, time: 'Hier · Budget' },
                    ].map((n, i) => (
                      <li key={i} className="px-4 py-3 cursor-pointer hover:bg-[#FAF7F2]/60">
                        <div className="flex gap-3">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: n.dot }} />
                          <div>
                            <p className="text-[13px] leading-snug">{n.text}</p>
                            <div className="mt-0.5 text-[10px]" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.45)' }}>{n.time}</div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setNotifOpen(false); setAvatarOpen(v => !v) }}
                className="flex items-center gap-2 rounded-xl bg-white px-1.5 py-1.5 transition hover:bg-[#FAF7F2]"
                style={{ outline: '1px solid rgba(61,61,61,.08)' }}
              >
                <span className="h-7 w-7 rounded-full" style={{ background: 'linear-gradient(135deg, #722F37, #D4A574, #1E5631)' }} />
                <svg viewBox="0 0 16 16" className="hidden sm:block h-3 w-3" style={{ color: 'rgba(61,61,61,.55)' }} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 6 4 4 4-4"/></svg>
              </button>
              {avatarOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-card overflow-hidden" style={{ outline: '1px solid rgba(61,61,61,.05)' }} onClick={e => e.stopPropagation()}>
                  <div className="px-4 py-3 border-b border-black/5">
                    <div className="text-sm font-semibold" style={{ color: '#0E2916' }}>Mon compte</div>
                  </div>
                  <ul className="py-1.5 text-sm">
                    <li><Link href="#" className="block px-4 py-2 hover:bg-[#FAF7F2]">Mon profil</Link></li>
                    <li><Link href="#" className="block px-4 py-2 hover:bg-[#FAF7F2]">Facturation</Link></li>
                    <li><button onClick={handleLogout} className="w-full text-left block px-4 py-2 hover:bg-[#FAF7F2]" style={{ color: '#722F37' }}>Déconnexion</button></li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1400px] mx-auto">

          {/* ── HERO KPI ── */}
          <section className="reveal relative overflow-hidden rounded-3xl text-[#F7E9CF] shadow-glow" style={{ background: 'linear-gradient(135deg, #173F24, #1E5631, #0E2916)' }}>
            <div className="absolute inset-0 wax-bg opacity-30" />
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full blur-3xl" style={{ background: 'rgba(212,165,116,.15)' }} />
            <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full blur-3xl" style={{ background: 'rgba(114,47,55,.3)' }} />

            <div className="relative p-6 sm:p-8 grid lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              <div className="lg:col-span-5">
                <div className="text-[10px] uppercase tracking-[.2em]" style={{ fontFamily: 'Georgia', color: '#D4A574' }}>Ton mariage en chiffres</div>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl leading-[1.1]">
                  J–{daysUntil} avant le grand jour.<br/>
                  <span className="gold-shine italic font-normal">Tout est sous contrôle.</span>
                </h2>
                <p className="mt-3 max-w-sm text-sm" style={{ color: 'rgba(247,233,207,.8)' }}>
                  {wedding?.ceremonies?.length ? wedding.ceremonies.map(c => c.type.charAt(0).toUpperCase() + c.type.slice(1)).join(' · ') : 'Takk · Céet · Réception'} — {wedding?.city ?? 'Dakar'}. Style : <span style={{ color: '#D4A574' }}>{wedding?.style ? wedding.style.charAt(0).toUpperCase() + wedding.style.slice(1) : 'Royal sénégalais'}</span>.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Link href="/app/budget" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition hover:opacity-90" style={{ background: '#D4A574', color: '#3D181C' }}>
                    Continuer où j&apos;en étais
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
                  </Link>
                  <Link href="/app/planning" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition hover:bg-white/5" style={{ borderColor: 'rgba(212,165,116,.3)', color: '#F7E9CF' }}>
                    Voir le rétroplanning
                  </Link>
                </div>
              </div>

              {/* 4 KPIs */}
              <div className="lg:col-span-7 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    icon: <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h3l3-8 4 16 3-8h5"/></svg>,
                    label: 'Budget', main: totalPlanned > 0 ? `${Math.round(totalSpent / 1_000_000 * 10) / 10}M` : '4,2M',
                    sub: `sur ${totalPlanned > 0 ? Math.round(totalPlanned / 1_000_000) : 12}M FCFA`,
                    pct: budgetPct || 35, dot: '#D4A574',
                  },
                  { icon: <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="m4 12 5 5L20 6"/></svg>, label: 'Tâches', main: '23', sub: '/87 complétées', pct: 26, dot: 'rgba(114,47,55,.8)' },
                  { icon: <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>, label: 'Invités', main: '127', sub: '/450 confirmés', pct: 28, dot: '#D4A574' },
                  { icon: <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>, label: 'Prestataires', main: '4', sub: '/12 bookés', pct: 33, dot: '#D4A574' },
                ].map(kpi => (
                  <div key={kpi.label} className="rounded-2xl backdrop-blur p-4 ring-1" style={{ background: 'rgba(255,255,255,.08)', outlineColor: 'rgba(255,255,255,.1)' }}>
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: 'rgba(212,165,116,.9)' }}>
                      {kpi.icon}{kpi.label}
                    </div>
                    <div className="mt-2 font-display text-2xl leading-none" style={{ color: '#F7E9CF' }}>
                      {kpi.main}<span className="text-base" style={{ color: '#D4A574' }}>{kpi.label === 'Budget' ? 'M' : ''}</span>
                    </div>
                    <div className="mt-0.5 text-[11px]" style={{ color: 'rgba(247,233,207,.7)' }}>{kpi.sub}</div>
                    <div className="mt-3 bar" style={{ background: 'rgba(255,255,255,.15)' }}>
                      <i style={{ '--w': `${kpi.pct}%` } as React.CSSProperties} />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px]" style={{ fontFamily: 'Georgia' }}>
                      <span style={{ color: 'rgba(247,233,207,.7)' }}>{kpi.pct}%</span>
                      <span style={{ color: kpi.dot }}>●</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── 6 CARDS GRID ── */}
          <section className="mt-6 grid md:grid-cols-2 gap-5">

            {/* CARD 1: Tasks */}
            <article className="dashboard-card reveal d1 rounded-2xl bg-white p-5 sm:p-6 shadow-card ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: '#722F37' }}>Cette semaine</div>
                  <h3 className="mt-1 font-display text-2xl" style={{ color: '#0E2916' }}>Tâches urgentes</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: 'rgba(114,47,55,.1)', color: '#722F37' }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#722F37' }} /> {tasks.filter(t => !t.done).length} à faire
                </span>
              </div>

              <ul className="mt-5 divide-y rounded-xl overflow-hidden" style={{ outline: '1px solid rgba(61,61,61,.05)' }}>
                {tasks.map(task => (
                  <li
                    key={task.id}
                    className={`task-row flex items-center gap-3 px-3 py-3 ${task.done ? 'done' : ''}`}
                    onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
                  >
                    <input
                      type="checkbox"
                      className="check"
                      checked={task.done}
                      onChange={e => { e.stopPropagation(); setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: e.target.checked } : t)) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="task-title text-sm" style={{ color: '#0E2916' }}>
                        {task.title}<strong>{task.bold}</strong>
                      </div>
                      <div className="text-[11px]" style={{ color: 'rgba(61,61,61,.5)' }}>{task.sub}</div>
                    </div>
                    <span className="font-mono text-[10px] rounded-full px-2 py-0.5 shrink-0" style={{
                      fontFamily: 'Georgia',
                      background: task.variant === 'red' ? 'rgba(114,47,55,.1)' : task.variant === 'gold' ? '#FBF4EA' : '#EAF1EC',
                      color: task.variant === 'red' ? '#722F37' : task.variant === 'gold' ? '#B98548' : '#1E5631',
                    }}>{task.badge}</span>
                  </li>
                ))}
              </ul>

              <Link href="/app/planning" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-75 transition" style={{ color: '#1E5631' }}>
                Voir toutes mes 87 tâches
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
              </Link>
            </article>

            {/* CARD 2: Mood Board */}
            <article className="dashboard-card reveal d2 rounded-2xl bg-white p-5 sm:p-6 shadow-card ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: '#722F37' }}>Sama Mood</div>
                  <h3 className="mt-1 font-display text-2xl" style={{ color: '#0E2916' }}>Ton mood board</h3>
                  <div className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: '#EAF1EC', color: '#173F24' }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#1E5631' }} />
                    {wedding?.style ? wedding.style.charAt(0).toUpperCase() + wedding.style.slice(1) : 'Royal sénégalais moderne'}
                  </div>
                </div>
                <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#EAF1EC] transition" style={{ background: '#FAF7F2' }}>
                  <svg viewBox="0 0 20 20" className="h-4 w-4" style={{ color: '#1E5631' }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 4v12M4 10h12"/></svg>
                </button>
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
                <div className="text-[12px]" style={{ color: 'rgba(61,61,61,.65)' }}><strong style={{ color: '#0E2916' }}>+12 inspirations</strong> ajoutées cette semaine</div>
                <Link href="/app/mood" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition hover:opacity-90" style={{ background: '#1E5631', color: '#F7E9CF' }}>
                  Ouvrir <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
                </Link>
              </div>
            </article>

            {/* CARD 3: Budget */}
            <article className="dashboard-card reveal d3 rounded-2xl bg-white p-5 sm:p-6 shadow-card ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: '#722F37' }}>Sama Budget</div>
                  <h3 className="mt-1 font-display text-2xl" style={{ color: '#0E2916' }}>Répartition budget</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: 'rgba(114,47,55,.1)', color: '#722F37' }}>⚠ Alerte</span>
              </div>

              <div className="mt-5 flex items-center gap-5">
                {/* Donut SVG */}
                <div className="relative shrink-0">
                  <svg viewBox="0 0 100 100" className="donut h-32 w-32" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#F4E4C1" strokeWidth="16"/>
                    <circle className="seg" cx="50" cy="50" r="38" fill="none" stroke="#1E5631" strokeWidth="16" strokeDasharray="238.76" strokeDashoffset="171.91" data-target="171.91"/>
                    <circle className="seg" cx="50" cy="50" r="38" fill="none" stroke="#D4A574" strokeWidth="16" strokeDasharray="238.76" strokeDashoffset="186.23" data-target="186.23" style={{ transform: 'rotate(100.8deg)', transformOrigin: 'center' }}/>
                    <circle className="seg" cx="50" cy="50" r="38" fill="none" stroke="#722F37" strokeWidth="16" strokeDasharray="238.76" strokeDashoffset="202.95" data-target="202.95" style={{ transform: 'rotate(180deg)', transformOrigin: 'center' }}/>
                    <circle className="seg" cx="50" cy="50" r="38" fill="none" stroke="#3D3D3D" strokeWidth="16" strokeDasharray="238.76" strokeDashoffset="155.19" data-target="155.19" opacity=".25" style={{ transform: 'rotate(234deg)', transformOrigin: 'center' }}/>
                  </svg>
                  <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                      <div className="font-display text-xl leading-none" style={{ color: '#0E2916' }}>
                        {totalPlanned > 0 ? `${Math.round(totalSpent / 1_000_000 * 10) / 10}M` : '4,2M'}
                      </div>
                      <div className="text-[9px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.55)' }}>dépensés</div>
                    </div>
                  </div>
                </div>

                <ul className="flex-1 min-w-0 space-y-2.5 text-sm">
                  {[
                    { dot: '#1E5631', label: 'Lieu de réception', pct: '28%' },
                    { dot: '#D4A574', label: 'Traiteur', pct: '22%' },
                    { dot: '#722F37', label: 'Tenues & ndaxal', pct: '15%' },
                    { dot: 'rgba(61,61,61,.25)', label: 'Autres (8 postes)', pct: '35%', muted: true },
                  ].map(row => (
                    <li key={row.label} className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: row.dot }} />
                      <span className="flex-1" style={{ color: row.muted ? 'rgba(61,61,61,.55)' : 'rgba(61,61,61,.85)' }}>{row.label}</span>
                      <span className="font-mono font-medium" style={{ fontFamily: 'Georgia', color: row.muted ? undefined : '#0E2916' }}>{row.pct}</span>
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
                  <div style={{ color: 'rgba(61,61,61,.65)' }}>Tu es à 540 000 F au-dessus du budget alloué. Sama Budget propose 3 ajustements.</div>
                </div>
              </div>

              <Link href="/app/budget" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-75 transition" style={{ color: '#1E5631' }}>
                Voir mon budget complet
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
              </Link>
            </article>

            {/* CARD 4: Ndawtal */}
            <article className="dashboard-card reveal d4 relative overflow-hidden rounded-2xl text-[#F7E9CF] p-5 sm:p-6 ring-1" style={{ background: 'linear-gradient(135deg, #3D181C, #722F37, #0E2916)', outlineColor: '#3D181C' }}>
              <div className="absolute inset-0 wax-bg opacity-30" />
              <div className="absolute -right-12 -bottom-12 h-48 w-48 rounded-full blur-2xl" style={{ background: 'rgba(212,165,116,.15)' }} />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: '#D4A574' }}>Sama Ndawtal</div>
                    <h3 className="mt-1 font-display text-2xl">Ton ndawtal en temps réel</h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: 'rgba(212,165,116,.15)', color: '#D4A574' }}>
                    <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#D4A574' }} /> Live
                  </span>
                </div>

                <div className="mt-6 flex items-baseline gap-2">
                  <div className="font-display text-5xl">{ndawtalTotal > 0 ? `${Math.round(ndawtalTotal / 1000)}k` : '0'}</div>
                  <div className="text-sm" style={{ color: 'rgba(247,233,207,.7)' }}>FCFA reçus</div>
                </div>
                <p className="mt-2 max-w-sm text-sm" style={{ color: 'rgba(247,233,207,.8)' }}>
                  {ndawtalTotal > 0
                    ? `${ndawtalDonors} donateur${ndawtalDonors > 1 ? 's' : ''} enregistré${ndawtalDonors > 1 ? 's' : ''} jusqu&apos;à présent.`
                    : 'Normal — tu n\'es pas encore mariée 😊 Mais on prépare déjà le terrain.'}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl backdrop-blur p-3 ring-1" style={{ background: 'rgba(255,255,255,.08)', outlineColor: 'rgba(255,255,255,.1)' }}>
                    <div className="font-display text-2xl" style={{ color: '#F7E9CF' }}>{ndawtalDonors || 47}</div>
                    <div className="text-[11px]" style={{ color: 'rgba(247,233,207,.7)' }}>confirmés présents</div>
                  </div>
                  <div className="rounded-xl backdrop-blur p-3 ring-1" style={{ background: 'rgba(255,255,255,.08)', outlineColor: 'rgba(255,255,255,.1)' }}>
                    <div className="font-display text-2xl" style={{ color: '#F7E9CF' }}>12</div>
                    <div className="text-[11px]" style={{ color: 'rgba(247,233,207,.7)' }}>tontons/tantes VIP</div>
                  </div>
                </div>

                <p className="mt-5 text-[12px] leading-snug" style={{ color: 'rgba(247,233,207,.65)' }}>
                  💡 Prépare ta liste des contributeurs maintenant. Le jour J, l&apos;app trace chaque don automatiquement.
                </p>

                <Link href="/app/ndawtal" className="mt-5 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition hover:opacity-90" style={{ background: '#D4A574', color: '#3D181C' }}>
                  {ndawtalTotal > 0 ? 'Voir mon ndawtal' : 'Configurer mon ndawtal'}
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
                </Link>
              </div>
            </article>

            {/* CARD 5: Prestataires */}
            <article className="dashboard-card reveal d5 rounded-2xl bg-white p-5 sm:p-6 shadow-card ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: '#722F37' }}>Sama Prestataires</div>
                  <h3 className="mt-1 font-display text-2xl" style={{ color: '#0E2916' }}>Mes prestataires</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: '#EAF1EC', color: '#173F24' }}>4 / 12 bookés</span>
              </div>

              <ul className="mt-5 space-y-2.5">
                {VENDORS.map(v => (
                  <li key={v.initials} className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-[#FAF7F2]/60">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${v.gradient} font-display text-base text-white`}>{v.initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium" style={{ color: '#0E2916' }}>{v.name}</span>
                        {v.statusVariant === 'royal' && (
                          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="#1E5631"><circle cx="8" cy="8" r="7"/><path d="m5 8 2 2 4-4" stroke="#F7E9CF" strokeWidth="1.6" fill="none"/></svg>
                        )}
                      </div>
                      <div className="text-[11px]" style={{ color: 'rgba(61,61,61,.6)' }}>{v.role}</div>
                    </div>
                    <span className="rounded-full px-2 py-0.5 text-[10px] shrink-0" style={{
                      fontFamily: 'Georgia',
                      background: v.statusVariant === 'royal' ? '#EAF1EC' : v.statusVariant === 'gold' ? '#FBF4EA' : 'rgba(114,47,55,.1)',
                      color: v.statusVariant === 'royal' ? '#1E5631' : v.statusVariant === 'gold' ? '#B98548' : '#722F37',
                    }}>{v.status}</span>
                  </li>
                ))}
              </ul>

              <Link href="/app/prestataires" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-75 transition" style={{ color: '#1E5631' }}>
                Explorer 500+ prestataires
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
              </Link>
            </article>

            {/* CARD 6: Tenues / Ndaxal */}
            <article className="dashboard-card reveal d6 rounded-2xl bg-white p-5 sm:p-6 shadow-card ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: '#722F37' }}>Sama Tenues</div>
                  <h3 className="mt-1 font-display text-2xl" style={{ color: '#0E2916' }}>Groupe ndaxal</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: '#EAF1EC', color: '#173F24' }}>15 amies</span>
              </div>

              {/* Fabric preview */}
              <div className="mt-5 relative rounded-xl overflow-hidden">
                <div className="aspect-[3/1]" style={{ background: 'linear-gradient(135deg, #1B2A4E, #0E1A38, #0E2916)' }} />
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(212,165,116,.3) 0 2px, transparent 2px 16px), repeating-linear-gradient(-45deg, rgba(212,165,116,.2) 0 1px, transparent 1px 12px)' }} />
                <div className="absolute inset-x-0 bottom-0 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.6), transparent)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: '#D4A574' }}>Tissu choisi</div>
                      <div className="font-display text-base text-[#F7E9CF]">Bazin riche bleu nuit</div>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ background: '#D4A574', color: '#3D181C' }}>★ Voté</span>
                  </div>
                </div>
              </div>

              {/* Cotisations */}
              <div className="mt-5">
                <div className="flex items-baseline justify-between">
                  <div className="text-sm" style={{ color: 'rgba(61,61,61,.75)' }}>Cotisations</div>
                  <div className="font-display text-xl" style={{ color: '#0E2916' }}>8<span className="text-sm" style={{ color: 'rgba(61,61,61,.4)' }}>/15</span></div>
                </div>
                <div className="mt-2 bar"><i style={{ '--w': '53%' } as React.CSSProperties} /></div>
                <div className="mt-1.5 flex justify-between text-[11px]" style={{ fontFamily: 'Georgia' }}>
                  <span style={{ color: 'rgba(61,61,61,.55)' }}>53% reçues</span>
                  <span style={{ color: '#1E5631' }}>{formatFCFA(425_000)} / {formatFCFA(800_000)}</span>
                </div>
              </div>

              {/* Avatar stack */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[
                    'from-[#722F37] to-[#D4A574]', 'from-[#1E5631] to-[#D4A574]',
                    'from-[#D4A574] to-[#722F37]', 'from-[#0E2916] to-[#722F37]',
                    'from-[#722F37] to-[#1E5631]',
                  ].map((g, i) => (
                    <div key={i} className={`h-7 w-7 rounded-full bg-gradient-to-br ${g} ring-2 ring-white`} />
                  ))}
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-[#FAF7F2] ring-2 ring-white text-[10px]" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.6)' }}>+10</div>
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
                  <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full ring-2" style={{ background: '#D4A574', outlineColor: '#0E2916' }}>
                    <svg viewBox="0 0 16 16" className="h-3 w-3" style={{ color: '#3D181C' }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 8h.01M8 8h.01M12 8h.01"/></svg>
                  </span>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: '#D4A574' }}>Sama Coach · IA</div>
                  <div className="font-display text-2xl mt-1">Bonjour.</div>
                  <p className="mt-1 text-sm" style={{ color: 'rgba(247,233,207,.8)' }}>Tu sembles stressée par le délai du traiteur. Voici 3 pistes pour respirer.</p>
                  <div className="typing mt-2 text-[20px] leading-none" style={{ color: '#D4A574' }}>
                    <span>·</span><span>·</span><span>·</span>
                  </div>
                </div>
              </div>

              <ul className="lg:col-span-7 grid sm:grid-cols-3 gap-3">
                {[
                  { n: '01', title: 'Bloque ton RDV avant vendredi', text: 'Le Carré a un créneau à 14h jeudi. Verrouille la signature des quantités définitives — après ça devient cher.' },
                  { n: '02', title: 'Délègue à ta wedding planner', text: 'Ajoute Khady en co-pilote sur ce module : elle peut négocier en ton nom. Réglage 2 clics.' },
                  { n: '03', title: '4 min de respiration ce soir', text: 'Sama Sérénité a préparé une séance guidée wolof, 21h. Ton sommeil mérite ça.' },
                ].map(c => (
                  <li key={c.n} className="rounded-2xl backdrop-blur p-4 ring-1" style={{ background: 'rgba(255,255,255,.08)', outlineColor: 'rgba(255,255,255,.1)' }}>
                    <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: '#D4A574' }}>Conseil {c.n}</div>
                    <h4 className="mt-2 font-display text-lg leading-tight" style={{ color: '#F7E9CF' }}>{c.title}</h4>
                    <p className="mt-1.5 text-[12px] leading-snug" style={{ color: 'rgba(247,233,207,.75)' }}>{c.text}</p>
                  </li>
                ))}
              </ul>

              <div className="lg:col-span-1 flex lg:justify-end">
                <Link href="/app/serenite" className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium transition hover:opacity-90 whitespace-nowrap" style={{ background: '#D4A574', color: '#3D181C' }}>
                  Chatter
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
                </Link>
              </div>
            </div>
          </section>

          <div className="py-10 text-center text-[11px] uppercase tracking-widest" style={{ fontFamily: 'Georgia', color: 'rgba(61,61,61,.35)' }}>
            Sama Mariage, sama xewël — mon mariage, ma joie 🇸🇳
          </div>
        </main>
      </div>

      {/* ── DIASPORA FLOATING BANNER ── */}
      {diasporaOn && (
        <div className="fixed left-1/2 bottom-5 z-40 float-banner" style={{ transform: 'translateX(-50%)' }}>
          <div className="rounded-full text-[#F7E9CF] px-5 py-3 shadow-glow flex items-center gap-3 ring-1" style={{ background: '#722F37', outlineColor: 'rgba(212,165,116,.4)' }}>
            <span className="grid h-7 w-7 place-items-center rounded-full" style={{ background: '#D4A574', color: '#3D181C' }}>🌍</span>
            <div className="text-[13px]">Mode <strong>Diaspora</strong> activé · coordinatrice Dakar notifiée</div>
            <button
              onClick={() => setDiasporaOn(false)}
              className="ml-2 transition hover:opacity-100 opacity-70"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4l8 8M12 4l-8 8"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
