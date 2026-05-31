// SamaMariage — tests GET /api/pro/demandes + PATCH /api/pro/demandes/[id].
//
// requireVendor est mocké (renvoie un VendorContext ou un NextResponse 404).
import { prismaMock } from '@/test-utils/prisma-mock';
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

mockNextCookies();

vi.mock('@/lib/server/middleware/require-vendor', () => ({
  requireVendor: vi.fn(),
}));

import { requireVendor } from '@/lib/server/middleware/require-vendor';
import { GET } from './route';
import { PATCH } from './[id]/route';

const mockRequireVendor = vi.mocked(requireVendor);
const vendorCtx = { user: { sub: 'user-1', email: 'pro@x.com' }, vendor: { id: 'v1' } };

function req(method: 'GET' | 'PATCH', body?: unknown, opts: { csrf?: 'match' | 'missing' } = {}): NextRequest {
  const csrf = opts.csrf ?? 'match';
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (csrf === 'match') {
    headers['x-csrf-token'] = 'csrf-tok';
    headers['cookie'] = 'app-csrf=csrf-tok';
  }
  const init: { method: string; headers: Record<string, string>; body?: string } = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  return new NextRequest('http://test/api/pro/demandes', init);
}
const ctxId = { params: Promise.resolve({ id: 'q1' }) };

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireVendor.mockResolvedValue(vendorCtx as never);
});

describe('GET /api/pro/demandes', () => {
  it('liste + stats par statut', async () => {
    prismaMock.quoteRequest.findMany.mockResolvedValue([
      { id: 'a', status: 'NEW' }, { id: 'b', status: 'NEW' }, { id: 'c', status: 'QUOTED' },
      { id: 'd', status: 'ACCEPTED' }, { id: 'e', status: 'DECLINED' },
    ] as never);
    const res = await GET(req('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.requests).toHaveLength(5);
    expect(body.stats).toEqual({ new: 2, quoted: 1, accepted: 1, declined: 1 });
    // scope vendor
    expect(prismaMock.quoteRequest.findMany.mock.calls[0]?.[0]?.where).toEqual({ vendorId: 'v1' });
  });

  it('404 si pas un prestataire', async () => {
    mockRequireVendor.mockResolvedValueOnce(NextResponse.json({ error: 'VENDOR_NOT_FOUND' }, { status: 404 }));
    const res = await GET(req('GET'));
    expect(res.status).toBe(404);
    expect(prismaMock.quoteRequest.findMany).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/pro/demandes/[id]', () => {
  it('envoie un devis (QUOTED + montant)', async () => {
    prismaMock.quoteRequest.updateMany.mockResolvedValue({ count: 1 } as never);
    prismaMock.quoteRequest.findUnique.mockResolvedValue({ id: 'q1', status: 'QUOTED', quoteAmount: 680000 } as never);
    const res = await PATCH(req('PATCH', { action: 'quote', quoteAmount: 680000, quoteMessage: 'Voici' }), ctxId);
    expect(res.status).toBe(200);
    const args = prismaMock.quoteRequest.updateMany.mock.calls[0]?.[0];
    expect(args?.where).toEqual({ id: 'q1', vendorId: 'v1' });
    expect(args?.data).toMatchObject({ status: 'QUOTED', quoteAmount: 680000, quoteMessage: 'Voici' });
  });

  it('décline (DECLINED)', async () => {
    prismaMock.quoteRequest.updateMany.mockResolvedValue({ count: 1 } as never);
    prismaMock.quoteRequest.findUnique.mockResolvedValue({ id: 'q1', status: 'DECLINED' } as never);
    const res = await PATCH(req('PATCH', { action: 'decline' }), ctxId);
    expect(res.status).toBe(200);
    expect(prismaMock.quoteRequest.updateMany.mock.calls[0]?.[0]?.data).toMatchObject({ status: 'DECLINED' });
  });

  it('400 si action invalide', async () => {
    const res = await PATCH(req('PATCH', { action: 'bogus' }), ctxId);
    expect(res.status).toBe(400);
    expect(prismaMock.quoteRequest.updateMany).not.toHaveBeenCalled();
  });

  it('400 si quote sans montant', async () => {
    const res = await PATCH(req('PATCH', { action: 'quote' }), ctxId);
    expect(res.status).toBe(400);
  });

  it('403 si CSRF manquant — avant requireVendor', async () => {
    const res = await PATCH(req('PATCH', { action: 'decline' }, { csrf: 'missing' }), ctxId);
    expect(res.status).toBe(403);
    expect(mockRequireVendor).not.toHaveBeenCalled();
  });

  it('404 si la demande n’appartient pas au pro', async () => {
    prismaMock.quoteRequest.updateMany.mockResolvedValue({ count: 0 } as never);
    const res = await PATCH(req('PATCH', { action: 'decline' }), ctxId);
    expect(res.status).toBe(404);
  });
});
