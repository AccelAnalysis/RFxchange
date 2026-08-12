# Wave 4 Slice 4.4 — Readiness, preview and publication

## Result

Slice 4.4 implements `ISS-016`, `ISS-018`, `ISS-019`, `ISS-020` and `ACQ-009` at the boundary defined by `docs/slices/SLICE_4_4_EXECUTION_AUTHORITY.md` on the documentation baseline merged through PR #166 at `4ebb0599af7e7a7470b696d8d2a2a9e7b60f2e00`.

The organization-owned RFx aggregate now has a one-way `draft` → `published` transition. Publication creates the first real, minimized responder opportunity projection and controlled share reference. No draft or preview becomes market activity, and the production acquisition adapter no longer falls back to seeded opportunities.

## Domain, projection and authority

- The server computes versioned readiness from the current aggregate, pinned AMACS 0.5.0 provenance, package and definition module status, server time, controlled geography, issuer display identity and requirement-by-requirement response/evidence and treatment-compatible evaluation relationships.
- One pure server-owned projector produces both preview and published payloads. The substantive payload and SHA-256 digest are identical across an unchanged preview/publication boundary; only authoritative envelope state changes.
- The permitted projection contains the opaque reference, audience, version, approved responder facts and index-safe controlled geography/capability keys. It excludes the internal RFx ID, actor/membership identities, exact address/coordinates, geocode provenance, interpretations, commands, audit evidence and private organization data.
- `public` projections resolve anonymously through the trusted opportunity route. `authenticated-participants` projections require current unrestricted participant authority and otherwise fail closed without disclosing existence or audience.
- Basic readiness, preview, publication and sharing are available under the free-participation policy. Unknown advanced RFx capabilities fail closed and do not alter readiness, semantics, ranking, credibility or visibility.

Every readiness/preview read reuses the exact issuer-workspace boundary. Publication separately reauthorizes `rfx.publish`, then the Firestore transaction rereads the aggregate, organization, exact active membership, authorization, restrictions and current released geography. Firestore timestamps are normalized before action-time geography comparison so repository and transaction representations cannot create a false conflict.

One successful transaction increments the aggregate exactly once, writes the immutable publication snapshot, minimized opportunity projection, `rfx-published` event, exact-intent command receipt and `rfx.published` organization audit. A stale version/digest, changed authority/geography, evidence collision or mismatched command fails without a partial projection. Exact replay returns the committed result without duplicate evidence.

## Workspace and controlled sharing

The issuer Operational Workspace adds audience selection, an explicit readiness check, deep-linked blocking/advisory findings, per-requirement status, exact responder preview and an explicit publish command. A published aggregate becomes read-only and exposes its controlled share link. API failures use the existing privacy-safe participant envelope and remain visible and recoverable.

`/opportunities/[reference]` now renders only the canonical live Firestore projection through a trusted server adapter. The old seeded launch opportunity remains a test fixture only and returns Not Found in production runtime. Acquisition continuation preserves the opaque publication reference without granting RFx, organization, response or membership authority.

The workspace and share surface remain keyboard operable, fit 390 px without horizontal overflow, honor reduced motion and are localized in English, Spanish, French, Italian and German.

## Acceptance evidence

Focused tests prove deterministic readiness, requirement-level findings, minimized projection redaction, preview/publication digest parity, one-way lifecycle, opaque/stable references and the free/basic versus unavailable-advanced boundary.

Firestore emulator acceptance proves versions 1 → 2 → 3 → 4 → 5, action-time authorization and timestamp-normalized geography checks, atomic publication, exact replay, stale/collision rejection, public/participant audience gates, seeded-fallback absence, direct-client denial, immutable evidence and zero residual records.

Configured-browser acceptance creates the real draft, completes package and definition, computes a ready preview, proves no pre-commit projection, rejects a stale digest, removes `rfx.publish` after preview and fails closed, restores authority, republishes from refreshed readiness, verifies stored snapshot/projection/digest/payload parity, opens the controlled public share, proves raw AMACS/internal IDs and the exact address are absent, verifies the seeded route is unavailable, and re-enters the published workspace. It also covers missing workspace permission, 390 px/reduced-motion behavior, all five locales and a clean console/unhandled-rejection record.

Representative configured-browser shell evidence on the local emulator recorded one document navigation, zero shell remounts, zero page-wide loading takeovers, candidate median transition 141.4 ms and p90 147.0 ms. The intentionally delayed Resources transition was 1,021.9 ms with immediate pending feedback and preserved content. These are local diagnostic observations, not production-network promises.

Repository acceptance includes the Slice 4.4 architecture validator, focused tests, internationalization, type checking, lint, production and Functions builds, Firestore schema/security acceptance, RFx emulator acceptance, configured-browser acceptance and the canonical `npm run check`.

## Dependency and stop boundary

Acceptance supports marking only `ISS-016`, `ISS-018`, `ISS-019`, `ISS-020` and `ACQ-009` Done. The checkpoint is **438 total · 165 Done · 273 Not Started**, with Wave 4 RFx Core **13/41**.

Real publication makes Brand Gate B6c opportunity expression eligible for separately authorized work; it does not complete or begin B6c. Slice 4.4 creates no discovery search/list, saved search, alert/digest, watch relationship, match, qualification, pursuit, team, response, submission, evaluation, selection, award or outcome runtime. Slice 4.5 still requires its own reviewed documentation authority before implementation.

Stabilization 2C remains incomplete and isolated to release engineering. B6b remains Not Started / intentionally pending. No Dark Appearance, appearance preference, Presentation Mode, sound, haptics, billing, sponsored visibility, Firebase App Hosting or build-identity work was begun.
