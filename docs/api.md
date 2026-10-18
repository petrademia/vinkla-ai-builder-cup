# API

Base URL: `https://vinkla-api-334409609237.asia-southeast1.run.app`. All bodies are JSON. Errors return `{ "error": ... }`.

Limits: 20 Gemini calls a minute per client (`/v1/notices/extract`, `/v1/chat`) and 240 calls a minute in total. Past the limit the API returns HTTP 429.

| Method and path | Purpose |
|---|---|
| `GET /health` | Liveness check. |
| `GET /v1/dataset?sid=` | The 5,000 open POs from Firestore, with the session's changes applied. |
| `POST /v1/notices/extract` | Extract POs, dates and reason from a notice. Body: `notice`, optional `referenceDate`, optional `knownPoIds`. Returns `items[]`, `reason`, `confidence`, `issues[]`. |
| `POST /v1/sessions/:sid/pos/:poId/eta` | Apply a new arrival date to a PO. The server recalculates delay, shortage and risk, and appends to the date history. |
| `POST /v1/sessions/:sid/reset` | Delete the session's changes. |
| `POST /v1/chat` | Gemini chat with tools. Body: `sid`, `messages[]`. Returns `reply`, `toolCalls[]`, `poIds[]`. |
| `POST /v1/assess` | Stockout assessment and ranked options for given stock, demand and candidates. |
| `POST /v1/approvals` | Approve a recovery option for a PO. Body: `sid`, `poId`, `optionKind` (`micro_po`, `sto`, `cod`, `air`), `approvedBy`. The server works out the units and arrival day itself, refuses a second approval for the same PO, and starts in state `approved`. The approved option then counts as supply in `GET /v1/dataset` and in the chat tools. |
| `GET /v1/approvals?sid=` | List a session's approvals. |
| `POST /v1/approvals/:id/advance` | Move `approved` to `submitted`, then `confirmed`. Refuses to go further. |

Try it:

```bash
curl -s -X POST https://vinkla-api-334409609237.asia-southeast1.run.app/v1/notices/extract \
  -H 'content-type: application/json' \
  -d '{"notice":"Berth congestion. PO 40123 will now arrive on 21 June 2026.","referenceDate":"2026-06-01"}'
```
