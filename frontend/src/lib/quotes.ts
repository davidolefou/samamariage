// SamaMariage — types + libellés des demandes de devis (portail pro + mariée).

export type QuoteStatus = 'NEW' | 'QUOTED' | 'ACCEPTED' | 'DECLINED' | 'ARCHIVED';

export interface QuoteRequest {
  id: string;
  vendorId: string;
  userId: string;
  coupleName: string;
  eventDate: string | null;
  city: string;
  guests: number;
  budget: number;
  detail: string;
  message: string;
  status: QuoteStatus;
  quoteAmount: number | null;
  quoteMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteStats {
  new: number;
  quoted: number;
  accepted: number;
  declined: number;
}

export interface QuoteListResponse {
  ok: boolean;
  requests: QuoteRequest[];
  stats: QuoteStats;
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  NEW: 'Nouvelle',
  QUOTED: 'Devis envoyé',
  ACCEPTED: 'Acceptée',
  DECLINED: 'Refusée',
  ARCHIVED: 'Archivée',
};
