# Wave 3 Slice 3.4 — Credential, Media & Location Enrichment

## Accepted scope

Slice 3.4 implements `ORG-015`, `ORG-018`, and `ORG-019` on the canonical organization identity. It adds provenance-preserving credentials, private-by-default organization assets with explicit publication, and subordinate additional locations without implementing Organization Verification, credibility, provider status, referrals, cross-locality expansion, or any later slice.

## Runtime architecture

- `src/domain/organization-enrichment/model.ts` defines controlled credential kinds and dispositions, profile-asset publication state, subordinate-location draft/confirmation/lifecycle contracts, public projections, and immutable event/command evidence.
- `src/application/organization-enrichment/organization-enrichment.ts` re-resolves the current authenticated organization, active membership, restrictions, and `organization.profile.manage` permission before every command or replay. Credential evidence must be active, organization-owned private storage; public assets must be active and non-sensitive; additional locations must geocode and confirm inside the current released primary locality.
- `src/infrastructure/firestore/organization-enrichment.ts` transactionally persists the current aggregate, immutable enrichment event, organization audit event, and idempotent command receipt. Firestore rules deny direct browser reads and writes to all six Slice 3.4 collections.
- `app/api/organization-enrichment/route.ts` exposes same-origin authenticated commands and a minimized public projection. `app/api/organization-enrichment/assets/[assetId]/route.ts` delivers only explicitly published bytes through the application with `nosniff`, a restrictive CSP, and no Firebase path, token, checksum, creator identity, signed URL, or download bearer.
- The INF-008 storage policy now includes bounded organization documents while retaining private object paths, MIME/size validation, SHA-256 integrity, pending-to-active metadata, direct-client denial, and server-only object access.
- `OrganizationEnrichmentPanel` extends the existing Account workspace with credential, media, and additional-location controls. `MapboxLocalityCanvas` renders a smaller non-primary subordinate-location glyph while preserving the primary organization node and its anchored projection.

## Evidence, publication, and geography boundaries

Credentials remain `self_reported`, `evidence_submitted`, `expired`, or `retired`; evidence never becomes verification, qualification, endorsement, or credibility. Public credential projections require explicit public visibility and identify provenance as organization-reported.

Uploaded source objects remain private. Publication is a separate reversible metadata transition and is limited to active, standard-sensitivity objects owned by the same organization. Unpublication immediately removes controlled delivery eligibility; retirement preserves audit history and applies the existing deleted storage-metadata lifecycle.

Each additional location follows geocode → candidate review → explicit confirmation. The existing primary confirmed location and operating geography are immutable in this workflow. Out-of-boundary and missing-primary commands fail closed. Exact, approximate, and locality-only projections reuse the canonical privacy contract; locality-only owner-map placement is deterministically derived inside authoritative geometry and does not expose the internal coordinate. Published locations remain subordinate to one organization.

## Internationalization and accessibility

The organization-enrichment namespace is complete in `en-US`, Spanish, French, Italian, and German. Platform labels, controlled values, instructions, boundaries, notices, and recovery copy are translated; organization-authored credentials, identifiers, descriptions, issuer text, addresses, and documents remain verbatim.

The panel provides semantic tabs and tabpanels with arrow/Home/End keyboard behavior, native labeled controls, live success/error feedback, visible focus, minimum touch targets, reduced-motion behavior, structured list alternatives to the map, responsive one-column breakpoints, and non-color primary/subordinate marker labels.

## Acceptance evidence

Focused tests prove credential provenance/no automatic verification, current tenant authorization, private evidence binding, idempotency and audit, minimized asset publication/delivery, additional-location primary immutability, approximate privacy, and out-of-boundary or missing-primary denial. Firebase emulator acceptance proves direct-client denial for all new collections, atomic record/event/audit/command persistence, idempotency, cross-scope rejection, and exact cleanup.

Configured acceptance against the selected real Firebase project used one fresh disposable OPEN organization and manager. It proved:

- organization-reported public UEI capture without verification semantics;
- a real private Firebase Storage upload, explicit publication, controlled application delivery with privacy headers, and unpublication changing delivery from `200` to `404`;
- real Census address matching inside Portsmouth, explicit candidate confirmation, primary-location preservation, a published approximate subordinate projection, and distinct accessible primary/satellite map labels;
- current permission revocation after page load denying the next command while preserving published state;
- all five platform locales with no missing namespace keys, semantic keyboard tabs, desktop `1280px`, intermediate `820px`, and mobile `390px` layouts without horizontal overflow;
- a focused axe 4.12.1 audit with zero violations, no framework overlay, and a clean browser error/console check; and
- exact cleanup removing 36 Firestore documents, one private Storage object, and one Auth identity, followed by `0` organization-scoped Firestore and Storage residuals.

The focused TypeScript/unit gates, Firebase emulator smoke, architecture validators, and canonical `npm run check` pass on the accepted implementation branch. Malware-provider scanning, image-transformation infrastructure, and live EXIF rewriting remain truthfully deferred; Slice 3.4 does not claim those services.

## Completion and handoff

Acceptance supports marking only `ORG-015`, `ORG-018`, and `ORG-019` Done. The resulting checkpoint is **438 total · 132 Done · 306 Not Started**, Activation **43/43**, and Network **18/38**.

PR #128 passed exact-head production CI run `31291992746`, merged at `7f57cabf029edb0a0045b53d9f3339f170dc530c`, and post-merge `main` CI run `31292086252` passed. Dependency authority was recalculated from that merged tree and Slice 3.5 was separately authorized without changing Feature-ID totals.
