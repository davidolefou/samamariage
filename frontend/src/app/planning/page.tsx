'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useUser } from '@/contexts/AuthContext';
import { useApi, invalidateCache } from '@/lib/useApi';
import { api } from '@/lib/api';
import AppShell from '@/components/app/AppShell';
import { useToast } from '@/contexts/ToastContext';
import { type PlanningResponse, type PlanningTask } from '@/lib/planning';

export const dynamic = 'force-static';

function Spinner() {
  return <main className="grid min-h-screen place-items-center bg-bone"><span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" /></main>;
}

function PlanningContent() {
  const { toast } = useToast();
  const { data, refresh } = useApi<PlanningResponse>('/api/planning');
  const tasks = useMemo(() => data?.tasks ?? [], [data]);
  const progress = data?.progress;
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState('');
  const reload = () => { invalidateCache('/api/planning'); void refresh(); };

  const groups = useMemo(() => {
    const m = new Map<string, PlanningTask[]>();
    tasks.forEach((t) => { const k = t.phase || 'Général'; if (!m.has(k)) m.set(k, []); m.get(k)!.push(t); });
    return [...m.entries()];
  }, [tasks]);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast('Indique une tâche', 'error');
    try {
      await api('/api/planning', { method: 'POST', body: { title: title.trim(), phase: phase.trim() || 'Général' } });
      setTitle(''); reload();
    } catch { toast('Ajout impossible', 'error'); }
  }
  async function toggle(t: PlanningTask) {
    try { await api(`/api/planning/${t.id}`, { method: 'PATCH', body: { done: !t.done } }); reload(); } catch { toast('Action impossible', 'error'); }
  }
  async function remove(id: string) {
    try { await api(`/api/planning/${id}`, { method: 'DELETE' }); reload(); } catch { toast('Suppression impossible', 'error'); }
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Module Planning</div>
        <h1 className="mt-2 font-display text-3xl leading-tight text-royal-900 sm:text-4xl">Ton <em className="not-italic gold-shine">rétroplanning</em>.</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink/65">Toutes tes tâches, par phase, jusqu&apos;au jour J. Coche au fur et à mesure.</p>
      </section>

      <section className="rounded-2xl bg-paper p-5 ring-1 ring-ink/5">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Avancement</div>
          <div className="font-display text-xl text-royal-900">{progress?.pct ?? 0}%</div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-bone">
          <div className="h-full rounded-full bg-gradient-to-r from-royal-700 to-gold-400 transition-[width] duration-700" style={{ width: (progress?.pct ?? 0) + '%' }} />
        </div>
        <div className="mt-1 font-mono text-[11px] text-ink/55">{progress?.done ?? 0} / {progress?.total ?? 0} tâches</div>
      </section>

      <form onSubmit={add} className="grid gap-3 rounded-2xl bg-paper p-4 ring-1 ring-ink/5 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <label className="block"><span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Tâche</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Réserver le traiteur" className="mt-1 w-full rounded-xl bg-bone px-3 py-2.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-gold-400" /></label>
        <label className="block"><span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Phase</span>
          <input value={phase} onChange={(e) => setPhase(e.target.value)} placeholder="12–9 mois" className="mt-1 w-36 rounded-xl bg-bone px-3 py-2.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-gold-400" /></label>
        <button type="submit" className="rounded-xl bg-royal-700 px-5 py-2.5 text-sm font-medium text-gold-50 transition hover:bg-royal-800">Ajouter</button>
      </form>

      {groups.length === 0 ? (
        <div className="rounded-2xl bg-paper p-8 text-center text-sm text-ink/55 ring-1 ring-ink/5">Ajoute tes tâches par phase pour bâtir ton rétroplanning.</div>
      ) : (
        <div className="space-y-5">
          {groups.map(([ph, items]) => (
            <section key={ph}>
              <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">{ph}</div>
              <ul className="mt-2 space-y-2">
                {items.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3 ring-1 ring-ink/5">
                    <button onClick={() => toggle(t)} aria-label={t.done ? 'Décocher' : 'Cocher'} className={'grid h-6 w-6 shrink-0 place-items-center rounded-lg transition ' + (t.done ? 'bg-royal-700 text-gold-100' : 'bg-bone ring-1 ring-ink/15 hover:ring-royal-700/40')}>
                      {t.done && <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m3 8 3 3 7-7" /></svg>}
                    </button>
                    <span className={'min-w-0 flex-1 text-sm ' + (t.done ? 'text-ink/40 line-through' : 'text-royal-900')}>{t.title}</span>
                    <button onClick={() => remove(t.id)} aria-label="Supprimer" className="grid h-8 w-8 place-items-center rounded-full text-ink/40 transition hover:bg-rose-500/10 hover:text-rose-600">
                      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 4h10M6.5 4V3h3v1M5 4l.5 9h5L11 4" /></svg>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlanningPage() {
  const user = useUser('/login');
  if (!user) return <Spinner />;
  return (
    <AppShell user={{ fullName: user.email.split('@')[0] ?? 'Mariée' }} topbarSubtitle="Vue d'ensemble › Sama Planning" topbarTitle="Sama Planning">
      <PlanningContent />
    </AppShell>
  );
}
