# Wave 2 — Activation Roadmap

**Status: ADOPTED PLANNING AUTHORITY — IMPLEMENTATION HOLD**

Wave 2 begins from the canonical merged state **2/43 Activation features complete** (`INF-007`, `INF-008`). The remaining 41 Activation features are organized into the 12 slices below.

**Do not begin Slice 2.1 or any later Wave 2 implementation from this document alone. Explicit task authorization is required.**

| Slice | Features | Purpose / exit from slice |
| --- | --- | --- |
| **2.1 — Geography Authority** | `GEO-001`, `GEO-002`, `GEO-003`, `GEO-007`, `GEO-008` | Establish primary operating geography, server-side authorization, canonical geography/FIPS metadata, release states, bounds and locality camera. |
| **2.2 — Geography Rendering** | `GEO-004`, `GEO-005`, `GEO-006` | Load authoritative TIGER/Line-style boundaries, prominently highlight the selected locality, and mute surrounding localities. This establishes the actual controlled map canvas. |
| **2.3 — Organization Resolution** | `ACQ-004`, `ORG-001`, `ORG-002`, `ORG-003` | Seeded/unclaimed organization profile → search/match → claim existing or create new → duplicate/entity-resolution protection. |
| **2.4 — Microsoft Transactional Email** | `COMMS-002` | Activate the Microsoft production email adapter on top of `COMMS-001` and the already-complete event/job framework. This should be available before claim/authority communications become production-oriented. |
| **2.5 — Organization Authority & Claims** | `ORG-004`, `ADM-065`, `ADM-066` | Establish actual organization authority and give admins the claims console plus auditable conflict-adjudication workflow. |
| **2.6 — Organization Geography & Location** | `GEO-009`, `GEO-010`, `ORG-005`, `ORG-006`, `ORG-009` | Separate home location from service area, capture address, geocode it, confirm the map position, support location privacy, and capture service geography. |
| **2.7 — Essential Organization Profile** | `ORG-007`, `ORG-008`, `ORG-010`, `ORG-011`, `ORG-012` | Establish minimum identity, meaningful capability, multi-role classification, business objectives, and the real `Profile Complete` state. |
| **2.8 — Marker Activation & Admin 360** | `GEO-011`, `ADM-063`, `ADM-064` | Produce the Wave's primary success moment: the organization's **real marker appears on the real map**. Admins simultaneously gain a complete scoped Organization 360 and visible status header. |
| **2.9 — Acquisition-to-Activation Continuity** | `ACQ-002`, `ACQ-003` | Public opportunity entry plus preservation of opportunity/claim/referral/team/provider/buyer context through registration and into the first authenticated experience. |
| **2.10 — Orientation: Discovery & Team Formation** | `EDU-001`, `EDU-002`, `EDU-003`, `EDU-004` | Synthetic three-organization map tutorial: issuer creates opportunity → responder match → capability gap → teammate discovery. |
| **2.11 — Orientation: Response to Outcome** | `EDU-005`, `EDU-006`, `EDU-007`, `EDU-008` | Continue the tutorial: teammate invite/accept → joint response → issuer evaluation/selection → complete network-effect visualization. |
| **2.12 — First Value & OPEN Gate** | `EDU-009`, `EDU-010` | Route the user according to stated goals, then release them into the Exchange only after account, organization, geography, marker, and education gates are satisfied. This closes Wave 2. |

## Operating sequence

Use a single-active-slice implementation model unless explicit task instructions change it:

```text
2.1 merge → recalculate dependencies → authorize 2.2
2.2 merge → recalculate dependencies → authorize 2.3
...
2.12 merge → verify Wave 2 exit
```

Preparation/read-only inspection of the next slice may occur during validation of the current slice, but no production implementation for the next slice begins before the current slice merges and dependency eligibility is recalculated.

## Critical path

```text
Controlled geography
→ organization resolution
→ organization authority
→ real location/service geography
→ essential profile
→ marker activation
→ acquisition continuity
→ orientation
→ objective-based first value
→ OPEN
```

## Wave 2 exit condition

A new legitimate organization can arrive from a meaningful acquisition context, establish its organization relationship in an allowed geography, confirm its location, complete the essential profile, see its real marker in the controlled map environment, understand the Exchange through the orientation journey, reach an appropriate first-value path, and enter OPEN only after the complete release gate is satisfied.

## Canonical dependency corrections relevant to Wave 2

The dependency map—not this roadmap—is the live dependency authority. In particular, the reviewed graph makes:
- `ORG-012` depend on the fields its completion state actually requires;
- `GEO-011` depend on controlled map/release state, confirmed location and legitimate Profile Complete;
- `EDU-009` depend on organization objectives;
- `EDU-010` the terminal OPEN gate;
- completed `INF-008` independent of the later `ORG-004` workflow that consumes its storage foundation.
