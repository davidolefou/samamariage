// SamaMariage — tests POST /api/pro/publish (publier / dépublier la vitrine).
import { prismaMock } from '@/test-utils/prisma-mock';
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

mockNextCookies();
vi.mock('@/lib/server/middleware/require-vendor', () => ({ requireVendor: vi.fn() }));

import { requireVendor } from '@/lib/server/middleware/require-vendor';
import { POST } from './route';

const mockRequireVendor = vi.mocked(requireVendor);

function vctx(over: Partial<Record<string, unknown>> = {}) {
  return {
    user: { sub: 'u1', email: 'p@x.com' },
    vendor: { id: 'v1', businessName: 'Studio', category: 'PHOTO', services: ['x'], priceFrom: 650000, ...over },
  };
}
function req(body?: unknown, opts: { csrf?: 'match' | 'missing' } = {}): NextRequest {
  const csrf = opts.csrf ?? 'match';
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (csrf === 'match') {
    headers['x-csrf-token'] = 'csrf-tok';
    headers['cookie'] = 'app-csrf=csrf-tok';
  }
  const init: { method: string; headers: Record<string, string>; body?: string } = { method: 'POST', headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  return new NextRequest('http://test/api/pro/publish', init);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireVendor.mockResolvedValue(vctx() as never);
});

describe('POST /api/pro/publish', () => {
  it('publie un profil complet → PUBLISHED', async () => {
    prismaMock.vendor.update.mockResolvedValue({ id: 'v1', status: 'PUBLISHED' } as never);
    const res = await POST(req({ publish: true }));
    expect(res.status).toBe(200);
    expect(prismaMock.vendor.update.mock.calls[0]?.[0]?.data).toMatchObject({ status: 'PUBLISHED' });
  });

  it('refuse de publier un profil incomplet → 400 PROFILE_INCOMPLETE', async () => {
    mockRequireVendor.mockResolvedValueOnce(vctx({ services: [], priceFrom: 0 }) as never);
    const res = await POST(req({ publish: true }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('PROFILE_INCOMPLETE');
    expect(prismaMock.vendor.update).not.toHaveBeenCalled();
  });

  it('dépublie (publish=false) sans contrôle de complétude → DRAFT', async () => {
    mockRequireVendor.mockResolvedValueOnce(vctx({ services: [], priceFrom: 0 }) as never);
    prismaMock.vendor.update.mockResolvedValue({ id: 'v1', status: 'DRAFT' } as never);
    const res = await POST(req({ publish: false }));
    expect(res.status).toBe(200);
    expect(prismaMock.vendor.update.mock.calls[0]?.[0]?.data).toMatchObject({ status: 'DRAFT' });
  });

  it('403 si CSRF manquant', async () => {
    const res = await POST(req({ publish: true }, { csrf: 'missing' }));
    expect(res.status).toBe(403);
    expect(mockRequireVendor).not.toHaveBeenCalled();
  });

  it('400 si payload invalide', async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });
});
