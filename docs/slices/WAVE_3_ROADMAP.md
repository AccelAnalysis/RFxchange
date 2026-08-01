# Wave 3 — Network Roadmap

**Status: SLICE 3.1 COMPLETE; BRAND GATES B1, B2, B3 AND B6a ARE THE NEXT AUTHORIZED-SEQUENCE BOUNDARY BEFORE SLICE 3.2**

Wave 2 is complete and Brand Gate B0 is merged. Wave 3 Slice 3.1 completed through PR #107 and merged to `main` at `368fdb5e0179ca7933eb33ffb6cbf12a2afe2bf1`. Feature state after Slice 3.1 is **438 total · 121 Done · 317 Not Started**, with Network at **7/38**: four inherited Wave 1 foundations plus `COMMS-003`, `COMMS-004` and `COMMS-005`.

The dependency graph now makes Slice 3.2 Feature IDs eligible from the Network perspective, but Slice 3.2 remains on implementation hold until Brand Gates B1, B2, B3 and B6a are complete and the slice is explicitly authorized.

Wave 3 contains **38 Network features**. Four foundations were completed during Wave 1 because they were prerequisites for administration and organization access:

- `ORG-021` — invite additional organizational users
- `ORG-022` — standard user role presets
- `ADM-055` — organization role bundle catalog
- `ADM-056` — admin management of organization memberships and permission bundles

The remaining Network features are organized into eight implementation slices.

| Slice | Features | Status / purpose |
| --- | --- | --- |
| **3.1 — Transactional Communications Reliability** | `COMMS-003`, `COMMS-004`, `COMMS-005` | **Complete via PR #107.** Versioned transactional templates/event mappings, delivery audit, idempotency, deterministic retry, interrupted-success healing and terminal-failure operations visibility are established. |
| **3.2 — Controlled Network Entry & Discovery** | `GEO-012`, `DSC-001`, `DSC-002`, `DSC-003` | Turn the activated locality into the first real Network workspace: own organization, permitted organizations, capability search, geographic/service-area filters and interactive map discovery. Brand Gates B1, B2, B3 and B6a must be complete first to prevent a second spatial rewrite. |
| **3.3 — Market Profile Enrichment** | `ORG-013`, `ORG-014`, `ORG-016`, `ORG-017` | Add structured products/services/capabilities, industry/NAICS context, past-performance/project context and teaming/referral/resource preferences without displacing capability-first discovery or implying verification. |
| **3.4 — Credential, Media & Location Enrichment** | `ORG-015`, `ORG-018`, `ORG-019` | Add certifications/licenses/identifiers with provenance, organization media/documents/portfolio and additional locations using private-by-default storage, geography and subordinate-location visual treatment. |
| **3.5 — Referral Network & Referral Acquisition** | `REF-001`, `REF-002`, `REF-003`, `REF-004`, `REF-005`, `EDU-014`, `ACQ-006` | Establish legitimate organization-to-organization referrals with context, consent, receive/accept/decline, lifecycle status, first-use education and external invitee continuity. This is the first legitimate source for live referral paths. |
| **3.6 — Official Resource Provider Foundation** | `RES-001`, `RES-002`, `RES-003`, `ADM-070` | Establish provider application, controlled admin review/approval, official provider status and the structured service profile needed for resource discovery/routing while keeping provider approval separate from verification, credibility and payment. |
| **3.7 — Resource Discovery, Routing & Provider Distribution** | `RES-004`, `RES-005`, `DSC-011`, `REF-006`, `RES-007`, `RES-008`, `ACQ-008` | Make approved resources visible by service territory, searchable/contextual, connectable through consented referrals, communicative within request scope, publishable and usable as an acquisition channel. This is the first legitimate source for live service fields. |
| **3.8 — Persistent Network Education** | `EDU-016`, `EDU-017` | Provide reusable Quick Start/role paths and contextual workflow explainers over the live Network behavior established by the previous slices. |

## Operating sequence

Use the single-active-slice or single-active-gate model unless a future explicit task says otherwise:

```text
Wave 2 exit verified
→ Brand Gate B0 merged
→ Slice 3.1 merged and reconciled
→ Brand Gates B1 → B2 → B3 → B6a
→ 3.2 merge → recalculate
→ 3.3 merge → recalculate
→ 3.4 merge → recalculate
→ 3.5 merge → recalculate
→ 3.6 merge → recalculate
→ 3.7 merge → recalculate
→ Brand Gate B6b Network-lens convergence when authorized
→ 3.8 merge → verify Wave 3 exit
```

B1–B3 and B6a are Brand Gates, not Network Feature IDs. They must not mark Wave 3 features Done or fabricate later domain state.

Preparation/read-only inspection may occur ahead of the active slice/gate. Production implementation of a later slice must not begin merely because adjacent abstractions make it convenient.

## Critical path

```text
Wave 2 OPEN + marker
→ B0 brand authority
→ reliable communications [complete]
→ semantic/component/cartographic/workspace foundations
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

## Slice 3.1 acceptance result

PR #107 established:

- explicit platform-event and template version identifiers;
- reviewed event/template mapping with typed, bounded variables and HTML escaping;
- a server-managed delivery aggregate plus append-only delivery evidence;
- recipient-address minimization through hashing and domain-only routing evidence;
- provider-neutral failure classification and deterministic INF-007 retries;
- duplicate suppression after provider acceptance;
- healing of interrupted INF-007 success persistence without another send;
- a bounded terminal-failure projection integrated with the existing `email-delivery` operations-health surface; and
- explicit anonymous/authenticated direct-client denial for the communications collections.

Production CI run `30719532985` passed on implementation head `eba071e54e3a9cc88ec7fd353e943922917d6484`: repository guardrails, 19 Functions tests, the complete Firebase emulator suite, 353 architecture tests, TypeScript, lint and production build.

## Brand authority for Wave 3

Every user-facing Wave 3 slice must read:

- `docs/brand/README.md`;
- `docs/brand/BRAND_GATE_B0_RECONCILIATION.md`;
- `docs/brand/BRAND_EXPERIENCE_ACCEPTANCE_MATRIX.md`;
- `docs/brand/CONTENT_AND_MESSAGING_SYSTEM.md` for customer-facing copy/communications;
- `docs/brand/MAP_AND_DATA_VISUAL_GRAMMAR.md` for spatial objects;
- the applicable current `docs/design/` baseline.

Rules:

- cross-cutting brand standards supplement but never widen slice scope;
- opportunity beacons remain absent until the Wave 4 RFx publication domain;
- referral paths require real Slice 3.5 referral state;
- service fields require real Slice 3.7 provider-territory state;
- credibility seals and outcome paths remain later-domain expressions;
- Growth Green cannot imply a business outcome merely because a referral or provider connection exists;
- invented organizations, opportunities, statistics, provider availability or network activity are prohibited.

## Reviewed sequencing corrections for Wave 3

The dependency map remains the live dependency authority. The Wave 3 planning review identifies these corrections/clarifications for canonical scheduling:

- `RES-001`: additional organization locations (`ORG-019`) are not a legitimate prerequisite for applying to become a provider. Use completed Profile Complete/role authority as the prerequisite; additional locations remain optional enrichment.
- `DSC-011`: contextual official-resource search requires the structured provider service profile (`RES-003`).
- `REF-006`: provider connection requires the referral consent/minimum-necessary boundary (`REF-005`) plus an approved provider service profile (`RES-003`).
- `ACQ-006`: external referral acquisition requires preserved acquisition context (`ACQ-003`), an actual referral (`REF-001`) and versioned transactional communications (`COMMS-003`).
- `ACQ-008`: provider-driven acquisition requires preserved acquisition context (`ACQ-003`), approved provider state (`RES-002`) and versioned transactional communications (`COMMS-003`).
- Provider approval in Wave 3 is a controlled **Official Resource Provider** role/status decision. It must not silently award the later substantive Credibility `Organization Verified` or `Verified Resource Provider` badge.

## Wave 3 exit condition

An OPEN organization can enter its controlled Network geography, discover permitted organizations by capability/geography, enrich its market profile, send/receive legitimate referrals and find/connect with approved resource providers. Approved providers can maintain service profiles, territories and published resources; Network communications are versioned/auditable/reliable; and participants have persistent/contextual education for the live workflows.

Wave 3 does **not** require the Wave 4 RFx transaction engine, Wave 5 credibility/trust system, Wave 6 paid entitlements, B7 Intelligence Dark, B8 Sonic/Sensory, B9 Presentation Mode or Wave 7 institutional scale features to claim completion.

## Completion discipline

Planning and Brand Gate documents do not change Feature-ID completion status. Recalculate eligibility from merged `main` after every slice and require the applicable brief's acceptance evidence before marking any feature Done.
