# Me latte records · music platform

Customers queue their own vinyl at the café. Next.js 16 · Tailwind v4 · Drizzle · Better Auth · Postgres · Redis · next-intl (en/es).

## Run it

```bash
cp .env.example .env        # then set the secrets
docker compose up -d        # Postgres on :5433, Redis on :6379
pnpm install
pnpm db:migrate
pnpm db:seed                # store, first admin (ADMIN_* in .env), two house records
pnpm dev
```

| Route | What |
|---|---|
| `/` | Now playing (phones) |
| `/add` | Search Discogs and join the queue |
| `/screen` | Café TV |
| `/staff` | Staff panel (login at `/staff/login`) |

`pnpm test` — ETA unit tests run anywhere; `queue.test.ts` needs Postgres + Redis up and migrated.
