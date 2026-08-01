# RFxchange Spatial Onboarding and Home-Orbit Contract

**Status: canonical participant camera and activation-background contract**

## Purpose

The RFxchange map is the continuous spatial context behind authenticated activation and the default geographic workspace after organization activation. Registration is not a sequence of opaque pages that later opens an unrelated map. After the RFxchange account/session exists, activation occurs over the Exchange map and the camera progressively narrows from region to locality to organization.

This contract changes rendering and camera orchestration only. It does not grant geography authority, organization authority, marker eligibility, workspace access, or any other permission.

## Public and authenticated boundary

Before Firebase account creation and RFxchange session exchange, the Join account-creation form has no operational map behind it.

After the server-recognized activation journey exists, the map becomes visible as the edge-to-edge background beneath the registration overlays.

Public visitors still receive only the marketing/authentication surfaces. The spatial activation map is an authenticated activation surface and is not an anonymous Explore exception.

## Edge-to-edge composition

The spatial scene must fill the viewport from top to bottom and left to right. It renders beneath:

- the participant navigation;
- activation cards and progress;
- map controls;
- edge sheets;
- future operational overlays.

The map is not placed inside a card, constrained content column, or framed dashboard region. Registration surfaces use semi-transparent warm-ivory glass with blur and saturation so the geographic context remains visible.

Desktop camera padding accounts for the activation column. Mobile camera padding accounts for the activation sheet/vertical content. Padding changes composition only and never changes the authoritative geographic target.

In the authenticated interactive workspace, persistent search and view controls must preserve an unobstructed center lane for the organization marker. Desktop panel width must stop before the horizontal viewport center, and mobile panel height must stop before the vertical viewport center. Search-result expansion remains scrollable inside those bounds rather than covering the marker target.

## Canonical scene sequence

```text
ACCOUNT FORM — no operational map
→ REGIONAL AMBIENT — South Hampton Roads / Virginia Beach–Norfolk–Chesapeake context
→ LOCALITY AMBIENT — selected authoritative home locality
→ ORGANIZATION HOME — active privacy-safe organization marker
→ EXPLORE — participant-controlled map
```

The activation runtime derives the scene from server-recognized state:

- activation exists and no selected geography: Regional Ambient;
- selected geography exists and no active home-marker transition: Locality Ambient;
- active organization marker and authorized home-scene projection exist: Organization Home.

Home-locality selection updates the activation state, retrieves the server-authoritative `ControlledLocalityMapModel`, updates the existing Mapbox sources, and flies the camera to the locality without a page reload. A browser reload must not be used as the mechanism for changing spatial scenes.

## Camera presets

### Regional and locality ambient

- orbit period: **225 seconds per 360-degree revolution**;
- pitch: **60 degrees**;
- zoom: calculated with `fitBounds` so the configured region or authoritative locality fits the available screen area after overlay-aware padding;
- bearing: continuous while ambient rotation is enabled.

The locality zoom is deliberately not a fixed number. Different locality geometries, screens, and overlay dimensions require a fitted camera.

### Organization home

- orbit period: **225 seconds per 360-degree revolution**;
- pitch: **75 degrees**;
- zoom: **16**;
- target: the organization marker's approved map coordinate;
- bearing: continuous while ambient rotation is enabled.

The organization target must use the existing privacy projection. Exact private coordinates must never be substituted for locality-only or approximate public marker settings.

## Motion preference

Account includes an **Ambient map rotation** setting.

The browser preference is stored under:

```text
rfxchange:map-rotation-enabled
```

Default is enabled. Turning the setting off stops ambient rotation in activation, locality, and organization-home scenes. Turning it on can resume the active ambient scene without reloading the page.

`prefers-reduced-motion: reduce` always suppresses orbit and animated flight regardless of the account preference.

The motion setting changes viewport behavior only. It does not change map data, geography selection, marker state, or account authorization.

## User interaction

In the authenticated interactive workspace, drag, rotate, pitch, wheel, or touch interaction immediately stops automatic orbit for the current scene. The participant then controls the camera.

Activation background scenes are noninteractive so map gestures cannot compete with registration forms.

The authenticated home scene retains production map capabilities including Mapbox Search Box API search, Fit home, 2D/Perspective/3D view controls, navigation controls, authoritative locality focus/mask, and persistent organization-marker interaction.

## Persistent organization marker

The current participant organization's marker is a first-class native GeoJSON map feature.

Required behavior:

- the marker is anchored to its approved longitude/latitude;
- camera bearing, pitch, zoom, resize, and orbit do not change that coordinate;
- the RF symbol and organization name use viewport-aligned text;
- the marker label remains visible without opening a popup;
- `text-allow-overlap` and `text-ignore-placement` prevent the home marker from disappearing behind ordinary label collision;
- persistent interface panels preserve an unobstructed center lane so the organization marker is visibly rendered on desktop and mobile;
- the home marker is not dependent on popup state and is not folded into ordinary clustering.

The popup is additional detail. Closing it must never remove the organization marker.

## Activation-to-workspace transition

When server state confirms the active marker and controlled-platform authorization:

1. activation overlays fade away;
2. the activation map changes to Organization Home;
3. the camera flies to the approved marker at zoom 16 and pitch 75 degrees;
4. ambient orbit begins if allowed;
5. the runtime enters the authorized geography workspace.

The home-scene endpoint must resolve the authenticated organization, active marker, confirmed location, authoritative locality geometry, and privacy-safe projected marker. It must reject unauthenticated, activation-incomplete, restricted, or otherwise unauthorized access.

The selected-locality spatial-model endpoint must resolve the trusted RFxchange session, persisted primary geography selection, canonical geography definition, and authoritative TIGER boundary. Browser-provided geometry or viewport coordinates are never accepted as locality authority.

## Implementation authority

Canonical implementation files include:

- `src/components/map/ExchangeSpatialScene.tsx`;
- `src/components/map/map-motion-preference.ts`;
- `src/components/onboarding/SpatialActivationExperience.tsx`;
- `src/components/onboarding/ActivationJourneyClient.tsx`;
- `src/components/account/MapMotionPreferenceToggle.tsx`;
- `app/api/onboarding/spatial-model/route.ts`;
- `app/api/onboarding/home-scene/route.ts`;
- `app/join/page.tsx`;
- `app/geography/canvas/page.tsx`;
- `app/organization-profile/page.tsx`.

`MapboxLocalityCanvas` remains available for existing reference/location surfaces and deterministic convergence work. `ExchangeSpatialScene` is the authority for the activation background and organization-home ambient/operational entry.

## Regression guardrails

The following are regressions:

- showing the operational map before account/session creation;
- placing the activation map inside a card instead of edge-to-edge;
- using an opaque activation page that hides the spatial scene;
- reloading the page when a participant selects a home locality;
- using a browser-provided geometry instead of the server-authoritative spatial model;
- using an orbit period other than 225 seconds for canonical locality or organization scenes without an approved architecture change;
- using a fixed locality zoom instead of fitting its bounds;
- changing organization-home pitch from 75 degrees or zoom from 16 without an approved architecture change;
- removing the Account rotation toggle;
- ignoring reduced-motion preferences;
- removing production search, fit-home, or view-mode controls from the authenticated map;
- implementing the home marker as popup-only;
- allowing a persistent search or control panel to cover the viewport-centered organization marker;
- using a floating DOM element whose coordinate drifts during bearing changes;
- centering the organization camera on an unapproved private coordinate;
- allowing viewport state to establish geography or marker authority.

Run:

```bash
npm run validate:spatial-onboarding-home-orbit
```

before merging changes to the activation background, camera presets, Account map settings, home marker, selected-locality transition, or authenticated geography entry.
