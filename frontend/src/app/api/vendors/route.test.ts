// SamaMariage — tests GET /api/vendors (catalogue public marketplace).
import { prismaMock } from '@/test-utils/prisma-mock';
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

mockNextCookies();
import { GET } from './route';

beforeEach(() => vi.clearAllMocks());

function req(qs = '') {
  return new NextRequest('http://test/api/vendors' + qs);
}

describe('GET /api/vendors', () => {
  it('liste les prestataires PUBLISHED (projection publique)', async () => {
    prismaMock.vendor.findMany.mockResolvedValue([
      { id: 'v1', category: 'PHOTO', businessName: 'Studio', city: 'dakar', services: [], priceFrom: 650000, priceLabel: '', description: '', coverVariant: 'cv-photo', responseTime: '< 2h', verified: true, rating: 4.9, reviewCount: 10, payoutAccount: 'SECRET' },
    ] as never);
    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.vendors).toHaveLength(1);
    expect(body.vendors[0]).not.toHaveProperty('payoutAccount');
    expect(prismaMock.vendor.findMany.mock.calls[0]?.[0]?.where).toMatchObject({ status: 'PUBLISHED' });
  });

  it('filtre par catégorie valide', async () => {
    prismaMock.vendor.findMany.mockResolvedValue([] as never);
    await GET(req('?category=FOOD'));
    expect(prismaMock.vendor.findMany.mock.calls[0]?.[0]?.where).toMatchObject({ status: 'PUBLISHED', category: 'FOOD' });
  });

  it('ignore une catégorie invalide', async () => {
    prismaMock.vendor.findMany.mockResolvedValue([] as never);
    await GET(req('?category=BOGUS'));
    const where = prismaMock.vendor.findMany.mock.calls[0]?.[0]?.where as Record<string, unknown>;
    expect(where).not.toHaveProperty('category');
  });

  it('recherche texte (OR insensitive) + verified', async () => {
    prismaMock.vendor.findMany.mockResolvedValue([] as never);
    await GET(req('?q=dakar&verified=1'));
    const where = prismaMock.vendor.findMany.mock.calls[0]?.[0]?.where as Record<string, unknown>;
    expect(where.verified).toBe(true);
    expect(Array.isArray(where.OR)).toBe(true);
  });
});
