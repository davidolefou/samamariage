import { TRPCError } from '@trpc/server'
import type { AICompleteParams, AICompleteResult } from './types'
import { TASK_ROUTING } from './types'
import { anthropicComplete } from './providers/anthropic'
import { googleComplete } from './providers/google'
import { makeCacheKey, cacheGet, cacheSet } from './cache'
import { checkRateLimit } from './ratelimit'
import { logInteraction, logError } from './logger'

// Tasks that should never be cached (conversational)
const NO_CACHE_TASKS = new Set(['serenite_chat'])

export async function aiComplete(
  params: AICompleteParams,
  options: { isPremium?: boolean } = {}
): Promise<AICompleteResult> {
  const routing = TASK_ROUTING[params.task]
  if (!routing) throw new TRPCError({ code: 'BAD_REQUEST', message: `Unknown AI task: ${params.task}` })

  // Rate limiting
  const { allowed } = await checkRateLimit(params.userId, options.isPremium ?? false)
  if (!allowed) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Limite quotidienne atteinte. Passe au plan Premium pour un accès illimité.',
    })
  }

  // Cache lookup (skip for conversational tasks)
  const useCache = params.cache !== false && !NO_CACHE_TASKS.has(params.task)
  if (useCache) {
    const cacheKey = makeCacheKey(params.task, params.prompt, params.systemPrompt)
    const cached = await cacheGet(cacheKey)
    if (cached) {
      const result: AICompleteResult = {
        content: cached,
        model: routing.model,
        provider: routing.provider,
        tokensInput: 0,
        tokensOutput: 0,
        cached: true,
        durationMs: 0,
        costUsd: 0,
      }
      await logInteraction(params.task, params.userId, result, true)
      return result
    }
  }

  // Call primary provider
  let result: AICompleteResult
  try {
    result = await callProvider(params, routing.provider, routing.model)
  } catch (primaryError) {
    // Fallback to Anthropic Haiku if main model fails
    if (params.fallback !== false && routing.provider !== 'anthropic') {
      try {
        result = await callProvider(params, 'anthropic', 'claude-haiku-4-5-20251001')
      } catch (fallbackError) {
        const msg = fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
        await logError(params.task, params.userId, routing.model, routing.provider, msg)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Service IA temporairement indisponible.' })
      }
    } else {
      const msg = primaryError instanceof Error ? primaryError.message : 'Unknown error'
      await logError(params.task, params.userId, routing.model, routing.provider, msg)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Service IA temporairement indisponible.' })
    }
  }

  // Store in cache
  if (useCache && result.content) {
    const cacheKey = makeCacheKey(params.task, params.prompt, params.systemPrompt)
    await cacheSet(cacheKey, result.content)
  }

  // Log interaction
  await logInteraction(params.task, params.userId, result, false)

  return result
}

async function callProvider(
  params: AICompleteParams,
  provider: string,
  model: string
): Promise<AICompleteResult> {
  switch (provider) {
    case 'anthropic':
      return anthropicComplete(params, model)
    case 'google':
      return googleComplete(params, model)
    default:
      throw new Error(`Provider not implemented: ${provider}`)
  }
}
