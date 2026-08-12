# Independent Acceptance Protocol

**Owner:** Lane 06 — Independent Acceptance

Independent Acceptance certifies approved requirements, not implementation effort. It does not implement production feature code and does not change a requirement to match a candidate.

This protocol describes **Layer 1 acceptance integrity** required by the Four-Lens program. Advanced provenance, retention and multi-stage certification hardening belongs to the separately planned `WP-ACCEPTANCE-INTEGRITY-HARDENING-01`; that hardening does not replace or postpone the no-self-certification rule.

## Entry criteria

A production candidate may enter final acceptance only when Control Room records:

- exact candidate SHA;
- exact packet activation/base SHA;
- immutable requirement IDs;
- governing sources;
- implementation PR and implementation actor;
- known limitations and dependencies;
- applicable candidate CI complete;
- candidate environment/evidence location; and
- an exact-head freeze notice.

Incomplete entry data yields `Blocked`; it is not silently reconstructed from chat history.

## Audit sequence

For each requirement:

1. read the original requirement and source;
2. identify controlling security, privacy, lifecycle, geography, domain, brand/design and dependency authority;
3. describe expected participant/domain behavior without relying on the implementation summary;
4. select evidence matching every declared acceptance type;
5. exercise the exact candidate runtime, including negative paths;
6. bind evidence to the exact candidate SHA and packet activation/base SHA;
7. record a disposition and findings; and
8. update the ledger only through a reviewed Lane 06 acceptance change.

## Dispositions

| Disposition | Meaning | Completion effect |
| --- | --- | --- |
| `Verified` | Exact approved requirement is satisfied on the recorded implementation SHA. | Counts toward experience completion; may support tracker promotion. |
| `Partial` | A meaningful subset exists, but the full requirement does not. | Blocks completion. |
| `Not Implemented` | Required behavior does not exist. | Blocks completion. |
| `Blocked` | A genuine dependency prevents verification. | Blocks completion. |
| `Deferred` | Exact omission has explicit independent approval and a recorded future owner/impact. | Does not count as implemented. |
| `Decision Required` | Authorities are materially ambiguous or conflicting. | Blocks completion pending explicit resolution. |

Only `Verified` is completion.

## Configurable authenticated reviewer identity

The program accepts exact GitHub identities in either form:

- `github:<login>` for a human GitHub identity;
- `github-app:<login>` for a GitHub App identity.

The workstream ledger contains program-authorized identities and permits a Lane 06 packet to receive another exact packet-scoped GitHub human/App assignment before acceptance begins.

The acceptance signal must be authored in GitHub by the exact configured or packet-assigned identity. The reviewer must differ from the implementation actor. This rule applies regardless of reviewer mechanism.

`github-app:chatgpt-codex-connector[bot]` remains supported, but the program is not coupled exclusively to that App; another explicitly assigned independent human or App may perform Lane 06 review.

Layer 1 structurally records and validates this identity/separation contract. Live GitHub API reauthentication of historical review actors is acceptance-hardening work, not a prerequisite for installing the Four-Lens lanes.

## Evidence rules

- Functional claims require runtime behavior.
- Domain/security claims require positive and negative runtime or emulator evidence.
- Visual claims require browser-rendered evidence.
- Responsive claims require applicable viewport evidence.
- Motion claims require before, transition and settled observations, including reduced motion.
- Accessibility claims require keyboard, semantic, focus and assistive-state evidence.
- Participant copy requires rendered review in governed locales.
- Cross-lens continuity requires a real supported journey.
- Performance claims require bounded measurements appropriate to the claim.
- Static scans and implementation tests are supporting evidence only.

For `Verified`, the ledger evidence is structured as `{ type, manifest }`, where `manifest` is the exact candidate's tracked `docs/program/evidence/<candidate-sha>.json` Lane 06 record. That manifest names:

- exact candidate SHA;
- exact activation/base SHA;
- Lane 06 producer and reviewer identity;
- GitHub Actions run reference;
- configured environment/reference;
- passed check(s) for every claimed acceptance type; and
- durable repository/HTTPS artifact references.

Every acceptance type declared by the requirement must be mapped. One generic entry, stale-candidate evidence, an unmapped string, or partial type coverage is insufficient.

Layer 1 validates manifest structure and exact-SHA/type/reviewer binding without making repository CI depend on live GitHub API or Actions artifact retention.

## Exact-head change control

Acceptance starts at candidate head `X`. A substantive finding fails `X`. Any correction produces candidate `Y`; evidence and review on `X` do not transfer to `Y`.

`Y` requires full applicable CI, regenerated affected evidence and a fresh independent GitHub review signal before merge.

The final review signal is external GitHub state. It is **not** committed back into the same candidate merely to prove that the review occurred, because doing so would create a new head and invalidate the review by construction.

No material P1/P2-equivalent product, security, privacy, integrity, accessibility or authority finding may remain at merge.

## Independence constraints

- Lane 06 may maintain acceptance tooling and evidence infrastructure but may not implement production feature code for the candidate it certifies.
- A builder's tests may be reused as inputs, but Lane 06 selects and interprets its own evidence against the original requirement.
- Control Room coordinates; it does not substitute its own approval for Lane 06.
- Lane 07 integration acceptance supplements rather than replaces Lane 06 requirement acceptance.
- A reviewer identity equal to the implementation actor cannot produce `Verified` for that production requirement.

## Requirement and packet coupling

A requirement may be `Verified` only when:

- its implementation actor and exact implementation SHA are recorded;
- its acceptance lane is `independent-acceptance`;
- its reviewer is explicitly authorized and distinct from the implementation actor;
- its acceptance SHA equals the implementation SHA;
- its exact GitHub review signal is recorded;
- its declared acceptance types are completely covered by candidate-bound evidence;
- its governed dependencies are resolved; and
- a Lane 06 packet containing that requirement has reached a verified/completed/closed acceptance state.

Implementation produces `Implemented — Not Verified`; it does not automatically advance the acceptance packet or the canonical tracker.

## Deferral and N/A

A new `Deferred — Explicitly Approved` or `Not Applicable — Explicitly Approved` decision requires:

- exact requirement ID;
- reason;
- missing dependency where applicable;
- participant/product impact;
- future owner;
- exact independent GitHub approver identity authorized for the requirement;
- approver distinct from the implementation actor; and
- exact GitHub approval signal.

Builder-authored `approvedBy` prose alone is not governed approval.

The adoption-time cursor deferral for `SHARED-RESULT-001` is the single frozen historical exception carried into the program. It cannot be broadened or silently rewritten.

## Tracker and ledger updates

Lane 06 records exact-SHA dispositions in `governance/four-lens-requirements.json`. Only `Verified` changes a Four-Lens requirement numerator.

Feature-ID tracker promotion occurs only after the applicable independent acceptance and under the canonical tracker protocol. Retroactive Wave 4 assurance findings are handled under `WAVE_4_ASSURANCE_LEDGER.md`; prior tracker state is not silently rewritten.

The #172 governance bootstrap does not promote any Feature ID and must leave RFx Core completion unchanged.

## Acceptance hardening boundary

`WP-ACCEPTANCE-INTEGRITY-HARDENING-01` may later strengthen:

- GitHub API provenance checks;
- Actions artifact download/replay;
- cryptographic retention;
- workflow/harness immutability;
- historical/retroactive audit execution;
- multi-stage certification/disposition mechanics; and
- append-only historical reauthentication.

Those controls strengthen the provenance and durability of an independent decision. They do not authorize a builder to make that decision.

## Acceptance closeout template

```text
Acceptance packet:
Accepting lane:
Independent reviewer:
Implementation actor:
Candidate SHA:
Activation/base SHA:
Requirements:
Authorities read:
Evidence by acceptance type:
Findings:
Disposition per requirement:
Residual/cleanup result:
Tracker recommendation:
Exact-head GitHub review signal:
Stop boundary confirmed:
```
