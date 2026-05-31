'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useUser } from '@/contexts/AuthContext';
import { useApi, invalidateCache } from '@/lib/useApi';
import { api } from '@/lib/api';
import AppShell from '@/components/app/AppShell';
import { useToast } from '@/contexts/ToastContext';
import { type BudgetResponse, type BudgetCategory } from '@/lib/budget';
import { fmtFCFA } from '@/lib/ndawtal';

export const dynamic = 'force-static';

function Spinner() {
  return <main className="grid min-h-screen place-items-center bg-bone"><span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" /></main>;
}

function BudgetContent() {
  const { toast } = useToast();
  const { data, refresh } = useApi<BudgetResponse>('/api/budget');
  const cats = useMemo(() => data?.categories ?? [], [data]);
  const t = data?.totals;
  const [name, setName] = useState('');
  const [allocated, setAllocated] = useState('');
  const reload = () => { invalidateCache('/api/budget'); void refresh(); };

  const overBudget = t ? t.allocated > t.budget && t.budget > 0 : false;
  const pctSpent = t && t.budget > 0 ? Math.min(100, Math.round((t.spent / t.budget) * 100)) : 0;

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast('Indique un nom', 'error');
    try {
      await api('/api/budget', { method: 'POST', body: { name: name.trim(), allocated: parseInt(allocated.replace(/\D/g, ''), 10) || 0 } });
      setName(''); setAllocated(''); reload();
    } catch { toast('Ajout impossible', 'error'); }
  }
  async function patch(c: BudgetCategory, body: Partial<BudgetCategory>) {
    try { await api(`/api/budget/${c.id}`, { method: 'PATCH', body }); reload(); } catch { toast('Action impossible', 'error'); }
  }
  async function remove(id: string) {
    try { await api(`/api/budget/${id}`, { method: 'DELETE' }); reload(); } catch { toast('Suppression impossible', 'error'); }
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Module Budget</div>
        <h1 className="mt-2 font-display text-3xl leading-tight text-royal-900 sm:text-4xl">Ton <em className="not-italic gold-shine">budget</em>, sous contrôle.</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink/65">Ventile ton enveloppe par poste et suis tes dépenses en temps réel.</p>
      </section>

      {/* Hero totals */}
      <section className="rounded-3xl bg-gradient-to-br from-royal-800 to-royal-900 p-6 text-gold-50 shadow-glow ring-1 ring-royal-900/30">
        <div className="font-mono text-[10px] uppercase tracking-widest text-gold-100/70">Enveloppe globale</div>
        <div className="mt-2 font-display text-5xl">{fmtFCFA(t?.budget ?? 0)} <span className="text-2xl text-gold-100/70">F</span></div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-200" style={{ width: pctSpent + '%' }} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div><div className="font-display text-xl">{fmtFCFA(t?.allocated ?? 0)}</div><div className="font-mono text-[10px] uppercase tracking-widest text-gold-100/60">Alloué</div></div>
          <div><div className="font-display text-xl">{fmtFCFA(t?.spent ?? 0)}</div><div className="font-mono text-[10px] uppercase tracking-widest text-gold-100/60">Dépensé</div></div>
          <div><div className="font-display text-xl">{fmtFCFA(t?.remaining ?? 0)}</div><div className="font-mono text-[10px] uppercase tracking-widest text-gold-100/60">Restant</div></div>
        </div>
        {overBudget && <div className="mt-3 rounded-xl bg-bordeaux/40 px-3 py-2 text-[12px] text-gold-50">⚠ Tes allocations dépassent l&apos;enveloppe globale.</div>}
      </section>

      <form onSubmit={add} className="grid gap-3 rounded-2xl bg-paper p-4 ring-1 ring-ink/5 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <label className="block"><span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Poste</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Traiteur, salle, photo…" className="mt-1 w-full rounded-xl bg-bone px-3 py-2.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-gold-400" /></label>
        <label className="block"><span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Alloué (F)</span>
          <input value={allocated} onChange={(e) => setAllocated(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="2600000" className="mt-1 w-36 rounded-xl bg-bone px-3 py-2.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-gold-400" /></label>
        <button type="submit" className="rounded-xl bg-royal-700 px-5 py-2.5 text-sm font-medium text-gold-50 transition hover:bg-royal-800">Ajouter</button>
      </form>

      {cats.length === 0 ? (
        <div className="rounded-2xl bg-paper p-8 text-center text-sm text-ink/55 ring-1 ring-ink/5">Crée tes postes de budget (traiteur, salle, tenues…) pour suivre tes dépenses.</div>
      ) : (
        <ul className="space-y-2">
          {cats.map((c) => {
            const pct = c.allocated > 0 ? Math.min(100, Math.round((c.spent / c.allocated) * 100)) : 0;
            const over = c.spent > c.allocated && c.allocated > 0;
            return (
              <li key={c.id} className="rounded-2xl bg-paper p-4 ring-1 ring-ink/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-royal-900">{c.icon ? c.icon + ' ' : ''}{c.name}</div>
                  <button onClick={() => remove(c.id)} aria-label="Supprimer" className="grid h-8 w-8 place-items-center rounded-full text-ink/40 transition hover:bg-rose-500/10 hover:text-rose-600">
                    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 4h10M6.5 4V3h3v1M5 4l.5 9h5L11 4" /></svg>
                  </button>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-bone">
                  <div className={'h-full rounded-full ' + (over ? 'bg-bordeaux' : 'bg-gradient-to-r from-royal-700 to-gold-400')} style={{ width: pct + '%' }} />
                </div>
                <div className="mt-2 flex items-center gap-3 text-[12px]">
                  <label className="flex items-center gap-1.5 text-ink/55">Dépensé
                    <input defaultValue={String(c.spent)} onBlur={(e) => { const v = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0; if (v !== c.spent) patch(c, { spent: v }); }} inputMode="numeric" className="w-24 rounded-lg bg-bone px-2 py-1 text-right font-mono outline-none ring-1 ring-ink/10 focus:ring-gold-400" />
                  </label>
                  <span className="text-ink/45">/ {fmtFCFA(c.allocated)} F alloué</span>
                  <span className={'ml-auto font-mono ' + (over ? 'text-bordeaux' : 'text-royal-900')}>{pct}%</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function BudgetPage() {
  const user = useUser('/login');
  if (!user) return <Spinner />;
  return (
    <AppShell user={{ fullName: user.email.split('@')[0] ?? 'Mariée' }} topbarSubtitle="Vue d'ensemble › Sama Budget" topbarTitle="Sama Budget">
      <BudgetContent />
    </AppShell>
  );
}
