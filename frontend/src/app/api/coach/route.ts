// SamaMariage — POST /api/coach
//
// Chat avec Sama Coach (assistante de mariage IA). Conversation multi-tours :
// le client envoie les tours user/assistant ; le serveur injecte le system
// prompt (persona + contexte du profil Wedding réel) et route vers Sonnet via
// l'AI Gateway (task 'chat', sans cache réponse).
// requireAuth + CSRF. 503 si l'IA n'est pas configurée, 429 si quota atteint.
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { ai, AiNotConfiguredError, AiRateLimitError } from '@/lib/server/ai/gateway';
import { buildCoachSystem, parseCoachEnvelope } from '@/lib/server/ai/coach';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

// On ne garde que les derniers tours pour borner les coûts et la latence.
const MAX_TURNS = 16;

const BodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
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

    // Dernier tour = utilisateur (sinon rien à répondre).
    const turns = parsed.data.messages.slice(-MAX_TURNS);
    if (turns[turns.length - 1]?.role !== 'user') {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', message: 'Le dernier message doit être celui de la mariée.' },
        { status: 400, headers: { 'x-request-id': ctx.requestId } },
      );
    }

    const wedding = await prisma.wedding.findUnique({ where: { userId: auth.user.sub } });
    const fallbackName = (auth.user.email ?? 'la mariée').split('@')[0] || 'la mariée';
    const system = buildCoachSystem(wedding, fallbackName);

    try {
      const res = await ai.complete({
        task: 'chat',
        userId: auth.user.sub,
        system,
        prompt: turns[turns.length - 1]?.content ?? '',
        messages: turns.map((m) => ({ role: m.role, content: m.content })),
        maxTokens: 900,
      });
      const envelope = parseCoachEnvelope(res.text);
      return NextResponse.json(
        { ok: true, ...envelope, model: res.model, fallback: res.fallback },
        { headers: { 'x-request-id': ctx.requestId } },
      );
    } catch (err) {
      if (err instanceof AiNotConfiguredError) {
        return NextResponse.json(
          { error: 'AI_NOT_CONFIGURED', message: "Sama Coach n'est pas encore activée." },
          { status: 503, headers: { 'x-request-id': ctx.requestId } },
        );
      }
      if (err instanceof AiRateLimitError) {
        return NextResponse.json(
          { error: 'AI_RATE_LIMITED', message: 'Limite IA quotidienne atteinte. Reviens demain 🌸' },
          { status: 429, headers: { 'x-request-id': ctx.requestId } },
        );
      }
      return NextResponse.json(
        { error: 'AI_ERROR', message: 'Sama Coach ne répond pas, là tout de suite. Réessaie dans un instant.' },
        { status: 502, headers: { 'x-request-id': ctx.requestId } },
      );
    }
  });
}
