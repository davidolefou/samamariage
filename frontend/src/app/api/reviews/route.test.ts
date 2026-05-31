// SamaMariage — tests POST /api/reviews (avis mariée + recalcul agrégat).
import { prismaMock } from '@/test-utils/prisma-mock';
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

mockNextCookies();
vi.mock('@/lib/server/middleware', () => ({ requireAuth: vi.fn() }));

import { requireAuth } from '@/lib/server/middleware';
import { POST } from './route';

const mockRequireAuth = vi.mocked(requireAuth);

function req(body?: unknown, opts: { csrf?: 'match' | 'missing' } = {}): NextRequest {
  const csrf = opts.csrf ?? 'match';
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (csrf === 'match') {
    headers['x-csrf-token'] = 'csrf-tok';
    headers['cookie'] = 'app-csrf=csrf-tok';
  }
  const init: { method: string; headers: Record<string, string>; body?: string } = { method: 'POST', headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  return new NextRequest('http://test/api/reviews', init);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ user: { sub: 'u1', email: 'b@x.com' } });
  // $transaction exécute le callback avec le mock comme tx.
  prismaMock.$transaction.mockImplementation((cb: (tx: typeof prismaMock) => unknown) => cb(prismaMock) as never);
});

describe('POST /api/reviews', () => {
  it('upsert un avis et recalcule l’agrégat du prestataire', async () => {
    prismaMock.vendor.findUnique.mockResolvedValue({ id: 'v1' } as never);
    prismaMock.review.upsert.mockResolvedValue({ id: 'r1', rating: 5 } as never);
    prismaMock.review.aggregate.mockResolvedValue({ _avg: { rating: 4.83 }, _count: 12 } as never);
    prismaMock.vendor.update.mockResolvedValue({} as never);

    const res = await POST(req({ vendorId: 'v1', rating: 5, text: 'Super', weddingLabel: 'Saly' }));
    expect(res.status).toBe(201);
    expect(prismaMock.vendor.update.mock.calls[0]?.[0]?.data).toMatchObject({ rating: 4.8, reviewCount: 12 });
  });

  it('404 si prestataire absent', async () => {
    prismaMock.vendor.findUnique.mockResolvedValue(null as never);
    const res = await POST(req({ vendorId: 'v404', rating: 5 }));
    expect(res.status).toBe(404);
  });

  it('400 si note hors 1..5', async () => {
    const res = await POST(req({ vendorId: 'v1', rating: 6 }));
    expect(res.status).toBe(400);
  });

  it('403 si CSRF manquant', async () => {
    const res = await POST(req({ vendorId: 'v1', rating: 5 }, { csrf: 'missing' }));
    expect(res.status).toBe(403);
    expect(mockRequireAuth).not.toHaveBeenCalled();
  });

  it('401 si non authentifié', async () => {
    mockRequireAuth.mockResolvedValueOnce(NextResponse.json({ error: 'no' }, { status: 401 }));
    const res = await POST(req({ vendorId: 'v1', rating: 5 }));
    expect(res.status).toBe(401);
  });
});
