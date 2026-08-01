# Wave 2 — Activation Roadmap

**Status: COMPLETE — 43/43 ACTIVATION FEATURES; WAVE 2 EXIT VERIFIED ON MERGED `main`**

Current feature state is **43/43 Activation features complete**. PR #104 merged at `d599901d7ff35a4ee67eb2363dcf3334a2303dbc`, and production CI run `30715058244` passed on that exact merged `main`. The post-merge dependency recalculation identifies Slice 3.1 (`COMMS-003`, `COMMS-004`, `COMMS-005`) as the earliest eligible Wave 3 candidate. Wave 3 remains on hold until a later task explicitly authorizes that slice.

PR #99 merged the narrow no-Feature-ID website carry-forward repair after both configured-browser paths and cleanup passed. Slice 2.9 implemented bounded public acquisition and server-bound continuity in PR #101. Slices 2.10 and 2.11 implemented one stable protected eight-step orientation in PRs #102 and #103. Slice 2.12 closes Activation in PR #104 with explicit semantic first-value selection and the complete server-authoritative OPEN gate. Its configured-browser acceptance ran both direct and preserved-opportunity journeys against real Firebase, Census/TIGERweb, Census geocoding and Mapbox, proved neutral/recommended choice behavior, explicit OPEN, re-entry, responsive layout and later restriction enforcement, then removed 79 disposable Firestore records and both Auth identities with a zero-residual rescan.

| Slice / Gate | Features | Purpose / exit |
| --- | --- | --- |
| **2.1 — Geography Authority** | `GEO-001`, `GEO-002`, `GEO-003`, `GEO-007`, `GEO-008` | Establish primary operating geography, server-side authorization, canonical geography/FIPS metadata, release states, bounds and locality camera. |
| **2.2 — Geography Rendering** | `GEO-004`, `GEO-005`, `GEO-006` | Load authoritative boundaries, highlight the selected locality and mute surrounding localities. |
| **2.3 — Organization Resolution** | `ACQ-004`, `ORG-001`, `ORG-002`, `ORG-003` | Seeded/unclaimed profile → search/match → claim existing or create new → duplicate/entity-resolution protection. |
| **2.4 — Microsoft Transactional Email** | `COMMS-002` | Activate the Microsoft production email adapter on the completed event/job foundation. |
| **2.5 — Organization Authority & Claims** | `ORG-004`, `ADM-065`, `ADM-066` | Establish organization authority and admin claim/adjudication foundations. |
| **2.6 — Organization Geography & Location** | `GEO-009`, `GEO-010`, `ORG-005`, `ORG-006`, `ORG-009` | Separate home location from service area, capture/geocode/confirm location and privacy, and establish service geography. |
| **2.7 — Essential Organization Profile** | `ORG-007`, `ORG-008`, `ORG-010`, `ORG-011`, `ORG-012` | Establish minimum identity/contact, categorized capability and Profile Complete; retain organization type, descriptive roles and objectives only as optional enrichment. |
| **2.8 — Marker Activation & Admin 360** | `GEO-011`, `ADM-063`, `ADM-064` | Produce the real marker success moment and scoped Organization 360 foundation. |
| **Runtime Convergence Gate — MERGED PR #92** | **No Feature IDs** | Enforce account-only participant runtime; centralize lifecycle/membership/restriction route access; protect admin routes with explicit scoped authority; remove production fixture leakage; align onboarding metadata boundaries; add positive/negative runtime guardrails. Repository CI passed on the merged tree. |
| **Registration Convergence Correction — MERGED PR #98** | **No Feature IDs** | Remove optional organization classification, role and objective questions from activation; correct Profile Complete; retain optional enrichment; preserve Official Resource Provider as a separate Wave 3.6 application/review; establish post-orientation first-value selection. |
| **Activation Profile Website Carry-Forward Repair — MERGED PR #99** | **No Feature IDs** | Preserved omitted website fields and proved both configured-browser website paths plus cleanup before Slice 2.9. |
| **2.9 — Acquisition-to-Activation Continuity — PR #101** | `ACQ-002`, `ACQ-003` | Privacy-safe public opportunity entry and server-bound semantic context persist through activation and first authenticated continuation. |
| **2.10 — Orientation: Discovery & Team Formation — PR #102** | `EDU-001`, `EDU-002`, `EDU-003`, `EDU-004` | Protected, synthetic three-organization map tutorial: issuer creates opportunity → responder match → capability gap → teammate discovery. |
| **2.11 — Orientation: Response to Outcome — PR #103** | `EDU-005`, `EDU-006`, `EDU-007`, `EDU-008` | Teammate invite/accept → joint response → issuer evaluation/selection → network-effect visualization. |
| **2.12 — First Value & OPEN Gate — PR #104** | `EDU-009`, `EDU-010` | Seven semantic choices are presented after orientation; OPEN persists only after every fresh canonical prerequisite passes, with explicit remediation otherwise. |

## Runtime convergence authority

The merged Runtime Convergence Gate, Registration Convergence Correction, PR #99 repair gate and `docs/architecture/ACTIVATION_JOURNEY_INTEGRATION_GATE.md` are authoritative for the boundary Slices 2.9–2.12 inherit.

Public visitors receive the marketing/authentication surface only. A valid RFxchange account/session is required for participant application routes. Free accounts are valid participant accounts; paid plans later add entitlements rather than creating the basic workspace-access boundary.

Protected participant routes resolve persisted lifecycle, active organization membership, organization isolation and restriction state. Protected administrator routes additionally require persisted platform-administrator identity, privileged security state, catalogued permission and an active matching scoped grant.

Reference/preview fixtures may support tests and design evidence but may not render as normal production participant/admin pages.

Repository-level convergence acceptance is complete through guardrails, Functions build/unit tests, Firebase Auth/Firestore/Functions/Storage emulator smoke tests, architecture tests, typecheck, lint and production Next.js build. Configured-development acceptance against the selected real Firebase project and actual browser remains an environment acceptance check and must not be inferred from emulator CI.

## Design convergence authority for Slices 2.9–2.12

The Design Convergence Gate completed after Slice 2.8 establishes the shared participant application architecture. Remaining slices must consume it rather than invent independent shells:

- acquisition continuity enters the appropriate shared Spatial or Operational Workspace;
- the three-organization orientation uses the Spatial Workspace where geographic discovery and teaming are integral;
- first-value routing selects the correct shared workspace for the participant's post-orientation first-value intent;
- OPEN returns to the shared Exchange environment rather than a new dashboard shell;
- spatial steps preserve one participant top navigation, an edge-to-edge map filling the remaining viewport, Ivory overlays and responsive edge drawer/mobile sheet behavior;
- no future slice adds a permanent participant left rail or interprets Exchange Black as the default participant canvas.

These requirements do not alter Feature-ID scope or completion status.

## Operating sequence

```text
2.1–2.8 merged
→ Runtime Convergence Gate merged + repository CI passed
→ Registration Convergence Correction merged + repository CI passed
→ PR #99 website carry-forward repair + repository gates
→ configured-browser available-website and no-public-website acceptance
→ dependency check
→ 2.9
→ 2.10
→ 2.11
→ 2.12
→ Wave 2 exit verified
→ PR #104 merged
→ Wave 2 exit verified on merged main
→ Slice 3.1 dependency-eligible; Wave 3 implementation held for explicit authorization
```

No production implementation for a later slice begins before the current authorized slice/gate is complete and dependency eligibility is recalculated.

## Critical path

```text
Controlled geography
→ organization resolution
→ organization authority
→ real location/service geography
→ minimum identity/contact + categorized capability
→ Profile Complete with carried website disposition preserved
→ marker activation
→ runtime and registration convergence
→ acquisition continuity
→ orientation
→ post-orientation first-value selection
→ OPEN
```

Organization type, descriptive participation roles and business objectives remain optional profile enrichment. They do not block Profile Complete, marker activation, controlled Exchange access, first-value selection or OPEN. Official Resource Provider status is established only through the separate Wave 3.6 application and administrator-review process.

## Wave 2 exit condition

A new legitimate organization can arrive from a meaningful acquisition context, create/authenticate its RFxchange account, establish its organization relationship in an allowed geography, confirm location, complete the minimum essential profile without losing previously confirmed website identity, see its real marker, enter the authenticated controlled Exchange, understand the Exchange through orientation, select an appropriate first-value path, and enter OPEN only after the complete release gate is satisfied.

## Final Wave 2 exit reconciliation

The exit condition was verified from merged `main` after PR #104. All twelve Slice 2.9–2.12 Feature IDs retain their own acceptance evidence, and the tracker derives **118 Done / 320 Not Started** from 438 Feature IDs with **43/43 Activation** complete. Anonymous access remains limited to public marketing and acquisition surfaces; protected routes re-evaluate current lifecycle, membership, organization authority and restriction state; acquisition context can recommend but cannot authorize; orientation data remains synthetic and isolated; and OPEN remains an explainable server-authoritative transition.

No new Wave 3 or Wave 4 Feature ID was implemented or marked Done. All 34 remaining Wave 3 Feature IDs remain Not Started. The actual dependency graph makes Slice 3.1 — Transactional Communications Reliability — the earliest eligible candidate, but this reconciliation does not authorize or begin it.

## Canonical dependency corrections relevant to Wave 2

The dependency map—not this roadmap—is the live Feature-ID dependency authority. In particular:

- `ORG-012` depends on minimum identity/contact, meaningful capability, service geography, confirmed location and location visibility—not optional organization type, descriptive roles or objectives;
- `GEO-011` depends on controlled map/release state, confirmed location and legitimate Profile Complete;
- `EDU-009` follows completed orientation and records a first-value selection; it does not depend on registration-time business objectives;
- `EDU-010` is the terminal OPEN gate;
- completed `INF-008` remains independent of the later `ORG-004` workflow that consumes its storage foundation.
