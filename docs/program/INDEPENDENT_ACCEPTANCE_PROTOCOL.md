# Optional Independent Assurance Protocol

**Owner:** Lane 06 — Optional Independent Assurance

This protocol is governed by [`FOUR_LENS_OPTIONAL_ASSURANCE_AMENDMENT.md`](FOUR_LENS_OPTIONAL_ASSURANCE_AMENDMENT.md).

Lane 06 is retained as an optional, on-demand assurance/audit capability. Independent verification is **not** a prerequisite to Four-Lens implementation completion, merge, release, deployment, tracker progression, workstream closure, or program closure.

Historical Independent Acceptance evidence and `Verified` dispositions remain valid historical assurance records. Nothing in this protocol automatically grants or removes `Verified` status.

## When to use Lane 06

Control Room or the participant/product owner may request optional independent assurance when it adds value, including:

- a high-risk or consequential boundary;
- a disputed requirement interpretation;
- post-release audit;
- targeted security/privacy/authority review;
- regression investigation;
- evidence desired for external confidence; or
- a later bounded authority that explicitly requires independent assurance for a named action.

Reviewer unavailability alone does not block ordinary delivery.

## Entry information

When optional assurance is requested, provide enough information to audit the actual implementation:

- exact implementation SHA;
- governing requirement IDs and sources;
- implementation PR/actor;
- applicable dependencies and known limitations;
- implementation CI/runtime evidence; and
- the environment or evidence location relevant to the claim.

Missing information may prevent the optional assurance opinion, but does not retroactively make an otherwise safely delivered implementation incomplete.

## Audit sequence

When Lane 06 is invoked:

1. read the original requirement and governing authority;
2. identify applicable security, privacy, lifecycle, geography, domain and dependency boundaries;
3. define expected behavior independently of the implementation summary;
4. select evidence appropriate to the claim;
5. exercise the exact implementation where practical;
6. bind findings to the exact implementation SHA; and
7. record the assurance result without changing the original requirement to fit the implementation.

## Optional assurance dispositions

Lane 06 may record:

- `Verified` — independently assured on the recorded exact implementation;
- `Partial`;
- `Not Implemented`;
- `Blocked` — the assurance activity itself cannot reach a conclusion;
- `Deferred`; or
- `Decision Required`.

These dispositions describe **assurance state**, not the sole definition of delivery completion.

`Verified` remains a meaningful optional label for work that actually received independent assurance. It is not required for completion.

## Completion and delivery

Four-Lens delivery completion is governed by the Optional Assurance Amendment. In summary, work may be complete for delivery when approved scope is implemented, applicable implementation/release evidence is satisfied, dependencies/ownership are respected, and no known material defect makes the implementation unsafe or knowingly false.

Therefore:

- `Implemented — Not Verified` may be complete and releasable;
- absence of a Lane 06 packet is not a defect;
- an uncompleted acceptance packet is not automatically delivery debt;
- a missing independent GitHub review signal is not automatically delivery debt; and
- tracker/program calculations must not require `Verified` as the sole completion numerator.

## Independence truthfulness

A builder or Control Room may report implementation complete when objective delivery evidence supports it. They may not claim that their own work was independently `Verified` unless an actual independent assurance event supports that statement.

If Lane 06 performs an audit, the reviewer should remain independent of the implementation actor for any `Verified` claim.

## Evidence guidance

When optional assurance is performed, use evidence appropriate to the claim:

- functional — runtime behavior;
- domain/security — positive and negative runtime/emulator evidence;
- visual/responsive — browser-rendered evidence at applicable viewports;
- accessibility — keyboard, semantics, focus and assistive-state evidence;
- copy/locales — rendered output in governed locales;
- cross-lens continuity — actual supported journey;
- performance — bounded measurements appropriate to the claim.

Static scans and implementation tests may supplement runtime evidence.

## Findings against delivered work

If optional assurance finds a material defect in merged/live work:

1. bind the finding to the exact implementation;
2. determine production impact;
3. notify Control Room;
4. contain, disable, roll back or correct the affected behavior when the defect is material;
5. preserve prior provenance; and
6. optionally re-audit the corrected implementation.

A known material defect remains actionable because of its substance, not because an independent reviewer exists.

## Safety boundary

Removal of mandatory Independent Acceptance does not waive authentication, authorization, tenant isolation, privacy, legal/current-policy, payment integrity, data integrity, geography/lifecycle authority, required CI/evidence, or truthful participant behavior.

## Historical compatibility

Existing fields in `governance/four-lens-requirements.json`, `governance/four-lens-workstreams.json`, prior evidence manifests, acceptance packets and historical program documents may remain for compatibility and provenance.

Where older artifacts state that only `Verified` is complete, that Lane 06 is required for completion, or that `acceptanceRequired` is universally blocking, the Optional Assurance Amendment supersedes that interpretation unless a later explicit product-owner authority reactivates a named independent-assurance gate.

## Optional assurance closeout template

```text
Assurance request:
Assurance lane/reviewer:
Implementation actor:
Implementation SHA:
Requirements/authorities:
Evidence reviewed:
Findings:
Assurance disposition:
Production impact, if any:
Recommended follow-up:
```
