// SamaMariage — Sama Coach : construction du system prompt + parsing de
// l'enveloppe de réponse pour le chat IA.
//
// Le serveur possède le system prompt (persona + contexte mariage réel tiré du
// profil Wedding de l'utilisateur). Le client n'envoie que les tours
// user/assistant ; il ne peut donc pas injecter ni falsifier le contexte.
import 'server-only';
import { z } from 'zod';
import type { Wedding as PrismaWedding } from '@prisma/client';
import {
  fmtFCFA,
  cityLabel,
  styleLabel,
  weddingDateLabel,
  daysUntil,
  ceremonyList,
  type Wedding,
  type CeremonyKey,
} from '@/lib/wedding';

/** Mappe une ligne Prisma vers la forme client `Wedding` pour réutiliser les helpers. */
function toWedding(w: PrismaWedding): Wedding {
  return {
    id: w.id,
    userId: w.userId,
    fullName: w.fullName,
    partnerName: w.partnerName,
    partnerPronouns: w.partnerPronouns as Wedding['partnerPronouns'],
    phoneCountry: w.phoneCountry,
    phone: w.phone,
    dateMode: w.dateMode as Wedding['dateMode'],
    datePrecise: w.datePrecise ? w.datePrecise.toISOString() : null,
    dateMonth: w.dateMonth,
    dateInMonths: w.dateInMonths,
    city: w.city,
    cityOther: w.cityOther,
    ceremonies: (w.ceremonies as Record<CeremonyKey, boolean>) ?? {
      takk: false,
      ceet: false,
      civil: false,
      reception: false,
    },
    ceremonyDates: (w.ceremonyDates as Record<CeremonyKey, string>) ?? {
      takk: '',
      ceet: '',
      civil: '',
      reception: '',
    },
    guests: w.guests,
    budget: w.budget,
    budgetSkip: w.budgetSkip,
    priorities: w.priorities,
    styles: w.styles,
    fabric: w.fabric,
    bridesmaids: w.bridesmaids,
    inspirationSources: w.inspirationSources,
    toAvoid: w.toAvoid,
    completedOnboarding: w.completedOnboarding,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

const PERSONA = `Tu es « Sama Coach », l'assistante de mariage IA de la plateforme SamaMariage (Sénégal).
TON : grande sœur chaleureuse ET wedding planner experte. Tutoiement, français naturel, chaleureux, jamais condescendant. Quelques mots wolof bienvenus (xewël, inchallah, jërëjëf) avec parcimonie. 1 emoji max par message.
TES DOMAINES : planning/rétroplanning, recommandation de prestataires, arbitrages budget, étiquette & traditions (takk, céet, ndawtal, diaspora), soutien anti-stress (Sama Sérénité), rédaction (faire-part, discours, messages).
Mariage sénégalais : takk (cérémonie religieuse), céet/réception, ndawtal (échanges de cadeaux entre belles-familles), tenues en bazin riche, groupe ndaxal (demoiselles d'honneur qui cotisent).`;

const ENVELOPE = `FORMAT DE RÉPONSE — réponds UNIQUEMENT avec un objet JSON valide, sans texte autour ni bloc de code :
{
  "reply": "ta réponse, 2 à 5 phrases, chaleureuse et concrète",
  "chips": ["question suivante courte", "..."],   // 0 à 4, formulées à la 1re personne de la mariée
  "cards": [ ... ]   // 0 à 3 cartes d'action, types ci-dessous, seulement si pertinent
}
TYPES DE CARTES :
- {"type":"tasks","title":"...","items":["tâche 1","tâche 2"]}
- {"type":"budget","title":"...","spent":4200000,"total":12000000,"lines":[{"label":"Déco","amount":1740000,"flag":"over"}]}  // flag: "over"|"ok"|null
- {"type":"vendor","name":"DJ Bouba","cat":"DJ / animation","price":"600k F","rating":4.8,"note":"phrase courte"}
- {"type":"countdown","days":216,"date":"15 déc 2026","label":"jusqu'au jour J"}
- {"type":"note","title":"...","body":"texte rédigé (faire-part, discours…)"}
Reste fidèle aux chiffres du contexte. Si on te demande un texte (faire-part, discours), mets-le dans une carte "note".`;

/** Construit le system prompt complet à partir du profil de mariage réel (ou générique). */
export function buildCoachSystem(row: PrismaWedding | null, fallbackName: string): string {
  if (!row) {
    return [
      PERSONA,
      `CONTEXTE : ${fallbackName} n'a pas encore complété son profil de mariage. Encourage-la chaleureusement à finaliser son onboarding pour des conseils personnalisés, tout en répondant à ses questions générales.`,
      ENVELOPE,
    ].join('\n\n');
  }

  const w = toWedding(row);
  const firstName = w.fullName.trim().split(/\s+/)[0] || w.fullName;
  const d = daysUntil(w);
  const cer = ceremonyList(w) || 'à définir';
  const ctxLines = [
    `Mariée : ${w.fullName}${w.partnerName ? ` · partenaire : ${w.partnerName}` : ''}.`,
    `Date : ${weddingDateLabel(w)}${d !== null ? ` (J-${d})` : ''}.`,
    `Ville : ${cityLabel(w)}. Cérémonies : ${cer}.`,
    `Invités prévus : ${w.guests}. Groupe ndaxal : ${w.bridesmaids} demoiselles.`,
    w.budgetSkip
      ? 'Budget : non communiqué.'
      : `Budget total prévu : ${fmtFCFA(w.budget)} FCFA.`,
    w.styles.length ? `Styles choisis : ${w.styles.map(styleLabel).join(', ')}.` : '',
    w.priorities.length ? `Priorités : ${w.priorities.join(', ')}.` : '',
    w.fabric ? `Tissu privilégié : ${w.fabric}.` : '',
    w.toAvoid ? `À éviter : ${w.toAvoid}.` : '',
  ].filter(Boolean);

  return [
    PERSONA,
    `Tu parles à ${firstName}.\nCONTEXTE MARIAGE :\n- ${ctxLines.join('\n- ')}`,
    ENVELOPE,
  ].join('\n\n');
}

// ── Enveloppe de réponse ──────────────────────────────────────────────────
const CardSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('tasks'),
    title: z.string().max(120).default('À faire'),
    items: z.array(z.string().max(240)).max(8).default([]),
  }),
  z.object({
    type: z.literal('budget'),
    title: z.string().max(120).default('Aperçu budget'),
    spent: z.number().nonnegative().max(1_000_000_000).optional(),
    total: z.number().nonnegative().max(1_000_000_000).optional(),
    lines: z
      .array(
        z.object({
          label: z.string().max(80),
          amount: z.union([z.number(), z.string().max(40)]),
          flag: z.enum(['over', 'ok']).nullish(),
        }),
      )
      .max(12)
      .default([]),
  }),
  z.object({
    type: z.literal('vendor'),
    name: z.string().max(120),
    cat: z.string().max(80).optional(),
    price: z.string().max(40).optional(),
    rating: z.number().min(0).max(5).optional(),
    note: z.string().max(280).optional(),
  }),
  z.object({
    type: z.literal('countdown'),
    days: z.number().int().min(0).max(100000),
    date: z.string().max(60).optional(),
    label: z.string().max(80).optional(),
  }),
  z.object({
    type: z.literal('note'),
    title: z.string().max(120).optional(),
    body: z.string().max(4000).default(''),
  }),
]);

export type CoachCard = z.infer<typeof CardSchema>;

export const CoachEnvelopeSchema = z.object({
  reply: z.string().max(4000),
  chips: z.array(z.string().max(120)).max(4).default([]),
  cards: z.array(CardSchema).max(3).default([]),
});

export type CoachEnvelope = z.infer<typeof CoachEnvelopeSchema>;

/**
 * Parse la sortie brute du modèle en enveloppe validée. Tolère un éventuel
 * bloc ```json, du texte autour, ou un JSON malformé : dans ce dernier cas on
 * renvoie le texte brut comme `reply` pour ne jamais laisser la mariée sans
 * réponse.
 */
export function parseCoachEnvelope(raw: string): CoachEnvelope {
  const trimmed = (raw ?? '').trim();
  let candidate = trimmed
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  const a = candidate.indexOf('{');
  const b = candidate.lastIndexOf('}');
  if (a >= 0 && b > a) candidate = candidate.slice(a, b + 1);

  try {
    const parsed = CoachEnvelopeSchema.safeParse(JSON.parse(candidate));
    if (parsed.success) return parsed.data;
  } catch {
    // tombe dans le fallback ci-dessous
  }
  return {
    reply: trimmed || "Désolée, je n'ai pas bien saisi — tu peux reformuler ?",
    chips: [],
    cards: [],
  };
}
