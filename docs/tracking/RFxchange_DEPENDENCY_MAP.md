# RFxchange Canonical Dependency Map

> Live dependency authority for build sequencing. The original spreadsheet remains the provenance source, but this Markdown file controls dependency scheduling when a reviewed correction supersedes a seeded spreadsheet edge.

## Rules

- Preserve every approved Feature ID; dependency corrections do not delete or rename features.
- A dependency listed here supersedes the seeded dependency for sequencing only after architectural review.
- Completion still requires the acceptance criteria from the source specification and evidence in `RFxchange_MASTER_BUILD_TRACKER.md`.
- Dependencies are prerequisites, not implicit completion. Satisfying a prerequisite never marks the dependent feature Done.
- Recalculate the next slice from the merged `main` state after each slice.

## Reviewed dependency corrections — 2026-07-30

| Feature | Seeded dependency | Canonical dependency | Reason for correction |
| --- | --- | --- | --- |
| `ADM-047` Feature-flag administration | `ADM-045` | `GOV-006`, `ADM-046`, `ADM-083`, `ADM-085`, `ADM-088` | Feature-flag control is governed technical configuration. It requires authority, operations visibility, governed configuration, immutable audit, and privileged-security controls; locality landing/announcement management is unrelated. |
| `ADM-048` Safe job retry, reindex and maintenance controls | `ADM-045` | `INF-007`, `ADM-046`, `ADM-085`, `ADM-088` | Recovery operations depend on the background-job framework, operations health, audit evidence, and privileged-security controls; locality landing/announcement management is unrelated. |
| `ADM-068` Controlled user administration actions | `ADM-065` | `ARC-008`, `ADM-014`, `ADM-056`, `ADM-069`, `ADM-085`, `ADM-088`, `ORG-021` | Controlled administration of an already-resolved user's organization access depends on restriction states, exact admin scope, membership/permission repair, orphan prevention, immutable audit, privileged security, and invitations. The Activation-wave organization claims console is not a server-side access-control prerequisite. |
| `ADM-084` Versioned configuration change records | `ADM-081` | `ADM-083`, `ADM-085` | Versioned configuration history belongs to the Policy & Configuration Center and canonical audit system; the communications center is not an architectural prerequisite. |
| `ADM-086` Audit corrections without history deletion | `ADM-083` | `ADM-085` | Additive corrections operate on immutable administrative audit events. Governed configuration is not required to append a correction referencing an existing audit event. |

## Wave 2 Activation dependency corrections — 2026-07-30

| Feature | Seeded dependency | Canonical dependency | Reason for correction |
| --- | --- | --- | --- |
| `INF-008` Firebase Storage document/media foundation | `INF-001`, `INF-003`, `ORG-004` | `INF-001`, `INF-003`, `ARC-005`, `ARC-009`, `AUTH-003` | Storage is infrastructure used by later organization-authority workflows, including sensitive authority evidence. Its prerequisite is the established tenant, permission, asset-ownership and authenticated-access contracts; it cannot depend on the later `ORG-004` workflow that consumes it. This also reconciles the already-merged `INF-008` implementation with the live dependency graph. |
| `ORG-012` Profile Complete trigger | `ORG-007` | `ORG-007`, `ORG-008`, `ORG-009`, `ORG-010`, `GEO-010` | The acceptance condition requires identity/contact, capability, geography, visibility and role fields. Minimum identity alone cannot legitimately produce Profile Complete. |
| `GEO-011` Organization marker activation | none | `GEO-005`, `GEO-007`, `ORG-006`, `ORG-012` | Marker activation is the culmination of activation: the locality must be rendered and governed by a release state, the organization location must be geocoded/confirmed, and the minimum profile must actually be complete before the marker appears. |
| `EDU-009` Objective-based first-value pathway | none | `ORG-011` | The first-value pathway is explicitly driven by the organization's selected business objectives, so the objective preferences must exist first. |
| `EDU-010` Open-platform release gating | `ARC-007` | `ARC-003`, `ARC-008`, `AUTH-004`, `GOV-001`, `GOV-002`, `GOV-003`, `ORG-004`, `ORG-012`, `GEO-011`, `EDU-008`, `EDU-009` | OPEN is a terminal activation gate, not merely a lifecycle-state capability. It requires a usable attached user with no blocking restriction, completed authentication/policy obligations, an established organization relationship, minimum profile completion, real marker activation, orientation completion and presentation of the first-value pathway. |

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
          ├→ ORG-010
          └→ ORG-011 → EDU-009
  ORG-007 + ORG-008 + ORG-009 + ORG-010 + GEO-010 → ORG-012

Primary activation moment
  GEO-005 + GEO-007 + ORG-006 + ORG-012 → GEO-011

Orientation and release
  EDU-001 → EDU-002 → EDU-003 → EDU-004 → EDU-005 → EDU-006 → EDU-007 → EDU-008
  ARC-003 + ARC-008 + AUTH-004 + GOV-001 + GOV-002 + GOV-003
      + ORG-004 + ORG-012 + GEO-011 + EDU-008 + EDU-009 → EDU-010 OPEN
```

The critical path expresses prerequisite authority only. The adopted slice roadmap below may intentionally merge already-eligible work in an order that minimizes rework and produces coherent vertical increments.

## Adopted Wave 2 Activation slice roadmap — implementation hold

Wave 2 begins from the merged tracker state **2/43 complete** (`INF-007`, `INF-008`). The roadmap below covers the **41 remaining Activation features**.

1. **Slice 2.1 — `GEO-001` + `GEO-002` + `GEO-003` + `GEO-007` + `GEO-008` — Geography Authority**: primary operating geography, server-side authorization, canonical FIPS/geography metadata, release states, bounds and locality camera.
2. **Slice 2.2 — `GEO-004` + `GEO-005` + `GEO-006` — Geography Rendering**: authoritative locality boundaries, prominent selected-locality treatment and muted surrounding geographies.
3. **Slice 2.3 — `ACQ-004` + `ORG-001` + `ORG-002` + `ORG-003` — Organization Resolution**: seeded/unclaimed profile, organization matching, claim/create flow and duplicate/entity-resolution protection.
4. **Slice 2.4 — `COMMS-002` — Microsoft Transactional Email**: production Microsoft delivery adapter behind the provider-neutral communication boundary.
5. **Slice 2.5 — `ORG-004` + `ADM-065` + `ADM-066` — Organization Authority & Claims**: establish organizational authority plus administrative claims discovery and auditable conflict adjudication.
6. **Slice 2.6 — `GEO-009` + `GEO-010` + `ORG-005` + `ORG-006` + `ORG-009` — Organization Geography & Location**: home-versus-service geography, address capture, geocoding/map confirmation, privacy and service-area capture.
7. **Slice 2.7 — `ORG-007` + `ORG-008` + `ORG-010` + `ORG-011` + `ORG-012` — Essential Organization Profile**: minimum identity, meaningful capability, multi-role classification, business objectives and legitimate Profile Complete state.
8. **Slice 2.8 — `GEO-011` + `ADM-063` + `ADM-064` — Marker Activation & Admin 360**: activate the real organization marker and provide complete scoped administrative organization context/status.
9. **Slice 2.9 — `ACQ-002` + `ACQ-003` — Acquisition-to-Activation Continuity**: public opportunity entry and preservation of opportunity/claim/referral/team/provider/buyer context through registration and first authenticated experience.
10. **Slice 2.10 — `EDU-001` + `EDU-002` + `EDU-003` + `EDU-004` — Orientation: Discovery & Team Formation**: synthetic three-organization map tutorial from opportunity issuance through capability gap and teammate discovery.
11. **Slice 2.11 — `EDU-005` + `EDU-006` + `EDU-007` + `EDU-008` — Orientation: Response to Outcome**: teammate invitation/acceptance, structured joint response, evaluation/selection and complete network-effect visualization.
12. **Slice 2.12 — `EDU-009` + `EDU-010` — First Value & OPEN Gate**: objective-driven first action followed by OPEN only after the complete user, organization, geography, marker and education gates are satisfied.

**Implementation hold:** this roadmap is adopted as planning authority, but **Slice 2.1 must not begin until explicit follow-up authorization is given**.

The sequence above is planning order, not a completion claim. Recalculate dependency eligibility from merged `main` after every slice and mark an item Done only after its acceptance checks and CI evidence pass.
