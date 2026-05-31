// SamaMariage — types Sérénité (suivi d'humeur).

export interface MoodCheckin {
  id: string;
  userId: string;
  score: number; // 1..5
  note: string;
  createdAt: string;
}

export interface SereniteResponse {
  ok: boolean;
  checkins: MoodCheckin[];
  average: number; // moyenne des 30 derniers
}

export const MOOD_FACES = ['😣', '😟', '😌', '🙂', '😊'];
export const MOOD_LABELS = ['Stressée', 'Tendue', 'Posée', 'Sereine', 'Épanouie'];
