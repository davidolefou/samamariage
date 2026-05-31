'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { NAV_ITEMS, type NavItem } from './nav';
import SamaCoach from './SamaCoach';

// Icônes SVG par clé (viewBox 0 0 24 24, stroke courant).
function NavIcon({ name }: { name: string }) {
  const common = { viewBox: '0 0 24 24', className: 'h-[18px] w-[18px]', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7 } as const;
  switch (name) {
    case 'grid':
      return <svg {...common}><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /></svg>;
    case 'mood':
      return <svg {...common}><path d="M4 5h7v7H4zM13 5h7v4h-7zM13 13h7v6h-7zM4 16h7v3H4z" /></svg>;
    case 'budget':
      return <svg {...common}><path d="M3 12h3l3-8 4 16 3-8h5" /></svg>;
    case 'planning':
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>;
    case 'vendors':
      return <svg {...common}><path d="M4 7h16M4 12h16M4 17h10" /></svg>;
    case 'ndawtal':
      return <svg {...common}><path d="M12 21s-7-4-7-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-11 11-11 11z" /></svg>;
    case 'outfits':
      return <svg {...common}><path d="M5 4l3 3h8l3-3M5 4l-1 6 8 10 8-10-1-6" /></svg>;
    case 'guests':
      return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 21c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 11a3 3 0 0 0 0-6M21 21c0-2.5-1.5-4.6-3.5-5.5" /></svg>;
    case 'serenity':
      return <svg {...common}><path d="M12 21s-7-4-7-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-11 11-11 11z" /></svg>;
    case 'diaspora':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
  }
}

function WeddingMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5 text-gold-400" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M16 4c-1.6 2-1.6 4 0 5.5 1.6-1.5 1.6-3.5 0-5.5Z" />
      <path d="M7 18a9 9 0 0 0 18 0c0-3.5-3-7-9-7s-9 3.5-9 7Z" />
      <path d="M9.5 18c1.8 1.5 4 2.3 6.5 2.3s4.7-.8 6.5-2.3" />
    </svg>
  );
}

export interface ShellUser {
  fullName?: string;
  prepProgress?: number; // 0-100
  countdownLabel?: string; // ex "J-216 · 15 déc 2026"
}

/**
 * Shell applicatif partagé par tous les modules derrière auth :
 * sidebar fixe 260px (drawer sur mobile) + topbar sticky.
 */
export default function AppShell({
  children,
  topbarTitle,
  topbarSubtitle,
  user,
}: {
  children: ReactNode;
  topbarTitle?: ReactNode;
  topbarSubtitle?: string;
  user?: ShellUser;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const firstName = user?.fullName?.trim().split(/\s+/)[0] ?? '';
  const initial = (firstName || 'S').charAt(0).toUpperCase();
  const prep = Math.max(0, Math.min(100, user?.prepProgress ?? 0));

  function onNavClick(e: React.MouseEvent, item: NavItem) {
    setDrawerOpen(false);
    if (item.soon) {
      e.preventDefault();
      toast(`${item.label} arrive bientôt 🌸`, 'info');
    }
  }

  async function onLogout() {
    await logout();
    router.push('/');
  }

  const Sidebar = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pt-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-royal-700 shadow-glow">
          <WeddingMark />
        </span>
        <span className="font-display text-[19px] leading-none">
          <span className="text-royal-700">Sama</span>
          <span className="gold-shine font-semibold">Mariage</span>
        </span>
      </div>

      {/* Mini profil */}
      <div className="mx-3 mt-4 rounded-2xl bg-gradient-to-br from-bone to-sand/40 p-3 ring-1 ring-ink/5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-bordeaux text-sm font-medium text-white">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-royal-900">{user?.fullName ?? 'Mariée'}</div>
            {user?.countdownLabel && (
              <div className="font-mono text-[10px] text-bordeaux">{user.countdownLabel}</div>
            )}
          </div>
        </div>
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-royal-50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-royal-700 via-gold-400 to-bordeaux transition-[width] duration-700"
            style={{ width: prep + '%' }}
          />
        </div>
        <div className="mt-1 font-mono text-[10px] text-ink/55">Préparation {prep}%</div>
      </div>

      {/* Nav */}
      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => onNavClick(e, item)}
              className={
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ' +
                (active
                  ? 'bg-gradient-to-r from-gold-50 to-royal-50 font-semibold text-royal-900 shadow-[inset_0_0_0_1px_rgb(30_86_49_/_0.12)]'
                  : 'text-ink/70 hover:bg-royal-50/60 hover:text-royal-900')
              }
            >
              <span className={active ? 'text-royal-700' : 'text-ink/50 group-hover:text-royal-700'}>
                <NavIcon name={item.icon} />
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="rounded-full bg-gold-400/20 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-gold-600">
                  {item.badge}
                </span>
              )}
              {item.soon && (
                <span className="rounded-full bg-ink/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink/40">
                  Bientôt
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bas : settings + logout */}
      <div className="mt-2 space-y-0.5 border-t border-ink/5 px-3 py-3">
        <Link
          href="/settings"
          onClick={() => setDrawerOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink/70 transition hover:bg-royal-50/60 hover:text-royal-900"
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 7.3 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3 12.6a1.65 1.65 0 0 0-1.17-2.82H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 7.3" />
          </svg>
          Paramètres
        </Link>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink/70 transition hover:bg-bordeaux/5 hover:text-bordeaux"
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bone">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-ink/8 bg-bone/95 backdrop-blur lg:block">
        {Sidebar}
      </aside>

      {/* Drawer mobile */}
      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-royal-900/30 backdrop-blur-sm lg:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-ink/8 bg-bone shadow-glow lg:hidden">
            {Sidebar}
          </aside>
        </>
      )}

      {/* Contenu */}
      <div className="lg:pl-[260px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-ink/5 bg-bone/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Menu"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ink/10 bg-paper lg:hidden"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
              <div className="min-w-0">
                {topbarSubtitle && (
                  <div className="truncate font-mono text-[10px] uppercase tracking-wider text-bordeaux">
                    {topbarSubtitle}
                  </div>
                )}
                {topbarTitle && (
                  <h1 className="truncate font-display text-xl text-royal-900 sm:text-2xl">{topbarTitle}</h1>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => toast('Notifications — bientôt 🔔', 'info')}
                aria-label="Notifications"
                className="relative grid h-10 w-10 place-items-center rounded-xl bg-paper ring-1 ring-ink/8 transition hover:ring-ink/15"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-ink/70" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </button>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-bordeaux text-sm font-medium text-white">
                {initial}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>

      {/* Sama Coach — assistante IA flottante, disponible sur tous les modules */}
      <SamaCoach firstName={firstName} />
    </div>
  );
}
