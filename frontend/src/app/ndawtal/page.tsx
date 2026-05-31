'use client';

import { useState, useMemo, type FormEvent } from 'react';
import { useUser } from '@/contexts/AuthContext';
import { useApi } from '@/lib/useApi';
import { api, ApiError } from '@/lib/api';
import { invalidateCache } from '@/lib/useApi';
import AppShell from '@/components/app/AppShell';
import { useToast } from '@/contexts/ToastContext';
import {
  type NdawtalResponse,
  type NdawtalEntry,
  type NdawtalRelation,
  type NdawtalCeremony,
  type NdawtalType,
  RELATION_LABELS,
  CEREMONY_LABELS,
  TYPE_LABELS,
  RELATION_OPTIONS,
  CEREMONY_OPTIONS,
  TYPE_OPTIONS,
  fmtFCFA,
  toEUR,
  fmtDate,
} from '@/lib/ndawtal';
import JourJMode from '@/components/ndawtal/JourJMode';

export const dynamic = 'force-static';

type Ccy = 'XOF' | 'EUR';
type Tab = 'list' | 'ceremony' | 'family';

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
  const labelCls = variant === 'plain' ? 'text-ink/50' : variant === 'gold' ? 'text-bordeaux-900/70' : 'text-gold-400';
  const subCls = variant === 'plain' ? 'text-ink/55' : variant === 'gold' ? 'text-bordeaux-900/70' : 'text-gold-100/75';
  return (
    <div className={'rounded-2xl p-4 ring-1 ' + cls}>
      <div className={'font-mono text-[10px] uppercase tracking-widest ' + labelCls}>{label}</div>
      <div className="mt-1.5 font-display text-2xl sm:text-3xl">{value}</div>
      {sub && <div className={'mt-0.5 text-[11px] ' + subCls}>{sub}</div>}
    </div>
  );
}

interface ParsedNdawtal {
  donorName: string;
  amount: number;
  relationship: NdawtalRelation;
  type: NdawtalType;
}

function QuickAdd({ onAdded }: { onAdded: () => void }) {
  const { toast } = useToast();
  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState('');
  const [relationship, setRelationship] = useState<NdawtalRelation>('TANTE_MARIEE');
  const [ceremony, setCeremony] = useState<NdawtalCeremony>('RECEPTION');
  const [type, setType] = useState<NdawtalType>('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiBusy, setAiBusy] = useState(false);

  async function runParse() {
    const text = aiText.trim();
    if (!text || aiBusy) return;
    setAiBusy(true);
    try {
      const res = await api<{ ok: boolean; entry: ParsedNdawtal }>('/api/ndawtal/parse', {
        method: 'POST',
        body: { text },
      });
      const e = res.entry;
      setDonorName(e.donorName);
      if (e.type === 'SERVICE') setAmount('');
      else if (e.amount > 0) setAmount(String(e.amount));
      setRelationship(e.relationship);
      setType(e.type);
      setAiText('');
      toast('Champs préremplis par l’IA — vérifie puis enregistre 🪄', 'success');
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      toast(
        code === 'AI_NOT_CONFIGURED'
          ? "L'IA n'est pas encore activée"
          : code === 'AI_RATE_LIMITED'
            ? 'Limite IA quotidienne atteinte'
            : "Analyse impossible — saisis à la main",
        'error',
      );
    } finally {
      setAiBusy(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!donorName.trim()) return toast('Indique un nom de donateur·trice', 'error');
    const amt = parseInt(amount.replace(/\D/g, ''), 10) || 0;
    if (type !== 'SERVICE' && amt <= 0) return toast('Indique un montant', 'error');
    setSubmitting(true);
    try {
      await api('/api/ndawtal', {
        method: 'POST',
        body: { donorName: donorName.trim(), amount: amt, relationship, ceremony, type },
      });
      toast(`Don de ${donorName.trim()} enregistré 💝`, 'success');
      setDonorName('');
      setAmount('');
      onAdded();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      toast(code === 'VALIDATION_FAILED' ? 'Vérifie les champs' : 'Enregistrement impossible', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-widest text-bordeaux">Ajout rapide · un don en 5 s</div>
      </div>

      {/* Saisie rapide IA — une phrase → champs préremplis */}
      <div className="mt-4 rounded-xl bg-gradient-to-br from-royal-50 to-gold-50 p-3 ring-1 ring-royal-700/10">
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-royal-700">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M18 18l-2.5-2.5M6 18l2.5-2.5M18 6l-2.5 2.5" />
          </svg>
          Saisie rapide IA
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void runParse();
              }
            }}
            placeholder="« Tata Awa a donné 50 mille » ou « Cousine Fatou 2 millions »"
            className="h-11 flex-1 rounded-xl bg-paper px-3.5 text-[15px] outline-none ring-1 ring-ink/10 transition focus:ring-2 focus:ring-royal-700"
          />
          <button
            type="button"
            onClick={() => void runParse()}
            disabled={aiBusy || !aiText.trim()}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-royal-700 px-4 text-sm font-medium text-gold-50 transition hover:bg-royal-800 disabled:opacity-50"
          >
            {aiBusy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold-50/40 border-t-gold-50" />
            ) : (
              '🪄'
            )}
            <span className="hidden sm:inline">Analyser</span>
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-12">
        <input
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          placeholder="Donateur·trice (ex: Tata Awa Sow)"
          className="h-12 rounded-xl bg-bone px-3.5 text-[15px] outline-none ring-1 ring-ink/10 transition focus:ring-2 focus:ring-royal-700 md:col-span-4"
        />
        <div className="relative md:col-span-3">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            placeholder="50 000"
            disabled={type === 'SERVICE'}
            className="h-12 w-full rounded-xl bg-bone px-3.5 pr-14 text-[15px] outline-none ring-1 ring-ink/10 transition focus:ring-2 focus:ring-royal-700 disabled:opacity-40"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-ink/45">
            FCFA
          </span>
        </div>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value as NdawtalRelation)}
          className="h-12 rounded-xl bg-bone px-3 text-sm outline-none ring-1 ring-ink/10 transition focus:ring-2 focus:ring-royal-700 md:col-span-2"
        >
          {RELATION_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={ceremony}
          onChange={(e) => setCeremony(e.target.value as NdawtalCeremony)}
          className="h-12 rounded-xl bg-bone px-3 text-sm outline-none ring-1 ring-ink/10 transition focus:ring-2 focus:ring-royal-700 md:col-span-2"
        >
          {CEREMONY_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <div className="flex gap-2 md:col-span-1">
          <button
            type="submit"
            disabled={submitting}
            aria-label="Enregistrer"
            className="grid h-12 w-full place-items-center rounded-xl bg-royal-700 text-gold-50 shadow-cta transition hover:bg-royal-800 disabled:opacity-50"
          >
            {submitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold-50/40 border-t-gold-50" />
            ) : (
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 10h12M11 5l5 5-5 5" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {TYPE_OPTIONS.map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => setType(v)}
            className={
              'rounded-full px-3 py-1 text-[12px] font-medium transition ' +
              (type === v ? 'bg-royal-700 text-gold-50' : 'bg-bone text-ink/70 ring-1 ring-ink/10 hover:bg-royal-50')
            }
          >
            {l}
          </button>
        ))}
      </div>
    </form>
  );
}

function EntryRow({ e, ccy, onReceipt, onDelete }: { e: NdawtalEntry; ccy: Ccy; onReceipt: () => void; onDelete: () => void }) {
  const amt = e.type === 'SERVICE' ? 'En nature' : ccy === 'XOF' ? `${fmtFCFA(e.amount)} F` : toEUR(e.amount);
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3 ring-1 ring-ink/5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-bordeaux text-sm font-medium text-white">
        {e.donorName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-royal-900">{e.donorName}</span>
          <span className="shrink-0 rounded-full bg-royal-50 px-2 py-0.5 font-mono text-[10px] text-royal-700">
            {RELATION_LABELS[e.relationship]}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-ink/55">
          <span>{CEREMONY_LABELS[e.ceremony]}</span>
          <span>·</span>
          <span>{TYPE_LABELS[e.type]}</span>
          <span>·</span>
          <span>{fmtDate(e.donationDate)}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="font-display text-lg text-royal-900">{amt}</div>
        {e.receiptSent ? (
          <span className="font-mono text-[10px] text-royal-700">✓ Reçu envoyé</span>
        ) : (
          <button onClick={onReceipt} className="font-mono text-[10px] text-bordeaux hover:underline">
            Envoyer reçu
          </button>
        )}
      </div>
      <button
        onClick={onDelete}
        aria-label="Supprimer"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink/30 transition hover:bg-bordeaux/5 hover:text-bordeaux"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
        </svg>
      </button>
    </div>
  );
}

function NdawtalContent() {
  const { toast } = useToast();
  const { data, loading, refresh } = useApi<NdawtalResponse>('/api/ndawtal');
  const [ccy, setCcy] = useState<Ccy>('XOF');
  const [tab, setTab] = useState<Tab>('list');
  const [search, setSearch] = useState('');
  const [jourJOpen, setJourJOpen] = useState(false);

  const entries = useMemo(() => data?.entries ?? [], [data]);
  const stats = data?.stats;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.donorName.toLowerCase().includes(q));
  }, [entries, search]);

  function reload() {
    invalidateCache('/api/ndawtal');
    void refresh();
  }

  async function markReceipt(id: string) {
    try {
      await api(`/api/ndawtal/${id}`, { method: 'PATCH', body: { receiptSent: true } });
      toast('Reçu marqué comme envoyé ✓', 'success');
      reload();
    } catch {
      toast('Action impossible', 'error');
    }
  }
  async function remove(id: string) {
    try {
      await api(`/api/ndawtal/${id}`, { method: 'DELETE' });
      toast('Entrée supprimée', 'info');
      reload();
    } catch {
      toast('Suppression impossible', 'error');
    }
  }

  const fmt = (n: number) => (ccy === 'XOF' ? `${fmtFCFA(n)} FCFA` : toEUR(n));

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-bordeaux">Module signature · ★ Mondial 1ʳᵉ</div>
          <h1 className="mt-1 font-display text-3xl text-royal-900 sm:text-4xl">Sama Ndawtal 💝</h1>
          <p className="mt-1.5 max-w-xl text-[15px] text-ink/65">
            Le seul outil au monde qui gère les dons traditionnels. Tracker, remercier, et savoir ce que tu devras
            rendre — sans cahier, sans stress.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle devise */}
          <div className="inline-flex rounded-xl bg-bone p-1 ring-1 ring-ink/10">
            {(['XOF', 'EUR'] as Ccy[]).map((c) => (
              <button
                key={c}
                onClick={() => setCcy(c)}
                className={
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition ' +
                  (ccy === c ? 'bg-royal-700 text-gold-50' : 'text-ink/60 hover:text-royal-800')
                }
              >
                {c === 'XOF' ? 'FCFA' : 'EUR'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setJourJOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-bordeaux/8 px-4 py-2.5 text-sm font-medium text-bordeaux ring-1 ring-bordeaux/20 transition hover:bg-bordeaux/15"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-bordeaux" />
            Mode jour J
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total reçu cumulé" value={stats ? fmt(stats.totalReceived) : '—'} variant="royal" />
        <StatCard label="Donateurs" value={stats ? String(stats.donorCount) : '—'} sub="personnes" />
        <StatCard label="Don moyen" value={stats ? fmt(stats.average) : '—'} />
        <StatCard
          label="Plus généreux"
          value={stats?.topDonor ? fmt(stats.topDonor.amount) : '—'}
          sub={stats?.topDonor?.name ?? 'aucun don encore'}
          variant="gold"
        />
      </div>

      {/* Quick add */}
      <QuickAdd onAdded={reload} />

      {/* Onglets */}
      <div className="flex gap-1 border-b border-ink/10">
        {([
          ['list', 'Liste'],
          ['ceremony', 'Par cérémonie'],
          ['family', 'Par famille'],
        ] as [Tab, string][]).map(([t, l]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ' +
              (tab === t ? 'border-royal-700 text-royal-900' : 'border-transparent text-ink/55 hover:text-royal-800')
            }
          >
            {l}
            {t === 'list' && entries.length > 0 && (
              <span className="ml-1.5 rounded-full bg-royal-50 px-1.5 py-0.5 font-mono text-[10px] text-royal-700">
                {entries.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu onglet */}
      {loading && !data ? (
        <div className="grid place-items-center py-20">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-3xl bg-paper p-10 text-center ring-1 ring-ink/5">
          <div className="text-5xl">💝</div>
          <h3 className="mt-3 font-display text-xl text-royal-900">Ton carnet ndawtal est vide</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink/65">
            Ajoute ton premier don ci-dessus. Chaque contribution est tracée : montant, cérémonie, et ce que tu devras
            rendre un jour.
          </p>
        </div>
      ) : tab === 'list' ? (
        <div className="space-y-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un donateur·trice…"
            className="mb-2 h-11 w-full rounded-xl bg-paper px-4 text-sm outline-none ring-1 ring-ink/10 transition focus:ring-2 focus:ring-royal-700 sm:max-w-xs"
          />
          {filtered.map((e) => (
            <EntryRow key={e.id} e={e} ccy={ccy} onReceipt={() => markReceipt(e.id)} onDelete={() => remove(e.id)} />
          ))}
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-ink/55">Aucun résultat.</p>}
        </div>
      ) : tab === 'ceremony' ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {(['TAKK', 'CEET', 'RECEPTION'] as NdawtalCeremony[]).map((c) => {
            const slot = stats?.byCeremony[c] ?? { amount: 0, count: 0 };
            const pct = stats && stats.totalReceived > 0 ? Math.round((slot.amount / stats.totalReceived) * 100) : 0;
            return (
              <div key={c} className="rounded-2xl bg-paper p-5 ring-1 ring-ink/5">
                <div className="font-display text-lg text-royal-900">{CEREMONY_LABELS[c]}</div>
                <div className="mt-2 font-display text-2xl text-royal-900">{fmt(slot.amount)}</div>
                <div className="mt-0.5 text-[12px] text-ink/55">{slot.count} don{slot.count > 1 ? 's' : ''}</div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-royal-50">
                  <div className="h-full rounded-full bg-gradient-to-r from-royal-700 to-gold-400" style={{ width: pct + '%' }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-gradient-to-br from-royal-700 to-royal-900 p-5 text-gold-50 ring-1 ring-royal-900">
            <div className="font-mono text-[10px] uppercase tracking-widest text-gold-400">Côté mariée</div>
            <div className="mt-2 font-display text-3xl">{stats ? fmt(stats.byFamily.mariee) : '—'}</div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-bordeaux to-bordeaux-900 p-5 text-gold-50 ring-1 ring-bordeaux-900">
            <div className="font-mono text-[10px] uppercase tracking-widest text-gold-400">Côté marié</div>
            <div className="mt-2 font-display text-3xl">{stats ? fmt(stats.byFamily.marie) : '—'}</div>
          </div>
          <p className="text-[12px] text-ink/55 sm:col-span-2">
            L&apos;équilibre famille mariée / marié compte — Sama Ndawtal te dit quand un côté est sous-représenté.
          </p>
        </div>
      )}

      <JourJMode
        open={jourJOpen}
        onClose={(didSave) => {
          setJourJOpen(false);
          if (didSave) reload();
        }}
        initialTotal={stats?.totalReceived ?? 0}
        initialCount={stats?.donorCount ?? 0}
      />
    </div>
  );
}

export default function NdawtalPage() {
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
      topbarSubtitle="Vue d'ensemble › Sama Ndawtal"
      topbarTitle="Sama Ndawtal"
    >
      <NdawtalContent />
    </AppShell>
  );
}
