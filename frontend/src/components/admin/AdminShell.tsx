'use client';

// SamaMariage — AdminShell : châssis de la console admin (port de admin-shell.js).
// Sidebar 260px (3 sections : Modération / Plateforme / Compte) + topbar sticky
// + drawer mobile. Garde d'accès : vérifie le rôle via GET /api/admin/me ;
// redirige vers /login si non-admin. Tous les écrans /admin/* le wrappent.

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export type AdminNavKey =
  | 'validation'
  | 'signalements'
  | 'overview'
  | 'prestataires'
  | 'membres'
  | 'mariages'
  | 'paiements'
  | 'parametres';

interface NavItem {
  key: AdminNavKey;
  href: string;
  label: string;
}
interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: 'Modération',
    items: [
      { key: 'validation', href: '/admin/validation', label: 'Validation prestataires' },
      { key: 'signalements', href: '/admin/signalements', label: 'Signalements' },
    ],
  },
  {
    title: 'Plateforme',
    items: [
      { key: 'overview', href: '/admin', label: "Vue d'ensemble" },
      { key: 'prestataires', href: '/admin/prestataires', label: 'Prestataires actifs' },
      { key: 'membres', href: '/admin/membres', label: 'Membres' },
      { key: 'mariages', href: '/admin/mariages', label: 'Mariages' },
      { key: 'paiements', href: '/admin/paiements', label: 'Paiements & Ndawtal' },
    ],
  },
  {
    title: 'Compte',
    items: [{ key: 'parametres', href: '/admin/parametres', label: 'Paramètres' }],
  },
];

function NavIcon({ k }: { k: AdminNavKey | 'logout' }) {
  const p = { viewBox: '0 0 24 24', className: 'h-4 w-4', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 } as const;
  switch (k) {
    case 'validation':
      return <svg {...p}><path d="M9 12l2 2 4-4" /><path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6z" /></svg>;
    case 'signalements':
      return <svg {...p}><path d="M4 21V4M4 4h12l-2 4 2 4H4" /></svg>;
    case 'overview':
      return <svg {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>;
    case 'prestataires':
      return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>;
    case 'membres':
      return <svg {...p}><circle cx="9" cy="7" r="3" /><circle cx="17" cy="9" r="2" /><path d="M3 21c0-3 3-6 6-6s6 3 6 6M14 19c0-2 2-4 4-4s4 2 4 4" /></svg>;
    case 'mariages':
      return <svg {...p}><path d="M12 21s-7-4-7-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-11 11-11 11z" /></svg>;
    case 'paiements':
      return <svg {...p}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>;
    case 'parametres':
      return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9M4.6 9a1.7 1.7 0 0 0-.3-1.9" /></svg>;
    case 'logout':
      return <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>;
  }
}

interface AdminMe {
  ok: boolean;
  role: 'ADMIN' | 'SUPERADMIN';
  can?: string[];
}

export interface AdminBadges {
  validation?: number;
  signalements?: number;
}

export default function AdminShell({
  active,
  breadcrumb,
  search = 'Rechercher…',
  badges,
  children,
}: {
  active: AdminNavKey;
  breadcrumb: string;
  search?: string;
  badges?: AdminBadges;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [state, setState] = useState<'checking' | 'ok' | 'denied'>('checking');
  const [role, setRole] = useState<AdminMe['role'] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await api<AdminMe>('/api/admin/me');
        if (!alive) return;
        setRole(me.role);
        setState('ok');
      } catch (err) {
        if (!alive) return;
        // 401 (pas connecté) ou 403 (pas admin) → on sort vers /login.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setState('denied');
          router.replace('/login');
        } else {
          setState('denied');
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  if (state !== 'ok') {
    return (
      <main className="grid min-h-screen place-items-center bg-bone">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
      </main>
    );
  }

  function badgeFor(key: AdminNavKey): { text: string; tone: string } | null {
    if (key === 'validation' && badges?.validation) return { text: String(badges.validation), tone: 'bg-gold-400/25 text-gold-600' };
    if (key === 'signalements' && badges?.signalements) return { text: String(badges.signalements), tone: 'bg-bordeaux/10 text-bordeaux' };
    return null;
  }

  async function onLogout() {
    await logout();
    router.push('/');
  }

  const Sidebar = (
    <div className="flex h-full flex-col">
      {/* Logo + badge Admin */}
      <div className="border-b border-ink/5 px-5 pb-4 pt-5">
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
          <span className="ml-0.5 rounded-md bg-bordeaux/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-bordeaux">
            Admin
          </span>
        </Link>
      </div>

      {/* Carte console */}
      <div className="mx-3 mt-4 rounded-2xl bg-gradient-to-br from-royal-800 to-royal-900 p-3 text-gold-50 ring-1 ring-royal-900/30">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-bordeaux font-display text-base text-paper ring-2 ring-gold-400/40">
            SM
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">Console Admin</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-gold-400/90">
              {role === 'SUPERADMIN' ? 'Super-administrateur' : 'Administrateur'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-5 flex-1 overflow-y-auto px-3">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <div className="px-2 pt-1 font-mono text-[10px] uppercase tracking-widest text-ink/40">{s.title}</div>
            <ul className="mb-4 mt-2 space-y-0.5">
              {s.items.map((item) => {
                const on = item.key === active || pathname === item.href;
                const b = badgeFor(item.key);
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={
                        'group flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition ' +
                        (on
                          ? 'bg-gradient-to-r from-gold-50 to-royal-50 font-semibold text-royal-900 shadow-[inset_0_0_0_1px_rgb(30_86_49_/_0.12)]'
                          : 'text-ink/75 hover:bg-royal-50/60 hover:text-royal-900')
                      }
                    >
                      <span className={'grid h-8 w-8 place-items-center rounded-lg ' + (on ? 'text-royal-700' : 'text-ink/50 group-hover:text-royal-700')}>
                        <NavIcon k={item.key} />
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {b && <span className={'rounded-full px-2 py-0.5 text-[10px] font-medium ' + b.tone}>{b.text}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className="px-2 font-mono text-[10px] uppercase tracking-widest text-ink/40">Session</div>
        <ul className="mt-2">
          <li>
            <button
              onClick={onLogout}
              className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm text-ink/75 transition hover:bg-bordeaux/5 hover:text-bordeaux"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 group-hover:text-bordeaux">
                <NavIcon k="logout" />
              </span>
              Déconnexion
            </button>
          </li>
        </ul>
      </nav>

      {/* Statut */}
      <div className="border-t border-ink/5 px-3 py-3">
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-bordeaux/8 to-royal-50 px-3 py-2.5 ring-1 ring-bordeaux/10">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-bordeaux text-gold-100">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2v6M12 16v6M2 12h6M16 12h6" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-semibold leading-tight text-royal-900">Tout fonctionne</div>
            <div className="text-[10px] leading-tight text-ink/55">Aucun incident en cours</div>
          </div>
          <span className="h-2.5 w-2.5 rounded-full bg-royal-700" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bone">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-ink/8 bg-paper lg:block">{Sidebar}</aside>

      {drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} className="fixed inset-0 z-40 bg-royal-900/40 backdrop-blur-sm lg:hidden" />
          <aside className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-ink/8 bg-paper shadow-glow lg:hidden">{Sidebar}</aside>
        </>
      )}

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 border-b border-ink/5 bg-bone/80 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Menu"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ink/10 bg-paper lg:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
            <nav className="flex items-center gap-2 text-sm text-ink/55">
              <span className="hidden sm:inline">Admin</span>
              <svg viewBox="0 0 16 16" className="hidden h-3 w-3 sm:block" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m6 4 4 4-4 4" /></svg>
              <span className="font-medium text-royal-800">{breadcrumb}</span>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden w-56 items-center gap-2 rounded-xl bg-paper px-3 py-2 ring-1 ring-ink/8 md:flex lg:w-72">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink/50" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                <input type="search" placeholder={search} className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink/35" />
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-bordeaux font-display text-xs text-paper">SM</span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
