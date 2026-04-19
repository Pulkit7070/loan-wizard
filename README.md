# Loan Wizard

AI-powered video loan origination — camera interview, speech-to-text form fill, real-time CV liveness, ML risk scoring, instant offer. RBI Video-KYC compliant.

## Quick Start (local dev)

```bash
# 1. Install JS deps
pnpm install

# 2. Start Postgres + ML service
docker-compose up -d

# 3. Create DB tables (requires Postgres to be up)
cd apps/web && DATABASE_URL=postgresql://loan:loan@localhost:5432/loan pnpm db:push

# 4. Start the web app
pnpm --filter @loan-wizard/web dev
```

Open http://localhost:3000

## Architecture

```
Browser
  └── @loan-wizard/perception (Stream A)
        Camera + Mic + STT + TF.js CV + TTS → PerceptionEvents
  └── apps/web (Stream C) — Next.js App Router
        Session state machine, UI, Prisma audit writes
        POST /api/session/{id}/offer → ML service

apps/ml-service (Stream B) — FastAPI
  Risk MLP + persona classifier + policy engine → Offer JSON
  Writes decisions table

packages/contracts — FROZEN types + mocks
```

## Streams

| Stream | Path | Description |
|---|---|---|
| A | `packages/perception/` | Browser perception: camera, mic, STT, TF.js |
| B | `apps/ml-service/` | Python FastAPI: risk scoring, persona, policy |
| C | `apps/web/` | Next.js: UI, orchestrator, Prisma audit |

## Shared Contracts

`packages/contracts/` — TypeScript types + Zod schemas + mock data. **Frozen after foundation.**

## Environment Variables (web)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | Postgres connection string |
| `ML_SERVICE_URL` | `http://localhost:8000` | ML service base URL |
| `NEXT_PUBLIC_ML_MODE` | `mock` | `real` to call ML service |
| `USE_MOCK_PERCEPTION` | `true` | `false` to use real camera/mic |

## Standalone Perception Demo (no web needed)

```bash
pnpm --filter @loan-wizard/perception dev
# Open http://localhost:5173
```

## Git Tags

| Tag | Description |
|---|---|
| `foundation-complete` | Monorepo scaffold, contracts locked |
| `stream-a-complete` | Perception package done |
| `v1.0-submission` | Full integration |
