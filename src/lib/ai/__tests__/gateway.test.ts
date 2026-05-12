import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all external dependencies
vi.mock('../providers/anthropic', () => ({
  anthropicComplete: vi.fn().mockResolvedValue({
    content: '{"categories":[]}',
    model: 'claude-sonnet-4-6',
    provider: 'anthropic',
    tokensInput: 100,
    tokensOutput: 200,
    cached: false,
    durationMs: 500,
    costUsd: 0.004,
  }),
}))

vi.mock('../providers/google', () => ({
  googleComplete: vi.fn().mockResolvedValue({
    content: 'google response',
    model: 'gemini-2.0-flash',
    provider: 'google',
    tokensInput: 50,
    tokensOutput: 100,
    cached: false,
    durationMs: 300,
    costUsd: 0.001,
  }),
}))

vi.mock('../logger', () => ({
  logInteraction: vi.fn().mockResolvedValue(undefined),
  logError: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../ratelimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}))

// Cache mock — controls cache hits
const mockCacheGet = vi.fn().mockResolvedValue(null)
const mockCacheSet = vi.fn().mockResolvedValue(undefined)
vi.mock('../cache', () => ({
  makeCacheKey: vi.fn().mockReturnValue('test-cache-key'),
  cacheGet: (...args: unknown[]) => mockCacheGet(...args),
  cacheSet: (...args: unknown[]) => mockCacheSet(...args),
}))

import { aiComplete } from '../gateway'

const BASE_PARAMS = {
  task: 'budget_generation' as const,
  prompt: 'Génère un budget pour 200 invités',
  userId: 'user-123',
}

describe('AI Gateway', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCacheGet.mockResolvedValue(null)
  })

  it('calls Anthropic for budget_generation and returns result', async () => {
    const { anthropicComplete } = await import('../providers/anthropic')
    const result = await aiComplete(BASE_PARAMS)

    expect(anthropicComplete).toHaveBeenCalledOnce()
    expect(result.provider).toBe('anthropic')
    expect(result.cached).toBe(false)
    expect(result.content).toBeTruthy()
  })

  it('returns cached result and skips provider call', async () => {
    mockCacheGet.mockResolvedValue('{"categories":[{"name":"Lieu","amount_recommended":2500000}]}')
    const { anthropicComplete } = await import('../providers/anthropic')

    const result = await aiComplete(BASE_PARAMS)

    expect(anthropicComplete).not.toHaveBeenCalled()
    expect(result.cached).toBe(true)
    expect(result.costUsd).toBe(0)
  })

  it('does NOT cache serenite_chat (conversational)', async () => {
    const { anthropicComplete } = await import('../providers/anthropic')

    await aiComplete({ ...BASE_PARAMS, task: 'serenite_chat' })

    expect(mockCacheGet).not.toHaveBeenCalled()
    expect(mockCacheSet).not.toHaveBeenCalled()
    expect(anthropicComplete).toHaveBeenCalledOnce()
  })

  it('throws TOO_MANY_REQUESTS when rate limit exceeded', async () => {
    const { checkRateLimit } = await import('../ratelimit')
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ allowed: false, remaining: 0 })

    await expect(aiComplete(BASE_PARAMS)).rejects.toThrow('Limite quotidienne')
  })

  it('falls back to Anthropic Haiku when Google fails', async () => {
    const { googleComplete } = await import('../providers/google')
    const { anthropicComplete } = await import('../providers/anthropic')
    vi.mocked(googleComplete).mockRejectedValueOnce(new Error('Google API down'))

    const result = await aiComplete({ ...BASE_PARAMS, task: 'mood_analysis' })

    expect(googleComplete).toHaveBeenCalledOnce()
    expect(anthropicComplete).toHaveBeenCalledOnce()
    expect(result.provider).toBe('anthropic')
  })
})
