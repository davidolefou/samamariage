// SamaMariage — tests GET /api/admin/members (liste des mariées, console admin).
import { prismaMock } from '@/test-utils/prisma-mock';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/server/middleware', () => ({ requireAdmin: vi.fn() }));

import { requireAdmin } from '@/lib/server/middleware';
import { GET } from './route';

const mockRequireAdmin = vi.mocked(requireAdmin);

function req(qs = ''): NextRequest {
  return new NextRequest(`http://test/api/admin/members${qs}`, { method: 'GET' });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdmin.mockResolvedValue({
    user: { sub: 'u1', email: 'admin@x.com' },
    admin: { id: 'u1', email: 'admin@x.com', role: 'ADMIN' },
  } as never);
  prismaMock.wedding.findMany.mockResolvedValue([
    {
      id: 'w1',
      userId: 'usr1',
      fullName: 'Aïssatou Diop',
      partnerName: 'Ousmane',
      dateMode: 'PRECISE',
      datePrecise: new Date('2026-12-15T12:00:00Z'),
      dateMonth: null,
      dateInMonths: 6,
      city: 'dakar',
      cityOther: '',
      ceremonies: { takk: true, ceet: false, civil: false, reception: true },
      guests: 450,
      budget: 12_000_000,
      budgetSkip: false,
      priorities: ['traiteur'],
      styles: ['royal'],
      bridesmaids: 12,
      completedOnboarding: true,
      createdAt: new Date('2026-03-01T10:00:00Z'),
      user: { email: 'aissatou@x.com', status: 'ACTIVE', createdAt: new Date('2026-03-01T09:00:00Z') },
    },
  ] as never);
  prismaMock.user.count.mockResolvedValue(2847 as never);
  prismaMock.wedding.count.mockResolvedValue(1500 as never);
});

describe('GET /api/admin/members', () => {
  it('renvoie la liste des mariées + stats', async () => {
    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.members).toHaveLength(1);
    expect(body.members[0]).toMatchObject({ fullName: 'Aïssatou Diop', email: 'aissatou@x.com', city: 'dakar' });
    expect(body.stats).toMatchObject({ total: 2847, weddings: 1500 });
  });

  it('filtre diaspora → where city=diasp', async () => {
    await GET(req('?diaspora=1'));
    const arg = prismaMock.wedding.findMany.mock.calls[0]?.[0] as { where?: { city?: string } };
    expect(arg?.where?.city).toBe('diasp');
  });

  it('recherche q → OR sur fullName/cityOther', async () => {
    await GET(req('?q=fatou'));
    const arg = prismaMock.wedding.findMany.mock.calls[0]?.[0] as { where?: { OR?: unknown[] } };
    expect(Array.isArray(arg?.where?.OR)).toBe(true);
  });

  it('403/401 propagé si non-admin', async () => {
    mockRequireAdmin.mockResolvedValueOnce(NextResponse.json({ error: 'no' }, { status: 403 }));
    expect((await GET(req())).status).toBe(403);
  });
});
