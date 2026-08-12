# Referrals completion inventory — WP-REF-INVENTORY-01

**Packet:** `WP-REF-INVENTORY-01`

**Lane:** `05 — Referrals`

**Packet state at execution:** `active`

**Activation epoch:** `initial-operational-2026-08-12`

**Immutable activation base:** `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`

**Execution branch:** `codex/referrals-completion-inventory-01`

**Branch start:** current merged `main` `69daa4bea80b39cc9d5ed04715aa6e2ac8e1f068`

**Change class:** documentation/evidence only; no production Referral implementation in this packet.

## 1. Stop boundary

This inventory does **not** implement Referral production gaps, alter Referral lifecycle/domain semantics, create a third-party referral integration, broaden recipient authority, invent outcomes, create a private Shared Exchange contract, alter tracker arithmetic, or promote any Four-Lens requirement to `Verified`.

Historical Wave 3 Feature-ID completion remains separate from Four-Lens experience verification. The Four-Lens ledger controls `REF-LENS-*` assurance state and only Independent Acceptance may record `Verified`.

## 2. Authorities and runtime inspected

Program/cross-cutting authority:

- `/AGENTS.md`
- `docs/program/FOUR_LENS_PROGRAM_AUTHORITY.md`
- `docs/program/FOUR_LENS_EXPERIENCE_LEDGER.md`
- `docs/program/PARALLEL_DELIVERY_MATRIX.md`
- `docs/program/SHARED_EXCHANGE_CONTRACTS.md`
- `docs/program/INDEPENDENT_ACCEPTANCE_PROTOCOL.md`
- `docs/program/CHAT_LANE_CHARTERS.md`
- `governance/four-lens-requirements.json`
- `governance/four-lens-workstreams.json`
- `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md`
- `docs/program/SHARED_EXPERIENCE_COMPLETION_BACKLOG.md`

Referral/acquisition/communications authority:

- `docs/slices/SLICE_3_5_EXECUTION_AUTHORITY.md`
- `docs/architecture/WAVE_3_SLICE_3_5.md`
- `docs/architecture/POST_WAVE_3_STABILIZATION_1B_REFERRAL_TRANSACTION_INTEGRITY.md`
- `docs/slices/SLICE_3_1_TRANSACTIONAL_COMMUNICATIONS_RELIABILITY.md`
- `docs/context/ACQUISITION_AND_RETENTION.md`

Brand/design/content and sequencing authority:

- `docs/brand/CONTENT_AND_MESSAGING_SYSTEM.md`
- `docs/brand/MAP_AND_DATA_VISUAL_GRAMMAR.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- `docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md`
- `docs/tracking/RFxchange_DEPENDENCY_MAP.md`

Current runtime/security/evidence seams:

- `app/referrals/page.tsx`
- `app/api/referrals/route.ts`
- `src/components/referrals/ReferralWorkspace.tsx`
- `src/domain/referrals/model.ts`
- `src/application/referrals/referral-network.ts`
- `src/infrastructure/firestore/referrals.ts`
- `firestore.rules`
- `src/application/participant/participant-spatial-context.ts`
- `test/post-pr159-participant-experience-convergence.test.mjs`
- `scripts/validate-referral-network.mjs`
- `scripts/validate-referral-create-and-send.mjs`

## 3. Authority-to-runtime inventory

This table describes current implementation presence, not independent acceptance.

| Requirement | Inventory disposition | Current evidence | Residual / governance note |
| --- | --- | --- | --- |
| `REF-LENS-001` | **Present — Implemented, not verified** | One sending organization and one exact existing organization or external intended recipient. Role-specific projections render the actual counterparty; existing recipient identity is server re-resolved. | Do not broaden external intended-recipient semantics beyond Slice 3.5. |
| `REF-LENS-002` | **Present — Implemented, not verified** | Participant creation uses atomic `create-and-send`; the server resolves current participant authority and re-authorizes `referral.manage`; existing recipients are current-server resolved; external recipients use governed acquisition continuity. | Client/URL state never grants authority. |
| `REF-LENS-003` | **Present — Implemented, not verified** | Aggregate supports `draft`, `sent`, `accepted`, `declined`, `contacted`, `closed`, `expired`; expected-version transitions, commands and immutable events persist transactionally. Workspace exposes Accept, Decline, Contacted and Close as authorized by role/state. | `redirected` is a separately governed `REF-006` provider-routing extension, not a new generic lifecycle invented here. |
| `REF-LENS-004` | **Present — Implemented, not verified** | Send review binds exact recipient plus approved shared fields; consent is explicit; server education acknowledgement is keyed to the named recipient and exact shared fields; stale review data cannot silently authorize send. | Do not infer broader subject consent, agency, representation or permission. |
| `REF-LENS-005` | **Present — Implemented, not verified** | Sender/recipient projections are role-minimized; snapshots contain only referrals involving the authorized organization; direct browser access to Referral state/evidence collections remains denied. | Fresh negative-path Independent Acceptance still required. |
| `REF-LENS-006` | **Present — Implemented, not verified** | Relationship path exists only for a real permitted organization counterparty in `sent`, `accepted`, `contacted` or `closed`; otherwise workspace renders truthful no-path state. Historical browser evidence covers real paths and external no-path. | Depends on `SHARED-PRIVACY-002`; no green/outcome inference from send/accept/contact. |
| `REF-LENS-007` | **Present — Implemented, not verified** | `referral`, counterparty `organization`, selected marker, relationship ID and composer recipient synchronize. An incompatible marker selection clears the active referral instead of retaining a hidden recipient. Regression tests guard this parity. | Depends on `SHARED-SELECTION-001`; consume shared state, do not fork it. |
| `REF-LENS-008` | **Present — Implemented, not verified** | `/referrals?organization=...` is a requested focus only. Server discovery revalidates that exact organization; the requested ID is retained only when currently permitted. Stale/unauthorized input becomes null rather than substituting another recipient. | Depends on `SHARED-CONTINUITY-001`. `REF-LENS-011`/`SHARED-CONTINUITY-002` are outside this packet range. |
| `REF-LENS-009` | **Present — Implemented, not verified** | Repository snapshot queries both sent and attached-recipient records for the current organization. Workspace exposes counterparty, current status/need and sender/recipient role for review. | Requirement does not require separate Sent/Received tab chrome; no extra UI requirement is invented here. |
| `REF-LENS-010` | **Missing / Not Started — authority decision required before implementation** | No governed star relation exists in the Referral domain, no star persistence/API action exists, and `ReferralWorkspace` has no Starred relation/view. | The requirement permits Starred only when a governed private star relation exists. Ownership/cardinality/visibility/idempotency/audit/retention semantics are not currently defined and must not be invented. |

Inventory result:

- Present: `REF-LENS-001` through `REF-LENS-009`.
- Missing / Not Started: `REF-LENS-010`.
- Partial inside `001`–`010`: none established by current evidence.
- Blocked inside `001`–`010`: none at implementation-presence level; `006`, `007`, `008` still cannot become `Verified` until declared Shared dependencies are independently resolved.
- Outside this packet: `REF-LENS-011` remains blocked by `SHARED-CONTINUITY-002`; `REF-LENS-012` remains blocked until `001`–`011` and complete-lens acceptance resolve.

## 4. Runtime/browser evidence

Current runtime inspection confirms:

- `/referrals` revalidates session, lifecycle, map projection, requested referral and requested organization server-side;
- a `referral` deep link is selected only when it belongs to the current authorized snapshot;
- an `organization` focus is retained only when current authorized Network discovery returns it;
- invalid organization input does not fall back to another recipient;
- selecting a referral synchronizes URL, counterparty, relationship selection and composer recipient;
- selecting an incompatible marker clears the relationship before making that organization a potential recipient;
- the workspace exposes the governed participant transitions Accept, Decline, Contacted and Close; and
- path rendering is limited to real permitted organization counterparties and allowed referral states.

Retained configured-browser evidence used for inventory classification:

1. `docs/architecture/WAVE_3_SLICE_3_5.md` records disposable configured-browser acceptance for exact existing-organization sharing/consent, synchronized list/detail and real path, external no-path plus acquisition attachment, accept/contact/close progression, five locales, `1280px`/`820px`/`390px`, keyboard/focus semantics, clean console and zero-residual cleanup.
2. `docs/architecture/POST_PR_159_PARTICIPANT_EXPERIENCE_CONVERGENCE.md` records configured Chrome/Firebase/Mapbox evidence for shared selection continuity including Intelligence → Resources → Referrals → Intelligence and Referrals marker/detail/composer convergence.
3. `test/post-pr159-participant-experience-convergence.test.mjs` currently guards exact organization focus hydration, URL/relationship/composer synchronization and no-recipient-substitution behavior.

These browser records are implementation evidence for the inventory only. They are not recast as current Four-Lens Independent Acceptance and do not create `Verified` status.

## 5. Domain/security evidence

Current source and focused validators establish:

- `ReferralNetworkService.authorize()` requires current `referral.manage` through the canonical organization-operation boundary;
- existing organization recipient identity is re-resolved from current organization/profile state;
- commands use stable identity and exact input fingerprints; a command cannot replay for different intent;
- participant create/send is one atomic persistence bundle;
- aggregate, immutable events, command receipt, education acknowledgement, audit evidence, communication intent and applicable external acquisition context are transactionally persisted;
- expected-version and persistence identity conflicts fail closed;
- direct client Firestore access is denied for Referral aggregate/evidence collections;
- `scripts/validate-referral-network.mjs` guards lifecycle, authority, acquisition, projection, path, localization and direct-client seams; and
- `scripts/validate-referral-create-and-send.mjs` guards atomic create/send, retry-stable replay, delivery authority and external acquisition persistence.

Lane 06 still requires fresh positive/negative domain-security evidence on the exact production candidate before `Verified`.

## 6. Exact bounded follow-up packets

### `WP-REF-STARRED-AUTHORITY-01` — documentation/domain decision only

Owner: Lane 05 — Referrals.

Requirement: `REF-LENS-010`.

Purpose: establish the missing governed private-star relation before production implementation.

The packet must decide explicitly, without assuming an answer:

- the authorized owner/scope of the private relation;
- exact referral eligibility and visibility for starring;
- create/remove/toggle and idempotency semantics;
- required event/audit evidence, if any;
- retention/removal when Referral visibility or organization authority changes;
- minimum projection;
- server authorization and direct-client denial; and
- truthfulness: Starred never implies acceptance, sale, award, endorsement, credibility or verified outcome.

Stop boundary: no production persistence/API/UI change.

If Control Room/product authority intends deferral or N/A instead, the explicit Four-Lens approval protocol must be used. Lane 05 cannot self-dispose of `REF-LENS-010`.

### `WP-REF-STARRED-IMPLEMENT-01` — conditional production packet

Owner: Lane 05 — Referrals.

Requirement: `REF-LENS-010` plus only the exact approved star-relation authority.

Dependency: completed `WP-REF-STARRED-AUTHORITY-01` with an implementation-authorizing decision.

Bounded output if authorized:

- server-authorized private star persistence/commands;
- role/visibility-safe projection;
- truthful Starred view/filter in the existing Referrals workspace;
- no Referral lifecycle/outcome expansion;
- direct-client denial and positive/negative idempotency tests;
- five-locale copy;
- desktop/mobile/keyboard/accessibility browser evidence; and
- exact-head CI before Lane 06 handoff.

### Independent Acceptance after implementation/dependency eligibility

A future Lane 06 packet for `REF-LENS-001`–`010` must execute every declared acceptance type from `governance/four-lens-requirements.json`.

The Shared dependency gates are explicit:

- `REF-LENS-006` → `SHARED-PRIVACY-002`
- `REF-LENS-007` → `SHARED-SELECTION-001`
- `REF-LENS-008` → `SHARED-CONTINUITY-001`

Complete Referrals acceptance additionally remains downstream of `REF-LENS-011` → `SHARED-CONTINUITY-002`.

## 7. Shared Contract Request disposition

**No new Shared Contract Request is recommended from this inventory.**

The current Shared spatial context already exposes per-lens `filters` plus selected organization/relationship and result/list state. A future approved Starred view should first consume that seam rather than adding Referrals-private continuity state.

The known Intelligence query-link defect is already represented by `SHARED-CONTINUITY-002` and the active Shared Experience correction packet. Referrals should consume that correction rather than duplicating it.

Conditional rule: if approved Starred implementation proves the current shared filter/continuity seam insufficient, Lane 05 must stop and file `SCR-REF-001` under `SHARED_EXCHANGE_CONTRACTS.md`. Do not pre-authorize the request or create a private workaround.

## 8. Merge sequence recommendation

1. Merge this inventory PR only after exact-head CI and genuinely independent review confirm it is accurate and documentation-only.
2. Control Room reconciles the result and activates `WP-REF-STARRED-AUTHORITY-01` from then-current merged `main`.
3. The active Shared correction for `SHARED-CONTINUITY-002` may proceed independently; Referrals must not duplicate it.
4. If Starred authority is approved, activate `WP-REF-STARRED-IMPLEMENT-01` from then-current merged `main` or an explicitly declared accepted dependency SHA.
5. Starred implementation passes exact-head CI and fresh review, then goes to Lane 06; Lane 05 does not promote it to `Verified`.
6. Lane 06 performs requirement acceptance only when declared Shared dependencies are independently resolved.
7. `REF-LENS-011` remains blocked until `SHARED-CONTINUITY-002` is independently accepted and merged.
8. Only after `REF-LENS-001`–`011` are independently resolved should Lane 06 evaluate `REF-LENS-012` complete-lens acceptance.
9. Lane 07 integrated QA runs after accepted component work merges and does not replace Lane 06.

## 9. Control Room disposition

The current Referrals implementation is materially stronger than a route-only or aggregate-only baseline. `REF-LENS-001` through `009` have current runtime/source evidence consistent with their existing `Implemented — Not Verified` ledger state. No basis was found to weaken or silently omit those requirements.

The only production gap inside this inventory range is `REF-LENS-010` Starred. It is not safe to implement immediately because the immutable requirement conditions the view on a governed private star relation and current Referral authority does not define that relation's ownership/persistence semantics.

No production Referral code, requirement status, tracker total, lifecycle state, outcome, recipient authority or Shared Exchange contract is changed by this packet.
