// Integration tests: need Postgres + Redis running (`docker compose up -d`)
// and the schema migrated (`pnpm db:migrate`). They use the DATABASE_URL in .env,
// so point it at a throwaway database, not one with data you care about.
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, pool } from "@/db";
import { queueEntry } from "@/db/schema";
import { enqueue, getSnapshot, moveUp, next, remove } from "../queue";
import { redis } from "../redis";

const rec = (n: number) => ({ discogsId: 1000 + n, title: `Album ${n}`, artist: `Artist ${n}` });

beforeEach(async () => {
  await db.delete(queueEntry);
  await redis.del("queue:snapshot");
});

afterAll(async () => {
  await pool.end();
  redis.disconnect();
});

describe("queue", () => {
  it("adds records at the end and reports position and ETA", async () => {
    const a = await enqueue({ album: rec(1), userName: "ana" });
    const b = await enqueue({ album: rec(2), userName: "beto" });
    expect(a.position).toBe(1);
    expect(b.position).toBe(2);
    expect(b.etaMinutes).toBe(20);
  });

  it("next() moves the first queued record to playing, and the old one to played", async () => {
    await enqueue({ album: rec(1), userName: "ana" });
    await enqueue({ album: rec(2), userName: "beto" });

    await next();
    let snap = await getSnapshot();
    expect(snap.now?.album.title).toBe("Album 1");
    expect(snap.upcoming).toHaveLength(1);

    await next();
    snap = await getSnapshot();
    expect(snap.now?.album.title).toBe("Album 2");
    expect(snap.playedToday).toBe(1);

    await next();
    snap = await getSnapshot();
    expect(snap.now).toBeNull();
    expect(snap.playedToday).toBe(2);
  });

  it("moveUp swaps with the record above and ignores the first one", async () => {
    await enqueue({ album: rec(1), userName: "ana" });
    const b = await enqueue({ album: rec(2), userName: "beto" });

    await moveUp(b.id);
    let snap = await getSnapshot();
    expect(snap.upcoming.map((i) => i.album.title)).toEqual(["Album 2", "Album 1"]);

    await moveUp(b.id);
    snap = await getSnapshot();
    expect(snap.upcoming[0].album.title).toBe("Album 2");
  });

  it("remove takes a record out of the queue", async () => {
    const a = await enqueue({ album: rec(1), userName: "ana" });
    await enqueue({ album: rec(2), userName: "beto" });
    await remove(a.id);
    const snap = await getSnapshot();
    expect(snap.upcoming.map((i) => i.album.title)).toEqual(["Album 2"]);
  });

  it("gives every concurrent add its own position", async () => {
    const results = await Promise.all([1, 2, 3, 4, 5].map((n) => enqueue({ album: rec(n), userName: `u${n}` })));
    expect(new Set(results.map((r) => r.position)).size).toBe(5);
  });

  it("serves the snapshot from Redis after the first read", async () => {
    await enqueue({ album: rec(1), userName: "ana" });
    await getSnapshot();
    expect(await redis.get("queue:snapshot")).not.toBeNull();
    await enqueue({ album: rec(2), userName: "beto" });
    expect(await redis.get("queue:snapshot")).toBeNull(); // dropped by invalidate()
  });
});
