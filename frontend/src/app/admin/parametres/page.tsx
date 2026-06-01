'use client';

// SamaMariage — Console admin · Paramètres — /admin/parametres.
// Inspiré de admin-parametres.html, mais HONNÊTE : configuration & santé en
// lecture (les réglages serveur se changent via les variables d'environnement).
// Branché sur GET /api/admin/settings (réel).

import { useApi } from '@/lib/useApi';
import AdminShell from '@/components/admin/AdminShell';
import { CATEGORY_LABELS, type VendorCategory } from '@/lib/vendor';

export const dynamic = 'force-static';

interface SettingsResponse {
  ok: boolean;
  commissionPct: number;
  depositMinPct: number;
  categories: string[];
  team: { id: string; email: string; name: string | null; role: string }[];
  integrations: Record<string, boolean>;
}

const INTEGRATION_LABELS: Record<string, { label: string; env: string }> = {
  ai: { label: 'Assistant IA (Sama Coach, générateurs)', env: 'ANTHROPIC_API_KEY' },
  email: { label: 'Emails transactionnels', env: 'RESEND_API_KEY + EMAIL_FROM' },
  storage: { label: 'Stockage médias', env: 'CLOUDINARY_*' },
  payments: { label: 'Paiements', env: 'BICTORYS_API_KEY' },
  googleOauth: { label: 'Connexion Google', env: 'GOOGLE_*' },
  redis: { label: 'Cache / rate-limit', env: 'UPSTASH_REDIS_*' },
};

const ROLE_PILL: Record<string, string> = {
  SUPERADMIN: 'bg-gold-400/20 text-gold-600',
  ADMIN: 'bg-royal-50 text-royal-700',
};

function Content({ data }: { data: SettingsResponse }) {
  return (
    <div className="space-y-6">
      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bordeaux">Configuration</div>
        <h1 className="mt-2 font-display text-3xl leading-tight text-royal-900 sm:text-4xl">
          Paramètres de la <em className="not-italic gold-shine">plateforme</em>.
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink/65">
          Configuration en vigueur et santé des intégrations. Les réglages serveur se modifient via les variables d&apos;environnement (Vercel).
        </p>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        {/* Commissions */}
        <section className="rounded-2xl bg-paper p-6 shadow-card ring-1 ring-ink/5">
          <h2 className="font-display text-xl text-royal-900">Commissions & frais</h2>
          <p className="mt-1 text-[13px] text-ink/55">Part prélevée par Sama sur chaque réservation.</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-bone/60 px-4 py-3">
              <span className="text-[14px] text-ink/80">Commission plateforme</span>
              <span className="font-mono text-royal-900">{data.commissionPct}%</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-bone/60 px-4 py-3">
              <span className="text-[14px] text-ink/80">Acompte minimum exigé</span>
              <span className="font-mono text-royal-900">{data.depositMinPct}%</span>
            </div>
            <p className="text-[12px] text-ink/50">
              Commission réglable via <span className="font-mono text-bordeaux">VENDOR_COMMISSION_PCT</span>.
            </p>
          </div>
        </section>

        {/* Intégrations / santé */}
        <section className="rounded-2xl bg-paper p-6 shadow-card ring-1 ring-ink/5">
          <h2 className="font-display text-xl text-royal-900">Intégrations</h2>
          <p className="mt-1 text-[13px] text-ink/55">État des services (présence des clés côté serveur).</p>
          <div className="mt-4 divide-y divide-ink/8">
            {Object.entries(INTEGRATION_LABELS).map(([key, meta]) => {
              const on = data.integrations[key];
              return (
                <div key={key} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-[14px] text-ink/80">{meta.label}</div>
                    <div className="font-mono text-[10px] text-ink/40">{meta.env}</div>
                  </div>
                  {on ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-royal-50 px-2.5 py-1 text-[11px] font-medium text-royal-700"><span className="h-1.5 w-1.5 rounded-full bg-royal-700" /> Actif</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink/50"><span className="h-1.5 w-1.5 rounded-full bg-ink/30" /> Inactif</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Équipe */}
        <section className="rounded-2xl bg-paper p-6 shadow-card ring-1 ring-ink/5">
          <h2 className="font-display text-xl text-royal-900">Équipe & rôles</h2>
          <p className="mt-1 text-[13px] text-ink/55">Comptes administrateurs (rôle posé via <span className="font-mono text-bordeaux">db:make-superadmin</span>).</p>
          <div className="mt-4 space-y-3">
            {data.team.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-bordeaux font-display text-sm text-paper">{(u.name ?? u.email).slice(0, 2).toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-royal-900">{u.name ?? u.email.split('@')[0]}</div>
                  <div className="truncate text-[11px] text-ink/55">{u.email}</div>
                </div>
                <span className={'rounded-full px-2 py-0.5 text-[11px] font-medium ' + (ROLE_PILL[u.role] ?? 'bg-ink/5 text-ink/60')}>{u.role === 'SUPERADMIN' ? 'Super-admin' : 'Admin'}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Catégories */}
        <section className="rounded-2xl bg-paper p-6 shadow-card ring-1 ring-ink/5">
          <h2 className="font-display text-xl text-royal-900">Catégories de prestataires</h2>
          <p className="mt-1 text-[13px] text-ink/55">Définies dans le schéma (enum <span className="font-mono text-bordeaux">VendorCategory</span>).</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.categories.map((c) => (
              <span key={c} className="rounded-full bg-bone px-3 py-1.5 text-[13px] text-royal-900 ring-1 ring-ink/8">{CATEGORY_LABELS[c as VendorCategory] ?? c}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AdminParametresPage() {
  const { data, loading } = useApi<SettingsResponse>('/api/admin/settings');
  return (
    <AdminShell active="parametres" breadcrumb="Paramètres" search="">
      {loading && !data ? (
        <div className="grid place-items-center py-32">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-royal-700/30 border-t-royal-700" />
        </div>
      ) : data ? (
        <Content data={data} />
      ) : (
        <p className="text-sm text-ink/55">Impossible de charger les paramètres.</p>
      )}
    </AdminShell>
  );
}
