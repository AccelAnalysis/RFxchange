# Slice 3.7 — Resource Discovery, Routing & Provider Distribution execution authority

**Status: AUTHORIZED FROM MERGED `main` — SINGLE ACTIVE PRODUCT SLICE**

## Recalculated merged baseline

Slice 3.7 authority is recalculated from merged `main` at `26412435651a13cc7a6540bbe50bc7b646760d78` after:

- Slice 3.6 passed exact-head production CI run `31297388363` on `81dd94f7e655b1854660e33c0a703dd37bb39a06`;
- PR #132 merged the accepted Slice 3.6 implementation at `26412435651a13cc7a6540bbe50bc7b646760d78`; and
- post-merge production CI run `31297486059` passed on `main`.

The canonical tracker is **438 total · 143 Done · 295 Not Started**, Activation **43/43**, and Network **29/38**. Slice 3.6 supplies the approved-provider status and private structured profile required by this slice. Slice 3.5 supplies the referral consent and minimum-necessary boundary. Slice 3.1 supplies reliable versioned communications. The dependency map therefore identifies Slice 3.7 as the earliest eligible product slice. This documentation-only recalculation changes no Feature-ID completion state and no dependency edge.

## Authorized Feature IDs

- `RES-004` — provider service-territory map presence;
- `RES-005` — contextual provider recommendations;
- `DSC-011` — contextual Official Resource Provider search;
- `REF-006` — provider referral/request connection;
- `RES-007` — request-scoped provider communications;
- `RES-008` — provider resource/program publishing; and
- `ACQ-008` — provider-shared opportunity/profile invitations.

Implementation must remain bounded by `SLICE_3_7_RESOURCE_DISCOVERY_ROUTING_AND_PROVIDER_DISTRIBUTION.md`, the current organization/provider/referral/acquisition/communications/geography authorities, and the existing production abstractions inspected for this recalculation.

## Required production reuse

Slice 3.7 extends rather than replaces:

- Slice 3.6 Official Resource Provider status, private structured service profile, `resource.manage` organization permission, immutable provider history and current lifecycle/restriction checks;
- canonical organization identity, Profile Complete, active membership, OPEN state, authoritative locality release, confirmed location and organization service-geography records;
- Slice 3.2 server-authorized Network entry and synchronized privacy-safe organization map/list/detail discovery;
- Slice 3.5 organization-owned referral aggregate, typed lifecycle, exact-recipient consent, minimum-necessary projections, education, acquisition correlation and `referral.manage` authority;
- Slice 3.1 versioned transactional event/template mapping, delivery evidence, replay suppression, deterministic retry and provider-independent communications ports;
- Slice 2.9 signed, expiring, single-subject acquisition context and bind/resume contracts, including the existing `provider` and `opportunity` intent kinds;
- confirmed AMACS 0.5.0 capability claims and deterministic matching inputs without using an LLM at match time;
- existing shared spatial/operational workspaces, provider marker family, locality geometry, service-area layers, search/filter controls, edge drawers/mobile sheets and real-record-only relationship paths; and
- direct-client default-deny, immutable organization audit and server-only consequential command patterns.

No Firebase UID, email address, route parameter, acquisition token, browser state, provider application draft, commercial status, Founding recognition, membership tier, payment, office address or visual map field grants provider publication, request, messaging or routing authority.

## Binding implementation decisions

### Minimized discoverable provider projection

Slice 3.6's provider service profile remains private source authority. Slice 3.7 creates a separate typed, minimized discoverable projection. Projection eligibility requires all of the following at read time:

- current Official Resource Provider status linked to the accepted application version;
- one current active provider service profile;
- current active organization lifecycle, Profile Complete and no blocking restriction;
- authoritative service geography whose controlled locality is released and permitted for the viewer; and
- an explicit provider-controlled publication state for the discoverable profile.

The projection may include provider organization identity, public organization summary/website, controlled categories, published service name/description, populations served, eligibility summary, modalities, supported languages, service-geography identity/label/geometry reference, explicitly maintained availability, approved intake action label and truthful provenance/update timestamps. It excludes official-contact email/phone unless explicitly approved for public display, evidence identifiers or bytes, application/review content, administrator decisions/notes, capacity notes, member data, exact private coordinates, acquisition secrets and communications metadata.

Revoked provider status, inactive organization/profile, restriction, withdrawn publication or unreleased geography removes the projection and all new routing actions immediately. Historical referral/request evidence remains retained and visible only to its authorized parties.

### Service territory and map presence (`RES-004`)

The provider service territory is sourced from the approved profile's authoritative `serviceGeographyId`. It represents where the provider serves businesses, not the provider's office or marker location. The server resolves current locality identity, release state and authoritative geometry; the client cannot submit arbitrary polygons or infer coverage from an address.

Service fields render beneath markers and labels, remain distinct from base locality focus and organization service areas, use neutral/pattern/opacity treatment rather than category rainbow colors, and preserve overlap legibility. Selection may strengthen a separate field boundary without moving its geographic anchor. Unreleased, limited or restricted locality behavior follows geography authority and uses non-color text/status. Map, list and detail share one server projection and selection/filter state, with a structured accessible alternative and reduced-motion behavior.

### Contextual search and recommendations (`DSC-011`, `RES-005`)

Search consumes only eligible discoverable provider projections and deterministic structured fields: confirmed service/category data, geography, eligibility/need terms, modality, supported language and explicitly maintained availability. The implementation may use normalized text plus validated AMACS 0.5.0 identifiers where present. Matching and ordering remain deterministic, explainable and LLM-independent.

Every result explains why it may be relevant, including matched service/need and territory. A recommendation is a routing suggestion, not endorsement, verification, guaranteed eligibility, capacity, response time, service acceptance or outcome. Unknown availability remains `unknown`; it is neither hidden nor promoted as available. `unavailable` may be filtered from actionable recommendations while remaining truthfully represented where policy permits. Commercial, Founding, sponsored and paid state cannot alter eligibility, ordering or prominence.

Slice 3.7 may use current explicit availability as a truthful filter. It must not estimate workload, infer capacity, optimize assignment, reserve staff or implement advanced capacity-aware routing; those behaviors belong to unchecked `RES-006`.

### Provider connection through the referral aggregate (`REF-006`)

A provider request is a typed provider-purpose extension of the existing organization-owned referral aggregate, not a parallel handoff, ticketing or direct-message system. It targets one current eligible provider organization and records the selected provider/service projection version, need/context, consented shared fields, correlation, expiry, version and append-only events.

Before send, the requester previews the exact provider recipient and exact minimum data to be shared and completes the existing versioned consent/education boundary. Free text cannot silently import private organization/profile/evidence fields. The server revalidates requester `referral.manage` authority, provider status, discoverable service, territory, request version and idempotency before every consequential command.

The provider may accept, decline or redirect. Redirect selects one other currently eligible provider through a server-validated relation and creates an attributed, consent-preserving transition or new correlated referral according to the aggregate contract; it cannot silently expose the requester to an unnamed organization or fan out to multiple recipients. Acceptance means only willingness to continue the provider's own intake process. Decline or redirect implies no adverse credibility or outcome.

Only the requesting and exact recipient provider organizations receive their minimum-necessary projections. Provider requests never appear in public discovery. Direct-client reads/writes remain denied, and existing referral expected-version, command-receipt, audit, expiry and truthful outcome boundaries continue to apply.

### Request-scoped communications (`RES-007`)

Communication is append-only, organization-attributed and scoped to one authorized sent-or-later provider request. It is not an inbox for arbitrary unsolicited messages. Only current authorized members of the requester or exact provider organization may read or append within the request, and the server revalidates current relationship, organization authority, restriction, provider eligibility and request state for each operation.

Messages have stable ids, bounded plain text, author organization/user attribution, request version/correlation, timestamps and immutable history. Editing/deleting prior messages, attachments, arbitrary recipients, staff assignment, group chat, typing/presence and open DMs are out of scope. Notification intents use Slice 3.1 versioned templates and delivery evidence; delivery failure does not change request state or fabricate receipt. Projections exclude unrelated contacts, membership details, delivery internals and private provider/application data.

### Provider resource publishing (`RES-008`)

An approved provider with current `resource.manage` authority may create and maintain organization-owned resource records for permitted services, programs, workshops, funding programs, resources and announcements. Each record has one typed kind, title, bounded summary/description, authoritative provider provenance, applicable service/need categories, optional real location or service geography, delivery modality, eligibility/intake summary, optional start/end or application dates, explicit visibility, lifecycle, version, publisher attribution and timestamps.

Use an explicit lifecycle of `draft`, `published`, `withdrawn` and `expired`. Drafts are provider-private. Publication and withdrawal are consequential, idempotent, expected-version commands with append-only events/audits. Time-bounded published records become truthfully expired without rewriting history. Non-provider, inactive/restricted, wrong-organization and stale-profile publication fails closed. The platform may apply bounded moderation or administrative suppression without granting administrators provider authorship; moderation state and reason are distinct from provider lifecycle.

Only minimized published projections enter discovery. Resource publication does not create an opportunity, RFx, verified outcome, endorsement, provider acceptance, payment offer or guaranteed availability. External links require safe validation; unsupported uploads or private evidence are excluded unless an already-authorized controlled asset projection is explicitly reused.

### Provider acquisition and distribution (`ACQ-008`)

An eligible approved provider may issue one versioned transactional invitation for one legitimate recipient and one permitted subject. Slice 3.7 implements profile-completion invitations using the existing `provider` acquisition kind and may share a real opportunity only when an existing current public-opportunity projection is independently authorized and readable through the established `opportunity` acquisition path. It must not create Wave 4 opportunity/RFx records, opportunity beacons or readiness/qualification state.

The signed, expiring acquisition context preserves provider identity, subject reference and bounded intent through legitimate authentication, policy acceptance, activation, Profile Complete, orientation/first value and OPEN. It never auto-creates membership, provider relationship, service request, acceptance, qualification or opportunity access. Recipient mismatch, expiry, replay for another subject, revoked provider status, withdrawn subject and stale context fail closed with a restart path. Retries reuse the same invitation/acquisition/communication correlation rather than creating duplicates or fan-out.

## Authorization and projection requirements

- Discovery requires a current authenticated OPEN participant and server-authorized geography; publication management requires active exact provider organization membership, no blocking restriction, current Official Resource Provider status and `resource.manage`.
- Provider connection and requester communication commands require `referral.manage` for the exact involved organization. Provider-side response/communication additionally requires current Official Resource Provider eligibility for the exact recipient.
- Organization A cannot read or mutate Organization B's private provider profile, draft resources, unrelated requests, messages, contacts, applications or evidence. A published projection grants no mutation or private-source access.
- Every read and command revalidates current organization, provider, geography, publication, request and lifecycle authority. A cached projection, prior approval or accepted request cannot preserve access after revocation.
- Direct Firestore/Storage client access remains default-deny for private provider profiles, projection mutation, resource drafts/history, request messages, command receipts, acquisition secrets and communication delivery records.
- Paid, Founding, sponsored or membership status cannot affect search, recommendation, routing, eligibility, publication, service-field treatment, communication or request state.

## Participant experience and localization

Integrate provider discovery as a Network resource lens without displacing ordinary organization discovery. The shared Spatial Workspace provides synchronized map/list/detail state, provider/service filters, accessible service-field descriptions and one clear connection action. Provider request/resource management uses the shared Operational Workspace with preserved forms, explicit save/publish status, stale/conflict recovery and truthful next actions.

Empty, loading, permission, unknown-availability, unavailable, declined, redirected, expired, withdrawn, communication-failure, stale and recovery states follow the Content and Messaging System. Gold marks focus/connection, Signal Blue marks discovery/data and Growth Green is not used for listing, recommendation, referral acceptance, service start or publication. Real paths render only for an authorized provider request with permitted projected endpoints.

Platform-owned copy ships in `en-US`, Spanish, French, Italian and German. Provider- or participant-authored names, descriptions, eligibility, messages and invitation context remain verbatim and are not automatically translated. Desktop, intermediate and mobile layouts require keyboard operation, visible focus, semantic status, screen-reader alternatives, 200% reflow, reduced motion/transparency, representative-density performance and no horizontal overflow.

## Acceptance evidence required before completion

Automated, emulator and configured-browser acceptance must prove:

1. discoverable projection eligibility, explicit publication, minimization, provenance and immediate removal after provider/profile/organization/restriction/geography changes;
2. authoritative service territory independent of office location, controlled release state, overlap/layer behavior, fixed anchors, map/list/detail parity and accessible/reduced-motion alternatives;
3. deterministic service/need/geography/eligibility/modality/language/availability search and contextual recommendations with explainable relevance, neutral ordering, unknown handling and no endorsement/capacity claim;
4. provider connection through the existing referral aggregate, exact recipient and data preview, consent, requester/provider authority, accept/decline/redirect, version/idempotency/expiry/audit and no cross-org leakage or fan-out;
5. request-scoped append-only communications, current relationship checks, versioned notification delivery/retry evidence and cross-request, cross-org, stale-state and open-message denial;
6. provider-only draft/publish/withdraw/expire resource lifecycle, typed provenance/visibility, safe links, moderation boundary, minimized discovery projection and non-provider/direct-client denial;
7. provider profile-completion invitation continuity and, only where a real permitted public opportunity exists, reuse of the existing opportunity path without Wave 4 object creation or activation/OPEN bypass;
8. loading, empty, validation, permission, unavailable, redirect, withdrawal, expiry, delivery failure, stale/conflict, recovery, responsive, representative-density, accessibility, five-locale and clean-console behavior;
9. full after-load revocation/restriction/provider-status/geography/publication revalidation across discovery, connection, communications, resources and acquisition; and
10. configured real-environment journeys with disposable providers/requesters, fields, resources, referrals, messages, communication/acquisition records and exact Auth/Firestore/Storage cleanup with zero residuals.

Run focused validators and emulators plus the canonical full local gate:

```bash
npm run check
```

Production CI must pass on the exact PR head and again on merged `main` before dependency authority is recalculated.

## Explicit non-scope

This authority does not permit advanced capacity-aware routing `RES-006`, inferred workload/capacity, provider staff assignment, annual revalidation `ADM-071`, provider analytics/API, public performance ranking, paid placement, referral fees, bulk or unsolicited messaging, attachments/chat presence, provider verification or credibility seals, Organization Verification, verified outcomes, Wave 4 RFx/opportunity creation/readiness/qualification logic, B6b convergence, Slice 3.8 education, Intelligence Dark, Presentation Mode, production sound or haptics.

Slice 3.8 and all later slices/gates remain unstarted. Brand Gate B6b remains separately sequenced after Slice 3.7. They may be authorized only after Slice 3.7 implementation and acceptance merge, post-merge production CI passes, and dependency eligibility is recalculated again from merged `main`.
