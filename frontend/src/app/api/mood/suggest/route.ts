// SamaMariage — POST /api/mood/suggest
//
// Propose un CONCEPT de mood board (thème + palette de couleurs + idées
// d'inspiration) à partir du style / tissu / priorités du mariage. Lecture
// seule : aucune image générée, aucune écriture DB — c'est une direction
// artistique que la mariée peut suivre pour son board.
// requireAuth + CSRF. 503 si IA non configurée, 429 si quota.
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { ai } from '@/lib/server/ai/gateway';
import { mapAiError, extractJson } from '@/lib/server/ai/http';
import { cityLabel, styleLabel, type Wedding } from '@/lib/wedding';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const ConceptSchema = z.object({
  theme: z.string().min(1).max(80),
  palette: z
    .array(
      z.object({
        name: z.string().min(1).max(40),
        hex: z
          .string()
          .regex(/^#?[0-9a-fA-F]{6}$/)
          .transform((h) => (h.startsWith('#') ? h.toUpperCase() : '#' + h.toUpperCase())),
      }),
    )
    .min(3)
    .max(6),
  ideas: z.array(z.string().min(1).max(160)).min(3).max(8),
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

    const row = await prisma.wedding.findUnique({ where: { userId: auth.user.sub } });
    const w = row ? (row as unknown as Wedding) : null;
    const style = w?.styles?.[0] ? styleLabel(w.styles[0]) : 'Royal sénégalais moderne';
    const ctxLine = w
      ? `Style : ${style}. Tissu : ${row!.fabric || 'bazin riche'}. Ville : ${cityLabel(w)}. Priorités : ${row!.priorities.join(', ') || 'élégance'}. À éviter : ${row!.toAvoid || 'rien de précis'}.`
      : `Style : ${style}. Tissu : bazin riche. Ambiance sénégalaise élégante.`;

    const system = `Tu es directrice artistique de mariages sénégalais. Tu proposes un concept de mood board cohérent et inspirant.
Renvoie UNIQUEMENT un objet JSON, sans texte ni balises :
{
  "theme": "nom court et évocateur du concept",
  "palette": [{"name":"Vert royal","hex":"#1E5631"}, ...],   // 4 à 5 couleurs
  "ideas": ["idée d'inspiration concrète", ...]               // 5 à 7 idées (déco, tenues, ambiance, fleurs, lumières)
}
- hex au format #RRGGBB. Couleurs harmonieuses et ancrées dans l'esthétique sénégalaise (bazin, or, bordeaux, terracotta…).
- Idées concrètes et spécifiques (pas de généralités), adaptées au style fourni.`;

    try {
      const res = await ai.complete({ task: 'mood', userId: auth.user.sub, system, prompt: ctxLine, maxTokens: 600 });
      const out = ConceptSchema.safeParse(extractJson(res.text));
      if (!out.success) {
        return NextResponse.json(
          { error: 'AI_PARSE_FAILED', message: 'Réponse IA inexploitable.' },
          { status: 502, headers: { 'x-request-id': ctx.requestId } },
        );
      }
      return NextResponse.json({ ok: true, concept: out.data, cached: res.cached }, { headers: { 'x-request-id': ctx.requestId } });
    } catch (err) {
      return mapAiError(err, ctx.requestId);
    }
  });
}
