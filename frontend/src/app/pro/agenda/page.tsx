'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/AuthContext';
import { useApi, invalidateCache } from '@/lib/useApi';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import ProShell from '@/components/pro/ProShell';
import { type VendorResponse, CATEGORY_LABELS } from '@/lib/vendor';
import { type AgendaResponse, type AgendaBooking, MONTHS_FR, MONTHS_FR_SHORT } from '@/lib/agenda';

export const dynamic = 'force-static';

function Spinner() {
  return (
    <main className="grid min-h-screen place-items-center bg-bone">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
    </main>
  );
}

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function AgendaContent() {
  const { toast } = useToast();
  const { data, refresh } = useApi<AgendaResponse>('/api/pro/agenda');
  const [cur, setCur] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });

  const bookings = useMemo(() => {
    const map = new Map<string, AgendaBooking>();
    (data?.bookings ?? []).forEach((b) => map.set(b.date, b));
    return map;
  }, [data]);
  const blocks = useMemo(() => new Set(data?.blocks ?? []), [data]);

  function reload() {
    invalidateCache('/api/pro/agenda');
    void refresh();
  }

  async function toggle(k: string) {
    const booking = bookings.get(k);
    if (booking) {
      toast(`Réservé : ${booking.coupleName}${booking.city ? ' · ' + booking.city : ''}`, 'info');
      return;
    }
    try {
      const res = await api<{ blocked: boolean }>('/api/pro/agenda', { method: 'POST', body: { date: k } });
      toast(res.blocked ? 'Date bloquée — vous n’apparaîtrez pas comme dispo 🔒' : 'Date rouverte', 'info');
      reload();
    } catch {
      toast('Action impossible', 'error');
    }
  }

  // Grille du mois (lundi en premier).
  const first = new Date(Date.UTC(cur.y, cur.m, 1));
  const startDow = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(cur.y, cur.m + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(startDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const prev = () => setCur((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }));
  const nextM = () => setCur((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }));

  const upcoming = data?.bookings ?? [];

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Planning</div>
          <h1 className="mt-2 font-display text-3xl text-royal-900 sm:text-4xl">Mon <em className="not-italic gold-shine">agenda</em></h1>
          <p className="mt-2 max-w-2xl text-[15px] text-ink/65">Vos mariages réservés et vos disponibilités. Touchez une date libre pour la bloquer.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-paper px-4 py-2.5 text-center shadow-card ring-1 ring-ink/8">
            <div className="font-display text-2xl text-royal-900">{upcoming.length}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">réservés</div>
          </div>
          <div className="rounded-2xl bg-paper px-4 py-2.5 text-center shadow-card ring-1 ring-ink/8">
            <div className="font-display text-2xl text-bordeaux">{blocks.size}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">bloqués</div>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Calendrier */}
        <section className="rounded-3xl bg-paper p-5 shadow-card ring-1 ring-ink/5 sm:p-6">
          <div className="flex items-center justify-between">
            <button onClick={prev} aria-label="Mois précédent" className="grid h-9 w-9 place-items-center rounded-full bg-bone transition hover:bg-royal-50">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <div className="font-display text-xl text-royal-900">{MONTHS_FR[cur.m]} {cur.y}</div>
            <button onClick={nextM} aria-label="Mois suivant" className="grid h-9 w-9 place-items-center rounded-full bg-bone transition hover:bg-royal-50">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1.5 text-center font-mono text-[10px] uppercase tracking-widest text-ink/40">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1.5">
            {cells.map((d, i) => {
              if (d === null) return <div key={'e' + i} />;
              const k = iso(cur.y, cur.m, d);
              const booked = bookings.has(k);
              const blkd = blocks.has(k);
              const cls = booked
                ? 'bg-royal-700 text-gold-100'
                : blkd
                  ? 'text-bordeaux ring-1 ring-bordeaux/20 [background:repeating-linear-gradient(45deg,#F5EAEB,#F5EAEB_4px,#fff_4px,#fff_8px)]'
                  : 'bg-bone text-ink/70 hover:bg-royal-50';
              return (
                <button key={k} onClick={() => toggle(k)} title={bookings.get(k)?.coupleName ?? ''}
                  className={'flex aspect-square flex-col items-center justify-center rounded-xl text-[13px] font-medium transition ' + cls}>
                  <span>{d}</span>
                  {booked && <span className="mt-0.5 h-1 w-1 rounded-full bg-current opacity-70" />}
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-[12px] text-ink/60">
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-royal-700" />Réservé</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded ring-1 ring-bordeaux/20 [background:repeating-linear-gradient(45deg,#F5EAEB,#F5EAEB_2px,#fff_2px,#fff_4px)]" />Bloqué</span>
          </div>
        </section>

        {/* À venir */}
        <section>
          <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">À venir</div>
          <h2 className="mt-1 font-display text-2xl text-royal-900">Prochains mariages</h2>
          <div className="mt-3 space-y-3">
            {upcoming.length === 0 ? (
              <div className="rounded-2xl bg-paper p-6 text-center text-sm text-ink/55 ring-1 ring-ink/5">
                Aucune réservation confirmée. Les devis acceptés par les mariées apparaîtront ici.
              </div>
            ) : (
              upcoming.map((u) => {
                const dt = new Date(u.date + 'T00:00:00.000Z');
                return (
                  <div key={u.date + u.coupleName} className="flex items-center gap-3 rounded-2xl bg-paper p-3.5 shadow-card ring-1 ring-ink/5">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-royal-700 text-center leading-none text-gold-100">
                      <div>
                        <div className="font-display text-lg">{String(dt.getUTCDate()).padStart(2, '0')}</div>
                        <div className="font-mono text-[9px] uppercase">{MONTHS_FR_SHORT[dt.getUTCMonth()]}</div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-royal-900">{u.coupleName || 'Mariée'}</div>
                      <div className="truncate text-[12px] text-ink/55">{u.city || '—'}</div>
                    </div>
                    <span className="rounded-full bg-royal-700/10 px-2.5 py-1 text-[11px] font-medium text-royal-800">✓ Confirmé</span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ProAgendaPage() {
  const user = useUser('/pro/login');
  const router = useRouter();
  const { data: vendorData, loading, error } = useApi<VendorResponse>('/api/vendor', { skip: !user });

  useEffect(() => {
    if (user && !loading && vendorData && vendorData.vendor === null) router.push('/pro/onboarding');
  }, [user, loading, vendorData, router]);

  if (!user || loading || !vendorData || error || !vendorData.vendor) return <Spinner />;
  const v = vendorData.vendor;

  return (
    <ProShell breadcrumb="Mon agenda" vendor={{ businessName: v.businessName, categoryLabel: CATEGORY_LABELS[v.category], verified: v.verified }}>
      <AgendaContent />
    </ProShell>
  );
}
