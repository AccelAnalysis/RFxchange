# Slice 3.3 — Market Profile Enrichment

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs

- `ORG-013` — Detailed products/services and capability taxonomy
- `ORG-014` — Industry and NAICS metadata
- `ORG-016` — Past performance/project-value context
- `ORG-017` — Teaming/referral/resource preferences

## Objective

Progress the essential Wave 2 profile into a useful market-facing profile while preserving the same stable organization identity, keeping capability-based discovery primary and making evidence/provenance understandable.

The default capability-declaration experience must not require participants to understand AMACS terminology before they can describe what their organization does. Slice 3.3 consumes the cross-cutting AI/AMACS Interpretation Foundation so ordinary-language organization descriptions can be mapped to reviewable AMACS capability candidates while preserving a complete manual browse/search path.

## Prerequisite boundary

Slice 3.3 must not begin merely because Slice 3.2 implementation exists on a branch.

Before Slice 3.3 is authorized:

1. Slice 3.2 must be merged and dependencies recalculated from current `main`;
2. `docs/slices/AI_AMACS_INTERPRETATION_FOUNDATION.md` must be implemented, validated and merged;
3. the AMACS release/runtime projection used by the interpretation foundation and capability records must be pinned/validated under the current RFxchange AMACS integration authority;
4. dependencies must be recalculated again from merged `main`;
5. the explicit Slice 3.3 implementation authorization must preserve all tracker and Feature-ID acceptance rules.

The AI/AMACS foundation is no-Feature-ID cross-cutting work. Its existence or completion does not mark `ORG-013`, `ORG-014`, `ORG-016` or `ORG-017` Done.

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
- `docs/slices/AI_AMACS_INTERPRETATION_FOUNDATION.md`
- `docs/rfx/AMACS_INTEGRATION_CONTRACT.md`
- canonical tracker/dependency map
- merged Slice 3.2 search/projection contracts
- `docs/slices/WAVE_3_ROADMAP.md`

## Product rules

- Enrich the existing canonical organization profile; do not create a second market-profile identity.
- `ORG-013`: support specific products/services and a structured AMACS-backed capability taxonomy usable by discovery/matching.
- `ORG-013`: permit an authorized organization manager to begin with ordinary-language descriptions of what the organization does and receive reviewable AMACS capability suggestions through the cross-cutting interpretation foundation.
- AI suggestions remain non-authoritative until the organization accepts or edits them. Do not silently add a capability because a model, website, document or previous response suggests it.
- Preserve an explicit manual Domain → Family → Capability browse/search route and a provisional-term path when no adequate canonical AMACS concept exists.
- Capability assertions must distinguish at minimum: canonical AMACS concept, organization self-declaration, supporting evidence, and later independent verification. Do not collapse these states into one badge or status.
- Organization-authored sources, websites, capability statements, service descriptions or past-performance entries may be used as suggestion inputs only when authorized; they are not proof by themselves.
- `ORG-014`: support industries served and NAICS as descriptive/filter metadata; NAICS is never proof of capability.
- `ORG-016`: support bounded past-performance summaries, typical project-value context, contract interests and buyer types. Self-reported information must be labeled/provenanced appropriately.
- `ORG-016`: when AI suggests that an entered past-performance record may support an already-confirmed capability, present that relationship for explicit review rather than attaching evidence automatically.
- `ORG-017`: store prime/subcontract interests, teaming preferences, referral preferences and resource needs without treating preferences as permissions or commitments.
- Public/private visibility is explicit by field/category and inherits existing organization projection/privacy rules.
- Capability matching/search must consume confirmed structured capability assertions; rejected or unresolved AI suggestions must not influence authoritative matching.

## AI/AMACS interpretation rules

- All model calls run through the server-side provider-neutral gateway defined by the cross-cutting foundation.
- The model must evaluate candidates retrieved from the pinned/validated AMACS runtime projection; it must not invent AMACS identifiers from model memory.
- Returned identifiers and relationships must validate against the active AMACS release before presentation.
- The participant can accept, edit, reject, add, choose none-of-these, answer clarification questions or continue manually.
- Provider/model/prompt/AMACS-release provenance and user disposition must be retained according to the foundation's privacy/minimization contract.
- AI failure, rate limiting, disabled tenant policy or budget exhaustion must fail into the manual capability workflow rather than blocking profile enrichment.
- Deterministic discovery/matching must not invoke an LLM simply to compare already-structured capability records.

## Brand and messaging rules

- Use the Operational Workspace and shared primitives established by B1/B2 rather than a dense profile dashboard or a second visual system.
- Distinguish seeded public data, business-claimed information and later verified evidence.
- Do not use seal/verification/trust visual language for self-reported capabilities, AI suggestions, past performance or project values.
- Capability presentation remains primary; NAICS and industry are supporting context.
- Explain AI suggestions as assistance, not qualification or endorsement.
- Provide truthful incomplete, empty, validation, permission, provider-unavailable and save/recovery states.
- One clear next action should dominate each enrichment step.
- Paid, Founding or sponsored status cannot improve legitimate capability presentation, AI interpretation, discovery truth or credibility appearance.

## Acceptance intent

- an authorized organization manager can add/edit structured enrichment on the same organization record;
- a manager can describe products/services/capabilities in ordinary language and receive bounded AMACS candidate suggestions without needing to know AMACS terminology first;
- every presented AMACS suggestion is catalog-valid for the pinned/validated release and remains non-authoritative until confirmed;
- a manager can complete capability enrichment without AI using hierarchical browse/search and provisional-term handling;
- rejected/unresolved AI suggestions do not become organization capability assertions or influence authoritative matching;
- search can consume confirmed structured capabilities without depending on free-form keyword text alone;
- NAICS/industry metadata can filter/contextualize but cannot substitute for capability criteria;
- past-performance/project context distinguishes self-reported data from later verified credibility;
- suggested evidence-to-capability relationships require explicit review;
- preferences can be retrieved for personalization/workflow decisions without granting authority;
- public/detail surfaces preserve provenance, visibility and accessible state language;
- mobile and keyboard users can complete the supported enrichment workflow without dense dashboard compression;
- AI provider failure/disablement does not block the supported manual enrichment workflow.

## Expected implementation qualities

Typed bounded taxonomies, AMACS release provenance, AI suggestion provenance, immutable/history evidence where material, safe public projections, validation against empty/generic shells, shared form/status primitives, provider-neutral AI boundaries, manual fallback, cost/rate controls, and tests for organization scope, visibility, recovery, confirmation state and capability-first semantics.

## Explicit non-scope

Do not implement Organization Verification, Trusted/Experienced badges or seals, advanced partner recommendations, RFx qualification, paid profile ranking, automatic past-performance claims, automatic capability assertion from websites/documents, autonomous organization-profile completion, buyer/issuer RFx need interpretation, RFx publication, Intelligence Dark, Presentation Mode, production sound or haptics.

## Exit checkpoint

Organizations can describe what they do in ordinary language or through manual AMACS browse/search, confirm governed capability assertions, add market context and self-reported experience, and state relationship/resource preferences in a form the Network can use without confusing AI suggestion, self-report, evidence or independent verification.

## Completion discipline

Recalculate dependencies after merge before authorizing Slice 3.4. Completion of the cross-cutting AI/AMACS foundation is a prerequisite, not evidence that any Slice 3.3 Feature ID is complete.
