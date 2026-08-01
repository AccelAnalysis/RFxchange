# RFxchange Motion System

**Status: PLANNING AUTHORITY — NO PRODUCTION MOTION FRAMEWORK AUTHORIZED UNTIL THE POST-WAVE-2 BRAND CONVERGENCE GATE**

## 1. Purpose

Premium motion is meaningful continuity. It should help a participant understand where an object came from, where attention moved, what state changed, and what action completed.

Motion must not exist merely to make the platform look active.

The governing principles are:

- motion explains continuity;
- longer motion starts and stops smoothly;
- interaction remains interruptible;
- the participant retains control;
- motion never changes authoritative state by itself;
- reduced-motion users receive complete, equivalent information;
- routine activity remains calm.

## 2. Timing categories

| Category | Duration | Use |
| --- | ---: | --- |
| Micro | `120–180ms` | button response, selection, checkbox/toggle state, hover/focus feedback, small status changes |
| Panel | `220–320ms` | drawer/sheet opening, contextual panel change, structured expansion, workflow-stage movement |
| Spatial | `600–1,200ms` | map refocus, locality-to-organization movement, relationship reveal, entering opportunity geography |
| Milestone | approximately `2–4s` | first marker activation, first completed connection, first RFx submission, substantive credibility milestone, confirmed outcome |

These ranges describe the ordinary system. A platform-controlled ambient orbit is a separate continuous camera behavior governed by the spatial architecture contract and the participant’s preferences.

## 3. Easing

### 3.1 Micro and panel motion

Use restrained ease-out or symmetric ease-in-out curves. Controls should feel immediate without snapping.

Recommended directional behavior:

- entry: slightly stronger deceleration near rest;
- exit: slightly faster acceleration out of view;
- state morph: balanced ease-in-out;
- focus/hover: quick and low-amplitude.

### 3.2 Spatial and milestone motion

Longer movement must use smooth acceleration and deceleration. Do not use linear camera movement or abrupt starts/stops.

Spatial motion should generally:

1. establish departure;
2. accelerate without disorienting the user;
3. preserve geographic continuity;
4. decelerate before the focal object;
5. settle without bounce.

Avoid overshoot, elastic easing, spring bounce, or cinematic movement that delays the user’s task.

### 3.3 Centralized tokens

Implementation must centralize durations and easing values. Reusable motion may not be defined as one-off literals across unrelated components.

Proposed semantic token families:

- `motion.duration.microFast`
- `motion.duration.micro`
- `motion.duration.panel`
- `motion.duration.spatial`
- `motion.duration.milestone`
- `motion.easing.enter`
- `motion.easing.exit`
- `motion.easing.standard`
- `motion.easing.spatial`

Exact curves should be selected and tested during implementation rather than guessed independently by feature teams.

## 4. Signature motions

### 4.1 Locality reveal

Purpose: communicate that the participant has entered or selected a geographic operating context.

Sequence:

1. authoritative boundary resolves or draws;
2. surrounding geography becomes subdued;
3. relevant permitted nodes/fields appear progressively;
4. locality label settles.

Rules:

- do not redraw continuously;
- do not erase surrounding geography;
- preserve attribution and controls;
- reduced motion uses immediate boundary/state change with a short static emphasis.

### 4.2 Marker lock

Purpose: establish the real organization marker as the first success moment.

Sequence:

1. camera reaches the authoritative target;
2. marker visual resolves or descends within its anchored child;
3. marker settles without changing coordinate;
4. one restrained gold pulse travels outward;
5. optional sound event may fire if enabled and approved.

Rules:

- renderer-owned anchor transform remains unchanged;
- no continuous pulsing;
- the marker must remain visibly unobstructed by panels;
- reduced motion uses an immediate marker reveal and static halo.

### 4.3 RFx trace

Purpose: show movement from demand to potential participants or through an RFx lifecycle.

Sequence:

1. opportunity beacon gains emphasis;
2. a thin gold path travels toward relevant node(s);
3. direction is visible where meaningful;
4. path settles into static relationship state;
5. nonselected paths recede.

Rules:

- use only for authoritative relationships or clearly synthetic tutorial state;
- do not imply qualification, endorsement, or award likelihood;
- do not keep the path in constant motion.

### 4.4 Connection accepted

Purpose: show that an invitation, referral, or connection changed to an accepted state.

Sequence:

1. source and destination nodes gain brief emphasis;
2. path resolves between them;
3. status label updates;
4. emphasis returns to normal.

Acceptance is not an economic outcome and does not turn the path green.

### 4.5 Outcome resolution

Purpose: communicate a confirmed positive resolution.

Sequence:

1. existing active path is identified;
2. status explanation appears;
3. path transitions from RF Gold to Growth Green;
4. the visual stops animating;
5. provenance/verification status remains accessible.

Green requires an appropriate authoritative outcome state. Self-report, counterparty confirmation, and independent verification must not be visually conflated where the distinction matters.

### 4.6 Credibility seal resolve

Purpose: acknowledge a substantive badge state without gamification.

Sequence:

1. seal outline resolves;
2. internal symbol appears;
3. family and badge label become readable;
4. explanation affordance becomes available;
5. motion stops.

No confetti, rank-up explosions, spinning coins, public score counters, or repeated animation on every profile view.

## 5. Panels and navigation

### 5.1 Drawers and sheets

- preserve map or workflow context;
- do not slide across the focal marker when an edge route is available;
- mobile bottom sheets reveal enough map to maintain spatial understanding;
- use opacity and translation together sparingly;
- focus moves to the opened surface and returns predictably on close;
- closing must not discard unsaved work without warning.

### 5.2 Route transitions

Ordinary route changes should not use full-page theatrical animations.

Use continuity only when it explains preserved context, such as:

- organization list to organization detail;
- opportunity list/map to opportunity detail;
- locality to organization;
- one RFx stage to the next.

### 5.3 Loading

Loading motion should:

- indicate that work is occurring;
- preserve layout dimensions;
- avoid moving buttons after data loads;
- use skeletons only where the final shape is known;
- avoid indeterminate animation for long operations without status copy;
- not simulate progress percentages unless measured.

## 6. Ambient orbit and camera control

The ambient orbit is a branded spatial behavior, not decorative video.

Current intended signatures remain:

- locality: approximately 225-second orbit, 60-degree pitch, zoomed to fit;
- organization: approximately 225-second orbit, 75-degree pitch, zoom 16.

Rules:

- user interaction pauses or takes priority over the orbit;
- orbit can be disabled in account settings;
- reduced motion disables or replaces orbit by default;
- no camera motion may prevent selection, reading, keyboard use, or precise inspection;
- returning from another lens should preserve the participant’s latest intentional camera state where the workflow requires it;
- camera transitions use smooth start and stop;
- do not restart orbit aggressively after every minor interaction.

## 7. Interruption and control

Motion must be interruptible.

- map drag, zoom, keyboard camera action, or object selection takes priority;
- rapid repeated actions should resolve to the most recent intent rather than queueing every animation;
- closing a panel must not wait for a nonessential animation;
- route navigation must not be blocked by decorative milestone motion;
- milestone animation may be skipped while still recording the authoritative event;
- background tabs and reduced-resource conditions should avoid unnecessary animation work.

## 8. Reduced motion

Respect `prefers-reduced-motion` and the participant’s persisted setting when implemented.

Reduced-motion behavior must:

- disable ambient orbit;
- remove travel along paths while preserving the final path;
- replace marker descent with immediate reveal;
- replace boundary drawing with immediate boundary appearance and static emphasis;
- remove parallax, zoom sweeps, and large translations;
- preserve every status, label, and action;
- keep focus management intact;
- avoid flashing or rapid opacity cycles.

Reduced motion is not “no feedback.” It is complete feedback without disorienting movement.

## 9. Motion that is prohibited

Do not animate:

- every marker continuously;
- decorative particles;
- every notification;
- routine table-row refreshes;
- ordinary profile completion with confetti;
- bouncing controls;
- heatmaps without underlying data change;
- logos on routine page loads;
- text in ways that delay reading;
- background loops that compete with tasks;
- simulated activity intended to make a low-density network appear busy.

## 10. Performance requirements

Motion implementation must:

- prefer compositor-friendly properties where possible;
- avoid repeated layout thrashing;
- remain smooth on supported mobile hardware;
- avoid animating large blurred layers unnecessarily;
- stop hidden/offscreen animation;
- preserve Mapbox performance and input responsiveness;
- not delay first interaction or largest-contentful paint on public pages;
- load milestone assets lazily when appropriate;
- degrade gracefully when advanced effects are unavailable.

## 11. Accessibility requirements

- motion never carries the only meaning;
- status is announced through appropriate accessible text/live regions where required;
- focus does not move unpredictably because of animation;
- no essential control appears only after hover motion;
- no flashing pattern exceeds accessibility safety thresholds;
- the participant can disable nonessential motion;
- list and text alternatives remain synchronized with map state.

## 12. Acceptance matrix

For every motion implementation, test:

- standard motion;
- reduced motion;
- orbit enabled and disabled;
- keyboard operation;
- rapid repeated input;
- interruption by map interaction;
- desktop, intermediate, and mobile layout;
- visibility of the focal object throughout;
- correct authoritative state before, during, and after motion;
- no accidental domain event created by animation;
- performance under representative data density;
- no invented or misleading activity.

A motion is acceptable only when the participant can understand the same state without seeing the animation.
