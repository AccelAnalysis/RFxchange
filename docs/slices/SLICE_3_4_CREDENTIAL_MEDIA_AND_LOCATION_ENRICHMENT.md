# Slice 3.4 — Credential, Media & Location Enrichment

**Status: COMPLETE VIA PR #128**

## Feature IDs

- `ORG-015` — Certifications, licenses and identifiers
- `ORG-018` — Documents, logo, images and portfolio
- `ORG-019` — Additional organization locations

## Objective

Add credential/identifier provenance, controlled organization media/documents and additional operating locations without weakening the existing authority, privacy, storage, geography or brand-evidence model.

## Must read

- `/AGENTS.md`
- `docs/context/README.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/CREDIBILITY_SYSTEM.md`
- `docs/context/MAP_AND_GEOGRAPHY.md`
- `docs/brand/README.md`
- `docs/brand/BRAND_GATE_B0_RECONCILIATION.md`
- `docs/brand/MAP_AND_DATA_VISUAL_GRAMMAR.md`
- `docs/brand/CONTENT_AND_MESSAGING_SYSTEM.md`
- `docs/brand/BRAND_EXPERIENCE_ACCEPTANCE_MATRIX.md`
- `docs/design/README.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- `docs/design/MAP_VISUAL_SYSTEM.md`
- canonical tracker/dependency map
- merged `INF-008` storage and Wave 2 location/privacy contracts
- merged Slice 3.3 profile contracts
- `docs/slices/WAVE_3_ROADMAP.md`

## Product rules

### `ORG-015`

Support certifications, licenses, UEI, CAGE, SAM and other approved identifiers with issuer/source, status, relevant dates and evidence/provenance. Recording an identifier or uploaded evidence does not automatically award a Verified credibility badge.

### `ORG-018`

Store organization logo/images/documents/portfolio assets through the existing organization-owned, private-by-default Storage architecture. Public publication is explicit; sensitive evidence remains private. Do not implement future entitlement limits unless already approved by another active feature.

### `ORG-019`

Support additional locations beyond the primary location using canonical geocoding/geography/privacy concepts. Each location distinguishes internal exact position from approved public projection and does not redefine the primary operating geography unless an authorized workflow explicitly does so.

## Brand and spatial rules

- Credentials and identifiers use provenance/status language, not credibility seals, unless the later Credibility domain has actually awarded a badge.
- Organization media must be real, organization-owned or appropriately licensed; no fake portfolio evidence or composited product claims.
- Additional locations must use a subordinate/satellite location treatment so multiple locations do not appear to be separate organizations.
- A location marker remains anchored to its approved exact/approximate/locality-only projection; visual treatment cannot reveal private coordinates.
- The primary organization node remains visually distinguishable from subordinate locations.
- Public documents and images require explicit publication state, accessible labels and appropriate responsive optimization.
- Paid or Founding status does not alter credential truth, verification appearance, location authority or publication rights.

## Acceptance intent

- credentials/identifiers preserve source/provenance and cannot masquerade as verified when merely self-reported;
- authorized organization users can manage approved media/documents without cross-organization access;
- public asset projection excludes private/sensitive objects;
- multiple locations can be added and mapped with the same privacy guarantees as the primary location;
- subordinate-location visuals do not imply separate organizations or expose private exact positions;
- media/document loading, empty, error, permission and recovery states are accessible and truthful.

## Expected implementation qualities

Reuse stable profile, Storage, geocoding, service-geography, audit and shared design abstractions; validate file type/size/ownership; preserve exact-location privacy; optimize public media; and test cross-user/cross-org denial, asset publication, provenance and multi-location map anchoring.

## Explicit non-scope

Do not implement Organization Verification (`ORG-020`), credibility badges/seals, paid media quotas, arbitrary GIS editing, provider approval, cross-locality expansion policy, Intelligence Dark, Presentation Mode, production sound or haptics.

## Exit checkpoint

The organization profile can carry richer credentials, assets and location footprint needed by referrals, providers and later RFx workflows without confusing evidence with verification or locations with independent organizations.

## Completion discipline

Recalculate dependencies after merge before authorizing Slice 3.5.

## Execution authority

`docs/slices/SLICE_3_4_EXECUTION_AUTHORITY.md` records the merged baseline, implementation decisions, acceptance matrix, and preserved non-scope. Slice 3.5 was separately authorized only after PR #128 merged and post-merge CI passed.
