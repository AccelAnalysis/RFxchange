# RFx Core product workspaces

**Status: CANONICAL FUTURE RFx UX AUTHORITY — NO RUNTIME IMPLEMENTATION IN THIS DOCUMENTATION PR.**

## 1. Governing UX decision

> One structured RFx transaction appears through role-appropriate workspaces. The product does not become separate bid-board, issuer document builder, proposal builder and teaming applications.

Use existing RFxchange navigation, semantic tokens, shared primitives and responsive sheets. Do not create another participant shell, permanent RFx left rail, generic dashboard or standalone prototype application.

## 2. Workspace modes

### Spatial Workspace

Use when geography, surrounding organizations, opportunity discovery, service area or partner/resource discovery are integral.

Production rules:

- extend the existing B6a Mapbox workspace;
- preserve one search/filter pattern;
- synchronize map, list and detail selection;
- use real permitted organization/opportunity projections;
- use responsive edge/bottom sheets;
- preserve organization home, focal visibility and map controls;
- do not render fake/synthetic live objects;
- do not use static SVG/DOM coordinates as geography.

### Operational Workspace

Use for authoring, requirements, response/evaluation structure, readiness, Go/No-Go, response completion, review and submission.

Production rules:

- Warm Ivory/light default canvas;
- existing participant top navigation;
- one compact transaction context strip where needed;
- hierarchy through typography, whitespace and row/table grouping;
- no decorative card grid around every row;
- geography may be a compact reference/open-spatial action rather than forcing every form over a map.

## 3. Approved visual direction from version 2

### Headings

Use:

- small, tracked gold eyebrow;
- larger short task title;
- restrained explanatory sentence;
- one primary action.

Do not use giant marketing-scale headings inside ordinary operational steps or bury the task under implementation terminology.

### Structured lists

Requirements, response sections and evaluation factors use continuous rows or accessible tables.

Rows use spacing, alignment and light separators. Do not place every row inside its own rounded bordered card.

### Removal

Ordinary row removal uses a quiet accessible icon/action with confirmation or undo where consequential. Reserve red/destructive styling for genuinely destructive states, not routine list editing.

### Lifecycle

The selected request lifecycle is prominent and visibly sequential:

- ordered nodes;
- connectors;
- current/anticipated state;
- family-specific endpoint language;
- responsive horizontal/vertical treatment;
- screen-reader ordered-list semantics.

It is not a group of tiny independent pills.

### Readiness

Use the approved split composition:

- actionable findings/checks on the left;
- request/market/publication summary on the right;
- sticky/focal publish action only when ready;
- passed checks condensed when they do not need attention;
- exact `Fix` links.

## 4. Issuer workspace

### 4.1 Request type

Primary title: `Choose the request type that fits the decision`.

Each of the ten AMACS request families shows:

- name;
- one concise purpose line;
- selected state;
- accessible `Learn about this request type` action.

The detail popover/sheet may explain:

- when to use the type;
- what respondents normally provide;
- typical endpoint;
- pricing/evaluation expectations;
- whether an award is expected;
- default response/evaluation structures.

The lifecycle updates immediately when a type is selected.

### 4.2 Define the need

Collect:

- title;
- business need/requested outcome;
- scope;
- requested outputs/deliverables;
- key dates;
- performance location;
- estimated value;
- engagement term.

Performance location uses existing organization locations/geocoding/locality search. `At our primary location` is a simple option that reuses the authoritative organization location.

Estimated value and engagement term use structured controls described in the convergence authority. Participant-authored explanatory notes remain optional secondary fields.

### 4.3 Required capabilities and requirements

Primary title: `Required capabilities`.

Recommended desktop columns:

| Capability | Requirement | Decision use | Evidence/conditions | Actions |
| --- | --- | --- | --- | --- |

On compact screens rows become a disclosure list without changing semantics.

`Add capability` opens the shared hierarchical AMACS picker:

- search across all domains/families/capabilities/aliases;
- browse Domain → Family → Capability;
- view definition/breadcrumb;
- select multiple capabilities;
- propose `None of these describe it` where authorized.

The main table shows labels, not raw AMACS IDs.

Advanced requirement settings include qualifiers, evidence, and who may satisfy the requirement only where AMACS permits.

### 4.4 Response structure

Primary title: `Response structure`.

The issuer chooses a common starting structure and sees a continuous ordered section list.

Actions:

- add a section;
- reorder;
- make required/optional;
- edit instructions/format/limits;
- remove through a quiet action.

`Add a section` opens a branded responsive sheet with:

- section title;
- what the responder should provide;
- response format;
- required/optional;
- character/page/item limits where applicable;
- attachments allowed;
- save/cancel.

Do not say `Add local section`.

### 4.5 Evaluation method

Primary title: `Evaluation method`.

Use a continuous factor table. Each row can select an allowed treatment:

- Required condition;
- Scored factor;
- Required and scored;
- Informational only.

Scored rows show editable weights. The weight total is a prominent sticky summary:

> Comparative weight — 100% allocated

Invalid totals show exact remediation. Gates are editable where semantics permit; AMACS restrictions still enforce valid combinations.

`Add a factor` uses a branded responsive sheet. Do not say `Add local factor`.

### 4.6 Readiness and preview

Findings deep-link to exact fields. Responder preview uses the same projection component/contract as publication; it is not a generated mock document with divergent logic.

The publish action is unavailable for blocking findings and rechecks server authority/current state at action time.

## 5. Responder workspace

### 5.1 Opportunity discovery/detail

Spatial map/list/detail uses real published opportunities only. Opportunity details state why it was discovered/surfaced and distinguish:

- Discovered;
- Potential match;
- Invited.

None means qualified or endorsed.

### 5.2 Fit and Go/No-Go

Operational workspace shows:

- requirement/capability alignment;
- evidence needing confirmation;
- missing capabilities;
- geography/value/term/deadline;
- private capacity/economics considerations;
- Pursue, Watch or Decline.

Match explanations name inputs and uncertainty. They do not claim eligibility, profitability or award likelihood.

### 5.3 Gap resolution

A gap can route to:

- `Find a teammate` using Wave 3 organization discovery and RFx context;
- `Find support` using approved provider/resource routing;
- `Update profile` where the capability exists but is absent;
- `Review requirement`.

### 5.4 Response workspace

The response is generated from stable published requirement/section IDs.

Use continuous sections/compliance rows, not a wall of cards. Reusable profile information may prefill suggestions, but the responder reviews/confirms every submitted value.

The lead controls final submission. Teammate assignments and completion are visible without creating a legal teaming agreement.

### 5.5 Submission

Hosted mode:

- final server validation;
- assembled review;
- explicit attest/submit;
- locked immutable submitted version;
- timestamped receipt.

External mode:

- prepare/export/handoff instructions;
- record handoff action;
- never claim the external issuer received the response unless independently confirmed.

## 6. Teaming-partner workspace

The invitee sees minimum necessary RFx, issuer, proposed role, capability need and response responsibility.

Accepting creates RFx-scoped platform participation only. The nonbinding boundary is visible and evidenced.

The partner can complete assigned response sections/requirements but cannot publish the lead response unless separately authorized as the lead organization/user.

## 7. Internal-language guardrail

Participant components and translation catalogs must reject/flag ordinary use of:

- canonical;
- local section;
- local factor;
- projection;
- source commit;
- schema;
- bundle;
- `gate_and_scored_depth`;
- raw AMACS record IDs;
- controlled Exchange.

Technical/admin/export contexts may show IDs/provenance with clear labels.

## 8. Prototype mechanics explicitly prohibited in production

- fake/schematic map;
- fictional businesses represented as live;
- simulated counterpart buttons;
- localStorage as RFx domain truth;
- browser prompts for section/factor creation;
- hard-coded AMACS arrays;
- direct browser GitHub access;
- arbitrary DOM marker coordinates;
- tutorial overlays on ordinary live workflows;
- duplicated modal/table/button/navigation systems.
