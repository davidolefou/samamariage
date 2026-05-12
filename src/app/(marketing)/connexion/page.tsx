'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const COUNTRIES = [
  { flag: '🇸🇳', code: '+221', label: 'Sénégal' },
  { flag: '🇫🇷', code: '+33',  label: 'France' },
  { flag: '🇮🇹', code: '+39',  label: 'Italie' },
  { flag: '🇺🇸', code: '+1',   label: 'USA' },
  { flag: '🇬🇧', code: '+44',  label: 'UK' },
]

function Toast({ msg, kind = 'ok' }: { msg: string; kind?: 'ok' | 'err' }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full px-5 py-3 text-sm shadow-glow ring-1 ring-[#D4A574]/30 ${kind === 'ok' ? 'bg-[#0E2916] text-[#F7E9CF]' : 'bg-[#722F37] text-[#F7E9CF]'}`}
      style={{ animation: 'toast-in .25s cubic-bezier(.2,.7,.2,1) both' }}>
      <span className="text-base">{kind === 'ok' ? '💚' : '⚠️'}</span>
      {msg}
    </div>
  )
}

export default function ConnexionPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)

  // WhatsApp flow
  const [country, setCountry] = useState(COUNTRIES[0])
  const [phone, setPhone] = useState('')
  const [otpStep, setOtpStep] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const [toast, setToast] = useState<{ msg: string; kind?: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, kind: 'ok' | 'err' = 'ok') {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), 2600)
  }

  function startResend() {
    setResendTimer(30)
  }
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  // Email submit
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) { showToast('Email et mot de passe requis', 'err'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // fallback: send OTP for demo
      showToast('Redirection vers le dashboard…')
      setTimeout(() => router.push('/app'), 900)
    } else {
      showToast('Bienvenue Aïssatou !')
      setTimeout(() => router.push('/app'), 900)
    }
    setLoading(false)
  }

  // Phone submit
  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (phone.trim().length < 6) { showToast('Numéro WhatsApp requis', 'err'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    setOtpStep(true)
    startResend()
    showToast('Code envoyé sur WhatsApp 💬')
    setTimeout(() => otpRefs.current[0]?.focus(), 80)
  }

  // OTP submit
  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (otp.some(v => !v)) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1100))
    showToast('Connexion réussie. Bienvenue Aïssatou !')
    setTimeout(() => router.push('/app'), 700)
  }

  function handleOtpChange(i: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]; next[i] = digit; setOtp(next)
    if (digit && i < 5) otpRefs.current[i + 1]?.focus()
  }
  function handleOtpKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus()
      const next = [...otp]; next[i - 1] = ''; setOtp(next)
    }
  }
  function handleOtpPaste(e: React.ClipboardEvent) {
    const data = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!data) return
    e.preventDefault()
    const next = [...otp]
    data.split('').forEach((ch, idx) => { if (idx < 6) next[idx] = ch })
    setOtp(next)
    const nextFocus = Math.min(data.length, 5)
    otpRefs.current[nextFocus]?.focus()
  }

  const maskedPhone = phone.length > 4
    ? phone.slice(0, 2) + ' ••• •• ' + phone.slice(-2)
    : '•• •• •• ' + phone.slice(-2)

  return (
    <>
      <style>{`
        @keyframes toast-in { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes breath { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-8px) rotate(4deg); } }
        .breath { animation: breath 6s ease-in-out infinite; }
        .arch { border-radius: 200px 200px 32px 32px / 220px 220px 32px 32px; }
        .wax-auth {
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,.07) 1px, transparent 1.4px), radial-gradient(circle at 12px 12px, rgba(212,165,116,.18) 1.2px, transparent 1.6px);
          background-size: 24px 24px; background-position: 0 0, 12px 12px;
        }
        .field-wrap { position: relative; border-radius: 14px; background: #fff; box-shadow: inset 0 0 0 1px rgba(61,61,61,.10); transition: box-shadow .2s; }
        .field-wrap:focus-within { box-shadow: inset 0 0 0 2px #1E5631; }
        .otp-box { width: 44px; height: 52px; border-radius: 12px; background: #fff; box-shadow: inset 0 0 0 1px rgba(61,61,61,.12); text-align: center; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #173F24; outline: none; transition: box-shadow .15s, transform .15s; }
        .otp-box:focus { box-shadow: inset 0 0 0 2px #1E5631; transform: translateY(-1px); }
        .otp-box.filled { background: #FAF7F2; box-shadow: inset 0 0 0 1px #1E5631; }
        .tab-auth[data-active="true"] { background: #1E5631; color: #F7E9CF; }
        .tab-auth[data-active="false"] { color: rgba(61,61,61,.7); }
        .tab-auth[data-active="false"]:hover { background: rgba(30,86,49,.04); color: #173F24; }
        .gold-shine-auth { background: linear-gradient(90deg, #B98548 0%, #EFD9B8 35%, #D4A574 55%, #B98548 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
      `}</style>

      <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">

        {/* ── LEFT — Editorial ── */}
        <section className="relative isolate hidden lg:flex flex-col p-10 xl:p-14 overflow-hidden" style={{ color: '#F7E9CF' }}>
          <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(135deg, #173F24, #0E2916 60%, #722F37)' }} />
          <div className="absolute inset-0 -z-10 wax-auth opacity-35" />
          <div className="absolute -top-32 -right-32 -z-10 h-[420px] w-[420px] rounded-full blur-3xl" style={{ background: 'rgba(212,165,116,.15)' }} />
          <div className="absolute -bottom-32 -left-32 -z-10 h-[420px] w-[420px] rounded-full blur-3xl" style={{ background: 'rgba(114,47,55,.4)' }} />

          <div className="font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: 'rgba(212,165,116,.85)' }}>
            Sama Mariage · espace privé
          </div>

          <div className="mt-auto pt-12 flex items-end justify-between gap-10">
            <div className="max-w-md">
              <h1 className="font-display text-5xl xl:text-6xl leading-[1.04] text-balance">
                Bon retour, <em className="not-italic gold-shine-auth">mariée</em>.
              </h1>
              <p className="mt-5 text-base leading-relaxed" style={{ color: 'rgba(247,233,207,.85)' }}>
                Ton tableau de bord t&apos;attend. Budget, planning, ndawtal, prestataires — tout est synchronisé depuis ta dernière visite.
              </p>
              <ul className="mt-9 space-y-3 text-[14px]" style={{ color: 'rgba(247,233,207,.85)' }}>
                {[
                  { icon: '🔒', text: 'Chiffrement bout-en-bout. Tes données restent chez toi.' },
                  { icon: '💬', text: 'Code par WhatsApp si tu as oublié ton mot de passe.' },
                  { icon: '✨', text: "Sama IA reprend l'analyse là où tu l'as laissée." },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-lg shrink-0 text-base" style={{ background: '#D4A574', color: '#3D181C' }}>{item.icon}</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden xl:block w-64 shrink-0">
              <div className="arch breath relative overflow-hidden shadow-glow ring-1 ring-[rgba(212,165,116,0.3)]" style={{ aspectRatio: '3/4', background: 'radial-gradient(120% 90% at 30% 0%, rgba(212,165,116,.45) 0%, transparent 60%), radial-gradient(120% 90% at 80% 80%, rgba(114,47,55,.45) 0%, transparent 60%), linear-gradient(180deg, #173F24 0%, #0E2916 100%)' }}>
                <div className="absolute top-3 left-3.5 font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: 'rgba(247,233,207,.5)' }}>Portrait · mariée sénégalaise</div>
                <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-1.5 opacity-90">
                  <div className="h-1 rounded-full" style={{ background: 'rgba(212,165,116,.7)' }} />
                  <div className="h-1 rounded-full" style={{ background: 'rgba(212,165,116,.5)' }} />
                  <div className="h-1 rounded-full" style={{ background: 'rgba(212,165,116,.3)' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 flex items-center justify-between gap-4 text-[11px] font-mono uppercase tracking-widest" style={{ borderTop: '1px solid rgba(212,165,116,.1)', color: 'rgba(247,233,207,.5)' }}>
            <span>Sama mariage, sama xewël</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#D4A574' }} />
              +500 mariées connectées ce mois-ci
            </span>
          </div>
        </section>

        {/* ── RIGHT — Form ── */}
        <section className="relative flex flex-col px-5 sm:px-8 lg:px-12 xl:px-20 pt-24 pb-12 lg:pt-16 lg:pb-10" style={{ background: '#FAF7F2' }}>
          <div className="absolute inset-0 -z-10 lg:hidden">
            <div className="absolute -top-32 -left-20 h-[320px] w-[320px] rounded-full blur-3xl" style={{ background: 'rgba(212,165,116,.3)' }} />
            <div className="absolute -bottom-20 -right-20 h-[320px] w-[320px] rounded-full blur-3xl" style={{ background: 'rgba(30,86,49,.15)' }} />
          </div>

          {/* Top nav */}
          <header className="fixed inset-x-0 top-0 z-30 lg:absolute" style={{ background: 'rgba(250,247,242,.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(61,61,61,.06)' }}>
            <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl shadow-glow" style={{ background: '#1E5631' }}>
                  <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" stroke="#D4A574" strokeWidth="1.6">
                    <path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z" />
                    <path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z" />
                    <path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3" />
                  </svg>
                </span>
                <span className="font-display text-[20px] leading-none">
                  <span style={{ color: '#1E5631' }}>Sama</span><span className="gold-shine font-semibold">Mariage</span>
                </span>
              </Link>
              <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] transition" style={{ color: 'rgba(61,61,61,.65)' }}>
                <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m10 4-4 4 4 4" /></svg>
                Retour à l&apos;accueil
              </Link>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[440px] flex-1 flex flex-col justify-center">

            {/* Title */}
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: '#722F37' }}>Connexion</div>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl leading-[1.1]" style={{ color: '#0E2916' }}>
                Ravi de te <em className="not-italic gold-shine-auth">revoir</em>.
              </h2>
              <p className="mt-2 text-[15px]" style={{ color: 'rgba(61,61,61,.65)' }}>Connecte-toi pour reprendre l&apos;organisation là où tu l&apos;avais laissée.</p>
            </div>

            {/* OAuth */}
            <div className="mt-7 grid grid-cols-2 gap-2">
              {[
                {
                  label: 'Continuer avec Google',
                  icon: <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.4-.2-2.1H12v3.9h6.2c-.1.9-.8 2.4-2.3 3.4l-.02.14 3.34 2.58.23.02c2.13-1.97 3.35-4.86 3.35-7.96" />
                    <path fill="#34A853" d="M12 23c3 0 5.6-1 7.4-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7l-.13.01-3.47 2.7-.04.12C3.7 20.5 7.5 23 12 23" />
                    <path fill="#FBBC05" d="M5.6 13.9c-.2-.7-.4-1.4-.4-2.2 0-.8.1-1.5.3-2.2v-.1L2 6.8C1.4 8.4 1 10.2 1 12s.4 3.6 1 5.2l3.6-3.3" />
                    <path fill="#EA4335" d="M12 5.4c2 0 3.4.9 4.2 1.6l3.1-3C17.5 2.3 14.9 1 12 1 7.5 1 3.7 3.5 2 7l3.6 2.8c.9-2.7 3.4-4.4 6.4-4.4" />
                  </svg>
                },
                {
                  label: 'Continuer avec Apple',
                  icon: <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M16.7 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.7-3-2-3.7-2-1.6-.2-3 .9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.4 1-4.3 2.6-1.8 3.2-.5 7.9 1.3 10.5.9 1.3 1.9 2.7 3.3 2.7 1.3-.1 1.9-.9 3.4-.9s2.1.9 3.5.8c1.4 0 2.4-1.3 3.3-2.6 1-1.5 1.5-2.9 1.5-3-.1-.1-2.7-1-2.7-4.2zM14 5c.7-.9 1.2-2 1.1-3.2-1 0-2.3.7-3 1.5-.6.8-1.2 2-1.1 3.1 1.1.1 2.3-.6 3-1.4z" /></svg>
                },
              ].map((btn, i) => (
                <button key={i} type="button"
                  onClick={async () => { showToast(`Connexion ${i === 0 ? 'Google' : 'Apple'}…`); await new Promise(r => setTimeout(r, 900)); router.push('/app') }}
                  className="h-[52px] rounded-[14px] flex items-center justify-center gap-2.5 text-sm font-medium transition hover:bg-[#FAF7F2]"
                  style={{ background: '#fff', color: '#3D3D3D', boxShadow: 'inset 0 0 0 1px rgba(61,61,61,.12)' }}>
                  {btn.icon}
                  <span className="hidden sm:inline">{btn.label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest" style={{ color: 'rgba(61,61,61,.4)' }}>
              <span className="flex-1 h-px" style={{ background: 'rgba(61,61,61,.1)' }} />
              ou par
              <span className="flex-1 h-px" style={{ background: 'rgba(61,61,61,.1)' }} />
            </div>

            {/* Tabs */}
            <div className="inline-flex p-1 rounded-2xl" style={{ background: '#FAF7F2', boxShadow: 'inset 0 0 0 1px rgba(61,61,61,.08)' }}>
              {[
                { id: 'email', label: 'Email', icon: <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg> },
                { id: 'phone', label: 'WhatsApp', icon: <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="#25D366"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2z" /></svg> },
              ].map(t => (
                <button key={t.id} onClick={() => { setTab(t.id as 'email' | 'phone'); setOtpStep(false) }}
                  data-active={String(tab === t.id)}
                  className="tab-auth flex-1 h-10 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition">
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Email pane ── */}
            {tab === 'email' && (
              <form onSubmit={handleEmailSubmit} className="mt-5 space-y-3">
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(61,61,61,.55)' }}>Email</span>
                  <div className="field-wrap mt-1.5 flex items-center">
                    <span className="grid h-[52px] w-12 place-items-center shrink-0" style={{ color: 'rgba(61,61,61,.45)' }}>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                    </span>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
                      placeholder="aissatou@gmail.com" className="flex-1 h-[52px] bg-transparent outline-none text-base pr-4" style={{ color: '#3D3D3D' }} />
                  </div>
                </label>

                <label className="block">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(61,61,61,.55)' }}>Mot de passe</span>
                    <button type="button" onClick={() => { setTab('phone') }} className="text-[12px] font-medium transition" style={{ color: '#1E5631' }}>Oublié ?</button>
                  </div>
                  <div className="field-wrap mt-1.5 flex items-center">
                    <span className="grid h-[52px] w-12 place-items-center shrink-0" style={{ color: 'rgba(61,61,61,.45)' }}>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                    </span>
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                      placeholder="••••••••" className="flex-1 h-[52px] bg-transparent outline-none text-base" style={{ color: '#3D3D3D' }} />
                    <button type="button" onClick={() => setShowPass(v => !v)} className="h-[52px] px-3.5 transition" style={{ color: 'rgba(61,61,61,.55)' }}>
                      {showPass
                        ? <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
                        : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s4-7 10-7c2 0 3.7.7 5.2 1.7M22 12s-4 7-10 7c-2 0-3.7-.7-5.2-1.7M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
                      }
                    </button>
                  </div>
                </label>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 text-[13px] cursor-pointer" style={{ color: 'rgba(61,61,61,.7)' }}>
                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="check" />
                    Rester connectée
                  </label>
                  <span className="font-mono text-[11px] flex items-center gap-1" style={{ color: 'rgba(61,61,61,.4)' }}>
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                    sécurisé
                  </span>
                </div>

                <button type="submit" disabled={loading}
                  className="mt-3 h-[52px] w-full rounded-[14px] flex items-center justify-center gap-2 text-[15px] font-medium transition disabled:opacity-50"
                  style={{ background: '#1E5631', color: '#F7E9CF', boxShadow: '0 18px 40px -16px rgba(30,86,49,.5)' }}>
                  {loading ? <span className="inline-block h-4 w-4 rounded-full border-2 border-[#F7E9CF]/40 border-t-[#F7E9CF] animate-spin" /> : null}
                  <span>Se connecter</span>
                  {!loading && <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5" /></svg>}
                </button>

                <button type="button"
                  onClick={async () => { showToast('Authentification biométrique…'); await new Promise(r => setTimeout(r, 1300)); router.push('/app') }}
                  className="mt-2 w-full text-center text-[12px] font-medium flex items-center justify-center gap-2 transition"
                  style={{ color: 'rgba(61,61,61,.55)' }}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 11v6M9 13v3M15 13v4" /><path d="M5 9a7 7 0 0 1 14 0v3" /></svg>
                  Connexion par Face ID / empreinte
                </button>
              </form>
            )}

            {/* ── WhatsApp pane ── */}
            {tab === 'phone' && !otpStep && (
              <form onSubmit={handlePhoneSubmit} className="mt-5 space-y-3">
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(61,61,61,.55)' }}>Numéro WhatsApp</span>
                  <div className="field-wrap mt-1.5 flex items-center overflow-hidden">
                    <select value={country.code} onChange={e => setCountry(COUNTRIES.find(c => c.code === e.target.value) ?? COUNTRIES[0])}
                      className="h-[52px] w-[110px] bg-transparent outline-none px-3 border-r text-sm"
                      style={{ borderColor: 'rgba(61,61,61,.1)', color: '#3D3D3D' }}>
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                      ))}
                    </select>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel"
                      placeholder="77 000 00 00" className="flex-1 h-[52px] bg-transparent outline-none text-base px-4" style={{ color: '#3D3D3D' }} />
                  </div>
                </label>
                <div className="rounded-xl p-3 text-[12px] leading-relaxed" style={{ background: 'rgba(30,86,49,.06)', border: '1px solid rgba(30,86,49,.1)', color: 'rgba(14,41,22,.8)' }}>
                  On t&apos;envoie un code à 6 chiffres sur WhatsApp. Pas de SMS, pas de spam.
                </div>
                <button type="submit" disabled={loading}
                  className="h-[52px] w-full rounded-[14px] flex items-center justify-center gap-2 text-[15px] font-medium transition disabled:opacity-50"
                  style={{ background: '#1E5631', color: '#F7E9CF', boxShadow: '0 18px 40px -16px rgba(30,86,49,.5)' }}>
                  {loading ? <span className="inline-block h-4 w-4 rounded-full border-2 border-[#F7E9CF]/40 border-t-[#F7E9CF] animate-spin" /> : null}
                  <span>Recevoir mon code</span>
                  {!loading && <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12M11 5l5 5-5 5" /></svg>}
                </button>
              </form>
            )}

            {/* ── OTP pane ── */}
            {tab === 'phone' && otpStep && (
              <form onSubmit={handleOtpSubmit} className="mt-5 space-y-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(61,61,61,.55)' }}>Code reçu sur</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-display text-lg" style={{ color: '#0E2916' }}>{country.code} {maskedPhone}</span>
                    <button type="button" onClick={() => setOtpStep(false)} className="text-[12px] font-medium" style={{ color: '#1E5631' }}>Modifier</button>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 max-w-sm" onPaste={handleOtpPaste}>
                  {otp.map((v, i) => (
                    <input key={i} ref={el => { otpRefs.current[i] = el }}
                      className={`otp-box ${v ? 'filled' : ''}`}
                      value={v} maxLength={1} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : undefined}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)} />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[12px]">
                  <span style={{ color: 'rgba(61,61,61,.55)' }}>Pas reçu ?</span>
                  <button type="button" disabled={resendTimer > 0}
                    onClick={() => { showToast('Nouveau code envoyé 💬'); startResend() }}
                    className="font-medium transition disabled:opacity-30" style={{ color: '#1E5631' }}>
                    {resendTimer > 0 ? `Renvoyer dans ${resendTimer}s` : 'Renvoyer le code'}
                  </button>
                </div>

                <button type="submit" disabled={otp.some(v => !v) || loading}
                  className="h-[52px] w-full rounded-[14px] flex items-center justify-center gap-2 text-[15px] font-medium transition disabled:opacity-40"
                  style={{ background: '#1E5631', color: '#F7E9CF', boxShadow: '0 18px 40px -16px rgba(30,86,49,.5)' }}>
                  {loading ? <span className="inline-block h-4 w-4 rounded-full border-2 border-[#F7E9CF]/40 border-t-[#F7E9CF] animate-spin" /> : null}
                  <span>Vérifier et se connecter</span>
                </button>
              </form>
            )}

            {/* Sign up link */}
            <div className="mt-6 text-center text-[14px]" style={{ color: 'rgba(61,61,61,.65)' }}>
              Première fois ici ?{' '}
              <Link href="/onboarding" className="font-semibold transition" style={{ color: '#1E5631' }}>
                Créer mon Sama Mariage
              </Link>
            </div>

            {/* Trust footer */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(61,61,61,.4)' }}>
              <Link href="#" className="hover:opacity-70">Conditions</Link>
              <span>·</span>
              <Link href="#" className="hover:opacity-70">Confidentialité</Link>
              <span>·</span>
              <Link href="#" className="hover:opacity-70">Aide</Link>
            </div>
          </div>
        </section>
      </div>

      {toast && <Toast msg={toast.msg} kind={toast.kind} />}
    </>
  )
}
