// SamaMariage — tests POST /api/ndawtal/parse (saisie rapide IA).
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

mockNextCookies();
vi.mock('@/lib/server/middleware', () => ({ requireAuth: vi.fn() }));
vi.mock('@/lib/server/ai/gateway', () => {
  class AiNotConfiguredError extends Error {}
  class AiRateLimitError extends Error {}
  return { ai: { complete: vi.fn() }, AiNotConfiguredError, AiRateLimitError };
});

import { requireAuth } from '@/lib/server/middleware';
import { ai, AiNotConfiguredError, AiRateLimitError } from '@/lib/server/ai/gateway';
import { POST } from './route';

const mockRequireAuth = vi.mocked(requireAuth);
const mockComplete = vi.mocked(ai.complete);

function req(body?: unknown, opts: { csrf?: 'match' | 'missing' } = {}): NextRequest {
  const csrf = opts.csrf ?? 'match';
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (csrf === 'match') {
    headers['x-csrf-token'] = 'csrf-tok';
    headers['cookie'] = 'app-csrf=csrf-tok';
  }
  const init: { method: string; headers: Record<string, string>; body?: string } = { method: 'POST', headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  return new NextRequest('http://test/api/ndawtal/parse', init);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ user: { sub: 'u1', email: 'b@x.com' } } as never);
});

describe('POST /api/ndawtal/parse', () => {
  it('parse une phrase → entrée structurée', async () => {
    mockComplete.mockResolvedValue({
      text: '{"donorName":"Tata Awa","amount":50000,"relationship":"TANTE_MARIEE","type":"CASH"}',
      model: 'claude-haiku-4-5', cached: false, fallback: false,
    } as never);
    const res = await POST(req({ text: 'Tata Awa a donné 50 mille' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entry).toMatchObject({ donorName: 'Tata Awa', amount: 50000, relationship: 'TANTE_MARIEE', type: 'CASH' });
    expect(mockComplete.mock.calls[0]?.[0]).toMatchObject({ task: 'ndawtal', userId: 'u1' });
  });

  it('tolère les balises ```json et un texte autour', async () => {
    mockComplete.mockResolvedValue({
      text: 'Voici :\n```json\n{"donorName":"Awa","amount":2000000,"relationship":"AMIE","type":"CASH"}\n```',
      model: 'claude-haiku-4-5', cached: false, fallback: false,
    } as never);
    const body = await (await POST(req({ text: 'Awa 2 millions' }))).json();
    expect(body.entry.amount).toBe(2000000);
  });

  it('502 si la réponse IA est inexploitable', async () => {
    mockComplete.mockResolvedValue({ text: 'pas du json', model: 'claude-haiku-4-5', cached: false, fallback: false } as never);
    expect((await POST(req({ text: 'x' }))).status).toBe(502);
  });

  it('503 si IA non configurée', async () => {
    mockComplete.mockRejectedValue(new AiNotConfiguredError());
    const res = await POST(req({ text: 'x' }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('AI_NOT_CONFIGURED');
  });

  it('429 si quota IA atteint', async () => {
    mockComplete.mockRejectedValue(new AiRateLimitError());
    const res = await POST(req({ text: 'x' }));
    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe('AI_RATE_LIMITED');
  });

  it('400 si texte vide', async () => {
    expect((await POST(req({ text: '' }))).status).toBe(400);
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('403 sans CSRF — avant requireAuth', async () => {
    const res = await POST(req({ text: 'x' }, { csrf: 'missing' }));
    expect(res.status).toBe(403);
    expect(mockRequireAuth).not.toHaveBeenCalled();
  });

  it('401 si non authentifié', async () => {
    mockRequireAuth.mockResolvedValueOnce(NextResponse.json({ error: 'no' }, { status: 401 }));
    expect((await POST(req({ text: 'x' }))).status).toBe(401);
    expect(mockComplete).not.toHaveBeenCalled();
  });
});
