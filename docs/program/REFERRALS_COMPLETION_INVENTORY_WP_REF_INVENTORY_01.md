# Referrals completion inventory — WP-REF-INVENTORY-01

**Packet:** `WP-REF-INVENTORY-01`  
**Lane:** `05 — Referrals`  
**Packet state at execution:** `active`  
**Activation epoch:** `initial-operational-2026-08-12`  
**Immutable activation base:** `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`  
**Execution branch:** `codex/referrals-completion-inventory-01`  
**Branch start:** current merged `main` `69daa4bea80b39cc9d5ed04715aa6e2ac8e1f068`  
**Change class:** documentation/evidence only; no production Referral implementation in this packet

## 1. Stop boundary

This inventory does **not** implement Referral production gaps, alter Referral lifecycle/domain semantics, create a third-party referral integration, broaden recipient authority, invent outcomes, create a private Shared Exchange contract, or promote any Four-Lens requirement to `Verified`.

Historical Wave 3 Feature-ID completion remains separate from Four-Lens experience verification. `REF-001` through `REF-005` remain historically Done in the Master Build Tracker. The Four-Lens ledger remains authoritative for `REF-LENS-*` assurance state, where only Independent Acceptance may record `Verified`.

## 2. Authorities and runtime inspected

Program and cross-cutting authority:

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

Brand/design/content authority:

- `docs/brand/CONTENT_AND_MESSAGING_SYSTEM.md`
- `docs/brand/MAP_AND_DATA_VISUAL_GRAMMAR.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`

Tracker/dependency authority:

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

The classification below describes **current implementation presence**, not independent acceptance.

| Requirement | Inventory disposition | Current evidence | Residual / governance note |
| --- | --- | --- | --- |
| `REF-LENS-001` | **Present — Implemented, not verified** | Current domain uses exactly one sending organization and one exact existing organization or external intended recipient. `ReferralWorkspace` renders counterparty identity from role-specific projections; server composition re-resolves existing recipient identity. | No new sender/recipient semantics authorized. External intended-recipient support remains the bounded Slice 3.5 acquisition model. |
| `REF-LENS-002` | **Present — Implemented, not verified** | Participant creation uses atomic `create-and-send`; server route resolves the authenticated participant organization; every service operation re-authorizes `referral.manage`; existing recipient IDs/labels are server re-resolved; external recipients use the governed acquisition path. | Client/URL state remains non-authorizing. Fresh Independent Acceptance is still required. |
| `REF-LENS-003` | **Present — Implemented, not verified** | Current aggregate has `draft`, `sent`, `accepted`, `declined`, `contacted`, `closed`, `expired`; expected-version transitions, command receipts and append-only events are persisted transactionally. Workspace exposes recipient Accept/Decline, either-party Contacted, and sender Close actions and renders truthful status. | `redirected` is a separately governed provider-routing extension introduced by the later `REF-006` domain and is not generalized into ordinary referral semantics by this packet. |
| `REF-LENS-004` | **Present — Implemented, not verified** | Composer review uses an exact recipient and the approved shared field set; consent must be explicit. Server education acknowledgement is keyed to named recipient plus exact shared fields; send/create-and-send fails if the reviewed label/data no longer matches current authority. | Do not infer broader subject consent, representation, agency or permission. |
| `REF-LENS-005` | **Present — Implemented, not verified** | Sender/recipient projections are role-minimized; snapshots are limited to referrals involving the currently authorized organization; direct browser access to referral, event, command, education and communications collections remains server-managed/denied. | Requires fresh negative-path Independent Acceptance before `Verified`. |
| `REF-LENS-006` | **Present — Implemented, not verified** | Workspace creates a relationship path only when the selected referral has a real permitted organization counterparty and status is `sent`, `accepted`, `contacted` or `closed`; otherwise it renders the truthful no-path text. Historical configured-browser evidence covers real two-endpoint paths and external no-path behavior. | Depends on `SHARED-PRIVACY-002`; that Shared requirement still requires Independent Acceptance. Green/outcome path treatment is not implied by send/accept/contact. |
| `REF-LENS-007` | **Present — Implemented, not verified** | Current page/workspace synchronize `referral`, counterparty `organization`, selected marker, relationship ID and composer recipient. Marker changes clear an incompatible referral selection instead of leaving a hidden recipient. Regression tests guard marker/detail/URL/composer parity. | Depends on `SHARED-SELECTION-001`; use the shared seam and do not fork it. |
| `REF-LENS-008` | **Present — Implemented, not verified** | `/referrals?organization=...` is treated as a requested focus only. The server loads authorized Network discovery for that exact focus and accepts the requested organization only if it exists in the current permitted projection; stale/unauthorized input becomes null rather than substituting another recipient. | Depends on `SHARED-CONTINUITY-001`. The separate `REF-LENS-011` remains downstream of the `SHARED-CONTINUITY-002` correction and is outside this inventory range. |
| `REF-LENS-009` | **Present — Implemented, not verified** | Repository snapshot queries both sent and attached-recipient records for the authorized organization. Workspace lists them together, exposes counterparty identity, current status/need and sender/recipient role in selected detail. | The immutable requirement requires review of Sent/Received history, not separate tab chrome. No separate-view requirement is invented here. |
| `REF-LENS-010` | **Missing / Not Started — authority decision required before implementation** | No governed Referral star relation exists in `src/domain/referrals/model.ts`; no star persistence collection/repository API exists; `/api/referrals` has no star action; `ReferralWorkspace` has no Starred relation or view. | The immutable requirement explicitly permits a Starred view **only when a governed private star relation exists**. Ownership/cardinality/visibility/idempotency/audit/retention semantics are not defined by the current Referral aggregate and must not be invented by implementation. |

### Inventory result

- **Present:** `REF-LENS-001` through `REF-LENS-009`.
- **Missing / Not Started:** `REF-LENS-010`.
- **Partial inside `001`–`010`:** none established by current evidence.
- **Blocked inside `001`–`010`:** none at implementation-presence level; however `REF-LENS-006`, `007`, and `008` cannot become `Verified` until their declared Shared dependencies are independently resolved.
- **Outside this packet:** `REF-LENS-011` remains blocked by `SHARED-CONTINUITY-002`; `REF-LENS-012` remains blocked until `001`–`011` and complete-lens acceptance are resolved.

## 4. Runtime/browser evidence

### Current-runtime inspection

Current merged runtime confirms:

- `/referrals` revalidates session, membership/lifecycle, map projection, requested referral and requested organization server-side;
- a requested referral deep link is selected only when it exists in the participant's current authorized referral snapshot;
- a requested organization is selected only when it appears in the current authorized Network discovery projection;
- no invalid organization falls back to `organizations[0]` as a recipient;
- selecting an existing referral synchronizes `referral`, counterparty `organization`, spatial relationship selection and composer recipient;
- selecting an incompatible organization marker clears the active referral relationship before making that organization the potential recipient;
- the current workspace exposes the authorized lifecycle actions Accept, Decline, Contacted and Close; and
- path rendering is limited to real permitted organization counterparties and allowed referral states.

### Browser evidence available for inventory

Historical configured-browser evidence remains applicable as implementation evidence because this packet makes no production change:

1. `docs/architecture/WAVE_3_SLICE_3_5.md` records configured acceptance with disposable OPEN users/organizations proving:
   - exact existing-organization referral sharing and consent;
   - synchronized list/detail and a real two-endpoint Sent path;
   - an external referral with no fabricated endpoint/path;
   - acquisition continuity, explicit attachment, recipient acceptance/contact and sender close;
   - five locales;
   - desktop `1280px`, intermediate `820px`, mobile `390px`;
   - keyboard/focus semantics and clean console;
   - exact cleanup/zero residuals.
2. `docs/architecture/POST_PR_159_PARTICIPANT_EXPERIENCE_CONVERGENCE.md` records configured Chrome/Firebase/Mapbox evidence for the shared participant scene, including Intelligence → Resources → Referrals → Intelligence selection continuity and current Referrals marker/detail/composer convergence.
3. `test/post-pr159-participant-experience-convergence.test.mjs` currently guards exact organization focus hydration, URL/relationship/composer synchronization and no-recipient-substitution behavior.

These records support **inventory classification only**. They are not recast as current Four-Lens Independent Acceptance and do not create `Verified` status.

## 5. Domain/security evidence

Current source and focused validators establish the following implementation facts:

- `ReferralNetworkService.authorize()` requires current `referral.manage` via the canonical organization-operation authorization boundary before commands and snapshots.
- Existing recipient organization identity is re-resolved from current organization/profile state before persistence.
- Create/send uses stable command identity and exact input fingerprints; replay cannot reuse a command for different intent.
- The current participant flow uses one atomic create-and-send persistence bundle rather than independently persisting a draft and later send.
- Firestore persistence records aggregate, append-only events, command receipt, education acknowledgement, audit evidence, communication intent and external acquisition context transactionally where applicable.
- Expected-version and transaction identity conflicts fail closed.
- Direct client Firestore reads/writes are denied for referral aggregate, event, command, education and communication collections.
- `scripts/validate-referral-network.mjs` statically guards lifecycle, permission, acquisition, projections, path, localization and direct-client rule seams.
- `scripts/validate-referral-create-and-send.mjs` guards atomic create/send, stable replay, delivery-authority claiming, external acquisition persistence and unknown-delivery safety.

The required Lane 06 domain/security acceptance remains a fresh positive/negative runtime or emulator exercise on the exact production candidate; this report does not substitute for it.

## 6. Exact bounded follow-up packets

### A. `WP-REF-STARRED-AUTHORITY-01` — documentation/domain decision only

**Owner:** Lane 05 — Referrals  
**Requirement:** `REF-LENS-010`  
**Purpose:** establish the missing governed private-star relation before any production implementation.

The packet must define, without presupposing the answer:

- whether the private relation belongs to a participant, membership, participant organization or another already-authorized subject;
- the exact referral eligibility/visibility boundary for starring;
- create/remove/toggle semantics and command idempotency;
- whether any audit/event evidence is required;
- retention/removal behavior when referral visibility or organizational authority changes;
- minimum projection returned to the workspace;
- direct-client denial and server authorization boundary; and
- truthfulness rule that Starred never implies acceptance, sale, award, endorsement, credibility or verified outcome.

**Stop boundary:** no production persistence, API or UI changes.

If Control Room/product authority instead intends a deferral or N/A, it must use the explicit Four-Lens independent approval protocol; Lane 05 cannot self-dispose of `REF-LENS-010`.

### B. `WP-REF-STARRED-IMPLEMENT-01` — conditional production packet

**Owner:** Lane 05 — Referrals  
**Requirements:** `REF-LENS-010` plus only the exact newly approved star-relation authority  
**Dependency:** `WP-REF-STARRED-AUTHORITY-01` completed with an implementation-authorizing decision.

Expected bounded implementation, if authorized:

- server-authorized private star persistence/commands;
- role/visibility-safe projection;
- a truthful Starred view/filter using the existing Referrals workspace;
- no modification of Referral lifecycle/outcome semantics;
- direct-client denial;
- idempotent positive/negative tests;
- five-locale participant copy;
- desktop/mobile/keyboard/accessibility browser evidence; and
- exact-head CI before handing the candidate to Lane 06.

### C. Independent Acceptance packet(s)

Control Room should bind Lane 06 only after exact implementation candidates and declared dependencies are known.

A complete `REF-LENS-001`–`010` acceptance pass must cover each declared acceptance type from `governance/four-lens-requirements.json`. In particular:

- `REF-LENS-001`: functional, domain-security, copy;
- `002`: functional, domain-security, browser-visual, accessibility;
- `003`: functional, domain-security, browser-visual, copy;
- `004`: functional, domain-security, browser-visual, accessibility, copy;
- `005`: functional, domain-security;
- `006`: functional, domain-security, browser-visual;
- `007`: functional, domain-security, cross-lens;
- `008`: functional, domain-security, cross-lens;
- `009`: functional, domain-security, browser-visual, accessibility;
- `010`: functional, domain-security, browser-visual, copy.

`REF-LENS-006`, `007`, and `008` cannot become `Verified` until `SHARED-PRIVACY-002`, `SHARED-SELECTION-001`, and `SHARED-CONTINUITY-001`, respectively, satisfy the program's dependency/acceptance rules.

Full Referrals completion (`REF-LENS-012`) additionally remains downstream of `REF-LENS-011`, which depends on `SHARED-CONTINUITY-002`.

## 7. Shared Contract Request disposition

**No new Shared Contract Request is recommended from this inventory.**

The current shared spatial contract already supplies a per-lens `filters` record plus selected organization/relationship and result/list state. A future authorized Starred view should first consume that existing shared filter seam rather than adding Referrals-private continuity state.

The known selected-organization Intelligence query-link defect is already represented by `SHARED-CONTINUITY-002` and the active Shared Experience correction packet. Referrals should consume the accepted shared correction rather than filing a duplicate request.

**Conditional rule:** if the approved Starred implementation proves that the existing shared filter/continuity seam cannot represent the required behavior without changing shared persistence or cross-lens semantics, Lane 05 must stop and file `SCR-REF-001` under `SHARED_EXCHANGE_CONTRACTS.md`. Do not pre-authorize that request or create a private workaround.

## 8. Merge sequencing recommendation

1. Merge this inventory PR only after exact-head CI and independent review confirm it remains documentation/evidence-only and accurately describes current runtime.
2. Control Room reconciles the inventory result and activates `WP-REF-STARRED-AUTHORITY-01` from then-current merged `main`.
3. The existing Shared Experience correction for `SHARED-CONTINUITY-002` may proceed independently in Lane 01; Referrals must not duplicate it.
4. If Starred authority is approved, Control Room activates `WP-REF-STARRED-IMPLEMENT-01` from then-current merged `main` (or from an explicitly named accepted dependency SHA if necessary).
5. Starred implementation passes exact-head CI and fresh review, then is handed to Lane 06; it is not self-promoted to `Verified` by Lane 05.
6. Lane 06 performs requirement acceptance only after the relevant Shared dependencies are independently resolved. Acceptance may be split by dependency eligibility or performed as one Referrals acceptance packet after all declared dependencies are satisfied.
7. `REF-LENS-011` remains blocked until the Shared `SHARED-CONTINUITY-002` correction is independently accepted and merged.
8. Only after `REF-LENS-001`–`011` are independently resolved should Lane 06 evaluate `REF-LENS-012` complete-lens acceptance.
9. Lane 07 performs integrated cross-lens QA after accepted component work merges; Lane 07 does not replace Lane 06.

## 9. Control Room disposition

The current Referrals implementation is materially stronger than a route-only or aggregate-only baseline: requirements `REF-LENS-001` through `009` have current runtime/source evidence consistent with their existing `Implemented — Not Verified` ledger status. The inventory found no basis to weaken, delete or reclassify those original requirements.

The only production gap inside this packet range is `REF-LENS-010` Starred. That gap is not safe to implement immediately because the immutable requirement itself conditions the view on a **governed private star relation**, and current Referral authority does not define that relation's ownership/persistence semantics.

No production Referral code was modified by `WP-REF-INVENTORY-01`. No requirement status, tracker total, lifecycle state, outcome, recipient authority or Shared Exchange contract was changed.
