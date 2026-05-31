// SamaMariage — types + libellés Invités (partagés page + API).

export type GuestSide = 'MARIEE' | 'MARIE' | 'COMMUN';
export type RsvpStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'MAYBE';

export interface Guest {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  side: GuestSide;
  rsvp: RsvpStatus;
  seats: number;
  table: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuestStats {
  total: number; // nb d'invités (lignes)
  confirmed: number;
  declined: number;
  pending: number;
  maybe: number;
  confirmedSeats: number; // couverts confirmés (pour traiteur)
  bySide: Record<GuestSide, number>;
}

export interface GuestResponse {
  ok: boolean;
  guests: Guest[];
  stats: GuestStats;
}

export const SIDE_LABELS: Record<GuestSide, string> = {
  MARIEE: 'Côté mariée',
  MARIE: 'Côté marié',
  COMMUN: 'Commun',
};

export const RSVP_LABELS: Record<RsvpStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  DECLINED: 'Décliné',
  MAYBE: 'Peut-être',
};

export const SIDE_OPTIONS = (['MARIEE', 'MARIE', 'COMMUN'] as GuestSide[]).map(
  (k) => [k, SIDE_LABELS[k]] as [GuestSide, string],
);
export const RSVP_OPTIONS = (['PENDING', 'CONFIRMED', 'DECLINED', 'MAYBE'] as RsvpStatus[]).map(
  (k) => [k, RSVP_LABELS[k]] as [RsvpStatus, string],
);

/** Lien wa.me pré-rempli pour relancer un·e invité·e (numéro nettoyé). */
export function whatsappLink(phone: string, message: string): string | null {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length < 6) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
