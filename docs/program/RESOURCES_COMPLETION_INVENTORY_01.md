# Resources Completion Inventory 01

- **Packet:** `WP-RES-INVENTORY-01`
- **Lane:** 04 — Resources
- **Packet status at activation:** `active`
- **Activation base:** `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`
- **Activation epoch:** `initial-operational-2026-08-12`
- **Branch:** `codex/resources-completion-inventory-01`
- **Inventory working base:** `69daa4bea80b39cc9d5ed04715aa6e2ac8e1f068`
- **Scope:** authority-to-runtime inventory only; no production Resources gap implementation

## Authority and stop boundary

This packet consumes the Four-Lens Program Authority, Experience Ledger, Shared Exchange Contracts, Independent Acceptance Protocol, machine requirements, Resources/Referrals completion inventory, Exchange Interaction Architecture, Slice 3.6/3.7 Resource authorities and evidence, current design/map/content authorities, Master Build Tracker, Dependency Map, and actual runtime.

It does not change production Resources runtime, Shared Exchange contracts, the Master Build Tracker, the Dependency Map, provider state, services, eligibility, availability, capacity, geography, or any requirement to `Verified`. Only Lane 06 can verify Four-Lens requirements.

## Inventory result

| Requirement | Entering status | Inventory disposition | Finding |
| --- | --- | --- | --- |
| `RES-LENS-001` | Implemented — Not Verified | **Present** | `/resources` is an authorized OPEN-participant lens where a non-provider can discover only current eligible published Official Resource Providers and minimized published resources. |
| `RES-LENS-002` | Implemented — Not Verified | **Partial** | The provider lifecycle exists in `/provider-application`, but the required own-organization Resources interaction does not project the exact lifecycle/next action. `/resources` shows owner management only after an approved service profile exists. |
| `RES-LENS-003` | Implemented — Not Verified | **Present** | Provider publication/resource management is current-authority gated and appears only for approved provider state/profile. |
| `RES-LENS-004` | Implemented — Not Verified | **Partial** | Provider eligibility, intake and maintained availability are current and rendered, but selected detail does not visibly identify current Official Resource Provider/published state or participant-facing provenance/update context already present in the minimized projection. |
| `RES-LENS-005` | Implemented — Not Verified | **Present** | Service territory is authoritative controlled geography rendered separately from office/organization location, with an accessible textual alternative and no fabricated cross-geography marker. |
| `RES-LENS-006` | Implemented — Not Verified | **Present** | Participants inspect only minimized currently published resources; draft/withdrawn/expired/suppressed records do not enter discovery. |
| `RES-LENS-007` | Implemented — Not Verified | **Present** | Provider requests use the existing referral aggregate, exact recipient/service/publication context, minimum-sharing consent, and exact-party request-scoped communication. |
| `RES-LENS-008` | Implemented — Not Verified | **Present; shared acceptance dependency remains** | Resources consumes the shared scoped spatial context, revalidates carried selection, preserves camera/organization context, and activates provider actions only for an eligible projection. Lane 06 must consume accepted Shared state. |
| `RES-LENS-009` | Not Started | **Missing** | No Resources saved/star relation, persistence contract, server command/projection, or participant Save/Star action exists. |
| `RES-LENS-010` | Not Started | **Present; registry reconciliation required** | `/resources` already lists the participant's provider requests, current typed lifecycle/status, delivery-unknown truth, selected request and authorized communication history/actions. |

**Inventory arithmetic: 7 Present · 2 Partial · 1 Missing.**

These are inventory findings, not Independent Acceptance dispositions. This packet leaves the machine registry unchanged.

## Requirement evidence

### `RES-LENS-001` — Present

`app/resources/page.tsx` resolves current participant/session, access-resolution, activation, organization, restriction and OPEN state before loading Resource discovery. Provider status is not required to consume discovery.

`ResourceNetworkService.discover()` projects a provider only when current source facts include Official Resource Provider status, active service profile, Profile Complete, no blocking restriction, current explicit publication bound to the profile version, permitted released service geography, and at least one visible service. Published resources are returned only through an eligible discovered provider in the selected geography.

Accepted Slice 3.7 configured-browser evidence used a separate non-provider requester that discovered the provider and a published resource. Exact Slice 3.7 head `0776aaf59856dd5ab2ef5f8fe3b8e9eec5713cbe` passed production CI run `31300282317`.

### `RES-LENS-002` — Partial

The Resource Provider domain itself preserves the governed lifecycle:

```text
draft → submitted → under-review → information-requested → resubmitted
                    ├────────────────────────────────────→ approved
                    └────────────────────────────────────→ denied
```

`/provider-application` exposes current stage, draft/save/submit, review read-only state, information response/resubmission, denial/history and approved-profile maintenance. The gap is specifically the Resources interaction required by the Four-Lens requirement and Exchange Interaction Architecture.

`app/resources/page.tsx` loads `ownerSnapshot()`, which includes provider status, but `ResourceNetworkWorkspace` drops `providerStatus` from its `Owner` type and never loads/presents the application aggregate. Its owner-management section renders only when `owner?.serviceProfile` exists. No-application, draft, submitted, under-review, information-requested, resubmitted and denied organizations therefore lack the required exact Resources-lens status/next action.

No new lifecycle state or provider authority is needed to close this gap.

### `RES-LENS-003` — Present

Owner snapshot and mutations use current organization operation authorization. Provider discovery publication and provider resource mutations additionally require current Official Resource Provider status, active service profile, Profile Complete, authoritative service geography and no blocking restriction. Resource service/geography inputs must remain inside the provider profile.

The Resources owner-management UI is exposed only with an approved provider service profile. Approval does not create Organization Verification, credibility, paid prominence or inferred capacity.

### `RES-LENS-004` — Partial

The minimized provider discovery projection already contains publication/profile version identity, `publishedAt`, `updatedAt`, eligibility, intake, provider/service availability, territory and deterministic relevance reasons. Projection eligibility is recalculated from current provider/profile/organization/restriction/geography/publication facts.

Selected detail renders maintained availability, territory, provider identity, populations served, eligibility, intake, languages, modalities and service availability. It does not claim verification, guaranteed eligibility, capacity, acceptance or outcome.

The missing participant-facing portion is explicit current approved/published provider state and safe provenance/update presentation. Backend timestamps/versions alone do not satisfy a participant-facing detail requirement. A follow-up should expose safe copy such as current Official Resource Provider/publication/update context without surfacing private review facts or raw internal implementation identifiers.

### `RES-LENS-005` — Present

Service territory derives from the provider's authoritative service geography and the selected controlled locality geometry, not an office address or client polygon. `ExchangeSpatialScene` receives service fields separately from organization markers. The structured alternative states that the provider serves the named territory and that the field is separate from the office marker.

A provider serving the active geography without a permitted local organization marker can remain selected by its territory/detail while shared marker focus returns safely to the participant home marker. No coordinate is invented.

### `RES-LENS-006` — Present

Provider resources have explicit `draft`, `published`, `withdrawn`, `expired` lifecycle plus moderation. `publicProviderResource()` returns only current published, non-expired, non-suppressed minimized projections. The participant list shows only those projections with provider identity, kind, summary and safe intake link where present.

Provider resource mutation requires current provider authority and `resource.manage`; direct browser Firestore access remains denied.

### `RES-LENS-007` — Present

A provider request is a `provider-connection` referral bound to the exact provider organization, selected service and publication version. Before send, the requester supplies a bounded summary and explicitly consents to share only the requester organization name and that summary with the named provider.

Message reads require `referral.manage` and exact sender/provider participation. Writes additionally require a permitted request lifecycle and re-check current provider eligibility. Participant message projection removes author user identity. Direct Firestore reads/writes remain denied.

### `RES-LENS-008` — Present; shared acceptance dependency remains

Resources consumes `useParticipantSpatialContext`, stores Resources query/filter/result/list state, carries organization/provider identifiers as non-authorizing URL state, revalidates selections server-side, and preserves camera state.

Post-PR-159 configured browser evidence proved the same selected organization and map view through `Intelligence → Resources → Referrals → Intelligence`, including mobile sheet, reduced-motion and five-locale behavior.

The Shared ledger still has independent acceptance work, including separate `SHARED-CONTINUITY-002` focus-link remediation. `RES-LENS-008` depends on `SHARED-CONTINUITY-001`; Resources must consume the accepted Shared result and must not create a competing continuity implementation.

### `RES-LENS-009` — Missing

No Resource saved/starred aggregate, repository, command, projection or participant action exists. The current Resource list has no Save/Star control. Repository search surfaces the requirement/authority references but no Resource saved-object implementation.

The Exchange Interaction Architecture expressly includes `save/star resources`, so provider publication, selected-object browser state, request status and Opportunity watches do not satisfy this requirement.

Before implementation, Control Room must make the saved-relation ownership explicit instead of silently borrowing another domain's semantics: the original requirement says a **participant** can save/star a resource.

### `RES-LENS-010` — Present; registry reconciliation required

The Resources lens derives `provider-connection` referrals for its Provider requests area. Each item renders the exact requester/provider counterparty, current referral status, bounded summary, delivery-outcome-unknown truth when applicable, and an action to open authorized request communication. The selected request is server-validated before messages load.

The authoritative provider-request lifecycle is:

`draft`, `sent`, `accepted`, `declined`, `redirected`, `contacted`, `closed`, `expired`.

The UI renders the current status and exposes only role/state-applicable actions. Slice 3.7 browser evidence exercised request creation, requester message, provider visibility, acceptance and provider reply; later stabilization preserved delivery-outcome-unknown handling.

The adoption-time `Not Started` state is therefore stale relative to production runtime. Control Room should reconcile this record to `Implemented — Not Verified` without changing tracker Feature-ID arithmetic or treating this inventory commit as the production implementation SHA.

## Browser/runtime evidence inventory

This packet binds current runtime inspection to durable browser evidence instead of treating old Feature-ID completion as complete-lens proof:

1. **Slice 3.6 browser evidence:** provider application lifecycle, participant/admin authority separation, 1280/820/390 layouts, localized rendered copy, no overflow and clean diagnostics (`docs/architecture/WAVE_3_SLICE_3_6.md`).
2. **Slice 3.7 browser evidence:** non-provider discovery, real service territory, explainable reasons, consented request, two-party messages, provider acceptance, resource draft→publish→fresh discovery, responsive/localization evidence and exact cleanup (`docs/architecture/WAVE_3_SLICE_3_7.md`; exact head `0776aaf59856dd5ab2ef5f8fe3b8e9eec5713cbe`; CI `31300282317`).
3. **Post-PR-159 browser evidence:** real Mapbox/WebGL spatial context, selected organization/camera through Resources and back, mobile sheet fit, keyboard/reduced-motion/five-locale behavior and clean diagnostics (`docs/architecture/POST_PR_159_PARTICIPANT_EXPERIENCE_CONVERGENCE.md`).
4. **Current-main runtime inspection:** current `/resources`, Resource workspace, provider application workspace, Resource service/model and Firestore rules were inspected at `69daa4bea80b39cc9d5ed04715aa6e2ac8e1f068` so later composition changes are not inferred from historical screenshots.
5. **Current CI contract:** every PR head still executes Resource Provider and Resource Network Firebase emulator suites, architecture tests, typecheck, lint, production build and `npm run check`; configured shared browser acceptance remains in production CI.

This documentation packet does not claim a new full configured Resource-domain acceptance run. Such evidence may be used later by Lane 06 only when bound to the exact implementation candidate under Independent Acceptance.

## Domain/security review

### Provider status and authority

- Registration, organization type, Profile Complete, map presence, payment, Founding status and role title do not grant provider status.
- Approval creates only Official Resource Provider status, not verification, credibility, endorsement or capacity.
- Provider management requires current organization authority/`resource.manage`; request communication requires `referral.manage` and exact relationship participation.

### Projection minimization

- Discovery uses a separate minimized provider projection, not the private provider profile.
- Private official contact, evidence, admin review, capacity notes, members, private coordinates and acquisition secrets are not provider-discovery output.
- Public resources omit moderation and actor IDs and exclude draft/withdrawn/expired/suppressed records.
- Participant request-message projection omits author user identity.

### Geography/privacy

- Service territory is authoritative controlled geography and independent of office/base location.
- Cross-geography coverage does not fabricate a marker.
- Browser spatial/URL state remains non-authorizing and is revalidated.

### Direct-client denial / evidence

Current `firestore.rules` keeps provider applications/status/profiles, provider publications/resources, network events/commands, request messages and acquisition invitations behind the server-managed boundary. Application/network events and commands are append-only; browser clients cannot self-approve, publish, enumerate private messages or rewrite history.

### Availability/capacity truth

- Only explicitly maintained provider/service availability is used; `unknown` remains truthful.
- This inventory does not infer capacity, workload, assignment suitability, response time, acceptance or outcome.
- `RES-006` advanced capacity-aware routing and `ADM-071` provider revalidation remain Not Started and outside this packet.

## Bounded follow-up packets

### `WP-RES-DETAIL-COMPLETION-01`

**Requirements:** `RES-LENS-002`, `RES-LENS-004` only.

**Owner:** Lane 04.

**Purpose:** close the two confirmed participant-facing composition gaps without changing provider domain semantics.

Bounded implementation:

- project no-application/draft/submitted/under-review/information-requested/resubmitted/approved/denied state plus exact authorized next action in the own-organization Resources detail;
- reuse `/provider-application` for the existing Operational Workspace rather than cloning its forms/state machine;
- show safe selected-provider Official Resource Provider/current publication/update provenance using existing minimized projection facts;
- retain current eligibility, intake and maintained-availability truth; and
- use existing Shared selection/drawer/return contracts.

Explicit non-scope: no new application states, appeal/suspension/revalidation, capacity inference, verification/credibility, paid prominence, saved-resource state, or private Shared drawer implementation.

Acceptance: functional exact lifecycle/action, approved-only management, safe provider state/provenance; domain-security and privacy; browser desktop/mobile map-preserving detail; keyboard/focus/semantic status; five locales/copy truth; Shared reuse.

### `WP-RES-SAVED-RESOURCE-01`

**Requirement:** `RES-LENS-009` only.

**Owner:** Lane 04 after Control Room confirms the relation ownership model.

Before production implementation, decide whether the saved relation is participant-personal or organization-owned. Do not borrow Opportunity Watch, Referral Starred or browser-local semantics silently.

Minimum acceptance:

- idempotent save/remove-save under current authority;
- save changes no provider/request/resource lifecycle, eligibility, availability, acceptance or outcome;
- saved references never grant access after a resource loses current projection authority;
- direct-client mutation/enumeration remains denied unless a separately reviewed contract explicitly changes that boundary;
- accessible mobile/desktop Save/Star state and five-locale copy.

A new Shared Contract Request is not automatically required for the domain relation. If implementation requires a new generic cross-lens selected-object Save/Star control/state, Lane 04 should record proposed `SCR-RES-001`; otherwise reuse the existing Shared domain-action seam.

### `WP-RES-010-LEDGER-RECONCILE`

**Requirement:** `RES-LENS-010`.

**Owner:** Control Room/program governance only.

Reconcile the stale program adoption state to `Implemented — Not Verified` using the actual production implementation provenance (Slice 3.7 plus applicable later stabilization), current runtime and this inventory. No production code or Feature-ID tracker change.

### `WP-RES-INDEPENDENT-ACCEPTANCE-01`

**Owner:** Lane 06, later.

After confirmed Resources gaps merge, `RES-LENS-009` is implemented, `RES-LENS-010` is reconciled and relevant Shared dependencies are accepted, independently evaluate `RES-LENS-001`–`010` on exact current implementation SHAs. Lane 04 cannot issue `Verified`.

## Shared Exchange dependencies / SCR decision

- `RES-LENS-008` consumes `SHARED-CONTINUITY-001`; the active Shared lane already owns continuity remediation. No duplicate Resources continuity SCR.
- `RES-LENS-011`, outside this packet, remains blocked on `SHARED-IDENTITY-001`; do not duplicate the logo contract here.
- **Conditional `SCR-RES-001`:** only if `RES-LENS-009` needs a new generic cross-lens Save/Star selected-object control/state. Domain persistence/eligibility remains Resources-owned. If existing Shared action extension points suffice, no SCR is needed.

## Merge sequencing recommendation

1. Merge this inventory PR after exact-head CI and independent inventory review. It is documentation/evidence only.
2. Control Room reconciles `RES-LENS-010` program status in a bounded governance-only change; do not change tracker Feature-ID completion.
3. Shared Experience Completion continues independently; accepted Shared selection/drawer/continuity state is a prerequisite for final Resources independent acceptance.
4. Authorize and merge `WP-RES-DETAIL-COMPLETION-01`; if Lane 01 changes a consumed Shared contract first, reconcile the candidate before merge.
5. Resolve `RES-LENS-009` ownership/conditional SCR, then authorize `WP-RES-SAVED-RESOURCE-01` from current merged `main`.
6. Activate Lane 06 `WP-RES-INDEPENDENT-ACCEPTANCE-01` only after the production gaps and governed Shared dependencies are on merged `main`.
7. Lane 07 integration follows independently accepted component work and does not replace Lane 06.
8. `RES-LENS-012` whole-lens acceptance remains downstream of `RES-LENS-011` / `SHARED-IDENTITY-001`; this packet does not close the whole Resources lens.
9. Future RFx `RSP-008` gap-to-Resources routing remains downstream of accepted Slice 4.6/4.7 authority and must reuse the accepted provider discovery/request domain rather than create another provider directory.

## Control Room handoff

Recommended disposition:

- preserve implementation evidence for `RES-LENS-001`, `003`, `005`, `006`, `007`, `008` pending Lane 06;
- treat `RES-LENS-002` and `RES-LENS-004` as confirmed Partial inventory findings requiring `WP-RES-DETAIL-COMPLETION-01`;
- keep `RES-LENS-009` Not Started/Missing until explicitly authorized and implemented;
- reconcile `RES-LENS-010` to Implemented — Not Verified through program governance;
- do not alter Master Build Tracker arithmetic from this inventory;
- do not claim Resources complete; `RES-LENS-011` and `RES-LENS-012` remain outside this packet under the current Four-Lens ledger.
