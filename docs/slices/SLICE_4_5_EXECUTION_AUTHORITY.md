# Wave 4 Slice 4.5 — Opportunity Discovery and Management

**Status: EXECUTION AUTHORITY — DOCUMENTATION ONLY.**

**Merged baseline:** `273b98283f70fe558e1313aed16419943500bb1f` (PR #167, Wave 4 Slice 4.4)

**Feature IDs:** `DSC-004`, `DSC-005`, `DSC-006`, `DSC-007`, `DSC-008`

## 1. Authority and completion boundary

This document authorizes one later runtime implementation of permitted published-RFx discovery, search and filters, synchronized map/list/detail interaction, saved searches, reliable alerts/digests, one watch relationship and canonical deadline views. It does not itself complete a Feature ID, change tracker arithmetic, create an RFx, fabricate market activity or send a communication.

Slice 4.5 is complete only when a currently authorized participant can discover real Slice 4.4 opportunity projections through the existing Spatial Workspace, inspect the same permitted substantive detail, save a governed search, receive an idempotent communication for a real new match, watch one opportunity without duplicating it and view canonical deadlines derived from authoritative publication facts.

The Opportunities/RFx lens may become routable only to this accepted real participant runtime. Browser state, a saved search, an alert, a watch or a route never grants publication, organization, response, invitation, match, pursuit or commercial authority.

## 2. Dependency result

| Dependency | Result |
| --- | --- |
| Slice 4.4 `ISS-019` real immutable publication and minimized opportunity projection | Satisfied through PR #167 at the merged baseline; discovery consumes this projection and never drafts or snapshots directly. |
| Wave 3 controlled geography and discovery substrate (`GEO-012`, `DSC-001/002/003`) | Satisfied; extend the existing Mapbox Spatial Workspace, query boundary and map/list/detail synchronization. |
| Transactional communications (`COMMS-003/004/005`) | Satisfied; alerts request versioned, minimized, idempotent communications through the existing provider-neutral pipeline. |
| Organization/member authority and restrictions | Satisfied and reused for private saved-search, watch and deadline relations. |
| Exchange participant shell and lens registry | Satisfied; the real runtime may replace Opportunities/RFx unavailable state only after acceptance without changing the permanent lens order. |
| B6c RFx-lens expression | Eligible after real Slice 4.4 publication but remains a separate uncompleted gate. Slice 4.5 uses the already-approved opportunity object contract and spatial grammar only as required for its real discovery task. |
| Stabilization 2C | Isolated release engineering; not a product dependency. |

No dependency edge changes. Slice 4.6 remains ineligible until the runtime authorized here is merged and post-merge acceptance is green.

## 3. Required sources

The runtime implementation must read and preserve the current versions of:

- `/AGENTS.md`;
- `docs/context/README.md`;
- `docs/context/PRODUCT_PRINCIPLES.md`;
- `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md`;
- `docs/context/RFX_TRANSACTION_CYCLE.md`;
- `docs/context/MAP_AND_GEOGRAPHY.md`;
- `docs/context/ACQUISITION_AND_RETENTION.md`;
- `docs/context/COMMERCIAL_MODEL.md`;
- `docs/rfx/RFX_CORE_FEATURE_CROSSWALK.md`;
- `docs/rfx/RFX_CORE_PRODUCT_WORKSPACES.md`;
- `docs/rfx/RFX_CORE_ACCEPTANCE_MATRIX.md`;
- `docs/slices/SLICE_3_1_TRANSACTIONAL_COMMUNICATIONS_RELIABILITY.md`;
- `docs/slices/SLICE_3_2_CONTROLLED_NETWORK_ENTRY_AND_DISCOVERY.md`;
- `docs/slices/SLICE_4_4_EXECUTION_AUTHORITY.md`;
- `docs/architecture/COMMS-003-005-transactional-communications-reliability.md`;
- `docs/architecture/WAVE_4_SLICE_4_4.md`;
- applicable brand/design map, messaging, authorization, privacy, lifecycle, Firestore, internationalization, accessibility, performance and recovery authorities; and
- the existing production network-discovery, participant-spatial-context, RFx-publication and communications abstractions before introducing new contracts.

Prototype objects, screenshots and tutorial fixtures are not production authority. Test opportunities remain isolated fixtures and never enter a production query or count.

## 4. Published-opportunity discovery boundary

Discovery consumes only the current permitted Slice 4.4 `ResponderOpportunityProjection`/index envelope through trusted server application ports. It never reads private `rfxAggregates`, publication snapshots, commands, audit evidence or interpretation records, and it never reconstructs a larger record from index keys.

An opportunity is discoverable only when:

- its one canonical RFx aggregate remains `published` at the indexed published version;
- its projection exists, is internally consistent and has a supported audience;
- its controlled geography remains released for the relevant participant context;
- the requesting account, participant and organization context satisfy current restrictions;
- its audience permits the current request; and
- its canonical response deadline has not passed at the server clock.

The runtime must tolerate zero matching projections. It must not seed, backfill or combine fictional/demo opportunities with live results, infer density, or expose counts for records the caller cannot inspect.

## 5. Search and filter contract

Define one bounded, deterministic query equivalent to:

```ts
type OpportunityDiscoveryQuery = Readonly<{
  text: string | null;
  requestFamilyKeys: readonly string[];
  capabilityIds: readonly string[];
  localityIds: readonly string[];
  deadlineWindow: "all-open" | "next-7-days" | "next-30-days";
  watched: boolean | null;
  cursor: string | null;
  limit: number;
}>;
```

Search may use approved title/summary terms, governed request-family labels, frozen AMACS requirement snapshots, controlled locality labels/IDs and canonical response deadlines already present in the permitted projection/index envelope. Search never uses private issuer evidence, exact addresses, actor identities, audit facts, interpretations or later fit/pursuit state.

Rules:

- canonical IDs are server validated and never accepted because they merely look valid;
- textual normalization, ordering and cursor behavior are deterministic;
- `limit` is bounded and cursors are opaque, query-bound and non-authorizing;
- unsupported, stale or malformed filters fail with bounded recovery rather than broadening results;
- locality filters use controlled locality IDs and do not imply distance from a private point;
- capability filters mean the issuer requested that governed capability; they do not mean the participant matches or qualifies;
- deadline filters use the canonical response deadline and server clock; and
- commercial, Founding, sponsorship, credibility and watch state cannot alter neutral result eligibility or ranking.

The default ordering is an explicit stable product order such as nearest canonical deadline followed by opaque publication reference. Do not add recommendation, fit, popularity, paid placement or award-likelihood ranking.

## 6. Permitted result and detail projection

Search results and selected detail use the same audience-gated Slice 4.4 substantive projection, with only bounded discovery metadata added:

- opaque publication reference and projection digest/version;
- discovery source `published-opportunity`;
- controlled locality anchors/geometry classification sufficient for truthful rendering;
- canonical open/deadline status computed from the server clock; and
- current caller-private watch state where authorized.

List cards, map objects, popups and the selected detail surface must not independently reconstruct or cache divergent opportunity truth. A projection version/digest change invalidates stale result detail and restores by opaque reference only after current access succeeds.

No result copy may claim potential match, qualification, eligibility, endorsement, recommendation, compliance, selection or award likelihood. Slice 4.6 owns fit and pursuit semantics.

## 7. Spatial Workspace and selection continuity

Extend the existing `/geography/canvas` Spatial Workspace and persistent participant shell. Do not create a second map, dashboard, document navigation or standalone bid board.

- Search and filters remain one coherent control pattern for map and list.
- One selected opportunity reference synchronizes marker/beacon, list row/card, popup and responsive detail sheet/drawer.
- Selecting any representation updates all others and keeps the geographic focal target visible.
- Closing detail clears selection without silently clearing safe query, camera or organization-home context.
- Lens changes preserve safe map/query context through the participant spatial-context seam; current authorization is always re-evaluated.
- Desktop uses an edge detail surface; mobile uses a bottom sheet with sufficient map context; the structured list/detail path is fully keyboard and screen-reader operable.
- A locality-only opportunity uses the controlled locality anchor/area. Multiple-location opportunities may expose multiple governed locality representations tied to one opportunity. Remote/non-geographic opportunities remain truthful list results and are never forced to a false point.
- Exact/private performance addresses, coordinates and geocode provenance are never inferred from locality geometry or map center.

The opportunity object uses the approved Signal Blue demand semantics and is distinct from an organization node. Normal animation is restrained, stops after attention is established and honors reduced motion. No relationship path, potential-match treatment or outcome-green state is rendered in this slice.

## 8. Saved searches

`DSC-005` introduces one private `SavedOpportunitySearch` aggregate. It is owned by the acting organization and attributed to the creating user/membership for audit and personal delivery preferences; it is not a public market object.

At minimum it contains:

- stable saved-search ID and version;
- organization/user/membership ownership evidence;
- normalized, server-validated `OpportunityDiscoveryQuery` without pagination cursor;
- participant-authored bounded label;
- alert policy `off | immediate | daily-digest`;
- active/paused lifecycle;
- stable command/correlation evidence; and
- created/updated timestamps.

Create, update, pause/resume and delete require current exact participant/organization authority and expected version where consequential. Stable command IDs/fingerprints provide exact replay; altered intent conflicts. A saved search does not freeze search results, widen an audience, guarantee future notifications or create a match.

Commercial policy is a server-side capability seam. Basic saved-search behavior authorized here must not change neutral search truth. If a current canonical entitlement grants a quantitative or delivery option, denial must be explicit and cannot promote results or suppress otherwise permitted manual discovery. Do not invent billing, checkout, sponsored placement or Founding advantages.

## 9. Match evaluation and alerts/digests

`DSC-006` evaluates a saved query against a newly committed or newly eligible real opportunity projection. The evaluator is deterministic and consumes the same normalized search predicate as interactive discovery. It produces a private match event only when the caller could currently discover that projection; the event means `saved search criteria matched`, never potential fit or qualification.

Persist a minimized immutable match event keyed by saved-search ID, saved-search version, opportunity reference, projection version/digest and evaluation-policy version. Reprocessing the same tuple is an exact replay and cannot create duplicate events or deliveries.

Alert delivery:

- requests the existing `COMMS-003/004/005` pipeline through a reviewed RFx opportunity-alert event/template version;
- includes minimum necessary title, deadline/locality summary and a controlled deep link, never complete requirements or private index keys;
- keeps the match fact separate from delivery queued/accepted/retry/terminal state;
- uses one immediate delivery per new match or one deterministic daily digest window according to the saved policy;
- excludes paused/deleted searches, expired opportunities and projections no longer permitted at dispatch time;
- rechecks recipient routing/current participant authority before content resolution; and
- remains safe under provider duplicate delivery and interrupted-success recovery.

This slice adds no notification center, marketing campaign, SMS, push, sound or haptics. Provider failure never removes the match event or claims the participant was notified.

## 10. Watch relationship

`DSC-007` introduces one canonical private `OpportunityWatch` relation for the tuple `(organization, user, opportunity reference)`. It references the immutable published opportunity; it does not clone, republish or own the RFx.

Watch and unwatch commands require current participant authority, stable command IDs/fingerprints and atomic event/audit evidence. Exact replay is idempotent. Concurrent duplicate watches collapse to the same relation; unwatch is explicit and recoverable according to the bounded lifecycle.

Watching means `keep this opportunity in my private watch view`. It does not mean pursue, match, invitation, eligibility, issuer awareness, response intent or outcome. The later Slice 4.6 pursuit model must reuse or explicitly transition this relationship rather than create a duplicate opportunity record.

## 11. Canonical deadline views

`DSC-008` derives deadline projections from the published RFx canonical structured dates and server clock. A deadline projection may group permitted saved-search matches and watched opportunities into:

- due in the next 7 days;
- due in the next 30 days; and
- later open deadlines.

The underlying ISO date/time, timezone/interpretation rule, source projection version and computed `open | due-soon | passed` state remain explicit. Display localization never rewrites the canonical fact. Passed deadlines disappear from open discovery and cannot be watched anew; historical watch relation evidence remains private where lifecycle policy requires it.

Reminder events, if emitted by the selected alert policy, use the same idempotent communications substrate and deduplicate by relation/search, opportunity version, deadline and reminder-policy version. A reminder is not a deadline extension or issuer amendment. Amendment, extension, close and cancellation remain excluded until separately authorized.

## 12. Authorization, privacy and client access

Interactive discovery requires current authenticated, unrestricted OPEN-participant authority for participant-only projections and applies the existing public/audience rule for any explicitly public entry. Saved searches, match events, watches, deadline collections and recipient/delivery routing are private and require exact current user, organization and active membership context.

Wrong-user, wrong-organization, inactive membership, restricted account/organization/membership, disabled/unverified/revoked account, guessed reference/ID, stale saved-query cursor and cross-tenant cases fail closed before private content or record existence is disclosed.

Direct browser Firestore access remains default-denied for opportunity projections, saved searches, match events, watches, commands, audits and communication delivery records. Trusted server handlers expose only minimized authorized projections. Server-only index keys, raw internal RFx IDs, exact private geography, recipient addresses, audit evidence and query fingerprints never enter participant HTML or API envelopes.

## 13. AI and AMACS boundary

No AI call is required or authorized for query interpretation, saved-search matching, ranking, alerts, watches or deadlines. AMACS filters validate against the pinned release and compare only confirmed frozen identifiers in the published projection.

The runtime does not infer organizational capability, fit or eligibility from model output, profile prose, a watch or a click. Rejected/unresolved interpretation candidates cannot influence search or alerts. Manual text and structured filters remain fully usable.

## 14. Participant copy, states and accessibility

Opportunities/RFx becomes current only on its accepted real route. Permanent participant lens order remains exactly `Opportunities/RFx | Resources | Intelligence | Referrals`; Network remains the Intelligence organization-network concept. Account and Quick Start remain utilities.

Every discovery surface distinguishes loading, empty, no-results, restricted, stale, error and recovery states. Empty copy states that no permitted published opportunities match the current query; it never claims no market demand exists. Pending search/save/watch actions give immediate feedback without replacing the persistent shell or clearing safe content.

All changed participant/public/communication copy exists in English, Spanish, French, Italian and German. Acceptance covers desktop, intermediate and 390 px mobile, long labels, keyboard-only operation, screen-reader list/detail equivalence, focus restoration, live-region restraint, visible focus, target sizing, reduced motion, high contrast, map attribution and no horizontal overflow.

## 15. Required acceptance

### Domain/application

- only current, permitted, open, audience-compatible Slice 4.4 projections can be queried;
- text/request-family/AMACS/locality/deadline/watch predicates, stable ordering, opaque cursors and bounded pagination are deterministic;
- result/detail minimization prevents aggregate, snapshot, actor, exact-location, audit, interpretation and server-index leakage;
- map/list/popup/detail consume one selected reference and the same substantive projection/digest;
- locality-only, multiple-locality and remote/non-geographic opportunities render without false precision;
- saved-search versioning, validation, ownership, command replay/conflict and lifecycle are deterministic;
- new-projection evaluation uses the same search predicate and exact replay yields one match event;
- immediate and daily-digest policies deduplicate while keeping business and delivery facts separate;
- watches are unique, private, idempotent and do not clone an opportunity or imply pursuit;
- deadline views and reminders derive only from canonical structured dates and server time;
- all negative account/membership/restriction/audience/tenant cases fail closed; and
- commercial state, Founding status, watch count and activity cannot affect neutral discovery or ranking.

### Firestore emulator

- trusted queries return only permitted projection fields and exclude expired, draft, wrong-audience, unreleased-geography and corrupt/stale projections;
- saved-search create/update/pause/resume/delete and watch/unwatch commit atomically with one command receipt, append-only event and organization audit where required;
- exact replay creates one relation/evidence set; altered fingerprint and stale/concurrent version fail without partial writes;
- one saved-search/projection/version tuple creates one match event and one applicable delivery intent/digest membership;
- daily digest batching and reminder scheduling are stable across retry/interrupted success;
- permission removal between read and mutation/dispatch fails closed;
- direct-client projection/private relation/match/command/audit/delivery reads and writes are denied;
- guessed/cross-organization IDs disclose nothing; and
- exact cleanup plus global run-ID scan returns zero residual Auth/Firestore records.

### Configured browser

- two real published fixtures created through the Slice 4.4 command appear only for their permitted audiences and no draft/demo fallback appears;
- Opportunities/RFx becomes routable/current only with the real discovery runtime and the permanent shell/lens order remains intact;
- text and structured filters update one synchronized map/list/detail result set with deterministic URL restoration;
- marker/list/popup/detail selection stays synchronized across desktop, intermediate and 390 px layouts and preserves protected focal visibility;
- locality-only and remote/non-geographic fixtures never reveal or fabricate a private coordinate;
- keyboard and screen-reader users can search, filter, select, inspect, save and watch without using the map pointer;
- a saved search survives reload/re-entry, version conflict is recoverable and cross-tenant access fails closed;
- a real new permitted publication creates one match event and one immediate/digest communication intent without duplicate delivery on replay;
- watch/unwatch is authoritative after reload and is not labeled pursue/match/invited;
- canonical deadline groups/localization respond to controlled server time without client-clock authority;
- delayed query/relation/communication resolution preserves the shell and provides immediate scoped pending/recovery feedback;
- five locales, reduced motion, high contrast, target sizing and no-overflow checks pass;
- console, page errors and unhandled rejections remain clean; and
- all disposable Auth/Firestore fixtures are removed with zero residuals.

Run focused discovery/relation/communications tests, Firestore emulator acceptance, internationalization/accessibility checks, `git diff --check`, the canonical `npm run check`, exact-head CI and post-merge CI.

## 16. Feature evidence

- `DSC-004` is accepted only with controlled real-opportunity search, substantive permitted detail and synchronized accessible map/list/detail behavior.
- `DSC-005` is accepted only with a private organization/user-scoped governed saved query and explicit commercial-policy boundary.
- `DSC-006` is accepted only when real saved-query matches create idempotent minimized events and reliable immediate/digest delivery intents through `COMMS-003/004/005`.
- `DSC-007` is accepted only with one unique private watch relation over the canonical opportunity and no duplicate opportunity/pursuit semantics.
- `DSC-008` is accepted only when saved/watched opportunity deadlines and reminder events derive from canonical RFx dates and server time.

Tracker changes occur only in the runtime PR after each feature's own acceptance passes. This documentation authority leaves the tracker at **438 total · 165 Done · 273 Not Started**, Wave 4 RFx Core at **13/41**, B6b intentionally pending and B6c eligible but Not Started.

## 17. Explicit exclusions and stop boundary

This authority does not implement:

- Slice 4.6 fit explanation, Potential Match, Go/No-Go, Pursue or Decline;
- team-gap resolution, referrals, invitations or relationship paths;
- response authoring, assignments, submission or external handoff;
- evaluator assignment, conflicts, scoring, consensus, ranking, recommendation, selection, award or outcomes;
- RFx amendment, addendum, Q&A, withdrawal, cancellation, close, extension or republication;
- named-recipient/invite-only/sealed/limited-bidder audiences;
- a notification center, marketing campaign, SMS, push, sound or haptics;
- B6c completion, RFx relationship paths, opportunity-home convergence or potential-match expression beyond the bounded Slice 4.5 discovery task;
- paid placement, sponsored visibility, billing, checkout or commercial enrollment;
- Dark Appearance, appearance preference or Presentation Mode;
- Firebase App Hosting, deployment or build-identity changes; or
- Stabilization 2C.

After the runtime merges and exact post-merge acceptance is green, recalculate from merged `main` and define the documentation-only Slice 4.6 authority for `RSP-001`, `RSP-002`, `RSP-003`, `RSP-004` and `RSP-006` under the standing Wave 4 authorization.
