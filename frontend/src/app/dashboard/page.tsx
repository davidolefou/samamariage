'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/contexts/AuthContext';

export const dynamic = 'force-static';

/**
 * Dashboard — stub provisoire.
 * Confirme que le flux login marche bout-en-bout (session + /me).
 * À remplacer par le vrai dashboard (design dashboard.html) plus tard.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { logout, loggingOut } = useAuth();
  const user = useUser('/login');

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-bone">
        <div className="flex flex-col items-center gap-3 text-ink/60">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
          <span className="font-mono text-xs uppercase tracking-widest">Chargement…</span>
        </div>
      </main>
    );
  }

  async function onLogout() {
    await logout();
    router.push('/');
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-bone">
      <div className="wax-bg absolute inset-0 opacity-50" />
      <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-gold-200/40 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-[420px] w-[420px] rounded-full bg-royal-100/60 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-16 sm:px-8">
        <div className="fade-up">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-royal-700 shadow-glow">
            <svg viewBox="0 0 32 32" className="h-6 w-6 text-gold-400" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z" />
              <path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z" />
              <path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3" />
            </svg>
          </span>
        </div>

        <div className="fade-up d1 mt-7 font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">
          Espace privé
        </div>
        <h1 className="fade-up d1 mt-2 font-display text-4xl text-royal-900 sm:text-5xl">
          Bienvenue, <em className="not-italic gold-shine">mariée</em>.
        </h1>
        <p className="fade-up d2 mt-3 max-w-md text-[15px] text-ink/70">
          Tu es bien connectée — la session fonctionne. Le vrai tableau de bord (budget, planning,
          ndawtal…) arrive bientôt. Pour l&apos;instant, c&apos;est la preuve que le parcours
          marche de bout en bout.
        </p>

        <div className="fade-up d3 mt-8 rounded-3xl bg-white p-6 shadow-card ring-1 ring-ink/5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
            Compte connecté
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-bordeaux text-lg text-white">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-royal-900">{user.email}</div>
              <div className="font-mono text-[11px] text-ink/50">
                {user.emailVerifiedAt ? '✓ Email vérifié' : 'Email non vérifié'}
              </div>
            </div>
          </div>
        </div>

        <div className="fade-up d4 mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={onLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-full bg-royal-700 px-6 py-3.5 text-sm font-medium text-gold-100 shadow-glow transition hover:bg-royal-800 disabled:opacity-60"
          >
            {loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-royal-700/15 bg-white/70 px-6 py-3.5 text-sm font-medium text-royal-900 backdrop-blur transition hover:bg-white"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
