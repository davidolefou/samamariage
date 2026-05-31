// SamaMariage — tests POST /api/coach (chat Sama Coach).
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

type Turn = { role: 'user' | 'assistant'; content: string };

function req(body?: unknown, opts: { csrf?: 'match' | 'missing' } = {}): NextRequest {
  const csrf = opts.csrf ?? 'match';
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (csrf === 'match') {
    headers['x-csrf-token'] = 'csrf-tok';
    headers['cookie'] = 'app-csrf=csrf-tok';
  }
  const init: { method: string; headers: Record<string, string>; body?: string } = { method: 'POST', headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  return new NextRequest('http://test/api/coach', init);
}

const userTurn = (content: string): Turn => ({ role: 'user', content });

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ user: { sub: 'u1', email: 'aissatou@x.com' } } as never);
  mockFindUnique.mockResolvedValue(null as never);
});

describe('POST /api/coach', () => {
  it('renvoie une enveloppe {reply, chips, cards}', async () => {
    mockComplete.mockResolvedValue({
      text: '{"reply":"Bonjour 🌸","chips":["Et le budget ?"],"cards":[{"type":"countdown","days":216,"date":"15 déc 2026"}]}',
      model: 'claude-sonnet-4-6',
      cached: false,
      fallback: false,
    } as never);
    const res = await POST(req({ messages: [userTurn('Salut')] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reply).toBe('Bonjour 🌸');
    expect(body.chips).toEqual(['Et le budget ?']);
    expect(body.cards[0]).toMatchObject({ type: 'countdown', days: 216 });
    // task chat + multi-tours transmis au gateway
    expect(mockComplete.mock.calls[0]?.[0]).toMatchObject({ task: 'chat', userId: 'u1' });
    expect(mockComplete.mock.calls[0]?.[0]?.messages).toHaveLength(1);
  });

  it('tolère un JSON malformé → reply = texte brut', async () => {
    mockComplete.mockResolvedValue({ text: 'Juste du texte', model: 'claude-sonnet-4-6', cached: false, fallback: false } as never);
    const body = await (await POST(req({ messages: [userTurn('Coucou')] }))).json();
    expect(body.reply).toBe('Juste du texte');
    expect(body.cards).toEqual([]);
  });

  it('borne la conversation à 16 tours', async () => {
    mockComplete.mockResolvedValue({ text: '{"reply":"ok"}', model: 'claude-sonnet-4-6', cached: false, fallback: false } as never);
    const messages: Turn[] = [];
    for (let i = 0; i < 25; i++) messages.push({ role: i % 2 === 0 ? 'user' : 'assistant', content: `m${i}` });
    messages.push(userTurn('dernière'));
    await POST(req({ messages }));
    expect(mockComplete.mock.calls[0]?.[0]?.messages).toHaveLength(16);
  });

  it('400 si le dernier message n’est pas celui de la mariée', async () => {
    const res = await POST(req({ messages: [userTurn('salut'), { role: 'assistant', content: 'réponse' }] }));
    expect(res.status).toBe(400);
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('400 si messages vide', async () => {
    expect((await POST(req({ messages: [] }))).status).toBe(400);
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('503 si IA non configurée', async () => {
    mockComplete.mockRejectedValue(new AiNotConfiguredError());
    const res = await POST(req({ messages: [userTurn('x')] }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('AI_NOT_CONFIGURED');
  });

  it('429 si quota IA atteint', async () => {
    mockComplete.mockRejectedValue(new AiRateLimitError());
    const res = await POST(req({ messages: [userTurn('x')] }));
    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe('AI_RATE_LIMITED');
  });

  it('403 sans CSRF — avant requireAuth', async () => {
    const res = await POST(req({ messages: [userTurn('x')] }, { csrf: 'missing' }));
    expect(res.status).toBe(403);
    expect(mockRequireAuth).not.toHaveBeenCalled();
  });

  it('401 si non authentifié', async () => {
    mockRequireAuth.mockResolvedValueOnce(NextResponse.json({ error: 'no' }, { status: 401 }));
    expect((await POST(req({ messages: [userTurn('x')] }))).status).toBe(401);
    expect(mockComplete).not.toHaveBeenCalled();
  });
});
