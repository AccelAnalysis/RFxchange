# AMACS integration contract for The RFxchange

**Status: CANONICAL INTEGRATION AUTHORITY — IMPLEMENTATION REQUIRES THE AUTHORIZED RECONCILIATION GATE OR SLICE.**

AMACS release baseline:

- version: `0.5.0`;
- repository: `AccelAnalysis/amacs`;
- merged source commit: `da7879f2609271b067ae6d02875e9388a02c4fe5`;
- release date: `2026-08-08`;
- expected catalog shape: 16 domains, 120 families, 615 matchable capabilities and 185 English aliases;
- additional governed registries: 18 market roles, 35 properties, 27 units, 17 credential/evidence types, 10 requirement types, 8 requirement bundles, 10 request families, 7 governance profiles, 30 readiness rules, 29 response sections, 7 response templates, 22 decision factors, 7 decision templates and 12 outcome types;
- interpretation contracts: `market-need.schema.json`, `interpretation-record.schema.json`, `interpretation-candidate.schema.json`, and `concept-interpretation-guidance.schema.json`.

Counts are release-acceptance evidence, not application constants. The AMACS manifest, source commit and SHA-256 checksums remain authoritative.

## 1. Governing boundary

RFxchange consumes AMACS through application ports and generated runtime contracts. AMACS remains an independently versioned standard and source repository.

The governing interpretation rule is:

> **AI or other assistance interprets and proposes. AMACS defines and constrains. The participant confirms. RFxchange stores and operates the authoritative market record.**

An AMACS concept is not an organization capability claim. An interpretation record or candidate is not an organization capability assertion, RFx requirement, verification, qualification, selection, outcome or taxonomy change.

```ts
export interface AmacsCatalogPort {
  getRelease(): Promise<AmacsReleaseMetadata>;
  searchCapabilities(query: AmacsCapabilitySearch): Promise<AmacsCapabilitySearchPage>;
  listDomains(): Promise<AmacsDomain[]>;
  listFamilies(domainId: string): Promise<AmacsFamily[]>;
  listCapabilities(familyId: string): Promise<AmacsCapability[]>;
  getCapability(capabilityId: string): Promise<AmacsCapability | null>;
  listMarketRoles(): Promise<AmacsMarketRole[]>;
  getRequestFamily(requestFamilyId: string): Promise<AmacsRequestFamily | null>;
  getRequirementType(requirementTypeId: string): Promise<AmacsRequirementType | null>;
  getResponseTemplate(responseTemplateId: string): Promise<AmacsResponseTemplate | null>;
  getDecisionTemplate(decisionTemplateId: string): Promise<AmacsDecisionTemplate | null>;
  getReadinessRules(requestFamilyId: string): Promise<AmacsReadinessRule[]>;
  getConceptInterpretationGuidance(capabilityId: string): Promise<AmacsConceptGuidance | null>;
}
```

Domain/application code depends on the port and generated validators, not AMACS file paths, GitHub APIs, model-provider response types or participant UI components.

## 2. Release ingestion and reconciliation

A build/release ingestion command must:

1. read the pinned AMACS 0.5.0 release manifest;
2. verify the source commit and every SHA-256 checksum;
3. reject mutable or replaced content under the same version;
4. validate all canonical registries, runtime schemas and referential integrity;
5. reconcile the documented release counts without turning counts into runtime constants;
6. generate the reduced RFxchange catalog projection and deterministic search indexes;
7. generate or verify TypeScript types and server-side validators for AMACS runtime contracts;
8. include the 0.5.0 market-need and interpretation contracts;
9. write an RFxchange ingestion manifest containing AMACS version, source commit, projection version, schema set and generated-file checksums;
10. fail CI on checksum, reference, schema or count drift;
11. make no network request from the participant browser; and
12. preserve prior release projections needed to interpret historical RFxchange records.

The reduced runtime projection may be packaged with RFxchange or loaded into a governed server-side catalog store. Either approach must preserve immutable release identity.

## 3. Catalog projection

The minimum capability projection contains:

```ts
type AmacsCapability = {
  conceptId: string;
  preferredLabel: string;
  definition: string;
  domainId: string;
  domainLabel: string;
  familyId: string;
  familyLabel: string;
  aliases: string[];
  inclusionNotes?: string;
  exclusionNotes?: string;
  status: "active" | "deprecated";
  replacementConceptIds: string[];
  releaseVersion: string;
};
```

Concept-interpretation guidance is optional by concept because AMACS 0.5.0 defines its governed contract without claiming complete guidance coverage for all 615 capabilities. Absence of guidance must not make a capability unavailable.

Request-family, requirement-type, response, decision, readiness, market-role, property, unit, credential/evidence and outcome projections retain enough information to validate RFxchange structures without importing AMACS implementation mechanics into participant components.

## 4. AMACS 0.5.0 need and interpretation contracts

RFxchange must implement the AMACS contracts without weakening their authority boundaries.

### `MarketNeed`

A runtime market need separates:

- participant source statement;
- observed condition;
- desired outcome or target state;
- affected context and success measures;
- geography, timing and commercial context;
- constraints, known facts, assumptions and unresolved questions;
- solution posture, proposed/prohibited approaches and required outputs;
- interpretation references; and
- later confirmed RFx requirement references.

A market need is not a universal canonical code for every problem. RFxchange owns the runtime record; AMACS defines its interoperable structure.

### `InterpretationRecord`

An interpretation record groups one bounded assisted, algorithmic, imported or human mapping exercise. It references source material, candidate records, the AMACS release and an opaque RFxchange implementation-provenance record.

It must preserve:

```ts
humanConfirmationRequired: true;
authoritativeEffect: "none";
```

### `InterpretationCandidate`

A candidate may propose a market-need dimension, organization capability assertion, RFx capability requirement, request family, property value, credential requirement, response section, decision factor, market role or provisional term.

Every candidate preserves bounded source evidence, proposed value, rationale, uncertainty/ambiguity, mapping method and participant disposition.

Candidate disposition is not the authoritative write. Even an accepted candidate requires a separate authorized command to create or update the applicable RFxchange domain record.

### `ConceptInterpretationGuidance`

Guidance may provide inclusion notes, exclusion notes, example activities, example outputs, commonly confused concepts and clarification questions. It aids retrieval and participant understanding; it does not prove capability or qualification.

### RFxchange implementation provenance

Provider, model, prompt-template, retrieval/index version, token/usage, cost, latency, retention and provider-request identifiers belong in an RFxchange-owned provenance record. They do not become AMACS semantics or leak into organization capability and RFx domain models.

## 5. Historical snapshots

Every published RFx or confirmed organization capability reference stores the AMACS release and applicable label/definition snapshots used at that time.

```ts
type PublishedAmacsReference = {
  amacsReleaseVersion: string;
  recordId: string;
  recordType:
    | "request-family"
    | "capability"
    | "requirement-type"
    | "response-section"
    | "response-template"
    | "decision-factor"
    | "decision-template"
    | "readiness-rule"
    | "market-role";
  labelSnapshot: string;
  definitionSnapshot?: string;
};
```

Market needs, interpretation records/candidates and their provenance also retain the AMACS release used. A later AMACS rename, hierarchy move, split, merge, deprecation or guidance change cannot silently reinterpret historical activity.

## 6. Search, browse and retrieval

The shared capability picker and retrieval layer support:

- Domain → Family → Capability browsing;
- global search over preferred labels, aliases, definitions, family labels and domain labels;
- optional concept-guidance fields where available;
- normalized punctuation/case matching;
- result grouping by family/domain;
- deterministic pagination or virtualization;
- accessible keyboard/listbox/tree navigation;
- selected-capability chips and breadcrumbs;
- recently used capabilities where user-scoped state is appropriate; and
- AI-assisted candidate retrieval from the pinned release, never model-memory identifiers.

The primary participant interface shows human labels, definitions and breadcrumbs. Raw AMACS IDs remain secondary technical detail.

Retrieval scores, embeddings and model confidence are not evidence of capability, qualification or fit.

## 7. Provisional terms

`None of these describe it` creates or references a governed proposal, not a canonical capability.

A provisional record includes the proposed label and definition, example work/product/service, suggested placement, submitting organization/user authority, source RFx/profile context, status and editorial history.

A provisional term may support keyword discovery and editorial review. It cannot satisfy a mandatory canonical capability requirement until a governed AMACS release maps or approves it.

## 8. Organization capability assertions

RFxchange organization capability records conform to the AMACS 0.5.0 organization-capability contract and add only RFxchange-owned operational fields that do not conflict with AMACS semantics.

```ts
type OrganizationCapabilityClaim = {
  organizationId: string;
  organizationIdentityId?: string;
  entityScope?: "reporting_entity" | "legal_entity" | "operating_segment" | "subsidiary" | "brand" | "unknown";
  capabilityId: string;
  amacsReleaseVersion: string;
  labelSnapshot: string;
  marketRoleIds: string[];
  serviceGeographies: string[];
  deliveryRoles: Array<"prime" | "subcontractor" | "supplier" | "referral_partner">;
  specialties: string[];
  capacity?: StructuredCapacity;
  assertionStatus: "self_reported" | "evidence_submitted" | "verified" | "suspended";
  evidenceIds: string[];
  visibility: "private" | "network" | "public";
  updatedAt: string;
};
```

The write path is:

```text
participant language/manual selection
→ non-authoritative candidates
→ participant accept/edit/reject
→ authorized confirmed write
→ organization capability assertion
→ evidence and verification remain separate
```

No website, document, external classification, AI suggestion or prior response automatically creates or verifies a capability assertion.

## 9. RFx capability requirements

RFx requirements reference AMACS capabilities and retain separate requirement types, qualifiers, evidence rules, response links and decision links.

```ts
type CapabilityRequirement = {
  requirementId: string;
  requirementTypeId: string;
  capabilityId: string;
  amacsReleaseVersion: string;
  level: "required" | "preferred" | "informational";
  decisionTreatment: "gate_only" | "scored_only" | "gate_and_scored_depth" | "informational_only";
  teamCoverageAllowed: boolean;
  qualifiers: RequirementQualifier[];
  evidenceRequirementIds: string[];
  linkedResponseSectionIds: string[];
  linkedDecisionFactorIds: string[];
};
```

Team coverage is constrained by the referenced AMACS requirement type. The UI and AI path cannot relax a lead-organization credential/evidence rule that AMACS forbids teammates from satisfying.

## 10. Matching semantics

Deterministic matching distinguishes:

- exact concept match;
- child capability satisfying a broader parent only where an approved rule permits;
- parent not automatically satisfying a narrower child;
- approved equivalent/crosswalk;
- entity scope and market role;
- accepted-team coverage;
- qualifier/property fit;
- missing or insufficient evidence;
- unknown/unconfirmed profile data; and
- provisional keyword relationship that cannot satisfy a mandatory canonical requirement.

Rejected, unresolved and unconfirmed interpretation candidates do not affect authoritative matching. An LLM is not invoked merely to compare already-structured records.

Matching produces explanations, not universal qualification, endorsement, credibility or award likelihood.

## 11. Upgrade and migration

The 0.1.0 → 0.5.0 reconciliation is an explicit release migration, not a silent catalog replacement.

It requires:

- immutable 0.5.0 ingestion and checksum validation;
- migration preview from currently persisted AMACS references;
- preservation of 0.1.0 historical snapshots;
- explicit handling for deprecated, merged or split records;
- no automatic conversion of free-text organization descriptions into capability assertions;
- no silent reassignment of published RFx requirements;
- reversible mapping evidence where practical; and
- regression tests proving old records remain interpretable.

Draft records may be offered an explicit review/upgrade. Published records remain bound to their original release unless an authorized version/addendum workflow intentionally migrates them.

## 12. Security, privacy and commercial neutrality

- Participant browsers cannot mutate the canonical catalog or call an AI provider with RFxchange secrets.
- AI gateway calls require current user, organization, tenant and feature authority.
- Only minimum necessary participant content is sent for interpretation.
- Provider/model operational metadata remains server-side and separate from AMACS semantics.
- Editorial proposals exclude private content beyond minimum necessary review data.
- Search indexes contain no private organization or RFx content.
- RFxchange never infers verified capability solely from taxonomy selection or interpretation.
- Paid, Founding, sponsored or commercial status cannot alter legitimate interpretation, capability truth, matching or qualification.
- Manual AMACS browse/search remains functional when AI is declined, disabled, unavailable, rate-limited or over budget.

## 13. Acceptance

AMACS 0.5.0 reconciliation is acceptable only when:

- the pinned manifest, commit and checksums are verified;
- 16 domains, 120 families, 615 capabilities and 185 aliases reconcile;
- the additional registries reconcile to the 0.5.0 manifest;
- the four need/interpretation schemas are packaged, generated and validated;
- no participant component imports AMACS source JSON or provider-specific AI types;
- alias/hierarchy search and keyboard-accessible browse work;
- historical 0.1.0 references survive the upgrade;
- an interpretation record/candidate cannot directly create a capability assertion or RFx requirement;
- accepted candidates require a separately authorized confirmed write;
- rejected/unresolved candidates do not influence matching;
- provisional terms cannot satisfy mandatory canonical requirements;
- team-coverage restrictions are enforced server-side;
- model-memory identifiers are rejected by catalog validation;
- manual capability selection works with the AI provider unavailable; and
- participant copy avoids internal implementation vocabulary.
