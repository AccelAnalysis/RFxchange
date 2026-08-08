# RFx Core acceptance and anti-regression matrix

**Status: CANONICAL PRE-IMPLEMENTATION ACCEPTANCE AUTHORITY.**

This matrix supplements each future RFx slice brief. A slice is not complete because a prototype looks correct, an AI response appears plausible or an adjacent feature exists.

## 1. Cross-cutting hard gates

| Area | Required acceptance |
| --- | --- |
| Feature accounting | Only authorized Feature IDs are implemented/marked. Later slices remain untouched. |
| Authorization | Server re-resolves user, organization membership, permission, restrictions and RFx authority for every consequential action. |
| Domain model | One canonical RFx aggregate; no document, AI conversation or UI draft competes with domain identity. |
| AMACS | Immutable 0.5.0 manifest/commit/checksums verified; historical releases preserved; no participant component imports source JSON. |
| Interpretation | MarketNeed / InterpretationRecord / InterpretationCandidate contracts validate; interpretations remain non-authoritative; accepted candidates require a separate authorized write. |
| AI boundary | Provider/model types and secrets remain behind a server-side port; model-memory IDs are rejected; manual operation remains available. |
| Geography | Real RFxchange geography/geocoding/Mapbox only; no fake map, pixel marker or precision expansion. |
| Data structure | Need, location, value, term, requirements, response and evaluation data remain structured. |
| Copy | No participant-facing internal vocabulary; suggestion is not assertion; match is not qualification; handoff is not submission. |
| Design | Approved hierarchy/rows/lifecycle/readiness patterns; no card-grid or duplicate-system regression. |
| Accessibility | Keyboard, focus, screen-reader semantics, responsive behavior and reduced motion/transparency pass. |
| Audit/provenance | Consequential transitions and AI interpretation disposition preserve actor, organization, release/version and correlation context. |
| Privacy | Minimum necessary projections; private exact location, evidence and participant content remain protected. |
| Cost/availability | AI usage is metered and bounded; quota/provider failure degrades to manual AMACS flows. |
| Commercial neutrality | Entitlements do not alter legitimate capability truth, matching, qualification, credibility or evaluation. |
| i18n boundary | RFxchange-controlled UI localizes; participant-authored requirements/responses/documents are not automatically translated. |

## 2. AMACS 0.5.0 acceptance

- [ ] Release version `0.5.0`, commit `da7879f2609271b067ae6d02875e9388a02c4fe5`, manifest and checksums are explicit and verified.
- [ ] 16 domains, 120 families, 615 matchable capabilities and 185 aliases reconcile.
- [ ] Additional 0.5.0 registries reconcile to the release manifest.
- [ ] `market-need`, `interpretation-record`, `interpretation-candidate` and `concept-interpretation-guidance` schemas are packaged and validated.
- [ ] Historical 0.1.0 references/label snapshots remain readable and are not silently remapped.
- [ ] Domain → Family → Capability browse works.
- [ ] Search uses labels, aliases, definitions, hierarchy and optional guidance where present.
- [ ] Search is paginated/virtualized and keyboard accessible.
- [ ] Raw AMACS IDs are absent from primary participant labels.
- [ ] Provisional terms are visibly provisional and cannot satisfy mandatory canonical requirements.
- [ ] Team-coverage restrictions are enforced by requirement type on the server.
- [ ] Deprecated/merged/split concepts have an explicit migration path.

## 3. Interpretation acceptance

- [ ] Source material is authorized, bounded and minimized before interpretation.
- [ ] Candidate concepts come from the verified release projection, not model memory alone.
- [ ] Every returned canonical ID/relationship validates before presentation.
- [ ] Interpretation records/candidates persist separately from domain records.
- [ ] `humanConfirmationRequired` remains true and `authoritativeEffect` remains none.
- [ ] Accept/edit/reject/unresolved/none-of-these dispositions are explicit.
- [ ] Accepted candidates require a separate current-authority domain command.
- [ ] Rejected/unresolved candidates do not influence matching or public projection.
- [ ] Provider/model/prompt/retrieval/release/usage provenance is retained separately and privately.
- [ ] Manual browse/search and provisional terms work with AI disabled/unavailable/exhausted.
- [ ] Benchmark regression gates model, prompt and retrieval changes.
- [ ] Deterministic matching of structured records does not call an LLM.

## 4. Design regression acceptance

- [ ] Gold eyebrow + decisive title hierarchy is used where appropriate.
- [ ] Operational task titles do not use oversized marketing typography.
- [ ] Requirements, response sections and evaluation factors use continuous rows/tables.
- [ ] Borders/cards are used only for true interaction boundaries.
- [ ] Ordinary row removal uses a quiet accessible control.
- [ ] Request-family lifecycle reads as a connected ordered process with text semantics.
- [ ] Custom additions use shared responsive sheets; no browser prompt/confirm.
- [ ] Readiness findings distinguish blocking/warning/advisory and deep-link to exact fix targets.

## 5. Spatial acceptance

- [ ] Existing participant workspace and Mapbox scene are extended, not replaced.
- [ ] Opportunity beacons render only from real publication authority.
- [ ] Organization nodes are real permitted Wave 3 projections.
- [ ] Referral/team/RFx paths require real relationship/event records.
- [ ] No static SVG/pixel-position production map objects.
- [ ] Map/list/detail remain synchronized and focal targets stay visible across breakpoints.
- [ ] Exact, approximate and locality-only visibility are not conflated.
- [ ] Empty market states are truthful without fixtures.

## 6. Structured RFx fields

### Market need

- [ ] Source statement, observed condition and desired outcome are distinct.
- [ ] Solution posture distinguishes open, outcome-constrained, approach-constrained and specified solution.
- [ ] Known facts, assumptions, constraints and unresolved questions are not collapsed.
- [ ] Desired outcome is not stored as a post-delivery outcome observation.

### Performance location

- [ ] Issuer-primary and organization-location options reuse authoritative records.
- [ ] Exact addresses are normalized/geocoded and locality is derived.
- [ ] Locality-only and multiple-location modes remain structured.
- [ ] Publication visibility is separate from operational precision.

### Estimated value and term

- [ ] Exact/range/not-disclosed value modes use currency and integer minor units.
- [ ] Minimum cannot exceed maximum.
- [ ] Fixed/options/ongoing/milestone term modes are structured and validated.
- [ ] Human summaries are derived from structured state.

## 7. Slice acceptance summary

| Slice | Minimum acceptance focus |
| --- | --- |
| 4.1 | organization ownership, permission, lifecycle/version, request-family snapshot, draft autosave/conflict |
| 4.2 | AMACS 0.5.0 MarketNeed, assisted/manual interpretation, structured location/value/term/requirements |
| 4.3 | full picker, capability/qualifier semantics, response/evaluation links, weighted-total rules |
| 4.4 | deep-linked readiness, exact preview parity, atomic publication, immutable snapshot, permitted projection |
| 4.5 | controlled opportunity search, saved/watch/deadline relations, reliable alerts, no private leakage |
| 4.6 | explainable deterministic fit, private Go/No-Go, pursuit state, typed gaps |
| 4.7 | reused discovery, minimum-necessary invitations, nonbinding boundary, external continuity |
| 4.8 | requirement-linked response, stable IDs, role/assignment controls, continuous readiness |
| 4.9 | current-version/deadline recheck, human final review, immutable receipt or truthful external handoff |
| 4.10 | contextual education only; no tutorial domain objects or false live-state explanation |

## 8. Configured-browser acceptance

Every participant-facing slice requires configured-browser acceptance against real authorized records appropriate to the slice. Disposable data/identities must be cleaned and verified absent.

Test applicable roles, desktop/intermediate/mobile, keyboard-only use, reload/re-entry, stale client state, permission changes after load, provider/network failure, recovery states, console cleanliness and absence of synthetic production objects.

## 9. Automated guardrails

Focused tests/validators must fail when:

- prototype/synthetic fixture modules enter live routes;
- participant code imports AMACS source JSON or model-provider types;
- AMACS checksums/counts/references/schema sets drift;
- a model-invented AMACS ID reaches UI/domain state;
- an interpretation candidate directly writes an assertion or requirement;
- rejected/unresolved candidates influence matching;
- browser/local storage grants authority;
- structured need/location/value/term are reduced to free text;
- an opportunity/path/credibility/outcome visual lacks authoritative source state;
- an external handoff is labeled submitted/received; or
- a later-wave evaluator/award/outcome domain is created by earlier-wave code.
