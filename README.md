# Visitor Management System (VMS)

Production-quality visitor management system. See [ARCHITECTURE.md](ARCHITECTURE.md) for the
full design (stack, data model, state machine, flows, complexity analysis).

## Status

Phases 1-6 complete (scaffold/infra, data layer, API core, jobs/real-time, frontend, quality).
Phase 7 (docs/demo polish) remains — see [CLAUDE_CODE_PROMPT.md](CLAUDE_CODE_PROMPT.md) for the
phase plan.

## API

`apps/api` is layered `routes → controllers → services → repositories`, with the visit state
machine (`src/domain/visitStateMachine.ts`) as the single choke point for status changes — every
transition runs inside a Prisma transaction with an optimistic `version` check and writes an
AuditLog row. All endpoints from ARCHITECTURE.md §3 are implemented under `/api/v1`: auth
(JWT access + httpOnly refresh cookie), visitor search, walk-in/approve/reject/cancel,
invites with an O(1) Redis daily quota, QR pass verify (single-use, HMAC-signed), check-in/
check-out (idempotent via `Idempotency-Key`), cursor-paginated visit listing, host inbox/history,
and admin policies/watchlist/analytics/audit. Try it with `curl` once the server and seed data
are up — see the demo credentials below.

## Jobs and real-time

A separate worker process (`pnpm --filter=@vms/api run worker:dev`, or the `worker` service in
`docker-compose.yml`) consumes a BullMQ `visits` queue: `expire-visit` (an unused APPROVED visit
past its window), `expire-pending` (a host who never responded), and `overstay-check` (still
`CHECKED_IN` past the overstay threshold — a derived flag, not a stored status, so this only
notifies and pushes a socket event rather than changing the row). The API process schedules these
jobs from the request path (walk-in, approve, check-in) so they're ready the moment the worker is
running. Every visit event (`visit.created`, `visit.updated`, `visit.overstay`, `visit.rejected`)
is pushed live over Socket.IO — rooms `user:{id}` and `office:{id}`, Redis adapter so it works
across multiple API instances. Notifications fan out to three channels: an in-app `Notification`
row, email via Mailpit (http://localhost:8025 to view), and a console-logged SMS mock.

## Frontend

`apps/web` (React + Vite + Tailwind + TanStack Query + React Router + React Hook Form + Zod) —
hand-rolled Tailwind UI primitives (`src/components/ui`) in place of the shadcn CLI (no network
prompt available in this environment), same navy palette and API surface. Screens: Login,
Host → Invite Visitors / Approvals inbox / My Visits, Front Desk → Visitors Board (cursor-paginated
infinite scroll, live socket updates, Guest Details drawer) / Walk-in registration (webcam capture
with retake, file-upload fallback, existing-visitor autofill), Kiosk QR check-in
(`html5-qrcode`), the public Visitor e-pass page (`/pass/:token`, printable), and Admin →
Policies / Watchlist / Analytics (Recharts) / Audit Log. Every mutation shows a toast (`sonner`);
lists have skeletons and empty states; destructive actions confirm first.

## Quality

- **API tests** (`apps/api/tests`, Vitest + Supertest): the full visit-status transition matrix,
  the pre-approval Redis quota, QR single-use/expiry/window checks, a real concurrent
  double-check-in race (only one of two parallel requests wins), RBAC 401/403, validation
  errors, and the full walk-in → approve → check-in → check-out lifecycle. 91 tests,
  **92% statement coverage on `src/services` + `src/domain`** (target was ≥80%).
  Run: `pnpm --filter=@vms/api run test` (or `test:coverage` for the report).
- **E2E tests** (`apps/web/e2e`, Playwright): _invite → e-pass → QR check-in → check-out_ and
  _walk-in → host approves live → board updates_ (two real browser contexts, live Socket.IO
  push verified, no polling). Run: `pnpm --filter=@vms/web run e2e` (needs the full stack up).
- **Load tests** (`k6/`): search, board pagination, and the check-in hot path — all comfortably
  under their latency thresholds. Results: [`docs/performance.md`](docs/performance.md).
- **Query plans**: `EXPLAIN ANALYZE` for the three hottest queries (front-desk board, visitor
  search, cursor pagination), confirming each uses the index it was designed for — also in
  [`docs/performance.md`](docs/performance.md).

## Monorepo layout

```
apps/
  api/        # Express + TypeScript API (Prisma, BullMQ worker land in Phase 2-4)
  web/        # React + Vite + Tailwind frontend
packages/
  shared/     # Zod schemas, enums, types shared by api and web
docker-compose.yml
k6/           # load tests (Phase 6)
docs/         # performance notes, decisions, demo script, screenshots
```

## Setup

```bash
cp .env.example .env
pnpm install
docker compose up -d postgres redis minio mailpit   # infra only, for local dev
pnpm --filter=@vms/api run db:migrate:deploy         # apply migrations (incl. pg_trgm index)
pnpm --filter=@vms/api run db:seed                   # 3 offices, 2,000 visitors, 5,000 visits
pnpm dev                                              # runs api (:4000) and web (:5173)
# or, for the full containerized demo:
docker compose up
```

> If port 5432/6379/etc. already have something running locally, edit the `*_PORT` variables in
> `.env` before starting the containers — `docker-compose.yml` reads every port from `.env`.

## Scripts

- `pnpm dev` — run all apps in watch mode
- `pnpm build` — build shared package then all apps
- `pnpm lint` / `pnpm typecheck` / `pnpm test` — run across every workspace package
- `pnpm --filter=@vms/api run db:migrate` — create/apply a Prisma migration (interactive)
- `pnpm --filter=@vms/api run db:studio` — browse the database in Prisma Studio

## Demo credentials

Every seeded user shares the same password: **`Passw0rd!`**

| Role                      | Email                                         |
| ------------------------- | --------------------------------------------- |
| Admin                     | `admin@vms.local`                             |
| Security (one per office) | `security1@vms.local` … `security3@vms.local` |
| Host                      | `host1@vms.local` … `host25@vms.local`        |
