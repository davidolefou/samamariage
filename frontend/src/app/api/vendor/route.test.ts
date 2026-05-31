// SamaMariage — tests GET/PUT /api/vendor (profil prestataire).
//
// Bootstrap : prisma-mock en premier, mockNextCookies, requireAuth mocké.
// Couverture : GET (null + présent), PUT upsert happy path, validation (400),
// CSRF (403 avant auth), auth (401).
import { prismaMock } from '@/test-utils/prisma-mock';
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

mockNextCookies();

vi.mock('@/lib/server/middleware', () => ({
  requireAuth: vi.fn(),
}));

import { requireAuth } from '@/lib/server/middleware';
import { GET, PUT } from './route';

const mockRequireAuth = vi.mocked(requireAuth);
const authedCtx = { user: { sub: 'user-1', email: 'pro@example.com' } };

function makeReq(
  method: 'GET' | 'PUT',
  body?: unknown,
  opts: { csrf?: 'match' | 'missing' } = {},
): NextRequest {
  const csrf = opts.csrf ?? 'match';
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (csrf === 'match') {
    headers['x-csrf-token'] = 'csrf-tok';
    headers['cookie'] = 'app-csrf=csrf-tok';
  }
  const init: { method: string; headers: Record<string, string>; body?: string } = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  return new NextRequest('http://test/api/vendor', init);
}

function seededVendor(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'vendor_1',
    userId: 'user-1',
    category: 'PHOTO',
    businessName: 'Adams Sidibé Studio',
    ownerName: 'Adams Sidibé',
    phone: '',
    whatsapp: '',
    city: 'dakar',
    serviceAreas: [],
    services: [],
    capacity: 0,
    priceFrom: 0,
    priceLabel: '',
    depositPolicy: '',
    description: '',
    portfolio: [],
    coverVariant: 'cv-photo',
    responseTime: '',
    vacationMode: false,
    verified: false,
    rating: 0,
    reviewCount: 0,
    status: 'DRAFT',
    payoutMethod: '',
    payoutAccount: '',
    createdAt: new Date('2026-05-31T10:00:00Z'),
    updatedAt: new Date('2026-05-31T10:00:00Z'),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue(authedCtx);
});

describe('GET /api/vendor', () => {
  it('renvoie vendor: null quand pas de profil', async () => {
    prismaMock.vendor.findUnique.mockResolvedValue(null as never);
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, vendor: null });
  });

  it('renvoie le profil existant', async () => {
    prismaMock.vendor.findUnique.mockResolvedValue(seededVendor() as never);
    const res = await GET(makeReq('GET'));
    const body = await res.json();
    expect(body.vendor.businessName).toBe('Adams Sidibé Studio');
    expect(prismaMock.vendor.findUnique).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
  });

  it('401 si non authentifié', async () => {
    mockRequireAuth.mockResolvedValueOnce(NextResponse.json({ error: 'Missing token' }, { status: 401 }));
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(401);
    expect(prismaMock.vendor.findUnique).not.toHaveBeenCalled();
  });
});

describe('PUT /api/vendor — upsert', () => {
  it('upsert le profil et renvoie 200', async () => {
    prismaMock.vendor.upsert.mockResolvedValue(seededVendor({ businessName: 'Le Carré', category: 'FOOD' }) as never);
    const res = await PUT(makeReq('PUT', { category: 'FOOD', businessName: 'Le Carré', priceFrom: 2640000 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    const args = prismaMock.vendor.upsert.mock.calls[0]?.[0];
    expect(args?.where).toEqual({ userId: 'user-1' });
    expect(args?.create).toMatchObject({ userId: 'user-1', category: 'FOOD', businessName: 'Le Carré', priceFrom: 2640000 });
    expect(args?.update).toMatchObject({ category: 'FOOD', businessName: 'Le Carré' });
  });

  it("n'expose pas verified/rating/status à l'upsert", async () => {
    prismaMock.vendor.upsert.mockResolvedValue(seededVendor() as never);
    await PUT(makeReq('PUT', { category: 'PHOTO', businessName: 'X', verified: true, rating: 5, status: 'PUBLISHED' }));
    const args = prismaMock.vendor.upsert.mock.calls[0]?.[0];
    expect(args?.update).not.toHaveProperty('verified');
    expect(args?.update).not.toHaveProperty('rating');
    expect(args?.update).not.toHaveProperty('status');
  });

  it('400 VALIDATION_FAILED si category manquante', async () => {
    const res = await PUT(makeReq('PUT', { businessName: 'X' }));
    expect(res.status).toBe(400);
    expect(prismaMock.vendor.upsert).not.toHaveBeenCalled();
  });

  it('400 VALIDATION_FAILED si businessName vide', async () => {
    const res = await PUT(makeReq('PUT', { category: 'PHOTO', businessName: '' }));
    expect(res.status).toBe(400);
    expect(prismaMock.vendor.upsert).not.toHaveBeenCalled();
  });

  it('403 si CSRF manquant — avant requireAuth', async () => {
    const res = await PUT(makeReq('PUT', { category: 'PHOTO', businessName: 'X' }, { csrf: 'missing' }));
    expect(res.status).toBe(403);
    expect(mockRequireAuth).not.toHaveBeenCalled();
    expect(prismaMock.vendor.upsert).not.toHaveBeenCalled();
  });

  it('401 si non authentifié', async () => {
    mockRequireAuth.mockResolvedValueOnce(NextResponse.json({ error: 'Missing token' }, { status: 401 }));
    const res = await PUT(makeReq('PUT', { category: 'PHOTO', businessName: 'X' }));
    expect(res.status).toBe(401);
    expect(prismaMock.vendor.upsert).not.toHaveBeenCalled();
  });
});
