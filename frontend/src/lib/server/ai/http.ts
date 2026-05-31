// SamaMariage — helpers HTTP partagés pour les routes IA.
// Mappe les erreurs du gateway vers des réponses stables et extrait le JSON
// d'une sortie modèle éventuellement entourée de texte / balises ```json.
import 'server-only';
import { NextResponse } from 'next/server';
import { AiNotConfiguredError, AiRateLimitError } from './gateway';

/** Réponse HTTP standard selon le type d'erreur IA (503 / 429 / 502). */
export function mapAiError(err: unknown, requestId: string): NextResponse {
  if (err instanceof AiNotConfiguredError) {
    return NextResponse.json(
      { error: 'AI_NOT_CONFIGURED', message: "L'assistant IA n'est pas encore activé." },
      { status: 503, headers: { 'x-request-id': requestId } },
    );
  }
  if (err instanceof AiRateLimitError) {
    return NextResponse.json(
      { error: 'AI_RATE_LIMITED', message: 'Limite IA quotidienne atteinte. Reviens demain 🌸' },
      { status: 429, headers: { 'x-request-id': requestId } },
    );
  }
  return NextResponse.json(
    { error: 'AI_ERROR', message: 'Génération IA impossible, là tout de suite. Réessaie dans un instant.' },
    { status: 502, headers: { 'x-request-id': requestId } },
  );
}

/** Extrait un objet/array JSON d'une sortie modèle (tolère ```json et texte autour). */
export function extractJson(raw: string): unknown {
  const cleaned = (raw ?? '')
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Cherche le premier objet OU tableau équilibré.
    const objStart = cleaned.indexOf('{');
    const arrStart = cleaned.indexOf('[');
    const start =
      arrStart >= 0 && (objStart < 0 || arrStart < objStart) ? arrStart : objStart;
    if (start < 0) return null;
    const close = cleaned[start] === '[' ? ']' : '}';
    const end = cleaned.lastIndexOf(close);
    if (end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}
