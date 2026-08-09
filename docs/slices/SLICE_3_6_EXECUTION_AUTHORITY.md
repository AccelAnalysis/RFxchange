# Slice 3.6 — Official Resource Provider Foundation execution authority

**Status: AUTHORIZED — SINGLE ACTIVE SLICE**

## Recalculated merged baseline

Slice 3.6 authority is recalculated from merged `main` at `516c49627aeff637b02982218f0682c1eea436ad` after:

- Slice 3.5 passed exact-head production CI run `31294774153` on `17e8e66fc11e29bc125bc739d5fad7141da14244`;
- PR #130 merged the accepted Slice 3.5 implementation at `516c49627aeff637b02982218f0682c1eea436ad`; and
- post-merge production CI run `31294884142` passed on `main`.

The canonical tracker is **438 total · 139 Done · 299 Not Started**, Activation **43/43**, and Network **25/38**. The canonical `RES-001` correction makes `ORG-012` Profile Complete—not optional `ORG-019` enrichment—the provider-application prerequisite. That prerequisite and all preceding Wave 3 slices are complete, so Slice 3.6 is the earliest dependency-eligible product slice. No dependency edge or Feature-ID status changes in this authority update.

## Authorized Feature IDs

- `RES-001` — Official Resource Provider application;
- `RES-002` — governed provider admin review and decision;
- `RES-003` — structured provider service profile; and
- `ADM-070` — Resource Provider approval console.

Implementation must remain bounded by `SLICE_3_6_OFFICIAL_RESOURCE_PROVIDER_FOUNDATION.md`, the current organization/admin/security/privacy/storage authorities, and the existing production abstractions inspected for this recalculation.

## Required production reuse

Slice 3.6 extends rather than replaces:

- canonical organization identity, lifecycle, Profile Complete, active membership and restriction resolution;
- the existing `resource.manage` organization permission for applicant and approved-provider management;
- the existing scoped `provider.application.read` and `provider.application.review` administrative permissions, grants, role presets, portal navigation, work-queue and Organization 360 resource context;
- Slices 3.3 and 3.4 organization capability, profile, credential, evidence, private asset, location and service-geography authority;
- the private-by-default INF-008 Storage metadata and controlled-delivery boundary;
- immutable organization and platform administrative audit contracts; and
- the shared participant and administrative Operational Workspace shells and localized UI primitives.

No Firebase UID, email address, route parameter, browser state, self-declared organization type, registration choice, public profile field, credential upload, payment, Founding recognition, membership tier, Organization Verification, or role title grants provider status or administrative review authority.

## Binding implementation decisions

### Provider application aggregate

One organization may have one current application aggregate and complete immutable history. The aggregate references the current authoritative organization identity, primary contact, website, primary location and service geography rather than copying those fields into an independently editable provider identity.

An application version contains one or more controlled provider categories, an Other explanation when selected, structured services/programs/assistance, organizations or populations served, eligibility, intake/referral method, modality, supported languages, official provider contact, authoritative website/domain references, selected organization-owned evidence references, authority attestation, status, version, timestamps and actor attribution.

The initial category vocabulary is the one defined by the Slice 3.6 brief and is represented by stable keys plus localized platform labels. Categories are multi-select. Participant-authored service, eligibility, intake, Other, contact and response text remains verbatim and is not automatically translated.

Draft updates, submission and resubmission require a stable idempotency key and expected version. Consequential commands transactionally persist the current aggregate, append-only event/history, organization audit evidence and command receipt. Replays return the prior result only after current authority succeeds; stale versions return recoverable current-state guidance. A denied or superseded application remains historical and a permitted reapplication creates a new version/current aggregate under explicit policy rather than deleting the prior record.

### Governed review and decision

Use this explicit lifecycle:

```text
draft → submitted → under-review → information-requested → resubmitted
                    ├────────────────────────────────────→ approved
                    └────────────────────────────────────→ denied
```

Only the applicant organization may edit its draft or respond to an information request. Only a current administrator with the exact scoped `provider.application.review` permission may begin review, request information, approve or deny. Read-only inspection requires the separately evaluated `provider.application.read` permission. Role preset names and navigation visibility never authorize a command.

Information requests and responses are append-only, versioned, attributed records. Approval and denial require a bounded reason, current expected version and durable administrator decision/audit evidence. Direct Firestore clients cannot create, update or approve applications, decisions, provider status or private evidence projections.

Approval creates only the controlled **Official Resource Provider** status associated with the organization and accepted application version. It does not create Organization Verified, Verified Resource Provider, credibility, endorsement, paid membership, sponsorship, search priority, capacity, guaranteed eligibility, public service territory or a public provider field. Denial preserves reason, reviewer, application version and reapplication policy. Current organization restrictions or lifecycle ineligibility fail closed and must not be masked by an earlier approval.

### Structured provider service profile

Approval creates or unlocks one organization-owned structured provider service profile linked to the approved application version. An authorized current provider manager may maintain services/programs, provider categories, service territories, eligibility, intake, official contact, modality, languages, explicitly maintained availability, authoritative links, visibility, status, provenance and history.

Provider service data is distinct from activation capability data and ordinary organization profile enrichment. Unknown availability or capacity is represented as unknown. A service profile cannot claim current acceptance, eligibility, response time, service success, endorsement or verified outcome.

Slice 3.6 may expose the profile only to the owning organization and authorized administrative review surfaces. It must not add public provider search, recommendation, routing, map service fields, provider referrals, request-scoped messaging or resource publishing; Slice 3.7 owns those projections and workflows.

### Administrative approval console

Extend the existing administrative portal, navigation, work-queue and Organization 360 architecture. Do not create a second admin shell or binary `isAdmin` shortcut.

The console provides scoped, minimum-necessary inspection of organization/Profile Complete authority, categories, services/programs, geography, modality and explicitly maintained availability, eligibility/intake, contact/languages, evidence metadata or controlled delivery, information requests/responses, application versions and complete decision history. Evidence bytes and sensitive metadata remain private/restricted and require the existing evidence access boundary in addition to provider review authority where applicable.

The console distinguishes responsible party, current stage and next action. Administrative corrections append history rather than rewriting or deleting a prior decision. An administrator without the exact permission or scope receives no protected application detail.

### Participant experience and localization

The participant application appears after legitimate activation/Profile Complete as **Request Resource Provider Status**. Registration and activation contain no provider checkbox, self-selected provider organization type, provider shortcut or provider-dependent Profile Complete rule.

Application, service-profile and administrative review surfaces use the shared Operational Workspace with readable opaque forms/evidence panels, explicit required/optional fields, preserved values, status/history, stale/conflict recovery and one clear next action. Provider categories use stable labels/glyphs rather than a rainbow taxonomy. Official Resource Provider status uses a restrained text/status treatment that cannot be confused with Verified, Trusted, Endorsed, Founding or paid status.

Platform-owned copy ships in `en-US`, Spanish, French, Italian and German. Desktop, intermediate and mobile layouts require keyboard operation, visible focus, associated validation, semantic status, screen-reader support, 200% reflow, reduced motion/transparency and no horizontal overflow.

## Authorization and projection requirements

- Applicant draft, submit, response, resubmit and approved-profile commands require a current authenticated session, active exact organization membership, no blocking restriction, current Profile Complete where required, and `resource.manage`.
- Review reads require current scoped `provider.application.read`; review transitions require current scoped `provider.application.review`. Both remain subject to existing administrator lifecycle, scope and condition evaluation.
- Organization A cannot read or mutate Organization B's application, profile, evidence or review communication. An administrator cannot use organization membership or a route parameter as administrative authority.
- Public/network organization discovery must not receive an Official Resource Provider projection or service field in this slice.
- Direct Firestore and Storage client access remains default-deny for provider aggregates, application history, commands, decisions, private review/evidence projections and provider status mutation.
- Commercial, Founding, sponsorship, membership and payment state cannot change eligibility, permission, ordering, review, decision, status treatment or service-profile truth.

## Acceptance evidence required before completion

Automated, emulator and configured-browser acceptance must prove:

1. Profile Complete prerequisite, post-activation entry, no registration shortcut, authoritative organization references and one-current-application behavior;
2. authorized manager success plus ordinary member, wrong-user, wrong-organization, inactive/restricted, stale-context, missing-permission and direct-client denial;
3. multi-select categories, required Other explanation, structured fields, attestation, private evidence references and participant-authored text preservation;
4. draft/submitted/under-review/information-requested/resubmitted/approved/denied transitions, expected-version conflicts, idempotent replay, append-only history/audit and recovery;
5. exact scoped admin read/review success plus admin-without-permission, wrong-scope, role-name-only and direct-client self-approval denial;
6. minimum-necessary console projection, controlled evidence access and durable request/response/decision history;
7. approval creates Official Resource Provider only, while denial/reapplication and existing restriction behavior remain truthful;
8. approved-provider profile maintenance, unknown availability/capacity treatment, organization/provider profile separation and no public field/search/routing projection;
9. loading, empty, validation, permission, stale, success, denial, recovery, responsive, accessibility, five-locale and clean-console behavior; and
10. configured real-environment organization and admin journeys followed by exact Auth/Firestore/Storage cleanup and zero residuals.

Run focused validators and emulators plus the canonical full local gate:

```bash
npm run check
```

Production CI must pass on the exact PR head and again on merged `main` before dependency authority is recalculated.

## Explicit non-scope

This authority does not permit annual revalidation or provider lifecycle `ADM-071`, Verified Resource Provider or any credibility badge/seal, Organization Verification, public provider search or recommendation, public service fields, contextual routing, provider referral/request connections, request-scoped messaging, provider resource publishing, provider-driven acquisition, performance ranking/analytics/API, advanced capacity-aware routing `RES-006`, paid placement, B6b convergence, Wave 4, Intelligence Dark, Presentation Mode, production sound or haptics.

Slice 3.7 and all later slices/gates remain unstarted. They may be authorized only after Slice 3.6 implementation and acceptance merge, post-merge production CI passes, and dependency eligibility is recalculated again from merged `main`.
