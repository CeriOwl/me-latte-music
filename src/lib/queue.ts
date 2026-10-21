import "server-only";
import { and, asc, count, eq, gte, isNotNull, lt, max, sql } from "drizzle-orm";
import { db } from "@/db";
import { album, queueEntry, store } from "@/db/schema";
import { etaMinutes } from "./eta";
import type { QueueItem, QueueSnapshot } from "./queue-types";
import { redis } from "./redis";

export const SNAPSHOT_KEY = "queue:snapshot";
export const CHANNEL = "queue:changed";
const SNAPSHOT_TTL_SECONDS = 30;
const TIMEZONE = "America/Mexico_City";
// Every queue write takes this advisory lock, so two phones adding at the
// same moment can't get the same position.
const QUEUE_LOCK = 42;

export type AlbumInput = {
  discogsId: number;
  title: string;
  artist: string;
  year?: number | null;
  coverUrl?: string | null;
  thumbUrl?: string | null;
  format?: string | null;
};

export type EnqueueInput = {
  album: AlbumInput;
  /** Customer nickname. Ignored for house records (the store's name is used). */
  userName: string;
  side?: string | null;
  /** Put the record in the café's own collection ("from the house"). */
  house?: boolean;
};

export type EnqueueResult = {
  id: number;
  /** 1-based place in the queue: records waiting ahead + 1 */
  position: number;
  etaMinutes: number;
};

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function lock(tx: Tx) {
  await tx.execute(sql`select pg_advisory_xact_lock(${QUEUE_LOCK})`);
}

/** Tell everyone the queue changed: drop the cached snapshot and shout on the channel. */
export async function invalidate() {
  try {
    await redis.del(SNAPSHOT_KEY);
    await redis.publish(CHANNEL, "changed");
  } catch (error) {
    // The DB write already succeeded; clients will catch up on their next refresh.
    console.error("queue invalidate failed", error);
  }
}

async function getStore() {
  const [row] = await db.select().from(store).limit(1);
  if (!row) throw new Error("No store found. Run `pnpm db:seed`.");
  return row;
}

export async function enqueue(input: EnqueueInput): Promise<EnqueueResult> {
  const houseStore = input.house ? await getStore() : null;
  const userName = houseStore ? houseStore.name : input.userName.trim();
  if (!userName) throw new Error("A nickname is required");

  const result = await db.transaction(async (tx) => {
    await lock(tx);

    const [alb] = await tx
      .insert(album)
      .values({
        discogsId: input.album.discogsId,
        title: input.album.title,
        artist: input.album.artist,
        year: input.album.year ?? null,
        coverUrl: input.album.coverUrl ?? null,
        thumbUrl: input.album.thumbUrl ?? null,
        format: input.album.format ?? null,
        storeId: houseStore?.id ?? null,
      })
      .onConflictDoUpdate({
        target: [album.discogsId, album.storeId],
        set: { title: input.album.title, artist: input.album.artist },
      })
      .returning({ id: album.id });

    const [{ last }] = await tx.select({ last: max(queueEntry.position) }).from(queueEntry);
    const [{ ahead }] = await tx
      .select({ ahead: count() })
      .from(queueEntry)
      .where(eq(queueEntry.status, "queued"));
    const [playing] = await tx
      .select({ startedAt: queueEntry.startedAt })
      .from(queueEntry)
      .where(eq(queueEntry.status, "playing"));

    const [entry] = await tx
      .insert(queueEntry)
      .values({
        albumId: alb.id,
        userName,
        side: input.side ?? null,
        position: (last ?? 0) + 1,
      })
      .returning({ id: queueEntry.id });

    return {
      id: entry.id,
      position: ahead + 1,
      etaMinutes: etaMinutes(ahead, playing?.startedAt ?? null),
    };
  });

  await invalidate();
  return result;
}

/** Staff: finish the current record and start the next one. */
export async function next(): Promise<void> {
  await db.transaction(async (tx) => {
    await lock(tx);
    const now = new Date();

    await tx
      .update(queueEntry)
      .set({ status: "played", endedAt: now })
      .where(eq(queueEntry.status, "playing"));

    const [first] = await tx
      .select({ id: queueEntry.id })
      .from(queueEntry)
      .where(eq(queueEntry.status, "queued"))
      .orderBy(asc(queueEntry.position))
      .limit(1);

    if (first) {
      await tx
        .update(queueEntry)
        .set({ status: "playing", startedAt: now })
        .where(eq(queueEntry.id, first.id));
    }
  });
  await invalidate();
}

/** Staff: swap a queued record with the one above it. */
export async function moveUp(id: number): Promise<void> {
  await db.transaction(async (tx) => {
    await lock(tx);

    const [current] = await tx
      .select({ id: queueEntry.id, position: queueEntry.position })
      .from(queueEntry)
      .where(and(eq(queueEntry.id, id), eq(queueEntry.status, "queued")));
    if (!current) return;

    const [above] = await tx
      .select({ id: queueEntry.id, position: queueEntry.position })
      .from(queueEntry)
      .where(and(eq(queueEntry.status, "queued"), lt(queueEntry.position, current.position)))
      .orderBy(sql`${queueEntry.position} desc`)
      .limit(1);
    if (!above) return;

    await tx.update(queueEntry).set({ position: above.position }).where(eq(queueEntry.id, current.id));
    await tx.update(queueEntry).set({ position: current.position }).where(eq(queueEntry.id, above.id));
  });
  await invalidate();
}

/** Staff: take a queued record out of the queue. */
export async function remove(id: number, staffUserId?: string): Promise<void> {
  await db.transaction(async (tx) => {
    await lock(tx);
    await tx
      .update(queueEntry)
      .set({ status: "removed", endedAt: new Date(), removedBy: staffUserId ?? null })
      .where(and(eq(queueEntry.id, id), eq(queueEntry.status, "queued")));
  });
  await invalidate();
}

async function buildSnapshot(): Promise<QueueSnapshot> {
  const rows = await db
    .select({
      id: queueEntry.id,
      position: queueEntry.position,
      status: queueEntry.status,
      userName: queueEntry.userName,
      side: queueEntry.side,
      startedAt: queueEntry.startedAt,
      album: {
        id: album.id,
        discogsId: album.discogsId,
        title: album.title,
        artist: album.artist,
        year: album.year,
        coverUrl: album.coverUrl,
        thumbUrl: album.thumbUrl,
      },
      isHouse: isNotNull(album.storeId).mapWith(Boolean),
    })
    .from(queueEntry)
    .innerJoin(album, eq(album.id, queueEntry.albumId))
    .where(sql`${queueEntry.status} in ('playing', 'queued')`)
    .orderBy(asc(queueEntry.position));

  const toItem = (r: (typeof rows)[number]): QueueItem => ({
    id: r.id,
    position: r.position,
    userName: r.userName,
    side: r.side,
    isHouse: r.isHouse,
    startedAt: r.startedAt?.toISOString() ?? null,
    album: r.album,
  });

  // "Played today" = since local midnight in the café's timezone.
  const [{ played }] = await db
    .select({ played: count() })
    .from(queueEntry)
    .where(
      and(
        eq(queueEntry.status, "played"),
        gte(
          queueEntry.endedAt,
          sql`(date_trunc('day', now() at time zone ${TIMEZONE})) at time zone ${TIMEZONE}`,
        ),
      ),
    );

  const playing = rows.find((r) => r.status === "playing");
  return {
    now: playing ? toItem(playing) : null,
    upcoming: rows.filter((r) => r.status === "queued").map(toItem),
    playedToday: played,
    generatedAt: new Date().toISOString(),
  };
}

/** The one thing every screen reads. Cached in Redis, rebuilt from Postgres when missing. */
export async function getSnapshot(): Promise<QueueSnapshot> {
  try {
    const cached = await redis.get(SNAPSHOT_KEY);
    if (cached) return JSON.parse(cached) as QueueSnapshot;
  } catch (error) {
    console.error("snapshot cache read failed", error);
  }

  const snapshot = await buildSnapshot();

  try {
    await redis.set(SNAPSHOT_KEY, JSON.stringify(snapshot), "EX", SNAPSHOT_TTL_SECONDS);
  } catch (error) {
    console.error("snapshot cache write failed", error);
  }
  return snapshot;
}
