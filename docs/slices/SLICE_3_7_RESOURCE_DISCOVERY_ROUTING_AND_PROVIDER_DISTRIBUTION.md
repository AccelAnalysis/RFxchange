# Slice 3.7 — Resource Discovery, Routing & Provider Distribution

**Status: AUTHORIZED BY `SLICE_3_7_EXECUTION_AUTHORITY.md` FROM MERGED `main`**

## Feature IDs

- `RES-004` — Provider service-territory map presence
- `RES-005` — Contextual provider recommendations
- `DSC-011` — Contextual official resource search
- `REF-006` — Provider referral/request connection
- `RES-007` — Request-scoped provider communications
- `RES-008` — Provider resource/program publishing
- `ACQ-008` — Provider-shared opportunity/profile invitations

## Objective

Make Official Resource Providers useful inside the live Network: visible by where they serve, searchable by need/eligibility/geography, surfaced in context, connectable through consented referrals, communicative only inside authorized requests, able to publish resources, and able to invite businesses through controlled acquisition routes.

## Must read

- `/AGENTS.md`
- `docs/context/README.md`
- `docs/context/ACQUISITION_AND_RETENTION.md`
- `docs/context/MAP_AND_GEOGRAPHY.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/brand/README.md`
- `docs/brand/BRAND_GATE_B0_RECONCILIATION.md`
- `docs/brand/MAP_AND_DATA_VISUAL_GRAMMAR.md`
- `docs/brand/CONTENT_AND_MESSAGING_SYSTEM.md`
- `docs/brand/MOTION_SYSTEM.md`
- `docs/brand/BRAND_EXPERIENCE_ACCEPTANCE_MATRIX.md`
- `docs/design/README.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- `docs/design/MAP_VISUAL_SYSTEM.md`
- canonical tracker/dependency map
- merged Slices 3.1, 3.2, 3.5 and 3.6
- `docs/slices/WAVE_3_ROADMAP.md`

## Product rules

- `RES-004`: display where a provider serves businesses, not merely the office address; service territory remains distinct from physical location.
- `RES-005`: surface relevant approved providers while a business is pursuing a need. Recommendations are contextual routing suggestions, not endorsements or guarantees.
- `DSC-011`: search Official Resource Providers by service, geography, eligibility/need context and other approved service-profile fields. Search consumes `RES-003` structured provider data.
- `REF-006`: provider connection uses the referral consent/minimum-necessary boundary and supports provider accept, decline or redirect when inappropriate.
- `RES-007`: communication exists only within the authorized request/referral context; it is not open unsolicited messaging.
- `RES-008`: approved providers may publish services, programs, workshops, funding programs, resources and announcements with status/visibility controls and provenance to the provider organization.
- `ACQ-008`: approved providers may share permitted opportunities or profile-completion invitations; external participants retain acquisition context through legitimate activation.

## Brand and spatial rules

- This slice is the first legitimate source for public provider **service fields**.
- Service fields must show authoritative service territory, not infer coverage from office location.
- Provider office nodes, organization service areas, provider service territories, opportunity geography and active locality remain visually and semantically distinct.
- Use controlled neutral/pattern/opacity treatment rather than a rainbow category palette; overlapping fields must remain legible.
- Unknown current availability must be stated as unknown, not inferred from approval or profile presence.
- Contextual recommendations explain why a provider may be relevant and never imply endorsement, guaranteed eligibility, capacity or response time.
- Provider connection reuses referral state and may use a real golden path only from the governed request/referral relationship.
- Growth Green requires a later appropriate confirmed outcome; it cannot mean provider listing, recommendation, referral acceptance or service start.
- Map/list/detail parity, reduced motion and accessible text equivalents are required.

## Acceptance intent

- provider territories render independently of office nodes and respect locality/release/privacy rules;
- provider search/recommendation identifies appropriate providers from structured profiles without claiming guaranteed eligibility;
- a business can authorize a provider connection and the provider can accept, decline or redirect;
- request-scoped communication cannot be used outside the authorized relationship;
- approved providers can publish permitted resources and non-approved organizations cannot;
- provider-shared invitations use versioned communications, preserve context and do not bypass activation;
- map/search surfaces integrate official resources without cluttering/displacing organization discovery;
- service fields, provider status, recommendations and referral paths remain truthful, accessible and domain-authoritative.

## Expected implementation qualities

Server-side provider/status checks, typed service-territory projection, referral reuse rather than parallel handoff architecture, communication correlation/audit, moderated publishing state, map/list/detail synchronization, shared field/path primitives and security tests for non-provider, cross-request and cross-org access.

## Explicit non-scope

Do not implement advanced capacity-aware routing (`RES-006`), provider staff assignment, provider analytics/API, public performance ranking, paid placement, verified outcomes, Wave 4 RFx readiness logic, credibility seals, Intelligence Dark, Presentation Mode, production sound or haptics.

## Exit checkpoint

A business can find the right **door** in context, authorize a connection and interact with an approved provider without RFxchange replacing the provider's intake authority, institutional system of record or current-capacity decision.

## Completion discipline

Recalculate dependencies after merge before authorizing Slice 3.8. Brand Gate B6b may then be evaluated and, only through a separate authority update, authorized to converge the completed live Network lenses without changing Feature-ID state.
