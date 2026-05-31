// SamaMariage — types des avis prestataire.

export interface Review {
  id: string;
  vendorId: string;
  userId: string;
  rating: number;
  text: string;
  weddingLabel: string;
  reply: string;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: Record<number, number>; // {5: n, 4: n, ...1}
}

export interface ReviewListResponse {
  ok: boolean;
  reviews: Review[];
  summary: ReviewSummary;
}
