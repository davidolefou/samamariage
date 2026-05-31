// SamaMariage — tests de l'AI Gateway (routage, cache, rate-limit, fallback, logging).
import { prismaMock } from '@/test-utils/prisma-mock';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks partagés (hoisted pour être visibles dans les factories vi.mock).
const h = vi.hoisted(() => {
  const create = vi.fn();
  const redis = { get: vi.fn(), set: vi.fn(), incr: vi.fn(), expire: vi.fn() };
  let redisEnabled = true;
  return { create, redis, getRedis: () => (redisEnabled ? redis : null), setRedisEnabled: (v: boolean) => { redisEnabled = v; } };
});

vi.mock('@anthropic-ai/sdk', () => {
  class APIError extends Error {
    status: number | undefined;
    constructor(status?: number) {
      super('api error');
      this.status = status;
    }
  }
  function Anthropic() {
    return { messages: { create: h.create } };
  }
  (Anthropic as unknown as { APIError: unknown }).APIError = APIError;
  return { default: Anthropic };
});

vi.mock('@/lib/server/redis', () => ({ getRedis: () => h.getRedis() }));

import AnthropicMock from '@anthropic-ai/sdk';
import { ai, AiNotConfiguredError, AiRateLimitError } from './gateway';

const APIError = (AnthropicMock as unknown as { APIError: new (s?: number) => Error }).APIError;
const usage = { input_tokens: 100, output_tokens: 50, cache_read_input_tokens: 0 };
const okMsg = { content: [{ type: 'text', text: 'résultat' }], usage };

beforeEach(() => {
  vi.clearAllMocks();
  h.setRedisEnabled(true);
  h.redis.incr.mockResolvedValue(1);
  h.redis.expire.mockResolvedValue(1);
  h.redis.get.mockResolvedValue(null);
  h.redis.set.mockResolvedValue('OK');
  process.env.ANTHROPIC_API_KEY = 'sk-test';
  delete process.env.AI_DAILY_LIMIT;
});

describe('ai.complete', () => {
  it('inerte sans clé → AiNotConfiguredError', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(ai.complete({ task: 'budget', userId: 'u1', prompt: 'x' })).rejects.toBeInstanceOf(AiNotConfiguredError);
    expect(h.create).not.toHaveBeenCalled();
  });

  it('happy path : route Sonnet pour budget, renvoie le texte, logge', async () => {
    h.create.mockResolvedValue(okMsg);
    const res = await ai.complete({ task: 'budget', userId: 'u1', prompt: 'Génère un budget' });
    expect(res.text).toBe('résultat');
    expect(res.model).toBe('claude-sonnet-4-6');
    expect(res.cached).toBe(false);
    expect(h.create.mock.calls[0]?.[0]?.model).toBe('claude-sonnet-4-6');
    expect(prismaMock.aiInteraction.create).toHaveBeenCalled();
  });

  it('route Haiku pour ndawtal', async () => {
    h.create.mockResolvedValue(okMsg);
    const res = await ai.complete({ task: 'ndawtal', userId: 'u1', prompt: 'Tata Awa 50 mille' });
    expect(res.model).toBe('claude-haiku-4-5');
  });

  it('cache hit → pas d’appel API ni de crédit quota consommé', async () => {
    h.redis.get.mockResolvedValue('depuis le cache');
    const res = await ai.complete({ task: 'budget', userId: 'u1', prompt: 'x' });
    expect(res.cached).toBe(true);
    expect(res.text).toBe('depuis le cache');
    expect(h.create).not.toHaveBeenCalled();
    expect(h.redis.incr).not.toHaveBeenCalled(); // un hit ne décompte pas le quota
  });

  it('chat n’est jamais mis en cache (ni lu ni écrit)', async () => {
    h.create.mockResolvedValue(okMsg);
    await ai.complete({ task: 'chat', userId: 'u1', prompt: 'coucou' });
    expect(h.redis.get).not.toHaveBeenCalled();
    expect(h.redis.set).not.toHaveBeenCalled();
  });

  it('rate-limit dépassé → AiRateLimitError, pas d’appel API', async () => {
    process.env.AI_DAILY_LIMIT = '5';
    h.redis.incr.mockResolvedValue(6);
    await expect(ai.complete({ task: 'budget', userId: 'u1', prompt: 'x' })).rejects.toBeInstanceOf(AiRateLimitError);
    expect(h.create).not.toHaveBeenCalled();
  });

  it('fallback Haiku si le primaire échoue (429/5xx)', async () => {
    h.create.mockRejectedValueOnce(new APIError(529)).mockResolvedValueOnce({ ...okMsg, content: [{ type: 'text', text: 'secours' }] });
    const res = await ai.complete({ task: 'budget', userId: 'u1', prompt: 'x' });
    expect(res.fallback).toBe(true);
    expect(res.model).toBe('claude-haiku-4-5');
    expect(res.text).toBe('secours');
    expect(h.create).toHaveBeenCalledTimes(2);
  });

  it('pas de fallback pour une erreur non-retryable (400)', async () => {
    h.create.mockRejectedValue(new APIError(400));
    await expect(ai.complete({ task: 'budget', userId: 'u1', prompt: 'x' })).rejects.toMatchObject({ code: 'AI_ERROR' });
    expect(h.create).toHaveBeenCalledTimes(1);
  });

  it('fonctionne sans redis (cache + rate-limit désactivés)', async () => {
    h.setRedisEnabled(false);
    h.create.mockResolvedValue(okMsg);
    const res = await ai.complete({ task: 'budget', userId: 'u1', prompt: 'x' });
    expect(res.text).toBe('résultat');
  });
});
