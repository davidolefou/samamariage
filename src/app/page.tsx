'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function HomePage() {
  useEffect(() => {
    // Sticky nav
    const navInner = document.getElementById('navInner')
    const onScroll = () => {
      if (window.scrollY > 12) {
        navInner?.classList.add('nav-scrolled')
      } else {
        navInner?.classList.remove('nav-scrolled')
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    // Mobile menu
    const burger = document.getElementById('burgerBtn')
    const mobileMenu = document.getElementById('mobileMenu')
    const toggleMenu = () => mobileMenu?.classList.toggle('hidden')
    burger?.addEventListener('click', toggleMenu)
    mobileMenu?.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => mobileMenu.classList.add('hidden'))
    )

    // Scroll reveal
    const reveals = document.querySelectorAll('.reveal')
    const showIfInView = (el: Element) => {
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight && r.bottom > 0) {
        el.classList.add('in')
      }
    }
    reveals.forEach(showIfInView)

    let io: IntersectionObserver | undefined
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('in'); io?.unobserve(e.target) }
        })
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
      reveals.forEach(el => { if (!el.classList.contains('in')) io?.observe(el) })
    }
    const fallback = setTimeout(() => {
      document.querySelectorAll('.reveal:not(.in)').forEach(el => el.classList.add('in'))
    }, 1200)

    return () => {
      window.removeEventListener('scroll', onScroll)
      burger?.removeEventListener('click', toggleMenu)
      io?.disconnect()
      clearTimeout(fallback)
    }
  }, [])

  return (
    <>
      <style>{`
        .nav-scrolled {
          background: rgba(250,247,242,.88);
          backdrop-filter: blur(12px);
          border-color: rgba(61,61,61,.10) !important;
          box-shadow: 0 1px 0 rgba(255,255,255,.6) inset, 0 20px 40px -20px rgba(61,61,61,.18);
        }
        .lp-body { overflow-x: hidden; background: #FAF7F2; color: #3D3D3D; }
        .lp-card-hover { transition: transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s; }
        .lp-card-hover:hover { transform: translateY(-4px); box-shadow: 0 1px 0 rgba(255,255,255,.6) inset, 0 24px 48px -20px rgba(61,61,61,.22); }
      `}</style>

      <div className="lp-body">

        {/* ── NAVIGATION ── */}
        <header id="nav" className="fixed inset-x-0 top-0 z-50 transition-all duration-500">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div id="navInner" className="mt-3 flex items-center justify-between rounded-2xl border border-transparent px-4 py-3 transition-all duration-500">
              <a href="#top" className="flex items-center gap-2.5">
                <span className="relative grid h-9 w-9 place-items-center rounded-xl shadow-glow" style={{ background: '#1E5631' }}>
                  <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" stroke="#D4A574" strokeWidth="1.6">
                    <path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z" />
                    <path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z" />
                    <path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3" />
                  </svg>
                </span>
                <span className="font-display text-[22px] leading-none">
                  <span style={{ color: '#1E5631' }}>Sama</span><span className="gold-shine font-semibold">Mariage</span>
                </span>
              </a>

              <nav className="hidden lg:flex items-center gap-9 text-sm font-medium" style={{ color: 'rgba(61,61,61,.8)' }}>
                <a href="#how" className="hover:text-royal-700 transition" style={{ '--hover-color': '#1E5631' } as React.CSSProperties} onMouseEnter={e => (e.currentTarget.style.color = '#1E5631')} onMouseLeave={e => (e.currentTarget.style.color = '')}>Comment ça marche</a>
                <a href="#modules" onMouseEnter={e => (e.currentTarget.style.color = '#1E5631')} onMouseLeave={e => (e.currentTarget.style.color = '')} className="transition">Modules</a>
                <a href="#diaspora" onMouseEnter={e => (e.currentTarget.style.color = '#1E5631')} onMouseLeave={e => (e.currentTarget.style.color = '')} className="transition">Diaspora</a>
                <Link href="/tarifs" onMouseEnter={e => (e.currentTarget.style.color = '#1E5631')} onMouseLeave={e => (e.currentTarget.style.color = '')} className="transition font-semibold" style={{ color: '#1E5631' }}>Tarifs</Link>
              </nav>

              <div className="flex items-center gap-2">
                <Link href="/connexion" className="hidden sm:inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition hover:bg-[#EAF1EC]" style={{ borderColor: 'rgba(30,86,49,.15)', color: '#0E2916' }}>
                  Se connecter
                </Link>
                <Link href="/onboarding" className="hidden sm:inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition" style={{ background: '#1E5631', color: '#FBF4EA', boxShadow: 'inset 0 0 0 1px rgba(212,165,116,.3)' }}>
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#D4A574' }}></span>
                  Commencer
                </Link>
                <button id="burgerBtn" className="lg:hidden grid h-10 w-10 place-items-center rounded-xl border" style={{ borderColor: 'rgba(61,61,61,.1)', background: '#FAF7F2' }}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
                </button>
              </div>
            </div>

            {/* Mobile menu */}
            <div id="mobileMenu" className="hidden lg:hidden mt-2 rounded-2xl border p-2 shadow-card" style={{ background: 'rgba(250,247,242,.95)', backdropFilter: 'blur(12px)', borderColor: 'rgba(61,61,61,.1)' }}>
              <a href="#how" className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-royal-50">Comment ça marche</a>
              <a href="#modules" className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-royal-50">Modules</a>
              <a href="#diaspora" className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-royal-50">Diaspora</a>
              <a href="#faq" className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-royal-50">FAQ</a>
              <Link href="/tarifs" className="block rounded-xl px-4 py-3 text-sm font-semibold hover:bg-royal-50" style={{ color: '#1E5631' }}>Tarifs</Link>
              <Link href="/onboarding" className="mt-1 block rounded-xl px-4 py-3 text-center text-sm font-medium" style={{ background: '#1E5631', color: '#FBF4EA' }}>S&apos;inscrire maintenant</Link>
              <Link href="/connexion" className="block rounded-xl px-4 py-3 text-center text-sm font-medium border" style={{ borderColor: 'rgba(30,86,49,.15)', color: '#0E2916' }}>Se connecter</Link>
            </div>
          </div>
        </header>

        {/* ── HERO ── */}
        <section id="top" className="relative pt-32 sm:pt-36 lg:pt-40 pb-20 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(244,228,193,.4) 0%, #FAF7F2 60%)' }}></div>
            <div className="absolute inset-0 wax-bg opacity-60"></div>
            <div className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full blur-3xl" style={{ background: 'rgba(239,217,184,.4)' }}></div>
            <div className="absolute -top-10 right-[-10%] h-[480px] w-[480px] rounded-full blur-3xl" style={{ background: 'rgba(210,224,213,.7)' }}></div>
          </div>

          <div className="mx-auto max-w-7xl px-5 sm:px-8 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Copy */}
            <div className="lg:col-span-7">
              <div className="reveal inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium" style={{ background: 'rgba(255,255,255,.7)', borderColor: 'rgba(30,86,49,.1)', color: '#173F24', backdropFilter: 'blur(8px)' }}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: '#1E5631' }}></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: '#1E5631' }}></span>
                </span>
                <span className="font-mono tracking-tight">+500 mariées</span>
                <span style={{ color: 'rgba(61,61,61,.6)' }}>déjà inscrites</span>
              </div>

              <h1 className="reveal d1 mt-6 font-display font-semibold leading-[1.02] text-[44px] sm:text-6xl lg:text-[78px]" style={{ color: '#0E2916' }}>
                Ton mariage <em className="not-italic gold-shine">sénégalais.</em>
                <br />Sans le{' '}
                <span className="relative">
                  chaos
                  <svg viewBox="0 0 220 16" preserveAspectRatio="none" className="absolute -bottom-2 left-0 w-full h-3" style={{ color: '#722F37' }}>
                    <path d="M2 11 C 40 2, 80 14, 120 7 S 200 4, 218 10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>.
              </h1>

              <p className="reveal d2 mt-7 max-w-xl text-lg leading-relaxed" style={{ color: 'rgba(61,61,61,.75)' }}>
                L&apos;IA qui pilote ton <strong style={{ color: '#173F24' }}>takk</strong>, ton <strong style={{ color: '#173F24' }}>céet</strong> et ta réception. De la première inspiration au dernier merci, on gère tout — en wolof, en français, et en toute sérénité.
              </p>

              <div className="reveal d3 mt-9 flex flex-wrap items-center gap-3">
                <Link href="/onboarding" className="group inline-flex items-center gap-2 rounded-full px-6 py-4 text-[15px] font-medium shadow-glow transition" style={{ background: '#1E5631', color: '#FBF4EA', boxShadow: '0 30px 80px -30px rgba(30,86,49,.45), inset 0 0 0 1px rgba(212,165,116,.3)' }}>
                  Commencer gratuitement
                  <svg viewBox="0 0 20 20" className="h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
                </Link>
                <a href="#demo" className="group inline-flex items-center gap-2 rounded-full border px-6 py-4 text-[15px] font-medium transition" style={{ borderColor: 'rgba(30,86,49,.15)', background: 'rgba(255,255,255,.7)', color: '#0E2916', backdropFilter: 'blur(8px)' }}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" style={{ color: '#1E5631' }}><path d="M8 5v14l11-7z" /></svg>
                  Voir une démo · 2 min
                </a>
              </div>

              {/* Scrolling testimonials */}
              <div className="reveal d4 mt-12 relative max-w-xl overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-12 z-10" style={{ background: 'linear-gradient(to right, #FAF7F2, transparent)' }}></div>
                <div className="absolute inset-y-0 right-0 w-12 z-10" style={{ background: 'linear-gradient(to left, #FAF7F2, transparent)' }}></div>
                <div className="flex gap-3 marquee-track w-max">
                  {[
                    { text: '« J\'ai économisé 800 000 F sur le budget »', author: 'Awa' },
                    { text: '« Plus aucun groupe WhatsApp »', author: 'Khady' },
                    { text: '« Ndawtal enfin sous contrôle »', author: 'Maïmouna' },
                    { text: '« J\'ai dormi pendant 9 mois »', author: 'Fatou' },
                    { text: '« J\'ai économisé 800 000 F sur le budget »', author: 'Awa' },
                    { text: '« Plus aucun groupe WhatsApp »', author: 'Khady' },
                    { text: '« Ndawtal enfin sous contrôle »', author: 'Maïmouna' },
                    { text: '« J\'ai dormi pendant 9 mois »', author: 'Fatou' },
                  ].map((q, i) => (
                    <span key={i} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs whitespace-nowrap" style={{ background: 'rgba(255,255,255,.7)', color: 'rgba(61,61,61,.8)', boxShadow: 'inset 0 0 0 1px rgba(61,61,61,.05)' }}>
                      <span style={{ color: '#B98548' }}>★★★★★</span>
                      {q.text} — <strong className="font-medium">{q.author}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto w-[300px] sm:w-[340px] float">
                {/* Floating tags */}
                <div className="absolute -left-12 top-10 hidden sm:block glass rounded-2xl px-3 py-2 text-xs shadow-card float-slow z-20">
                  <div className="flex items-center gap-2">
                    <div className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: '#EAF1EC', color: '#1E5631' }}>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h10M4 17h14" /></svg>
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: '#0E2916' }}>Budget IA</div>
                      <div className="font-mono text-[10px]" style={{ color: 'rgba(61,61,61,.6)' }}>−12% vs prévu</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-10 top-40 hidden sm:block glass rounded-2xl px-3 py-2 text-xs shadow-card float-slow z-20" style={{ animationDelay: '-3s' }}>
                  <div className="flex items-center gap-2">
                    <div className="grid h-7 w-7 place-items-center rounded-lg text-base" style={{ background: '#FBF4EA' }}>💍</div>
                    <div>
                      <div className="font-medium" style={{ color: '#0E2916' }}>Ndawtal</div>
                      <div className="font-mono text-[10px]" style={{ color: 'rgba(61,61,61,.6)' }}>1 240 000 F reçus</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-6 bottom-12 hidden sm:block glass rounded-2xl px-3 py-2 text-xs shadow-card float-slow z-20" style={{ animationDelay: '-6s' }}>
                  <div className="flex items-center gap-2">
                    <div className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: 'rgba(114,47,55,.1)', color: '#722F37' }}>✓</div>
                    <div>
                      <div className="font-medium" style={{ color: '#0E2916' }}>RSVP confirmés</div>
                      <div className="font-mono text-[10px]" style={{ color: 'rgba(61,61,61,.6)' }}>312 / 400</div>
                    </div>
                  </div>
                </div>

                {/* Phone device */}
                <div className="relative rounded-[44px] p-3 shadow-glow" style={{ background: '#0E2916', outline: '1px solid rgba(14,41,22,.5)' }}>
                  <div className="absolute left-1/2 top-3 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl" style={{ background: '#0E2916' }}></div>
                  <div className="relative overflow-hidden rounded-[34px]" style={{ background: '#FAF7F2', aspectRatio: '9/19.5' }}>
                    {/* Status bar */}
                    <div className="flex items-center justify-between px-6 pt-4 text-[11px] font-medium" style={{ color: '#0E2916' }}>
                      <span className="font-mono">09:41</span>
                      <span className="flex items-center gap-1">
                        <svg viewBox="0 0 16 12" className="h-3 w-3" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="4" y="5" width="3" height="7" rx="1" /><rect x="8" y="2" width="3" height="10" rx="1" /><rect x="12" y="0" width="3" height="12" rx="1" /></svg>
                        <svg viewBox="0 0 24 12" className="h-3 w-5" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="20" height="10" rx="2" /><rect x="3" y="3" width="14" height="6" rx="1" fill="currentColor" /><rect x="22" y="4" width="1.5" height="4" rx=".5" fill="currentColor" /></svg>
                      </span>
                    </div>

                    {/* App content */}
                    <div className="px-5 pt-3 pb-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(61,61,61,.5)' }}>Aminata · J-127</div>
                          <h3 className="font-display text-[22px] leading-tight" style={{ color: '#0E2916' }}>Sama xewël<br />commence ici</h3>
                        </div>
                        <div className="h-9 w-9 rounded-full ring-2 ring-white" style={{ background: 'linear-gradient(135deg, #D4A574, #722F37)' }}></div>
                      </div>

                      {/* Progress card */}
                      <div className="mt-4 rounded-2xl bg-white p-3 shadow-card ring-1" style={{ boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 20px 40px -20px rgba(61,61,61,.18)', outlineColor: 'rgba(61,61,61,.05)' }}>
                        <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: 'rgba(61,61,61,.6)' }}>
                          <span>PROGRESSION</span><span>68%</span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full" style={{ background: '#EAF1EC' }}>
                          <div className="h-full w-[68%] rounded-full" style={{ background: 'linear-gradient(90deg, #1E5631, #D4A574, #722F37)' }}></div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg py-2" style={{ background: '#EAF1EC' }}>
                            <div className="font-display text-base" style={{ color: '#173F24' }}>7</div>
                            <div className="text-[9px]" style={{ color: 'rgba(61,61,61,.6)' }}>modules</div>
                          </div>
                          <div className="rounded-lg py-2" style={{ background: '#FBF4EA' }}>
                            <div className="font-display text-base" style={{ color: '#B98548' }}>23</div>
                            <div className="text-[9px]" style={{ color: 'rgba(61,61,61,.6)' }}>tâches</div>
                          </div>
                          <div className="rounded-lg py-2" style={{ background: 'rgba(114,47,55,.1)' }}>
                            <div className="font-display text-base" style={{ color: '#722F37' }}>4.2M</div>
                            <div className="text-[9px]" style={{ color: 'rgba(61,61,61,.6)' }}>budget</div>
                          </div>
                        </div>
                      </div>

                      {/* Module list */}
                      <div className="mt-3 space-y-2">
                        {[
                          { icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /></svg>, bg: '#1E5631', iconColor: '#F7E9CF', label: 'Sama Mood', sub: '18 inspirations sauvegardées', badge: '+3', badgeColor: '#B98548' },
                          { icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h3l3-8 4 16 3-8h5" /></svg>, bg: '#D4A574', iconColor: '#0E2916', label: 'Sama Ndawtal', sub: '1 240 000 F · 47 contributrices', badge: 'live', badgeColor: '#1E5631' },
                          { icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3" /><path d="M5 21c0-4 3-7 7-7s7 3 7 7" /></svg>, bg: '#722F37', iconColor: '#F7E9CF', label: 'Sama Tenues', sub: '30 amies · ndaxal coordonné', badge: '28/30', badgeColor: '#722F37' },
                        ].map((m, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 ring-1" style={{ outlineColor: 'rgba(61,61,61,.05)' }}>
                            <div className="grid h-8 w-8 place-items-center rounded-lg shrink-0" style={{ background: m.bg, color: m.iconColor }}>{m.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-medium" style={{ color: '#0E2916' }}>{m.label}</div>
                              <div className="text-[10px]" style={{ color: 'rgba(61,61,61,.6)' }}>{m.sub}</div>
                            </div>
                            <span className="text-[10px] font-mono" style={{ color: m.badgeColor }}>{m.badge}</span>
                          </div>
                        ))}
                      </div>

                      {/* Coach bubble */}
                      <div className="mt-3 rounded-2xl p-3" style={{ background: '#0E2916', color: '#FBF4EA' }}>
                        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(212,165,116,.8)' }}>
                          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#D4A574' }}></span> Coach Sérénité
                        </div>
                        <p className="mt-1.5 text-[11px] leading-snug">Aminata, respire. Tout est sous contrôle 🌟<br />Tu as 4 minutes de méditation prévues à 21h.</p>
                      </div>
                    </div>

                    {/* Tab bar */}
                    <div className="absolute bottom-0 left-0 right-0 mx-3 mb-3 flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: '#0E2916', color: '#F7E9CF' }}>
                      <span className="h-2 w-2 rounded-full" style={{ background: '#D4A574' }}></span>
                      <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-60" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12l8-8 8 8M6 10v10h12V10" /></svg>
                      <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-60" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                      <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-60" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="8" /></svg>
                      <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-60" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="9" r="3" /><path d="M5 21c0-4 3-7 7-7s7 3 7 7" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-5 sm:px-8 mt-16 flex items-center gap-3 text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(61,61,61,.5)' }}>
            <div className="h-px flex-1" style={{ background: 'rgba(61,61,61,.1)' }}></div>
            <span>Sama Mariage, sama xewël — mon mariage, ma joie</span>
            <div className="h-px flex-1" style={{ background: 'rgba(61,61,61,.1)' }}></div>
          </div>
        </section>

        {/* ── SOCIAL PROOF ── */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="reveal grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: '#722F37' }}>Vu par la communauté</div>
                <h2 className="mt-3 font-display text-4xl sm:text-5xl" style={{ color: '#0E2916' }}>
                  <span className="num-outline font-display">50K</span> futures mariées<br />nous suivent déjà.
                </h2>
                <p className="mt-4 max-w-md" style={{ color: 'rgba(61,61,61,.7)' }}>
                  Sur TikTok, Instagram, dans les salons de Sicap et les caves de Ménilmontant. Une seule conversation : <strong style={{ color: '#173F24' }}>enfin un outil qui nous comprend.</strong>
                </p>
                <div className="mt-8 grid grid-cols-3 gap-6">
                  {[
                    { n: '50K+', label: 'vues TikTok', color: '#173F24' },
                    { n: '500+', label: 'inscrites', color: '#B98548' },
                    { n: '12', label: 'pays diaspora', color: '#722F37' },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="font-display text-3xl" style={{ color: s.color }}>{s.n}</div>
                      <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(61,61,61,.6)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7">
                {/* Press logos */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-px overflow-hidden rounded-2xl border" style={{ background: 'rgba(61,61,61,.1)', borderColor: 'rgba(61,61,61,.1)' }}>
                  {['Senego', 'SENEWEB', 'Jeune Afrique', 'au-féminin', 'Teranga Mag'].map((p, i) => (
                    <div key={p} className="flex h-20 items-center justify-center" style={{ background: '#FAF7F2' }}>
                      <span className={`${i === 0 || i === 2 || i === 4 ? 'font-display italic text-lg' : i === 1 ? 'font-mono text-sm tracking-widest' : 'font-sans font-bold tracking-tight'}`} style={{ color: 'rgba(61,61,61,.6)' }}>{p}</span>
                    </div>
                  ))}
                </div>

                {/* Testimonials */}
                <div className="mt-6 grid sm:grid-cols-3 gap-4">
                  {[
                    { q: '« J\'ai testé la beta pendant 3 mois. Ma mère a arrêté de m\'appeler à 7h du matin. »', name: 'Aïssatou D.', loc: 'Mariée · Almadies, 2025', dark: false },
                    { q: '« Le Ndawtal tracking… enfin. Je sais exactement qui a donné quoi, sans cahier. »', name: 'Ndèye Coumba S.', loc: 'Mariée · Paris 18ᵉ', dark: true },
                    { q: '« Mes 28 cousines en ndaxal coordonné, sans 15 groupes WhatsApp. Magie. »', name: 'Marème B.', loc: 'Future mariée · Milan', dark: false },
                  ].map((t, i) => (
                    <figure key={i} className={`reveal d${i + 1} rounded-2xl p-5 shadow-card ${t.dark ? '' : 'ring-1'}`}
                      style={t.dark
                        ? { background: '#0E2916', color: '#FBF4EA' }
                        : { background: 'white', outlineColor: 'rgba(61,61,61,.05)' }}>
                      <div className="text-sm" style={{ color: t.dark ? '#D4A574' : '#C89760' }}>★★★★★</div>
                      <blockquote className="mt-2 text-sm leading-relaxed" style={t.dark ? {} : { color: 'rgba(61,61,61,.85)' }}>{t.q}</blockquote>
                      <figcaption className="mt-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full shrink-0" style={{ background: t.dark ? 'linear-gradient(135deg, #D4A574, #722F37)' : i === 2 ? 'linear-gradient(135deg, #1E5631, #D4A574)' : 'linear-gradient(135deg, #722F37, #D4A574)' }}></div>
                        <div>
                          <div className="text-sm font-medium" style={t.dark ? {} : { color: '#0E2916' }}>{t.name}</div>
                          <div className="text-xs" style={{ color: t.dark ? 'rgba(247,233,207,.7)' : 'rgba(61,61,61,.6)' }}>{t.loc}</div>
                        </div>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PROBLEM ── */}
        <section className="py-24 sm:py-28 relative" style={{ background: 'linear-gradient(180deg, #FAF7F2 0%, rgba(244,228,193,.4) 100%)' }}>
          <div className="absolute inset-0 wax-bg opacity-50"></div>
          <div className="mx-auto max-w-7xl px-5 sm:px-8 relative">
            <div className="max-w-2xl reveal">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: '#722F37' }}>Le problème</div>
              <h2 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl text-balance" style={{ color: '#0E2916' }}>
                Organiser ton mariage<br />te rend <em className="not-italic" style={{ color: '#722F37' }}>dingue&nbsp;?</em>
              </h2>
              <p className="mt-5 max-w-lg" style={{ color: 'rgba(61,61,61,.7)' }}>
                Tu n&apos;es pas seule. Voici les 4 enfers qu&apos;on a entendus 1 247 fois en interviewant des mariées sénégalaises.
              </p>
            </div>

            <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { n: '01', icon: <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 6h16v9H7l-3 3z" /><path d="M8 10h8M8 13h5" /></svg>, title: '+15 groupes WhatsApp en simultané', desc: 'Tata Aïda, tata Mame, le DJ, le traiteur, les 3 ndaxal… ton téléphone n\'a plus de batterie après 11h.', stat: '73% des mariées' },
                { n: '02', icon: <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 17l4-4 4 4 7-9" /><path d="M14 8h6v6" /></svg>, title: 'Budget qui explose sans qu\'on sache pourquoi', desc: 'Tu prévois 5M. Tu finis à 9M. Et personne ne peut t\'expliquer où sont passés les 4M. Classique.', stat: '+80% de dépassement moyen' },
                { n: '03', icon: <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="9" /></svg>, title: 'Ndawtal impossible à tracker', desc: '47 enveloppes, 12 virements Orange Money, 8 cousins qui « ont déjà donné à ta tante ». Bonne chance.', stat: 'Le cauchemar n°1' },
                { n: '04', icon: <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="7" r="3" /><path d="M5 21c0-4 3-7 7-7s7 3 7 7" /><circle cx="19" cy="10" r="2" /><circle cx="5" cy="10" r="2" /></svg>, title: '30 amies, 30 tailles pour le ndaxal', desc: 'La couturière t\'envoie un vocal de 7 min toutes les 48h. Toi, tu cherches encore le numéro de Fatima.', stat: 'Stress garanti' },
              ].map((c, i) => (
                <article key={i} className={`reveal d${i + 1} lp-card-hover rounded-3xl bg-white p-6 ring-1 shadow-card`} style={{ outlineColor: 'rgba(61,61,61,.05)' }}>
                  <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(61,61,61,.4)' }}>N°{c.n}</div>
                  <div className="mt-4 inline-grid h-12 w-12 place-items-center rounded-2xl" style={{ background: 'rgba(114,47,55,.1)', color: '#722F37' }}>{c.icon}</div>
                  <h3 className="mt-5 font-display text-xl leading-tight" style={{ color: '#0E2916' }}>{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(61,61,61,.65)' }}>{c.desc}</p>
                  <div className="mt-5 flex items-center gap-2 text-[11px] font-mono" style={{ color: 'rgba(61,61,61,.4)' }}>
                    <span className="h-1 w-1 rounded-full" style={{ background: '#722F37' }}></span> {c.stat}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── SOLUTION (8 modules) ── */}
        <section id="modules" className="py-24 sm:py-32 relative" style={{ background: '#FAF7F2' }}>
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="reveal grid lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-7">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: '#1E5631' }}>La solution</div>
                <h2 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl text-balance" style={{ color: '#0E2916' }}>
                  Tout dans une seule<br />app <em className="not-italic gold-shine">intelligente.</em>
                </h2>
              </div>
              <div className="lg:col-span-5">
                <p className="max-w-md" style={{ color: 'rgba(61,61,61,.7)' }}>8 modules qui parlent entre eux. L&apos;IA apprend ton style, ton budget, ta famille. Et te laisse profiter — pas piloter une PME.</p>
              </div>
            </div>

            <div id="how" className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { num: '01 / Inspiration', style: 'dark-green', title: 'Sama Mood', desc: 'Le Pinterest IA qui devine ton style en 12 questions. Mood boards générés sur mesure.', icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /></svg> },
                { num: '02 / Finances', style: 'white', title: 'Sama Budget', desc: 'Le contrôleur de gestion IA qui dit non quand il faut. Alertes en temps réel.', icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h3l3-8 4 16 3-8h5" /></svg> },
                { num: '03 / Temps', style: 'white-bordeaux', title: 'Sama Planning', desc: 'Rétroplanning intelligent qui ajuste les tâches selon ta date, ton style et ton budget.', icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg> },
                { num: '04 / Carnet', style: 'sand', title: 'Sama Prestataires', desc: '500+ pros vérifiés à Dakar, Thiès, Saly. Avis, dispos, devis instantanés.', icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h10" /></svg> },
                { num: '05 / Tradition', style: 'bordeaux', title: 'Sama Ndawtal', desc: 'Le seul outil au monde dédié au ndawtal. Don, dette, remerciement — tout est tracé.', icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 10h16M4 14h16" /><path d="M8 6c0-2 2-3 4-3s4 1 4 3" /><path d="M6 18c0 2 2 3 6 3s6-1 6-3" /></svg>, badge: true },
                { num: '06 / Style', style: 'white', title: 'Sama Tenues', desc: 'Coordination du groupe ndaxal. Tailles, paiements, livraisons. Une seule interface.', icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 4l3 3h8l3-3M5 4l-1 6 8 10 8-10-1-6" /></svg> },
                { num: '07 / Réception', style: 'white', title: 'Sama Invités', desc: 'RSVP digital + plan de table IA qui évite Tonton Mansour à côté de Tata Codou.', icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18" /></svg> },
                { num: '08 / Toi', style: 'dark-dual', title: 'Sama Sérénité', desc: 'Coach mental IA. Méditation, journal, anti-burnout. Pour que tu profites, vraiment.', icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s-7-4-7-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-11 11-11 11z" /></svg> },
              ].map((m, i) => {
                const isDark = m.style === 'dark-green' || m.style === 'bordeaux' || m.style === 'dark-dual'
                const cardStyle = {
                  'dark-green': { bg: 'linear-gradient(135deg, #1E5631, #0E2916)', color: '#FBF4EA', iconBg: '#D4A574', iconColor: '#0E2916' },
                  'white': { bg: 'white', color: '#0E2916', iconBg: '#EAF1EC', iconColor: '#1E5631' },
                  'white-bordeaux': { bg: 'white', color: '#0E2916', iconBg: 'rgba(114,47,55,.1)', iconColor: '#722F37' },
                  'sand': { bg: 'linear-gradient(135deg, #F4E4C1, #FBF4EA)', color: '#0E2916', iconBg: '#1E5631', iconColor: '#F7E9CF' },
                  'bordeaux': { bg: '#722F37', color: '#FBF4EA', iconBg: '#D4A574', iconColor: '#722F37' },
                  'dark-dual': { bg: 'linear-gradient(135deg, #0E2916, #722F37)', color: '#FBF4EA', iconBg: '#D4A574', iconColor: '#0E2916' },
                }[m.style]!
                return (
                  <article key={i} className={`reveal${i > 0 ? ` d${Math.min(i, 6)}` : ''} group relative rounded-3xl p-6 overflow-hidden ${!isDark ? 'lp-card-hover ring-1 shadow-card' : ''}`}
                    style={{ background: cardStyle.bg, color: cardStyle.color, outlineColor: isDark ? undefined : 'rgba(61,61,61,.05)' }}>
                    {m.badge && (
                      <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ background: '#D4A574', color: '#722F37' }}>
                        <span className="h-1 w-1 rounded-full" style={{ background: '#722F37' }}></span> Mondial 1ʳᵉ
                      </div>
                    )}
                    <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: isDark ? 'rgba(212,165,116,.8)' : 'rgba(61,61,61,.4)' }}>{m.num}</div>
                    <div className="mt-3 inline-grid h-11 w-11 place-items-center rounded-2xl" style={{ background: cardStyle.iconBg, color: cardStyle.iconColor }}>{m.icon}</div>
                    <h3 className="mt-4 font-display text-2xl">{m.title}</h3>
                    <p className="mt-1.5 text-sm" style={{ color: isDark ? 'rgba(247,233,207,.85)' : 'rgba(61,61,61,.65)' }}>{m.desc}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── DIASPORA ── */}
        <section id="diaspora" className="relative py-24 sm:py-32 overflow-hidden" style={{ color: '#FBF4EA' }}>
          <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(135deg, #3D181C, #722F37 50%, #0E2916)' }}></div>
          <div className="absolute inset-0 -z-10 wax-bg-bordeaux opacity-40"></div>
          <div className="absolute -top-20 -right-20 h-[480px] w-[480px] rounded-full blur-3xl -z-10" style={{ background: 'rgba(212,165,116,.15)' }}></div>

          <div className="mx-auto max-w-7xl px-5 sm:px-8 grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6">
              <div className="reveal font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: '#D4A574' }}>Sama Diaspora</div>
              <h2 className="reveal d1 mt-3 font-display text-4xl sm:text-5xl lg:text-6xl text-balance">
                Tu vis à <em className="not-italic gold-shine">Paris</em>,<br />
                <em className="not-italic gold-shine">New York</em> ou <em className="not-italic gold-shine">Milan</em>&nbsp;?
              </h2>
              <p className="reveal d2 mt-6 max-w-lg text-lg" style={{ color: 'rgba(247,233,207,.85)' }}>
                Pilote ton mariage à Dakar depuis ton smartphone. Sans intermédiaire louche, sans transferts hasardeux, sans te demander si Tonton a vraiment payé le DJ.
              </p>

              <ul className="reveal d3 mt-10 space-y-4">
                {[
                  { icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h3l3-8 4 16 3-8h5" /></svg>, title: 'Transparence financière totale', desc: 'Chaque franc tracé. Reçus photo, virements horodatés, audit IA. Plus jamais « il a perdu le reçu ».' },
                  { icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="14" height="12" rx="2" /><path d="m21 8-4 4 4 4z" /></svg>, title: 'Vidéos quotidiennes du terrain', desc: 'Ta coordinatrice envoie une vidéo de 90 sec chaque soir. Tu vois la salle, le menu, les tenues, tout.' },
                  { icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="9" r="3" /><path d="M5 21c0-4 3-7 7-7s7 3 7 7" /></svg>, title: 'Coordinatrice certifiée sur place', desc: 'Une pro Sama Mariage à Dakar, dédiée à ton mariage. Recrutée, formée, garantie.' },
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: '#D4A574', color: '#0E2916' }}>{item.icon}</div>
                    <div>
                      <div className="font-display text-xl">{item.title}</div>
                      <p className="text-sm mt-0.5" style={{ color: 'rgba(247,233,207,.75)' }}>{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <Link href="/onboarding" className="reveal d4 mt-10 inline-flex items-center gap-2 rounded-full px-6 py-4 text-[15px] font-medium transition hover:bg-[#D4A574]/10" style={{ border: '1.5px solid #D4A574', color: '#D4A574' }}>
                Découvrir Sama Diaspora
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
              </Link>
            </div>

            {/* Globe / map */}
            <div className="lg:col-span-6 relative">
              <div className="reveal aspect-square max-w-md mx-auto relative">
                <div className="absolute inset-0 rounded-full border" style={{ borderColor: 'rgba(212,165,116,.2)' }}></div>
                <div className="absolute inset-6 rounded-full border" style={{ borderColor: 'rgba(212,165,116,.15)' }}></div>
                <div className="absolute inset-12 rounded-full border" style={{ borderColor: 'rgba(212,165,116,.1)' }}></div>
                <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 60% 40%, rgba(212,165,116,.18), transparent 60%)' }}></div>
                {[
                  { label: 'New York', left: '18%', top: '35%', delay: 0 },
                  { label: 'Paris', left: '44%', top: '30%', delay: 0.4 },
                  { label: 'Milan', left: '52%', top: '42%', delay: 0.8 },
                  { label: 'London', left: '38%', top: '60%', delay: 1.2 },
                ].map(pin => (
                  <div key={pin.label} className="absolute" style={{ left: pin.left, top: pin.top }}>
                    <div className="relative">
                      <div className="h-3 w-3 rounded-full animate-pulse" style={{ background: '#D4A574', boxShadow: '0 0 0 4px rgba(212,165,116,.2)', animationDelay: `${pin.delay}s` }}></div>
                      <div className="absolute left-5 -top-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-mono" style={{ background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(8px)' }}>{pin.label}</div>
                    </div>
                  </div>
                ))}
                <div className="absolute" style={{ left: '35%', top: '50%' }}>
                  <div className="relative">
                    <div className="h-5 w-5 rounded-full shadow-glow" style={{ background: '#722F37', boxShadow: '0 0 0 4px #D4A574, 0 30px 80px -30px rgba(30,86,49,.45)' }}></div>
                    <div className="absolute left-7 -top-1 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-mono" style={{ background: 'rgba(114,47,55,.8)', backdropFilter: 'blur(8px)' }}>Dakar 🇸🇳</div>
                  </div>
                </div>
                <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full opacity-60">
                  <defs>
                    <linearGradient id="arcG" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="#D4A574" stopOpacity="0" />
                      <stop offset=".5" stopColor="#D4A574" />
                      <stop offset="1" stopColor="#D4A574" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M75 145 Q 110 80 145 205" fill="none" stroke="url(#arcG)" strokeWidth="1.3" />
                  <path d="M180 125 Q 170 95 145 205" fill="none" stroke="url(#arcG)" strokeWidth="1.3" />
                  <path d="M210 170 Q 200 130 145 205" fill="none" stroke="url(#arcG)" strokeWidth="1.3" />
                  <path d="M155 245 Q 130 240 145 205" fill="none" stroke="url(#arcG)" strokeWidth="1.3" />
                </svg>
                <div className="absolute inset-x-0 -bottom-2 text-center font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(212,165,116,.7)' }}>12 pays · 1 application · 1 mariage</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="py-24 sm:py-32 relative" style={{ background: '#FAF7F2' }}>
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="reveal text-center max-w-2xl mx-auto">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: '#722F37' }}>Tarifs</div>
              <h2 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl" style={{ color: '#0E2916' }}>Un tarif. Pour la vie.</h2>
              <p className="mt-4" style={{ color: 'rgba(61,61,61,.7)' }}>Un paiement unique. Accès complet jusqu&apos;au mariage + 6 mois après. Aucun abonnement, aucun frais caché. Promis sur le ndawtal.</p>
            </div>

            <div className="mt-14 grid lg:grid-cols-3 gap-5">
              {/* Essentiel */}
              <article className="reveal d1 relative flex flex-col rounded-3xl bg-white p-7 ring-1 shadow-card" style={{ outlineColor: 'rgba(61,61,61,.1)' }}>
                <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(61,61,61,.4)' }}>Pour budgets &lt; 5M</div>
                <h3 className="mt-2 font-display text-3xl" style={{ color: '#0E2916' }}>Sama Essentiel</h3>
                <div className="mt-6 flex items-end gap-1">
                  <span className="font-display text-5xl" style={{ color: '#0E2916' }}>25 000</span>
                  <span className="mb-1.5 text-sm font-mono" style={{ color: 'rgba(61,61,61,.6)' }}>FCFA · unique</span>
                </div>
                <ul className="mt-7 space-y-3 text-sm flex-1" style={{ color: 'rgba(61,61,61,.75)' }}>
                  {['5 modules essentiels', 'Budget IA + Mood IA', '50 invités max · RSVP digital', 'Support WhatsApp 6j/7'].map(f => (
                    <li key={f} className="flex gap-2"><span className="mt-0.5" style={{ color: '#1E5631' }}>✓</span> {f}</li>
                  ))}
                  <li className="flex gap-2" style={{ color: 'rgba(61,61,61,.4)' }}><span className="mt-0.5">·</span> Coach Sérénité non inclus</li>
                </ul>
                <Link href="/onboarding" className="mt-7 inline-flex justify-center rounded-full border px-5 py-3 text-sm font-medium transition" style={{ borderColor: 'rgba(30,86,49,.15)', color: '#0E2916' }}>Choisir Essentiel</Link>
              </article>

              {/* Premium (featured) */}
              <article className="reveal d2 relative flex flex-col rounded-3xl p-7 shadow-glow lg:scale-[1.03] z-10 overflow-hidden" style={{ background: '#0E2916', color: '#FBF4EA', outline: '2px solid #D4A574' }}>
                <div className="absolute inset-0 wax-bg-bordeaux opacity-20"></div>
                <div className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b-xl px-4 py-1 text-[11px] font-medium uppercase tracking-widest" style={{ background: '#D4A574', color: '#722F37' }}>⭐ Le plus choisi</div>
                <div className="relative">
                  <div className="font-mono text-[10px] uppercase tracking-widest mt-3" style={{ color: '#D4A574' }}>Pour budgets 5–15M</div>
                  <h3 className="mt-2 font-display text-3xl">Sama Premium</h3>
                  <div className="mt-6 flex items-end gap-1">
                    <span className="font-display text-5xl">50 000</span>
                    <span className="mb-1.5 text-sm font-mono" style={{ color: 'rgba(247,233,207,.7)' }}>FCFA · unique</span>
                  </div>
                  <ul className="mt-7 space-y-3 text-sm flex-1" style={{ color: 'rgba(247,233,207,.9)' }}>
                    {['Les 8 modules complets', 'Ndawtal tracking illimité', 'Invités illimités · Plan de table IA', 'Coordination ndaxal (jusqu\'à 50 amies)', 'Coach Sérénité quotidien', 'Support prioritaire 7j/7'].map(f => (
                      <li key={f} className="flex gap-2"><span className="mt-0.5" style={{ color: '#D4A574' }}>✓</span> {f}</li>
                    ))}
                  </ul>
                  <Link href="/onboarding" className="mt-7 inline-flex justify-center rounded-full px-5 py-3 text-sm font-medium transition" style={{ background: '#D4A574', color: '#3D181C' }}>Choisir Premium</Link>
                </div>
              </article>

              {/* Diaspora */}
              <article className="reveal d3 relative flex flex-col rounded-3xl bg-white p-7 shadow-card ring-1" style={{ outlineColor: 'rgba(114,47,55,.2)' }}>
                <div className="absolute right-5 top-5 rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ background: 'rgba(114,47,55,.1)', color: '#722F37' }}>Diaspora</div>
                <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(61,61,61,.4)' }}>Pour mariées à l&apos;étranger</div>
                <h3 className="mt-2 font-display text-3xl" style={{ color: '#0E2916' }}>Sama Diaspora</h3>
                <div className="mt-6 flex items-end gap-1">
                  <span className="font-display text-5xl" style={{ color: '#722F37' }}>250 000</span>
                  <span className="mb-1.5 text-sm font-mono" style={{ color: 'rgba(61,61,61,.6)' }}>FCFA · unique</span>
                </div>
                <ul className="mt-7 space-y-3 text-sm flex-1" style={{ color: 'rgba(61,61,61,.75)' }}>
                  {['Tout Premium, augmenté', 'Coordinatrice dédiée à Dakar', 'Vidéos quotidiennes terrain', 'Audit financier hebdomadaire', 'Visite finale lieu en 4K', 'Conciergerie multilingue (FR / EN / IT)'].map(f => (
                    <li key={f} className="flex gap-2"><span className="mt-0.5" style={{ color: '#722F37' }}>✓</span> {f}</li>
                  ))}
                </ul>
                <Link href="/onboarding" className="mt-7 inline-flex justify-center rounded-full border px-5 py-3 text-sm font-medium transition" style={{ borderColor: 'rgba(114,47,55,.3)', background: 'rgba(114,47,55,.05)', color: '#722F37' }}>Choisir Diaspora</Link>
              </article>
            </div>

            <p className="reveal mt-10 text-center text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(61,61,61,.4)' }}>Paiement Orange Money · Wave · Visa · Stripe · Paypal</p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="py-24 sm:py-32" style={{ background: 'linear-gradient(180deg, #FAF7F2 0%, rgba(244,228,193,.3) 100%)' }}>
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <div className="reveal text-center">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: '#722F37' }}>FAQ</div>
              <h2 className="mt-3 font-display text-4xl sm:text-5xl" style={{ color: '#0E2916' }}>Questions fréquentes</h2>
            </div>

            <div className="reveal mt-12 divide-y rounded-3xl bg-white shadow-card overflow-hidden" style={{ outlineColor: 'rgba(61,61,61,.05)', outline: '1px solid rgba(61,61,61,.05)' }}>
              {[
                { q: 'Comment ça marche concrètement ?', a: 'Tu crées ton compte en 2 minutes. L\'IA t\'interview pendant 10 min pour comprendre ton style, ton budget, ta date et ta famille. Ensuite tout se débloque : mood board, planning, prestataires recommandés. Tu invites ton(ta) partenaire, ta wedding planner ou ta mère — c\'est toi qui décides.', open: true },
                { q: 'Et le paiement, comment ça se passe ?', a: 'Un seul paiement, à l\'inscription. Orange Money, Wave, virement bancaire, ou carte (Visa, Mastercard, Stripe, Paypal pour la diaspora). Tu peux fractionner en 3 fois sans frais via Wave.' },
                { q: 'Mes données sont-elles sécurisées ?', a: 'Tes données sont chiffrées de bout en bout, hébergées à Paris (RGPD) avec backup à Dakar. Aucun partage sans ton accord explicite. Conformité CDP Sénégal + RGPD UE. Tu peux exporter ou supprimer tout en 1 clic.' },
                { q: 'L\'IA comprend-elle le wolof ?', a: 'Oui. SamaIA a été entraînée sur 80 000 conversations wolof, français et franco-wolof. Tu peux lui parler comme à ta cousine. Le mode vocal arrive en Q3 2026.' },
                { q: 'Et après le mariage ?', a: 'L\'app reste accessible 6 mois après le grand jour. Tu retrouves toutes les photos, tous les contacts, et surtout le récap Ndawtal — qui a donné, à qui tu dois rendre quoi. Une bénédiction pour les remerciements.' },
                { q: 'Et si je suis déjà fiancée depuis 6 mois ?', a: 'Sama Mariage rattrape tout. L\'IA reconstruit ton planning à partir de la date, importe tes contacts WhatsApp, et te dit immédiatement ce qui est en retard. Tu peux démarrer à J-30 si tu veux — on a déjà sauvé des mariages.' },
              ].map((item, i) => (
                <details key={i} className="group" open={item.open}>
                  <summary className="flex items-center justify-between gap-6 px-6 py-5">
                    <h3 className="font-display text-lg sm:text-xl" style={{ color: '#0E2916' }}>{item.q}</h3>
                    <span className="chev grid h-8 w-8 place-items-center rounded-full text-xl leading-none shrink-0" style={{ background: '#EAF1EC', color: '#1E5631' }}>+</span>
                  </summary>
                  <div className="px-6 pb-6 text-sm leading-relaxed max-w-2xl" style={{ color: 'rgba(61,61,61,.75)' }}>{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINALE ── */}
        <section id="cta" className="relative py-24 sm:py-32 overflow-hidden" style={{ color: '#FBF4EA' }}>
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 photo-ph"></div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(14,41,22,.95), rgba(14,41,22,.9) 60%, rgba(114,47,55,.9))' }}></div>
            <div className="absolute inset-0 wax-bg-bordeaux opacity-30"></div>
            <div className="absolute -bottom-32 -right-32 h-[480px] w-[480px] rounded-full blur-3xl" style={{ background: 'rgba(212,165,116,.15)' }}></div>
            <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full blur-3xl" style={{ background: 'rgba(114,47,55,.4)' }}></div>
          </div>

          <div className="mx-auto max-w-4xl px-5 sm:px-8 text-center">
            <div className="reveal font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: '#D4A574' }}>Disponible maintenant · 🇸🇳</div>
            <h2 className="reveal d1 mt-4 font-display text-4xl sm:text-5xl lg:text-[72px] text-balance leading-[1.02]">
              Prête à transformer<br />ton mariage&nbsp;?
            </h2>
            <p className="reveal d2 mt-6 max-w-xl mx-auto text-lg" style={{ color: 'rgba(247,233,207,.85)' }}>
              Rejoins les 500+ mariées qui planifient leur mariage sénégalais avec SamaMariage. Inscription en 2 minutes, données sécurisées.
            </p>

            <div className="reveal d3 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/onboarding" className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-[16px] font-medium transition w-full sm:w-auto justify-center" style={{ background: '#D4A574', color: '#3D181C', boxShadow: '0 20px 60px -20px rgba(212,165,116,.6)' }}>
                Créer mon compte
                <svg viewBox="0 0 20 20" className="h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
              </Link>
              <Link href="/connexion" className="inline-flex items-center gap-2 rounded-full border px-8 py-4 text-[16px] font-medium transition w-full sm:w-auto justify-center" style={{ borderColor: 'rgba(255,255,255,.25)', color: '#FBF4EA', background: 'rgba(255,255,255,.07)', backdropFilter: 'blur(8px)' }}>
                J&apos;ai déjà un compte
              </Link>
            </div>

            <div className="reveal d4 mt-10 flex items-center justify-center gap-5">
              <div className="flex -space-x-3">
                {['linear-gradient(135deg,#D4A574,#722F37)', 'linear-gradient(135deg,#722F37,#1E5631)', 'linear-gradient(135deg,#1E5631,#D4A574)', 'linear-gradient(135deg,#EFD9B8,#B98548)'].map((bg, i) => (
                  <div key={i} className="h-10 w-10 rounded-full ring-2 ring-[#0E2916]" style={{ background: bg }}></div>
                ))}
                <div className="grid h-10 w-10 place-items-center rounded-full text-[10px] font-mono" style={{ background: 'rgba(255,255,255,.12)', outline: '2px solid rgba(212,165,116,.4)' }}>+496</div>
              </div>
              <div className="text-sm text-left" style={{ color: 'rgba(247,233,207,.8)' }}>
                500+ mariées<br /><span className="text-[11px]" style={{ color: 'rgba(212,165,116,.7)' }}>nous font confiance</span>
              </div>
            </div>

            <p className="reveal mt-6 text-[11px] font-mono" style={{ color: 'rgba(247,233,207,.4)' }}>Paiement Orange Money · Wave · Visa · Stripe &nbsp;·&nbsp; Données chiffrées RGPD</p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background: '#0E2916', color: '#FBF4EA' }}>
          <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16">
            <div className="grid lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4">
                <a href="#top" className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: '#D4A574' }}>
                    <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" stroke="#0E2916" strokeWidth="1.8">
                      <path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z" />
                      <path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z" />
                      <path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3" />
                    </svg>
                  </span>
                  <span className="font-display text-2xl">Sama<span className="gold-shine font-semibold">Mariage</span></span>
                </a>
                <p className="mt-6 font-display text-2xl italic leading-snug max-w-sm" style={{ color: 'rgba(247,233,207,.9)' }}>
                  &laquo;&nbsp;Sama, le futur t&apos;appartient.&nbsp;&raquo;
                </p>
                <p className="mt-4 text-sm max-w-xs" style={{ color: 'rgba(247,233,207,.6)' }}>
                  L&apos;app qui pilote ton mariage sénégalais, de la première inspiration au dernier merci.
                </p>
                <div className="mt-7 flex items-center gap-2">
                  {[
                    <svg key="tk" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M16 3v3.6a4.4 4.4 0 0 0 4.4 4.4V14a7.4 7.4 0 0 1-4.4-1.4V17a5 5 0 1 1-5-5h.6v3.1a2 2 0 1 0 1.4 1.9V3z" /></svg>,
                    <svg key="ig" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>,
                    <svg key="pi" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.3-.9 3.5-.3 1.1.5 2 1.6 2 1.9 0 3.4-2 3.4-5 0-2.6-1.9-4.4-4.5-4.4-3.1 0-4.9 2.3-4.9 4.7 0 .9.4 2 .8 2.5.1.1.1.2.1.3l-.3 1.2c0 .2-.2.2-.4.1-1.3-.6-2.1-2.6-2.1-4.1 0-3.4 2.4-6.5 7-6.5 3.7 0 6.6 2.6 6.6 6.2 0 3.7-2.3 6.6-5.6 6.6-1.1 0-2.1-.6-2.5-1.2l-.7 2.6c-.2.9-.9 2.1-1.3 2.8A10 10 0 1 0 12 2z" /></svg>,
                    <svg key="yt" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M23 7s-.2-1.5-.9-2.2c-.8-.9-1.7-.9-2.1-1C16.9 3.5 12 3.5 12 3.5s-4.9 0-8 .3c-.4.1-1.3.1-2.1 1C1.2 5.5 1 7 1 7S.8 8.8.8 10.6v1.7c0 1.8.2 3.6.2 3.6s.2 1.5.9 2.2c.8.9 1.9.9 2.4 1 1.7.2 7.7.3 7.7.3s4.9 0 8.1-.3c.4-.1 1.3-.1 2.1-1 .7-.7.9-2.2.9-2.2s.2-1.8.2-3.6v-1.7C23.2 8.8 23 7 23 7zM9.7 14.4V8.1l6.3 3.2-6.3 3.1z" /></svg>,
                  ].map((icon, i) => (
                    <a key={i} href="#" className="grid h-10 w-10 place-items-center rounded-full transition" style={{ background: 'rgba(255,255,255,.1)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#D4A574'; (e.currentTarget as HTMLElement).style.color = '#0E2916' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.1)'; (e.currentTarget as HTMLElement).style.color = '' }}>
                      {icon}
                    </a>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
                {[
                  { title: 'Produit', links: ['Les 8 modules', 'Tarifs', 'Sama Diaspora', 'Prestataires', 'Témoignages'] },
                  { title: 'Entreprise', links: ['Notre histoire', 'L\'équipe', 'Carrières', 'Presse', 'Contact'] },
                  { title: 'Ressources', links: ['Le journal', 'Guide gratuit', 'Calculateur budget', 'Glossaire Ndawtal', 'Aide'] },
                  { title: 'Légal', links: ['CGU', 'Confidentialité', 'RGPD / CDP', 'Cookies', 'Mentions légales'] },
                ].map(col => (
                  <div key={col.title}>
                    <div className="font-mono text-[11px] uppercase tracking-widest" style={{ color: '#D4A574' }}>{col.title}</div>
                    <ul className="mt-4 space-y-2.5" style={{ color: 'rgba(247,233,207,.75)' }}>
                      {col.links.map(l => (
                        <li key={l}><a href="#" className="transition hover:text-gold-400"
                          onMouseEnter={e => (e.currentTarget.style.color = '#D4A574')}
                          onMouseLeave={e => (e.currentTarget.style.color = '')}>{l}</a></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="henna-line mt-14"></div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono" style={{ color: 'rgba(247,233,207,.6)' }}>
              <div>© 2026 SamaMariage SAS · Tous droits réservés</div>
              <div className="flex items-center gap-2">
                Made with <span style={{ color: '#722F37' }}>❤</span> in Dakar, Sénégal 🇸🇳
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
