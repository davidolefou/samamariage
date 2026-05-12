export type AITask =
  | 'budget_generation'
  | 'budget_insights'
  | 'mood_analysis'
  | 'planning_generation'
  | 'ndawtal_parsing'
  | 'serenite_chat'
  | 'vendor_matching'
  | 'faire_part_audio'

export type AIProvider = 'anthropic' | 'google' | 'elevenlabs'

export interface AICompleteParams {
  task: AITask
  prompt: string
  systemPrompt?: string
  userId: string
  maxTokens?: number
  temperature?: number
  cache?: boolean
  fallback?: boolean
}

export interface AICompleteResult {
  content: string
  model: string
  provider: AIProvider
  tokensInput: number
  tokensOutput: number
  cached: boolean
  durationMs: number
  costUsd: number
}

// Routing: which model handles which task
export const TASK_ROUTING: Record<AITask, { provider: AIProvider; model: string }> = {
  budget_generation:  { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  budget_insights:    { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  planning_generation:{ provider: 'anthropic', model: 'claude-sonnet-4-6' },
  serenite_chat:      { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  vendor_matching:    { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  ndawtal_parsing:    { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' },
  mood_analysis:      { provider: 'google',    model: 'gemini-2.0-flash' },
  faire_part_audio:   { provider: 'elevenlabs', model: 'eleven_multilingual_v2' },
}

// Cost per 1M tokens in USD (approximate)
export const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6':          { input: 3.0,  output: 15.0 },
  'claude-haiku-4-5-20251001':  { input: 0.8,  output: 4.0  },
  'gemini-2.0-flash':           { input: 0.075, output: 0.30 },
}
