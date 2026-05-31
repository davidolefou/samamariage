// SamaMariage — POST /api/budget/generate
//
// Propose une ventilation budgétaire (postes + montants alloués) à partir de
// l'enveloppe globale du mariage (Wedding.budget) et du contexte (ville,
// invités, cérémonies, priorités). Lecture seule : ne persiste RIEN — le
// client prévisualise puis crée les postes via POST /api/budget.
// requireAuth + CSRF. 503 si IA non configurée, 429 si quota, 422 sans budget.
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { ai } from '@/lib/server/ai/gateway';
import { mapAiError, extractJson } from '@/lib/server/ai/http';
import { fmtFCFA, cityLabel, ceremonyList, type Wedding, type CeremonyKey } from '@/lib/wedding';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const SuggestionSchema = z.object({
  name: z.string().min(1).max(80),
  icon: z.string().max(8).default(''),
  allocated: z.number().int().min(0).max(1_000_000_000).catch(0),
});
const ResultSchema = z.array(SuggestionSchema).min(1).max(12);

function asArray(parsed: unknown): unknown {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    for (const k of ['categories', 'postes', 'items', 'lines']) {
      if (Array.isArray(obj[k])) return obj[k];
    }
  }
  return parsed;
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
    const budget = row?.budget ?? 0;
    if (!row || row.budgetSkip || budget <= 0) {
      return NextResponse.json(
        { error: 'NO_BUDGET', message: 'Renseigne d’abord ton enveloppe globale dans ton profil.' },
        { status: 422, headers: { 'x-request-id': ctx.requestId } },
      );
    }

    const w = row as unknown as Wedding;
    const cer = ceremonyList({ ...w, ceremonies: row.ceremonies as Record<CeremonyKey, boolean> }) || 'réception';
    const priorities = row.priorities.length ? row.priorities.join(', ') : 'aucune priorité particulière';

    const system = `Tu es une wedding planner sénégalaise experte des budgets de mariage à Dakar, Thiès et Saly.
Tu proposes une ventilation budgétaire RÉALISTE et complète pour un mariage local.
Renvoie UNIQUEMENT un tableau JSON, sans texte ni balises, de 6 à 10 objets :
[{"name":"Lieu de réception","icon":"🏛️","allocated":3360000}, ...]
- allocated en FCFA entier. La somme des allocated doit faire ≈ l'enveloppe (écart < 3%).
- icon = un emoji pertinent.
- Postes typiques d'un mariage sénégalais : lieu/salle, traiteur, tenues & bazin, décoration & fleurs, photo/vidéo, animation/DJ/sabar, faire-part, transport, ndawtal/ndaxal, imprévus.
- Pondère selon les priorités fournies (les priorités reçoivent une part plus généreuse).`;

    const prompt = `Enveloppe globale : ${fmtFCFA(budget)} FCFA. Ville : ${cityLabel(w)}. Invités : ${row.guests}. Cérémonies : ${cer}. Priorités : ${priorities}. Style : ${row.styles[0] ?? 'non précisé'}.`;

    try {
      const res = await ai.complete({ task: 'budget', userId: auth.user.sub, system, prompt, maxTokens: 700 });
      const out = ResultSchema.safeParse(asArray(extractJson(res.text)));
      if (!out.success) {
        return NextResponse.json(
          { error: 'AI_PARSE_FAILED', message: 'Réponse IA inexploitable.' },
          { status: 502, headers: { 'x-request-id': ctx.requestId } },
        );
      }
      const categories = out.data.map((c) => ({ name: c.name.trim(), icon: c.icon, allocated: c.allocated }));
      const total = categories.reduce((s, c) => s + c.allocated, 0);
      return NextResponse.json(
        { ok: true, categories, total, budget, cached: res.cached },
        { headers: { 'x-request-id': ctx.requestId } },
      );
    } catch (err) {
      return mapAiError(err, ctx.requestId);
    }
  });
}
