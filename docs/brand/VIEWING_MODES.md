# RFxchange Viewing Modes

**Status: PLANNING AUTHORITY — EXCHANGE LIGHT IS THE CURRENT DIRECTION; INTELLIGENCE DARK AND PRESENTATION MODE ARE NET-NEW CAPABILITIES**

## 1. Purpose

RFxchange should support distinct environments for daily work, analytical work, and executive/public presentation without fragmenting into separate products.

The governed viewing modes are:

1. **Exchange Light** — default participant experience.
2. **Intelligence Dark** — optional dark mode for extended analytical use.
3. **Presentation Mode** — controlled briefing environment for meetings and large displays.
4. **High Contrast** — accessibility mode or system-compatible high-contrast treatment.

Modes change presentation, density, contrast, and permitted disclosure. They do not change domain authority, organization permissions, lifecycle, matching, credibility, or commercial status.

## 2. Exchange Light

### 2.1 Purpose

Exchange Light is the default daily environment for onboarding, map exploration, opportunity review, referrals, resources, profiles, and ordinary participant work.

### 2.2 Visual treatment

- Warm Ivory foundation;
- warm low-saturation map;
- Exchange Black/Graphite typography and structure;
- restrained RF Gold focus and connection cues;
- Signal Blue data and opportunity cues;
- Growth Green only for appropriate positive outcomes;
- light contextual overlays;
- opaque surfaces for dense tables and long workflows.

### 2.3 Behavior

- map remains primary where geography is relevant;
- one restrained top navigation;
- panels remain calm and readable;
- no full-screen black participant shell;
- no excessive glow, gradients, or decorative cards;
- photography and video on public pages use readability gradients rather than boxed copy where appropriate.

### 2.4 Default status

Exchange Light is the ordinary participant default. A participant may later persist another mode, but public onboarding and safety-critical recovery surfaces should remain legible without depending on a stored mode.

## 3. Intelligence Dark

### 3.1 Purpose

Intelligence Dark supports low-light and extended analytical work, particularly for map intelligence, dense data review, and operational monitoring.

It is not a separate premium tier and must not communicate privileged market access.

### 3.2 Visual treatment

- near-black, Graphite, or charcoal foundation;
- Warm Ivory primary text;
- muted Signal Blue and RF Gold;
- restrained Growth Green;
- low-contrast roads, labels, and 3D buildings;
- no neon cyan, luminous grid, arcade glow, or speculative-finance aesthetic;
- opaque Graphite data surfaces where transparency would reduce readability.

### 3.3 Organization nodes

- Graphite core;
- Warm Ivory internal detail;
- muted gold focus/selection;
- separate accessible focus ring;
- no bright white permanent outline.

### 3.4 Charts and heatmaps

- semantic colors retain the same meaning as Exchange Light;
- contrast is recalculated rather than merely inverting colors;
- density remains Signal Blue-led;
- gold identifies selected/focused context;
- green remains an outcome layer;
- patterns and labels remain available.

### 3.5 Dark-mode boundary

Intelligence Dark must not:

- imply a secret intelligence product;
- hide map attribution;
- reduce accessibility;
- use dark mode to disguise low-contrast text;
- become the marketing default merely because black and gold are signature colors;
- change what data a participant can access.

## 4. Presentation Mode

### 4.1 Purpose

Presentation Mode supports:

- buyer meetings;
- economic-development briefings;
- executive reviews;
- community presentations;
- large displays;
- guided demonstrations.

It is not an enlarged version of the daily interface.

### 4.2 Core behavior

Presentation Mode should:

- hide private or sensitive fields by default;
- apply a presentation-safe data projection;
- minimize controls;
- increase label and data size;
- use cinematic but restrained map transitions;
- emphasize one locality, journey, opportunity, or data story;
- support a guided sequence of approved views;
- display provenance and caveats clearly;
- preserve visible attribution;
- avoid showing private notifications or account controls.

### 4.3 Story structure

A presentation sequence may contain approved frames such as:

1. locality overview;
2. capability distribution;
3. opportunity or buyer need;
4. organization match context;
5. teammate or provider connection;
6. response/evaluation pathway;
7. outcome and provenance;
8. aggregate intelligence and limitations.

### 4.4 Privacy and authorization

Presentation Mode requires a separate projection/permission evaluation. It must not expose information merely because the ordinary authenticated user can see it.

At minimum, it must protect:

- private organization documents;
- nonpublic contact information;
- private buyer deliberations;
- evaluator comments;
- referral details without consent;
- protected provider/client context;
- private credibility ledger data;
- hidden commercial/payment state;
- private notifications;
- unpublished RFx or response data.

### 4.5 Real evidence only

Presentation Mode may use:

- real, authorized platform records;
- aggregated/suppressed data;
- clearly labeled synthetic tutorial scenarios;
- approved conceptual diagrams.

It may not use invented organizations, opportunities, statistics, outcomes, testimonials, or market activity represented as real.

### 4.6 Presenter controls

Potential controls, subject to implementation scope:

- start/end presentation;
- next/previous approved frame;
- pause/resume camera movement;
- fit current subject;
- show/hide labels;
- reveal caveat/provenance panel;
- switch between approved light/dark presentation treatment;
- exit to the originating authorized workspace.

Presentation controls must remain keyboard operable and should not appear in audience-facing capture unless intentionally displayed.

## 5. High Contrast

High Contrast is an accessibility requirement, not a brand variation.

It must:

- preserve visible focus;
- strengthen surface and text contrast;
- avoid translucent backgrounds behind dense content;
- provide patterns and labels in addition to color;
- preserve all statuses and object distinctions;
- remain compatible with operating-system forced-colors behavior where possible;
- avoid hiding Mapbox attribution or required labels;
- preserve selected/focused object meaning without glow alone.

## 6. Sensory settings

The account/settings experience should eventually support:

- appearance: system/light/dark where governed;
- reduced motion;
- ambient orbit on/off;
- master sound on/off;
- notification sound on/off;
- milestone sound on/off;
- high contrast or system high contrast;
- haptics on/off where implemented;
- presentation preferences where authorized.

These are net-new capabilities when persistence, cross-device behavior, and account controls do not yet exist. They require explicit product scope and tests.

## 7. Mode-aware semantic tokens

Implementation should separate raw palette from semantic roles.

Proposed semantic roles include:

- `surface.canvas`
- `surface.panel`
- `surface.overlay`
- `surface.dataDense`
- `text.primary`
- `text.secondary`
- `text.inverse`
- `border.subtle`
- `focus.primary`
- `connection.active`
- `intelligence.primary`
- `outcome.positive`
- `map.land`
- `map.water`
- `map.road`
- `map.label`
- `map.building`
- `map.localityFocus`
- `map.surroundingDim`
- `node.core`
- `node.detail`
- `beacon.active`

A raw color must not be used as a new semantic meaning merely because it looks acceptable in one mode.

## 8. Persistence and fallback

- authenticated preference persistence requires server/client authority definition;
- first render should minimize theme flash;
- unauthenticated public pages may use system preference only where the approved design supports it;
- legal, authentication recovery, and error pages must remain readable even when preference loading fails;
- stale preference must not block access;
- unsupported browsers receive a stable Exchange Light fallback;
- print/export uses a governed presentation-safe style rather than blindly printing dark mode.

## 9. Accessibility

Each mode must independently pass:

- text contrast;
- non-text contrast;
- keyboard/focus visibility;
- screen-reader naming;
- reduced motion;
- forced colors/high contrast where supported;
- color-blind differentiation;
- zoom and reflow;
- responsive layout;
- map/list parity;
- dense table readability.

Passing Exchange Light does not automatically prove Intelligence Dark or Presentation Mode.

## 10. Performance

- mode switching should avoid full application reload where practical;
- Mapbox style transitions must not freeze interaction;
- font loading must not block essential content;
- mode assets should be lazy where appropriate;
- Presentation Mode must remain responsive on large displays;
- dark mode should not multiply duplicate map assets unnecessarily;
- transition effects stop under reduced motion;
- the public page should not load both full media treatments when only one is used.

## 11. Acceptance

A viewing mode is complete only when:

- semantic tokens are centralized;
- all key participant surfaces are reviewed;
- map and non-map workflows are covered;
- loading, empty, success, error, permission, and expired states are covered;
- charts, tables, overlays, forms, and focus states pass contrast;
- mode preference and fallback work;
- no domain authority changes with mode;
- Presentation Mode uses a safe projection;
- synthetic content remains labeled;
- reduced motion, sound, and orbit controls remain respected;
- responsive and configured-browser acceptance passes.
