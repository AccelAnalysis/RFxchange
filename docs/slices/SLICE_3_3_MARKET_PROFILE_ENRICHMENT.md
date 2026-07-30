# Slice 3.3 — Market Profile Enrichment

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs
- `ORG-013` — Detailed products/services and capability taxonomy
- `ORG-014` — Industry and NAICS metadata
- `ORG-016` — Past performance/project-value context
- `ORG-017` — Teaming/referral/resource preferences

## Objective

Progress the essential Wave 2 profile into a useful market-facing profile while preserving the same stable organization identity and keeping capability-based discovery primary.

## Must read

- `/AGENTS.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/context/RFX_TRANSACTION_CYCLE.md`
- `docs/context/ACQUISITION_AND_RETENTION.md`
- canonical tracker/dependency map
- merged Slice 3.2 search/projection contracts
- `docs/slices/WAVE_3_ROADMAP.md`

## Product rules

- Enrich the existing canonical organization profile; do not create a second market-profile identity.
- `ORG-013`: support specific products/services and a structured capability taxonomy that is usable by discovery/matching.
- `ORG-014`: support industries served and NAICS as descriptive/filter metadata; NAICS is never treated as proof of capability.
- `ORG-016`: support bounded past-performance summaries, typical project-value context, contract interests and buyer types. Self-reported information must be labeled/provenanced appropriately.
- `ORG-017`: store prime/subcontract interests, teaming preferences, referral preferences and resource needs without treating preferences as permissions or commitments.
- Public/private visibility is explicit by field/category and inherits existing organization projection/privacy rules.

## Acceptance intent

- an authorized organization manager can add/edit structured enrichment on the same organization record;
- search can consume structured capabilities without depending on free-form keyword text alone;
- NAICS/industry metadata can filter/contextualize but cannot substitute for capability criteria;
- past-performance/project context distinguishes self-reported data from later verified credibility;
- preferences can be retrieved for personalization/workflow decisions without granting authority.

## Expected implementation qualities

Typed bounded taxonomies, provenance, immutable/history evidence where material, safe public projections, validation against empty/generic shells, and tests for organization scope, visibility and capability-first semantics.

## Explicit non-scope

Do not implement Organization Verification, Trusted/Experienced badges, advanced partner recommendations, RFx qualification, paid profile ranking or automatic claims about past performance.

## Exit checkpoint

Organizations can describe what they do, where their market context lies, what experience they report and what relationships/resources they seek in a form the Network can use.

## Completion discipline

Recalculate dependencies after merge before authorizing Slice 3.4.