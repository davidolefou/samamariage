export type AITask =
  | 'budget_generation'
  | 'budget_insights'
  | 'mood_analysis'
  | 'planning_generation'
  | 'ndawtal_parsing'
  | 'serenite_chat'
  | 'vendor_matching'
  | 'faire_part_audio'

export type AIProvider = 'anthropic' | 'google' | 'openai' | 'elevenlabs'

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
  tokensUsed: number
  cached: boolean
  durationMs: number
  costUsd: number
}
