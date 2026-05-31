// SamaMariage — types Mood board.

export interface MoodItem {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
}

export interface MoodResponse {
  ok: boolean;
  items: MoodItem[];
}
