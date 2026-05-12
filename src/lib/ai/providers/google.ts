import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AICompleteParams, AICompleteResult } from '../types'
import { MODEL_COSTS } from '../types'

const client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY ?? '')

export async function googleComplete(
  params: AICompleteParams,
  model: string
): Promise<AICompleteResult> {
  const start = Date.now()

  const genModel = client.getGenerativeModel({
    model,
    systemInstruction: params.systemPrompt,
    generationConfig: {
      maxOutputTokens: params.maxTokens ?? 2048,
      temperature: params.temperature ?? 0.7,
    },
  })

  const result = await genModel.generateContent(params.prompt)
  const response = await result.response
  const content = response.text()
  const durationMs = Date.now() - start

  const tokensInput = response.usageMetadata?.promptTokenCount ?? 0
  const tokensOutput = response.usageMetadata?.candidatesTokenCount ?? 0
  const costs = MODEL_COSTS[model] ?? { input: 0.075, output: 0.30 }
  const costUsd = (tokensInput * costs.input + tokensOutput * costs.output) / 1_000_000

  return {
    content,
    model,
    provider: 'google',
    tokensInput,
    tokensOutput,
    cached: false,
    durationMs,
    costUsd,
  }
}
