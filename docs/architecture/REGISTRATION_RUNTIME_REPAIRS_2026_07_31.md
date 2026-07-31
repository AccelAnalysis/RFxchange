# Registration Runtime Repairs — 2026-07-31

This repair gate addresses configured-development defects found while exercising the merged Wave 2 activation journey. It carries no new Feature IDs and does not change the 31/43 Activation completion count.

## Legal acceptance links

The registration policy step now links directly to public, readable RFxchange Terms of Service, Platform Rules, and Privacy Policy routes. The public marketing footer exposes the same legal destinations.

The Wave 1 versioned legal acknowledgement domain remains the durable legal-evidence authority. The current activation bridge does not pretend that a boolean replaces the canonical versioned acknowledgement record, and future material policy changes may require renewed action.

## Census-authoritative home locality

Home locality selection is no longer a Portsmouth-only release list. The participant searches a city, county, or locality plus two-letter state/territory code. The server queries U.S. Census Bureau TIGERweb county-equivalent and incorporated-place layers, returns bounded candidate metadata, and resolves the selected opaque reference again server-side before persisting a canonical GeographyDefinition.

Browser-supplied geometry, FIPS codes, release state, bounds, or camera metadata never establish geography authority.

The dynamic definition uses Census GEOID/FIPS metadata, 2025 TIGERweb provenance, authoritative polygon bounds, and a released participation state for the supported U.S. registration flow. Existing bundled Hampton Roads identifiers remain compatible where their FIPS code matches a resolved Census locality.

The TIGERweb boundary repository now falls back to a live authoritative polygon query for canonical dynamic geographies not present in the bundled snapshot. Organization address confirmation therefore continues to filter Census geocoder candidates against the selected authoritative locality boundary rather than accepting an address merely because the browser selected a name.

The activation and controlled Exchange map routes consume the participant's persisted canonical geography. They must never fall back to Portsmouth after another home locality has been selected.

## Email verification progression

The verification screen now has observable state:

- sending a verification email reports the target and next action;
- send failures are no longer silently swallowed at account creation;
- `I verified — continue` reloads the signed-in Firebase user;
- if Firebase still reports unverified, the participant receives an explicit instruction instead of a no-op;
- after Firebase reports verified, RFxchange forces a fresh Firebase ID token and re-exchanges the server session before progressing;
- the refreshed RFxchange session must itself report verified before organization authority work continues.

This keeps email verification provider-authoritative while preventing a stale RFxchange session from trapping a legitimately verified participant.

## Acceptance

Repository acceptance requires regression tests, architecture guardrails, Functions tests, Firebase emulator smoke tests, TypeScript, lint, and production build. Real-provider acceptance additionally requires the configured Firebase project, live email-delivery configuration, browser interaction, and live Census/TIGERweb network access.
