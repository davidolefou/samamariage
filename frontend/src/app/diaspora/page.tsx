'use client';

// SamaMariage — Mode Diaspora (/diaspora).
// Pilotage du mariage à distance : journal vidéo terrain, audit financier
// tracé, logistique retour, coordinatrice à Dakar, carte des proches, garanties.
// Page de présentation (pas encore de backend diaspora) — contenu illustratif
// fidèle au design, personnalisé sur le profil Wedding réel quand dispo.

import { useUser } from '@/contexts/AuthContext';
import { useApi } from '@/lib/useApi';
import { useToast } from '@/contexts/ToastContext';
import AppShell, { type ShellUser } from '@/components/app/AppShell';
import {
  type WeddingResponse,
  type Wedding,
  countdownLabel,
  weddingDateLabel,
  cityLabel,
  prepProgress,
} from '@/lib/wedding';

export const dynamic = 'force-static';

const SCOPED_CSS = `
.dia-globe-pin{animation:dia-pulse 2.4s ease-out infinite;}
@keyframes dia-pulse{0%{transform:scale(.9);opacity:1;}100%{transform:scale(2.6);opacity:0;}}
.dia-vid{transition:transform .25s,box-shadow .25s;}
.dia-vid:hover{transform:translateY(-2px);box-shadow:0 18px 38px -16px rgba(114,47,55,.45);}
.dia-vid .dia-play{transition:transform .2s,background .2s;}
.dia-vid:hover .dia-play{transform:translate(-50%,-50%) scale(1.1);background:#D4A574;color:#3D181C;}
.dia-blink{animation:dia-blink 2s ease-in-out infinite;}
@keyframes dia-blink{0%,100%{opacity:1;}50%{opacity:.35;}}
.dia-coord{animation:dia-glow 2.6s ease-out infinite;}
@keyframes dia-glow{0%,100%{box-shadow:0 0 0 0 rgba(212,165,116,.4);}50%{box-shadow:0 0 0 6px rgba(212,165,116,0);}}
`;

const VIDEOS = [
  { bg: 'from-royal-700 via-royal-800 to-gold-600', dur: '90s', title: 'Visite finale du Royal Saly', meta: 'hier · 21:47 GMT · Khady' },
  { bg: 'from-gold-400 via-bordeaux to-bordeaux-900', dur: '2:14', title: 'Essayage groupe ndaxal', meta: 'samedi · 11:30 · Tonton Modou' },
  { bg: 'from-bordeaux via-bordeaux-900 to-royal-900', dur: '1:18', title: 'Dégustation menu Le Carré', meta: 'vendredi · 19:00 · Khady' },
  { bg: 'from-gold-600 to-bordeaux', dur: '90s', title: 'Maman Diop bénit les bagues', meta: 'jeudi · 18:22 · famille' },
];

const TRANSFERS = [
  { label: 'Acompte traiteur Le Carré', when: '12 mai 14:08 GMT', who: 'Khady (coordinatrice)', via: '🌊 Wave', cls: 'bg-[#21B3E8]/12 text-[#1873A9]', amount: '950 000 F' },
  { label: 'Adams Sidibé · acompte photo', when: '09 mai 16:30 GMT', who: 'Adams Sidibé Studio', via: '🟠 OM', cls: 'bg-[#FF7B00]/15 text-[#C25F00]', amount: '425 000 F' },
  { label: 'Tissu bazin (Sandaga)', when: '08 mai 11:12 GMT', who: 'Tonton Modou Diop', via: '💵 cash · Khady', cls: 'bg-royal-700/10 text-royal-800', amount: '220 000 F' },
  { label: 'Acompte floral Aida Décor', when: '30 avr 18:45 GMT', who: 'Aida Décor', via: '🌊 Wave', cls: 'bg-[#21B3E8]/12 text-[#1873A9]', amount: '400 000 F' },
  { label: 'Acompte 50% lieu Royal Saly', when: '22 mars 09:30 GMT', who: 'Hôtel Royal Saly', via: '🏦 Virement', cls: 'bg-gold-400/18 text-gold-600', amount: '1 680 000 F' },
];

const GUARANTEES = [
  { icon: '🛡', t: 'Caution coordinatrice 500k F.', d: 'Versée à Sama, libérée le jour J.' },
  { icon: '📷', t: 'Reçu photo obligatoire', d: 'sous 24h pour tout paiement.' },
  { icon: '🔒', t: 'Audit IA hebdo.', d: 'Sama détecte les écarts anormaux automatiquement.' },
  { icon: '🎥', t: '90 secondes par soir.', d: 'Vidéo de Khady, garantie.' },
];

function DiasporaContent({ wedding }: { wedding: Wedding | null }) {
  const { toast } = useToast();
  const city = wedding ? cityLabel(wedding) : 'Dakar';
  const cdown = wedding ? countdownLabel(wedding) : 'J-216';

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: SCOPED_CSS }} />

      {/* HERO */}
      <section className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">
            Mode Diaspora · pilotage à distance
          </div>
          <h1 className="mt-2 font-display text-3xl leading-tight text-royal-900 sm:text-4xl lg:text-5xl">
            Paris → <em className="gold-shine not-italic">{city}</em>.<br />
            5 642 km de confiance.
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-ink/65">
            Pilote ton mariage à {city} depuis ton smartphone. Transparence financière totale, vidéos quotidiennes,
            coordinatrice certifiée sur place. Plus jamais «&nbsp;il a perdu le reçu&nbsp;».
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-paper px-3 py-1 text-[12px] font-medium text-royal-900 ring-1 ring-ink/10">🇫🇷 Paris 18ᵉ</span>
            <span className="text-ink/40">→</span>
            <span className="rounded-full bg-paper px-3 py-1 text-[12px] font-medium text-royal-900 ring-1 ring-ink/10">🇸🇳 {city} · Saly</span>
            <span className="ml-2 rounded-full bg-gold-50 px-3 py-1 text-[12px] font-medium text-gold-600">2h GMT décalage</span>
          </div>
        </div>
        <button
          onClick={() => toast('Groupe WhatsApp diaspora ouvert 🌍', 'info')}
          className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2.5 text-[13px] font-medium text-royal-900 ring-1 ring-ink/10 transition hover:bg-bone"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#25D366]" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2z" />
          </svg>
          Group WhatsApp diaspora
        </button>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bordeaux to-bordeaux-900 p-5 text-gold-50 shadow-glow">
          <div className="wax-bg-bordeaux absolute inset-0 opacity-30" />
          <div className="relative">
            <div className="font-mono text-[10px] uppercase tracking-widest text-gold-400">Vidéos reçues</div>
            <div className="mt-3 font-display text-3xl">47</div>
            <div className="mt-1 text-[11px] text-gold-100/65">+ 1 hier soir 21h47</div>
          </div>
        </div>
        <div className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">Transferts</div>
          <div className="mt-3 font-display text-3xl text-royal-900">
            4,2M<span className="text-base text-ink/55">F</span>
          </div>
          <div className="mt-1 text-[11px] text-ink/55">via Wave · 0,5% frais</div>
        </div>
        <div className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">Reçus photo</div>
          <div className="mt-3 font-display text-3xl text-royal-900">
            23<span className="text-base text-ink/35">/23</span>
          </div>
          <div className="mt-1 text-[11px] text-ink/55">100% audités IA · ✓</div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-royal-700 to-royal-900 p-5 text-gold-50">
          <div className="wax-bg-bordeaux absolute inset-0 opacity-30" />
          <div className="relative">
            <div className="font-mono text-[10px] uppercase tracking-widest text-gold-400">Voyage retour</div>
            <div className="mt-3 font-display text-3xl">J–8</div>
            <div className="mt-1 text-[11px] text-gold-100/65">vol AF734 réservé</div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-5">
          {/* Journal vidéo */}
          <article className="overflow-hidden rounded-2xl bg-paper shadow-card ring-1 ring-ink/5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/5 px-5 py-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">Vidéos terrain · {city}</div>
                <h3 className="font-display text-xl text-royal-900">Tous les soirs, 90 secondes.</h3>
              </div>
              <span className="rounded-lg bg-bone/60 px-3 py-1.5 text-sm ring-1 ring-ink/8">Cette semaine</span>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {VIDEOS.map((v) => (
                <button
                  key={v.title}
                  onClick={() => toast('Vidéo ouverte · lecture sur ton mobile recommandée', 'info')}
                  className="dia-vid group relative overflow-hidden rounded-2xl text-left ring-1 ring-ink/5"
                >
                  <div className={`relative aspect-[16/10] bg-gradient-to-br ${v.bg}`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-royal-900/80 to-transparent" />
                    <span className="dia-play absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/92 text-bordeaux">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur">
                      {v.dur}
                    </div>
                    <div className="absolute inset-x-3 bottom-2.5 text-white">
                      <div className="font-display text-lg leading-tight">{v.title}</div>
                      <div className="font-mono text-[11px] text-white/75">{v.meta}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </article>

          {/* Audit financier */}
          <article className="overflow-hidden rounded-2xl bg-paper shadow-card ring-1 ring-ink/5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/5 px-5 py-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">Audit financier · 100% tracé</div>
                <h3 className="font-display text-xl text-royal-900">Chaque franc, prouvé.</h3>
              </div>
              <button
                onClick={() => toast('Nouveau transfert Wave initié — confirmation par WhatsApp', 'info')}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-bordeaux to-bordeaux-900 px-4 py-2 text-[12px] font-medium text-gold-50 transition hover:opacity-90"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                  <path d="M3 11l18-8-8 18-2-8-8-2z" />
                </svg>
                Nouveau transfert
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bone/40 font-mono text-[10px] uppercase tracking-widest text-ink/55">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Transfert</th>
                    <th className="px-2 py-3 text-left font-medium">Bénéficiaire</th>
                    <th className="hidden px-2 py-3 text-center font-medium sm:table-cell">Moyen</th>
                    <th className="px-2 py-3 text-right font-medium">Montant</th>
                    <th className="hidden px-2 py-3 text-center font-medium md:table-cell">Reçu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {TRANSFERS.map((t) => (
                    <tr key={t.label} className="transition hover:bg-bone/60">
                      <td className="px-5 py-3">
                        <div className="text-sm font-medium text-royal-900">{t.label}</div>
                        <div className="font-mono text-[11px] text-ink/55">{t.when}</div>
                      </td>
                      <td className="px-2 py-3 text-[13px]">{t.who}</td>
                      <td className="hidden px-2 py-3 text-center sm:table-cell">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${t.cls}`}>{t.via}</span>
                      </td>
                      <td className="px-2 py-3 text-right">
                        <span className="font-mono font-medium text-royal-900">{t.amount}</span>
                      </td>
                      <td className="hidden px-2 py-3 text-center md:table-cell">
                        <button
                          onClick={() => toast('Reçu photo ouvert 📷', 'info')}
                          className="inline-grid h-6 w-6 place-items-center rounded-full bg-royal-50 text-royal-700 transition hover:bg-royal-100"
                        >
                          📷
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/5 bg-bone/30 px-5 py-3 text-[12px]">
              <div className="text-ink/55">
                Total transféré : <strong className="font-mono text-royal-900">4 200 000 F</strong> · frais Wave 21 000 F (0,5%)
              </div>
              <button onClick={() => toast('Export PDF de l’audit lancé', 'info')} className="font-medium text-bordeaux hover:underline">
                Exporter PDF audit complet →
              </button>
            </div>
          </article>

          {/* Logistique retour */}
          <article className="overflow-hidden rounded-2xl bg-paper shadow-card ring-1 ring-ink/5">
            <div className="border-b border-ink/5 px-5 py-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">Logistique retour</div>
              <h3 className="font-display text-xl text-royal-900">Ton arrivée à {city}</h3>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-3">
              {[
                { k: 'Vol', a: 'AF 734 · CDG → DSS', b: '07 déc · 11h45 → 17h10' },
                { k: 'Hébergement', a: 'Almadies (famille)', b: '7 nuits · transport organisé' },
                { k: 'Bagages', a: '2 × 32 kg', b: 'faire-part + accessoires Khady' },
              ].map((c) => (
                <div key={c.k} className="rounded-xl bg-bone/60 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">{c.k}</div>
                  <div className="mt-1 font-display text-base text-royal-900">{c.a}</div>
                  <div className="mt-1 text-[12px] text-ink/55">{c.b}</div>
                </div>
              ))}
            </div>
          </article>
        </div>

        {/* Colonne droite */}
        <aside className="h-fit space-y-3 lg:sticky lg:top-20">
          {/* Coordinatrice */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bordeaux to-bordeaux-900 p-5 text-gold-50 shadow-glow">
            <div className="wax-bg-bordeaux absolute inset-0 opacity-30" />
            <div className="relative">
              <div className="font-mono text-[10px] uppercase tracking-widest text-gold-400">Ta coordinatrice à {city}</div>
              <div className="mt-3 flex items-center gap-3">
                <div className="dia-coord grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-bordeaux font-display text-xl text-white ring-2 ring-gold-400/50">
                  KS
                </div>
                <div>
                  <div className="font-display text-xl">Khady Sarr</div>
                  <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-gold-100/75">
                    <span className="dia-blink h-1.5 w-1.5 rounded-full bg-gold-400" />
                    en ligne · 14:32
                  </div>
                </div>
              </div>
              <ul className="mt-4 space-y-1.5 text-[12px] text-gold-100/85">
                <li>📍 Mermoz, Dakar · 30 min Saly</li>
                <li>⭐ 4.9/5 · 84 mariages diaspora coordonnés</li>
                <li>🗣 Wolof · français · anglais</li>
                <li>🛡 Certifiée Sama · caution 500k F</li>
              </ul>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <button onClick={() => toast('WhatsApp Khady ouvert 💬', 'info')} className="rounded-xl bg-[#25D366] py-2 text-center text-[12px] font-medium text-white transition hover:opacity-90">
                  💬 WhatsApp
                </button>
                <button onClick={() => toast('Appel lancé avec Khady · Dakar', 'info')} className="rounded-xl bg-white/10 py-2 text-center text-[12px] font-medium transition hover:bg-white/15">
                  📞 Appeler
                </button>
                <button onClick={() => toast('Appel vidéo lancé · Dakar 14:32', 'info')} className="rounded-xl bg-gold-400 py-2 text-center text-[12px] font-medium text-bordeaux-900 transition hover:bg-gold-200">
                  🎥 Vidéo
                </button>
              </div>
            </div>
          </div>

          {/* Mini-globe */}
          <div className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5">
            <h3 className="font-display text-lg text-royal-900">Tes proches dans le monde</h3>
            <div className="relative mx-auto mt-3 aspect-square max-w-[280px]">
              <div className="absolute inset-0 rounded-full border border-bordeaux/15" />
              <div className="absolute inset-5 rounded-full border border-bordeaux/10" />
              <div className="absolute inset-10 rounded-full border border-bordeaux/8" />
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_60%_40%,rgba(212,165,116,.2),transparent_60%)]" />
              {[
                { l: '18%', t: '35%', label: 'NY · 12', big: false, delay: '0s' },
                { l: '44%', t: '28%', label: 'Paris · toi', big: true, delay: '.4s' },
                { l: '52%', t: '42%', label: 'Milan · 8', big: false, delay: '.8s' },
                { l: '38%', t: '60%', label: 'Dakar 🇸🇳', big: true, delay: '1.2s', gold: true },
              ].map((p) => (
                <div key={p.label} className="absolute" style={{ left: p.l, top: p.t }}>
                  <div className="relative">
                    <span className="dia-globe-pin absolute -inset-2 rounded-full bg-gold-400/30" style={{ animationDelay: p.delay }} />
                    <div
                      className={
                        'relative rounded-full ' +
                        (p.gold ? 'h-3.5 w-3.5 bg-royal-700 ring-2 ring-gold-400' : p.big ? 'h-3 w-3 bg-bordeaux ring-2 ring-bordeaux/30' : 'h-2.5 w-2.5 bg-gold-600')
                      }
                    />
                    <div className="absolute -top-1 left-4 whitespace-nowrap rounded-full bg-bordeaux/90 px-2 py-0.5 font-mono text-[10px] text-gold-50 backdrop-blur">
                      {p.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-center font-mono text-[11px] uppercase tracking-widest text-bordeaux">
              42 invités diaspora · 12 pays
            </div>
          </div>

          {/* Garanties */}
          <div className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5">
            <h3 className="font-display text-lg text-royal-900">Garanties Sama</h3>
            <ul className="mt-3 space-y-2.5 text-[13px]">
              {GUARANTEES.map((g) => (
                <li key={g.t} className="flex gap-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-royal-50 text-base text-royal-700">{g.icon}</span>
                  <div>
                    <strong className="text-royal-900">{g.t}</strong> {g.d}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <div className="py-6 text-center font-mono text-[11px] uppercase tracking-widest text-bordeaux">
        Sama Diaspora · ton mariage à {city}, depuis ton smartphone 🌍 · {cdown}
      </div>
    </div>
  );
}

export default function DiasporaPage() {
  const user = useUser('/login');
  const { data } = useApi<WeddingResponse>('/api/wedding', { skip: !user });

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-bone">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
      </main>
    );
  }

  const wedding = data?.wedding ?? null;
  const fallbackName = user.email.split('@')[0] ?? 'Mariée';
  const shellUser: ShellUser = wedding
    ? {
        fullName: wedding.fullName,
        prepProgress: prepProgress(wedding),
        countdownLabel: `${countdownLabel(wedding)} · ${weddingDateLabel(wedding)}`,
      }
    : { fullName: fallbackName };

  return (
    <AppShell user={shellUser} topbarSubtitle="Pilotage à distance" topbarTitle="Mode Diaspora 🌍">
      <DiasporaContent wedding={wedding} />
    </AppShell>
  );
}
