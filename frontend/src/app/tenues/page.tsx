'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useUser } from '@/contexts/AuthContext';
import { useApi, invalidateCache } from '@/lib/useApi';
import { api } from '@/lib/api';
import AppShell from '@/components/app/AppShell';
import { useToast } from '@/contexts/ToastContext';
import {
  type OutfitsResponse, type BridesmaidsResponse, type Outfit, type Bridesmaid, type OutfitStatus,
  OUTFIT_STATUS_OPTIONS, CEREMONY_OPTIONS, CEREMONY_LABELS,
} from '@/lib/tenues';
import { fmtFCFA } from '@/lib/ndawtal';

export const dynamic = 'force-static';

function Spinner() {
  return <main className="grid min-h-screen place-items-center bg-bone"><span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" /></main>;
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-paper p-4 ring-1 ring-ink/5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">{label}</div>
      <div className="mt-1.5 font-display text-2xl text-royal-900 sm:text-3xl">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-ink/55">{sub}</div>}
    </div>
  );
}

function Looks() {
  const { toast } = useToast();
  const { data, refresh } = useApi<OutfitsResponse>('/api/outfits');
  const outfits = useMemo(() => data?.outfits ?? [], [data]);
  const [ceremony, setCeremony] = useState('takk');
  const [title, setTitle] = useState('');
  const [fabric, setFabric] = useState('');
  const reload = () => { invalidateCache('/api/outfits'); void refresh(); };

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast('Indique un titre', 'error');
    try {
      await api('/api/outfits', { method: 'POST', body: { ceremony, title: title.trim(), fabric: fabric.trim() } });
      setTitle(''); setFabric(''); reload();
    } catch { toast('Ajout impossible', 'error'); }
  }
  async function setStatus(o: Outfit, status: OutfitStatus) {
    try { await api(`/api/outfits/${o.id}`, { method: 'PATCH', body: { status } }); reload(); } catch { toast('Action impossible', 'error'); }
  }
  async function remove(id: string) {
    try { await api(`/api/outfits/${id}`, { method: 'DELETE' }); reload(); } catch { toast('Suppression impossible', 'error'); }
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl text-royal-900">Tes looks</h2>
      <form onSubmit={add} className="grid gap-3 rounded-2xl bg-paper p-4 ring-1 ring-ink/5 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-end">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Cérémonie</span>
          <select value={ceremony} onChange={(e) => setCeremony(e.target.value)} className="mt-1 w-full rounded-xl bg-bone px-3 py-2.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-gold-400">
            {CEREMONY_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <label className="block"><span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Titre</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bazin riche brodé or" className="mt-1 w-full rounded-xl bg-bone px-3 py-2.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-gold-400" /></label>
        <label className="block"><span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Tissu</span>
          <input value={fabric} onChange={(e) => setFabric(e.target.value)} placeholder="Bazin, dentelle…" className="mt-1 w-full rounded-xl bg-bone px-3 py-2.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-gold-400" /></label>
        <button type="submit" className="rounded-xl bg-royal-700 px-5 py-2.5 text-sm font-medium text-gold-50 transition hover:bg-royal-800">Ajouter</button>
      </form>
      {outfits.length === 0 ? (
        <div className="rounded-2xl bg-paper p-8 text-center text-sm text-ink/55 ring-1 ring-ink/5">Ajoute tes looks par cérémonie (takk, céet, réception).</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {outfits.map((o) => (
            <article key={o.id} className="rounded-2xl bg-paper p-4 ring-1 ring-ink/5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">{CEREMONY_LABELS[o.ceremony] ?? o.ceremony}</div>
                  <div className="mt-0.5 font-display text-lg text-royal-900">{o.title}</div>
                  {o.fabric && <div className="text-[12px] text-ink/55">{o.fabric}</div>}
                </div>
                <button onClick={() => remove(o.id)} aria-label="Supprimer" className="grid h-8 w-8 place-items-center rounded-full text-ink/40 transition hover:bg-rose-500/10 hover:text-rose-600">
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 4h10M6.5 4V3h3v1M5 4l.5 9h5L11 4" /></svg>
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <select value={o.status} onChange={(e) => setStatus(o, e.target.value as OutfitStatus)} className="rounded-full bg-bone px-3 py-1.5 text-[12px] outline-none ring-1 ring-ink/10">
                  {OUTFIT_STATUS_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                {o.cost > 0 && <span className="font-mono text-[12px] text-royal-900">{fmtFCFA(o.cost)} F</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Ndaxal() {
  const { toast } = useToast();
  const { data, refresh } = useApi<BridesmaidsResponse>('/api/bridesmaids');
  const list = useMemo(() => data?.bridesmaids ?? [], [data]);
  const stats = data?.stats;
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const reload = () => { invalidateCache('/api/bridesmaids'); void refresh(); };

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast('Indique un nom', 'error');
    try {
      await api('/api/bridesmaids', { method: 'POST', body: { name: name.trim(), cotisationAmount: parseInt(amount.replace(/\D/g, ''), 10) || 0 } });
      setName(''); setAmount(''); reload();
    } catch { toast('Ajout impossible', 'error'); }
  }
  async function patch(b: Bridesmaid, body: Partial<Bridesmaid>) {
    try { await api(`/api/bridesmaids/${b.id}`, { method: 'PATCH', body }); reload(); } catch { toast('Action impossible', 'error'); }
  }
  async function remove(id: string) {
    try { await api(`/api/bridesmaids/${id}`, { method: 'DELETE' }); reload(); } catch { toast('Suppression impossible', 'error'); }
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl text-royal-900">Groupe ndaxal</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Demoiselles" value={String(stats?.total ?? 0)} />
        <Stat label="Mensurations" value={`${stats?.measurementsDone ?? 0}/${stats?.total ?? 0}`} />
        <Stat label="Cotisations" value={`${stats?.paid ?? 0}/${stats?.total ?? 0}`} sub="payées" />
        <Stat label="Collecté" value={`${fmtFCFA(stats?.collected ?? 0)} F`} />
      </div>
      <form onSubmit={add} className="grid gap-3 rounded-2xl bg-paper p-4 ring-1 ring-ink/5 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <label className="block"><span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Nom</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Awa Ndiaye" className="mt-1 w-full rounded-xl bg-bone px-3 py-2.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-gold-400" /></label>
        <label className="block"><span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Cotisation (F)</span>
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="25000" className="mt-1 w-32 rounded-xl bg-bone px-3 py-2.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-gold-400" /></label>
        <button type="submit" className="rounded-xl bg-royal-700 px-5 py-2.5 text-sm font-medium text-gold-50 transition hover:bg-royal-800">Ajouter</button>
      </form>
      {list.length === 0 ? (
        <div className="rounded-2xl bg-paper p-8 text-center text-sm text-ink/55 ring-1 ring-ink/5">Ajoute tes demoiselles d&apos;honneur pour suivre mensurations et cotisations.</div>
      ) : (
        <ul className="space-y-2">
          {list.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-paper px-4 py-3 ring-1 ring-ink/5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-royal-900">{b.name}</div>
                <div className="font-mono text-[11px] text-ink/50">{b.cotisationAmount > 0 ? fmtFCFA(b.cotisationAmount) + ' F' : '—'}</div>
              </div>
              <button onClick={() => patch(b, { measurementsDone: !b.measurementsDone })} className={'rounded-full px-3 py-1.5 text-[12px] font-medium ring-1 ' + (b.measurementsDone ? 'bg-royal-700/10 text-royal-800 ring-royal-700/20' : 'bg-bone text-ink/55 ring-ink/10')}>
                {b.measurementsDone ? '✓ mensurations' : 'mensurations'}
              </button>
              <button onClick={() => patch(b, { cotisationPaid: !b.cotisationPaid })} className={'rounded-full px-3 py-1.5 text-[12px] font-medium ring-1 ' + (b.cotisationPaid ? 'bg-emerald-500/12 text-emerald-700 ring-emerald-600/20' : 'bg-bone text-ink/55 ring-ink/10')}>
                {b.cotisationPaid ? '✓ payé' : 'en attente'}
              </button>
              <button onClick={() => remove(b.id)} aria-label="Supprimer" className="grid h-8 w-8 place-items-center rounded-full text-ink/40 transition hover:bg-rose-500/10 hover:text-rose-600">
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 4h10M6.5 4V3h3v1M5 4l.5 9h5L11 4" /></svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function TenuesPage() {
  const user = useUser('/login');
  if (!user) return <Spinner />;
  return (
    <AppShell user={{ fullName: user.email.split('@')[0] ?? 'Mariée' }} topbarSubtitle="Vue d'ensemble › Sama Tenues" topbarTitle="Sama Tenues">
      <div className="space-y-8">
        <section>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Module Tenues · coordination ndaxal</div>
          <h1 className="mt-2 font-display text-3xl leading-tight text-royal-900 sm:text-4xl">Tes tenues, ton <em className="not-italic gold-shine">ndaxal</em>.</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-ink/65">Tes looks par cérémonie + le groupe coordonné de tes demoiselles d&apos;honneur. Une seule interface.</p>
        </section>
        <Looks />
        <Ndaxal />
      </div>
    </AppShell>
  );
}
