# Shared Experience Completion Backlog

This backlog preserves the complete post-PR-#160 record rather than rewriting the request around what merged. PR #160 was a substantial implementation candidate, but the new program model separates that implementation evidence from independent certification. Later bounded corrections are recorded explicitly rather than being folded back into PR #160 history.

## Disposition matrix

| Requirement area | Program IDs | Runtime/evidence state | Program disposition | Next action |
| --- | --- | --- | --- | --- |
| Persistent shell, warm transition and Account utility | `SHARED-TRUTH-001`, `SHARED-TRANSITION-001`, `SHARED-ACCOUNT-001` | Implemented in PRs #159/#160 with CI/browser evidence | Implemented — Not Verified | Independent authority-outward browser/accessibility audit |
| Phase 2 selectable lens containers | `SHARED-LENS-CONTEXT-001` | Successor requirement authorized by Control Room PR #187; production controller/registry not yet implemented | Not Started | Lane 01 Phase 2 implementation, then independent acceptance |
| Lifecycle continuation | `SHARED-LIFECYCLE-001` | Implemented and iteratively corrected in PR #160 | Implemented — Not Verified | Independent intermediate-state and fresh-sign-in audit |
| Scoped spatial context and camera/view state | `SHARED-SPATIAL-*`, `SHARED-VIEW-001`, `SHARED-CAMERA-001` | Implemented; prior review found and corrected memory/cold-hydration defects | Implemented — Not Verified | Independent storage invalidation and actual Mapbox camera audit |
| Marker hierarchy and clustering | `SHARED-MARKER-*`, `SHARED-CLUSTER-001` | Initials, compact/standing layers and clustering implemented | Implemented — Not Verified | Browser visual/motion/accessibility audit on exact candidate |
| Public organization logo | `SHARED-IDENTITY-001` | Private source assets and controlled delivery exist; Network marker projection exposes initials, not an accepted public logo reference | Blocked | Shared Contract Request for privacy-safe public-logo projection; never expose private Storage metadata directly |
| Result drawer/search grammar | `SHARED-DRAWER-001`, `SHARED-SEARCH-001` | Implemented over the current page contract | Implemented — Not Verified | Independent desktop/mobile/map-list synchronization audit |
| Cursor/infinite progression | `SHARED-RESULT-001` | No backend cursor contract; page behavior intentionally retained | Deferred — Explicitly Approved | Future Lane 01 packet after separately authorized cursor projection exists |
| Selected organization across lenses | `SHARED-CONTINUITY-001` | Broad carry-forward and server revalidation implemented | Implemented — Not Verified | Independent supported journey audit |
| Selected organization through Intelligence query links | `SHARED-CONTINUITY-002` | PR #160 left the query-link seam partial; PR #186 candidate `6f160d84dd0f702e8546cbb421c17b2f3ac56dbd` incorporated PR #174 continuity, preserved `selectedOrganization` through search, Clear, previous/next pagination and safe return with server revalidation, and merged as `10150e66b4a1b37a0cda5381986c5599da96e632` | Implemented — Not Verified | Independent cross-lens acceptance and remaining production real-map health evidence |
| Explicit safe return | `SHARED-RETURN-001` | Shared safe return seams implemented | Implemented — Not Verified | Independent operational completion/cancel/reload audit |
| Action projection | `SHARED-ACTIONS-001` | Shared self/external/provider/referral availability projection implemented | Implemented — Not Verified | Independent positive/negative server-authority audit |
| Internal-language suppression | `SHARED-COPY-001` | Guardrails and localized copy implemented | Implemented — Not Verified | Rendered five-locale review |
| Approximate/locality language | `SHARED-PRIVACY-001` | Runtime says `Near {locality}`; the original authority explicitly preferred locality-only/no sentence over `Near Smithfield` | Decision Required | User/product privacy-copy decision before correction |
| Privacy-suppressed discoverability | `SHARED-PRIVACY-002` | Implemented with result/detail presence and controlled map projection | Implemented — Not Verified | Independent privacy matrix/browser audit |
| Accessibility/locales | `SHARED-A11Y-001`, `SHARED-I18N-001` | Implementation evidence exists | Implemented — Not Verified | Independent keyboard, assistive-state, 390px, reduced-motion and five-locale review |
| Exact-head procedure | `SHARED-EVIDENCE-001` | PR #160 merged at head `6ad1fd0...` after a substantive final-head Codex P2 finding | Not Implemented procedurally | Do not retroactively certify PR #160; use later exact-head packets/evidence without rewriting this historical procedural defect |

## Historical evidence retained

- PR #160 final implementation head: `6ad1fd0b6dfebe9d6013c4cca7901515810185ef`.
- PR #160 merge commit: `01767a7a5721d8a6b303532b951ef1e2f2b497c7`.
- Exact-head production CI was green at the implementation head.
- The checked-in reconciliation records configured Chrome/Firebase/real-Mapbox observations.
- Numerous earlier review findings were corrected and threads resolved.
- The last reviewer report on the PR #160 final head identified the selected-organization link defect before merge.
- PR #174 preserved the intended selected-organization continuity source behavior.
- PR #186 candidate `6f160d84dd0f702e8546cbb421c17b2f3ac56dbd` corrected that continuity seam with exact-head CI run `31662605471` and merged as `10150e66b4a1b37a0cda5381986c5599da96e632`; post-merge CI run `31687342981` passed.

This evidence is valuable. Under the program authority it is implementation/release evidence, not independent certification.

## Documentation drift

The post-PR-#159 reconciliation historically said implementation/local acceptance were complete and merge was pending, although PR #160 later merged. It also records `Near {locality}` as an implemented result despite the original authority's preference against that phrase. Those historical statements remain evidence of what occurred at PR #160. The selected-organization query-link defect is no longer a current implementation blocker because PR #186 corrected it; independent acceptance and the separate Phase 1 authenticated real-map production health evidence remain pending.
