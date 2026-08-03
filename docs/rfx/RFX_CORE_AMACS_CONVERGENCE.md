# RFx Core and AMACS convergence

**Status: CANONICAL PLANNING AUTHORITY — DOCUMENTATION ONLY; RFx CORE REMAINS NOT STARTED.**

Baseline RFxchange `main` for this convergence: `d34721481ca14a83decc3c1349fab08923cad2f7`.

AMACS foundation: version `0.1.0`, `AccelAnalysis/amacs` commit `d6f322b3f262fa8c06c70e99ebfa1d5349ee4fe1`.

## 1. Purpose

This convergence resolves how the approved RFx process, the stronger version-2 prototype interaction patterns, the merged RFxchange brand/workspace foundations and the independent AMACS standard become one production implementation without importing prototype mechanics or creating a second product architecture.

The production result must be:

- one organization-centered RFx transaction model;
- AMACS-backed request, requirement, response and decision semantics;
- real RFxchange organization, geography, Mapbox, authorization and lifecycle state;
- a restrained operational experience based on the approved version-2 design decisions;
- no synthetic runtime market objects;
- no user-facing internal vocabulary;
- a clean Wave 4 path through submission and a separate Wave 5 evaluator/selection path.

## 2. Decisions adopted by this convergence

### 2.1 One RFx aggregate

Every request family uses one canonical RFx aggregate with request-family-specific configuration. RFI, Sources Sought, RFQ, RFP, IFB/ITB, qualifications requests, supplier requests, teaming requests, lighter product/service requests and site-selection RFIs do not become independent products or unrelated schemas.

The RFx aggregate owns or references:

- issuer organization and authorized acting user;
- request-family snapshot;
- lifecycle/state version;
- need, scope and requested outputs;
- structured performance location;
- structured estimated value;
- structured engagement term;
- requirements and evidence rules;
- response structure;
- evaluation method and factors;
- publication/readiness state;
- public/permitted opportunity projection;
- pursuit relationships;
- response workspaces;
- team invitations/participation;
- immutable hosted submissions or explicit external handoffs;
- append-only domain events.

Generated documents, public cards, map beacons, responder workspaces and later evaluator views are projections or linked artifacts. None becomes a competing canonical RFx record.

### 2.2 AMACS is a versioned dependency, not a UI data dump

RFxchange consumes an immutable AMACS release through an application boundary. Browser components do not query GitHub, import the AMACS repository directly or hard-code hundreds of concepts.

RFxchange stores stable AMACS IDs for semantic joins and label snapshots for historical readability. Published RFxs retain the AMACS release version and applicable records used at publication.

AMACS controls:

- request-family definitions and default lifecycles;
- canonical capability hierarchy and aliases;
- requirement types and allowed team-coverage behavior;
- common response-section and response-template definitions;
- common decision-factor and decision-template definitions;
- readiness-rule definitions;
- governed provisional-term semantics.

RFxchange controls:

- organization authority and permissions;
- organization capability claims and evidence/provenance;
- geography and visibility;
- RFx and response lifecycle;
- publication and access projections;
- matching calculations and explanations;
- transaction events and communications;
- participant-facing wording and interaction;
- commercial entitlements without altering legitimate match/qualification truth.

### 2.3 Version 2 is the RFx visual reference

The second RFx prototype iteration is the preferred visual/interaction reference where this convergence explicitly adopts its decisions. The later prototype is not treated as superior merely because it is newer.

Adopted version-2 characteristics:

- small gold eyebrow above a decisive large title;
- strong typography and whitespace rather than nested card grids;
- continuous rows and accessible tables for requirements, sections and factors;
- a quiet accessible `×`/remove action instead of oversized destructive buttons for ordinary row removal;
- a prominent connected lifecycle that visibly reads as a process;
- one focal action per screen;
- a split readiness/publish composition with findings and request/market context;
- restrained borders and containers;
- customer-facing labels instead of implementation vocabulary.

Prototype mechanics are not adopted. The production implementation uses existing RFxchange components, real Mapbox, server-authoritative domain state and the current application shell.

### 2.4 Spatial and operational workspaces remain distinct

Use the existing Spatial Workspace when geography, surrounding organizations, discovery or service area are integral. Use an Operational Workspace for authoring, requirements, response construction, readiness, comparison and submission.

The map is not a decorative backdrop behind every form. Conversely, a geographically meaningful RFx discovery surface must not be rebuilt as a conventional dashboard that discards the map.

### 2.5 Structured performance location

Performance location is not an open text field.

Supported structures:

```ts
type PerformanceLocation =
  | {
      mode: "issuer-primary-location";
      organizationLocationId: string;
      localityId: string;
      point: { latitude: number; longitude: number };
      geocodeProvenance: GeocodeProvenance;
    }
  | {
      mode: "organization-location";
      organizationLocationId: string;
      localityId: string;
      point: { latitude: number; longitude: number };
      geocodeProvenance: GeocodeProvenance;
    }
  | {
      mode: "exact-address";
      normalizedAddress: string;
      localityId: string;
      point: { latitude: number; longitude: number };
      geocodeProvenance: GeocodeProvenance;
    }
  | {
      mode: "locality";
      localityId: string;
      localityBounds: GeographicBounds;
    }
  | {
      mode: "multiple";
      locations: PerformanceLocationItem[];
    };
```

Participant choices should be understandable:

- `At our primary location`
- `At another organization location`
- `At another address`
- `Across a city or county`
- `At multiple locations`

Exact addresses use the existing RFxchange geocoding/locality authority. The system derives locality from an exact address and stores precision/visibility separately from the operational location. Publication never increases location precision beyond the issuer-approved projection.

### 2.6 Structured estimated value

Estimated value is stored numerically in integer minor currency units.

```ts
type EstimatedValue =
  | { mode: "exact"; currency: string; amountMinor: number }
  | {
      mode: "range";
      currency: string;
      minimumMinor: number;
      maximumMinor: number;
    }
  | { mode: "not-disclosed" };
```

The UI may format `$360,000–$540,000`, but analytics and matching consume `minimumMinor`, `maximumMinor` and currency. Range entry is first-class because issuers often cannot or will not disclose a single figure.

### 2.7 Structured engagement term

Engagement term is not an unrestricted sentence.

```ts
type EngagementTerm =
  | { mode: "fixed"; duration: StructuredDuration }
  | {
      mode: "fixed-with-options";
      baseDuration: StructuredDuration;
      optionCount: number;
      optionDuration: StructuredDuration;
    }
  | { mode: "ongoing"; reviewPeriod?: StructuredDuration }
  | {
      mode: "milestone-based";
      expectedStart?: string;
      expectedCompletion?: string;
    };
```

The participant can add a short explanatory note, but the reporting values remain structured.

### 2.8 Request-family selection teaches through progressive disclosure

The request-family screen stays visually clean. Each family shows its name and a concise purpose line. More detail is available through an accessible info action/popover or detail sheet, not ten long paragraphs displayed at once.

The selected lifecycle is prominent and connected. It shows ordered steps with connectors, current/anticipated progression and request-family-specific endpoint language. It is not a cluster of tiny unrelated status pills.

### 2.9 Capability requirements use AMACS and structured qualifiers

The primary requirement UI is an operational table titled `Required capabilities`, not a set of isolated cards.

Each row can include:

- capability;
- required/preferred/informational treatment;
- gate/scored behavior where allowed;
- requirement detail/qualifier summary;
- evidence needed;
- who may satisfy the requirement when the requirement type allows team coverage;
- quiet remove/reorder controls.

The ordinary issuer UI does not show a generic `Team coverage` checkbox. Where relevant, an advanced requirement setting asks:

> Who must satisfy this requirement?

- Lead organization
- Any accepted response-team member
- Combined response team

Only AMACS requirement types that allow team coverage expose those choices. Credential/evidence rules that require the lead organization cannot be relaxed by the UI.

### 2.10 Response structure is standardized and expandable

Participant language:

- `Response structure`
- `Choose a starting structure`
- `Add a section`
- `Required` / `Optional`
- `Response format`

Avoid participant-facing `canonical section`, `local section`, `bundle`, `schema` or AMACS record IDs.

Common AMACS templates provide the starting structure. An issuer may add or modify a section for the current RFx. Reusable organization templates and proposals to extend AMACS are separate future/governed actions.

`Add a section` opens the existing branded responsive sheet/modal primitive with fields for title, instructions, response format, required/optional state, limits and attachment permissions. It does not use a browser prompt or rudimentary text popup.

### 2.11 Evaluation method is standardized and expandable

Participant language:

- `Evaluation method`
- `Required condition`
- `Scored factor`
- `Required and scored`
- `Add a factor`
- `Comparative weight`

Gates and scored factors remain editable where the AMACS factor/requirement semantics permit. Required capability coverage is connected to capability requirements; capability depth may be scored without double-counting the same minimum fact.

The comparative-weight total is prominent and persistent. Weighted methods cannot publish unless applicable scored factors total 100%. Nonweighted methods do not fabricate a 100% rule.

`Add a factor` uses a branded sheet, not a browser prompt.

### 2.12 Readiness findings deep-link to their source

Each publication finding includes:

- severity: blocking, warning or advisory;
- participant-facing message;
- exact builder stage, section and field target;
- `Fix` action;
- reason and remediation where useful;
- preserved return context.

Fixing a finding focuses/highlights the relevant field and returns to the same readiness context after correction.

The approved presentation is the cleaner version-2 split layout. Passed checks may collapse into a concise summary rather than each becoming a large bordered card.

### 2.13 Wave 4 ends at submission; Wave 5 owns evaluation/selection

Wave 4 defines the evaluation method and freezes it at publication, but substantive evaluator assignment, conflicts, individual scoring, clarification, consensus, recommendation, approval, selection/award and outcome work remain Wave 5 unless a separately reviewed tracker change says otherwise.

Wave 4 supports:

- hosted submission with immutable receipt; or
- truthful external handoff that never claims external receipt.

### 2.14 B6c uses only authoritative RFx data

No opportunity beacon appears until a real RFx has been published through `ISS-019` and an authorized public/permitted projection exists.

No pursuit, team or response path appears until the corresponding real relationship/event exists. The production map uses the existing Mapbox workspace and renderer-owned coordinates. No static SVG map, arbitrary pixel position, invented marker or simulated transaction is admitted into live runtime.

## 3. Cross-wave AMACS placement

### Wave 3 Slice 3.2

May establish the AMACS release ingestion/search boundary needed for capability-first organization discovery. It must not create RFx requirements or opportunities.

### Wave 3 Slice 3.3

May use the same picker and release projection for organization capability enrichment, including provisional-term proposals. Organization claims remain self-asserted unless separately verified.

### Wave 4

Consumes the Wave 3 AMACS catalog/search/profile foundations for request requirements, matching, gaps and team discovery. If Wave 3 has not produced an adequate reusable boundary, Wave 4 must add it as an explicitly reviewed prerequisite rather than embedding a private duplicate catalog.

## 4. Customer-facing terminology

| Internal/AMACS concept | Participant-facing wording |
| --- | --- |
| AMACS request family | Request type |
| AMACS capability concept | Capability |
| Canonical capability | Capability |
| Response architecture | Response structure |
| Decision architecture | Evaluation method |
| Requirement bundle | Starting requirements |
| Gate only | Required |
| Scored only | Scored |
| Gate plus scored depth | Required and scored |
| Local/custom section | Add a section / Your section |
| Local/custom factor | Add a factor / Your factor |
| Readiness rule | Publication check |
| Projection | Visible opportunity / map visibility / public view, as appropriate |
| Source commit | Not shown in ordinary participant UI |
| AMACS ID | Available in technical details/export, not primary UI |

Forbidden ordinary participant copy includes `canonical`, `local section`, `local factor`, `projection`, `schema`, `source commit`, `bundle`, `gate_and_scored_depth`, `controlled Exchange` and raw AMACS IDs unless a clearly labeled technical detail is intentionally opened.

## 5. Implementation rules

Future RFx implementation must:

- use existing B1/B2 design tokens and primitives;
- extend the B6a participant shell rather than create another application shell;
- use real server-authoritative organization/geography/RFx projections;
- preserve the i18n boundary between RFxchange-controlled interface text and participant-authored content;
- keep authorization and domain truth server-side;
- record append-only audit/domain events for consequential transitions;
- keep editable response workspaces distinct from immutable submissions;
- snapshot AMACS references at publication;
- avoid duplicating Wave 3 organization/provider/referral discovery;
- keep commercial entitlements separate from legitimate capability fit and qualification.

## 6. Non-scope

This convergence does not:

- implement any Wave 4 feature;
- mark any Feature ID complete;
- publish an RFx;
- add a live opportunity beacon;
- import prototype code or sample organizations;
- create evaluator/award/outcome workflows;
- change AMACS itself;
- introduce automatic translation of participant-authored RFx requirements or responses.
