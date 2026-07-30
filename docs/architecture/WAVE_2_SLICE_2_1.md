# Wave 2 Slice 2.1 — Geography Authority

## Scope

This slice implements:

- `GEO-001` primary operating geography selection;
- `GEO-002` server-side geography validation;
- `GEO-003` canonical FIPS and geography metadata;
- `GEO-007` geography release states;
- `GEO-008` bounds-derived/default locality camera.

Boundary geometry loading and rendering remain Slice 2.2.

## Canonical geography contract

`GeographyDefinition` is provider-independent canonical metadata. It preserves:

- stable geography identity, country and FIPS code where applicable;
- locality name and type;
- an authoritative boundary source reference without coupling the domain to a map provider;
- parent and adjacent geography identities;
- release state and limited-participation policy;
- authoritative bounds and default camera configuration.

The boundary reference identifies its authority, dataset, vintage and source feature. Slice 2.2 can use that contract to ingest/render geometry without making map viewport state the source of geography truth.

## Release authority

The four release states have explicit application semantics:

- `released` permits the supported participation activities;
- `visible-unreleased` is context only and denies participation;
- `limited` permits only the activities declared by canonical release policy;
- `restricted` requires a current active server-side participation authorization for the user and activity.

The application service loads both geography and authorization records from server repositories. It never accepts an authorization/grant object from the client.

## Lifecycle and selection

ARC-007 deliberately deferred attaching early access journeys to later identities. Slice 2.1 extends that existing lifecycle abstraction with an optional, immutable user binding after the visitor stage.

Primary selection requires:

1. a trusted `AuthenticatedServerContext`;
2. an access journey bound to that exact RFxchange user;
3. the `account-activated` or current `geography-selected` lifecycle state;
4. a canonical geography record;
5. a successful release/participation policy decision.

Firestore commits `primaryGeographySelections/{userId}` and the `geography-selected` access-journey transition in one transaction. The selection record retains both user and journey identity.

## Orientation gate

`requireForOrientation` does not trust a route, query parameter, local storage value or map viewport. It reloads:

- the bound access journey;
- the user's persisted primary selection;
- the current canonical geography definition;
- current server-side participation authorizations.

It then re-evaluates the `orientation` activity. A locality that becomes unreleased, loses its limited orientation permission, or lacks required restricted authorization stops satisfying the gate even if stale browser state still names it.

## Camera contract

`resolveGeographyCameraPlan` emits a provider-neutral `fit-authoritative-bounds` plan using canonical bounds, center, pitch, bearing, padding and maximum zoom. No locality-specific viewport is hard-coded in application or UI code.

## Persistence and security

The canonical Firestore collections are:

- `geographies`;
- `primaryGeographySelections`;
- `geographyParticipationAuthorizations`.

All remain server managed under the existing deny-by-default Firestore posture. Geography definition and authorization writes are trusted-server operations; future administration workflows must add scoped permissions and audit evidence before exposing state mutation.

## Validation

- `test/geography-authority.test.mjs` covers metadata, all release states, unknown/wrong-user denial, restricted grants, the orientation gate and camera derivation.
- the existing schema, repository, index and rules tests include the new collections and atomic-write support;
- `scripts/validate-geography-authority.mjs` gates the architecture and CI wiring;
- `scripts/smoke-geography-authority-emulator.mjs` proves production Firestore adapters, the atomic selection/lifecycle transition, persisted orientation reload and denial of direct client reads.
