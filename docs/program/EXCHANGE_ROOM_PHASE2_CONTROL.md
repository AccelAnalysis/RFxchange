# Exchange Room Phase 2 — Lens Controller + 16-Action Registry

**Owner:** 00 — RFxchange Control Room

**Implementation owner:** 01 — Shared Exchange Platform

**Delivery model:** Build → Release → Verify

**Release class:** Elevated

**Packet:** `WP-EXCHANGE-ROOM-PHASE2-01`

**Activation epoch:** `exchange-room-phase2-2026-08-13`

**Immutable activation base:** `10150e66b4a1b37a0cda5381986c5599da96e632`

## Product objective

RFxchange is now being driven to one market-ready baseline:

```text
register
→ establish organization
→ enter the Exchange Room
→ see the real market
→ see and understand all four permanent lenses
→ join Founding Membership
→ pay
→ return as a recognized paying Founding Member
```

Phase 2 supplies critical value-presentation infrastructure inside that baseline. It does not require all sixteen functions to be complete before launch.

The Exchange Room remains the permanent operating surface. The four lenses are permanent views of the same Exchange, not four standalone applications.

Permanent order:

```text
Opportunities/RFx | Resources | Intelligence | Referrals
```

## Authority reconciliation — lens container versus function availability

The adopted `SHARED-TRUTH-001` requirement is immutable historical authority and is not rewritten by this packet. Its original capability-truthfulness language says an unavailable permanent lens remains visible, explicit, non-actionable and non-current.

The current explicit product-owner instruction intentionally changes the product model for the **lens container** in Phase 2. Under the authority order in `AGENTS.md`, this packet is the bounded successor/reconciliation for that behavior:

- all four permanent lenses are real selectable contexts of the same shared Exchange Room;
- selecting a lens does not assert that every function in that lens exists or is complete;
- therefore the lens container itself is not treated as an unavailable feature merely because one or more functions are unfinished;
- capability truthfulness moves to the individual action projection inside the selected lens;
- domain routes, data and protected operations remain independently authorized and are never granted by selecting the lens.

This is not permission to create a fake standalone runtime for an unfinished domain. The real runtime for every permanent lens is the shared Exchange Room controller plus that lens's truthful action projection. Existing dedicated domain routes are handlers/deep links only when real and authorized.

The old `SHARED-TRUTH-001` text remains preserved in `governance/four-lens-requirements.json`; Independent Acceptance for this packet must evaluate the current explicit task plus this successor authority rather than silently changing the historical requirement text.

## Non-negotiable presentation rule

Every permanent lens is always visible and selectable for a qualified participant in the Exchange Room.

**Never gray, hide, disable, or replace an entire lens merely because one or more functions inside it are unfinished.**

Each lens exposes exactly four stable action positions.

For each action position:

- if the function is currently operational and authorized for the current viewer/selected-organization relationship, render the action as a normal active control;
- if the function is not operational, not applicable to the current relationship, or not authorized for that participant, render only that individual action control in the governed disabled/gray state;
- the disabled action retains its normal function label so the value architecture remains legible;
- do not add **visible** participant-facing status copy such as `Unavailable`, `Not yet available`, `Coming soon`, `In development`, or equivalent explanatory verbiage merely to explain the disabled state;
- the projection must still distinguish internally between at least `not-operational`, `not-applicable`, and `not-authorized`; those states must not be collapsed in authorization logic or evidence;
- disabled presentation must not rely on color alone: use native disabled behavior and/or `aria-disabled`, appropriate disabled affordance beyond hue alone, and assistive semantics while preserving the normal visible function label;
- if an assistive description is required to satisfy accessibility, it may be visually hidden rather than adding visible status prose to the action grid;
- disabled actions have no usable href, command, modal trigger, drawer trigger, route transition, mutation, or protected workflow invocation.

The interface should communicate the complete shape of the Exchange through stable lens and action labels, while active versus gray action controls quietly communicate what can be used now.

## Shared controller contract

Implement one shared, data-driven controller with this conceptual flow:

```text
active lens
→ exactly four action definitions
→ viewer organization / selected organization relationship
→ runtime availability + authorization/applicability projection
→ render active or gray-disabled action
→ handler when active
```

Handlers may resolve only to governed existing mechanisms such as:

- modal;
- drawer;
- route/deep link;
- command/action adapter.

A registry entry does not grant domain authority.

Client presentation state is never server authorization.

## Lens switching and Room continuity

Switching among the four lenses must change the participant's lens/action context **without rebuilding or abandoning the Exchange Room**.

Preserve, where still authorized:

- map instance/session;
- camera/zoom/bearing/pitch;
- current geography;
- search/filter context where shared/governed;
- current authorized selected organization;
- map/list/detail selected-object coherence;
- own-organization standing context;
- mobile drawer/bottom-sheet state where appropriate;
- desktop result/detail context where appropriate.

Ordinary lens switching must not produce a competing standalone application or reset the map merely because the lens changed.

Existing dedicated routes may remain as deep links, adapters, or domain workspaces where authoritative, but the participant's permanent lens selector inside the Room must operate as a lens controller for the same Exchange.

## Selected organization projection

The same controller/registry serves both:

- the participant's own authorized organization; and
- an authorized selected external organization.

Action projection may differ by relationship. The registry must not fork into unrelated self/other implementations.

Changing selected organization must recompute the four visible action states for the active lens without losing the shared Room context.

Stale or cross-scope client selection remains non-authorizing and must fail closed through existing server revalidation.

## Sixteen-action registry

Create one canonical registry containing exactly four governed action definitions for each permanent lens, for a total of sixteen stable action definitions.

Action names and domain meaning must be sourced from current approved lens/domain authorities and current accepted product direction. Lane 01 must not invent missing RFx, Resource, Intelligence, or Referral domain behavior simply to make a button active.

Where a governed action label/value proposition exists but its real handler is not yet operational, the registry still renders the stable labeled action in its disabled/gray state.

Where current authority genuinely conflicts or does not support a proposed action meaning, stop on that individual action definition and surface the conflict to Control Room rather than fabricating semantics.

The registry must separate at least:

- stable action identity;
- owning lens;
- localized label key;
- relationship/applicability projection;
- runtime availability;
- authorization outcome or safe projection input;
- disabled reason state (`not-operational`, `not-applicable`, `not-authorized`, or a stricter governed equivalent);
- handler kind;
- handler target/adapter when active;
- disabled state when inactive.

The participant-facing action grid may present those disabled reasons through the single governed gray/disabled treatment without visible status prose, but tests/evidence must prove the reasons remain semantically distinct and do not widen authorization.

Do not encode authorization solely as client-visible booleans if the protected operation requires server authority.

## Existing functionality

Attach existing legitimate functionality to the registry through adapters/handlers where possible.

Do not rebuild a domain feature merely to satisfy the registry.

Do not create fake handlers, demo-only success paths, placeholder protected routes, fabricated organizations, fabricated opportunities, fabricated resources, fabricated intelligence, or fabricated referrals.

A disabled labeled action is preferable to a fake active action.

## Lens visibility invariant

The existing navigation architecture currently treats all four permanent lenses as governed participant destinations. Phase 2 strengthens this into a Room invariant:

```text
lens existence/visibility/selectability
≠
action availability
```

Function availability must never determine whether the parent lens exists in the participant interface.

## Security and authority boundaries

Preserve all existing authority for:

- authentication;
- session validation;
- organization membership and authority;
- tenant isolation;
- wrong-organization handling;
- geography/release restrictions;
- privacy-safe organization projection;
- RFx operations;
- Resource/provider operations;
- Referral operations;
- lifecycle/restriction handling;
- protected direct routes.

A gray button is presentation only. It is never the security boundary.

## Phase 1 evidence debt

Phase 1 merged and the canonical Firebase App Hosting rollout succeeded on exact merged-main SHA `10150e66b4a1b37a0cda5381986c5599da96e632`.

The optional authenticated real-Mapbox production health journey has not yet been independently exercised from the available Control Room tool environment. That remains explicit production-health evidence debt.

The product owner has directly authorized Phase 2 to proceed while preserving that debt. This does **not** convert the missing Phase 1 map-health evidence into a pass, does not mark Phase 1 `Verified`, and does not complete Stabilization 2C.

If Phase 2 implementation exposes an actual Shared Room/map/selection regression, route that bounded defect through Lane 01 rather than treating the prior evidence limitation as automatically satisfied.

## Market-ready baseline relationship

Phase 2 is critical because customers must see the value architecture before every function is finished.

The market-ready baseline does **not** require all sixteen actions to be active. It requires:

1. a legitimate participant can register and establish an organization through existing activation authority;
2. the participant can enter the real Exchange Room and see the authorized market;
3. all four permanent lenses are visible/selectable;
4. every lens exposes exactly four stable function labels;
5. only the individual non-usable function buttons are gray/disabled;
6. active actions are truthful and authorized;
7. the participant can reach and complete the separately governed Founding Membership payment journey.

Founding Membership/Stripe completion is a separate commercial seam and is not implemented by this packet unless an existing membership action is merely being attached as an already-authorized handler.

## Owned implementation surface

Lane 01 may change shared participant infrastructure needed for this contract, including as necessary:

- participant lens registry/controller;
- shared Room shell/navigation;
- shared action registry/projection;
- selected-organization action projection;
- shared spatial-context continuity;
- localized participant action labels;
- shared action button presentation;
- focused tests/acceptance scripts/evidence.

## Non-owned / stop boundary

Do not use this packet to implement missing domain behavior owned by Lanes 02–05.

Specifically do not expand scope into:

- new RFx transaction functionality;
- new Teaming functionality;
- new Resource Provider domain workflows;
- new referral lifecycle semantics;
- new Intelligence datasets/layers/analysis engines;
- messaging;
- notifications expansion;
- payments/billing implementation;
- commercial policy changes;
- tracker completion arithmetic;
- independent certification.

Do not create a second Exchange Room.

## Required implementation evidence

Lane 01 must produce one current-main candidate and show, at minimum:

- exactly four permanent lenses visible and selectable on desktop and mobile;
- exactly four action positions per lens / sixteen registry definitions total;
- lens switching without ordinary map reset or selected-organization loss;
- own versus external selected-organization projection from the same registry;
- active action handler continuity for existing authorized functions;
- disabled individual actions are gray and non-actionable;
- no whole-lens disabled treatment;
- no **visible** participant-facing `Unavailable` / `Coming soon` / equivalent action-status copy introduced by this packet;
- disabled reason states remain internally distinct and testable;
- disabled presentation is not color-only and preserves assistive semantics;
- disabled actions have no usable href/command/trigger;
- protected direct routes remain server-authoritative;
- stale/cross-scope selected organization remains non-authorizing;
- tenant/geography/privacy negative coverage remains green;
- keyboard/focus/accessibility behavior for active and disabled actions;
- five-locale coverage for any changed participant-visible labels;
- configured desktop/mobile browser evidence;
- exact-head production CI;
- no known material security/privacy/tenancy/integrity/authority/accessibility finding.

Real Mapbox configured-browser evidence should be included when the configured token/environment is available. Absence of that optional environment must remain explicit rather than silently reported as a map pass.

## Candidate disposition

Lane 01 may reach:

`Implemented — Not Verified`

It may not self-certify `Verified`.

Independent reviewer scarcity remains certification debt under Build → Release → Verify and is not, by itself, a universal implementation or merge prohibition for this post-amendment packet.

## Control Room merge/release expectation

Phase 2 is an Elevated shared participant-surface change. Control Room must inspect the exact candidate, current-main compatibility, exact-head CI/evidence, authority negatives, Room continuity, and rollback path before merge/release.

Merge, deployment, production health, and independent verification remain separate facts.
