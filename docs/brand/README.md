# The RFxchange Brand Experience System

**Status: CANONICAL TARGET BRAND AUTHORITY — B0 AND B1 COMPLETE; B2 IS NEXT AND READY FOR EXPLICIT AUTHORIZATION**

This directory defines the approved target brand experience for **The RFxchange** and the sequential gates that converge it with production behavior.

The governing product idea is:

> **A local market becoming visible and useful around every participating organization.**

The platform should feel like a living market, not a conventional dashboard. Brand is expressed through the complete experience: public positioning, photography, geography, map objects, typography, color meaning, motion, optional sound, messaging, empty states, credibility, accessibility, responsiveness, performance, authorization and recovery.

## Current baseline

Brand Gate B1 is complete:

- B1 implementation merged through PR #109 at `c4c18272f46ad3e3120e2dcf6405fda8a274a685`;
- production CI run **444** (`30720318973`) passed on the final implementation head;
- tracker remains **438 total · 121 Done · 317 Not Started**;
- Activation remains **43/43**;
- Network remains **7/38**;
- `COMMS-003`, `COMMS-004` and `COMMS-005` remain complete;
- Slice 3.2 remains unstarted and blocked behind B2, B3 and B6a;
- no Feature ID, tracker total or dependency edge changed in B1.

See [`BRAND_GATE_B0_RECONCILIATION.md`](BRAND_GATE_B0_RECONCILIATION.md) for the governing authority order and [`BRAND_GATE_B1_SEMANTIC_FOUNDATION.md`](BRAND_GATE_B1_SEMANTIC_FOUNDATION.md) for the completed semantic token, compatibility, drift-control and B2 handoff contract.

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
| `BRAND_GATE_B1_SEMANTIC_FOUNDATION.md` | Completed Exchange Light semantic tokens, accessibility, compatibility, object semantics, drift controls and B2 handoff |
| `CODEX_WAVE_2_BRAND_AUTHORITY_ADDENDUM.md` | Historical Wave 2 constraint record applied to Slices 2.9–2.12 |

## Current implementation boundary

B0 and B1 are merged. **B2 — Shared Component Primitives is the next gate ready for explicit authorization.**

Until B2 is explicitly authorized, do not:

- consolidate or restyle shared navigation, controls, drawers, sheets, cards, timelines, alerts, empty states, tables or statuses;
- restyle Mapbox or alter marker/camera authority reserved for B3;
- implement Intelligence Dark, Presentation Mode, sound or haptics;
- display domain-dependent objects before their source domains exist;
- change tracker counts, dependencies or Feature-ID completion;
- fabricate organizations, opportunities, maps, statistics, outcomes, testimonials, provider availability or live activity.

When authorized, B2 must branch from merged B1 `main` at or after `c4c18272f46ad3e3120e2dcf6405fda8a274a685` and consume the B1 semantic contracts. B2 has not begun in B1 or this reconciliation.

## Wave integration

### Wave 3

- Slice 3.1 consumed the Content and Messaging System and is complete.
- B1 is complete; B2, B3 and B6a remain required before Slice 3.2.
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
