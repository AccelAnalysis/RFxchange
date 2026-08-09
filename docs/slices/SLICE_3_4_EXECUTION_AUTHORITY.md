# Slice 3.4 — Credential, Media & Location Enrichment execution authority

**Status: AUTHORIZED — SINGLE ACTIVE SLICE**

## Recalculated merged baseline

Slice 3.4 authority was recalculated from merged `main` at `0f5e8d56af8484bbd6e72716d4149a21e92db029` after:

- Slice 3.3 passed exact-head production CI run `31289352499`;
- PR #126 merged the accepted Slice 3.3 implementation; and
- post-merge production CI run `31289477113` passed on `main`.

The canonical tracker remains **438 total · 129 Done · 309 Not Started**, Activation **43/43**, and Network **15/38**. The dependency map therefore identifies Slice 3.4 as the earliest eligible product slice. This authority update changes no Feature-ID status.

## Authorized Feature IDs

- `ORG-015` — certifications, licenses, and approved identifiers;
- `ORG-018` — organization documents, logo, images, and portfolio assets; and
- `ORG-019` — additional organization locations.

Implementation must remain bounded by `SLICE_3_4_CREDENTIAL_MEDIA_AND_LOCATION_ENRICHMENT.md`, the current security/privacy/geography authorities, and the existing production abstractions inspected for this recalculation.

## Required production reuse

Slice 3.4 extends rather than replaces:

- the canonical organization identity and `organization.profile.manage` / `document.manage` server authorization boundary;
- INF-008 private object paths, MIME/size policy, pending-to-active metadata lifecycle, SHA-256 integrity, direct-client denial, and provider-independent storage ports;
- the Wave 2 structured address, authoritative geocoding, controlled-locality validation, exact/approximate/locality-only public projection, and append-only location event contracts;
- the existing primary marker lifecycle and B3 primary-node/subordinate-location visual grammar; and
- Slice 3.3 organization profile, safe projection, localization, audit, and responsive workspace patterns.

No Firebase UID, browser state, route parameter, client-provided organization identifier, or visual marker state grants organization or geography authority.

## Binding implementation decisions

### Credential and identifier records

Credentials are organization-owned records with a stable id, controlled kind, participant label, issuer/source, identifier value where applicable, lifecycle status, relevant issued/effective/expiration dates, source/evidence provenance, visibility, actor, and timestamps. UEI, CAGE, SAM and other approved identifiers use explicit controlled kinds; a bounded `other` kind may retain a participant label but cannot create a new verification or credibility class.

Self-reported, evidence-submitted, issuer-confirmed, expired, suspended, and revoked meanings remain distinct. Participant entry defaults to self-reported. Uploaded evidence remains a private stored asset and does not change the credential disposition by itself. Verification, issuer confirmation, a credibility badge, RFx qualification, procurement readiness, endorsement, or ranking requires separately authorized later domain action. Material mutation, retirement, or replacement creates immutable organization-scoped history; records are not hard-deleted to erase provenance.

Identifier values and evidence are private unless an authorized organization manager explicitly publishes an allowed public projection. Sensitive evidence, administrator notes, and internal provenance never enter that projection. Publication must be reversible and audited.

### Organization media, documents, and portfolio

The INF-008 source object remains private and server-delivered. Slice 3.4 may add the profile-facing metadata and explicit publication state needed for organization logos, media, approved documents, and portfolio items. Publication references an active organization-owned stored asset; it never creates a public Firebase object path, download token, signed bearer URL, or direct browser Storage permission.

The public projection exposes only explicitly published, non-sensitive metadata and a controlled application delivery reference. Authority evidence, verification evidence, private documents, original private object paths, checksums, retention metadata, and creator identity are excluded. Unpublishing removes public eligibility without erasing storage/audit history. Deletion uses the existing deleted lifecycle and retention/reconciliation boundary rather than silent hard deletion.

Allowlisted content type, byte size, organization ownership, declared accessible label/alt text where visual, portfolio description, and publication eligibility are validated server-side. Logo/media rendering uses responsive dimensions and stable loading/error states. Image metadata must not become a second location channel: public delivery removes or ignores embedded EXIF/GPS metadata. Malware-scanning provider implementation, image transformation infrastructure, and production bucket/IAM/CORS/lifecycle deployment remain deferred; unsupported files must be rejected, and no UI may claim scanning or optimization that did not occur.

### Additional locations

An additional location is a subordinate organization-owned location aggregate with its own stable id, label, active/retired lifecycle, structured address, canonical geocode/provenance, controlled geography, privacy setting, and actor/timestamps. It is not a second organization, service territory, provider approval, or replacement primary organization identity.

Each create/update follows the existing server-authorized geocode → candidate review → explicit confirmation sequence. Exact coordinates and full address remain internal; public map/list/detail consumers receive only the existing exact, approximate, or locality-only projection. Retired locations disappear from public projection while immutable events retain history. Duplicate/idempotent commands cannot create multiple satellites accidentally.

Slice 3.4 does not change the primary operating geography or primary confirmed location. Additional locations must resolve within geography already released for participation and already authorized for the organization under current server-side geography policy. Because cross-locality expansion policy is explicit non-scope, the implementation must reject an additional location that would require new locality participation authority rather than infer or grant it.

The primary organization node remains the only primary node. An eligible published subordinate location uses the completed satellite treatment, shares the organization selection/detail identity, remains anchored to its privacy-safe projected coordinate, and is available through the synchronized structured list alternative. A satellite cannot activate an otherwise ineligible primary marker, imply an independent organization, or expose a private exact coordinate.

## Authorization and projections

- Credential, media, publication, and additional-location commands require a current authenticated session, active matching membership, current organization authorization, no blocking restriction, and the exact named permission.
- Organization A authority never reads or mutates Organization B records or objects.
- Firestore and Storage remain direct-client default-deny; application routes accept only the authenticated organization workspace resolved by the server.
- Public projections are separate typed outputs and fail closed for private, sensitive, unpublished, deleted, expired-ineligible, retired, unreleased, or unauthorized state.
- Commercial status, Founding recognition, sponsorship, membership, and payment do not alter validation, publication eligibility, credential status, map treatment, or discovery order.

## Participant experience and localization

Use the shared Operational Workspace for credential/media editing and the existing Spatial Workspace for location confirmation and satellite review. Copy must state provenance and recovery plainly: recording or uploading is not verification; publication is explicit; work preservation is truthful; permissions and unsupported files have actionable explanations.

All platform-owned copy ships in `en-US`, Spanish, French, Italian, and German namespaces. Organization-authored names, credential text, identifiers, portfolio descriptions, document contents, issuer text, and legal representations remain verbatim and are not automatically translated. Desktop, intermediate, and mobile layouts require keyboard operation, visible focus, semantic labels/status, error association, screen-reader status, reduced-motion behavior, non-color location distinction, and no horizontal overflow.

## Acceptance evidence required before completion

Automated and emulator acceptance must prove:

1. controlled credential kinds, dates/status transitions, provenance, visibility, immutable history, and no automatic verification/credibility effect;
2. current same-organization permission success plus wrong-user, wrong-organization, missing-permission, inactive/restricted/stale-context, and direct-client denial;
3. private upload integrity, type/size rejection, publication/unpublication, deleted/unavailable state, sensitive-evidence exclusion, public projection minimization, and no bearer object URL;
4. additional-location geocode/confirmation, released-authorized geography enforcement, primary-location immutability, exact/approximate/locality-only privacy, retirement/history, deterministic idempotency, and public projection safety;
5. primary versus subordinate marker semantics, fixed geographic anchoring under map/camera/responsive changes, synchronized list/detail parity, and no independent-organization implication;
6. loading, empty, success, error, permission, recovery, responsive, accessibility, reduced-motion, five-locale, and clean-console behavior; and
7. configured real-environment browser acceptance with disposable organization/auth/storage data followed by exact and organization-scoped zero-residual cleanup.

Run focused validators and emulators plus the canonical full local gate:

```bash
npm run check
```

Production CI must pass on the exact PR head and again on merged `main` before dependency authority is recalculated.

## Explicit non-scope

This authority does not permit `ORG-020` Organization Verification, credibility badges/seals, issuer-verification administration, paid quotas, direct browser object access, public object buckets, signed/bearer download URLs, malware-provider implementation, arbitrary GIS editing, new cross-locality expansion policy, changing the primary geography/location, provider application or approval, referrals, RFx, Intelligence Dark, Presentation Mode, production sound, or haptics.

Slice 3.5 and all later slices/gates remain unstarted. They may be authorized only after Slice 3.4 implementation and acceptance merge, post-merge production CI passes, and dependency eligibility is recalculated again from merged `main`.
