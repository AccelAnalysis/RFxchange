# Wave 4 RFx Core Product Workspaces / UX

**Status: PARALLEL PLANNING ANALYSIS — NON-CANONICAL UNTIL RFx CORE CONVERGENCE REVIEW**

This document defines the proposed participant-facing RFx product workspace architecture for Wave 4 and the future seams that Wave 4 must leave for Wave 5 evaluation, Q&A/addenda, outcomes and advanced collaboration. It is a product/UX planning artifact only. It does **not** authorize Wave 4 implementation, define canonical RFx lifecycle states or permissions, change Feature-ID status, or replace the product design system, tracker, dependency map or later RFx Core convergence decisions.

## 1. Purpose

Wave 4 should feel like one connected transaction product, not separate bid-board, RFP-builder, proposal-builder and teaming applications.

The governing UX invariant is:

> **One structured RFx transaction is presented through role-appropriate workspaces. Issuer, responder, teammate and later evaluator views are projections of the same transaction and linked artifacts, not competing records.**

The product must preserve the full RFxchange transaction model:

`Need → Build RFx → Publish → Discover/Match → Qualify → Respond → Evaluate → Select/Award/Connect → Execute → Outcome → Intelligence`

Wave 4 directly carries the live experience through response submission and establishes explicit future-workspace seams for evaluation, selection, Q&A/addenda and outcomes.

## 2. Authority and design inputs

This planning lane consumes, but does not supersede:

- `AGENTS.md`;
- `docs/design/README.md`;
- `docs/design/RFxchange_DESIGN_SYSTEM.md`;
- `docs/design/MAP_VISUAL_SYSTEM.md` where geography is present;
- `docs/architecture/DESIGN_CONVERGENCE_GATE.md`;
- `docs/context/RFX_TRANSACTION_CYCLE.md`;
- the live tracker/dependency map;
- the parallel Wave 4 Feature Crosswalk in `docs/rfx/design/RFX_WAVE_4_FEATURE_CROSSWALK.md` when merged/adopted or otherwise supplied to convergence.

If this document conflicts with canonical domain authority, the canonical domain/security decision controls. UX never grants authority.

## 3. Product workspace architecture

RFx Core uses the two participant workspace modes already established by the design convergence gate.

### 3.1 Spatial Workspace

Use when location, surrounding organizations, opportunity density, territory or discovery are integral to the task.

Primary Wave 4 uses:

- RFx/opportunity discovery;
- map/list result exploration;
- geographically relevant opportunity detail;
- partner discovery for an RFx gap;
- resource discovery launched from an RFx gap;
- controlled visual connection among issuer, opportunity and prospective teammate/resource when useful.

Spatial behavior:

- one participant top navigation;
- map fills the entire remaining viewport;
- one search/filter system;
- result/detail in responsive edge sheet or mobile bottom sheet;
- opening detail preserves meaningful map context;
- no permanent participant left navigation rail;
- no stacked route header + map header + toolbar;
- Warm Ivory/light-glass overlays by default;
- map markers and paths reflect real authorized product/geographic state.

### 3.2 Operational Workspace

Use when the user is composing, reviewing, deciding, comparing, validating or submitting structured transaction content.

Primary Wave 4 uses:

- RFx creation and authoring;
- requirements and criteria definition;
- publish readiness and responder preview;
- responder Go/No-Go decision support;
- response construction and compliance matrix;
- RFx team invitation/review where a focused transaction surface is more appropriate than discovery;
- final response review and submission/handoff;
- later evaluator, Q&A/addendum, selection and outcome workspaces.

Operational behavior:

- Warm Ivory default canvas;
- one shared participant top navigation;
- hierarchy through typography, whitespace and task grouping;
- persistent transaction context may exist, but must not become a second global navigation system;
- panels only where they represent true interaction/data boundaries;
- contextual geography may appear as compact reference or open the Spatial Workspace, but should not force transactional forms into a map canvas.

## 4. Global RFx navigation model

### 4.1 Participant primary navigation remains unchanged

RFx Core must not add a new permanent application shell or left rail. The existing participant shell remains the only primary navigation frame.

The Opportunities product mode is the entry point for participant RFx activity. Within a selected RFx transaction, use contextual transaction navigation rather than another application navigation rail.

### 4.2 Transaction context bar

Operational RFx workspaces may use one compact contextual transaction header immediately below the participant navigation when necessary to preserve identity and status during long-form work.

The transaction context bar may include:

- RFx title;
- issuer/responder role context;
- typed status label supplied by canonical state;
- due date/time when relevant;
- save/sync indicator where truthful;
- one primary action appropriate to the current step;
- compact overflow menu for secondary transaction actions.

It must not become a large second hero/header. On mobile it collapses to a compact context strip or sticky action area.

### 4.3 Contextual section navigation

Long operational transactions need orientation, but section navigation is local to the selected RFx.

Recommended desktop pattern:

- compact horizontal section navigation when sections are few;
- a bounded in-workspace section index when the RFx package/response is long;
- section index may become temporarily sticky within the content region;
- never turn it into a permanent participant primary navigation rail.

Recommended mobile pattern:

- current-section selector/progress control;
- bottom sheet or disclosure list for jumping to another section;
- sticky bottom action bar only where it materially improves completion/submission.

## 5. Workspace map

| Product moment | Primary actor | Workspace | Primary surface | Wave 4 status |
| --- | --- | --- | --- | --- |
| Opportunity discovery | Responder | Spatial | Map + result sheet | Live Wave 4 |
| Opportunity detail from discovery | Responder/public participant | Spatial | Selected opportunity edge sheet | Live Wave 4 |
| Pursuit decision | Responder | Operational | Opportunity/Pursuit workspace | Live Wave 4 |
| Gap → partner/resource discovery | Responder/team lead | Spatial | Context-preserving discovery sheet | Live Wave 4 |
| RFx creation/authoring | Issuer | Operational | RFx Builder | Live Wave 4 |
| Publish readiness/preview | Issuer | Operational | Readiness + responder projection preview | Live Wave 4 |
| Response construction | Responder | Operational | Response Workspace | Live Wave 4 |
| Final response review | Responder | Operational | Submission Review | Live Wave 4 |
| Hosted submission receipt | Responder | Operational | Submission Confirmation | Live Wave 4 |
| External handoff | Responder | Operational | External Submission Handoff | Live Wave 4 |
| Team invite/review | Team lead/invitee | Operational + contextual Spatial entry | Team Participation | Live Wave 4 |
| RFx Q&A | Issuer/responder | Operational | Q&A Workspace | Future Wave 5 seam |
| Addendum/version review | Issuer/responder | Operational | Change Review | Future Wave 5 seam |
| Evaluator scoring/consensus | Evaluator | Operational | Evaluation Workspace | Future Wave 5 seam |
| Selection/award/connect | Issuer/evaluator | Operational | Selection Workspace | Future Wave 5 seam |
| Outcome recording | Issuer/responder | Operational | Outcome Workspace | Future seam |

## 6. Issuer RFx Builder

### 6.1 Objective

Allow an issuer to translate a business need into one structured RFx package without forcing every request type through heavyweight procurement ceremony.

The same builder supports lightweight and formal RFx types through type-aware modules rather than separate products.

### 6.2 Entry

Issuer entry may begin from:

- Create opportunity/RFx;
- a future reusable template;
- a permitted prior RFx;
- a contextual business need or network action.

Initial creation should establish only the minimum canonical identity needed to start safely. Template/prior-RFx options are capability extensions and must not block blank creation.

### 6.3 Builder composition

Recommended top-level modules:

1. **Overview / Need**
2. **Scope & Deliverables**
3. **Requirements**
4. **Supplier Fit / Criteria**
5. **Schedule & Geography**
6. **Commercial / Pricing Instructions**
7. **Evaluation Definition**
8. **Documents & Terms**
9. **Response Instructions**
10. **Review & Publish**

The exact required modules are type-driven and subject to convergence. Do not show empty modules merely to make every RFx look like an RFP.

### 6.4 Builder layout

Desktop:

- focused Operational Workspace;
- concise transaction context bar;
- current module dominates the central reading width;
- compact section progress/index;
- contextual help appears inline or in a dismissible side surface, not as a competing dashboard;
- validation findings appear next to the affected field/module and in an aggregated readiness summary.

Mobile:

- one module/decision at a time;
- progressive disclosure for secondary fields;
- section selector/progress at top;
- primary Save/Continue or Review action thumb reachable;
- no multi-column dense form squeezed into a narrow viewport.

### 6.5 Requirements authoring

Requirements must appear as structured, addressable items rather than only a large text editor.

UX should support:

- requirement title/summary;
- category/type supplied by the domain model;
- required/preferred/informational semantics where canonical;
- structured values/thresholds where relevant;
- geography/location relationship where relevant;
- requested responder evidence/answer type;
- ordering/grouping;
- clear stable identity hidden from ordinary users but visible where traceability requires it.

Long narrative scope remains possible, but it cannot substitute for structured response/evaluation-relevant requirements.

### 6.6 Supplier criteria

Supplier criteria should be visually separated from RFx requirements so an issuer can distinguish:

- what the supplier/organization should possess or demonstrate;
- what the responder must answer/provide for this RFx.

Criteria display must avoid implying that the platform automatically certifies qualification.

### 6.7 Evaluation definition

Wave 4 issuer UX must allow the issuer to define the evaluation basis before publication.

The surface may include:

- criterion;
- description;
- linkage to relevant requirement(s);
- weight/priority/method where allowed by the eventual canonical model;
- pass/fail vs scored distinction where supported.

Wave 4 should not expose evaluator assignment, scoring or consensus controls as if implemented. The Evaluation Definition is the published rule/structure seam that later evaluation consumes.

### 6.8 Readiness

`Review & Publish` should produce an explainable readiness surface, not one generic “form incomplete” error.

Recommended grouping:

- Required content;
- Dates/deadlines;
- Requirements/response instructions;
- Geography/visibility;
- Evaluation definition;
- Attachments/documents;
- Issuer authority;
- Conditional future gates only when enabled by the RFx configuration.

Each finding deep-links to the exact module/field that needs remediation.

### 6.9 Responder preview

Before publication, the issuer can preview the responder-facing RFx using the same projection contract that the responder will later consume.

Preview rules:

- clearly labeled Preview;
- never create live search/map/public state;
- no fake responder actions that imply the RFx is published;
- reveal permission/privacy projection issues before publication;
- support desktop/mobile viewport checks where practical.

### 6.10 Publish moment

Publish is consequential and should have a focused confirmation summarizing:

- RFx identity/type;
- visibility/geography;
- response deadline;
- submission mode;
- major requirements/evaluation basis;
- any irreversible or versioned consequences supplied by the canonical lifecycle.

After success, route to a published RFx overview with truthful downstream state—not back to a blank builder.

## 7. Published Issuer RFx Overview

Wave 4 needs a post-publication issuer home even though advanced response management/evaluation arrives later.

Proposed information hierarchy:

- RFx title/type/status;
- public/participant visibility summary;
- timeline/deadline;
- geography;
- requirements/package summary;
- share action if permitted;
- discovery/projection status if available;
- response/submission count only where the current wave legitimately knows it;
- activity/audit summary appropriate to the participant role.

Future tabs/actions may appear only when implemented and authorized. Do not pre-render disabled evaluator/Q&A/addenda controls simply to reserve visual space.

## 8. Opportunity Discovery Workspace

### 8.1 Objective

Make live RFx opportunities discoverable in the same controlled network environment as organizations/resources rather than creating a separate bid-board website.

### 8.2 Spatial composition

Desktop:

- full Spatial Workspace map;
- one search/filter overlay;
- results in edge drawer;
- selected opportunity marker and geographic context remain visible;
- result list and map selection synchronize;
- opportunity details open in the same edge sheet before escalation into a focused operational workflow.

Mobile:

- map remains the base canvas;
- search/filter compact at top;
- result list in bottom sheet;
- selected opportunity detail expands from the result sheet;
- primary pursuit/watch action remains reachable without obscuring all geography.

### 8.3 Search/filter vocabulary

Subject to Wave 3 discovery contracts and later convergence, opportunity discovery may expose filters such as:

- keyword;
- capability/service;
- RFx type;
- geography/radius;
- deadline window;
- value/budget where public;
- issuer type/role where meaningful;
- required credential/category where publicly projectable;
- source/relationship such as invited or potential match.

One filter system should compose these rather than creating separate filter bars per RFx type.

### 8.4 Opportunity result card/list row

A result should answer quickly:

- What is needed?
- Who is issuing it, if public?
- Where?
- When is it due?
- Why might it be relevant?
- What is the source relationship: Discovered, Potential Match or Invited?

Never label a result “Qualified,” “Recommended Winner,” or equivalent based only on match/discovery logic.

## 9. Selected Opportunity Detail

The selected detail sheet is a **decision gateway**, not the full response application.

Recommended sections:

- concise opportunity summary;
- issuer public projection;
- RFx type;
- location/service geography;
- deadline/timeline;
- public value/commercial context where available;
- major requirements;
- supplier criteria;
- evaluation basis summary;
- why surfaced / match explanation;
- known gaps/unknowns when the platform can explain them safely;
- documents/public attachments;
- actions.

Primary action hierarchy varies by relationship and canonical state but generally favors:

1. **Assess / Pursue**
2. Watch/Save where available
3. Share where permitted
4. Decline/dismiss where appropriate

Opening Assess/Pursue transitions from Spatial Workspace into the focused Operational Pursuit Workspace while preserving RFx identity and a return path to map context.

## 10. Responder Pursuit Workspace

### 10.1 Objective

Help an organization make a deliberate Pursue / Watch / Decline decision before creating a full response.

Private responder assessment data is never part of the issuer-facing RFx.

### 10.2 Sections

Recommended structure:

- **Opportunity** — core RFx context;
- **Why this surfaced** — discovered/matched/invited explanation;
- **Requirement fit** — known alignment, unknowns and gaps;
- **Eligibility/credentials** — required evidence with known/unknown semantics;
- **Capacity & schedule** — responder-entered considerations;
- **Economics** — private go/no-go inputs where supported;
- **Team/resource gaps** — missing capability/resource paths;
- **Decision** — Pursue, Watch, Decline.

The platform must distinguish:

- known match;
- known gap;
- information not on file;
- user-confirmation required.

Unknown profile information must not be displayed as an authoritative failure.

### 10.3 Decision actions

**Pursue**

- creates/opens the response workspace only after canonical authorization/state checks;
- preserves assessment/gap context;
- does not imply qualification or acceptance by issuer.

**Watch**

- preserves opportunity relationship/timeline where supported;
- does not create a response.

**Decline**

- records responder decision where permitted;
- optional structured reason may support intelligence without exposing private reasoning to issuer unless explicitly designed/consented later;
- does not damage credibility.

## 11. Gap Resolution Experience

A gap should be actionable without turning the pursuit workspace into a directory.

### 11.1 Gap row

A structured gap may expose:

- requirement/criterion reference;
- what appears aligned;
- what is missing/unknown;
- why it matters;
- available next actions.

Potential actions:

- Confirm/update my organization data;
- Find a teammate;
- Find a resource;
- Mark as resolved manually where allowed;
- Keep unresolved and continue if not blocking.

### 11.2 Find a teammate

Launches a contextual Spatial Workspace partner search carrying minimum RFx/gap context.

The search should prefilter/boost relevant capability/geography without hiding the underlying criteria from the user.

Candidate organization detail should explain relevant fit but not guarantee willingness, eligibility or legal teaming status.

### 11.3 Find a resource

Launches Wave 3 official resource discovery using a bounded assistance context.

RFx Core should not create a second provider directory or provider intake workflow.

## 12. RFx Team Participation Workspace

### 12.1 Team lead view

After finding a candidate, the team lead can prepare an RFx-scoped invitation containing:

- opportunity context appropriate for the invitee;
- proposed role/capacity;
- relevant requirements/gap;
- optional note;
- nonbinding legal boundary;
- invitation expiry/status supplied by canonical contracts.

### 12.2 Invitee view

Invitee sees:

- who invited them;
- which organization is acting as team lead;
- RFx/opportunity summary they are authorized to see;
- proposed role/capacity;
- relevant requirement context;
- nonbinding legal explanation;
- Accept / Decline actions.

Acceptance creates only the platform-defined participation context. The UX must never label it a signed subcontract, joint venture or legal teaming agreement.

### 12.3 Non-member entry

A non-member invitation opens through the acquisition-context journey. Registration/onboarding should preserve the invitation reason, then return to the invitation review after legitimate account/organization activation.

The invite URL/context does not itself grant protected RFx visibility, organization authority or acceptance.

## 13. Response Workspace

### 13.1 Objective

Turn structured issuer requirements into one requirement-linked response plan and working response—not a detached proposal document editor.

### 13.2 Workspace composition

Recommended top-level sections:

- **Overview / Plan**
- **Requirements / Compliance**
- **Response Content**
- **Pricing / Commercial Response** where applicable
- **Team / Contributors** where applicable
- **Documents / Evidence**
- **Representations / Confirmations** where applicable
- **Readiness**
- **Review & Submit**

Exact sections are RFx-type/configuration driven.

### 13.3 Response overview

Should show:

- RFx identity/issuer;
- due date and timezone;
- submission mode;
- response completion/readiness status;
- assigned team/contributor context if implemented;
- major unresolved blockers;
- one dominant next action.

### 13.4 Requirement compliance matrix

This is the core responder information architecture.

Each row/item should maintain the stable link to the issuer requirement and show:

- requirement identifier/title;
- required/preferred/informational semantics;
- response/evidence requested;
- current completion state;
- assigned contributor if collaboration exists later;
- linked response content/evidence;
- validation issue if any.

Users should be able to move from a requirement directly to the response content/evidence needed to satisfy it.

Do not duplicate requirement text into an untraceable checklist.

### 13.5 Response content editor

Structured responses may include:

- narrative answer;
- numeric/currency/date/value answer;
- yes/no/attestation;
- selected organization/profile evidence;
- attachment/document;
- pricing line/table;
- schedule/milestone;
- other type-driven structured response.

Reusable organization data may prefill or suggest content, but the responder must review/confirm what enters the submission.

### 13.6 Readiness

Live readiness should distinguish:

- complete;
- incomplete;
- blocking issue;
- warning/review recommended;
- conditional requirement not applicable.

Readiness findings should deep-link to the affected response item.

Future addenda acknowledgments/team completeness become readiness inputs only when the corresponding canonical feature/configuration is present.

## 14. Final Submission Review

Final review is a projection of the canonical response, not a second editable proposal.

Recommended review sections:

- RFx and submission mode;
- organization/responding entity;
- requirements/compliance summary;
- final response content;
- pricing/commercial response;
- documents/evidence;
- team participation if applicable;
- representations/attestations;
- addenda acknowledgments if applicable later;
- final validation result.

Any edit action returns to the originating response section and then regenerates the review projection.

## 15. Hosted Submission Experience

When RFxchange is the submission authority:

1. User chooses Submit from Final Review.
2. Server-authoritative final validation rechecks current RFx version, deadline, requirement state, organization authority and submission eligibility.
3. Consequential confirmation explains that the submitted version will be locked/receipted according to the canonical rules.
4. Success presents an immutable submission receipt/version reference.
5. Editable draft state and immutable submitted artifact remain visibly distinct.

Submission confirmation should provide:

- received timestamp/timezone;
- RFx identifier;
- responding organization;
- submission/version identifier;
- receipt/download action where supported;
- what happens next.

Never rely on a client-side “100% complete” indicator as authorization to submit.

## 16. External Submission Handoff Experience

When an outside system remains the submission authority:

RFxchange can provide:

- prepared package/review;
- official external destination/instructions;
- deadline/timezone;
- external reference information;
- handoff/open-destination action;
- optional user-entered tracking notes where later allowed.

Language must say **Ready for external submission**, **Open submission portal**, **Handoff prepared**, or equivalent.

Do not say **Submitted**, **Received**, or **Accepted** unless RFxchange has authoritative evidence of that external state.

## 17. Just-in-Time RFx Education

Education belongs inside the actual workflow, not in a detached training product.

### First issuer RFx

Before or during first creation/publish readiness, explain briefly:

- RFx visibility and publication consequences;
- structured requirements;
- deadline responsibility;
- evaluation definition;
- accuracy/authority;
- later addenda concept without implying unavailable tools are live.

### First responder RFx

At pursuit/response entry, explain:

- requirements/compliance relationship;
- deadline/submission mode;
- responder confirmation responsibility;
- team participation boundary;
- hosted vs external submission where relevant.

### First team invitation

At invite/send and invite/review, explain the nonbinding platform-team boundary in context.

Education should be concise, resumable/dismissible as policy permits, and must not block experienced users repeatedly once the required first-use education is legitimately satisfied.

## 18. Future Wave 5 Q&A / Addendum Workspace seam

Wave 4 must reserve domain/UI integration points without implementing the full feature.

Future Q&A should attach to the selected RFx transaction and support role-aware views rather than a separate forum.

Likely operational sections:

- Questions;
- My Questions;
- Published Answers;
- issuer answer queue;
- deadlines/status;
- visibility classification where canonical.

Future Addendum/Change Review should show:

- what version changed;
- affected sections/requirements;
- materiality/status;
- new dates/deadlines;
- required responder acknowledgment where applicable;
- effect on an in-progress response.

Wave 4 UI should not display fake Q&A/addendum tabs just to reserve space. The transaction-navigation pattern must simply be extensible enough to add them later.

## 19. Future Evaluation Workspace seam

Evaluation is an Operational Workspace and a future consumer of the same requirement/response/evaluation-definition lineage established in Wave 4.

Potential future sections:

- Instructions / evaluation basis;
- Conflict-of-interest/eligibility gate;
- Responses;
- Compliance;
- Criteria;
- Individual assessment;
- Clarifications;
- Comparison;
- Consensus;
- Recommendation/selection approval.

Key UX invariant for convergence:

> An evaluator should never need a separate reconstructed copy of the RFx or response. The evaluator view links the published requirement/evaluation criterion to the immutable submitted response artifact.

The platform may organize evaluation; the UI must not imply an algorithm autonomously selects the winner.

## 20. Future Selection / Outcome workspace seam

Selection and downstream outcome are later transaction stages, not a new CRM opportunity record.

Future selection may show:

- selected response/organization;
- recommendation/approval provenance;
- notification state;
- non-selection/debrief seams;
- connection/execution next step appropriate to RFx type.

Future outcome may capture:

- connected / not connected / cancelled / other typed result;
- relationship/progression state;
- reported economic activity where permitted;
- verification/evidence status where later supported;
- intelligence/audit event linkage.

Do not design the outcome UX as a full ERP/project-management replacement.

## 21. Status and state presentation

Canonical lifecycle/state machines will be decided by convergence. UX requirements are:

- always use typed state labels, not color alone;
- RFx state, pursuit state, response state, submission state, invitation state and future evaluation state remain visually distinct;
- discovery source labels (Discovered, Potential Match, Invited) remain distinct from qualification/credibility;
- commercial/Founding/provider status never changes RFx qualification visual language;
- destructive/consequential transitions require explicit confirmation where domain policy requires it;
- stale client state must reconcile to current authoritative server state.

The design system's example Draft / Published / Closed labels are presentation examples, not this lane's authority to define the full lifecycle.

## 22. Action hierarchy

Every RFx surface should expose one clear dominant action.

Examples:

- Builder → Continue / Review RFx;
- Readiness → Resolve next blocker / Preview;
- Preview → Publish RFx;
- Opportunity detail → Assess / Pursue;
- Pursuit → Pursue / Watch / Decline decision;
- Gap → Find teammate / Find resource;
- Response → Complete next requirement;
- Readiness → Review submission;
- Final review → Submit or Open external submission destination;
- Team invitation → Accept / Decline.

Do not create rows of equally styled actions that obscure the current decision.

## 23. Notifications inside the UX

This lane does not define the canonical notification event catalog, but RFx workspaces must provide stable deep-link destinations for later communications.

Examples:

- opportunity alert → selected opportunity detail;
- deadline reminder → pursuit/response readiness;
- team invite → invitation review;
- hosted submission receipt → immutable receipt;
- future Q&A answer → question/answer context;
- future addendum → change review/acknowledgment;
- future evaluator assignment → evaluation workspace.

A notification should return the user to the exact transaction context, not merely the Opportunities landing page.

## 24. Privacy and projection rules for UX

UX must render the projection appropriate to the actor and authorization context.

At minimum keep distinct:

- anonymous/public opportunity projection;
- authenticated participant opportunity projection;
- responder-private pursuit assessment;
- responder response draft;
- immutable submitted response;
- issuer-owned RFx source/definition;
- invitee minimum-necessary RFx/team context;
- future evaluator-authorized submission/evaluation context.

The presence of a URL, marker, notification or invitation cannot expand data visibility.

Private responder Go/No-Go notes, internal pricing considerations, gaps, drafts and contributor activity must not leak into issuer/public projections unless a later canonical feature explicitly authorizes sharing.

## 25. Desktop interaction matrix

### Spatial

- full remaining map viewport;
- result drawer typically one edge;
- selected detail may replace result contents while preserving map;
- search/filter remains singular and compact;
- contextual route into Operational Workspace opens as a focused navigation transition, not an enormous form drawer.

### Operational

- readable central work column with optional bounded secondary context;
- wide tables/matrices use available width without turning the full product into an enterprise dashboard;
- transaction context remains visible during long tasks;
- section progress and validation stay local to the transaction.

## 26. Mobile interaction matrix

### Spatial

- map-first;
- bottom sheet for result/detail;
- collapsed/half/full sheet detents where implementation supports them accessibly;
- preserve selected marker/context whenever possible;
- primary action reachable at the sheet edge/bottom.

### Operational

- one main task/section per viewport;
- compact transaction identity/status;
- responsive tables become structured rows/accordions without losing requirement identity;
- sticky primary action only where it does not obscure form content;
- dialogs become full-height sheets when appropriate;
- no horizontal overflow for ordinary workflows.

## 27. Accessibility requirements

RFx Core should target WCAG AA behavior consistent with the design system.

Required UX intent:

- keyboard-operable section navigation, drawers, sheets and actions;
- visible focus;
- meaningful labels for status/icon actions;
- semantic tables for compliance/evaluation matrices on desktop;
- equivalent structured mobile reading path;
- map opportunity/partner discovery has a non-spatial result/list path;
- deadline/state not communicated by color alone;
- validation messages associated with exact fields/requirements;
- screen-reader announcement for consequential state changes such as publish/submit success/failure;
- reduced motion behavior;
- touch targets ~44px on mobile.

## 28. Empty, loading and error states

### Empty discovery

Do not show a dead blank map. Explain whether:

- no opportunities match current filters;
- no opportunities are currently visible in this geography;
- the network/geography is unavailable or unreleased;
- broader filters/geography are legitimate next actions.

### Empty response

If a response cannot be created, explain the canonical reason: not pursuing, RFx closed, unsupported external-only mode, missing authority or other typed condition.

### Loading

Keep known transaction identity/context visible where possible. Avoid skeleton layouts that imply sensitive data before authorization resolves.

### Errors

Consequential errors must tell the user:

- what failed;
- whether work was saved/unchanged;
- what state remains authoritative;
- whether retry is safe;
- exact remediation where known.

## 29. Feature-to-surface coverage

Every current Wave 4 Feature ID has a proposed UX home. This is coverage planning, not final slice authority.

| Feature | Proposed primary surface |
| --- | --- |
| `ISS-001` | RFx transaction shell/context across issuer/responder views |
| `ISS-002` | RFx creation/type selector + type-aware builder modules |
| `ISS-003` | Create RFx entry |
| `ISS-005` | RFx Builder |
| `ISS-006` | Requirements module |
| `ISS-007` | Supplier Fit / Criteria module |
| `ISS-009` | Evaluation Definition module |
| `ISS-011` | Structured package/module composition |
| `ISS-016` | Review & Publish readiness |
| `ISS-018` | Responder Preview |
| `ISS-019` | Publish confirmation + Published Issuer Overview |
| `ISS-020` | Capability/entitlement messaging at gated advanced actions |
| `ACQ-009` | Share action + controlled public opportunity route |
| `DSC-004` | Opportunity Discovery Spatial Workspace |
| `DSC-005` | Saved search management inside discovery |
| `DSC-006` | Alert preference entry/deep-link destinations |
| `DSC-007` | Watch action/relationship |
| `DSC-008` | Deadline/timeline surfaces in discovery/pursuit |
| `RSP-001` | Discovery-source label on result/detail/pursuit |
| `RSP-002` | Opportunity detail + Why this surfaced / fit summary |
| `RSP-003` | Pursuit Workspace |
| `RSP-004` | Pursue / Watch / Decline decision controls |
| `RSP-006` | Requirement fit / Gap Resolution |
| `RSP-007` | Find a teammate action from a gap |
| `RSP-008` | Find a resource action from a gap |
| `DSC-010` | Partner Discovery Spatial Workspace |
| `RSP-009` | Response Workspace creation/overview |
| `RSP-010` | Requirement Compliance Matrix |
| `RSP-017` | Live response readiness |
| `RSP-018` | Final administrative validation |
| `RSP-019` | Final Submission Review |
| `RSP-020` | Hosted Submit + Submission Receipt |
| `RSP-021` | External Submission Handoff |
| `TEM-001` | RFx-scoped Partner Discovery context |
| `TEM-002` | Prepare/Send Team Invitation |
| `TEM-003` | Invitation Review / Accept / Decline |
| `TEM-004` | Nonbinding boundary in send/review flow |
| `ACQ-007` | External team-invite entry → registration/onboarding → invitation return |
| `EDU-011` | First-use issuer contextual education |
| `EDU-012` | First-use responder contextual education |
| `EDU-013` | First-use teaming contextual education |

**Coverage check: all 41 current Wave 4 Feature IDs have one primary UX home.**

## 30. Cross-workspace continuity requirements

The later convergence pass should ensure these context handoffs are first-class:

1. Discovery map → Opportunity Detail
2. Opportunity Detail → Pursuit Workspace
3. Pursuit Gap → Partner Discovery → Team Invitation → back to Pursuit/Response
4. Pursuit Gap → Resource Discovery → back to Pursuit/Response
5. Pursue → Response Workspace
6. Response requirement → exact source RFx requirement
7. Response readiness → exact blocking item
8. Final Review → source response section
9. Hosted Submit → immutable receipt
10. External handoff → prepared package + destination without fabricated receipt
11. Public/share acquisition → same permitted opportunity context after legitimate activation
12. Non-member team invite → same invitation after legitimate activation
13. Future addendum → affected in-progress response requirements
14. Future evaluator view → immutable submission + source requirements/evaluation criteria

Context handoff must use typed IDs/domain contracts, not only browser return URLs or free-form query strings.

## 31. Decisions intentionally deferred to RFx Core convergence

This lane deliberately does **not** decide:

- canonical RFx lifecycle states/transitions;
- pursuit state machine details beyond user-facing intent;
- response/submission state machine;
- final RFx type catalog;
- exact permissions/roles;
- addendum/version semantics;
- evaluator assignment/COI/scoring models;
- exact requirement/criterion schemas;
- whether every module/tab name above is canonical product copy;
- entitlement limits/pricing;
- notification event definitions;
- final Wave 4 slice decomposition.

Those decisions require the Domain Kernel, Requirements/Response/Evaluation, Governance/Permissions and other parallel workstreams to converge together.

## 32. Convergence questions exposed by UX

The Extra High convergence pass should explicitly answer:

1. What is the canonical RFx transaction header/status vocabulary by actor?
2. Can an RFx be edited after publication, and if so through what version/addendum mechanism?
3. Which RFx modules are required by each RFx type?
4. What exact requirement answer types must Wave 4 support?
5. What supplier criteria are public, participant-only or issuer-internal?
6. Which evaluation-definition fields are visible to responders before submission?
7. When does Pursue create a Response: immediately or on explicit Start Response?
8. Is Watch a pursuit state, saved relationship or distinct object?
9. How are invited organizations represented before they choose Pursue?
10. What team participation information becomes visible within the response workspace?
11. Which team changes are allowed after response creation/submission?
12. What authoritative event freezes the requirement/version set for a hosted submission?
13. Can a responder revise/replace a hosted submission before deadline, and how is history shown?
14. What evidence, if any, may support recording external submission status beyond handoff?
15. Which post-publication issuer actions belong in Wave 4 versus Wave 5?
16. How should future evaluator navigation appear without creating a separate procurement application shell?
17. Which participant roles may see submitted responses and at what transaction state?
18. How do Q&A/addenda changes surface in a response already in progress?
19. Which UX surfaces need transaction-level collaboration indicators without implementing Wave 5 collaboration prematurely?
20. What exact map markers/visual relationships represent issuer, opportunity and team/resource search without overloading the spatial canvas?

## 33. UX acceptance intent for later implementation

When RFx Core is eventually implemented, product acceptance should verify at minimum:

- one participant shell across RFx participant surfaces;
- discovery/partner/resource exploration use Spatial Workspace when geography is integral;
- authoring/pursuit/response/submission use Operational Workspace;
- no permanent participant left primary navigation rail;
- no stacked global/route/map headers;
- all 41 Wave 4 features have a coherent visible home without duplicate competing workflows;
- issuer requirement identity remains traceable into response/compliance surfaces;
- discovery/match language never implies qualification or endorsement;
- private responder assessment remains private;
- teammate/resource actions preserve RFx/gap context;
- team invitation language preserves the nonbinding legal boundary;
- response readiness deep-links to exact blockers;
- final review is derived from the canonical response rather than copied into a second document;
- hosted submission produces authoritative locked receipt behavior only after server validation;
- external handoff never falsely claims external receipt;
- public/share/invite context never grants authority;
- desktop/mobile workflows preserve hierarchy and accessibility;
- future Q&A/addendum/evaluation/outcome areas can be added without replacing the shared workspace architecture.

## 34. Planning exit

This lane is complete when the RFx Core convergence review can answer two questions without inventing a second UX system:

1. **Where does each actor do the work?**
2. **How does the user move from one RFx transaction stage to the next while preserving one canonical transaction identity?**

The proposed answer is one participant shell, Spatial Workspace for geographic discovery/connection, Operational Workspace for focused transaction work, and typed context handoffs between role-specific projections of the same RFx transaction.
