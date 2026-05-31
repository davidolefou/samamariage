'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PRO_NAV } from './pro-nav';

// Icônes SVG par clé (viewBox 0 0 24 24) — portées du design pro-shell.js.
function ProNavIcon({ name }: { name: string }) {
  const c = { viewBox: '0 0 24 24', className: 'h-4 w-4', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 } as const;
  switch (name) {
    case 'overview':
      return <svg {...c}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>;
    case 'demandes':
      return <svg {...c}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case 'agenda':
      return <svg {...c}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
    case 'vitrine':
      return <svg {...c}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>;
    case 'avis':
      return <svg {...c}><path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" /></svg>;
    case 'paiements':
      return <svg {...c}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>;
    case 'parametres':
      return <svg {...c}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 7.3 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3 12.6a1.65 1.65 0 0 0-1.17-2.82H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 7.3" /></svg>;
    default:
      return <svg {...c}><circle cx="12" cy="12" r="8" /></svg>;
  }
}

function VerifiedTick({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor">
      <circle cx="8" cy="8" r="7" />
      <path d="m5 8 2 2 4-4" stroke="#F7E9CF" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

export interface ProShellVendor {
  businessName?: string;
  categoryLabel?: string;
  verified?: boolean;
}

/**
 * Châssis du portail prestataire : sidebar fixe 260px (drawer mobile) + topbar
 * sticky. Analogue à AppShell mais persona pro (badge Pro, nav activité).
 */
export default function ProShell({
  children,
  breadcrumb,
  vendor,
  action,
}: {
  children: ReactNode;
  breadcrumb?: string;
  vendor?: ProShellVendor;
  action?: { label: string; href: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const name = vendor?.businessName?.trim() || 'Mon activité';
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  async function onLogout() {
    await logout();
    router.push('/pro/login');
  }

  const Sidebar = (
    <div className="flex h-full flex-col">
      {/* Logo + badge Pro */}
      <div className="flex items-center gap-2.5 px-5 pt-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-royal-700 shadow-glow">
          <svg viewBox="0 0 32 32" className="h-5 w-5 text-gold-400" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z" />
            <path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z" />
            <path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3" />
          </svg>
        </span>
        <span className="font-display text-[19px] leading-none">
          <span className="text-royal-700">Sama</span>
          <span className="gold-shine font-semibold">Mariage</span>
        </span>
        <span className="ml-0.5 rounded-md bg-bordeaux/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-bordeaux">
          Pro
        </span>
      </div>

      {/* Mini profil vendeur */}
      <div className="mx-3 mt-4 rounded-2xl bg-gradient-to-br from-bone to-sand/40 p-3 ring-1 ring-ink/5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-royal-700 to-gold-400 font-display text-sm text-white">
            {initials || 'S'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <div className="truncate text-sm font-semibold text-royal-900">{name}</div>
              {vendor?.verified && <span className="text-royal-700"><VerifiedTick /></span>}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">
              {vendor?.categoryLabel ?? 'Prestataire'}
              {vendor?.verified ? ' · Vérifié' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Nav activité */}
      <nav className="mt-4 flex-1 overflow-y-auto px-3">
        <div className="px-2 font-mono text-[10px] uppercase tracking-widest text-ink/40">Mon activité</div>
        <ul className="mt-2 space-y-0.5">
          {PRO_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ' +
                    (active
                      ? 'bg-gradient-to-r from-gold-50 to-royal-50 font-semibold text-royal-900 shadow-[inset_0_0_0_1px_rgb(30_86_49_/_0.12)]'
                      : 'text-ink/70 hover:bg-royal-50/60 hover:text-royal-900')
                  }
                >
                  <span className={active ? 'text-royal-700' : 'text-ink/50 group-hover:text-royal-700'}>
                    <ProNavIcon name={item.icon} />
                  </span>
                  <span className="flex-1">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bas : paramètres + déconnexion */}
      <div className="mt-2 space-y-0.5 border-t border-ink/5 px-3 py-3">
        <Link
          href="/pro/parametres"
          onClick={() => setDrawerOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink/70 transition hover:bg-royal-50/60 hover:text-royal-900"
        >
          <span className="text-ink/50"><ProNavIcon name="parametres" /></span>
          Paramètres
        </Link>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink/70 transition hover:bg-bordeaux/5 hover:text-bordeaux"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bone">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-ink/8 bg-bone/95 backdrop-blur lg:block">
        {Sidebar}
      </aside>

      {drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} className="fixed inset-0 z-40 bg-royal-900/30 backdrop-blur-sm lg:hidden" />
          <aside className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-ink/8 bg-bone shadow-glow lg:hidden">{Sidebar}</aside>
        </>
      )}

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 border-b border-ink/5 bg-bone/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Menu"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ink/10 bg-paper lg:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
            <nav className="flex items-center gap-2 text-sm text-ink/55">
              <Link href="/pro/dashboard" className="hidden hover:text-royal-800 sm:inline">Espace pro</Link>
              <svg viewBox="0 0 16 16" className="hidden h-3 w-3 sm:block" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m6 4 4 4-4 4" /></svg>
              <span className="font-medium text-royal-800">{breadcrumb ?? "Vue d'ensemble"}</span>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              {action && (
                <Link
                  href={action.href}
                  className="hidden items-center gap-2 rounded-full bg-royal-700 px-4 py-2.5 text-[13px] font-medium text-gold-50 transition hover:bg-royal-800 sm:inline-flex"
                >
                  {action.label}
                </Link>
              )}
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-royal-700 to-gold-400 font-display text-xs text-white">
                {initials || 'S'}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
