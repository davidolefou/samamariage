'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { fmtFCFA, type NdawtalRelation } from '@/lib/ndawtal';

/**
 * Mode jour J — kiosque de saisie ultra-rapide des dons reçus le jour du mariage.
 * Plein écran : nom + pavé numérique + chips relation → « Enregistrer · Suivant ».
 * Compteur en direct (total + nb donateurs) et liste des derniers enregistrements.
 * Chaque don = POST /api/ndawtal (ceremony=RECEPTION, type=CASH) via le helper `api`
 * (CSRF géré). À la fermeture, on déclenche onClose(saved) pour rafraîchir la page.
 */

type Saved = { id: string; name: string; amount: number; relationship: NdawtalRelation };

const REL_CHIPS: { rel: NdawtalRelation; label: string }[] = [
  { rel: 'TANTE_MARIEE', label: 'Tante mariée' },
  { rel: 'COUSINE', label: 'Cousine' },
  { rel: 'AMIE', label: 'Amie' },
  { rel: 'FAMILLE_MARIE', label: 'Famille marié' },
  { rel: 'VOISINE', label: 'Voisine' },
];

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'back'] as const;

export default function JourJMode({
  open,
  onClose,
  initialTotal,
  initialCount,
}: {
  open: boolean;
  onClose: (didSave: boolean) => void;
  initialTotal: number;
  initialCount: number;
}) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [digits, setDigits] = useState('');
  const [relationship, setRelationship] = useState<NdawtalRelation>('TANTE_MARIEE');
  const [recent, setRecent] = useState<Saved[]>([]);
  const [total, setTotal] = useState(initialTotal);
  const [count, setCount] = useState(initialCount);
  const [saving, setSaving] = useState(false);
  const savedAnyRef = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const amount = parseInt(digits || '0', 10);

  // Sync compteurs quand on (ré)ouvre avec des stats fraîches.
  useEffect(() => {
    if (open) {
      setTotal(initialTotal);
      setCount(initialCount);
      savedAnyRef.current = false;
      setRecent([]);
      setName('');
      setDigits('');
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open, initialTotal, initialCount]);

  const close = useCallback(() => onClose(savedAnyRef.current), [onClose]);

  // Verrouille le scroll du body + ESC pour fermer.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  function tap(k: (typeof KEYS)[number]) {
    setDigits((d) => {
      if (k === 'back') return d.slice(0, -1);
      const next = (d + k).replace(/^0+/, '');
      return next.length > 12 ? d : next; // garde-fou longueur
    });
  }

  async function save() {
    if (!name.trim()) {
      toast('Indique un nom', 'error');
      nameRef.current?.focus();
      return;
    }
    if (amount <= 0) {
      toast('Indique un montant', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await api<{ ok: boolean; entry: { id: string } }>('/api/ndawtal', {
        method: 'POST',
        body: { donorName: name.trim(), amount, relationship, ceremony: 'RECEPTION', type: 'CASH' },
      });
      const id = res.entry?.id ?? crypto.randomUUID();
      setRecent((r) => [{ id, name: name.trim(), amount, relationship }, ...r].slice(0, 30));
      setTotal((t) => t + amount);
      setCount((c) => c + 1);
      savedAnyRef.current = true;
      setName('');
      setDigits('');
      nameRef.current?.focus();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      toast(code === 'VALIDATION_FAILED' ? 'Vérifie les champs' : 'Enregistrement impossible', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-gradient-to-b from-royal-900 via-royal-800 to-bordeaux-900 text-gold-50"
      role="dialog"
      aria-modal="true"
      aria-label="Mode jour J"
    >
      <div className="wax-bg-bordeaux absolute inset-0 opacity-20" />
      <div className="relative grid min-h-full lg:grid-cols-2">
        {/* GAUCHE : saisie + pavé */}
        <div className="flex flex-col overflow-y-auto p-6 sm:p-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold-400">
                Sama Ndawtal · Mode jour J
              </div>
              <h2 className="mt-1 font-display text-3xl text-gold-50 sm:text-4xl">Don rapide.</h2>
              <p className="mt-1 text-sm text-gold-100/65">3 secondes max. Tape, valide, suivant.</p>
            </div>
            <button
              onClick={close}
              aria-label="Fermer"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <svg viewBox="0 0 16 16" className="h-5 w-5 text-gold-100" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>

          {/* Écran de saisie */}
          <div className="mt-8 rounded-3xl bg-white/8 p-5 ring-1 ring-white/10 backdrop-blur">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-gold-400">
              Donateur·trice
            </label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              placeholder="Nom complet…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') save();
              }}
              className="mt-1 w-full bg-transparent font-display text-2xl text-gold-50 outline-none placeholder:text-gold-100/30"
            />
            <div className="mt-5 flex items-baseline justify-between">
              <label className="font-mono text-[10px] uppercase tracking-widest text-gold-400">Montant FCFA</label>
              <button
                onClick={() => setDigits('')}
                className="font-mono text-[11px] uppercase tracking-widest text-gold-400/70 hover:text-gold-400"
              >
                Effacer
              </button>
            </div>
            <div className="mt-1 font-display text-5xl leading-none text-gold-50 tabular-nums sm:text-6xl">
              {fmtFCFA(amount)}
            </div>

            {/* Chips relation */}
            <div className="mt-5 flex flex-wrap gap-1.5">
              {REL_CHIPS.map((c) => (
                <button
                  key={c.rel}
                  onClick={() => setRelationship(c.rel)}
                  aria-pressed={relationship === c.rel}
                  className={
                    'rounded-full px-3 py-1.5 text-[12px] transition ' +
                    (relationship === c.rel
                      ? 'bg-gold-400 text-bordeaux-900'
                      : 'bg-white/8 text-gold-100 hover:bg-white/15')
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pavé numérique */}
          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {KEYS.map((k) => (
              <button
                key={k}
                onClick={() => tap(k)}
                className={
                  'h-16 rounded-2xl border border-gold-400/20 bg-white/6 font-display text-gold-50 transition hover:bg-white/12 active:scale-95 ' +
                  (k === '000' || k === 'back' ? 'text-base' : 'text-[28px]')
                }
              >
                {k === 'back' ? '⌫' : k}
              </button>
            ))}
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-400 px-5 py-5 font-display text-lg text-bordeaux-900 shadow-glow transition hover:bg-gold-200 disabled:opacity-60"
          >
            {saving ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-bordeaux-900/40 border-t-bordeaux-900" />
            ) : (
              <>✓ Enregistrer · Suivant</>
            )}
          </button>
        </div>

        {/* DROITE : compteur live + derniers dons */}
        <div className="flex flex-col border-t border-gold-400/10 bg-black/20 p-6 sm:p-10 lg:border-l lg:border-t-0">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-gold-400">Compteur en direct</div>
            <div className="mt-1 font-display text-4xl text-gold-50 tabular-nums">{fmtFCFA(total)}</div>
            <div className="font-mono text-[11px] text-gold-100/60">
              FCFA · {count} donateur{count > 1 ? 's' : ''}
            </div>
          </div>

          <div className="mt-6 flex min-h-0 flex-1 flex-col">
            <div className="font-mono text-[10px] uppercase tracking-widest text-gold-400">
              Derniers enregistrements
            </div>
            {recent.length === 0 ? (
              <p className="mt-4 text-sm text-gold-100/50">
                Les dons saisis ici apparaissent en direct. Commence à gauche.
              </p>
            ) : (
              <ul className="no-scrollbar mt-3 flex-1 space-y-2 overflow-y-auto">
                {recent.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 rounded-2xl bg-white/6 px-4 py-2.5 ring-1 ring-white/10"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-bordeaux font-display text-[13px] text-royal-900">
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gold-50">{r.name}</div>
                      <div className="font-mono text-[10px] text-gold-100/60">
                        {REL_CHIPS.find((c) => c.rel === r.relationship)?.label ?? 'Don'}
                      </div>
                    </div>
                    <div className="font-display text-lg text-gold-50 tabular-nums">{fmtFCFA(r.amount)} F</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={() => toast('Saisie vocale — bientôt 🎙️', 'info')}
            className="mt-6 rounded-2xl bg-white/8 px-4 py-3 text-sm text-gold-100 transition hover:bg-white/12"
          >
            🎙️ Saisie vocale — bientôt
          </button>
        </div>
      </div>
    </div>
  );
}
