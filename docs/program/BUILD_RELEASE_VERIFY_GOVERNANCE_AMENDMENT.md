# RFxchange Build → Release → Verify Governance Amendment

**Status:** GOVERNING WHEN MERGED

**Owner:** 00 — RFxchange Control Room

**Applies to:** Four-Lens delivery, merge, release and certification governance.

This amendment corrects an operational failure in the installed Four-Lens model: independent certification had become a universal pre-merge choke point, so unavailable reviewer capacity could prevent otherwise bounded, tested work from reaching `main` or production.

The amendment does **not** weaken RFxchange security, privacy, tenancy, geography, authorization, domain, evidence or truthfulness requirements. It separates three facts that must remain truthful and independently observable:

1. **Built / merged** — code exists on merged `main`.
2. **Released / live** — a specific merged implementation has been deployed through the canonical production path.
3. **Verified** — Lane 06 has independently certified the exact approved requirement under the Independent Acceptance Protocol.

Neither merge nor production deployment implies `Verified`.

## 1. Governing delivery model

The program operating sequence is:

```text
Build → Release → Verify
```

with dependency-aware merge order and risk-based release controls.

The existing principle remains unchanged:

> Parallelize production. Centralize product intent. Independently certify acceptance.

And:

> Many builders may work concurrently. No builder may certify its own work as complete.

The purpose of independent acceptance is to certify requirements, not to make independent reviewer availability a universal prerequisite for ordinary code integration.

## 2. Status semantics

Four-Lens requirement statuses continue to describe requirement/acceptance state.

In particular:

- `Implemented — Not Verified` may describe an open PR, a merged implementation, or a production-deployed implementation whose independent certification is still pending.
- `Verified` remains the only Four-Lens completion state.
- merge does not promote a requirement to `Verified`;
- deployment does not promote a requirement to `Verified`;
- product-owner or Control Room release authorization does not promote a requirement to `Verified`.

Production/reporting language must keep these statements distinct, for example:

> Live in production — independent certification pending.

That is truthful when deployment has actually occurred but Lane 06 certification has not.

## 3. Default merge rule

Unless an exact packet, security/privacy authority, dependency authority or release authority establishes a stricter requirement, a bounded candidate may merge as `Implemented — Not Verified` when Control Room confirms all of the following:

1. the candidate is inside an authorized packet/scope or explicit current task authority;
2. ownership and shared-contract boundaries are respected;
3. the candidate is reconciled against current merged `main` or a permitted descendant of its immutable activation base;
4. governed dependencies required for the implementation itself are satisfied;
5. applicable exact-head CI/evidence has passed;
6. there is no known unresolved material product, security, privacy, tenancy, integrity, authority, accessibility or P1/P2-equivalent finding that makes merge unsafe;
7. the candidate truthfully remains `Implemented — Not Verified` unless Lane 06 has separately certified it; and
8. Control Room records the merge disposition and any verification debt durably in GitHub/repository state.

An independent GitHub review is **not a universal default pre-merge requirement**.

If an independent exact-head review is available before merge, use it. A substantive finding still fails that candidate and must be resolved before merge. Lack of reviewer capacity alone does not make a bounded candidate unsafe to integrate.

Green CI never overrides a known material finding.

## 4. Packet interpretation

For packets created after this amendment:

- `acceptanceRequired` describes the evidence/certification obligations required before `Verified` unless the packet explicitly labels an item as a `mergeGate` or `releaseGate`;
- exact-head CI remains a normal merge prerequisite when applicable;
- independent acceptance remains a certification prerequisite;
- independent review remains a certification prerequisite when required by the Independent Acceptance Protocol.

The amendment does **not** silently rewrite immutable historical packet definitions.

If a pre-amendment packet explicitly says `do not merge before independent acceptance`, `fresh review before merge`, or equivalent, that exact packet remains binding until Control Room creates a reviewed successor/reconciliation/reclassification record under the current authority. Control Room must preserve the old packet and candidate history rather than editing away the earlier stop boundary.

## 5. Risk-based production release rule

Merge eligibility and production release eligibility are separate.

Every production release candidate must be classified by Control Room as one of:

### Standard

Examples include bounded presentation, discoverability, non-authorizing workflow composition, copy, visual state and additive behavior that does not alter consequential authority or irreversible data semantics.

Required before release:

- merged `main` contains the intended implementation;
- post-merge CI passes;
- applicable configured-browser/emulator/domain evidence passes;
- no known material finding remains;
- canonical deployment/rollback path exists.

Independent review is not required merely to release a Standard candidate.

### Elevated

Examples include meaningful participant workflow or domain behavior that can create/update consequential records but preserves established authorization and persistence contracts.

Required before release:

- all Standard requirements;
- focused negative authorization/tenant/security evidence appropriate to the change;
- explicit Control Room release authorization;
- rollback, disable or containment path appropriate to the change;
- defined post-release observation/verification steps.

If independent review is available, obtain it before release. If reviewer capacity is unavailable, explicit participant/product-owner release authority may permit release after the required safety evidence passes. This is a release decision only and does not create `Verified`.

### Critical

Examples include changes to authentication/authorization boundaries, tenant isolation, privacy disclosure, policy/legal acceptance, payments/financial movement, destructive or irreversible migrations/writes, credential/secrets handling, or other changes where failure could cause material security, legal, financial or data-integrity harm.

Required before release:

- all Elevated requirements;
- direct negative-path evidence for the affected critical boundary;
- explicit rollback/containment decision;
- explicit participant/product-owner risk acceptance when an independent reviewer is unavailable;
- no known material security/privacy/integrity finding may remain open.

Independent review is strongly preferred before a Critical release. Reviewer unavailability may be waived only as a **review-capacity exception**, never as an evidence or known-finding exception. A critical candidate with a known material security/privacy/integrity defect remains non-releasable.

## 6. Independent review and certification

Independent review remains valuable and remains mandatory where required to produce `Verified`.

The Independent Acceptance Protocol still requires, for `Verified`:

- Lane 06 authority-outward evaluation;
- an explicitly authorized independent GitHub reviewer identity distinct from the implementation actor;
- exact implementation-SHA binding;
- an exact GitHub review signal;
- evidence covering every declared acceptance type; and
- resolved governed dependencies.

Reviewer capacity therefore blocks **certification**, not ordinary development by default.

A later independent finding against merged or live `Implemented — Not Verified` work must be handled explicitly:

1. record the requirement-level finding;
2. assess production impact;
3. rollback/disable/contain immediately when safety requires it;
4. create a bounded correction packet owned by the appropriate implementation lane;
5. preserve prior implementation/deployment provenance; and
6. independently certify only the corrected exact implementation when evidence supports it.

## 7. Lane 06 operating position

Lane 06 should normally operate downstream or alongside implementation, rather than acting as a universal pre-merge queue.

Lane 06 may evaluate:

- an exact open candidate;
- an exact merged implementation SHA; or
- an exact deployed implementation whose source/build provenance is sufficient for the specific acceptance claim.

Lane 06 does not implement production corrections and remains the only lane that may record `Verified`.

Where reviewer capacity is unavailable, Lane 06 may prepare requirement-outward findings/evidence, but it must not manufacture the missing independent GitHub review signal or record unsupported `Verified`.

## 8. Control Room release authority

Control Room owns dependency-aware merge/release sequencing, not product certification.

For every unverified production merge/release, Control Room must preserve at least:

- candidate/merge SHA;
- requirement or governed behavior scope;
- risk class;
- exact CI/evidence used for merge/release;
- known limitations/findings;
- rollback/containment path where required;
- release authorization source;
- production deployment evidence when released; and
- certification state (`Implemented — Not Verified` until Lane 06 acts).

Control Room approval may authorize merge/release under this amendment. It can never substitute for Lane 06 certification.

## 9. Verification debt

Unverified merged/live work is explicit **verification debt**, not hidden completion.

The Parallel Delivery Matrix and workstream ledger should distinguish, where useful:

- implementation state;
- merge state;
- production release state; and
- independent certification state.

Reviewer-capacity issues remain open until genuine independent review/certification capacity exists, but they no longer freeze unrelated safe integration by default.

Verification debt must be prioritized by risk and dependency impact rather than FIFO reviewer availability alone.

## 10. Stabilization 2C boundary

This amendment does not complete or weaken Stabilization 2C.

Production may be deployed under current release authority without claiming same-SHA provenance that cannot actually be proven. Source/build/rendered-SHA claims remain limited to the evidence available. `Verified` same-SHA production provenance remains blocked until Stabilization 2C is genuinely satisfied.

## 11. Anti-bureaucracy rule

Do not add a new governance mechanism merely because the current mechanism can express one more state.

New validators, packet types, lifecycle states, reviewer abstractions or approval layers require an observed product/security/integrity problem that cannot be handled by the existing model.

The program should optimize for:

- bounded ownership;
- safe parallel production;
- rapid dependency-aware integration;
- truthful release reporting; and
- independent certification without self-certification.

Governance is a control system for shipping the Exchange safely, not a substitute for shipping it.
