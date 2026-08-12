# Wave 4 Slice 4.1 — RFx kernel and request families

## Result

Slice 4.1 implements `ISS-001`, `ISS-002` and `ISS-003` at the boundary defined by `docs/slices/SLICE_4_1_EXECUTION_AUTHORITY.md`.

The implementation adds one private, organization-owned RFx aggregate with:

- the single lifecycle state `draft`;
- immutable creation-source, organization, actor-user and actor-membership evidence;
- optimistic aggregate versions beginning at 1 and incrementing once per accepted change;
- stable command identifiers and intent fingerprints;
- immutable RFx events, command receipts and organization audit evidence written atomically with the aggregate;
- a complete immutable request-family snapshot derived only from the pinned AMACS 0.5.0 projection at commit `da7879f2609271b067ae6d02875e9388a02c4fe5`; and
- authorized blank-source creation, family change and durable re-entry in a private Operational Workspace.

The permanent participant-lens order remains exactly `Opportunities/RFx | Resources | Intelligence | Referrals`. Opportunities/RFx is now available only for an authorized participant acting through their own organization and routes to `/opportunities`. External-organization action surfaces remain unavailable. Account and Quick Start remain utilities.

## Authority and persistence

Every read or command crosses the existing server-side participant route and canonical organization-operation authorization boundaries. `rfx.create` is evaluated for the exact user, membership and issuer organization after account, credential, email-verification, membership and restriction eligibility. Direct browser access to `rfxAggregates`, `rfxEvents` and `rfxCommands` remains denied.

Firestore persistence uses one transaction for the aggregate, immutable event, idempotency receipt and organization audit record. Exact retries return the committed aggregate and receipt. Reuse of a command identifier for altered intent or another organization conflicts. Stale expected versions conflict without producing partial evidence.

## Acceptance evidence

Focused domain/application tests prove:

- organization ownership and actor evidence;
- the bounded `draft` lifecycle and blank creation source;
- complete governed AMACS snapshotting and rejection of invented identifiers or caller overrides;
- exact replay, concurrent replay, altered-intent collision and cross-organization collision behavior;
- version increment, stale-version rejection and preservation of prior request-family meaning; and
- denial for missing permission, wrong tenant, wrong user, disabled/unverified/revoked accounts, inactive memberships and active restrictions.

The focused Firestore emulator acceptance proves atomic create/change behavior, exact replay, collision rejection, tenant isolation, direct-client denial, immutable event/receipt evidence and zero residual records after cleanup.

Configured-browser acceptance proves private draft creation at version 1, deterministic family change to version 2, stale mutation rejection with HTTP 409, reload/re-entry, current-lens semantics, native keyboard operation, 390 px mobile layout without overflow, reduced-motion handling, all five supported locales, two immutable events, two command receipts, two audit events, a clean console and zero residual RFx records after cleanup. Evidence is emitted to `artifacts/slice-4-1-configured-evidence.json` locally and is intentionally not committed.

Repository validation includes the RFx architecture validator, internationalization, type checking, linting, production build, focused architecture suites and the canonical `npm run check`. Production CI runs the RFx Firestore smoke in the exact reviewed tree.

## Explicit stop boundary

Slice 4.1 does not implement structured issuer-builder breadth, AI interpretation, requirements, value, term, evaluation, readiness, publication, opportunity projection, map beacons, discovery, matching, pursuit, teaming, response, submission, later lifecycle states, B6c, commercial enrollment, appearance, presentation, sensory behavior, Firebase App Hosting or build-identity changes.

Stabilization 2C remains incomplete and isolated to release engineering. B6b remains Not Started / intentionally pending. B6c remains ineligible before authoritative Slice 4.4 publication.
