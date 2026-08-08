# Slice 3.3 — Market Profile Enrichment

**Status: PLANNING BRIEF ONLY — AUTHORIZE ONLY AFTER SLICE 3.2, AMACS 0.5.0 RECONCILIATION AND THE AI/AMACS INTERPRETATION FOUNDATION HAVE MERGED AND AUTHORITY HAS BEEN RECALCULATED.**

## Feature IDs

- `ORG-013` — Detailed products/services and capability taxonomy
- `ORG-014` — Industry and NAICS metadata
- `ORG-016` — Past performance/project-value context
- `ORG-017` — Teaming/referral/resource preferences

## Objective

Progress the essential Wave 2 organization profile into a useful market-facing profile while preserving one stable organization identity, making capability-based discovery primary and keeping AI suggestion, organization assertion, evidence and verification visibly distinct.

An organization should be able to explain what it does in ordinary language, review AMACS-backed suggestions and confirm accurate capabilities without being required to understand taxonomy terminology. A complete manual Domain → Family → Capability route remains available.

## Hard prerequisites

Before implementation begins:

1. PR #120 / Slice 3.2 is accepted, tracker-evidenced and merged;
2. dependencies and execution authority are recalculated from merged `main`;
3. RFxchange is reconciled to immutable AMACS 0.5.0 from `AccelAnalysis/amacs` commit `da7879f2609271b067ae6d02875e9388a02c4fe5`;
4. the 0.5.0 catalog and MarketNeed / InterpretationRecord / InterpretationCandidate / ConceptInterpretationGuidance contracts are generated, validated and available behind application ports;
5. the cross-cutting AI/AMACS Interpretation Foundation is implemented, evaluated and merged;
6. authority is recalculated again; and
7. an explicit Slice 3.3 authorization is recorded without pre-marking any Feature ID.

The two cross-cutting gates have no Feature IDs and do not complete `ORG-013`, `ORG-014`, `ORG-016` or `ORG-017`.

## Must read

- `/AGENTS.md`
- `docs/context/README.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/context/RFX_TRANSACTION_CYCLE.md`
- `docs/context/ACQUISITION_AND_RETENTION.md`
- `docs/context/CREDIBILITY_SYSTEM.md`
- `docs/rfx/AMACS_INTEGRATION_CONTRACT.md`
- `docs/rfx/AMACS_0_5_RECONCILIATION.md`
- `docs/slices/AI_AMACS_INTERPRETATION_FOUNDATION.md`
- `docs/slices/WAVE_3_ROADMAP.md`
- `docs/brand/README.md`
- `docs/brand/CONTENT_AND_MESSAGING_SYSTEM.md`
- `docs/brand/BRAND_EXPERIENCE_ACCEPTANCE_MATRIX.md`
- `docs/design/README.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- canonical tracker/dependency map
- merged Slice 3.2 search/projection contracts

## Domain boundaries

### One organization identity

Enrich the existing canonical organization. Do not create a separate seller, responder, supplier, capability-profile or market-profile identity.

### Interpretation is not assertion

Use the AMACS 0.5.0 sequence:

```text
organization-authored language or approved source
→ RFxchange-owned InterpretationRecord
→ source-grounded InterpretationCandidate records
→ participant accept / edit / reject / unresolved / none-of-these
→ separately authorized server command
→ OrganizationCapabilityClaim
```

Every interpretation record/candidate remains `authoritativeEffect: "none"`. An accepted candidate still requires current server-side user/organization authorization and a separate confirmed write.

### Assertion is not evidence or verification

```text
AMACS capability exists
        ≠
AI/manual interpretation candidate
        ≠
organization self-reports capability
        ≠
organization supplies supporting evidence
        ≠
evidence/capability is independently verified
```

Do not collapse these into one status, icon, badge, seal or match fact.

## Product rules

### `ORG-013` — products, services and capabilities

- Support specific products/services and structured AMACS 0.5.0 capability assertions usable by discovery and later matching.
- Default assisted entry begins with organization-authored plain language and returns a bounded candidate set retrieved from the verified 0.5.0 catalog.
- Returned IDs, roles, relationships and controlled values validate against the pinned release before presentation.
- The participant can accept, edit, reject, add, answer clarification questions, select none-of-these or continue manually.
- Confirmed assertions preserve AMACS release, label snapshot, entity scope where relevant, market roles, delivery roles, service geography, specialties, capacity, evidence references, visibility and assertion state.
- An organization may hold several capabilities and market roles. Market role is distinct from RFx delivery-team role.
- Preserve a manual hierarchy/search picker with keyboard/mobile acceptance.
- When no concept fits, create a provisional-term proposal rather than force an inaccurate mapping.
- Rejected/unresolved candidates cannot affect search, matching, recommendations or public profile projections.
- Website text, capability statements, documents, external classifications and prior RFx responses may be authorized suggestion sources only; they do not create claims automatically.

### `ORG-014` — industry and NAICS context

- Store industries served and approved NAICS metadata as descriptive/filter context.
- Preserve source/version/provenance for imported or selected external classifications.
- NAICS is not proof of capability, eligibility, certification or procurement readiness.
- An external classification cannot become an AMACS alias without governed crosswalk/editorial treatment.

### `ORG-016` — past performance and project-value context

- Support bounded organization-authored project summaries, customer/sector context where permitted, role, time period, project/contract type, structured value/range where appropriate, location, outputs and outcomes claimed.
- Keep self-report, counterparty confirmation and independent verification distinct.
- Sensitive client, contract, financial and evidence information remains private unless explicitly published.
- AI may suggest that a past-performance record could support an already-confirmed capability, but the participant must review the relationship and evidence remains a separate record.
- Do not automatically award credibility, qualification or verified experience from an entered project.

### `ORG-017` — teaming, referral and resource preferences

- Store prime/subcontractor/supplier/referral-partner interests, team preferences, referral preferences, resource needs and contact/intake preferences.
- Preferences are not permission, availability, commitment, endorsement or legal teaming relationships.
- Public/network/private visibility is explicit.
- These preferences support later workflows only after those domains are authorized.

## AI/AMACS implementation rules

- All assisted calls use the merged server-side provider-neutral gateway.
- Candidate retrieval uses the pinned 0.5.0 projection, not model memory.
- Persist InterpretationRecord, InterpretationCandidate and RFxchange provenance separately from capability claims.
- Provider/model/prompt/retrieval/release/token/cost metadata stays in implementation provenance rather than the capability assertion.
- Only minimum necessary source content is sent; authorization and opt-in govern websites/documents/profile data.
- Invalid/model-invented IDs are rejected and never displayed as AMACS suggestions.
- Quota, policy, provider or network failure degrades to the manual picker.
- Deterministic discovery/matching of confirmed records does not call an LLM.
- Benchmark regression thresholds remain an implementation gate.

## Search and public projection

- Slice 3.2 discovery may migrate from legacy profile text to confirmed structured capabilities without losing truthful historical behavior.
- During migration, label the source of searchable information and avoid double-counting free text and structured assertions.
- Public/detail projections expose only fields permitted by organization and platform policy.
- Capability labels and breadcrumbs are primary; raw IDs are technical detail.
- Search explanations may state why a record matched but cannot state universal qualification or endorsement.

## Brand and messaging rules

- Use the Operational Workspace and shared B1/B2 primitives rather than a dense dashboard or second design system.
- Distinguish seeded public data, organization-claimed data, AI suggestions, evidence and verified facts.
- Do not use credibility seals/trust language for AI suggestions, self-reported capabilities, past performance or project values.
- Capability is primary; NAICS/industry are supporting context.
- Explain assistance as help organizing what the organization says it does—not as certification or approval.
- Provide truthful incomplete, empty, clarification, validation, permission, provider-unavailable, save/conflict and recovery states.
- Paid, Founding or sponsored status cannot improve interpretation, capability truth, neutral discovery or credibility appearance.

## Security and privacy acceptance

- Server re-resolves user, organization membership, permission and restrictions on every consequential write.
- Wrong-user/wrong-organization access is denied for drafts, candidates, provenance, evidence and private fields.
- Source excerpts and model logs are minimized and protected.
- Public projections cannot expose private documents, exact private locations, client identities or internal capacity details.
- Stale accepted candidates cannot be committed after authority, catalog release or organization state changes without revalidation.
- Replayed acceptance commands are idempotent and do not create duplicate claims.

## Acceptance intent

- an authorized manager can enrich the same organization record;
- ordinary-language entry produces catalog-valid, source-grounded, reviewable candidates;
- every candidate remains non-authoritative until a separate confirmed write;
- accepted, edited, rejected and unresolved dispositions persist correctly;
- rejected/unresolved suggestions do not affect authoritative discovery;
- manual hierarchical search and provisional terms work without AI;
- entity scope, market role, delivery role, service geography and visibility are preserved;
- search consumes confirmed structured capabilities without relying only on free text;
- NAICS/industry cannot substitute for capability;
- past performance preserves provenance and verification boundaries;
- evidence-to-capability suggestions require review;
- preferences do not grant authority or commitment;
- mobile, keyboard, focus, screen-reader and reduced-motion acceptance pass;
- provider outage/disablement does not block enrichment; and
- configured-browser acceptance uses real authorized/disposable records and leaves no synthetic production data.

## Expected implementation qualities

Typed contracts generated from/pinned to AMACS 0.5.0; bounded server commands; immutable/auditable interpretation and claim history where material; safe projections; migration evidence; shared form/status primitives; provider-neutral AI boundaries; privacy/minimization; cost/rate controls; idempotency; emulator/security/architecture tests; and configured-browser evidence.

## Explicit non-scope

Do not implement Organization Verification, credibility badges/seals, RFx qualification, opportunity recommendations, autonomous profile completion, automatic capability creation from websites/documents, buyer/issuer MarketNeed product flows, RFx publication, paid ranking, advanced partner recommendations, provider approval/routing, referral lifecycle, Intelligence Dark, Presentation Mode, production sound or haptics.

## Exit checkpoint

Organizations can describe what they do in ordinary language or manually, review and confirm governed AMACS 0.5.0 capability assertions, add market context and self-reported experience, and state teaming/referral/resource preferences without confusing interpretation, assertion, evidence or verification.

## Completion discipline

Mark only `ORG-013`, `ORG-014`, `ORG-016` and `ORG-017` when each acceptance condition and evidence passes. Merge, run production CI, recalculate from merged `main`, update execution authority, and only then authorize Slice 3.4.
