// SamaMariage — tests PATCH /api/admin/vendors/[id] (actions de modération).
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
const params = Promise.resolve({ id: 'v1' });

function req(body: unknown): NextRequest {
  return new NextRequest('http://test/api/admin/vendors/v1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCsrf.mockReturnValue(null);
  mockRequireAdmin.mockResolvedValue({ user: { sub: 'u1', email: 'a@x.com' }, admin: { id: 'u1', email: 'a@x.com', role: 'ADMIN' } } as never);
  prismaMock.vendor.findUnique.mockResolvedValue({ id: 'v1' } as never);
  prismaMock.vendor.update.mockResolvedValue({ id: 'v1', status: 'SUSPENDED', featured: false, verified: true } as never);
});

describe('PATCH /api/admin/vendors/[id]', () => {
  it('suspend → status SUSPENDED + action auditée', async () => {
    const res = await PATCH(req({ action: 'suspend' }), { params });
    expect(res.status).toBe(200);
    expect(prismaMock.vendor.update.mock.calls[0]?.[0]).toMatchObject({ where: { id: 'v1' }, data: { status: 'SUSPENDED' } });
    expect(logAdminAction).toHaveBeenCalledTimes(1);
    expect((logAdminAction as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]).toMatchObject({ action: 'vendor.suspend', targetId: 'v1' });
  });

  it('approve → PUBLISHED + verified', async () => {
    prismaMock.vendor.update.mockResolvedValue({ id: 'v1', status: 'PUBLISHED', featured: false, verified: true } as never);
    await PATCH(req({ action: 'approve' }), { params });
    expect(prismaMock.vendor.update.mock.calls[0]?.[0]).toMatchObject({ data: { status: 'PUBLISHED', verified: true } });
  });

  it('400 action invalide', async () => {
    expect((await PATCH(req({ action: 'nope' }), { params })).status).toBe(400);
  });

  it('403 sans CSRF — avant requireAdmin', async () => {
    mockCsrf.mockReturnValueOnce(NextResponse.json({ error: 'CSRF' }, { status: 403 }));
    const res = await PATCH(req({ action: 'suspend' }), { params });
    expect(res.status).toBe(403);
    expect(mockRequireAdmin).not.toHaveBeenCalled();
  });

  it('404 si prestataire absent', async () => {
    prismaMock.vendor.findUnique.mockResolvedValueOnce(null as never);
    expect((await PATCH(req({ action: 'suspend' }), { params })).status).toBe(404);
  });
});
