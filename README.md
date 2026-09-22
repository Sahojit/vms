# Visitor Management System (VMS)

Production-quality visitor management system. See [ARCHITECTURE.md](ARCHITECTURE.md) for the
full design (stack, data model, state machine, flows, complexity analysis).

## Status

Phase 1 (scaffold and infra) complete. Later phases add the data layer, API, jobs/real-time,
frontend screens, tests, and docs — see [CLAUDE_CODE_PROMPT.md](CLAUDE_CODE_PROMPT.md) for the
phase plan.

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
pnpm dev            # runs api (:4000) and web (:5173) locally
# or
docker compose up   # full containerized demo
```

## Scripts

- `pnpm dev` — run all apps in watch mode
- `pnpm build` — build shared package then all apps
- `pnpm lint` / `pnpm typecheck` / `pnpm test` — run across every workspace package
