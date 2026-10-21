import { redis } from "./redis";

/**
 * Fixed-window counter in Redis. Returns true if the call is allowed.
 * If Redis is down we allow the call: this is protection, not security.
 */
export async function allow(key: string, max: number, windowSeconds: number) {
  try {
    const k = `rl:${key}`;
    const count = await redis.incr(k);
    if (count === 1) await redis.expire(k, windowSeconds);
    return count <= max;
  } catch (error) {
    console.error("rate limit unavailable", error);
    return true;
  }
}
