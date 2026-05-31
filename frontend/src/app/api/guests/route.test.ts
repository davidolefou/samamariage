// SamaMariage — tests GET/POST /api/guests.
//
// Bootstrap (miroir de orders/route.test.ts) :
//   - prisma-mock en premier (hoist vi.mock pour '@/lib/server/prisma')
//   - mockNextCookies() pour cookies() async
//   - vi.mock('@/lib/server/middleware') → requireAuth contrôlable par test
//
// Couverture : happy path POST (201 + create), validation (400), CSRF (403,
// avant auth), auth (401), et GET (liste + stats calculées : confirmés,
// couverts confirmés, en attente, déclinés, répartition par côté).
import { prismaMock } from '@/test-utils/prisma-mock';
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

mockNextCookies();

vi.mock('@/lib/server/middleware', () => ({
  requireAuth: vi.fn(),
}));

import { requireAuth } from '@/lib/server/middleware';
import { GET, POST } from './route';

const mockRequireAuth = vi.mocked(requireAuth);
const authedCtx = { user: { sub: 'user-1', email: 'me@example.com' } };

function makeReq(
  method: 'GET' | 'POST',
  body?: unknown,
  opts: { csrf?: 'match' | 'missing' } = {},
): NextRequest {
  const csrf = opts.csrf ?? 'match';
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (csrf === 'match') {
    headers['x-csrf-token'] = 'csrf-tok';
    headers['cookie'] = 'app-csrf=csrf-tok';
  }
  const init: { method: string; headers: Record<string, string>; body?: string } = {
    method,
    headers,
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  return new NextRequest('http://test/api/guests', init);
}

function seededGuest(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'guest_1',
    userId: 'user-1',
    fullName: 'Aïssatou',
    phone: '',
    side: 'COMMUN',
    rsvp: 'PENDING',
    seats: 1,
    table: '',
    notes: '',
    createdAt: new Date('2026-05-31T10:00:00Z'),
    updatedAt: new Date('2026-05-31T10:00:00Z'),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue(authedCtx);
});

describe('POST /api/guests — happy path', () => {
  it('crée un·e invité·e et renvoie 201', async () => {
    prismaMock.guest.create.mockResolvedValue(seededGuest({ fullName: 'Fatou' }) as never);

    const res = await POST(makeReq('POST', { fullName: 'Fatou', side: 'MARIEE', seats: 2 }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.guest.fullName).toBe('Fatou');

    const createArgs = prismaMock.guest.create.mock.calls[0]?.[0];
    expect(createArgs?.data).toMatchObject({
      userId: 'user-1',
      fullName: 'Fatou',
      side: 'MARIEE',
      seats: 2,
      rsvp: 'PENDING',
    });
  });

  it('applique les valeurs par défaut (COMMUN / PENDING / 1 place)', async () => {
    prismaMock.guest.create.mockResolvedValue(seededGuest() as never);
    await POST(makeReq('POST', { fullName: 'Awa' }));
    const createArgs = prismaMock.guest.create.mock.calls[0]?.[0];
    expect(createArgs?.data).toMatchObject({ side: 'COMMUN', rsvp: 'PENDING', seats: 1 });
  });
});

describe('POST /api/guests — validation / auth / csrf', () => {
  it('400 VALIDATION_FAILED si nom vide', async () => {
    const res = await POST(makeReq('POST', { fullName: '' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('VALIDATION_FAILED');
    expect(prismaMock.guest.create).not.toHaveBeenCalled();
  });

  it('400 VALIDATION_FAILED si seats < 1', async () => {
    const res = await POST(makeReq('POST', { fullName: 'X', seats: 0 }));
    expect(res.status).toBe(400);
    expect(prismaMock.guest.create).not.toHaveBeenCalled();
  });

  it('403 si CSRF manquant — avant requireAuth', async () => {
    const res = await POST(makeReq('POST', { fullName: 'X' }, { csrf: 'missing' }));
    expect(res.status).toBe(403);
    expect(mockRequireAuth).not.toHaveBeenCalled();
    expect(prismaMock.guest.create).not.toHaveBeenCalled();
  });

  it('401 si non authentifié', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Missing token' }, { status: 401 }),
    );
    const res = await POST(makeReq('POST', { fullName: 'X' }));
    expect(res.status).toBe(401);
    expect(prismaMock.guest.create).not.toHaveBeenCalled();
  });
});

describe('GET /api/guests — liste + stats', () => {
  it('calcule les stats (confirmés, couverts, en attente, déclinés, par côté)', async () => {
    prismaMock.guest.findMany.mockResolvedValue([
      seededGuest({ id: 'a', rsvp: 'CONFIRMED', seats: 2, side: 'MARIEE' }),
      seededGuest({ id: 'b', rsvp: 'CONFIRMED', seats: 3, side: 'MARIE' }),
      seededGuest({ id: 'c', rsvp: 'PENDING', seats: 1, side: 'COMMUN' }),
      seededGuest({ id: 'd', rsvp: 'DECLINED', seats: 1, side: 'MARIEE' }),
      seededGuest({ id: 'e', rsvp: 'MAYBE', seats: 4, side: 'MARIE' }),
    ] as never);

    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.guests).toHaveLength(5);
    expect(body.stats).toMatchObject({
      total: 5,
      confirmed: 2,
      declined: 1,
      pending: 1,
      maybe: 1,
      confirmedSeats: 5, // 2 + 3 — uniquement les CONFIRMED
      bySide: { MARIEE: 2, MARIE: 2, COMMUN: 1 },
    });
  });

  it('401 si non authentifié', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Missing token' }, { status: 401 }),
    );
    const res = await GET(makeReq('GET'));
    expect(res.status).toBe(401);
    expect(prismaMock.guest.findMany).not.toHaveBeenCalled();
  });
});
