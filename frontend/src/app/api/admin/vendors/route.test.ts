// SamaMariage — tests GET /api/admin/vendors (annuaire + file de validation).
import { prismaMock } from '@/test-utils/prisma-mock';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/server/middleware', () => ({ requireAdmin: vi.fn() }));

import { requireAdmin } from '@/lib/server/middleware';
import { GET } from './route';

const mockRequireAdmin = vi.mocked(requireAdmin);
const req = (qs = '') => new NextRequest(`http://test/api/admin/vendors${qs}`, { method: 'GET' });

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdmin.mockResolvedValue({ user: { sub: 'u1', email: 'a@x.com' }, admin: { id: 'u1', email: 'a@x.com', role: 'ADMIN' } } as never);
  prismaMock.vendor.count.mockResolvedValue(0 as never);
  prismaMock.vendor.findMany.mockResolvedValue([
    { id: 'v1', businessName: 'Adams Sidibé Studio', category: 'PHOTO', city: 'dakar', rating: 4.9, reviewCount: 42, verified: true, featured: true, status: 'PUBLISHED', createdAt: new Date('2026-01-01T00:00:00Z') },
  ] as never);
  (prismaMock.quoteRequest.groupBy as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
    { vendorId: 'v1', _sum: { quoteAmount: 14_200_000 }, _count: { _all: 42 } },
  ] as never);
});

describe('GET /api/admin/vendors', () => {
  it('annuaire : prestataires PUBLISHED/SUSPENDED + revenus + stats', async () => {
    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.vendors[0]).toMatchObject({ businessName: 'Adams Sidibé Studio', revenue: 14_200_000, bookings: 42 });
    expect(body.stats).toHaveProperty('pending');
    const where = prismaMock.vendor.findMany.mock.calls[0]?.[0] as { where?: { status?: { in?: string[] } } };
    expect(where?.where?.status?.in).toEqual(['PUBLISHED', 'SUSPENDED']);
  });

  it('?queue=pending → file PENDING_REVIEW', async () => {
    await GET(req('?queue=pending'));
    const where = prismaMock.vendor.findMany.mock.calls[0]?.[0] as { where?: { status?: string } };
    expect(where?.where?.status).toBe('PENDING_REVIEW');
  });

  it('403/401 propagé si non-admin', async () => {
    mockRequireAdmin.mockResolvedValueOnce(NextResponse.json({ error: 'no' }, { status: 403 }));
    expect((await GET(req())).status).toBe(403);
  });
});
