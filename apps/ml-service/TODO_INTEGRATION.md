# ML Service — Integration Handoff

## 1. Endpoint URL and Port

```
Base URL: http://localhost:8000   (local dev)
          http://ml-service:8000  (Docker network)
```

| Endpoint | Method | Purpose |
|---|---|---|
| `/offer` | POST | Primary: Stream C calls this |
| `/mock/offer` | GET | Stream C dev mock (static response) |
| `/debug/risk-score` | POST | Dev only — raw risk score |
| `/debug/persona` | POST | Dev only — raw persona |
| `/health` | GET | Readiness probe |

## 2. Env Variables Stream C Must Set (or leave default)

```bash
# If sharing a Postgres instance instead of the bundled db service:
DATABASE_URL=postgresql://loan:loan@<shared-host>:5432/loan

# Default (no change needed for demo):
PERSONA_STRATEGY=rules_first
USE_MOCK_BUREAU=true
ENABLE_GEMINI_FALLBACK=false
```

Stream C should NOT set these (ML service owns them):
- `DATABASE_URL` model schema (decisions table)

## 3. Latency Concerns

| Path | Cold start | Warm |
|---|---|---|
| Inline TF model | ~2s at startup | <50ms/req |
| Rules-based persona | 0ms | <1ms |
| Gemma 2B persona | ~15s at startup | ~2s/req |
| Gemini API persona | 0ms | ~800ms/req |

**Default config uses rules-based persona** — no LLM latency.
If Gemma is enabled, warm up starts at service boot; first request won't block.

## 4. DB Connection Expectations

- This service owns and writes to the `decisions` table only.
- Stream C owns: `sessions`, `transcripts`, `cv_signals`, `consent_records`, `video_blobs`.
- To use a shared Postgres: change `DATABASE_URL` in docker-compose.yml and remove the `db` service.
- Tables are created automatically on startup via `Base.metadata.create_all()`.

## 5. Known Limits

- **Risk model trained on synthetic data** — scores are directionally correct, not calibrated to real defaults.
- **Reason codes are illustrative** — derived from feature magnitude, not SHAP values.
- **Bureau data is mocked** — `USE_MOCK_BUREAU=true` is the only supported mode for demo.
- **Gemma 2B** requires ~5GB RAM and ~15s cold start. Use Gemini fallback or rules-only for resource-constrained envs.
- **No rate limiting** — assumes internal network, single-user demo.

## 6. Stream C Dev Workflow

1. Point `OFFER_API_URL=http://localhost:8000/mock/offer` during parallel dev.
2. Once this service is up, switch to `POST http://localhost:8000/offer`.
3. Request schema: see `app/schemas.py → OfferRequest`.
4. Response always 200; check `eligible` field to distinguish approved vs rejected.
