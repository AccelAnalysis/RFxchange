# Wave 4 Slice 4.3 — Governed RFx definition

## Result

Slice 4.3 implements `ISS-007`, `ISS-009` and `ISS-011` at the boundary defined by `docs/slices/SLICE_4_3_EXECUTION_AUTHORITY.md` on the documentation baseline merged through PR #164 at `6dcf09ace96ba1881bd229ab76eef79cde1a33a0`.

The existing organization-owned private RFx aggregate now carries one versioned definition composed of governed AMACS requirements, a linked responder structure and a linked evaluation definition. The lifecycle remains exactly `draft`; no opportunity projection or publication state exists.

## Domain and authority

- Requirement types, capabilities, response templates/sections and decision templates/factors are resolved against the pinned AMACS 0.5.0 registry on the server. Participant labels, definitions, provenance, allowed treatments and team-coverage rules are snapshots of that authority rather than client assertions.
- Capability requirements require a real AMACS capability; non-capability types reject one. Required/preferred level, decision treatment, satisfying-party policy, typed qualifiers, foundation links and evidence links remain distinct.
- Response sections have stable identities, ordered typed formats, limits, attachment policy and explicit requirement links. Governed templates can be expanded with issuer-authored sections without inventing AMACS identifiers.
- Evaluation factors retain governed source method, valid treatment, optional integer-basis-point weight and explicit requirement, response and evidence links. Required conditions and informational factors cannot silently become scores. Required weighted definitions are complete only at exactly 10,000 basis points.
- Bidirectional requirement-to-response/evaluation links and the three module statuses are derived by the domain model, not trusted from the browser.

Every read/search/save reuses the canonical exact-user, membership, organization, restriction and `rfx.create` authorization boundary. Each accepted save increments the aggregate once and atomically creates `rfx-definition-saved`, an exact-intent command receipt and `rfx.definition-saved` organization audit evidence. Stable retry heals interrupted success; altered intent and stale versions conflict without partial evidence.

## Workspace and interpretation

The private `/opportunities` Operational Workspace adds a continuous three-part definition builder below the Slice 4.2 package. The issuer can browse Domain → Family, search the controlled AMACS catalog, inspect human-readable capability context, apply governed response/evaluation templates, expand issuer-authored rows, link the definition and save explicitly or through the bounded 1.2-second debounce. Concurrent saves are guarded, successful saves preserve edits made while a request was in flight, and conflict/permission failures remain visible and recoverable.

The workflow is complete without AI. The server accepts only confirmed or partially confirmed interpretation records owned by the same organization, RFx and `request_structure` purpose; those references remain non-authoritative inputs to a separate definition save.

The surface is keyboard operable, uses a focus-managed responsive sheet, preserves a 390 px layout, honors reduced motion and is localized in English, Spanish, French, Italian and German. Long modules use block-axis intrinsic sizing so containment cannot create horizontal overflow.

## Acceptance evidence

Focused domain/application tests prove canonical AMACS snapshots, complete module derivation, bidirectional links, exact replay, altered-intent collision, stale-write rejection, invalid capability rejection, lead-only enforcement and dangling-link rejection with no partial evidence.

Focused Firestore emulator acceptance proves aggregate versions 1 → 2 → 3 → 4, atomic definition persistence, exact replay, command collision, stale rejection, direct-client denial, immutable event/receipt/audit evidence, tenant isolation and zero residual records.

Configured-browser acceptance creates and reopens the real private draft; selects governed capability, credential, experience, geography, capacity and evidence requirements; proves prohibited team coverage and raw identifiers stay unavailable; expands response and decision templates; exercises modal focus restoration; adds, edits, links and reorders a custom response section; edits a factor link; resolves an intentionally invalid weighted total to exactly 10,000 basis points; saves version 4; and verifies all three server-derived definition modules complete. It then rejects a stale command with HTTP 409, reloads committed state, verifies permission-removal non-disclosure, exercises all five locales and the 390 px reduced-motion layout, reports a clean console and removes all RFx fixtures. Evidence is emitted by the configured shell acceptance rather than committed as a runtime artifact.

Repository acceptance includes the Slice 4.3 architecture validator, focused RFx tests, internationalization, type checking, lint, production build, Firestore emulator acceptance, configured-browser acceptance and the canonical `npm run check`.

## Explicit stop boundary

Slice 4.3 creates no readiness decision, immutable publication snapshot, opportunity projection, beacon, discovery, alert, match, pursuit, team, response, submission, evaluator access, score, selection, award or later RFx lifecycle state. It does not implement Slice 4.4, B6b, B6c, commercial enrollment, appearance, Presentation Mode, sensory behavior, Firebase App Hosting or build-identity work.

Stabilization 2C remains incomplete and isolated to release engineering. B6b remains Not Started / intentionally pending. B6c remains ineligible before authoritative Slice 4.4 publication.
