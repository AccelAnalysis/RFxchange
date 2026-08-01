# Slice 3.3 — Market Profile Enrichment

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs

- `ORG-013` — Detailed products/services and capability taxonomy
- `ORG-014` — Industry and NAICS metadata
- `ORG-016` — Past performance/project-value context
- `ORG-017` — Teaming/referral/resource preferences

## Objective

Progress the essential Wave 2 profile into a useful market-facing profile while preserving the same stable organization identity, keeping capability-based discovery primary and making evidence/provenance understandable.

## Must read

- `/AGENTS.md`
- `docs/context/README.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/context/RFX_TRANSACTION_CYCLE.md`
- `docs/context/ACQUISITION_AND_RETENTION.md`
- `docs/brand/README.md`
- `docs/brand/BRAND_GATE_B0_RECONCILIATION.md`
- `docs/brand/CONTENT_AND_MESSAGING_SYSTEM.md`
- `docs/brand/BRAND_EXPERIENCE_ACCEPTANCE_MATRIX.md`
- `docs/design/README.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- canonical tracker/dependency map
- merged Slice 3.2 search/projection contracts
- `docs/slices/WAVE_3_ROADMAP.md`

## Product rules

- Enrich the existing canonical organization profile; do not create a second market-profile identity.
- `ORG-013`: support specific products/services and a structured capability taxonomy usable by discovery/matching.
- `ORG-014`: support industries served and NAICS as descriptive/filter metadata; NAICS is never proof of capability.
- `ORG-016`: support bounded past-performance summaries, typical project-value context, contract interests and buyer types. Self-reported information must be labeled/provenanced appropriately.
- `ORG-017`: store prime/subcontract interests, teaming preferences, referral preferences and resource needs without treating preferences as permissions or commitments.
- Public/private visibility is explicit by field/category and inherits existing organization projection/privacy rules.

## Brand and messaging rules

- Use the Operational Workspace and shared primitives established by B1/B2 rather than a dense profile dashboard or a second visual system.
- Distinguish seeded public data, business-claimed information and later verified evidence.
- Do not use seal/verification/trust visual language for self-reported capabilities, past performance or project values.
- Capability presentation remains primary; NAICS and industry are supporting context.
- Provide truthful incomplete, empty, validation, permission and save/recovery states.
- One clear next action should dominate each enrichment step.
- Paid, Founding or sponsored status cannot improve legitimate capability presentation, discovery truth or credibility appearance.

## Acceptance intent

- an authorized organization manager can add/edit structured enrichment on the same organization record;
- search can consume structured capabilities without depending on free-form keyword text alone;
- NAICS/industry metadata can filter/contextualize but cannot substitute for capability criteria;
- past-performance/project context distinguishes self-reported data from later verified credibility;
- preferences can be retrieved for personalization/workflow decisions without granting authority;
- public/detail surfaces preserve provenance, visibility and accessible state language;
- mobile and keyboard users can complete the supported enrichment workflow without dense dashboard compression.

## Expected implementation qualities

Typed bounded taxonomies, provenance, immutable/history evidence where material, safe public projections, validation against empty/generic shells, shared form/status primitives and tests for organization scope, visibility, recovery and capability-first semantics.

## Explicit non-scope

Do not implement Organization Verification, Trusted/Experienced badges or seals, advanced partner recommendations, RFx qualification, paid profile ranking, automatic past-performance claims, Intelligence Dark, Presentation Mode, production sound or haptics.

## Exit checkpoint

Organizations can describe what they do, where their market context lies, what experience they report and what relationships/resources they seek in a form the Network can use without confusing self-report with verified evidence.

## Completion discipline

Recalculate dependencies after merge before authorizing Slice 3.4.
