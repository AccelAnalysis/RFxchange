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
- camera persistence;
- transient place/geography search and search-result highlighting.

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

## Home locality contract

The participant map has one **home locality** at city/county-equivalent level. The home locality is not a viewport lock.

Where authenticated organization context is available, the confirmed organization location geography is preferred as the home-locality focus. The user's persisted primary operating geography is the fallback authority source when organization-specific location context is unavailable. The bundled Portsmouth model is only the deterministic local/dev fallback while the current reference snapshot remains limited.

`ControlledLocalityMapModel.selectedGeography` is interpreted by the Mapbox renderer as this home-locality focus. The selected authoritative boundary is rendered with contrast/accent outlines and a low-opacity focus fill. A world-sized translucent neutral mask excludes the home-locality geometry, leaving the home locality clear while visually muting everything outside it.

The Mapbox production renderer intentionally does **not** render the old surrounding-locality fill/outline treatment. Adjacent localities remain part of the provider-neutral model for reference/acceptance behavior, but the participant map visually focuses only the home locality.

## Boundary integration

`ControlledLocalityMapModel` is the renderer input. Its authoritative EPSG:4326 Polygon/MultiPolygon geometry is copied into Mapbox GeoJSON without changing geography identity or provenance.

The production participant layer order is:

1. Mapbox Standard basemap;
2. translucent outside-home-locality mask;
3. low-opacity home-locality fill;
4. home-locality contrast outline;
5. home-locality accent outline;
6. transient search-result extent/highlight;
7. entity and search markers;
8. map UI controls.

The home boundary remains authoritative Census/TIGER geometry. A Mapbox search-result bounding box is only a temporary exploratory highlight and is never represented as an RFxchange authoritative boundary.

## Camera and zoom behavior

The canonical `GeographyCameraPlan` supplies the **initial home-locality fit**: bounds, center, pitch, bearing, padding, and fit maximum. It does not cap later participant exploration.

The Mapbox canvas allows the provider's full supported zoom range from zoom `0` through zoom `24`. Users may pan, zoom, pitch, rotate, or search anywhere on the basemap without changing home locality or participation authority. The `Fit home` action returns the camera to the home-locality authoritative bounds.

The participant camera is persisted in browser session storage as navigation preference only. Persisted camera state is never read by geography authorization services.

## Search behavior

The Intelligence map exposes a real Mapbox Search Box API text search rather than a decorative search field. A submitted search may resolve countries, regions, districts, places/cities, localities, neighborhoods, streets, addresses, and POIs. Search is transient: RFxchange does not persist returned Mapbox search data as canonical geography data.

Selecting a result:

- flies or fits the camera to the returned coordinates/bounding box;
- places a transient search marker;
- shows a temporary blue result-extent highlight when a bounding box is available;
- does not modify the home-locality mask, operating geography, release state, or authorization.

## Locality interaction

Clicking the authoritative home locality may expose its name and release state. Map interaction does not silently switch operating geography. A future switch-geography action must call the existing server-authorized primary-geography workflow explicitly.

## Marker behavior

Location candidates, confirmed points, and organization markers use real longitude/latitude coordinates through Mapbox marker projection. Pan, zoom, pitch, bearing, resize, and responsive layout must not alter the canonical coordinate.

Future highlighted markers such as top resource providers, sponsors, opportunities, and other featured network entities layer on the same full-map renderer without changing the home-locality focus contract.

## Token configuration

Mapbox GL JS requires a browser-visible public access token beginning with `pk.`.

Local development:

```dotenv
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your-public-token
```

Place this value in `.env.local`, which is ignored by Git.

Do not place a Mapbox secret token beginning with `sk.` in `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`, source code, committed environment files, or other browser-delivered configuration. Production/staging should configure the same `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` environment variable in the hosting platform using a public token restricted to approved RFxchange origins where practical.

## Current data boundary

The current Wave 2 bundled authoritative reference snapshot includes Portsmouth plus the currently seeded surrounding Hampton Roads localities. Those bundled geometries support deterministic home-locality focus for the currently seeded geographies.

The Mapbox basemap and search are not limited to that reference snapshot: users can navigate and search the full provider map. Additional localities do not become selectable/participatory merely because the basemap or Mapbox search displays them. Expanding the canonical geography catalog and authoritative boundary repository remains a separate data/authority concern.

## Regression guardrail

Participant spatial surfaces must use `MapboxLocalityCanvas`. The SVG renderer may remain for deterministic tests/reference rendering, but it must not replace the production participant map without an explicit architecture decision.
