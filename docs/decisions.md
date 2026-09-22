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
