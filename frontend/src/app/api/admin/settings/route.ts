// SamaMariage — GET /api/admin/settings
//
// Configuration & santé de la plateforme (console admin). Lecture seule :
// commission, acompte mini, catégories, équipe admin (rôles réels), état des
// intégrations (présence des variables d'env). Les réglages serveur se changent
// via les variables d'environnement, pas via un store applicatif. requireAdmin.
export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server/middleware';
import { prisma } from '@/lib/server/prisma';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';

const CATEGORIES = ['PHOTO', 'FOOD', 'DECOR', 'SALLE', 'DJ', 'TENUE', 'VOITURE', 'BEAUTE', 'ANIM'];

function commissionPct(): number {
  const raw = Number(process.env.VENDOR_COMMISSION_PCT);
  return Number.isFinite(raw) && raw >= 0 && raw <= 100 ? raw : 8;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAdmin('ADMIN', req.headers.get('authorization'));
    if (auth instanceof NextResponse) {
      auth.headers.set('x-request-id', ctx.requestId);
      return auth;
    }

    const team = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      orderBy: { role: 'desc' },
      take: 50,
      select: { id: true, email: true, name: true, role: true },
    });

    const env = process.env;
    const integrations = {
      ai: !!env.ANTHROPIC_API_KEY,
      email: !!(env.RESEND_API_KEY && env.EMAIL_FROM),
      storage: !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY),
      payments: !!env.BICTORYS_API_KEY,
      googleOauth: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI),
      redis: !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
    };

    return NextResponse.json(
      {
        ok: true,
        commissionPct: commissionPct(),
        depositMinPct: 30,
        categories: CATEGORIES,
        team,
        integrations,
      },
      { headers: { 'x-request-id': ctx.requestId } },
    );
  });
}
