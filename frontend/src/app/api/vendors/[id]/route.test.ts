// SamaMariage — tests GET /api/vendors/[id] (vitrine publique).
import { prismaMock } from '@/test-utils/prisma-mock';
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

mockNextCookies();
import { GET } from './route';

function req() {
  return new NextRequest('http://test/api/vendors/v1');
}
const ctxId = { params: Promise.resolve({ id: 'v1' }) };

function vendor(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'v1', userId: 'u1', category: 'PHOTO', businessName: 'Studio', city: 'dakar',
    serviceAreas: [], services: ['x'], capacity: 0, priceFrom: 650000, priceLabel: 'dès 650k',
    description: '', portfolio: [], coverVariant: 'cv-photo', responseTime: '< 2h',
    verified: true, rating: 4.9, reviewCount: 247, whatsapp: '+221 77', status: 'PUBLISHED',
    payoutMethod: 'wave', payoutAccount: 'SECRET-ACCOUNT',
    ...over,
  };
}

beforeEach(() => vi.clearAllMocks());

describe('GET /api/vendors/[id]', () => {
  it('renvoie un prestataire publié, sans champs sensibles', async () => {
    prismaMock.vendor.findUnique.mockResolvedValue(vendor() as never);
    const res = await GET(req(), ctxId);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.vendor.businessName).toBe('Studio');
    expect(body.vendor).not.toHaveProperty('payoutAccount');
    expect(body.vendor).not.toHaveProperty('payoutMethod');
    expect(body.vendor).not.toHaveProperty('userId');
  });

  it('404 si non publié (DRAFT)', async () => {
    prismaMock.vendor.findUnique.mockResolvedValue(vendor({ status: 'DRAFT' }) as never);
    const res = await GET(req(), ctxId);
    expect(res.status).toBe(404);
  });

  it('404 si absent', async () => {
    prismaMock.vendor.findUnique.mockResolvedValue(null as never);
    const res = await GET(req(), ctxId);
    expect(res.status).toBe(404);
  });
});
