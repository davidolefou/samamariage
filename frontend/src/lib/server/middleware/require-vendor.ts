// SamaMariage — requireVendor : garde d'accès au portail prestataire.
//
// Vérifie l'auth puis charge le profil Vendor 1:1 de l'utilisateur.
// Renvoie 404 (et non 403) si l'utilisateur n'est pas un prestataire — on ne
// révèle pas l'existence de l'espace pro. À utiliser en tête des routes
// `/api/pro/*` : `const ctx = await requireVendor(req.headers.get('authorization'));
// if (ctx instanceof NextResponse) return ctx;` puis `ctx.vendor`.
import 'server-only';
import { NextResponse } from 'next/server';
import type { Vendor } from '@prisma/client';
import { requireAuth, type AuthContext } from './index';
import { prisma } from '@/lib/server/prisma';

export interface VendorContext extends AuthContext {
  vendor: Vendor;
}

export async function requireVendor(authHeader?: string | null): Promise<VendorContext | NextResponse> {
  const auth = await requireAuth(authHeader);
  if (auth instanceof NextResponse) return auth;
  const vendor = await prisma.vendor.findUnique({ where: { userId: auth.user.sub } });
  if (!vendor) {
    return NextResponse.json(
      { error: 'VENDOR_NOT_FOUND', message: 'Profil prestataire introuvable.' },
      { status: 404 },
    );
  }
  return { ...auth, vendor };
}
