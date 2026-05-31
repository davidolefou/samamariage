'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/AuthContext';
import { useApi } from '@/lib/useApi';
import ProShell from '@/components/pro/ProShell';
import { type VendorResponse, CATEGORY_LABELS, vendorCompleteness, type Vendor } from '@/lib/vendor';
import { fmtFCFA } from '@/lib/ndawtal';

export const dynamic = 'force-static';

function Spinner() {
  return (
    <main className="grid min-h-screen place-items-center bg-bone">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
    </main>
  );
}

function KpiCard({
  href, label, value, sub, accent = false,
}: {
  href?: string;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  const inner = (
    <>
      <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">{label}</div>
      <div className="mt-3 font-display text-4xl text-royal-900">{value}</div>
      <div className={'mt-1 text-[12px] ' + (accent ? 'text-bordeaux' : 'text-ink/55')}>{sub}</div>
    </>
  );
  const cls = 'block rounded-2xl bg-paper p-4 shadow-card ring-1 ring-ink/5 transition hover:-translate-y-0.5 hover:shadow-glow';
  return href ? <Link href={href} className={cls}>{inner}</Link> : <div className={cls.replace(' transition hover:-translate-y-0.5 hover:shadow-glow', '')}>{inner}</div>;
}

function EmptyCard({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-paper p-8 text-center shadow-card ring-1 ring-ink/5">
      <p className="font-display text-lg text-royal-900">{title}</p>
      <p className="mt-1 text-sm text-ink/55">{sub}</p>
    </div>
  );
}

function DashboardContent({ vendor }: { vendor: Vendor }) {
  const firstName = (vendor.ownerName || vendor.businessName).trim().split(/\s+/)[0] ?? 'partenaire';
  const { pct, items } = vendorCompleteness(vendor);
  const published = vendor.status === 'PUBLISHED';

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">
            Espace pro · {CATEGORY_LABELS[vendor.category]}
          </div>
          <h1 className="mt-2 font-display text-3xl leading-tight text-royal-900 sm:text-4xl">
            Bonjour, <em className="not-italic gold-shine">{firstName}</em>.
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-ink/65">
            {published
              ? 'Votre vitrine est en ligne. Les demandes des mariées arriveront ici.'
              : 'Votre profil est créé. Complétez-le pour passer en ligne et recevoir des demandes.'}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-paper px-4 py-3 shadow-card ring-1 ring-ink/8">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-royal-700 text-base text-gold-100">⚡</div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-ink/50">Délai de réponse</div>
            <div className="font-display text-lg leading-none text-royal-900">{vendor.responseTime || '—'}</div>
          </div>
        </div>
      </section>

      {/* KPI cards — chiffres réels (0 tant que demandes/paiements pas branchés P3/P7) */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard href="/pro/demandes" label="Nouvelles demandes" value="0" sub="aucune pour l'instant" accent />
        <KpiCard label="Vues de la vitrine" value="—" sub="bientôt" />
        <KpiCard href="/pro/agenda" label="Réservations" value="0" sub="ce mois" />
        <KpiCard href="/pro/paiements" label="Revenus du mois" value={`${fmtFCFA(0)} F`} sub="aucun versement" />
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Demandes récentes (vide) */}
        <section>
          <div className="flex items-end justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-bordeaux">À traiter</div>
              <h2 className="mt-1 font-display text-2xl text-royal-900">Demandes de devis</h2>
            </div>
            <Link href="/pro/demandes" className="text-[12px] font-medium text-royal-700 hover:text-royal-900">Tout voir →</Link>
          </div>
          <div className="mt-3">
            <EmptyCard
              title="Aucune demande pour l'instant"
              sub={published ? 'Les mariées qui vous contactent apparaîtront ici.' : 'Passez en ligne pour commencer à recevoir des demandes.'}
            />
          </div>
        </section>

        {/* Colonne droite */}
        <div className="space-y-5">
          {/* Complétude (réelle) */}
          <section className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Profil complété</div>
              <div className="font-display text-xl text-royal-900">{pct}%</div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-royal-50">
              <div className="h-full rounded-full bg-gradient-to-r from-royal-700 to-gold-400 transition-[width] duration-700" style={{ width: pct + '%' }} />
            </div>
            <ul className="mt-4 space-y-2 text-[13px]">
              {items.map((it) => (
                <li key={it.label} className={'flex items-center gap-2 ' + (it.done ? 'text-ink/70' : 'text-ink/45')}>
                  <span className={'grid h-5 w-5 place-items-center rounded-full ' + (it.done ? 'bg-royal-700 text-gold-100' : 'bg-bone ring-1 ring-ink/15')}>
                    {it.done ? (
                      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m3 8 3 3 7-7" /></svg>
                    ) : (
                      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10" /></svg>
                    )}
                  </span>
                  {it.label}
                </li>
              ))}
            </ul>
            <Link href="/pro/vitrine" className="mt-4 block rounded-full bg-royal-700 py-2.5 text-center text-[13px] font-medium text-gold-50 transition hover:bg-royal-800">
              Compléter ma vitrine
            </Link>
          </section>

          {/* Statut de vérification (réel) */}
          {vendor.verified ? (
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-royal-800 to-royal-900 p-5 text-gold-50 shadow-glow ring-1 ring-royal-900/30">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold-400/15 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 16 16" className="h-5 w-5 text-gold-400" fill="currentColor"><circle cx="8" cy="8" r="7" /><path d="m5 8 2 2 4-4" stroke="#0E2916" strokeWidth="1.6" fill="none" /></svg>
                  <span className="font-display text-lg">Prestataire vérifié</span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-gold-100/85">
                  Votre badge est actif. Vous apparaissez en priorité dans les résultats des mariées.
                </p>
                {vendor.reviewCount > 0 && (
                  <div className="mt-4 font-mono text-[12px] text-gold-100/70">★ {vendor.rating} · {vendor.reviewCount} avis</div>
                )}
              </div>
            </section>
          ) : (
            <section className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold-400/20 text-gold-600">⏳</span>
                <span className="font-display text-lg text-royal-900">Vérification en cours</span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink/65">
                Ajoutez votre pièce d&apos;identité dans les paramètres pour obtenir le badge Vérifié et passer en tête de liste.
              </p>
              <Link href="/pro/parametres" className="mt-3 inline-block text-[13px] font-medium text-royal-700 hover:text-royal-900">
                Compléter la vérification →
              </Link>
            </section>
          )}

          {/* Prochains mariages (vide) */}
          <section className="rounded-2xl bg-paper p-5 shadow-card ring-1 ring-ink/5">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Prochains mariages</div>
              <Link href="/pro/agenda" className="text-[11px] font-medium text-royal-700 hover:text-royal-900">Agenda →</Link>
            </div>
            <p className="mt-3 text-sm text-ink/55">Aucune réservation confirmée pour l&apos;instant.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function ProDashboardPage() {
  const user = useUser('/pro/login');
  const router = useRouter();
  const { data, loading } = useApi<VendorResponse>('/api/vendor', { skip: !user });

  // Pas encore de profil prestataire → on envoie vers l'onboarding.
  useEffect(() => {
    if (user && !loading && data && data.vendor === null) {
      router.push('/pro/onboarding');
    }
  }, [user, loading, data, router]);

  if (!user || loading || !data) return <Spinner />;
  if (!data.vendor) return <Spinner />; // pendant la redirection vers l'onboarding

  const vendor = data.vendor;
  return (
    <ProShell
      breadcrumb="Vue d'ensemble"
      vendor={{ businessName: vendor.businessName, categoryLabel: CATEGORY_LABELS[vendor.category], verified: vendor.verified }}
      action={{ label: 'Voir ma vitrine', href: '/pro/vitrine' }}
    >
      <DashboardContent vendor={vendor} />
    </ProShell>
  );
}
