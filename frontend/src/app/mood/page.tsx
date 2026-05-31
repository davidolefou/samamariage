'use client';

import { useMemo, useRef, useState } from 'react';
import { useUser } from '@/contexts/AuthContext';
import { useApi, invalidateCache } from '@/lib/useApi';
import { api, ApiError } from '@/lib/api';
import AppShell from '@/components/app/AppShell';
import { useToast } from '@/contexts/ToastContext';
import { type MoodResponse } from '@/lib/mood';

export const dynamic = 'force-static';

interface Concept {
  theme: string;
  palette: { name: string; hex: string }[];
  ideas: string[];
}

const COOKIE_PREFIX = process.env.NEXT_PUBLIC_COOKIE_PREFIX || 'app';
function csrf(): string {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_PREFIX}-csrf=([^;]*)`));
  return m && m[1] ? decodeURIComponent(m[1]) : '';
}

function Spinner() {
  return <main className="grid min-h-screen place-items-center bg-bone"><span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" /></main>;
}

function MoodContent() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, refresh } = useApi<MoodResponse>('/api/mood');
  const items = useMemo(() => data?.items ?? [], [data]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [concept, setConcept] = useState<Concept | null>(null);
  const [genBusy, setGenBusy] = useState(false);
  const reload = () => { invalidateCache('/api/mood'); void refresh(); };

  async function suggest() {
    if (genBusy) return;
    setGenBusy(true);
    try {
      const res = await api<{ ok: boolean; concept: Concept }>('/api/mood/suggest', { method: 'POST', body: {} });
      setConcept(res.concept);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      toast(
        code === 'AI_NOT_CONFIGURED'
          ? "L'IA n'est pas encore activée"
          : code === 'AI_RATE_LIMITED'
            ? 'Limite IA quotidienne atteinte'
            : 'Génération impossible',
        'error',
      );
    } finally {
      setGenBusy(false);
    }
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include', headers: { 'x-csrf-token': csrf() } });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { code?: string };
        toast(j.code === 'STORAGE_NOT_CONFIGURED' ? 'Stockage non configuré (Cloudinary).' : 'Upload impossible', 'error');
        return;
      }
      const { url } = (await res.json()) as { url: string };
      await api('/api/mood', { method: 'POST', body: { imageUrl: url, caption: caption.trim() } });
      setCaption('');
      toast('Inspiration ajoutée 🌸', 'success');
      reload();
    } catch {
      toast('Ajout impossible', 'error');
    } finally {
      setUploading(false);
    }
  }
  async function remove(id: string) {
    try { await api(`/api/mood/${id}`, { method: 'DELETE' }); reload(); } catch { toast('Suppression impossible', 'error'); }
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Module Mood</div>
        <h1 className="mt-2 font-display text-3xl leading-tight text-royal-900 sm:text-4xl">Ton <em className="not-italic gold-shine">mood board</em>.</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink/65">Rassemble tes inspirations — déco, tenues, ambiances. Tout au même endroit.</p>
      </section>

      <section className="flex flex-wrap items-end gap-3 rounded-2xl bg-paper p-4 ring-1 ring-ink/5">
        <label className="block flex-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Légende (optionnelle)</span>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Arche florale royale…" className="mt-1 w-full rounded-xl bg-bone px-3 py-2.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-gold-400" />
        </label>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-xl bg-royal-700 px-5 py-2.5 text-sm font-medium text-gold-50 transition hover:bg-royal-800 disabled:opacity-60">
          {uploading ? 'Ajout…' : '+ Ajouter une image'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
        <button onClick={suggest} disabled={genBusy} className="rounded-xl bg-gradient-to-br from-bordeaux to-bordeaux-900 px-4 py-2.5 text-sm font-medium text-gold-50 transition hover:opacity-90 disabled:opacity-60">
          {genBusy ? 'Sama réfléchit…' : '✨ Idées Sama IA'}
        </button>
      </section>

      {/* Concept IA */}
      {concept && (
        <section className="rounded-2xl bg-gradient-to-br from-royal-50 to-gold-50 p-5 ring-1 ring-royal-700/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-royal-700">Concept Sama · direction artistique</div>
              <h3 className="mt-1 font-display text-2xl text-royal-900">{concept.theme}</h3>
            </div>
            <button onClick={() => setConcept(null)} aria-label="Fermer" className="grid h-8 w-8 place-items-center rounded-full text-ink/40 transition hover:bg-bordeaux/5 hover:text-bordeaux">
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg>
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {concept.palette.map((c) => (
              <div key={c.hex} className="flex items-center gap-2 rounded-full bg-paper py-1 pl-1 pr-3 ring-1 ring-ink/5">
                <span className="h-6 w-6 rounded-full ring-1 ring-ink/10" style={{ background: c.hex }} />
                <span className="text-[12px] text-ink/70">{c.name}</span>
                <span className="font-mono text-[10px] text-ink/40">{c.hex}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Idées — clique pour l’utiliser en légende</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {concept.ideas.map((idea) => (
                <button
                  key={idea}
                  onClick={() => { setCaption(idea); toast('Légende prête — ajoute une image 🌸', 'info'); }}
                  className="rounded-full bg-paper px-3 py-1.5 text-[13px] text-royal-900 ring-1 ring-royal-700/15 transition hover:bg-royal-700 hover:text-gold-50"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl bg-paper p-10 text-center ring-1 ring-ink/5">
          <p className="font-display text-lg text-royal-900">Ton mood board est vide</p>
          <p className="mt-1 text-sm text-ink/55">Ajoute tes premières inspirations pour donner le ton de ton mariage.</p>
        </div>
      ) : (
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
          {items.map((m) => (
            <div key={m.id} className="group relative break-inside-avoid overflow-hidden rounded-2xl ring-1 ring-ink/5">
              <img src={m.imageUrl} alt={m.caption} className="w-full object-cover" />
              {m.caption && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-royal-900/70 to-transparent p-3 text-[12px] text-gold-50">{m.caption}</div>}
              <button onClick={() => remove(m.id)} aria-label="Retirer" className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-bordeaux opacity-0 transition group-hover:opacity-100">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MoodPage() {
  const user = useUser('/login');
  if (!user) return <Spinner />;
  return (
    <AppShell user={{ fullName: user.email.split('@')[0] ?? 'Mariée' }} topbarSubtitle="Vue d'ensemble › Sama Mood" topbarTitle="Sama Mood">
      <MoodContent />
    </AppShell>
  );
}
