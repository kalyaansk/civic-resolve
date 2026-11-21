/**
 * In-memory sliding-window IP rate limiter for write and AI preview routes.
 * Protects Gemini API quota and Firestore writes without external dependencies.
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  retryAfterSeconds: number;
}

const rateLimitStore = new Map<string, number[]>();
const MAX_TRACKED_KEYS = 5000;

/**
 * Extracts a client identifier from standard proxy/Cloud Run headers.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "127.0.0.1";
}

/**
 * Checks and records a single request against the sliding window for `key`.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  now: number = Date.now(),
): RateLimitResult {
  const windowStart = now - config.windowMs;
  const existing = rateLimitStore.get(key) ?? [];
  const activeTimestamps = existing.filter((ts) => ts > windowStart);

  if (activeTimestamps.length >= config.maxRequests) {
    const oldest = activeTimestamps[0] ?? now;
    const resetAt = oldest + config.windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
    rateLimitStore.set(key, activeTimestamps);
    return {
      allowed: false,
      remaining: 0,
      limit: config.maxRequests,
      resetAt,
      retryAfterSeconds,
    };
  }

  activeTimestamps.push(now);
  rateLimitStore.set(key, activeTimestamps);

  // Evict stale entries if map grows large in long-lived Cloud Run instances
  if (rateLimitStore.size > MAX_TRACKED_KEYS) {
    for (const [entryKey, timestamps] of rateLimitStore.entries()) {
      const fresh = timestamps.filter((ts) => ts > windowStart);
      if (fresh.length === 0) {
        rateLimitStore.delete(entryKey);
      } else {
        rateLimitStore.set(entryKey, fresh);
      }
      if (rateLimitStore.size <= MAX_TRACKED_KEYS / 2) break;
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - activeTimestamps.length),
    limit: config.maxRequests,
    resetAt: now + config.windowMs,
    retryAfterSeconds: 0,
  };
}

/**
 * Clears all tracked rate-limit buckets (used by unit/API test suites).
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}
