// SamaMariage — types de l'agenda prestataire.

export interface AgendaBooking {
  date: string; // YYYY-MM-DD
  coupleName: string;
  city: string;
}

export interface AgendaResponse {
  ok: boolean;
  blocks: string[]; // dates bloquées, YYYY-MM-DD
  bookings: AgendaBooking[]; // QuoteRequest ACCEPTED avec date
}

export const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
export const MONTHS_FR_SHORT = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
