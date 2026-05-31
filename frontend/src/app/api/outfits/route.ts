// SamaMariage — GET / POST /api/outfits  (looks par cérémonie de la mariée)
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const STATUSES = ['IDEA', 'CHOSEN', 'ORDERED', 'FITTING', 'READY'] as const;

const CreateSchema = z.object({
  ceremony: z.string().max(20).default('reception'),
  title: z.string().min(1).max(120),
  fabric: z.string().max(120).default(''),
  cost: z.number().int().min(0).max(1_000_000_000).default(0),
  status: z.enum(STATUSES).default('IDEA'),
  notes: z.string().max(500).default(''),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAuth(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const outfits = await prisma.outfit.findMany({ where: { userId: auth.user.sub }, orderBy: { createdAt: 'asc' } });
    return NextResponse.json({ ok: true, outfits }, { headers: { 'x-request-id': ctx.requestId } });
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
    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', issues: parsed.error.issues },
        { status: 400, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    const d = parsed.data;
    const outfit = await prisma.outfit.create({
      data: { userId: auth.user.sub, ceremony: d.ceremony, title: d.title.trim(), fabric: d.fabric.trim(), cost: d.cost, status: d.status, notes: d.notes },
    });
    return NextResponse.json({ ok: true, outfit }, { status: 201, headers: { 'x-request-id': ctx.requestId } });
  });
}
