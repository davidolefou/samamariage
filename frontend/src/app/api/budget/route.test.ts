// SamaMariage — tests /api/budget (+ [id]).
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
  return new NextRequest('http://test/api/budget', init);
}
const ctxId = { params: Promise.resolve({ id: 'c1' }) };

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ user: { sub: 'u1', email: 'b@x.com' } });
});

describe('/api/budget', () => {
  it('GET agrège alloué/dépensé + budget Wedding', async () => {
    prismaMock.budgetCategory.findMany.mockResolvedValue([
      { id: 'a', allocated: 3000000, spent: 1000000 },
      { id: 'b', allocated: 2000000, spent: 500000 },
    ] as never);
    prismaMock.wedding.findUnique.mockResolvedValue({ budget: 12000000 } as never);
    const body = await (await GET(req('GET'))).json();
    expect(body.totals).toEqual({ budget: 12000000, allocated: 5000000, spent: 1500000, remaining: 10500000 });
  });
  it('POST crée une catégorie', async () => {
    prismaMock.budgetCategory.create.mockResolvedValue({ id: 'c1' } as never);
    const res = await POST(req('POST', { name: 'Traiteur', allocated: 2600000, icon: '🍽️' }));
    expect(res.status).toBe(201);
    expect(prismaMock.budgetCategory.create.mock.calls[0]?.[0]?.data).toMatchObject({ userId: 'u1', name: 'Traiteur', allocated: 2600000 });
  });
  it('POST 400 si nom vide', async () => { expect((await POST(req('POST', { name: '' }))).status).toBe(400); });
  it('POST 403 sans CSRF', async () => {
    const res = await POST(req('POST', { name: 'X' }, { csrf: 'missing' }));
    expect(res.status).toBe(403);
    expect(mockRequireAuth).not.toHaveBeenCalled();
  });
  it('PATCH met à jour le dépensé (scope userId)', async () => {
    prismaMock.budgetCategory.updateMany.mockResolvedValue({ count: 1 } as never);
    prismaMock.budgetCategory.findUnique.mockResolvedValue({ id: 'c1', spent: 999 } as never);
    const res = await PATCH(req('PATCH', { spent: 999 }), ctxId);
    expect(res.status).toBe(200);
    expect(prismaMock.budgetCategory.updateMany.mock.calls[0]?.[0]?.where).toEqual({ id: 'c1', userId: 'u1' });
  });
  it('DELETE 404 si pas au user', async () => {
    prismaMock.budgetCategory.deleteMany.mockResolvedValue({ count: 0 } as never);
    expect((await DELETE(req('DELETE'), ctxId)).status).toBe(404);
  });
  it('GET 401 si non authentifié', async () => {
    mockRequireAuth.mockResolvedValueOnce(NextResponse.json({ error: 'no' }, { status: 401 }));
    expect((await GET(req('GET'))).status).toBe(401);
  });
});
