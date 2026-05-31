// SamaMariage — tests GET/POST /api/pro/agenda (disponibilités + réservations).
import { prismaMock } from '@/test-utils/prisma-mock';
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

mockNextCookies();
vi.mock('@/lib/server/middleware/require-vendor', () => ({ requireVendor: vi.fn() }));

import { requireVendor } from '@/lib/server/middleware/require-vendor';
import { GET, POST } from './route';

const mockRequireVendor = vi.mocked(requireVendor);
const vendorCtx = { user: { sub: 'u1', email: 'p@x.com' }, vendor: { id: 'v1' } };

function req(method: 'GET' | 'POST', body?: unknown, opts: { csrf?: 'match' | 'missing' } = {}): NextRequest {
  const csrf = opts.csrf ?? 'match';
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (csrf === 'match') {
    headers['x-csrf-token'] = 'csrf-tok';
    headers['cookie'] = 'app-csrf=csrf-tok';
  }
  const init: { method: string; headers: Record<string, string>; body?: string } = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  return new NextRequest('http://test/api/pro/agenda', init);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireVendor.mockResolvedValue(vendorCtx as never);
});

describe('GET /api/pro/agenda', () => {
  it('renvoie blocks (YYYY-MM-DD) + bookings ACCEPTED datées', async () => {
    prismaMock.availabilityBlock.findMany.mockResolvedValue([
      { date: new Date('2026-12-24T00:00:00.000Z') },
      { date: new Date('2026-12-25T00:00:00.000Z') },
    ] as never);
    prismaMock.quoteRequest.findMany.mockResolvedValue([
      { eventDate: new Date('2026-12-15T00:00:00.000Z'), coupleName: 'Aïssatou & Ousmane', city: 'Saly' },
    ] as never);
    const res = await GET(req('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.blocks).toEqual(['2026-12-24', '2026-12-25']);
    expect(body.bookings).toEqual([{ date: '2026-12-15', coupleName: 'Aïssatou & Ousmane', city: 'Saly' }]);
  });

  it('404 si pas un prestataire', async () => {
    mockRequireVendor.mockResolvedValueOnce(NextResponse.json({ error: 'VENDOR_NOT_FOUND' }, { status: 404 }));
    const res = await GET(req('GET'));
    expect(res.status).toBe(404);
  });
});

describe('POST /api/pro/agenda (toggle)', () => {
  it('bloque une date libre (blocked=true)', async () => {
    prismaMock.availabilityBlock.findUnique.mockResolvedValue(null as never);
    prismaMock.availabilityBlock.create.mockResolvedValue({ id: 'b1' } as never);
    const res = await POST(req('POST', { date: '2026-12-24' }));
    expect(res.status).toBe(200);
    expect((await res.json()).blocked).toBe(true);
    expect(prismaMock.availabilityBlock.create).toHaveBeenCalled();
  });

  it('libère une date déjà bloquée (blocked=false)', async () => {
    prismaMock.availabilityBlock.findUnique.mockResolvedValue({ id: 'b1' } as never);
    prismaMock.availabilityBlock.delete.mockResolvedValue({ id: 'b1' } as never);
    const res = await POST(req('POST', { date: '2026-12-24' }));
    expect(res.status).toBe(200);
    expect((await res.json()).blocked).toBe(false);
    expect(prismaMock.availabilityBlock.delete).toHaveBeenCalled();
  });

  it('400 si date au mauvais format', async () => {
    const res = await POST(req('POST', { date: '24/12/2026' }));
    expect(res.status).toBe(400);
    expect(prismaMock.availabilityBlock.findUnique).not.toHaveBeenCalled();
  });

  it('403 si CSRF manquant — avant requireVendor', async () => {
    const res = await POST(req('POST', { date: '2026-12-24' }, { csrf: 'missing' }));
    expect(res.status).toBe(403);
    expect(mockRequireVendor).not.toHaveBeenCalled();
  });
});
