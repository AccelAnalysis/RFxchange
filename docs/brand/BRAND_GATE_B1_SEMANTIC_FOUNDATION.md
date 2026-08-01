# Brand Gate B1 — Semantic Design Foundation

**Status: COMPLETE — IMPLEMENTED IN PR #109 AND MERGED TO `main`**

## 1. Objective

Brand Gate B1 creates reusable, mode-aware semantic foundations for **The RFxchange** without changing product behavior or visually simulating later product domains.

The implemented default remains **Exchange Light**. Intelligence Dark, Presentation Mode, sound, haptics, new settings, Mapbox restyling, component consolidation and live Network objects are outside B1.

## 2. Baseline and completion evidence

B1 branched from reconciled `main` at:

`c059e69e956f1a18983c526a60d87bbfd3930a8b`

It was implemented in PR #109 and merged at:

`c4c18272f46ad3e3120e2dcf6405fda8a274a685`

Production CI run **444** (`30720318973`) passed on the final implementation head `743493799d096040f4482863d699436bc4855c8a`, including:

- product-system and B1 semantic guardrails;
- Cloud Functions build and tests;
- complete Firebase Auth, Firestore, Functions and Storage emulator suite;
- architecture tests, including B1 semantic contracts;
- TypeScript;
- lint;
- production build.

The governing product baseline remains:

- tracker at **438 total · 121 Done · 317 Not Started**;
- Activation at **43/43**;
- Network at **7/38**;
- Wave 3 Slice 3.1 complete;
- Slice 3.2 unstarted and still blocked behind B2, B3 and B6a.

B1 supplements but does not weaken security, organization isolation, lifecycle, geography, privacy, marker, acquisition, tutorial-isolation, communications, tracker or dependency authority.

## 3. Implemented semantic architecture

### 3.1 Exact palette

The approved palette remains exact:

| Role | Value |
| --- | --- |
| Exchange Black | `#0B0B0D` |
| Warm Ivory | `#F7F3EA` |
| Graphite | `#252932` |
| RF Gold | `#D6A23A` |
| Accessible Dark Gold | `#8A6418` |
| Signal Blue | `#2E5EAA` |
| Growth Green | `#3B7B57` |

RF Gold remains the signature connection/focus accent. It is not the default small-text gold on Warm Ivory. Accessible Dark Gold is the approved normal-text gold-family role and meets WCAG AA normal-text contrast on Warm Ivory.

### 3.2 Mode-aware semantic colors

`src/design/tokens.ts` defines `semanticColorModes.exchangeLight` for:

- canvases and elevated/dense surfaces;
- glass and subtle information/connection/outcome surfaces;
- primary, secondary, muted, inverse, intelligence, outcome and connection text;
- subtle, strong, inverse, glass and focus borders;
- primary, selected, link and focus actions;
- information, positive-resolution, connection, disabled, neutral and restricted states.

B1 declares only the already-authorized Exchange Light mode. `semanticTokenPolicy.darkModeAuthorized` remains `false`.

### 3.3 Structural tokens

B1 defines reusable tokens for:

- spacing;
- radius;
- elevation;
- border widths and styles;
- focus outline and offsets;
- typography roles;
- motion durations;
- easing curves.

Aptos Display, Aptos and system-safe fallbacks remain the only typography families. No font files or `@font-face` declarations are added.

### 3.4 Proprietary object semantics

B1 defines semantic contracts for the proprietary grammar:

> Nodes are participants. Beacons are demand. Paths are interactions. Fields are geography or service coverage. Seals are evidence. Green resolutions are outcomes.

Token families now exist for:

- organization nodes and subordinate additional-location treatment;
- future opportunity beacons;
- selected, surrounding, restricted and service fields;
- connection, information and outcome paths;
- evidence seals;
- selected, released, limited and restricted locality states.

These are design contracts only. They do not create live opportunities, provider territories, referrals, RFx paths, credibility evidence, outcomes or additional-location state. Each remains gated by its owning domain and later authorized Brand Gate.

## 4. Runtime compatibility

B1 is additive and intentionally low-change:

- existing `colors`, `participantSurfaces`, `participantLayout`, `typography` and trademark exports remain available;
- existing root CSS variables such as `--rf-gold`, `--warm-ivory` and `--graphite` remain unchanged;
- `src/design/semantic-tokens.css` loads before `app/globals.css` and adds semantic CSS variables without overriding legacy values;
- no existing component, route, marker, Mapbox layer, camera, animation or product state is restyled by the gate.

B2 may migrate shared primitives from legacy aliases and one-off values to these semantic roles while preserving behavior.

## 5. Drift controls and tests

`scripts/validate-brand-semantic-foundation.mjs` verifies:

- exact approved colors in TypeScript and CSS;
- Accessible Dark Gold contrast and correct small-text mapping;
- Exchange Light mode and the absence of an unauthorized dark-mode implementation;
- structural, typography, motion and object token families;
- Aptos/system-safe typography and absence of bundled font declarations/assets;
- legacy raw-token compatibility;
- semantic CSS loading order;
- no direct approved raw palette literals in governed brand, participant or future shared-UI primitive directories;
- object-token declarations do not authorize runtime domain objects.

The validator runs with the existing product-system guardrail. `test/brand-semantic-foundation.test.mjs` verifies the runtime token objects, compatibility aliases, color meanings, accessibility, motion/type/layout families and domain-object separation.

## 6. Explicit non-scope

B1 did not implement:

- B2 shared component primitives;
- B3 Mapbox/cartographic convergence;
- B4 public marketing changes;
- B5 onboarding restyling;
- B6 workspace changes;
- B7 Intelligence Dark;
- B8 sound or haptics;
- B9 Presentation Mode;
- B10 credibility/outcome expression;
- any Feature ID;
- any tracker or dependency change;
- any live organization, opportunity, referral, provider, RFx, credibility or outcome representation.

## 7. Exit and next gate

B1 has met its exit condition: the final implementation head passed every required gate and PR #109 merged into `main`.

**Brand Gate B2 — Shared Component Primitives is now the next gate ready for explicit authorization.**

B2 must branch from merged B1 `main` at or after `c4c18272f46ad3e3120e2dcf6405fda8a274a685`. B2 has not begun in B1 or this reconciliation.
