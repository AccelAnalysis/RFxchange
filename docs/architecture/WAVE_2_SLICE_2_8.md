# Wave 2 Slice 2.8 — Marker Activation & Admin 360

## Scope

This slice implements `GEO-011`, `ADM-063`, and `ADM-064`. It delivers the primary
Wave 2 activation success moment: a legitimate organization receives a real,
privacy-safe, coordinate-anchored marker in the controlled locality map. It also
composes authoritative Organization 360 context for an explicitly scoped platform
administrator.

The marker milestone does not release the organization into OPEN. Acquisition
continuity, orientation, first-value routing, and the terminal release gate remain
later work. Slice 2.9 was not implemented.

## Eligibility recalculation

Implementation began from merged `main` at
`ffcc6543022b5ade3d0050d538ce43fcbe32be38`. The canonical prerequisites were
verified Done:

- `GEO-005` — controlled selected-locality rendering;
- `GEO-007` — enforceable geography participation/release authority;
- `ORG-006` — confirmed canonical organization location;
- `ORG-012` — automatically derived Profile Complete.

No dependency correction was required.

## GEO-011 marker activation

`OrganizationMarkerActivation` is one current, organization-owned lifecycle
aggregate. Its stable identifier equals the organization identifier. The evaluator
requires:

1. durable organization identity;
2. an authorized organization relationship;
3. an allowed `organization-activation` geography-participation decision;
4. a confirmed canonical location in the same governing geography;
5. an Active `profile-complete` completion record;
6. no organization restriction, suspension, integrity hold, or termination.

Browser coordinates, form state, camera position, and animation state are not inputs.
The application service reuses `authorizeOrganizationOperation` and
`evaluateGeographyParticipation`; client state cannot grant marker eligibility.

The first activation timestamp is retained across repeated evaluations and later
deactivation. Recalculation with an unchanged status does not create another event.
Real transitions atomically persist current activation, append-only marker evidence,
and an organization audit event. Event/audit identities make a retried transition
idempotent.

## Coordinate privacy

The internal confirmed coordinate is never rewritten for presentation:

- **exact** uses the approved confirmed coordinate;
- **approximate** delegates to the deterministic Slice 2.6 public projection;
- **locality-only** derives a stable point from organization identity, canonical
  locality camera/bounds, and authoritative locality geometry without reading the
  private coordinate.

The locality-only position communicates locality membership, not a business address.
Changing the private internal point cannot change that public locality treatment.

## Controlled map integration

`CONTROLLED_MAP_SEMANTIC_LAYER_ORDER` extends the provider-neutral controlled map:

```text
locality fills/outlines
→ service areas
→ locality labels / relationship paths
→ entity markers
→ temporary marker emphasis
→ entity labels
→ map UI
```

The organization marker is projected from EPSG:4326 coordinates through the same
camera/viewport contract as the authoritative boundary geometry. Pan, zoom, resize,
and responsive changes reproject presentation coordinates without mutating the
underlying geographic point.

The SVG marker has no permanent exterior outline, uses a non-color organization
glyph, supports pointer and keyboard selection, exposes an accessible label, and
uses a separate temporary selection halo. First appearance is restrained and
disabled under `prefers-reduced-motion`.

## ADM-063 Organization 360

Organization 360 is an application projection over existing authoritative domain
records. It creates no shadow organization database or generic status flag.

Every projection and every tab retains the same explicit `ORGANIZATION:<id>` scope.
The required contexts are Overview, Users, Profile, Locations & Service Areas,
Capabilities, RFx, Responses, Referrals, Teaming, Resources, Credibility, Commerce,
Support, and Audit. Tabs require their existing granular administrative permission
and a matching active scoped grant. Unimplemented domains show an empty state;
future records are not fabricated.

Exact private organization location additionally requires the new minimum-necessary
`organization.location.private.read` permission in the same organization scope.
General profile or public-geography visibility does not reveal the internal address
or coordinate.

## ADM-064 status header

The status header composes independent canonical facts:

- account/access and restriction state;
- Profile Complete and marker state;
- Organization Verification;
- official resource-provider status;
- commercial plan/subscription and Founding recognition;
- primary geography and release state;
- investigation/integrity context;
- governing administrative case.

Verification, provider approval, commercial/Founding recognition, and restriction
are never collapsed into a credibility-like good/bad signal. Commercial state does
not alter marker eligibility or trust.

Active organization cases are filtered to the selected organization. Case number
and link require the case record's existing permission and a matching `CASE:<id>`
grant. Without it, the header may communicate only that controlled case context
exists; it withholds case identity and evidence.

## Persistence and security

Two server-managed collections are added:

- `organizationMarkerActivations` — mutable current singleton per organization;
- `organizationMarkerEvents` — append-only lifecycle evidence.

Firestore direct clients cannot read or write either collection. Marker events deny
client update/delete explicitly. Organization 360 remains a server-composed read
surface and does not broaden Firestore access or administrative GLOBAL authority.

## Validation

- focused marker and Organization 360 architecture tests;
- exact/approximate/locality-only privacy tests;
- incomplete profile, missing location/authority, denied geography, and blocked
  organization tests;
- idempotent activation/deactivation history tests;
- coordinate anchoring across camera/zoom projections;
- wrong-organization scope, missing private-data permission, and controlled case-link
  tests;
- Firestore schema/rules validation and emulator acceptance;
- responsive participant/admin browser QA;
- canonical repository `npm run check`.
