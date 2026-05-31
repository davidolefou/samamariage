// SamaMariage — GET / POST /api/bridesmaids  (groupe ndaxal de la mariée)
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(40).default(''),
  cotisationAmount: z.number().int().min(0).max(1_000_000_000).default(0),
  measurementsDone: z.boolean().default(false),
  cotisationPaid: z.boolean().default(false),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAuth(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const bridesmaids = await prisma.bridesmaid.findMany({ where: { userId: auth.user.sub }, orderBy: { createdAt: 'asc' } });
    const stats = { total: bridesmaids.length, measurementsDone: 0, paid: 0, collected: 0 };
    for (const b of bridesmaids) {
      if (b.measurementsDone) stats.measurementsDone += 1;
      if (b.cotisationPaid) {
        stats.paid += 1;
        stats.collected += b.cotisationAmount;
      }
    }
    return NextResponse.json({ ok: true, bridesmaids, stats }, { headers: { 'x-request-id': ctx.requestId } });
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
    const bridesmaid = await prisma.bridesmaid.create({
      data: { userId: auth.user.sub, name: d.name.trim(), phone: d.phone.trim(), cotisationAmount: d.cotisationAmount, measurementsDone: d.measurementsDone, cotisationPaid: d.cotisationPaid },
    });
    return NextResponse.json({ ok: true, bridesmaid }, { status: 201, headers: { 'x-request-id': ctx.requestId } });
  });
}
