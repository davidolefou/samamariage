'use client';

import { useMemo, useState } from 'react';
import { useUser } from '@/contexts/AuthContext';
import { useApi, invalidateCache } from '@/lib/useApi';
import { api } from '@/lib/api';
import AppShell from '@/components/app/AppShell';
import { useToast } from '@/contexts/ToastContext';
import { type SereniteResponse, MOOD_FACES, MOOD_LABELS } from '@/lib/serenite';
import { fmtDate } from '@/lib/ndawtal';

export const dynamic = 'force-static';

function Spinner() {
  return <main className="grid min-h-screen place-items-center bg-bone"><span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" /></main>;
}

function SereniteContent() {
  const { toast } = useToast();
  const { data, refresh } = useApi<SereniteResponse>('/api/serenite');
  const checkins = useMemo(() => data?.checkins ?? [], [data]);
  const [score, setScore] = useState(3);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const reload = () => { invalidateCache('/api/serenite'); void refresh(); };

  async function save() {
    setSaving(true);
    try {
      await api('/api/serenite', { method: 'POST', body: { score, note: note.trim() } });
      setNote('');
      toast('Humeur enregistrée 🌸', 'success');
      reload();
    } catch { toast('Enregistrement impossible', 'error'); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Module Sérénité</div>
        <h1 className="mt-2 font-display text-3xl leading-tight text-royal-900 sm:text-4xl">Ta <em className="not-italic gold-shine">sérénité</em>, d&apos;abord.</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink/65">Organiser un mariage, c&apos;est intense. Prends un instant pour toi chaque jour.</p>
      </section>

      {/* Check-in */}
      <section className="rounded-3xl bg-gradient-to-br from-royal-800 to-royal-900 p-6 text-gold-50 shadow-glow ring-1 ring-royal-900/30">
        <div className="font-mono text-[10px] uppercase tracking-widest text-gold-100/70">Comment te sens-tu aujourd&apos;hui ?</div>
        <div className="mt-4 flex items-center justify-between gap-2">
          {MOOD_FACES.map((face, i) => {
            const v = i + 1;
            return (
              <button key={v} onClick={() => setScore(v)} aria-label={MOOD_LABELS[i]} className={'flex flex-1 flex-col items-center gap-1 rounded-2xl py-3 transition ' + (score === v ? 'bg-white/15 ring-1 ring-gold-400/40' : 'hover:bg-white/8')}>
                <span className="text-3xl">{face}</span>
                <span className="text-[10px] text-gold-100/70">{MOOD_LABELS[i]}</span>
              </button>
            );
          })}
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Une pensée du jour (optionnel)…" className="mt-4 w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-gold-50 outline-none ring-1 ring-white/15 placeholder:text-gold-100/40" />
        <button onClick={save} disabled={saving} className="mt-3 rounded-full bg-gold-400 px-5 py-2.5 text-[14px] font-semibold text-bordeaux-900 transition hover:bg-gold-200 disabled:opacity-60">{saving ? 'Enregistrement…' : 'Enregistrer mon humeur'}</button>
      </section>

      {/* Carte respiration + chat bientôt */}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl bg-paper p-5 ring-1 ring-ink/5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-royal-50 text-xl">🌬️</div>
          <div className="mt-3 font-display text-lg text-royal-900">Respiration 4-7-8</div>
          <p className="mt-1 text-[13px] leading-relaxed text-ink/65">Inspire 4s, retiens 7s, expire 8s. Répète 4 fois. Idéal avant de dormir ou quand le stress monte.</p>
        </section>
        <section className="rounded-2xl bg-paper p-5 ring-1 ring-ink/5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-bordeaux/10 text-xl">💬</div>
          <div className="mt-3 font-display text-lg text-royal-900">Coach Sama</div>
          <p className="mt-1 text-[13px] leading-relaxed text-ink/65">Un coach bien-être IA pour parler de ton stress, à toute heure.</p>
          <button onClick={() => toast('Le coach IA arrive bientôt 💬', 'info')} className="mt-3 rounded-full bg-bone px-4 py-2 text-[13px] font-medium text-royal-900 ring-1 ring-ink/10 transition hover:bg-royal-50">Bientôt</button>
        </section>
      </div>

      {/* Historique */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-royal-900">Ton journal d&apos;humeur</h2>
          {data && data.average > 0 && <span className="text-[13px] text-ink/55">Moyenne : <span className="font-display text-lg text-royal-900">{data.average}</span>/5</span>}
        </div>
        {checkins.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-paper p-8 text-center text-sm text-ink/55 ring-1 ring-ink/5">Aucune entrée pour l&apos;instant. Ton premier check-in t&apos;attend ci-dessus.</div>
        ) : (
          <ul className="mt-3 space-y-2">
            {checkins.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3 ring-1 ring-ink/5">
                <span className="text-2xl">{MOOD_FACES[c.score - 1]}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-royal-900">{MOOD_LABELS[c.score - 1]}</div>
                  {c.note && <div className="truncate text-[12px] text-ink/55">{c.note}</div>}
                </div>
                <span className="font-mono text-[11px] text-ink/45">{fmtDate(c.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function SerenitePage() {
  const user = useUser('/login');
  if (!user) return <Spinner />;
  return (
    <AppShell user={{ fullName: user.email.split('@')[0] ?? 'Mariée' }} topbarSubtitle="Vue d'ensemble › Sama Sérénité" topbarTitle="Sama Sérénité">
      <SereniteContent />
    </AppShell>
  );
}
