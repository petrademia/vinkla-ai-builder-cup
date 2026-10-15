# vinkla-ai-builder-cup

Public showcase repository for **Vinkla**, our entry to the Google Cloud AI Builder Cup 2026, Manufacturing theme: Intelligent Operations and Industrial Efficiency.

The full product codebase is private because we plan to commercialize it. As the organizers described in their Q&A session for teams that cannot expose a full codebase, this repository documents what the system does, how it uses Google Cloud, and the evidence that it works. The deployed prototype runs the real engine.

## The problem

A purchase order (PO) carries a contractual delivery date. When a carrier delays the shipment, the ERP does not change that date, so planners learn about the delay days later, often by email. By then a production line can be close to running out of a component, and the rushed fix is usually air freight.

## What Vinkla does

1. Reads a delay notice or carrier ETA update and extracts the affected PO, the new date, and the cause.
2. Recalculates stock cover and the shortage with a deterministic rules engine.
3. Generates recovery options (micro-PO, stock transfer, change of destination, air freight) with cost, arrival time, and CO2e.
4. Explains the trade-offs, recommends one option, and drafts the supplier message in the supplier's language.
5. Waits for the planner to approve before anything is written to the ERP.

With thousands of open POs and hundreds delayed, a Gemini-written summary groups the delays by cause for each planner queue.

## Google Cloud services

| Service | Role |
|---|---|
| Gemini | Notice extraction with structured output, briefings, option explanations, multilingual drafts, planner questions |
| Cloud Run | Hosts the backend, rules engine, and Gemini integration |
| Firestore | Stores POs, ETA history, recommendations, and approvals |
| Firebase Hosting | Serves the planner dashboard |

## Design rule

Numbers come from code. Stock cover, quantities, costs, and feasibility are calculated by the rules engine. Gemini reads, explains, and drafts, and its output is validated before it is shown.

## Status

In development for the AI Builder Cup 2026. The deployed link, demo video, and evidence below will be added as they are produced.

## Planned contents

- Architecture diagram
- Gemini prompts, output schemas, and tool definitions
- Deployment configuration for Cloud Run
- Firestore data model
- API contract for the deployed service
- Sample delay notices with extracted outputs
- Evaluation results on a labelled sample, with synthetic data only

## License

Copyright held by the authors. No license is granted for reuse.
