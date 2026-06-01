// SamaMariage — tests GET /api/admin/signalements (file de modération).
import { prismaMock } from '@/test-utils/prisma-mock';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/server/middleware', () => ({ requireAdmin: vi.fn() }));

import { requireAdmin } from '@/lib/server/middleware';
import { GET } from './route';

const mockRequireAdmin = vi.mocked(requireAdmin);
const req = (qs = '') => new NextRequest(`http://test/api/admin/signalements${qs}`, { method: 'GET' });

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdmin.mockResolvedValue({ user: { sub: 'u1', email: 'a@x.com' }, admin: { id: 'u1', email: 'a@x.com', role: 'ADMIN' } } as never);
  prismaMock.signalement.findMany.mockResolvedValue([
    { id: 's1', targetType: 'Vendor', targetLabel: 'Photo Express', severity: 'high', reason: 'Doublon', status: 'OPEN', outcome: '', createdAt: new Date('2026-05-31T10:00:00Z'), reporter: { email: 'm@x.com' } },
  ] as never);
  prismaMock.signalement.count.mockResolvedValue(4 as never);
});

describe('GET /api/admin/signalements', () => {
  it('liste + stats', async () => {
    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.signalements[0]).toMatchObject({ targetLabel: 'Photo Express', severity: 'high', reporterEmail: 'm@x.com' });
    expect(body.stats).toHaveProperty('open');
  });

  it('tab=open → where status OPEN', async () => {
    await GET(req('?tab=open'));
    const arg = prismaMock.signalement.findMany.mock.calls[0]?.[0] as { where?: { status?: string } };
    expect(arg?.where?.status).toBe('OPEN');
  });

  it('403 si non-admin', async () => {
    mockRequireAdmin.mockResolvedValueOnce(NextResponse.json({ error: 'no' }, { status: 403 }));
    expect((await GET(req())).status).toBe(403);
  });
});
