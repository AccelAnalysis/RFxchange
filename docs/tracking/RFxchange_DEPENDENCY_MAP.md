# RFxchange Canonical Dependency Map

> Live dependency authority for build sequencing. The original spreadsheet remains the provenance source, but this Markdown file controls dependency scheduling when a reviewed correction supersedes a seeded spreadsheet edge.

## Rules

- Preserve every approved Feature ID; dependency corrections do not delete or rename features.
- A dependency listed here supersedes the seeded dependency for sequencing only after architectural review.
- Completion still requires the acceptance criteria from the source specification and evidence in `RFxchange_MASTER_BUILD_TRACKER.md`.
- Dependencies are prerequisites, not implicit completion. Satisfying a prerequisite never marks the dependent feature Done.
- Recalculate the next slice from the merged `main` state after each slice or required non-Feature gate.

## Reviewed dependency corrections — 2026-07-30

| Feature | Seeded dependency | Canonical dependency | Reason for correction |
| --- | --- | --- | --- |
| `ADM-047` Feature-flag administration | `ADM-045` | `GOV-006`, `ADM-046`, `ADM-083`, `ADM-085`, `ADM-088` | Feature-flag control is governed technical configuration. It requires authority, operations visibility, governed configuration, immutable audit, and privileged-security controls; locality landing/announcement management is unrelated. |
| `ADM-048` Safe job retry, reindex and maintenance controls | `ADM-045` | `INF-007`, `ADM-046`, `ADM-085`, `ADM-088` | Recovery operations depend on the background-job framework, operations health, audit evidence, and privileged-security controls; locality landing/announcement management is unrelated. |
| `ADM-068` Controlled user administration actions | `ADM-065` | `ARC-008`, `ADM-014`, `ADM-056`, `ADM-069`, `ADM-085`, `ADM-088`, `ORG-021` | Controlled administration of an already-resolved user's organization access depends on restriction states, exact admin scope, membership/permission repair, orphan prevention, immutable audit, privileged security, and invitations. The Activation-wave organization claims console is not a server-side access-control prerequisite. |
| `ADM-084` Versioned configuration change records | `ADM-081` | `ADM-083`, `ADM-085` | Versioned configuration history belongs to the Policy & Configuration Center and canonical audit system; the communications center is not an architectural prerequisite. |
| `ADM-086` Audit corrections without history deletion | `ADM-083` | `ADM-085` | Additive corrections operate on immutable administrative audit events. Governed configuration is not required to append a correction referencing an existing audit event. |

## Wave 2 Activation dependency corrections — reviewed 2026-07-30; amended 2026-07-31

| Feature | Seeded dependency | Canonical dependency | Reason for correction |
| --- | --- | --- | --- |
| `INF-008` Firebase Storage document/media foundation | `INF-001`, `INF-003`, `ORG-004` | `INF-001`, `INF-003`, `ARC-005`, `ARC-009`, `AUTH-003` | Storage is infrastructure used by later organization-authority workflows, including sensitive authority evidence. Its prerequisite is the established tenant, permission, asset-ownership and authenticated-access contracts; it cannot depend on the later `ORG-004` workflow that consumes it. This also reconciles the already-merged `INF-008` implementation with the live dependency graph. |
| `ORG-012` Profile Complete trigger | `ORG-007` | `ORG-007`, `ORG-008`, `ORG-009`, `GEO-010` | Profile Complete requires minimum organization identity/contact, a meaningful capability, service geography, confirmed location and location visibility. Organization type, descriptive participation roles and business objectives are optional enrichment and cannot block activation. |
| `GEO-011` Organization marker activation | none | `GEO-005`, `GEO-007`, `ORG-006`, `ORG-012` | Marker activation is the culmination of activation: the locality must be rendered and governed by a release state, the organization location must be geocoded/confirmed, and the minimum profile must actually be complete before the marker appears. |
| `EDU-009` First-value pathway selection | none | `EDU-008` | First value is selected after the participant completes orientation. Optional profile objectives are not collected during registration and are not a prerequisite; valid acquisition context may recommend a path without completing it or granting authority. |
| `EDU-010` Open-platform release gating | `ARC-007` | `ARC-003`, `ARC-008`, `AUTH-004`, `GOV-001`, `GOV-002`, `GOV-003`, `ORG-004`, `ORG-012`, `GEO-011`, `EDU-008`, `EDU-009` | OPEN is a terminal activation gate, not merely a lifecycle-state capability. It requires a usable attached user with no blocking restriction, completed authentication/policy obligations, an established organization relationship, minimum profile completion, real marker activation, orientation completion and presentation of the first-value pathway. |

## Wave 3 Network dependency corrections — reviewed 2026-07-30; amended 2026-07-31

| Feature | Seeded dependency | Canonical dependency | Reason for correction |
| --- | --- | --- | --- |
| `RES-001` Official Resource Provider application | `ORG-019` | `ORG-012` | Additional locations and descriptive organization roles are optional enrichment. A legitimate Profile Complete organization enters the separate provider application and administrator-review process without self-selecting Official Resource Provider status during registration. |
| `DSC-011` Contextual official resource search | none | `RES-003` | Resource discovery needs the structured provider service profile that defines services, territory, eligibility, intake and related search fields. |
| `REF-006` Provider referral/request connection | none | `REF-005`, `RES-003` | Provider routing must reuse the consent/minimum-necessary referral boundary and target a provider with a structured service profile. |
| `ACQ-006` Invite non-member to receive referral | none | `ACQ-003`, `REF-001`, `COMMS-003` | Referral acquisition requires a real referral, preserved acquisition context through activation and a versioned transactional invitation event/template. |
| `ACQ-008` Provider-shared opportunity/profile invitations | none | `ACQ-003`, `RES-002`, `COMMS-003` | Provider-driven acquisition requires preserved context, approved Official Resource Provider state and versioned transactional communications. |

Official Resource Provider approval in Wave 3 is a controlled provider application/status decision. It must remain separate from descriptive profile metadata and from the later substantive Credibility `Organization Verified` and `Verified Resource Provider` badges; commercial status cannot satisfy either concept.

## Wave 1 high-leverage dependency chain — closed historical reference

```text
ARC-005 [Done]
  ├─ ORG-021 Invite additional organizational users [Done]
  │    └─ ADM-056 Admin management of organization memberships and permission bundles [Done]
  │          └─ ADM-059 Platform health summary panels [Done]
  └─ ORG-022 Standard user role presets [Done]
       └─ ADM-055 Organization role bundle catalog [Done]
            ├─ ADM-058 Attention-first command center [Done]
            ├─ ADM-060 Unified cross-domain administrative work queue [Done]
            │    └─ ADM-061 Administrative case data model [Done]
            │          └─ ADM-062 Case lifecycle / SLA controls [Done]
            └─ ADM-091 Universal administrative search [Done]
```

## Wave 1 configuration / operations branch — closed historical reference

```text
GOV-006 [Done]
  └─ ADM-083 Policy & Configuration Center [Done]
       ├─ ADM-047 Feature-flag administration [Done]
       └─ ADM-084 Versioned configuration change records [Done]

INF-007 [Done] ─┐
ADM-046 [Done] ─┼─ ADM-048 Safe job retry / reindex / maintenance controls [Done]
ADM-085 [Done] ─┤
ADM-088 [Done] ─┘

ADM-085 [Done]
  └─ ADM-086 Audit corrections without history deletion [Done]
```

## Wave 1 user administration branch — closed historical reference

```text
ARC-008 [Done] ─┐
ADM-014 [Done] ─┤
ADM-056 [Done] ─┤
ADM-069 [Done] ─┼─ ADM-068 Controlled user administration actions [Done]
ADM-085 [Done] ─┤
ADM-088 [Done] ─┤
ORG-021 [Done] ─┘
```

## Wave 2 Activation critical path

```text
Controlled geography
  GEO-001 → GEO-002 → GEO-003
                 ├─ GEO-004 → GEO-005
                 ├─ GEO-007
                 └─ GEO-008

Organization resolution and authority
  ACQ-004 → ORG-001 → ORG-002 → ORG-004
                   └→ ORG-003

Location and essential profile
  ORG-004 → ORG-005 → ORG-006
  GEO-009 → GEO-010
  ORG-007 → ORG-008
  ORG-010 optional post-activation classification enrichment
  ORG-011 optional post-activation personalization enrichment
  ORG-007 + ORG-008 + ORG-009 + GEO-010 → ORG-012

Primary activation moment
  GEO-005 + GEO-007 + ORG-006 + ORG-012 → GEO-011

Orientation and release
  EDU-001 → EDU-002 → EDU-003 → EDU-004 → EDU-005 → EDU-006 → EDU-007 → EDU-008 → EDU-009
  ARC-003 + ARC-008 + AUTH-004 + GOV-001 + GOV-002 + GOV-003
      + ORG-004 + ORG-012 + GEO-011 + EDU-008 + EDU-009 → EDU-010 OPEN
```

The critical path expresses prerequisite authority only. The adopted slice roadmap below may intentionally merge already-eligible work in an order that minimizes rework and produces coherent vertical increments.

## Adopted Wave 2 Activation slice roadmap — complete via PR #104

Wave 2 begins from the merged tracker state **2/43 complete** (`INF-007`, `INF-008`). The roadmap below covers the **41 remaining Activation features**.

1. **Slice 2.1 — `GEO-001` + `GEO-002` + `GEO-003` + `GEO-007` + `GEO-008` — Geography Authority**: primary operating geography, server-side authorization, canonical FIPS/geography metadata, release states, bounds and locality camera.
2. **Slice 2.2 — `GEO-004` + `GEO-005` + `GEO-006` — Geography Rendering**: authoritative locality boundaries, prominent selected-locality treatment and muted surrounding geographies.
3. **Slice 2.3 — `ACQ-004` + `ORG-001` + `ORG-002` + `ORG-003` — Organization Resolution**: seeded/unclaimed profile, organization matching, claim/create flow and duplicate/entity-resolution protection.
4. **Slice 2.4 — `COMMS-002` — Microsoft Transactional Email**: production Microsoft delivery adapter behind the provider-neutral communication boundary.
5. **Slice 2.5 — `ORG-004` + `ADM-065` + `ADM-066` — Organization Authority & Claims**: establish organizational authority plus administrative claims discovery and auditable conflict adjudication.
6. **Slice 2.6 — `GEO-009` + `GEO-010` + `ORG-005` + `ORG-006` + `ORG-009` — Organization Geography & Location**: home-versus-service geography, address capture, geocoding/map confirmation, privacy and service-area capture.
7. **Slice 2.7 — `ORG-007` + `ORG-008` + `ORG-010` + `ORG-011` + `ORG-012` — Essential Organization Profile**: minimum identity/contact and meaningful capability establish Profile Complete with the existing geography/location gates; organization type, descriptive roles and objectives remain optional post-activation enrichment.
8. **Slice 2.8 — `GEO-011` + `ADM-063` + `ADM-064` — Marker Activation & Admin 360**: activate the real organization marker and provide complete scoped administrative organization context/status.
9. **Slice 2.9 — `ACQ-002` + `ACQ-003` — Acquisition-to-Activation Continuity — COMPLETE VIA PR #101**: public opportunity entry and preservation of opportunity/claim/referral/team/provider/buyer context through registration and first authenticated experience.
10. **Slice 2.10 — `EDU-001` + `EDU-002` + `EDU-003` + `EDU-004` — Orientation: Discovery & Team Formation — COMPLETE VIA PR #102**: protected, deterministic synthetic three-organization map tutorial from opportunity issuance through capability gap and teammate discovery.
11. **Slice 2.11 — `EDU-005` + `EDU-006` + `EDU-007` + `EDU-008` — Orientation: Response to Outcome — COMPLETE VIA PR #103**: teammate invitation/acceptance, structured joint response, evaluation/selection and complete network-effect visualization.
12. **Slice 2.12 — `EDU-009` + `EDU-010` — First Value & OPEN Gate — COMPLETE VIA PR #104**: post-orientation semantic first-value selection followed by OPEN only after the complete fresh server gate passes.

The sequence above is planning order, not a completion claim. Recalculate dependency eligibility from merged `main` after every slice and mark an item Done only after its acceptance checks and CI evidence pass.

## Wave 3 Network critical path

```text
Wave 2 OPEN/marker
  → COMMS-003/004/005 [Done via PR #107]
  → Brand Gate B1 [Done via PR #109]
  → Brand Gates B2/B3/B6a [Done via PRs #111/#112/#115]
  → GEO-012 + DSC-001/002/003 [Done via PR #120]
  → ORG-013/014/016/017 [Done in accepted Slice 3.3 implementation]
  → ORG-015/018/019 [Done via PR #128]
  → REF-001/002/003/004/005 + EDU-014 + ACQ-006 [Done via PR #130]
  → RES-001/002/003 + ADM-070 [Done via PR #132]
  → RES-004/005 + DSC-011 + REF-006 + RES-007/008 + ACQ-008 [Done via PR #137]
  → EDU-016/017 [Done via PR #139]
```

The already-complete Wave 3 foundations `ORG-021`, `ORG-022`, `ADM-055` and `ADM-056` remain inherited prerequisites and are not rebuilt.

## Adopted Wave 3 Network slice roadmap — complete; closeout accepted

Wave 3 contains **38 Network features**. All 38 have implementation and acceptance evidence: four inherited Wave 1 foundations, three Slice 3.1 communications features, four Slice 3.2 discovery features, four Slice 3.3 market-profile features, three Slice 3.4 organization-enrichment features, seven Slice 3.5 referral/acquisition features, four Slice 3.6 provider-foundation features, seven Slice 3.7 resource-routing features, and two Slice 3.8 persistent-education features. The adopted sequence is:

1. **Slice 3.1 — `COMMS-003` + `COMMS-004` + `COMMS-005` — Transactional Communications Reliability — COMPLETE VIA PR #107**.
2. **Slice 3.2 — `GEO-012` + `DSC-001` + `DSC-002` + `DSC-003` — Controlled Network Entry & Discovery — COMPLETE VIA PR #120**.
3. **Slice 3.3 — `ORG-013` + `ORG-014` + `ORG-016` + `ORG-017` — Market Profile Enrichment — COMPLETE VIA PR #126**.
4. **Slice 3.4 — `ORG-015` + `ORG-018` + `ORG-019` — Credential, Media & Location Enrichment — COMPLETE VIA PR #128**.
5. **Slice 3.5 — `REF-001` + `REF-002` + `REF-003` + `REF-004` + `REF-005` + `EDU-014` + `ACQ-006` — Referral Network & Referral Acquisition — COMPLETE VIA PR #130**.
6. **Slice 3.6 — `RES-001` + `RES-002` + `RES-003` + `ADM-070` — Official Resource Provider Foundation — COMPLETE VIA PR #132**.
7. **Slice 3.7 — `RES-004` + `RES-005` + `DSC-011` + `REF-006` + `RES-007` + `RES-008` + `ACQ-008` — Resource Discovery, Routing & Provider Distribution — COMPLETE VIA PR #137**.
8. **Slice 3.8 — `EDU-016` + `EDU-017` — Persistent Network Education — COMPLETE VIA PR #139**.

**Dependency result:** PR #120 completes the dependency-eligible `GEO-012`, `DSC-001`, `DSC-002` and `DSC-003` set after Slice 3.1 and Brand Gates B0–B6a. No dependency edge changed in this reconciliation.

**Implementation sequencing result:** Slice 3.7 passed exact-head production CI run `31300282317`, merged via PR #137 at `25baba600d6e1913a8941570f7348454d2e6941d`, and passed post-merge production CI run `31300395073`. The conditional B6b checkpoint found no explicit prerequisite or concrete bounded convergence need, so B6b remains Not Started. Slice 3.8 final-head production CI run `31303588724` passed, PR #139 merged at `2727b6111d1582225e8ece409d015b8696a8cce7`, and post-merge `main` CI run `31303727886` passed. The separate configured-browser exit and global zero-residual reconciliation in `docs/architecture/WAVE_3_CLOSEOUT.md` then accepted Wave 3 at Network **38/38** without changing totals or dependency edges.

**Slice 4.1 implementation result:** `ISS-001`, `ISS-002` and `ISS-003` now establish the private organization-owned RFx aggregate, bounded `draft` lifecycle, governed AMACS 0.5.0 request-family snapshot, atomic event/idempotency/audit persistence and blank-source Operational Workspace entry. No publication, opportunity projection or later-slice domain was introduced.

**Slice 4.2 authority result:** Slice 4.1 merged at `3a00288f5cef74c1665266da4a2349cf4cddb9bb` and post-merge CI run `31553653104` passed. The documentation-only Slice 4.2 execution authority for `ISS-005` and `ISS-006` is now defined in `docs/slices/SLICE_4_2_EXECUTION_AUTHORITY.md`; it changes no Feature-ID state or dependency edge.

**Slice 4.2 implementation result:** `ISS-005` and `ISS-006` now extend the same private RFx aggregate with a structured need/package builder, controlled performance geography, value, term, typed foundation requirements, module status, bounded save/recovery and optional non-authoritative interpretation. No publication, opportunity projection or later-slice domain was introduced.

**Slice 4.3 authority result:** Slice 4.2 merged at `90ee6e08a18a67cc794ff1a84a047a8313ad50d6` and post-merge CI run `31557436934` passed. The documentation-only Slice 4.3 execution authority for `ISS-007`, `ISS-009` and `ISS-011` is now defined in `docs/slices/SLICE_4_3_EXECUTION_AUTHORITY.md`. It adopts the reviewed `ISS-009` dependency on stable Slice 4.2 foundation requirements plus Slice 4.3 AMACS requirements; no Feature-ID status changes.

**Slice 4.3 implementation result:** `ISS-007`, `ISS-009` and `ISS-011` now extend the same private aggregate with server-canonical AMACS requirements, an expandable linked response structure and an expandable linked evaluation definition. The manual workflow, atomic version/event/receipt/audit seam and tenant-safe recovery are accepted without publication or an opportunity projection.

**Slice 4.4 authority result:** Slice 4.3 merged through PR #165 at `81ec0c7a7fbd28a2a4827d4ba448a5ceb28b6ed7`; exact-head CI run `31561013074` and post-merge `main` run `31561286020` passed. The documentation-only Slice 4.4 execution authority for `ISS-016`, `ISS-018`, `ISS-019`, `ISS-020` and `ACQ-009` is now defined in `docs/slices/SLICE_4_4_EXECUTION_AUTHORITY.md`. It introduces no runtime or dependency-edge change.

**Slice 4.4 implementation result:** `ISS-016`, `ISS-018`, `ISS-019`, `ISS-020` and `ACQ-009` now add current readiness, one exact preview/live projector, atomic immutable publication, a minimized audience-gated opportunity projection, controlled sharing and a fail-closed advanced-capability seam. Wave 4 is **13/41 Done**. The accepted real publication source makes B6c opportunity expression eligible for separate authority but does not complete or begin it.

**Slice 4.5 authority result:** Slice 4.4 merged through PR #167 at `273b98283f70fe558e1313aed16419943500bb1f`; exact-head CI run `31565248391` and post-merge `main` run `31566108284` passed. The documentation-only Slice 4.5 execution authority for `DSC-004`, `DSC-005`, `DSC-006`, `DSC-007` and `DSC-008` is now defined in `docs/slices/SLICE_4_5_EXECUTION_AUTHORITY.md`. Existing dependencies on `ISS-019`, Wave 3 controlled discovery and `COMMS-003/004/005` are satisfied; no dependency edge or Feature-ID state changes.

**Slice 4.5 implementation result:** `DSC-004`, `DSC-005`, `DSC-006`, `DSC-007` and `DSC-008` now add permitted real opportunity discovery, governed saved searches, deterministic match events with minimized versioned communication requests, one private watch relation and canonical deadline views. Wave 4 is **18/41 Done**. B6c remains eligible but Not Started; no fit, pursuit or later runtime was introduced.

**Slice 4.6 authority result:** Slice 4.5 merged through PR #169 at `b6939d7f970e23777d92cf7105547f39fc3d9b8b`; exact-head CI run `31569510176` and post-merge `main` run `31569816983` passed. The documentation-only Slice 4.6 execution authority for `RSP-001`, `RSP-002`, `RSP-003`, `RSP-004` and `RSP-006` is now defined in `docs/slices/SLICE_4_6_EXECUTION_AUTHORITY.md`. Existing dependencies on real published opportunity discovery, confirmed structured organization capability claims, organization authority and release-aware AMACS comparison are satisfied; no dependency edge or Feature-ID state changes.

**Next-implementation result:** implement only the bounded Slice 4.6 deterministic fit, private Go/No-Go, typed-gap and one effective Watch/Pursue/Decline runtime. Slice 4.7 and all response/submission or later runtime remain ineligible before that implementation merges and passes post-merge acceptance.

See `docs/slices/WAVE_3_ROADMAP.md`, `docs/slices/WAVE_4_RFX_CORE_ROADMAP.md`, `docs/slices/SLICE_4_1_EXECUTION_AUTHORITY.md`, `docs/brand/BRAND_GATE_B1_SEMANTIC_FOUNDATION.md` and the applicable canonical slice authority for detailed boundaries and acceptance intent.
