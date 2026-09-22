# Visitor Management System (VMS)

Production-quality visitor management system. See [ARCHITECTURE.md](ARCHITECTURE.md) for the
full design (stack, data model, state machine, flows, complexity analysis).

## Status

Phase 1 (scaffold and infra) and Phase 2 (data layer) complete. Later phases add the API,
jobs/real-time, frontend screens, tests, and docs — see
[CLAUDE_CODE_PROMPT.md](CLAUDE_CODE_PROMPT.md) for the phase plan.

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
