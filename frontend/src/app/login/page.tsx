'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export const dynamic = 'force-static';

// Messages d'erreur stables → texte FR (on switch sur ApiError.code, pas le message).
const ERROR_FR: Record<string, string> = {
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
  EMAIL_NOT_VERIFIED: "Ton email n'est pas encore vérifié. Vérifie ta boîte mail.",
  ACCOUNT_SUSPENDED: 'Ce compte a été suspendu. Contacte le support.',
  LOCKED_OUT: 'Trop de tentatives — compte temporairement bloqué. Réessaie plus tard.',
  TOO_MANY_LOGIN_ATTEMPTS: 'Trop de tentatives de connexion. Réessaie dans quelques minutes.',
  VALIDATION_FAILED: 'Email et mot de passe requis.',
};

type Tab = 'email' | 'whatsapp';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Email et mot de passe requis.');
      return;
    }
    setSubmitting(true);
    try {
      await api('/api/auth/login', {
        method: 'POST',
        body: { email: email.trim(), password },
      });
      await refresh();
      toast('Bon retour, mariée ! 💚', 'success');
      router.push('/dashboard');
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      setError(ERROR_FR[code] ?? 'Connexion impossible. Réessaie dans un instant.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Header (logo + retour) */}
      <header className="fixed inset-x-0 top-0 z-30 border-b border-ink/5 bg-bone/70 backdrop-blur-md lg:border-0 lg:bg-transparent lg:backdrop-blur-0">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-royal-700 shadow-glow">
              <svg
                viewBox="0 0 32 32"
                className="h-5 w-5 text-gold-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z" />
                <path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z" />
                <path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3" />
              </svg>
            </span>
            <span className="font-display text-[20px] leading-none">
              <span className="text-royal-700">Sama</span>
              <span className="gold-shine font-semibold">Mariage</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-ink/65 transition hover:text-royal-800"
          >
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m10 4-4 4 4 4" />
            </svg>
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      {/* ── GAUCHE — éditorial / héro ── */}
      <section className="relative isolate hidden flex-col overflow-hidden p-10 text-gold-50 lg:flex xl:p-14">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-royal-800 via-royal-900 to-bordeaux" />
        <div className="wax-bg-bordeaux absolute inset-0 -z-10 opacity-35" />
        <div className="absolute -right-32 -top-32 -z-10 h-[420px] w-[420px] rounded-full bg-gold-400/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 -z-10 h-[420px] w-[420px] rounded-full bg-bordeaux/40 blur-3xl" />

        <div className="fade-up font-mono text-[11px] uppercase tracking-[0.25em] text-gold-400/85">
          Sama Mariage · espace privé
        </div>

        <div className="mt-auto flex items-end justify-between gap-10 pt-12">
          <div className="max-w-md">
            <h1 className="fade-up d1 text-balance font-display text-5xl leading-[1.04] xl:text-6xl">
              Bon retour, <em className="not-italic gold-shine">mariée</em>.
            </h1>
            <p className="fade-up d2 mt-5 leading-relaxed text-gold-100/85">
              Ton tableau de bord t&apos;attend. Budget, planning, ndawtal, prestataires — tout est
              synchronisé depuis ta dernière visite.
            </p>

            <ul className="fade-up d3 mt-9 space-y-3 text-[14px] text-gold-100/85">
              <li className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold-400 text-base text-bordeaux-900">
                  🔒
                </span>
                Chiffrement bout-en-bout. Tes données restent chez toi.
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold-400 text-base text-bordeaux-900">
                  ✨
                </span>
                Sama IA reprend l&apos;analyse là où tu l&apos;as laissée.
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold-400 text-base text-bordeaux-900">
                  💍
                </span>
                Sama xewël — ton mariage, ta joie, ton rythme.
              </li>
            </ul>
          </div>

          <div className="hidden w-64 shrink-0 xl:block">
            <div className="arch hero-photo breath relative aspect-[3/4] shadow-glow ring-1 ring-gold-400/30">
              <div className="absolute left-3.5 top-3 font-mono text-[9px] uppercase tracking-[0.2em] text-gold-100/50">
                Portrait · mariée sénégalaise
              </div>
              <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-1.5 opacity-90">
                <div className="h-1 rounded-full bg-gold-400/70" />
                <div className="h-1 rounded-full bg-gold-200/60" />
                <div className="h-1 rounded-full bg-gold-400/40" />
              </div>
            </div>
          </div>
        </div>

        <div className="fade-up d5 mt-10 flex items-center justify-between gap-4 border-t border-gold-400/10 pt-8 font-mono text-[11px] uppercase tracking-widest text-gold-100/55">
          <span>Sama mariage, sama xewël</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-400" />
            +500 mariées connectées ce mois-ci
          </span>
        </div>
      </section>

      {/* ── DROITE — formulaire ── */}
      <section className="relative flex flex-col px-5 pb-12 pt-24 sm:px-8 lg:px-12 lg:pb-10 lg:pt-16 xl:px-20">
        <div className="absolute inset-0 -z-10 lg:hidden">
          <div className="absolute inset-0 bg-bone" />
          <div className="absolute -left-20 -top-32 h-[320px] w-[320px] rounded-full bg-gold-200/40 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-[320px] w-[320px] rounded-full bg-royal-100/60 blur-3xl" />
        </div>

        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center">
          {/* Titre */}
          <div className="fade-up">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">
              Connexion
            </div>
            <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">
              Ravi de te <em className="not-italic gold-shine">revoir</em>.
            </h2>
            <p className="mt-2 text-[15px] text-ink/65">
              Connecte-toi pour reprendre l&apos;organisation là où tu l&apos;avais laissée.
            </p>
          </div>

          {/* Google (réel) */}
          <div className="fade-up d1 mt-7">
            <a
              href="/api/auth/oauth/google/start"
              className="inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-white text-[15px] font-medium text-ink shadow-[inset_0_0_0_1px_rgba(61,61,61,.12)] transition hover:bg-bone"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23 12.3c0-.8-.1-1.4-.2-2.1H12v3.9h6.2c-.1.9-.8 2.4-2.3 3.4l-.02.14 3.34 2.58.23.02c2.13-1.97 3.35-4.86 3.35-7.96"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3 0 5.6-1 7.4-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7l-.13.01-3.47 2.7-.04.12C3.7 20.5 7.5 23 12 23"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 13.9c-.2-.7-.4-1.4-.4-2.2 0-.8.1-1.5.3-2.2v-.1L2 6.8C1.4 8.4 1 10.2 1 12s.4 3.6 1 5.2l3.6-3.3"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.4c2 0 3.4.9 4.2 1.6l3.1-3C17.5 2.3 14.9 1 12 1 7.5 1 3.7 3.5 2 7l3.6 2.8c.9-2.7 3.4-4.4 6.4-4.4"
                />
              </svg>
              Continuer avec Google
            </a>
          </div>

          {/* Séparateur */}
          <div className="fade-up d2 my-5 flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-ink/40">
            <span className="h-px flex-1 bg-ink/10" />
            ou par
            <span className="h-px flex-1 bg-ink/10" />
          </div>

          {/* Onglets */}
          <div className="fade-up d2 inline-flex self-stretch rounded-2xl bg-bone p-1 ring-1 ring-ink/10">
            <button
              type="button"
              onClick={() => setTab('email')}
              aria-pressed={tab === 'email'}
              className={
                'flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition ' +
                (tab === 'email'
                  ? 'bg-royal-700 text-gold-100'
                  : 'text-ink/70 hover:bg-royal-700/5 hover:text-royal-800')
              }
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              Email
            </button>
            <button
              type="button"
              onClick={() => toast('La connexion WhatsApp arrive bientôt 💬', 'info')}
              aria-pressed={false}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-medium text-ink/40"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#25D366]" fill="currentColor">
                <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2z" />
              </svg>
              WhatsApp
              <span className="ml-1 rounded-full bg-gold-400/20 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-gold-600">
                Bientôt
              </span>
            </button>
          </div>

          {/* Formulaire email */}
          <form onSubmit={onSubmit} className="fade-up d3 mt-5 space-y-3" noValidate>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink/55">Email</span>
              <div className="mt-1.5 flex items-center rounded-2xl bg-white shadow-[inset_0_0_0_1px_rgba(61,61,61,.10)] transition focus-within:shadow-[inset_0_0_0_2px_rgb(30_86_49)]">
                <span className="grid h-[52px] w-12 shrink-0 place-items-center text-ink/45">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="aissatou@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-[52px] w-full bg-transparent pr-4 text-base text-ink outline-none placeholder:text-ink/35"
                />
              </div>
            </label>

            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink/55">
                  Mot de passe
                </span>
              </div>
              <div className="mt-1.5 flex items-center rounded-2xl bg-white shadow-[inset_0_0_0_1px_rgba(61,61,61,.10)] transition focus-within:shadow-[inset_0_0_0_2px_rgb(30_86_49)]">
                <span className="grid h-[52px] w-12 shrink-0 place-items-center text-ink/45">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="5" y="10" width="14" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-[52px] w-full bg-transparent text-base text-ink outline-none placeholder:text-ink/35"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="grid h-[52px] place-items-center px-3.5 text-ink/55 transition hover:text-royal-700"
                >
                  {showPass ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M2 12s4-7 10-7c2 0 3.7.7 5.2 1.7M22 12s-4 7-10 7c-2 0-3.7-.7-5.2-1.7M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between pt-1">
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink/70">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-[18px] w-[18px] rounded accent-royal-700"
                />
                Rester connectée
              </label>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-ink/40">
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                sécurisé
              </span>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-bordeaux/8 px-3.5 py-3 text-[13px] text-bordeaux ring-1 ring-bordeaux/15"
              >
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-royal-700 text-[15px] font-medium text-gold-100 shadow-[0_18px_40px_-16px_rgba(30,86,49,.5)] transition hover:bg-royal-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-royal-700/25 disabled:text-gold-100/60 disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold-100/40 border-t-gold-100" />
                  Connexion…
                </>
              ) : (
                <>
                  Se connecter
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 10h12M11 5l5 5-5 5" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Lien inscription */}
          <div className="fade-up d4 mt-6 text-center text-[14px] text-ink/65">
            Première fois ici ?{' '}
            <Link href="/onboarding" className="font-semibold text-royal-700 hover:text-royal-900">
              Créer mon Sama Mariage
            </Link>
          </div>

          {/* Aiguillage espace prestataire */}
          <div className="fade-up d4 mt-3 text-center text-[13px] text-ink/55">
            Vous êtes prestataire ?{' '}
            <Link href="/pro/login" className="font-semibold text-bordeaux hover:text-bordeaux-900">
              Espace pro
            </Link>
          </div>

          {/* Footer confiance */}
          <div className="fade-up d5 mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-widest text-ink/40">
            <span>Conditions</span>
            <span>·</span>
            <span>Confidentialité</span>
            <span>·</span>
            <span>Aide</span>
          </div>
        </div>
      </section>
    </main>
  );
}
