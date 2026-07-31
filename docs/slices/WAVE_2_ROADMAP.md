# Wave 2 — Activation Roadmap

**Status: ACTIVE SEQUENTIAL IMPLEMENTATION — SLICES 2.1–2.8 + RUNTIME CONVERGENCE MERGED; 2.9 NEXT FEATURE SLICE**

Current merged feature state remains **31/43 Activation features complete**. Slices 2.1–2.8 are complete; the Runtime Convergence Gate merged in PR #92 on 2026-07-31; 12 Activation Feature IDs remain across Slices 2.9–2.12.

Slice 2.9 received implementation authorization on 2026-07-30 after dependency recalculation. The subsequent runtime audit paused that authorization while cross-slice authentication/session, route-boundary, fixture-surface and source-convergence defects were repaired. PR #92 completed that repository-level gate and production CI passed. Slice 2.9 is therefore again the next authorized feature slice, subject to the normal configured-development/browser acceptance boundary and dependency check before implementation. The Runtime Convergence Gate carries no Feature IDs and changes no tracker completion counts.

| Slice / Gate | Features | Purpose / exit |
| --- | --- | --- |
| **2.1 — Geography Authority** | `GEO-001`, `GEO-002`, `GEO-003`, `GEO-007`, `GEO-008` | Establish primary operating geography, server-side authorization, canonical geography/FIPS metadata, release states, bounds and locality camera. |
| **2.2 — Geography Rendering** | `GEO-004`, `GEO-005`, `GEO-006` | Load authoritative boundaries, highlight the selected locality and mute surrounding localities. |
| **2.3 — Organization Resolution** | `ACQ-004`, `ORG-001`, `ORG-002`, `ORG-003` | Seeded/unclaimed profile → search/match → claim existing or create new → duplicate/entity-resolution protection. |
| **2.4 — Microsoft Transactional Email** | `COMMS-002` | Activate the Microsoft production email adapter on the completed event/job foundation. |
| **2.5 — Organization Authority & Claims** | `ORG-004`, `ADM-065`, `ADM-066` | Establish organization authority and admin claim/adjudication foundations. |
| **2.6 — Organization Geography & Location** | `GEO-009`, `GEO-010`, `ORG-005`, `ORG-006`, `ORG-009` | Separate home location from service area, capture/geocode/confirm location and privacy, and establish service geography. |
| **2.7 — Essential Organization Profile** | `ORG-007`, `ORG-008`, `ORG-010`, `ORG-011`, `ORG-012` | Establish minimum identity, capability, multi-role classification, objectives and Profile Complete. |
| **2.8 — Marker Activation & Admin 360** | `GEO-011`, `ADM-063`, `ADM-064` | Produce the real marker success moment and scoped Organization 360 foundation. |
| **Runtime Convergence Gate — MERGED PR #92** | **No Feature IDs** | Enforce account-only participant runtime; centralize lifecycle/membership/restriction route access; protect admin routes with explicit scoped authority; remove production fixture leakage; align onboarding role/objective/relationship semantics; add positive/negative runtime guardrails. Repository CI passed on the merged tree. |
| **2.9 — Acquisition-to-Activation Continuity** | `ACQ-002`, `ACQ-003` | Preserve meaningful acquisition context through registration into the first authenticated experience. Next authorized feature slice after convergence. |
| **2.10 — Orientation: Discovery & Team Formation** | `EDU-001`, `EDU-002`, `EDU-003`, `EDU-004` | Synthetic three-organization map tutorial: issuer creates opportunity → responder match → capability gap → teammate discovery. |
| **2.11 — Orientation: Response to Outcome** | `EDU-005`, `EDU-006`, `EDU-007`, `EDU-008` | Teammate invite/accept → joint response → issuer evaluation/selection → network-effect visualization. |
| **2.12 — First Value & OPEN Gate** | `EDU-009`, `EDU-010` | Route according to goals and release OPEN only after all account, organization, geography, marker, education, legal and first-value gates are satisfied. |

## Runtime convergence authority

The merged Runtime Convergence Gate and `docs/architecture/ACTIVATION_JOURNEY_INTEGRATION_GATE.md` are authoritative for the boundary Slices 2.9–2.12 inherit.

Public visitors receive the marketing/authentication surface only. A valid RFxchange account/session is required for participant application routes. Free accounts are valid participant accounts; paid plans later add entitlements rather than creating the basic workspace-access boundary.

Protected participant routes resolve persisted lifecycle, active organization membership, organization isolation and restriction state. Protected administrator routes additionally require persisted platform-administrator identity, privileged security state, catalogued permission and an active matching scoped grant.

Reference/preview fixtures may support tests and design evidence but may not render as normal production participant/admin pages.

Repository-level convergence acceptance is complete through guardrails, Functions build/unit tests, Firebase Auth/Firestore/Functions/Storage emulator smoke tests, architecture tests, typecheck, lint and production Next.js build. Configured-development acceptance against the selected real Firebase project and actual browser remains an environment acceptance check and must not be inferred from emulator CI.

## Design convergence authority for Slices 2.9–2.12

The Design Convergence Gate completed after Slice 2.8 establishes the shared participant application architecture. Remaining slices must consume it rather than invent independent shells:

- acquisition continuity enters the appropriate shared Spatial or Operational Workspace;
- the three-organization orientation uses the Spatial Workspace where geographic discovery and teaming are integral;
- first-value routing selects the correct shared workspace for the chosen objective;
- OPEN returns to the shared Exchange environment rather than a new dashboard shell;
- spatial steps preserve one participant top navigation, an edge-to-edge map filling the remaining viewport, Ivory overlays and responsive edge drawer/mobile sheet behavior;
- no future slice adds a permanent participant left rail or interprets Exchange Black as the default participant canvas.

These requirements do not alter Feature-ID scope or completion status.

## Operating sequence

```text
2.1–2.8 merged
→ Runtime Convergence Gate merged + repository CI passed
→ configured-development/browser acceptance
→ dependency check
→ 2.9
→ 2.10
→ 2.11
→ 2.12
→ verify Wave 2 exit
```

No production implementation for a later slice begins before the current authorized slice/gate is complete and dependency eligibility is recalculated.

## Critical path

```text
Controlled geography
→ organization resolution
→ organization authority
→ real location/service geography
→ essential profile
→ marker activation
→ runtime convergence
→ acquisition continuity
→ orientation
→ objective-based first value
→ OPEN
```

## Wave 2 exit condition

A new legitimate organization can arrive from a meaningful acquisition context, create/authenticate its RFxchange account, establish its organization relationship in an allowed geography, confirm location, complete the essential profile, see its real marker, enter the authenticated controlled Exchange, understand the Exchange through orientation, reach an appropriate first-value path, and enter OPEN only after the complete release gate is satisfied.

## Canonical dependency corrections relevant to Wave 2

The dependency map—not this roadmap—is the live Feature-ID dependency authority. In particular:

- `ORG-012` depends on the fields its completion state actually requires;
- `GEO-011` depends on controlled map/release state, confirmed location and legitimate Profile Complete;
- `EDU-009` depends on organization objectives;
- `EDU-010` is the terminal OPEN gate;
- completed `INF-008` remains independent of the later `ORG-004` workflow that consumes its storage foundation.
