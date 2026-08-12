# RFxchange Four-Lens Parallel Delivery and Independent Acceptance Authority

**Status: GOVERNING CROSS-CUTTING PROGRAM AUTHORITY WHEN MERGED**

This authority changes delivery and acceptance governance only. It does not complete a Feature ID, change tracker arithmetic, alter a domain authority, authorize an otherwise unauthorized capability, or weaken security, privacy, lifecycle, geography, tenancy, data, brand, or product authority.

The adoption snapshot is historical: merged `main` was `21c4fc080a823ae03f33ae1e58dd2752f317dc67`, the tracker was **438 total · 170 Done · 268 Not Started**, RFx Core was **18/41**, and Slice 4.6 runtime PR #171 was open and unmerged. Current program state belongs only in [`PARALLEL_DELIVERY_MATRIX.md`](PARALLEL_DELIVERY_MATRIX.md).

## 1. Governing principle

The permanent authenticated lenses remain, in exact order:

1. Opportunities/RFx;
2. Resources;
3. Intelligence; and
4. Referrals.

They operate over one organization-centered Exchange and share substantial platform behavior. The delivery rule is:

> **Parallelize production. Centralize product intent. Independently certify acceptance.**

> **Many builders may work concurrently. No builder may certify its own work as complete.**

Build may proceed in parallel. Merge order remains dependency-aware. Completion remains independently certified.

## 2. Supersession and scope

For work packets governed by this authority, the former default single-active-slice or single-active-gate rule is superseded. Multiple lanes may execute concurrently only when their immutable requirements, ownership, exact branch bases, dependencies, shared paths, acceptance obligations, and stop boundaries are explicit.

This supersession does not permit:

- uncontrolled parallel merges;
- work against an assumed unmerged dependency;
- a lane to redefine another lane's domain;
- a feature or experience to be marked complete without independent acceptance; or
- documentation-only authority to be treated as runtime authority.

Work outside this program retains the repository's ordinary sequencing rules unless separately authorized.

## 3. Permanent lanes

| Lane | Name | Owns | Must not do |
| --- | --- | --- | --- |
| 00 | Control Room | current-`main` coordination, dependency assignment, packets, branch ownership, merge order, shared-contract routing, status and reconciliation | normally implement domain runtime or certify completion |
| 01 | Shared Exchange Platform | participant shell, spatial/selected-object contracts, map/list/detail primitives, marker grammar, search/filter grammar, cross-lens context, Account utility, loading, accessibility and participant truthfulness | privately redefine a lens domain |
| 02 | Opportunities/RFx | Wave 4 and later authorized RFx transaction runtime | redefine Shared Exchange behavior or begin an ineligible slice |
| 03 | Intelligence | organization, capability, market, location, site, RFx/demand, resource, referral and later outcome intelligence under real-data authority | fabricate market activity or consume unaccepted private projections |
| 04 | Resources | provider application/status, approved-provider representation, discovery, details, service geography, resource and request experience | grant provider status or duplicate Shared Exchange contracts |
| 05 | Referrals | sender/recipient interaction, creation, lifecycle, relationship context, paths and cross-lens continuity | invent unsupported third-party referral semantics |
| 06 | Independent Acceptance | authority-outward audit, acceptance tests/evidence, findings and dispositions | implement production feature code or weaken the original requirement |
| 07 | Integration / Cross-Lens QA | integrated journeys, shared state, desktop/mobile, accessibility, locales, performance and authority isolation | substitute integration evidence for a missing lane-level acceptance |

Lane charters are binding in [`CHAT_LANE_CHARTERS.md`](CHAT_LANE_CHARTERS.md).

## 4. Repository as communication bus

Program state must not depend on one conversation remembering another. GitHub and the merged repository are authoritative. Every lane re-reads current merged authority before starting a packet.

The durable program artifacts are:

- this authority;
- [`FOUR_LENS_EXPERIENCE_LEDGER.md`](FOUR_LENS_EXPERIENCE_LEDGER.md);
- [`PARALLEL_DELIVERY_MATRIX.md`](PARALLEL_DELIVERY_MATRIX.md);
- [`SHARED_EXCHANGE_CONTRACTS.md`](SHARED_EXCHANGE_CONTRACTS.md);
- [`INDEPENDENT_ACCEPTANCE_PROTOCOL.md`](INDEPENDENT_ACCEPTANCE_PROTOCOL.md);
- [`CHAT_LANE_CHARTERS.md`](CHAT_LANE_CHARTERS.md);
- [`../../governance/four-lens-requirements.json`](../../governance/four-lens-requirements.json); and
- [`../../governance/four-lens-workstreams.json`](../../governance/four-lens-workstreams.json).

The Master Build Tracker remains the Feature-ID completion authority. The dependency map remains the sequencing authority. This program ledger adds experience completion and independent-assurance state; it does not silently supersede either canonical source.

## 5. Immutable requirements

Every approved experience requirement receives a stable program ID. Existing Feature IDs retain their canonical IDs and are represented in the program ledger as `RFX-FEATURE-<Feature-ID>` records without renaming the underlying feature.

Each record retains:

- stable ID and original requirement text;
- governing source and owning lane;
- dependent lanes and capability/domain dependencies;
- acceptance types;
- current status;
- implementation PR and SHA;
- independent acceptance disposition, accepting lane/reviewer identity, SHA and evidence; and
- exact deferral authority when applicable.

Original requirement text is immutable. Clarification may be appended without replacing the original intent.

The machine ledger freezes its 105-record adoption baseline in order with reviewed SHA-256 digests over the complete ID sequence, the paired ID/original-text sequence, and the governing source/lane/dependent-lanes/dependencies/acceptance-types metadata. A new requirement appends after that baseline. A correction, clarification or supersession receives separate mutable clarification metadata or a new ID; it must not delete, reorder, rewrite or weaken the authority or evidence obligations of an adoption record. The architecture validator fails on baseline deletion, substitution, reordering, original-text drift or governance-metadata drift.

Allowed statuses are exactly:

- `Not Started`;
- `In Progress`;
- `Implemented — Not Verified`;
- `Verified`;
- `Blocked`;
- `Deferred — Explicitly Approved`; and
- `Not Applicable — Explicitly Approved`.

Only `Verified` satisfies experience completion. A canonical Feature ID is marked Done only under the tracker protocol after its governing requirement has independent acceptance.

## 6. Builder and acceptance separation

An implementation lane may report `Implemented`, `Implementation complete; independent acceptance pending`, `Partial`, or `Blocked`. It may not report `Verified`, `Accepted`, `Complete`, or `Closed` for its own candidate unless it is quoting an already-recorded Independent Acceptance disposition.

Independent Acceptance evaluates in this order:

```text
original requirement
→ governing authority
→ expected participant/domain behavior
→ exact candidate runtime
→ evidence appropriate to the requirement type
→ disposition
```

It must not infer the intended requirement from the implementation summary or its tests.

A `Verified` record must name Lane 06 (`independent-acceptance`) and the independent reviewer identity. Builder identity or a blank/generic acceptance record is not an independent disposition.

Allowed acceptance dispositions are:

- `Verified`;
- `Partial`;
- `Not Implemented`;
- `Blocked`;
- `Deferred`; and
- `Decision Required`.

`Partial`, `Not Implemented`, `Blocked`, and `Decision Required` block completion. `Deferred` is valid only with explicit approval.

## 7. Evidence must match the requirement

| Requirement type | Minimum evidence |
| --- | --- |
| Functional | candidate runtime behavior |
| Domain/security | positive and negative runtime or emulator evidence |
| Visual | actual browser-rendered evidence |
| Responsive | evidence at the relevant viewport classes |
| Motion | before, transition and settled state |
| Accessibility | keyboard, semantics, focus and assistive state |
| Participant copy | rendered-output review in every governed locale |
| Cross-lens continuity | actual multi-lens journeys |
| Performance | measurements appropriate to the stated claim |

Static or source-code evidence may supplement but cannot replace the required acceptance type.

For `Verified`, the machine acceptance record uses structured `{ type, reference }` evidence entries and must contain at least one durable repository path or HTTPS reference for every acceptance type declared by that requirement. A generic evidence string or coverage of only one acceptance type cannot enter the Verified numerator.

## 8. Explicit deferral discipline

A defer requires the exact requirement ID, reason, missing dependency, participant/product impact, future owner, future milestone where known, and explicit approval. Difficulty, time, an inconvenient architecture, or unavailable tests do not authorize deferral. Unapproved omissions remain incomplete.

## 9. Parallel branch and dependency rules

Every work packet declares one owner, branch, exact base SHA, immutable requirement range, owned paths/domain, non-owned paths/domain, dependencies, acceptance required, expected output, and stop boundary.

The initial eight packet definitions are append-only and digest-frozen over their IDs, lanes, ownership, branches/base policies, requirement ranges, sources, dependency edges with admissible predecessor states, owned/non-owned paths, acceptance obligations, outputs and stop boundaries. Only packet `status` and `exactBaseSha` are ordinary lifecycle fields. Removing or weakening an adopted dependency edge or obligation fails validation; a newly authorized packet appends.

Only the pre-activation statuses `ready-after-authority-merge` and `frozen-until-authority-merge` may temporarily use a base policy instead of an exact base SHA. Every in-progress, active, reconciliation, acceptance, verified, completed, blocked or closed packet remains bound to an exact base SHA.

No packet may treat an unmerged branch as authoritative unless it names the candidate SHA explicitly. A dependent branch may build dependency-safe portions, but it cannot merge before its dependency is independently accepted and present on merged `main`. After a dependency merge, reconcile with current `main`, rerun applicable evidence, and obtain a fresh exact-head acceptance result.

Shared paths are controlled by Lane 01. A domain lane needing a new shared capability submits a Shared Contract Request under [`SHARED_EXCHANGE_CONTRACTS.md`](SHARED_EXCHANGE_CONTRACTS.md).

## 10. Exact-head freeze and merge rule

When final acceptance begins at candidate `X`, any substantive finding means `X` fails final acceptance. A correction creates candidate `Y`. `Y` requires full applicable CI, independent acceptance, a fresh reviewer signal, resolution of all substantive findings, and merge protection against that exact head.

No material product, security, integrity, accessibility, privacy, authority, or P1/P2-equivalent finding may remain at merge. Green CI never overrides such a finding.

## 11. Completion accounting

Implementation and independent acceptance are two conceptual stages:

1. implementation produces `Implemented — Not Verified`;
2. Independent Acceptance may produce `Verified` for the exact candidate.

Only after independent verification may canonical completion accounting be promoted. Where practical, tracker promotion occurs through an acceptance/closeout change rather than the builder's implementation change.

Wave completion and lens completion remain separate. The Four-Lens Experience Matrix records explicit denominators for Shared Exchange, Opportunities/RFx, Resources, Intelligence, and Referrals. Percentages are prohibited until the denominator is established, and only Verified requirements enter the numerator.

## 12. Program-specific work

### Shared Experience Completion

The post-PR-#160 record is retained in [`SHARED_EXPERIENCE_COMPLETION_BACKLOG.md`](SHARED_EXPERIENCE_COMPLETION_BACKLOG.md). It distinguishes implemented-but-unverified behavior, a substantive final-head finding, the explicitly approved cursor defer, an organization-logo/data-contract dependency, a privacy/location policy decision, procedural acceptance failure, and documentation drift. The original requests remain visible.

### Wave 4 assurance and production

Slices 4.1–4.5 are classified `Previously accepted — independent assurance pending`. This does not automatically revoke their 18 tracker completions. Material assurance findings are recorded, assessed for tracker correction, corrected in bounded work, independently verified, and reconciled truthfully.

PR #171 is the first runtime candidate to pass fully through this program. It remains preserved and unmerged until the authority is merged, the branch is recalculated against new `main`, its five Feature IDs are mapped, the candidate is independently audited, all substantive findings are corrected, and exact-head evidence and review are fresh. Slice 4.7 may not begin before accepted Slice 4.6 is merged.

### Intelligence

Intelligence is a permanent lens and receives a dedicated roadmap independent of numbered-wave visibility. Dependency-independent work may use current authoritative data. RFx-, Resource-, Referral-, and outcome-dependent layers may consume only accepted authoritative sources, and no layer may fabricate activity.

### Resources and Referrals

Prior Feature-ID completion does not automatically prove complete lens experience. Each lens receives a vision-to-runtime inventory, immutable requirements, gap classification, bounded packets, independent acceptance, and integration acceptance.

## 13. Cross-lens integration acceptance

After accepted lane work merges, Lane 07 exercises supported journeys such as:

```text
Intelligence
→ selected organization
→ Resources
→ Referrals
→ Opportunities/RFx
→ safe return
```

It verifies selected object, camera, lens state, action availability, privacy, URL context, stale-detail prevention, hidden-target parity, authority isolation, accessibility, mobile behavior, five locales, and performance.

## 14. Immediate transition and stop boundary

The adoption sequence is:

```text
preserve/freeze PR #171
→ merge this authority and program artifacts
→ recalculate current main
→ establish and activate lane work packets
→ launch Shared Experience, Wave 4 Assurance, Intelligence, Resources and Referrals
→ reconcile PR #171
→ independently accept or reject the exact Slice 4.6 candidate
→ merge only an accepted exact head
→ then recalculate eligibility for Slice 4.7
```

The authority-setup PR must not implement missing Shared Exchange UX, modify RFx runtime, complete Slice 4.6, begin Slice 4.7, implement Intelligence layers, modify Resource or Referral domain behavior, or change Feature-ID completion.

## 15. Truthfulness

> **The interface and the development process must accurately communicate what exists, what is available, what is implemented, what is selected, what is verified, and what remains unavailable or incomplete—without implying capabilities, authority, data, outcomes, workflow states, or completion evidence that do not actually exist.**

A governed permanent option may remain visible while unavailable. Internal implementation language does not become participant copy. A development report is held to the same truthfulness standard as the product.
