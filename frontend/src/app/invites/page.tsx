'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useUser } from '@/contexts/AuthContext';
import { useApi, invalidateCache } from '@/lib/useApi';
import { api, ApiError } from '@/lib/api';
import AppShell from '@/components/app/AppShell';
import { useToast } from '@/contexts/ToastContext';
import {
  type GuestResponse,
  type Guest,
  type GuestSide,
  type RsvpStatus,
  SIDE_LABELS,
  RSVP_LABELS,
  SIDE_OPTIONS,
  RSVP_OPTIONS,
  whatsappLink,
} from '@/lib/guests';

export const dynamic = 'force-static';

type RsvpFilter = 'ALL' | RsvpStatus;

function StatCard({
  label,
  value,
  sub,
  variant = 'plain',
}: {
  label: string;
  value: string;
  sub?: string;
  variant?: 'plain' | 'royal' | 'gold';
}) {
  const cls =
    variant === 'royal'
      ? 'bg-gradient-to-br from-royal-700 to-royal-900 text-gold-50 ring-royal-900'
      : variant === 'gold'
        ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-bordeaux-900 ring-gold-200'
        : 'bg-paper text-royal-900 ring-ink/5';
  const labelCls =
    variant === 'plain' ? 'text-ink/50' : variant === 'gold' ? 'text-bordeaux-900/70' : 'text-gold-400';
  const subCls =
    variant === 'plain' ? 'text-ink/55' : variant === 'gold' ? 'text-bordeaux-900/70' : 'text-gold-100/75';
  return (
    <div className={'rounded-2xl p-4 ring-1 ' + cls}>
      <div className={'font-mono text-[10px] uppercase tracking-widest ' + labelCls}>{label}</div>
      <div className="mt-1.5 font-display text-2xl sm:text-3xl">{value}</div>
      {sub && <div className={'mt-0.5 text-[11px] ' + subCls}>{sub}</div>}
    </div>
  );
}

const RSVP_BADGE: Record<RsvpStatus, string> = {
  CONFIRMED: 'bg-emerald-500/12 text-emerald-700 ring-emerald-600/20',
  DECLINED: 'bg-rose-500/10 text-rose-700 ring-rose-600/20',
  MAYBE: 'bg-amber-500/12 text-amber-700 ring-amber-600/20',
  PENDING: 'bg-ink/5 text-ink/55 ring-ink/10',
};

function QuickAdd({ onAdded }: { onAdded: () => void }) {
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [side, setSide] = useState<GuestSide>('COMMUN');
  const [seats, setSeats] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      toast('Indique un nom', 'error');
      return;
    }
    const seatsN = Math.max(1, parseInt(seats || '1', 10) || 1);
    setSubmitting(true);
    try {
      await api('/api/guests', {
        method: 'POST',
        body: { fullName: fullName.trim(), phone: phone.trim(), side, seats: seatsN },
      });
      toast('Invité·e ajouté·e ✓', 'success');
      setFullName('');
      setPhone('');
      setSeats('1');
      onAdded();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      toast(code === 'VALIDATION_FAILED' ? 'Vérifie les champs' : 'Ajout impossible', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 rounded-2xl bg-paper p-4 ring-1 ring-ink/5 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Nom complet</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Aïssatou Ndiaye"
            className="mt-1 w-full rounded-xl bg-bone px-3 py-2.5 text-sm text-royal-900 outline-none ring-1 ring-ink/10 focus:ring-gold-400"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Téléphone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="+221 77 000 00 00"
            className="mt-1 w-full rounded-xl bg-bone px-3 py-2.5 text-sm text-royal-900 outline-none ring-1 ring-ink/10 focus:ring-gold-400"
          />
        </label>
      </div>
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Côté</span>
        <select
          value={side}
          onChange={(e) => setSide(e.target.value as GuestSide)}
          className="mt-1 w-full rounded-xl bg-bone px-3 py-2.5 text-sm text-royal-900 outline-none ring-1 ring-ink/10 focus:ring-gold-400"
        >
          {SIDE_OPTIONS.map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Places</span>
        <input
          value={seats}
          onChange={(e) => setSeats(e.target.value.replace(/[^\d]/g, ''))}
          inputMode="numeric"
          className="mt-1 w-20 rounded-xl bg-bone px-3 py-2.5 text-sm text-royal-900 outline-none ring-1 ring-ink/10 focus:ring-gold-400"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-royal-700 px-5 py-2.5 text-sm font-medium text-gold-50 transition hover:bg-royal-800 disabled:opacity-60"
      >
        {submitting ? '…' : 'Ajouter'}
      </button>
    </form>
  );
}

function GuestRow({
  g,
  onChange,
  onDelete,
}: {
  g: Guest;
  onChange: (patch: Partial<Pick<Guest, 'rsvp' | 'table'>>) => void;
  onDelete: () => void;
}) {
  const [table, setTable] = useState(g.table);
  const wa =
    g.phone && (g.rsvp === 'PENDING' || g.rsvp === 'MAYBE')
      ? whatsappLink(g.phone, `Salam ${g.fullName} ! Peux-tu confirmer ta présence à notre mariage ? 🤍`)
      : null;

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl bg-paper px-4 py-3 ring-1 ring-ink/5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-royal-700 to-bordeaux font-display text-[13px] text-gold-50">
        {g.fullName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-royal-900">{g.fullName}</div>
        <div className="font-mono text-[10px] text-ink/50">
          {SIDE_LABELS[g.side]} · {g.seats} place{g.seats > 1 ? 's' : ''}
          {g.phone ? ` · ${g.phone}` : ''}
        </div>
      </div>

      <select
        value={g.rsvp}
        onChange={(e) => onChange({ rsvp: e.target.value as RsvpStatus })}
        className={'rounded-full px-3 py-1.5 text-[12px] font-medium ring-1 outline-none ' + RSVP_BADGE[g.rsvp]}
        aria-label="Statut RSVP"
      >
        {RSVP_OPTIONS.map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </select>

      <input
        value={table}
        onChange={(e) => setTable(e.target.value)}
        onBlur={() => {
          if (table.trim() !== g.table) onChange({ table: table.trim() });
        }}
        placeholder="Table"
        className="w-20 rounded-xl bg-bone px-2.5 py-1.5 text-[12px] text-royal-900 outline-none ring-1 ring-ink/10 focus:ring-gold-400"
      />

      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-[12px] font-medium text-emerald-700 ring-1 ring-emerald-600/20 transition hover:bg-emerald-500/20"
        >
          Relancer
        </a>
      )}

      <button
        onClick={onDelete}
        aria-label="Supprimer"
        className="grid h-8 w-8 place-items-center rounded-full text-ink/40 transition hover:bg-rose-500/10 hover:text-rose-600"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 4h10M6.5 4V3h3v1M5 4l.5 9h5L11 4" />
        </svg>
      </button>
    </li>
  );
}

function InvitesContent() {
  const { toast } = useToast();
  const { data, loading, refresh } = useApi<GuestResponse>('/api/guests');
  const [filter, setFilter] = useState<RsvpFilter>('ALL');
  const [search, setSearch] = useState('');

  const guests = useMemo(() => data?.guests ?? [], [data]);
  const stats = data?.stats;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guests.filter((g) => {
      if (filter !== 'ALL' && g.rsvp !== filter) return false;
      if (q && !g.fullName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [guests, filter, search]);

  function reload() {
    invalidateCache('/api/guests');
    void refresh();
  }

  async function patch(id: string, body: Partial<Pick<Guest, 'rsvp' | 'table'>>) {
    try {
      await api(`/api/guests/${id}`, { method: 'PATCH', body });
      reload();
    } catch {
      toast('Mise à jour impossible', 'error');
    }
  }
  async function remove(id: string) {
    try {
      await api(`/api/guests/${id}`, { method: 'DELETE' });
      toast('Invité·e supprimé·e', 'info');
      reload();
    } catch {
      toast('Suppression impossible', 'error');
    }
  }

  const FILTERS: { key: RsvpFilter; label: string }[] = [
    { key: 'ALL', label: 'Tous' },
    { key: 'CONFIRMED', label: RSVP_LABELS.CONFIRMED },
    { key: 'PENDING', label: RSVP_LABELS.PENDING },
    { key: 'MAYBE', label: RSVP_LABELS.MAYBE },
    { key: 'DECLINED', label: RSVP_LABELS.DECLINED },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Invités" value={String(stats?.total ?? 0)} sub="au total" variant="royal" />
        <StatCard
          label="Confirmés"
          value={String(stats?.confirmed ?? 0)}
          sub={`${stats?.confirmedSeats ?? 0} couverts`}
          variant="gold"
        />
        <StatCard label="En attente" value={String(stats?.pending ?? 0)} sub="à relancer" />
        <StatCard label="Déclinés" value={String(stats?.declined ?? 0)} sub="absents" />
      </div>

      <QuickAdd onAdded={reload} />

      {/* Filtres + recherche */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={
              'rounded-full px-3.5 py-1.5 text-sm transition ' +
              (filter === f.key
                ? 'bg-royal-700 text-gold-50'
                : 'bg-paper text-ink/60 ring-1 ring-ink/5 hover:text-royal-900')
            }
          >
            {f.label}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="ml-auto w-44 rounded-full bg-paper px-4 py-1.5 text-sm text-royal-900 outline-none ring-1 ring-ink/10 focus:ring-gold-400"
        />
      </div>

      {/* Liste */}
      {loading && guests.length === 0 ? (
        <div className="grid place-items-center py-16">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-paper p-10 text-center ring-1 ring-ink/5">
          <p className="font-display text-lg text-royal-900">
            {guests.length === 0 ? 'Aucun invité pour l’instant' : 'Aucun résultat'}
          </p>
          <p className="mt-1 text-sm text-ink/55">
            {guests.length === 0
              ? 'Ajoute ta première invitée avec le formulaire ci-dessus.'
              : 'Ajuste les filtres ou la recherche.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((g) => (
            <GuestRow
              key={g.id}
              g={g}
              onChange={(patchBody) => patch(g.id, patchBody)}
              onDelete={() => remove(g.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function InvitesPage() {
  const user = useUser('/login');
  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-bone">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
      </main>
    );
  }
  return (
    <AppShell
      user={{ fullName: user.email.split('@')[0] ?? 'Mariée' }}
      topbarSubtitle="Vue d'ensemble › Sama Invités"
      topbarTitle="Sama Invités"
    >
      <InvitesContent />
    </AppShell>
  );
}
