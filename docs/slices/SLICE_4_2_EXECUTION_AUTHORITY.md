# Wave 4 Slice 4.2 — Structured Need, Geography, Value, Term and Requirement Foundation

**Status: EXECUTION AUTHORITY — DOCUMENTATION ONLY.**

**Merged baseline:** `3a00288f5cef74c1665266da4a2349cf4cddb9bb` (PR #161, Wave 4 Slice 4.1)

**Feature IDs:** `ISS-005`, `ISS-006`

## 1. Authority and completion boundary

This document authorizes one later runtime implementation of the RFx draft builder foundation. It does not itself complete a Feature ID or change tracker arithmetic.

Slice 4.2 is complete only when an authorized actor can reopen a real private organization-owned Slice 4.1 RFx draft, structure and persist the bounded package below, survive conflicts and recovery, optionally use governed non-authoritative interpretation, and continue through the complete manual path.

The RFx lifecycle remains exactly `draft`. This slice does not publish, project, discover, match, pursue, team, construct a response, submit, evaluate, select, award or create market activity.

## 2. Dependency result

| Dependency | Result |
| --- | --- |
| Wave 3 handoff and controlled geography/discovery foundations | Satisfied and reused. |
| PR #160 participant shell and workspace convergence | Satisfied; must not regress. |
| Slice 4.1 RFx aggregate, `draft` lifecycle, request-family snapshot, expected-version, command/event/audit seams | Satisfied by PR #161 at the merged baseline. |
| Organization authorization and `rfx.create` | Satisfied; no new edit permission is introduced. |
| Organization locations, Census/TIGER locality, geocoding and privacy authority | Satisfied and reused; no second geography model is permitted. |
| AI/AMACS Interpretation Foundation and AMACS 0.5.0 runtime | Satisfied and optionally consumed. The manual path remains complete. |
| Stabilization 2C | Isolated release engineering; not a product dependency. |

No dependency edge changes. Slice 4.3 remains ineligible until this runtime merges and post-merge acceptance is green.

## 3. Required sources

The implementation must read and preserve the current versions of:

- `/AGENTS.md`;
- `docs/context/PRODUCT_PRINCIPLES.md`;
- `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md`;
- `docs/context/RFX_TRANSACTION_CYCLE.md`;
- `docs/context/MAP_AND_GEOGRAPHY.md`;
- `docs/rfx/RFX_CORE_AMACS_CONVERGENCE.md`;
- `docs/rfx/AMACS_INTEGRATION_CONTRACT.md`;
- `docs/rfx/RFX_CORE_FEATURE_CROSSWALK.md`;
- `docs/rfx/RFX_CORE_PRODUCT_WORKSPACES.md`;
- `docs/rfx/RFX_CORE_ACCEPTANCE_MATRIX.md`;
- `docs/slices/AI_AMACS_INTERPRETATION_FOUNDATION.md`;
- `docs/slices/SLICE_4_1_EXECUTION_AUTHORITY.md`;
- applicable brand/design, authorization, lifecycle, audit, Firestore, geography, internationalization, accessibility and failure-recovery authorities.

Prototype mechanics are not production architecture.

## 4. Aggregate and package ownership

Extend the existing canonical `RfxAggregate`; do not create a parallel issuer document product. The issuer organization continues to own the aggregate. User and membership identities remain actor evidence only.

The aggregate gains one versioned `package` component equivalent to:

```ts
type RfxPackage = Readonly<{
  schemaVersion: 1;
  title: string;
  marketNeed: MarketNeed;
  scope: string;
  requestedOutputs: readonly RequestedOutput[];
  timing: RfxTiming;
  performanceLocation: PerformanceLocation;
  estimatedValue: EstimatedValue;
  engagementTerm: EngagementTerm;
  requirements: readonly RfxFoundationRequirement[];
  moduleStatus: RfxPackageModuleStatus;
}>;
```

The package is part of the mutable current draft projection. Every accepted save increments the RFx aggregate version exactly once and appends immutable RFx event, command receipt and organization audit evidence in the same transaction.

No package field is authoritative until accepted by the server command. Client form state, browser storage, interpretation output and optimistic UI never become RFx truth by themselves.

## 5. Market need

`MarketNeed` must keep these concepts distinct:

```ts
type SolutionPosture =
  | "solution-open"
  | "outcome-constrained"
  | "approach-constrained"
  | "specified-solution";

type MarketNeed = Readonly<{
  sourceStatement: string;
  observedCondition: string;
  desiredOutcome: string;
  affectedContext: string;
  successMeasures: readonly string[];
  knownFacts: readonly string[];
  assumptions: readonly string[];
  constraints: readonly string[];
  solutionPosture: SolutionPosture;
  proposedApproaches: readonly string[];
  prohibitedApproaches: readonly string[];
  unresolvedQuestions: readonly string[];
  interpretationRecordIds: readonly string[];
}>;
```

The desired outcome is a target state, not an observed post-delivery outcome. A solution-open need must not silently prescribe a solution. Participant text is normalized and bounded but not silently rewritten.

## 6. Scope, outputs, timing and foundation requirements

`title`, `scope` and each participant-authored text value require bounded non-empty validation when their module is marked complete.

Requested outputs are stable typed rows, not a single delimited string:

```ts
type RequestedOutput = Readonly<{
  id: string;
  title: string;
  description: string;
  quantity: Readonly<{ amount: number; unit: string }> | null;
  dueDate: string | null;
}>;

type RfxTiming = Readonly<{
  anticipatedStartDate: string | null;
  anticipatedCompletionDate: string | null;
  responseDeadline: string | null;
}>;
```

Slice 4.2 foundation requirements are limited to structured records that do not depend on the full AMACS capability/evaluation/response-definition work of Slice 4.3:

```ts
type RfxFoundationRequirementKind =
  | "deliverable"
  | "quantity"
  | "schedule"
  | "credential"
  | "insurance"
  | "evidence"
  | "other";

type RfxFoundationRequirement = Readonly<{
  id: string;
  kind: RfxFoundationRequirementKind;
  title: string;
  description: string;
  mandatory: boolean;
  quantity: Readonly<{ amount: number; unit: string }> | null;
  dueDate: string | null;
  evidenceDescription: string | null;
}>;
```

These records establish stable requirement identity and structured values. They do not implement AMACS capability qualifiers, team coverage, response-section linkage, evaluation factors, gates, scores or publication readiness; those remain Slice 4.3/4.4.

## 7. Performance location

Performance location is structured and reuses existing authoritative geography:

```ts
type PerformanceLocation =
  | { mode: "issuer-primary-location"; organizationLocationId: string; localityId: string; point: GeographicPoint; geocodeProvenance: GeocodeProvenanceSnapshot }
  | { mode: "organization-location"; organizationLocationId: string; localityId: string; point: GeographicPoint; geocodeProvenance: GeocodeProvenanceSnapshot }
  | { mode: "exact-address"; normalizedAddress: string; localityId: string; point: GeographicPoint; geocodeProvenance: GeocodeProvenanceSnapshot }
  | { mode: "locality"; localityId: string; localityBounds: GeographicBounds }
  | { mode: "multiple"; locations: readonly PerformanceLocationItem[] };
```

- Issuer-primary and organization-location variants reference current server-authorized organization location records and snapshot only necessary operational facts.
- Exact address uses the existing normalized address/geocode/locality authority.
- Locality uses controlled Census/TIGER locality identity and authoritative bounds.
- Multiple contains validated non-multiple items and is bounded in count.
- Operational precision and later publication visibility are separate. Slice 4.2 creates no public location projection.
- A route/query/map selection is non-authorizing and cannot supply an unvalidated operational location.

## 8. Estimated value and engagement term

Estimated value uses integer minor currency units:

```ts
type EstimatedValue =
  | { mode: "exact"; currency: string; amountMinor: number }
  | { mode: "range"; currency: string; minimumMinor: number; maximumMinor: number }
  | { mode: "not-disclosed" };
```

Values must be safe non-negative integers; range minimum cannot exceed maximum; currency is a supported uppercase ISO currency code. UI summaries derive from structured state.

Engagement term remains structured:

```ts
type StructuredDuration = Readonly<{ value: number; unit: "days" | "weeks" | "months" | "years" }>;
type EngagementTerm =
  | { mode: "fixed"; duration: StructuredDuration; note: string | null }
  | { mode: "fixed-with-options"; baseDuration: StructuredDuration; optionCount: number; optionDuration: StructuredDuration; note: string | null }
  | { mode: "ongoing"; reviewPeriod: StructuredDuration | null; note: string | null }
  | { mode: "milestone-based"; expectedStart: string | null; expectedCompletion: string | null; note: string | null };
```

Dates and positive bounded durations validate server-side. Explanatory notes remain secondary and cannot replace structured values.

## 9. Module completion and save behavior

Use one task-organized Operational Workspace, not a generic document editor or nested card dashboard. Modules are:

1. need;
2. scope and outputs;
3. timing;
4. performance location;
5. value and term;
6. foundation requirements.

Module status is a deterministic server-derived projection of the accepted package. It may be `not-started`, `in-progress` or `complete`. It does not mean publication-ready.

Implement a bounded debounced save with an explicit save/retry affordance:

- save the complete normalized package or one explicitly versioned module payload;
- include stable command ID, deterministic intent fingerprint and expected aggregate version;
- show immediate pending state without delaying for animation;
- exact replay returns the committed aggregate/receipt;
- altered command intent conflicts;
- stale expected version returns current-version recovery guidance and writes nothing;
- interrupted success reuses the stable command and cannot duplicate events;
- reload/re-entry shows only committed server state;
- optional browser storage may retain a pending command identity but never grants access or becomes package truth.

Slice 4.2 RFx event kinds are limited to `rfx-package-saved` in addition to the existing Slice 4.1 kinds. Do not pre-create publication or later workflow events.

## 10. Authorization and privacy

Every workspace read and save command must re-resolve:

- authenticated RFxchange user and current provider/account state;
- exact active membership;
- exact issuer organization;
- organization and membership restrictions;
- `rfx.create` permission; and
- RFx ownership by that issuer organization.

No new edit permission is introduced. `rfx.publish` does not substitute for `rfx.create` and is not consumed by this slice.

Wrong-user, wrong-organization, inactive membership, restriction, disabled/unverified/revoked account, missing authorization/permission, guessed RFx ID and cross-tenant command cases fail closed before draft existence or content is disclosed.

Participant source statements, exact performance addresses and AI interpretation records remain private. Error responses expose bounded participant copy and opaque correlation/support evidence only.

## 11. AI/AMACS interpretation consumer

AI assistance is optional and uses the existing server-side AI/AMACS gateway with purpose `buyer_need_definition` and the current draft as `subjectRef`.

The consumer may submit only explicitly included, minimized participant source text. It must support:

- provider disabled or missing secret;
- provider timeout/unavailable;
- quota exhausted;
- malformed output;
- invalid or out-of-retrieval AMACS identifier;
- suggestion, accept, edit, reject, unresolved and none-of-these dispositions; and
- uninterrupted manual editing throughout.

The existing foundation may be extended only as required for an AMACS-valid `market_need_dimension` candidate to carry bounded proposed text plus its dimension kind. That is a correction to the shared provider-neutral contract, not a second AI stack. Provider/model types still remain outside RFx domain records.

Interpretation records/candidates remain separate private collections with `humanConfirmationRequired: true` and `authoritativeEffect: "none"`. A disposition alone never changes the RFx.

An accepted or edited suggestion becomes authoritative only when the actor reviews the resulting package values and executes the separate expected-version `rfx-package-saved` command. Rejected/unresolved/withdrawn suggestions and clarification prompts cannot populate the accepted package, affect matching, or become market-demand observations.

Candidate request-family/capability directions may be displayed as proposals. Changing the governed request family still uses the Slice 4.1 command. Capability requirements remain Slice 4.3.

## 12. Persistence and client access

Reuse `rfxAggregates`, `rfxEvents`, `rfxCommands` and `organizationAuditEvents`. Do not split each builder module into independent authoritative documents unless an actual Firestore size or transaction constraint is demonstrated and reconciled first.

The single transaction must:

1. read current aggregate and command/event/audit identities;
2. enforce issuer ownership and expected version;
3. validate and normalize the entire accepted mutation;
4. write the new aggregate version; and
5. create the immutable event, receipt and audit.

Direct browser Firestore access remains denied for aggregate, event, receipt, audit and interpretation data. No public projection is created.

## 13. Workspace, state and copy

- Reuse the persistent participant shell and `/opportunities` route.
- Use Operational Workspace composition with concise task hierarchy and one focal action.
- Preserve safe originating Intelligence/map context only as non-authorizing return context.
- Do not place the private draft on the map.
- Use continuous rows for outputs/requirements, quiet accessible removal and native/semantic controls.
- Raw AMACS IDs, provider names, prompt/model details, Firestore vocabulary and internal schema terms are not primary participant copy.
- Loading is scoped below the shell. Optional interpretation failure does not take down manual builder work.
- Empty, saving, saved, stale-conflict, validation, restricted, dependency-error and recovery states are explicit and truthful.

All changed participant copy must exist in English, Spanish, French, Italian and German. Acceptance covers desktop, intermediate and 390px mobile layouts, keyboard-only use, screen-reader semantics, visible focus, error association, target sizing and reduced motion with no horizontal overflow.

## 14. Required acceptance

### Domain/application tests

- all structured variants validate, normalize and remain immutable;
- market-need distinctions cannot collapse or masquerade as outcomes;
- exact/range/not-disclosed value and all term variants enforce invariants;
- authoritative/referenced, exact-address, locality and multiple performance-location variants enforce current geography authority;
- output/requirement stable IDs, quantity/date/evidence rules and module status are deterministic;
- lifecycle remains `draft` and every accepted package save increments exactly once;
- exact replay, altered fingerprint, concurrent stale write and interrupted-success recovery;
- every negative authorization/account/membership/restriction/tenant case;
- interpretation disabled/unavailable/timeout/quota/malformed/invalid-ID and manual fallback;
- accept/edit/reject/unresolved/none-of-these isolation and separate authoritative save;
- no unconfirmed candidate influences the package or any matching/public projection.

### Firestore emulator

- atomic aggregate/event/receipt/audit write;
- stale/conflicting commands leave no partial evidence;
- direct-client read/write denied for RFx and interpretation private records;
- cross-organization guessed IDs disclose nothing;
- exact replay produces one aggregate version and one evidence set;
- cleanup and global run-ID residual scan return zero.

### Configured browser

With a disposable authorized issuer and real controlled geography records:

1. create/reopen the Slice 4.1 draft;
2. complete each manual builder module with structured need, outputs, timing, location, value, term and requirement rows;
3. observe debounced/explicit save, committed version progression and reload/re-entry;
4. exercise stale version and stable retry recovery;
5. use issuer-primary, locality and at least one geocoded/exact or bounded multiple location path;
6. prove AI-disabled manual completion;
7. where configured, exercise interpretation proposal review and prove no authoritative change before separate save;
8. remove permission/restrict authority after load and prove fail-closed non-disclosure;
9. verify all five locales, desktop/intermediate/390px, keyboard, accessible error/focus behavior and reduced motion;
10. verify clean console/page errors and zero residual Auth/Firestore/Storage fixtures.

Run the current canonical `npm run check`, focused validators/emulator acceptance, `git diff --check`, production build identity and exact-head/post-merge CI.

## 15. Explicit exclusions

Slice 4.2 does not implement:

- a second RFx aggregate or geography/AI stack;
- future RFx lifecycle states;
- AMACS capability requirement picker/qualifiers/team coverage;
- response sections or evaluation definition;
- readiness, preview, publication or public/permitted opportunity projection;
- opportunity beacons, discovery, saved searches, alerts or deadlines;
- matching, Go/No-Go, pursuit, gaps, teaming, response or submission;
- Wave 5 Q&A/addenda/evaluation/selection/award/outcome;
- B6b, B6c, Dark Appearance, Presentation Mode, sound or haptics;
- commercial enrollment, Stripe, Firebase App Hosting or Stabilization 2C.

## 16. Tracker and next-slice boundary

The documentation-only authority changes no Feature ID. `ISS-005` and `ISS-006` remain Not Started until runtime implementation, exact acceptance, review, merge and post-merge evidence exist.

After the runtime merges and post-merge validation is green, update only those two IDs. Slice 4.3 documentation authority then becomes the next dependency-eligible action. Do not implement Slice 4.3 under this authority.
