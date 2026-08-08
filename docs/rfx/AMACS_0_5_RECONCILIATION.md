# RFxchange reconciliation to AMACS 0.5.0

**Status: COMPLETE VIA PR #123 — NO FEATURE IDS CHANGED. THE AI/AMACS INTERPRETATION FOUNDATION IS NEXT.**

## Authority

This document supersedes only the AMACS version, release-shape and semantic-entry assumptions in earlier RFx Core convergence documents that referenced AMACS 0.1.0. Their adopted RFx aggregate, spatial or operational workspace, structured location, value and term, response or evaluation, readiness and wave-boundary decisions remain in force unless expressly changed here.

Pinned standard:

- repository: `AccelAnalysis/amacs`;
- version: `0.5.0`;
- merged source commit: `da7879f2609271b067ae6d02875e9388a02c4fe5`;
- release date: `2026-08-08`;
- catalog shape: 16 domains, 120 families, 615 matchable capabilities and 185 aliases;
- new semantic-entry schemas: MarketNeed, InterpretationRecord, InterpretationCandidate and ConceptInterpretationGuidance.

The AMACS manifest and SHA-256 checksums remain the release authority.

A retained CI release artifact may be consumed when available. Because CI artifacts expire, RFxchange must also support deterministic reconstruction by checking out the exact pinned AMACS commit and running the official release builder with that same commit as `source_commit`. The resulting manifest must name `da7879f2609271b067ae6d02875e9388a02c4fe5`, and RFxchange must preserve its own ingestion lock containing the release identity, source commit, projection version and generated checksums.

## Why reconciliation precedes the AI foundation

RFxchange must not invent a private need model or AI-specific quasi-taxonomy. AMACS 0.5.0 now defines the provider-neutral contracts that sit between ordinary participant language and authoritative RFxchange records.

```text
participant language or approved source material
→ non-authoritative interpretation record or candidates
→ participant accept, edit, reject or unresolved disposition
→ separately authorized RFxchange command
→ authoritative market need, organization capability assertion or RFx requirement
```

The AI provider, model, prompt, token or cost and retention details remain RFxchange implementation provenance rather than AMACS semantics.

## Reconciliation work

After PR #120 or Slice 3.2 merges, the next implementation gate must:

1. consume a valid artifact or deterministically rebuild and verify the immutable AMACS 0.5.0 release at the exact pinned commit;
2. preserve historical 0.1.0 records and label snapshots;
3. replace stale 0.1.0 runtime and count assumptions without hard-coding 0.5.0 counts into participant behavior;
4. generate or verify TypeScript types and server validators for the 0.5.0 catalog and runtime contracts;
5. expose release-aware catalog traversal and deterministic search application ports for the later AI foundation and Slice 3.3 consumer;
6. add migration preview and explicit handling for existing free-text organization capability data;
7. forbid automatic conversion of free text, websites, documents, NAICS or model output into capability assertions;
8. preserve the AMACS contracts and application seams needed for later manual browse, search and provisional-term workflows without implementing the participant picker here;
9. preserve requirement-type and team-coverage metadata without implementing the Wave 4 RFx requirement engine;
10. preserve entity scope, market roles, evidence references and verification separation; and
11. add CI guardrails for source commit, checksums, counts, references, schema validity, generated projection, history and browser-source isolation.

## Completion boundary

This reconciliation is a no-Feature-ID release-integration gate. It does not implement or complete:

- `ORG-013` or another organization feature;
- a participant-facing AMACS picker;
- organization capability assertion commands;
- MarketNeed or RFx requirement product workflows;
- team-coverage enforcement behavior;
- matching, qualification or verification;
- credibility, referrals or provider routing; or
- any RFx Feature ID.

Participant manual browse or provisional-term acceptance belongs to Slice 3.3 or the applicable RFx slice. Server-side RFx requirement and team-coverage behavior belongs to Wave 4.

PR #123 completed this gate with deterministic ingestion and projection, current and historical release validation, typed runtime contracts, migration evidence, participant-surface isolation and production CI run `31284501027` on substantive head `c2d6695cdea2f3d3386dab354e37e1bba9440e87`. Tracker arithmetic remained **438 total · 125 Done · 313 Not Started**, with Network **11/38**.

The AI/AMACS Interpretation Foundation is the next active no-Feature-ID gate against the pinned 0.5.0 contracts. Slice 3.3 may be authorized only after that foundation itself merges and the next authority is recalculated.
