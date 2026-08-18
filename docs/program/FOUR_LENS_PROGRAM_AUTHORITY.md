# RFxchange Four-Lens Parallel Delivery and Independent Acceptance Authority

**Status: GOVERNING CROSS-CUTTING PROGRAM AUTHORITY WHEN MERGED**

This authority changes delivery and acceptance governance only. It does not complete a Feature ID, change tracker arithmetic, alter a domain authority, authorize an otherwise unauthorized capability, or weaken security, privacy, lifecycle, geography, tenancy, data, brand, or product authority.

The adoption snapshot is historical: merged `main` was `21c4fc080a823ae03f33ae1e58dd2752f317dc67`, the tracker was **438 total · 170 Done · 268 Not Started**, RFx Core was **18/41**, and Slice 4.6 runtime PR #171 was open and unmerged. Current program state belongs in the current program artifacts, not in remembered chat state.

The governing delivery amendment is [`BUILD_RELEASE_VERIFY_GOVERNANCE_AMENDMENT.md`](BUILD_RELEASE_VERIFY_GOVERNANCE_AMENDMENT.md). Where earlier text in this authority treated independent exact-head review as a universal merge prerequisite, the amendment supersedes that merge interpretation while preserving all independent-certification requirements for `Verified`.

The current product amendment is [`MOBILE_EXCHANGE_STAGES_3_6_AUTHORITY.md`](MOBILE_EXCHANGE_STAGES_3_6_AUTHORITY.md). It replaces Referrals with Capabilities as the fourth permanent participant lens and retains Referrals as a cross-lens domain/utility. Historical adoption records remain immutable; current program operation follows the successor architecture.

## 1. Governing principle

The permanent authenticated participant lenses remain, in exact order:

1. Opportunities/RFx;
2. Resources;
3. Intelligence; and
4. Capabilities.

Referrals remains a governed cross-lens function and Menu/Account utility rather than a permanent lens.

They operate over one organization-centered Exchange and share substantial platform behavior. The delivery rule is:

> **Parallelize production. Centralize product intent. Independently certify acceptance.**

> **Many builders may work concurrently. No builder may certify its own work as complete.**

Build may proceed in parallel. Merge order remains dependency-aware. Completion remains independently certified.

The operational sequence is:

```text
Build → Release → Verify
```

Merge, production release and independent certification are separate facts. A merged or live implementation may truthfully remain `Implemented — Not Verified`.

## 2. Supersession and scope

For work packets governed by this authority, the former default single-active-slice or single-active-gate rule is superseded. Multiple lanes may execute concurrently only when immutable requirements, ownership, exact activation bases, dependencies, shared paths, acceptance obligations, and stop boundaries are explicit.

This supersession does not permit:

- uncontrolled parallel merges;
- work against an assumed unmerged dependency;
- a lane to redefine another lane's domain;
- a builder to promote its own production work to `Verified`;
- a feature or experience to be marked complete without the required independent disposition;
- documentation-only authority to be treated as runtime authority;
- merge or release over a known material security/privacy/integrity/authority finding; or
- deployment to be reported as independent certification.

Work outside this program retains the repository's ordinary sequencing rules unless separately authorized.

## 3. Permanent program lanes

| Lane | Name | Owns | Must not do |
| --- | --- | --- | --- |
| 00 | Control Room | current-`main` coordination, dependency assignment, packets, activation epochs, branch ownership, merge/release order, shared-contract routing, status and reconciliation | normally implement domain runtime or certify production completion |
| 01 | Shared Exchange Platform | participant shell, spatial/selected-object contracts, map/list/detail primitives, marker grammar, search/filter grammar, cross-lens context, Account utility, loading, accessibility and participant truthfulness | privately redefine a lens domain |
| 02 | Opportunities/RFx | Wave 4 and later authorized RFx transaction runtime | redefine Shared Exchange behavior or begin an ineligible slice |
| 03 | Intelligence | organization, capability, market, location, site, RFx/demand, resource, referral and later outcome intelligence under real-data authority | fabricate market activity or consume unaccepted private projections |
| 04 | Resources | provider application/status, approved-provider representation, discovery, details, service geography, resource and request experience | grant provider status or duplicate Shared Exchange contracts |
| 05 | Referrals | cross-lens sender/recipient interaction, creation, lifecycle, Menu management, relationship context, paths and return continuity | present Referrals as a permanent lens or invent unsupported third-party referral semantics |
| 06 | Independent Acceptance | authority-outward audit, acceptance tests/evidence, findings and dispositions | implement production feature code or weaken the original requirement |
| 07 | Integration / Cross-Lens QA | integrated journeys, shared state, desktop/mobile, accessibility, locales, performance and authority isolation | substitute integration evidence for missing requirement acceptance |
| 08 | Capabilities | organization capability discovery/profile, evidence distinctions, AMACS integration, comparison and RFx matching | duplicate the organization profile, invent AMACS codes, or turn referral records into capability records |

Lane charters are binding in [`CHAT_LANE_CHARTERS.md`](CHAT_LANE_CHARTERS.md).

## 4. Repository as communication bus

Program state must not depend on one conversation remembering another. GitHub and the merged repository are authoritative. Every lane re-reads current merged authority before starting a packet.

The durable program artifacts are:

- this authority;
- [`BUILD_RELEASE_VERIFY_GOVERNANCE_AMENDMENT.md`](BUILD_RELEASE_VERIFY_GOVERNANCE_AMENDMENT.md);
- [`FOUR_LENS_EXPERIENCE_LEDGER.md`](FOUR_LENS_EXPERIENCE_LEDGER.md);
- [`PARALLEL_DELIVERY_MATRIX.md`](PARALLEL_DELIVERY_MATRIX.md);
- [`SHARED_EXCHANGE_CONTRACTS.md`](SHARED_EXCHANGE_CONTRACTS.md);
- [`INDEPENDENT_ACCEPTANCE_PROTOCOL.md`](INDEPENDENT_ACCEPTANCE_PROTOCOL.md);
- [`CHAT_LANE_CHARTERS.md`](CHAT_LANE_CHARTERS.md);
- [`FOUR_LENS_BOOTSTRAP_RECOVERY.md`](FOUR_LENS_BOOTSTRAP_RECOVERY.md);
- [`../../governance/four-lens-requirements.json`](../../governance/four-lens-requirements.json); and
- [`../../governance/four-lens-workstreams.json`](../../governance/four-lens-workstreams.json).

The Master Build Tracker remains the Feature-ID completion authority. The canonical dependency map remains the sequencing authority. This program ledger adds experience and assurance state; it does not silently supersede either source.

## 5. Layer 1 — Bootstrap Governance

Layer 1 is the governance required to install and operate the Four-Lens model safely. It was required for PR #172 and remains the structural baseline.

Layer 1 includes:

- stable authorities and lane charters;
- the immutable requirement ledger;
- the eight initial packet/workstream definitions;
- dependency graph and admissible predecessor states;
- packet status, explicit owner, exact activation base and activation epoch;
- Shared Exchange ownership of shared participant contracts;
- exact implementation actor and SHA when implementation is claimed;
- independent reviewer identity and exact acceptance SHA when `Verified` is claimed;
- no-self-certification enforcement;
- requirement-type evidence coverage;
- dependency satisfaction before `Verified`;
- truthful matrix and tracker arithmetic; and
- deterministic structural repository validation.

Layer 1 validation must not require live GitHub API calls, retained Actions downloads, future acceptance workflows, or a certification system that does not yet exist merely to permit normal development/merge activity.

### Immutable requirements

Every approved experience requirement has a stable program ID. Existing Feature IDs retain their canonical IDs and are represented as `RFX-FEATURE-<Feature-ID>` records without renaming the underlying feature.

Each record retains:

- stable ID and original requirement text;
- governing source and owning lane;
- dependent lanes and dependencies;
- acceptance types;
- current status;
- implementation actor, PR and SHA;
- independent acceptance lane/reviewer, SHA, result and evidence; and
- explicit deferral data when applicable.

Original requirement text is immutable. Clarification may be appended without replacing the original intent.

The machine ledger freezes every adopted requirement in order with reviewed SHA-256 digests over the complete ID sequence, paired ID/original-text sequence, and governing source/lane/dependent-lanes/dependencies/acceptance-types metadata. A new requirement requires a separately reviewed baseline advance. No adopted requirement may silently disappear, reorder, weaken its source/dependencies/acceptance obligations, or rewrite original text.

Allowed statuses are exactly:

- `Not Started`;
- `In Progress`;
- `Implemented — Not Verified`;
- `Verified`;
- `Blocked`;
- `Deferred — Explicitly Approved`; and
- `Not Applicable — Explicitly Approved`.

Only `Verified` satisfies experience completion.

`Implemented — Not Verified` may represent an open candidate, a merged implementation, or a live production implementation whose independent certification is still pending.

## 6. Builder and acceptance separation

Implementation and acceptance are separate stages:

1. implementation produces `Implemented — Not Verified`;
2. only Independent Acceptance may produce `Verified` for a production requirement.

An implementation lane may report `Implemented`, `Implementation complete; independent acceptance pending`, `Partial`, or `Blocked`. It may not report `Verified`, `Accepted`, `Complete`, or `Closed` for its own production candidate unless it is quoting an already-recorded Independent Acceptance disposition.

Independent Acceptance evaluates in this order:

```text
original requirement
→ governing authority
→ expected participant/domain behavior
→ exact implementation runtime
→ evidence appropriate to the requirement type
→ disposition
```

A `Verified` record must:

- retain the implementation actor and exact implementation SHA;
- name Lane 06 (`independent-acceptance`);
- name an explicitly authorized independent GitHub reviewer identity;
- use a reviewer identity different from the implementation actor;
- bind acceptance to the exact implementation SHA;
- record an exact GitHub review signal;
- cover every declared acceptance type with candidate-bound evidence; and
- have all governed dependencies resolved.

A blank, generic, invented, builder-identical, or unauthorized reviewer cannot certify a production requirement.

Allowed acceptance dispositions are `Verified`, `Partial`, `Not Implemented`, `Blocked`, `Deferred`, and `Decision Required`. Only `Verified` contributes to the Verified numerator.

## 7. Configurable authenticated Independent Acceptance identities

Independent Acceptance is not coupled to one third-party mechanism.

Canonical identities are:

- `github:<login>` for a GitHub human identity;
- `github-app:<login>` for a GitHub App identity.

`github-app:chatgpt-codex-connector[bot]` is an explicitly program-authorized Lane 06 identity.

Control Room may also explicitly assign another exact GitHub human or App identity to a Lane 06 packet before acceptance begins. The assignment is packet-scoped authorization, not a global privilege. The acceptance signal must be authored in GitHub by that exact configured or packet-assigned identity.

The implementation actor is always excluded from certifying its own production requirement, regardless of whether the independent reviewer is a human, Codex GitHub App, or another authorized App.

Reviewer unavailability blocks `Verified` certification. It does not, by itself, block ordinary bounded development/merge/release under the Build → Release → Verify amendment.

Layer 1 structurally validates identity, authorization, SHA binding and separation. Live GitHub API reauthentication of review actors and historical provenance is Layer 2 hardening, not a prerequisite for normal integration.

## 8. Evidence and deferral discipline

Minimum evidence follows the declared requirement type:

| Requirement type | Minimum evidence |
| --- | --- |
| Functional | candidate/runtime behavior |
| Domain/security | positive and negative runtime or emulator evidence |
| Visual | browser-rendered evidence |
| Responsive | applicable viewport evidence |
| Motion | before, transition and settled state |
| Accessibility | keyboard, semantics, focus and assistive state |
| Participant copy | rendered-output review in governed locales |
| Cross-lens continuity | actual supported multi-lens journey |
| Performance | bounded measurements appropriate to the claim |

Static/source evidence may supplement but not replace the required acceptance type.

For `Verified`, each ledger evidence entry points to the exact implementation's tracked Lane 06 manifest under `docs/program/evidence/`. The manifest records the exact implementation/base SHAs, independent reviewer, GitHub Actions run reference, configured environment, checks and durable artifact references. Layer 1 validates structure, exact-SHA binding, reviewer separation and declared-type coverage.

A new defer or N/A requires the exact requirement, reason, impact, future owner, independent authorized approver and exact GitHub approval signal. Builder-authored prose alone is not approval. The one adoption-time cursor deferral remains a frozen historical exception and may not be silently broadened.

## 9. Packets, dependencies, exact bases and activation epochs

Every work packet declares one owner, branch, requirement range, sources, dependencies, owned/non-owned paths, acceptance obligations, expected output, and stop boundary.

The eight initial packet governance definitions are digest-frozen in order. Lifecycle fields include candidate, candidate history, status, exact base SHA, activation epoch, post-merge setup evidence, and packet-scoped Lane 06 reviewer assignment.

Only `ready-after-authority-merge` and `frozen-until-authority-merge` may have no exact base. Any in-progress, active, reconciliation, implemented, acceptance, verified, completed, blocked-after-activation, or closed packet is bound to an exact activation epoch and the epoch's exact `mainBaseSha`.

An activation epoch is a Control Room record of the exact current-main SHA observed when work is authorized. A later candidate branch or PR may start from that SHA or a descendant current-main SHA. It may not claim an unrelated or invented base.

Every packet dependency must name another declared packet and explicit admissible predecessor states. No self-dependency, undeclared dependency, dependency cycle, or active packet with an unsatisfied predecessor is permitted.

Shared paths are controlled by Lane 01. A domain lane needing a new shared capability routes it through [`SHARED_EXCHANGE_CONTRACTS.md`](SHARED_EXCHANGE_CONTRACTS.md).

For packets created after the Build → Release → Verify amendment, `acceptanceRequired` describes certification obligations unless an item is explicitly designated as a merge/release gate. Pre-amendment immutable packet stop boundaries remain binding until Control Room records a successor/reconciliation/reclassification; the amendment does not silently edit them away.

## 10. Merge, release and exact-head change control

Independent exact-head review is no longer a universal default merge gate.

A bounded candidate may merge as `Implemented — Not Verified` when the governing amendment's default merge rule is satisfied: authorized scope, dependency/ownership integrity, reconciliation with current `main`, applicable exact-head CI/evidence, no known unresolved material finding, and a durable Control Room merge disposition.

If independent review is available before merge, use it. A substantive finding on candidate `X` fails `X`; a correction creates `Y`, and applicable evidence must be regenerated for `Y`. Green CI never overrides a known material product, security, privacy, integrity, accessibility, tenancy or authority finding.

Production release is a separate risk-based decision under [`BUILD_RELEASE_VERIFY_GOVERNANCE_AMENDMENT.md`](BUILD_RELEASE_VERIFY_GOVERNANCE_AMENDMENT.md):

- Standard releases use ordinary post-merge/evidence controls;
- Elevated releases add focused negative authority/security evidence, explicit Control Room release authorization and rollback/containment planning;
- Critical releases add direct critical-boundary negative evidence and explicit participant/product-owner risk acceptance if independent reviewer capacity is unavailable.

A review-capacity exception may waive only missing reviewer availability for release. It never waives required safety evidence or a known material security/privacy/integrity finding.

Independent exact-head GitHub review remains mandatory where required to record `Verified`. The review signal is external GitHub state and is not committed back into the same implementation merely to prove that review occurred.

## 11. Bootstrap lifecycle and post-merge transition

The setup lifecycle deliberately separates values knowable before merge from values knowable only afterward.

### Before PR #172 merged

`governance/four-lens-workstreams.json` recorded:

- `programPhase = authority-setup`;
- `WP-CONTROL-AUTHORITY-SETUP.status = in-progress`;
- setup candidate PR `172`, actor `github:AccelAnalysis`, SHA sentinel `SELF`;
- `mergeSha = null`;
- `postMergeMainSha = null`;
- `postMergeRunUrl = null`;
- setup exact base `21c4fc080a823ae03f33ae1e58dd2752f317dc67` through the authority-setup activation epoch; and
- every downstream packet pre-activation with null exact base and null activation epoch.

`SELF` was not evidence of a production implementation and was valid only while PR #172 was open and the setup packet was in-progress.

### After PR #172 merged

Control Room waited for the `production-ci` push run on the authority merge in `main` to succeed, fetched current `main`, and created the post-merge Control Room transition.

That transition:

1. replaced setup `candidate.sha = SELF` with the exact final #172 head;
2. recorded the exact authority `mergeSha`;
3. recorded `postMergeMainSha` and the successful `production-ci` Actions URL for that merge;
4. closed setup;
5. changed `programPhase` to operational;
6. created the initial operational activation epoch(s); and
7. assigned that epoch/base to Shared Experience, Wave 4 Assurance, Intelligence, Resources and Referrals.

This historical bootstrap lifecycle remains preserved. It is not the normal merge/release process for later production candidates.

## 12. Layer 2 — Acceptance Integrity Hardening

Planned packet: `WP-ACCEPTANCE-INTEGRITY-HARDENING-01`.

It is non-blocking for governance bootstrap, normal integration and normal release. Its intended scope includes:

- long-term Actions artifact retention;
- cryptographic/digest retention of acceptance artifacts and history;
- live GitHub API provenance hardening for PR authors, review actors, runs, artifacts and merge ancestry;
- workflow/harness immutability and constrained execution environments;
- multi-stage source/certification/disposition mechanics where justified;
- historical/retroactive assurance mechanics;
- durable superseded acceptance/deferral/candidate/activation history; and
- stronger evidence-only PR/path/rename enforcement.

Deferring those controls does not permit builder self-promotion. Layer 1 continues to reject `Verified` unless Lane 06 records an authorized reviewer distinct from the implementation actor, exact-SHA acceptance, the exact GitHub signal, complete declared-type evidence and resolved dependencies.

The detailed bootstrap audit and historical P1/P2 disposition are recorded in [`FOUR_LENS_BOOTSTRAP_RECOVERY.md`](FOUR_LENS_BOOTSTRAP_RECOVERY.md).

## 13. Completion accounting and tracker truth

Only `Verified` satisfies Four-Lens requirement completion.

A canonical Feature ID may be promoted only through the canonical tracker protocol after its governing requirement has the required independent acceptance. Previously completed Wave 4 tracker records are not silently revoked by assurance work.

Merge and production deployment do not change the Verified numerator or tracker completion by themselves.

## 14. Program-specific sequencing

### Shared Experience Completion

The post-PR-#160 record remains in [`SHARED_EXPERIENCE_COMPLETION_BACKLOG.md`](SHARED_EXPERIENCE_COMPLETION_BACKLOG.md). Shared Exchange owns shared participant contracts and corrections.

### Wave 4 assurance

Slices 4.1–4.5 remain `Previously accepted — independent assurance pending`. Their prior tracker completions are not silently revoked. Lane 06 audits them without self-correcting production code.

### Slice 4.6

PR #171 remains governed by its preserved pre-amendment packet and explicit stop boundary until Control Room creates a successor/reconciliation/reclassification under the current authority. The amendment does not silently erase that history or begin Slice 4.7.

### Intelligence, Resources, Capabilities and cross-lens Referrals

Intelligence, Resources and Capabilities continue as permanent lenses under declared packet ownership and dependency boundaries. Referrals continues as a cross-lens domain. Prior Feature-ID completion does not automatically prove a complete lens or cross-lens experience.

## 15. Integration acceptance

Lane 07 tests the combined Exchange after relevant implementations merge or when Control Room activates an integration packet. Integration acceptance supplements rather than replaces Lane 06 requirement acceptance.

Lane 07 may test merged `Implemented — Not Verified` work to identify integration defects; it must not convert integration evidence into `Verified`.

## 16. Stop boundary and truthfulness

This program governance must not be used to implement missing domain runtime, fabricate data, broaden authorization, or silently mark Feature IDs complete.

> **The interface and the development process must accurately communicate what exists, what is available, what is implemented, what is merged, what is live, what is selected, what is verified, and what remains unavailable or incomplete—without implying capabilities, authority, data, outcomes, workflow states, deployment provenance, or completion evidence that do not actually exist.**

Governance is a control system for shipping the Exchange safely. It is not a substitute for shipping it.
