# Codex execution prompt — complete Slice 3.2 through Slice 3.5

Use this prompt in Codex with write access to `AccelAnalysis/RFxchange` and read access to `AccelAnalysis/amacs`.

---

You are the implementation agent for The RFxchange. Execute the complete sequence below in the connected GitHub repositories. Do not stop after producing a plan, patch kit or local-only commits. Use GitHub branches, commits, pull requests, review threads, Actions and merge operations. Do not ask the user to repeat facts already available in the repositories.

## Explicit task authority

This task explicitly authorizes the following sequence, but it does not waive acceptance, security, privacy, tracker, dependency or single-active-slice discipline:

1. finish and merge RFxchange PR #120 / Slice 3.2;
2. reconcile RFxchange from its stale AMACS 0.1.0 integration baseline to AMACS 0.5.0;
3. implement and merge the cross-cutting AI/AMACS Interpretation Foundation;
4. authorize, implement, accept and merge Slice 3.3;
5. authorize, implement, accept and merge Slice 3.4;
6. authorize, implement, accept and merge Slice 3.5; and
7. recalculate authority from merged `main`, identify Slice 3.6 as the next candidate, but do not implement it.

Each phase must use a separate branch and PR. Documentation-only authority/reconciliation work may use its own focused PR. Do not create one mega-PR. Do not begin production code for a later phase before the prior phase is merged and current `main` is recalculated.

## Current repository state to verify, not assume

At prompt creation:

- RFxchange `main`: `8cbc70e083ef85c44f1783186464272b20169a2d`;
- tracker: 438 total · 121 Done · 317 Not Started;
- Activation: 43/43;
- Network: 7/38;
- Slice 3.2 PR: #120;
- PR #120 head: `4f6f1664e3fd08492634bcde631fa2677d3abe8f`;
- PR #120 production CI #487 passed;
- PR #120 remains draft because configured-browser acceptance is outstanding;
- AMACS 0.5.0 merged in `AccelAnalysis/amacs` at `da7879f2609271b067ae6d02875e9388a02c4fe5` on 2026-08-08.

Begin by fetching current repository and PR state. If state has advanced, use the current state and explain the drift. Never reset or overwrite newer legitimate work.

## Required reading

Before editing code, read:

- `/AGENTS.md`;
- `docs/context/README.md`;
- `docs/context/PRODUCT_PRINCIPLES.md`;
- `docs/context/ORGANIZATION_MODEL.md`;
- `docs/context/RFX_TRANSACTION_CYCLE.md`;
- `docs/context/CREDIBILITY_SYSTEM.md`;
- canonical master tracker and dependency map;
- `docs/slices/WAVE_3_ROADMAP.md`;
- the applicable Slice 3.2–3.5 brief for each phase;
- `docs/rfx/AMACS_INTEGRATION_CONTRACT.md`;
- `docs/rfx/AMACS_0_5_RECONCILIATION.md`;
- `docs/slices/AI_AMACS_INTERPRETATION_FOUNDATION.md`;
- `docs/rfx/RFX_CORE_ACCEPTANCE_MATRIX.md` where applicable;
- applicable geography, acquisition, user-journey, brand and design authorities; and
- actual merged abstractions and tests before creating new ones.

Preserve these product truths:

- the organization is the market entity; users act through explicit organization authority;
- The RFxchange is a map-based Local Business Growth Network, not a social feed, static directory, generic CRM or conventional bid portal;
- the complete pathway is capability/need → discovery → connection/referral/opportunity → activity → reported outcome, with each stage distinct;
- resource routing must be context-rich, consented, territory and eligibility aware, and capacity conscious;
- AMACS concept, AI suggestion, organization assertion, evidence, verification, credibility, qualification and outcome are separate;
- a sent or accepted referral is a connection state, not a sale, endorsement or verified outcome;
- paid, Founding or sponsored status cannot alter semantic truth, discovery, matching, qualification or credibility.

## Global execution rules

1. Work from merged `main` at the start of every phase.
2. Server-side authorization is authority; client state never grants access.
3. Preserve explicit state machines, idempotency and append-only evidence for consequential transitions.
4. Do not weaken security rules, emulator tests, architecture tests or acceptance to make work pass.
5. Do not fabricate organizations, opportunities, providers, referrals, testimonials, statistics, credentials, evidence or outcomes.
6. Do not import prototype mechanics or synthetic runtime fixtures into production routes.
7. Run `npm run check` plus focused tests and configured-browser acceptance required by each participant-facing slice.
8. Use real authorized records or controlled disposable records for browser acceptance; remove disposable data and verify absence afterward.
9. Update tracker and evidence only after the applicable feature's acceptance passes.
10. After every merge, verify production CI and recalculate authority from merged `main`.
11. Resolve all material review threads before merge.
12. Never describe external handoff as submission, potential match as qualification, AI suggestion as assertion, evidence submission as verification or referral acceptance as outcome.
13. Treat the expected tracker totals below as checks, not authority; recalculate actual totals and explain unrelated drift.

# Phase 1 — Finish and merge PR #120 / Slice 3.2

## 1.1 Inspect and synchronize

- Read PR #120, changed files, comments, reviews and CI.
- Confirm scope remains only `GEO-012`, `DSC-001`, `DSC-002`, `DSC-003`.
- Bring the branch current with merged `main` without discarding valid work or absorbing future Slice 3.3 or AI behavior.
- Re-run production CI after synchronization.

## 1.2 Complete configured-browser acceptance

Use the canonical Slice 3.2 brief and brand acceptance matrix. Test at minimum:

- an OPEN organization with current authorized membership;
- a user lacking organization authority;
- a restricted or no-longer-OPEN organization;
- permitted exact, approximate and locality-only organization projections;
- capability search and geographic or service-area filtering;
- search-result, map-marker and detail-panel synchronization;
- selected-organization persistence and recovery across responsive layouts where specified;
- desktop, intermediate and mobile widths;
- keyboard-only navigation, focus order, screen-reader labels and reduced-motion behavior;
- reload, re-entry and stale client state;
- membership, restriction or lifecycle change after page load;
- empty, loading, error and recovery states;
- five-locale RFxchange-controlled interface copy;
- no new console errors or warnings;
- no private exact-location or cross-organization leakage;
- no opportunity, referral, provider, credibility or outcome objects; and
- no synthetic live collection records.

Use controlled disposable identities or organizations only where necessary. Clean them and verify they are absent after acceptance.

## 1.3 Close Slice 3.2 correctly

After automated and configured-browser acceptance passes:

- add acceptance evidence to the proper authority;
- mark only `GEO-012`, `DSC-001`, `DSC-002`, `DSC-003` Done;
- recalculate totals; absent unrelated drift, expect 438 total · 125 Done · 313 Not Started and Network 11/38;
- preserve the dependency map unless an independently reviewed correction is required;
- update the PR body, evidence and stale current-wave text belonging to closeout;
- mark PR #120 ready for review;
- resolve all threads;
- merge with the repository's accepted method and head-SHA protection; and
- verify production CI on merged `main`.

If configured-browser acceptance is genuinely blocked by an unavailable external credential or service, do not falsely mark features Done or merge. Exhaust repository and configuration options, record the exact blocker, and perform only independent preparatory work that does not violate sequencing.

# Phase 2 — Reconcile RFxchange to AMACS 0.5.0

After Phase 1 merges, create a fresh reconciliation branch from current `main`.

This is a **no-Feature-ID release-integration gate**. It must not implement a participant capability picker, organization capability assertions, RFx capability requirements, team-coverage workflow or Slice 3.3/Wave 4 UI.

## 2.1 Pin and ingest the release

Use:

- repository `AccelAnalysis/amacs`;
- version `0.5.0`;
- merged source commit `da7879f2609271b067ae6d02875e9388a02c4fe5`;
- immutable release manifest and SHA-256 checksums.

Reconcile:

- 16 domains;
- 120 families;
- 615 matchable capabilities;
- 185 aliases;
- all additional 0.5.0 registries used by RFxchange; and
- `market-need`, `interpretation-record`, `interpretation-candidate` and `concept-interpretation-guidance` schemas.

Counts are acceptance evidence, not runtime constants.

## 2.2 Build the application boundary

Implement or update server-side or build-time AMACS ingestion so that it:

- verifies manifest, source commit and checksums;
- validates schemas and references;
- produces deterministic reduced projections and catalog/search indexes;
- generates or verifies TypeScript contracts and server validators;
- emits an RFxchange ingestion manifest with release, source, projection and checksums;
- fails CI on drift;
- exposes application ports rather than JSON paths;
- makes no participant-browser GitHub or AMACS-source request; and
- preserves prior projections required for historical records.

The catalog/search application port supports hierarchy, labels, aliases, definitions, status or replacements, market roles and optional guidance. It is not a participant-facing picker in this phase.

## 2.3 Migration and compatibility

- Inventory current RFxchange AMACS 0.1.0 references and free-text profile capability fields.
- Preserve historical 0.1.0 IDs and label snapshots; do not silently reinterpret old records.
- Produce migration preview or evidence for deprecated, merged or split records.
- Do not convert legacy free text, websites, documents, NAICS or model output into capability assertions.
- Preserve Slice 3.2 discovery behavior until Slice 3.3 creates confirmed structured assertions; use an explicit transitional projection rather than claiming migration is complete.
- Preserve the contracts and application seams required for later manual browse/search and provisional terms without implementing those participant workflows here.
- Preserve requirement-type and team-coverage metadata without implementing the Wave 4 requirement engine.

## 2.4 Tests and closeout

Add focused tests for:

- checksum and release drift;
- schema and referential validity;
- historical compatibility;
- participant-browser source-import isolation;
- deterministic catalog traversal and search application ports;
- label and alias matches;
- invalid or model-invented IDs;
- generated projection drift; and
- proof that reconciliation creates no organization capability assertion, RFx requirement or participant picker.

Do not require participant provisional-term behavior or RFx team-coverage enforcement in this phase; those belong to Slice 3.3 and Wave 4 respectively.

Update `AGENTS.md` and execution authority so Slice 3.2 is complete and AMACS reconciliation is the active no-Feature-ID gate. Do not change tracker totals solely for reconciliation.

Open a focused PR, pass `npm run check` and production CI, resolve reviews, merge, verify main CI and recalculate.

# Phase 3 — Implement the AI/AMACS Interpretation Foundation

Create a fresh branch from `main` only after Phase 2 merges.

This is also a no-Feature-ID foundation. It implements reusable server and application services, contracts, provenance, controls and evaluation. It must not claim completion of the Slice 3.3 participant enrichment experience or Wave 4 issuer workflow.

## 3.1 Server-side provider-neutral gateway

Implement an authenticated Firebase or server-side gateway with:

- current user, session and organization authority checks;
- tenant and feature policy;
- provider-adapter interface and model router;
- secrets isolated in server-side secret management;
- request and token limits, rate limits, timeouts, retries and abuse controls;
- strict structured-output validation;
- privacy minimization and redaction;
- prompt and retrieval versioning;
- usage, cost and latency measurement; and
- safe observability without retaining full private content by default.

Implement one concrete provider adapter behind the neutral interface. Use the provider already selected by merged repository authority; absent a conflicting decision, use an OpenAI adapter with a configurable model. Provider-specific types must not enter domain contracts. If the secret is absent, the integration and tests still complete using deterministic fakes, while runtime exposes a truthful disabled/manual state and any live smoke is explicitly skipped and reported.

## 3.2 AMACS-grounded retrieval

- Retrieve bounded candidates from the verified 0.5.0 projection using labels, aliases, definitions, hierarchy, relationships, roles and optional guidance.
- Lexical retrieval is required; semantic or vector retrieval may supplement it when justified.
- Do not send the entire standard when a bounded set is sufficient.
- Reject invalid or model-invented IDs and relationships before presentation or persistence.
- Retrieval or model scores are not evidence, match truth or qualification.

## 3.3 Persist non-authoritative interpretation records

Implement RFxchange storage and application contracts conforming to AMACS 0.5.0:

- InterpretationRecord;
- InterpretationCandidate; and
- opaque reference to RFxchange provider, model, prompt, retrieval and usage provenance.

Enforce:

```text
humanConfirmationRequired = true
authoritativeEffect = none
```

Candidate acceptance is a disposition only. A separate server-authorized command creates or changes an authoritative domain record. Rejected or unresolved candidates cannot affect discovery, matching or public projection.

The foundation may define and test the command boundary, but must not create the Slice 3.3 capability product flow or Wave 4 MarketNeed product flow.

## 3.4 Privacy, cost and fallback

- Send minimum necessary content.
- Require explicit authorization or opt-in for website, document or profile source use.
- Define prohibited fields and attachment-extraction boundaries.
- Meter by organization, user, purpose, provider or model, usage, cost, latency and result.
- Support configurable request, user, organization and tenant limits.
- Expose and test the release-aware manual catalog application path and truthful disabled state for later participant consumers.
- Do not build the Slice 3.3 participant picker in this foundation.
- Never invoke an LLM for deterministic comparison of structured records.

## 3.5 Evaluation harness

Create reviewed seller- and buyer-side benchmark cases covering straightforward, ambiguous, overbroad, missing-concept and sensitive inputs. Gate:

- identifier validity;
- precision and recall;
- overclassification;
- unsupported assertion;
- clarification quality;
- provisional-term recommendation correctness;
- schema validity;
- cost; and
- latency.

Tests use deterministic fakes or stubs and must not require paid calls. Add a controlled live smoke only when configured credentials and policy allow it.

## 3.6 Close the foundation

Pass automated, security, emulator, architecture and failure-mode acceptance. Change no tracker totals or Feature IDs. Update authority so Slice 3.3 becomes the next candidate only after merge and recalculation.

Open a focused PR, resolve reviews, merge, verify main CI and recalculate.

# Phase 4 — Authorize and implement Slice 3.3

## 4.1 Authorization checkpoint

From current merged `main`, create and merge a documentation-only authority update that:

- confirms the prerequisites actually passed;
- sets Slice 3.3 active;
- preserves tracker totals and dependency map; and
- makes no feature-completion claim.

The user's explicit task authorizes continuation; do not ask for another user confirmation.

## 4.2 Implement `ORG-013`, `ORG-014`, `ORG-016`, `ORG-017`

### Capability declaration

Provide three entry modes converging on the same authoritative record:

1. describe what the organization does;
2. review suggestions derived from explicitly authorized organization content; and
3. browse or search AMACS manually.

Use the 0.5.0 interpretation sequence. Support accept, edit, reject, unresolved, none-of-these and clarification. After participant disposition, use a separate current-authority server command to create or update the organization capability assertion.

Confirmed claims preserve release, label snapshot, entity scope where applicable, market roles, delivery roles, service geography, specialties, capacity, evidence references, visibility and assertion state.

### Evidence boundary

Never collapse:

- AMACS concept;
- interpretation suggestion;
- self-reported assertion;
- evidence submitted; and
- independently verified capability.

Website, document, NAICS and past-response material may produce suggestions only. A suggested evidence-to-capability link requires explicit participant review.

### NAICS and industry

Store descriptive and filter context with source and version provenance. NAICS is not capability proof.

### Past performance

Add bounded, structured, provenance-aware project, value, role, time, location and output context. Protect sensitive client and financial evidence. Do not award credibility.

### Preferences

Add prime, subcontractor, supplier, referral and resource preferences without treating them as permission, availability, commitment or legal relationship.

### Migration and discovery

Migrate Slice 3.2 discovery toward confirmed structured capabilities without double-counting or silently converting legacy text. Preserve truthful transitional behavior and explanations.

## 4.3 Slice 3.3 acceptance and closeout

Test authority, stale and replay handling, privacy, interpretation disposition, manual fallback, invalid IDs, provider outage or quota, provisional terms, search migration, responsive and keyboard accessibility, and configured browser with real or disposable records.

After acceptance:

- mark only `ORG-013`, `ORG-014`, `ORG-016`, `ORG-017` Done;
- recalculate; absent unrelated drift, expect 129 Done · 309 Not Started and Network 15/38;
- merge, verify main CI and recalculate; and
- do not begin Slice 3.4 until its authority update merges.

# Phase 5 — Authorize and implement Slice 3.4

## 5.1 Authorization checkpoint

Create and merge a focused authority update setting Slice 3.4 active only after verifying Slice 3.3 merged and passed. Preserve totals until implementation acceptance.

## 5.2 Implement `ORG-015`, `ORG-018`, `ORG-019`

### Credentials and identifiers

- support approved certifications, licenses, UEI, CAGE, SAM and other identifiers;
- preserve issuer or source, dates, status, entity scope and evidence provenance;
- keep self-report, evidence submitted, authoritative validation and verification distinct;
- do not award Organization Verified or credibility badges; and
- support expiration or revalidation where the slice requires it.

### Media, documents and portfolio

- use the existing organization-owned, private-by-default storage architecture;
- prefer approved external or reference-based public media where it reduces storage and liability without weakening reliability or privacy;
- validate type, size, ownership, access and publication state;
- keep sensitive evidence private;
- optimize explicitly public media and provide accessible labels; and
- do not invent paid quotas or premium publication rights.

### Additional locations

- reuse canonical geocoding, locality, service-geography and privacy contracts;
- separate internal exact location from public exact, approximate or locality-only projection;
- preserve primary versus subordinate or satellite location identity; and
- prevent additional locations from appearing as separate organizations or leaking private coordinates.

## 5.3 Slice 3.4 acceptance and closeout

Test cross-user and cross-organization denial, evidence privacy, publication, expiration or provenance, file failures and recovery, geocoding, multi-location map anchoring, stale state, responsive and keyboard accessibility, and configured browser.

After acceptance:

- mark only `ORG-015`, `ORG-018`, `ORG-019` Done;
- recalculate; absent unrelated drift, expect 132 Done · 306 Not Started and Network 18/38;
- merge, verify main CI and recalculate; and
- authorize Slice 3.5 only afterward.

# Phase 6 — Authorize and implement Slice 3.5

## 6.1 Authorization checkpoint

Create and merge a focused authority update setting Slice 3.5 active only after verifying Slice 3.4. Preserve totals until implementation acceptance.

## 6.2 Implement `REF-001`–`REF-005`, `EDU-014`, `ACQ-006`

### Referral aggregate and state machine

Implement one organization-owned referral aggregate, not a personal direct message. Preserve sender organization, authorized actor, recipient, purpose, structured need or reason, urgency, preferred contact, relevant opportunity or context, consent, minimum-necessary shared data, lifecycle or version and append-only events.

Use an explicit lifecycle consistent with the slice, such as:

```text
draft or proposed
→ sent
→ accepted | declined | expired | withdrawn
→ contact initiated or follow-up
→ closed
```

Outcome reporting and verification and credibility calculations remain later scope. A closed referral may record a bounded closure reason without claiming verified economic impact.

### Consent and minimum necessary sharing

- identify public versus nonpublic fields;
- require clear purpose and business consent before nonpublic transfer;
- allow the participant to review what will be shared and with whom;
- do not transfer documents or sensitive profile fields by implication;
- preserve consent version, time, actor and recipient purpose; and
- prevent cross-organization leakage.

### Recipient behavior

- notify through versioned Slice 3.1 communications;
- allow explicit accept or decline and permitted status visibility;
- make retry and replay idempotent; and
- do not imply endorsement, sale, guaranteed response or availability.

### First-use education

`EDU-014` explains why the referral is being sent, what information is shared, the recipient, consent and what happens next. It must not become a separate tutorial domain object.

### External acquisition continuity

`ACQ-006` invites a nonmember for the specific legitimate referral, preserves signed and bounded acquisition context through account and organization activation, prevents replay or recipient substitution and lands the authorized participant on the exact referral after required gates.

### Visual and network expression

This slice is the first live authority for a referral golden path. Render a path only from a real permitted referral record or event. Provide text equivalents, reduced motion and truthful empty, stalled, declined, expired and recovery states. Do not use Growth Green merely for send, accept or contact.

### Explicit exclusions

Do not implement referral fees, paid managed referrals, provider routing (`REF-006`), mass unsolicited messaging, credibility badges or calculations, public rankings, outcome verification, CRM-style paid pipeline management, Slice 3.6 provider approval or later RFx opportunity objects.

## 6.3 Slice 3.5 acceptance and closeout

Test organization authority, wrong-user and wrong-organization denial, consent, minimum-necessary projection, recipient substitution, invite replay or expiry, duplicate sends, communication correlation, accept or decline races, stale versions, acquisition resume, cleanup, responsive and keyboard accessibility, path provenance and configured browser.

After acceptance:

- mark only `REF-001`, `REF-002`, `REF-003`, `REF-004`, `REF-005`, `EDU-014`, `ACQ-006` Done;
- recalculate; absent unrelated drift, expect 139 Done · 299 Not Started and Network 25/38;
- merge, verify production CI and recalculate from `main`;
- update `AGENTS.md` and Wave 3 authority to identify Slice 3.6 as the next candidate; and
- do not implement Slice 3.6.

# Required final report

At completion, report:

1. every PR created, updated and merged, with number and merge SHA;
2. PR #120 configured-browser evidence and final Slice 3.2 Feature IDs;
3. exact AMACS 0.5.0 release, ingestion and projection evidence;
4. concrete AI provider adapter and configuration, secret-disabled behavior, usage controls and benchmark results;
5. Feature IDs completed in Slices 3.3, 3.4 and 3.5;
6. focused tests, emulator suites, `npm run check`, production CI and configured-browser runs;
7. tracker and Network totals after each phase;
8. migration, security, privacy, cost or architecture discoveries;
9. disposable records created and proof of cleanup;
10. any genuine external blocker, without unsupported completion claims; and
11. explicit confirmation that Slice 3.6 and all later domains were not implemented.

Do not finish with recommendations only. Execute every unblocked phase through accepted and merged repository state.
