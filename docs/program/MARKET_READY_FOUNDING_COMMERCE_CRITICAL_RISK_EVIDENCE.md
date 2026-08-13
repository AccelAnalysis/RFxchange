# Market-Ready Founding Commerce — Critical Risk Evidence Binding

This file extends the Critical reviewer-capacity rule for `WP-MARKET-READY-FOUNDING-COMMERCE-01`.

If the required independent reviewer is available and accepts the exact release, no reviewer-capacity exception is needed.

If reviewer capacity is unavailable, product-owner risk acceptance is valid only as a durable authenticated record for the exact release under consideration.

Required record path:

`docs/program/evidence/market-ready-founding-commerce/critical-risk-acceptance/<candidate-sha>.json`

Required fields:

- `packetId`: `WP-MARKET-READY-FOUNDING-COMMERCE-01`
- `approverIdentity`: authenticated product-owner identity
- `approverRole`: `product-owner`
- `approvedAt`: valid timestamp
- `candidateSha`: exact implementation candidate SHA
- `deploymentSha`: exact deployed source SHA
- `environment`: exact production environment/backend identifier
- `decision`: `accept-critical-reviewer-capacity-risk`
- `approvalUrl`: durable authenticated approval signal
- `reviewerCapacityDebt`: description limited to the missing independent review
- `knownMaterialCriticalDefects`: empty array
- `evidence`: durable references to the exact Critical safety, deployment, rollback and production-proof evidence being accepted

The record is valid only when the candidate SHA, deployment SHA and environment match the exact release evidence. It cannot be reused for another candidate, deployment, environment or later release.

The reviewer-capacity exception can defer certification only. It never waives required safety evidence and never permits release over a known material Critical defect.