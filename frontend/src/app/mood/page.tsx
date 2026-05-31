'use client';

import { useMemo, useRef, useState } from 'react';
import { useUser } from '@/contexts/AuthContext';
import { useApi, invalidateCache } from '@/lib/useApi';
import { api } from '@/lib/api';
import AppShell from '@/components/app/AppShell';
import { useToast } from '@/contexts/ToastContext';
import { type MoodResponse } from '@/lib/mood';

export const dynamic = 'force-static';

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
  const reload = () => { invalidateCache('/api/mood'); void refresh(); };

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
      </section>

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
