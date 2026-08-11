# RFxchange Codex Operating Instructions

This repository implements **The RFxchange**, an organization-centered, map-based business growth network. Treat these instructions as the repository operating manual for planning and implementation work.

## Product model

- The **organization** is the primary market entity. Individual users authenticate separately but act through one or more organizations with explicit membership, role and permission state.
- The RFxchange is RFx-centered and organization-centered. Opportunities/RFx is the primary transaction lens and principal market-action proposition; Resources, Intelligence and Referrals are supporting lenses over the same market.
- The permanent authenticated participant-lens order is exactly `Opportunities/RFx | Resources | Intelligence | Referrals`. Availability governs action, not whether a governed permanent lens exists in the information architecture.
- Opportunities/RFx remains visibly first but unavailable, non-routable and never current until a separately authorized and accepted real participant RFx runtime exists. Do not create a placeholder route, draft, opportunity, beacon, match, response or simulated workflow to enable it.
- Network remains the current organization-network view/domain concept within Intelligence. It is not a peer lens. Account and Quick Start are utilities, not market lenses.
- Administrative navigation remains different: it exposes only implemented, server-authorized destinations. Do not generalize participant unavailable-lens visibility to future administrative sections.
- The RFxchange is not a generic social network, static directory, conventional bid portal, CRM replacement, procurement system of record or commercial-real-estate listing marketplace.
- The core product connects organization identity, geography, capability discovery, RFx activity, teaming, referrals, resources, credibility and economic intelligence.
- Geography is a controlled product concept, not browser presentation state. Locality participation and release state are enforced server-side.
- Activation culminates in the organization's **real marker appearing on the real controlled map** after required identity, authority, location, profile and geography conditions are satisfied.
- Organizational claim/authority and Organization Verification are separate concepts. A user may establish authority to manage an organization without making that organization Verified.
- Commercial status, membership, Founding recognition or sponsorship must never silently alter substantive credibility, verification, RFx qualification, market matching or neutral discovery.
- Do not fabricate RFxs, opportunity beacons, organizations, matches, providers, referrals, sites, outcomes, statistics, intelligence or market activity to simulate a target experience.

## Vocabulary

Use the cross-cutting vocabulary in `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md`:

- **Lens** — functional market context;
- **Layer** — map/analytical projection within a lens;
- **Appearance** — visual treatment only;
- **Workspace** — interaction composition for a task.

**Intelligence** is the functional analytical lens. **Light Appearance** and **Dark Appearance** are presentation terms. **Presentation Mode** is a separate future presentation-safe capability. **High Contrast** is an accessibility treatment. Do not use `Intelligence Dark` as though Intelligence were an appearance, and do not implement Dark Appearance or an appearance preference without explicit authority.

Participant-facing truthfulness has four required dimensions:

1. **Structural truthfulness** — represent the stable governed architecture rather than a temporary taxonomy.
2. **Capability truthfulness** — visible does not mean available; unavailable permanent lenses are explicit, non-actionable and non-current.
3. **State truthfulness** — unavailable, loading, empty, error, restricted and recovery states describe the relevant surface accurately.
4. **Continuity truthfulness** — ordinary authenticated movement remains visibly inside one Exchange and does not resemble a new application launch.

## Source authority

Use these sources together rather than treating one file as universally authoritative:

1. **Current explicit task instructions** define the work requested in the current task.
2. `docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md` is the live Feature-ID completion authority. A checked item requires acceptance and implementation evidence.
3. `docs/tracking/RFxchange_DEPENDENCY_MAP.md` is the live sequencing/dependency authority. Reviewed corrections there supersede seeded spreadsheet dependencies for scheduling.
4. The applicable `docs/slices/` execution authority defines the approved implementation boundary. A brief cannot mark a feature complete or waive documented acceptance intent.
5. `docs/context/` contains normalized cross-cutting product rules. `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md`, originally merged through PR #150 and reconciled by the bounded shell gate, governs participant-facing lens hierarchy, structural/capability/state/continuity truthfulness, spatial continuity, workspace boundaries and truthful cross-lens behavior.
6. `docs/rfx/` contains the converged RFx Core/AMACS/workspace/acceptance package.
7. `docs/brand/` defines approved target brand architecture, semantic meaning, messaging, map/data grammar, motion, sensory rules, appearance/presentation authority and brand acceptance after Brand Gate B0.
8. `docs/design/` defines the currently implemented visual/UI/presentation baseline. For user-facing UI read `docs/design/README.md` and `docs/design/RFxchange_DESIGN_SYSTEM.md`; map/geography work also requires `docs/design/MAP_VISUAL_SYSTEM.md`.
9. Existing production architecture and merged architecture decisions govern implementation mechanics unless the current task intentionally changes them.
10. `docs/reference/` contains provenance and visual/prototype references. Reference artifacts demonstrate product intent; they are not automatically production architecture.

Authority order for participant-facing work is:

1. current task and authorized slice/gate;
2. security, privacy, authorization, lifecycle, geography, domain, tracker and dependency authorities;
3. Exchange Interaction Architecture and applicable RFx Core authority;
4. `docs/brand/` for approved target experience;
5. `docs/design/` for currently converged implementation baseline; and
6. existing runtime as implementation evidence and compatibility context.

If sources appear to conflict, do not silently choose the easiest interpretation. Preserve the stricter security/privacy requirement and report the conflict before widening scope. A visual or brand rule never grants authority or expands slice scope.

## Build sequencing

- Use a **single-active-slice or single-active-gate model** unless the current task explicitly authorizes otherwise.
- Preparation and code inspection for the next slice may occur while the current slice validates, but do not begin implementation of the next slice before the current slice is merged and dependency eligibility is recalculated.
- Do not implement future Feature IDs merely because adjacent code makes them convenient.
- Incidental satisfaction of another Feature ID must be evaluated against that feature's own acceptance check before tracker status changes.
- Recalculate the next slice from merged `main`, not from assumptions made on an older branch.
- Documentation-only planning and reconciliation do not authorize production implementation.
- No deployment/release blocker becomes a product-domain dependency unless a current canonical dependency authority establishes that edge.
- Participant-facing Slice 4.1 RFx entry cannot be integrated into the shared shell until the no-Feature-ID Exchange-shell truthfulness/performance gate is merged and post-merge green.

## Current wave, stabilization and active gate boundary

Wave 2 is complete with **43/43 Activation** features.

Wave 3 Slices 3.1 through 3.8 are complete via PRs #107, #120, #126, #128, #130, #132, #137 and #139. Wave 3 Network is **38/38**, with integrated configured-browser and zero-residual evidence in `docs/architecture/WAVE_3_CLOSEOUT.md`.

Brand Gates B0 through B6a are complete. B6b remains **Not Started / intentionally pending** because no bounded convergence gate is currently required. B6c remains ineligible before real RFx publication authority. Later appearance, sensory, presentation, credibility and outcome gates require separate authority.

All independently executable work under Post-Wave 3 Stabilizations 1–7 is complete. **Stabilization 2C remains incomplete and isolated to release engineering.** The Firebase App Hosting backend `rfxchange`, project/repository connection, region `us-east4`, live branch `main`, root `/`, retained Web App and reserved App Hosting URL exist. The remaining blocker is trustworthy build-time source-SHA binding and an accepted same-SHA live rollout proving source SHA → `RFXCHANGE_BUILD_SHA`/build identity → rendered SHA. Do not solve 2C under a product slice, weaken `RFXCHANGE_BUILD_SHA`, change rollout architecture or claim 2C complete. It does not block RFx Core product development.

PR #150, **Define the Exchange interaction architecture**, established the cross-cutting documentation authority. PR #158, the documentation-only Slice 4.1 authority, is merged at `87fb29ef3b442410deecf61a470bc94c9c013c60`. It leaves `ISS-001`, `ISS-002` and `ISS-003` Not Started and authorizes no runtime by itself.

The current tracker state is:

- **438 total · 152 Done · 286 Not Started**;
- Activation: **43/43**;
- Network: **38/38**;
- Wave 4 RFx Core: **0/41**; and
- B6b: **Not Started / intentionally pending**.

The single active gate is the no-Feature-ID cross-cutting authority in `docs/slices/EXCHANGE_SHELL_TRUTHFULNESS_EXECUTION_AUTHORITY.md`, based on merged `main` at `87fb29ef3b442410deecf61a470bc94c9c013c60` and implemented on `fix/exchange-shell-truthfulness-performance`.

That gate is limited to:

- one typed participant-lens registry in the exact permanent order;
- Opportunities/RFx visible but explicitly unavailable, with no href, synthetic route, fabricated data or current-page state;
- Resources, Intelligence and Referrals routed to their existing authorized runtimes;
- Network retained as the Intelligence organization-network view/domain concept;
- Account and Quick Start moved to a separate keyboard-accessible utility control;
- Administration resolved lazily through existing server authority and failed closed without blocking the shell;
- one persistent participant shell across ordinary client-side lens changes;
- route-specific loading scoped below that shell;
- removal of the page-wide `Preparing this page` takeover during ordinary authenticated navigation;
- preservation of current safe map/query context through the stable `/geography/canvas` Intelligence seam; and
- removal of avoidable blocking/duplicate work without weakening authorization.

The gate does not implement Slice 4.1 runtime, Slice 4.2, RFx publication/discovery, Intelligence datasets, Location/Site Intelligence, B6c, commercial enrollment, Dark Appearance, Presentation Mode, sound, haptics, Firebase App Hosting or build-identity changes. Stop after the gate is merged, reconciled and post-merge validated.

The merged Slice 4.1 documentation authority establishes, for a later separately authorized runtime pass:

- one organization-owned RFx aggregate;
- one bounded `draft` lifecycle state;
- expected-version, immutable-event, idempotent-command and organization-audit seams;
- a deterministic governed AMACS 0.5.0 request-family snapshot; and
- safe blank-source draft creation in a bounded Operational Workspace entry.

Do not begin that runtime while the shell gate is active or immediately after it merges without a new explicit instruction.

## AMACS and interpretation boundary

AMACS 0.5.0 is merged in the independent `AccelAnalysis/amacs` repository at `da7879f2609271b067ae6d02875e9388a02c4fe5`. RFxchange reconciliation is complete via PR #123, including deterministic generated projections, runtime contracts, migration evidence and participant-surface isolation.

The AI/AMACS Interpretation Foundation is complete via PR #124. The governing rule is:

> AI or other assistance interprets and proposes. AMACS defines and constrains. The participant confirms. RFxchange stores and operates the authoritative market record.

- Provider/model types remain behind application/infrastructure boundaries.
- AMACS identifiers validate against the pinned release projection; model memory cannot invent authority.
- Interpretation records/candidates are non-authoritative.
- Accepted suggestions require a separate current-authority domain command.
- Rejected or unresolved suggestions cannot influence matching, publication or public market observations.
- Manual AMACS browse/search remains available for authorized consumers.
- Slice 4.1 uses deterministic manual request-family selection and does not need an AI call.

## Required reading before a slice or gate

Before implementing any slice or Brand Gate:

1. Read this file.
2. Read `docs/context/README.md`.
3. Read `docs/context/PRODUCT_PRINCIPLES.md`.
4. Read `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md` for participant-facing work.
5. Read the canonical tracker and dependency map.
6. Read the applicable wave roadmap.
7. Read the specific slice or Brand Gate authority. For the current shell gate, read `docs/slices/EXCHANGE_SHELL_TRUTHFULNESS_EXECUTION_AUTHORITY.md` and the merged `docs/slices/SLICE_4_1_EXECUTION_AUTHORITY.md` only to preserve its stop boundary.
8. Read the context/RFx documents listed under the authority's **Must read** or governing section.
9. Inspect existing production abstractions before designing new ones.
10. If work creates or materially changes user-facing UI, read `docs/brand/README.md`, applicable brand guides, `docs/design/README.md` and `docs/design/RFxchange_DESIGN_SYSTEM.md`.
11. If work changes map/geography UI, also read `docs/brand/MAP_AND_DATA_VISUAL_GRAMMAR.md` and `docs/design/MAP_VISUAL_SYSTEM.md`.
12. If work creates customer-facing copy or communications, read `docs/brand/CONTENT_AND_MESSAGING_SYSTEM.md`.
13. If work introduces motion, sound, haptics, appearance or Presentation Mode, read the corresponding authority and confirm the capability is explicitly authorized.
14. If work consumes AMACS or AI interpretation, read the current AMACS integration/reconciliation contracts and keep AMACS semantics separate from provider/model implementation provenance.

## Brand requirement classes

- **Cross-cutting standards** may govern authorized surfaces without claiming a new domain feature: naming, semantic color, typography, messaging, evidence integrity, loading/empty/error states, accessibility, reduced motion, state preservation and performance.
- **Domain-dependent expressions** may be designed but cannot appear as live product state before authoritative domains exist: opportunity beacons, service fields, referral/team/RFx paths, credibility seals and outcome paths.
- **Net-new capabilities** require explicit scope, persistence, permissions, tests and tracker treatment where appropriate: Dark Appearance, appearance preferences, Presentation Mode, sonic preferences/runtime, haptics and comparable settings or projections.

## Engineering invariants

- Server-side authorization is authoritative. Client state never grants access.
- Keep provider subject/Firebase UID, RFxchange user identity, organization membership and administrative authority conceptually separate.
- An authenticated user does not personally own an organization RFx. The issuing organization owns it; actor user/membership are audit evidence.
- Reuse the canonical organization-operation authorization boundary for consequential organization-scoped commands.
- Preserve immutable/auditable history for sensitive administrative, access, claim, credibility, policy and consequential domain decisions.
- Expected-version checks and aggregate/evidence writes occur atomically where the domain requires optimistic concurrency.
- Stable command IDs and fingerprints support exact replay; a command ID reused for different intent conflicts.
- Direct browser Firestore access remains default-denied; trusted server handlers project only permitted data.
- Do not expose sensitive evidence or private organization data through public projections.
- Prefer explicit state machines and typed domain contracts over UI-only state.
- Provider adapters remain behind domain/application boundaries; do not leak Firebase, Microsoft, payment-provider or AI-provider implementation details into domain models.
- An AI interpretation is non-authoritative. Accepted suggestions require a separate server-authorized domain write; rejected/unresolved suggestions cannot affect authoritative matching or public projection.
- Do not weaken existing security rules or architecture tests to make new work pass.
- Motion, sound and visual success states consume authoritative application/domain facts; button clicks and optimistic UI are not authority.
- Do not fabricate organizations, opportunities, maps, statistics, outcomes, testimonials, provider availability or live network activity.
- A participant-shell convenience projection must not repeat session verification or organization hydration when already-authorized page data can supply the same non-authorizing display context.
- Optional Administration resolution must never block the participant shell and must fail closed; direct administrative routes remain independently authorized.
- Client-side navigation, URL state and persistent shell context never grant organization, lens, record or administrative authority.

## Runtime and validation

Repository/CI development runtime is Node.js **24.18.x** (`package.json` requires `>=24.18.0 <25`). Firebase Functions deploy on **Node.js 22** as pinned in `firebase.json`; the Functions workspace remains testable in the repository toolchain.

Before claiming a slice or gate complete, run slice/gate-specific checks plus repository validation. The canonical full local gate is:

```bash
npm run check
```

For the active shell gate, configured-browser acceptance must also prove one mounted shell across `Intelligence → Resources → Referrals → Intelligence → Account → Quick Start`, no page-wide `Preparing this page` takeover, immediate pending feedback, no second document-navigation entry, no activation/geography replay, route-scoped loading, optional-delay resilience, no artificial hold, safe map/query restoration, keyboard/mobile/five-locale accessibility and clean console/unhandled-rejection behavior. Record representative before/after timings and relevant `Server-Timing` spans without turning one local run into a brittle production-network promise.

Run focused product/architecture/dependency/internationalization/emulator checks first where applicable. Production CI must pass on the exact reviewed PR head and again on merged `main`. Brand acceptance supplements and never replaces domain, security, lifecycle, geography, emulator or configured-browser acceptance.

## Tracker discipline

- Do not delete, rename or reorder approved Feature IDs casually.
- Mark `[x]` only after the feature's documented acceptance check passes and implementation/validation evidence exists.
- Update evidence in the same PR as implementation whenever practical.
- Documentation-only planning/reconciliation must not change progress totals or completion statuses.
- A visual simulation, architecture document or tutorial never completes the corresponding live domain Feature ID.
- `ISS-001`, `ISS-002` and `ISS-003` remain Not Started until their runtime acceptance evidence is merged.
- Showing an unavailable Opportunities/RFx lens does not make it available and does not complete an RFx Feature ID.
- The shell truthfulness/performance gate changes no Feature ID, tracker total, Wave completion count, Brand Gate status or B6b status.

## Design, brand and visual references

- Treat `docs/brand/` as the approved target experience after B0 and `docs/design/` as the currently implemented/converged baseline.
- Do not reconstruct design rules from screenshots when brand/design systems address the topic.
- Read `docs/reference/prototypes/README.md` before using prototype code.
- Read `docs/reference/screenshots/README.md` before treating screenshots as visual requirements.
- Preserve anchored geographic markers, authoritative locality geometry, strong selected-locality treatment, muted surrounding context, restrained glassmorphism, reduced container/border chrome and continuous map-first workspace where applicable.
- Normal markers/nodes are not outlined by default; use fill, glyph, shadow and separate hover/selection emphasis while keeping the geographic anchor fixed.
- Domain-dependent objects remain absent or truthfully unavailable until their source domains exist.
- Never copy prototype architecture wholesale merely because it visually demonstrates desired behavior.

## Completion report

At the end of implementation or reconciliation work, report:

- starting merged `main` SHA;
- PR #158 final disposition and merge SHA when relevant;
- active gate branch, PR number, reviewed final head, merge SHA, exact-head CI and post-merge CI;
- final primary-lens order/availability and Account utility contents;
- persistent-shell architecture, loading-boundary result and actual latency causes/corrections;
- before/after transition and `Server-Timing` evidence;
- exact files changed;
- Feature IDs or Brand Gate/cross-cutting gate addressed;
- dependency result;
- automated, emulator, localization, accessibility and configured-browser evidence;
- tracker changes made or intentionally not made;
- Stabilization 2C and B6b status; and
- explicit confirmation that Slice 4.1 runtime, later slices/gates and unauthorized runtime work were not begun.
