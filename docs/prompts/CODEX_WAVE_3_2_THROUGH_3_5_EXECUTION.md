# Codex execution prompt — complete Slice 3.2 through Slice 3.5

Use this prompt in Codex with write access to `AccelAnalysis/RFxchange` and read access to `AccelAnalysis/amacs`.

---

You are the implementation agent for The RFxchange. Execute the complete sequence below in the connected GitHub repositories. Do not stop after producing a plan, a patch kit or local-only commits. Use GitHub branches, commits, pull requests, review threads, Actions and merge operations. Do not ask the user to repeat repository facts already available from the repositories.

## Explicit task authority

This task explicitly authorizes the following sequence, but it does not waive acceptance, security, privacy, tracker or single-active-slice discipline:

1. finish and merge RFxchange PR #120 / Slice 3.2;
2. reconcile RFxchange from its stale AMACS 0.1.0 integration baseline to AMACS 0.5.0;
3. implement and merge the cross-cutting AI/AMACS Interpretation Foundation;
4. authorize, implement, accept and merge Slice 3.3;
5. authorize, implement, accept and merge Slice 3.4;
6. authorize, implement, accept and merge Slice 3.5; and
7. recalculate authority from merged `main`, identify Slice 3.6 as the next candidate, but do not implement it.

Each implementation phase must use a separate branch and PR. Documentation-only authority/reconciliation work may use its own focused PR. Do not create one mega-PR and do not begin production code for a later phase before the prior phase is merged and current `main` is recalculated.

## Current repository state to verify, not assume

At prompt creation:

- RFxchange `main`: `8cbc70e083ef85c44f1783186464272b20169a2d`;
- current tracker: 438 total · 121 Done · 317 Not Started;
- Activation: 43/43;
- Network: 7/38;
- Slice 3.2 PR: #120;
- PR #120 head at prompt creation: `4f6f1664e3fd08492634bcde631fa2677d3abe8f`;
- PR #120 production CI #487 passed;
- PR #120 is still draft because configured-browser acceptance remains outstanding;
- AMACS 0.5.0 merged in `AccelAnalysis/amacs` at `da7879f2609271b067ae6d02875e9388a02c4fe5` on 2026-08-08.

Begin by fetching current repository/PR state. If commits have advanced, use current state and explain the drift. Never reset or overwrite newer legitimate work.

## Required authority and product reading

Before editing code, read:

- `/AGENTS.md`;
- `docs/context/README.md`;
- canonical master tracker and dependency map;
- `docs/slices/WAVE_3_ROADMAP.md`;
- the applicable Slice 3.2–3.5 brief for each phase;
- `docs/rfx/AMACS_INTEGRATION_CONTRACT.md`;
- `docs/rfx/AMACS_0_5_RECONCILIATION.md`;
- `docs/slices/AI_AMACS_INTERPRETATION_FOUNDATION.md`;
- `docs/rfx/RFX_CORE_ACCEPTANCE_MATRIX.md` where applicable;
- organization, geography, acquisition, user-journey, credibility and RFx transaction context documents;
- applicable brand/design authorities; and
- the actual merged abstractions and tests before creating new ones.

Preserve these product truths:

- the organization is the market entity; users act through explicit organization authority;
- The RFxchange is a map-based Local Business Growth Network, not a social feed, static directory, generic CRM or conventional bid portal;
- the complete market pathway is capability/need → discovery → connection/referral/opportunity → activity → reported outcome, with each stage kept semantically distinct;
- resource routing must be context-rich, consented, territory/eligibility aware and capacity conscious;
- capability claims, AI suggestions, evidence, verification, credibility, qualification and outcomes are separate;
- a sent/accepted referral is a connection state, not a sale, endorsement or verified outcome;
- paid, Founding or sponsored status cannot alter legitimate semantic truth, discovery, matching, qualification or credibility.

## Global execution rules

1. Work from merged `main` at the start of every phase.
2. Use server-side authorization as authority; client state never grants access.
3. Preserve explicit state machines, idempotency and append-only evidence for consequential transitions.
4. Do not weaken security rules, emulator tests, architecture tests or acceptance to make work pass.
5. Do not fabricate organizations, opportunities, providers, referrals, testimonials, statistics, credentials, evidence or outcomes.
6. Do not import prototype mechanics or synthetic runtime fixtures into production routes.
7. Run `npm run check` plus focused tests and configured-browser acceptance required by each participant-facing slice.
8. Use real authorized records or controlled disposable records for browser acceptance; remove disposable data and verify absence afterward.
9. Update tracker/evidence only after the applicable feature's acceptance passes.
10. After each merge, run/verify production CI and recalculate the next authority from merged `main`.
11. Resolve review threads before merge. Do not merge with unresolved material review findings.
12. Never describe external handoff as submission, potential match as qualification, AI suggestion as assertion, evidence submission as verification, or referral acceptance as outcome.

# Phase 1 — Finish and merge PR #120 / Slice 3.2

## 1.1 Inspect and synchronize

- Read PR #120, its changed files, comments, reviews and CI.
- Confirm scope remains only `GEO-012`, `DSC-001`, `DSC-002`, `DSC-003`.
- Bring the branch current with merged `main` without discarding valid work or absorbing future Slice 3.3/AI behavior.
- Re-run production CI after synchronization.

## 1.2 Complete configured-browser acceptance

Use the canonical Slice 3.2 brief and brand acceptance matrix. Test at minimum:

- an OPEN organization with current authorized membership;
- a user lacking organization authority;
- a restricted or no-longer-OPEN organization;
- permitted exact, approximate and locality-only public organization projections;
- capability search and geographic/service-area filtering;
- search result, map marker and detail-panel synchronization;
- selected organization persistence/recovery across responsive layouts where specified;
- desktop, intermediate and mobile widths;
- keyboard-only navigation, focus order, screen-reader labels and reduced-motion behavior;
- reload/re-entry and stale client state;
- membership, restriction or lifecycle change after page load;
- empty, loading, error and recovery states;
- five-locale RFxchange-controlled interface copy;
- no console errors/warnings introduced;
- no private exact location or cross-organization data leakage;
- no opportunity, referral, resource-provider, credibility or outcome domain objects introduced; and
- no synthetic live collection records.

Use controlled disposable identities/organizations only where necessary. Clean them and verify they are absent after acceptance.

## 1.3 Close Slice 3.2 correctly

After automated and configured-browser acceptance passes:

- add acceptance evidence to the proper repository authority;
- mark only `GEO-012`, `DSC-001`, `DSC-002`, `DSC-003` Done;
- recalculate totals from the actual tracker; absent unrelated drift, the expected result is 438 total · 125 Done · 313 Not Started and Network 11/38;
- preserve the dependency map unless an evidence-backed correction is independently required;
- update the PR body/evidence and any stale current-wave text that belongs in the same closeout;
- mark PR #120 ready for review;
- resolve all threads;
- merge using the repository's accepted method with head-SHA protection; and
- verify production CI on merged `main`.

If configured-browser acceptance cannot be performed because a genuinely external credential/service is unavailable, do not falsely mark features Done or merge. Exhaust repository/configuration options, record the exact blocker and continue only with independent preparatory work that does not violate sequencing.

# Phase 2 — Reconcile RFxchange to AMACS 0.5.0

After Phase 1 merges, create a fresh reconciliation branch from current `main`.

## 2.1 Pin and ingest the release

Use:

- repository `AccelAnalysis/amacs`;
- version `0.5.0`;
- merged source commit `da7879f2609271b067ae6d02875e9388a02c4fe5`;
- the immutable release manifest and SHA-256 checksums.

Reconcile:

- 16 domains;
- 120 families;
- 615 matchable capabilities;
- 185 aliases;
- all additional 0.5.0 registries used by RFxchange; and
- `market-need`, `interpretation-record`, `interpretation-candidate`, and `concept-interpretation-guidance` schemas.

Counts are acceptance evidence, not participant/runtime constants.

## 2.2 Build the application boundary

Implement or update server-side/build-time AMACS ingestion so that it:

- verifies manifest, source commit and checksums;
- validates schemas and references;
- produces deterministic reduced projections and search indexes;
- generates or verifies TypeScript contracts/validators;
- emits an RFxchange ingestion manifest with release/source/projection/checksums;
- fails CI on drift;
- exposes application ports rather than JSON paths;
- makes no participant-browser GitHub/network request; and
- preserves prior projections needed for historical records.

The catalog/search projection must support hierarchy, labels, aliases, definitions, status/replacements, market roles and optional interpretation guidance when present.

## 2.3 Migration and compatibility

- Inventory existing RFxchange references to AMACS 0.1.0 and current free-text/profile capability fields.
- Preserve historical 0.1.0 IDs/label snapshots; do not silently reinterpret old records.
- Provide migration preview/evidence for deprecated, merged or split records.
- Do not convert legacy free text, organization websites, documents, NAICS or model output directly into capability assertions.
- Preserve Slice 3.2 discovery behavior until Slice 3.3 creates confirmed structured assertions; use an explicit transitional projection rather than claiming the migration is already complete.
- Retain manual hierarchy/search and provisional-term pathways.

## 2.4 Tests and documentation

Add focused tests for checksum/release drift, schema validity, historical compatibility, browser import isolation, deterministic search, alias matches, invalid IDs, provisional terms and team-coverage restrictions.

Update `AGENTS.md` and execution authority so Slice 3.2 is complete and AMACS reconciliation is the active no-Feature-ID gate. Do not change tracker totals solely for this gate.

Open a focused PR, pass `npm run check` and applicable production CI, resolve review findings, merge, verify main CI and recalculate.

# Phase 3 — Implement the AI/AMACS Interpretation Foundation

Create a fresh branch from main only after Phase 2 merges.

## 3.1 Server-side provider-neutral gateway

Implement an authenticated Firebase/server-side gateway with:

- current user/session and organization authority checks;
- tenant/feature policy;
- provider adapter interface and model router;
- secrets isolated in server-side secret management;
- request/token limits, rate limits, timeouts, retries and abuse controls;
- structured output validation;
- privacy/minimization/redaction;
- prompt and retrieval versioning;
- usage/cost/latency measurement; and
- safe observability without copying full private content by default.

Implement the first real provider adapter behind the neutral interface when repository/provider policy allows. Configuration must select the provider/model; provider-specific types must not enter domain contracts. A missing provider secret must produce a truthful disabled/manual-fallback state, not a browser error or fake success.

## 3.2 AMACS-grounded retrieval

- Retrieve bounded candidates from the verified 0.5.0 projection using labels, aliases, definitions, hierarchy, relationships, roles and optional guidance.
- Lexical search is required; semantic/vector retrieval may supplement it when justified.
- Do not send the full standard when a bounded set is sufficient.
- Reject model-invented/invalid IDs and relationships before participant presentation.
- Retrieval/model scores are not evidence or match truth.

## 3.3 Persist non-authoritative interpretation records

Implement RFxchange storage/application contracts conforming to AMACS 0.5.0:

- InterpretationRecord;
- InterpretationCandidate;
- opaque link to RFxchange provider/model/prompt/retrieval/usage provenance.

Enforce:

```text
humanConfirmationRequired = true
authoritativeEffect = none
```

Candidate acceptance is a disposition only. A separate server-authorized command creates or changes an authoritative domain record. Rejected/unresolved candidates cannot affect discovery/matching/public projection.

## 3.4 Privacy, cost and manual fallback

- Send minimum necessary content.
- Require explicit authorization/opt-in for website/document/profile source use.
- Define prohibited fields and attachment extraction boundaries.
- Meter by organization, user, purpose, provider/model, usage, cost, latency and result.
- Support configurable request/user/org/tenant limits.
- Degrade to complete manual AMACS browse/search when disabled, unavailable, rate-limited or over budget.
- Never invoke an LLM for deterministic comparison of structured records.

## 3.5 Evaluation harness

Create reviewed seller- and buyer-side benchmark cases covering straightforward, ambiguous, overbroad, missing-concept and sensitive inputs. Gate identifier validity, precision, recall, overclassification, unsupported assertion, clarification quality, provisional-term correctness, schema validity, cost and latency.

Tests must use deterministic fakes/stubs and must not require paid provider calls. Add an explicitly controlled live smoke only when a configured secret and policy allow it.

## 3.6 Close the foundation

Pass automated, security, emulator, architecture and failure-mode acceptance. This gate has no Feature IDs and changes no tracker totals. Update authority so Slice 3.3 becomes the next candidate only after merge/recalculation.

Open a focused PR, resolve reviews, merge, verify main CI and recalculate.

# Phase 4 — Authorize and implement Slice 3.3

## 4.1 Authorization checkpoint

From current merged `main`, create the required documentation-only authority update:

- confirm prerequisites actually passed;
- set Slice 3.3 as active;
- preserve tracker totals and dependency map;
- do not claim Feature completion;
- merge the authority update before production implementation.

The explicit user task authorizes continuing; do not ask for another user confirmation.

## 4.2 Implement `ORG-013`, `ORG-014`, `ORG-016`, `ORG-017`

### Capability declaration

Provide three entry modes that converge on the same authoritative record:

1. describe what the organization does;
2. review suggestions derived from already authorized organization content; and
3. browse/search AMACS manually.

Use the 0.5.0 interpretation sequence. Support accept/edit/reject/unresolved/none-of-these/clarification. After acceptance, execute a separate authorized write to an organization capability assertion.

Confirmed claims preserve release, label snapshot, entity scope where applicable, market roles, delivery roles, service geography, specialties, capacity, evidence references, visibility and assertion state.

### Evidence boundary

Never collapse:

- AMACS concept;
- interpretation suggestion;
- self-reported assertion;
- evidence submitted;
- independently verified capability.

Website/document/NAICS/past-response information may produce suggestions only. Past-performance evidence linkage requires explicit review.

### NAICS/industry

Store as descriptive/filter context with source/version provenance. NAICS is not capability proof.

### Past performance

Add bounded, structured, provenance-aware project/value/role/time/location/output context. Protect sensitive client/financial evidence. Do not award credibility.

### Preferences

Add prime/subcontractor/supplier/referral/resource preferences without treating them as permission, availability, commitment or legal relationship.

### Migration/search

Migrate Slice 3.2 discovery toward confirmed structured capabilities without double-counting or silently converting legacy text. Preserve truthful transitional behavior and explanations.

## 4.3 Slice 3.3 acceptance and closeout

Test authority, stale/replay handling, privacy, interpretation disposition, manual fallback, invalid IDs, provider outage/quota, provisional terms, search migration, mobile/keyboard/accessibility and configured browser with real/disposable records.

After acceptance:

- mark only `ORG-013`, `ORG-014`, `ORG-016`, `ORG-017` Done;
- recalculate from actual tracker; absent unrelated drift, expected totals become 129 Done / 309 Not Started and Network 15/38;
- merge, verify main CI and recalculate;
- do not begin Slice 3.4 until its authority update merges.

# Phase 5 — Authorize and implement Slice 3.4

## 5.1 Authorization checkpoint

Create and merge a focused authority update setting Slice 3.4 active after verifying Slice 3.3 merged and passed. Preserve totals until implementation acceptance.

## 5.2 Implement `ORG-015`, `ORG-018`, `ORG-019`

### Credentials and identifiers

- support approved certifications, licenses, UEI, CAGE, SAM and other identifiers;
- preserve issuer/source, dates, status, entity scope and evidence provenance;
- treat self-report, submitted evidence, authoritative validation and verification as distinct;
- do not award Organization Verified or credibility badges;
- support expiration/revalidation behavior where the slice requires it.

### Media/documents/portfolio

- use the existing organization-owned, private-by-default storage architecture;
- prefer external/reference-based media where existing storage policy authorizes it and long-term liability/storage is reduced without weakening reliability or privacy;
- validate file type, size, ownership, access and publication state;
- keep sensitive evidence private;
- optimize explicitly public media and provide accessible labels;
- do not invent paid quotas or premium publication rights.

### Additional locations

- reuse canonical geocoding, locality, service-geography and privacy contracts;
- separate internal exact location from public exact/approximate/locality-only projection;
- preserve primary versus subordinate/satellite location identity;
- prevent additional locations from appearing as separate organizations or leaking private coordinates.

## 5.3 Slice 3.4 acceptance and closeout

Test cross-user/org denial, evidence privacy, publication, expiration/provenance, file failures/recovery, geocoding, multi-location map anchoring, stale state, mobile/keyboard/accessibility and configured browser.

After acceptance:

- mark only `ORG-015`, `ORG-018`, `ORG-019` Done;
- recalculate; absent unrelated drift, expected totals become 132 Done / 306 Not Started and Network 18/38;
- merge, verify main CI and recalculate;
- authorize Slice 3.5 only afterward.

# Phase 6 — Authorize and implement Slice 3.5

## 6.1 Authorization checkpoint

Create and merge a focused authority update setting Slice 3.5 active after verifying Slice 3.4. Preserve totals until implementation acceptance.

## 6.2 Implement `REF-001`–`REF-005`, `EDU-014`, `ACQ-006`

### Referral aggregate and state machine

Implement one organization-owned referral aggregate, not a personal DM. Preserve sender organization, authorized actor, recipient, purpose, structured need/reason, urgency, preferred contact, relevant opportunity/context, consent, minimum-necessary shared data, lifecycle/version and append-only events.

Use an explicit lifecycle consistent with the slice, such as:

```text
draft/proposed
→ sent
→ accepted | declined | expired | withdrawn
→ contact initiated / follow-up
→ closed
```

Outcome reporting/verification and credibility calculations remain later scope. A closed referral may record a bounded closure reason without claiming verified economic impact.

### Consent and minimum necessary sharing

- identify public versus nonpublic fields;
- require clear purpose and business consent before nonpublic transfer;
- allow the participant to review what will be shared and with whom;
- do not transfer documents or sensitive profile fields by implication;
- preserve consent version/time/actor and recipient purpose;
- prevent cross-organization leakage.

### Recipient behavior

- notify through versioned Slice 3.1 communications;
- allow explicit accept/decline and permitted status visibility;
- make retry/replay idempotent;
- do not imply endorsement, sale, guaranteed response or availability.

### First-use education

`EDU-014` explains why the referral is being sent, what information is shared, the recipient, consent and what happens next. It must not become a separate tutorial domain object.

### External acquisition continuity

`ACQ-006` invites a nonmember for the specific legitimate referral, preserves signed/bounded acquisition context through account and organization activation, prevents replay/recipient substitution and lands the legitimate participant on the exact referral after required gates.

### Visual/network expression

This slice is the first live authority for a referral golden path. Render a path only from a real permitted referral record/event. Provide text equivalents, reduced motion and truthful empty/stalled/declined/expired/recovery states. Do not use Growth Green merely for send/accept/contact.

### Explicit exclusions

Do not implement referral fees, paid managed referrals, provider routing (`REF-006`), mass unsolicited messaging, credibility badges/calculations, public rankings, outcome verification, CRM-style paid pipeline management, Slice 3.6 provider approval or later RFx opportunity objects.

## 6.3 Slice 3.5 acceptance and closeout

Test organization authority, wrong-user/org denial, consent, minimum necessary projection, recipient substitution, invite replay/expiry, duplicate sends, communication correlation, accept/decline races, stale versions, acquisition resume, cleanup, mobile/keyboard/accessibility, path provenance and configured browser.

After acceptance:

- mark only `REF-001`, `REF-002`, `REF-003`, `REF-004`, `REF-005`, `EDU-014`, `ACQ-006` Done;
- recalculate; absent unrelated drift, expected totals become 139 Done / 299 Not Started and Network 25/38;
- merge, verify production CI and recalculate from main;
- update `AGENTS.md`/Wave 3 authority to identify Slice 3.6 as the next candidate;
- do not implement Slice 3.6.

# Required final report

At completion, report:

1. every PR created/updated/merged, with number and merge SHA;
2. PR #120 configured-browser evidence and final Slice 3.2 Feature IDs;
3. exact AMACS 0.5.0 release/ingestion/projection evidence;
4. AI provider adapter/configuration implemented, secret/disabled behavior and benchmark results;
5. Feature IDs completed in Slices 3.3, 3.4 and 3.5;
6. tests, emulator suites, `npm run check`, production CI and configured-browser runs;
7. tracker totals and Network totals after each phase;
8. migration/security/privacy/architecture discoveries;
9. data fixtures created and proof of cleanup;
10. any remaining genuine external blocker, without making unsupported completion claims; and
11. explicit confirmation that Slice 3.6 and all later domains were not implemented.

Do not finish with only recommendations. Execute every unblocked phase through accepted, merged repository state.
