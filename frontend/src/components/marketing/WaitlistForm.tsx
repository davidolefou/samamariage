'use client';

import { useState } from 'react';

/**
 * Formulaire waitlist. Reproduit le comportement du design (état "inscrite").
 * TODO: brancher sur un vrai endpoint POST /api/waitlist (email, téléphone, date)
 * quand la table waitlist sera ajoutée au schéma Prisma.
 */
export default function WaitlistForm() {
  const [done, setDone] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDone(true);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="reveal d2 glass-dark rounded-3xl p-6 shadow-glow ring-1 ring-gold-400/30 sm:p-7"
    >
      <label className="block text-xs font-mono uppercase tracking-widest text-gold-400/80">Email</label>
      <input
        type="email"
        required
        placeholder="aminata@gmail.com"
        className="mt-2 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 text-gold-50 outline-none transition placeholder:text-gold-100/40 focus:border-gold-400 focus:bg-white/15"
      />

      <label className="mt-5 block text-xs font-mono uppercase tracking-widest text-gold-400/80">
        Téléphone (WhatsApp)
      </label>
      <input
        type="tel"
        required
        placeholder="+221 77 000 00 00"
        className="mt-2 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 text-gold-50 outline-none transition placeholder:text-gold-100/40 focus:border-gold-400 focus:bg-white/15"
      />

      <label className="mt-5 block text-xs font-mono uppercase tracking-widest text-gold-400/80">
        Date prévue du mariage
      </label>
      <input
        type="month"
        required
        className="mt-2 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 text-gold-50 outline-none transition placeholder:text-gold-100/40 focus:border-gold-400 focus:bg-white/15"
      />

      <button
        type="submit"
        disabled={done}
        className={
          'group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[15px] font-medium transition ' +
          (done
            ? 'bg-royal-700 text-gold-50'
            : 'bg-gold-400 text-bordeaux-900 hover:bg-gold-200')
        }
      >
        {done ? (
          '✓ Inscrite ! On t’écrit dans 2 min'
        ) : (
          <>
            Rejoindre les 500+ mariées
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4 transition group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 10h12M11 5l5 5-5 5" />
            </svg>
          </>
        )}
      </button>

      <p className="mt-3 text-center text-[11px] text-gold-100/60">
        {done
          ? 'Merci ! On t’envoie ton accès à l’ouverture. Sama xewël 💍🇸🇳'
          : 'En t’inscrivant, tu acceptes que SamaMariage te contacte. Zéro spam. Promesse sur le ndawtal.'}
      </p>
    </form>
  );
}
