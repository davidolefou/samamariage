// SamaMariage — types + helpers partagés pour le profil de mariage.

export type CeremonyKey = 'takk' | 'ceet' | 'civil' | 'reception';

export interface Wedding {
  id: string;
  userId: string;
  fullName: string;
  partnerName: string;
  partnerPronouns: 'il' | 'elle' | 'autre';
  phoneCountry: string;
  phone: string;
  dateMode: 'PRECISE' | 'MONTH' | 'UNKNOWN';
  datePrecise: string | null;
  dateMonth: string | null;
  dateInMonths: number;
  city: string;
  cityOther: string;
  ceremonies: Record<CeremonyKey, boolean>;
  ceremonyDates: Record<CeremonyKey, string>;
  guests: number;
  budget: number;
  budgetSkip: boolean;
  priorities: string[];
  styles: string[];
  fabric: string;
  bridesmaids: number;
  inspirationSources: string[];
  toAvoid: string;
  completedOnboarding: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeddingResponse {
  ok: boolean;
  wedding: Wedding | null;
}

const CITY_LABELS: Record<string, string> = {
  dakar: 'Dakar',
  thies: 'Thiès',
  saly: 'Saly / Mbour',
};

const STYLE_LABELS: Record<string, string> = {
  trad: 'Traditionnel sénégalais',
  royal: 'Royal moderne',
  boho: 'Bohème champêtre',
  mini: 'Minimaliste élégant',
  fusion: 'Fusion afro-occidentale',
  glam: 'Glamour Hollywood',
};

export function cityLabel(w: Wedding): string {
  if ((w.city === 'autre' || w.city === 'diasp') && w.cityOther) return w.cityOther;
  return CITY_LABELS[w.city] ?? w.city;
}

export function styleLabel(slug: string): string {
  return STYLE_LABELS[slug] ?? slug;
}

/** Format entier FCFA avec espaces (1 250 000). */
export function fmtFCFA(n: number): string {
  return Math.round(n)
    .toLocaleString('fr-FR')
    .replace(/[\u202f\u00a0]/g, ' ');
}

/** Format compact (4,2M / 850k). */
export function fmtCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + 'M';
  if (n >= 1_000) return Math.round(n / 1_000) + 'k';
  return String(n);
}

/**
 * Date de référence du mariage (Date) ou null si inconnue.
 * PRECISE → datePrecise ; MONTH → 1er du mois ; UNKNOWN → null.
 */
export function weddingDate(w: Wedding): Date | null {
  if (w.dateMode === 'PRECISE' && w.datePrecise) return new Date(w.datePrecise);
  if (w.dateMode === 'MONTH' && w.dateMonth) return new Date(`${w.dateMonth}-01T12:00:00Z`);
  return null;
}

/** Nombre de jours avant le mariage (>=0), ou null si date inconnue/passée. */
export function daysUntil(w: Wedding, now: Date = new Date()): number | null {
  const d = weddingDate(w);
  if (!d) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  return diff >= 0 ? diff : null;
}

/** Libellé court "J-216" ou "Date à définir". */
export function countdownLabel(w: Wedding): string {
  const d = daysUntil(w);
  if (d === null) return 'Date à définir';
  return `J-${d}`;
}

/** Libellé date FR longue (15 décembre 2026) ou approximation. */
export function weddingDateLabel(w: Wedding): string {
  const d = weddingDate(w);
  if (!d) {
    if (w.dateMode === 'UNKNOWN') return `Dans ~${w.dateInMonths} mois`;
    return 'Date à définir';
  }
  if (w.dateMode === 'MONTH') {
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Liste FR des cérémonies activées (Takk · Céet · Réception). */
export function ceremonyList(w: Wedding): string {
  const labels: Record<CeremonyKey, string> = {
    takk: 'Takk',
    ceet: 'Céet',
    civil: 'Civil',
    reception: 'Réception',
  };
  return (Object.keys(labels) as CeremonyKey[])
    .filter((k) => w.ceremonies?.[k])
    .map((k) => labels[k])
    .join(' · ');
}

/**
 * Progression d'organisation estimée (0-100). Heuristique tant que les
 * vrais modules (tâches, budget, prestataires) ne remontent pas de données :
 * basée sur la complétude du profil + l'approche de la date.
 */
export function prepProgress(w: Wedding): number {
  let score = 0;
  if (w.completedOnboarding) score += 25;
  if (w.priorities.length >= 3) score += 10;
  if (w.styles.length >= 1) score += 10;
  if (weddingDate(w)) score += 10;
  // Le temps qui passe fait monter la barre (max +45 à l'approche du jour J).
  const d = daysUntil(w);
  if (d !== null) {
    const horizon = 365;
    const elapsed = Math.max(0, Math.min(1, (horizon - d) / horizon));
    score += Math.round(elapsed * 45);
  }
  return Math.max(0, Math.min(100, score));
}
