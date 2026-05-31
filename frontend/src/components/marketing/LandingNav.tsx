'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const LINKS = [
  { href: '#how', label: 'Comment ça marche' },
  { href: '#modules', label: 'Prestataires' },
  { href: '#diaspora', label: 'Diaspora' },
  { href: '#blog', label: 'Blog' },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header id="nav" className="fixed inset-x-0 top-0 z-50 transition-all duration-500">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div
          className={
            'mt-3 flex items-center justify-between rounded-2xl border px-4 py-3 transition-all duration-500 ' +
            (scrolled
              ? 'border-ink/10 bg-bone/85 shadow-card backdrop-blur-md'
              : 'border-transparent')
          }
        >
          <a href="#top" className="group flex items-center gap-2.5">
            <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-royal-700 shadow-glow">
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
              <span className="absolute -inset-px rounded-xl ring-1 ring-gold-400/30" />
            </span>
            <span className="font-display text-[22px] leading-none">
              <span className="text-royal-700">Sama</span>
              <span className="gold-shine font-semibold">Mariage</span>
            </span>
          </a>

          <nav className="hidden items-center gap-9 text-sm font-medium text-ink/80 lg:flex">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="transition hover:text-royal-700">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden items-center px-3 py-2 text-sm font-medium text-ink/75 transition hover:text-royal-700 sm:inline-flex"
            >
              Se connecter
            </Link>
            <a
              href="#waitlist"
              className="hidden items-center gap-2 rounded-full bg-royal-700 px-5 py-2.5 text-sm font-medium text-gold-50 ring-1 ring-gold-400/30 transition hover:bg-royal-800 hover:ring-gold-400/60 sm:inline-flex"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-400" />
              Rejoindre la waitlist
            </a>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-ink/10 bg-bone lg:hidden"
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="mt-2 rounded-2xl border border-ink/10 bg-bone/95 p-2 shadow-card backdrop-blur-md lg:hidden">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-royal-50"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-royal-50"
            >
              Se connecter
            </Link>
            <a
              href="#waitlist"
              onClick={() => setMenuOpen(false)}
              className="mt-1 block rounded-xl bg-royal-700 px-4 py-3 text-center text-sm font-medium text-gold-50"
            >
              Rejoindre la waitlist
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
