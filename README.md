# Backlinks Work Indexing Tool

Agency-facing **Google Indexing API** MVP (gooindex-style). Manage agency credits, bulk-submit URLs/backlinks, queue jobs, track status, and connect Google service accounts.

> **Product trajectory:** Week-1 scaffold → harden into a compliant **Index Hub** (owner-verified properties only, audit trail, rate limits).

## MVP scope (week 1)

| Area | Status |
|------|--------|
| Monorepo (apps/web, apps/api, packages/*) | Scaffold |
| Domain schema (Agency, User, SA, Credits, Jobs) | Schema + types |
| REST API stubs (auth, credits, submit, jobs, SA) | Stubs |
| Dashboard shell + submit / job / connect pages | Minimal UI |
| BullMQ worker stub | Stub |
| Google Indexing API client | Stub + ToS comments |

## ⚠️ Google Indexing API — Terms of Service warnings

**Read before using this tool in production.**

1. **Owner-only URLs.** The [Google Indexing API](https://developers.google.com/search/apis/indexing-api/v3/quickstart) may only be used for URLs that **you own** (or that the agency’s client owns and has authorized). The connected service account must have verified ownership in Google Search Console for every submitted URL’s property.
2. **No third-party spam.** Do **not** use this product to mass-submit URLs you do not control, to manipulate rankings for sites you do not own, or to spam Google’s crawl infrastructure.
3. **Quota & compliance.** Respect Google’s daily quotas and [Indexing API policies](https://developers.google.com/search/apis/indexing-api/v3/ranking). Abuse can result in project suspension.
4. **Agency responsibility.** Agencies must obtain explicit client authorization and keep an audit of which properties were submitted on whose behalf.
5. **Not a substitute for sitemap / natural discovery.** Prefer sitemaps and canonical crawl paths; use the Indexing API for time-sensitive pages (e.g. JobPosting, BroadcastEvent) per Google guidance.

The web UI shows a persistent **ToS banner**. Ignoring these rules is grounds for account termination in later Index Hub releases.

## Monorepo layout

```
apps/
  web/          Next.js App Router + Tailwind (dashboard)
  api/          Hono REST API
packages/
  db/           Prisma schema + Postgres client
  queue/        BullMQ / Redis worker stubs
  google/       Service-account JWT + Indexing API client stub
```

## Prerequisites

- Node.js **20+**
- [pnpm](https://pnpm.io) 9+
- PostgreSQL 14+ (for real DB; schema is ready)
- Redis 6+ (for real queue; worker stub runs without processing)

## Quick start (local)

```bash
# 1. Install
pnpm install

# 2. Env
cp .env.example .env
# Edit DATABASE_URL, REDIS_URL, JWT_SECRET, SESSION_SECRET

# 3. Generate Prisma client + push schema (needs Postgres)
pnpm db:generate
pnpm db:push

# 4. Dev (API :3001 + Web :3000)
pnpm dev

# 5. Worker (separate terminal)
pnpm worker
```

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
| `GOOGLE_*` | Service-account path / project (never commit real JSON) |
| `CREDITS_*` | Default balance & per-item cost |
| `API_PORT` / `NEXT_PUBLIC_API_BASE_URL` | Local ports |

## Domain model (packages/db)

- **Agency** — tenant
- **User** — belongs to agency
- **ServiceAccount** — Google SA JSON metadata (encrypted at rest in later weeks)
- **CreditBalance** / **CreditTxn** — prepaid credits ledger
- **SubmitJob** / **SubmitItem** — bulk submit + per-URL status (`queued` \| `submitted` \| `error`)
- **ApiKey** — optional programmatic access stub

## API routes (stubs)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Login placeholder |
| POST | `/auth/register` | Register placeholder |
| GET | `/credits` | Agency credit balance |
| POST | `/submit` | Bulk URL/backlink submit |
| GET | `/jobs/:id` | Job + items status |
| POST | `/service-account` | Connect Google SA |
| GET | `/health` | Health check |

## License / compliance

Internal agency tool. Operators are responsible for Google ToS compliance. No warranty.

---

Built as a week-1 scaffold for Backlinks Work. Harden toward Index Hub before production traffic.
