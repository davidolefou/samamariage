// SamaMariage — POST /api/ndawtal/parse
//
// Saisie rapide IA : transforme une phrase libre (« Tata Awa a donné 50 mille »)
// en champs structurés pour un don ndawtal. Utilise l'AI Gateway (Haiku).
// requireAuth + CSRF. 503 si l'IA n'est pas configurée, 429 si quota atteint.
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { ai, AiNotConfiguredError, AiRateLimitError } from '@/lib/server/ai/gateway';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const BodySchema = z.object({ text: z.string().min(1).max(500) });

const RELATIONS = [
  'TANTE_MARIEE', 'TANTE_MARIE', 'COUSINE', 'AMIE', 'VOISINE',
  'FAMILLE_MARIEE', 'FAMILLE_MARIE', 'COLLEGUE', 'AUTRE',
] as const;

const SYSTEM = `Tu analyses une phrase en français/wolof décrivant un don (ndawtal) reçu lors d'un mariage sénégalais.
Renvoie UNIQUEMENT un objet JSON, sans texte ni balises, au format :
{"donorName": string, "amount": number, "relationship": string, "type": "CASH"|"CADEAU"|"SERVICE"}
- amount en FCFA, entier ("50 mille" = 50000, "2 millions" = 2000000). 0 si inconnu.
- relationship parmi : ${RELATIONS.join(', ')} (AUTRE si incertain).
- type CASH par défaut, CADEAU si objet, SERVICE si prestation.
- donorName : le nom de la personne (chaîne vide si absent).`;

function parseJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

const ParsedSchema = z.object({
  donorName: z.string().max(120).default(''),
  amount: z.number().int().min(0).max(1_000_000_000).catch(0),
  relationship: z.enum(RELATIONS).catch('AUTRE'),
  type: z.enum(['CASH', 'CADEAU', 'SERVICE']).catch('CASH'),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const csrfFail = verifyCsrf(req);
    if (csrfFail) {
      csrfFail.headers.set('x-request-id', ctx.requestId);
      return csrfFail;
    }
    const auth = await requireAuth(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', issues: parsed.error.issues },
        { status: 400, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    try {
      const res = await ai.complete({
        task: 'ndawtal',
        userId: auth.user.sub,
        system: SYSTEM,
        prompt: parsed.data.text,
        maxTokens: 200,
      });
      const json = parseJson(res.text);
      const out = ParsedSchema.safeParse(json);
      if (!out.success) {
        return NextResponse.json(
          { error: 'AI_PARSE_FAILED', message: 'Réponse IA inexploitable.' },
          { status: 502, headers: { 'x-request-id': ctx.requestId } },
        );
      }
      return NextResponse.json(
        { ok: true, entry: out.data, cached: res.cached },
        { headers: { 'x-request-id': ctx.requestId } },
      );
    } catch (err) {
      if (err instanceof AiNotConfiguredError) {
        return NextResponse.json(
          { error: 'AI_NOT_CONFIGURED', message: "L'assistant IA n'est pas activé." },
          { status: 503, headers: { 'x-request-id': ctx.requestId } },
        );
      }
      if (err instanceof AiRateLimitError) {
        return NextResponse.json(
          { error: 'AI_RATE_LIMITED', message: 'Limite IA quotidienne atteinte.' },
          { status: 429, headers: { 'x-request-id': ctx.requestId } },
        );
      }
      return NextResponse.json(
        { error: 'AI_ERROR', message: 'Analyse IA impossible.' },
        { status: 502, headers: { 'x-request-id': ctx.requestId } },
      );
    }
  });
}
