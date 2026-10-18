# Firestore data model

Client access is denied by `deploy/firestore.rules`. Only the Cloud Run service, running as the `vinkla-api` service account (roles `aiplatform.user` and `datastore.user`), reads and writes.

| Collection | Document | Contents |
|---|---|---|
| `dataset` | `meta` | `chunks`, `count`, `seededAt` |
| `dataset` | `chunk-0` to `chunk-9` | `rows[]`: 500 synthetic open POs per document. Chunking keeps each document under the 1 MiB limit and a full load to 10 reads. |
| `sessions` | `{sid}` | `changes`: map of PO id to the changed PO row, and `updatedAt`. Each browser has its own session, so one judge's edits never change another's view. Capped at 300 changed POs. |
| `approvals` | `{id}` | `poId`, `optionKind`, `optionLabel`, `units`, `arrivalDay`, `donors[]` (for redirects), `totalCost`, `co2eKg`, `approvedBy`, `sid`, `state`, `history[]`, `createdAt` |

Approval states:

- `approved`: a planner agreed.
- `submitted`: the ERP received it.
- `confirmed`: the supplier or plant acknowledged it.

A PO row holds its contract date (`cdd`), expected date (`edd`), stock cover in days (`cover`), daily demand, quantity, unit price, delay cause, notice text and date history. Days count from 0 = 1 June 2026. A PO is at risk when its expected date is after the day its stock runs out.
