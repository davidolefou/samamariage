// SamaMariage — AI Gateway : point d'entrée unique ai.complete().
//
// Responsabilités :
//   - routage par tâche (Sonnet raisonnement / Haiku parsing)
//   - prompt caching (cache_control ephemeral sur le system stable)
//   - cache réponse Upstash (24h, sauté pour les tâches conversationnelles)
//   - rate-limit par utilisateur et par jour (Redis INCR + EXPIRE)
//   - fallback automatique vers Haiku si le modèle primaire échoue (429/5xx)
//   - logging tokens/coût/durée/cache dans AiInteraction (best-effort)
//
// Inert sans ANTHROPIC_API_KEY (lève AiNotConfiguredError → 503 côté route),
// comme les autres providers optionnels du starter.
import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'node:crypto';
import { getRedis } from '@/lib/server/redis';
import { prisma } from '@/lib/server/prisma';
import { MODELS, TASK_MODEL, NO_CACHE_TASKS, PRICING, type AiTask, type ModelId } from './models';

export class AiNotConfiguredError extends Error {
  readonly code = 'AI_NOT_CONFIGURED';
  constructor() {
    super('AI gateway not configured (ANTHROPIC_API_KEY missing)');
    this.name = 'AiNotConfiguredError';
  }
}
export class AiRateLimitError extends Error {
  readonly code = 'AI_RATE_LIMITED';
  constructor() {
    super('Daily AI limit reached');
    this.name = 'AiRateLimitError';
  }
}
export class AiError extends Error {
  readonly code = 'AI_ERROR';
  constructor(message = 'AI call failed') {
    super(message);
    this.name = 'AiError';
  }
}

// Construit un client par appel (léger, pas de réseau) — reste inerte sans clé.
function getClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  return key ? new Anthropic({ apiKey: key }) : null;
}

const DAY_SECONDS = 60 * 60 * 24;
function dailyLimit(): number {
  const n = Number(process.env.AI_DAILY_LIMIT);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

function cacheKey(model: ModelId, system: string, prompt: string): string {
  const h = createHash('sha256').update(JSON.stringify({ model, system, prompt })).digest('hex');
  return `ai:cache:${h}`;
}

function isRetryable(err: unknown): boolean {
  return err instanceof Anthropic.APIError && (err.status === 429 || (err.status ?? 0) >= 500);
}

export interface CompleteInput {
  task: AiTask;
  userId: string;
  prompt: string;
  system?: string;
  maxTokens?: number;
  /** Force (ou désactive) le cache réponse ; par défaut selon la tâche. */
  cache?: boolean;
}

export interface CompleteResult {
  text: string;
  model: ModelId;
  cached: boolean;
  fallback: boolean;
}

async function callModel(
  client: Anthropic,
  model: ModelId,
  input: CompleteInput,
  maxTokens: number,
): Promise<{ text: string; usage: Anthropic.Usage }> {
  const res = await client.messages.create({
    model,
    max_tokens: maxTokens,
    ...(input.system
      ? { system: [{ type: 'text', text: input.system, cache_control: { type: 'ephemeral' } }] }
      : {}),
    messages: [{ role: 'user', content: input.prompt }],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
  return { text, usage: res.usage };
}

interface LogInput {
  userId: string;
  task: AiTask;
  model: ModelId;
  usage?: Anthropic.Usage;
  durationMs?: number;
  cached?: boolean;
  fallback?: boolean;
}
async function logInteraction(o: LogInput): Promise<void> {
  try {
    const p = PRICING[o.model];
    const inT = o.usage?.input_tokens ?? 0;
    const outT = o.usage?.output_tokens ?? 0;
    const cachedT = o.usage?.cache_read_input_tokens ?? 0;
    const costUsd = (inT * p.in + outT * p.out + cachedT * p.cachedIn) / 1_000_000;
    await prisma.aiInteraction.create({
      data: {
        userId: o.userId,
        task: o.task,
        model: o.model,
        promptTokens: inT,
        completionTokens: outT,
        cachedTokens: cachedT,
        costUsd,
        durationMs: o.durationMs ?? 0,
        cached: o.cached ?? false,
        fallback: o.fallback ?? false,
      },
    });
  } catch {
    // Le logging ne doit jamais faire échouer la requête.
  }
}

async function complete(input: CompleteInput): Promise<CompleteResult> {
  const client = getClient();
  if (!client) throw new AiNotConfiguredError();

  const primary = TASK_MODEL[input.task];
  const maxTokens = input.maxTokens ?? 1024;
  const cacheable = input.cache ?? !NO_CACHE_TASKS.includes(input.task);
  const redis = getRedis();

  // 1. Cache réponse (un hit ne consomme PAS de crédit : le quota protège le
  //    coût des vrais appels API, et un hit est gratuit).
  const key = cacheKey(primary, input.system ?? '', input.prompt);
  if (cacheable && redis) {
    const hit = await redis.get<string>(key);
    if (hit) {
      void logInteraction({ userId: input.userId, task: input.task, model: primary, cached: true });
      return { text: hit, model: primary, cached: true, fallback: false };
    }
  }

  // 2. Rate-limit par utilisateur et par jour — décompté uniquement sur un
  //    cache miss, juste avant l'appel API réel.
  if (redis) {
    const day = new Date().toISOString().slice(0, 10);
    const rlKey = `ai:rl:${input.userId}:${day}`;
    const count = await redis.incr(rlKey);
    if (count === 1) await redis.expire(rlKey, DAY_SECONDS);
    if (count > dailyLimit()) throw new AiRateLimitError();
  }

  // 3. Appel modèle + fallback Haiku.
  const started = Date.now();
  let model = primary;
  let fallback = false;
  let result: { text: string; usage: Anthropic.Usage };
  try {
    result = await callModel(client, primary, input, maxTokens);
  } catch (err) {
    if (primary !== MODELS.haiku && isRetryable(err)) {
      fallback = true;
      model = MODELS.haiku;
      try {
        result = await callModel(client, MODELS.haiku, input, maxTokens);
      } catch {
        throw new AiError();
      }
    } else {
      throw new AiError();
    }
  }
  const durationMs = Date.now() - started;

  // 4. Mise en cache de la réponse.
  if (cacheable && redis && result.text) {
    try {
      await redis.set(key, result.text, { ex: DAY_SECONDS });
    } catch {
      // cache best-effort
    }
  }

  // 5. Logging.
  void logInteraction({ userId: input.userId, task: input.task, model, usage: result.usage, durationMs, fallback });

  return { text: result.text, model, cached: false, fallback };
}

export const ai = { complete };
