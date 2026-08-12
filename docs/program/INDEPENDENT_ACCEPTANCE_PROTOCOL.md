# Independent Acceptance Protocol

**Owner:** Lane 06 — Independent Acceptance

Independent Acceptance certifies approved requirements, not implementation effort. It does not implement production feature code and does not change a requirement to match a candidate.

## Entry criteria

A candidate may enter final acceptance only when the Control Room records:

- exact candidate SHA and exact merged base SHA;
- immutable requirement IDs;
- governing sources;
- implementation PR and builder report;
- known limitations and dependencies;
- applicable CI complete on the candidate;
- candidate environment/evidence location; and
- an exact-head freeze notice.

Incomplete entry data yields `Blocked`; it is not silently reconstructed from chat history.

## Audit sequence

For each requirement:

1. read the original requirement and source;
2. identify controlling security, privacy, lifecycle, geography, domain, brand/design and dependency authority;
3. describe expected participant/domain behavior without relying on the implementation summary;
4. select evidence matching every acceptance type;
5. exercise the exact candidate runtime, including negative paths;
6. bind evidence to the candidate SHA and environment;
7. record a disposition and findings; and
8. update the ledger only through a reviewed acceptance change.

## Dispositions

| Disposition | Meaning | Completion effect |
| --- | --- | --- |
| `Verified` | Exact approved requirement is satisfied on the recorded SHA. | Counts toward experience completion; may support tracker promotion. |
| `Partial` | A meaningful subset exists, but the full requirement does not. | Blocks completion. |
| `Not Implemented` | Required behavior does not exist. | Blocks completion. |
| `Blocked` | A genuine dependency prevents verification. | Blocks completion. |
| `Deferred` | Exact omission has explicit approval and a recorded future owner/impact. | Does not count as implemented. |
| `Decision Required` | Authorities are materially ambiguous or conflicting. | Blocks completion pending explicit resolution. |

## Evidence rules

- Functional claims require runtime behavior.
- Domain/security claims require positive and negative runtime or emulator evidence.
- Visual claims require browser-rendered evidence.
- Responsive claims require applicable viewport evidence.
- Motion claims require before, transition and settled observations, including reduced motion.
- Accessibility claims require keyboard, semantic, focus and assistive-state evidence.
- Participant copy requires rendered review in all five governed locales.
- Cross-lens continuity requires a real supported journey.
- Performance claims require bounded measurements appropriate to the claim.
- Static scans and implementation tests are supporting evidence only.

Evidence records must include candidate SHA, base SHA, commands/scenarios, environment, results, artifacts, limitations, cleanup/residual result where data was created, and reviewer identity or lane.

## Exact-head change control

Acceptance starts at head `X`. A substantive finding fails `X`. Any correction produces `Y`; evidence and review on `X` do not transfer. The candidate re-enters with full applicable CI, regenerated affected evidence, a fresh independent audit, and a fresh reviewer signal.

No material P1/P2-equivalent product, security, privacy, integrity, accessibility or authority finding may remain at merge.

## Independence constraints

- The same lane may write acceptance tooling but not production code for the candidate it certifies.
- A builder's tests may be reused as inputs, but the acceptance lane selects and interprets its own evidence against the original requirement.
- Control Room coordinates; it does not substitute its own approval for Lane 06.
- Lane 07 integration acceptance supplements rather than replaces Lane 06 requirement acceptance.

## Tracker and ledger updates

Lane 06 records exact-SHA dispositions in `governance/four-lens-requirements.json`. Only `Verified` changes a program requirement numerator. Feature-ID tracker promotion occurs only after the applicable requirements are Verified and follows the tracker update protocol. Retroactive Wave 4 assurance findings are handled under `WAVE_4_ASSURANCE_LEDGER.md`; prior tracker state is not silently rewritten.

Every ledger acceptance object retains the accepting lane and reviewer identity fields even while unset. `Verified` requires the accepting lane to be `independent-acceptance`, a named independent reviewer, and an acceptance SHA identical to the implementation candidate SHA. A builder or blank/generic acceptance record cannot certify its own candidate.

`Verified` evidence is structured as `{ type, reference }`. Every acceptance type declared by the requirement must have at least one mapped durable repository path or HTTPS reference. One generic entry, an unmapped string, or evidence for only a subset of the declared types is insufficient.

## Acceptance closeout template

```text
Acceptance packet:
Accepting lane:
Independent reviewer:
Candidate SHA:
Base SHA:
Requirements:
Authorities read:
Evidence by acceptance type:
Findings:
Disposition per requirement:
Residual/cleanup result:
Tracker recommendation:
Exact-head review signal:
Stop boundary confirmed:
```
