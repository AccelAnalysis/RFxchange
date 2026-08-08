# Cross-cutting AI/AMACS Interpretation Foundation

**Status: CANONICAL PLANNING FOUNDATION — IMPLEMENT AFTER SLICE 3.2 MERGES AND BEFORE SLICE 3.3. NO FEATURE-ID COMPLETION CLAIMS.**

## Purpose

Establish one governed interpretation layer between ordinary participant language and AMACS-backed RFxchange structures.

The foundation exists because neither issuers nor responders should be required to understand AMACS terminology before they can use The RFxchange effectively.

The operating principle is:

> **AI interprets and assists. AMACS defines and constrains. The participant confirms. RFxchange stores and operates the authoritative market record.**

This foundation is cross-cutting. Its first product consumer is Slice 3.3 seller/responder capability enrichment. Wave 4 reuses the same foundation for issuer/buyer need interpretation and AMACS-backed RFx drafting.

## Sequencing authority

This foundation is inserted into the Wave 3 execution sequence as a no-Feature-ID gate:

```text
Slice 3.2 — Controlled Network Entry & Discovery
→ recalculate from merged main
→ AI/AMACS Interpretation Foundation
→ validate and merge
→ recalculate
→ Slice 3.3 — Market Profile Enrichment
```

Planning this foundation does not interrupt or widen active Slice 3.2. Production implementation must not begin until Slice 3.2 is merged and the next-step authority is recalculated.

Completion of this foundation does not mark any tracker Feature ID Done. Product-facing behavior introduced by later slices remains accountable to those slices' Feature IDs and acceptance checks.

## Product boundary

### The participant may begin in ordinary language

Examples:

- seller/responder: "We install and maintain commercial HVAC systems, troubleshoot controls, and replace rooftop units."
- buyer/issuer: "Our parking lot floods during heavy rain and we need safe access before hurricane season."

The system may use AI to interpret that language, identify ambiguity, retrieve candidate AMACS concepts, and propose a structured representation.

### The AI is never semantic authority

The model must not:

- invent AMACS identifiers;
- assert that an organization possesses a capability merely because language suggests it;
- silently add RFx requirements;
- decide that a credential, license, certification or legal condition is required without authoritative support;
- convert a candidate match into qualification, verification, endorsement or award likelihood;
- publish an RFx, submit a response, make a selection or create a binding relationship;
- rewrite AMACS automatically from usage patterns;
- make the manual workflow unavailable when the AI provider is unavailable or disabled.

### AMACS remains authoritative

The interpretation service may return only concepts and relationships that validate against the pinned/active AMACS release projection consumed by RFxchange.

If no adequate canonical concept exists, the service must permit a provisional-term path rather than forcing an inaccurate mapping.

## Architecture

```text
Participant-authored language or approved source material
                         ↓
                 RFxchange UI/API
                         ↓
                AI Gateway service
                         ↓
          context minimization/redaction
                         ↓
            AMACS retrieval / candidate set
                         ↓
          provider-agnostic model adapter
                         ↓
             strict structured output
                         ↓
              schema/catalog validation
                         ↓
        reviewable interpretation proposal
                         ↓
         accept / edit / reject / add
                         ↓
       authoritative RFxchange domain record
```

The AI provider is an implementation dependency behind an RFxchange application boundary. Provider-specific request/response types must not leak into organization, RFx, capability, requirement, evidence, matching or outcome domain models.

## Required foundation components

### 1. Server-side AI gateway

Create one authenticated server-side gateway for model-assisted operations.

The gateway must own:

- user/session and organization-authority checks;
- tenant and feature-policy checks;
- provider/model routing;
- request-size and token limits;
- rate limits and abuse controls;
- retries and bounded failure handling;
- usage/cost measurement;
- prompt-template versioning;
- privacy/minimization policy;
- structured-output validation;
- observability without exposing private participant content unnecessarily.

Browser/client code must never contain provider API secrets or call the model provider as an authoritative RFxchange backend.

### 2. Provider abstraction and model router

Define a provider-neutral interface so RFxchange can change models/providers without rewriting domain behavior.

Routing policy should prefer the least-expensive model that meets the evaluated quality threshold and permit bounded escalation for ambiguous or higher-complexity cases.

A provider/model choice is operational metadata, not part of AMACS semantics.

### 3. AMACS release-aware retrieval

The foundation must query a reduced, immutable AMACS runtime projection rather than relying on model memory.

Candidate retrieval should consider at least:

- stable AMACS identifier;
- canonical name;
- definition;
- aliases/synonyms;
- domain and family hierarchy;
- relevant relationships;
- applicable entity/market-role constraints where present;
- release/version provenance.

Retrieval may combine lexical and semantic/vector search, but retrieval scores are not proof of capability or fit.

Do not send an entire AMACS release on every model call when a bounded candidate set is sufficient.

### 4. Strict interpretation contracts

Model outputs must conform to versioned RFxchange schemas rather than free-form prose.

A candidate interpretation record should support, as applicable:

- interpretation mode (`organization_capability`, `market_need`, later approved modes);
- source references or bounded source excerpts;
- candidate AMACS identifiers;
- candidate relationship/type;
- rationale/explanation;
- confidence or uncertainty signal;
- unresolved questions;
- warnings/constraints;
- prompt-template version;
- model/provider identifier;
- AMACS release identifier/checksum;
- creation time;
- user disposition (`accepted`, `edited`, `rejected`, `unresolved`);
- link to the resulting authoritative record only after confirmation.

The application must validate every returned AMACS identifier and relationship against the active release projection before presenting it as an AMACS suggestion.

### 5. Human confirmation and provenance

AI output is always a proposal until an authorized participant accepts or edits it.

The product must provide explicit controls to:

- accept;
- edit;
- reject;
- add a missing concept;
- indicate that none of the suggestions fit;
- request/answer a focused clarification;
- continue manually without AI.

Rejected or unconfirmed AI suggestions are not authoritative market demand, capability assertions, evidence, qualifications or outcomes.

The audit/provenance record must preserve enough metadata to explain which model/prompt/AMACS release produced a suggestion and how the participant disposed of it, while minimizing retained private content.

### 6. Privacy and data minimization

Only send the minimum content required for the requested interpretation.

The foundation must define:

- prohibited/sensitive fields that are never sent unless a later approved workflow explicitly requires them;
- attachment/document opt-in and extraction boundaries;
- field-level redaction/minimization rules;
- retention expectations for RFxchange and the configured AI provider;
- logs that preserve operational evidence without copying full private prompts/responses by default;
- authorization checks before any organization/RFx source material is included;
- tenant/user controls for AI-assisted features;
- safe handling of provider outages or disabled AI.

Participant-authored content remains participant-authored content. AI interpretation does not convert it into RFxchange-controlled marketing/interface text for localization purposes.

### 7. Usage and cost controls

Meter AI usage from the first implementation.

At minimum capture:

- organization and user scope;
- interpretation mode;
- provider/model;
- input/output token or provider-equivalent usage;
- estimated/actual provider cost where available;
- request outcome and failure class;
- cache/retrieval use where material.

Add configurable per-request, per-user and per-organization limits. The product must fail into the manual AMACS browse/search workflow rather than blocking core participation because an AI quota is exhausted.

Deterministic AMACS matching, filtering and eligibility rules must not invoke an LLM merely to compare already-structured records.

### 8. Evaluation and regression harness

Create an RFxchange-owned interpretation benchmark before the first participant-facing AI interpretation flow is considered complete.

Benchmark cases should contain ordinary-language inputs and reviewed expected AMACS/structure outcomes for both straightforward and ambiguous examples.

Track at least:

- AMACS identifier validity;
- precision of proposed concepts;
- recall of material concepts;
- over-classification rate;
- unsupported-assertion rate;
- clarification quality;
- provisional-term correctness;
- schema-valid-output rate;
- deterministic behavior of downstream validation;
- cost/latency by evaluated model.

Prompt or model changes that materially degrade the agreed benchmark must fail the interpretation acceptance gate.

## First consumer: Slice 3.3 seller/responder capability interpretation

Slice 3.3 should permit an authorized organization manager to begin with ordinary-language descriptions of products/services/capabilities and receive reviewable AMACS capability candidates.

The flow must preserve these distinctions:

```text
AMACS capability exists
        ≠
organization declares capability
        ≠
organization supplies supporting evidence
        ≠
capability/evidence is independently verified
```

Seller-side AI may assist with:

- extracting candidate activities/capabilities from organization-authored descriptions;
- retrieving relevant AMACS candidates;
- asking focused clarification questions;
- suggesting specialties or qualifiers for structured review;
- connecting later entered past-performance evidence to already-confirmed capability assertions for review.

It must not automatically add capabilities to an organization profile or infer verification.

## Reuse in Wave 4 buyer/issuer interpretation

Wave 4 should reuse this same gateway, retrieval, schema, provenance, metering, privacy and evaluation architecture for buyer/issuer need interpretation.

The buyer-side mode should help distinguish:

- observed condition/problem;
- desired outcome;
- known constraints;
- solution openness;
- known location/value/term/timing;
- unresolved questions;
- candidate request family;
- candidate AMACS capabilities/requirements.

The issuer must confirm material interpretations before they become authoritative RFx requirements.

The foundation does not itself implement Wave 4 RFx records, publication or opportunity objects.

## Manual fallback

Every participant-facing AI-assisted workflow must retain a fully functional non-AI route using controlled forms, AMACS hierarchy/search, contextual help and validation.

AI provider failure, rate limiting, disabled tenant policy or budget limits must degrade gracefully to manual operation.

## Acceptance gate for foundation implementation

Before this cross-cutting foundation is considered complete, evidence must show:

1. one server-side provider-neutral AI gateway exists with secret isolation and authorization boundaries;
2. AMACS candidates are retrieved from a pinned/validated runtime projection rather than model memory alone;
3. returned AMACS IDs/relationships are schema/catalog validated;
4. AI proposals remain non-authoritative until explicit participant confirmation;
5. provider/model/prompt/AMACS-release provenance is captured;
6. usage and cost metering is present with bounded limits;
7. private-content minimization and logging rules are enforced and tested;
8. a manual non-AI fallback works when the provider is unavailable/disabled;
9. an interpretation benchmark/evaluation harness gates model/prompt changes;
10. deterministic matching/search remains independent of LLM calls;
11. no capability, requirement, verification, qualification, RFx, response, award or outcome Feature ID is marked Done solely by this foundation.

## Explicit non-scope

This foundation does not implement:

- Slice 3.3 organization capability enrichment itself;
- Wave 4 RFx need/requirement records;
- RFx publication;
- opportunity matching or qualification;
- autonomous proposal writing/submission;
- evaluator scoring or selection;
- autonomous teaming/contracting;
- organization verification;
- automatic legal/compliance determinations;
- generalized web research;
- fine-tuning or self-hosted foundation models;
- automatic AMACS taxonomy mutation;
- participant-authored content translation.

## Handoff to Slice 3.3

After this foundation merges and dependencies are recalculated, Slice 3.3 may consume:

- the server-side AI gateway;
- AMACS retrieval interfaces;
- structured interpretation schemas;
- suggestion/provenance records;
- usage/cost controls;
- evaluation harness;
- manual fallback contract.

Slice 3.3 remains responsible for the actual organization-owned capability declaration UX, persistence, privacy and public projection required by its Feature IDs.

## Completion discipline

- Recalculate from merged `main` after Slice 3.2 before authorizing implementation of this foundation.
- Recalculate again after the foundation merges before authorizing Slice 3.3.
- Do not change master-tracker totals merely because this no-Feature-ID foundation exists or is completed.
- Do not allow provider convenience to weaken AMACS governance, human confirmation, authorization, privacy or historical provenance.
