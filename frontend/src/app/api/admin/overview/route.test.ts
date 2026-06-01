// SamaMariage — tests GET /api/admin/overview (agrégats console admin).
import { prismaMock } from '@/test-utils/prisma-mock';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/server/middleware', () => ({ requireAdmin: vi.fn() }));

import { requireAdmin } from '@/lib/server/middleware';
import { GET } from './route';

const mockRequireAdmin = vi.mocked(requireAdmin);

function req(): NextRequest {
  return new NextRequest('http://test/api/admin/overview', { method: 'GET' });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdmin.mockResolvedValue({
    user: { sub: 'u1', email: 'admin@x.com' },
    admin: { id: 'u1', email: 'admin@x.com', role: 'SUPERADMIN' },
  } as never);

  prismaMock.user.count.mockResolvedValue(2847 as never);
  prismaMock.wedding.count.mockResolvedValue(1500 as never);
  prismaMock.vendor.count.mockImplementation(((args: { where?: { status?: string } }) => {
    if (args?.where?.status === 'PUBLISHED') return Promise.resolve(512);
    if (args?.where?.status === 'PENDING_REVIEW') return Promise.resolve(7);
    return Promise.resolve(0);
  }) as never);
  prismaMock.quoteRequest.aggregate.mockResolvedValue({ _sum: { quoteAmount: 96_000_000 } } as never);
  (prismaMock.vendor.groupBy as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
    { category: 'PHOTO', _count: { _all: 96 } },
    { category: 'FOOD', _count: { _all: 78 } },
  ] as never);
  // vendor.findMany est appelé 2× dans l'ordre : topVendors, puis pending.
  prismaMock.vendor.findMany
    .mockResolvedValueOnce([
      { id: 'v1', businessName: 'Adams Sidibé Studio', category: 'PHOTO', rating: 4.9, reviewCount: 42 },
    ] as never)
    .mockResolvedValueOnce([
      { businessName: 'Studio Lumière Dakar', updatedAt: new Date('2026-05-31T08:00:00Z') },
    ] as never);
  prismaMock.wedding.findMany.mockResolvedValue([
    { fullName: 'Khady Ndiaye', createdAt: new Date('2026-05-30T10:00:00Z') },
  ] as never);
  prismaMock.quoteRequest.findMany.mockResolvedValue([
    { coupleName: 'Aïssatou & Ousmane', quoteAmount: 600000, updatedAt: new Date('2026-05-31T09:00:00Z') },
  ] as never);
});

describe('GET /api/admin/overview', () => {
  it('renvoie les KPIs réels + séries + catégories + top + activité', async () => {
    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kpis).toMatchObject({
      members: 2847,
      weddings: 1500,
      vendorsActive: 512,
      vendorsPending: 7,
      grossVolume: 96_000_000,
      commissionPct: 8,
    });
    expect(body.kpis.commission).toBe(Math.round((96_000_000 * 8) / 100));
    expect(body.signupSeries).toHaveLength(6);
    expect(body.vendorsByCategory[0]).toMatchObject({ category: 'PHOTO', count: 96 });
    expect(body.topVendors[0]?.businessName).toBe('Adams Sidibé Studio');
    expect(Array.isArray(body.activity)).toBe(true);
  });

  it('propage la réponse de requireAdmin (403/401) si non-admin', async () => {
    mockRequireAdmin.mockResolvedValueOnce(NextResponse.json({ error: 'forbidden' }, { status: 403 }));
    const res = await GET(req());
    expect(res.status).toBe(403);
  });
});
