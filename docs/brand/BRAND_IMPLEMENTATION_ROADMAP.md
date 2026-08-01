# RFxchange Brand Experience Implementation Roadmap

**Status: PLANNING ONLY — BEGIN CODE AFTER PR #99, SLICES 2.9–2.12, AND THE COMPLETE WAVE 2 EXIT ARE MERGED AND ACCEPTED**

## 1. Purpose

This roadmap sequences the premium brand experience without destabilizing active activation work or fabricating later-wave domain functionality.

The brand implementation is a convergence program, not a single restyling PR.

It must preserve:

- authorization and organization isolation;
- activation and OPEN lifecycle authority;
- authoritative geography and privacy-safe coordinates;
- marker visibility and renderer ownership;
- acquisition-context integrity;
- synthetic/live tutorial isolation;
- RFx, referral, provider, credibility, and commercial domain boundaries;
- tracker evidence and Feature-ID discipline.

## 2. Current hold boundary

While PR #99 and Wave 2 Slices 2.9–2.12 are active, this roadmap authorizes documentation and architectural planning only.

Do not modify for brand purposes:

- activation APIs or lifecycle semantics;
- participant/map CSS;
- map panel dimensions;
- marker geometry, anchoring, visibility, projection, orbit, pitch, or zoom;
- registration/onboarding composition outside authorized slice scope;
- Mapbox production style;
- theme persistence;
- audio/haptic runtime;
- tracker totals, dependencies, or Feature-ID completion.

The active Codex implementation receives only the narrow addendum in `CODEX_WAVE_2_BRAND_AUTHORITY_ADDENDUM.md` after the PR #99 hard boundary is cleared.

## 3. Entry criteria for Brand Experience Convergence

The convergence gate may begin only after:

1. PR #99 configured-browser cases pass and the repair is merged.
2. Slice 2.9 is merged and acquisition context is verified.
3. Slice 2.10 is merged with synthetic/live isolation verified.
4. Slice 2.11 is merged with human-selection and nonbinding-team boundaries verified.
5. Slice 2.12 is merged with first-value intent and server-authoritative OPEN verified.
6. The complete Wave 2 exit is reconciled against the canonical tracker.
7. Main is green for production CI and configured-browser acceptance.
8. The final surface inventory and changed-domain seams are recalculated.

## 4. Program structure

The Brand Experience Convergence Gate should be implemented as small sequential slices with explicit acceptance. Do not authorize all code at once.

### Brand Gate B0 — Reconciliation and canonical authority

**Objective:** adopt this package against the final merged Wave 2 implementation.

Work:

- rebase/reconcile these documents against merged main;
- identify any Wave 2 divergence;
- update `docs/design/RFxchange_DESIGN_SYSTEM.md` to reference this package;
- update design/context indexes;
- classify each requirement as cross-cutting, net-new capability, or domain-dependent expression;
- map any new product capabilities to tracker governance before implementation;
- define code ownership and test boundaries.

Acceptance:

- no runtime changes;
- no Feature IDs marked Done;
- no conflicts with security/lifecycle/geography contracts;
- explicit implementation slice list approved.

### Brand Gate B1 — Semantic design foundation

**Objective:** create reusable semantic foundations without changing product behavior.

Work:

- refactor raw palette into mode-aware semantic tokens;
- preserve existing exact brand colors;
- add Accessible Dark Gold for small text where required;
- define spacing, radius, elevation, border, focus, typography-role, motion-duration, and easing tokens;
- define object-semantic tokens for nodes, beacons, fields, paths, seals, and locality states;
- add static validation against one-off semantic drift;
- preserve Aptos/system fallback until a licensed display/interface choice is approved.

Acceptance:

- no visible or minimal controlled visual change;
- all existing routes compile and pass tests;
- raw-token compatibility layer prevents broad breakage;
- no unlicensed fonts/assets;
- semantic meaning documented and testable.

### Brand Gate B2 — Shared component primitives

**Objective:** make the canonical behavior reusable.

Work:

- consolidate navigation, map controls, search/filter, drawers, sheets, object cards, timelines, alerts, empty states, tables, and status treatments;
- add organization-node and opportunity-beacon primitives without inventing live data;
- add service-field/path/seal interfaces gated behind authoritative domain inputs;
- implement loading/error/permission/expired primitives;
- implement focus and accessible naming contracts;
- add reduced-motion paths.

Acceptance:

- migrated components preserve current domain behavior;
- no duplicate one-off component systems;
- story/test fixtures are clearly synthetic and excluded from runtime data;
- responsive and accessibility tests pass.

### Brand Gate B3 — Mapbox/cartographic convergence

**Objective:** establish the proprietary RFxchange map in Exchange Light.

Work:

- warm low-saturation land treatment;
- subdued roads and nonessential labels;
- restrained authoritative locality boundaries;
- dimmed nonfocus geography;
- low-contrast 3D buildings;
- organization-node migration;
- opportunity-beacon integration only where a real opportunity projection exists;
- progressive detail by zoom;
- proprietary density gradient;
- protected focal-target geometry;
- list/map parity.

Acceptance:

- PR #99 marker-visibility cases remain passing;
- real marker remains anchored and visible in default 3D, 2D, Fit home, and manual interaction;
- attribution and authoritative geometry remain intact;
- representative density performs on desktop/mobile;
- no rainbow palette or generic outlined pins.

### Brand Gate B4 — Public marketing and acquisition

**Objective:** make the public edge the premium entrance into the real product.

Work:

- cinematic full-bleed hero using rights-cleared real imagery/video;
- approved positioning and Accel Analysis endorsement;
- immersive narrative chapters;
- dedicated bottom-matter routes;
- actual RFxchange screenshots only when presentation-ready;
- public opportunity/acquisition surfaces converge with the same system;
- evidence/provenance asset register;
- image/video performance optimization.

Acceptance:

- anonymous users remain restricted to public routes;
- no invented market evidence;
- no autoplay audio;
- reduced-motion media treatment;
- performance budget and accessibility pass;
- acquisition context survives the public-to-activation journey.

### Brand Gate B5 — Onboarding and activation experience

**Objective:** make onboarding the first branded product demonstration.

Work:

- calm account establishment treatment;
- locality typeahead and reveal;
- organization-candidate visual grammar;
- spatial continuity through address confirmation;
- marker-lock motion;
- activation language and single next action;
- state-preserving error/loading/autosave treatment;
- optional sonic event hook behind disabled/approved preference infrastructure.

Acceptance:

- every Wave 2 activation gate remains authoritative;
- no duplicated information;
- no participation-role or business-objective reintroduction;
- reduced-motion equivalent;
- sound cannot fire on failed activation;
- configured-browser acceptance covers no-website and available-website paths.

### Brand Gate B6 — Daily spatial workspace

**Objective:** make the map the persistent living-market environment.

Work:

- unified search/filter placement;
- preserved viewport and selection across implemented lenses;
- organization home;
- opportunity home;
- contextual gap actions;
- responsive drawers/sheets;
- object-centered notifications/status;
- useful empty states;
- data-provenance treatment.

Acceptance:

- no modal dead ends;
- map state preservation is deterministic;
- permission and expired states complete;
- mobile and keyboard parity;
- no later-wave workflow fabricated.

### Brand Gate B7 — Intelligence Dark

**Objective:** add a true analytical dark mode.

This is a net-new capability and requires approved tracker/product scope.

Work:

- semantic dark token set;
- dark Mapbox style;
- dark nodes/beacons/fields/paths;
- charts/tables/forms/overlays;
- system/light/dark preference persistence;
- flash-free fallback;
- independent contrast/accessibility review.

Acceptance:

- not neon/cyber;
- no data/authority change;
- all states covered;
- performance parity;
- persisted preference and recovery work.

### Brand Gate B8 — Sonic and sensory controls

**Objective:** implement restrained optional sonic behavior and, if approved, haptics.

This is a net-new capability.

Work:

- professional/rights-cleared sonic assets;
- authoritative event adapters;
- idempotency and duplicate suppression;
- master, notification, and milestone controls;
- quiet hours integration where supported;
- visual/screen-reader equivalents;
- optional mobile haptic contracts.

Acceptance:

- no autoplay marketing audio;
- no sound on failed mutation;
- disabled sound loses no function;
- background/quiet-hour behavior correct;
- asset provenance documented.

### Brand Gate B9 — Presentation Mode

**Objective:** create a governed presentation-safe product mode.

This is a net-new capability.

Work:

- safe presentation projection;
- sensitive-field suppression;
- guided frames;
- larger labels and minimized controls;
- cinematic, reduced-motion-compatible transitions;
- provenance/caveat panel;
- presenter authorization and exit behavior;
- print/export treatment where approved.

Acceptance:

- no private data leakage;
- only real authorized or clearly synthetic evidence;
- keyboard operation;
- large-display performance;
- audience-facing captures omit private controls/notifications.

### Brand Gate B10 — Credibility and outcome expression

**Objective:** apply the premium seal and outcome grammar when the authoritative domains exist.

Work:

- credibility-family seals;
- Recognition separation;
- badge explanations and state behavior;
- outcome-path transition;
- provenance labels;
- private/public credibility presentation boundaries.

Acceptance:

- no public numerical trust score;
- membership and Founding status remain separate;
- green only after appropriate outcome state;
- suspended/expired/revoked behavior correct;
- admin/ledger authority preserved.

## 5. Domain dependency matrix

| Brand expression | Earliest safe implementation |
| --- | --- |
| Exchange Light semantic foundations | Post-Wave-2 Brand Gate B1 |
| Organization node refinement | Post-PR #99 and B3 |
| Public opportunity beacon | After Slice 2.9 public projection; full behavior after RFx opportunity domain |
| Synthetic orientation paths | Slices 2.10–2.11 within strict tutorial isolation |
| Real capability/team path | After corresponding discovery/team domain exists |
| Service fields | After official provider/service-territory domain exists |
| Referral paths | After referral state machine exists |
| RFx lifecycle trace | After Wave 4 RFx domain exists |
| Credibility seals | After Credibility domain implementation |
| Outcome paths | After outcome and provenance states exist |
| Intelligence Dark | Approved net-new capability after B1/B3 |
| Presentation Mode | Approved net-new capability with safe projection |
| Sonic/haptic runtime | Approved net-new capability with event and preference authority |

## 6. Branch and merge discipline

For each gate:

- branch from current merged main;
- implement one authorized scope;
- name all affected domain contracts;
- run repository and configured-browser acceptance;
- keep PR draft until required evidence exists;
- merge before dependency recalculation;
- do not stack unrelated brand gates on an unmerged base;
- do not mark Feature IDs complete unless the authorized tracker evidence is satisfied;
- do not merge visual simulation as evidence of a domain feature.

## 7. Testing architecture

Add reusable validators/tests for:

- exact palette and semantic role mapping;
- prohibited one-off raw colors in governed participant components;
- product naming and parent endorsement rules;
- prohibited unsupported claims;
- mode-aware contrast tokens;
- motion duration/easing and reduced-motion presence;
- focal marker visibility geometry;
- synthetic/live data isolation;
- map/list parity contracts;
- public asset provenance metadata;
- sound event authority and idempotency;
- Presentation Mode safe projection;
- credibility/membership separation;
- outcome/green semantic separation.

Tests must verify behavior, not merely inspect strings when runtime evidence is required.

## 8. Performance budgets

Each implementation gate should define budgets for the affected surface, including:

- public LCP/CLS/INP;
- map first-interaction readiness;
- panel open/close responsiveness;
- supported marker/field/path density;
- route bundle growth;
- font/media loading;
- audio asset size;
- mobile memory and battery behavior;
- reduced-resource fallback.

Premium visual effects must be removed or degraded when they compromise use.

## 9. Completion definition

The Brand Experience Convergence program is complete only when:

- the canonical system is linked from repository design/context authorities;
- shared semantic tokens and components are implemented;
- public, onboarding, spatial, and operational surfaces use the same system;
- applicable viewing modes are complete and accessible;
- motion and sound follow governed controls;
- real domain objects use the proprietary grammar;
- loading, empty, success, error, permission, expired, and recovery states are complete;
- no invented customer-facing evidence appears;
- configured-browser acceptance passes across representative modes and viewports;
- tracker and release documentation accurately reflect what was actually built.
