# The RFxchange Brand Experience System

**Status: CANONICAL TARGET BRAND AUTHORITY — B0 COMPLETE; B1 IMPLEMENTED IN PR #109 PENDING FINAL CI/MERGE; B2 NOT YET AUTHORIZED**

This directory defines the approved target brand experience for **The RFxchange** and the sequential gates that converge it with production behavior.

The governing product idea is:

> **A local market becoming visible and useful around every participating organization.**

The platform should feel like a living market, not a conventional dashboard. Brand is expressed through the complete experience: public positioning, photography, geography, map objects, typography, color meaning, motion, optional sound, messaging, empty states, credibility, accessibility, responsiveness, performance, authorization and recovery.

## Current baseline

Brand Gate B1 branches from reconciled `main` after Wave 3 Slice 3.1:

- baseline SHA: `c059e69e956f1a18983c526a60d87bbfd3930a8b`;
- tracker: **438 total · 121 Done · 317 Not Started**;
- Activation: **43/43**;
- Network: **7/38**;
- `COMMS-003`, `COMMS-004` and `COMMS-005` are complete;
- Brand Gate B0 is complete;
- Slice 3.2 remains unstarted and blocked behind B1, B2, B3 and B6a;
- Brand Gate B1 is implemented in PR #109 but is not complete until final CI passes and the PR merges.

See [`BRAND_GATE_B0_RECONCILIATION.md`](BRAND_GATE_B0_RECONCILIATION.md) for the governing authority order and [`BRAND_GATE_B1_SEMANTIC_FOUNDATION.md`](BRAND_GATE_B1_SEMANTIC_FOUNDATION.md) for the semantic token, compatibility, drift-control and B2 handoff contract.

## Product architecture

- **Product brand:** The RFxchange
- **Category descriptor:** A Local Business Growth Network
- **Parent endorsement:** By Accel Analysis
- **Core promise:** Be found. Find opportunity. Build the connection.
- **Experience framework:** Visible. Connected. Actionable.

## Authority model

After security, domain, tracker, dependency and authorized-slice/gate authority:

- `docs/brand/` defines the approved **target brand experience** and acceptance;
- `docs/design/` defines the **currently implemented/converged design baseline**;
- existing runtime is implementation evidence and compatibility context.

A target brand rule does not authorize production work by itself. Each surface is migrated only through an explicitly authorized Brand Gate or owning product slice.

## Requirement classes

### Cross-cutting standards

These may govern authorized work without claiming a new domain feature:

- naming and parent endorsement;
- semantic color and typography;
- truthful messaging and evidence integrity;
- loading, empty, success, error, permission, expired and recovery states;
- accessibility, reduced motion, responsive behavior, state preservation and performance.

### Domain-dependent expressions

These may be designed as semantic contracts but cannot appear as live state until their owning domains exist:

- opportunity beacons;
- provider/service fields;
- referral, team and RFx paths;
- credibility seals;
- outcome paths and outcome-green transitions.

### Net-new product capabilities

These require explicit product scope, persistence, permissions, testing and tracker governance where appropriate:

- Intelligence Dark;
- Presentation Mode;
- production sound preferences/runtime;
- haptics;
- comparable new modes, settings or safe projections.

## Files

| File | Authority |
| --- | --- |
| `RFXCHANGE_BRAND_EXPERIENCE_SYSTEM.md` | Brand architecture, positioning, visual identity, product behavior, experience principles and north-star journey |
| `MAP_AND_DATA_VISUAL_GRAMMAR.md` | Organization nodes, opportunity beacons, service fields, connection paths, outcomes, credibility seals, locality fields, heatmaps and map behavior |
| `MOTION_SYSTEM.md` | Timing, easing, signature motions, interruption behavior, reduced-motion behavior and motion acceptance |
| `SONIC_EXPERIENCE_SYSTEM.md` | Optional sonic identity, event contracts, controls, accessibility, production restrictions and acceptance |
| `CONTENT_AND_MESSAGING_SYSTEM.md` | Voice, terminology, product copy, status language, empty states, error recovery, claims discipline and evidence language |
| `VIEWING_MODES.md` | Exchange Light, future Intelligence Dark, Presentation Mode, High Contrast, sensory settings and mode boundaries |
| `BRAND_EXPERIENCE_ACCEPTANCE_MATRIX.md` | Required brand, state, accessibility, performance, provenance and domain-boundary acceptance for participant surfaces |
| `BRAND_IMPLEMENTATION_ROADMAP.md` | Sequential Brand Gates, domain dependencies, code gates and release checkpoints |
| `BRAND_GATE_B0_RECONCILIATION.md` | Completed Wave 2 reconciliation, authority order, Wave 3/4 integration and implementation holds |
| `BRAND_GATE_B1_SEMANTIC_FOUNDATION.md` | Exchange Light semantic tokens, accessibility, compatibility, object semantics, drift controls and B2 handoff |
| `CODEX_WAVE_2_BRAND_AUTHORITY_ADDENDUM.md` | Historical Wave 2 constraint record applied to Slices 2.9–2.12 |

## Current implementation boundary

B0 is merged. B1 is the only active Brand Gate until PR #109 passes final CI and merges.

B1 may add semantic foundations but may not:

- consolidate or restyle shared components reserved for B2;
- restyle Mapbox or alter marker/camera authority reserved for B3;
- implement Intelligence Dark, Presentation Mode, sound or haptics;
- display domain-dependent objects before their source domains exist;
- change tracker counts, dependencies or Feature-ID completion;
- fabricate organizations, opportunities, maps, statistics, outcomes, testimonials, provider availability or live activity.

After B1 merges, B2 becomes ready for explicit authorization. B2 must branch from merged B1 `main`; it must not be stacked on the B1 branch.

## Wave integration

### Wave 3

- Slice 3.1 consumed the Content and Messaging System and is complete.
- Complete B1, B2, B3 and B6a before Slice 3.2 to avoid rebuilding the first live Network workspace.
- Referral paths become legitimate with Slice 3.5.
- Provider service fields become legitimate with Slice 3.7.

### Wave 4

Wave 4 remains planning-only until RFx Core convergence settles state, permissions, versioning, publication, pursuit, submission, events, dependency corrections and final slice briefs.

- opportunity beacons require authoritative RFx publication;
- potential-match treatment requires live opportunity discovery;
- teammate/resource paths require real gap and relationship records;
- RFx traces require canonical RFx events;
- submission confirmation requires authoritative hosted receipt or truthful external handoff;
- outcome paths and credibility seals remain later-domain expressions.

## Source relationships

This package extends rather than discards:

- `docs/design/RFxchange_DESIGN_SYSTEM.md`;
- `docs/design/MAP_VISUAL_SYSTEM.md`;
- `docs/architecture/DESIGN_CONVERGENCE_GATE.md`;
- `docs/context/BRAND_AND_UX.md`;
- `docs/context/PRODUCT_PRINCIPLES.md`;
- `docs/context/USER_JOURNEY.md`;
- `docs/context/MAP_AND_GEOGRAPHY.md`;
- `docs/context/RFX_TRANSACTION_CYCLE.md`;
- `docs/context/ORGANIZATION_MODEL.md`;
- `docs/context/ACQUISITION_AND_RETENTION.md`;
- the canonical tracker, dependency map and applicable slice briefs.

Security, authority, privacy, lifecycle, geography, RFx, referral, provider, credibility, commercial and administrative domain rules remain authoritative in their own contracts. Brand acceptance supplements and never weakens them.
