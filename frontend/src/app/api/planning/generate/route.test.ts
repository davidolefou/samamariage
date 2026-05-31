// SamaMariage — tests POST /api/planning/generate (rétroplanning IA).
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
  dateMode: 'PRECISE',
  datePrecise: new Date('2026-12-15T12:00:00Z'),
  dateMonth: null,
  guests: 450,
  ceremonies: { takk: true, ceet: false, civil: false, reception: true },
  city: 'dakar',
  cityOther: '',
  fullName: 'Aïssatou',
};

function req(body: unknown = {}, opts: { csrf?: 'match' | 'missing' } = {}): NextRequest {
  const csrf = opts.csrf ?? 'match';
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (csrf === 'match') {
    headers['x-csrf-token'] = 'csrf-tok';
    headers['cookie'] = 'app-csrf=csrf-tok';
  }
  return new NextRequest('http://test/api/planning/generate', { method: 'POST', headers, body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ user: { sub: 'u1', email: 'b@x.com' } } as never);
  mockFindUnique.mockResolvedValue(WEDDING as never);
});

describe('POST /api/planning/generate', () => {
  it('renvoie des tâches par phase', async () => {
    mockComplete.mockResolvedValue({
      text: '[{"phase":"12–9 mois avant","title":"Réserver le lieu"},{"phase":"Dernier mois","title":"Confirmer le traiteur"}]',
      model: 'claude-sonnet-4-6', cached: false, fallback: false,
    } as never);
    const res = await POST(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tasks).toHaveLength(2);
    expect(body.tasks[0]).toMatchObject({ phase: '12–9 mois avant', title: 'Réserver le lieu' });
    expect(mockComplete.mock.calls[0]?.[0]).toMatchObject({ task: 'planning', userId: 'u1' });
  });

  it('tolère un objet {tasks:[...]} et des balises', async () => {
    mockComplete.mockResolvedValue({
      text: '```json\n{"tasks":[{"phase":"Jour J","title":"Profiter 💛"}]}\n```',
      model: 'claude-sonnet-4-6', cached: false, fallback: false,
    } as never);
    const body = await (await POST(req())).json();
    expect(body.tasks[0]).toMatchObject({ phase: 'Jour J', title: 'Profiter 💛' });
  });

  it('fonctionne même sans date fixée (UNKNOWN)', async () => {
    mockFindUnique.mockResolvedValueOnce({ ...WEDDING, dateMode: 'UNKNOWN', datePrecise: null } as never);
    mockComplete.mockResolvedValue({
      text: '[{"phase":"12 mois avant","title":"Définir la date"}]',
      model: 'claude-sonnet-4-6', cached: false, fallback: false,
    } as never);
    expect((await POST(req())).status).toBe(200);
  });

  it('fonctionne sans profil mariage (rétroplanning générique)', async () => {
    mockFindUnique.mockResolvedValueOnce(null as never);
    mockComplete.mockResolvedValue({
      text: '[{"phase":"12 mois avant","title":"Lister les invités"}]',
      model: 'claude-sonnet-4-6', cached: false, fallback: false,
    } as never);
    expect((await POST(req())).status).toBe(200);
  });

  it('502 si réponse IA inexploitable', async () => {
    mockComplete.mockResolvedValue({ text: 'pas du json', model: 'claude-sonnet-4-6', cached: false, fallback: false } as never);
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
