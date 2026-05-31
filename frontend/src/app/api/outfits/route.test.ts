// SamaMariage — tests /api/outfits (+ [id]).
import { prismaMock } from '@/test-utils/prisma-mock';
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

mockNextCookies();
vi.mock('@/lib/server/middleware', () => ({ requireAuth: vi.fn() }));

import { requireAuth } from '@/lib/server/middleware';
import { GET, POST } from './route';
import { PATCH, DELETE } from './[id]/route';

const mockRequireAuth = vi.mocked(requireAuth);
function req(method: string, body?: unknown, opts: { csrf?: 'match' | 'missing' } = {}): NextRequest {
  const csrf = opts.csrf ?? 'match';
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (csrf === 'match') { headers['x-csrf-token'] = 'csrf-tok'; headers['cookie'] = 'app-csrf=csrf-tok'; }
  const init: { method: string; headers: Record<string, string>; body?: string } = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  return new NextRequest('http://test/api/outfits', init);
}
const ctxId = { params: Promise.resolve({ id: 'o1' }) };

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ user: { sub: 'u1', email: 'b@x.com' } });
});

describe('/api/outfits', () => {
  it('GET liste (scope userId)', async () => {
    prismaMock.outfit.findMany.mockResolvedValue([{ id: 'o1' }] as never);
    const res = await GET(req('GET'));
    expect(res.status).toBe(200);
    expect(prismaMock.outfit.findMany.mock.calls[0]?.[0]?.where).toEqual({ userId: 'u1' });
  });
  it('POST crée un look', async () => {
    prismaMock.outfit.create.mockResolvedValue({ id: 'o1' } as never);
    const res = await POST(req('POST', { ceremony: 'takk', title: 'Bazin riche', cost: 320000 }));
    expect(res.status).toBe(201);
    expect(prismaMock.outfit.create.mock.calls[0]?.[0]?.data).toMatchObject({ userId: 'u1', title: 'Bazin riche', cost: 320000 });
  });
  it('POST 400 si titre vide', async () => {
    const res = await POST(req('POST', { title: '' }));
    expect(res.status).toBe(400);
  });
  it('POST 403 sans CSRF', async () => {
    const res = await POST(req('POST', { title: 'X' }, { csrf: 'missing' }));
    expect(res.status).toBe(403);
    expect(mockRequireAuth).not.toHaveBeenCalled();
  });
  it('PATCH met à jour le statut (scope userId)', async () => {
    prismaMock.outfit.updateMany.mockResolvedValue({ count: 1 } as never);
    prismaMock.outfit.findUnique.mockResolvedValue({ id: 'o1', status: 'READY' } as never);
    const res = await PATCH(req('PATCH', { status: 'READY' }), ctxId);
    expect(res.status).toBe(200);
    expect(prismaMock.outfit.updateMany.mock.calls[0]?.[0]?.where).toEqual({ id: 'o1', userId: 'u1' });
  });
  it('DELETE 404 si pas au user', async () => {
    prismaMock.outfit.deleteMany.mockResolvedValue({ count: 0 } as never);
    expect((await DELETE(req('DELETE'), ctxId)).status).toBe(404);
  });
  it('GET 401 si non authentifié', async () => {
    mockRequireAuth.mockResolvedValueOnce(NextResponse.json({ error: 'no' }, { status: 401 }));
    expect((await GET(req('GET'))).status).toBe(401);
  });
});
