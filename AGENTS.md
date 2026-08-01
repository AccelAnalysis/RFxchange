# RFxchange Codex Operating Instructions

This repository implements **The RFxchange**, an organization-centered, map-based business growth network. Treat these instructions as the repository operating manual for planning and implementation work.

## Product model

- The **organization** is the primary market entity. Individual users authenticate separately but act through one or more organizations with explicit membership, role and permission state.
- The RFxchange is not a generic social network, static directory, conventional bid portal, CRM replacement or procurement system of record.
- The core product connects organization identity, geography, capability discovery, RFx activity, teaming, referrals, resources, credibility and economic intelligence.
- Geography is a controlled product concept, not browser presentation state. Locality participation and release state must be enforced server-side.
- Activation culminates in the organization's **real marker appearing on the real controlled map** after the required identity, authority, location, profile and geography conditions are satisfied.
- Organizational claim/authority and Organization Verification are separate concepts. A user may establish authority to manage an organization without making that organization Verified.
- Commercial status, membership, Founding recognition or sponsorship must never silently alter substantive credibility, verification, RFx qualification, market matching or neutral discovery.

## Source authority

Use these sources together rather than treating one file as universally authoritative:

1. **Current explicit task instructions** define the work requested in the current task.
2. `docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md` is the live Feature-ID completion authority. A checked item requires acceptance and implementation evidence.
3. `docs/tracking/RFxchange_DEPENDENCY_MAP.md` is the live sequencing/dependency authority. Reviewed corrections there supersede seeded spreadsheet dependencies for scheduling.
4. The applicable `docs/slices/` brief defines the approved implementation boundary for that slice. A brief cannot mark a feature complete or waive its documented acceptance intent.
5. `docs/context/` contains normalized cross-cutting product rules distilled from approved source material.
6. `docs/brand/` defines the approved target brand architecture, semantic meaning, messaging, map/data grammar, motion, sensory rules, viewing modes and brand acceptance after Brand Gate B0.
7. `docs/design/` defines the currently implemented visual/UI/presentation baseline. For user-facing UI read `docs/design/README.md` and `docs/design/RFxchange_DESIGN_SYSTEM.md`; map/geography work also requires `docs/design/MAP_VISUAL_SYSTEM.md`.
8. Existing production architecture and merged architecture decisions govern implementation mechanics unless the current task intentionally changes them.
9. `docs/reference/` contains provenance and visual/prototype references. Reference artifacts demonstrate product intent; they are not automatically production architecture.

Authority order for participant-facing work is:

1. current task and authorized slice/gate;
2. security, privacy, authorization, lifecycle, geography, domain, tracker and dependency authorities;
3. `docs/brand/` for the approved target experience;
4. `docs/design/` for the currently converged implementation baseline;
5. existing runtime as implementation evidence and compatibility context.

If two sources appear to conflict, do not silently choose the easiest interpretation. Preserve the stricter security/privacy requirement and report the conflict before widening scope. A visual or brand rule never grants authority or expands slice scope.

## Build sequencing

- Use a **single-active-slice or single-active-gate model** unless the current task explicitly authorizes otherwise.
- Preparation and code inspection for the next slice may occur while the current slice is validating, but do not begin implementation of the next slice before the current slice is merged and dependency eligibility is recalculated.
- Do not implement future Feature IDs merely because adjacent code makes them convenient.
- Incidental satisfaction of another Feature ID must be evaluated against that feature's own acceptance check before tracker status changes.
- Recalculate the next slice from merged `main`, not from assumptions made on an older branch.
- Documentation-only planning and reconciliation do not authorize production implementation.

## Current wave and brand boundary

Wave 2 is complete and reconciled on merged `main` at `097b574ccce8865d4127cfe381fb0bd6199de0a5` with **43/43 Activation** features complete.

The canonical dependency graph identifies **Wave 3 Slice 3.1 — Transactional Communications Reliability** (`COMMS-003`, `COMMS-004`, `COMMS-005`) as the earliest dependency-eligible candidate. No Wave 3 implementation begins unless the current task explicitly authorizes that slice.

Brand Gate B0 is documentation and authority reconciliation only. Subsequent Brand Gates and net-new capabilities such as Intelligence Dark, Presentation Mode, production sound or haptics require explicit authorization and any necessary tracker governance.

## Required reading before a slice or gate

Before implementing any slice or Brand Gate:

1. Read this file.
2. Read `docs/context/README.md`.
3. Read the canonical tracker and dependency map.
4. Read the applicable wave roadmap.
5. Read the specific slice or Brand Gate authority.
6. Read the context documents listed under **Must read**.
7. Inspect existing production abstractions before designing new ones.
8. If the work creates or materially changes user-facing UI, read `docs/brand/README.md`, the applicable brand guides, `docs/design/README.md` and `docs/design/RFxchange_DESIGN_SYSTEM.md`.
9. If the work creates or materially changes map/geography UI, also read `docs/brand/MAP_AND_DATA_VISUAL_GRAMMAR.md` and `docs/design/MAP_VISUAL_SYSTEM.md`.
10. If the work creates customer-facing copy or communications, read `docs/brand/CONTENT_AND_MESSAGING_SYSTEM.md`.
11. If the work introduces motion, sound, haptics or a viewing mode, read the corresponding brand authority and confirm that the capability is explicitly authorized.

## Brand requirement classes

- **Cross-cutting standards** may govern authorized surfaces without claiming a new domain feature: naming, semantic color, typography, messaging, evidence integrity, loading/empty/error states, accessibility, reduced motion, state preservation and performance.
- **Domain-dependent expressions** may be designed but cannot appear as live product state before their authoritative domain exists: opportunity beacons, service fields, referral/team/RFx paths, credibility seals and outcome paths.
- **Net-new capabilities** require explicit scope, persistence, permissions, tests and tracker treatment where appropriate: Intelligence Dark, Presentation Mode, sonic preferences/runtime, haptics and comparable new settings or projections.

## Engineering invariants

- Server-side authorization is authoritative. Client state never grants access.
- Keep Firebase UID, RFxchange user identity, organization membership and administrative authority conceptually separate.
- Preserve immutable/auditable history for sensitive administrative, access, claim, credibility and policy decisions.
- Do not expose sensitive evidence or private organization data through public projections.
- Prefer explicit state machines and typed domain contracts over UI-only state.
- Provider adapters remain behind domain/application boundaries; do not leak Firebase, Microsoft or payment-provider implementation details into domain models.
- Do not weaken existing security rules or architecture tests to make new work pass.
- Motion, sound and visual success states consume authoritative application/domain facts; button clicks and optimistic UI are not authority.
- Do not fabricate organizations, opportunities, maps, statistics, outcomes, testimonials, provider availability or live network activity.

## Runtime and validation

Repository/CI development runtime is Node.js **24.18.x** (`package.json` requires `>=24.18.0 <25`). Firebase Functions deploy on **Node.js 22** as pinned in `firebase.json`; the functions workspace remains testable in the repository toolchain.

Before claiming a slice or gate complete, run the slice/gate-specific checks plus the repository validation expected by the task. The canonical full local gate is:

```bash
npm run check
```

Key scripts are defined in `package.json`. Add focused validation scripts/tests for new architectural contracts when appropriate, and keep existing gates green.

Brand acceptance supplements and never replaces domain, security, lifecycle, geography, emulator or configured-browser acceptance.

## Tracker discipline

- Do not delete, rename or reorder approved Feature IDs casually.
- Mark `[x]` only after the feature's documented acceptance check passes and evidence exists.
- Update evidence in the same PR as implementation whenever practical.
- Documentation-only planning/reconciliation must not change progress totals or completion statuses.
- A visual simulation or tutorial never completes the corresponding live domain Feature ID.

## Design, brand and visual references

- Treat `docs/brand/` as the approved target experience after B0 and `docs/design/` as the currently implemented/converged baseline.
- Do not reconstruct design rules from screenshots when the brand or design systems address the topic.
- Read `docs/reference/prototypes/README.md` before using prototype code.
- Read `docs/reference/screenshots/README.md` before treating screenshots as visual requirements.
- Preserve anchored geographic markers, authoritative locality geometry, strong selected-locality treatment, muted surrounding context, restrained glassmorphism, reduced container/border chrome and a continuous map-first workspace where those rules apply.
- Normal markers/nodes are not outlined as a default treatment; use fill, glyph, shadow and separate hover/selection emphasis while keeping the geographic anchor fixed.
- Domain-dependent objects must remain absent or truthfully unavailable until their source domains exist.
- Never copy prototype architecture wholesale merely because it visually demonstrates the desired behavior.

## Completion report

At the end of implementation or reconciliation work, report:

- Feature IDs or Brand Gate addressed.
- Acceptance evidence and tests run.
- Any architecture/dependency discoveries that affect later slices or gates.
- Tracker changes made or intentionally not made.
- Explicit confirmation that later slices/gates were not begun unless authorized.
