# Wave 4 Slice 4.6 — Fit, Go/No-Go and Pursuit

**Status: EXECUTION AUTHORITY — DOCUMENTATION ONLY.**

**Merged baseline:** `b6939d7f970e23777d92cf7105547f39fc3d9b8b` (PR #169, Wave 4 Slice 4.5)

**Feature IDs:** `RSP-001`, `RSP-002`, `RSP-003`, `RSP-004`, `RSP-006`

## 1. Authority and completion boundary

This document authorizes one later runtime implementation of discovery-source attribution, deterministic AMACS/requirement fit explanation, a private organization-owned responder Go/No-Go assessment, one organization-owned Pursue/Watch/Decline relation and typed gap assessment. It does not itself complete a Feature ID, change tracker arithmetic, fabricate a match, create a response or notify an issuer.

Slice 4.6 is complete only when a currently authorized organization can open a real permitted Slice 4.5 opportunity, see why it surfaced, inspect a reproducible comparison between the immutable published requirements and that organization's current confirmed structured profile, record private assessment facts, choose Pursue, Watch or Decline through one governed relation and inspect typed gaps without any qualification, eligibility, endorsement, profitability or award-likelihood claim.

Browser state, a search match, a watch, a fit explanation, a private assessment or a pursuit choice never grants organization, RFx, response, invitation, issuer, commercial or market authority. `Pursue` is only the prerequisite decision seam for the later Slice 4.8 response aggregate.

## 2. Dependency result

| Dependency | Result |
| --- | --- |
| Slice 4.5 real opportunity discovery and canonical personal watch/deadline relations | Satisfied through PR #169 at the merged baseline; fit consumes only currently permitted open opportunity projections and explicitly transitions the acting user's watch when an organization pursuit decision is recorded. |
| Slice 4.4 immutable publication requirements and exact projection digest/version | Satisfied; all comparison inputs come from the accepted responder projection and stable published requirement IDs/snapshots. |
| Slice 3.3 confirmed organization market-profile capabilities | Satisfied; deterministic comparison may consume the acting organization's current authoritative structured claims, never another organization's private claims or profile prose. |
| Organization/member authority, restrictions and response operation permissions | Satisfied and reused; no client or discovery state grants a consequential pursuit decision. |
| AMACS 0.5.0 release-aware catalog and historical compatibility contracts | Satisfied; comparisons are identifier/snapshot based and never label- or model-memory based. |
| Wave 3 organization/resource discovery for gap resolution | Available but not consumed as a live route until Slice 4.7 authority. Slice 4.6 identifies gaps only. |
| B6c RFx-lens expression | Eligible but remains a separate uncompleted gate. This slice uses existing approved workspace/object semantics only for its bounded real task. |
| Stabilization 2C | Isolated release engineering; not a product dependency. |

No dependency edge changes. Slice 4.7 remains ineligible until the runtime authorized here is merged and post-merge acceptance is green.

## 3. Required sources

The runtime implementation must read and preserve the current versions of:

- `/AGENTS.md`;
- `docs/context/README.md`;
- `docs/context/PRODUCT_PRINCIPLES.md`;
- `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md`;
- `docs/context/RFX_TRANSACTION_CYCLE.md`;
- `docs/context/MAP_AND_GEOGRAPHY.md`;
- `docs/context/COMMERCIAL_MODEL.md`;
- `docs/rfx/RFX_CORE_AMACS_CONVERGENCE.md`;
- `docs/rfx/AMACS_0_5_RECONCILIATION.md`;
- `docs/rfx/AMACS_INTEGRATION_CONTRACT.md`;
- `docs/rfx/RFX_CORE_FEATURE_CROSSWALK.md`;
- `docs/rfx/RFX_CORE_PRODUCT_WORKSPACES.md`;
- `docs/rfx/RFX_CORE_ACCEPTANCE_MATRIX.md`;
- `docs/slices/AI_AMACS_INTERPRETATION_FOUNDATION.md`;
- `docs/slices/SLICE_3_3_MARKET_PROFILE_ENRICHMENT.md`;
- `docs/slices/SLICE_4_4_EXECUTION_AUTHORITY.md`;
- `docs/slices/SLICE_4_5_EXECUTION_AUTHORITY.md`;
- `docs/architecture/WAVE_4_SLICE_4_4.md` and `docs/architecture/WAVE_4_SLICE_4_5.md`;
- applicable brand/design messaging, workspace, authorization, privacy, lifecycle, Firestore, internationalization, accessibility, performance and recovery authorities; and
- the existing market-profile, RFx publication, opportunity discovery/watch and organization-operation abstractions before introducing new contracts.

Prototype match percentages, tutorial organizations and synthetic scenarios are not production authority. Test RFxs and organizations remain isolated fixtures and never enter production fit or pursuit state.

## 4. Discovery-source attribution

`RSP-001` keeps three meanings structurally distinct:

- **Discovered** — the participant reached the opportunity through permitted browse, search, saved search or a controlled deep link.
- **Potential Match** — the versioned deterministic policy in this authority found at least one exact alignment between a confirmed structured capability of the acting organization and a published canonical capability requirement.
- **Invited** — an issuer or authorized participant created a real invitation under the later Slice 4.7 authority.

Sources may coexist and remain attributable; they are not a quality ladder. A saved-search criteria match is `Discovered`, not automatically `Potential Match`. Slice 4.6 cannot create or display a live `Invited` attribution because no real RFx invitation aggregate exists yet.

None of the three means qualified, eligible, verified, endorsed, compliant, able to deliver, profitable, likely to bid, likely to win or selected. Commercial, Founding, sponsorship, credibility, watch and activity state cannot create or strengthen an attribution.

## 5. Deterministic fit policy

Define one server-owned, versioned comparison policy. Version 1 compares only:

- the current permitted open `ResponderOpportunityProjection` reference, version and digest;
- its frozen canonical AMACS capability requirements and stable published requirement IDs;
- the acting organization's current confirmed structured capability claims, with their AMACS release/concept snapshots and current lifecycle state;
- explicit team-coverage semantics already frozen on the published requirement; and
- current controlled service-geography facts solely for a separate geography observation.

An exact capability alignment requires the same governed AMACS concept under the release-aware compatibility contract. Labels, aliases, profile prose, websites, documents, NAICS, essential legacy free text, provisional terms, AI suggestions, rejected/unresolved interpretations, watches, clicks and commercial state cannot satisfy a capability requirement.

Potential Match policy v1 is deliberately bounded: at least one exact confirmed canonical capability alignment is required. Missing or unconfirmed requirements may coexist and remain explicit gaps; therefore Potential Match is not all-requirements coverage or qualification. When there is no exact alignment, the participant may still inspect a discovered opportunity and perform a private assessment, but the system must not label it Potential Match.

Do not calculate or display a universal fit percentage, weighted recommendation, ranking, score, probability or award likelihood. Deterministic output is an explainable set of aligned, missing, unconfirmed and not-applicable observations. Value, term and deadline remain published facts for human review, not inferred organizational fit.

Geography comparison is limited to `within confirmed service geography | outside confirmed service geography | needs confirmation | not geographically constrained`. It does not infer travel capability, licensing, eligibility, distance from a private point or willingness to perform.

## 6. Match explanation and staleness

`RSP-002` introduces a private `MatchExplanation` projection equivalent to:

```ts
type MatchExplanation = Readonly<{
  policyVersion: 1;
  organizationId: string;
  opportunityReference: string;
  opportunityProjectionVersion: number;
  opportunityProjectionDigest: string;
  organizationCapabilityInputDigest: string;
  attribution: readonly ("discovered" | "potential-match" | "invited")[];
  requirementObservations: readonly RequirementFitObservation[];
  geographyObservation: "aligned" | "outside-confirmed-area" | "needs-confirmation" | "not-applicable";
  publishedFacts: Readonly<{ deadline: string; valueSummary: string; termSummary: string; locationSummary: string }>;
  calculatedAt: string;
}>;
```

Each requirement observation names the stable published requirement, governed capability label/breadcrumb snapshot, exact confirmed organization-claim inputs used, coverage rule and one state: `aligned | missing | unconfirmed | not-applicable`. It exposes no private evidence, actor, exact location, audit, interpretation or server-index data.

The service recomputes against current inputs. A persisted assessment or pursuit records the exact explanation digests/version it reviewed, but does not freeze future fit truth. When the opportunity projection, policy or organization capability input digest changes, the UI marks prior review stale and requires current recomputation/reconfirmation before a consequential decision.

## 7. Private Go/No-Go assessment

`RSP-003` introduces one private, organization-owned `PursuitAssessment` per organization/opportunity relation. It is not visible to the issuer, other responders, public discovery, ranking or market analytics.

The assessment records participant-confirmed observations for:

- capability/requirement fit;
- eligibility or mandatory-condition review;
- capacity and schedule;
- economics/value/term;
- geography/performance feasibility; and
- material gaps.

Each dimension uses an explicit state such as `not-reviewed | acceptable | concern | blocking | needs-confirmation`, plus bounded participant-authored notes where useful. The system may prefill the deterministic capability/geography observations but cannot decide eligibility, capacity, economics or Go/No-Go. The participant reviews every retained assessment value.

Assessment create/update requires current authority, expected version and exact explanation input digests. Stable command IDs/fingerprints provide replay; stale opportunity/profile/assessment versions conflict with bounded refresh-and-review recovery. Participant-authored notes remain verbatim and are not automatically translated or used as authoritative market observations.

## 8. Pursue, Watch and Decline relation

`RSP-004` establishes one organization-owned `OpportunityPursuit` per `(organization, opportunity reference)` in `watch | pursue | decline`, with an implicit undecided absence state. Actor user/membership remain audit evidence rather than ownership. The relation references the one immutable published opportunity and never clones or transfers RFx ownership.

The existing Slice 4.5 `OpportunityWatch` remains the canonical user-private bookmark and must be explicitly transitioned rather than silently reinterpreted:

- an active watch owned by the acting user may initialize the proposed organization decision as `watch`;
- saving that organization decision atomically creates/updates the organization pursuit and removes the acting user's personal watch from active state;
- later organization decision changes use the same pursuit service and record;
- personal watches owned by other users remain distinct bookmarks and never compete with, override or grant the organization decision; and
- historical watch commands/events remain append-only evidence.

Before the canonical deadline, an authorized participant may change the organization decision among Watch, Pursue and Decline with expected-version and current-input review. A decision change appends evidence; it never rewrites history. Passed deadlines, stale/withdrawn publication authority, permission loss or restrictions fail closed. Decline does not notify the issuer or prevent another currently authorized response manager from reviewing/changing the organization decision. Pursue does not create a response, invite a teammate, reserve capacity, prove eligibility or promise submission; it only makes the later Slice 4.8 response-creation precondition true.

Consequential assessment and Pursue/Decline decisions reuse the canonical organization-operation authorization boundary and current `response.create` permission rather than conflating responder authority with issuer-only `rfx.create`/`rfx.publish`, inventing client authority or creating a parallel permission system. Watch remains available through the accepted Slice 4.5 participant relation boundary, while any transition to or from a consequential decision rechecks the stronger current authority server-side.

## 9. Typed gaps

`RSP-006` derives a private `GapAssessment` from the current MatchExplanation plus participant-confirmed assessment. Supported v1 gap kinds are bounded to:

- `missing-capability` — no current confirmed compatible organization claim aligns to the published canonical requirement;
- `unconfirmed-capability` — a participant indicates possible coverage, but no eligible confirmed structured claim currently proves the comparison input;
- `requirement-review` — the published condition needs participant review and cannot be reduced to a capability match; and
- `evidence-confirmation` — evidence is requested or relevant, but its presence/acceptability has not been confirmed.

Every gap references a stable published requirement/capability snapshot, explanation input digest and resolution status `open | acknowledged | resolved-by-current-profile | deferred`. A gap is not a compliance failure, disqualification or team recommendation. Resolution re-evaluates authoritative current inputs; a participant cannot mark a missing canonical capability aligned by changing UI state or notes.

Slice 4.6 may expose truthful future actions such as `Update profile` or `Review requirement` when those existing routes are authorized. `Find a teammate` and `Find support` remain unavailable/non-routable in this slice; Slice 4.7 owns contextual discovery, invitations and provider routing.

## 10. Operational Workspace and spatial continuity

Opportunity discovery remains the synchronized Spatial Workspace. Selecting `Assess fit` opens a bounded responder Operational Workspace for the same opaque opportunity reference without launching a separate application or losing safe lens/map/query context.

The responder workspace uses the existing participant shell and shows:

- exact discovery-source meaning;
- continuous requirement-alignment rows rather than a card wall;
- evidence/uncertainty and typed gaps;
- canonical geography, value, term and deadline facts;
- private assessment dimensions; and
- one clear Watch, Pursue or Decline decision control.

Back/close returns to the permitted discovery selection and safe spatial context. Reload and deep link re-resolve current participant, organization, opportunity and relation authority. Desktop, intermediate and mobile layouts keep the same information hierarchy; the complete workflow remains keyboard and screen-reader operable without map-pointer use.

## 11. Authorization, privacy and client access

Viewing fit requires current authenticated, unrestricted OPEN participant authority and current access to the opportunity projection. Private explanation inputs, assessments, gaps and pursuit relations require exact current user, organization and active membership context.

Consequential mutations re-resolve account, user, membership, organization, permission, restrictions, opportunity audience/version/digest, controlled geography release and deadline inside the trusted transaction. Wrong-user, wrong-organization, inactive membership, restricted account/organization/membership, disabled/unverified/revoked account, issuer-self pursuit, guessed reference/ID and cross-tenant cases fail closed before private content or record existence is disclosed.

Direct browser Firestore access remains default-denied for fit snapshots, assessments, gaps, pursuit relations, commands, events and audit evidence. Trusted handlers return only minimized authorized participant projections. Another responder and the issuer cannot read the acting organization's private fit, notes, gaps or decision.

## 12. Persistence, concurrency and evidence

Private assessment/pursuit state uses stable `(organization, opportunity reference)` identity, explicit version, server timestamps, expected-version concurrency, stable command IDs/fingerprints, immutable events and organization audit evidence. Decision plus acting-user watch transition plus command/event/audit writes occur atomically.

Exact replay returns the committed result without duplicate state or evidence. A command ID reused for changed intent conflicts. Concurrent or stale explanation, assessment, opportunity, profile-input or pursuit versions fail without partial writes. Business state remains separate from optional telemetry or UI analytics.

Fit calculation may be ephemeral on read, but a Potential Match attribution, assessment save or decision must retain minimized immutable calculation provenance: policy version, opportunity reference/version/digest, organization capability input digest, observation states and calculation timestamp. It must not retain private evidence documents or copy complete profile/RFx aggregates.

## 13. AI, AMACS and commercial boundaries

No AI call is required or authorized to calculate fit, infer eligibility, score an organization, recommend Pursue/Decline or resolve a gap. Deterministic comparison uses confirmed structured records and the pinned release-aware AMACS contracts.

AI may be authorized later to explain already-computed observations, but it may not change them. Provider/model output, rejected/unresolved interpretations and model-memory IDs have no authoritative effect. A complete manual path remains available.

Commercial status, Founding recognition, sponsorship, credential/verification status and provider approval cannot change fit inputs, Potential Match attribution, gaps, pursuit permissions or discovery ranking. Credentials/evidence may be displayed for participant review only where currently authorized; they do not silently become qualification.

## 14. Participant copy, states and accessibility

Copy must use `Potential Match`, not `qualified`, `recommended`, `best fit`, `win probability` or similar overclaims. Explain inputs and uncertainty in plain language. Empty/no-alignment copy states that no exact confirmed structured capability overlap was found from current records; it does not state that the organization cannot perform the work.

Every surface distinguishes loading, no-alignment, incomplete-profile, stale-input, deadline-passed, restricted, conflict, dependency-error and recovery states. Pending save/decision actions provide immediate scoped feedback without replacing the persistent shell or clearing safe content.

All changed RFxchange-controlled copy exists in English, Spanish, French, Italian and German. Acceptance covers desktop, intermediate and 390 px mobile, long labels, keyboard-only operation, screen-reader row/decision semantics, focus restoration, live-region restraint, visible focus, target sizing, reduced motion, high contrast and no horizontal overflow.

## 15. Required acceptance

### Domain/application

- Discovered, Potential Match and Invited attribution meanings are explicit; only real current sources can be attached and Slice 4.6 never fabricates Invited;
- the same versioned deterministic policy produces identical requirement observations for identical published/profile inputs;
- only exact compatible confirmed structured capability claims align; prose, provisional, legacy, AI and commercial inputs cannot align;
- missing/unconfirmed requirements remain gaps and do not prevent the bounded Potential Match label after at least one exact alignment;
- no percentage, ranking, eligibility, qualification, profitability or award-likelihood result is produced;
- geography/value/term/deadline facts remain separate from inferred organizational capability;
- stale opportunity/profile/policy/assessment inputs require recomputation and explicit review;
- assessment dimensions remain private and participant-confirmed;
- one organization/opportunity tuple has one Watch/Pursue/Decline decision while personal bookmarks remain separately scoped and non-authorizing;
- Pursue is the only later response-creation precondition but creates no response here;
- typed gaps reference stable published requirements and resolve only from current authoritative facts; and
- all negative account/membership/permission/restriction/audience/deadline/tenant cases fail closed.

### Firestore emulator

- real Slice 4.4 publication plus Slice 4.5 discovery feeds fit; drafts, expired/wrong-audience/corrupt projections do not;
- confirmed structured claim overlap creates reproducible Potential Match provenance and exact observation rows;
- unconfirmed, provisional, legacy-text, private-other-tenant and invented AMACS inputs do not align;
- assessment create/update and Watch/Pursue/Decline transitions atomically persist one current record, command receipt, append-only event and organization audit;
- an existing acting-user Slice 4.5 watch is atomically transitioned when the organization decision is created, without rewriting another user's bookmark;
- exact replay is inert; altered fingerprint, stale version/digest and concurrent mutation fail without partial writes;
- permission/restriction/deadline/publication changes between read and write fail closed;
- issuer/other-responder/cross-tenant and direct-client reads/writes are denied; and
- exact cleanup plus global run-ID scan returns zero residual Auth/Firestore records.

### Configured browser

- a real published opportunity and two real responder organizations prove exact alignment, no-alignment and typed-gap states without production fixtures;
- discovery detail states why the opportunity surfaced and never converts a saved-search criteria match into Potential Match;
- Assess fit preserves the persistent shell and safe return to the synchronized opportunity selection;
- deterministic aligned/missing/unconfirmed rows and canonical geography/value/term/deadline facts render accessibly without raw IDs or private evidence;
- the participant saves/reloads a private assessment, sees stale-input recovery after a controlled profile/version change and cannot access it cross-tenant;
- an existing Watch transitions to Pursue and then Decline with exact reload/replay behavior and no duplicate active relation;
- Pursue states truthfully that response construction is not yet available and creates no response/team/invitation record;
- expired/permission-removed/restricted mutations fail with bounded recovery while safe content and shell remain intact;
- desktop, intermediate, 390 px, keyboard-only, five-locale, reduced-motion, high-contrast and no-overflow checks pass;
- console, page errors and unhandled rejections remain clean; and
- all disposable Auth/Firestore fixtures are removed with zero residuals.

Run focused fit/assessment/pursuit tests, Firestore emulator acceptance, internationalization/accessibility checks, `git diff --check`, the canonical `npm run check`, exact-head CI and post-merge CI.

## 16. Feature evidence

- `RSP-001` is accepted only with real attributable Discovered/Potential Match semantics, a truthful future Invited boundary and no qualification/endorsement overclaim.
- `RSP-002` is accepted only with reproducible release-aware requirement/capability alignment, explicit uncertainty/gaps and separate canonical market facts.
- `RSP-003` is accepted only with a private versioned participant-confirmed Go/No-Go assessment covering fit, eligibility, capacity, economics, geography and gaps.
- `RSP-004` is accepted only with one organization-owned governed Watch/Pursue/Decline state, an explicit atomic acting-user watch transition, authorized replay-safe changes and no response creation.
- `RSP-006` is accepted only with typed stable requirement-linked missing/unconfirmed/review/evidence gaps that cannot be resolved by UI assertion.

Tracker changes occur only in the runtime PR after each feature's own acceptance passes. This documentation authority leaves the tracker at **438 total · 170 Done · 268 Not Started**, Wave 4 RFx Core at **18/41**, B6b intentionally pending and B6c eligible but Not Started.

## 17. Explicit exclusions and stop boundary

This authority does not implement:

- Slice 4.7 teammate/resource discovery, RFx invitations, team acceptance/decline, external acquisition continuity or relationship paths;
- response creation, compliance matrix, assignments, readiness, submission or external handoff;
- evaluator assignment, conflicts, scoring, consensus, ranking, recommendation, selection, award or outcomes;
- issuer visibility into responder fit, notes, gaps or pursuit state;
- invitation attribution without a real separately authorized invitation;
- AI fit scoring, recommendations, auto-decisions or market ranking;
- RFx amendment, addendum, Q&A, withdrawal, cancellation, close, extension or republication;
- named-recipient/invite-only/sealed/limited-bidder audiences;
- notifications, issuer alerts, marketing campaigns, SMS, push, sound or haptics;
- B6c completion or RFx relationship-path expression;
- paid placement, billing, checkout or commercial enrollment;
- Dark Appearance, appearance preference or Presentation Mode;
- Firebase App Hosting, deployment or build-identity changes; or
- Stabilization 2C.

After the runtime merges and exact post-merge acceptance is green, recalculate from merged `main` and define the documentation-only Slice 4.7 authority for `DSC-010`, `RSP-007`, `RSP-008`, `TEM-001`, `TEM-002`, `TEM-003`, `TEM-004` and `ACQ-007` under the standing Wave 4 authorization.
