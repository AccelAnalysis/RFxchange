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
| `ADM-084` Versioned configuration change records | `ADM-081` | `ADM-083`, `ADM-085` | Versioned configuration history belongs to the Policy & Configuration Center and canonical audit system; the communications center is not an architectural prerequisite. |
| `ADM-086` Audit corrections without history deletion | `ADM-083` | `ADM-085` | Additive corrections operate on immutable administrative audit events. Governed configuration is not required to append a correction referencing an existing audit event. |

## High-leverage dependency chain

```text
ARC-005 [Done]
  ├─ ORG-021 Invite additional organizational users
  │    └─ ADM-056 Admin management of organization memberships and permission bundles
  │          └─ ADM-059 Platform health summary panels
  └─ ORG-022 Standard user role presets
       └─ ADM-055 Organization role bundle catalog
            ├─ ADM-058 Attention-first command center
            ├─ ADM-060 Unified cross-domain administrative work queue
            │    └─ ADM-061 Administrative case data model
            │          └─ ADM-062 Case lifecycle / SLA controls
            └─ ADM-091 Universal administrative search
```

## Configuration / operations branch

```text
GOV-006 [Done]
  └─ ADM-083 Policy & Configuration Center
       ├─ ADM-047 Feature-flag administration
       └─ ADM-084 Versioned configuration change records

INF-007 [Done] ─┐
ADM-046 [Done] ─┼─ ADM-048 Safe job retry / reindex / maintenance controls
ADM-085 [Done] ─┤
ADM-088 [Done] ─┘

ADM-085 [Done]
  └─ ADM-086 Audit corrections without history deletion
```

## Active revised slice sequence

1. **Slice 1.22 — `ORG-021` + `ORG-022`**: organizational user invitations and standard organization role presets.
2. **Slice 1.23 — `ADM-055` + `ADM-056`**: organization role-bundle catalog and platform-admin membership/permission repair controls.
3. **Slice 1.24 — `ADM-058` + `ADM-059` + `ADM-060` + `ADM-091`**: attention-first command center, health panels, unified work queue, and universal admin search.
4. **Slice 1.25 — `ADM-061` + `ADM-062`**: canonical administrative case model and lifecycle/SLA controls.
5. **Slice 1.26 — `ADM-083` + `ADM-086`**: Policy & Configuration Center foundation plus additive audit corrections.
6. **Slice 1.27 — `ADM-047` + `ADM-048` + `ADM-084`**: controlled feature flags, recovery/maintenance actions, and versioned configuration history.

The sequence above is a planning order, not a completion claim. Each slice must still pass its own acceptance checks and production CI before the tracker status is changed.