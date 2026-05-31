// SamaMariage — POST /api/planning/generate
//
// Propose un rétroplanning (tâches groupées par phase) à partir de la date du
// mariage et du contexte (cérémonies, ville, invités). Lecture seule : ne
// persiste RIEN — le client prévisualise puis crée via POST /api/planning.
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
import { cityLabel, ceremonyList, daysUntil, weddingDateLabel, type Wedding, type CeremonyKey } from '@/lib/wedding';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const TaskSchema = z.object({
  phase: z.string().min(1).max(60),
  title: z.string().min(1).max(200),
});
const ResultSchema = z.array(TaskSchema).min(1).max(40);

function asArray(parsed: unknown): unknown {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    for (const k of ['tasks', 'taches', 'items', 'planning']) {
      if (Array.isArray(obj[k])) return obj[k];
    }
  }
  return parsed;
}

function rowToWedding(row: NonNullable<Awaited<ReturnType<typeof prisma.wedding.findUnique>>>): Wedding {
  return {
    ...(row as unknown as Wedding),
    datePrecise: row.datePrecise ? row.datePrecise.toISOString() : null,
    ceremonies: row.ceremonies as Record<CeremonyKey, boolean>,
  };
}

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
    const w = row ? rowToWedding(row) : null;
    const d = w ? daysUntil(w) : null;
    const horizon = d !== null ? `Le mariage est dans ${d} jours (${weddingDateLabel(w!)}).` : "La date n'est pas encore fixée — propose un rétroplanning générique sur 12 mois.";
    const cer = w ? ceremonyList(w) || 'réception' : 'réception';
    const ctxLine = w
      ? `${horizon} Ville : ${cityLabel(w)}. Cérémonies : ${cer}. Invités : ${row!.guests}.`
      : horizon;

    const system = `Tu es une wedding planner sénégalaise. Tu construis un RÉTROPLANNING concret pour un mariage local (takk, céet, réception, ndawtal, tenues en bazin).
Renvoie UNIQUEMENT un tableau JSON, sans texte ni balises, de 12 à 30 objets :
[{"phase":"12–9 mois avant","title":"Réserver le lieu de réception"}, ...]
- phase = libellé temporel court et cohérent (ex « 12–9 mois avant », « 6–3 mois avant », « Dernier mois », « Jour J »).
- title = action concrète et spécifique au contexte sénégalais.
- Ordonne du plus lointain au plus proche. Réutilise les MÊMES libellés de phase pour regrouper les tâches.`;

    try {
      const res = await ai.complete({ task: 'planning', userId: auth.user.sub, system, prompt: ctxLine, maxTokens: 1200 });
      const out = ResultSchema.safeParse(asArray(extractJson(res.text)));
      if (!out.success) {
        return NextResponse.json(
          { error: 'AI_PARSE_FAILED', message: 'Réponse IA inexploitable.' },
          { status: 502, headers: { 'x-request-id': ctx.requestId } },
        );
      }
      const tasks = out.data.map((t) => ({ phase: t.phase.trim(), title: t.title.trim() }));
      return NextResponse.json({ ok: true, tasks, cached: res.cached }, { headers: { 'x-request-id': ctx.requestId } });
    } catch (err) {
      return mapAiError(err, ctx.requestId);
    }
  });
}
