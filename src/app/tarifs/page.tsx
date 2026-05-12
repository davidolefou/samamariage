'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const PLANS = [
  {
    id: 'essentiel',
    name: 'Sama Essentiel',
    tagline: 'Pour démarrer sereinement',
    price: 25_000,
    budget: 'Budgets < 5M FCFA',
    color: '#1E5631',
    colorLight: '#EAF1EC',
    highlight: false,
    badge: null,
    modules: 5,
    guests: '50 max',
    ndaxal: '20 amies',
    support: 'WhatsApp 6j/7',
    features: [
      { label: 'Sama Mood (inspiration board)', v: true },
      { label: 'Sama Budget IA', v: true },
      { label: 'Sama Planning', v: true },
      { label: 'Sama Invités (50 max)', v: true },
      { label: 'Sama Tenues (20 amies)', v: true },
      { label: 'Sama Ndawtal', v: false },
      { label: 'Sama Prestataires', v: false },
      { label: 'Sama Sérénité (coach IA)', v: false },
      { label: 'RSVP digital illimité', v: false },
      { label: 'Plan de table IA', v: false },
      { label: 'Ndaxal illimité (amies)', v: false },
      { label: 'Support prioritaire 7j/7', v: false },
      { label: 'Coordinatrice dédiée Dakar', v: false },
      { label: 'Vidéos quotidiennes terrain', v: false },
      { label: 'Audit financier hebdomadaire', v: false },
    ],
    cta: 'Commencer avec Essentiel',
    ctaStyle: { background: 'white', color: '#1E5631', border: '2px solid #1E5631' },
    testimonial: { q: '« Le module Budget seul m\'a fait économiser 400 000 F. »', name: 'Awa T.', loc: 'Mariée · Pikine' },
  },
  {
    id: 'premium',
    name: 'Sama Premium',
    tagline: 'Le choix de 80% des mariées',
    price: 50_000,
    budget: 'Budgets 5 – 15M FCFA',
    color: '#D4A574',
    colorLight: '#FBF4EA',
    highlight: true,
    badge: '⭐ Le plus choisi',
    modules: 8,
    guests: 'Illimité',
    ndaxal: 'Illimité',
    support: 'Prioritaire 7j/7',
    features: [
      { label: 'Sama Mood (inspiration board)', v: true },
      { label: 'Sama Budget IA', v: true },
      { label: 'Sama Planning', v: true },
      { label: 'Sama Invités (50 max)', v: true },
      { label: 'Sama Tenues (20 amies)', v: true },
      { label: 'Sama Ndawtal', v: true },
      { label: 'Sama Prestataires', v: true },
      { label: 'Sama Sérénité (coach IA)', v: true },
      { label: 'RSVP digital illimité', v: true },
      { label: 'Plan de table IA', v: true },
      { label: 'Ndaxal illimité (amies)', v: true },
      { label: 'Support prioritaire 7j/7', v: true },
      { label: 'Coordinatrice dédiée Dakar', v: false },
      { label: 'Vidéos quotidiennes terrain', v: false },
      { label: 'Audit financier hebdomadaire', v: false },
    ],
    cta: 'Commencer avec Premium',
    ctaStyle: { background: '#D4A574', color: '#3D181C', border: '2px solid #D4A574' },
    testimonial: { q: '« Ndawtal + Tenues en même temps, zéro prise de tête. »', name: 'Ndèye C.', loc: 'Mariée · Paris 18ᵉ' },
  },
  {
    id: 'diaspora',
    name: 'Sama Diaspora',
    tagline: 'Pour les mariées à l\'étranger',
    price: 250_000,
    budget: 'Tous budgets · Dakar à distance',
    color: '#722F37',
    colorLight: 'rgba(114,47,55,.08)',
    highlight: false,
    badge: 'Diaspora',
    modules: 8,
    guests: 'Illimité',
    ndaxal: 'Illimité',
    support: 'Conciergerie multilingue',
    features: [
      { label: 'Sama Mood (inspiration board)', v: true },
      { label: 'Sama Budget IA', v: true },
      { label: 'Sama Planning', v: true },
      { label: 'Sama Invités (50 max)', v: true },
      { label: 'Sama Tenues (20 amies)', v: true },
      { label: 'Sama Ndawtal', v: true },
      { label: 'Sama Prestataires', v: true },
      { label: 'Sama Sérénité (coach IA)', v: true },
      { label: 'RSVP digital illimité', v: true },
      { label: 'Plan de table IA', v: true },
      { label: 'Ndaxal illimité (amies)', v: true },
      { label: 'Support prioritaire 7j/7', v: true },
      { label: 'Coordinatrice dédiée Dakar', v: true },
      { label: 'Vidéos quotidiennes terrain', v: true },
      { label: 'Audit financier hebdomadaire', v: true },
    ],
    cta: 'Commencer avec Diaspora',
    ctaStyle: { background: '#722F37', color: '#FBF4EA', border: '2px solid #722F37' },
    testimonial: { q: '« Je vis à Milan. La coordinatrice à Dakar m\'a sauvé la mise. »', name: 'Marème B.', loc: 'Mariée · Milan → Dakar' },
  },
]

const TABLE_ROWS = [
  { cat: 'Modules', label: 'Nombre de modules',     essentiel: '5 modules',   premium: '8 modules',   diaspora: '8 modules' },
  { cat: 'Invités', label: 'RSVP digital',           essentiel: '50 max',      premium: 'Illimité',    diaspora: 'Illimité' },
  { cat: 'Invités', label: 'Plan de table IA',       essentiel: '—',           premium: '✓',           diaspora: '✓' },
  { cat: 'Tenues',  label: 'Coordination ndaxal',    essentiel: '20 amies',    premium: 'Illimité',    diaspora: 'Illimité' },
  { cat: 'Ndawtal', label: 'Tracking ndawtal',       essentiel: '—',           premium: '✓',           diaspora: '✓' },
  { cat: 'IA',      label: 'Budget IA',              essentiel: '✓',           premium: '✓',           diaspora: '✓' },
  { cat: 'IA',      label: 'Sama Sérénité (coach)',  essentiel: '—',           premium: '✓',           diaspora: '✓' },
  { cat: 'Diaspora',label: 'Coordinatrice à Dakar',  essentiel: '—',           premium: '—',           diaspora: '✓' },
  { cat: 'Diaspora',label: 'Vidéos terrain quotidiennes', essentiel: '—',      premium: '—',           diaspora: '✓' },
  { cat: 'Diaspora',label: 'Audit financier hebdo',  essentiel: '—',           premium: '—',           diaspora: '✓' },
  { cat: 'Support', label: 'Support WhatsApp',       essentiel: '6j/7',        premium: '7j/7 prioritaire', diaspora: 'Conciergerie FR/EN/IT' },
  { cat: 'Support', label: 'Accès après mariage',    essentiel: '3 mois',      premium: '6 mois',      diaspora: '12 mois' },
]

const FAQS = [
  { q: 'Puis-je changer de formule après l\'inscription ?', a: 'Oui, tu peux upgrader à tout moment en payant la différence. Tu ne perds aucune donnée.' },
  { q: 'Le paiement est-il en une seule fois ?', a: 'Oui, un paiement unique. Orange Money, Wave, Visa/Mastercard, Stripe, ou PayPal. Fractionnement en 3x sans frais via Wave.' },
  { q: 'Que se passe-t-il si je suis déjà engagée avec des prestataires ?', a: 'Sama Mariage importe tout : contacts, dépenses déjà engagées, planning existant. L\'IA reconstruit une vision complète en quelques minutes.' },
  { q: 'Sama Diaspora vaut vraiment 250 000 FCFA ?', a: 'La coordinatrice à Dakar seule coûte habituellement 300 000–500 000 FCFA. Avec Sama Diaspora tu paies moins et tu as en plus tous les 8 modules + audit financier + vidéos terrain.' },
  { q: 'Mes données privées (ndawtal, budget) sont-elles sécurisées ?', a: 'Chiffrement de bout en bout, hébergement Paris + backup Dakar, conformité RGPD + CDP Sénégal. Export ou suppression en 1 clic.' },
]

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n)
}

export default function TarifsPage() {
  const [hovered, setHovered] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => {
    const onScroll = () => {
      const navInner = document.getElementById('tNavInner')
      navInner?.classList.toggle('t-nav-scrolled', window.scrollY > 12)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <style>{`
        .t-nav-scrolled { background: rgba(250,247,242,.92); backdrop-filter: blur(12px); box-shadow: 0 1px 0 rgba(255,255,255,.6) inset, 0 20px 40px -20px rgba(61,61,61,.14); border-color: rgba(61,61,61,.08) !important; }
        .plan-card { transition: transform .3s cubic-bezier(.2,.7,.2,1), box-shadow .3s; }
        .plan-card:hover { transform: translateY(-4px); }
        .tick { color: #1E5631; font-weight: 700; }
        .cross { color: rgba(61,61,61,.25); }
        .row-cat { background: rgba(30,86,49,.04); }
      `}</style>

      <div style={{ background: '#FAF7F2', color: '#3D3D3D', minHeight: '100vh' }}>

        {/* ── NAV ── */}
        <header className="fixed inset-x-0 top-0 z-50">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div id="tNavInner" className="mt-3 flex items-center justify-between rounded-2xl border border-transparent px-4 py-3 transition-all duration-500">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: '#1E5631' }}>
                  <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" stroke="#D4A574" strokeWidth="1.6">
                    <path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z" />
                    <path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z" />
                    <path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3" />
                  </svg>
                </span>
                <span className="font-display text-[22px] leading-none">
                  <span style={{ color: '#1E5631' }}>Sama</span><span className="gold-shine font-semibold">Mariage</span>
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <Link href="/connexion" className="hidden sm:inline-flex rounded-full border px-5 py-2 text-sm font-medium transition hover:bg-[#EAF1EC]" style={{ borderColor: 'rgba(30,86,49,.15)', color: '#0E2916' }}>Se connecter</Link>
                <Link href="/inscription" className="inline-flex rounded-full px-5 py-2 text-sm font-medium transition" style={{ background: '#1E5631', color: '#FBF4EA' }}>S&apos;inscrire</Link>
              </div>
            </div>
          </div>
        </header>

        {/* ── HERO ── */}
        <section className="pt-32 pb-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 -z-10 wax-bg opacity-50" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full blur-3xl -z-10" style={{ background: 'rgba(212,165,116,.18)' }} />

          <div className="mx-auto max-w-3xl px-5">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ background: 'rgba(255,255,255,.7)', borderColor: 'rgba(30,86,49,.12)', color: '#173F24', backdropFilter: 'blur(8px)' }}>
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: '#1E5631' }} />
              Un seul paiement · Accès à vie jusqu&apos;au mariage
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-[76px] leading-[1.02] mb-6" style={{ color: '#0E2916' }}>
              Choisis ton<br /><em className="not-italic gold-shine">niveau d&apos;accompagnement</em>
            </h1>
            <p className="text-lg max-w-xl mx-auto" style={{ color: 'rgba(61,61,61,.7)' }}>
              Trois formules. Un objectif : que ton mariage sénégalais soit exactement comme tu l&apos;as rêvé — sans stress, sans dépassement, sans WhatsApp à 1h du matin.
            </p>

            <div className="mt-8 flex items-center justify-center gap-6 text-sm" style={{ color: 'rgba(61,61,61,.6)' }}>
              {['Paiement unique, aucun abonnement', 'Données sécurisées RGPD', 'Support WhatsApp inclus'].map((t, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" style={{ color: '#1E5631' }} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m2 8 3.5 3.5 8.5-7" /></svg>
                  <span className="hidden sm:inline">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING CARDS ── */}
        <section className="pb-20 px-5 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-3 gap-5 items-start">
              {PLANS.map(plan => (
                <div
                  key={plan.id}
                  className={`plan-card relative rounded-3xl overflow-hidden ${plan.highlight ? 'lg:-mt-4 lg:mb-0' : ''}`}
                  style={plan.highlight
                    ? { background: '#0E2916', color: '#FBF4EA', outline: '2px solid #D4A574', boxShadow: '0 40px 80px -30px rgba(14,41,22,.5)' }
                    : { background: 'white', outline: '1px solid rgba(61,61,61,.08)', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 20px 40px -20px rgba(61,61,61,.12)' }
                  }
                  onMouseEnter={() => setHovered(plan.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute left-1/2 -translate-x-1/2 -top-px rounded-b-xl px-5 py-1.5 text-[11px] font-medium uppercase tracking-wider"
                      style={plan.highlight
                        ? { background: '#D4A574', color: '#722F37' }
                        : { background: plan.color, color: '#FBF4EA' }}>
                      {plan.badge}
                    </div>
                  )}

                  <div className="p-7 pt-8">
                    {/* Header */}
                    <div className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: plan.highlight ? '#D4A574' : 'rgba(61,61,61,.45)' }}>
                      {plan.budget}
                    </div>
                    <h2 className="font-display text-3xl mb-1" style={{ color: plan.highlight ? '#FBF4EA' : '#0E2916' }}>{plan.name}</h2>
                    <p className="text-sm mb-6" style={{ color: plan.highlight ? 'rgba(247,233,207,.65)' : 'rgba(61,61,61,.55)' }}>{plan.tagline}</p>

                    {/* Price */}
                    <div className="flex items-end gap-2 mb-2">
                      <span className="font-display text-[52px] leading-none" style={{ color: plan.highlight ? '#F7E9CF' : plan.color }}>
                        {plan.price.toLocaleString('fr-SN')}
                      </span>
                      <div className="mb-2">
                        <div className="font-mono text-sm font-bold" style={{ color: plan.highlight ? '#D4A574' : plan.color }}>FCFA</div>
                        <div className="font-mono text-[10px]" style={{ color: plan.highlight ? 'rgba(247,233,207,.5)' : 'rgba(61,61,61,.45)' }}>paiement unique</div>
                      </div>
                    </div>

                    {/* Savings callout for premium */}
                    {plan.highlight && (
                      <div className="mb-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px]" style={{ background: 'rgba(212,165,116,.15)', color: '#D4A574' }}>
                        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="m2 8 3 3 9-7" /></svg>
                        Économise vs coordinatrice seule (300 000+ FCFA)
                      </div>
                    )}

                    {/* CTA */}
                    <Link href="/inscription" className="mb-8 flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[15px] font-medium transition hover:opacity-90"
                      style={plan.highlight
                        ? { background: '#D4A574', color: '#3D181C' }
                        : { ...plan.ctaStyle }}>
                      {plan.cta}
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
                    </Link>

                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-2 mb-7">
                      {[
                        { label: 'Modules', val: `${plan.modules}` },
                        { label: 'Invités', val: plan.guests },
                        { label: 'Support', val: plan.support.split(' ')[0] + (plan.support.includes('7j') ? ' 7j/7' : '') },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: plan.highlight ? 'rgba(255,255,255,.07)' : plan.colorLight }}>
                          <div className="font-display text-lg leading-none mb-0.5" style={{ color: plan.highlight ? '#F7E9CF' : plan.color }}>{s.val}</div>
                          <div className="font-mono text-[9px] uppercase tracking-wider" style={{ color: plan.highlight ? 'rgba(247,233,207,.5)' : 'rgba(61,61,61,.45)' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Feature list */}
                    <div className="space-y-2.5">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-[13px]">
                          {f.v
                            ? <svg viewBox="0 0 16 16" className="h-4 w-4 mt-0.5 shrink-0" style={{ color: plan.highlight ? '#D4A574' : plan.color }} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m2 8 3.5 3.5 8.5-7" /></svg>
                            : <svg viewBox="0 0 16 16" className="h-4 w-4 mt-0.5 shrink-0 opacity-25" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12 12 4M4 4l8 8" /></svg>
                          }
                          <span style={{ color: f.v ? (plan.highlight ? 'rgba(247,233,207,.9)' : '#0E2916') : (plan.highlight ? 'rgba(247,233,207,.3)' : 'rgba(61,61,61,.3)') }}>
                            {f.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Testimonial */}
                    <div className="mt-7 rounded-2xl p-4" style={{ background: plan.highlight ? 'rgba(255,255,255,.06)' : plan.colorLight, borderTop: `2px solid ${plan.color}20` }}>
                      <p className="text-[12px] italic leading-relaxed" style={{ color: plan.highlight ? 'rgba(247,233,207,.75)' : 'rgba(61,61,61,.7)' }}>{plan.testimonial.q}</p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full shrink-0" style={{ background: `linear-gradient(135deg, ${plan.color}, #D4A574)` }} />
                        <div>
                          <div className="text-[12px] font-medium" style={{ color: plan.highlight ? '#F7E9CF' : '#0E2916' }}>{plan.testimonial.name}</div>
                          <div className="text-[10px]" style={{ color: plan.highlight ? 'rgba(247,233,207,.5)' : 'rgba(61,61,61,.45)' }}>{plan.testimonial.loc}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(61,61,61,.4)' }}>
              Orange Money · Wave · Visa · Stripe · PayPal · Fractionnement 3× sans frais via Wave
            </p>
          </div>
        </section>

        {/* ── VALUE PROPS ── */}
        <section className="py-16 relative" style={{ background: 'linear-gradient(135deg, #0E2916, #1E5631)' }}>
          <div className="absolute inset-0 wax-bg opacity-20" />
          <div className="mx-auto max-w-6xl px-5 sm:px-8 relative">
            <div className="text-center mb-12">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: '#D4A574' }}>Pourquoi SamaMariage vaut chaque franc</div>
              <h2 className="font-display text-4xl sm:text-5xl text-[#F7E9CF]">Ce que tu évites vraiment</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: '📉', title: 'Dépassement budget', sans: 'Moyenne +80% de dépassement', avec: 'Budget IA alertes en temps réel', color: '#D4A574' },
                { icon: '📱', title: '15 groupes WhatsApp', sans: 'Chaos total, nuits sans sommeil', avec: 'Tout centralisé, 1 app, 1 vue', color: '#D4A574' },
                { icon: '💍', title: 'Ndawtal incontrôlable', sans: 'Cahier perdu, disputes de famille', avec: 'Tracking digital, 0 litige', color: '#D4A574' },
                { icon: '✈️', title: 'Distance diaspora', sans: 'Prestataires peu fiables, surprises', avec: 'Coordinatrice dédiée + vidéos', color: '#D4A574' },
              ].map((c, i) => (
                <div key={i} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(212,165,116,.15)' }}>
                  <div className="text-3xl mb-4">{c.icon}</div>
                  <h3 className="font-display text-xl text-[#F7E9CF] mb-3">{c.title}</h3>
                  <div className="space-y-2 text-[12px]">
                    <div className="flex items-start gap-2" style={{ color: 'rgba(247,233,207,.5)' }}>
                      <span className="mt-0.5 shrink-0" style={{ color: '#722F37' }}>✗</span>
                      <span>Sans Sama : {c.sans}</span>
                    </div>
                    <div className="flex items-start gap-2" style={{ color: 'rgba(247,233,207,.85)' }}>
                      <span className="mt-0.5 shrink-0" style={{ color: c.color }}>✓</span>
                      <span>Avec Sama : {c.avec}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARISON TABLE ── */}
        <section className="py-20 px-5 sm:px-8" style={{ background: '#FAF7F2' }}>
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: '#722F37' }}>Tableau comparatif</div>
              <h2 className="font-display text-4xl sm:text-5xl" style={{ color: '#0E2916' }}>Tout dans le détail</h2>
            </div>

            <div className="rounded-3xl overflow-hidden shadow-card ring-1" style={{ outlineColor: 'rgba(61,61,61,.08)' }}>
              {/* Table header */}
              <div className="grid grid-cols-4 text-center" style={{ background: '#0E2916' }}>
                <div className="p-5 text-left">
                  <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(212,165,116,.6)' }}>Fonctionnalité</div>
                </div>
                {PLANS.map(plan => (
                  <div key={plan.id} className="p-5 border-l" style={{ borderColor: 'rgba(255,255,255,.08)' }}>
                    <div className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(212,165,116,.6)' }}>{plan.price.toLocaleString('fr-SN')} FCFA</div>
                    <div className="font-display text-lg" style={{ color: plan.highlight ? '#D4A574' : '#F7E9CF' }}>{plan.name.replace('Sama ', '')}</div>
                  </div>
                ))}
              </div>

              {/* Table body */}
              {(() => {
                const cats = [...new Set(TABLE_ROWS.map(r => r.cat))]
                return cats.map(cat => (
                  <div key={cat}>
                    <div className="grid grid-cols-4 row-cat">
                      <div className="px-5 py-2 col-span-4">
                        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: '#1E5631' }}>{cat}</span>
                      </div>
                    </div>
                    {TABLE_ROWS.filter(r => r.cat === cat).map((row, ri) => (
                      <div key={ri} className="grid grid-cols-4 border-t" style={{ borderColor: 'rgba(61,61,61,.06)' }}>
                        <div className="px-5 py-3.5 flex items-center">
                          <span className="text-sm" style={{ color: '#3D3D3D' }}>{row.label}</span>
                        </div>
                        {[row.essentiel, row.premium, row.diaspora].map((val, vi) => {
                          const isCheck = val === '✓'
                          const isCross = val === '—'
                          const plan = PLANS[vi]
                          return (
                            <div key={vi} className="px-5 py-3.5 border-l text-center flex items-center justify-center" style={{ borderColor: 'rgba(61,61,61,.06)' }}>
                              {isCheck
                                ? <svg viewBox="0 0 20 20" className="h-5 w-5" style={{ color: plan.color }} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 10 4.5 4.5 9.5-9" /></svg>
                                : isCross
                                ? <span className="text-[13px]" style={{ color: 'rgba(61,61,61,.2)' }}>—</span>
                                : <span className="text-[12px] font-medium" style={{ color: plan.color }}>{val}</span>
                              }
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                ))
              })()}

              {/* Table footer CTA */}
              <div className="grid grid-cols-4 border-t" style={{ borderColor: 'rgba(61,61,61,.08)', background: 'rgba(250,247,242,.6)' }}>
                <div className="p-5" />
                {PLANS.map(plan => (
                  <div key={plan.id} className="p-4 border-l" style={{ borderColor: 'rgba(61,61,61,.06)' }}>
                    <Link href="/inscription"
                      className="flex items-center justify-center rounded-xl py-3 text-[13px] font-medium transition hover:opacity-90"
                      style={{ background: plan.color, color: plan.id === 'essentiel' ? '#FBF4EA' : plan.id === 'premium' ? '#3D181C' : '#FBF4EA' }}>
                      Choisir
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── DIASPORA HIGHLIGHT ── */}
        <section className="py-20 px-5 sm:px-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #3D181C, #722F37 50%, #0E2916)', color: '#FBF4EA' }}>
          <div className="absolute inset-0 wax-bg-bordeaux opacity-30" />
          <div className="absolute -right-32 top-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full blur-3xl" style={{ background: 'rgba(212,165,116,.1)' }} />
          <div className="mx-auto max-w-6xl relative grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: '#D4A574' }}>Spécial Diaspora</div>
              <h2 className="font-display text-4xl sm:text-5xl mb-6">Tu vis à l&apos;étranger&nbsp;?<br />On gère Dakar pour toi.</h2>
              <p className="text-lg mb-8" style={{ color: 'rgba(247,233,207,.8)' }}>
                Sama Diaspora c&apos;est Premium + une coordinatrice certifiée sur place à Dakar — moins cher que de la recruter toi-même.
              </p>
              <div className="space-y-4 mb-10">
                {[
                  { icon: '🎥', title: 'Vidéos terrain quotidiennes', desc: 'Ta coordinatrice t\'envoie une vidéo de 90 sec chaque soir. Tu vois la salle, les prestataires, les tenues.' },
                  { icon: '💰', title: 'Audit financier hebdomadaire', desc: 'Rapport chiffré de chaque franc dépensé à Dakar. Zéro surprise à ton arrivée.' },
                  { icon: '🌍', title: 'Conciergerie FR / EN / IT', desc: 'Tu parles, on traduit, on coordonne. De Paris, Milan, New York ou Montréal.' },
                ].map((f, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="text-2xl shrink-0 mt-0.5">{f.icon}</div>
                    <div>
                      <div className="font-medium text-[#F7E9CF]">{f.title}</div>
                      <div className="text-sm mt-0.5" style={{ color: 'rgba(247,233,207,.65)' }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/inscription" className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-medium transition hover:opacity-90" style={{ background: '#D4A574', color: '#3D181C' }}>
                Commencer Sama Diaspora
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
              </Link>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(212,165,116,.2)' }}>
                <div className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color: 'rgba(212,165,116,.6)' }}>Comparaison coût réel</div>
                <div className="space-y-3">
                  {[
                    { label: 'Coordinatrice seule (marché Dakar)', price: '350 000', color: '#722F37', bar: 100 },
                    { label: 'Sama Premium + coordinatrice séparée', price: '400 000', color: '#B98548', bar: 114 },
                    { label: 'Sama Diaspora (tout inclus)', price: '250 000', color: '#D4A574', bar: 71 },
                  ].map((row, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[12px] mb-1">
                        <span style={{ color: 'rgba(247,233,207,.8)' }}>{row.label}</span>
                        <span className="font-mono font-bold" style={{ color: row.color }}>{row.price} FCFA</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,.08)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${row.bar}%`, background: row.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-5" style={{ background: 'rgba(212,165,116,.1)', border: '1px solid rgba(212,165,116,.25)' }}>
                <div className="text-2xl mb-2">💬</div>
                <blockquote className="text-sm italic leading-relaxed" style={{ color: 'rgba(247,233,207,.85)' }}>
                  &ldquo;Je vis à Milan depuis 8 ans. La coordinatrice Sama a tout géré depuis le traiteur jusqu&apos;au DJ, je n&apos;ai rien eu à faire depuis l&apos;Italie.&rdquo;
                </blockquote>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full" style={{ background: 'linear-gradient(135deg, #D4A574, #722F37)' }} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#F7E9CF' }}>Marème B.</div>
                    <div className="text-[11px]" style={{ color: 'rgba(212,165,116,.6)' }}>Mariée · Milan → Dakar · Nov 2025</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 px-5 sm:px-8" style={{ background: '#FAF7F2' }}>
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: '#722F37' }}>Questions sur les prix</div>
              <h2 className="font-display text-4xl sm:text-5xl" style={{ color: '#0E2916' }}>Tout ce que tu veux savoir</h2>
            </div>
            <div className="divide-y rounded-3xl bg-white overflow-hidden shadow-card ring-1" style={{ outlineColor: 'rgba(61,61,61,.06)' }}>
              {FAQS.map((faq, i) => (
                <div key={i}>
                  <button
                    className="w-full flex items-center justify-between gap-6 px-6 py-5 text-left"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <h3 className="font-display text-lg" style={{ color: '#0E2916' }}>{faq.q}</h3>
                    <span className="grid h-8 w-8 place-items-center rounded-full shrink-0 text-xl leading-none transition-transform"
                      style={{ background: '#EAF1EC', color: '#1E5631', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-6 text-sm leading-relaxed max-w-2xl" style={{ color: 'rgba(61,61,61,.7)' }}>{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-20 px-5 sm:px-8 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #173F24, #1E5631)' }}>
          <div className="absolute inset-0 wax-bg opacity-20" />
          <div className="mx-auto max-w-2xl relative">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] mb-4" style={{ color: '#D4A574' }}>Prête à commencer ?</div>
            <h2 className="font-display text-4xl sm:text-5xl mb-6 text-[#F7E9CF]">
              Ton mariage mérite<br />le meilleur accompagnement.
            </h2>
            <p className="text-lg mb-10" style={{ color: 'rgba(247,233,207,.8)' }}>
              Quelle que soit ta formule, tu peux commencer aujourd&apos;hui. Inscription en 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/inscription" className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-[16px] font-medium transition hover:opacity-90 w-full sm:w-auto justify-center" style={{ background: '#D4A574', color: '#3D181C', boxShadow: '0 20px 60px -20px rgba(212,165,116,.5)' }}>
                Créer mon compte gratuitement
                <svg viewBox="0 0 20 20" className="h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
              </Link>
              <Link href="/" className="inline-flex items-center gap-2 rounded-full border px-8 py-4 text-[16px] font-medium transition hover:bg-white/10 w-full sm:w-auto justify-center" style={{ borderColor: 'rgba(255,255,255,.25)', color: '#FBF4EA' }}>
                Retour à l&apos;accueil
              </Link>
            </div>
            <p className="mt-6 text-[11px] font-mono" style={{ color: 'rgba(247,233,207,.35)' }}>Paiement uniquement après avoir choisi ta formule · Aucune CB requise à l&apos;inscription</p>
          </div>
        </section>

        {/* ── FOOTER MINIMAL ── */}
        <footer className="py-8 text-center" style={{ background: '#0E2916' }}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="grid h-8 w-8 place-items-center rounded-xl" style={{ background: '#D4A574' }}>
              <svg viewBox="0 0 32 32" className="h-4 w-4" fill="none" stroke="#0E2916" strokeWidth="1.8">
                <path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z" />
                <path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z" />
                <path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3" />
              </svg>
            </span>
            <span className="font-display text-xl text-[#FBF4EA]">Sama<span className="gold-shine font-semibold">Mariage</span></span>
          </div>
          <p className="text-xs font-mono" style={{ color: 'rgba(247,233,207,.35)' }}>© 2026 SamaMariage · Made with ❤ in Dakar 🇸🇳</p>
        </footer>

      </div>
    </>
  )
}
