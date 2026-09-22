# Decisions log

Notes on sensible calls made when ARCHITECTURE.md or CLAUDE_CODE_PROMPT.md didn't spell out an
implementation detail.

## Phase 1

- **pnpm not preinstalled** — installed globally via `npm install -g pnpm` (corepack wasn't on
  PATH in this environment). Pinned pnpm 9+ compatible workspace config either way.
- **ESLint flat config (`eslint.config.js`)** instead of legacy `.eslintrc` — required for
  ESLint 9, which is current at time of writing.
- **Root `package.json` marked `"type": "module"`** to match the ESM-first TS config
  (`module: NodeNext`) used by `apps/api` and `packages/shared`, avoiding CJS/ESM interop
  warnings from tsx/eslint.
- **`apps/api/src/server.ts` is a minimal health-check server for now** (`GET /api/v1/health`).
  Real routes, Prisma, and middleware land in Phase 3 per the plan.

## Phase 2

- **Pinned `prisma`/`@prisma/client` to `6.19.3`** instead of the `latest` dist-tag, which
  currently resolves to an `8.0.0-rc.*` release candidate with a changed CLI/config surface.
  6.x is the stable, well-documented generation this project targets.
- **Local Postgres port moved to 5435** (`.env`'s `POSTGRES_PORT`) — this dev machine already had
  a native Postgres on 5432 and other Docker projects on 5433/5434. `docker-compose.yml` and
  `DATABASE_URL` both read the port from `.env`, so this is a one-line change per machine, not a
  hardcoded assumption.
- **`prisma.config.ts`** loads env vars from the repo-root `.env` (not `apps/api/.env`) so there
  is a single source of truth; `prisma/seed.ts` and `src/server.ts` do the same via `dotenv` at
  their top so `tsx` (which doesn't auto-load `.env`) sees the same vars as the Prisma CLI.
- **`apps/api/tsconfig.json` typechecks `src` and `prisma` together** (seed script included) but
  **`tsconfig.build.json`** (used by `pnpm build`) restricts `rootDir`/`include` to `src` only —
  the seed script runs via `tsx`, never compiled to `dist`.
- **Audit log entries seeded per decided visit** (decision + check-in + check-out where
  applicable) even though Phase 3 doesn't formally require this until the `transition()` function
  lands — Phase 5's Guest Details drawer needs a timeline to render, so the seed produces one
  now (~8,300 rows for 5,000 visits).
- **Visit status/type distribution is weighted, not uniform** (`STATUS_WEIGHTS` in
  `prisma/seed.ts`), to resemble a real front-desk board (more `CHECKED_OUT`/`EXPIRED` than
  `CANCELLED`, for example) rather than an even split across all 7 statuses.

## Phase 3

- **`transition()` uses `updateMany` with an `UncheckedUpdateManyInput`**, not `update` — a
  conditional `WHERE id = ? AND status = ? AND version = ?` needs `updateMany`, and Prisma's
  "checked" update type for that method excludes foreign-key scalars like `decidedById` (it
  expects a relation `connect`, which `updateMany` can't do). The unchecked variant allows
  setting `decidedById` directly, matching what the conditional update actually needs.
- **`/passes/verify` and `/passes/:token/public` are public + rate-limited, not
  `requireAuth`** — the kiosk and visitor e-pass page have no login per ARCHITECTURE.md §3
  ("Visitor (no login)"), so they're gated by `publicRateLimiter` instead.
- **In-app notifications only in Phase 3** (`notificationService.notify` just writes a
  `Notification` row) — Email (Mailpit) and SMS (console) providers and the Socket.IO push
  land in Phase 4 per the plan; wiring the interface now would mean rewriting it once the queue
  exists.
- **BullMQ job _producers_ (`src/jobs/queue.ts`) were added in Phase 3, not Phase 4** — invite
  creation, walk-in creation, and check-in all need to schedule delayed jobs (expiry, overstay)
  to be functionally complete, so the `Queue` and `scheduleX()` functions exist now. The
  `Worker` that consumes them is Phase 4 (jobs currently queue but nothing processes them yet).
  BullMQ job IDs can't contain `:`, only URL-safe chars — used `expire-visit-<id>` not
  `expire-visit:<id>`.
- **`tsx watch` restricted to `--watch-path ./src`** — by default it also watched
  `node_modules` on this machine (first-touch lazy loads from `minio`/`bullmq` triggered restart
  loops), which no `tsx` flag ignores by pattern; scoping the watch path to `src` was simpler
  than an ignore-list.
- **Express 5's `ParamsDictionary` types every value as `string | string[]`** (to support
  repeated wildcard segments) — added `src/lib/params.ts#requireParam` instead of non-null
  asserting `req.params.id!`, which doesn't fix the underlying type.
- **Verified by hand against the live seeded DB, not yet by an automated test** (Phase 6 adds
  Vitest/Supertest coverage): login, RBAC 401/403, visitor trigram + exact search, walk-in →
  approve → check-in → check-out, a concurrent double check-in (confirmed only one of two
  parallel requests succeeds, the other gets `409 CONFLICT`), invite creation with the Redis
  quota decrementing, QR verify + single-use rejection, watchlist blocking, and admin
  policies/analytics/audit/pagination.
