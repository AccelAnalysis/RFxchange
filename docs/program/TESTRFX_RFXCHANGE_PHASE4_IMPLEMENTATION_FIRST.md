# TestRFx → RFxchange Phase 4 — Implementation-First Authority

**Effective:** 2026-08-23

**Owner:** 00 — RFxchange Control Room

**Canonical production repository:** `AccelAnalysis/RFxchange`

**Controlled donor/reference repository:** `AccelAnalysis/TestRFx`

## Governing principle

> **Build everything that is technically possible now. Progressive availability handles unfinished functionality. Governance prevents architectural violations; it does not prevent implementation.**

This authority changes how Phase 4 convergence work is activated and sequenced. It does **not** change RFxchange production authority, security boundaries, domain ownership, or merge safety requirements.

## What this supersedes

For Phase 4 convergence, the following are no longer implementation blockers by themselves:

- a proposed work packet has not been separately declared `active`;
- another convergence wave has not completed first;
- a later feature in the same workflow does not yet have a canonical server command;
- an adjacent domain is incomplete;
- a future action is not yet operational;
- independent verification or certification has not occurred.

The work-packet decomposition remains useful for provenance, ownership, scope, evidence, and conflict avoidance. It is **not permission to begin coding** and its activation state may not hold technically valid work idle.

Any older convergence language such as “activation remains behind the current RFx packet chain” or “after Waves A–D” is now interpreted as a coordination preference, not a universal implementation prerequisite.

## Implementation rule

A Phase 4 feature should be implemented immediately when all of the following are true:

1. its canonical RFxchange identity can be determined;
2. existing production persistence can represent the required current truth, or the feature is presentation-only;
3. existing server authorization can protect the operation or the feature is read-only/public by design;
4. the implementation can use RFxchange Firebase/Mapbox/domain contracts without introducing a competing runtime;
5. unfinished consequential actions can remain visibly disabled or progressively available rather than being simulated;
6. the changed area can pass the relevant repository safety and acceptance checks.

A missing future function must not block implementation of the rest of a usable workflow.

## Progressive availability

Progressive availability is the default treatment for unfinished functionality.

- The Exchange shell remains open.
- Permanent lenses remain present when their current route is real.
- Actions may be visible but disabled when the canonical command, permission, or lifecycle transition does not yet exist.
- Disabled actions must not simulate success, persist browser-only production truth, or imply authority that the server has not granted.
- Completed portions of a workflow should remain usable even when later steps are unavailable.
- User-facing interfaces should use ordinary product language rather than internal governance or work-packet terminology.

## Governance is a guardrail, not a queue

Control Room governance continues to prevent architectural violations. It must not create artificial waiting between independent pieces of executable work.

Phase 4 work may proceed in parallel across Shared Exchange, RFx, Resources, Organizations/Media, Geography/Mapbox, Public, Identity/Onboarding, and supporting infrastructure when owned paths do not conflict materially.

Work packets remain useful to:

- record provenance and source TestRFx behavior;
- identify canonical RFxchange contracts;
- identify owners and changed paths;
- prevent duplicate implementation;
- record acceptance evidence;
- make remaining technical gaps explicit.

They do not create a second approval hierarchy.

## Production boundaries that remain absolute

The implementation-first rule does not authorize any of the following:

- TestRFx PostgreSQL, PostGIS, Neon, or SQL migrations as RFxchange production persistence;
- TestRFx custom/HMAC session infrastructure in place of Firebase Authentication;
- MapLibre/OpenFreeMap runtime code in place of the existing Mapbox production canvas;
- generic `exchange_records` persistence where RFxchange has canonical domain records/projections;
- browser-derived ownership, membership, role, permission, or lifecycle authority;
- direct client writes to protected canonical Firestore collections;
- dual writes or production synchronization between TestRFx and RFxchange;
- local browser state as canonical RFx, favorite, watch, pursuit, submission, organization, referral, or commercial truth;
- arbitrary iframe/video URLs or private Firebase Storage references on public Exchange cards;
- fabricated provider, organization, RFx, capability, Intelligence, referral, payment, or outcome records;
- approximate/centroid geocoding presented as an accepted exact source-backed location;
- weakening tenant isolation, revoked-membership handling, or existing authorization negatives.

Production truth remains:

- **Identity:** Firebase Authentication
- **Persistence:** Firestore
- **Server runtime:** Firebase Functions and existing governed Next server boundaries
- **Media source storage:** Firebase Storage
- **Production map:** Mapbox
- **Canonical application/domain implementation:** RFxchange

## Hard technical stop definition

A Phase 4 item is genuinely blocked only when completing that specific consequential behavior would require one or more technical primitives that do not yet exist and cannot be truthfully represented through existing RFxchange contracts.

Examples include:

- a canonical Firebase response-workspace persistence model when no current record can safely represent response state;
- an atomic hosted-submission command and committed receipt when no such server transaction exists;
- a protected provider-import staging/promotion command when importing directly would bypass canonical organization authority;
- a reviewed public-media projection when the only existing reference is a private Storage object.

When such a hard stop exists, Control Room must:

1. implement every surrounding technically valid experience now;
2. leave only the consequential unavailable operation disabled;
3. identify the exact missing primitive;
4. implement that primitive directly when it can be added safely within RFxchange;
5. report the item as blocked only when an external dependency, unresolved product decision, or missing production authority truly prevents implementation.

## Phase 4 execution model

The former sequential Wave A → B → C → D → E/F model becomes parallel implementation lanes.

### Shared visual and navigation lane

Implement immediately: media-first cards, reduced metadata, semantic icons, Menu decluttering, record actions, own-organization treatment, floating controls, thumb-zone/safe-area refinements, Mapbox-native marker treatment, and configured basemap choices.

### Mobile RFx lane

Implement all creation, reuse, definition, readiness, pursuit, Go/No-Go, response preparation, collaboration, external-submission, and continuity UX that can bind to current RFxchange RFx truth. Do not wait merely because later hosted submission or collaboration commands are incomplete. Missing consequential commands remain progressively unavailable until added.

### Resource provider lane

Implement the source-backed provider import model, Hampton Roads manifest handling, Census geocode decision migration, canonical comparison, unclaimed treatment, and claim handoff as soon as each can be bound to Firebase Admin/server authority. Do not wait for unrelated RFx work.

### Organization/media lane

Implement organization logo/image/poster and normalized allowlisted YouTube/Vimeo introduction media whenever existing organization/profile authority can own the metadata. Direct hosted media publication remains unavailable until a safe public projection exists; private Storage references stay private.

### Mapbox presentation lane

Implement desired focus, 2.5D depth, anchored marker, transition, reduced-motion, marker/card synchronization, and licensed/configured basemap choices directly against the existing Mapbox canvas. No MapLibre implementation dependency is allowed.

### Public/onboarding lane

Compare and implement genuine TestRFx experience improvements immediately where RFxchange already has canonical identity/onboarding/public persistence. Do not create a second onboarding, organization, membership, or commercial model.

## Merge and acceptance rule

Implementation-first does not mean test-last or unsafe merge.

Each convergence PR must pass the checks relevant to what it changes, including current repository architecture/security tests and exact-head production CI where configured. Firebase emulator, tenant-isolation, Storage, Mapbox/browser, 390px, localization, reduced-motion, and build-identity checks remain required when the changed area touches those boundaries.

Independent verification/certification is not a universal implementation or merge prerequisite.

## Phase 4 completion condition

Phase 4 is complete when:

1. every TestRFx feature selected for Phase 4 that is technically possible against current RFxchange production contracts has been implemented;
2. progressive availability exposes the usable surrounding experience for unfinished consequential operations;
3. every remaining unimplemented item has an explicit hard technical stop;
4. each hard stop names the missing primitive or external dependency and the concrete work required to remove it;
5. no remaining item is blocked solely by wave order, packet activation, stale governance text, or certification state.
