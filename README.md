# Loan Wizard

AI-powered video loan origination system.

## Streams
- **Stream A** — `packages/perception/` — browser perception (camera, mic, STT, CV)
- **Stream B** — `apps/ml-service/` — ML risk scoring and persona classification
- **Stream C** — `apps/web/` — Next.js shell and orchestrator

## Shared Contracts
All shared TypeScript types and mock data live in `packages/contracts/`. This package is frozen after foundation.

## Development
```bash
pnpm install
pnpm dev
```
