# Slice 4.1 — RFx kernel and request families execution authority

**Status: APPROVED IMPLEMENTATION AUTHORITY AFTER MERGE — DOCUMENTATION ONLY; RUNTIME IMPLEMENTATION HAS NOT STARTED.**

## 1. Authorized Feature IDs and tracker boundary

This authority covers exactly:

- `ISS-001` — one organization-owned canonical RFx aggregate with lifecycle, version and append-only event seams;
- `ISS-002` — governed AMACS request-family configuration and deterministic request-family snapshot; and
- `ISS-003` — safe RFx draft creation from blank with an explicit future seam for templates and prior RFxs.

This document does not complete any Feature ID. `ISS-001`, `ISS-002` and `ISS-003` remain **Not Started** until a separately authorized runtime implementation passes their acceptance requirements and is merged with evidence.

Canonical totals remain:

- **438 total · 152 Done · 286 Not Started**;
- Activation: **43/43**;
- Network: **38/38**;
- Wave 4 RFx Core: **0/41**; and
- Brand Gate B6b: **Not Started / intentionally pending**.

No Feature ID is added, deleted, renamed, reordered or inferred complete by this authority.

## 2. Recalculated merged baseline

This authority was recalculated from merged `main` at:

`42c9a33499d9c37af74b6f61d7e1a8f823d0e0f8`

That commit merged PR #150, **Define the Exchange interaction architecture**. The governing participant-experience authority is therefore:

- `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md`;
- its index entry in `docs/context/README.md`; and
- its RFx Core authority entry in `docs/rfx/README.md`.

PR #150 is consumed by this slice. It is not reopened, recreated or treated as unfinished planning. It does not authorize the complete four-lens Exchange shell; it constrains the bounded Slice 4.1 entry and workspace behavior described below.

Wave 3 is complete, its integrated exit is accepted, AMACS 0.5.0 reconciliation is complete, the cross-cutting AI/AMACS Interpretation Foundation is complete, and there is no conflicting open implementation slice or gate. Stabilization 2C remains incomplete but is isolated to release engineering; no canonical dependency authority makes it a prerequisite for RFx Core product-domain work.

## 3. Dependency eligibility result

### 3.1 Eligibility matrix

| Prerequisite | `ISS-001` | `ISS-002` | `ISS-003` | Classification and evidence |
| --- | --- | --- | --- | --- |
| Wave 3 approved handoff and Network closeout | Required | Required | Required | **Satisfied by merged `main`.** Network is 38/38 and the configured-browser/zero-residual exit is accepted. |
| Authenticated server context | Required | Required for selection/mutation | Required | **Satisfied by a prior cross-cutting foundation.** `AuthenticatedServerContext` separates the RFxchange user from provider subject/credential state. |
| Organization membership, lifecycle, restriction and permission authority | Required | Required | Required | **Satisfied by a prior cross-cutting foundation.** `authorizeOrganizationOperation` re-resolves the exact user, membership, organization, account state, restrictions and permission tuple. Slice 4.1 reuses the existing `rfx.create` permission; no new permission concept is needed. |
| Organization tenancy and direct-client default deny | Required | Required | Required | **Satisfied by a prior cross-cutting foundation.** Server-managed Firestore and organization-tenancy rules exist; Slice 4.1 must extend them to its own collections without weakening them. |
| Aggregate version, optimistic concurrency, immutable event, command receipt and organization audit patterns | Required | Required for request-family changes | Required | **Satisfied by prior cross-cutting foundations as an implementation pattern.** Existing Network domains atomically persist a version-checked aggregate with immutable event, command and audit evidence. Slice 4.1 must apply that pattern to RFx records; the RFx aggregate itself remains unimplemented. |
| Governed AMACS release, request-family registry and release-aware catalog port | Not a blocker to aggregate identity | Required | Required because a blank draft begins with a governed request family | **Satisfied by merged AMACS 0.5.0 reconciliation.** The pinned release is `0.5.0` at AMACS commit `da7879f2609271b067ae6d02875e9388a02c4fe5`. |
| AI/AMACS Interpretation Foundation | Available but not required for the kernel | Available but not required for manual request-family selection | Not required for blank creation | **Satisfied by a prior cross-cutting foundation, but not on the Slice 4.1 critical path.** Slice 4.1 uses deterministic manual selection from the governed catalog and does not invoke AI. Later need interpretation consumes the foundation. |
| Exchange Interaction Architecture / PR #150 | Required for participant entry and workspace boundary | Required for request-type presentation | Required | **Satisfied by merged `main`.** Opportunities/RFx is the primary transaction lens; bounded authoring uses the Operational Workspace; no unpublished draft becomes market activity. |
| Stabilization 2C same-SHA live rollout proof | Not a domain prerequisite | Not a domain prerequisite | Not a domain prerequisite | **Not required for this product slice.** It remains an isolated release-engineering blocker concerning trustworthy source-SHA binding and verified deployment identity. |
| Structured need, scope, location, value, term and requirement builder | Not required until Slice 4.2 | Not required | Not required | **Later Wave 4 slice.** Slice 4.1 creates only the RFx kernel and request-family-bound draft. |
| Response/evaluation definition | Not required | Not required | Not required | **Later Wave 4 slice.** |
| Publication/readiness and permitted opportunity projection | Not required | Not required | Not required | **Later Wave 4 slice.** No beacon, public card, search record or market-demand observation is created here. |
| Discovery, pursuit, teaming, response, submission, evaluation, selection, award and outcome domains | Not required | Not required | Not required | **Later slices/waves.** Future consumers do not create backward dependency edges into the RFx kernel. |
| B6b or B6c visual convergence | Not required | Not required | Not required | **Not a blocker.** B6b remains intentionally pending; B6c cannot become eligible before real publication authority in Slice 4.4. |

### 3.2 Feature-specific result

- `ISS-001`: **documentation-authorized and dependency-eligible for a later implementation pass**. The organization, authorization, tenancy, audit and concurrency foundations are present; the RFx aggregate is the work to be implemented.
- `ISS-002`: **documentation-authorized and dependency-eligible for a later implementation pass**. The pinned AMACS request-family registry and release-aware application boundary are present.
- `ISS-003`: **documentation-authorized and dependency-eligible for a later implementation pass**. Blank creation can be implemented against `ISS-001` and `ISS-002` in the same bounded slice.

No unresolved dependency requires a correction to `docs/tracking/RFxchange_DEPENDENCY_MAP.md`. No dependency edge is added merely because later features will consume an RFx.

## 4. Governing authority and required reading

A future Slice 4.1 runtime implementation must read and apply, in order:

1. `/AGENTS.md` and the explicit implementation instruction;
2. canonical tracker and dependency map;
3. this Slice 4.1 execution authority;
4. `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md`;
5. `docs/context/PRODUCT_PRINCIPLES.md`;
6. `docs/context/RFX_TRANSACTION_CYCLE.md`;
7. `docs/context/MAP_AND_GEOGRAPHY.md`;
8. `docs/rfx/README.md` and the complete RFx Core authority package;
9. `docs/rfx/RFX_CORE_AMACS_CONVERGENCE.md`;
10. `docs/rfx/AMACS_0_5_RECONCILIATION.md`;
11. `docs/rfx/AMACS_INTEGRATION_CONTRACT.md`;
12. `docs/rfx/RFX_CORE_FEATURE_CROSSWALK.md`;
13. `docs/rfx/RFX_CORE_PRODUCT_WORKSPACES.md`;
14. `docs/rfx/RFX_CORE_ACCEPTANCE_MATRIX.md`;
15. `docs/slices/AI_AMACS_INTERPRETATION_FOUNDATION.md` for the non-authoritative interpretation boundary, even though Slice 4.1 does not call AI;
16. applicable brand, design, security, privacy, geography, lifecycle, Firestore and internationalization authorities; and
17. existing production abstractions for organization authorization, versioned aggregates, immutable evidence, idempotency and Firestore transactions.

Prototype mechanics are not production architecture.

## 5. RFx aggregate authority (`ISS-001`)

### 5.1 One canonical aggregate

Implement one canonical RFx aggregate. Request families do not become separate RFI, RFQ, RFP, IFB, Sources Sought, qualifications, supplier, teaming, site-selection or lightweight-request products.

The aggregate is owned by the issuing organization. It is not owned by an individual user, Firebase UID, email address, browser session or AI interpretation.

The minimum Slice 4.1 aggregate must distinguish:

- stable RFx aggregate identity;
- issuer organization identity;
- current lifecycle state;
- aggregate version;
- current governed request-family snapshot;
- creation source;
- bounded draft/kernel state;
- creating and last-acting RFxchange user identity;
- creating and last-acting organization membership identity;
- server-owned created and updated timestamps; and
- references or correlation seams for append-only RFx events, command receipts and organization audit evidence.

Provider-specific infrastructure, Firebase document types, model-provider response types and UI component state do not belong in the domain record.

### 5.2 Minimum domain shape

The later runtime implementation may refine TypeScript names to existing conventions, but it must preserve this semantic shape:

```ts
type RFxLifecycleState = "draft";

type RFxCreationSource = Readonly<{
  kind: "blank";
  schemaVersion: 1;
}>;

type RequestFamilySnapshot = Readonly<{
  amacsReleaseVersion: "0.5.0";
  amacsSourceCommit: "da7879f2609271b067ae6d02875e9388a02c4fe5";
  requestFamilyId: string;
  labelSnapshot: string;
  purposeSnapshot: string;
  lifecycleSnapshot: readonly string[];
  defaultEndpointSnapshot: string;
  supportsAwardSnapshot: boolean;
  defaultResponseTemplateIdSnapshot: string;
  defaultDecisionTemplateIdSnapshot: string;
  defaultGovernanceProfileIdSnapshot: string;
  allowedGovernanceProfileIdsSnapshot: readonly string[];
  recommendedRequirementBundleIdsSnapshot: readonly string[];
  selectedAt: string;
}>;

type RFxAggregate = Readonly<{
  id: string;
  issuerOrganizationId: OrganizationId;
  lifecycleState: "draft";
  version: number;
  requestFamily: RequestFamilySnapshot;
  creationSource: RFxCreationSource;
  createdByUserId: UserId;
  createdByMembershipId: OrganizationMembershipId;
  updatedByUserId: UserId;
  updatedByMembershipId: OrganizationMembershipId;
  createdAt: string;
  updatedAt: string;
}>;
```

This is a semantic authority, not a mandate to copy the sample verbatim. The implementation must use repository brands/types and validators and may add schema/version metadata needed by the established persistence layer. It may not add later-slice business fields under the pretext of completing the kernel.

### 5.3 Separate evidence records

Implement separate append-only evidence records equivalent to:

- `RFxEvent` — RFx ID, issuer organization, event kind, aggregate version, actor user, actor membership, command ID, occurred-at timestamp and only the bounded event payload necessary to interpret the change;
- `RFxCommandReceipt` — command ID, issuer organization, RFx ID, action, request fingerprint, resulting version and recorded-at timestamp; and
- existing `OrganizationActionAuditEvent` — organization-scoped audit evidence using the current audit model.

Slice 4.1 event kinds are limited to:

- `rfx-draft-created`; and
- `rfx-request-family-changed`.

Do not pre-create publication, addendum, response, evaluation, selection, award, close or outcome events merely to make the event catalog appear complete.

## 6. Lifecycle boundary

Slice 4.1 implements exactly one lifecycle state: `draft`.

A new aggregate begins in `draft` and remains in `draft` throughout this slice. The authority may document future lifecycle seams, but the runtime enum, command handlers and persistence accepted by Slice 4.1 must not implement future states or transitions.

In particular, Slice 4.1 does not implement:

- readiness or preview;
- published, amended, closed, withdrawn or cancelled RFx states;
- public/permitted opportunity projections;
- responder discovery or pursuit;
- response construction or submission;
- evaluation, selection, award or outcome; or
- a fake terminal state for testing convenience.

The AMACS request-family snapshot retains the selected family’s governed ordered lifecycle and top-level endpoint, award-support, response/decision template, governance-profile and recommended-requirement-bundle configuration as explanatory/versioned metadata. That snapshot does not advance the RFx or authorize any of those future states.

## 7. Versioning, concurrency and idempotency

### 7.1 Version rules

- Initial aggregate version is `1`.
- Creation persists with an expected prior version of `null`/absent.
- Every accepted request-family change increments the aggregate version by exactly one.
- A mutation command supplies the participant’s expected aggregate version.
- The server compares that value inside the same Firestore transaction that writes the aggregate and evidence.
- A stale expected version is rejected as a conflict and writes nothing.
- Server authority owns aggregate identity, version increments and timestamps.

Slice 4.1 does not add generic autosave fields. Its bounded concurrency acceptance is proved through creation and an authorized request-family change. Later builder slices extend the same expected-version contract to their own draft content.

### 7.2 Idempotent command rules

Each create/change command carries a stable command ID and a deterministic request fingerprint.

- First valid use writes the aggregate change, RFx event, command receipt and organization audit atomically.
- Exact replay by the same authorized organization, action and fingerprint returns the previously recorded result and creates no duplicate aggregate or evidence.
- Reuse of a command ID for a different organization, action or fingerprint is a conflict.
- A command receipt is immutable.
- A request that fails authorization or validation does not create a successful receipt.
- Interrupted-success recovery must be able to discover and return the committed receipt rather than creating a second RFx.

### 7.3 Atomic persistence

Reuse the established repository pattern: a single server transaction reads the target aggregate and evidence identities, verifies expected version/absence and collision state, writes the mutable current aggregate, and creates immutable event, command and audit evidence.

No UI-only version, timestamp or optimistic state is authoritative.

## 8. Organization ownership and permission boundary

### 8.1 Exact authority tuple

Every create or request-family-change command must pass through the canonical organization-operation authorization boundary and require `rfx.create`.

The server must re-resolve and bind:

- current authenticated RFxchange user;
- trusted authentication subject/account state;
- exact active organization membership;
- exact issuer organization;
- membership/organization restrictions;
- organization lifecycle/access eligibility; and
- effective `rfx.create` permission.

The actor fields recorded in aggregate/evidence come from the allowed authorization decision, not from participant-supplied actor identifiers.

### 8.2 Non-authorizing inputs

The following may help identify the intended context but never grant organization authority:

- route parameters;
- client-supplied organization IDs;
- membership IDs without server verification;
- localStorage or sessionStorage;
- query state, return context or browser history;
- email address;
- Firebase UID or provider subject alone;
- selected organization/map state; or
- an AI/provider response.

Wrong-user, wrong-organization, inactive-membership, restricted-organization/membership, account-unavailable, credential-revoked, email-verification-required, authorization-missing and missing-permission cases fail closed.

### 8.3 Ownership invariant

An RFx belongs to exactly one issuer organization. Acting users and memberships are evidence of who acted for that organization; they do not become co-owners of the aggregate. A user acting through another organization receives no access merely because the same user identity appears in both contexts.

## 9. AMACS request-family snapshot (`ISS-002`)

### 9.1 Pinned release and validation

Slice 4.1 consumes the verified AMACS 0.5.0 request-family registry through the existing release-aware catalog/application port.

The server must:

1. retrieve the requested family from the pinned governed projection;
2. reject an absent, malformed, deprecated-without-permitted-use or model-invented identifier;
3. build the snapshot from the verified catalog record rather than participant labels, participant-supplied module configuration or model memory;
4. preserve the stable family ID, release version, source commit, participant-readable label/purpose, ordered lifecycle strings, `default_endpoint`, `supports_award`, default response/decision template IDs, default/allowed governance profile IDs and recommended requirement bundle IDs as top-level snapshot fields mirroring the governed request-family record;
5. reject any participant- or model-supplied attempt to override those governed snapshot values; and
6. persist the selected snapshot as part of the same versioned aggregate transaction.

Ordinary participant UI shows request-type names, concise purposes and accessible lifecycle explanation. Raw AMACS IDs, source commit, endpoint/module identifiers and schema vocabulary remain technical details, not primary copy.

### 9.2 Deterministic historical meaning

A later AMACS release must not silently change an existing draft’s selected request family, labels, purpose, ordered lifecycle, endpoint, award support, response/decision templates, governance profiles or recommended requirement bundles.

- Existing drafts retain the complete stored release/provenance and family-configuration snapshot.
- A future explicit migration or family-change command requires separate authority and an expected-version mutation.
- A participant-authorized family change records a complete new snapshot, increments the aggregate version and appends an event that preserves enough prior/new context to explain the change.
- Published-record migration remains later authority and is not implied here.

### 9.3 AI boundary

Slice 4.1 does not ask an AI to choose or invent a request family. Manual browse/selection from the pinned governed registry is complete and authoritative for this slice.

A later authorized interpretation workflow may propose a request family through the cross-cutting AI/AMACS foundation. Such a proposal remains non-authoritative and still requires participant confirmation plus the same separate `rfx.create`-authorized domain command.

## 10. Draft creation from blank (`ISS-003`)

### 10.1 Authorized creation command

The minimum truthful participant action is:

```text
Choose a governed request type
→ confirm Create draft
→ server re-resolves organization authority
→ create one organization-owned RFx aggregate in draft state
→ return the authorized draft kernel in the Operational Workspace
```

The create command accepts only the data necessary for the kernel:

- selected governed request-family identifier;
- command ID; and
- intended organization/membership routing context subject to full server revalidation.

It does not accept or persist publication state, opportunity visibility, responder access, requirements, response structure, evaluation factors, performance location, value, term, deadlines or market activity.

### 10.2 Creation-source seam

Persist `creationSource.kind = "blank"` and a source-schema version.

The domain and repository should be designed so a future separately authorized change may add discriminated variants such as template or prior-RFx copy. Slice 4.1 validators and commands must accept only `blank`; they must not implement template browsing, copying, cloning, import, paid template access or prior-RFx selection.

### 10.3 Truthful draft result

Creating a draft does not:

- publish an RFx;
- create a public/permitted opportunity projection;
- create an opportunity beacon;
- notify or match responders;
- create market-demand intelligence;
- create a pursuit, team, response or evaluation object; or
- claim that the request is ready, live or open.

The participant surface must call it a draft and clearly indicate that later required information and publication checks are unavailable/not yet implemented under this slice.

## 11. Workspace and Exchange integration

Apply PR #150 and `RFX_CORE_PRODUCT_WORKSPACES.md`.

### 11.1 Minimum entry

Slice 4.1 may add the minimum legitimate Opportunities/RFx own-organization entry required to:

- expose `Create RFx` only to a currently authorized organization actor with `rfx.create`;
- enter a request-type selection task; and
- open the resulting draft kernel.

The task uses the existing participant shell and the **Operational Workspace** because request-family selection and draft creation are authoring tasks.

### 11.2 Spatial context seam

Where entry originates from a permitted Spatial Workspace state, the implementation may carry a bounded return-context reference sufficient to return to the originating organization/map context. That context is non-authorizing, may be narrowed by the server and must not be stored as RFx domain truth.

Slice 4.1 does not implement the full persistent four-lens shell, general lens switching, new map layers or cross-lens analytics.

### 11.3 Explicit spatial/public prohibitions

- Do not render unpublished drafts on the map.
- Do not create opportunity beacons, published discovery, result cards, fit explanations or market statistics.
- Do not fabricate “live Opportunities” to make navigation look complete.
- Do not expose one organization’s draft to another organization.
- Do not reposition public marketing as four equal products or four product pillars.

Opportunities/RFx remains the namesake and primary future market-action proposition. Resources, Intelligence and Referrals remain supporting lenses under their own real authorities.

## 12. Persistence and security implementation expectations

### 12.1 Repository boundary

Create an RFx domain repository interface and a Firestore adapter behind it. Unless a genuine implementation conflict is found and documented, use these server-managed collections:

- `rfxAggregates` — mutable current aggregate projection;
- `rfxEvents` — append-only RFx domain events;
- `rfxCommands` — immutable command/idempotency receipts; and
- existing `organizationAuditEvents` — append-only organization audit evidence.

Collection names are infrastructure details and do not enter the domain model or participant copy.

### 12.2 Firestore transaction

Create and request-family-change operations must atomically:

1. read the aggregate when applicable;
2. read the proposed event, command and audit identities;
3. enforce aggregate absence/current expected version;
4. reject evidence collisions;
5. write the current aggregate with the repository schema/persistence metadata;
6. create the RFx event;
7. create the command receipt; and
8. create the organization audit event.

No partial aggregate without its consequential evidence is accepted.

### 12.3 Security Rules and projections

Add explicit Firestore Security Rules entries for all new collections:

- aggregate records are server managed;
- direct authenticated and unauthenticated browser reads/writes are denied unless a later explicit permitted projection says otherwise;
- event and command records are create-only through the trusted server and cannot be updated/deleted; and
- no public opportunity collection is created in this slice.

Participant reads and writes occur through authenticated server handlers that project only the exact authorized organization’s draft kernel.

### 12.4 Tenant isolation

Repository and service tests must prove:

- an organization can read/mutate only its own authorized draft;
- the same user acting through another organization does not cross the tenant boundary;
- guessed RFx IDs do not disclose existence or content across organizations;
- direct-client Firestore access remains denied; and
- event/command/audit records cannot be overwritten or deleted.

## 13. Participant copy, accessibility and internationalization

Any new platform-controlled participant copy introduced by Slice 4.1 must ship through the existing five-locale boundary:

- `en-US`;
- Spanish;
- French;
- Italian; and
- German.

Participant-authored content remains verbatim and outside automatic translation.

The request-type and draft-entry surface must provide:

- keyboard-operable family selection;
- visible focus and selected state;
- accessible name, concise purpose and lifecycle explanation;
- screen-reader announcement of selection, create result, permission denial and conflict/recovery state;
- desktop, intermediate and mobile reflow without horizontal overflow;
- 200% zoom/reflow support;
- reduced-motion-safe transitions;
- loading, empty, unavailable, validation, permission, conflict, dependency failure and recovery states; and
- clean browser console behavior.

Do not implement Dark Appearance, an appearance preference or Presentation Mode in this slice. **Light Appearance** and **Dark Appearance** are presentation terms; **Intelligence** is the analytical lens.

## 14. Acceptance evidence required before Feature completion

Documentation merge alone does not satisfy any item below.

### 14.1 `ISS-001` acceptance

Runtime evidence must prove:

1. one stable canonical RFx aggregate is created at version 1 and owned by the exact issuer organization;
2. actor user and membership remain distinct from organization ownership;
3. current authenticated server context, active membership, no blocking restriction and `rfx.create` are required;
4. ordinary member/missing-permission, wrong-user, wrong-organization, inactive/restricted participant, revoked/disabled/unverified account and stale authority are denied;
5. aggregate, creation event, command receipt and organization audit commit atomically;
6. consequential event/command/audit evidence is immutable;
7. expected-version conflict rejects stale request-family mutation without partial writes;
8. organization tenancy and guessed-ID isolation hold; and
9. direct-client Firestore access is denied.

### 14.2 `ISS-002` acceptance

Runtime evidence must prove:

1. request families come only from the pinned verified AMACS 0.5.0 projection;
2. invalid or model-invented IDs are rejected;
3. release version, source commit, stable family ID, participant-readable label/purpose, ordered lifecycle strings, default endpoint, award-support flag, default response/decision template IDs, default/allowed governance profile IDs and recommended requirement bundle IDs are retained from the verified catalog as top-level snapshot fields;
4. participant or AI input cannot override any governed family snapshot value;
5. a later catalog/release change cannot silently reinterpret the stored draft or alter its snapshotted family configuration;
6. an authorized family change requires the current version, increments exactly once and appends complete prior/new snapshot evidence;
7. raw implementation IDs/source commit are absent from ordinary participant labels;
8. manual selection works with AI disabled/unavailable; and
9. no interpretation candidate directly changes the aggregate.

### 14.3 `ISS-003` acceptance

Runtime evidence must prove:

1. an authorized issuer can create a draft from blank through one bounded participant action;
2. exact replay of the same command/fingerprint returns the same RFx and does not duplicate records;
3. command-ID reuse with different payload/action/organization conflicts;
4. the source is recorded as blank with a versioned seam;
5. template, prior-RFx copy/import and paid source variants are rejected/unavailable rather than simulated;
6. the result remains an unpublished private draft;
7. no opportunity projection, beacon, match, notification, pursuit, team, response, evaluation or market-activity record is created; and
8. the created draft survives reload/re-entry for the same authorized organization without leaking to another tenant.

### 14.4 Cross-surface and repository acceptance

Where the implementation introduces the participant surface, run configured-browser acceptance covering:

- authorized issuer creation and request-family change;
- missing permission, wrong organization and inactive/restricted denial;
- stale version and idempotent replay/recovery;
- request-family provenance display at the appropriate participant/technical levels;
- desktop, intermediate and mobile layouts;
- keyboard and screen-reader semantics;
- 200% reflow and reduced motion;
- all five locales;
- reload/sign-in re-entry;
- clean page errors and console; and
- exact disposable Auth/Firestore cleanup with zero residuals.

Automated acceptance must include domain, application, repository, API/problem-envelope, Firestore Rules, organization-tenancy, event/command/audit immutability and emulator tests.

Run focused validators first, then the canonical full gate:

```bash
npm run check
```

Production CI must pass on the exact reviewed PR head and again on merged `main` before the slice may be reported complete.

## 15. Explicit non-scope

Slice 4.1 does not authorize:

- structured MarketNeed creation or issuer AI intake;
- title, need, scope, outputs, dates, location, value or term builder breadth;
- capability/credential/evidence requirements;
- response structure or evaluation definition;
- readiness, preview, publication or sharing;
- opportunity projection, map beacon, discovery, saved search, alerts or deadlines;
- fit, qualification, Go/No-Go, pursuit or gaps;
- teammate/resource routing or RFx-scoped team records;
- response workspaces, compliance matrix, submission or handoff;
- evaluator, Q&A/addenda, selection, award, close or outcome domains;
- the full persistent four-lens Exchange shell;
- B6b, B6c or another Brand Gate;
- Dark Appearance, appearance preference, Presentation Mode, sound or haptics;
- Stabilization 2C release-engineering changes; or
- public marketing repositioning.

Do not include React components, API routes, domain classes, repositories, Firestore rules, CSS, navigation activation or any other runtime change in the documentation PR that introduces this authority.

## 16. Implementation handoff and stop boundary

After this authority is reviewed, exact-head green, merged and post-merge green:

- `ISS-001`, `ISS-002` and `ISS-003` remain Not Started;
- Wave 4 remains 0/41 Done;
- Slice 4.1 runtime implementation becomes dependency-eligible for a **separate explicit authorization**;
- no genuine product-domain blocker remains based on the reviewed dependency graph; and
- Stabilization 2C remains separately parked as release engineering.

Stop before implementing the RFx aggregate, Firestore persistence, server commands, participant UI, request-family runtime or any later Wave 4 behavior.
