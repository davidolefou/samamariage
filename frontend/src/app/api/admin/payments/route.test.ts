// SamaMariage — tests GET /api/admin/payments (finances console admin).
import { prismaMock } from '@/test-utils/prisma-mock';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/server/middleware', () => ({ requireAdmin: vi.fn() }));

import { requireAdmin } from '@/lib/server/middleware';
import { GET } from './route';

const mockRequireAdmin = vi.mocked(requireAdmin);
const req = () => new NextRequest('http://test/api/admin/payments', { method: 'GET' });

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdmin.mockResolvedValue({ user: { sub: 'u1', email: 'a@x.com' }, admin: { id: 'u1', email: 'a@x.com', role: 'ADMIN' } } as never);
  prismaMock.quoteRequest.aggregate.mockResolvedValue({ _sum: { quoteAmount: 96_000_000 } } as never);
  prismaMock.ndawtalEntry.aggregate.mockResolvedValue({ _sum: { amount: 48_200_000 } } as never);
  prismaMock.wedding.count.mockResolvedValue(184 as never);
  (prismaMock.quoteRequest.groupBy as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
    { vendorId: 'v1', _sum: { quoteAmount: 2_600_000 } },
  ] as never);
  prismaMock.quoteRequest.findMany.mockResolvedValue([
    { coupleName: 'Fatou & Modou', quoteAmount: 1_300_000, updatedAt: new Date('2026-05-31T14:00:00Z'), vendor: { businessName: 'Le Carré' } },
  ] as never);
  prismaMock.ndawtalEntry.findMany.mockResolvedValue([
    { donorName: 'Tata Awa', amount: 240_000, createdAt: new Date('2026-05-30T19:00:00Z') },
  ] as never);
  prismaMock.vendor.findMany.mockResolvedValue([{ id: 'v1', businessName: 'Le Carré' }] as never);
});

describe('GET /api/admin/payments', () => {
  it('agrège volume, commission, net, ndawtal + transactions + payouts', async () => {
    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kpis.gross).toBe(96_000_000);
    expect(body.kpis.commission).toBe(Math.round((96_000_000 * 8) / 100));
    expect(body.kpis.netToVendors).toBe(96_000_000 - Math.round((96_000_000 * 8) / 100));
    expect(body.kpis.ndawtalTotal).toBe(48_200_000);
    expect(body.payouts[0]).toMatchObject({ businessName: 'Le Carré' });
    expect(body.transactions.length).toBeGreaterThan(0);
  });

  it('403/401 propagé si non-admin', async () => {
    mockRequireAdmin.mockResolvedValueOnce(NextResponse.json({ error: 'no' }, { status: 403 }));
    expect((await GET(req())).status).toBe(403);
  });
});
