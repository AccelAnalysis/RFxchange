# Mobile Exchange Stages 3–6 Product and Execution Authority

**Status: GOVERNING PRODUCT-OWNER AUTHORITY WHEN MERGED**

**Stage 1–2 foundation:** PR #222 merge `1fbf38e71747ac90c2f285e4934b22ea26312bec`

**Authority source:** the product-owner execution direction supplied on 2026-08-17, reconciled with current merged repository authority

**Completion model:** `Build → Test → Integrate → Release → Improve` under `FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md`

This authority governs the successor mobile Exchange program after Stage 2. It changes the current permanent participant information architecture and authorizes bounded Stages 3–6 work packets. It does not rewrite the historical truth of Stages 1–2, change a completed Feature ID, weaken security/privacy/geography/tenant authority, authorize fabricated market data, or create payment authority.

## 1. Product-owner decision

The permanent authenticated participant lenses are now, in exact order:

```text
Opportunities/RFx | Resources | Intelligence | Capabilities
```

- Opportunities/RFx remains the visibly first and principal market-action lens.
- Resources, Intelligence, and Capabilities are supporting lenses over the same organization-centered market.
- Capabilities is a real organization-capability domain lens, not Referrals with different copy.
- Referrals is a governed cross-lens business function and organization utility. It is not a permanent lens.
- Menu/Account is a utility outside the four-lens market navigation.
- Network remains a view/domain concept inside Intelligence.
- Permanent-lens visibility never grants domain, record, geography, or action authority.

This decision supersedes earlier current product statements only where they designate Referrals as a permanent participant lens. Historical Stage 1–2 authorities, evidence, commits, screenshots, and acceptance results retain their original four-lens meaning and are not relabeled after the fact.

## 2. Authority precedence and boundaries

For Stages 3–6, use this authority with the repository source hierarchy in `AGENTS.md`. Preserve the stricter requirement when sources differ.

This authority specifically supersedes the permanent-lens product statements in:

- `FOUR_LENS_PROGRAM_AUTHORITY.md`;
- `EXCHANGE_INTERACTION_ARCHITECTURE.md` before its same-change reconciliation;
- the current sections of `PARALLEL_DELIVERY_MATRIX.md`, `CHAT_LANE_CHARTERS.md`, and `SHARED_EXCHANGE_CONTRACTS.md`; and
- the legacy permanent-lens requirements identified in `governance/four-lens-requirements.json`.

It also makes `MOBILE_EXCHANGE_STAGES36_ACTION_REGISTRY.md` the current immutable sixteen-position registry. `EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md`, `EXCHANGE_ROOM_PHASE2_CONTROL.md`, and the Referrals-ending portions of `MARKET_READY_BASELINE.md` remain governing provenance for Stage 2 only.

It does not supersede:

- server-side authorization, tenant isolation, privacy, consent, geography, lifecycle, audit, idempotency, or evidence requirements;
- RFx aggregate/publication/response authority;
- Resource Provider approval, provider profile, resource publication, or request authority;
- Intelligence provenance, visibility, and coverage authority;
- AMACS 0.5.0 release and interpretation boundaries;
- the real referral aggregate and minimum-necessary sharing rules;
- tracker completion rules;
- the commercial neutrality rule; or
- Critical payment release controls.

## 3. Historical Stage 2 closeout

Stage 2 completed the governed `MOB-02` through `MOB-05` composition using the then-current order `Opportunities/RFx | Resources | Intelligence | Referrals`. PR #222 supplied:

- the map-first responsive shell;
- persistent bottom navigation;
- the `peek | partial | expanded` sheet;
- exactly four active-lens actions;
- shared card/media/favorite/detail presentation;
- marker/card/detail continuity;
- truthful restricted/empty states; and
- touch, keyboard, safe-area, locale, and desktop compatibility.

Stages 3–6 consume that composition. They may migrate its governed registry and contracts but may not replace it with a dashboard-first shell, private lens navigation, private sheet, private card framework, or private selection store.

## 4. Work-packet and ownership model

The successor program uses bounded packets in dependency order:

1. `WP-MOBILE-EXCHANGE-STAGES36-AUTHORITY-01` — Control Room authority and ledger amendment.
2. `WP-MOBILE-EXCHANGE-LENS-MIGRATION-01` — Lane 01 registry, routing, serialization, action, locale, and compatibility migration.
3. `WP-MOBILE-EXCHANGE-STAGE3-SHARED-01` — Lane 01 authoritative shared query/map/result/detail contracts.
4. `WP-RFX-46-RECONCILE`, then `WP-MOBILE-EXCHANGE-RFX-47-01` through `WP-MOBILE-EXCHANGE-RFX-410-01` — dependency-ordered RFx fit/pursuit, team/invite, response, submission/handoff, and education foundations.
5. `WP-MOBILE-EXCHANGE-STAGE4-OPPORTUNITIES-01` — Opportunities/RFx adapter and complete authorized actions after those RFx foundations merge.
6. `WP-MOBILE-EXCHANGE-STAGE4-RESOURCES-01` — Resources adapter and complete authorized actions.
7. `WP-MOBILE-EXCHANGE-STAGE4-INTELLIGENCE-01` — Intelligence adapter and complete authorized actions.
8. `WP-MOBILE-EXCHANGE-STAGE4-CAPABILITIES-01`, then `WP-MOBILE-EXCHANGE-STAGE4-CAPABILITIES-MATCH-01` — Capabilities projection/AMACS boundary followed by RFx matching after both domains merge.
9. `WP-MOBILE-EXCHANGE-STAGE5-REFERRALS-MENU-01`, then `WP-MOBILE-EXCHANGE-STAGE5-MENU-01` — cross-lens referral domain/workflows followed by the Lane 01-owned Menu/Account extension.
10. `WP-MOBILE-EXCHANGE-STAGE5-ONBOARDING-01` — registration/onboarding and final-architecture convergence.
11. `WP-MOBILE-EXCHANGE-STAGE6-INTEGRATION-01` — integrated security, browser, accessibility, performance, release, deployment, and smoke evidence; material runtime defects reopen their owning packet.

Lane 01 owns shared shell, navigation, query, spatial state, map projection, generic cards/details, return context, utilities, and compatibility migration. Domain lanes own record meaning, filters, lifecycles, persistence, visibility, authorization, and authoritative mutations. A domain lane must request a shared contract change rather than introduce a private substitute.

The existing Referrals lane remains owner of the referral domain, but as a cross-lens function rather than a permanent lens. The Capabilities lane owns the new permanent lens and consumes existing organization-profile and AMACS contracts.

## 5. Mandatory lens and state migration

### 5.1 Canonical identifiers and routes

The shared registry must use:

| Position | Lens ID | Canonical destination |
| ---: | --- | --- |
| 1 | `opportunities-rfx` | `/opportunities` |
| 2 | `resources` | `/resources` |
| 3 | `intelligence` | `/geography/canvas` or a later accepted canonical Intelligence route |
| 4 | `capabilities` | the accepted Capabilities lens destination |

`/referrals` remains an authenticated utility/workflow route. It may be reached through Menu/Account, a specific referral deep link, or an applicable cross-lens `Refer` action. It must not receive current permanent-lens treatment.

### 5.2 Backward-aware compatibility

Persisted or linked values require an explicit, tested migration:

- generic `activeLens = referrals`, `lens=referrals`, old fourth-tab state, and generic `/referrals` lens intent migrate to `capabilities`;
- the safe generic migration default is Capabilities because it occupies the former fourth permanent position;
- specific authorized referral record links continue to the exact referral workflow;
- referral-management intent routes to Menu/Account → Referrals;
- unauthorized referral record links fail closed without confirming protected record existence;
- existing referral records, lifecycle history, consent, recipient state, and audit evidence are never deleted or rewritten;
- saved query, camera, selected organization, result/list, sheet, and return state are preserved only where still meaningful and currently authorized;
- invalid legacy state is dropped rather than allowed to grant authority; and
- migration is idempotent, observable in tests, and has a documented rollback/containment path.

The state schema version must advance when required. Parsers must accept the previous Stage 2 form long enough to migrate it deterministically. New serializers must emit only the successor form.

### 5.3 No label-only conversion

Capabilities requires its own:

- record and map projection;
- search and filters;
- card and detail model;
- organization-profile integration;
- four governed actions;
- evidence/certification distinction;
- coverage and match-readiness semantics;
- AMACS release/provenance boundary;
- comparison and RFx matching behavior; and
- own-organization management permissions.

Referral card, path, recipient, and lifecycle models remain referral-domain models and must not be reused as Capability records.

## 6. Stage 3 — Authoritative discovery and continuity

### Objective

Make map objects, result cards, search results, selected records, details, save/watch presentation, and return state different representations of the same authoritative record identities.

### Shared query contract

The canonical contract must represent, where applicable:

- active lens, participant organization/membership, locale, controlled geography/locality;
- map camera, bounds, zoom, search, lens filters, sort, cursor/pagination;
- selected result, organization, record, marker, and permitted relationship;
- sheet snap, result-list scroll, detail state, and safe return context.

Shared state is presentation and continuity state only. Every destination and mutation revalidates current server authority. Domain adapters own record meaning and domain-specific filters; no adapter may bypass the shared contract with a private global store.

### Map, result, and detail contracts

- The typed map projection supports authoritative points, organization locations, record locations, clusters, governed areas/layers, selected/focused states, record and organization identity, and authorized detail targets.
- A missing authoritative coordinate produces a truthful non-map/list treatment, never a fabricated point.
- The shared result model carries stable record/lens/organization identity, title, summary, locality, media/fallback, status/dates, classifications, domain save/watch state, record actions, accessible labels, and truthful loading/empty/unavailable/error states.
- The shell does not import domain persistence models.
- Media uses real authorized assets or an explicit fallback and never autoplays sound.
- Save/watch/follow presentation delegates persistence to the owning domain and is hidden when no authoritative operation exists.
- Detail ordinarily remains inside the shared Exchange surface and restores valid lens, geography, camera, query, filters, cursor, list position, selection, and sheet context.

### Exit condition

Stage 3 is complete only when all four permanent lenses can consume the shared contracts; map/search/list identities agree; marker/card/detail selection is synchronized; records and empty states are real; domain save/watch behavior persists where authorized; detail return works; SCRs #223/#224 are durably resolved; mobile and desktop share compatible contracts; and no domain owns a competing shell/card/map/selection framework.

## 7. Stage 4 — Four permanent domain lenses

Every permanent lens registers exactly four stable positions. Each projection keeps `operational`, `applicable`, and `authorized` separate. A disabled position describes the actual reason, reveals no protected data, and does not enter a remediation loop.

### Canonical action direction

| Lens | Own/managed context | External or selected-record context |
| --- | --- | --- |
| Opportunities/RFx | Create RFx; Edit/Manage RFx; Invite Team; Track/Watch | View RFx Detail; Respond; Team; Watch |
| Resources | Offer Resource; Edit Resource; Share; Save/Archive | Request Resource; View Resource Detail; Share; Save |
| Intelligence | Add Insight; Edit Insight; Compare; Track | View Insight Detail; Add Note; Compare; Follow/Track |
| Capabilities | Manage Capabilities; AI to AMACS; Add/Edit Evidence; Capability Gaps | View Capabilities; Match to RFx; Refer; Save/Follow |

`MOBILE_EXCHANGE_STAGES36_ACTION_REGISTRY.md` assigns the exact immutable ID to each paired position and defines the backward-aware mapping from every Stage 2 ID. The table above defines contextual labels; it does not authorize a builder to invent IDs or substitute actions.

Existing stable action IDs should be retained where their meaning remains valid. Any rename/migration must be explicit and backward-aware. `AI to AMACS` remains truthful and non-operational unless a current provider runtime is separately authorized; manual AMACS browse/search remains available.

### Opportunities/RFx

Use real permitted RFx/opportunity records and the current RFx aggregate. Discovery/detail may project authoritative issuer, type, category, geography, dates/deadline, status, summary, documents, watch, and response state. Issuer and responder mutations remain server-authorized and lifecycle-correct. Closed, expired, unavailable, issuer/non-issuer, watch, response, team, and alert states require focused evidence. Reconcile useful PR #210 alert work from current main; do not merge its stale private matching or overwrite unrelated current Functions exports.

The Opportunities packet may not claim the complete contextual action matrix from Stage 4 discovery alone. It must consume merged RFx Slice 4.6 fit/pursuit, Slice 4.7 gap/team/invite, Slice 4.8 response-workspace/readiness, Slice 4.9 review/submission or external handoff, and Slice 4.10 contextual-education packets for the applicable unchecked Feature IDs. Those packets run in the dependency order in `WAVE_4_RFX_CORE_ROADMAP.md`; a position stays truthfully inactive until its owning RFx packet is merged. Stage 4 Opportunities closes only after those dependencies close and the final integrated adapter passes its own evidence.

### Resources

Use real approved-provider, provider-profile, published-resource, service-territory, eligibility/intake, availability, request/referral, and organization authority. Owner and external contexts must distinguish offer/edit/archive/share/request/save and request-management behavior. Discovery does not require private request authority. Never infer availability, eligibility, endorsement, or current capacity from provider approval.

### Intelligence

Use authoritative organization and approved intelligence records with explicit record type, visibility, source, geography, vintage/effective date, quality/caveats, and coverage. Private/team/organization/public scopes are enforced server-side. Map layers exist only when a governed source supports them. Notes/comments/drafts/version history and related-domain activity remain scope- and tenant-safe.

### Capabilities

Use the existing organization profile and confirmed organization capability assertions. Support authoritative capability summary, AMACS classification/snapshot, service coverage, industries/roles, evidence references, certification/verification distinctions, match readiness, gaps, and visibility. Capabilities must support real browse/search, profile detail, own-organization management, comparison, RFx matching explanations, save/follow where authoritative, and referral entry.

AMACS remains pinned to its accepted release contract. Assistance proposes; AMACS constrains; the participant confirms; an authorized domain command writes the authoritative organization record. Rejected/unresolved candidates have no matching or public effect. Match explanations distinguish exact, broader/narrower, approved crosswalk, team coverage, qualifier, evidence, missing, unknown, and provisional relationships without inventing an authoritative score.

### Exit condition

Stage 4 is complete when the final four lenses appear in exact order, each consumes real records and the shared framework, each has exactly four governed action positions, own/external contexts and domain map/list/card/detail behavior are correct, Capabilities is substantive, Referrals is absent from permanent navigation, and the useful work from PRs #210/#219/#220/#221 has been reconciled or explicitly superseded.

## 8. Stage 5 — Real actions and cross-lens workflows

### Referrals

Applicable Opportunity, Resource, Intelligence, Capability, organization-profile, card, and detail surfaces may enter the real referral workflow only when target, recipient, policy, consent, permission, and runtime are valid.

The referral aggregate preserves current authorized origin, sender/actor organization, recipient, purpose, minimum-necessary context, consent/disclosure, policy, lifecycle status, timestamps, activity, notes/messages, and audit history. Existing referral semantics and `REF-001` through `REF-006` remain valid. A referral is not a match, acceptance, sale, award, endorsement, verified outcome, or credibility event.

Menu/Account provides role-appropriate referral Overview, Referrals, and Policies. Payments/Payouts and Reports appear only when an authoritative current domain exists. Under current authority, managed paid referral fees, live financial obligations, and payout management are not authorized and must be absent or truthfully unavailable.

### Menu/Account

Menu is a utility, not a fifth lens. It may expose only authorized implemented destinations such as organization profile, team, administration, subscription, referrals, saved items, notifications, settings, support, logout, and Return to Exchange. Destructive operations require explicit current permission, scope/dependency review, confirmation, server enforcement, safe failure, and required audit evidence.

### Workflows, notification, and return

Every enabled action performs a real domain workflow with loading, validation, current authorization, success feedback, recoverable error, idempotency where repeatable, current resulting state, and safe return. Navigation-only placeholders remain disabled. Notifications use real domain events, existing participant preferences, and tenant-safe delivery. Completed or cancelled work restores only currently valid spatial/query/detail context.

### Registration and onboarding

The current canonical free-participation journey remains:

```text
Marketing or governed invitation
→ create/authenticate user and RFxchange session
→ required policy and identity/email verification
→ select controlled geography
→ find, claim, or create organization
→ establish organization authority
→ confirm location and essential organization profile
→ Profile Complete and real marker activation
→ orientation/first value and OPEN release
→ Enter the Exchange
→ progressive enrichment and optional post-value Founding offer
```

Do not create a second registration system. Organization type, buyer/supplier role, provider status, Verification, optional enrichment, and payment are not general Exchange-entry prerequisites. Capabilities replaces Referrals in permanent-lens onboarding language/destination behavior; referral policy remains optional progressive organization management. A current approved entitlement-specific payment path may be shown only under its own authority and never silently gates legitimate free participation.

After the required activation milestone, progressive onboarding must offer the current-authorized equivalents of core organization details; geography and locations; organization directory and team; capability profile; Resources; Intelligence; Opportunities/RFx readiness; referral policy; preferences and alerts; and a progress overview. Each module preserves its own authorization and completion semantics. Optional enrichment remains deferrable and does not silently become an activation gate.

### Commercial boundary

- Organization subscription state, webhook authority, idempotency, mode, retry/cancellation, and secrets remain governed by current commerce authorities.
- Do not hard-code prices, cohort caps, referral fees, payout terms, or credits from this roadmap.
- Do not create live charges for acceptance.
- Founding recognition and payment never change authority, Verification, credibility, qualification, neutral discovery, or matching.
- Paid referral transactions and payouts require a separate explicit Critical commerce authority; this program does not provide it.

### Exit condition

Stage 5 is complete when every enabled action performs a real authorized workflow, cross-lens referral creation and Menu referral management work without a Referrals lens, utilities are role-appropriate, registration/onboarding converge on the final architecture, notifications reflect real events, continuity survives workflows, and no visible control is a misleading placeholder.

## 9. Stage 6 — Integration, hardening, release, and verification

Stage 6 corrects integration defects without replacing the shared interaction model.

### Required integration matrix

Exercise all pairwise meaningful transitions among Opportunities/RFx, Resources, Intelligence, and Capabilities; each lens to/from Menu; record to referral workflow; referral management back to the authorized origin; detail/back; sheet/map; and marker/card. Safe shared context carries forward; invalid domain state does not.

### Required evidence

- representative narrow/large iPhone and Android viewports, portrait/landscape, safe areas, dynamic browser chrome, software keyboard, touch, pointer, keyboard-only, reduced motion, and supported zoomed text;
- desktop map/search/filter/list/detail/navigation/actions/organization/referral/registration/onboarding regression;
- semantic controls, labels, visible focus, focus order/restoration, sheet/dialog behavior, status/error announcements, disabled semantics, contrast, and touch targets;
- `en-US`, `es`, `fr`, `it`, and `de` with no missing or stale permanent Referrals-lens copy;
- tenant, membership, role, server authorization, Intelligence visibility, capability evidence, issuer/responder, Resource request, referral consent/contact, commercial ownership, media, validation, output filtering, audit, and direct-client-denial checks;
- explicit backward-aware, retryable, tenant-safe migration evidence for legacy lens state, URLs, action IDs, saved context, onboarding, and referral records;
- measured map/query/permission/card/media/sheet/lens/listener/retry performance and correction of material duplication or leaks;
- configured-browser end-to-end registration, sign-in, organization resolution, onboarding, Exchange entry, four lenses, map/card/detail, sheet, actions, read/mutation journeys, cross-lens referral, Menu referral management, persistence, denial, empty/unavailable, logout, and reauthentication; and
- clean console, no unhandled rejections, exact candidate identity, rollback/containment, and production-safe smoke evidence.

Release classification is risk-based. Shared presentation is ordinarily Standard; consequential domain workflows are Elevated; authentication/authorization, tenant/privacy, payment, destructive/migration, secrets, or comparable boundaries are Critical. Optional independent assurance is reported separately and is required only to claim `Verified` unless a later explicit authority names it as mandatory.

### Deployment boundary

Use the existing Firebase App Hosting backend `rfxchange`, region `us-east4`, live branch `main`, repository root `/`. Do not switch platforms, invent secrets, weaken `RFXCHANGE_BUILD_SHA`, or claim Stabilization 2C complete. Confirm current main, environments, rules/indexes, payment mode, migrations, rollback/containment, and smoke plan before release.

### Exit condition

Stage 6 completes only when current main contains intended Stage 2–6 work, exact-head and post-merge CI pass, configured-browser acceptance passes, mobile/desktop work, the final lens order is correct, Referrals works cross-lens and under Menu, no material review/security/privacy/payment/migration defect remains, the existing deployment succeeds, production-safe smokes pass, and repository/tracker/program artifacts describe current truth without rewriting history.

## 10. Pull-request reconciliation

- PR #222 is the merged Stage 2 dependency and is not expanded retroactively.
- PRs #220 and #221 must be reconciled after the shared migration/Stage 3 contracts; transplant useful domain adapters and discard private shared-state/action-rail composition.
- PR #219 must not merge as a permanent Referrals lens. Preserve its useful lifecycle/privacy code in cross-lens referrals/Menu, then close it as superseded.
- PR #210 must be rebuilt or transplanted from current main, preserving current Functions exports and canonical opportunity matching.
- Issues #223 and #224 are resolved by PR #222 and require no replacement SCR unless a new generalized gap appears.

## 11. Tracker and assurance discipline

This authority changes no Feature-ID completion box. Existing completed Activation, Network, referral, Resource Provider, AMACS, and RFx foundations remain complete. New successor experience requirements are appended to the Four-Lens ledger; immutable historical requirements remain present and obsolete permanent-lens requirements receive explicit successor/N/A metadata.

A packet may close as `Implemented — Not Verified` when implementation, objective tests/evidence, dependency/ownership satisfaction, durable recording, and no known material defect support completion. `Verified` remains an optional independent-assurance label. Merge, release, and production deployment never imply independent assurance.

## 12. Preserved pending program states

- Stabilization 2C remains incomplete and isolated to release engineering.
- Brand Gate B6b remains intentionally Not Started unless a separate bounded convergence authority is approved.
- B6c and later appearance, sensory, presentation, credibility, and outcome gates require separate authority.
- Dependency-ineligible RFx, Intelligence, Resource, Capability, referral, commerce, or administrative work is not authorized merely because it is adjacent to these stages.
