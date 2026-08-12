# Intelligence Source and Provenance Inventory

**Status:** Packet output for `WP-INTEL-ROADMAP-01` — documentation/governance only. No live Intelligence layer, dataset, projection, statistic, site, market-activity record, Feature-ID status, Four-Lens requirement status or tracker state is created or changed by this document.

**Lane:** 03 — Intelligence  
**Packet:** `WP-INTEL-ROADMAP-01`  
**Activation epoch:** `initial-operational-2026-08-12`  
**Immutable activation base:** `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`  
**Execution branch:** `codex/intelligence-provenance-roadmap-01`  
**Execution branch start:** current merged `main` at packet execution start, `69daa4bea80b39cc9d5ed04715aa6e2ac8e1f068`

## 1. Purpose

This inventory establishes the concrete source, provenance, privacy and coverage boundary that must exist before dependency-independent Intelligence analytics can be implemented.

It supports the bounded planning/authority work associated with:

- `INTEL-PROVENANCE-001`;
- `INTEL-LAYER-001`;
- `INTEL-LOCATION-001`; and
- `INTEL-CONTROLS-001`.

It does **not** mark any of those requirements `Implemented — Not Verified` or `Verified`. The Four-Lens registry remains the status authority, and Independent Acceptance remains the only verifier.

Use this inventory with:

- `FOUR_LENS_PROGRAM_AUTHORITY.md`;
- `FOUR_LENS_EXPERIENCE_LEDGER.md`;
- `PARALLEL_DELIVERY_MATRIX.md`;
- `SHARED_EXCHANGE_CONTRACTS.md`;
- `INDEPENDENT_ACCEPTANCE_PROTOCOL.md`;
- `INTELLIGENCE_PROGRAM_ROADMAP.md`;
- `../context/EXCHANGE_INTERACTION_ARCHITECTURE.md`;
- `../context/MAP_AND_GEOGRAPHY.md`;
- `../context/ORGANIZATION_MODEL.md`;
- `../context/PRODUCT_PRINCIPLES.md`;
- `../rfx/AMACS_INTEGRATION_CONTRACT.md`;
- applicable privacy/security/geography authorities;
- `../brand/MAP_AND_DATA_VISUAL_GRAMMAR.md`;
- `../design/MAP_VISUAL_SYSTEM.md`; and
- the canonical tracker/dependency authorities.

## 2. Governing source classes

An Intelligence layer or analysis may consume data only after every source is classified as one of these classes and the consuming layer contract states how that class affects the claim it makes.

| Source class | Meaning | Permitted claim level |
| --- | --- | --- |
| `first-party-authoritative` | RFxchange state produced by a current server-authorized domain command or canonical administrative/geography authority. | May support the exact fact governed by that domain, subject to visibility/privacy. |
| `first-party-asserted` | Organization-authored or organization-confirmed state that RFxchange stores authoritatively as an assertion, not as independent verification. | May support “organization-reported/claimed” context only. |
| `approved-external` | External data explicitly approved by an RFxchange authority with provider/source, release/vintage, retrieval/validation and usage provenance. | May support only the external source’s defined measure and coverage. |
| `governed-derived` | Deterministic projection or aggregate derived from permitted source classes under an accepted transformation, denominator and privacy/suppression contract. | May support only the defined derived measure with its method and caveats. |

Browser state, map position, search text, cached selections, AI/model output, unconfirmed geocoder candidates and visual treatment are **not source classes** and never become analytical authority.

## 3. Dependency-independent source inventory

### 3.1 Canonical controlled geography

**Class:** `first-party-authoritative`  
**Owning domain:** Geography  
**Current authority:** `MAP_AND_GEOGRAPHY.md` and the accepted geography implementation.

Permitted source facts include, where present in the canonical geography definition:

- stable geography identifier, including FIPS where applicable;
- geography name and type;
- parent/adjacency metadata when authoritative;
- release/participation state;
- authoritative boundary reference/geometry identity;
- canonical bounds; and
- configured default/bird’s-eye camera metadata.

**Provenance requirement:** a consuming Intelligence layer must preserve the RFxchange geography identifier plus the authoritative boundary source/vintage or source reference used by the current geography projection. The renderer provider is not the geography authority.

**Failure/staleness:** if the current geography definition, release authority or compatible authoritative boundary cannot be resolved, the affected analytical layer is unavailable. It must not substitute a browser viewport, approximate rectangle or inferred locality.

### 3.2 Authoritative locality boundary geometry

**Class:** `approved-external` as incorporated through the governed RFxchange geography boundary.  
**Current approved baseline:** U.S. Census TIGER/Line/TIGERweb-style authoritative locality geometry or another explicitly approved authoritative source.

Permitted use is limited to the geographic boundary and metadata accepted by the current RFxchange geography authority.

Required provenance includes:

- external source/agency;
- source dataset/product;
- release/vintage/version where available;
- RFxchange geography identifier/FIPS association;
- retrieval or build provenance sufficient to reproduce the accepted projection; and
- transformation/validation version where geometry is normalized.

**Not authority:** Mapbox basemap tiles, a Mapbox viewport, CSS shape, geocoder display text or renderer camera are not a substitute for the governed locality geometry.

### 3.3 Confirmed organization primary location and privacy-safe location projection

**Private source class:** `first-party-authoritative`.  
**Participant analytical source:** the existing server-produced privacy-safe location/marker projection, not the raw private source record.

The confirmed source record contains exact address/coordinate, selected geography, visibility policy, confirmation actor/evidence and geocoder provenance. Cross-organization Intelligence must consume only the permitted projected form:

| Visibility | Permitted cross-organization Intelligence use |
| --- | --- |
| `exact` | The currently permitted exact participant projection, including exact coordinate/address only when the organization’s current visibility policy permits it. |
| `approximate` | The existing privacy-safe approximate coordinate/locality projection. Do not reverse, de-obfuscate or combine it with other data to reconstruct the private coordinate. |
| `locality-only` | Locality identity only. No organization-derived point, raw address or inferred coordinate may be created for the organization. |

A geocoder candidate is provider evidence until the participant confirms the location through the governed domain command. Intelligence must never treat the geocoder result itself as confirmation authority.

### 3.4 Organization service geography

**Class:** `first-party-authoritative` as an organization-controlled domain fact.  
**Meaning:** where the organization says it serves/operates under the current service-geography contract; it is separate from office/home location.

Permitted Intelligence use must preserve the distinction between:

- primary/physical location;
- public location treatment;
- service geography; and
- active/released participant geography.

Service geography does not prove capacity, acceptance, current availability, qualification or successful delivery.

### 3.5 Permitted Network organization discovery projection

**Class:** `governed-derived` participant projection over first-party geography, organization, restriction, profile, location, service-geography and capability-claim state.

Current projection fields include, as authorized by the existing Network domain:

- organization stable identifier;
- minimized public/network organization profile;
- base geography identifier;
- service-geography identifiers;
- privacy-safe marker/accessible location;
- permitted structured capability claims;
- deterministic discovery match reason/source; and
- page/result metadata.

The projection excludes inactive, restricted, wrong-geography and otherwise ineligible candidates and uses the current server authority on every load.

**Critical coverage limit:** current Network discovery is bounded to at most `250` candidate organization activations and returns pages of `24`. Its `totalMatched` is the count of the bounded eligible discovery set evaluated by that implementation. It is **not** an authoritative count of every organization in the locality, the full economy, all RFxchange organizations, market size, market share, market density or capability concentration.

Therefore:

- `totalMatched` may remain a discovery-result count within the existing Network experience;
- an Intelligence layer must not relabel it as full-market activity or concentration;
- no percentage, share, density, heatmap intensity or “gap” metric may use it as a denominator unless a separately accepted aggregation contract defines the population and proves coverage; and
- discovery relevance score is a deterministic search aid, not capability strength, qualification, credibility, verification or market demand.

### 3.6 Organization capability claims

**Class:** `first-party-asserted`, with the RFxchange record itself authoritative as the organization’s current claim/disposition.  
**Semantic authority:** AMACS release reference and snapshots.

The current claim can contain:

- stable capability/claim identifiers;
- AMACS release version;
- capability, domain and family identifiers/snapshots;
- specialties;
- market/delivery-role context;
- service geography;
- optional structured capacity/evidence references in the private record;
- assertion status;
- visibility; and
- source/audit provenance.

Participant Intelligence may consume only the existing `network`/`public` projection allowed by visibility and suspension rules. Private claims, private evidence references and private capacity data are excluded unless a future authority explicitly permits a minimized analytical projection.

The public/network projection deliberately describes provenance as **Organization claimed**. Intelligence must preserve the distinction among:

- AMACS concept existence;
- an organization capability assertion;
- evidence submitted;
- separate verification; and
- RFx qualification.

A layer must not convert “organization claimed” into “verified capability” merely by counting or mapping it.

### 3.7 AMACS 0.5.0 semantic catalog

**Class:** `approved-external` semantic standard, vendored and checksum-governed by RFxchange.  
**Pinned source:** `AccelAnalysis/amacs` release 0.5.0 at commit `da7879f2609271b067ae6d02875e9388a02c4fe5` under `AMACS_INTEGRATION_CONTRACT.md`.

Permitted Intelligence use includes:

- stable Domain → Family → Capability meaning;
- labels, definitions, aliases and hierarchy;
- current release identity; and
- exact historical release resolution where the integration contract supplies it.

AMACS supplies semantic structure. It does **not** prove that an organization has a capability, that demand exists, that work occurred or that an outcome was achieved.

Counts in AMACS manifests are release-validation evidence; they are not participant-market statistics.

### 3.8 Industry and NAICS descriptors

**Class:** RFxchange first-party organization descriptors referencing an external classification.  
**Current meaning:** descriptive/filter context only.

The current record can retain code/title/version, selection/import source, provenance and visibility. Intelligence may use such descriptors only through a future explicitly minimized projection that preserves those fields and visibility.

This inventory does not promote a historical NAICS workbook URL, checksum or count that is not present in the current canonical source authority reviewed for this packet. A future consumer must use the provenance stored in the current record or a separately accepted external-source contract.

NAICS and industry classification do not prove capability, verification, demand, performance or outcome.

### 3.9 Organization past-performance and preference records

Current domain models contain organization-authored past-performance and market-preference records with visibility and provenance. They are **not authorized as initial dependency-independent Intelligence analytics by this packet**.

Reasons:

- self-reported performance and claimed outcomes require careful confirmation/evidence semantics;
- preference fields are intent, not observed market behavior; and
- using them in “performance,” “demand,” “trust” or outcome analytics could overstate authority.

A later bounded source contract may admit a minimized field set with explicit confirmation-state and coverage treatment.

## 4. Sources not yet accepted for dependency-independent Intelligence

The following may exist as product concepts but do not have an accepted Intelligence source/provenance contract under this packet:

- workforce datasets;
- demographic/economic statistical datasets;
- infrastructure datasets;
- transportation/market-access datasets;
- site/facility/building/parcel inventory;
- commercial-real-estate listings;
- inferred business foot traffic or capacity;
- generalized web-scraped market facts;
- private RFx drafts, deliberations, responses or pursuit state;
- private Resource provider/request records;
- private Referral records or relationship communications;
- credibility calculations/private evidence;
- outcome/impact records not yet governed by an accepted outcome domain; and
- model-generated, simulated or synthetic “market activity.”

No layer may create zeroes, estimates or placeholder statistics for an absent source.

## 5. Required provenance envelope

Every future Intelligence layer definition and every rendered analytical result must be able to resolve a provenance envelope at least equivalent to:

```text
layerId
layerContractVersion
sourceClass
sourceSystem / recordType
sourceReleaseOrVintage
opaqueSourceProvenanceRef
retrievedAt / observedAt / validPeriod (as applicable)
transformationId + transformationVersion
geographyScope + geographyGranularity
timePeriod (when the measure is temporal)
coveredPopulation / denominatorStatement
visibilityAndAuthorityBoundary
aggregationPolicyId + version (when aggregated)
suppressionPolicyId + version + result (when applicable)
lastSuccessfulRefresh + refreshCadence
freshnessState: current | stale-disclosed | unavailable
caveats[]
knownCoverageGaps[]
semanticEvidenceLevel
externalUsageOrLicenseReference (when applicable)
```

Participant presentation may show a minimized human-readable projection of this envelope. Internal source identifiers, private evidence IDs, provider secrets and sensitive record references must not leak merely because provenance is displayed.

## 6. Refresh, staleness and failure rules

A layer contract must specify its source update mode before implementation:

- event-driven/current-domain projection;
- scheduled external refresh;
- immutable release/vintage; or
- bounded on-demand computation over current authoritative records.

A failed refresh must result in one of two truthful states:

1. **stale-disclosed** — only when the prior snapshot remains safe and the layer contract permits display with an explicit “as of”/staleness disclosure; or
2. **unavailable** — when freshness is material, authority cannot be revalidated, privacy state changed, or the prior result cannot safely be projected.

There is no synthetic fallback and no silent reuse of stale analytical truth.

## 7. Privacy and minimum-necessary boundary

### 7.1 Cross-organization analysis

Cross-organization participant Intelligence may use only:

- current server-authorized public/network organization projection fields;
- privacy-safe location treatment;
- public/network capability claims; and
- approved governed aggregates that cannot expose suppressed/private source records.

It may not expose raw private profile, address, coordinate, evidence, capacity, membership, RFx, Resource or Referral records.

### 7.2 Own-organization analysis

A future private own-organization analysis may use additional organization-owned facts only when a separate authority explicitly defines the use, retention, projection and export boundary. This packet does not authorize that expansion.

### 7.3 Aggregate privacy

The map/data grammar requires minimum-sample/privacy suppression where needed, but the current authorities reviewed for this packet do **not** define a canonical small-cell threshold, suppression algorithm, denominator policy or complementary-suppression rule for Intelligence.

Therefore:

> **Any count, rate, percentage, density, concentration, heatmap, gap or comparative aggregate that could expose a small population or imply full-market coverage is blocked until an approved aggregation/privacy contract defines the denominator, geography/time grain and suppression policy.**

This packet intentionally does not invent a threshold.

## 8. Coverage statements required for future Intelligence

Every analytical layer must tell the participant what population it represents. At minimum, distinguish:

- RFxchange participants permitted in the current controlled/released geography;
- a bounded current Network discovery result;
- an approved external statistical population; and
- a governed cross-source aggregate.

The phrase “market” must not silently turn an RFxchange participant subset into the full economy.

## 9. Determinations from this packet

1. **Dependency-independent source authority exists** for controlled geography, authoritative boundary geometry, privacy-safe organization location, organization service geography, permitted Network organization projections, current organization capability claims and AMACS semantics.
2. **Those sources are sufficient for a non-statistical Intelligence layer foundation and source/provenance presentation.**
3. **They are not sufficient for truthful market-share, density, concentration, gap, heatmap or full-economy claims** until denominator and aggregate privacy authority is added.
4. **Location Intelligence can begin only in a bounded form**: authoritative locality context plus permitted organization/capability context. Workforce, infrastructure, demographics, market access, sites, RFx demand, Resources, Referrals and outcomes remain separate dependencies.
5. **Private cross-domain records remain excluded.**
6. **No live Intelligence layer is implemented by `WP-INTEL-ROADMAP-01`.**

## 10. Handoff

The companion `INTELLIGENCE_DEPENDENCY_INDEPENDENT_EXECUTION_AUTHORITY.md` defines the future bounded implementation boundary that this inventory can support. `INTELLIGENCE_SHARED_CONTRACT_REQUEST.md` records the Shared Exchange changes needed before Intelligence can persist generic layer/selected-object context without forking shared infrastructure.
