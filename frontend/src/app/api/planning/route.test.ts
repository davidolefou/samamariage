// SamaMariage — tests /api/planning (+ [id]).
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
  return new NextRequest('http://test/api/planning', init);
}
const ctxId = { params: Promise.resolve({ id: 't1' }) };

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ user: { sub: 'u1', email: 'b@x.com' } });
});

describe('/api/planning', () => {
  it('GET calcule la progression', async () => {
    prismaMock.planningTask.findMany.mockResolvedValue([
      { id: 'a', done: true }, { id: 'b', done: false }, { id: 'c', done: true }, { id: 'd', done: false },
    ] as never);
    const body = await (await GET(req('GET'))).json();
    expect(body.progress).toEqual({ total: 4, done: 2, pct: 50 });
  });
  it('POST crée une tâche', async () => {
    prismaMock.planningTask.create.mockResolvedValue({ id: 't1' } as never);
    const res = await POST(req('POST', { title: 'Réserver la salle', phase: '12–9 mois' }));
    expect(res.status).toBe(201);
    expect(prismaMock.planningTask.create.mock.calls[0]?.[0]?.data).toMatchObject({ userId: 'u1', title: 'Réserver la salle', phase: '12–9 mois' });
  });
  it('POST 400 si titre vide', async () => { expect((await POST(req('POST', { title: '' }))).status).toBe(400); });
  it('POST 403 sans CSRF', async () => {
    const res = await POST(req('POST', { title: 'X' }, { csrf: 'missing' }));
    expect(res.status).toBe(403);
    expect(mockRequireAuth).not.toHaveBeenCalled();
  });
  it('PATCH coche une tâche (scope userId)', async () => {
    prismaMock.planningTask.updateMany.mockResolvedValue({ count: 1 } as never);
    prismaMock.planningTask.findUnique.mockResolvedValue({ id: 't1', done: true } as never);
    const res = await PATCH(req('PATCH', { done: true }), ctxId);
    expect(res.status).toBe(200);
    expect(prismaMock.planningTask.updateMany.mock.calls[0]?.[0]?.where).toEqual({ id: 't1', userId: 'u1' });
  });
  it('DELETE 404 si pas au user', async () => {
    prismaMock.planningTask.deleteMany.mockResolvedValue({ count: 0 } as never);
    expect((await DELETE(req('DELETE'), ctxId)).status).toBe(404);
  });
  it('GET 401 si non authentifié', async () => {
    mockRequireAuth.mockResolvedValueOnce(NextResponse.json({ error: 'no' }, { status: 401 }));
    expect((await GET(req('GET'))).status).toBe(401);
  });
});
