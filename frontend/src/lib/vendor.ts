// SamaMariage — types + libellés + helpers Prestataire (partagés portail pro).

export type VendorCategory =
  | 'PHOTO'
  | 'FOOD'
  | 'DECOR'
  | 'SALLE'
  | 'DJ'
  | 'TENUE'
  | 'VOITURE'
  | 'BEAUTE'
  | 'ANIM';

export type VendorStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'SUSPENDED';

export interface Vendor {
  id: string;
  userId: string;
  category: VendorCategory;
  businessName: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  city: string;
  serviceAreas: string[];
  services: string[];
  capacity: number;
  priceFrom: number;
  priceLabel: string;
  depositPolicy: string;
  description: string;
  portfolio: string[];
  coverVariant: string;
  responseTime: string;
  vacationMode: boolean;
  verified: boolean;
  rating: number;
  reviewCount: number;
  status: VendorStatus;
  payoutMethod: string;
  payoutAccount: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorResponse {
  ok: boolean;
  vendor: Vendor | null;
}

export const CATEGORY_LABELS: Record<VendorCategory, string> = {
  PHOTO: 'Photographe',
  FOOD: 'Traiteur',
  DECOR: 'Décorateur',
  SALLE: 'Salle / Lieu',
  DJ: 'DJ / Son',
  TENUE: 'Tailleur / créateur',
  VOITURE: 'Location voiture',
  BEAUTE: 'Beauté',
  ANIM: 'Animation',
};

export const STATUS_LABELS: Record<VendorStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_REVIEW: 'En vérification',
  PUBLISHED: 'En ligne',
  SUSPENDED: 'Suspendu',
};

/** Le `Vendor` côté admin porte aussi le flag `featured`. */
export interface AdminVendor extends Vendor {
  featured: boolean;
}

/** Couverture visuelle de catégorie (gradient `cv-*` défini en CSS). */
export function coverForCategory(c: VendorCategory): string {
  const map: Partial<Record<VendorCategory, string>> = {
    PHOTO: 'cv-photo',
    FOOD: 'cv-food',
    DECOR: 'cv-decor',
    SALLE: 'cv-salle',
    DJ: 'cv-dj',
    TENUE: 'cv-tenue',
  };
  return map[c] ?? 'cv-photo';
}

/** Complétude du profil : checklist + pourcentage (données réelles du Vendor). */
export function vendorCompleteness(v: Vendor): { pct: number; items: { label: string; done: boolean }[] } {
  const items = [
    { label: 'Profil & contact', done: !!v.businessName && !!v.ownerName && !!v.phone },
    { label: 'Prestations & tarifs', done: v.services.length >= 1 && v.priceFrom > 0 },
    { label: 'Zone & disponibilités', done: v.serviceAreas.length >= 1 && !!v.responseTime },
    { label: 'Identité vérifiée', done: v.verified },
    { label: 'Portfolio (3 photos min.)', done: v.portfolio.length >= 3 },
  ];
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);
  return { pct, items };
}
