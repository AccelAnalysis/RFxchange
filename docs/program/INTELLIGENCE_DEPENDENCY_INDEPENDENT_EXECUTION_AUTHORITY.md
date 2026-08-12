# Dependency-Independent Intelligence Execution Authority

**Status:** **PROPOSED FUTURE EXECUTION AUTHORITY — NOT ACTIVATED BY `WP-INTEL-ROADMAP-01`.** This document is an output of the roadmap/provenance packet. It defines a bounded future implementation contract but does not itself authorize production runtime changes.

**Producing lane:** 03 — Intelligence  
**Producing packet:** `WP-INTEL-ROADMAP-01`  
**Activation epoch:** `initial-operational-2026-08-12`  
**Immutable activation base:** `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`

## 1. Purpose

Define the first legitimate dependency-independent Intelligence implementation boundary after the concrete source/provenance inventory exists.

This authority is deliberately narrower than the mature Intelligence vision. It is designed so later RFx, Resource, Referral, site/facility, workforce and outcome layers can attach to the same contracts without redesigning the lens or fabricating missing activity.

It is relevant to the following Four-Lens requirements, without changing their current status:

- `INTEL-PROVENANCE-001` — source/provenance/coverage/privacy foundation;
- `INTEL-LAYER-001` — configurable layer registry and semantics;
- `INTEL-LOCATION-001` — bounded Location Intelligence over sources already authoritative now; and
- `INTEL-CONTROLS-001` — accessible analytical controls preserving shared spatial context.

Only Independent Acceptance may later mark any requirement `Verified`.

## 2. Preconditions for activation

A future Control Room packet may activate implementation under this authority only after all of the following remain true on its exact base:

1. Four-Lens Program Authority and the Intelligence roadmap remain installed and active.
2. `INTELLIGENCE_SOURCE_PROVENANCE_INVENTORY.md` remains current for every source the implementation consumes.
3. Shared Exchange has accepted the layer-state/selected-object contract described in `INTELLIGENCE_SHARED_CONTRACT_REQUEST.md`, or the implementation proves it does not require any shared-contract change.
4. Any implementation that computes counts, rates, density, concentration, heatmaps, gaps or comparative aggregates has an approved denominator/privacy-suppression authority. The absence of that policy blocks those measures rather than relaxing this precondition.
5. The activated packet names exact requirement IDs, source contracts, layer IDs, acceptance evidence and stop boundaries.
6. No open material provenance/privacy/shared-contract finding applies to the candidate.

## 3. First implementation objective

Create an **Intelligence Layer Foundation** inside the existing permanent Intelligence lens, using the shared Exchange map/workspace rather than a new map or application.

The first foundation may implement:

- one typed, versioned Intelligence layer registry;
- provenance/coverage/caveat presentation for accepted layers;
- accessible layer controls generated from registry contracts;
- truthful loading/empty/restricted/stale/unavailable/error states;
- a non-statistical **Locality Context** layer using canonical geography and authoritative boundary/release state; and
- a non-statistical **Organization & Capability Context** layer using the current permitted Network organization projection and public/network AMACS-backed capability claims.

“Non-statistical” means the layer may render source-backed permitted organizations/capabilities and their existing qualitative context but may not introduce a new count-derived market claim, density surface, share, rate, percentage, heatmap, concentration or gap metric without the separately accepted aggregation/privacy contract.

The current Network discovery `totalMatched` remains a discovery result count and is not promoted to an Intelligence market measure.

## 4. Layer registry contract

The Intelligence lane owns the semantic definition of Intelligence layers. Shared Exchange continues to own generic rendering/session/selection infrastructure.

Each registered layer must have a stable definition at least equivalent to:

```text
id
contractVersion
labelKey
descriptionKey
questionAnswered
objectFamily
metricDefinition | null
sourceContractIds[]
sourceClasses[]
provenanceResolverId
geographyScope
geographyGranularities[]
timeScope | null
coveredPopulationDefinition
rendererSemantic
selectedObjectKinds[]
controlSchema
initialControlState
authorizationResolverId
privacyPolicyId
aggregationPolicyId | null
suppressionPolicyId | null
refreshPolicy
freshnessPolicy
coverageDisclosureKey
caveatKeys[]
emptyStateKey
restrictedStateKey
staleStateKey
unavailableStateKey
errorStateKey
sharePolicy
exportPolicy
dependencies[]
```

A registry definition is product/semantic authority only. It cannot grant access to source records.

### 4.1 Terminology boundary

- **Lens** — Intelligence is the permanent analytical lens.
- **Layer** — one governed analytical/map projection inside Intelligence.
- **Appearance** — visual treatment only; never data authority.
- **Workspace** — task composition.

Do not use a layer toggle as though it were a new lens, permission or appearance.

### 4.2 Registration rule

A live layer may be registered only when:

- its source contract is accepted;
- its provenance resolver is implemented;
- its authorization/minimization path is implemented;
- its privacy/suppression requirements are satisfied;
- its states/caveats/coverage copy are complete; and
- its exact implementation packet authorizes the layer.

Planned layer names may appear in roadmap documents but may not appear as selectable live controls merely to suggest future breadth.

## 5. Source/provenance runtime contract

Every live layer must resolve current server authority and a provenance envelope before analytical content is projected.

At minimum the implementation must be able to present, in participant-safe language:

- what the layer measures or shows;
- data source/source class;
- applicable release/vintage or “as of” basis;
- geographic scope;
- time period when applicable;
- covered population/denominator statement;
- whether organization data is self-reported/claimed versus separately verified;
- material caveats/known gaps; and
- freshness/staleness state.

Internal record IDs, private evidence IDs, credentials/provider secrets and private provenance details remain server-only.

A missing provenance envelope is a layer-unavailable condition, not a reason to render unlabeled data.

## 6. First permitted layer semantics

### 6.1 `locality-context`

**Question:** What authoritative place is the participant looking at?

Permitted content:

- canonical locality/FIPS identity where applicable;
- geography type/name;
- authoritative boundary geometry;
- current release/participation state;
- current authoritative bounds/camera context; and
- human-readable source/vintage/caveat information already accepted by the geography contract.

Prohibited content in the first implementation:

- invented economic statistics;
- workforce/demographic claims;
- inferred infrastructure/market-access scores;
- site inventory;
- arbitrary “business climate” scores; and
- statistics based only on browser/map position.

### 6.2 `organization-capability-context`

**Question:** Which currently permitted RFxchange organizations and organization-claimed capabilities are visible in this authorized context?

Permitted content:

- the current server-authorized Network organization result projection;
- privacy-safe organization marker/location treatment;
- organization identity/detail already permitted by that projection;
- public/network AMACS-backed capability claim labels, definitions, domain/family and specialties;
- clear “organization claimed” provenance; and
- existing search/filter explanation where it remains a discovery aid.

The layer must explicitly describe its coverage as an RFxchange participant/discovery projection, not the full economy.

Prohibited in the first implementation:

- market share;
- business density;
- capability density;
- “underserved” or “oversupplied” claims;
- demand/supply gap;
- inferred capacity;
- qualification/ranking;
- credibility score; and
- conversion of search relevance into analytical magnitude.

## 7. Bounded Location Intelligence

`INTEL-LOCATION-001` describes a mature family that may eventually incorporate organization/capability concentrations, workforce, industry, infrastructure, market access, demand/resources and network context.

The first dependency-independent implementation is intentionally partial and may use only accepted sources available now:

- authoritative geography;
- locality release/boundary context;
- privacy-safe permitted organization context;
- public/network capability claims; and
- descriptive industry/NAICS context only when a dedicated minimized projection with provenance is separately included in the activated packet.

The first implementation may say, for example, “These are permitted RFxchange organizations in the current authorized context,” but may not say “this locality has X% of the market” or “capability concentration is high” without an accepted denominator/aggregation method.

The following remain separate source dependencies and are excluded until accepted:

- workforce;
- demographics/economic statistics;
- infrastructure;
- market access/transportation;
- site/facility/parcel/building inventory;
- RFx demand intelligence;
- Resource/provider analytics;
- Referral/relationship analytics; and
- outcome/market-performance analytics.

## 8. Analytical control contract

Controls are generated from the active layer’s registry contract and cannot widen source authority.

The first foundation should support only controls that have current source semantics, such as:

- layer selection among actually implemented layers;
- existing geography context where authorized;
- existing capability search/filter semantics for organization context;
- map/list/data representation choice where the source supports parity; and
- provenance/coverage/caveat inspection.

### 8.1 Control requirements

Every control must:

- be keyboard operable;
- have an accessible name/state;
- preserve visible focus;
- meet the current 40–44px touch-target standard where interactive;
- communicate state without color alone;
- retain reduced-motion/high-contrast compatibility;
- preserve map/list/detail parity;
- retain current selected/spatial context where meaningful and permitted; and
- cause current server revalidation of the affected data projection.

A client-side layer selection or URL/session value is non-authorizing.

### 8.2 Required states

The first foundation must distinguish:

- loading;
- empty;
- restricted;
- stale/disclosed, where the layer contract allows stale display;
- unavailable;
- error/recovery; and
- ready.

It must never convert a source outage into an empty market or zero statistic.

## 9. Shared Exchange boundary

This authority does not permit Lane 03 to fork or privately extend:

- the Mapbox/shared map renderer;
- persistent participant shell;
- marker grammar;
- generic selected-object state;
- cross-lens spatial context;
- result drawer/mobile sheet;
- participant navigation; or
- generic map/list/detail synchronization.

Current `ParticipantSpatialContext` v1 stores an organization-centric selection and per-lens search/filter/result/camera state. It has no governed generic selected-object type for locations/sites/RFxs/analytical records and no active Intelligence layer state.

Any necessary extension must be implemented and accepted through Shared Exchange under `SHARED_EXCHANGE_CONTRACTS.md`. The companion `INTELLIGENCE_SHARED_CONTRACT_REQUEST.md` defines the requested contract without changing shared runtime in this packet.

## 10. Privacy and aggregation boundary

The first live implementation must consume the privacy-safe participant projection rather than raw private organization records for cross-organization analysis.

It must not:

- reconstruct an approximate/private location;
- create a point for a locality-only organization;
- read or expose private capability claims/evidence;
- expose private RFx/Resource/Referral records;
- combine small cells to reveal suppressed entities;
- present participant subset counts as full-market statistics; or
- create an aggregate metric before the accepted aggregation/privacy authority exists.

No minimum-cell threshold is established by this authority. The decision is deliberately delegated to a separate bounded privacy/aggregation packet.

## 11. RFx, Resources, Referrals and outcome dependency switches

The registry should be structurally capable of adding later accepted layers without redesign. Those definitions remain **absent from the live registry** until their dependencies are accepted.

### RFx-dependent

Potential future layer families include published demand geography, AMACS demand mix, performance-location context and governed supply/demand comparison. They require the exact accepted RFx projection/assurance named by the future packet. Private drafts, pursuit deliberations, responses and evaluator state remain excluded unless separately authorized.

### Resources-dependent

Potential future layers include provider/service territory and support/resource coverage. They require the Resources lens/analytics source contract and must preserve office-versus-service-area and maintained-availability truth.

### Referrals-dependent

Potential future layers include permitted relationship/referral-path context and privacy-safe aggregates. They require Referral source/consent/minimum-necessary and aggregate-privacy authority.

### Outcome-dependent

Outcome/market-performance layers require a separate authoritative outcome domain and evidence semantics. Growth Green cannot be used merely because an interaction occurred.

## 12. Explicit non-scope

A future packet activated under this authority still must not silently include:

- site/facility inventory;
- generalized external-data ingestion;
- user/organization-owned arbitrary data uploads;
- workforce/demographic/economic datasets without source contract;
- private RFx/Resources/Referrals;
- credibility scoring;
- outcome analytics;
- Dark Appearance;
- Presentation Mode;
- AI-generated analytics;
- predictive scoring/recommendation;
- synthetic market data;
- a second map renderer; or
- legacy tracker edits unrelated to the activated packet.

## 13. Validation and acceptance required for a future implementation

A candidate must provide exact-head evidence for:

### Governance/source

- only packet-authorized layer IDs exist;
- each layer resolves a registered source/provenance contract;
- no unapproved external source enters the browser/server projection;
- no layer/lens/appearance/workspace terminology collision;
- no Feature-ID or unrelated requirement promotion.

### Data correctness/provenance

- deterministic transformation/source version behavior;
- accurate source/release/vintage and coverage display;
- current/stale/unavailable transitions;
- no unlabeled fallback data;
- AMACS IDs validated against the pinned release;
- organization claim provenance preserved as claim semantics.

### Privacy/authorization

- server authority after every control/selection transition;
- direct-client private source denial remains intact;
- exact/approximate/locality-only behavior cannot be widened;
- private capability/evidence and private cross-domain records remain absent;
- invalidated authority/visibility clears or narrows the projection.

### Interaction/accessibility

- shared map/list/detail synchronization;
- selected-object continuity through shared contracts;
- keyboard/screen-reader/reduced-motion/high-contrast/touch acceptance;
- responsive desktop/mobile drawer/sheet behavior;
- all supported locales for participant copy; and
- provenance/caveats accessible without relying on hover/color alone.

### Independent acceptance

Implementation may report `Implemented — Not Verified` only with the required exact-head evidence. Independent Acceptance must separately decide whether any covered Four-Lens requirement becomes `Verified`.

## 14. Proposed next bounded packets

These IDs are proposed handoff boundaries only. They are not activated by this document.

### `WP-SHARED-INTEL-LAYER-STATE-01` — Lane 01

Implement only the accepted Shared Exchange extension for:

- versioned optional Intelligence active-layer state in the persistent spatial context; and
- a generic selected-object `{type, id}` seam capable of future organization/location/site/RFx/analytical objects while preserving current organization compatibility.

Must include migration/invalidation/session-scope/server-revalidation behavior. No Intelligence datasets or analytics.

### `WP-INTEL-AGGREGATION-PRIVACY-01` — Lane 03 / Control Room policy review

Documentation/decision packet only:

- define permitted analytical denominators;
- minimum-sample/small-cell suppression policy;
- complementary/inference protection as needed;
- geography/time grain;
- aggregation provenance;
- stale/refresh rules; and
- exact claims permitted for participant-subset versus external-population measures.

No live statistic or heatmap.

### `WP-INTEL-LAYER-FOUNDATION-01` — Lane 03

After required Shared Exchange acceptance, implement:

- typed layer registry;
- provenance/coverage/caveat resolver and presentation;
- accessible controls/states; and
- only `locality-context` plus `organization-capability-context` as source-backed non-statistical layers.

No workforce, sites, RFx, Resources, Referrals, outcomes or unapproved aggregate metrics.

### `WP-INTEL-LOCATION-CONTEXT-01` — Lane 03

After the layer foundation and any necessary aggregation/privacy decisions, extend bounded Location Intelligence using only accepted geography and permitted organization/capability sources. Any workforce, infrastructure, demographics, market-access, site, demand, provider or referral source must arrive through its own accepted source contract rather than by widening this packet.

## 15. Stop boundary

`WP-INTEL-ROADMAP-01` stops after producing the source/provenance inventory, this proposed bounded authority and the Shared Contract Request. It creates no live layer and activates none of the proposed next packets.
