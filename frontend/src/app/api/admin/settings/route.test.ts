// SamaMariage — tests GET /api/admin/settings (config console admin).
import { prismaMock } from '@/test-utils/prisma-mock';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/server/middleware', () => ({ requireAdmin: vi.fn() }));

import { requireAdmin } from '@/lib/server/middleware';
import { GET } from './route';

const mockRequireAdmin = vi.mocked(requireAdmin);
const req = () => new NextRequest('http://test/api/admin/settings', { method: 'GET' });

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdmin.mockResolvedValue({ user: { sub: 'u1', email: 'a@x.com' }, admin: { id: 'u1', email: 'a@x.com', role: 'SUPERADMIN' } } as never);
  prismaMock.user.findMany.mockResolvedValue([{ id: 'u1', email: 'a@x.com', name: null, role: 'SUPERADMIN' }] as never);
});

describe('GET /api/admin/settings', () => {
  it('renvoie commission, catégories, équipe, intégrations', async () => {
    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.commissionPct).toBe('number');
    expect(body.categories).toContain('PHOTO');
    expect(body.team[0]).toMatchObject({ role: 'SUPERADMIN' });
    expect(body.integrations).toHaveProperty('ai');
    expect(body.integrations).toHaveProperty('googleOauth');
  });

  it('403 si non-admin', async () => {
    mockRequireAdmin.mockResolvedValueOnce(NextResponse.json({ error: 'no' }, { status: 403 }));
    expect((await GET(req())).status).toBe(403);
  });
});
