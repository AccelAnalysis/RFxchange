# RFxchange reconciliation to AMACS 0.5.0

**Status: CANONICAL CROSS-WAVE RECONCILIATION AUTHORITY — DOCUMENTATION ONLY. IMPLEMENT AFTER SLICE 3.2 MERGES AND BEFORE THE AI/AMACS INTERPRETATION FOUNDATION.**

## Authority

This document supersedes only the AMACS version, release-shape and semantic-entry assumptions in earlier RFx Core convergence documents that referenced AMACS 0.1.0. Their adopted RFx aggregate, spatial/operational workspace, structured location/value/term, response/evaluation, readiness and wave-boundary decisions remain in force unless expressly changed here.

Pinned standard:

- repository: `AccelAnalysis/amacs`;
- version: `0.5.0`;
- merged source commit: `da7879f2609271b067ae6d02875e9388a02c4fe5`;
- release date: `2026-08-08`;
- catalog shape: 16 domains, 120 families, 615 matchable capabilities and 185 aliases;
- new semantic-entry schemas: MarketNeed, InterpretationRecord, InterpretationCandidate and ConceptInterpretationGuidance.

The AMACS manifest and SHA-256 checksums remain the release authority.

## Why reconciliation precedes the AI foundation

RFxchange must not invent a private need model or AI-specific quasi-taxonomy. AMACS 0.5.0 now defines the provider-neutral contracts that sit between ordinary participant language and authoritative RFxchange records.

```text
participant language or approved source material
→ non-authoritative interpretation record/candidates
→ participant accept/edit/reject/unresolved disposition
→ separately authorized RFxchange command
→ authoritative market need, organization capability assertion or RFx requirement
```

The AI provider, model, prompt, token/cost and retention details remain RFxchange implementation provenance rather than AMACS semantics.

## Reconciliation work

After PR #120 / Slice 3.2 merges, the next implementation gate must:

1. ingest and verify the immutable AMACS 0.5.0 release;
2. preserve historical 0.1.0 records and label snapshots;
3. replace stale 0.1.0 runtime/count assumptions without hard-coding 0.5.0 counts into participant behavior;
4. generate or verify TypeScript types and validators for the 0.5.0 catalog and runtime contracts;
5. expose release-aware catalog/search ports for the AI foundation and Slice 3.3;
6. add migration preview and explicit handling for existing free-text organization capability data;
7. forbid automatic conversion of free text, websites, documents or model output into capability assertions;
8. retain manual Domain → Family → Capability browse/search and provisional-term pathways;
9. preserve entity scope, market roles, evidence references and verification separation; and
10. add CI guardrails for checksums, counts, references, schema validity, history and browser-source isolation.

## Completion boundary

This reconciliation is a no-Feature-ID cross-cutting gate. It does not complete `ORG-013`, any RFx Feature ID, organization verification, credibility, referrals, provider routing or matching.

After it merges and dependencies are recalculated, the AI/AMACS Interpretation Foundation may be implemented against the pinned 0.5.0 contracts. Slice 3.3 may be authorized only after that foundation itself merges and the next authority is recalculated.
