# Wave 3 Slice 3.3 — Market Profile Enrichment

## Accepted scope

Slice 3.3 implements `ORG-013`, `ORG-014`, `ORG-016`, and `ORG-017` on the existing canonical organization identity. It consumes immutable AMACS 0.5.0 and the merged AI/AMACS Interpretation Foundation without making interpretation, self-report, external classification, past performance, or preferences equivalent to evidence, verification, credibility, RFx qualification, or endorsement.

No Slice 3.4 or later domain was implemented.

## Runtime architecture

- `src/domain/market-profile/model.ts` defines organization-owned capability claims, industry/NAICS context, bounded past performance, market preferences, provisional terms, safe projections, and immutable history/event contracts.
- `src/application/market-profile/market-profile.ts` is the consequential command boundary. Every command re-resolves an active organization membership, `organization.profile.manage`, organization restriction/OPEN state, current AMACS release and catalog identifiers, current market-role identifiers, and service-geography authority.
- `src/infrastructure/firestore/market-profile.ts` persists command receipts, current records, immutable market-profile events, and organization audit events transactionally. Command fingerprints make replays idempotent and reject conflicting reuse.
- `app/api/organization-market-profile/route.ts` exposes same-origin, authenticated server commands; Firestore rules deny direct browser writes to the Slice 3.3 collections.
- `src/components/market-profile/MarketProfilePanel.tsx` supplies ordinary-language assistance, an independent complete manual Domain → Family → Capability path across all 615 current capabilities, explicit candidate disposition, a separate organization-claim form, industry/NAICS context, past performance, provisional terms, and non-authoritative preference capture.

## AI and AMACS boundary

Assistance persists an RFxchange-owned interpretation record and source-grounded candidates through the provider-neutral server gateway. Candidate IDs validate against the pinned release before presentation. Accepting or editing a candidate only records disposition and retains `authoritativeEffect: "none"`; a separate, current-authority market-profile command creates a self-reported organization claim. Rejected and unresolved candidates never enter the deterministic discovery projection.

If assistance is disabled, unavailable, quota-limited, or fails, the participant receives a truthful unavailable state and the manual catalog remains usable. Confirmed claims preserve the AMACS release and concept/label hierarchy snapshots plus applicable entity scope, market roles, RFx delivery roles, service geography, specialties, capacity, visibility, source, status, evidence references, and history.

## Discovery migration and privacy

Slice 3.2 discovery now prefers confirmed structured capability claims and uses legacy activation-profile capability text only when no structured claim exists. The two sources are labeled and never double-counted. Network/public projections omit private fields, evidence references, internal capacity, private experience, actor identifiers, command receipts, provenance internals, and source excerpts.

Industries and participant-selected NAICS metadata retain source/version provenance and remain descriptive. Past performance remains self-reported unless a later authoritative process changes that state. Preferences do not grant permission, availability, commitment, endorsement, or a legal relationship. Provisional terms remain non-canonical editorial input and cannot satisfy matching requirements.

## Internationalization and interaction

The new market-profile namespace is complete in `en-US`, Spanish, French, Italian, and German. RFxchange-controlled labels, instructions, notices, errors, and status copy are translated; organization-authored text and AMACS catalog content remain verbatim. The panel uses semantic regions, headings, navigation, fieldsets, labels, buttons, pressed state, live status/alert feedback, visible focus treatment, responsive single-column breakpoints, and a reduced-motion override.

## Acceptance evidence

Focused domain/application tests cover the authorized manager, an active viewer without profile-management permission, wrong-organization access, invalid catalog IDs, stale candidate/release data, conflicting command replay, manual AI-disabled operation, candidate-to-claim separation, visibility, NAICS non-authority, structured capacity, and safe projection. Firestore emulator acceptance covers direct-client denial, atomic persistence, idempotency, cross-scope denial, audit/provenance, and structured-versus-legacy discovery behavior.

Configured acceptance against the selected real Firebase project used one fresh disposable OPEN organization and manager. It proved:

- the real Account route, current organization authority, Portsmouth geography, active marker, AMACS 0.5.0, and all 615 manual capabilities;
- truthful AI-disabled fallback followed by a separately saved structured capability claim;
- descriptive industry/NAICS, two self-reported private past-performance records, non-authoritative teaming/referral/resource preferences, and a governed provisional term;
- participant-authored organization and AMACS content remaining verbatim alongside all five platform locale namespaces;
- desktop, intermediate, and mobile compositions, semantic screen-reader structure, keyboard-operable native controls, visible focus/reduced-motion contracts, and a clean console; and
- cleanup after sign-out with `0` exact Firestore documents, `0` organization-scoped Firestore documents, and `0` Auth users remaining.

The configured provider intentionally remained disabled, so no live model-quality claim is made. Provider outage and deterministic candidate/disposition behavior are covered by the foundation and focused tests; the complete manual path passed in the configured environment.

## Completion and handoff

Acceptance supports marking only `ORG-013`, `ORG-014`, `ORG-016`, and `ORG-017` Done. The resulting checkpoint is **438 total · 129 Done · 309 Not Started**, Activation **43/43**, and Network **15/38**.

PR #126 passed exact-head production CI run `31289352499`, merged at `0f5e8d56af8484bbd6e72716d4149a21e92db029`, and post-merge `main` CI run `31289477113` passed. Dependency eligibility was then recalculated in a separate authority update. No Slice 3.4 implementation was begun by this slice.
