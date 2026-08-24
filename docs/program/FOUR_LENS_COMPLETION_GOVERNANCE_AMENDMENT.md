# RFxchange Four-Lens Completion Governance Amendment

**Status:** GOVERNING WHEN MERGED

**Owner:** 00 — RFxchange Control Room

**Authority:** Explicit participant/product-owner direction

**Applies to:** The RFxchange Four-Lens Parallel Delivery Program, its requirement completion semantics, work packets, tracker/ledger progression, merge/release sequencing, and Lane 06 Independent Acceptance.

## 1. Decision

Independent verification / Independent Acceptance is no longer a required completion condition for the Four-Lens Program.

The program may continue to use independent review, Lane 06 audits, Codex review, cross-lens QA, or other assurance when they create value, but none of those mechanisms is a mandatory prerequisite merely to:

- complete a Four-Lens requirement;
- close a Four-Lens work packet;
- promote implemented work in the Four-Lens program ledger/tracker;
- merge otherwise safe work;
- release otherwise authorized work; or
- continue product development.

This removes the independent-verification requirement. It does not remove testing or safety requirements.

## 2. Supersession

This amendment supersedes every conflicting Four-Lens statement that says or implies any of the following:

- only `Verified` satisfies Four-Lens completion;
- Independent Acceptance is required before a Four-Lens requirement may be considered complete;
- Lane 06 is the exclusive completion authority;
- a separate independent reviewer is required for Four-Lens completion;
- reviewer availability creates mandatory verification debt that must remain open;
- a pre-existing packet stop boundary requiring independent acceptance remains a completion prerequisite; or
- tracker/ledger promotion is prohibited solely because Independent Acceptance has not occurred.

This supersession applies, where conflicting, to:

- `FOUR_LENS_PROGRAM_AUTHORITY.md`;
- `BUILD_RELEASE_VERIFY_GOVERNANCE_AMENDMENT.md`;
- `INDEPENDENT_ACCEPTANCE_PROTOCOL.md`;
- `PARALLEL_DELIVERY_MATRIX.md`;
- `CHAT_LANE_CHARTERS.md`;
- Four-Lens workstream/packet records; and
- Four-Lens requirement-ledger completion interpretation.

Historical records are preserved. This amendment changes the governing interpretation going forward; it does not rewrite prior review history or erase existing evidence.

## 3. Completion rule

A Four-Lens requirement may be treated as complete when Control Room can truthfully establish that:

1. the intended requirement has been implemented or explicitly dispositioned under current product authority;
2. applicable implementation tests, CI, emulator/browser/domain evidence and repository guardrails required for that change are satisfactory;
3. applicable dependencies and ownership boundaries are satisfied;
4. no known material defect makes the claimed behavior unsafe or materially false; and
5. the completion/disposition is durably recorded.

`Implemented — Not Verified` is therefore a valid terminal Four-Lens implementation/completion state when the above rule is satisfied. The words `Not Verified` describe the absence of optional independent certification; they no longer mean the requirement is incomplete.

Existing `Verified` records remain valid and may continue to identify work that received additional independent assurance.

No mass relabeling is required merely to adopt this amendment.

## 4. Independent Acceptance becomes optional assurance

Lane 06 remains available as an optional assurance and audit lane.

Lane 06 may:

- audit an implementation against original requirements;
- identify material defects or gaps;
- produce independent evidence;
- record an optional `Verified` assurance result where useful; and
- support higher-risk release review.

Lane 06 no longer owns whether ordinary Four-Lens work is complete.

No builder is required to wait for Lane 06 merely because the work belongs to the Four-Lens Program.

A Lane 06 finding still matters on its substance. A known material security, privacy, tenancy, authorization, payment, legal/policy, destructive-data, or other material integrity defect cannot be ignored merely because independent verification is optional.

## 5. Build and release rule

The streamlined operating sequence is:

```text
Build → Test → Integrate → Release → Improve
```

Optional independent assurance may occur before or after integration/release when useful.

Merge and release decisions remain risk-based. Control Room may merge/release bounded work when current evidence supports doing so and no known material release defect remains.

Independent reviewer availability is not a merge, release, or completion factor by itself.

For Critical boundaries such as payments, authentication, authorization, tenant isolation, privacy, secrets, legal acceptance, and irreversible data operations, required direct negative-path evidence, containment/rollback planning, and explicit product-owner release authority remain in force. Independent reviewer participation is optional unless a separate non-Four-Lens legal, contractual, regulatory, or security authority explicitly requires it.

## 6. Status and reporting semantics

Four-Lens reporting must distinguish implementation truth from optional assurance truth without making optional assurance a completion gate.

Permitted truthful statements include:

- `Implemented`;
- `Implemented — Not Verified`;
- `Implemented and independently verified`;
- `Partial`;
- `Blocked`;
- `Deferred — Explicitly Approved`; and
- `Not Applicable — Explicitly Approved`.

Where the machine ledger retains the historical `Verified` status, that status is an optional assurance marker rather than the sole completion state.

Control Room may close an implemented packet or requirement without an independent reviewer when the completion rule in this amendment is satisfied.

The program should not create or maintain mandatory “verification debt” solely because optional independent review has not occurred.

## 7. Tracker and workstream progression

Four-Lens tracker/workstream progression may be based on implementation completion under this amendment.

Independent acceptance fields may remain null without preventing completion, closure, merge, release, or subsequent packet activation.

Historical packet definitions that required Independent Acceptance are superseded as completion gates by this amendment. Their original text remains preserved for provenance.

No requirement may be silently declared implemented if the underlying behavior is absent. This amendment removes a review dependency; it does not authorize false completion.

## 8. Safety and quality controls retained

This amendment does **not** waive:

- exact-head or current-main CI where applicable;
- architecture/unit/integration/emulator/browser testing appropriate to the change;
- authentication and authorization controls;
- tenant isolation;
- privacy controls;
- geography/lifecycle authority;
- payment integrity;
- legal/policy requirements;
- data-integrity requirements;
- known material defect correction;
- truthful participant-facing behavior; or
- truthful development reporting.

A green check is not permission to ignore a known material defect.

## 9. Anti-bureaucracy rule

Do not replace the removed independent-verification requirement with another universal approval layer.

Use the smallest amount of governance necessary to ship the Exchange safely and truthfully.

The objective is to keep the Exchange open, let participants use completed capabilities, keep unavailable individual functions truthful, and continue building without turning assurance mechanics into a product-delivery bottleneck.

## 10. Execution and confirmation default

An explicit participant/product-owner instruction to implement a bounded change is authorization to perform that change within the stated scope. Do not add a second generic `proceed?`, approval, acceptance, Control Room, or confirmation step merely because implementation is about to begin or has just been completed.

For ordinary Standard work, the default execution path is:

```text
Implement → run proportionate tests → reconcile with current main → merge when sound → continue
```

Use repository history as the ordinary durable completion record. A commit/PR plus the applicable CI or focused test result is normally sufficient evidence for bounded presentation, copy, layout, discoverability, additive, and other low-risk changes. Do not require a separate evidence package, screenshot bundle, independent acceptance record, durable manifest, or manual completion ceremony unless the change itself creates a reason for one.

Additional explicit human confirmation is reserved for decisions where it is materially necessary, including:

- payments or new commercial commitments;
- destructive or practically irreversible actions;
- consequential privacy or security boundary changes;
- legal or policy acceptance;
- critical authentication, authorization, tenant-isolation, secrets, or data-integrity risk acceptance; or
- genuine material ambiguity between different product outcomes that cannot be resolved from current authority and context.

Routine copy changes, visual refinements, responsive fixes, navigation cleanup, ordinary workflow completion, implementation of already-directed features, non-destructive bug fixes, and proportionate test/merge activity do not require renewed product-owner confirmation.

`Control Room confirmation` in older operating text means an objective current-state determination where one is still needed for coordination. It must not be interpreted as a universal extra approval layer.

When a task can be completed safely from the explicit instruction and current repository authority, complete it rather than stopping for permission the participant/product owner already gave.
