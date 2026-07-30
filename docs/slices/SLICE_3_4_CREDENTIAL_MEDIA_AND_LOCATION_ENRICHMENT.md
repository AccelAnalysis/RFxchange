# Slice 3.4 — Credential, Media & Location Enrichment

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs
- `ORG-015` — Certifications, licenses and identifiers
- `ORG-018` — Documents, logo, images and portfolio
- `ORG-019` — Additional organization locations

## Objective

Add credential/identifier provenance, controlled organization media/documents and additional operating locations without weakening the existing authority, privacy, storage or geography model.

## Must read

- `/AGENTS.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/CREDIBILITY_SYSTEM.md`
- `docs/context/MAP_AND_GEOGRAPHY.md`
- `docs/design/README.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- canonical tracker/dependency map
- merged `INF-008` storage and Wave 2 location/privacy contracts
- `docs/slices/WAVE_3_ROADMAP.md`

## Product rules

### `ORG-015`

Support certifications, licenses, UEI, CAGE, SAM and other approved identifiers with issuer/source, status, relevant dates and evidence/provenance. Recording an identifier or uploaded evidence does not automatically award a Verified credibility badge.

### `ORG-018`

Store organization logo/images/documents/portfolio assets through the existing organization-owned, private-by-default Storage architecture. Public publication is explicit; sensitive evidence remains private. Do not implement future entitlement limits unless already approved by another active feature.

### `ORG-019`

Support additional locations beyond the primary location using canonical geocoding/geography/privacy concepts. Each location distinguishes internal exact position from approved public projection and does not redefine the primary operating geography unless an authorized workflow explicitly does so.

## Acceptance intent

- credentials/identifiers preserve source/provenance and cannot masquerade as verified when merely self-reported;
- authorized organization users can manage approved media/documents without cross-organization access;
- public asset projection excludes private/sensitive objects;
- multiple locations can be added and mapped with the same privacy guarantees as the primary location.

## Expected implementation qualities

Reuse stable profile, Storage, geocoding, service-geography and audit abstractions; validate file type/size/ownership; preserve exact-location privacy; test cross-user/cross-org denial, asset publication and multi-location map anchoring.

## Explicit non-scope

Do not implement Organization Verification (`ORG-020`), credibility badges, paid media quotas, arbitrary GIS editing, provider approval or cross-locality expansion policy.

## Exit checkpoint

The organization profile can carry the richer credentials, assets and location footprint needed by referrals, providers and later RFx workflows without confusing evidence with verification.

## Completion discipline

Recalculate dependencies after merge before authorizing Slice 3.5.