// SamaMariage — tests GET /api/pro/paiements (vue financière dérivée).
import { prismaMock } from '@/test-utils/prisma-mock';
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

mockNextCookies();
vi.mock('@/lib/server/middleware/require-vendor', () => ({ requireVendor: vi.fn() }));

import { requireVendor } from '@/lib/server/middleware/require-vendor';
import { GET } from './route';

const mockRequireVendor = vi.mocked(requireVendor);

function req() {
  return new NextRequest('http://test/api/pro/paiements');
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.VENDOR_COMMISSION_PCT;
  mockRequireVendor.mockResolvedValue({ user: { sub: 'u1', email: 'p@x.com' }, vendor: { id: 'v1', payoutMethod: 'wave', payoutAccount: '••7741' } } as never);
});

describe('GET /api/pro/paiements', () => {
  it('calcule brut/commission/net (8%) sur les ACCEPTED, en attente sur les QUOTED', async () => {
    prismaMock.quoteRequest.findMany.mockResolvedValue([
      { id: 'a', coupleName: 'X', status: 'ACCEPTED', quoteAmount: 1000000, updatedAt: new Date('2026-05-30T00:00:00Z') },
      { id: 'b', coupleName: 'Y', status: 'ACCEPTED', quoteAmount: 500000, updatedAt: new Date('2026-05-28T00:00:00Z') },
      { id: 'c', coupleName: 'Z', status: 'QUOTED', quoteAmount: 600000, updatedAt: new Date('2026-05-26T00:00:00Z') },
    ] as never);
    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.commissionPct).toBe(8);
    expect(body.grossTotal).toBe(1500000); // ACCEPTED uniquement
    expect(body.commission).toBe(120000); // 8%
    expect(body.net).toBe(1380000);
    expect(body.pendingTotal).toBe(600000); // QUOTED
    expect(body.transactions).toHaveLength(3);
    expect(body.payoutMethod).toBe('wave');
  });

  it('respecte VENDOR_COMMISSION_PCT', async () => {
    process.env.VENDOR_COMMISSION_PCT = '10';
    prismaMock.quoteRequest.findMany.mockResolvedValue([
      { id: 'a', coupleName: 'X', status: 'ACCEPTED', quoteAmount: 1000000, updatedAt: new Date('2026-05-30T00:00:00Z') },
    ] as never);
    const body = await (await GET(req())).json();
    expect(body.commissionPct).toBe(10);
    expect(body.commission).toBe(100000);
    expect(body.net).toBe(900000);
  });

  it('404 si pas un prestataire', async () => {
    mockRequireVendor.mockResolvedValueOnce(NextResponse.json({ error: 'VENDOR_NOT_FOUND' }, { status: 404 }));
    expect((await GET(req())).status).toBe(404);
  });
});
