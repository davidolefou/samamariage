// SamaMariage — types + libellés Ndawtal (partagés page + composants).

export type NdawtalRelation =
  | 'TANTE_MARIEE'
  | 'TANTE_MARIE'
  | 'COUSINE'
  | 'AMIE'
  | 'VOISINE'
  | 'FAMILLE_MARIEE'
  | 'FAMILLE_MARIE'
  | 'COLLEGUE'
  | 'AUTRE';

export type NdawtalCeremony = 'TAKK' | 'CEET' | 'RECEPTION' | 'AUTRE';
export type NdawtalType = 'CASH' | 'CADEAU' | 'SERVICE';

export interface NdawtalEntry {
  id: string;
  userId: string;
  donorName: string;
  relationship: NdawtalRelation;
  ceremony: NdawtalCeremony;
  type: NdawtalType;
  amount: number;
  donationDate: string;
  receiptSent: boolean;
  notes: string;
  obligationDate: string | null;
  estimatedRepay: number | null;
  repaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NdawtalStats {
  totalReceived: number;
  donorCount: number;
  average: number;
  topDonor: { name: string; amount: number } | null;
  byCeremony: Record<string, { amount: number; count: number }>;
  byFamily: { mariee: number; marie: number };
}

export interface NdawtalResponse {
  ok: boolean;
  entries: NdawtalEntry[];
  stats: NdawtalStats;
}

export const RELATION_LABELS: Record<NdawtalRelation, string> = {
  TANTE_MARIEE: 'Tante (mariée)',
  TANTE_MARIE: 'Tante (marié)',
  COUSINE: 'Cousine',
  AMIE: 'Amie',
  VOISINE: 'Voisine',
  FAMILLE_MARIEE: 'Famille (mariée)',
  FAMILLE_MARIE: 'Famille (marié)',
  COLLEGUE: 'Collègue',
  AUTRE: 'Autre',
};

export const CEREMONY_LABELS: Record<NdawtalCeremony, string> = {
  TAKK: 'Takk',
  CEET: 'Céet',
  RECEPTION: 'Réception',
  AUTRE: 'Autre',
};

export const TYPE_LABELS: Record<NdawtalType, string> = {
  CASH: '💵 Cash',
  CADEAU: '🎁 Cadeau',
  SERVICE: '🤝 Service',
};

export const RELATION_OPTIONS = Object.entries(RELATION_LABELS) as [NdawtalRelation, string][];
export const CEREMONY_OPTIONS = (['TAKK', 'CEET', 'RECEPTION', 'AUTRE'] as NdawtalCeremony[]).map(
  (k) => [k, CEREMONY_LABELS[k]] as [NdawtalCeremony, string],
);
export const TYPE_OPTIONS = (['CASH', 'CADEAU', 'SERVICE'] as NdawtalType[]).map(
  (k) => [k, TYPE_LABELS[k]] as [NdawtalType, string],
);

export function fmtFCFA(n: number): string {
  return Math.round(n)
    .toLocaleString('fr-FR')
    .replace(/[\u202f\u00a0]/g, ' ');
}

const XOF_PER_EUR = 655.957;
export function toEUR(n: number): string {
  return (n / XOF_PER_EUR).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
