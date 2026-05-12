// Rate limiting per user per day
// Graceful degradation if Upstash not configured

const FREE_DAILY_LIMIT = 10
const PREMIUM_DAILY_LIMIT = 500

export async function checkRateLimit(
  userId: string,
  isPremium: boolean
): Promise<{ allowed: boolean; remaining: number }> {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    // No Redis — allow all (dev mode)
    return { allowed: true, remaining: 999 }
  }

  try {
    const { Ratelimit } = await import('@upstash/ratelimit')
    const { Redis } = await import('@upstash/redis')

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })

    const limit = isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT

    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, '1 d'),
      prefix: 'ai:rl',
    })

    const { success, remaining } = await ratelimit.limit(userId)
    return { allowed: success, remaining }
  } catch {
    // Fail open — never block users due to infra issues
    return { allowed: true, remaining: 99 }
  }
}
