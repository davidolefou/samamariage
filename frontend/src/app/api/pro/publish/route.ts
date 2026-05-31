// SamaMariage — POST /api/pro/publish
//
// Le prestataire (dé)publie sa vitrine. La publication exige un profil minimal
// complet (nom, catégorie, ≥1 prestation, tarif de départ). requireVendor + CSRF.
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireVendor } from '@/lib/server/middleware/require-vendor';
import { verifyCsrf } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const Schema = z.object({ publish: z.boolean() });

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const csrfFail = verifyCsrf(req);
    if (csrfFail) {
      csrfFail.headers.set('x-request-id', ctx.requestId);
      return csrfFail;
    }
    const auth = await requireVendor(req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }
    const body = await req.json().catch(() => null);
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', issues: parsed.error.issues },
        { status: 400, headers: { 'x-request-id': ctx.requestId } },
      );
    }
    const v = auth.vendor;
    if (parsed.data.publish) {
      const complete = !!v.businessName && !!v.category && v.services.length >= 1 && v.priceFrom > 0;
      if (!complete) {
        return NextResponse.json(
          { error: 'PROFILE_INCOMPLETE', message: 'Complétez nom, prestations et tarif avant de publier.' },
          { status: 400, headers: { 'x-request-id': ctx.requestId } },
        );
      }
    }
    const vendor = await prisma.vendor.update({
      where: { id: v.id },
      data: { status: parsed.data.publish ? 'PUBLISHED' : 'DRAFT' },
    });
    return NextResponse.json({ ok: true, vendor }, { headers: { 'x-request-id': ctx.requestId } });
  });
}
