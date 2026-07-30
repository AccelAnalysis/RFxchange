# Slice 2.8 — Marker Activation & Admin 360

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs

- `GEO-011` — Organization marker activation
- `ADM-063` — Organization 360
- `ADM-064` — Organization 360 status header

## Objective

Deliver the primary Wave 2 activation success moment—the organization's **real marker appears on the real controlled map**—and simultaneously provide platform administrators a scoped, authoritative organization context for understanding that organization's state.

At slice exit:

- a legitimate Profile Complete organization with a confirmed canonical location in an allowed/released geography receives its real coordinate-anchored marker;
- marker presentation respects the organization's public location visibility without leaking private precision;
- administrators can open Organization 360 without losing organization scope;
- the Organization 360 header immediately communicates the organization's material account/verification/provider/founder/geography/restriction/investigation state and links governing case context where applicable.

This slice does not release the participant into OPEN; later education/first-value/release gates still apply.

## Must read

- `/AGENTS.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/context/USER_JOURNEY.md`
- `docs/context/MAP_AND_GEOGRAPHY.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/ADMINISTRATION.md`
- `docs/context/CREDIBILITY_SYSTEM.md`
- `docs/context/COMMERCIAL_MODEL.md`
- `docs/context/BRAND_AND_UX.md`
- `docs/design/README.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- `docs/design/MAP_VISUAL_SYSTEM.md`
- canonical tracker/dependency map
- `docs/slices/WAVE_2_ROADMAP.md`
- merged Slice 2.2 controlled-locality rendering/layer contracts
- merged Slice 2.5 organization authority and admin claims contracts
- merged Slice 2.6 canonical location/privacy/service-geography contracts
- merged Slice 2.7 essential profile/Profile Complete contracts
- existing administrative authorization, scoped-grant, audit, case, universal-search and portal-shell architecture from Wave 1

## Prerequisite state

Before beginning, recalculate from merged `main`.

Canonical marker dependencies are:

- `GEO-005` — selected locality rendering;
- `GEO-007` — geography release state/participation authority;
- `ORG-006` — confirmed canonical organization location;
- `ORG-012` — legitimate Profile Complete.

`GEO-011` must not be implemented as a client-only side effect that appears merely because the browser has coordinates.

`ADM-063` and `ADM-064` must reuse the existing administrative scope/permission/case/audit architecture rather than creating a second admin authority model.

If 2.6 or 2.7 is not merged and those prerequisites are not truly Done, stop rather than weakening marker activation conditions.

## Product rules

### `GEO-011` — Organization marker activation

The real organization marker is an activation state derived from authoritative organization/geography/profile data.

A marker becomes active only when all governing conditions are satisfied, including:

- durable organization exists;
- legitimate organization relationship/authority exists where required by activation flow;
- primary geography is valid under current release/participation rules;
- confirmed canonical organization location exists;
- essential profile is genuinely Profile Complete;
- no blocking state explicitly prevents map presence.

The marker must not be created from provisional organization-resolution data, unconfirmed geocoder candidates, client viewport state or a simple form-complete flag.

#### Coordinate and privacy behavior

- Exact-public organizations may render at the approved confirmed coordinate.
- Approximate-public organizations must render from a deterministic privacy-safe public projection rather than exposing the internal exact point.
- Locality-only organizations must not reveal a point that permits reconstruction of the private internal coordinate. Their map presence should represent locality membership through an approved privacy-safe map treatment.
- Internal/admin views may use higher precision only when permission and purpose allow it.

Do not rewrite the internal canonical location in order to produce a public privacy projection.

#### Marker anchoring

All point markers must remain anchored to geographic coordinates or a deterministic locality-derived privacy-safe geographic position. They must not be positioned with CSS viewport pixels or DOM offsets that drift when camera/zoom changes.

Use the same geographic projection/camera contract as the controlled locality map so boundaries, labels and markers transform together.

#### Marker visual semantics

Follow `docs/design/MAP_VISUAL_SYSTEM.md`.

- No permanent outline around organization pins.
- Focus/selection state may use temporary halo/elevation/scale treatment as defined by the design system, but it must be visibly stateful rather than part of every marker.
- Marker categories must not rely on color alone.
- Gold remains an attention/connection/brand accent rather than universal marker fill.
- Signal Blue communicates intelligence/link/data semantics where applicable; Growth Green communicates growth/outcome semantics, not credibility or payment.
- Commercial/Founding/provider status must not make an organization look more objectively credible or more qualified.
- Retina/high-density rendering should preserve crisp marker geometry and iconography.
- Marker motion on first activation should be restrained, accessible and disable/reduce under `prefers-reduced-motion`.

#### Activation transition

The first real marker appearance is a deliberate success moment in the user journey.

Activation should be idempotent. Re-rendering, refreshing, signing in again or changing camera should not create duplicate markers or duplicate activation records.

If the product records a marker-activation event, preserve it as canonical lifecycle/audit evidence without making UI animation itself the source of truth.

### `ADM-063` — Organization 360

Provide one authoritative admin view that preserves organization scope while exposing the required contexts:

- Overview
- Users
- Profile
- Locations & Service Areas
- Capabilities
- RFx
- Responses
- Referrals
- Teaming
- Resources
- Credibility
- Commerce
- Support
- Audit

The view may show stage-appropriate empty states for domains not yet implemented. Do not fabricate future data just to populate tabs.

Organization 360 is a projection/composition surface over authoritative domain state. It is not a duplicate organization database and must not introduce shadow status fields.

The selected organization context must remain explicit across tabs, filters and drill-downs so an administrator cannot accidentally operate on a different organization because UI scope was lost.

Admin navigation/action availability must respect existing permission capabilities, scoped grants, minimum-necessary-data rules, restriction state and sensitive-action conditions.

### `ADM-064` — Organization 360 status header

The header must prominently and accurately communicate material organization state, including where currently available:

- account/access state;
- Organization Verification state;
- official provider status;
- Founding/commercial status as a separate commercial fact;
- primary geography;
- restrictions;
- active investigation/integrity hold indicators;
- relevant governing case link/identifier when an active case controls or explains the state.

Do not collapse these independent concepts into one generic "good/bad" status.

The header must make it immediately possible to distinguish a normal active organization from restricted, suspended, integrity-hold or other exceptional states without implying that Founding/payment/Verified are equivalent.

Where the admin lacks permission to view sensitive case/evidence detail, show only the minimum permitted state and provide an appropriately controlled path rather than leaking evidence in the header.

## Admin scope and security requirements

- Organization 360 requires platform administrative authentication and the relevant capability/scoped grant.
- Organization scope must be explicit on every query/action.
- Exact private organization location must be subject to minimum-necessary-data permissions; do not expose it in Organization 360 merely because admins can view public geography.
- Case links must respect case permissions.
- Sensitive claim/location/credibility/evidence content must preserve its existing storage/access boundaries.
- The admin surface must reuse canonical audit and administrative action patterns for mutations.
- Do not add broad GLOBAL authority simply to make Organization 360 convenient.

## Map layer and interaction requirements

Integrate marker rendering with the canonical controlled locality layer hierarchy without allowing point layers to obscure authoritative geography semantics.

The implementation should establish an explicit point-marker layer contract for future organization/opportunity/resource layers rather than scattering ad hoc DOM markers across surfaces.

At minimum:

- authoritative locality fills/outlines remain deterministic;
- organization marker layer is above geography fills/outlines as appropriate for interaction while locality borders remain visually legible;
- labels, markers, hover/focus popovers and connection paths have deterministic z/layer relationships;
- pointer/keyboard interaction is accessible;
- marker popovers/drawers do not move the underlying geographic source coordinate;
- camera changes do not change the organization's underlying marker location.

Do not force a permanent commitment to SVG or one map provider. Preserve provider-neutral coordinate/layer semantics.

## Acceptance intent

- `GEO-011`: after minimum profile completion and all canonical marker prerequisites, the organization receives its real map presence in the selected/controlled geography with privacy-safe coordinate behavior and geographic anchoring.
- `ADM-063`: opening any organization gives an authorized administrator the required Organization 360 contexts without losing organization scope.
- `ADM-064`: an administrator can immediately distinguish normal active organizations from restricted/integrity-hold/other material states and navigate to the governing case where permitted.

## Expected implementation qualities

### Marker activation

- typed marker eligibility/activation state;
- server-authoritative eligibility evaluator;
- idempotent activation transition;
- public marker projection derived from location privacy rules;
- deterministic map layer contract;
- real-coordinate anchoring tests across zoom/camera changes;
- exact/approximate/locality-only privacy tests;
- tests for incomplete profile, unconfirmed location, unreleased/restricted geography and blocked organization states;
- reduced-motion-safe activation behavior;
- accessible marker interaction and high-density visual rendering.

### Admin 360

- scoped organization context model;
- permission-aware tab/data projections;
- status header composed from authoritative account, verification, provider, commercial, geography, restriction and case state;
- no shadow status source of truth;
- minimum-necessary-data handling for private location/evidence;
- tests for wrong scope, missing capability, restricted detail, case linking and state distinction;
- responsive/admin UX following `docs/design/RFxchange_DESIGN_SYSTEM.md`.

## Explicit non-scope

Do **not** implement in Slice 2.8:

- acquisition-context continuity (`ACQ-002`, `ACQ-003`);
- orientation/tutorial features (`EDU-001`–`EDU-008`);
- first-value routing (`EDU-009`);
- OPEN release (`EDU-010`);
- detailed profile enrichment beyond the completed essential profile;
- Organization Verification workflow if not already owned by another feature;
- future opportunity/resource/provider marker systems except for reusable layer abstractions genuinely necessary for `GEO-011`;
- institutional locality administration;
- broad admin CRUD for every Organization 360 tab when the underlying domain is not yet in scope.

## Exit checkpoint

A legitimate activated organization can see its real privacy-safe marker anchored in the controlled map environment, and authorized platform administrators can inspect that organization through a scoped Organization 360 view with an accurate status header.

This is the primary Wave 2 map-success milestone, but it is not OPEN. Acquisition continuity, orientation, first value and terminal release gates remain later slices.

## Completion discipline

Mark only `GEO-011`, `ADM-063`, and `ADM-064` Done when their individual acceptance conditions and validation evidence pass.

After merge, recalculate the dependency graph and report whether Slice 2.9 is eligible. Do not begin Slice 2.9 unless separately authorized.