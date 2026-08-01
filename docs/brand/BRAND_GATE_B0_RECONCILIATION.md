# Brand Gate B0 — Wave 2 Reconciliation

**Status: RECONCILIATION IN PROGRESS — DOCUMENTATION ONLY**

## Purpose

Reconcile the Brand Experience System against the completed Wave 2 implementation before any production brand convergence begins.

This gate is documentation and authority work only. It does not modify production application code, CSS, Mapbox styling, markers, motion, sound, user settings, tracker totals, dependency edges, or Feature-ID completion.

## Reconciliation baseline

- Final Wave 2 `main`: `097b574ccce8865d4127cfe381fb0bd6199de0a5`
- Wave 2 exit reconciliation: PR #105
- Tracker: **438 total · 118 Done · 320 Not Started**
- Activation: **43/43**
- Earliest dependency-eligible Wave 3 candidate: Slice 3.1 — `COMMS-003`, `COMMS-004`, `COMMS-005`

## B0 decisions

### Authority order

Use this order when a participant-facing implementation decision is made:

1. Current explicit task and authorized slice/gate.
2. Security, privacy, authorization, lifecycle, geography, domain, tracker, and dependency authorities.
3. `docs/brand/` for target brand architecture, semantic meaning, messaging, motion, sensory, map/data grammar, viewing modes, and brand acceptance.
4. `docs/design/` for the currently implemented component, layout, map, and presentation baseline.
5. Existing runtime as implementation evidence and compatibility context.

`docs/brand/` defines the approved target experience. `docs/design/` remains the canonical implemented baseline until each authorized Brand Gate converges the affected surface.

### Requirement classification

Brand requirements are governed in three classes:

- **Cross-cutting standards:** naming, semantic color, typography, messaging, evidence integrity, loading/empty/error states, accessibility, reduced motion, state preservation, and performance.
- **Domain-dependent expressions:** opportunity beacons, service fields, referral/team/RFx paths, credibility seals, and outcome paths. These may not appear as live product state before their owning domains exist.
- **Net-new product capabilities:** Intelligence Dark, Presentation Mode, sonic preferences/runtime, haptics, and any new persistence or permission model. These require explicit scope and tracker governance before implementation.

### Code ownership boundaries

- Shared semantic tokens and primitives belong to the existing design-system/component architecture.
- Map object rendering consumes authoritative geography and domain projections; visual code never grants authority.
- Motion and sound consume confirmed application/domain events; button clicks and optimistic UI are not event authority.
- Content and message templates remain versioned and truthful to current capability and provenance.
- Domain-specific visuals are implemented with the owning domain slice or a later explicitly authorized brand convergence gate, never as fabricated placeholders.

### Testing boundaries

Every implementation gate must preserve repository validation and applicable configured-browser acceptance. Brand acceptance supplements and never replaces domain/security acceptance.

Reusable tests should cover:

- product naming and parent endorsement;
- semantic color and mode roles;
- unsupported-claim prohibitions;
- synthetic/live isolation;
- marker focal visibility and map/list parity;
- reduced-motion behavior;
- domain-dependent visual gating;
- membership/credibility/outcome separation;
- asset rights and provenance;
- responsive and accessible loading, empty, success, error, permission, expired, and recovery states.

## Wave 3 integration

- Slice 3.1 may follow B0 because it is primarily the reliable communications substrate. Its customer-facing templates must consume the Content and Messaging System.
- Before Slice 3.2 begins, Brand Gates B1, B2, B3, and B6a should establish semantic tokens, shared primitives, cartographic convergence, and the existing-domain daily-workspace foundation to prevent rework in the first live Network workspace.
- Slices 3.3–3.8 consume the applicable brand system without widening their Feature-ID scope.

## Wave 4 integration

The Wave 4 planning lanes remain noncanonical until RFx Core convergence settles state, permissions, versioning, publication, pursuit, submission, events, dependency corrections, and final slice briefs.

Brand expressions follow domain availability:

- opportunity beacons after authoritative RFx publication;
- potential-match treatment after live opportunity discovery;
- teammate/resource paths after real gap and relationship records;
- RFx lifecycle traces after canonical RFx events;
- green outcome paths only after an appropriate confirmed outcome;
- credibility seals only after the Credibility domain.

## Daily workspace staging

Brand Gate B6 is staged to avoid fabricating later-wave objects:

- **B6a — Existing workspace foundation:** organization home, unified search/filter placement, deterministic map state, responsive drawers/sheets, and complete state handling using existing domains only.
- **B6b — Network lenses:** organization discovery, enriched profiles, referrals, provider territories, routing, and real Network paths after Wave 3 domains exist.
- **B6c — RFx lens:** opportunity beacons, opportunity home, pursuit/gap actions, and RFx paths after Wave 4 domains exist.

## Explicit holds

This reconciliation does not authorize:

- production brand implementation;
- Wave 3 Slice 3.1 implementation;
- Wave 4 implementation;
- Intelligence Dark;
- Presentation Mode;
- sound or haptic runtime;
- credibility or outcome visuals before their domains;
- tracker or dependency changes.

## Exit condition

B0 is complete when:

- the brand branch contains final Wave 2 `main`;
- stale Wave 2 hold language is retired or marked historical;
- design and brand authority order is explicit;
- Wave 3 briefs reference the applicable brand authority;
- B6 staging and net-new capability governance are explicit;
- production CI passes on the reconciled PR #100 head;
- PR #100 remains documentation-only and ready for review/merge.
