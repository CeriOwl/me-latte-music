import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

/** The café itself ("Me latte records"). Owns the house collection. */
export const store = pgTable("store", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * A record (Discogs release). Ownership:
 *  - storeId set  -> a copy that belongs to the café ("from the house")
 *  - userId set   -> reserved for future accounts / history (unused in v1)
 *  - both null    -> a record a customer brought, cached from Discogs
 */
export const album = pgTable(
  "album",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    discogsId: integer("discogs_id").notNull(),
    title: text().notNull(),
    artist: text().notNull(),
    year: integer(),
    coverUrl: text("cover_url"),
    thumbUrl: text("thumb_url"),
    format: text(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    storeId: integer("store_id").references(() => store.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("album_discogs_store_unique").on(t.discogsId, t.storeId).nullsNotDistinct(),
  ],
);

export const queueStatus = pgEnum("queue_status", [
  "queued",
  "playing",
  "played",
  "removed",
]);

export const queueEntry = pgTable(
  "queue_entry",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    albumId: integer("album_id")
      .notNull()
      .references(() => album.id),
    /** Display name: the customer's nickname, or the store's name for house records. */
    userName: text("user_name").notNull(),
    position: integer().notNull(),
    status: queueStatus().notNull().default("queued"),
    side: text(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    removedBy: text("removed_by").references(() => user.id, { onDelete: "set null" }),
  },
  (t) => [
    // Only one record can be playing at a time.
    uniqueIndex("queue_entry_one_playing")
      .on(t.status)
      .where(sql`${t.status} = 'playing'`),
    index("queue_entry_status_position_idx").on(t.status, t.position),
  ],
);

export const albumRelations = relations(album, ({ one }) => ({
  store: one(store, { fields: [album.storeId], references: [store.id] }),
}));

export const queueEntryRelations = relations(queueEntry, ({ one }) => ({
  album: one(album, { fields: [queueEntry.albumId], references: [album.id] }),
}));
