'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import {
  STEP_COMPONENTS,
  INITIAL_DATA,
  type WeddingData,
  type Dir,
} from '@/components/onboarding/steps';

export const dynamic = 'force-static';

const STORAGE = 'sama:onboarding:v3';
const PENDING = 'sama:wedding-pending';

const LAST_STEP = STEP_COMPONENTS.length; // 12
const ACCOUNT_STEP = LAST_STEP + 1; // 13

// ── Welcome ──
function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="fade-up flex items-center gap-2.5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-royal-700 shadow-glow">
            <svg viewBox="0 0 32 32" className="h-6 w-6 text-gold-400" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z" />
              <path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z" />
              <path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3" />
            </svg>
          </span>
          <span className="font-display text-[26px] leading-none">
            <span className="text-royal-700">Sama</span>
            <span className="gold-shine font-semibold">Mariage</span>
          </span>
        </div>

        <div className="relative mt-12 sm:mt-16">
          <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-br from-gold-200/60 to-bordeaux/20 blur-2xl" />
          <div className="ring-breath relative select-none font-display text-[88px] leading-none sm:text-[120px]">💍</div>
        </div>

        <h1 className="fade-up d1 mt-8 text-balance font-display text-4xl leading-[1.05] text-royal-900 sm:text-5xl">
          Félicitations
          <br />
          pour ton <em className="not-italic gold-shine">mariage</em>.
        </h1>
        <p className="fade-up d2 mt-4 max-w-sm text-[15px] leading-relaxed text-ink/70 sm:text-base">
          Construisons ensemble le plus beau jour de ta vie.{' '}
          <span className="text-bordeaux">Pas à pas, sans stress.</span>
        </p>

        <button
          onClick={onStart}
          className="fade-up d3 mt-10 flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 text-[15px] font-medium text-bordeaux-900 shadow-cta ring-1 ring-gold-200/60 transition hover:from-gold-400 hover:to-gold-400 active:scale-[.99]"
        >
          Commencer
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 10h12M11 5l5 5-5 5" />
          </svg>
        </button>

        <div className="fade-up d4 mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink/55">
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 4.5V8l2.5 1.5" />
          </svg>
          6 min · 12 micro-étapes · sauvegarde auto
        </div>

        <div className="fade-up d5 mt-8 text-[13px] text-ink/60">
          Déjà un compte ?{' '}
          <Link href="/login" className="font-semibold text-royal-700 hover:text-royal-900">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Étape compte (email + mot de passe → signup) ──
function AccountStep({
  data,
  onBack,
  onCreated,
}: {
  data: WeddingData;
  onBack: () => void;
  onCreated: (email: string) => void;
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError('Ton email est requis.');
    if (password.length < 10) return setError('Mot de passe : 10 caractères minimum.');
    setSubmitting(true);
    try {
      await api('/api/auth/signup', {
        method: 'POST',
        body: { email: email.trim(), password },
      });
      const payload = { ...data, completedOnboarding: true };
      localStorage.setItem(PENDING, JSON.stringify(payload));
      localStorage.removeItem(STORAGE);
      onCreated(email.trim());
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      const map: Record<string, string> = {
        PASSWORD_TOO_SHORT: 'Mot de passe : 10 caractères minimum.',
        PASSWORD_BANNED: 'Ce mot de passe est trop courant. Choisis-en un autre.',
        PASSWORD_PWNED: 'Ce mot de passe a fuité dans une brèche connue. Choisis-en un autre.',
        TOO_MANY_SIGNUP_ATTEMPTS: 'Trop de tentatives. Réessaie dans une heure.',
        VALIDATION_FAILED: 'Vérifie ton email et ton mot de passe.',
      };
      setError(map[code] ?? 'Création impossible. Réessaie dans un instant.');
      if (!map[code]) toast('Une erreur est survenue', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const firstName = data.fullName.trim().split(/\s+/)[0] ?? '';

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
            <div className="h-full w-full rounded-full bg-gradient-to-r from-royal-700 via-gold-400 to-royal-700" />
          </div>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-royal-800/85">✓</div>
      </div>

      <div className="slide-fwd mx-auto w-full max-w-[520px] flex-1 px-5 pb-32 pt-8 sm:px-8 sm:pt-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Dernière étape · Ton compte</div>
        <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">
          Sécurise ton <em className="not-italic gold-shine">Sama Mariage</em>.
        </h2>
        <p className="mt-2 text-[15px] text-ink/70">
          {firstName ? `${firstName}, ` : ''}crée ton compte pour sauvegarder tout ça. On t&apos;envoie un code de
          vérification par email.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-3" noValidate>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/55">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="aissatou@gmail.com"
              className="mt-1.5 h-14 w-full rounded-2xl bg-paper px-4 text-lg outline-none ring-1 ring-ink/10 transition placeholder:text-ink/30 focus:ring-2 focus:ring-royal-700"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/55">Mot de passe</span>
            <div className="mt-1.5 flex items-center rounded-2xl bg-paper ring-1 ring-ink/10 transition focus-within:ring-2 focus-within:ring-royal-700">
              <input
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="10 caractères minimum"
                className="h-14 w-full bg-transparent px-4 text-lg outline-none placeholder:text-ink/30"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? 'Masquer' : 'Afficher'}
                className="grid h-14 place-items-center px-4 text-ink/55 transition hover:text-royal-700"
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

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl bg-bordeaux/8 px-3.5 py-3 text-[13px] text-bordeaux ring-1 ring-bordeaux/15">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-2xl bg-royal-50/60 p-4 text-[12px] leading-relaxed text-royal-900/80 ring-1 ring-royal-700/10">
            🔒 Chiffrement bout-en-bout. En créant ton compte, tu acceptes les conditions de SamaMariage.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-royal-700 text-[15px] font-medium text-gold-50 shadow-cta ring-1 ring-gold-400/40 transition hover:bg-royal-800 active:scale-[.99] disabled:cursor-not-allowed disabled:bg-royal-700/25 disabled:text-gold-50/60 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold-50/40 border-t-gold-50" />
                Création…
              </>
            ) : (
              <>
                Créer mon compte
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 10h12M11 5l5 5-5 5" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<Dir>('fwd');
  const [data, setData] = useState<WeddingData>(INITIAL_DATA);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE);
      if (saved) setData({ ...INITIAL_DATA, ...(JSON.parse(saved) as Partial<WeddingData>) });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(data));
  }, [data]);

  const setPatch = (patch: Partial<WeddingData>) => setData((s) => ({ ...s, ...patch }));
  const goto = (s: number, d: Dir = 'fwd') => {
    setDir(d);
    setStep(s);
  };
  const next = () => goto(Math.min(step + 1, ACCOUNT_STEP), 'fwd');
  const back = () => goto(Math.max(step - 1, 0), 'bwd');

  if (step === 0) return <Welcome onStart={() => goto(1, 'fwd')} />;
  if (step === ACCOUNT_STEP)
    return (
      <AccountStep
        data={data}
        onBack={back}
        onCreated={(email) => router.push(`/verify-email?email=${encodeURIComponent(email)}`)}
      />
    );

  const StepComp = STEP_COMPONENTS[step - 1];
  if (!StepComp) return <Welcome onStart={() => goto(1, 'fwd')} />;
  return <StepComp data={data} set={setPatch} onNext={next} onBack={back} dir={dir} />;
}
