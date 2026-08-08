# AMACS 0.5.0 Reconciliation Architecture

## Status

**COMPLETE VIA PR #123 — NO FEATURE IDS CHANGED.**

This gate implements no participant workflow and completes no Feature ID.

## Immutable release boundary

RFxchange vendors the official AMACS 0.5.0 release artifact reconstructed at exact source commit `da7879f2609271b067ae6d02875e9388a02c4fe5`. The artifact contains the complete source projection, schemas, seeds, manifest and `SHA256SUMS` emitted by the upstream builder.

The ingestion validator fails when:

- the version, release date or full source commit differs;
- a file is missing, added or changed relative to `SHA256SUMS`;
- any manifest count differs from the actual JSONL record count;
- a registry record fails its AMACS schema;
- a canonical reference targets an unknown record;
- a required semantic-entry or downstream schema is absent; or
- a committed RFxchange generated artifact differs byte-for-byte from a deterministic rebuild.

The verified 0.5.0 release contains:

- 16 domains;
- 120 families;
- 615 matchable capabilities;
- 185 aliases;
- all additional manifest registries; and
- the MarketNeed, InterpretationRecord, InterpretationCandidate and ConceptInterpretationGuidance schemas.

Counts are validation evidence from the manifest and source records, not participant-runtime constants.

## Generated RFxchange boundary

`src/generated/amacs/0.5.0` contains deterministic, release-aware projections:

- `catalog.json` — Domain → Family → Capability traversal data with stable IDs, label/definition snapshots, aliases, hierarchy and replacement references;
- `search-index.json` — deterministic normalized lexical search material;
- `registries.json` — requirement, response, decision, readiness, role, property, credential, outcome and relationship records needed by later authorized consumers;
- `historical/0.1.0/catalog.json` — immutable historical lookup data;
- `migration-preview.json` — explicit compatibility evidence; and
- `ingestion-lock.json` — release/source/schema/projection identity plus generated checksums.

Domain and application code consume `AmacsCatalogPort` and `AmacsRuntimeContractValidatorPort`. Only the server/build infrastructure knows artifact paths, JSON layout or Ajv mechanics.

The catalog service provides deterministic traversal, bounded pagination, label/alias/definition/hierarchy search, canonical ID rejection, current registry lookup and exact historical snapshot resolution. It does not expose a participant picker.

## Historical 0.1.0 compatibility

The repository previously contained planning references to AMACS 0.1.0 but no canonical AMACS runtime repository, domain record or authoritative persisted AMACS reference path. The live activation-era field remains `organizationProfiles.capabilities`, which stores categorized participant-authored free text.

For explicit historical compatibility, RFxchange reconstructs and vendors the last 0.1.0 release state at commit `7e4b6c88e91c2df6f1d596af1dec7701df0290d2`, immediately before the AMACS version advanced to 0.2.0.

The deterministic preview proves:

- 500 historical capability IDs remain present in 0.5.0;
- 115 capabilities are additive in 0.5.0;
- no historical label, status or family movement is inferred by the projections;
- no replacement, split or merge relationship applies in the current artifact; and
- historical resolution requires the exact release, stable ID and label/optional definition snapshot.

No deployed record is rewritten by this gate. Any later environment migration requires a separate read-only deployed-data preview and an authorized consumer slice.

## Slice 3.2 transition

Slice 3.2 continues to search the existing essential-profile free text. Reconciliation does not convert, double-count or reinterpret it. Slice 3.3 will own participant review and a separate current-authority command for confirmed structured assertions, then may migrate discovery toward those assertions under its own acceptance boundary.

Websites, documents, NAICS, participant text and model output remain suggestion sources only and cannot become capability assertions through this gate.

## Runtime schema boundary

Verified TypeScript contracts represent MarketNeed, InterpretationRecord, InterpretationCandidate and ConceptInterpretationGuidance. The server infrastructure compiles the complete vendored JSON Schema set and returns bounded validation results through an application port.

The interpretation schemas preserve:

```text
human_confirmation_required = true
authoritative_effect = none
```

Reconciliation persists no interpretation or authoritative domain record. The later AI/AMACS foundation owns non-authoritative interpretation persistence; Slice 3.3 and Wave 4 own their separate authoritative commands.

## Browser and product isolation

Static guardrails reject artifact, generated-projection, Ajv or AMACS infrastructure imports from `app/` and `src/components/`. There is no participant AMACS request, picker, organization assertion, MarketNeed, RFx requirement or team-coverage workflow in this gate.

## Acceptance evidence

Focused acceptance covers:

- exact current and historical release pins;
- every artifact checksum and exact file membership;
- schema and referential validity;
- full registry/count reconciliation;
- byte-identical deterministic rebuilds;
- traversal and label/alias search;
- invented-ID rejection;
- exact historical snapshot behavior;
- valid semantic-entry examples and invalid authoritative-effect rejection;
- generated migration evidence;
- participant-browser source isolation; and
- absence of later product records or UI.

Local `npm run check` passed with 392 architecture tests, 19 Functions tests, all repository validators, TypeScript, lint and the production build. Production CI run `31284501027` passed on substantive head `c2d6695cdea2f3d3386dab354e37e1bba9440e87`. The official upstream validator and all 44 upstream unit tests passed; RFxchange's focused suite separately verified the current and historical reconstructed release artifacts. Configured-browser acceptance was not applicable because static guardrails prove this server/build-only gate adds no participant-facing surface.

Tracker arithmetic remains **438 total · 125 Done · 313 Not Started**, with Network **11/38**. The AI/AMACS Interpretation Foundation is the active next no-Feature-ID gate; Slice 3.3 remains blocked until it merges and authority is recalculated.
