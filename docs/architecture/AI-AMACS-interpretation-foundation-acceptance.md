# AI/AMACS Interpretation Foundation Acceptance

**Gate:** Cross-cutting AI/AMACS Interpretation Foundation

**AMACS release:** 0.5.0, pinned source commit `da7879f2609271b067ae6d02875e9388a02c4fe5`

**Feature-ID effect:** none

## Implemented boundary

The foundation adds one server-only, provider-neutral interpretation gateway. It authenticates and reauthorizes the current participant and organization for the requested purpose, applies an explicit feature policy, minimizes and redacts authorized sources, retrieves a bounded set from the immutable AMACS 0.5.0 projection, calls a provider adapter, validates strict structured output and the canonical AMACS schemas, then persists only non-authoritative interpretation records and candidates.

The concrete provider is an OpenAI Responses API adapter behind the application port. Requests use strict JSON Schema output, `store: false`, a hashed safety identifier, a caller request ID, configurable primary/escalation models, a 20-second timeout and at most one retry for network, rate-limit or server failures. No provider type, key or endpoint enters participant/browser contracts or AMACS domain records.

Provider operation is opt-in and truthfully disabled unless both `RFXCHANGE_AI_PROVIDER_ENABLED=true` and `OPENAI_API_KEY` are present. The reusable manual AMACS catalog service has no provider, secret or quota dependency.

## Configuration

- `RFXCHANGE_AI_INTERPRETATION_ENABLED=true` enables the tenant policy boundary.
- `RFXCHANGE_AI_ENABLED_ORGANIZATION_IDS` optionally limits enablement to an explicit organization-tenant allowlist.
- `RFXCHANGE_AI_INTERPRETATION_PURPOSES` controls the comma-separated allowed purposes.
- `RFXCHANGE_AI_PROVIDER_ENABLED=true` enables provider routing.
- `OPENAI_API_KEY` is read only by the server adapter.
- `RFXCHANGE_AI_PRIMARY_MODEL` defaults to `gpt-5.6-luna`.
- `RFXCHANGE_AI_ESCALATION_MODEL` defaults to `gpt-5.6-terra` for ambiguous retrieval.
- `RFXCHANGE_AI_INPUT_MICROUSD_PER_MILLION_TOKENS` and `RFXCHANGE_AI_OUTPUT_MICROUSD_PER_MILLION_TOKENS` enable configured cost estimates. Cost is recorded as unavailable when either value is absent; it is never fabricated.

## Persistence and authority

Mutable interpretation aggregates and candidates are separate from append-only provenance, usage and disposition evidence. Daily transactional quota buckets enforce user, organization and tenant request and estimated-input-token limits before provider use. Direct Firestore clients are denied for every new collection.

All interpretation candidates begin as `suggested`, require human confirmation and retain `authoritative_effect: "none"`. Accepted and edited dispositions are still only interpretation decisions. Rejected, unresolved, withdrawn and none-of-these outcomes create no capability, RFx requirement, qualification, matching, verification, referral, credibility or outcome record. A later authorized consumer must invoke a separate domain command and revalidate authority and current AMACS state.

Raw full source text is not persisted. Provenance retains source references, SHA-256 content hashes, character counts and redaction counts; candidates contain bounded redacted excerpts. Participant-document text requires explicit attachment opt-in. Content-safe logs contain IDs, outcome, failure class and latency, never participant content or provider secrets.

## Deterministic acceptance evidence

- `node --test test/ai-amacs-interpretation-foundation.test.mjs` covers privacy/redaction, document opt-in, seller and buyer retrieval, schema-valid record/candidate generation, authorization-before-provider, invented-ID rejection and failure evidence, all dispositions, none-of-these, the independent manual route and missing-secret behavior.
- `npm run evaluate:ai-amacs-interpretation` gates the versioned seller HVAC, buyer stormwater, ambiguous and unsupported cases. It requires 100% reviewed recall at K, 100% identifier validity, bounded candidates and the deterministic usage/cost/latency budget.
- `npm run validate:ai-amacs-interpretation-foundation` enforces secret isolation, strict structured output, non-authoritative behavior, persistence separation and unchanged tracker scope.
- `npm run smoke:ai-amacs-interpretation` runs against the Firestore emulator and proves direct-client denial, atomic server persistence, disposition transitions and quota exhaustion.
- `npm run check` remains the canonical full repository gate.

A live provider smoke is intentionally absent because no configured `OPENAI_API_KEY` is available in the local acceptance environment. Missing credentials produce the tested disabled state. A live smoke may be run only in an explicitly configured controlled environment and is not replaced with fake success.

## Scope confirmation

No participant capability picker or profile enrichment UI, organization capability assertion command, MarketNeed or RFx requirement command, matching input, publication, autonomous proposal, verification, credibility, referral, teaming or taxonomy mutation was implemented. Slice 3.3 and every later slice or Brand Gate remain unbegun. The master tracker receives no checked Feature ID or progress-total change from this foundation.
