# Stream C — Integration TODO

## 1. Env Vars to Flip (mock → real)

| Variable | From | To |
|---|---|---|
| `USE_MOCK_PERCEPTION` | `true` | `false` |
| `NEXT_PUBLIC_ML_MODE` | `mock` | `real` |
| `ML_SERVICE_URL` | `http://localhost:8000` | Stream B deployed URL |
| `DATABASE_URL` | local dev DB | Neon/Railway production URL |

## 2. Perception Event Fields Not Currently Used

- `permission_granted.payload.geo` — we request geo from the browser directly; the hook's geo bool is not stored
- `transcript_turn.payload.confidence` — stored in DB but not displayed in UI
- `cv_signal.payload.blink_count_window` — stored but not shown in indicator strip
- `cv_signal.payload.head_pose_delta` — stored but not shown
- `error` event — currently unhandled; agent should not emit frequently

## 3. ML Response Fields Not Currently Displayed

- `offer.persona` — stored in offer but not shown on offer card
- `offer.risk_band` — not shown to user (internal only)
- `offer.generated_at` — not shown

## 4. Known UI Issues with Mock Data

- Offer page reads MOCK_OFFER directly from contracts rather than re-fetching from server — because the /processing page computes and stores server-side but the offer page needs a GET endpoint we haven't built. Add `GET /api/session/:id/offer` to retrieve stored offer.
- Mock perception fires all events in ~12s (6 events × 2s). Real sessions will be much longer; timer/UX is fine but end-call auto-trigger on `session_ended` may fire before user expects.
- FormSidePanel shows declared_age from form extraction but the field isn't in the AnimatePresence list — add if Stream A extracts it.

## 5. CORS

Stream B must allow the Vercel preview and production URLs:
- `https://loan-wizard-*.vercel.app`
- `https://loan-wizard.vercel.app` (production alias)

Document in Stream B's `TODO_INTEGRATION.md`.

## 6. Deployed URL

TODO: Add Vercel URL after deployment
