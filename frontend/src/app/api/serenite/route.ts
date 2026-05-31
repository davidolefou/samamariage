// SamaMariage — GET / POST /api/serenite  (suivi d'humeur de la mariée)
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const CreateSchema = z.object({
  score: z.number().int().min(1).max(5),
  note: z.string().max(500).default(''),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAuth(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const checkins = await prisma.moodCheckin.findMany({ where: { userId: auth.user.sub }, orderBy: { createdAt: 'desc' }, take: 30 });
    const average = checkins.length ? Math.round((checkins.reduce((s, c) => s + c.score, 0) / checkins.length) * 10) / 10 : 0;
    return NextResponse.json({ ok: true, checkins, average }, { headers: { 'x-request-id': ctx.requestId } });
  });
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
    const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_FAILED', issues: parsed.error.issues }, { status: 400, headers: { 'x-request-id': ctx.requestId } });
    }
    const checkin = await prisma.moodCheckin.create({
      data: { userId: auth.user.sub, score: parsed.data.score, note: parsed.data.note.trim() },
    });
    return NextResponse.json({ ok: true, checkin }, { status: 201, headers: { 'x-request-id': ctx.requestId } });
  });
}
