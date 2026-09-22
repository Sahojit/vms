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
