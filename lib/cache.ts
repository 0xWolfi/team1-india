/**
 * Simple in-memory cache with TTL.
 * Works in serverless (per-instance), no Redis needed.
 * Good for hot data like leaderboard, stats, config.
 */

const store = new Map<string, { value: any; expiresAt: number }>();

/**
 * Get a cached value, or compute and cache it.
 *
 * @param key - cache key
 * @param ttlSeconds - time-to-live in seconds
 * @param fn - async function to compute the value if not cached
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const entry = store.get(key);

  if (entry && entry.expiresAt > now) {
    return entry.value as T;
  }

  const value = await fn();
  store.set(key, { value, expiresAt: now + ttlSeconds * 1000 });
  return value;
}

/**
 * Invalidate a specific cache key.
 */
export function invalidate(key: string): void {
  store.delete(key);
}

/**
 * Invalidate all keys matching a prefix.
 * Example: invalidatePrefix("leaderboard") clears "leaderboard:top50", "leaderboard:weekly", etc.
 */
export function invalidatePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/**
 * Clear all cached entries.
 */
export function clearCache(): void {
  store.clear();
}
