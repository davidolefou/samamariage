import { db } from '@/lib/db'
import { aiInteractions } from '@/lib/db/schema'
import type { AICompleteResult, AITask } from './types'

export async function logInteraction(
  task: AITask,
  userId: string | null,
  result: AICompleteResult,
  cached: boolean
): Promise<void> {
  try {
    await db.insert(aiInteractions).values({
      userId: userId ?? undefined,
      task,
      modelUsed: result.model,
      provider: result.provider,
      tokensInput: result.tokensInput,
      tokensOutput: result.tokensOutput,
      costUsd: result.costUsd,
      durationMs: result.durationMs,
      cached,
      success: true,
    })
  } catch {
    // Logging failures must never break the main flow
  }
}

export async function logError(
  task: AITask,
  userId: string | null,
  model: string,
  provider: string,
  errorMessage: string
): Promise<void> {
  try {
    await db.insert(aiInteractions).values({
      userId: userId ?? undefined,
      task,
      modelUsed: model,
      provider,
      tokensInput: 0,
      tokensOutput: 0,
      costUsd: 0,
      durationMs: 0,
      cached: false,
      success: false,
      errorMessage,
    })
  } catch {
    // Silent
  }
}
