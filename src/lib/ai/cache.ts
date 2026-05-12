import { createHash } from 'crypto'

// Lazy-load Redis to avoid crash when UPSTASH vars not set
let _redis: import('@upstash/redis').Redis | null = null

async function getRedis() {
  if (_redis) return _redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  const { Redis } = await import('@upstash/redis')
  _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  return _redis
}

export function makeCacheKey(task: string, prompt: string, systemPrompt?: string): string {
  const raw = `${task}::${systemPrompt ?? ''}::${prompt}`
  return `ai:${createHash('sha256').update(raw).digest('hex').slice(0, 32)}`
}

export async function cacheGet(key: string): Promise<string | null> {
  const redis = await getRedis()
  if (!redis) return null
  try {
    return await redis.get<string>(key)
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds = 86400): Promise<void> {
  const redis = await getRedis()
  if (!redis) return
  try {
    await redis.set(key, value, { ex: ttlSeconds })
  } catch {
    // Cache failures are non-fatal
  }
}
