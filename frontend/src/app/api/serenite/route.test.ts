// SamaMariage — tests /api/serenite.
import { prismaMock } from '@/test-utils/prisma-mock';
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

mockNextCookies();
vi.mock('@/lib/server/middleware', () => ({ requireAuth: vi.fn() }));

import { requireAuth } from '@/lib/server/middleware';
import { GET, POST } from './route';

const mockRequireAuth = vi.mocked(requireAuth);
function req(method: string, body?: unknown, opts: { csrf?: 'match' | 'missing' } = {}): NextRequest {
  const csrf = opts.csrf ?? 'match';
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (csrf === 'match') { headers['x-csrf-token'] = 'csrf-tok'; headers['cookie'] = 'app-csrf=csrf-tok'; }
  const init: { method: string; headers: Record<string, string>; body?: string } = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  return new NextRequest('http://test/api/serenite', init);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ user: { sub: 'u1', email: 'b@x.com' } });
});

describe('/api/serenite', () => {
  it('GET renvoie checkins + moyenne', async () => {
    prismaMock.moodCheckin.findMany.mockResolvedValue([{ score: 4 }, { score: 5 }, { score: 3 }] as never);
    const body = await (await GET(req('GET'))).json();
    expect(body.average).toBe(4); // (4+5+3)/3
    expect(prismaMock.moodCheckin.findMany.mock.calls[0]?.[0]?.where).toEqual({ userId: 'u1' });
  });
  it('POST enregistre une humeur', async () => {
    prismaMock.moodCheckin.create.mockResolvedValue({ id: 'm1' } as never);
    const res = await POST(req('POST', { score: 4, note: 'Ça va' }));
    expect(res.status).toBe(201);
    expect(prismaMock.moodCheckin.create.mock.calls[0]?.[0]?.data).toMatchObject({ userId: 'u1', score: 4, note: 'Ça va' });
  });
  it('POST 400 si score hors 1..5', async () => { expect((await POST(req('POST', { score: 9 }))).status).toBe(400); });
  it('POST 403 sans CSRF', async () => {
    const res = await POST(req('POST', { score: 3 }, { csrf: 'missing' }));
    expect(res.status).toBe(403);
    expect(mockRequireAuth).not.toHaveBeenCalled();
  });
  it('GET 401 si non authentifié', async () => {
    mockRequireAuth.mockResolvedValueOnce(NextResponse.json({ error: 'no' }, { status: 401 }));
    expect((await GET(req('GET'))).status).toBe(401);
  });
});
