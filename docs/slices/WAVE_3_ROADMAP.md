# Wave 3 — Network Roadmap

**Status: ADOPTED PLANNING AUTHORITY — WAVE 2 EXIT VERIFIED; IMPLEMENTATION HOLD UNTIL SLICE 3.1 IS EXPLICITLY AUTHORIZED**

Wave 2 exit was verified from merged `main` at `d599901d7ff35a4ee67eb2363dcf3334a2303dbc`, with production CI run `30715058244` passing on that exact tree. The canonical dependency graph identifies Slice 3.1 (`COMMS-003`, `COMMS-004`, `COMMS-005`) as the earliest eligible candidate. This planning status does not authorize implementation.

Wave 3 contains **38 Network features**. Four foundations were completed during Wave 1 because they were prerequisites for administration and organization access:

- `ORG-021` — invite additional organizational users
- `ORG-022` — standard user role presets
- `ADM-055` — organization role bundle catalog
- `ADM-056` — admin management of organization memberships and permission bundles

The **34 remaining Network features** are organized into eight implementation slices.

| Slice | Features | Purpose / exit from slice |
| --- | --- | --- |
| **3.1 — Transactional Communications Reliability** | `COMMS-003`, `COMMS-004`, `COMMS-005` | Establish versioned transactional templates/event mappings, delivery audit, idempotency, retry and terminal-failure visibility before Network workflows begin sending invitations and referrals. |
| **3.2 — Controlled Network Entry & Discovery** | `GEO-012`, `DSC-001`, `DSC-002`, `DSC-003` | Turn the activated locality into the real Network workspace: own organization, permitted organizations/resources/opportunities, capability search, geographic/service-area filters and interactive map discovery. |
| **3.3 — Market Profile Enrichment** | `ORG-013`, `ORG-014`, `ORG-016`, `ORG-017` | Add structured products/services/capabilities, industry/NAICS context, past-performance/project context, and teaming/referral/resource preferences without displacing capability-first discovery. |
| **3.4 — Credential, Media & Location Enrichment** | `ORG-015`, `ORG-018`, `ORG-019` | Add certifications/licenses/identifiers with provenance, organization media/documents/portfolio, and additional locations using existing private-by-default storage and geography contracts. |
| **3.5 — Referral Network & Referral Acquisition** | `REF-001`, `REF-002`, `REF-003`, `REF-004`, `REF-005`, `EDU-014`, `ACQ-006` | Establish legitimate organization-to-organization referrals with context, consent, receive/accept/decline, lifecycle status, first-use education and external invitee continuity. |
| **3.6 — Official Resource Provider Foundation** | `RES-001`, `RES-002`, `RES-003`, `ADM-070` | Establish provider application, controlled admin review/approval, official provider status and the structured service profile needed for resource discovery/routing. |
| **3.7 — Resource Discovery, Routing & Provider Distribution** | `RES-004`, `RES-005`, `DSC-011`, `REF-006`, `RES-007`, `RES-008`, `ACQ-008` | Make approved resources visible by service territory, searchable/contextual, connectable through consented referrals, communicative within request scope, publishable, and usable as an acquisition channel. |
| **3.8 — Persistent Network Education** | `EDU-016`, `EDU-017` | Provide reusable Quick Start/role paths and contextual workflow explainers over the live Network behavior established by the previous slices. |

## Operating sequence

Use the single-active-slice model unless a future explicit task says otherwise:

```text
Wave 2 exit verified
→ 3.1 merge → recalculate
→ 3.2 merge → recalculate
→ 3.3 merge → recalculate
→ 3.4 merge → recalculate
→ 3.5 merge → recalculate
→ 3.6 merge → recalculate
→ 3.7 merge → recalculate
→ 3.8 merge → verify Wave 3 exit
```

Preparation/read-only inspection may occur ahead of the active slice. Production implementation of a later slice must not begin merely because adjacent abstractions make it convenient.

## Critical path

```text
Wave 2 OPEN + marker
→ reliable communications
→ controlled Network map/search
→ richer market profiles
→ referral network
→ official provider foundation
→ contextual resource discovery/routing
→ persistent education
```

Parallel conceptual branches converge inside the sequence:

```text
ORG-012 → ORG-013/014/016/017 → ORG-015/018/019
GEO-011 → GEO-012 → DSC-003
REF-001 + REF-005 → referral lifecycle → ACQ-006
RES-001 → RES-002 → RES-003 → RES-004/005/008
RES-003 + REF-005 → REF-006 → RES-007
RES-003 → DSC-011
RES-002 + COMMS-003 + ACQ-003 → ACQ-008
```

## Reviewed sequencing corrections for Wave 3

The dependency map remains the live dependency authority. The Wave 3 planning review identifies these corrections/clarifications for canonical scheduling:

- `RES-001`: additional organization locations (`ORG-019`) are not a legitimate prerequisite for applying to become a provider. Use completed Profile Complete/role authority as the prerequisite; additional locations remain optional enrichment.
- `DSC-011`: contextual official-resource search requires the structured provider service profile (`RES-003`).
- `REF-006`: provider connection requires the referral consent/minimum-necessary boundary (`REF-005`) plus an approved provider service profile (`RES-003`).
- `ACQ-006`: external referral acquisition requires preserved acquisition context (`ACQ-003`), an actual referral (`REF-001`) and versioned transactional communications (`COMMS-003`).
- `ACQ-008`: provider-driven acquisition requires preserved acquisition context (`ACQ-003`), approved provider state (`RES-002`) and versioned transactional communications (`COMMS-003`).
- Provider approval in Wave 3 is a controlled **Official Resource Provider** role/status decision. It must not silently award the later substantive Credibility `Organization Verified` or `Verified Resource Provider` badge.

## Wave 3 exit condition

An OPEN organization can enter its controlled Network geography, discover permitted organizations by capability/geography, enrich its market profile, send/receive legitimate referrals, and find/connect with approved resource providers. Approved providers can maintain service profiles, territories and published resources; Network communications are versioned/auditable/reliable; and participants have persistent/contextual education for the live workflows.

Wave 3 does **not** require the Wave 4 RFx transaction engine, Wave 5 credibility/trust system, Wave 6 paid entitlements, or Wave 7 institutional scale features to claim completion.

## Completion discipline

Planning documents do not change Feature-ID completion status. Recalculate eligibility from merged `main` after every slice and require the applicable brief's acceptance evidence before marking any feature Done.
