// SamaMariage — tests POST /api/budget/generate (ventilation budgétaire IA).
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

mockNextCookies();
vi.mock('@/lib/server/middleware', () => ({ requireAuth: vi.fn() }));
vi.mock('@/lib/server/prisma', () => ({ prisma: { wedding: { findUnique: vi.fn() } } }));
vi.mock('@/lib/server/ai/gateway', () => {
  class AiNotConfiguredError extends Error {}
  class AiRateLimitError extends Error {}
  return { ai: { complete: vi.fn() }, AiNotConfiguredError, AiRateLimitError };
});

import { requireAuth } from '@/lib/server/middleware';
import { prisma } from '@/lib/server/prisma';
import { ai, AiNotConfiguredError, AiRateLimitError } from '@/lib/server/ai/gateway';
import { POST } from './route';

const mockRequireAuth = vi.mocked(requireAuth);
const mockComplete = vi.mocked(ai.complete);
const mockFindUnique = vi.mocked(prisma.wedding.findUnique);

const WEDDING = {
  budget: 12_000_000,
  budgetSkip: false,
  guests: 450,
  ceremonies: { takk: true, ceet: false, civil: false, reception: true },
  priorities: ['traiteur'],
  styles: ['royal'],
  city: 'dakar',
  cityOther: '',
};

function req(body: unknown = {}, opts: { csrf?: 'match' | 'missing' } = {}): NextRequest {
  const csrf = opts.csrf ?? 'match';
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (csrf === 'match') {
    headers['x-csrf-token'] = 'csrf-tok';
    headers['cookie'] = 'app-csrf=csrf-tok';
  }
  return new NextRequest('http://test/api/budget/generate', { method: 'POST', headers, body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ user: { sub: 'u1', email: 'b@x.com' } } as never);
  mockFindUnique.mockResolvedValue(WEDDING as never);
});

describe('POST /api/budget/generate', () => {
  it('renvoie des postes suggérés depuis l’enveloppe', async () => {
    mockComplete.mockResolvedValue({
      text: '[{"name":"Lieu","icon":"🏛️","allocated":3360000},{"name":"Traiteur","icon":"🍽️","allocated":2640000}]',
      model: 'claude-sonnet-4-6', cached: false, fallback: false,
    } as never);
    const res = await POST(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.categories).toHaveLength(2);
    expect(body.categories[0]).toMatchObject({ name: 'Lieu', allocated: 3360000 });
    expect(body.total).toBe(6000000);
    expect(mockComplete.mock.calls[0]?.[0]).toMatchObject({ task: 'budget', userId: 'u1' });
  });

  it('tolère un objet {categories:[...]} et des balises', async () => {
    mockComplete.mockResolvedValue({
      text: '```json\n{"categories":[{"name":"Déco","icon":"🌸","allocated":1200000}]}\n```',
      model: 'claude-sonnet-4-6', cached: false, fallback: false,
    } as never);
    const body = await (await POST(req())).json();
    expect(body.categories[0]).toMatchObject({ name: 'Déco', allocated: 1200000 });
  });

  it('422 si pas de budget (budgetSkip)', async () => {
    mockFindUnique.mockResolvedValueOnce({ ...WEDDING, budgetSkip: true } as never);
    const res = await POST(req());
    expect(res.status).toBe(422);
    expect((await res.json()).error).toBe('NO_BUDGET');
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('422 si pas de profil mariage', async () => {
    mockFindUnique.mockResolvedValueOnce(null as never);
    expect((await POST(req())).status).toBe(422);
  });

  it('502 si réponse IA inexploitable', async () => {
    mockComplete.mockResolvedValue({ text: 'pas du json', model: 'claude-sonnet-4-6', cached: false, fallback: false } as never);
    expect((await POST(req())).status).toBe(502);
  });

  it('503 si IA non configurée', async () => {
    mockComplete.mockRejectedValue(new AiNotConfiguredError());
    const res = await POST(req());
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('AI_NOT_CONFIGURED');
  });

  it('429 si quota IA atteint', async () => {
    mockComplete.mockRejectedValue(new AiRateLimitError());
    expect((await POST(req())).status).toBe(429);
  });

  it('403 sans CSRF — avant requireAuth', async () => {
    const res = await POST(req({}, { csrf: 'missing' }));
    expect(res.status).toBe(403);
    expect(mockRequireAuth).not.toHaveBeenCalled();
  });

  it('401 si non authentifié', async () => {
    mockRequireAuth.mockResolvedValueOnce(NextResponse.json({ error: 'no' }, { status: 401 }));
    expect((await POST(req())).status).toBe(401);
    expect(mockComplete).not.toHaveBeenCalled();
  });
});
