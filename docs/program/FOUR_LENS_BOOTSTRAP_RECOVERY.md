# Four-Lens Governance Bootstrap Recovery

**Scope:** PR #172 governance bootstrap only. No participant-facing Shared Exchange, RFx, Intelligence, Resources, Referrals, or Feature-ID completion work is authorized by this recovery.

## Recovery objective

Install the approved Four-Lens operating model without making installation depend on future production-acceptance infrastructure.

The required bootstrap sequence is:

```text
merge governance authority
→ successful production-ci on the authority merge in main
→ close authority setup
→ switch the program to operational
→ activate independent lane packets from an exact current-main SHA
```

The permanent lanes remain 00 Control Room, 01 Shared Exchange Platform, 02 Opportunities/RFx, 03 Intelligence, 04 Resources, 05 Referrals, 06 Independent Acceptance, and 07 Integration/Cross-Lens QA.

## Bootstrap-deadlock audit

The pre-recovery #172 head mixed bootstrap governance with long-term acceptance hardening. The resulting design had these bootstrap hazards:

1. `SELF`, authority merge SHA, and the post-merge `production-ci` run were treated as if they belonged to one pre-merge evidence state even though merge SHA and push-run identity cannot be known before merge.
2. exact-head independent review was repeatedly invalidated by commits made only to encode review/run provenance produced after that head existed;
3. acceptance evidence, certification, durable-retention, retroactive-audit, and disposition mechanics created circular source → certification → disposition requirements before the lanes themselves were operational;
4. the program depended on a single configured, quota-limited GitHub App reviewer identity;
5. retroactive Wave 4 assurance was made dependent on acceptance workflow/configuration that did not exist on the historical implementation commits;
6. setup closure, program-phase transition, activation epoch creation, and packet exact-base assignment were entangled rather than represented as a deliberate post-merge Control Room transition;
7. stale unresolved review threads made corrected historical heads appear currently actionable even after their underlying mechanism had been superseded;
8. Layer-2 provenance controls could make ordinary repository validation depend on GitHub API state, Actions retention, historical artifacts, and future acceptance infrastructure.

## Layer 1 — Bootstrap Governance

PR #172 must establish and structurally validate:

- the eight permanent lanes and ownership boundaries;
- GitHub/merged-repository authority as the durable communication bus;
- immutable requirement IDs, original text, governing source, ownership, dependencies and acceptance obligations;
- the eight initial bounded packet definitions and dependency graph;
- exact activation-base rules and activation epochs;
- explicit packet ownership, status, dependencies, candidates and stop boundaries;
- Shared Exchange ownership of shared participant contracts;
- `Implemented — Not Verified` as the builder-complete state;
- Lane 06 as the only authority that may produce `Verified` for a production requirement;
- explicit implementation actor and a distinct authorized independent reviewer identity for `Verified`;
- exact implementation/acceptance SHA equality for `Verified`;
- evidence coverage for every declared acceptance type;
- dependency satisfaction before `Verified`;
- truthful Four-Lens matrix and canonical tracker arithmetic;
- no Feature-ID completion change while #172 remains in `authority-setup`;
- deterministic repository validation that does not require live GitHub API or retained Actions artifacts.

### Bootstrap lifecycle

Before #172 merges:

- `programPhase = authority-setup`;
- `WP-CONTROL-AUTHORITY-SETUP.status = in-progress`;
- setup candidate PR is `172` and candidate SHA is the sentinel `SELF`;
- setup `mergeSha`, `postMergeMainSha`, and `postMergeRunUrl` are null;
- the setup packet is bound to adoption main `21c4fc080a823ae03f33ae1e58dd2752f317dc67` through `authority-setup-2026-08-12`;
- every downstream packet remains pre-activation with no exact base and no activation epoch.

After #172 merges, Control Room performs one explicit transition from a freshly fetched current-main SHA. That change replaces `SELF` with the final #172 head, records the exact authority merge SHA, records the successful `production-ci` push-run URL and SHA, closes the setup packet, switches `programPhase` to `operational`, opens the initial operational activation epoch(s), and binds the Shared, Wave 4 Assurance, Intelligence, Resources and Referrals packets to the exact current-main SHA observed for activation.

The activation epoch's `mainBaseSha` is the immutable governance base for the packet. A later candidate branch/PR may start from that SHA or a descendant current-main SHA; it may not claim an unrelated or invented base.

Slice 4.6 remains separately dependency-aware. Its preserved PR #171 candidate is recorded, but its reconciliation packet and acceptance packet are not activated by the initial operational transition.

## Independent Acceptance identity model

Layer 1 uses provider-neutral exact GitHub identities:

- `github:<login>` for a human GitHub identity;
- `github-app:<login>` for a GitHub App identity.

The existing `github-app:chatgpt-codex-connector[bot]` remains program-authorized.

The program is not coupled exclusively to that App. Control Room may explicitly assign another exact GitHub user or App identity to a Lane 06 packet before acceptance begins. That packet assignment is the authorization for that packet, not a global grant. The GitHub review signal must be authored by the exact configured or packet-assigned identity.

Regardless of reviewer mechanism, Layer 1 rejects a `Verified` record when the reviewer equals the implementation actor. A builder therefore cannot promote its own production requirement to `Verified` merely because Layer-2 provenance hardening is deferred.

## Layer 2 — Acceptance Integrity Hardening

Planned non-blocking packet: `WP-ACCEPTANCE-INTEGRITY-HARDENING-01`.

This packet is intentionally not activated by PR #172. Its scope includes:

- long-term Actions artifact retention and retained byte-for-byte certification snapshots;
- cryptographic/digest retention of acceptance artifacts and historical dispositions;
- live GitHub API provenance verification for implementation PR authors, review actors, run IDs, merge ancestry and artifacts;
- immutable workflow/harness provenance and runner hardening;
- multi-stage source/certification/disposition mechanics;
- historical/retroactive assurance execution for candidates predating the acceptance harness;
- append-only historical acceptance, deferral, candidate and activation-epoch reauthentication;
- stronger anti-tamper rules for evidence-only certification PRs, renames, workflow paths and exact execution environments.

Deferral of these controls does **not** permit self-verification. Layer 1 still requires the production requirement to remain non-Verified unless a Lane 06 acceptance record names an authorized reviewer distinct from the implementation actor, binds the exact implementation SHA, supplies the declared acceptance-type evidence, satisfies governed dependencies, and has the exact GitHub review signal recorded. Layer 2 strengthens provenance and retention of that decision; it does not create the independence rule.

## Historical #172 P1/P2 reconciliation

The prior findings are reconciled against the recovered two-layer design as follows.

### Corrected in Layer 1

- **Freeze every immutable requirement ID** — corrected.
- **Freeze original requirement text** — corrected.
- **Record independent accepter before Verified** — corrected.
- **Bind Verified acceptance to implementation SHA** — corrected.
- **Reject active packets without exact base** — corrected with activation epochs.
- **Point assurance rows at declared work packets** — corrected.
- **Freeze adopted acceptance obligations** — corrected by requirement/packet governance digests.
- **Enforce packet dependency identities/lifecycle** — corrected.
- **Preserve required packet dependency edges** — corrected.
- **Require evidence for every declared acceptance type** — corrected.
- **Freeze requirements appended after adoption** — corrected for the installed immutable 105-record baseline; new requirements require a separately reviewed baseline advance.
- **Reject verification with unresolved deps** — corrected.
- **Bind every evidence entry to accepted candidate** — corrected through exact candidate manifest/SHA binding.
- **Bind reviewer identity to non-builder identity** — corrected.
- **Prevent self-approved N/A deps** — corrected for new N/A decisions; the one historical cursor defer is frozen as an explicit adoption exception.
- **Couple verified packet state to requirements** — corrected: `Verified` requirements require completed/verified Lane 06 packet state.
- **Allow bot identity syntax** — corrected by provider-neutral GitHub user/App identity syntax.
- **Require positive acceptance review signal** — corrected as a required exact GitHub signal in the acceptance record/process; live API reauthentication is Layer 2.
- **Authenticate explicit deferral approvals** — corrected for new deferral/N/A decisions through exact authorized identity plus GitHub signal; historical adoption exception remains frozen.
- **Require activation-time merged-main exact base** — corrected through activation epochs and exact-base binding.
- **Couple new tracker completions to Verified** — bootstrap is corrected by prohibiting any tracker/RFx completion change in `authority-setup`; later tracker promotion remains governed by Verified-only protocol.

### Superseded by the simpler bootstrap design

- **Authenticate recorded independent reviewer** — the prior live-API implementation is superseded for Layer 1 by explicit configured/packet-assigned identities plus the GitHub-authored signal; API reauthentication moves to Layer 2.
- **Verify Actions run/artifacts** — the prior live-download requirement is superseded at bootstrap by structural exact-SHA/type/run/artifact references; live API/artifact revalidation is Layer 2.
- **Bind N/A approval to authenticated accepter** — the multi-stage proposal/certification mechanism is superseded by the Layer-1 exact independent identity + GitHub approval signal rule; stronger provenance is Layer 2.
- **Reject nonexistent packet exact base commits** — Layer 1 requires exact 40-character current-main activation epochs and Control Room truthfulness; remote commit existence/ancestry reauthentication is Layer 2.
- **Require authorized acceptance packet before verification** — retained in simpler form: a Verified requirement must be within a completed/verified Lane 06 packet; live PR provenance is Layer 2.
- **Bind N/A approval to proposal PR current head** — multi-stage proposal PR mechanics are not a bootstrap prerequisite; exact independent approval remains mandatory.
- **Authenticate requirement disposition stage** — multi-stage disposition provenance is superseded for Layer 1 by the exact reviewer/SHA/signal acceptance record.

### Intentionally moved to `WP-ACCEPTANCE-INTEGRITY-HARDENING-01`

- **Require independently verifiable execution evidence** beyond the structural manifest/run/artifact contract.
- **Validate artifact contents per check** with byte-level archive replay.
- **Preserve accepted evidence beyond Actions retention** through retained certification snapshots.
- **Scope certification cache to each manifest**.
- **Bind certification PRs to the manifest base**.
- **Reject renames from outside the certification allowlist**.
- **Authenticate implementation actors before N/A approval** through live PR-author provenance rather than the Layer-1 recorded actor.
- **Require evidence runs to use a governed workflow** with byte-identical workflow/harness provenance.
- **Support retroactive candidates in workflow validation** through a dedicated historical audit execution model.
- **Preserve superseded acceptance decisions** with append-only cryptographic/durable history.
- **Move post-head provenance out of evaluated manifests** through multi-stage certification.
- **Preserve superseded activation epochs** with historical remote reauthentication beyond the current append-preserving ledger.
- **Enforce Lane 06 production isolation** through authenticated PR changed-file provenance.
- **Harden independent acceptance provenance** through GitHub API reauthentication.
- **Reject material review-body findings** through API-level review-thread inspection.
- **Constrain acceptance execution environment** with immutable runner/harness provenance.
- **Require typed requirement-specific evidence** beyond the Layer-1 per-requirement/per-type manifest mapping where byte-level observation semantics are required.
- **Use immutable evidence run base** through authenticated workflow-run base ancestry.
- **Allow descendant certification bases** in the multi-stage certification model.
- **Require merged dependency in certification base** through authenticated merge ancestry.

These Layer-2 controls remain desirable assurance work. They are not required to establish the eight lanes, preserve immutable requirements, prevent a builder from self-marking production work `Verified`, or truthfully activate bounded packets from an exact current-main base.

## Stop boundary

This recovery does not:

- implement participant-facing functionality;
- activate downstream packets before the post-merge Control Room transition;
- change a Four-Lens requirement to `Verified`;
- change canonical RFx Feature-ID completion;
- merge or rewrite PR #171 runtime work;
- begin Slice 4.7.
