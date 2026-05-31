// SamaMariage — tests POST /api/quote-requests (une mariée demande un devis).
import { prismaMock } from '@/test-utils/prisma-mock';
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

mockNextCookies();
vi.mock('@/lib/server/middleware', () => ({ requireAuth: vi.fn() }));

import { requireAuth } from '@/lib/server/middleware';
import { POST } from './route';

const mockRequireAuth = vi.mocked(requireAuth);
const authedCtx = { user: { sub: 'user-1', email: 'bride@x.com' } };

function req(body?: unknown, opts: { csrf?: 'match' | 'missing' } = {}): NextRequest {
  const csrf = opts.csrf ?? 'match';
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (csrf === 'match') {
    headers['x-csrf-token'] = 'csrf-tok';
    headers['cookie'] = 'app-csrf=csrf-tok';
  }
  const init: { method: string; headers: Record<string, string>; body?: string } = { method: 'POST', headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  return new NextRequest('http://test/api/quote-requests', init);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue(authedCtx);
});

describe('POST /api/quote-requests', () => {
  it('crée une demande vers un prestataire publié (201)', async () => {
    prismaMock.vendor.findUnique.mockResolvedValue({ id: 'v1', status: 'PUBLISHED' } as never);
    prismaMock.quoteRequest.create.mockResolvedValue({ id: 'q1' } as never);
    const res = await POST(req({ vendorId: 'v1', coupleName: 'Khady & Ibrahima', budget: 900000, city: 'Dakar' }));
    expect(res.status).toBe(201);
    const args = prismaMock.quoteRequest.create.mock.calls[0]?.[0];
    expect(args?.data).toMatchObject({ vendorId: 'v1', userId: 'user-1', coupleName: 'Khady & Ibrahima', budget: 900000 });
  });

  it('404 si prestataire absent', async () => {
    prismaMock.vendor.findUnique.mockResolvedValue(null as never);
    const res = await POST(req({ vendorId: 'v404' }));
    expect(res.status).toBe(404);
    expect(prismaMock.quoteRequest.create).not.toHaveBeenCalled();
  });

  it('404 si prestataire non publié (DRAFT)', async () => {
    prismaMock.vendor.findUnique.mockResolvedValue({ id: 'v1', status: 'DRAFT' } as never);
    const res = await POST(req({ vendorId: 'v1' }));
    expect(res.status).toBe(404);
    expect(prismaMock.quoteRequest.create).not.toHaveBeenCalled();
  });

  it('400 si vendorId manquant', async () => {
    const res = await POST(req({ coupleName: 'X' }));
    expect(res.status).toBe(400);
  });

  it('403 si CSRF manquant — avant requireAuth', async () => {
    const res = await POST(req({ vendorId: 'v1' }, { csrf: 'missing' }));
    expect(res.status).toBe(403);
    expect(mockRequireAuth).not.toHaveBeenCalled();
  });

  it('401 si non authentifié', async () => {
    mockRequireAuth.mockResolvedValueOnce(NextResponse.json({ error: 'no' }, { status: 401 }));
    const res = await POST(req({ vendorId: 'v1' }));
    expect(res.status).toBe(401);
    expect(prismaMock.quoteRequest.create).not.toHaveBeenCalled();
  });
});
