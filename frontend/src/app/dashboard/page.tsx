'use client';

import Link from 'next/link';
import { useUser } from '@/contexts/AuthContext';
import { useApi } from '@/lib/useApi';
import AppShell, { type ShellUser } from '@/components/app/AppShell';
import { useToast } from '@/contexts/ToastContext';
import {
  type WeddingResponse,
  type Wedding,
  fmtCompact,
  countdownLabel,
  weddingDateLabel,
  ceremonyList,
  cityLabel,
  styleLabel,
  daysUntil,
  prepProgress,
} from '@/lib/wedding';

export const dynamic = 'force-static';

function KpiCard({ label, value, sub, pct }: { label: string; value: string; sub: string; pct: number }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
      <div className="font-mono text-[10px] uppercase tracking-widest text-gold-400/90">{label}</div>
      <div className="mt-1.5 font-display text-2xl text-gold-50">{value}</div>
      <div className="mt-0.5 text-[11px] text-gold-100/70">{sub}</div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-200" style={{ width: pct + '%' }} />
      </div>
    </div>
  );
}

function ModuleCard({
  href,
  tag,
  title,
  desc,
  soon,
  onSoon,
}: {
  href: string;
  tag: string;
  title: string;
  desc: string;
  soon?: boolean;
  onSoon?: () => void;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40">{tag}</div>
        {soon && (
          <span className="rounded-full bg-ink/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink/40">
            Bientôt
          </span>
        )}
      </div>
      <h3 className="mt-2 font-display text-2xl text-royal-900">{title}</h3>
      <p className="mt-1.5 text-sm text-ink/65">{desc}</p>
    </>
  );
  const cls =
    'group block rounded-3xl bg-white p-6 text-left shadow-card ring-1 ring-ink/5 transition hover:-translate-y-0.5 hover:shadow-glow';
  if (soon) {
    return (
      <button type="button" onClick={onSoon} className={cls}>
        {inner}
      </button>
    );
  }
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

function DashboardContent({ wedding }: { wedding: Wedding }) {
  const { toast } = useToast();
  const d = daysUntil(wedding);
  const firstName = wedding.fullName.trim().split(/\s+/)[0] || 'mariée';
  const budgetLabel = wedding.budgetSkip ? '—' : `${fmtCompact(wedding.budget)} FCFA`;
  const cer = ceremonyList(wedding) || 'À définir';
  const cerCount = cer.split(' · ').filter(Boolean).length;
  const soon = (label: string) => toast(`${label} arrive bientôt 🌸`, 'info');

  return (
    <div className="space-y-6">
      {/* Hero KPI */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-royal-800 via-royal-700 to-royal-900 p-6 text-gold-50 sm:p-8">
        <div className="wax-bg-bordeaux absolute inset-0 opacity-25" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold-400/15 blur-3xl" />
        <div className="relative grid items-center gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold-400">Ton mariage en chiffres</div>
            <h2 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">
              {d !== null ? (
                <>
                  <span className="gold-shine">J–{d}</span> avant le grand jour.
                </>
              ) : (
                <span className="gold-shine">Ton aventure commence.</span>
              )}
            </h2>
            <p className="mt-3 max-w-sm text-sm text-gold-100/80">
              {cer} — {weddingDateLabel(wedding)}, {cityLabel(wedding)}.
              {wedding.styles[0] && <> Style : {styleLabel(wedding.styles[0])}.</>}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => soon('Le rétroplanning')}
                className="rounded-full bg-gold-400 px-4 py-2 text-sm font-medium text-bordeaux-900 transition hover:bg-gold-200"
              >
                Continuer mon organisation
              </button>
              <Link
                href="/ndawtal"
                className="rounded-full border border-gold-400/30 px-4 py-2 text-sm font-medium text-gold-50 transition hover:bg-white/10"
              >
                Ouvrir le Ndawtal
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:col-span-7 lg:grid-cols-4">
            <KpiCard
              label="Budget"
              value={budgetLabel}
              sub={wedding.budgetSkip ? 'non communiqué' : 'prévu'}
              pct={wedding.budgetSkip ? 0 : 35}
            />
            <KpiCard label="Invités" value={String(wedding.guests)} sub="prévus" pct={28} />
            <KpiCard label="Cérémonies" value={String(cerCount)} sub="planifiées" pct={cerCount * 20} />
            <KpiCard label="Ndaxal" value={String(wedding.bridesmaids)} sub="demoiselles" pct={40} />
          </div>
        </div>
      </section>

      {/* Cartes modules */}
      <section className="grid gap-5 md:grid-cols-2">
        {/* Ndawtal — mis en avant */}
        <Link
          href="/ndawtal"
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-bordeaux-900 via-bordeaux to-royal-900 p-6 text-gold-50 ring-1 ring-bordeaux-900 transition hover:-translate-y-0.5 hover:shadow-glow md:col-span-2"
        >
          <div className="calebasse absolute -right-8 -top-8 h-28 w-28 bg-gold-400/15 blur-xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-gold-400/90">
                Sama Ndawtal · ton ndawtal en temps réel
              </div>
              <div className="mt-2 font-display text-4xl">0 FCFA reçus</div>
              <p className="mt-1.5 max-w-md text-sm text-gold-100/80">
                {d !== null && d > 30
                  ? "Normal — tu n'es pas encore mariée 😊 Mais on prépare déjà le terrain : liste des contributeurs, obligations à rendre, tout est tracé."
                  : 'Le grand jour approche — active le mode jour J pour saisir les dons en 3 secondes.'}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-2.5 py-1 text-[10px] font-medium text-bordeaux">
              <span className="h-1 w-1 rounded-full bg-bordeaux" /> Mondial 1ʳᵉ
            </span>
          </div>
          <div className="relative mt-5 inline-flex items-center gap-2 text-sm font-medium text-gold-50">
            Configurer mon ndawtal
            <svg viewBox="0 0 20 20" className="h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 10h12M11 5l5 5-5 5" />
            </svg>
          </div>
        </Link>

        <ModuleCard href="/budget" tag="02 / Finances" title="Sama Budget" desc="Le contrôleur de gestion IA. Ventile ton enveloppe, alerte les dépassements." soon onSoon={() => soon('Sama Budget')} />
        <ModuleCard href="/planning" tag="03 / Temps" title="Sama Planning" desc="Rétroplanning intelligent ajusté à ta date et ton style." soon onSoon={() => soon('Sama Planning')} />
        <ModuleCard href="/mood" tag="01 / Inspiration" title="Sama Mood" desc="Le Pinterest IA qui devine ton style et génère ton mood board." soon onSoon={() => soon('Sama Mood')} />
        <ModuleCard href="/prestataires" tag="04 / Carnet" title="Sama Prestataires" desc="500+ pros vérifiés à Dakar, Thiès, Saly. Devis instantanés." soon onSoon={() => soon('Sama Prestataires')} />
        <ModuleCard href="/tenues" tag="06 / Style" title="Sama Tenues" desc={`Coordination de ton groupe ndaxal (${wedding.bridesmaids} amies).`} soon onSoon={() => soon('Sama Tenues')} />
        <ModuleCard href="/invites" tag="07 / Réception" title="Sama Invités" desc={`RSVP, relances WhatsApp et places à table pour tes ${wedding.guests} invités.`} />
      </section>

      {/* Coach IA */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-royal-900 to-bordeaux p-6 text-gold-50 sm:p-8">
        <div className="wax-bg-bordeaux absolute inset-0 opacity-20" />
        <div className="relative grid items-start gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-gold-400 to-bordeaux font-display text-2xl text-white">
                S
              </span>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-gold-400">Sama Coach · IA</div>
                <div className="font-display text-2xl">Bonjour {firstName}.</div>
              </div>
            </div>
            <p className="mt-3 text-sm text-gold-100/80">Voici tes 3 priorités du moment pour avancer sereinement.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:col-span-8">
            {[
              { t: 'Configure ton Ndawtal', d: 'Prépare la liste des contributeurs avant le jour J.' },
              { t: 'Bloque tes priorités', d: `Tu as choisi : ${wedding.priorities.length}/3 postes clés.` },
              { t: '4 min de respiration', d: 'Sama Sérénité veille sur ton mental.' },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <div className="font-display text-base">{c.t}</div>
                <p className="mt-1 text-[13px] text-gold-100/75">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  const user = useUser('/login');
  const { data, loading } = useApi<WeddingResponse>('/api/wedding', { skip: !user });

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-bone">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
      </main>
    );
  }

  const wedding = data?.wedding ?? null;
  const fallbackName = user.email.split('@')[0] ?? 'Mariée';

  // Onboarding pas complété → invite à le faire.
  if (!loading && data && !wedding) {
    const shellUser: ShellUser = { fullName: fallbackName };
    return (
      <AppShell user={shellUser} topbarTitle="Tableau de bord">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-card ring-1 ring-ink/5">
          <div className="text-5xl">💍</div>
          <h2 className="mt-4 font-display text-2xl text-royal-900">Bienvenue !</h2>
          <p className="mt-2 text-[15px] text-ink/70">
            Complète ton profil de mariage pour débloquer ton tableau de bord personnalisé.
          </p>
          <Link
            href="/onboarding"
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-royal-700 px-6 text-[15px] font-medium text-gold-50 shadow-cta transition hover:bg-royal-800"
          >
            Démarrer l&apos;onboarding
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 10h12M11 5l5 5-5 5" />
            </svg>
          </Link>
        </div>
      </AppShell>
    );
  }

  const shellUser: ShellUser = wedding
    ? {
        fullName: wedding.fullName,
        prepProgress: prepProgress(wedding),
        countdownLabel: `${countdownLabel(wedding)} · ${weddingDateLabel(wedding)}`,
      }
    : { fullName: fallbackName };

  return (
    <AppShell
      user={shellUser}
      {...(wedding ? { topbarSubtitle: weddingDateLabel(wedding) } : {})}
      topbarTitle={wedding ? `Bonjour ${wedding.fullName.split(' ')[0]} 👋` : 'Tableau de bord'}
    >
      {loading && !wedding ? (
        <div className="grid place-items-center py-32">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
        </div>
      ) : wedding ? (
        <DashboardContent wedding={wedding} />
      ) : null}
    </AppShell>
  );
}
