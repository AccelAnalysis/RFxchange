# RFxchange Codex Operating Instructions

This repository implements **The RFxchange**, an organization-centered, map-based business growth network. Treat these instructions as the repository operating manual for planning and implementation work.

## Product model

- The **organization** is the primary market entity. Individual users authenticate separately but act through one or more organizations with explicit membership, role and permission state.
- The RFxchange is RFx-centered and organization-centered. Opportunities/RFx is the primary transaction lens and principal market-action proposition; Resources, Intelligence and Referrals are supporting lenses over the same market.
- The permanent authenticated participant-lens order is exactly `Opportunities/RFx | Resources | Intelligence | Referrals`. Availability governs action, not whether a governed permanent lens exists in the information architecture.
- Opportunities/RFx remains visibly first. Availability requires a separately authorized real participant runtime; current merged Slice 4.5 supplies real permitted opportunity discovery at `/opportunities`. Do not create a placeholder route, fabricated opportunity/beacon/match/response or simulated workflow to broaden it.
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

Development reporting adds the same truthfulness distinction between **implemented**, **merged**, **live**, and **Verified**. None of those states may be implied by another.

## Source authority

Use these sources together rather than treating one file as universally authoritative:

1. **Current explicit task instructions** define the work requested in the current task.
2. `docs/program/FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md` governs Four-Lens completion semantics and makes Independent Acceptance optional assurance. `docs/program/FOUR_LENS_PROGRAM_AUTHORITY.md` and `docs/program/BUILD_RELEASE_VERIFY_GOVERNANCE_AMENDMENT.md` remain governing provenance for parallel delivery and risk-based release mechanics where they do not conflict with the Completion Governance Amendment. Their machine ledgers and delivery matrix carry current packet/experience state but never expand product or domain scope.
3. `docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md` is the live Feature-ID completion authority. A checked item requires implementation plus the applicable objective tests/evidence, dependencies/ownership satisfaction, durable completion record, and no known material defect under the current Four-Lens Completion Governance Amendment. Independent Acceptance is not required merely to check a completed item.
4. `docs/tracking/RFxchange_DEPENDENCY_MAP.md` is the live sequencing/dependency authority. Reviewed corrections there supersede seeded spreadsheet dependencies for scheduling.
5. The applicable `docs/slices/` execution authority defines the approved implementation boundary. A brief cannot mark a feature complete or waive documented acceptance intent.
6. `docs/context/` contains normalized cross-cutting product rules. `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md`, originally merged through PR #150 and reconciled by the bounded shell gate, governs participant-facing lens hierarchy, structural/capability/state/continuity truthfulness, spatial continuity, workspace boundaries and truthful cross-lens behavior.
7. `docs/rfx/` contains the converged RFx Core/AMACS/workspace/acceptance package.
8. `docs/brand/` defines approved target brand architecture, semantic meaning, messaging, map/data grammar, motion, sensory rules, appearance/presentation authority and brand acceptance after Brand Gate B0.
9. `docs/design/` defines the currently implemented visual/UI/presentation baseline. For user-facing UI read `docs/design/README.md` and `docs/design/RFxchange_DESIGN_SYSTEM.md`; map/geography work also requires `docs/design/MAP_VISUAL_SYSTEM.md`.
10. Existing production architecture and merged architecture decisions govern implementation mechanics unless the current task intentionally changes them.
11. `docs/reference/` contains provenance and visual/prototype references. Reference artifacts demonstrate product intent; they are not automatically production architecture.

Authority order for participant-facing work is:

1. current task and authorized slice/gate;
2. security, privacy, authorization, lifecycle, geography, domain, tracker and dependency authorities;
3. Four-Lens Completion Governance Amendment plus applicable parallel-delivery/release authority;
4. Exchange Interaction Architecture and applicable RFx Core authority;
5. `docs/brand/` for approved target experience;
6. `docs/design/` for currently converged implementation baseline; and
7. existing runtime as implementation evidence and compatibility context.

If sources appear to conflict, do not silently choose the easiest interpretation. Preserve the stricter security/privacy requirement and report the conflict before widening scope. A visual or brand rule never grants authority or expands slice scope.

## Build sequencing

- Use the **Four-Lens parallel lane model** only for a declared work packet in `governance/four-lens-workstreams.json`. Work outside that authority retains the single-active-slice or single-active-gate default unless the current task explicitly authorizes otherwise.
- Parallel work requires explicit lane ownership, exact base SHA, immutable requirement IDs, dependencies, owned/non-owned paths, completion/evidence obligations and stop boundary. A branch dependent on an unmerged candidate must name its exact SHA.
- The governing Four-Lens completion progression is **Build → Test → Integrate → Release → Improve** under `docs/program/FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md`. Development may proceed in parallel; merge order remains dependency-aware; production release is risk-based; independent assurance is optional unless a separate later authority explicitly requires it for a named action.
- Reconcile every candidate from current merged `main` and obtain fresh exact-head evidence after dependency changes.
- Independent review is not a universal completion, tracker, merge, release or development prerequisite. A bounded candidate may be completed and merged as `Implemented — Not Verified` after authorized scope/dependency reconciliation, applicable exact-head CI/evidence, durable completion recording, and Control Room confirmation that no known material finding makes the claimed behavior unsafe or materially false.
- Builders may report bounded work implemented/complete when objective delivery evidence supports that statement. Only an actual independent assurance event may be described as `Verified`; builders must not fabricate or self-label independent verification.
- Merge and deployment never imply `Verified`.
- Pre-amendment packet language requiring Independent Acceptance is preserved as historical provenance but is superseded as a Four-Lens completion, tracker, merge, release or later-work gate by `FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md`, unless a later explicit current authority specifically reactivates independent assurance for a named action.
- Do not implement future Feature IDs merely because adjacent code makes them convenient.
- Incidental satisfaction of another Feature ID must be evaluated against that feature's own completion check before tracker status changes.
- Recalculate the next slice from merged `main`, not from assumptions made on an older branch.
- Documentation-only planning and reconciliation do not authorize production implementation.
- No deployment/release blocker becomes a product-domain dependency unless a current canonical dependency authority establishes that edge.
- Shared participant behavior remains Lane 01-owned. Domain lanes submit a Shared Contract Request instead of creating a private divergent implementation.

## Release sequencing

Control Room continues to use the risk classifications in `docs/program/BUILD_RELEASE_VERIFY_GOVERNANCE_AMENDMENT.md` where they do not conflict with the superseding Four-Lens Completion Governance Amendment:

- **Standard** — bounded presentation/discoverability/non-authorizing/additive behavior: post-merge CI plus applicable runtime/browser/emulator evidence and canonical rollback path.
- **Elevated** — consequential participant/domain workflow that preserves established authority: Standard requirements plus focused negative authorization/tenant/security evidence, explicit Control Room release authorization, rollback/containment and post-release observation.
- **Critical** — authentication/authorization, tenant isolation, privacy disclosure, policy/legal acceptance, payments, destructive/irreversible migration/write, secrets/credentials or comparable material-risk changes: Elevated requirements plus direct critical-boundary negative evidence, containment/rollback planning, and explicit participant/product-owner release authority.

Independent reviewer participation is optional for Four-Lens release decisions, so no reviewer-capacity waiver is required merely because a reviewer is unavailable. Optional assurance never substitutes for required safety evidence, and the absence of mandatory assurance never permits a known material security/privacy/integrity defect to ship. A known material critical defect remains non-releasable.

Production deployment may truthfully be reported as `Live in production — not independently verified` when deployment is proven and no optional independent assurance event has occurred. That assurance state is not delivery debt by itself.

## Current wave, stabilization and program boundary

Wave 2 is complete with **43/43 Activation** features.

Wave 3 Slices 3.1 through 3.8 are complete via PRs #107, #120, #126, #128, #130, #132, #137 and #139. Wave 3 Network is **38/38**, with integrated configured-browser and zero-residual evidence in `docs/architecture/WAVE_3_CLOSEOUT.md`.

Brand Gates B0 through B6a are complete. B6b remains **Not Started / intentionally pending** because no bounded convergence gate is currently required. Real RFx publication now makes B6c eligible, but B6c remains Not Started and requires separate authority. Later appearance, sensory, presentation, credibility and outcome gates require separate authority.

All independently executable work under Post-Wave 3 Stabilizations 1–7 is complete. **Stabilization 2C remains incomplete and isolated to release engineering.** The Firebase App Hosting backend `rfxchange`, project/repository connection, region `us-east4`, live branch `main`, root `/`, retained Web App and reserved App Hosting URL exist. The remaining blocker is trustworthy build-time source-SHA binding and an accepted same-SHA live rollout proving source SHA → `RFXCHANGE_BUILD_SHA`/build identity → rendered SHA. Do not solve 2C under a product slice, weaken `RFXCHANGE_BUILD_SHA`, change rollout architecture or claim 2C complete. It does not block RFx Core product development or otherwise-authorized production releases; source/build/rendered-SHA claims remain limited to evidence actually available.

PR #150 established the Exchange interaction architecture. PR #160 merged the post-PR-#159 participant convergence implementation; the Four-Lens Shared Experience backlog preserves its implementation evidence, final-head procedural failure and unresolved requirements without rewriting history. Slices 4.1–4.5 then implemented the first 18 RFx Core Feature IDs.

Do not copy current tracker totals, active packet SHAs or lane state into this long-lived operating manual. Read `docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md` for Feature-ID arithmetic and `docs/program/PARALLEL_DELIVERY_MATRIX.md` plus `governance/four-lens-workstreams.json` for the current Four-Lens program state.

The Exchange shell truthfulness/performance gate and post-PR-#159 convergence are historical merged foundations. Current volatile lane, packet, candidate, merge/release and experience status lives only in the current program artifacts/GitHub state.

The permanent participant order is implemented as `Opportunities/RFx | Resources | Intelligence | Referrals`; available behavior consumes server-authorized runtimes. Network remains an Intelligence view/domain concept, Account and Quick Start remain utilities, and navigation context never grants authority.

Slices 4.1–4.5 retain their retroactive independent assurance ledger as historical/optional assurance evidence; optional assurance is not a completion prerequisite. Any known material findings from that ledger still require correction, containment, truthful unavailability or explicit current disposition on their substance. Slice 4.6 PR #171's preserved pre-amendment Independent Acceptance stop boundary remains historical provenance but no longer gates Four-Lens completion, merge, release or later work under the Completion Governance Amendment. Slice 4.7 eligibility must be recalculated from its actual current dependencies and explicitly authorized rather than from missing Independent Acceptance alone.

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
6. For Four-Lens work, read `docs/program/FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md`, `docs/program/FOUR_LENS_PROGRAM_AUTHORITY.md`, `docs/program/BUILD_RELEASE_VERIFY_GOVERNANCE_AMENDMENT.md`, `docs/program/PARALLEL_DELIVERY_MATRIX.md`, `docs/program/CHAT_LANE_CHARTERS.md`, `governance/four-lens-requirements.json` and the exact current work packet.
7. Read the applicable wave/lens roadmap.
8. Read the specific slice, lens or Brand Gate authority.
9. Read the context/RFx documents listed under the authority's **Must read** or governing section.
10. Inspect existing production abstractions before designing new ones.
11. If work creates or materially changes user-facing UI, read `docs/brand/README.md`, applicable brand guides, `docs/design/README.md` and `docs/design/RFxchange_DESIGN_SYSTEM.md`.
12. If work changes map/geography UI, also read `docs/brand/MAP_AND_DATA_VISUAL_GRAMMAR.md` and `docs/design/MAP_VISUAL_SYSTEM.md`.
13. If work creates customer-facing copy or communications, read `docs/brand/CONTENT_AND_MESSAGING_SYSTEM.md`.
14. If work introduces motion, sound, haptics, appearance or Presentation Mode, read the corresponding authority and confirm the capability is explicitly authorized.
15. If work consumes AMACS or AI interpretation, read the current AMACS integration/reconciliation contracts and keep AMACS semantics separate from provider/model implementation provenance.

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

For Four-Lens packets, use the evidence types declared by each immutable requirement and exact work packet. Cross-lens Shared or Integration candidates must exercise supported multi-lens journeys, exact server revalidation, desktop/mobile, keyboard/accessibility, five locales, clean console/unhandled-rejection behavior and applicable timing evidence without turning a controlled run into a production-network promise.

Run focused product/architecture/dependency/internationalization/emulator checks first where applicable. Production CI must pass on the exact candidate head before ordinary merge and again on merged `main`. Independent review is required only to truthfully claim optional `Verified` assurance, or where a separate current legal, contractual, regulatory or security authority explicitly requires it; it is not a universal Four-Lens completion, tracker, merge or release gate. Brand acceptance supplements and never replaces domain, security, lifecycle, geography, emulator or configured-browser evidence.

## Tracker discipline

- Do not delete, rename or reorder approved Feature IDs casually.
- Mark `[x]` only after the feature's documented implementation/completion check passes and the required objective validation evidence exists.
- Under `FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md`, `Implemented — Not Verified` may be a terminal completion state and may support a checked tracker item when the completion rule is satisfied. Lane 06 assurance is optional; `Verified` remains an additional independent-assurance marker rather than the sole completion state.
- Update evidence in the same PR as implementation whenever practical.
- Documentation-only planning/reconciliation must not change progress totals or completion statuses.
- A visual simulation, architecture document or tutorial never completes the corresponding live domain Feature ID.
- Existing tracker completion for Slices 4.1–4.5 is preserved; their retroactive assurance records are optional assurance history rather than mandatory verification debt. Material findings still require explicit correction/disposition analysis on their substance.
- Showing or releasing a lens/route does not itself complete an RFx or lens-experience requirement.
- Merge/release does not change the optional `Verified` assurance numerator or Feature-ID tracker by itself; tracker progression follows the completion rule and durable evidence.

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

At the end of implementation, reconciliation or release work, report:

- starting merged `main` SHA;
- relevant authority PR disposition and merge SHA;
- packet branch, PR number, final candidate head, merge SHA, exact-head CI and post-merge CI;
- merge state, production release state and optional independent-assurance state separately when assurance was requested or performed;
- release risk class and release authorization/evidence when production deployment occurs;
- final primary-lens order/availability and Account utility contents where applicable;
- persistent-shell architecture, loading-boundary result and actual latency causes/corrections where applicable;
- before/after transition and `Server-Timing` evidence where applicable;
- exact files changed;
- Feature IDs or Brand Gate/cross-cutting gate addressed;
- dependency result;
- automated, emulator, localization, accessibility and configured-browser evidence;
- tracker changes made or intentionally not made;
- Stabilization 2C and B6b status; and
- explicit confirmation that dependency-ineligible or otherwise unauthorized runtime work was not begun.

For Four-Lens program packets, also report the work-packet ID, lane, exact base/candidate SHA, requirement dispositions, optional assurance state (if any), material findings/correction debt, Shared Contract Requests, denominator effect, and whether any claimed independent assurance was actually independent. Do not create or maintain verification debt solely because Lane 06 did not act.
