# Exchange Shell Truthfulness and Transition Loading Execution Authority

**Status: AUTHORIZED NO-FEATURE-ID CROSS-CUTTING IMPLEMENTATION GATE — ACTIVE UNTIL MERGED AND POST-MERGE VALIDATED**

**Exact base:** `87fb29ef3b442410deecf61a470bc94c9c013c60`
**Branch:** `fix/exchange-shell-truthfulness-performance`
**Pull request:** `Converge participant lens truthfulness and transition loading`
**Sequence:** after merged documentation-only Wave 4 Slice 4.1 authority; before participant-facing Slice 4.1 RFx entry may be integrated into the shared shell.

## 1. Purpose and boundary

This authority corrects participant-facing truthfulness, converges authenticated lens navigation onto the governed Exchange Interaction Architecture, separates Account utilities from market lenses, and prevents ordinary authenticated navigation from being presented as though RFxchange is launching again.

This is a no-Feature-ID gate. It does not complete `ISS-001`, `ISS-002`, `ISS-003`, or any other RFx Feature ID. It does not change tracker totals, Wave completion counts, Brand Gate status, B6b status, or build-identity semantics.

The expected tracker remains:

- **438 total · 152 Done · 286 Not Started**;
- Activation: **43/43**;
- Network: **38/38**;
- Wave 4 RFx Core: **0/41**; and
- B6b: **Not Started / intentionally pending**.

Stabilization 2C remains separate and parked. This gate does not initialize, alter, or deploy Firebase App Hosting.

## 2. Governing participant truthfulness

Participant-facing truthfulness has four complementary parts.

### 2.1 Structural truthfulness

The interface represents the stable, governed product architecture rather than a temporary taxonomy that would later be discarded.

The permanent authenticated market-lens order is exactly:

1. `Opportunities/RFx`;
2. `Resources`;
3. `Intelligence`; and
4. `Referrals`.

Network and Quick Start are not peer market lenses. Network remains the current organization-network view/domain concept within Intelligence. Quick Start is an Account utility.

### 2.2 Capability truthfulness

Visibility does not mean availability.

A governed permanent lens may be visible before it is enabled only when its unavailable state is explicit visually and semantically; it has no dead link, placeholder route, fabricated data, simulated workflow, or current-page treatment; it does not imply Feature-ID completion; and later enablement requires accepted real runtime authority.

> **The stable lens architecture remains visible even when a lens is unavailable. Availability governs action, not whether a governed permanent lens exists in the information architecture.**

### 2.3 State truthfulness

Enabled, unavailable, loading, empty, error, restricted, and recovery states describe the actual state of the relevant surface. An unavailable permanent lens is not hidden and does not appear clickable. A route wait does not resemble a new product launch.

### 2.4 Continuity truthfulness

Ordinary movement between authenticated lenses preserves the fact that the participant remains inside one Exchange. It must not appear to repeat activation, open another application, discard the participant shell, lose the authenticated organization context, or restart the workspace merely because route-specific information is pending.

> **Loading truthfulness requires the current Exchange shell to remain visible during ordinary lens changes. A route-level wait must not be presented as though RFxchange is being launched again.**

This participant rule does not change administrative navigation truthfulness. Administrative navigation continues to expose only destinations that are both implemented and server-authorized.

## 3. Typed participant-lens registry

One typed registry is the participant lens source of truth for order, localized labels, availability, canonical hrefs, and active-path matching.

| Lens | Availability during this gate | Canonical seam | Governing behavior |
| --- | --- | --- | --- |
| Opportunities/RFx | Unavailable | None | Present first, no href, announced `Not yet available`, never current. |
| Resources | Enabled | `/resources` | Existing authorized Resource Network workspace and all provider/request boundaries remain intact. |
| Intelligence | Enabled | `/geography/canvas` | Existing live organization/geography/map experience. Network remains its current default view/domain concept. Existing deep links and query parameters remain compatible. |
| Referrals | Enabled | `/referrals` | Existing authorized referral workspace and sender/recipient, consent, lifecycle, and delivery boundaries remain intact. |

No functional Opportunities route, draft, aggregate, opportunity, beacon, match, response, or RFx record is created by this gate.

## 4. Account and utility navigation

Account and Quick Start are removed from the primary lens sequence and placed in a separate, keyboard-accessible utility control.

The Account utility contains:

- Organization Profile → `/organization-profile`;
- Quick Start → `/quick-start`;
- Administration only when the existing server-authoritative administrative resolution returns at least one implemented destination; and
- Sign out.

Organization identity may be projected after the shell renders. That optional identity projection cannot grant authority and fails closed. Administration is requested lazily after the utility opens, cannot block ordinary lens rendering, and fails closed during dependency outages. Every direct administrative route remains independently server-authorized.

Mobile preserves the same four-lens order, keeps Account utilities separate, exposes unavailable status without hover, supports keyboard dismissal/focus behavior, and must not produce horizontal document overflow at 390px.

## 5. Persistent shell architecture

The selected architecture is a root-layout persistent participant-shell boundary that preserves all existing public URLs.

The root layout owns one participant header and one participant content region for authenticated Exchange destinations. Existing page-local `ParticipantShell` uses become compatibility boundaries: when nested under the persistent shell, they contribute page content only and do not recreate product identity or navigation.

This architecture is forward-compatible because it:

- keeps canonical routes stable;
- permits future route-group migration without replacing the lens contract;
- keeps current organization shell context separate from private page data;
- allows later spatial-context state to be introduced behind the same shell seam;
- leaves public, activation, recovery, and administrative routes outside the participant shell when that is the truthful state; and
- prevents an unavailable Opportunities/RFx lens from becoming an accidental route merely to satisfy layout composition.

Current persistent participant paths include Exchange entry, Intelligence/Network, Resources, Referrals, Organization Profile, Quick Start, and Resource Provider application. Orientation, activation, public, recovery, and administrative pages remain outside unless separately governed.

## 6. Scoped loading and recovery

The former root `app/loading.tsx` page-wide takeover is removed. It is not replaced with smaller generic launch copy.

Each participant destination uses a route-segment loading boundary below the persistent header. The pending region:

- has scoped `role="status"`, `aria-live="polite"`, and `aria-busy="true"` semantics;
- uses localized destination-specific copy;
- does not use `Preparing this page` or `Loading RFxchange` during ordinary lens changes;
- has no artificial minimum duration or timeout-based presentation hold;
- preserves the visible, keyboard-usable lens row and Account utility; and
- leaves existing error, global-error, not-found, retry, correlation-ID, and sanitized API problem boundaries intact.

Immediate pending feedback is applied to the selected enabled lens or Account utility before route data settles. Next.js client links remain the navigation mechanism; full-document navigation is prohibited.

## 7. Latency correction and evidence

Before/after analysis must distinguish visual masking from actual latency correction. The gate inspects Server-Timing spans, browser performance entries, structured transition evidence, and network/document-navigation behavior for:

`Intelligence → Resources → Referrals → Intelligence → Account → Quick Start`.

Corrections within this gate include, where present:

- independent Resources discovery, referral, provider-owner, and query work run concurrently where dependency order permits;
- optional Administration resolution is removed from the Account critical path and requested only after the utility opens;
- Account dictionary and independent identity/profile reads run concurrently;
- the shared shell no longer remounts for each lens;
- client links replace any full-document transition in the participant navigation;
- pending feedback is immediate and has no minimum hold; and
- page-specific optional panels remain scoped rather than blocking the complete workspace.

Server authorization, tenancy, lifecycle, restriction, privacy, geography, provider, referral, and recovery checks remain unchanged. Duplicate/blocking work may be removed; authority may not be weakened.

Transition evidence records a named browser performance measure, start/end path, destination, duration, and the current number of `PerformanceNavigationTiming` entries. Browser acceptance must prove that no second document-navigation entry is introduced.

Acceptance must fail closed unless it writes
`artifacts/exchange-shell-transition-evidence.json`, and CI must upload the JSON under a name bound
to the exact candidate SHA. The artifact reports interaction-to-route-commit timing separately from
content settlement, and records context restoration, document requests, shell persistence, loading
treatment, responsive/accessibility/localization checks, clean console/exception state and an overall
result. Representative controlled-browser timings are evidence for this gate, not a production-
network latency promise.

## 8. Context preservation

The Intelligence canonical seam remains `/geography/canvas`. This label convergence does not move or replace the map route, and therefore does not discard existing URL-derived map, search, selected-object, filter, or return parameters merely because the top-level label changes.

Browser state remains non-authorizing. This gate does not fabricate a selected object, opportunity, or cross-lens record. Remaining future spatial-context persistence beyond the merged runtime belongs to a later explicitly authorized Exchange-shell slice.

## 9. Localization, accessibility, and responsive acceptance

All affected lens, unavailable, Account utility, sign-out, transition, and scoped-loading copy is present in:

- en-US;
- Spanish;
- French;
- Italian; and
- German.

Participant-authored content is not automatically translated.

Acceptance includes:

- exact lens order and availability;
- no href or current-page state for Opportunities/RFx;
- unavailable status conveyed by text and accessible description, not color alone;
- Resources, Intelligence, and Referrals enabled;
- Network absent as a peer lens;
- Account and Quick Start absent from the lens registry;
- keyboard Account menu, focus order, visible focus, outside/Escape dismissal, and focus restoration;
- conditional server-authoritative Administration visibility;
- 390px no-overflow behavior;
- Light Appearance and reduced motion;
- five-locale key parity without silent fallback;
- scoped loading semantics;
- no console errors or unhandled rejections in configured browser acceptance; and
- no participant-workspace accessibility regression.

## 10. Required validation and review

Before merge, run:

- focused lens/registry/component architecture tests;
- focused loading and transition tests;
- failure-recovery tests;
- internationalization validation;
- design/shared-primitives validation;
- accessibility checks;
- configured authenticated browser acceptance;
- affected Firebase/Auth/Firestore emulator tests;
- `git diff --check`;
- `npm run check`; and
- exact-head production CI using Node.js 24.18.x and the repository lockfile.

Codex must review the exact final head. Every substantive finding must be resolved, affected focused checks and the full exact-head gate rerun, and the PR body must identify the final reviewed SHA. After merge, production CI must pass on the exact merge SHA.

## 11. Explicit exclusions and stop boundary

This gate does not:

- implement Slice 4.1 runtime or `ISS-001`, `ISS-002`, or `ISS-003`;
- create an RFx aggregate, draft, route, publication, opportunity projection, beacon, response, evaluation, award, or outcome;
- add Intelligence datasets, analytics, Location Intelligence, or Site and Facility Intelligence;
- restore Locations or Network as a peer lens;
- change Resource Provider or referral authority;
- weaken privacy, geography, tenancy, lifecycle, restriction, or security rules;
- generalize participant unavailable-lens behavior to future administrative sections;
- reopen completed Feature-ID claims or change tracker totals;
- change B6b;
- perform Firebase App Hosting or build-identity work;
- implement Dark Appearance, Presentation Mode, sound, or haptics; or
- begin Slice 4.1 runtime after this gate merges.

Stop after this gate is merged, reconciled, and post-merge validated.
