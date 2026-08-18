# Wave 4 Slice 4.7 — Gap resolution, teaming and external invite continuity

**Status: EXECUTION AUTHORITY — DOCUMENTATION ONLY.**

**Activated implementation basis:** `8f348c8c86a2a8eb1eeb6402a170a9120824d7ae` (PR #232 Control Room reconciliation; post-merge CI `32109036958` succeeded)

**Reconciled implementation basis:** `4a3d9042425b88170f16cbda6aff61ba875abea1` (PR #236 narrow ownership amendment; post-merge CI `32111575377` succeeded)

**Work packet:** `WP-MOBILE-EXCHANGE-RFX-47-01`

**Feature IDs:** `DSC-010`, `RSP-007`, `RSP-008`, `TEM-001`, `TEM-002`, `TEM-003`, `TEM-004`, `ACQ-007`

## 1. Authority and completion boundary

This document authorizes one later runtime implementation that turns a current, typed Slice 4.6 RFx gap into governed teammate or Resource discovery; supports RFx-scoped teammate search; creates one minimum-necessary invitation; allows the invited organization to review and accept or decline; records the nonbinding boundary; and preserves a nonmember's invitation context through ordinary account and organization activation.

This document is the required documentation-first output of the active Four-Lens packet. It does not itself complete a Feature ID, change tracker arithmetic, create an invitation, send a communication or begin response construction. Runtime implementation begins only after this authority is committed on the packet branch and the PR #232 merged-main dependency has successful post-merge CI.

Slice 4.7 is complete only when an authorized organization with a real `pursue` decision can select a current team-coverable gap from the exact reviewed fit snapshot, reuse current permitted organization or Resource discovery with that context, invite a specific organization or external recipient in a proposed capacity, and receive an independently authorized accept or decline decision. No invitation or acceptance creates a subcontract, joint venture, teaming agreement, response assignment, issuer relationship, qualification, endorsement, capacity promise or automatic RFx/response authority.

Browser state, an acquisition token, possession of an invitation URL, a discovery result, a capability match, an email address, commercial status or a prior permission result never grants organization or invitation authority.

## 2. Dependency result

| Dependency | Result |
| --- | --- |
| Slice 4.6 fit, pursuit and typed gaps | Satisfied by PR #171 final `dc17514ef9aed2dd37022b8bb121feb946bbcbf4`, merge `3cef29d8ce300154a8d73a262ec7a20252a49db6`, exact-head CI `31929740885` and post-merge CI `31930900200`; PR #232 reconciles its terminal evidence and tracker state. Only a current `pursue` relation and current team-coverable gap may open teammate invitation. |
| Wave 3 organization discovery | Satisfied and reused read-only. Slice 4.7 supplies RFx/gap criteria to the existing server-governed discovery service; it does not create a second directory, private index or client-side authority filter. |
| Wave 3 Resource discovery and consented provider connection | Satisfied through `RES-LENS-003` and `RES-LENS-007`. `RSP-008` creates only a safe context-preserving route into the existing provider projection/request boundary; it creates no provider record or duplicate provider workflow. |
| Acquisition continuity and communications | `ACQ-003` and `COMMS-003` are implemented. The existing acquisition envelope already recognizes `team-invitation`; Slice 4.7 must bind it to the invitation without token authority or auto-acceptance. |
| Stage 3 shared query/map/result/detail contracts | Satisfied through PRs #231 and #233. Slice 4.7 may consume the existing shared contracts but cannot edit or fork them. |
| PR #232 Control Room reconciliation | Merged as `8f348c8c86a2a8eb1eeb6402a170a9120824d7ae`; exact post-merge CI `32109036958` succeeded. |
| PR #236 narrow ownership amendment | Final head `2e30da4682a2c6869f37a2cd1194ab9a5b24f549`, exact-head CI `32111009507`, merge `4a3d9042425b88170f16cbda6aff61ba875abea1`, and post-merge CI `32111575377` succeeded. It owns only the five RFx locale catalogs and the already-bound team-invitation continuation hop needed by this slice. |
| B6c and Stabilization 2C | B6c remains separately eligible/Not Started. Stabilization 2C remains isolated release engineering and is not a product dependency. |

No dependency edge is widened. Slice 4.8 remains ineligible until this runtime is merged, post-merge acceptance is green and Control Room closes the exact packet.

## 3. Required sources

The runtime implementation must read and preserve the current versions of:

- `/AGENTS.md`;
- `docs/context/README.md`;
- `docs/context/PRODUCT_PRINCIPLES.md`;
- `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md`;
- `docs/context/RFX_TRANSACTION_CYCLE.md`;
- `docs/context/MAP_AND_GEOGRAPHY.md`;
- `docs/context/COMMERCIAL_MODEL.md`;
- `docs/program/FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md`;
- `docs/program/MOBILE_EXCHANGE_STAGES_3_6_AUTHORITY.md`;
- `docs/program/SHARED_EXCHANGE_CONTRACTS.md`;
- `docs/slices/WAVE_4_RFX_CORE_ROADMAP.md`;
- `docs/slices/SLICE_4_6_EXECUTION_AUTHORITY.md`;
- `docs/rfx/RFX_CORE_FEATURE_CROSSWALK.md`;
- `docs/rfx/RFX_CORE_PRODUCT_WORKSPACES.md`;
- `docs/rfx/RFX_CORE_ACCEPTANCE_MATRIX.md`;
- the current AMACS reconciliation/integration authorities;
- the current brand content, map, workspace, accessibility and design authorities; and
- the existing pursuit, Network organization-discovery, Resource discovery/connection, acquisition-context, communications, organization-operation authorization and participant-route implementations before introducing new contracts.

Synthetic orientation organizations and tutorial invitations are test-only. They never enter production discovery, invitation or acquisition state.

## 4. Gap-bound routing

`RSP-007` creates a server-derived immutable `RfxGapResolutionContext` for one current gap. It contains only:

- acting organization ID;
- opaque opportunity reference;
- current pursuit ID/version and exact `pursue` decision;
- current fit snapshot ID and explanation input digest;
- stable gap and published requirement references;
- gap kind, approved capability label/snapshot and `teamCoverageAllowed`;
- controlled geography IDs needed for the selected discovery query; and
- a bounded return destination for the same opportunity assessment.

The service rebuilds this context from the current permitted opportunity, fit snapshot, pursuit and gap facts. A client cannot supply or change organization, opportunity, requirement, capability, geography or coverage authority. Missing, stale, resolved, deferred, non-team-coverable, wrong-organization, wrong-opportunity, withdrawn, expired or non-`pursue` inputs fail closed.

`Find a teammate` is available only for a current `missing-capability` or `unconfirmed-capability` gap whose frozen requirement permits team coverage. `Find support` may be offered for an applicable current readiness gap but routes into the existing Resource discovery projection with an explicit, non-authorizing RFx context. Neither route marks the gap resolved.

## 5. Reused discovery

`DSC-010` and `TEM-001` adapt the existing Wave 3 organization discovery service. The teammate query is server-composed from the gap context and may narrow by:

- the missing canonical capability label/concept already present in the published snapshot;
- proposed team role/capacity;
- the controlled selected locality and permitted service-geography filter; and
- bounded participant-entered need text that cannot override the canonical capability or geography.

Only current active, unrestricted, privacy-safe public organization projections returned by the existing service may appear. The acting organization and issuer are excluded. A discovery candidate remains a potential teammate, not a recommendation, qualification, eligibility finding, capacity statement or endorsement. Exact capability overlap explains why the candidate appeared but cannot authorize an invitation or claim the organization can satisfy the RFx.

The implementation must not copy Network organizations into an RFx-owned directory, persist search results as authority, query private profiles/evidence, infer exact private location, create client-side ranking authority or introduce a second map/search framework.

`RSP-008` similarly delegates to the existing Resource discovery/request service. It preserves the opaque opportunity/gap return context while the Resources service independently controls provider status, service territory, eligibility, availability, consent and request-scoped communication. Slice 4.7 never creates or edits a provider, resource, provider request or referral aggregate.

## 6. Team invitation aggregate

`TEM-002` introduces one organization-owned `TeamInvitation` with stable identity and explicit version. The minimum authoritative record contains:

- lead organization and opaque opportunity reference;
- current pursuit/fit/gap/requirement provenance;
- one target: an existing organization or an external recipient email held only in the private invitation/communication boundary;
- proposed capacity/role and bounded responsibility summary;
- status `pending | accepted | declined | revoked | expired`;
- exact nonbinding-boundary version;
- actor user/membership audit evidence;
- expected-version, command/fingerprint and immutable event evidence; and
- acquisition/communication references only where an external invitation is actually issued.

The lead organization must have current `response.create` authority, an unrestricted active membership, a current `pursue` relation and current gap context at both command entry and commit. The target cannot be the lead or issuer. A duplicate active invitation for the same lead/opportunity/gap/target/capacity conflicts or returns exact replay; it does not create parallel active relations.

Participant-authored responsibility text is bounded and private to the lead and invited party. It is not a legal term, submission content, public profile statement or RFx amendment. The invitation exposes only the minimum RFx title/issuer label, proposed role, capability need, response responsibility, deadline context and nonbinding boundary required for an informed decision. Other responder assessment, economics, notes, candidate lists, private evidence and unrelated requirements remain absent.

## 7. Review, accept and decline

`TEM-003` provides one server-authorized review projection and decision command.

For an existing target organization, review and decision require a current authenticated user, active membership in the exact invited organization, unrestricted account/organization/membership and current `response.create` permission. For an external invitation, the acquisition context must be bound to the current user journey, must reference the exact invitation, and the current authenticated primary email must match the normalized invited email before the active organization can be attached as the target. The user must still possess current authority for that organization.

Possession of the URL/token, a matching email alone, an acquisition-context record, an invitation ID, a membership in another organization or lead-side authority is insufficient. Guessed, expired, revoked, accepted, declined, wrong-recipient and cross-tenant cases return a minimized unavailable result without confirming private record existence.

Accept and decline revalidate the invitation version/status, current published opportunity/deadline, current lead pursuit/gap provenance, both organizations' restrictions and the invitee's current authority. Exact replay is inert; reused command identity with changed intent conflicts. Accepting records only RFx-scoped platform participation. It does not assign response sections, permit final submission, create issuer authority, resolve the underlying gap or state that the invitee can perform.

The lead can revoke only a pending invitation with current authority. Expiry is derived from the invitation deadline and current opportunity deadline; UI time never controls it.

## 8. Nonbinding boundary

`TEM-004` requires the following substantive meaning at invitation review and before acceptance:

> Accepting this invitation records RFx-scoped participation in The RFxchange. It does not create a subcontract, joint venture, teaming agreement, exclusivity, compensation obligation, promise to submit, or authority to bind another organization.

The exact approved localized boundary version and acceptance timestamp are immutable evidence on accepted participation. A checkbox or UI state alone is insufficient; the server requires the current boundary version and records it atomically with acceptance. Decline does not require agreement to the boundary.

The interface must not use `partner`, `team formed`, `agreement`, `committed`, `approved` or similar language as a legal/business conclusion. Preferred terms are `potential teammate`, `proposed capacity`, `invitation`, `accepted participation` and `declined`.

## 9. External acquisition continuity

`ACQ-007` uses the existing `team-invitation` acquisition intent and `team-invitation-link` channel. External invitation creation prepares one acquisition envelope and transactional communication atomically with the invitation. The browser secret exists only in the delivered URL; persistence stores its digest.

The acquisition envelope preserves why the recipient arrived through sign-in, account creation, email verification, organization resolution/creation and activation. It never skips those gates, grants membership, chooses an organization, attaches the invitation or accepts participation.

After activation, the participant returns to the exact pending invitation review only after server-side binding confirms the acquisition context, user journey, normalized invited email and current organization authority. The participant must explicitly accept or decline. Reopening an already consumed/expired/revoked link returns a truthful unavailable/recovery state without leaking another organization's invitation.

PR #236 narrowly assigned `app/acquisition/continue/page.tsx` to this packet only for the final hop from an already server-bound `team-invitation` context to the exact invitation review destination, without attachment or auto-acceptance. It also assigned the five RFx locale catalogs for this slice's participant copy. No acquisition, account, organization, response, referral, commercial or cross-lens authority was added.

## 10. Persistence and atomicity

Team invitations, participation decisions, commands, append-only events, organization audit evidence, prepared acquisition contexts/events and queued transactional communications are trusted-server records. Direct browser Firestore access remains default-denied.

Create and decision transactions enforce:

- one stable aggregate identity and expected version;
- exact current pursuit/fit/gap provenance;
- exact current lead/invitee organization authority;
- stable command ID and request fingerprint;
- no partial invitation without its external acquisition/communication evidence;
- no partial acceptance without boundary acknowledgment/event/audit evidence;
- exact replay without duplicate communication or events; and
- conflict on stale version, changed fingerprint, changed gap/opportunity/deadline or competing decision.

The invitation repository may store only minimized RFx snapshots needed for stable review. It must not clone the publication, response, private profile, provider directory or full fit assessment.

## 11. Workspace, copy and accessibility

Gap resolution remains inside the Opportunities/RFx participant shell. The same assessment detail opens a teammate discovery Spatial Workspace or a bounded Resource route with safe return context. Invitation review uses the existing Operational Workspace; it does not create another application shell.

Required states are loading, no candidates, candidate available, stale gap, permission/restricted, pending invitation, accepted, declined, revoked, expired, dependency failure and recovery. Empty copy says that no participating organization currently matches the selected conditions; it never says no capable organization exists. Unknown provider/candidate availability remains unknown.

Desktop, intermediate and 390 px layouts preserve hierarchy and do not overflow. Candidate list/detail, invitation form, review boundary and accept/decline are keyboard and screen-reader operable, with visible focus, target sizing, status text beyond color, restrained live regions, reduced-motion compliance and safe focus return.

All changed participant copy must use the repository localization path for English, Spanish, French, Italian and German. Copy follows `What happened → why it matters → next action`, and never exposes raw AMACS, aggregate, command, acquisition or audit IDs.

## 12. Required acceptance

### Domain/application

- only a current permitted `pursue` relation and current team-coverable typed gap produces teammate context;
- stale/resolved/deferred/non-coverable/wrong-tenant gap references fail closed;
- organization candidates come from the existing server-governed Network discovery projection and exclude lead/issuer/restricted/private candidates;
- Resource routing delegates to the existing provider discovery/request boundary and preserves only safe RFx context;
- invitation creation revalidates current lead authority and exact pursuit/fit/gap facts at commit;
- minimum-necessary review omits private lead assessment/economics/evidence and unrelated requirements;
- target organization authority, or exact bound external acquisition plus email and organization authority, is required to review/decide;
- token/URL possession never grants access or acceptance;
- accept/decline/revoke use expected version, exact replay and immutable event/audit evidence;
- accepted participation includes the exact nonbinding acknowledgment and creates no response/assignment/submission authority; and
- external continuity returns to review without auto-acceptance.

### Emulator

- real Slice 4.4/4.5/4.6 opportunity, pursuit, fit and gap records feed discovery/invitation;
- external invitation, acquisition envelope/event and communication queue persist atomically;
- exact replay sends no duplicate communication and writes no duplicate event;
- wrong user/email/organization/membership, permission removal, restriction, stale version, gap change, deadline pass and publication withdrawal fail without partial writes;
- only the exact target can inspect minimum review and accept/decline;
- direct client reads/writes of private teaming collections are denied; and
- cleanup and global run-ID scans show zero residual test records.

### Configured browser

- an authorized lead opens a real current gap, finds real permitted candidates and sees truthful match/no-candidate states;
- safe opportunity/map/query/selection context survives teammate and Resource routing;
- a lead sends one existing-organization invitation and one external invitation without exposing extra RFx/private data;
- the exact invited participant reviews and accepts after the nonbinding boundary, while another participant cannot enumerate it;
- an external recipient completes sign-in/activation and returns to pending review without auto-acceptance;
- stale/revoked/expired/permission-removed paths remain coherent and recoverable;
- desktop, intermediate, 390 px, keyboard, five locales, reduced motion, high contrast and no-overflow checks pass; and
- console, page errors and unhandled rejections remain clean.

Run focused Slice 4.7 domain/application tests, Firestore emulator acceptance, localization/accessibility checks, `git diff --check`, the canonical `npm run check`, exact-head CI and post-merge CI.

## 13. Feature evidence

- `DSC-010` requires real reused Wave 3 organization discovery bound to a current RFx gap.
- `RSP-007` requires exact current gap-to-teammate context and safe return continuity.
- `RSP-008` requires exact gap-to-Resource routing through the existing provider boundary, not a new provider directory.
- `TEM-001` requires RFx-scoped capability/role/geography/need search with truthful candidate meaning.
- `TEM-002` requires one authorized, replay-safe, minimum-necessary invitation in a proposed capacity.
- `TEM-003` requires independently authorized review and accept/decline; token possession is insufficient.
- `TEM-004` requires visible, localized and immutably evidenced nonbinding acknowledgment.
- `ACQ-007` requires the real nonmember activation journey to return to pending review without attachment or auto-acceptance.

Tracker and requirement status changes occur only in the runtime/closeout sequence after each Feature ID's own evidence passes. Documentation-only authority leaves the tracker at **438 total · 175 Done · 263 Not Started**, RFx Core at **23/41**, B6b intentionally pending and B6c eligible/Not Started.

## 14. Explicit exclusions and stop boundary

This authority does not implement:

- response creation, response sections/compliance matrix, assignments, readiness, final review, submission, receipt or external handoff;
- legal teaming terms, subcontract/JV formation, exclusivity, compensation, insurance, flow-downs or signature;
- issuer invitation/admin visibility, sealed/invite-only audiences or bidder-list authority;
- automatic gap resolution, qualification, recommendation, capacity assurance, eligibility, endorsement or award likelihood;
- new organization/provider directories, private search indexes or a second map/query framework;
- provider approval, provider resources, provider-request lifecycle or unrelated referral behavior;
- RFx amendment, addendum, Q&A, withdrawal, cancellation, extension or republication;
- AI ranking, autonomous teammate selection or authoritative interpretation;
- payments, referral fees, payouts, commercial enrollment or Founding effects;
- B6c completion, Dark Appearance, appearance preferences, Presentation Mode, sound or haptics;
- Firebase App Hosting, deployment, build-identity changes or Stabilization 2C; or
- optional independent-assurance claims.

After the runtime merges and exact post-merge acceptance is green, Control Room may close this packet, reconcile only satisfied Feature IDs and activate Slice 4.8 from then-current merged `main`.
