# Lane 01 Handoff — Exchange Room Phase 2

Work from current merged `main` after the Control Room activation PR merges.

Packet: `WP-EXCHANGE-ROOM-PHASE2-01`

Implementation branch: `lane01/exchange-room-phase2`

Read `docs/program/EXCHANGE_ROOM_PHASE2_CONTROL.md`, `docs/program/EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md`, and `docs/program/MARKET_READY_BASELINE.md` before changing production code.

## Frozen sixteen-action identity

Implement the exact IDs, visible labels and ordering in `EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md`. Do **not** select or rename the four actions per lens during implementation. Runtime inspection determines only whether each fixed action has a truthful real handler for the current context or must remain gray/disabled.

## Primary outcome

Build one shared Exchange Room lens controller and one canonical sixteen-action registry:

```text
active lens
→ exactly four action definitions
→ own/other selected-organization relationship
→ runtime availability + authorization/applicability
→ active or gray-disabled control
→ real handler only when active
```

The four permanent lenses are always visible and selectable:

```text
Opportunities/RFx | Resources | Intelligence | Referrals
```

Do not gray or disable an entire lens because functions inside it are incomplete.

Only the individual function button that cannot currently be used is gray/disabled. Preserve its normal label. Do not add participant-facing `Unavailable`, `Coming soon`, `Not yet available`, or equivalent status copy merely to explain the disabled state.

## Implementation sequence

1. Fetch current `main` and confirm the activation packet is merged/current.
2. Inspect the current Exchange Room, lens registry, selected-organization projection, spatial-context storage, participant navigation, and existing domain handlers.
3. Read all four current lens/domain authorities to understand the frozen action meanings and handler boundaries; do not rename or reinterpret the sixteen actions.
4. Implement the canonical sixteen-action registry exactly as frozen by Control Room.
5. Implement the Room lens controller so lens switching does not abandon/reset the shared map workspace.
6. Project the same registry against own organization and authorized selected external organization.
7. Attach existing real handlers where already authorized/operational.
8. Leave non-operational/non-applicable/non-authorized individual actions labeled but gray/disabled and completely non-actionable.
9. Preserve server-side domain authorization and selected-organization revalidation.
10. Add focused tests, desktop/mobile configured-browser evidence, accessibility, localization, and exact-head CI evidence.
11. Open one PR back to `main`; do not merge or deploy it from Lane 01.
12. Return exact candidate SHA/evidence to Control Room as `Implemented — Not Verified` at most.

## Hard stop boundary

Do not implement missing RFx, Resources, Intelligence, Referral, Teaming, messaging, notification, payment, or billing domain features under this packet. Do not create demo/fake active handlers. Do not change tracker arithmetic or mark any requirement `Verified`.
