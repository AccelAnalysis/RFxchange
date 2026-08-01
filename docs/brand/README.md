# The RFxchange Brand Experience System

**Status: PLANNING AUTHORITY — NO PRODUCTION UI, MAP, MOTION, SOUND, TRACKER, OR FEATURE-ID CHANGE**

This directory defines the premium brand experience for The RFxchange before production implementation begins.

The governing product idea is:

> **A local market becoming visible and useful around every participating organization.**

The platform should feel like a living market, not a conventional dashboard. Brand is expressed through the complete experience: public positioning, photography, geography, map objects, typography, color meaning, motion, sound, messaging, empty states, credibility, accessibility, responsiveness, and operational reliability.

## Product architecture

- **Product brand:** The RFxchange
- **Category descriptor:** A Local Business Growth Network
- **Parent endorsement:** By Accel Analysis
- **Core promise:** Be found. Find opportunity. Build the connection.
- **Experience framework:** Visible. Connected. Actionable.

## Files

| File | Authority |
| --- | --- |
| `RFXCHANGE_BRAND_EXPERIENCE_SYSTEM.md` | Brand architecture, positioning, visual identity, product behavior, experience principles, and north-star journey |
| `MAP_AND_DATA_VISUAL_GRAMMAR.md` | Organization nodes, opportunity beacons, service fields, connection paths, outcomes, credibility seals, locality fields, heatmaps, and map behavior |
| `MOTION_SYSTEM.md` | Timing, easing, signature motions, interruption behavior, reduced-motion behavior, and motion acceptance |
| `SONIC_EXPERIENCE_SYSTEM.md` | Sonic identity, event contracts, controls, accessibility, production restrictions, and acceptance |
| `CONTENT_AND_MESSAGING_SYSTEM.md` | Voice, terminology, product copy, status language, empty states, error recovery, claims discipline, and evidence language |
| `VIEWING_MODES.md` | Exchange Light, Intelligence Dark, Presentation Mode, high contrast, sensory settings, and mode boundaries |
| `BRAND_EXPERIENCE_ACCEPTANCE_MATRIX.md` | Required brand, state, accessibility, performance, provenance, and domain-boundary acceptance for participant surfaces |
| `BRAND_IMPLEMENTATION_ROADMAP.md` | Safe sequencing after Wave 2, domain dependencies, code gates, and release checkpoints |
| `CODEX_WAVE_2_BRAND_AUTHORITY_ADDENDUM.md` | Narrow instructions for Slices 2.9–2.12 without widening Feature-ID scope or disturbing PR #99 |

## Current implementation boundary

This package must not be interpreted as authority to modify the current production runtime while PR #99 and Wave 2 Slices 2.9–2.12 are active.

Until the complete Wave 2 exit is merged and accepted:

- do not change participant or map CSS for branding;
- do not change marker anchoring, visibility, projection, camera authority, orbit, pitch, or zoom;
- do not restyle Mapbox production layers;
- do not add themes, production sounds, haptics, or animation frameworks;
- do not recompose registration, activation, orientation, first-value, or OPEN surfaces outside their authorized slice scope;
- do not mark Feature IDs complete;
- do not change tracker counts or dependencies;
- do not fabricate organizations, opportunities, maps, statistics, outcomes, testimonials, or live activity.

The only near-term Wave 2 effect is architectural discipline: new surfaces should use shared shells, semantic concepts, measured language, and reusable seams so the post-Wave-2 Brand Experience Convergence Gate can implement the system without another product rewrite.

## Source relationships

This package extends rather than discards the existing canonical authorities:

- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- `docs/design/MAP_VISUAL_SYSTEM.md`
- `docs/architecture/DESIGN_CONVERGENCE_GATE.md`
- `docs/context/BRAND_AND_UX.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/context/USER_JOURNEY.md`
- `docs/context/MAP_AND_GEOGRAPHY.md`
- `docs/context/RFX_TRANSACTION_CYCLE.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/ACQUISITION_AND_RETENTION.md`
- `docs/slices/WAVE_2_ROADMAP.md`

Where this package introduces a more specific experience rule, it is the intended future brand authority after an approved convergence implementation. Security, authority, privacy, lifecycle, geography, RFx, referral, provider, credibility, and commercial domain rules remain authoritative in their own contracts.
