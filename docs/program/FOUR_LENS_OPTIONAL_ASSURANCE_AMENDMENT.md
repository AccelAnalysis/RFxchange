# Four-Lens Optional Assurance Amendment

**Status: GOVERNING FOUR-LENS PROGRAM AMENDMENT WHEN MERGED**

**Authority:** explicit participant/product-owner governance direction.

This amendment removes mandatory independent verification/certification from the RFxchange Four-Lens program.

It supersedes every conflicting Four-Lens program clause that makes Lane 06 Independent Acceptance, an independent reviewer, `Verified` status, an acceptance packet, or independent certification a prerequisite to implementation completion, packet completion, merge, release, deployment, tracker progression, workstream closure, program closure, or activation of later work.

## 1. Governing delivery rule

The Four-Lens delivery rule is now:

> **Parallelize production. Centralize product intent. Test proportionately. Release safely.**

The governing progression is:

```text
Build → Test → Release → Improve
```

Independent assurance may be requested when it adds value, but it is optional unless a later explicit product-owner authority makes it mandatory for a specifically named high-risk action.

## 2. Completion

A Four-Lens requirement, feature, packet, or workstream may be treated as implemented/complete for delivery purposes when:

- the approved scope is implemented;
- applicable repository CI/tests/evidence required by the owning authority are satisfied;
- dependencies and ownership boundaries are respected;
- current-main reconciliation is complete where applicable; and
- there is no known material defect that makes the implementation unsafe or knowingly false.

`Verified` is no longer required for completion.

`Implemented — Not Verified` remains a truthful historical/assurance label where already recorded, but the words `Not Verified` do **not** mean incomplete, unreleasable, or ineligible for closure solely because no independent reviewer acted.

No historical `Verified` record is removed or downgraded. This amendment does not automatically convert any requirement to `Verified`.

## 3. Lane 06

Lane 06 — Independent Acceptance is retained only as an **optional, on-demand assurance/audit lane**.

Lane 06 may:

- independently audit selected requirements or releases;
- produce findings and assurance evidence;
- perform targeted post-release or high-risk review when requested; and
- retain historical acceptance records.

Lane 06 absence, reviewer unavailability, an unstarted acceptance packet, or lack of an independent GitHub review signal does not by itself block completion, merge, release, deployment, tracker progression, or program/workstream closure.

## 4. Review and self-certification

Implementation owners may report their work as implemented/complete when objective delivery evidence supports that statement. They must not fabricate independent review or relabel their own work as independently `Verified`.

If the optional `Verified` assurance label is used, it must continue to mean that an independent assurance event actually occurred. The program no longer requires that label to finish work.

## 5. Safety and integrity remain mandatory

Removing mandatory independent verification does **not** waive:

- authentication or authorization boundaries;
- tenant isolation;
- privacy requirements;
- legal/current-policy requirements;
- payment and entitlement integrity;
- data-integrity constraints;
- geography/lifecycle authority;
- known material security or safety defects;
- required CI/build/emulator/browser evidence under the applicable implementation/release authority; or
- truthful participant-facing behavior.

Known material defects must still be corrected, contained, disabled, or explicitly kept non-operational as appropriate. Reviewer scarcity is no longer relevant to that determination.

## 6. Status and tracker interpretation

Existing status values in `governance/four-lens-requirements.json` are preserved for compatibility and historical continuity.

For all Four-Lens program calculations and decisions after this amendment:

- `Verified` means independently assured, not uniquely complete;
- `Implemented — Not Verified` may satisfy delivery completion when the implementation-completion conditions in Section 2 are met;
- `Not Started`, `In Progress`, `Blocked`, `Deferred — Explicitly Approved`, and `Not Applicable — Explicitly Approved` retain their ordinary meanings;
- a tracker or program calculation must not require a `Verified` numerator as the sole definition of completion unless a later explicit authority says so.

This interpretation supersedes prior text stating that “Only `Verified` satisfies completion,” that “only Independent Acceptance may produce completion,” or equivalent language.

## 7. Existing protocols and packets

`INDEPENDENT_ACCEPTANCE_PROTOCOL.md` becomes an optional assurance protocol rather than a mandatory completion protocol.

Existing acceptance packets may be closed, retained as historical assurance work, or run on demand. They do not need to be completed merely to clear delivery debt.

Pre-amendment packet fields such as `acceptanceRequired`, independent reviewer assignments, acceptance SHAs, acceptance evidence, or Lane 06 stop boundaries are interpreted as historical/optional assurance metadata unless a later explicit product-owner authority specifically reactivates them as a named gate.

## 8. Precedence

Where this amendment conflicts with:

- `FOUR_LENS_PROGRAM_AUTHORITY.md`;
- `BUILD_RELEASE_VERIFY_GOVERNANCE_AMENDMENT.md`;
- `INDEPENDENT_ACCEPTANCE_PROTOCOL.md`;
- `CHAT_LANE_CHARTERS.md`;
- `PARALLEL_DELIVERY_MATRIX.md`;
- `FOUR_LENS_EXPERIENCE_LEDGER.md`;
- `governance/four-lens-requirements.json` policy prose;
- `governance/four-lens-workstreams.json` acceptance fields; or
- any pre-amendment Four-Lens packet language,

**this amendment controls for the requirement of independent verification and the meaning of delivery completion.**

Domain, security, privacy, payment, legal, geography, lifecycle, and data-integrity authorities are not superseded by this amendment.
