// SamaMariage — tests GET /api/pro/avis + PATCH /api/pro/avis/[id].
import { prismaMock } from '@/test-utils/prisma-mock';
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

mockNextCookies();
vi.mock('@/lib/server/middleware/require-vendor', () => ({ requireVendor: vi.fn() }));

import { requireVendor } from '@/lib/server/middleware/require-vendor';
import { GET } from './route';
import { PATCH } from './[id]/route';

const mockRequireVendor = vi.mocked(requireVendor);
const vendorCtx = { user: { sub: 'u1', email: 'p@x.com' }, vendor: { id: 'v1' } };

function req(method: 'GET' | 'PATCH', body?: unknown, opts: { csrf?: 'match' | 'missing' } = {}): NextRequest {
  const csrf = opts.csrf ?? 'match';
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (csrf === 'match') {
    headers['x-csrf-token'] = 'csrf-tok';
    headers['cookie'] = 'app-csrf=csrf-tok';
  }
  const init: { method: string; headers: Record<string, string>; body?: string } = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  return new NextRequest('http://test/api/pro/avis', init);
}
const ctxId = { params: Promise.resolve({ id: 'r1' }) };

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireVendor.mockResolvedValue(vendorCtx as never);
});

describe('GET /api/pro/avis', () => {
  it('renvoie les avis + résumé (moyenne, total, répartition)', async () => {
    prismaMock.review.findMany.mockResolvedValue([
      { id: 'a', rating: 5 }, { id: 'b', rating: 5 }, { id: 'c', rating: 4 }, { id: 'd', rating: 3 },
    ] as never);
    const res = await GET(req('GET'));
    const body = await res.json();
    expect(body.summary.count).toBe(4);
    expect(body.summary.average).toBe(4.3); // (5+5+4+3)/4 = 4.25 → 4.3
    expect(body.summary.distribution).toMatchObject({ 5: 2, 4: 1, 3: 1, 2: 0, 1: 0 });
  });

  it('404 si pas un prestataire', async () => {
    mockRequireVendor.mockResolvedValueOnce(NextResponse.json({ error: 'VENDOR_NOT_FOUND' }, { status: 404 }));
    expect((await GET(req('GET'))).status).toBe(404);
  });
});

describe('PATCH /api/pro/avis/[id]', () => {
  it('publie une réponse', async () => {
    prismaMock.review.updateMany.mockResolvedValue({ count: 1 } as never);
    prismaMock.review.findUnique.mockResolvedValue({ id: 'r1', reply: 'Merci' } as never);
    const res = await PATCH(req('PATCH', { reply: 'Merci !' }), ctxId);
    expect(res.status).toBe(200);
    const args = prismaMock.review.updateMany.mock.calls[0]?.[0];
    expect(args?.where).toEqual({ id: 'r1', vendorId: 'v1' });
    expect(args?.data?.reply).toBe('Merci !');
  });

  it('400 si réponse vide', async () => {
    const res = await PATCH(req('PATCH', { reply: '' }), ctxId);
    expect(res.status).toBe(400);
  });

  it('403 si CSRF manquant', async () => {
    const res = await PATCH(req('PATCH', { reply: 'X' }, { csrf: 'missing' }), ctxId);
    expect(res.status).toBe(403);
  });

  it('404 si l’avis n’est pas au pro', async () => {
    prismaMock.review.updateMany.mockResolvedValue({ count: 0 } as never);
    const res = await PATCH(req('PATCH', { reply: 'X' }), ctxId);
    expect(res.status).toBe(404);
  });
});
