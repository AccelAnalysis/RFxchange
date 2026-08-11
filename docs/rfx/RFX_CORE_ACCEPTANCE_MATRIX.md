# RFx Core acceptance and anti-regression matrix

**Status: CANONICAL PRE-IMPLEMENTATION ACCEPTANCE AUTHORITY.**

This matrix supplements each future RFx slice brief. A slice is not complete because a prototype looks correct, an AI response appears plausible or an adjacent feature exists.

## 1. Cross-cutting hard gates

| Area | Required acceptance |
| --- | --- |
| Feature accounting | Only authorized Feature IDs are implemented or marked. Later slices remain untouched. |
| Authorization | Server re-resolves user, organization membership, permission, restrictions and RFx authority for every consequential action. |
| Domain model | One canonical RFx aggregate; no document, AI conversation or UI draft competes with domain identity. |
| AMACS | Immutable 0.5.0 manifest, commit and checksums verified; historical releases preserved; no participant component imports source JSON. |
| Interpretation | MarketNeed, InterpretationRecord and InterpretationCandidate contracts validate; interpretations remain non-authoritative; accepted candidates require a separate authorized write. |
| AI boundary | Provider and model types and secrets remain behind a server-side port; model-memory IDs are rejected; manual operation remains available in the applicable authorized consumer. |
| Geography | Real RFxchange geography, geocoding and Mapbox only; no fake map, pixel marker or precision expansion. |
| Data structure | Need, location, value, term, requirements, response and evaluation data remain structured. |
| Copy | No participant-facing internal vocabulary; suggestion is not assertion; match is not qualification; handoff is not submission. |
| Design | Approved hierarchy, rows, lifecycle and readiness patterns; no card-grid or duplicate-system regression. |
| Accessibility | Keyboard, focus, screen-reader semantics, responsive behavior and reduced motion or transparency pass. |
| Audit and provenance | Consequential transitions and AI interpretation disposition preserve actor, organization, release or version and correlation context. |
| Privacy | Minimum necessary projections; private exact location, evidence and participant content remain protected. |
| Cost and availability | AI usage is metered and bounded; quota or provider failure degrades to manual AMACS flows in the applicable consumer. |
| Commercial neutrality | Entitlements do not alter legitimate capability truth, matching, qualification, credibility or evaluation. |
| i18n boundary | RFxchange-controlled UI localizes; participant-authored requirements, responses and documents are not automatically translated. |

## 2. AMACS 0.5.0 reconciliation-gate acceptance

The no-Feature-ID reconciliation gate is limited to release integration, generated contracts, catalog services and historical compatibility.

- [ ] Release version `0.5.0`, commit `da7879f2609271b067ae6d02875e9388a02c4fe5`, manifest and checksums are explicit and verified.
- [ ] 16 domains, 120 families, 615 matchable capabilities and 185 aliases reconcile.
- [ ] Additional 0.5.0 registries reconcile to the release manifest.
- [ ] `market-need`, `interpretation-record`, `interpretation-candidate` and `concept-interpretation-guidance` schemas are packaged and validated.
- [ ] Deterministic release-aware Domain, Family, Capability and search application ports work without implementing participant UI.
- [ ] Generated or verified TypeScript contracts and server validators cover the required 0.5.0 records.
- [ ] Historical 0.1.0 references and label snapshots remain readable and are not silently remapped.
- [ ] Deprecated, merged or split concepts have explicit migration preview or evidence.
- [ ] Legacy free text, websites, documents, NAICS and model output cannot be converted automatically into capability assertions.
- [ ] Invalid or model-invented AMACS IDs are rejected by catalog validation.
- [ ] No participant component imports AMACS source JSON or provider-specific AI types.
- [ ] CI fails on checksum, schema, reference, generated-projection or count drift.
- [ ] Reconciliation does not implement a participant picker, capability assertion, RFx requirement, team-coverage workflow or Feature ID.

## 3. AI and interpretation-foundation acceptance

- [ ] Source material is authorized, bounded and minimized before interpretation.
- [ ] Candidate concepts come from the verified release projection, not model memory alone.
- [ ] Every returned canonical ID and relationship validates before presentation or persistence.
- [ ] Interpretation records and candidates persist separately from domain records.
- [ ] `humanConfirmationRequired` remains true and `authoritativeEffect` remains none.
- [ ] Accept, edit, reject, unresolved and none-of-these dispositions are explicit in the shared contract.
- [ ] Accepted candidates require a separate current-authority domain command; the foundation itself does not create Slice 3.3 or Wave 4 product records.
- [ ] Rejected and unresolved candidates cannot influence matching or public projection.
- [ ] Provider, model, prompt, retrieval, release and usage provenance is retained separately and privately.
- [ ] The release-aware manual catalog application path remains usable with AI disabled, unavailable or exhausted; participant picker acceptance belongs to its authorized slice.
- [ ] Benchmark regression gates model, prompt and retrieval changes.
- [ ] Deterministic matching of structured records does not call an LLM.
- [ ] The foundation changes no Feature-ID status by itself.

## 4. Downstream AMACS consumer acceptance

### Slice 3.3 organization capability consumer

- [ ] Domain → Family → Capability browse and search are keyboard accessible and responsive.
- [ ] Search uses labels, aliases, definitions, hierarchy and optional guidance where present.
- [ ] Raw AMACS IDs are absent from primary participant labels.
- [ ] Suggested, accepted, edited, rejected and unresolved states are visibly distinct from confirmed assertions.
- [ ] An accepted candidate still requires a separately authorized organization capability write.
- [ ] Provisional terms are visibly provisional and cannot masquerade as canonical capabilities.
- [ ] Manual capability selection works with the AI provider unavailable.
- [ ] Evidence submission, independent verification, credibility and qualification remain distinct from capability assertion.

### Wave 4 need and requirement consumer

- [ ] MarketNeed separates source statement, observed condition, desired outcome, known facts, assumptions, unresolved questions, constraints and solution posture.
- [ ] Capability requirements preserve requirement type, qualifiers, evidence treatment and release snapshots.
- [ ] Provisional terms cannot satisfy mandatory canonical requirements.
- [ ] Team-coverage restrictions are enforced server-side by the referenced AMACS requirement type.
- [ ] Rejected or unresolved interpretation candidates cannot influence published requirements or deterministic matching.

## 5. Design regression acceptance

- [ ] Gold eyebrow plus decisive title hierarchy is used where appropriate.
- [ ] Operational task titles do not use oversized marketing typography.
- [ ] Requirements, response sections and evaluation factors use continuous rows or tables.
- [ ] Borders and cards are used only for true interaction boundaries.
- [ ] Ordinary row removal uses a quiet accessible control.
- [ ] Request-family lifecycle reads as a connected ordered process with text semantics.
- [ ] Custom additions use shared responsive sheets; no browser prompt or confirm.
- [ ] Readiness findings distinguish blocking, warning and advisory and deep-link to exact fix targets.

## 6. Spatial acceptance

- [ ] Existing participant workspace and Mapbox scene are extended, not replaced.
- [ ] Opportunity beacons render only from real publication authority.
- [ ] Organization nodes are real permitted Wave 3 projections.
- [ ] Referral, team and RFx paths require real relationship or event records.
- [ ] No static SVG or pixel-position production map objects.
- [ ] Map, list and detail remain synchronized and focal targets stay visible across breakpoints.
- [ ] Exact, approximate and locality-only visibility are not conflated.
- [ ] Empty market states are truthful without fixtures.

## 7. Structured RFx fields

### Market need

- [ ] Source statement, observed condition and desired outcome are distinct.
- [ ] Solution posture distinguishes open, outcome-constrained, approach-constrained and specified solution.
- [ ] Known facts, assumptions, constraints and unresolved questions are not collapsed.
- [ ] Desired outcome is not stored as a post-delivery outcome observation.

### Performance location

- [ ] Issuer-primary and organization-location options reuse authoritative records.
- [ ] Exact addresses are normalized or geocoded and locality is derived.
- [ ] Locality-only and multiple-location modes remain structured.
- [ ] Publication visibility is separate from operational precision.

### Estimated value and term

- [ ] Exact, range and not-disclosed value modes use currency and integer minor units.
- [ ] Minimum cannot exceed maximum.
- [ ] Fixed, options, ongoing and milestone term modes are structured and validated.
- [ ] Human summaries are derived from structured state.

## 8. Slice acceptance summary

| Slice | Minimum acceptance focus |
| --- | --- |
| 4.1 | organization ownership, permission, private draft persistence and re-entry, lifecycle or version, governed request-family snapshot, idempotent creation and stale-version conflict |
| 4.2 | AMACS 0.5.0 MarketNeed, assisted or manual interpretation, structured location, value, term and requirements, builder autosave and version conflict |
| 4.3 | full picker, capability or qualifier semantics, response or evaluation links, weighted-total rules |
| 4.4 | deep-linked readiness, exact preview parity, atomic publication, immutable snapshot, permitted projection |
| 4.5 | controlled opportunity search, saved or watch or deadline relations, reliable alerts, no private leakage |
| 4.6 | explainable deterministic fit, private Go or No-Go, pursuit state, typed gaps |
| 4.7 | reused discovery, minimum-necessary invitations, nonbinding boundary, external continuity |
| 4.8 | requirement-linked response, stable IDs, role or assignment controls, continuous readiness |
| 4.9 | current-version and deadline recheck, human final review, immutable receipt or truthful external handoff |
| 4.10 | contextual education only; no tutorial domain objects or false live-state explanation |

Slice 4.1 proves persistence through a server-created private draft that survives reload and authorized re-entry, plus a version-checked request-family mutation. It does not implement generic builder autosave because the converged feature crosswalk assigns `RFxPackage`, module completion and autosave/version conflict to `ISS-005` in Slice 4.2. Slice 4.2 must extend the same expected-version contract to builder-content autosave; neither slice may be marked complete without its respective conflict, recovery and persistence evidence.

## 9. Configured-browser acceptance

Every participant-facing slice requires configured-browser acceptance against real authorized records appropriate to the slice. Disposable data and identities must be cleaned and verified absent.

Test applicable roles, desktop, intermediate and mobile widths, keyboard-only use, reload or re-entry, stale client state, permission changes after load, provider or network failure, recovery states, console cleanliness and absence of synthetic production objects.

## 10. Automated guardrails

Focused tests and validators must fail when:

- prototype or synthetic fixture modules enter live routes;
- participant code imports AMACS source JSON or model-provider types;
- AMACS checksums, counts, references or schema sets drift;
- a model-invented AMACS ID reaches UI or domain state;
- an interpretation candidate directly writes an assertion or requirement;
- rejected or unresolved candidates influence matching;
- browser or local storage grants authority;
- structured need, location, value or term is reduced to free text;
- an opportunity, path, credibility or outcome visual lacks authoritative source state;
- an external handoff is labeled submitted or received;
- a hosted submission receipt can be mutated, duplicated or overwritten; or
- a later-wave evaluator, award or outcome domain is created by earlier-wave code.
