// SamaMariage — tests POST /api/mood/suggest (concept de mood board IA).
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

const WEDDING = { styles: ['royal'], fabric: 'bazin', city: 'dakar', cityOther: '', priorities: ['déco'], toAvoid: '' };

function req(body: unknown = {}, opts: { csrf?: 'match' | 'missing' } = {}): NextRequest {
  const csrf = opts.csrf ?? 'match';
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (csrf === 'match') {
    headers['x-csrf-token'] = 'csrf-tok';
    headers['cookie'] = 'app-csrf=csrf-tok';
  }
  return new NextRequest('http://test/api/mood/suggest', { method: 'POST', headers, body: JSON.stringify(body) });
}

const CONCEPT = JSON.stringify({
  theme: 'Royal bazin & or',
  palette: [
    { name: 'Vert royal', hex: '#1E5631' },
    { name: 'Or doux', hex: 'D4A574' },
    { name: 'Bordeaux', hex: '#722F37' },
  ],
  ideas: ['Arche florale bazin bleu nuit', 'Centres de table laiton + bougies', 'Tapis traditionnels'],
});

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ user: { sub: 'u1', email: 'b@x.com' } } as never);
  mockFindUnique.mockResolvedValue(WEDDING as never);
});

describe('POST /api/mood/suggest', () => {
  it('renvoie un concept {theme, palette, ideas}', async () => {
    mockComplete.mockResolvedValue({ text: CONCEPT, model: 'claude-haiku-4-5', cached: false, fallback: false } as never);
    const res = await POST(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.concept.theme).toBe('Royal bazin & or');
    expect(body.concept.palette).toHaveLength(3);
    // hex normalisé avec # et en majuscules
    expect(body.concept.palette[1].hex).toBe('#D4A574');
    expect(body.concept.ideas.length).toBeGreaterThanOrEqual(3);
    expect(mockComplete.mock.calls[0]?.[0]).toMatchObject({ task: 'mood', userId: 'u1' });
  });

  it('fonctionne sans profil mariage (concept générique)', async () => {
    mockFindUnique.mockResolvedValueOnce(null as never);
    mockComplete.mockResolvedValue({ text: CONCEPT, model: 'claude-haiku-4-5', cached: false, fallback: false } as never);
    expect((await POST(req())).status).toBe(200);
  });

  it('502 si réponse IA inexploitable', async () => {
    mockComplete.mockResolvedValue({ text: 'pas du json', model: 'claude-haiku-4-5', cached: false, fallback: false } as never);
    expect((await POST(req())).status).toBe(502);
  });

  it('502 si palette trop courte', async () => {
    mockComplete.mockResolvedValue({
      text: JSON.stringify({ theme: 'x', palette: [{ name: 'a', hex: '#000000' }], ideas: ['a', 'b', 'c'] }),
      model: 'claude-haiku-4-5', cached: false, fallback: false,
    } as never);
    expect((await POST(req())).status).toBe(502);
  });

  it('503 si IA non configurée', async () => {
    mockComplete.mockRejectedValue(new AiNotConfiguredError());
    expect((await POST(req())).status).toBe(503);
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
