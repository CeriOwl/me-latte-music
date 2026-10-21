import "dotenv/config";
import { randomUUID } from "node:crypto";
import { count, eq, inArray } from "drizzle-orm";
import { db, pool } from "@/db";
import { account, queueEntry, store, user } from "@/db/schema-all";
import { auth } from "@/lib/auth";
import { enqueue } from "@/lib/queue";
import { redis } from "@/lib/redis";

// Placeholder Discogs ids (9_000_xxx) so the demo works without the API.
const HOUSE_RECORDS = [
  { discogsId: 9000001, title: "Power, Corruption & Lies", artist: "New Order", year: 1983 },
  { discogsId: 9000002, title: "Moon Safari", artist: "Air", year: 1998 },
];

async function main() {
  await db
    .insert(store)
    .values({ name: "Me latte records", slug: "me-latte" })
    .onConflictDoNothing();

  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("Set ADMIN_PASSWORD in .env");

  const [existing] = await db.select().from(user).where(eq(user.username, username));
  if (existing) {
    console.log(`Admin "${username}" already exists`);
  } else {
    // Sign-up is closed, so insert the first admin directly (password hashed
    // the same way Better Auth does it).
    const { password: hasher } = await auth.$context;
    const id = randomUUID();
    await db.insert(user).values({
      id,
      name: username,
      email: `${username}@staff.local`,
      emailVerified: true,
      username,
      displayUsername: username,
      role: "admin",
    });
    await db.insert(account).values({
      id: randomUUID(),
      userId: id,
      providerId: "credential",
      accountId: id,
      password: await hasher.hash(password),
    });
    console.log(`Created admin "${username}"`);
  }

  const [{ n }] = await db
    .select({ n: count() })
    .from(queueEntry)
    .where(inArray(queueEntry.status, ["queued", "playing"]));
  if (n === 0) {
    for (const album of HOUSE_RECORDS) await enqueue({ album, userName: "", house: true });
    console.log("Queued the house records");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
    redis.disconnect();
  });
