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
  → RES-001/002/003 + ADM-070 [Authorized]
  → RES-004/005 + DSC-011 + REF-006 + RES-007/008 + ACQ-008
  → EDU-016/017
```

The already-complete Wave 3 foundations `ORG-021`, `ORG-022`, `ADM-055` and `ADM-056` remain inherited prerequisites and are not rebuilt.

## Adopted Wave 3 Network slice roadmap — Slices 3.1–3.5 and Brand Gates B0–B6a complete; Slice 3.6 authorized

Wave 3 contains **38 Network features**. Twenty-five are complete: four inherited Wave 1 foundations, three Slice 3.1 communications features, four Slice 3.2 discovery features, four Slice 3.3 market-profile features, three Slice 3.4 organization-enrichment features, and seven Slice 3.5 referral/acquisition features. The remaining **13 features** stay organized in the adopted sequence:

1. **Slice 3.1 — `COMMS-003` + `COMMS-004` + `COMMS-005` — Transactional Communications Reliability — COMPLETE VIA PR #107**.
2. **Slice 3.2 — `GEO-012` + `DSC-001` + `DSC-002` + `DSC-003` — Controlled Network Entry & Discovery — COMPLETE VIA PR #120**.
3. **Slice 3.3 — `ORG-013` + `ORG-014` + `ORG-016` + `ORG-017` — Market Profile Enrichment — COMPLETE VIA PR #126**.
4. **Slice 3.4 — `ORG-015` + `ORG-018` + `ORG-019` — Credential, Media & Location Enrichment — COMPLETE VIA PR #128**.
5. **Slice 3.5 — `REF-001` + `REF-002` + `REF-003` + `REF-004` + `REF-005` + `EDU-014` + `ACQ-006` — Referral Network & Referral Acquisition — COMPLETE VIA PR #130**.
6. **Slice 3.6 — `RES-001` + `RES-002` + `RES-003` + `ADM-070` — Official Resource Provider Foundation — AUTHORIZED; SINGLE ACTIVE SLICE**.
7. **Slice 3.7 — `RES-004` + `RES-005` + `DSC-011` + `REF-006` + `RES-007` + `RES-008` + `ACQ-008` — Resource Discovery, Routing & Provider Distribution**.
8. **Slice 3.8 — `EDU-016` + `EDU-017` — Persistent Network Education**.

**Dependency result:** PR #120 completes the dependency-eligible `GEO-012`, `DSC-001`, `DSC-002` and `DSC-003` set after Slice 3.1 and Brand Gates B0–B6a. No dependency edge changed in this reconciliation.

**Implementation sequencing result:** Slice 3.5 passed exact-head production CI run `31294774153`, merged via PR #130 at `516c49627aeff637b02982218f0682c1eea436ad`, and passed post-merge `main` CI run `31294884142`. The graph was recalculated from that merged tree with no dependency-edge correction required. `ORG-012` remains the canonical `RES-001` prerequisite and is complete. Slice 3.6 is now the earliest dependency-eligible and single active authorized slice. Slice 3.7 and later work remain unstarted.

See `docs/slices/WAVE_3_ROADMAP.md`, `docs/brand/BRAND_GATE_B1_SEMANTIC_FOUNDATION.md` and the applicable canonical slice brief for detailed boundaries and acceptance intent.
