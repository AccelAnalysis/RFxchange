# Exchange Room Foundation — Phase 1 Control Authority

**Owner:** 00 — RFxchange Control Room

**Implementation owner:** 01 — Shared Exchange Platform

**Delivery model:** Build → Release → Verify

**Release class:** Elevated

## Product decision

The Exchange Room is the permanent operating surface. Completion or Independent Certification of Opportunities/RFx, Resources, Intelligence, Referrals, Teaming, messaging, notifications, billing expansion, or the eventual 16-action registry is not a prerequisite for qualified participants to enter the Room.

The dependency direction is:

```text
Exchange Room
  → lens/action presentation contract
  → domain functions attach incrementally
```

A governed function may remain visible and unavailable. Visibility never grants domain authority.

## Activation truth

Control Room established current merged `main` at `4ca2a12f1d924ac559f87ebae0abc8fe42eac24b`; post-merge production CI #945 / run `31656864158` passed on that exact SHA.

Existing implementation candidates:

- PR #183 — `Open the Exchange shell with progressive availability` — exact preserved source head `b15d737bcf5292206f8d7119034c848aa3d8f73d`; historical exact-head production CI #940 / run `31654423623` passed.
- PR #174 — `Preserve Intelligence selected-organization continuity` — exact preserved source head `bc6d4f6dea158c7cdd359cc7bb64fd262e9bd7c1`; historical exact-head production CI #919 / run `31635109253` passed.

Both candidates predate current `main` and must be reconciled before merge.

## Convergence decision

PR #183 is the canonical convergence target. Do not create another Exchange shell and do not merge #174 independently merely to preserve process shape.

PR #174 supplies still-required Shared Exchange continuity that is absent from the preserved #183 head. Lane 01 must carry forward the substantive selected-organization contract:

```text
selected organization
→ search submission
→ Clear
→ previous/next pagination
→ safe Intelligence/Network return
→ server revalidation
→ coherent authorized selected organization
```

PR #174 may be superseded only after that behavior is present and evidenced in the reconciled Phase 1 candidate. Preserve #174's requirement and candidate provenance when closing/superseding it.

## Phase 1 production outcome

Phase 1 is release-ready when legitimate qualified participants can:

1. authenticate through existing authority;
2. enter the canonical Exchange/map workspace;
3. see their own authorized organization marker;
4. see authorized other-organization markers according to Network/geography/privacy authority;
5. search permitted organizations;
6. use synchronized map/list/detail selection;
7. preserve selected-organization context through governed search, Clear, pagination, and safe return behavior;
8. have carried selection revalidated server-side;
9. access Organization Profile;
10. skip first-value personalization;
11. see governed unfinished lenses/actions as visibly unavailable;
12. be unable to activate unavailable actions; and
13. remain subject to direct server-side authorization on protected domain routes.

Phase 1 explicitly does **not** require the final 16-action registry, full lens completion, Teaming, messaging, notifications, billing expansion, or Four-Lens `Verified` status.

## Authority boundary

The Room may expose navigation and action surfaces. It may not grant domain authority.

Preserve authentication, organization membership/authority, tenant boundaries, geography restrictions, privacy projections, RFx authority, Resource/provider authority, Referral authority, lifecycle restrictions, and server-side protected-route checks.

Unavailable functionality must have no usable navigation/command target. Direct URL requests remain independently authorized server-side.

## Requirement/provenance treatment

This packet directly carries the unresolved `SHARED-CONTINUITY-002` behavior from PR #174.

The participant's current explicit product direction intentionally changes older shell-entry assumptions that treated incomplete first-value/OPEN work as a prerequisite to entering the whole Exchange. Do not rewrite immutable historical requirement text or claim those historical requirements are thereby `Verified`. The current task and this bounded gate govern Phase 1 shell entry; OPEN/domain authority continues to govern protected actions.

`SHARED-EVIDENCE-001` remains historical certification debt and is not used as a universal pre-merge gate under the merged Build → Release → Verify amendment.

## Elevated merge gates

Before Phase 1 merge, Lane 01 must produce one exact candidate reconciled onto current `main` and show:

- exact-head production CI;
- focused controlled and OPEN lifecycle behavior;
- negative unauthenticated, restricted, wrong-organization, and unauthorized paths;
- tenant-isolation evidence;
- geography-release evidence;
- privacy/projection evidence;
- direct protected-domain-route negative tests;
- desktop and mobile configured-browser evidence;
- accessibility evidence;
- five-locale evidence for changed participant copy;
- #174 selected-organization continuity regression coverage; and
- no known material product/security/privacy/tenancy/integrity/authority/accessibility finding that makes merge unsafe.

Independent reviewer availability is not a Phase 1 merge gate. Independent certification remains required later for `Verified`.

## Elevated release gates

After merge:

- post-merge production CI must pass;
- use the existing canonical Firebase App Hosting path;
- record a rollback/containment path;
- Control Room must explicitly authorize release;
- verify the legitimate production participant journey for controlled and OPEN participants;
- do not fabricate organizations or domain activity;
- do not claim Stabilization 2C complete; and
- report the result as `Live in production — independent certification pending` if deployment is proven before Lane 06 certification.

## Stop boundary

Do not implement the Phase 2 Lens Controller + 16-Action Registry in this packet except for a tiny compatibility normalization strictly necessary to reconcile Phase 1. Do not implement missing RFx, Resources, Intelligence, Referrals, Teaming, messaging, notifications, billing, or commercial functionality. Do not change tracker completion or mark any requirement `Verified`.
