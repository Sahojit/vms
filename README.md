# Visitor Management System (VMS)

Production-quality visitor management system. See [ARCHITECTURE.md](ARCHITECTURE.md) for the
full design (stack, data model, state machine, flows, complexity analysis).

## Status

Phase 1 (scaffold/infra), Phase 2 (data layer), and Phase 3 (API core) complete. Later phases add
jobs/real-time, frontend screens, tests, and docs — see
[CLAUDE_CODE_PROMPT.md](CLAUDE_CODE_PROMPT.md) for the phase plan.

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
