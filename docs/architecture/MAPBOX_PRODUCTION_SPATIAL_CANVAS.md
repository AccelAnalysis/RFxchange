# RFxchange Mapbox Production Spatial Canvas

**Status: renderer integration authority; no geography Feature ID status change**

## Decision

Mapbox GL JS is the canonical participant-facing map renderer for the current RFxchange application unless a later architecture decision formally replaces the renderer. The geography domain remains provider-neutral.

The prior `ControlledLocalityCanvas` SVG implementation remains a deterministic reference/acceptance renderer for geography projection tests. It is not the primary participant application map.

## Authority boundary

Mapbox owns viewport/rendering behavior only:

- continuous pan and zoom;
- pitch and bearing;
- basemap rendering;
- coordinate projection;
- interactive layer rendering;
- marker placement;
- camera persistence.

Mapbox viewport state never grants geography participation, organization authority, marker eligibility, or any other RFxchange permission.

Canonical RFxchange services continue to own:

- geography identity and FIPS metadata;
- release state;
- primary operating geography selection;
- participation authorization;
- authoritative Census/TIGER boundary provenance;
- organization location/privacy projections;
- service geography;
- marker eligibility.

## Boundary integration

`ControlledLocalityMapModel` is the renderer input. Its authoritative EPSG:4326 Polygon/MultiPolygon geometry is copied into a Mapbox GeoJSON source without changing geography identity or provenance.

The semantic locality layers remain deterministic:

1. surrounding fill;
2. selected fill;
3. surrounding outline;
4. selected outline contrast;
5. selected outline accent.

The production basemap remains visible under the RFxchange overlays. Surrounding geography is contextual; the selected operating geography remains visually dominant.

## Camera behavior

The canonical `GeographyCameraPlan` supplies the initial bounds, center, pitch, bearing, padding, and maximum zoom. After initial orientation, users may pan and zoom beyond the selected locality without changing the selected locality or participation authority.

The participant camera is persisted in browser session storage as navigation preference only. Persisted camera state is never read by geography authorization services.

## Locality interaction

Clicking an authoritative locality may expose its name and release state. Map interaction does not silently switch operating geography. A future switch-geography action must call the existing server-authorized primary-geography workflow explicitly.

## Marker behavior

Location candidates, confirmed points, and organization markers use real longitude/latitude coordinates through Mapbox marker projection. Pan, zoom, pitch, bearing, resize, and responsive layout must not alter the canonical coordinate.

## Token configuration

Mapbox GL JS requires a browser-visible public access token beginning with `pk.`.

Local development:

```dotenv
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your-public-token
```

Place this value in `.env.local`, which is ignored by Git.

Do not place a Mapbox secret token beginning with `sk.` in `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`, source code, committed environment files, or other browser-delivered configuration. Production/staging should configure the same `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` environment variable in the hosting platform using a public token restricted to approved RFxchange origins where practical.

## Current data boundary

The current Wave 2 reference data includes Portsmouth plus the currently seeded surrounding Hampton Roads localities. Mapbox removes the artificial viewport lock and provides real broader-map navigation immediately, but additional localities do not become selectable/participatory merely because the basemap displays them. Expanding the canonical geography catalog/release configuration remains a separate data/authority concern.

## Regression guardrail

Participant spatial surfaces must use `MapboxLocalityCanvas`. The SVG renderer may remain for deterministic tests/reference rendering, but it must not replace the production participant map without an explicit architecture decision.
