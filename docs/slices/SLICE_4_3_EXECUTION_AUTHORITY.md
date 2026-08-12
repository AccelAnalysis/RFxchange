# Wave 4 Slice 4.3 — AMACS Requirements, Response Structure and Evaluation Definition

**Status: EXECUTION AUTHORITY — DOCUMENTATION ONLY.**

**Merged baseline:** `90ee6e08a18a67cc794ff1a84a047a8313ad50d6` (PR #163, Wave 4 Slice 4.2)

**Feature IDs:** `ISS-007`, `ISS-009`, `ISS-011`

## 1. Authority and completion boundary

This document authorizes one later runtime implementation of the governed RFx requirement, response-structure and evaluation-definition layer. It does not itself complete a Feature ID or change tracker arithmetic.

Slice 4.3 is complete only when an authorized issuer can reopen a real private Slice 4.2 RFx draft, select and persist AMACS-backed requirements, define a linked responder structure, define a linked evaluation method, recover safely from conflicts, and complete the entire workflow without AI.

The RFx lifecycle remains exactly `draft`. This slice defines future responder and evaluator inputs but does not publish, preview a public opportunity, discover, match, qualify, pursue, team, construct a response, submit, score, rank, select, award or create market activity.

## 2. Dependency result

| Dependency | Result |
| --- | --- |
| Wave 3 controlled AMACS, organization profile and discovery foundations | Satisfied and reused. |
| Persistent participant shell and Operational Workspace | Satisfied; must not regress. |
| Slice 4.1 aggregate, ownership, request family, version, command, event and audit seams | Satisfied and reused. |
| Slice 4.2 structured package, stable foundation requirements, geography and save/recovery | Satisfied by PR #163 at the merged baseline. |
| AMACS 0.5.0 catalog, requirement types, response templates/sections and decision templates/factors | Satisfied by the pinned generated runtime and immutable catalog ports. |
| AI/AMACS Interpretation Foundation | Satisfied and optionally consumed through purpose `request_structure`; the manual path remains complete. |
| Stabilization 2C | Isolated release engineering; not a product dependency. |

The reviewed dependency correction for `ISS-009` is now explicit: evaluation factors consume stable requirements from `ISS-006` and the AMACS requirements created by `ISS-007`. No later dependency edge changes. Slice 4.4 remains ineligible until this runtime merges and post-merge acceptance is green.

## 3. Required sources

The implementation must read and preserve the current versions of:

- `/AGENTS.md`;
- `docs/context/PRODUCT_PRINCIPLES.md`;
- `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md`;
- `docs/context/RFX_TRANSACTION_CYCLE.md`;
- `docs/context/MAP_AND_GEOGRAPHY.md`;
- `docs/rfx/RFX_CORE_AMACS_CONVERGENCE.md`;
- `docs/rfx/AMACS_0_5_RECONCILIATION.md`;
- `docs/rfx/AMACS_INTEGRATION_CONTRACT.md`;
- `docs/rfx/RFX_CORE_FEATURE_CROSSWALK.md`;
- `docs/rfx/RFX_CORE_PRODUCT_WORKSPACES.md`;
- `docs/rfx/RFX_CORE_ACCEPTANCE_MATRIX.md`;
- `docs/slices/AI_AMACS_INTERPRETATION_FOUNDATION.md`;
- `docs/slices/SLICE_4_1_EXECUTION_AUTHORITY.md`;
- `docs/slices/SLICE_4_2_EXECUTION_AUTHORITY.md`; and
- applicable brand/design, authorization, lifecycle, audit, Firestore, geography, internationalization, accessibility and recovery authorities.

Prototype mechanics are not production architecture.

## 4. Aggregate and definition ownership

Extend the existing canonical `RfxAggregate`; do not create parallel solicitation, questionnaire or evaluation products. The issuer organization owns the definition. User and membership identities remain actor evidence only.

The aggregate gains one versioned component equivalent to:

```ts
type RfxDefinition = Readonly<{
  schemaVersion: 1;
  requirements: readonly RfxRequirementDefinition[];
  responseStructure: ResponseStructure;
  evaluationDefinition: EvaluationDefinition;
  moduleStatus: Readonly<{
    requirements: RfxDefinitionModuleStatus;
    responseStructure: RfxDefinitionModuleStatus;
    evaluationDefinition: RfxDefinitionModuleStatus;
  }>;
}>;
```

The component is the mutable current-draft definition. A server-accepted save increments the RFx aggregate version exactly once and writes the aggregate, append-only `rfx-definition-saved` event, immutable command receipt and organization audit evidence atomically.

The implementation may save the complete definition or a separately versioned module payload, but one command cannot partly commit. Browser state, picker state, AI output and optimistic UI are never authoritative.

Slice 4.2 foundation requirements retain their stable identities. Slice 4.3 may link to or deliberately supersede one through an explicit normalized reference; it must not silently delete or reinterpret accepted foundation records.

## 5. AMACS requirement records

Every governed requirement uses stable RFx identity and immutable AMACS release provenance:

```ts
type RequirementLevel = "required" | "preferred" | "informational";
type DecisionTreatment =
  | "gate_only"
  | "scored_only"
  | "gate_and_scored_depth"
  | "informational_only";
type SatisfyingParty =
  | "lead-organization"
  | "any-accepted-team-member"
  | "combined-response-team";

type RfxRequirementDefinition = Readonly<{
  id: string;
  requirementType: AmacsRegistrySnapshot;
  capability: AmacsCapabilitySnapshot | null;
  title: string;
  description: string;
  level: RequirementLevel;
  decisionTreatment: DecisionTreatment;
  satisfyingParty: SatisfyingParty;
  qualifiers: readonly RequirementQualifier[];
  evidenceRequirementIds: readonly string[];
  linkedFoundationRequirementIds: readonly string[];
  linkedResponseSectionIds: readonly string[];
  linkedEvaluationFactorIds: readonly string[];
}>;
```

- `AmacsRegistrySnapshot` includes the pinned release, canonical ID, reviewed label and the minimum semantics needed to reproduce the decision.
- A capability is required only for the AMACS capability requirement type; other governed types use structured qualifiers and descriptions appropriate to credential, experience, geography, capacity, delivery condition, evidence, technical specification, commercial or site/location semantics.
- Each canonical capability ID and requirement-type ID is resolved server-side through the pinned catalog. Participant-provided labels and snapshots are discarded in favor of catalog facts.
- The selected decision treatment must be allowed by the current requirement-type record.
- `satisfyingParty` may be anything other than `lead-organization` only when AMACS says team coverage is allowed. Credential, evidence and other lead-only rules cannot be relaxed by the client.
- Required, preferred and informational remain distinct. A preferred requirement cannot act as an unstated gate.
- A provisional term may be retained as a visibly provisional proposal but cannot satisfy a mandatory canonical capability requirement, matching rule or readiness check.

Qualifiers are bounded typed records for the applicable requirement dimension. They include, where applicable, credential/evidence type, quantity and governed unit, duration/experience, controlled geography, capacity, date, yes/no condition and bounded text. Free text can explain a structured qualifier but cannot replace required canonical structure.

## 6. AMACS browse, search and selection

The participant flow reuses the release-aware catalog application ports and shared accessible picker patterns:

- browse Domain → Family → Capability;
- search labels, aliases, definitions, hierarchy and approved guidance;
- show human labels, definitions and breadcrumbs rather than raw IDs;
- support multiple selection without duplicating an existing requirement;
- retain a complete deterministic manual path;
- offer `None of these describe it` only through the governed provisional-term seam; and
- preserve the selected release/snapshot for historical interpretation.

The browser must not import AMACS source JSON. Search results are deterministic catalog facts, not model confidence or proof of capability.

## 7. Response structure

The issuer selects a governed AMACS response template or the approved custom starting structure. The persisted structure is an ordered snapshot:

```ts
type ResponseSectionFormat =
  | "narrative"
  | "structured-answer"
  | "attachment"
  | "pricing"
  | "acknowledgment";

type ResponseSectionDefinition = Readonly<{
  id: string;
  sourceSection: AmacsRegistrySnapshot | null;
  title: string;
  instructions: string;
  format: ResponseSectionFormat;
  required: boolean;
  order: number;
  characterLimit: number | null;
  itemLimit: number | null;
  attachmentsAllowed: boolean;
  linkedRequirementIds: readonly string[];
}>;

type ResponseStructure = Readonly<{
  sourceTemplate: AmacsRegistrySnapshot | null;
  sections: readonly ResponseSectionDefinition[];
}>;
```

- Template and canonical-section identifiers validate through the pinned AMACS catalog before their reviewed snapshots are accepted.
- Template application produces stable RFx-local section IDs so issuer edits do not mutate AMACS.
- Sections remain ordered, uniquely identified and bounded. Required/optional, format, limits and attachments are explicit.
- Every mandatory requirement must link to at least one response section or have an explicit structured-evidence-only treatment.
- Add, edit, remove and reorder use continuous rows and the shared responsive sheet; no browser prompt/confirm or participant-facing `local section`, `schema` or raw ID language.
- Reusable organization templates, changes to AMACS and actual responder content remain outside this slice.

## 8. Evaluation definition

Slice 4.3 defines how future responses are evaluated; it does not perform evaluation.

```ts
type EvaluationFactorTreatment =
  | "required-condition"
  | "scored-factor"
  | "required-and-scored"
  | "informational-only";

type EvaluationFactor = Readonly<{
  id: string;
  sourceFactor: AmacsRegistrySnapshot | null;
  title: string;
  description: string;
  treatment: EvaluationFactorTreatment;
  weightBasisPoints: number | null;
  order: number;
  linkedRequirementIds: readonly string[];
  linkedResponseSectionIds: readonly string[];
  linkedEvidenceRequirementIds: readonly string[];
}>;

type EvaluationDefinition = Readonly<{
  sourceTemplate: AmacsRegistrySnapshot | null;
  weightingRequired: boolean;
  factors: readonly EvaluationFactor[];
}>;
```

- Decision-template and factor IDs validate against the pinned catalog; applying a template creates stable RFx-local factor IDs and snapshots.
- A factor treatment must remain consistent with the AMACS factor method and linked requirement decision treatment.
- Required conditions have no comparative weight. Informational factors cannot silently become gates or scores.
- When weighting is required, scored and required-and-scored factors use safe integer basis points and total exactly `10_000`. When weighting is not required, the UI does not fabricate a 100% rule.
- Mandatory requirements and required evidence link to an appropriate required condition or an explicit server-validated alternative.
- Scoring scales, evaluator assignments, individual scores, consensus, ranking, recommendation, selection and award are excluded.

## 9. Cross-link integrity and module status

Requirement, evidence, response-section and evaluation-factor links are bidirectionally consistent after server normalization. All referenced local IDs must exist in the same accepted RFx definition or the current Slice 4.2 package. Duplicate IDs, dangling links, invalid self-links and semantically incompatible links fail the entire command.

Module status is server-derived as `not-started`, `in-progress` or `complete`. It reports definition completeness only; it does not mean publication-ready, qualified, evaluable or legally sufficient. Slice 4.4 owns deep-linked publication readiness and must re-evaluate every relevant package/definition fact.

## 10. Save, versioning and recovery

Use the existing expected-version, retry-stable command and organization-operation boundary:

- include stable command ID, deterministic intent fingerprint and expected aggregate version;
- show immediate pending state without an artificial animation hold;
- exact replay returns the previously committed aggregate/receipt;
- a command ID reused for altered intent conflicts;
- stale expected version returns bounded recovery guidance and writes nothing;
- interrupted success reuses the command and cannot duplicate evidence;
- concurrent module saves cannot silently overwrite one another;
- reload/re-entry shows committed server state only; and
- optional local/session storage may retain retry identity but cannot grant access or become definition truth.

Changing a capability, requirement type, response template or decision template is an explicit accepted draft mutation. No background catalog or AI update silently rewrites an RFx.

## 11. Authorization, privacy and client access

Every read and mutation re-resolves authenticated RFxchange user, provider/account state, exact active organization membership, restrictions, `rfx.create`, issuer organization and RFx ownership. No new permission is introduced. `rfx.publish` is not consumed.

Wrong-user, wrong-organization, inactive membership, restricted organization/membership, disabled/unverified/revoked account, missing permission, guessed RFx ID and cross-tenant cases fail closed before existence or definition content is disclosed. Authorization is rechecked when a long-lived workspace saves.

Reuse `rfxAggregates`, `rfxEvents`, `rfxCommands` and `organizationAuditEvents`. Direct browser Firestore access remains default-denied. Requirements, response/evaluation definitions and interpretation records remain private. No search index, opportunity projection, map beacon or public/share record is created.

## 12. Optional AI interpretation

AI assistance may use the existing provider-neutral interpretation gateway with purpose `request_structure` and the RFx ID as `subjectRef`. It may propose capability directions, requirement types/qualifiers and clarification questions from issuer-authorized, minimized confirmed need context.

- Every returned AMACS ID must validate against the retrieval set and pinned runtime projection before display or persistence.
- Interpretation records/candidates remain separate, private and non-authoritative with human confirmation required.
- Accept/edit/reject/unresolved/none-of-these disposition never changes the RFx definition by itself.
- Accepted or edited suggestions become authoritative only through a separate expected-version definition-save command after issuer review.
- Rejected, unresolved and unconfirmed suggestions cannot affect definition status, later readiness, matching or market observations.
- Disabled, missing secret, timeout, unavailable, rate limit/quota, malformed output and invalid-ID paths leave manual catalog and structure editing fully usable.
- Provider/model/prompt/retrieval/usage provenance stays outside the RFx domain record.

No AI output may create a legal/procurement requirement, loosen team coverage, select a decision treatment, publish, score, rank, select or award without the separately authorized human/domain action.

## 13. Operational Workspace and copy

- Reuse the persistent participant shell and `/opportunities` Operational Workspace.
- Add task modules titled `Required capabilities`, `Response structure` and `Evaluation method` to the existing draft workflow; do not create a nested application shell or generic document editor.
- Use continuous accessible rows/tables. Compact layouts become semantic disclosure lists without losing relationships.
- The capability picker and add/edit sheets return focus to their invoker, trap focus only while modal, and expose validation through labels/descriptions.
- Keep raw IDs, registry names, basis-point storage, provider names and Firestore vocabulary out of primary participant copy.
- Distinguish required/preferred/informational, gate/scored, suggestion/confirmed and definition-ready/publication-ready truthfully.
- Preserve safe originating map context only as non-authorizing return context; private drafts never appear spatially.
- Loading and optional-AI failure remain scoped below the persistent shell.

All changed participant copy exists in English, Spanish, French, Italian and German. Acceptance covers desktop, intermediate and 390px mobile, long translated labels, keyboard-only use, screen-reader semantics, focus restoration, visible focus, error association, target sizing, reduced motion and no horizontal overflow.

## 14. Required acceptance

### Domain/application

- pinned AMACS capability, requirement-type, response template/section and decision template/factor IDs validate server-side;
- invalid, inactive, participant-relabeled and model-invented IDs fail;
- historical release/snapshot provenance is immutable and reproducible;
- all requirement levels, treatments and qualifier variants enforce invariants;
- team coverage cannot exceed requirement-type authority;
- provisional terms cannot satisfy mandatory canonical requirements;
- template expansion creates stable unique local IDs without mutating AMACS;
- required links and all bidirectional links are deterministic and dangling/incompatible links fail atomically;
- weighted totals require exactly 10,000 basis points only when applicable;
- no scoring/evaluator/selection/award state exists;
- exact replay, altered fingerprint, stale/concurrent write and interrupted-success recovery;
- every negative authorization/account/membership/restriction/tenant case; and
- AI disabled/unavailable/timeout/quota/malformed/invalid-ID/reject/edit/manual fallback with no unconfirmed authoritative effect.

### Firestore emulator

- one atomic aggregate/event/receipt/audit write per accepted definition command;
- stale, collision and validation failures leave no partial evidence;
- direct-client read/write denied for RFx and interpretation private records;
- cross-organization guessed IDs disclose nothing;
- exact replay creates one version and one evidence set; and
- cleanup/global run-ID residual scan returns zero.

### Configured browser

- an authorized issuer reopens the accepted Slice 4.2 draft;
- manually browses/searches AMACS and adds canonical capability plus credential, experience, geography, capacity and evidence requirements;
- sees labels/definitions/breadcrumbs rather than raw IDs;
- cannot choose prohibited team coverage or incompatible decision treatment;
- selects and expands a governed response template, adds/edits/reorders a section and links requirements;
- selects and expands a governed decision template, edits factors/links and resolves weighted-total validation;
- saves, reloads and re-enters the same committed definition;
- receives immediate save feedback, deterministic stale conflict and non-destructive recovery;
- completes the same path with AI unavailable;
- experiences five locales, keyboard/modal focus behavior, reduced motion and desktop/intermediate/390px layouts without overflow;
- missing/revoked permission after load fails closed without definition disclosure; and
- console, page errors and unhandled rejections remain clean.

Run the canonical `npm run check`, focused RFx/AMACS tests, emulator acceptance, `git diff --check`, exact-head CI and post-merge CI. Record representative save timings as controlled evidence, not a production-network promise.

## 15. Feature evidence

- `ISS-007` is accepted only with the complete governed picker and confirmed capability/credential/experience/geography/capacity/evidence requirement behavior.
- `ISS-011` is accepted only with standardized and issuer-expandable ordered response structure linked to requirements.
- `ISS-009` is accepted only with standardized and issuer-expandable evaluation definition, valid treatment/weight rules and explicit requirement/evidence/response links.

No item becomes Done because this authority exists, because a type is unused, or because a fixture resembles the workflow.

## 16. Explicit exclusions

Slice 4.3 does not implement:

- publication readiness, responder/public preview, publication, sharing or lifecycle beyond `draft`;
- opportunity projections, beacons, search indexes, discovery, saved searches, alerts or deadlines;
- deterministic responder fit, qualification, Go/No-Go, pursuit or gaps;
- teams, invitations, response construction, pricing response, attachments, submission or receipts;
- evaluator identity, assignments, conflicts, scoring, consensus, ranking, recommendation, selection, award or outcome;
- full addenda/Q&A/amendment behavior;
- commercial enrollment/entitlements, B6b, B6c, Dark Appearance, Presentation Mode, sound or haptics;
- Firebase App Hosting or Stabilization 2C changes; or
- fabricated RFxs, organizations, capabilities, market activity or map objects.

## 17. Stop and next-slice boundary

Stop the runtime after accepted private draft requirements, response structure and evaluation definition. Do not implement Slice 4.4 on the Slice 4.3 runtime branch.

After the runtime merges and exact post-merge acceptance is green, recalculate from merged `main`. The next eligible action is a documentation-only Slice 4.4 authority for `ISS-016`, `ISS-018`, `ISS-019`, `ISS-020` and `ACQ-009`. Slice 4.4 is the first authority that may create a real permitted opportunity projection. B6c remains ineligible until authoritative publication exists and is not automatically complete afterward.

The tracker remains **438 total · 157 Done · 281 Not Started**, Wave 4 RFx Core remains **5/41**, B6b remains intentionally pending, and Stabilization 2C remains incomplete and isolated.
