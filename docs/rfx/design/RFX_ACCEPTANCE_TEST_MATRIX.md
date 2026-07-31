# Wave 4 RFx Acceptance & Test Matrix

**Status: PARALLEL PLANNING ANALYSIS — NON-CANONICAL UNTIL RFx CORE CONVERGENCE REVIEW**

This document converts the current Wave 4 RFx Core feature set and parallel planning work into a testable acceptance system. It is a planning artifact only. It does **not** authorize Wave 4 implementation, mark any Feature ID complete, alter the canonical dependency map, define final RFx lifecycle states/permissions, or replace slice-specific acceptance evidence.

The purpose is to make later Wave 4 implementation verifiable by construction rather than adding tests after architectural decisions are already embedded in code.

---

## 1. Governing verification invariant

> **Every Wave 4 feature must be proven not only on its happy path, but also against authority, privacy, lifecycle/state, idempotency/replay, concurrency/versioning, integration failure, responsive UX and accessibility risks appropriate to that feature.**

A feature is not complete merely because the intended button works once.

For consequential RFx actions, acceptance must prove at least:

1. the right organization/user can perform the action;
2. the wrong organization/user cannot;
3. stale browser state cannot overrule current server authority/state;
4. private data remains private across projections and notifications;
5. retries/replays do not create duplicate business effects;
6. concurrent or version-changing actions fail deterministically rather than corrupting lineage;
7. downstream integration failures do not rewrite upstream truth unless the canonical contract explicitly requires atomic coupling;
8. mobile and keyboard users can complete the supported workflow;
9. user-facing claims remain truthful, especially for matching, teaming, external submission, provider routing and credibility.

---

## 2. Inputs and authority

This matrix consumes, but does not supersede:

- `/AGENTS.md`;
- `docs/context/RFX_TRANSACTION_CYCLE.md`;
- `docs/context/ORGANIZATION_MODEL.md`;
- `docs/context/MAP_AND_GEOGRAPHY.md`;
- `docs/context/ACQUISITION_AND_RETENTION.md`;
- `docs/context/CREDIBILITY_SYSTEM.md`;
- `docs/design/README.md`;
- `docs/design/RFxchange_DESIGN_SYSTEM.md`;
- `docs/architecture/DESIGN_CONVERGENCE_GATE.md`;
- the canonical tracker and dependency map;
- parallel planning lane A: `RFX_WAVE_4_FEATURE_CROSSWALK.md`;
- parallel planning lane B: `RFX_PRODUCT_WORKSPACES_UX.md`;
- parallel planning lane C: `RFX_EXCHANGE_NETWORK_INTEGRATION_CONTRACTS.md`;
- parallel planning lane D: `RFX_DOMAIN_EVENT_NOTIFICATION_CATALOG.md`.

If a scenario in this document conflicts with a later canonical domain/security decision, the canonical decision controls and this matrix must be reconciled before implementation authorization.

---

## 3. What this matrix does and does not decide

### 3.1 This matrix may assert hard invariants now

Examples:

- organization scope is server-authoritative;
- a draft response is not issuer-visible merely because it exists;
- a potential match is not qualification or endorsement;
- a team invitation is not a legal teaming agreement;
- an external submission handoff is not proof of external submission;
- notification delivery is not RFx lifecycle state;
- private credential evidence is not a public RFx projection;
- one RFx requirement must remain traceable into responder completion state;
- retries of a hosted submission must not create duplicate accepted submissions;
- an expired/restricted share link cannot grant protected access;
- paid status cannot alter substantive RFx qualification, credibility or provider approval.

### 3.2 This matrix parameterizes unresolved architecture

The later Extra High convergence pass must bind unresolved terms such as:

- exact RFx lifecycle state names/transitions;
- exact organization RFx roles/permissions;
- whether Watch is its own relationship or a pursuit state;
- response creation timing;
- post-publication mutation/addendum rules;
- hosted submission sealing/release timing;
- withdrawal/replacement rules;
- RFx-type module requirements;
- public vs authenticated vs restricted RFx visibility classes;
- exact reminder thresholds;
- exact evaluator-access timing;
- which organization users receive each notification.

Tests should be written against the converged contract, not against provisional labels in this planning artifact.

---

## 4. Acceptance dimensions

Scenario IDs use these dimensions.

| Code | Dimension | What it proves |
| --- | --- | --- |
| `HP` | Happy path | Intended user can complete the feature and reach the expected business state. |
| `AUTH` | Authority | Organization/user role/scope is revalidated server-side. |
| `PRIV` | Privacy | Public, participant, responder, issuer, teammate and admin projections expose only permitted data. |
| `STATE` | Lifecycle/state | Action is valid only in legitimate transaction state and transitions truthfully. |
| `IDEM` | Idempotency/replay | Retry/replay produces one business effect where one is intended. |
| `CONC` | Concurrency/versioning | Concurrent/stale/version-changing operations do not corrupt data or authority. |
| `INT` | Integration contract | Cross-domain handoff uses the owning system and preserves boundary semantics. |
| `FAIL` | Failure/degradation | Dependency/provider failure is observable and does not invent or erase business truth. |
| `UX` | Responsive/product UX | Shared Spatial/Operational Workspace behavior remains usable and truthful. |
| `A11Y` | Accessibility | Keyboard, screen-reader, focus, semantic status and touch interaction are viable. |
| `COPY` | Claims/copy | Language does not imply qualification, endorsement, legal relation, external receipt or other unsupported fact. |
| `AUDIT` | Evidence/audit | Consequential action preserves actor, time, subject and correlation/version evidence. |

Not every feature requires a separate automated test in every dimension, but every slice must explicitly account for relevant dimensions.

---

## 5. Required validation layers

Later implementation should distribute scenarios across the cheapest reliable layer instead of forcing every rule into browser tests.

| Layer | Primary use |
| --- | --- |
| Domain/unit | Pure state transition, typed contract, validation and calculation semantics. |
| Application/service | Organization scope, use-case orchestration, idempotency and transactional boundaries. |
| Security/emulator | Firestore/Storage/function authorization, cross-user/cross-org denial, privacy projection. |
| Contract/integration | Discovery, acquisition, provider/referral, communications and projection boundaries. |
| Architecture validator | No duplicate domain/provider implementations; canonical workspace/design invariants. |
| Browser acceptance | Real user path, responsive composition, focus, state labels, deep links and error recovery. |
| Production-like acceptance | Provider adapters/configured environments only where necessary; no uncontrolled external side effects. |

A browser happy path cannot substitute for server/security tests.

---

## 6. Canonical test fixture model

Exact IDs/names are illustrative. The final suite should create deterministic fixtures with equivalent relationships.

### 6.1 Organizations

- `ORG_ISSUER_A` — authorized issuer in released locality A.
- `ORG_RESPONDER_B` — capable participant in locality A.
- `ORG_RESPONDER_C` — participant missing one material capability/credential.
- `ORG_PARTNER_D` — candidate teammate with the missing capability.
- `ORG_PROVIDER_E` — approved Official Resource Provider serving locality A.
- `ORG_PROVIDER_UNAPPROVED_F` — provider-like organization without approved provider status.
- `ORG_FOREIGN_G` — legitimate participant outside permitted geography/visibility scope.
- `ORG_UNRELATED_H` — unrelated organization used for cross-tenant denial tests.

### 6.2 Users

Each organization should have fixtures representing:

- authorized manager/owner equivalent;
- ordinary member without RFx-management authority;
- submit-capable responder user where the converged permission model distinguishes it;
- removed/suspended former authorized user;
- future evaluator fixture only for Wave 5 seam tests.

### 6.3 Geography

- released locality A;
- visible/unreleased locality B;
- restricted locality C;
- locality boundary-adjacent organization/service-area cases;
- exact-location private organization;
- approximate-location organization;
- locality-only public organization.

### 6.4 RFx fixtures

At minimum:

- lightweight request type;
- structured RFP-like type;
- hosted-submission RFx;
- external-submission RFx;
- public RFx;
- authenticated-network-only RFx where supported;
- restricted/invite-only RFx if convergence adopts that visibility mode;
- RFx with geography/performance constraints;
- RFx with required and preferred supplier criteria;
- RFx with structured requirements and evaluation definition;
- RFx nearing deadline;
- closed/expired/cancelled equivalent state fixture;
- version-changed fixture when versioning rules are adopted.

### 6.5 Requirement fixtures

Include:

- simple narrative response requirement;
- numeric/quantity requirement;
- required credential criterion;
- preferred capability criterion;
- performance-location/geography criterion;
- required attachment/evidence item;
- pricing/commercial response item;
- optional/informational item.

---

# 7. Cross-cutting invariants — mandatory across Wave 4

## X-01 — Organization scope

**Scenario:** User authorized for `ORG_RESPONDER_B` attempts to mutate an RFx/response/team artifact owned by `ORG_UNRELATED_H` by changing client IDs or request payload.

**Expected:** server denies; no durable mutation/event/notification occurs; denial does not leak protected object content.

## X-02 — Client state is never authority

**Scenario:** Browser has a previously valid action enabled, but organization permission/state changed server-side before action submit.

**Expected:** action is revalidated server-side and rejected or reconciled according to canonical contract; stale UI cannot force the mutation.

## X-03 — Public projection is bounded

**Scenario:** Anonymous visitor loads a permitted public RFx.

**Expected:** only approved public opportunity/issuer/geography/requirement projection is visible; internal notes, private issuer fields, private responder data, private credential evidence and admin metadata are absent from payload and rendered UI.

## X-04 — Exact location privacy

**Scenario:** Opportunity/organization discovery involves an organization whose exact location is private.

**Expected:** map/list/detail use approved approximate/locality-only projection; exact coordinates/address cannot be reconstructed from network response fields or hidden DOM attributes.

## X-05 — Paid status neutrality

**Scenario:** Same RFx fit query is evaluated for otherwise equivalent free and paid organizations.

**Expected:** commercial tier may enable feature capacity/convenience but does not silently change capability truth, qualification, credibility, provider approval or RFx authorization.

## X-06 — Match humility

**Scenario:** Search/matching produces overlap between responder profile and RFx criteria.

**Expected:** UI/API describes potential alignment/relevance; it does not claim guaranteed eligibility, qualification, endorsement, selection likelihood or award.

## X-07 — Draft response secrecy

**Scenario:** Responder creates/edits a response draft.

**Expected:** issuer cannot query or infer draft existence/content merely from RFx Core, Discovery, notification or analytics surfaces before legitimate submission/release rules allow it.

## X-08 — Notification state separation

**Scenario:** Email fails, succeeds, is opened, or notification is marked read.

**Expected:** none of those facts changes RFx publication, team acceptance, addendum acknowledgment, submission, evaluator completion or other domain action.

## X-09 — Stable requirement lineage

**Scenario:** Issuer requirement is represented in responder workspace.

**Expected:** response/compliance item references stable requirement identity and applicable RFx version; it is not an untraceable copied label.

## X-10 — External authority truth

**Scenario:** User opens an external submission destination after preparing a response.

**Expected:** RFxchange may record handoff/open action but never reports external `Submitted`, `Received`, `Accepted` or `On time` without separately governed evidence.

## X-11 — Hosted submission immutability

**Scenario:** Hosted submission commits successfully.

**Expected:** accepted submission version/receipt are immutable evidence; editable working response remains conceptually distinct; later replacement/withdrawal, if permitted, creates governed history rather than mutation of historical receipt.

## X-12 — Cross-domain ownership

**Scenario:** RFx gap routes to provider/referral/partner discovery.

**Expected:** RFx Core passes bounded context; owning Network/Referral/Provider/Teaming domain owns its lifecycle. No duplicate provider/referral/org identity record is created inside RFx persistence.

---

# 8. Feature coverage summary

All **41 current Wave 4 Feature IDs** are represented exactly once below as a primary acceptance owner.

| Feature | Primary acceptance focus | Mandatory dimensions |
| --- | --- | --- |
| `ISS-001` | One canonical organization-owned RFx transaction root | HP, AUTH, STATE, AUDIT |
| `ISS-002` | Type-configured behavior without parallel schemas | HP, STATE, CONC |
| `ISS-003` | Blank/template/prior creation source integrity | HP, AUTH, PRIV, CONC |
| `ISS-005` | Modular authoring/package composition | HP, UX, A11Y, STATE |
| `ISS-006` | Structured requirement identity and validation | HP, CONC, AUDIT, A11Y |
| `ISS-007` | Supplier criteria semantics and provenance | HP, PRIV, COPY, INT |
| `ISS-009` | Published evaluation-definition seam | HP, CONC, PRIV, AUDIT |
| `ISS-011` | Structured package projection consistency | HP, CONC, UX |
| `ISS-016` | Explainable publish readiness | HP, AUTH, STATE, FAIL |
| `ISS-018` | Responder preview parity | HP, PRIV, UX, A11Y |
| `ISS-019` | Atomic/idempotent authoritative publication | HP, AUTH, IDEM, INT, FAIL, AUDIT |
| `ISS-020` | Free core / advanced capability boundary | HP, AUTH, COPY, INT |
| `ACQ-009` | Controlled RFx share/acquisition link | HP, PRIV, AUTH, IDEM |
| `DSC-004` | Permitted RFx search/detail | HP, PRIV, INT, UX, A11Y |
| `DSC-005` | Saved-search ownership and limits | HP, AUTH, IDEM, INT |
| `DSC-006` | Match-to-alert without duplicate/overclaim | HP, IDEM, FAIL, COPY |
| `DSC-007` | Watch relationship and entitlement | HP, AUTH, STATE, INT |
| `DSC-008` | Canonical deadline tracking/reminders | HP, CONC, IDEM, FAIL |
| `RSP-001` | Source attribution semantics | HP, COPY, PRIV |
| `RSP-002` | Fit explanation using bounded evidence | HP, PRIV, COPY, INT |
| `RSP-003` | Private Go/No-Go analysis | HP, PRIV, UX, A11Y |
| `RSP-004` | Pursue/Watch/Decline relationship | HP, AUTH, STATE, CONC |
| `DSC-010` | Reusable gap-scoped partner discovery | HP, PRIV, INT, UX |
| `RSP-006` | Known/unknown/missing gap semantics | HP, PRIV, COPY, INT |
| `RSP-007` | Gap → teammate discovery orchestration | HP, INT, AUTH, UX |
| `RSP-008` | Gap → resource/provider routing | HP, PRIV, INT, COPY |
| `RSP-009` | Requirement-driven response creation | HP, AUTH, STATE, PRIV, CONC |
| `RSP-010` | Compliance matrix linkage/completion | HP, CONC, A11Y, UX |
| `RSP-017` | Continuous completeness checks | HP, STATE, CONC, FAIL |
| `RSP-018` | Final server-side submission validation | HP, AUTH, STATE, CONC |
| `RSP-019` | Canonical final-review projection | HP, PRIV, UX, A11Y |
| `RSP-020` | Hosted submit lock/receipt | HP, AUTH, IDEM, CONC, AUDIT, FAIL |
| `RSP-021` | External handoff truth boundary | HP, COPY, IDEM, AUDIT |
| `TEM-001` | RFx-scoped teammate search | HP, PRIV, INT, UX |
| `TEM-002` | Controlled team invitation | HP, AUTH, PRIV, IDEM, AUDIT |
| `TEM-003` | Invite review/accept/decline | HP, AUTH, STATE, IDEM |
| `TEM-004` | Nonbinding legal boundary | COPY, A11Y, AUDIT |
| `ACQ-007` | External invite continuity | HP, AUTH, PRIV, IDEM, INT |
| `EDU-011` | First issuer education | HP, UX, A11Y, COPY |
| `EDU-012` | First responder education | HP, UX, A11Y, COPY |
| `EDU-013` | First teaming education | HP, UX, A11Y, COPY |

Coverage check: **41/41**.

---

# 9. F1 — RFx Kernel & Request Typing

## `ISS-001` — Unified structured RFx object/workflow

### `ISS-001-HP-01` Create canonical RFx root
Authorized issuer creates an RFx and receives one stable RFx identity owned by the issuer organization.

**Expected:** downstream requirements/package/publication/response references use that identity; no separate issuer-document identity is created.

### `ISS-001-AUTH-01` Wrong organization cannot mutate
Unrelated organization member submits update against issuer RFx ID.

**Expected:** denied server-side; no event/version/audit state implying successful mutation.

### `ISS-001-STATE-01` Invalid transition denied
Client attempts a lifecycle transition not allowed from current canonical state.

**Expected:** deterministic typed error/current-state response; RFx remains unchanged.

### `ISS-001-AUDIT-01` Consequential lifecycle evidence
Creation and later consequential state changes preserve actor organization/user, RFx ID, timestamp, prior/new state or equivalent durable evidence.

## `ISS-002` — RFx types

### `ISS-002-HP-01` Multiple types share one kernel
Create at least two materially different RFx types.

**Expected:** both are represented by the same RFx root/schema boundary with type-driven modules/defaults; no type-specific duplicate platform engine.

### `ISS-002-STATE-01` Type requirements enforced
A type missing one of its converged required modules cannot pass publish readiness.

### `ISS-002-CONC-01` Type mutation after dependent content
Changing type after authoring dependent modules follows canonical reconciliation rules; orphaned/invalid content is never silently accepted or destructively lost without warning/history.

### `ISS-002-COPY-01` Type-aware language
A Sources Sought/capability request is not described as having a guaranteed awardee/winner if the type does not support that outcome.

---

# 10. F2 — Issuer Authoring & Definition

## `ISS-003` — Blank/template/prior creation

### `ISS-003-HP-01` Blank creation always available within core authority
Authorized issuer can start the approved basic RFx path without future template/history entitlements.

### `ISS-003-AUTH-01` Prior RFx source access
User cannot clone/source from an RFx they are not permitted to access.

### `ISS-003-PRIV-01` Clone does not leak protected source data
Derived draft contains only fields permitted by canonical clone/template rules; private collaborator/evaluation/audit metadata from source is not copied merely because the RFx is clonable.

### `ISS-003-CONC-01` Source is snapshot/reference, not live link
Later edits to source template/prior RFx do not silently rewrite the already-created draft unless canonical template-linking explicitly says so.

## `ISS-005` — Modular RFx builder

### `ISS-005-HP-01` Complete supported module flow
Issuer can move through the type-appropriate modules and preserve entered structured data.

### `ISS-005-STATE-01` Optional modules remain optional
A lightweight RFx is not blocked by empty modules that its type/configuration does not require.

### `ISS-005-UX-01` Operational Workspace integrity
Desktop and mobile use the shared Operational Workspace, Warm Ivory/light canvas, one participant navigation and no new permanent RFx application rail.

### `ISS-005-A11Y-01` Module navigation
All modules, validation findings and primary actions are keyboard reachable with visible focus and meaningful accessible names/status.

## `ISS-006` — Structured requirements

### `ISS-006-HP-01` Requirement field coverage
Issuer can create structured requirements covering representative quantity/schedule/geography/credential/document/commercial cases supported by the converged model.

### `ISS-006-CONC-01` Stable identity across reorder/edit
Reordering or editing requirement text does not create an unrelated responder requirement identity unless canonical versioning intentionally creates a new version.

### `ISS-006-STATE-01` Invalid structured value rejected
Impossible/malformed date, quantity, geography or response requirement fails validation without partial corruption.

### `ISS-006-AUDIT-01` Material requirement change evidence
Material changes preserve lineage sufficient for later response/addendum reconciliation.

### `ISS-006-A11Y-01` Requirement editor semantics
Repeated requirement controls have unique labels/descriptions; drag/reorder functionality has keyboard equivalent or accessible alternative.

## `ISS-007` — Supplier criteria

### `ISS-007-HP-01` Required vs preferred preserved
Issuer can define at least one required and one preferred criterion; projections retain their distinct semantics.

### `ISS-007-INT-01` Capability/credential projection use
Criterion matching consumes Wave 3 structured organization projections rather than parsing private raw profile persistence.

### `ISS-007-PRIV-01` Private evidence withheld
A credential criterion can use an approved credential status/projection without exposing underlying private evidence document.

### `ISS-007-COPY-01` Criterion match is not platform certification
UI never says RFxchange has qualified a supplier merely because profile data appears to meet the criterion.

## `ISS-009` — Evaluation criteria definition

### `ISS-009-HP-01` Define evaluation basis before publish
Issuer can define converged supported criterion types and link them to relevant requirement identities where applicable.

### `ISS-009-CONC-01` Requirement linkage survives ordinary edits
Evaluation criterion linkage does not break because a requirement was reordered/renamed within the same valid version lineage.

### `ISS-009-PRIV-01` Visibility honors publication policy
Responder/public projection shows only the evaluation basis the canonical visibility policy allows; internal future evaluator notes do not exist in or leak from Wave 4 definition.

### `ISS-009-AUDIT-01` Published evaluation basis is historically identifiable
Later evaluation can identify the criterion version/basis that governed the submission.

## `ISS-011` — Structured RFx package

### `ISS-011-HP-01` Package is composition, not generated truth
Issuer overview/scope/requirements/evaluation/attachments are assembled into one canonical structured package.

### `ISS-011-CONC-01` Projection consistency
Issuer preview, participant detail and response-generation inputs reference the same applicable RFx package/version rather than independently copied sections.

### `ISS-011-UX-01` Long package remains navigable
Long RFx content supports section navigation/progressive disclosure without creating a second global navigation shell.

## `ISS-016` — Publish readiness validation

### `ISS-016-HP-01` Ready RFx passes explainably
Valid RFx returns readiness success with no fabricated missing gates.

### `ISS-016-STATE-01` Missing required item blocks publish
Remove a required date/module/requirement/evaluation/response/geography element; readiness identifies exact blocker.

### `ISS-016-AUTH-01` Issuer authority rechecked
User loses publishing authority after opening readiness screen; publish/readiness action requiring authority fails server-side.

### `ISS-016-FAIL-01` Future feature not enabled does not become blocker
If addenda/advanced approval/collaboration feature is not enabled/implemented for this RFx, its absence cannot make basic Wave 4 RFx unpublishable.

### `ISS-016-UX-01` Findings deep-link to remediation
Validation summary can take user to the exact affected module/field; mobile remains usable.

## `ISS-018` — Responder preview

### `ISS-018-HP-01` Preview parity
Preview renders from the same responder-facing projection contract publication will use for the same version/visibility context.

### `ISS-018-PRIV-01` Preview cannot surface issuer-private fields
Internal notes/evidence/admin metadata are absent.

### `ISS-018-CONC-01` Preview version identified
If draft changes after preview, publish uses/revalidates current version and cannot silently publish stale preview content.

### `ISS-018-A11Y-01` Preview readable as responder would encounter it
Headings, requirements, tables/lists and attachment links retain semantic structure and keyboard access.

---

# 11. F3 — Publication, Projection & Product Boundary

## `ISS-019` — Publish RFx

### `ISS-019-HP-01` Authoritative publication
Authorized issuer publishes a ready RFx.

**Expected:** canonical RFx state/version is published and required publication evidence/event exists.

### `ISS-019-AUTH-01` Unauthorized publish denied
Ordinary member or wrong organization cannot publish by calling endpoint directly.

### `ISS-019-IDEM-01` Duplicate publish command
Same publish idempotency key/retry returns the same committed publication outcome; no duplicate RFx/publication event/projection fan-out is created.

### `ISS-019-CONC-01` Draft changes during publish
Concurrent material draft change and publish resolve deterministically against expected version/revision; stale publish cannot silently publish a different version than the user validated.

### `ISS-019-INT-01` Projection fan-out
Published RFx becomes eligible for the canonical opportunity projection/index/map/share/alert consumers according to visibility/geography policy.

### `ISS-019-FAIL-01` Downstream communications failure
Email provider failure does not revert or falsify successful RFx publication; delivery failure is observable/retryable.

### `ISS-019-FAIL-02` Indexing/projection failure
Behavior follows converged synchronous/eventual publication contract; no hidden ambiguity. If asynchronous, canonical published truth remains while failure is observable and retryable.

### `ISS-019-AUDIT-01` Publication evidence
Actor, organization, version, timestamp and relevant visibility/submission mode are durably attributable.

## `ISS-020` — Basic free issuance / advanced gating

### `ISS-020-HP-01` Free basic path
Eligible free organization can complete the approved basic RFx issue path without future Wave 6 billing implementation.

### `ISS-020-INT-01` Capability policy boundary
Advanced capability checks consume a bounded entitlement/capability decision instead of direct payment-provider fields inside RFx domain code.

### `ISS-020-COPY-01` Upgrade does not imply authority
Upgrade messaging never suggests payment makes an RFx more valid, supplier more qualified, organization more credible or provider more official.

### `ISS-020-AUTH-01` Entitlement bypass denied
Client manipulation cannot unlock a gated advanced feature when server policy says not allowed.

## `ACQ-009` — RFx/opportunity share links

### `ACQ-009-HP-01` Public permitted share
Share link resolves to the permitted public opportunity and preserves acquisition intent into registration when required.

### `ACQ-009-PRIV-01` Restricted RFx cannot be exposed by URL possession
Possessing/copying a link never bypasses current visibility/authorization.

### `ACQ-009-AUTH-01` Link creation permissions
Only actors permitted by canonical share policy can issue/revoke controlled share references when issuance itself is restricted.

### `ACQ-009-IDEM-01` Deterministic/revocable behavior
Repeated generation follows canonical link policy without uncontrolled proliferation; revoked/expired link fails safely while canonical RFx remains governed by its visibility policy.

---

# 12. F4 — Opportunity Discovery & Pursuit

## `DSC-004` — RFx search/browse

### `DSC-004-HP-01` Search published opportunities
Participant finds permitted published RFxs and can inspect substantive allowed requirements.

### `DSC-004-PRIV-01` Restricted/unreleased data absent
Search/index results cannot reveal restricted RFx title/details/issuer/location through snippets, counts, filters or error differences where policy forbids exposure.

### `DSC-004-INT-01` Reuse Network discovery
Opportunity discovery consumes the Wave 3 discovery substrate/projection rather than a second unrelated RFx search engine.

### `DSC-004-UX-01` Spatial Workspace map/list/detail sync
Selecting list result highlights/opens the same map opportunity; closing detail preserves viewport/context; mobile uses responsive sheet.

### `DSC-004-A11Y-01` Non-map discovery path
Meaningful opportunity results/actions are available through structured accessible list/detail interactions, not only map markers.

## `DSC-005` — Saved searches

### `DSC-005-HP-01` Save and re-run search
Authorized participant saves criteria and later receives equivalent current search behavior subject to updated data/visibility.

### `DSC-005-AUTH-01` Ownership/scope
User/org cannot read/edit another scope's private saved search by ID manipulation.

### `DSC-005-IDEM-01` Retry save
Repeated create with same idempotency boundary does not create duplicate saved searches unintentionally.

### `DSC-005-INT-01` Limit policy
Free/paid count limits, if applicable, come from commercial capability policy and do not change search ranking/qualification.

## `DSC-006` — Alerts/digests

### `DSC-006-HP-01` Relevant saved-search match
New published RFx matching saved criteria produces the governed alert/digest candidate and correct deep-link context.

### `DSC-006-IDEM-01` Duplicate indexing/event replay
Same RFx/version matching same saved search does not produce duplicate alerts for the same defined recipient/purpose.

### `DSC-006-FAIL-01` Email delivery failure
Match remains true/discoverable; Communications retries/records failure without changing RFx or saved-search state.

### `DSC-006-COPY-01` Alert language
Copy says match/relevance based on criteria; never states recipient is qualified/endorsed/guaranteed eligible.

### `DSC-006-PRIV-01` Visibility re-check before delivery
If RFx becomes restricted before digest rendering, protected data is omitted and deep link rechecks authorization.

## `DSC-007` — Watch opportunities

### `DSC-007-HP-01` Create/remove watch
Authorized participant can watch and unwatch a permitted RFx according to capability policy.

### `DSC-007-AUTH-01` No cross-org watch mutation
Other organization cannot alter private watch relationship.

### `DSC-007-STATE-01` Closed/inaccessible RFx
Watch behavior after RFx closes/restricts follows canonical rules and does not imply continuing protected access.

### `DSC-007-INT-01` Watch is relationship, not RFx copy
Canonical opportunity dates/title remain sourced from RFx projection; watch record stores relationship/preferences only.

## `DSC-008` — Deadline tracking

### `DSC-008-HP-01` Current deadline displayed
Saved/watched/pursued opportunity surfaces canonical current deadline/time-zone representation.

### `DSC-008-CONC-01` Deadline changes
When authoritative deadline/version changes, old reminder schedule is invalidated/reconciled and UI shows current value.

### `DSC-008-IDEM-01` Scheduler replay
Repeated scheduled processing does not send duplicate reminder for same threshold/recipient/RFx version.

### `DSC-008-FAIL-01` Reminder delivery failure
Failure does not change deadline or pursuit state; remains observable through Communications.

## `RSP-001` — Discovery source attribution

### `RSP-001-HP-01` Distinct source labels
Discovered, Potential Match and Invited are shown distinctly based on actual source provenance.

### `RSP-001-COPY-01` No source implies qualification
No label or icon equates source with RFx qualification/endorsement.

### `RSP-001-PRIV-01` Invitation source protected
Invite-only source/reference does not expose inviter/private context to unauthorized users.

## `RSP-002` — Match explanation / requirement summary

### `RSP-002-HP-01` Explain alignment and gaps
Responder sees bounded explanation using permitted issuer requirements plus its own current organization projection.

### `RSP-002-PRIV-01` No other responder data
Explanation never uses/discloses competing organizations' private profiles, responses or pursuit decisions.

### `RSP-002-INT-01` Missing evidence semantics
Unknown/unverified profile data is represented as unknown/confirmation-needed according to canonical rules, not automatically fabricated pass/fail.

### `RSP-002-COPY-01` Explanation humility
“Potential match,” “appears aligned,” “confirm” or equivalent bounded language; no guaranteed eligibility.

## `RSP-003` — Go/No-Go workspace

### `RSP-003-HP-01` Private assessment persists
Responder records supported fit/capacity/economic/gap considerations and returns to them.

### `RSP-003-PRIV-01` Issuer cannot see private notes
Issuer/network search/API cannot infer content or existence beyond any separately governed pursuit fact.

### `RSP-003-UX-01` Decision focal action
Operational Workspace clearly leads to Pursue/Watch/Decline without dense dashboard/card-grid treatment.

### `RSP-003-A11Y-01` Structured assessment usable without pointer
All controls, status and decision actions keyboard/screen-reader accessible.

## `RSP-004` — Pursue / Watch / Decline

### `RSP-004-HP-01` Record supported decisions
Each supported decision produces the canonical participation relationship/state and corresponding workspace behavior.

### `RSP-004-AUTH-01` Organization-scoped decision
Wrong organization cannot change another organization's pursuit state.

### `RSP-004-STATE-01` Invalid decision after close/restriction
Server rejects or reconciles action according to current RFx state/visibility.

### `RSP-004-CONC-01` Competing decisions
Two near-simultaneous decision changes resolve deterministically with durable final state/history as canonicalized.

### `RSP-004-PRIV-01` Decline reason/privacy
Private decision rationale is not issuer-visible unless a future explicit feature governs shared feedback.

---

# 13. F5 — Gap, Partner & Resource Resolution

## `DSC-010` — Partner discovery

### `DSC-010-HP-01` Gap-scoped search
Partner search can identify permitted organizations using missing capability/service geography/role context.

### `DSC-010-INT-01` Reuse organization discovery
Uses Wave 3 organization discovery/search projections rather than a parallel RFx-only organization database.

### `DSC-010-PRIV-01` Candidate data bounded
Results expose only permitted market profile/geography/credential projections; private evidence/location withheld.

### `DSC-010-UX-01` Context-preserving Spatial transition
Opening partner discovery from pursuit preserves RFx/gap context and returns user to the same transaction without losing map state unnecessarily.

## `RSP-006` — Gap assessment

### `RSP-006-HP-01` Known/unknown/missing distinction
Fixture produces at least one confirmed alignment, one unknown/unconfirmed item and one actual missing capability/criterion.

### `RSP-006-INT-01` Provenance-aware profile inputs
Consumes structured capability/credential/geography projections with status/provenance where required.

### `RSP-006-COPY-01` Unknown is not failure
Missing evidence or absent profile enrichment is not automatically labeled unqualified unless the canonical criterion truly makes it a failure.

### `RSP-006-PRIV-01` Gap remains responder-private
Issuer cannot query organization-specific gap analysis before a governed submission/disclosure event.

## `RSP-007` — Find teammate from gap

### `RSP-007-HP-01` Launch scoped teammate path
Selected gap opens partner/team discovery with RFx/requirement context carried safely.

### `RSP-007-INT-01` No duplicate search service
Transition consumes `DSC-010` search capability and `TEM-001` RFx workflow rather than implementing a third matching engine.

### `RSP-007-AUTH-01` Gap context does not grant team authority
Possessing navigation/context cannot invite or accept on behalf of another organization.

### `RSP-007-UX-01` Return preserves response/pursuit context
User can return from partner discovery to the originating gap without losing draft assessment state.

## `RSP-008` — Provider assistance from gap

### `RSP-008-HP-01` Relevant resource discovery
Gap context can identify approved providers/resources serving the relevant need/geography.

### `RSP-008-INT-01` Provider domain owns provider truth
Only approved Official Resource Provider/service-profile projections participate; RFx Core does not self-designate providers.

### `RSP-008-PRIV-01` Minimum necessary context
Provider/referral handoff shares only approved need/RFx context and consented nonpublic information.

### `RSP-008-COPY-01` Recommendation is not endorsement/eligibility guarantee
UI says relevant provider/resource, not guaranteed acceptance or verified solution.

### `RSP-008-STATE-01` Provider decline does not fail RFx requirement
Assistance lifecycle outcome does not automatically rewrite requirement completion/qualification.

---

# 14. F6 — Response Construction & Submission

## `RSP-009` — Requirement-driven response workspace

### `RSP-009-HP-01` Pursue creates/opens response
After legitimate Pursue decision, responder can enter one organization-owned response workspace linked to current RFx/version.

### `RSP-009-AUTH-01` Wrong organization cannot open/mutate response
Cross-org user denied even with response/RFx IDs.

### `RSP-009-STATE-01` Response cannot be created when canonical RFx state forbids it
Closed/restricted/not-yet-open equivalent condition is enforced server-side.

### `RSP-009-PRIV-01` Draft remains responder-private
Issuer and unrelated participants cannot query response draft.

### `RSP-009-CONC-01` Single response identity per canonical relationship
Repeated entry/retry does not accidentally create multiple working responses for the same responder/RFx when the model intends one.

## `RSP-010` — Compliance matrix

### `RSP-010-HP-01` Every required response element represented
Matrix reflects applicable issuer requirements/response instructions and completion state.

### `RSP-010-CONC-01` Requirement version change handled explicitly
If applicable RFx version changes, matrix does not silently retain stale “complete” status against changed requirement; canonical reconciliation/acknowledgment rules apply.

### `RSP-010-UX-01` Exact remediation
Selecting incomplete matrix item navigates to the linked response section/field.

### `RSP-010-A11Y-01` Matrix semantics
Table/list structure exposes requirement, status and action to screen reader; status not conveyed by color alone.

## `RSP-017` — Continuous completeness validation

### `RSP-017-HP-01` Missing components identified
Fixture with missing answer/attachment/pricing/credential returns explicit findings.

### `RSP-017-STATE-01` Conditional future inputs
Team/addendum acknowledgment checks run only when canonical RFx configuration/version requires them; absent future feature never creates false blocker.

### `RSP-017-CONC-01` Current credential/profile change
Validator re-evaluates current required evidence according to canonical snapshot/current-state rules; historical submitted evidence is not rewritten.

### `RSP-017-FAIL-01` Projection dependency unavailable
Validator fails safely/explicitly rather than treating missing provider/profile data as a successful check.

## `RSP-018` — Final administrative validation

### `RSP-018-HP-01` Valid response receives ready decision
Server verifies current RFx/version/deadline/submission mode/required components.

### `RSP-018-AUTH-01` Submit authority rechecked
User loses relevant authority before final validation/submit; action cannot proceed on stale browser state.

### `RSP-018-STATE-01` Deadline closed between page load and validation
Final server validation blocks hosted submit/external-ready action according to canonical rule.

### `RSP-018-CONC-01` RFx version changed
Stale response readiness cannot authorize submission against superseded version; user receives explicit reconciliation requirement.

## `RSP-019` — Final response review

### `RSP-019-HP-01` Canonical assembled projection
Final review renders pricing/answers/attachments/team/representations/addenda only as applicable from the canonical response and linked artifacts.

### `RSP-019-PRIV-01` No issuer visibility before governed submission
Review rendering does not create issuer-facing copy/projection.

### `RSP-019-UX-01` Review-to-edit round trip
User can jump from issue/review section to source response field and return without creating a second editable proposal record.

### `RSP-019-A11Y-01` Final attestations accessible
All confirmations/representations have explicit labels, errors and keyboard path.

## `RSP-020` — Hosted submission

### `RSP-020-HP-01` Accept, lock and receipt
Valid hosted submission produces one accepted immutable submission version plus receipt/evidence.

### `RSP-020-AUTH-01` Unauthorized submit denied
User lacking converged submit authority cannot submit even if they can edit response.

### `RSP-020-IDEM-01` Retry after unknown client outcome
If client times out after server commit and retries same idempotency key, server returns same accepted submission/receipt rather than creating duplicate submission.

### `RSP-020-CONC-01` Deadline/version changes during submit
Acceptance transaction uses canonical server time/version and deterministic concurrency guard; stale response cannot slip through because browser believed it was valid.

### `RSP-020-AUDIT-01` Receipt evidence
Receipt identifies RFx, responder organization, submission/version, accepted timestamp and other canonical evidence without mutable ambiguity.

### `RSP-020-FAIL-01` Receipt email fails
Submission remains valid; in-product receipt remains accessible; Communications handles retry/failure separately.

### `RSP-020-PRIV-01` Sealing/release parameterized
Issuer visibility follows converged sealing/release policy. Test suite must prove no earlier content access than policy allows.

## `RSP-021` — External submission handoff

### `RSP-021-HP-01` Prepare and route
Valid response can produce approved package/instructions and open/route to external authority.

### `RSP-021-COPY-01` No false receipt claim
Immediately after route, UI/history says prepared/handoff/opened as applicable—not externally submitted/received/accepted.

### `RSP-021-IDEM-01` Repeated route action
Repeated handoff can be recorded according to canonical policy without fabricating multiple external submissions.

### `RSP-021-AUDIT-01` Handoff evidence
Retains RFx/response/package version, destination/instructions version, actor and timestamp sufficient to explain what RFxchange actually did.

### `RSP-021-STATE-01` Deadline/state recheck
External handoff action uses current RFx/deadline/instructions; stale destination/version is not presented as authoritative without warning/reconciliation.

---

# 15. F7 — RFx Teaming & Team Acquisition

## `TEM-001` — RFx-scoped teammate search

### `TEM-001-HP-01` Search from RFx gap
Team lead finds candidate organizations using missing capability/geography/role context.

### `TEM-001-INT-01` Correct dependency substrate
Implementation uses `RSP-006` gap + reusable `DSC-010` discovery, not Wave 5 `DSC-009` recommendation requirement.

### `TEM-001-PRIV-01` Search does not expose candidate private evidence
Only approved organization projection is visible.

### `TEM-001-UX-01` RFx context remains visible but bounded
User can understand which opportunity/gap the search supports without exposing protected RFx content to unauthorized candidate organizations.

## `TEM-002` — Team invitation

### `TEM-002-HP-01` Invite legitimate candidate
Authorized actor creates one RFx-scoped invitation with proposed role/capacity and minimum necessary RFx context.

### `TEM-002-AUTH-01` Inviter authority rechecked
User cannot invite on behalf of organization they do not represent/are no longer authorized to represent.

### `TEM-002-PRIV-01` Token/link possession not authority
Invitation URL allows only the canonical invitation-entry/review path; it cannot grant organization membership, response edit rights or protected RFx data by itself.

### `TEM-002-IDEM-01` Retry invite
Same explicit invitation command/idempotency key does not create duplicate invitation or duplicate first notification.

### `TEM-002-AUDIT-01` Invitation evidence
Records inviter organization/user, invitee target/reference, RFx, proposed role/capacity, version/context and time.

## `TEM-003` — Invitee review and accept/decline

### `TEM-003-HP-01` Accept
Correct invitee organization reviews permitted context and accepts, producing only the canonical RFx team participation relationship.

### `TEM-003-HP-02` Decline
Correct invitee can decline; inviter receives permitted lifecycle state; decline does not expose private reasoning unless explicitly shared.

### `TEM-003-AUTH-01` Wrong organization cannot accept
Authenticated user from another organization with copied invite URL cannot accept for intended organization.

### `TEM-003-STATE-01` Revoked/expired/already-resolved invite
Action fails safely/idempotently with truthful current state.

### `TEM-003-IDEM-01` Double accept
Retry does not create duplicate participation records/notifications.

## `TEM-004` — Nonbinding boundary

### `TEM-004-COPY-01` Explicit legal boundary
Invitation/review/acceptance UX clearly states platform team participation is not itself a subcontract, JV, teaming agreement, mentor-protégé relationship or other legal contract.

### `TEM-004-A11Y-01` Boundary is perceivable
Disclaimer/acknowledgment is available to screen-reader/keyboard users and not hidden solely in tooltip/hover text.

### `TEM-004-AUDIT-01` Evidenced presentation where canonical rules require
If acceptance requires acknowledgment, durable evidence records version/presentation/action; notification read state cannot substitute.

## `ACQ-007` — External team invite acquisition

### `ACQ-007-HP-01` External invite resumes after activation
Non-member follows invitation, registers, completes legitimate account/organization activation, then returns to still-valid invitation/opportunity context.

### `ACQ-007-AUTH-01` Registration does not accept invite
Account creation/activation alone cannot create team participation or response authority.

### `ACQ-007-PRIV-01` Pre-auth projection bounded
External recipient sees only minimum context permitted before authentication/organization resolution.

### `ACQ-007-IDEM-01` Replay/stale acquisition context
Used/expired/revoked/tampered context cannot create duplicate participation or restore unauthorized access.

### `ACQ-007-INT-01` Reuse acquisition + communications foundations
Uses Wave 2 typed acquisition continuity and Wave 3 transactional Communications; no separate team-signup stack.

---

# 16. F8 — Just-in-Time RFx Education

## `EDU-011` — First RFx creation education

### `EDU-011-HP-01` First-use issuer education appears contextually
First eligible issuer sees concise education within actual authoring/publish flow.

### `EDU-011-COPY-01` Feature-aware content
Education may explain lifecycle concepts but cannot imply unimplemented Wave 5 addenda/advanced approval controls are available now.

### `EDU-011-UX-01` Does not block experienced users forever
Completion/dismissal follows canonical education policy and does not become a repeated modal obstacle.

### `EDU-011-A11Y-01` Education is accessible
Content/action controls keyboard and screen-reader accessible; not dependent on animation.

## `EDU-012` — First RFx response education

### `EDU-012-HP-01` Response guidance tied to actual mode
Responder education explains requirements/compliance/deadline and hosted vs external submission appropriate to selected RFx.

### `EDU-012-COPY-01` External submission truth
For external mode, education explicitly states RFxchange preparation/handoff does not equal receipt by external authority.

### `EDU-012-UX-01` Contextual, not separate tutorial product
Guidance appears where needed and user can return to actual response work without losing state.

### `EDU-012-A11Y-01` Structured steps/status accessible

## `EDU-013` — First teaming education

### `EDU-013-HP-01` First-use teaming explanation
Relevant first team lead/invitee sees concise explanation of roles/context/nonbinding nature.

### `EDU-013-COPY-01` Does not replace substantive legal boundary
Education and `TEM-004` remain distinct; dismissing education cannot remove required workflow disclaimer/acknowledgment.

### `EDU-013-A11Y-01` Explanation remains perceivable across mobile/desktop and assistive technology.

---

# 17. End-to-end Wave 4 journey acceptance

Feature tests are necessary but insufficient. The following journeys prove contracts connect.

## `E2E-01` Issuer blank RFx → publish → discover

1. authorized issuer starts blank RFx;
2. selects type;
3. completes required package/requirements/criteria/evaluation definition;
4. readiness initially identifies a seeded missing field;
5. issuer fixes it;
6. preview matches responder projection;
7. publish commits once;
8. eligible responder finds RFx through Network discovery/map;
9. anonymous public view, if configured, shows only public projection.

**Required evidence:** no duplicate RFx; publication audit/event; projection visibility; map/list detail integrity; no private issuer leakage.

## `E2E-02` Saved search → alert → opportunity

1. responder saves capability/geography search;
2. matching RFx publishes;
3. match derives once;
4. Communications emits one governed alert/digest item;
5. user deep-links to current permitted opportunity;
6. restricting RFx before click causes access re-evaluation.

## `E2E-03` Potential match → Go/No-Go → pursue

1. RFx surfaces as Potential Match;
2. responder sees explanation with known/unknown/gaps;
3. records private assessment;
4. selects Pursue;
5. response workspace is created/opened under canonical rules;
6. issuer sees none of the private assessment/draft activity.

## `E2E-04` Gap → teammate → existing participant accepts

1. responder gap identified;
2. partner discovery returns candidate;
3. authorized team lead sends invitation;
4. candidate organization reviews minimum context;
5. accepts;
6. participation relation updates once;
7. no legal subcontract/JV state is implied;
8. response-edit collaboration authority, if any, remains separately governed.

## `E2E-05` Gap → teammate → external acquisition

1. team invitation targets non-member;
2. versioned communication sent;
3. invitee follows preserved acquisition context;
4. creates account/organization/authority through normal activation;
5. resumes invitation;
6. accepts explicitly;
7. activation alone never accepts invite.

## `E2E-06` Gap → provider assistance

1. missing credential/resource need detected;
2. RFx passes bounded assistance context to Resource discovery;
3. only approved provider profiles returned;
4. requester consents to provider/referral handoff;
5. provider accepts/declines/redirects in owning domain;
6. RFx requirement remains unchanged unless responder separately satisfies it.

## `E2E-07` Requirement → compliance → hosted submission

1. pursuit response created;
2. every applicable issuer requirement represented in compliance matrix;
3. missing item blocks readiness;
4. user completes item;
5. final server validation passes;
6. final review derives from canonical response;
7. submit commits once;
8. immutable receipt available even if email fails;
9. issuer access follows converged sealing/release policy.

## `E2E-08` Requirement → compliance → external handoff

1. response built;
2. final validation/review passes;
3. package prepared;
4. destination opened/routed;
5. history records handoff only;
6. UI never claims external receipt without external evidence.

## `E2E-09` Deadline changes while responder is active

1. responder has saved/watch/pursuit and response draft;
2. canonical deadline changes under post-publication/version rules;
3. old reminders invalidated;
4. UI shows new deadline/version;
5. stale final-validation result cannot authorize submission;
6. later addendum acknowledgment behavior remains future/convergence-controlled.

## `E2E-10` Authority removed mid-workflow

1. issuer/responder user opens valid workspace;
2. organization permission is removed;
3. stale page still visually contains prior controls;
4. next protected mutation/server fetch denies/reprojects appropriately;
5. notification/deep link later cannot restore authority.

## `E2E-11` Geography visibility changes

1. public/participant RFx visible in released locality;
2. locality/RFx visibility changes to a more restrictive state under canonical governance;
3. search/map/share/deep-link projections update/retire;
4. stale index/digest cannot expose protected detail.

## `E2E-12` Duplicate/replayed events

Replay publication, saved-search match, team invitation communication and hosted-submission communication events.

**Expected:** owning domain facts remain one fact; consumers dedupe per purpose; no duplicate invitation, submission, receipt or required notification.

---

# 18. Security and privacy denial matrix

| Attempt | Expected denial/protection |
| --- | --- |
| Anonymous fetch of private RFx field | Field/object absent or access denied without richer fallback. |
| Authenticated Org H reads Org B response draft | Denied. |
| Issuer reads responder Go/No-Go notes | Denied. |
| Issuer enumerates which organizations started drafts | Not available absent future governed feature. |
| Responder reads competing response/submission | Denied. |
| Team invitee reads RFx protected package before legitimate authorization | Only permitted invitation/public context. |
| Copied invitation accepted by wrong organization | Denied. |
| Provider recommendation exposes credential evidence file | Denied; approved projection only. |
| Search result leaks exact private organization location | Denied/approximate/locality projection only. |
| Share URL accesses RFx after visibility revocation | Current authorization/visibility wins. |
| Paid client flips entitlement flag in browser | Server policy wins. |
| Notification deep link used after membership removed | Access denied/reprojected. |
| External handoff telemetry interpreted as verified submission | Prohibited by domain/API/UI semantics. |

Security test fixtures should verify response payloads as well as UI rendering; hiding a field client-side is insufficient.

---

# 19. Idempotency and replay matrix

| Operation/event | Required idempotency behavior |
| --- | --- |
| Create RFx | Same explicit command key does not create unintended duplicate root. |
| Publish RFx | One publication commit/event per canonical version/action. |
| Save search | Retry does not multiply records unintentionally. |
| Saved-search match | One alert candidate per defined search/RFx-version/recipient purpose. |
| Watch | Repeat create/remove settles on intended relationship without duplicates. |
| Pursuit decision | Retry does not produce conflicting duplicate relationships. |
| Create response | Repeat entry returns canonical response when model intends one. |
| Team invitation | One invitation per explicit command key; delivery replay separate. |
| Accept/decline invitation | Repeat returns current resolved state; no duplicate participation. |
| Provider/referral request | Owning domain dedupes according to request key. |
| Final validation | Re-running is safe and reflects current state. |
| Hosted submission | Retry after timeout returns same accepted submission/receipt. |
| Receipt communication | Delivery replay does not create another submission/receipt. |
| External handoff | Repeat may record governed attempts, but never fabricated external submissions. |

---

# 20. Concurrency and versioning matrix

| Race/change | Required behavior |
| --- | --- |
| Two issuer users edit same requirement | Detect/reconcile according to canonical optimistic/transaction strategy; no silent lost update. |
| Type changes while modules edited | Incompatible content handled explicitly; no invisible orphan corruption. |
| Publish while another actor saves material edit | Publish uses expected version/revision or rejects stale operation. |
| Visibility changes while search index serves old projection | Protected access re-check prevents stale projection from granting protected detail; retirement/reindex observable. |
| Profile credential changes during pursuit | Current assessment updates according to projection/snapshot rules; historical submission evidence unaffected. |
| Team invitation revoked while invitee accepts | One deterministic final outcome based on authoritative transaction/version. |
| RFx deadline passes while submit request in flight | Server time/transaction determines acceptance; client clock irrelevant. |
| RFx version changes after readiness pass | Old readiness cannot authorize current submit. |
| User permission removed during submit | Authority checked at consequential action transaction. |
| Hosted submission retry after commit | Same receipt returned. |

---

# 21. Integration failure/degradation matrix

## Discovery/index unavailable

Published RFx behavior follows converged synchronous/eventual contract. Direct canonical route never serves a richer unauthorized record as a fallback.

## Map projection unavailable

Opportunity may remain discoverable through permitted structured list/detail where contract allows; no fake marker or arbitrary coordinates.

## Organization profile projection unavailable

Match/gap assessment fails as unknown/unavailable where needed; it must not label missing projection as satisfied.

## Communications provider unavailable

RFx/team/submission fact remains committed; retry/terminal failure observable; no duplicate business action on retry.

## Provider/resource search unavailable

Responder sees recoverable assistance-search failure; RFx requirement/pursuit state remains unchanged.

## External destination unavailable

RFxchange reports inability to complete handoff/open destination; never records external submission.

## Commercial-policy service unavailable

Fail according to converged capability policy, preserving core free-path availability where safe; never default to paid authority for substantive actions.

---

# 22. Responsive UX acceptance

Browser acceptance should cover at least:

- desktop `1440×900`;
- intermediate `900×800` or equivalent;
- mobile `390×844` or current canonical compact fixture.

## Spatial Workspace cases

Opportunity and partner/resource discovery must verify:

- one participant navigation;
- map fills remaining spatial viewport;
- search/filter affordance not duplicated;
- selected result and map object synchronized;
- edge drawer becomes usable mobile sheet;
- map context remains visible where possible;
- private location projection remains consistent at every width;
- no horizontal overflow;
- no permanent participant left rail or stacked route/map headers.

## Operational Workspace cases

RFx Builder, Pursuit, Response, Readiness and Submission must verify:

- Warm Ivory/light default participant canvas;
- transaction context remains compact;
- long sections reflow rather than shrink desktop columns;
- primary action thumb-reachable on mobile when appropriate;
- compliance/readiness status remains legible without dense dashboard card grid;
- validation messages remain near source and in summary;
- final review/attestation remains usable without horizontal scrolling.

---

# 23. Accessibility acceptance

Target WCAG AA behavior consistent with the design system.

Required Wave 4 checks include:

1. all primary/secondary actions keyboard operable;
2. visible focus treatment;
3. semantic heading structure in RFx package/response review;
4. tables/matrices expose row/column/status semantics;
5. status is never color-only;
6. map objects have structured accessible list/detail equivalent;
7. icon-only controls have accessible names;
8. error summaries link/focus to affected field where appropriate;
9. dialogs/sheets manage focus and return it predictably;
10. touch targets generally 44px or appropriate canonical minimum on mobile;
11. reduced motion does not hide state change;
12. deadline/time/status language is readable by assistive technology;
13. legal/nonbinding disclaimers are perceivable without hover;
14. external-vs-hosted submission distinction is conveyed in text, not color/icon alone;
15. dynamically updated readiness status announces meaningfully without excessive live-region noise.

---

# 24. Claims and semantic-copy acceptance

Automated/static checks may cover key prohibited equivalences where practical; browser/content review should cover full context.

| Product fact | Copy may say | Copy must not imply |
| --- | --- | --- |
| Search overlap | relevant / matches saved criteria | qualified / approved supplier |
| Potential Match | potential match / alignment to confirm | guaranteed fit / recommended winner |
| Credential self-report | reported / unverified / status per provenance | Verified unless Credibility domain says so |
| Official Resource Provider | approved provider role/status | Verified/Trusted merely because provider approved |
| Team invitation accepted | participating in RFx team context | legal JV/subcontract/team agreement |
| Hosted submission received | submitted/received by RFxchange when authoritative | selected/accepted for award |
| External handoff | prepared/routed/opened | received/submitted by external authority |
| Paid feature | additional capability/limit | higher trust/qualification/ranking by default |
| Decline | not pursuing | unqualified unless reason actually establishes that fact |

---

# 25. Audit/evidence acceptance

Consequential transactions should preserve sufficient evidence without storing unnecessary private payload copies.

Minimum candidates for durable evidence:

- RFx creation identity/source;
- material requirement/evaluation-definition version lineage;
- publish readiness result/version;
- publication actor/time/version/visibility/submission mode;
- team invitation create/resolve;
- relevant nonbinding acknowledgment if required;
- final validation result/version;
- hosted submission acceptance/receipt;
- external handoff action;
- privileged/admin overrides when later authorized.

Audit history must not be erased merely because current state changes.

---

# 26. Future Wave 5 seam acceptance

Wave 4 must not implement these features, but its data/events should make them possible without reconstructing history.

## Q&A

Wave 4 RFx identity/version/participant model must support future questions linked to the correct RFx and governed visibility.

## Addenda/versioning

Stable requirement IDs plus RFx version lineage must support determining what changed and which responder work/acknowledgments are affected.

## Evaluation

Published evaluation criteria + immutable submitted response/requirement lineage must support evaluator assessment without reverse-parsing a generated document.

## Clarifications

Submitted response identity must support future governed clarification without rewriting historical submission.

## Selection/award/connect

RFx type and submission identities must support outcomes where there may be one winner, multiple selections, a connection/no-award result, or no selection concept at all.

## Outcome/credibility/intelligence

Wave 4 events may become provenance inputs, but no Wave 4 test should expect a Credibility badge or verified economic outcome merely from RFx participation.

---

# 27. Test-data privacy requirements

Automated fixtures must not rely on real customer/business secrets, private credentials, production email addresses or uncontrolled external portals.

- provider adapters use doubles/mocks unless a controlled acceptance environment explicitly requires integration;
- external submission URLs use fixtures/safe targets;
- notification tests use controlled recipients/sinks;
- credential evidence uses synthetic files;
- geography fixtures may use public authoritative locality geometry but organization-level private coordinates are synthetic/test-owned;
- logs/snapshots used by tests must not dump secrets or private evidence unnecessarily.

---

# 28. Slice-level completion template

Each future Wave 4 slice brief should instantiate a subset of this matrix and report:

1. **Feature IDs addressed**;
2. **Scenario IDs adopted** from this matrix;
3. **New slice-specific scenarios** required by final architecture;
4. **Domain/unit tests** added;
5. **Security/emulator tests** added;
6. **Contract/integration tests** added;
7. **browser viewport/interaction evidence**;
8. **accessibility evidence**;
9. **idempotency/replay evidence** for consequential actions;
10. **failure/degradation evidence** where external domains/providers are involved;
11. **tracker evidence** only after full feature acceptance passes;
12. **explicit non-scope confirmation** for later slices/waves.

A feature should not be marked Done because adjacent implementation incidentally touched its UI.

---

# 29. Candidate automated test suites

Final names should follow repository conventions, but the architecture suggests suites such as:

```text
rfx-domain
rfx-authoring
rfx-publication
rfx-projections
rfx-discovery
rfx-pursuit
rfx-gap-routing
rfx-response
rfx-submission
rfx-teaming
rfx-acquisition-continuity
rfx-notifications
rfx-security
rfx-workspace-design
rfx-accessibility
```

Cross-domain contract fixtures should be shared where practical so the same projection semantics are tested at producer and consumer boundaries.

---

# 30. High-value findings for Extra High convergence

## 30.1 Response secrecy must become an explicit acceptance contract

The architecture must decide exactly when an issuer can know a responder exists, a response exists, and submission content becomes visible. Tests should treat pre-release leakage as a security/privacy defect, not a UI detail.

## 30.2 Publication needs an expected-version/idempotency contract

Readiness/preview and publish must agree on the version being published. Without this, concurrent issuer edits can make “preview exactly what responders see” untestable.

## 30.3 Hosted submission needs a transaction boundary

Final validation, deadline check, authority check, response freeze, submission acceptance and receipt generation need a clearly defined atomic/idempotent boundary so timeout/retry cases are deterministic.

## 30.4 Requirement identity is the backbone of later testing

Requirements must remain addressable across authoring, responder compliance, version reconciliation and later evaluation. Otherwise Wave 5 will require brittle text matching.

## 30.5 Watch/Pursue/Decline ownership affects several suites

Discovery alerts, deadlines, response creation and privacy tests need one canonical participation model rather than three feature-specific flags.

## 30.6 Geography has multiple independent meanings

Performance location, visibility/distribution geography, issuer location, responder service geography and provider territory require separate fixtures/tests. A generic `location` field would make correct authorization/matching impossible to prove.

## 30.7 External submission requires negative assertions

Testing only “external portal opened” is insufficient. The suite must actively assert that no `SubmissionReceived`/receipt/issuer-received notification was created from the handoff alone.

## 30.8 Team participation and response collaboration must stay separate unless convergence intentionally joins them

Accepting a team invitation should not accidentally grant edit/submit authority merely because the UI enters the same RFx context.

## 30.9 Notification/deep-link tests must re-evaluate current access

Testing that a generated link initially works is insufficient; remove membership/restrict RFx after issuance and prove the link no longer grants protected access.

## 30.10 Future addenda must invalidate stale readiness/reminders deterministically

Wave 4 should preserve enough version/time identity that Wave 5 can invalidate responder completeness and old scheduled reminders without guessing which requirement changed.

---

# 31. Questions reserved for Extra High convergence

1. What exact RFx root/lifecycle states are canonical in Wave 4?
2. What exact transition preconditions/terminal states exist by RFx type?
3. What optimistic-concurrency/version token is used for draft authoring and publish?
4. What is the canonical RFx version identity before and after publication?
5. Can RFx type change after substantive authoring, and under what reconciliation rules?
6. Which modules are required by each supported Wave 4 RFx type?
7. What requirement answer/input types are canonical in Wave 4?
8. What counts as a material requirement change?
9. Which supplier criteria are public, responder-visible, hidden, or future-only?
10. Are any supplier criteria hard eligibility gates in Wave 4, or only matching/readiness signals?
11. What evaluation-criterion methods/weights are supported in Wave 4 definition?
12. What is the exact visibility taxonomy for public/authenticated/restricted RFxs?
13. Which publication side effects are transactional versus eventual?
14. What publication idempotency/expected-version boundary is canonical?
15. Who owns Watch/Pursue/Decline persistent state?
16. Is that state user-scoped, organization-scoped, or both?
17. When exactly is a Response object created?
18. Is there exactly one active Response per responder organization/RFx/version?
19. Which organization roles can edit a response?
20. Which role/permission can submit?
21. Does team participation grant any response collaboration authority automatically?
22. Can a teammate belong to the response without having edit rights?
23. What response elements are snapshotted from the RFx at creation versus referenced live?
24. How are RFx version changes reconciled into an in-progress response?
25. Are hosted submissions sealed from issuers until deadline/explicit release?
26. When does an issuer first learn that a hosted submission exists?
27. Can Wave 4 hosted submissions be withdrawn or replaced before deadline?
28. If replacement is allowed, what happens to receipt/version history?
29. What exact atomic transaction defines hosted submission acceptance?
30. What canonical server-time/time-zone rules govern deadlines?
31. What happens to an in-flight submission crossing the deadline boundary?
32. What external-handoff evidence may be recorded without becoming submission proof?
33. Can external submission status later be user-reported in Wave 4, or future-only?
34. What team invitation expiry/revocation model applies?
35. Is invitation acceptance organization-level, user-level acting for org, or both in representation?
36. What exact nonbinding acknowledgment evidence is required?
37. What data is visible to an external invitee before activation?
38. How long may acquisition context survive and what replay protections apply?
39. Which opportunity match/reminder notifications are immediate versus digestable?
40. Which RFx users receive issuer/responder notifications by default?
41. Does Wave 4 include a durable in-product notification center or only contextual UI + email?
42. What post-publication edits require addendum/version mechanics and therefore remain Wave 5?
43. How does locality release-state change affect already-published RFxs?
44. Which organization profile/credential facts are snapshotted at submission?
45. What exact evidence is required before a later Credibility system may consume an RFx event?

---

# 32. Exit condition for this planning lane

This planning lane is complete when:

- all **41 Wave 4 Feature IDs** have a primary acceptance owner;
- cross-cutting security/privacy/idempotency/versioning/failure/UX/accessibility requirements are explicit;
- end-to-end scenarios cover the core issuer → publication → discovery → pursuit → gap → teaming/resource → response → hosted/external submission journey;
- unresolved architecture is parameterized rather than silently decided;
- future Wave 5 seams are testable without being implemented;
- no tracker status, dependency authority or production behavior changed as part of this document.

The later RFx Core convergence pass should reconcile this matrix with A–D, settle the reserved questions, then use the resulting canonical acceptance contracts to define final Wave 4 slice briefs and automated validation gates.
