import "dotenv/config";
import { Redis } from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

function create() {
  const client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 2,
    lazyConnect: true, // connect on first command, not on import (keeps `next build` quiet)
  });
  // Without a listener Node treats connection errors as fatal. Callers already
  // handle failed commands, so just log.
  client.on("error", (error) => console.error("[redis]", error.message));
  return client;
}

/** Shared connection for commands (GET, SET, DEL, PUBLISH, INCR...). */
export const redis = globalForRedis.redis ?? create();
if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

/**
 * A connection in "subscriber mode" can't run normal commands, so every
 * SSE listener needs its own. The caller must call `.quit()` when done.
 */
export function createSubscriber() {
  return create();
}
