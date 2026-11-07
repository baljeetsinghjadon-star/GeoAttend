/**
 * In-Memory Sliding Window Rate Limiter
 * Limits requests per client identifier (IP address or User ID)
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale records every 5 minutes to avoid memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < 60000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 300000);
}

/**
 * Checks if a key has exceeded the maximum requests within the time window.
 *
 * @param key - Unique client identifier (e.g., user ID or IP)
 * @param maxRequests - Maximum requests allowed in window (default: 10)
 * @param windowMs - Time window in milliseconds (default: 60,000ms = 1 min)
 * @returns { success: boolean, remaining: number, resetMs: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests = 10,
  windowMs = 60000
): { success: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const resetMs = windowMs - (now - oldest);
    return {
      success: false,
      remaining: 0,
      resetMs: Math.max(0, resetMs),
    };
  }

  record.timestamps.push(now);

  return {
    success: true,
    remaining: maxRequests - record.timestamps.length,
    resetMs: windowMs,
  };
}
