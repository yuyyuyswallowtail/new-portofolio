import "server-only";

/**
 * Tiny in-memory TTL cache for read-heavy, rarely-changing queries (the
 * public articles list) on pages that run `force-dynamic` (see
 * ARCHITECTURE.md §7 — public pages can't use ISR because the DB isn't
 * reachable at `docker build` time). Same single-instance caveat as
 * rate-limit.ts: not shared across replicas.
 */
const store = new Map<string, { value: unknown; expiresAt: number }>();

export async function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const hit = store.get(key);
  const now = Date.now();
  if (hit && hit.expiresAt > now) return hit.value as T;

  const value = await fn();
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

export function invalidateCache(key: string) {
  store.delete(key);
}

export function invalidateCachePrefix(prefix: string) {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}
