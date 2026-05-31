// SamaMariage — GET / POST /api/budget  (catégories de budget de la mariée)
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const CreateSchema = z.object({
  name: z.string().min(1).max(80),
  icon: z.string().max(8).default(''),
  allocated: z.number().int().min(0).max(1_000_000_000).default(0),
  spent: z.number().int().min(0).max(1_000_000_000).default(0),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAuth(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const [categories, wedding] = await Promise.all([
      prisma.budgetCategory.findMany({ where: { userId: auth.user.sub }, orderBy: { createdAt: 'asc' } }),
      prisma.wedding.findUnique({ where: { userId: auth.user.sub }, select: { budget: true } }),
    ]);
    const allocated = categories.reduce((s, c) => s + c.allocated, 0);
    const spent = categories.reduce((s, c) => s + c.spent, 0);
    const budget = wedding?.budget ?? 0;
    return NextResponse.json(
      { ok: true, categories, totals: { budget, allocated, spent, remaining: budget - spent } },
      { headers: { 'x-request-id': ctx.requestId } },
    );
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
    const d = parsed.data;
    const category = await prisma.budgetCategory.create({
      data: { userId: auth.user.sub, name: d.name.trim(), icon: d.icon, allocated: d.allocated, spent: d.spent },
    });
    return NextResponse.json({ ok: true, category }, { status: 201, headers: { 'x-request-id': ctx.requestId } });
  });
}
