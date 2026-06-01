// SamaMariage — tests PATCH /api/admin/signalements/[id] (résoudre / classer).
import { prismaMock } from '@/test-utils/prisma-mock';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/server/middleware', () => ({ requireAdmin: vi.fn() }));
vi.mock('@/lib/server/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/server/auth')>('@/lib/server/auth');
  return { ...actual, verifyCsrf: vi.fn() };
});
vi.mock('@/lib/server/admin/audit', () => ({ logAdminAction: vi.fn().mockResolvedValue(undefined) }));

import { requireAdmin } from '@/lib/server/middleware';
import { verifyCsrf } from '@/lib/server/auth';
import { logAdminAction } from '@/lib/server/admin/audit';
import { PATCH } from './route';

const mockRequireAdmin = vi.mocked(requireAdmin);
const mockCsrf = vi.mocked(verifyCsrf);
const params = Promise.resolve({ id: 's1' });
const req = (body: unknown) => new NextRequest('http://test/api/admin/signalements/s1', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  mockCsrf.mockReturnValue(null);
  mockRequireAdmin.mockResolvedValue({ user: { sub: 'u1', email: 'a@x.com' }, admin: { id: 'u1', email: 'a@x.com', role: 'ADMIN' } } as never);
  prismaMock.signalement.findUnique.mockResolvedValue({ id: 's1' } as never);
  prismaMock.signalement.update.mockResolvedValue({ id: 's1', status: 'RESOLVED', outcome: 'Suspendu' } as never);
});

describe('PATCH /api/admin/signalements/[id]', () => {
  it('resolve → RESOLVED + audité', async () => {
    const res = await PATCH(req({ action: 'resolve', outcome: 'Suspendu' }), { params });
    expect(res.status).toBe(200);
    expect(prismaMock.signalement.update.mock.calls[0]?.[0]).toMatchObject({ data: { status: 'RESOLVED', outcome: 'Suspendu' } });
    expect(logAdminAction).toHaveBeenCalledTimes(1);
  });

  it('dismiss → DISMISSED', async () => {
    prismaMock.signalement.update.mockResolvedValue({ id: 's1', status: 'DISMISSED', outcome: 'Classé sans suite' } as never);
    await PATCH(req({ action: 'dismiss' }), { params });
    expect(prismaMock.signalement.update.mock.calls[0]?.[0]).toMatchObject({ data: { status: 'DISMISSED' } });
  });

  it('400 action invalide', async () => {
    expect((await PATCH(req({ action: 'nope' }), { params })).status).toBe(400);
  });

  it('403 sans CSRF avant requireAdmin', async () => {
    mockCsrf.mockReturnValueOnce(NextResponse.json({ error: 'CSRF' }, { status: 403 }));
    expect((await PATCH(req({ action: 'resolve' }), { params })).status).toBe(403);
    expect(mockRequireAdmin).not.toHaveBeenCalled();
  });

  it('404 si absent', async () => {
    prismaMock.signalement.findUnique.mockResolvedValueOnce(null as never);
    expect((await PATCH(req({ action: 'resolve' }), { params })).status).toBe(404);
  });
});
