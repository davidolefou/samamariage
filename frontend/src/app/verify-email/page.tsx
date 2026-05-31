'use client';

import { Suspense, useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export const dynamic = 'force-static';

const PENDING = 'sama:wedding-pending';
const PENDING_VENDOR = 'sama:vendor-pending';

const ERROR_FR: Record<string, string> = {
  VERIFICATION_CODE_INVALID: 'Code invalide. Vérifie et réessaie.',
  VERIFICATION_CODE_EXPIRED: 'Ce code a expiré. Demande un nouveau code.',
  TOO_MANY_VERIFY_ATTEMPTS: 'Trop de tentatives. Réessaie dans quelques minutes.',
  VALIDATION_FAILED: 'Le code doit faire 8 caractères.',
};

// Crockford base32 (sans I, L, O, U) — format des codes de vérification.
const CODE_RE = /[^0-9ABCDEFGHJKMNPQRSTVWXYZ]/g;

async function flushPendingWedding(): Promise<void> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(PENDING);
  } catch {
    return;
  }
  if (!raw) return;
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    localStorage.removeItem(PENDING);
    return;
  }
  try {
    await api('/api/wedding', { method: 'PUT', body: payload });
    localStorage.removeItem(PENDING);
  } catch {
    // On garde le payload pour réessayer plus tard ; non bloquant.
  }
}

// Idem pour un profil prestataire mis de côté par l'onboarding pro.
async function flushPendingVendor(): Promise<void> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(PENDING_VENDOR);
  } catch {
    return;
  }
  if (!raw) return;
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    localStorage.removeItem(PENDING_VENDOR);
    return;
  }
  try {
    await api('/api/vendor', { method: 'PUT', body: payload });
    localStorage.removeItem(PENDING_VENDOR);
  } catch {
    // Non bloquant ; on réessaiera (le profil reste en attente).
  }
}

// Redirection post-vérif : seulement un chemin interne (anti open-redirect).
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/dashboard';
}

function VerifyEmailBody() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const { toast } = useToast();

  const initialEmail = params.get('email') ?? '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (code.length !== 8) return setError('Le code doit faire 8 caractères.');
    if (!email.trim()) return setError('Email requis.');
    setSubmitting(true);
    try {
      await api('/api/auth/verify-email', {
        method: 'POST',
        body: { email: email.trim(), code },
      });
      setDone(true);
      await flushPendingWedding();
      await flushPendingVendor();
      await refresh();
      toast('Compte vérifié — bienvenue ! 🎉', 'success');
      setTimeout(() => router.push(safeNext(params.get('next'))), 1400);
    } catch (err) {
      const c = err instanceof ApiError ? err.code : '';
      setError(ERROR_FR[c] ?? 'Vérification impossible. Réessaie.');
      setSubmitting(false);
    }
  }

  async function onResend() {
    if (cooldown > 0 || !email.trim()) return;
    setResending(true);
    try {
      await api('/api/auth/resend-verification', { method: 'POST', body: { email: email.trim() } });
      toast('Nouveau code envoyé par email 📧', 'success');
      setCooldown(30);
    } catch {
      toast('Impossible d’envoyer le code pour l’instant', 'error');
    } finally {
      setResending(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="fade-up grid h-20 w-20 place-items-center rounded-3xl bg-royal-700 shadow-glow ring-2 ring-gold-400/30">
          <svg viewBox="0 0 32 32" className="h-10 w-10 text-gold-400" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z" />
            <path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z" />
            <path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3" />
          </svg>
        </div>
        <h2 className="fade-up d1 mt-8 font-display text-3xl text-royal-900 sm:text-4xl">
          Sama IA prépare ton mariage
        </h2>
        <div className="mt-5 flex items-center gap-2">
          <span className="l-dot h-3 w-3 rounded-full bg-gold-400" />
          <span className="l-dot d2 h-3 w-3 rounded-full bg-gold-400" />
          <span className="l-dot d3 h-3 w-3 rounded-full bg-gold-400" />
        </div>
        <p className="fade-up d2 mt-6 text-[15px] text-ink/70">Redirection vers ton tableau de bord…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-royal-700 shadow-glow">
            <svg viewBox="0 0 32 32" className="h-5 w-5 text-gold-400" fill="none" stroke="currentColor" strokeWidth="1.6">
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
      </header>

      <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center px-5 pb-12 sm:px-8">
        <div className="fade-up">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Vérification</div>
          <h2 className="mt-2 font-display text-3xl leading-[1.1] text-royal-900 sm:text-4xl">
            Confirme ton <em className="not-italic gold-shine">email</em>.
          </h2>
          <p className="mt-2 text-[15px] text-ink/65">
            On a envoyé un code à 8 caractères à{' '}
            <strong className="text-royal-900">{email || 'ton adresse'}</strong>. Saisis-le ci-dessous.
          </p>
        </div>

        <form onSubmit={onSubmit} className="fade-up d1 mt-7 space-y-3" noValidate>
          {!initialEmail && (
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
          )}
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/55">Code de vérification</span>
            <input
              type="text"
              inputMode="text"
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(CODE_RE, '').slice(0, 8))}
              placeholder="XXXXXXXX"
              className="mt-1.5 h-16 w-full rounded-2xl bg-paper text-center font-mono text-3xl tracking-[0.4em] text-royal-900 outline-none ring-1 ring-ink/10 transition placeholder:tracking-[0.3em] placeholder:text-ink/25 focus:ring-2 focus:ring-royal-700"
            />
          </label>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl bg-bordeaux/8 px-3.5 py-3 text-[13px] text-bordeaux ring-1 ring-bordeaux/15">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || code.length !== 8}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-royal-700 text-[15px] font-medium text-gold-50 shadow-cta ring-1 ring-gold-400/40 transition hover:bg-royal-800 active:scale-[.99] disabled:cursor-not-allowed disabled:bg-royal-700/25 disabled:text-gold-50/60 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold-50/40 border-t-gold-50" />
                Vérification…
              </>
            ) : (
              <>
                Vérifier mon compte
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 10h12M11 5l5 5-5 5" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="fade-up d2 mt-6 flex items-center justify-between text-[13px]">
          <span className="text-ink/55">Pas reçu de code ?</span>
          <button
            type="button"
            onClick={onResend}
            disabled={cooldown > 0 || resending}
            className="font-medium text-royal-700 transition hover:text-royal-900 disabled:cursor-not-allowed disabled:text-ink/30"
          >
            {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : resending ? 'Envoi…' : 'Renvoyer le code'}
          </button>
        </div>

        <div className="fade-up d3 mt-8 text-center text-[13px] text-ink/60">
          <Link href="/login" className="font-semibold text-royal-700 hover:text-royal-900">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailBody />
    </Suspense>
  );
}
