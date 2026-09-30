# Backlinks Work Indexing Tool

Agency-facing workflow for **crawl notify on verified client properties** and backlink checks. Manage agency credits, queue destination-page requests, verify backlink live/dofollow/target status, track jobs, and connect Google service accounts. This is not an “index any backlink on Google” tool.

> **Positioning:** Bulk crawl notify for verified client properties, plus backlink verification. The Indexing API is for destination pages on properties where the connected service account is a verified Search Console owner—not third-party linking URLs.

## What works (MVP)

| Area | Status |
|------|--------|
| Monorepo (apps/web, apps/api, packages/*) | ✅ |
| Prisma schema + migrations | ✅ |
| Register / login (email+password → JWT) | ✅ |
| Credits balance + debit on submit + refund on hard fail | ✅ |
| Bulk destination/crawl-check workflows → SubmitJob / SubmitItem + BullMQ enqueue | ✅ |
| Job list + detail (queued \| submitted \| error) | ✅ |
| Service-account connect (encrypted at rest) | ✅ |
| Worker → Google Indexing API for verified destination pages (live when creds present) | ✅ |
| Stub fallback when no SA / `GOOGLE_INDEXING_STUB=1` | ✅ |
| ToS banner (verified properties; no indexing guarantee) | ✅ |
| Buy packages / affiliate / admin roles | ❌ skipped |

## ⚠️ Google Indexing API — Terms of Service warnings

**Read before using this tool in production.**

1. **Verified-property owner only.** The [Google Indexing API](https://developers.google.com/search/apis/indexing-api/v3/quickstart) / crawl notify may be used only for destination pages on a Google Search Console property where the connected service account is an owner. Agencies must have client authorization.
2. **Backlinks are checks, not third-party indexing.** The backlink product checks the linking URL’s live, dofollow, target, and status, then performs a destination-page crawl workflow for the client URL that received the link. It does **not** submit third-party linking URLs to the Indexing API. Optional IndexNow support may come later.
3. **No third-party spam or quota farms.** Do **not** mass-submit URLs you do not control, manipulate rankings, or operate multi-account quota farms. Respect Google quotas and [Indexing API policies](https://developers.google.com/search/apis/indexing-api/v3/ranking); abuse can suspend the project.
4. **Agency responsibility.** Agencies must keep an audit of authorized client properties and the destination URLs submitted on their behalf.
5. **No indexing guarantee.** A successful API response means Google **accepted the notification** — it does **not** guarantee crawling or indexing. Sitemaps and natural discovery remain important.
6. **Offer-language example.** Public positioning may say: “$5 for 100 backlink checks + destination crawl requests.” This is example language, not a live price UI, and never means “index any backlink on Google.”

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

Open http://localhost:3000 → **Register** an agency → **Connect SA** (your own JSON) → run a destination crawl or backlink-check workflow → watch **Jobs**.

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
| POST | `/submit` | Bearer | Destination crawl / backlink-check workflow |
| GET | `/jobs` | Bearer | Job list |
| GET | `/jobs/:id` | Bearer | Job + items status |
| POST | `/service-account` | Bearer | Connect Google SA (encrypt+store) |
| GET | `/service-account` | Bearer | List connected SAs |
| GET | `/health` | — | Health check |

## License / compliance

Internal agency tool. Operators are responsible for Google ToS compliance. No warranty. **No guaranteed indexing.**

---

Built for Backlinks Work. Harden toward Index Hub before production traffic.
