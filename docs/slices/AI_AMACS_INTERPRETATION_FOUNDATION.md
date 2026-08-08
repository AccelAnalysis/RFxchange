# Cross-cutting AI/AMACS Interpretation Foundation

**Status: CANONICAL PLANNING FOUNDATION — IMPLEMENT AFTER SLICE 3.2 AND THE AMACS 0.5.0 RECONCILIATION MERGE, AND BEFORE SLICE 3.3. NO FEATURE-ID COMPLETION CLAIMS.**

## Purpose

Establish one governed interpretation layer between ordinary participant language and AMACS-backed RFxchange structures.

The foundation exists because neither issuers nor responders should be required to understand AMACS terminology before they can use The RFxchange effectively.

The operating principle is:

> **AI interprets and assists. AMACS defines and constrains. The participant confirms. RFxchange stores and operates the authoritative market record.**

AMACS 0.5.0 supplies the provider-neutral semantic contracts. RFxchange supplies the server-side AI implementation, authorization, provenance, privacy, cost control and authoritative commands.

## Sequencing authority

```text
Slice 3.2 — Controlled Network Entry & Discovery
→ configured-browser acceptance, tracker evidence and merge
→ recalculate from merged main
→ reconcile RFxchange to AMACS 0.5.0
→ validate and merge
→ recalculate
→ implement this AI/AMACS Interpretation Foundation
→ validate and merge
→ recalculate
→ authorize Slice 3.3 — Market Profile Enrichment
```

Planning or implementation of this foundation must not widen active Slice 3.2. Completion of either cross-cutting gate changes no Feature-ID status by itself.

## Pinned semantic contracts

The foundation must consume the immutable AMACS 0.5.0 release at commit `da7879f2609271b067ae6d02875e9388a02c4fe5` through `docs/rfx/AMACS_INTEGRATION_CONTRACT.md`.

Required AMACS contracts are:

- `market-need.schema.json`;
- `interpretation-record.schema.json`;
- `interpretation-candidate.schema.json`;
- `concept-interpretation-guidance.schema.json`;
- `organization-capability.schema.json`;
- `rfx-requirement.schema.json`; and
- the existing evidence, request, response, decision, readiness, role and outcome contracts used by the applicable workflow.

### Authority boundary

An AMACS interpretation record has `humanConfirmationRequired: true` and `authoritativeEffect: "none"`.

An interpretation candidate remains non-authoritative even when its disposition becomes accepted. A separate server-authorized RFxchange command must create or change the market need, organization capability assertion, RFx requirement or other domain record.

Rejected, unresolved, withdrawn or merely suggested candidates cannot influence authoritative matching, qualification, verification, credibility, publication or outcome reporting.

## Product boundary

Participants may begin in ordinary language, manually browse AMACS, or use both.

Examples:

- seller/responder: “We install and maintain commercial HVAC systems, troubleshoot controls, and replace rooftop units.”
- buyer/issuer: “Our parking lot floods during heavy rain and we need safe access before hurricane season.”

The system may interpret language, identify ambiguity, retrieve candidate AMACS concepts and propose structure. It must not invent identifiers, silently create claims/requirements, make legal determinations, publish, submit, select, award or rewrite AMACS.

## Architecture

```text
participant-authored language or approved source material
                         ↓
                 RFxchange UI/API
                         ↓
          authenticated server-side AI gateway
                         ↓
          authorization + minimization/redaction
                         ↓
       AMACS 0.5.0 retrieval / bounded candidate set
                         ↓
             provider-neutral model adapter
                         ↓
               strict structured output
                         ↓
      AMACS schema + catalog + relationship validation
                         ↓
       persisted non-authoritative interpretation record
                         ↓
       accept / edit / reject / none / clarify / manual
                         ↓
        separate authorized domain command and write
```

Provider-specific request/response types cannot leak into organization, capability, RFx, requirement, evidence, matching, referral, credibility or outcome domain models.

## Required components

### 1. Server-side AI gateway

Create one authenticated server-side gateway that owns:

- current user/session and organization authority;
- tenant and feature policy;
- provider/model routing;
- secrets;
- request/token limits and abuse controls;
- retries, timeouts and bounded failure handling;
- structured-output validation;
- usage and cost metering;
- prompt/retrieval versioning;
- privacy/minimization rules; and
- content-safe observability.

The participant browser never contains provider secrets or calls the provider as an RFxchange authority.

### 2. Provider abstraction and model router

Use a provider-neutral application interface. Prefer the least-expensive model that meets the evaluated quality threshold; allow bounded escalation for ambiguity or complexity. Provider/model choice remains RFxchange operational metadata.

### 3. AMACS release-aware retrieval

Retrieve from the verified 0.5.0 runtime projection rather than model memory. Candidate retrieval considers stable ID, label, definition, aliases, domain/family hierarchy, relationships, optional interpretation guidance, properties, market roles and release provenance.

Lexical/vector scores are retrieval signals, not proof. Do not send the entire release when a bounded candidate set is sufficient.

### 4. Strict contracts and validation

Persist AMACS-conforming InterpretationRecord and InterpretationCandidate objects separately from authoritative domain records.

RFxchange-owned provenance stores provider/model, prompt template, retrieval/index version, token/usage, cost, latency, provider request ID and retention-relevant metadata. That provenance is referenced opaquely from the AMACS interpretation record.

Validate every returned canonical ID, relationship and controlled value against the pinned release before presentation. Invalid/model-invented IDs are rejected, logged safely and never shown as AMACS suggestions.

### 5. Human confirmation

The product provides explicit controls to accept, edit, reject, add, choose none-of-these, answer focused clarification questions and continue manually.

Acceptance of a suggestion does not bypass server authority. The resulting domain command revalidates current user, organization, release, catalog record and any workflow-specific rules.

### 6. Privacy and minimum necessary data

Define prohibited/sensitive fields, attachment opt-in, extraction boundaries, field-level redaction, RFxchange/provider retention expectations, minimized logs, authorization before source inclusion, tenant controls and outage/disable behavior.

Participant-authored text remains participant-authored and remains outside the existing automatic-translation scope.

### 7. Usage and cost controls

Capture organization/user, purpose, provider/model, input/output usage, estimated/actual cost, latency, outcome/failure class and cache/retrieval use where material.

Enforce configurable request, user, organization and tenant limits. Quota exhaustion degrades to the manual AMACS route rather than blocking core participation.

Deterministic search/matching of already-structured records does not call an LLM.

### 8. Evaluation and regression harness

Create reviewed seller- and buyer-side cases. Track identifier validity, precision, recall, over-classification, unsupported assertion, clarification quality, provisional-term correctness, schema-valid output, downstream deterministic validation, cost and latency.

Prompt/model/retrieval changes that materially degrade agreed thresholds fail the gate.

## First product consumer: Slice 3.3

An authorized organization manager may describe products/services/capabilities in ordinary language and receive reviewable candidates.

```text
AMACS capability exists
        ≠
interpretation candidate suggested
        ≠
organization confirms capability assertion
        ≠
organization supplies evidence
        ≠
evidence/capability is independently verified
```

No website, capability statement, uploaded document, external classification or past response automatically creates a capability assertion. A possible evidence-to-capability relationship is also a reviewable suggestion.

## Reuse in Wave 4

The same gateway, retrieval, contracts, provenance, cost/privacy controls and evaluation harness later support issuer need interpretation. Buyer-side product scope remains Wave 4.

MarketNeed must separate observed condition, desired outcome, success measures, constraints, solution posture, known facts, assumptions and unresolved questions. The issuer confirms material structure before it becomes an RFx requirement.

## Manual and provisional paths

Every assisted workflow retains a complete manual route using controlled fields and AMACS browse/search. When no concept fits accurately, the participant may create a provisional-term proposal rather than force a false canonical mapping.

## Acceptance gate

The foundation is complete only when evidence shows:

1. the server-side provider-neutral gateway and secret isolation work;
2. AMACS 0.5.0 was reconciled and candidates come from its verified projection;
3. the four 0.5.0 semantic-entry schemas and applicable downstream schemas validate;
4. interpretation records/candidates remain separate and non-authoritative;
5. accepted candidates require a separate authorized domain write;
6. rejected/unresolved candidates cannot influence matching;
7. RFxchange provenance records provider/model/prompt/retrieval/release metadata;
8. privacy/minimization and logging rules are tested;
9. usage/cost metering and bounded limits exist;
10. manual operation works with AI unavailable, disabled or exhausted;
11. evaluation gates model/prompt/retrieval changes;
12. deterministic search/matching remains LLM-independent; and
13. no capability, RFx, verification, qualification, referral, credibility or outcome Feature ID is marked Done solely by the foundation.

## Explicit non-scope

The foundation does not implement Slice 3.3 profile enrichment, Wave 4 RFx records/publication, opportunity qualification, autonomous proposal writing/submission, evaluator scoring/selection, autonomous teaming/contracting, organization verification, credibility, generalized web research, fine-tuning/self-hosting, automatic taxonomy mutation or participant-authored content translation.

## Completion discipline

Recalculate after Slice 3.2, after AMACS reconciliation and after this foundation. Do not update tracker totals for these no-Feature-ID gates. Do not trade governance, authorization, privacy, historical meaning or manual fallback for provider convenience.
