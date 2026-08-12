# Resources Completion Inventory 01

**Packet:** `WP-RES-INVENTORY-01`  
**Lane:** 04 — Resources  
**Packet status at activation:** `active`  
**Activation base:** `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`  
**Activation epoch:** `initial-operational-2026-08-12`  
**Inventory branch:** `codex/resources-completion-inventory-01`  
**Inventory working base:** `69daa4bea80b39cc9d5ed04715aa6e2ac8e1f068`  
**Scope:** authority-to-runtime inventory only; no production Resources gap implementation.

## 1. Authority and stop boundary

This inventory consumes the Four-Lens program authority, machine requirements, Shared Exchange contracts, Independent Acceptance protocol, Resources/Referrals completion inventory, Exchange Interaction Architecture, Slice 3.6 and 3.7 Resource Provider/Resource Network authorities and evidence, current design/map/content authorities, Master Build Tracker, Dependency Map, and actual current runtime.

The packet does **not**:

- change production Resources runtime;
- change the Master Build Tracker or Dependency Map;
- promote any requirement to `Verified`;
- treat Wave 3 Feature-ID completion as complete Resources-lens evidence;
- invent provider status, services, eligibility, availability, capacity or geography;
- create a private replacement for a Shared Exchange contract; or
- begin `RES-006`, `ADM-071`, RFx Slice 4.7, or any later Resource/RFx capability.

Only Lane 06 can produce Four-Lens `Verified`.

## 2. Inventory result

The ten in-packet requirements resolve from current authority/runtime as follows:

| Requirement | Registry status entering packet | Inventory disposition | Result |
| --- | --- | --- | --- |
| `RES-LENS-001` | Implemented — Not Verified | **Present** | `/resources` is an authorized OPEN-participant Resources lens. A non-provider can discover only current eligible published Official Resource Providers and minimized published resources. |
| `RES-LENS-002` | Implemented — Not Verified | **Partial** | The complete provider lifecycle and authorized actions exist in `/provider-application`, but the required **own-organization Resources interaction** does not project the exact application lifecycle/next action. `/resources` exposes owner management only when an approved service profile exists. |
| `RES-LENS-003` | Implemented — Not Verified | **Present** | Approved-provider management is gated by current provider status/profile, organization authority, restrictions and `resource.manage`; non-providers do not receive provider publication/resource management actions in Resources. |
| `RES-LENS-004` | Implemented — Not Verified | **Partial** | Current approved/published provider facts, eligibility, intake and maintained availability are server-derived and rendered, with truthful match reasons. However selected-provider detail does not visibly identify the approved/published provider state or participant-facing provenance/update facts even though publication/profile versions and timestamps exist in the minimized projection. |
| `RES-LENS-005` | Implemented — Not Verified | **Present** | Service territory is server-derived from authoritative controlled geography, rendered as a service field separate from the office/organization marker, and has a structured textual alternative. Cross-geography providers do not receive fabricated local marker coordinates. |
| `RES-LENS-006` | Implemented — Not Verified | **Present** | Participants see only minimized resources from current published provider/resource projections. Draft/withdrawn/expired/suppressed resources do not enter discovery; resource lifecycle and source organization remain server-owned. |
| `RES-LENS-007` | Implemented — Not Verified | **Present** | Provider requests reuse the exact referral aggregate, require explicit recipient/minimum-sharing consent, and expose request-scoped messages only to the exact requester/provider organizations under current authority. |
| `RES-LENS-008` | Implemented — Not Verified | **Present; shared acceptance dependency remains** | Resources consumes the shared scoped spatial context and preserves selected organization/camera directly into and out of the lens. Provider actions activate only for an eligible current provider projection. Independent verification still depends on Shared Exchange acceptance; this packet does not duplicate or widen the active Shared correction. |
| `RES-LENS-009` | Not Started | **Missing** | No Resources save/star relation, server persistence contract, participant mutation or rendered save/star action is present. Search found only the requirement/authority references, not a Resource saved-object implementation. |
| `RES-LENS-010` | Not Started | **Present; registry reconciliation required** | `/resources` already lists the participant's provider-connection requests, projects the current typed lifecycle/status, opens the selected request, shows delivery-unknown truth where applicable, and exposes authorized request communication history/actions. The current program status is therefore stale relative to runtime evidence; no production implementation is required merely to satisfy the inventory finding. |

**Inventory arithmetic for `RES-LENS-001`–`010`: 7 Present · 2 Partial · 1 Missing.**

This is an inventory characterization, not an Independent Acceptance numerator. Current machine statuses remain unchanged by this packet.

## 3. Requirement evidence

### `RES-LENS-001` — Present

**Requirement:** A non-provider organization can find approved providers and published resources through the permanent Resources lens.

Current `/resources` first resolves authenticated participant authority, access-resolution state, activation, organization mismatch, restrictions and OPEN lifecycle. It then loads the server-authorized map/network projection and Resource discovery. The viewer organization does not need Official Resource Provider status to consume discovery.

`ResourceNetworkService.discover()` includes a provider only when the source organization currently has Official Resource Provider status, an active provider profile, Profile Complete, no blocking restriction, an explicit published discovery projection bound to the current profile version, permitted released service geography, and at least one visible maintained service. Only resources belonging to an eligible discovered provider and the selected geography can project to the participant.

Historical configured-browser evidence from accepted Slice 3.7 exercised a separate requester organization that discovered an approved provider and its published resource. The exact Slice 3.7 PR head `0776aaf59856dd5ab2ef5f8fe3b8e9eec5713cbe` passed production CI run `31300282317`.

### `RES-LENS-002` — Partial

**Requirement:** Own-organization Resources interaction projects the exact provider application lifecycle and authorized next action without invented states or remedies.

The Resource Provider domain itself is implemented correctly. `/provider-application` exposes `Not started`, the actual application status, Official Resource Provider status, draft editing/submission, information-request response/resubmission, read-only review states, denial/history and approved-profile maintenance. The governed lifecycle remains:

```text
draft → submitted → under-review → information-requested → resubmitted
                    ├────────────────────────────────────→ approved
                    └────────────────────────────────────→ denied
```

The gap is composition inside the Resources lens. `app/resources/page.tsx` loads `ownerSnapshot()`, but `ResourceNetworkWorkspace` drops `providerStatus` from its `Owner` type and never loads/presents the provider application aggregate. Its owner section is rendered only when `owner?.serviceProfile` exists, so no-application, draft, submitted, under-review, information-requested, resubmitted and denied organizations receive no exact Resources-lens lifecycle/next-action treatment.

This is a real experience gap even though the backend/provider application workspace exists. No new lifecycle state or provider authority is needed to correct it.

### `RES-LENS-003` — Present

**Requirement:** Only an approved Official Resource Provider receives the currently authorized provider profile, service/resource, geography, eligibility/intake, availability and request management actions.

Resource owner snapshot and mutations are protected by organization operation authorization. Provider discovery publication and provider resource mutations additionally require current `official-resource-provider` status, an active service profile, Profile Complete, current service geography and no blocking restriction. Resource service/geography values must remain inside the provider's current profile.

The current Resources owner-management UI appears only for an organization with a service profile and exposes only existing publication/resource/invitation capabilities. Approval does not create Organization Verification, credibility, paid prominence or inferred capacity.

### `RES-LENS-004` — Partial

**Requirement:** Provider discovery and detail show current approved/published provider state, eligibility, intake, availability and provenance without implying endorsement or acceptance.

The server projection contains current publication/profile version identity plus `publishedAt` and `updatedAt`, and eligibility, intake, provider/service availability, territory and deterministic relevance reasons. Eligibility of the projection itself is re-evaluated from current provider, profile, organization, restriction, geography and publication state.

The selected-provider UI renders maintained availability, territory, provider identity, populations served, eligibility, intake, languages, modalities and per-service availability, then requires explicit consent before a request. It does not claim verification, guaranteed eligibility, capacity, acceptance or outcome.

The missing portion is participant-facing state/provenance: the detail does not visibly say that the record is a current **Official Resource Provider** / published provider projection and does not render a safe update/provenance statement from the existing publication timestamps. Backend provenance alone does not satisfy a participant-facing detail requirement.

A later correction must present only safe participant provenance; raw internal source version IDs are not required to be exposed.

### `RES-LENS-005` — Present

**Requirement:** Resources distinguishes provider service territory from office/base location and respects controlled geography and privacy-safe projection.

The provider territory derives from the approved profile's authoritative service geography and selected released locality geometry, not an address-derived client polygon. `ExchangeSpatialScene` receives service fields independently from organization markers. The accessible alternative explicitly states that a provider serves the named territory and that the field is separate from the provider's office marker.

When an eligible provider serves the active geography but has no permitted organization marker there, the provider can remain selected through its territory/detail while shared organization-marker focus safely returns to the participant's real home marker. No local marker is fabricated.

### `RES-LENS-006` — Present

**Requirement:** A participant can inspect published provider resources and use only the authorized resource lifecycle/projection.

Provider resources have explicit `draft`, `published`, `withdrawn`, and `expired` lifecycle state plus moderation. `publicProviderResource()` returns only a currently published, non-expired, non-suppressed minimized projection. The Resources page lists those projections with provider identity, kind, summary and a safe intake link when present.

Provider creation/publication/withdrawal requires current provider authority and `resource.manage`. Direct browser Firestore access remains denied.

The current presentation is intentionally compact; the requirement does not authorize projecting private draft detail, moderation internals or provider evidence.

### `RES-LENS-007` — Present

**Requirement:** A permitted participant can initiate a consented minimum-necessary provider connection/request and both parties see only their authorized request-scoped communication.

The participant selects a currently discoverable provider/service, supplies a bounded summary and must explicitly acknowledge sharing only the requester organization name and summary with the exact provider. The provider request is a `provider-connection` purpose on the existing referral aggregate, bound to provider organization, service and publication version.

Message reads require `referral.manage` plus exact participation as sender or attached provider recipient. Message writes require the request to be in a permitted state and re-check current provider eligibility. Author user identity is removed from the participant message projection. Firestore rules deny direct client enumeration/mutation.

### `RES-LENS-008` — Present; shared acceptance dependency remains

**Requirement:** A selected organization and safe camera context persist into and out of Resources while provider-specific actions activate only for an eligible current projection.

Current Resources consumes `useParticipantSpatialContext`, stores Resources search/filter/result/list state, carries organization/provider identifiers as non-authorizing URL state, revalidates selected organizations/providers server-side and preserves camera state. Post-PR-159 configured browser evidence proved the same selected organization and map view across `Intelligence → Resources → Referrals → Intelligence`, including 390px/mobile and reduced-motion behavior.

The Four-Lens Shared ledger still has independent acceptance work, including the separate `SHARED-CONTINUITY-002` focus-link correction. `RES-LENS-008` depends on `SHARED-CONTINUITY-001`; this inventory therefore does not invent a new Resources continuity implementation or a duplicate Shared Contract Request. Lane 06 verification should wait for the relevant Shared contract state to be independently accepted.

### `RES-LENS-009` — Missing

**Requirement:** A participant can save or star a resource without implying provider acceptance or service completion.

No Resource saved/starred aggregate, command, repository, server projection or participant action exists in the current Resource domain/runtime. The current Resource list has no Save/Star control. The governing Exchange Interaction Architecture expressly includes `save/star resources`, so this is not satisfied by provider publication, request state, browser selection or any existing opportunity-watch relation.

The implementation packet must first make the ownership/scope explicit (for example, personal participant relation versus organization-owned relation) rather than borrowing another domain's semantics.

### `RES-LENS-010` — Present; registry reconciliation required

**Requirement:** A participant can track its own resource-related requests through truthful lifecycle/status presentation.

The current Resources lens derives only `provider-connection` referrals for its provider-request area. Each request displays the exact requester/provider counterparty label, current referral status, bounded summary, delivery-outcome-unknown state when applicable and an action to open that request's communication. The exact selected request is server-authorized before messages are loaded.

The provider-request aggregate uses typed statuses:

`draft`, `sent`, `accepted`, `declined`, `redirected`, `contacted`, `closed`, `expired`.

The Resources UI renders the current status for every request and conditionally exposes only actions valid for the participant role/current state. Historical Slice 3.7 configured browser evidence exercised request creation, requester messaging, provider visibility, provider acceptance and reply. Later stabilization preserved the truthful delivery-outcome-unknown state.

Accordingly, `RES-LENS-010` is materially implemented even though its Four-Lens adoption status is `Not Started`. Control Room should reconcile the machine ledger to `Implemented — Not Verified` without treating this inventory as independent acceptance or changing Feature-ID tracker arithmetic.

## 4. Browser/runtime evidence inventory

This packet used durable browser/runtime evidence rather than substituting source inspection for every visual claim:

1. **Slice 3.6 configured participant/admin browser evidence** — current provider application lifecycle, authorization separation, responsive 1280/820/390 layouts, German rendered platform copy, no horizontal overflow and clean browser console; recorded in `docs/architecture/WAVE_3_SLICE_3_6.md`.
2. **Slice 3.7 configured Resource browser evidence** — non-provider requester discovery, real service-territory rendering, explainable match reasons, consented request, requester/provider messages, provider acceptance, provider resource draft→publish and fresh requester discovery, five-locale/static plus German rendered copy, 1280/820/390 responsive evidence and exact cleanup; recorded in `docs/architecture/WAVE_3_SLICE_3_7.md`. Exact head `0776aaf59856dd5ab2ef5f8fe3b8e9eec5713cbe`; production CI run `31300282317` succeeded.
3. **Post-PR-159 configured shared spatial browser evidence** — real Mapbox/WebGL scene, selected organization/camera persistence through Resources and back, mobile sheet fit, keyboard/reduced-motion/five-locale behavior and clean diagnostics; recorded in `docs/architecture/POST_PR_159_PARTICIPANT_EXPERIENCE_CONVERGENCE.md`.
4. **Current-main runtime inspection** — `app/resources/page.tsx`, `ResourceNetworkWorkspace.tsx`, provider application workspace, Resource Network service/model and current Firestore rules were inspected at working base `69daa4bea80b39cc9d5ed04715aa6e2ac8e1f068` so later composition changes are not inferred solely from old screenshots or PR summaries.
5. **Current exact-head CI contract** — repository CI still executes both Resource Provider and Resource Network Firebase emulator suites on every PR head, followed by architecture tests, typecheck, lint, production build and canonical `npm run check`; configured shared browser acceptance remains in the production workflow.

The inventory does **not** claim a new full configured Resource-domain acceptance run on this documentation branch. That would be Independent Acceptance work if used for `Verified`.

## 5. Domain/security review

### Provider status and authority

- Registration, organization type, Profile Complete, map appearance, payment, Founding status or role title do not grant Official Resource Provider status.
- Approval is the only provider-status transition and does not create Organization Verification, credibility, endorsement or capacity.
- Provider management uses current organization authority and `resource.manage`; provider request communication uses `referral.manage` and exact relationship participation.

### Projection minimization

- Discovery uses a separate minimized provider projection rather than the private service-profile source record.
- Contact/evidence/admin review/capacity-note/member/private-coordinate data is not projected through provider discovery.
- Published resources omit moderation and actor IDs and do not project draft/withdrawn/expired/suppressed records.
- Provider request messages omit author user identity.

### Geography/privacy

- Service territory is sourced from authoritative controlled geography and is independent of office/base location.
- Cross-geography service coverage does not manufacture an organization coordinate.
- Browser spatial/URL selection remains non-authorizing and is server-revalidated.

### Direct-client denial and immutable evidence

Current `firestore.rules` keeps provider applications/status/profiles, provider publications/resources, Resource Network events/commands, request messages and acquisition invitations behind the server-managed boundary. Application/network event and command evidence is append-only; browser clients cannot self-approve, publish, enumerate private messages or rewrite history.

### Availability/capacity truth

- Current explicitly maintained provider/service availability may be rendered and filtered.
- `unknown` remains a valid truthful state.
- This packet does not infer capacity, workload, assignment suitability, response time, acceptance or outcome.
- `RES-006` advanced capacity-aware routing remains Not Started and outside scope.

## 6. Bounded follow-up packets

### A. `WP-RES-DETAIL-COMPLETION-01` — production Resources detail/status correction

**Requirements:** `RES-LENS-002`, `RES-LENS-004` only.  
**Owner:** Lane 04 — Resources.  
**Purpose:** close the two confirmed participant-facing composition gaps without changing provider domain semantics.

Bounded scope:

- project the current provider application/status and exact permitted next action into the own-organization Resources detail/drawer for no application, draft, submitted, under-review, information-requested, resubmitted, approved and denied;
- reuse `/provider-application` for the existing operational workflow rather than duplicating its forms/state machine;
- for selected published providers, render a truthful Official Resource Provider / current publication treatment plus safe participant-facing provenance/update context from the existing minimized projection;
- preserve current eligibility, intake and maintained availability wording; and
- preserve selected organization/camera context on the operational-workspace round trip through the existing Shared return seam.

Explicit non-scope:

- no new provider application states, appeal, suspension, annual revalidation, capacity inference, verification/credibility, paid prominence, new service fields, new Shared drawer implementation or Resource saved-object state.

Acceptance requirements:

- **functional:** exact lifecycle/next action for all governed provider states; approved-only management; selected-provider approved/published/provenance detail;
- **domain-security:** non-provider cannot publish/manage; current permission/restriction/provider state revalidation; no private review/contact/evidence/capacity data leakage;
- **browser-visual/responsive:** desktop edge detail and mobile sheet preserve map context and no overflow;
- **accessibility:** keyboard/focus/semantic status and action names;
- **copy/i18n:** five locales, no invented states, no endorsement/acceptance/capacity implication;
- **Shared reuse:** no new private drawer/selection/return infrastructure.

### B. `WP-RES-SAVED-RESOURCE-01` — Resource save/star authority and runtime

**Requirement:** `RES-LENS-009` only.  
**Owner:** Lane 04 after Control Room confirms the relation ownership model.  
**Purpose:** create the minimum authoritative saved-resource relation and participant interaction required by the original requirement.

Pre-implementation decision required:

- whether the saved/starred relation is personal to the authenticated RFxchange participant or organization-owned. The original text says “a participant”; do not silently borrow opportunity watch, referral Starred or browser-local semantics.

Minimum acceptance requirements:

- save and remove-save are idempotent/current-authority operations;
- a save never changes provider/request/resource lifecycle, eligibility, availability, acceptance or outcome;
- a saved reference cannot reveal a resource after current projection authority is lost/withdrawn/expired;
- direct-client mutation/enumeration is denied unless a separately reviewed contract says otherwise;
- UI exposes a truthful Save/Star action and state with keyboard/screen-reader/mobile coverage and five-locale copy.

**Shared Contract decision:** a new Shared Contract Request is **not automatically required** for the domain relation. If Lane 04 needs a new generic selected-object Save/Star control/state shared with Referrals or another lens, record proposed `SCR-RES-001` for Lane 01. If the existing domain-action extension point is sufficient, keep persistence/eligibility inside Resources and close the SCR need as reuse/no-new-shared-contract.

### C. `WP-RES-010-LEDGER-RECONCILE` — governance-only current-state correction

**Requirement:** `RES-LENS-010`.  
**Owner:** Control Room/program governance, not production Lane 04 runtime.  
**Purpose:** reconcile the stale Four-Lens adoption status from `Not Started` to `Implemented — Not Verified` using current runtime plus Slice 3.7 implementation evidence. No Feature-ID tracker change and no production code change.

The implementation provenance should identify the actual production change that first supplied the tracked Resource request experience and may additionally cite later stabilization changes; the inventory documentation commit is not the production implementation SHA.

### D. `WP-RES-INDEPENDENT-ACCEPTANCE-01` — later Lane 06 packet

After the confirmed production gaps are merged, `RES-LENS-009` is implemented, `RES-LENS-010` is reconciled, and relevant Shared dependencies are accepted, Lane 06 should independently evaluate `RES-LENS-001`–`010` against exact current merged implementation SHAs.

This packet must cover every declared requirement acceptance type with exact-SHA runtime/browser/domain-security evidence. Lane 04 cannot provide the `Verified` disposition.

## 7. Shared Exchange dependencies / requests

### Existing shared dependency — consume, do not duplicate

`RES-LENS-008` consumes `SHARED-CONTINUITY-001`. The Shared Experience Completion packet is already active and the Shared ledger separately records the `SHARED-CONTINUITY-002` focus-link defect. Resources should not open a competing continuity implementation. Lane 06 Resources acceptance should consume the accepted Shared result.

### Provider logo / `RES-LENS-011`

Outside this packet range, `RES-LENS-011` is already blocked on `SHARED-IDENTITY-001`. The Shared program already recognizes the organization-logo projection/delivery question. Do not create a duplicate Resources logo contract in the `001`–`010` follow-up.

### Conditional `SCR-RES-001` — Save/Star presentation

Only if the `RES-LENS-009` design requires a new reusable cross-lens generic Save/Star selected-object contract should Lane 04 record:

- **Request ID:** `SCR-RES-001`
- **Problem:** Resource saving needs a generic accessible action/state presentation that may also be consumed by Referrals, while saved-relation persistence and authority remain domain-owned.
- **Shared seam inspected:** selected-object/action projection and drawer/sheet extension points.
- **Domain facts supplied:** exact resource identifier and current readable published-resource projection; save relation never grants provider/resource authority.
- **Constraints:** no browser-local authority, no cross-domain relation reuse without explicit contract, no implication of provider acceptance/service completion.
- **Acceptance types:** functional, browser-visual, responsive, accessibility, cross-lens compatibility.
- **Non-scope:** no shared provider eligibility, provider lifecycle or Resource persistence ownership.

If existing Shared action extension points suffice, no SCR is warranted.

## 8. Merge sequencing recommendation

1. **Merge this inventory PR first** after exact-head CI and independent inventory review. It changes documentation/evidence only.
2. **Control Room reconciles `RES-LENS-010` program status** in a bounded governance-only change; do not rewrite tracker Feature-ID completion.
3. **Shared Experience Completion continues independently.** Its accepted continuity/drawer/selection contracts become prerequisites for final Resources independent acceptance, not blockers to every Lane 04 source inspection.
4. **Authorize `WP-RES-DETAIL-COMPLETION-01`.** It may build against current accepted Shared seams; if Lane 01 changes a consumed contract first, rebase/reconcile before merge. Merge this bounded status/provenance correction before save/star work to minimize collisions in the Resources detail component.
5. **Resolve the `RES-LENS-009` ownership decision and optional SCR.** Then authorize `WP-RES-SAVED-RESOURCE-01` from current merged `main`.
6. **Run Lane 06 `WP-RES-INDEPENDENT-ACCEPTANCE-01`** only after the production gaps, ledger reconciliation and governed Shared dependencies are present on merged `main`.
7. **Lane 07 integration follows accepted lane-level requirements.** It must not substitute for missing Lane 06 dispositions.
8. `RES-LENS-012` whole-lens acceptance remains downstream of `RES-LENS-011` / `SHARED-IDENTITY-001`; this `001`–`010` inventory does not close the whole Resources lens.
9. Future RFx `RSP-008` Resource-gap routing must consume the accepted Resources provider-discovery/request domain and remains downstream of accepted Slice 4.6/Slice 4.7 authority. Do not create a second provider directory under RFx.

## 9. Control Room handoff

Recommended Control Room disposition from this packet:

- preserve `RES-LENS-001`, `003`, `005`, `006`, `007`, `008` as implementation evidence pending Lane 06;
- treat `RES-LENS-002` and `RES-LENS-004` as confirmed **Partial** inventory findings requiring the bounded detail-completion packet before independent verification;
- preserve `RES-LENS-009` as **Not Started / Missing** until the saved-resource relation is explicitly authorized and implemented;
- reconcile `RES-LENS-010` to **Implemented — Not Verified** through governance-only current-state correction;
- do not change the Master Build Tracker from this packet;
- do not claim Resources complete; `RES-LENS-011` and `RES-LENS-012` remain outside this inventory and blocked under the current Four-Lens ledger; and
- after this documentation candidate is independently reviewed, merge it before activating the production gap packets above.
