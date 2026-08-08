# Cross-cutting AI/AMACS Interpretation Foundation

**Status: CANONICAL PLANNING FOUNDATION — IMPLEMENT AFTER SLICE 3.2 AND THE AMACS 0.5.0 RECONCILIATION MERGE, AND BEFORE SLICE 3.3. NO FEATURE-ID COMPLETION CLAIMS.**

## Purpose

Establish one governed interpretation layer between ordinary participant language and AMACS-backed RFxchange structures.

The foundation exists because neither issuers nor responders should be required to understand AMACS terminology before they can use The RFxchange effectively.

The operating principle is:

> **AI interprets and assists. AMACS defines and constrains. The participant confirms. RFxchange stores and operates the authoritative market record.**

AMACS 0.5.0 supplies the provider-neutral semantic contracts. RFxchange supplies the server-side AI implementation, authorization, provenance, privacy, cost control and later authoritative commands.

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
- existing evidence, request, response, decision, readiness, role and outcome contracts used by later authorized consumers.

### Authority boundary

An AMACS interpretation record has `humanConfirmationRequired: true` and `authoritativeEffect: "none"`.

An interpretation candidate remains non-authoritative even when its disposition becomes accepted. A separate server-authorized RFxchange command must create or change the market need, organization capability assertion, RFx requirement or another domain record.

Rejected, unresolved, withdrawn or merely suggested candidates cannot influence authoritative matching, qualification, verification, credibility, publication or outcome reporting.

## No-Feature-ID product boundary

This foundation builds reusable server-side and application-layer capabilities. It does not build the participant-facing Slice 3.3 capability-enrichment screen or the Wave 4 issuer MarketNeed workflow.

The shared contracts must support later consumers that allow participants to:

- begin in ordinary language;
- browse AMACS manually;
- accept, edit, reject or leave suggestions unresolved;
- select none-of-these;
- answer focused clarification questions; and
- continue manually.

Those participant controls and their configured-browser acceptance belong to the authorized consumer slice.

Examples used by the foundation's evaluation harness may include:

- seller or responder: “We install and maintain commercial HVAC systems, troubleshoot controls, and replace rooftop units.”
- buyer or issuer: “Our parking lot floods during heavy rain and we need safe access before hurricane season.”

The service may interpret language, identify ambiguity, retrieve candidate AMACS concepts and propose structure. It must not invent identifiers, silently create claims or requirements, make legal determinations, publish, submit, select, award or rewrite AMACS.

## Architecture

```text
later authorized participant consumer or controlled test harness
                         ↓
             authenticated RFxchange API
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
  later consumer records disposition through authorized API
                         ↓
   later consumer invokes separate authorized domain command
```

Provider-specific request or response types cannot leak into organization, capability, RFx, requirement, evidence, matching, referral, credibility or outcome domain models.

## Required components

### 1. Server-side AI gateway

Create one authenticated server-side gateway that owns:

- current user, session and organization authority;
- tenant and feature policy;
- provider and model routing;
- secrets;
- request and token limits and abuse controls;
- retries, timeouts and bounded failure handling;
- structured-output validation;
- usage and cost metering;
- prompt and retrieval versioning;
- privacy and minimization rules; and
- content-safe observability.

The participant browser never contains provider secrets or calls the provider as RFxchange authority.

### 2. Provider abstraction and concrete adapter

Use a provider-neutral application interface. Implement one concrete provider adapter selected by current repository authority; absent a conflicting decision, use OpenAI behind the neutral interface with a configurable model. Prefer the least-expensive model that meets the evaluated quality threshold and allow bounded escalation for ambiguity or complexity.

Provider and model choice remain RFxchange operational metadata. Provider-specific types must not enter domain contracts. Missing credentials produce a truthful disabled state and deterministic-test fallback rather than fake success.

### 3. AMACS release-aware retrieval

Retrieve from the verified 0.5.0 runtime projection rather than model memory. Candidate retrieval considers stable ID, label, definition, aliases, domain and family hierarchy, relationships, optional interpretation guidance, properties, market roles and release provenance.

Lexical retrieval is required. Vector or semantic retrieval may supplement it where justified. Retrieval scores are not proof. Do not send the entire release when a bounded candidate set is sufficient.

### 4. Strict contracts and validation

Persist AMACS-conforming InterpretationRecord and InterpretationCandidate objects separately from authoritative domain records.

RFxchange-owned provenance stores provider and model, prompt template, retrieval or index version, token usage, cost, latency, provider request ID and retention-relevant metadata. That provenance is referenced opaquely from the AMACS interpretation record.

Validate every returned canonical ID, relationship and controlled value against the pinned release before persistence or later presentation. Invalid or model-invented IDs are rejected and logged safely.

### 5. Disposition and authoritative-command boundary

Provide server-side contracts and tests for suggested, accepted, edited, rejected, unresolved, withdrawn and none-of-these outcomes.

Recording a disposition does not bypass server authority or write a domain record. The later consumer's separate domain command revalidates current user, organization, AMACS release, catalog record and workflow-specific rules.

This foundation may define and test the boundary, but it does not create the Slice 3.3 organization capability command or Wave 4 MarketNeed or RFx requirement command.

### 6. Privacy and minimum necessary data

Define prohibited and sensitive fields, attachment opt-in, extraction boundaries, field-level redaction, RFxchange and provider retention expectations, minimized logs, authorization before source inclusion, tenant controls and outage or disable behavior.

Participant-authored text remains participant-authored and remains outside the existing automatic-translation scope.

### 7. Usage and cost controls

Capture organization and user, purpose, provider and model, input and output usage, estimated or actual cost, latency, outcome or failure class and cache or retrieval use where material.

Enforce configurable request, user, organization and tenant limits. Expose a release-aware manual catalog application path and truthful provider-disabled state for later consumers. Quota exhaustion must not make the future manual AMACS route impossible.

Deterministic search or matching of already-structured records does not call an LLM.

### 8. Evaluation and regression harness

Create reviewed seller- and buyer-side cases. Track identifier validity, precision, recall, overclassification, unsupported assertion, clarification quality, provisional-term recommendation correctness, schema-valid output, downstream deterministic validation, cost and latency.

Prompt, model or retrieval changes that materially degrade agreed thresholds fail the gate. Automated tests use deterministic fakes or stubs; a live smoke runs only when explicitly configured.

## First participant consumer: Slice 3.3

An authorized organization manager may later describe products, services and capabilities in ordinary language and receive reviewable candidates.

```text
AMACS capability exists
        ≠
interpretation candidate suggested
        ≠
organization confirms capability assertion
        ≠
organization supplies evidence
        ≠
evidence or capability is independently verified
```

No website, capability statement, uploaded document, external classification or past response automatically creates a capability assertion. A possible evidence-to-capability relationship is also a reviewable suggestion.

Slice 3.3 owns the participant UI, manual picker, authoritative organization capability command and configured-browser acceptance.

## Reuse in Wave 4

The same gateway, retrieval, contracts, provenance, cost and privacy controls and evaluation harness later support issuer need interpretation. Buyer-side product scope remains Wave 4.

MarketNeed must separate observed condition, desired outcome, success measures, constraints, solution posture, known facts, assumptions and unresolved questions. The issuer confirms material structure before a separate command creates authoritative need or RFx requirement state.

Wave 4 owns MarketNeed and RFx requirement participant UI, team-coverage enforcement and configured-browser acceptance.

## Manual and provisional paths

The foundation exposes the catalog and proposal application seams needed by later manual consumers. It does not implement the participant picker or none-of-these screen.

Every later assisted workflow must retain a complete manual route using controlled fields and AMACS browse or search. When no concept fits accurately, the participant may create a provisional-term proposal rather than force a false canonical mapping.

## Acceptance gate

The foundation is complete only when evidence shows:

1. the server-side provider-neutral gateway and secret isolation work;
2. one concrete provider adapter exists behind the neutral interface with truthful missing-secret behavior;
3. AMACS 0.5.0 was reconciled and candidates come from its verified projection;
4. the four 0.5.0 semantic-entry schemas and applicable shared schemas validate;
5. interpretation records and candidates remain separate and non-authoritative;
6. disposition recording cannot directly create an organization capability assertion or RFx requirement;
7. rejected and unresolved candidates cannot influence matching;
8. RFxchange provenance records provider, model, prompt, retrieval, release and usage metadata;
9. privacy, minimization and logging rules are tested;
10. usage and cost metering and bounded limits exist;
11. the release-aware manual catalog application service and provider-disabled state work without claiming a participant UI;
12. evaluation gates model, prompt and retrieval changes;
13. deterministic search and matching remain LLM-independent; and
14. no capability, RFx, verification, qualification, referral, credibility or outcome Feature ID is marked Done solely by the foundation.

## Explicit non-scope

The foundation does not implement Slice 3.3 profile enrichment or picker, organization capability assertions, Wave 4 MarketNeed or RFx records and publication, RFx requirement team-coverage workflow, opportunity qualification, autonomous proposal writing or submission, evaluator scoring or selection, autonomous teaming or contracting, organization verification, credibility, generalized web research, fine-tuning or self-hosting, automatic taxonomy mutation or participant-authored content translation.

## Completion discipline

Recalculate after Slice 3.2, after AMACS reconciliation and after this foundation. Do not update tracker totals for these no-Feature-ID gates. Do not trade governance, authorization, privacy, historical meaning or future manual fallback for provider convenience.
