# AMACS integration contract for The RFxchange

**Status: CANONICAL INTEGRATION AUTHORITY — IMPLEMENTATION REQUIRES AN AUTHORIZED SLICE.**

AMACS release baseline for this convergence:

- version: `0.1.0`;
- repository: `AccelAnalysis/amacs`;
- merged source commit: `d6f322b3f262fa8c06c70e99ebfa1d5349ee4fe1`;
- expected release shape: 15 domains, 92 families, 492 matchable capabilities and 185 English aliases.

Counts are release acceptance evidence, not application constants. The manifest and checksums remain authoritative.

## 1. Boundary

RFxchange consumes AMACS through an application port. AMACS remains an independently versioned standard and source repository.

```ts
export interface AmacsCatalogPort {
  getRelease(): Promise<AmacsReleaseMetadata>;
  searchCapabilities(query: AmacsCapabilitySearch): Promise<AmacsCapabilitySearchPage>;
  listDomains(): Promise<AmacsDomain[]>;
  listFamilies(domainId: string): Promise<AmacsFamily[]>;
  listCapabilities(familyId: string): Promise<AmacsCapability[]>;
  getCapability(capabilityId: string): Promise<AmacsCapability | null>;
  getRequestFamily(requestFamilyId: string): Promise<AmacsRequestFamily | null>;
  getResponseTemplate(responseTemplateId: string): Promise<AmacsResponseTemplate | null>;
  getDecisionTemplate(decisionTemplateId: string): Promise<AmacsDecisionTemplate | null>;
  getReadinessRules(requestFamilyId: string): Promise<AmacsReadinessRule[]>;
}
```

Domain/application code depends on the port, not JSON file paths, GitHub APIs or UI components.

## 2. Release ingestion

A build/release ingestion command must:

1. read the pinned AMACS release manifest;
2. verify manifest source commit and SHA-256 checksums;
3. reject mutable/replaced content under the same version;
4. validate schemas and referential integrity;
5. generate the reduced RFxchange runtime projection;
6. generate deterministic search indexes;
7. generate TypeScript types/constants needed by adapters;
8. write an ingestion manifest containing AMACS version, source commit, projection version and generated-file checksums;
9. fail CI on count/reference/checksum drift;
10. make no network request from the participant browser.

The generated runtime projection may be packaged with RFxchange or loaded into a governed server-side catalog store. Either approach must preserve the immutable release identity.

## 3. Runtime projection

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
  status: "active" | "deprecated";
  replacementConceptIds: string[];
  releaseVersion: string;
};
```

The request-family, response-template, decision-template, requirement-type and readiness projections retain enough information to produce valid RFx configuration without importing AMACS implementation details into participant components.

## 4. Historical snapshots

Every published RFx reference to AMACS stores:

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
    | "readiness-rule";
  labelSnapshot: string;
  definitionSnapshot?: string;
};
```

Stable IDs support joins and migrations. Snapshots preserve what the issuer/responders saw when the RFx was published. Later AMACS renames or hierarchy moves do not silently rewrite historical transactions.

## 5. Search and browse

The shared capability picker supports:

- Domain → Family → Capability browsing;
- global search over preferred labels, aliases, definitions, family labels and domain labels;
- normalized punctuation/case matching;
- result grouping by family/domain;
- deterministic pagination or virtualization;
- accessible keyboard/listbox/tree navigation;
- selected-capability chips and breadcrumbs;
- definitions and inclusion/exclusion details;
- recently used capabilities where user-scoped state is appropriate;
- suggested capabilities derived from user-entered need text only as suggestions, never as silently asserted requirements.

The primary interface shows human labels and breadcrumbs. Raw AMACS IDs are secondary technical details.

## 6. Provisional terms

`None of these describe it` creates a governed proposal, not a canonical capability.

A provisional record includes:

- user-proposed label;
- plain-language definition;
- example work/product/service;
- proposed domain/family;
- submitting organization and user authority;
- source RFx/profile context;
- status and editorial history.

A provisional term may support keyword discovery and editorial review. It cannot satisfy a mandatory canonical capability requirement until AMACS maps or approves it.

AMACS editorial outcomes include:

- mapped as alias;
- mapped to existing concept;
- approved new capability;
- converted to property/credential/requirement type;
- split;
- rejected;
- merged/deprecated.

## 7. Organization capability claims

Organization capability claims remain RFxchange records referencing AMACS:

```ts
type OrganizationCapabilityClaim = {
  organizationId: string;
  capabilityId: string;
  amacsReleaseVersion: string;
  serviceGeographies: string[];
  deliveryRoles: string[];
  specialties: string[];
  capacity?: StructuredCapacity;
  evidenceState: "self-asserted" | "evidence-supplied" | "verified";
  visibility: "private" | "network" | "public";
  updatedAt: string;
};
```

An AMACS concept does not make the claim verified. Credibility/evidence status remains separate.

## 8. RFx capability requirements

RFx requirements reference capabilities and separate qualifiers:

```ts
type CapabilityRequirement = {
  requirementId: string;
  capabilityId: string;
  amacsReleaseVersion: string;
  level: "required" | "preferred" | "informational";
  decisionTreatment: "gate" | "scored" | "gate-and-scored" | "informational";
  satisfactionScope: "lead" | "any-accepted-team-member" | "combined-team";
  qualifiers: RequirementQualifier[];
  evidenceRequirements: EvidenceRequirement[];
  linkedResponseSectionIds: string[];
  linkedDecisionFactorIds: string[];
};
```

`satisfactionScope` is constrained by the referenced AMACS requirement type. The UI cannot enable team satisfaction for a type that forbids it.

## 9. Matching semantics

Capability matching distinguishes:

- exact concept match;
- child capability satisfying a broader parent where the rule permits;
- parent not automatically satisfying a narrower child;
- approved equivalent/crosswalk;
- accepted-team coverage;
- missing evidence;
- unknown/unconfirmed profile data;
- provisional keyword relationship that cannot satisfy a mandatory canonical requirement.

Matching produces explanations, not universal qualification or award likelihood.

## 10. Upgrade/migration

An AMACS upgrade requires:

- explicit version change;
- ingestion and checksum validation;
- migration preview;
- handling for deprecated/merged/split concepts;
- no silent reassignment of organization claims or published requirements;
- migration evidence and reversible mapping where practical;
- historical RFxs remaining bound to their publication snapshot.

Draft RFxs may be offered an explicit upgrade review. Published RFxs retain their original AMACS release unless an authorized addendum/version workflow intentionally migrates them.

## 11. Security and privacy

- Browser users cannot mutate the canonical catalog.
- Editorial proposals do not expose private RFx/profile content beyond minimum necessary review data.
- Search indexes contain no private organization data.
- AMACS ingestion credentials/tokens, if ever required, remain server-side.
- RFxchange never infers verified capability solely from taxonomy selection.

## 12. Acceptance

AMACS integration is acceptable only when:

- the release manifest/checksums are verified;
- the complete release projection is available server-side;
- 15 domains, 92 families, 492 matchable capabilities and 185 aliases reconcile for 0.1.0;
- no participant component imports the source JSON directly;
- search finds alias-driven results;
- hierarchy browse/search/selection are keyboard accessible;
- historical snapshots survive catalog updates;
- provisional terms cannot satisfy mandatory matches;
- team-coverage restrictions are enforced server-side;
- participant copy avoids raw AMACS implementation vocabulary.
