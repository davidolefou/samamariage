// SamaMariage — types + libellés Tenues (looks + ndaxal).

export type OutfitStatus = 'IDEA' | 'CHOSEN' | 'ORDERED' | 'FITTING' | 'READY';

export interface Outfit {
  id: string;
  userId: string;
  ceremony: string;
  title: string;
  fabric: string;
  cost: number;
  status: OutfitStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bridesmaid {
  id: string;
  userId: string;
  name: string;
  phone: string;
  measurementsDone: boolean;
  cotisationAmount: number;
  cotisationPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BridesmaidStats {
  total: number;
  measurementsDone: number;
  paid: number;
  collected: number;
}

export interface OutfitsResponse {
  ok: boolean;
  outfits: Outfit[];
}
export interface BridesmaidsResponse {
  ok: boolean;
  bridesmaids: Bridesmaid[];
  stats: BridesmaidStats;
}

export const OUTFIT_STATUS_LABELS: Record<OutfitStatus, string> = {
  IDEA: 'À choisir',
  CHOSEN: 'Choisie',
  ORDERED: 'Commandée',
  FITTING: 'Essayage',
  READY: 'Confirmée',
};
export const OUTFIT_STATUS_OPTIONS = (['IDEA', 'CHOSEN', 'ORDERED', 'FITTING', 'READY'] as OutfitStatus[]).map(
  (k) => [k, OUTFIT_STATUS_LABELS[k]] as [OutfitStatus, string],
);

export const CEREMONY_OPTIONS: [string, string][] = [
  ['takk', 'Takk'],
  ['ceet', 'Céet'],
  ['reception', 'Réception'],
  ['autre', 'Autre'],
];
export const CEREMONY_LABELS: Record<string, string> = Object.fromEntries(CEREMONY_OPTIONS);
