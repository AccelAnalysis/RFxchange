# RFx Core acceptance and anti-regression matrix

**Status: CANONICAL PRE-IMPLEMENTATION ACCEPTANCE AUTHORITY.**

This matrix supplements each future slice brief. A slice is not complete because a prototype looks correct or an adjacent feature exists.

## 1. Cross-cutting hard gates

| Area | Required acceptance |
| --- | --- |
| Feature accounting | Only authorized Feature IDs are implemented/marked. All later slices remain untouched. |
| Authorization | Server re-resolves user, organization membership, permission, restrictions and RFx authority on every consequential action. |
| Domain model | One canonical RFx aggregate; no issuer document record competing with responder/evaluator RFx identity. |
| AMACS | Pinned release manifest/checksums verified; no participant component imports source JSON; historical label snapshots preserved. |
| Geography | Real RFxchange geography/geocoding/Mapbox only; no fake map, arbitrary pixel marker or precision expansion. |
| Data structure | Performance location, value and term stored in structured forms; display formatting is not source data. |
| Copy | No ordinary participant internal vocabulary; match is not qualification; external handoff is not submission. |
| Design | Version-2-approved hierarchy/rows/lifecycle/readiness patterns; no card-grid regression or duplicate component system. |
| Accessibility | Keyboard, focus, screen-reader semantics, table/list equivalence, reduced motion/transparency and responsive acceptance. |
| Audit | Consequential lifecycle transitions produce append-only evidence with actor, organization, version and correlation context. |
| Privacy | Public/permitted projections expose minimum necessary fields; private exact locations/evidence remain protected. |
| Commercial neutrality | Entitlements do not silently alter legitimate capability fit, qualification, credibility or issuer evaluation. |
| i18n boundary | RFxchange-controlled UI can localize; participant-authored requirements/responses are not automatically translated. |

## 2. AMACS acceptance

- [ ] Release version/source/checksum identity is explicit.
- [ ] 0.1.0 reconciles 15 domains, 92 families, 492 matchable capabilities and 185 aliases.
- [ ] Domain → Family → Capability browse works.
- [ ] Search uses labels, aliases, definitions, family and domain labels.
- [ ] Search is paginated/virtualized and keyboard accessible.
- [ ] Raw AMACS IDs are absent from primary participant labels.
- [ ] Provisional terms are visibly provisional and cannot satisfy mandatory canonical requirements.
- [ ] Team-coverage constraints are enforced by requirement type on the server.
- [ ] Published RFxs retain release/version/label snapshots.
- [ ] Deprecated/merged concepts have an explicit migration path.

## 3. Design regression acceptance

### Headings and density

- [ ] Gold eyebrow + decisive title hierarchy is used where appropriate.
- [ ] Operational task titles do not use oversized marketing typography.
- [ ] Requirements, response sections and evaluation factors use tables/continuous rows.
- [ ] Borders/cards are used only for true interaction boundaries.
- [ ] Ordinary row removal uses a quiet accessible control, not a large red button.

### Lifecycle

- [ ] Request-family lifecycle reads as a connected ordered process.
- [ ] Current/completed/future steps have text/state semantics beyond color.
- [ ] Mobile lifecycle remains understandable and operable.

### Custom additions

- [ ] `Add a section` and `Add a factor` use shared responsive sheets.
- [ ] No browser `prompt`, `confirm` or ad hoc modal design is used for authoring.
- [ ] Custom items remain transaction/organization scoped until governed promotion.

### Readiness

- [ ] Blocking/warning/advisory are distinguished.
- [ ] Every finding has an exact `Fix` target.
- [ ] Field focus/highlight and return context work.
- [ ] Passed checks do not create unnecessary card clutter.
- [ ] Publish action revalidates server authority and current version.

## 4. Spatial acceptance

- [ ] Existing B6a participant workspace and Mapbox scene are extended, not replaced.
- [ ] Opportunity beacons render only from real `ISS-019` publication projections.
- [ ] Organization nodes are real permitted Wave 3 projections.
- [ ] Pursuit/team/response paths require real relationship/event records.
- [ ] No static SVG map or pixel-position marker appears in production runtime.
- [ ] Map/list/detail stay synchronized.
- [ ] Focal target remains visible on desktop/intermediate/mobile.
- [ ] Exact address, approximate point and locality-only visibility are not conflated.
- [ ] Empty market states are truthful and useful without fixtures.

## 5. Structured-field acceptance

### Performance location

- [ ] Issuer-primary-location option reuses the authoritative organization location.
- [ ] Exact addresses are normalized/geocoded and locality is derived.
- [ ] Locality-only mode retains canonical locality ID/bounds.
- [ ] Multiple locations are modeled as items, not comma-separated text.
- [ ] Publication visibility is separate from operational precision.

### Estimated value

- [ ] Exact/range/not-disclosed are explicit modes.
- [ ] Values use integer minor units and currency.
- [ ] Minimum cannot exceed maximum.
- [ ] Analytics can aggregate without parsing display strings.

### Engagement term

- [ ] Fixed/fixed-with-options/ongoing/milestone modes are explicit.
- [ ] Duration units and option counts are numeric/validated.
- [ ] Human summary is derived from structured state.

## 6. Slice acceptance summary

| Slice | Minimum acceptance focus |
| --- | --- |
| 4.1 | organization ownership, permission, lifecycle/version, AMACS request-family snapshot, draft autosave/conflict |
| 4.2 | structured need/location/value/term/requirements, existing geocoder/locality reuse |
| 4.3 | full AMACS picker, capability/qualifier semantics, response/evaluation links, 100% only for weighted methods |
| 4.4 | deep-linked readiness, exact preview parity, atomic publication, immutable snapshot, permitted map/share projection |
| 4.5 | controlled opportunity search, saved/watch/deadline relations, reliable alert delivery, no private leakage |
| 4.6 | explainable match uncertainty, private Go/No-Go, explicit pursuit state, typed gaps |
| 4.7 | reused organization/provider discovery, minimum-necessary invites, nonbinding boundary, external continuity |
| 4.8 | requirement-linked response, stable IDs, role/assignment controls, continuous readiness |
| 4.9 | current-version/deadline recheck, human final review, immutable hosted receipt, truthful external handoff |
| 4.10 | contextual first-use only, no tutorial domain objects, no explanation of disabled features as live |

## 7. Browser/configured-environment acceptance

Every participant-facing slice requires configured-browser acceptance against real authorized records appropriate to the slice. Disposable records/identities must be cleaned and verified absent.

At minimum test:

- issuer administrator and nonauthorized user;
- lead responder;
- teaming invitee;
- desktop, intermediate and mobile;
- keyboard-only use;
- reload/re-entry and stale client state;
- permission/restriction changes after page load;
- network/error/recovery states;
- no console errors/warnings introduced;
- no synthetic runtime object written to live collections.

## 8. Required automated guardrails

Future implementation should add focused validators that fail when:

- prototype/synthetic fixture modules are imported by live RFx routes;
- a map RFx object lacks source record/projection version/observation time;
- an opportunity beacon exists without published authority;
- AMACS source JSON is imported by participant components;
- AMACS checksums/counts/references drift;
- forbidden internal participant copy appears;
- performance/value/term are persisted only as free text;
- response items lack stable issuer requirement/section links;
- browser/local storage grants permission/domain truth;
- a hosted submission can be mutated or duplicated after receipt;
- an external handoff is labeled submitted/received;
- Wave 5 evaluation/award state is created by Wave 4 code.
