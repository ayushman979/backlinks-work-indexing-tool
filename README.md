# Backlinks Work Indexing Tool

Agency-facing **Google Indexing API** MVP (gooindex-style). Manage agency credits, bulk-submit URLs/backlinks, queue jobs, track status, and connect Google service accounts.

> **Product trajectory:** Week-1 scaffold → real DB/auth/queue (this release) → harden into a compliant **Index Hub** (owner-verified properties only, audit trail, rate limits).

## What works (MVP)

| Area | Status |
|------|--------|
| Monorepo (apps/web, apps/api, packages/*) | ✅ |
| Prisma schema + migrations | ✅ |
| Register / login (email+password → JWT) | ✅ |
| Credits balance + debit on submit + refund on hard fail | ✅ |
| Bulk submit → SubmitJob / SubmitItem + BullMQ enqueue | ✅ |
| Job list + detail (queued \| submitted \| error) | ✅ |
| Service-account connect (encrypted at rest) | ✅ |
| Worker → Google Indexing API (live when creds present) | ✅ |
| Stub fallback when no SA / `GOOGLE_INDEXING_STUB=1` | ✅ |
| ToS banner (no indexing guarantee) | ✅ |
| Buy packages / affiliate / admin roles | ❌ skipped |

## ⚠️ Google Indexing API — Terms of Service warnings

**Read before using this tool in production.**

1. **Owner-only URLs.** The [Google Indexing API](https://developers.google.com/search/apis/indexing-api/v3/quickstart) may only be used for URLs that **you own** (or that the agency’s client owns and has authorized). The connected service account must have verified ownership in Google Search Console for every submitted URL’s property.
2. **No third-party spam.** Do **not** use this product to mass-submit URLs you do not control, to manipulate rankings for sites you do not own, or to spam Google’s crawl infrastructure.
3. **Quota & compliance.** Respect Google’s daily quotas and [Indexing API policies](https://developers.google.com/search/apis/indexing-api/v3/ranking). Abuse can result in project suspension.
4. **Agency responsibility.** Agencies must obtain explicit client authorization and keep an audit of which properties were submitted on whose behalf.
5. **Not a substitute for sitemap / natural discovery.** Prefer sitemaps and canonical crawl paths; use the Indexing API for time-sensitive pages (e.g. JobPosting, BroadcastEvent) per Google guidance.
6. **No indexing guarantee.** A successful API response means Google **accepted the notification** — it does **not** guarantee crawling or indexing.

The web UI shows a persistent **ToS banner**. Ignoring these rules is grounds for account termination in later Index Hub releases.

## Monorepo layout

```
apps/
  web/          Next.js App Router + Tailwind (dashboard)
  api/          Hono REST API (JWT auth + Prisma)
packages/
  db/           Prisma schema + Postgres client
  queue/        BullMQ / Redis + worker
  google/       Service-account JWT + Indexing API client
docker-compose.yml   Postgres 16 + Redis 7
```

## Prerequisites

- Node.js **20+**
- [pnpm](https://pnpm.io) 9+
- Docker (recommended) **or** local PostgreSQL 14+ and Redis 6+

## Quick start with Docker Compose

```bash
# 1. Install
pnpm install

# 2. Env
cp .env.example .env
# Edit JWT_SECRET, SESSION_SECRET, CREDENTIALS_ENCRYPTION_KEY

# 3. Start Postgres + Redis
docker compose up -d

# 4. Generate Prisma client + apply migrations
pnpm db:generate
pnpm db:migrate
# (or: pnpm db:push for scaffold without migration history)

# 5. Dev (API :3001 + Web :3000)
pnpm dev

# 6. Worker (separate terminal)
pnpm worker
```

Open http://localhost:3000 → **Register** an agency → **Connect SA** (your own JSON) → **Submit** owner-verified URLs → watch **Jobs**.

### Individual apps

```bash
pnpm --filter @bw/api dev
pnpm --filter @bw/web dev
pnpm --filter @bw/queue worker
```

### Build / lint

```bash
pnpm build
pnpm lint
```

## Environment variables

See [`.env.example`](./.env.example) for the full list:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `REDIS_URL` | Redis for BullMQ |
| `JWT_SECRET` / `SESSION_SECRET` | Auth secrets |
| `CREDENTIALS_ENCRYPTION_KEY` | AES key for SA JSON at rest |
| `GOOGLE_APPLICATION_CREDENTIALS` | Optional local SA file path (never commit) |
| `GOOGLE_INDEXING_STUB` | `1` = skip live Google HTTP |
| `CREDITS_*` | Default balance & per-item cost |
| `API_PORT` / `NEXT_PUBLIC_API_BASE_URL` | Local ports |

**Never commit** real service-account JSON. Uploaded blobs live under `data/service-accounts/` (gitignored) and as encrypted `credentialsEnc` in Postgres.

## Domain model (packages/db)

- **Agency** — tenant
- **User** — belongs to agency (password hash + JWT)
- **ServiceAccount** — Google SA (encrypted `credentialsEnc`)
- **CreditBalance** / **CreditTxn** — prepaid credits ledger
- **SubmitJob** / **SubmitItem** — bulk submit + per-URL status (`queued` \| `submitted` \| `error`)
- **ApiKey** — optional programmatic access stub

## API routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Agency + owner + seeded credits |
| POST | `/auth/login` | — | JWT session |
| GET | `/auth/me` | Bearer | Current user / agency / credits |
| GET | `/credits` | Bearer | Agency credit balance |
| GET | `/credits/txns` | Bearer | Recent credit transactions |
| POST | `/submit` | Bearer | Bulk URL/backlink submit |
| GET | `/jobs` | Bearer | Job list |
| GET | `/jobs/:id` | Bearer | Job + items status |
| POST | `/service-account` | Bearer | Connect Google SA (encrypt+store) |
| GET | `/service-account` | Bearer | List connected SAs |
| GET | `/health` | — | Health check |

## License / compliance

Internal agency tool. Operators are responsible for Google ToS compliance. No warranty. **No guaranteed indexing.**

---

Built for Backlinks Work. Harden toward Index Hub before production traffic.
