import Anthropic from '@anthropic-ai/sdk'
import type { AICompleteParams, AICompleteResult } from '../types'
import { MODEL_COSTS } from '../types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function anthropicComplete(
  params: AICompleteParams,
  model: string
): Promise<AICompleteResult> {
  const start = Date.now()

  const response = await client.messages.create({
    model,
    max_tokens: params.maxTokens ?? 2048,
    temperature: params.temperature ?? 0.7,
    system: params.systemPrompt,
    messages: [{ role: 'user', content: params.prompt }],
  })

  const durationMs = Date.now() - start
  const tokensInput = response.usage.input_tokens
  const tokensOutput = response.usage.output_tokens
  const costs = MODEL_COSTS[model] ?? { input: 3.0, output: 15.0 }
  const costUsd = (tokensInput * costs.input + tokensOutput * costs.output) / 1_000_000

  const content =
    response.content[0]?.type === 'text' ? response.content[0].text : ''

  return {
    content,
    model,
    provider: 'anthropic',
    tokensInput,
    tokensOutput,
    cached: false,
    durationMs,
    costUsd,
  }
}
