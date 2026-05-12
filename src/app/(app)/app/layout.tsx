'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { createClient } from '@/lib/supabase/client'
import { Toaster } from '@/components/ui/sonner'

/* ── Breadcrumb map ── */
const PAGE_META: Record<string, { title: string; sub: string }> = {
  '/app':              { title: 'Bonjour Aïssatou 👋', sub: 'Vue d\'ensemble' },
  '/app/mood':         { title: 'Sama Mood',         sub: 'Ton board d\'inspiration' },
  '/app/budget':       { title: 'Sama Budget',        sub: 'Gestion intelligente du budget' },
  '/app/planning':     { title: 'Sama Planning',      sub: 'Rétroplanning IA' },
  '/app/prestataires': { title: 'Sama Prestataires',  sub: 'Explorer & booker les meilleurs' },
  '/app/ndawtal':      { title: 'Sama Ndawtal',       sub: 'Dons & cadeaux en temps réel' },
  '/app/tenues':       { title: 'Sama Tenues',        sub: 'Groupe ndaxal' },
  '/app/invites':      { title: 'Sama Invités',       sub: 'Gestion des RSVP' },
  '/app/serenite':     { title: 'Sama Sérénité',      sub: 'Ton coach anti-stress' },
}

const NOTIFS = [
  { dot: '#722F37', text: 'Adams Sidibé a confirmé pour les 3 jours.', strong: 'Adams Sidibé', time: 'Il y a 12 min · Prestataires' },
  { dot: '#722F37', text: '3 nouvelles RSVP reçues. Total 127 / 450.', strong: '127 / 450', time: 'Il y a 2h · Invités' },
  { dot: '#D4A574', text: 'Dépassement décoration +8% détecté.', strong: 'décoration +8%', time: 'Hier · Budget' },
]

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [diasporaOn, setDiasporaOn] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)

  const { data: wedding } = trpc.wedding.getMine.useQuery()
  const weddingId = wedding?.id ?? ''
  const { data: budget } = trpc.budget.get.useQuery({ weddingId }, { enabled: !!weddingId })

  const daysUntil = wedding?.weddingDate
    ? Math.max(0, Math.ceil((new Date(wedding.weddingDate).getTime() - Date.now()) / 86400000))
    : 216
  const totalSpent  = budget?.categories?.reduce((s, c) => s + c.amountSpent, 0) ?? 0
  const totalPlanned = budget?.totalPlanned ?? 0
  const budgetPct   = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 35

  /* derive best matching meta key (handles /app/budget/[id]) */
  const metaKey = Object.keys(PAGE_META)
    .filter(k => pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0] ?? '/app'
  const meta = PAGE_META[metaKey]

  useEffect(() => {
    const close = () => { setNotifOpen(false); setAvatarOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/connexion')
  }

  const navItems = [
    {
      href: '/app', label: 'Vue d\'ensemble', badge: null, bv: '',
      icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>,
    },
    {
      href: '/app/mood', label: 'Sama Mood', badge: null, bv: '',
      icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>,
    },
    {
      href: '/app/budget', label: 'Sama Budget',
      badge: budget && totalPlanned > 0 && totalSpent > totalPlanned * 0.9 ? '⚠' : null, bv: 'bordeaux',
      icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h3l3-8 4 16 3-8h5"/></svg>,
    },
    {
      href: '/app/planning', label: 'Sama Planning', badge: null, bv: '',
      icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>,
    },
    {
      href: '/app/prestataires', label: 'Sama Prestataires', badge: null, bv: '',
      icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="9" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="18" cy="9" r="2"/><path d="M16 20a4 4 0 0 1 5 0"/></svg>,
    },
    {
      href: '/app/ndawtal', label: 'Sama Ndawtal', badge: 'New', bv: 'gold',
      icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s-7-4-7-11a7 7 0 0 1 14 0c0 7-7 11-7 11z"/><circle cx="12" cy="10" r="3"/></svg>,
    },
    {
      href: '/app/tenues', label: 'Sama Tenues', badge: null, bv: '',
      icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 4l3 3h8l3-3M5 4l-1 6 8 10 8-10-1-6"/></svg>,
    },
    {
      href: '/app/invites', label: 'Sama Invités', badge: null, bv: '',
      icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      href: '/app/serenite', label: 'Sama Sérénité', badge: null, bv: '',
      icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s-7-4-7-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-11 11-11 11z"/></svg>,
    },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#FAF7F2' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0E2916]/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className="fixed left-0 top-0 z-50 h-screen w-[260px] flex flex-col border-r border-black/5 bg-white transition-transform duration-300"
        style={{ transform: sidebarOpen ? 'translateX(0)' : undefined }}
      >
        <style>{`@media(min-width:1024px){aside{transform:translateX(0)!important}}@media(max-width:1023px){aside{transform:translateX(-100%)}}`}</style>

        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b border-black/5">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
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
                Aïssatou{wedding?.partnerName ? ` & ${wedding.partnerName.split(' ')[0]}` : ' & Mamadou'}
              </div>
              <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#722F37' }}>
                J‑{daysUntil} · {wedding?.weddingDate ? new Date(wedding.weddingDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' }) : '15 déc 2026'}
              </div>
            </div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-white overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${budgetPct}%`, background: 'linear-gradient(90deg, #1E5631, #D4A574, #722F37)' }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px]" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.55)' }}>
            <span>Préparation mariage</span><span>{budgetPct}%</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="mt-4 px-3 flex-1 nice-scroll overflow-y-auto">
          <div className="px-2 mb-2 text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.4)' }}>Mon mariage</div>
          <ul className="space-y-0.5">
            {navItems.map(item => {
              const isActive = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href))
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`nav-item ${isActive ? 'active' : 'text-[#3D3D3D]/75'}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      item.bv === 'gold'
                        ? <span className="rounded-full px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest shrink-0" style={{ background: 'rgba(212,165,116,.2)', color: '#B98548' }}>{item.badge}</span>
                        : <span className="rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0" style={{ background: 'rgba(114,47,55,.1)', color: '#722F37' }}>{item.badge}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 border-t border-black/5 space-y-1">
          {/* Diaspora toggle */}
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1" style={{ background: 'linear-gradient(135deg, rgba(114,47,55,.07), rgba(234,241,236,.7))', outlineColor: 'rgba(114,47,55,.1)' }}>
            <div className="grid h-8 w-8 place-items-center rounded-lg shrink-0" style={{ background: '#722F37', color: '#F7E9CF' }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold leading-tight" style={{ color: '#0E2916' }}>Mode Diaspora</div>
              <div className="text-[10px] leading-tight" style={{ color: 'rgba(61,61,61,.55)' }}>Pilote depuis l&apos;étranger</div>
            </div>
            <button onClick={() => setDiasporaOn(v => !v)} className={`switch shrink-0 ${diasporaOn ? 'on' : ''}`} aria-label="Mode diaspora" />
          </div>
          <Link href="#" className="nav-item text-[#3D3D3D]/70">
            <span className="nav-icon"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2.1-1.6-2-3.4-2.5 1a7 7 0 0 0-2.1-1.2L14 3h-4l-.4 2.6c-.8.3-1.5.7-2.1 1.2l-2.5-1-2 3.4 2.1 1.6A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2.1 1.6 2 3.4 2.5-1c.6.5 1.3.9 2.1 1.2L10 21h4l.4-2.6c.8-.3 1.5-.7 2.1-1.2l2.5 1 2-3.4-2.1-1.6c0-.4.1-.8.1-1.2z"/></svg></span>
            Paramètres
          </Link>
          <button onClick={handleLogout} className="nav-item w-full text-left" style={{ color: '#722F37' }}>
            <span className="nav-icon" style={{ background: 'rgba(114,47,55,.07)', color: '#722F37' }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </span>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="lg:pl-[260px] min-h-screen flex flex-col">

        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-black/5 backdrop-blur-md" style={{ background: 'rgba(250,247,242,.9)' }}>
          <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3">
            {/* Mobile burger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden grid h-10 w-10 place-items-center rounded-xl border border-black/10 bg-white shrink-0"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            </button>

            {/* Title + breadcrumb */}
            <div className="flex-1 min-w-0">
              {/* Breadcrumb */}
              {metaKey !== '/app' && (
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-widest mb-0.5" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.45)' }}>
                  <Link href="/app" className="hover:text-[#1E5631] transition-colors">Dashboard</Link>
                  <span>›</span>
                  <span style={{ color: '#722F37' }}>{meta.sub}</span>
                </div>
              )}
              {metaKey === '/app' && (
                <div className="hidden sm:block text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: '#722F37' }}>
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · J‑{daysUntil}
                </div>
              )}
              <h1 className="font-display text-xl sm:text-2xl leading-tight truncate" style={{ color: '#0E2916' }}>
                {meta.title}
              </h1>
            </div>

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 w-60 lg:w-72 rounded-xl bg-white px-3 py-2" style={{ outline: '1px solid rgba(61,61,61,.08)' }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" style={{ color: 'rgba(61,61,61,.4)' }} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              <input type="search" placeholder="Chercher…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#3D3D3D' }} />
              <kbd className="hidden lg:inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px]" style={{ fontFamily: 'var(--font-jetbrains)', background: '#FAF7F2', color: 'rgba(61,61,61,.4)', outline: '1px solid rgba(61,61,61,.07)' }}>⌘K</kbd>
            </div>

            {/* Notifications */}
            <div className="relative shrink-0">
              <button
                onClick={e => { e.stopPropagation(); setAvatarOpen(false); setNotifOpen(v => !v) }}
                className="relative grid h-10 w-10 place-items-center rounded-xl bg-white hover:bg-[#FAF7F2] transition"
                style={{ outline: '1px solid rgba(61,61,61,.08)' }}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" style={{ color: 'rgba(61,61,61,.7)' }} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4"/></svg>
                <span className="absolute -top-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold ring-2" style={{ background: '#722F37', color: '#FBF4EA', borderColor: '#FAF7F2' }}>3</span>
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full ping-soft" style={{ background: 'rgba(114,47,55,.35)' }} />
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white shadow-card overflow-hidden z-50" style={{ outline: '1px solid rgba(61,61,61,.06)' }} onClick={e => e.stopPropagation()}>
                  <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between">
                    <div className="font-display text-base" style={{ color: '#0E2916' }}>Notifications</div>
                    <button className="text-[11px] uppercase tracking-widest hover:underline" style={{ fontFamily: 'var(--font-jetbrains)', color: '#1E5631' }}>Tout lire</button>
                  </div>
                  <ul className="divide-y divide-black/5">
                    {NOTIFS.map((n, i) => (
                      <li key={i} className="px-4 py-3 cursor-pointer hover:bg-[#FAF7F2]/60 transition">
                        <div className="flex gap-3">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: n.dot }} />
                          <div>
                            <p className="text-[13px] leading-snug" style={{ color: '#3D3D3D' }}>
                              {n.text.split(n.strong).map((part, j, arr) =>
                                j < arr.length - 1
                                  ? <span key={j}>{part}<strong style={{ color: '#0E2916' }}>{n.strong}</strong></span>
                                  : <span key={j}>{part}</span>
                              )}
                            </p>
                            <div className="mt-0.5 text-[10px]" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.45)' }}>{n.time}</div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="relative shrink-0">
              <button
                onClick={e => { e.stopPropagation(); setNotifOpen(false); setAvatarOpen(v => !v) }}
                className="flex items-center gap-2 rounded-xl bg-white px-1.5 py-1.5 transition hover:bg-[#FAF7F2]"
                style={{ outline: '1px solid rgba(61,61,61,.08)' }}
              >
                <span className="h-7 w-7 rounded-full" style={{ background: 'linear-gradient(135deg, #722F37, #D4A574, #1E5631)' }} />
                <svg viewBox="0 0 16 16" className="hidden sm:block h-3 w-3" style={{ color: 'rgba(61,61,61,.5)' }} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 6 4 4 4-4"/></svg>
              </button>
              {avatarOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white shadow-card overflow-hidden z-50" style={{ outline: '1px solid rgba(61,61,61,.06)' }} onClick={e => e.stopPropagation()}>
                  <div className="px-4 py-3 border-b border-black/5">
                    <div className="text-sm font-semibold" style={{ color: '#0E2916' }}>Aïssatou Diop</div>
                    <div className="text-[11px]" style={{ color: 'rgba(61,61,61,.5)' }}>dvddiatta@gmail.com</div>
                  </div>
                  <ul className="py-1.5 text-sm">
                    <li><Link href="#" className="block px-4 py-2 hover:bg-[#FAF7F2] transition" style={{ color: '#3D3D3D' }}>Mon profil</Link></li>
                    <li><Link href="#" className="block px-4 py-2 hover:bg-[#FAF7F2] transition" style={{ color: '#3D3D3D' }}>Facturation</Link></li>
                    <li><button onClick={handleLogout} className="w-full text-left block px-4 py-2 hover:bg-[#FAF7F2] transition" style={{ color: '#722F37' }}>Déconnexion</button></li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1440px] mx-auto w-full">
          {children}
        </main>

        {/* Footer */}
        <div className="py-8 text-center text-[11px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)', color: 'rgba(61,61,61,.3)' }}>
          Sama Mariage, sama xewël — mon mariage, ma joie 🇸🇳
        </div>
      </div>

      {/* Diaspora floating banner */}
      {diasporaOn && (
        <div className="fixed left-1/2 bottom-5 z-40 float-banner" style={{ transform: 'translateX(-50%)' }}>
          <div className="rounded-full px-5 py-3 shadow-glow flex items-center gap-3 ring-1 whitespace-nowrap" style={{ background: '#722F37', color: '#F7E9CF', outlineColor: 'rgba(212,165,116,.4)' }}>
            <span className="grid h-7 w-7 place-items-center rounded-full shrink-0" style={{ background: '#D4A574', color: '#3D181C' }}>🌍</span>
            <div className="text-[13px]">Mode <strong>Diaspora</strong> activé · coordinatrice Dakar notifiée</div>
            <button onClick={() => setDiasporaOn(false)} className="ml-1 opacity-70 hover:opacity-100 transition">
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4l8 8M12 4l-8 8"/></svg>
            </button>
          </div>
        </div>
      )}

      <Toaster position="bottom-center" richColors />
    </div>
  )
}
