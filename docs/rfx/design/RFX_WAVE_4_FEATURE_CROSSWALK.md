# Wave 4 RFx Core Feature Crosswalk

**Status: PARALLEL PLANNING ANALYSIS — NON-CANONICAL UNTIL RFx CORE CONVERGENCE REVIEW**

This document maps every Feature ID currently assigned to **Wave 4 — RFx Core** into one coherent transaction architecture. It is a planning artifact for later convergence; it does **not** authorize Wave 4 implementation, alter Feature-ID completion state, or replace `docs/tracking/RFxchange_DEPENDENCY_MAP.md` as sequencing authority.

## 1. Purpose

Wave 4 is the first live end-to-end RFx transaction wave. The source tracker describes its scope as:

> Basic end-to-end need → RFx → match → respond → submit.

The crosswalk exists to ensure the 41 Wave 4 features are implemented as one connected product rather than as unrelated issuer, discovery, response, teaming, acquisition and education subsystems.

The governing product invariant is:

> **One structured RFx transaction model serves issuer, responder, discovery, teaming, submission and later evaluation views.** A generated document, public opportunity card, responder workspace, submission package or later evaluator view is a projection of or linked artifact around that structured transaction; none becomes a competing canonical RFx record.

Wave 5 retains the substantive evaluation/award, Q&A/addenda, advanced collaboration, outcomes and trust/engagement workflows. Wave 4 must create stable seams for those later capabilities without silently implementing or claiming them complete.

## 2. Source and authority rules

This analysis was produced from:

- `AGENTS.md`;
- `docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md` for the live Wave 4 Feature-ID set;
- the approved feature-register source/provenance for the detailed feature descriptions, seeded dependencies and acceptance intent;
- normalized RFx transaction-cycle, acquisition, organization, map and business-model context already preserved in the repository.

Rules for using this crosswalk:

1. Preserve all approved Wave 4 Feature IDs exactly once.
2. Treat the `Current dependency` column as provenance, not automatic architecture truth.
3. Treat `Dependency/convergence note` as a proposed review finding only. No dependency changes become canonical until reviewed and written to the canonical dependency map.
4. Proposed object/contract names are vocabulary for convergence, not final schema names.
5. Wave 5/6/7 features referenced as seams remain future scope unless separately authorized.

## 3. Coverage

Wave 4 contains **41 Feature IDs**:

| Source family | Count | IDs |
| --- | ---: | --- |
| Acquisition & Public Experience | 2 | `ACQ-007`, `ACQ-009` |
| Onboarding & Education | 3 | `EDU-011`, `EDU-012`, `EDU-013` |
| Discovery & Intelligence | 6 | `DSC-004`, `DSC-005`, `DSC-006`, `DSC-007`, `DSC-008`, `DSC-010` |
| RFx Issuer | 12 | `ISS-001`, `ISS-002`, `ISS-003`, `ISS-005`, `ISS-006`, `ISS-007`, `ISS-009`, `ISS-011`, `ISS-016`, `ISS-018`, `ISS-019`, `ISS-020` |
| RFx Responder | 14 | `RSP-001`, `RSP-002`, `RSP-003`, `RSP-004`, `RSP-006`, `RSP-007`, `RSP-008`, `RSP-009`, `RSP-010`, `RSP-017`, `RSP-018`, `RSP-019`, `RSP-020`, `RSP-021` |
| Teaming | 4 | `TEM-001`, `TEM-002`, `TEM-003`, `TEM-004` |
| **Total** | **41** | **Every Wave 4 tracker ID accounted for once** |

## 4. Transaction-stage vocabulary

The full RFx product cycle remains:

`Need → Build RFx → Publish → Discover/Match → Qualify → Respond → Evaluate → Select/Award → Execute/Connect → Outcome → Intelligence`

Wave 4 directly implements the live path through **Submit** and establishes the structured evaluation-definition seam used later by Wave 5.

For this crosswalk the stages are normalized as:

- **Need/Entry** — an organization begins an RFx, receives a team invitation or enters from a public/share path.
- **Build** — issuer defines RFx type, package, requirements, supplier criteria and evaluation criteria.
- **Validate/Preview** — issuer proves the structured RFx is publishable and sees the responder projection.
- **Publish/Project** — authoritative publication creates the live opportunity projection and downstream events.
- **Discover/Manage** — organizations search, save, watch and receive deadline/alert behavior.
- **Qualify/Decide** — a responder understands fit, decides whether to pursue and identifies gaps.
- **Gap/Team** — responder resolves missing capabilities/resources and may form a nonbinding RFx team.
- **Respond** — a requirement-driven response is constructed against the RFx.
- **Readiness/Submit** — response is validated, reviewed and either locked/received by RFxchange or handed off externally.
- **Education/Cross-cutting** — just-in-time education and commercial/product-policy seams support the transaction without becoming parallel business objects.

## 5. Provisional contract vocabulary

These names are intentionally provisional but provide a common language for parallel design lanes:

- `RFx` — canonical organization-owned request transaction.
- `RFxType` — request-type definition/profile controlling required modules and behavior.
- `RFxRequirement` — stable, addressable issuer requirement or requested response element.
- `SupplierCriterion` — required/preferred supplier/capability matching criterion.
- `EvaluationCriterion` — issuer-defined criterion preserved for later evaluation against submitted responses.
- `RFxPackage` — structured composition of overview, scope, requirements, deliverables, schedule, commercial information, evaluation definition, attachments, terms and response instructions.
- `PublicOpportunityProjection` — privacy-safe, permission-safe discoverable projection of a published RFx.
- `Pursuit` — organization-specific relationship to an RFx such as watching, pursuing or declining; final states require convergence review.
- `MatchExplanation` — non-authoritative explanation of why an opportunity may fit; never qualification or endorsement.
- `GapAssessment` — missing/unconfirmed capability, criterion or requirement context for a prospective responder.
- `Response` — organization-owned response workspace linked to the RFx and the applicable RFx version/requirement set.
- `ResponseRequirementItem` — responder-side completion object linked to a stable issuer requirement/response instruction.
- `Submission` — immutable submitted version for hosted RFxs, distinct from the editable response workspace.
- `SubmissionReceipt` — immutable receipt/evidence for an RFxchange-hosted submission.
- `ExternalSubmissionHandoff` — auditable preparation/handoff event that does not falsely claim external receipt.
- `TeamInvitation` — RFx-scoped invitation defining proposed capacity/context without creating a legal teaming relationship.
- `TeamParticipation` — accepted RFx-scoped participation context, not itself a subcontract/JV/teaming agreement.
- `ShareLink` — revocable/controlled share reference resolving through the permitted public RFx projection.

## 6. Implementation-family legend

The 41 features fall more naturally into eight implementation families than their six source-domain labels suggest:

- **F1 — RFx Kernel & Request Typing**
- **F2 — Issuer Authoring & Definition**
- **F3 — Publication, Public Projection & Product Boundary**
- **F4 — Opportunity Discovery & Pursuit**
- **F5 — Gap, Partner & Resource Resolution**
- **F6 — Response Construction & Submission**
- **F7 — RFx Teaming & Team Acquisition**
- **F8 — Just-in-Time RFx Education**

These are planning families, not authorized Wave 4 slices.

## 7. Complete Wave 4 crosswalk

| Feature | Source intent | Primary actor | Stage | Primary objects/contracts | Current dependency | Produces / hands off | Family | Dependency / convergence note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ISS-001` | Unified structured RFx object/workflow shared across issuer, responder and later evaluation states. | Issuer / platform | Build | `RFx`, ownership, lifecycle root, organization asset scope | `ARC-009` | Canonical RFx identity and transaction root for every downstream feature | F1 | Seeded dependency is directionally sound. Convergence must make RFx organization ownership, state/version identity and projection boundaries explicit. |
| `ISS-002` | Support multiple request types: RFI, RFQ, RFP, Sources Sought/capability, supplier/subcontractor and lighter product/service/partner requests. | Issuer | Build | `RFxType`, module profile, submission mode/defaults | `ISS-001` | Typed RFx behavior/required-module contract | F1 | Preserve one RFx model; types configure behavior rather than create separate schemas/workflows. |
| `ISS-003` | Start from blank, reusable template or prior RFx. | Issuer | Need/Build | RFx creation source, template/reference snapshot | `ISS-001` | New RFx draft derived from an allowed source | F2 | Core creation must not require future paid template/history features. Define extensible creation-source contract; later entitlements may gate template/prior-RFx options. |
| `ISS-005` | Modular builder: Need → Scope → Deliverables → Requirements → Schedule → Commercial Terms → Evaluation. | Issuer | Build | `RFxPackage`, module completion state | `ISS-001` | Structured draft package | F2 | Establish composable modules so simple requests stay light while formal RFxs can grow without parallel builders. |
| `ISS-006` | Capture detailed structured requirements, locations, quantities, schedule, term, value, insurance, licenses, certifications, qualifications, geography and documents. | Issuer | Build | `RFxRequirement`, structured requirement fields, response instructions | `ISS-005` | Stable requirement set consumed by discovery, gap analysis and response construction | F2 | Stable requirement identity is a high-value convergence requirement; later response/evaluation linkage must survive versions/addenda. |
| `ISS-007` | Define required/preferred capability, credential, experience, radius, capacity and other matching criteria beyond NAICS. | Issuer | Build | `SupplierCriterion`, required/preferred semantics | `ISS-006` | Match/gap input for discovery and responder readiness | F2 | Consume Wave 3 capability/credential/geography projections where available. Criteria indicate potential fit/eligibility inputs, not automatic qualification. |
| `ISS-009` | Predefine price, technical, experience, schedule, qualification, capacity, past-performance, local-service or custom evaluation criteria. | Issuer | Build | `EvaluationCriterion`, criterion-to-requirement linkage | `ISS-005` | Immutable-at-publication evaluation definition seam for Wave 5 | F2 | Proposed dependency should include the stable requirement model (`ISS-006`). Wave 4 defines criteria; Wave 5 owns substantive evaluator scoring/selection workflows. |
| `ISS-011` | Maintain RFx package sections as structured components. | Issuer / responder projection | Build | `RFxPackage`, sections/modules | `ISS-005` | Canonical structured package for issuer view and responder projection | F2 | Package composition should consume requirements and evaluation definition, suggesting `ISS-006` + `ISS-009` as architectural inputs in addition to `ISS-005`. |
| `ISS-016` | Validate required info, dates, evaluation, response requirements, attachments, geography, issuer authority and approvals before publish. | Issuer / platform | Validate | readiness result, validation findings, authority check | `ISS-005` | Publish readiness decision with explainable failures | F2 | Seeded edge is too shallow. Readiness should consume typed RFx/package/requirements/evaluation and authority. Future Wave 5 approval gates must be conditional, not blockers for basic Wave 4 RFxs. |
| `ISS-018` | Preview exactly what responders will see before release. | Issuer | Validate/Preview | responder-facing RFx projection | `ISS-016` | Preview of the same projection contract publication will expose | F2 | Must render from the canonical responder/public projection logic, not from a separate mock document. |
| `ISS-019` | Publish transaction creates opportunity, plots geography, indexes requirements, opens timeline, activates matching/notifications/search and audit lifecycle. | Issuer / platform | Publish/Project | `RFx`, publication event, `PublicOpportunityProjection`, search/map projection, timeline | `ISS-016` | Authoritative published RFx plus downstream event fan-out | F3 | Consider `ISS-018` as a sequencing predecessor even if preview itself is not an authorization condition. Publication must be atomic/idempotent and server-authoritative. |
| `ISS-020` | Basic issuance is free; advanced procurement workflow is plan-gated. | Issuer / platform | Cross-cutting | entitlement/product policy around RFx capabilities | `ISS-019` | Basic free issuance boundary plus extension points for advanced paid tools | F3 | Wave 4 should define truthful free/default capability and entitlement hooks without requiring future Wave 6 checkout/billing flows. Reuse existing organization commercial-state boundary. |
| `ACQ-009` | Generate permitted RFx/opportunity share links for search, social, newsletters and email. | Issuer / member / public visitor | Publish/Entry | `ShareLink`, `PublicOpportunityProjection`, acquisition context | `ACQ-002` | Shareable entry route resolving to permitted RFx public context | F3 | `ACQ-002` supplies public landing semantics, but real Wave 4 links also require `ISS-019`/live public projection. Never expose restricted RFx data by possession of a URL. |
| `DSC-004` | Free organizations can search RFxs and view substantive public requirements. | Responder / network participant | Discover | `PublicOpportunityProjection`, search query/result | none | RFx search/browse result and opportunity detail entry | F4 | Missing live-RFx producer edge: should consume `ISS-019` publication/index projection and the Wave 3 controlled discovery substrate. Search never exposes private/restricted fields. |
| `DSC-005` | Saved opportunity searches with limited free and expanded paid capacity. | Responder | Discover/Manage | saved search definition, ownership, entitlement limit | `DSC-004` | Persisted search criteria feeding later alert evaluation | F4 | Seeded edge is reasonable; entitlement capacity should reuse the commercial-state policy boundary, not hard-code payment logic. |
| `DSC-006` | Opportunity alerts/digests; basic free and more configurable higher-plan delivery. | Responder / platform | Discover/Manage | alert subscription, saved-search match event, delivery policy | `DSC-005` | Notification event/request with deep link to current opportunity | F4 | Add Wave 3 communications reliability (`COMMS-003/004/005`) as a convergence dependency/seam. Alert matching and delivery are separate concerns. |
| `DSC-007` | Paid users can watch opportunities for updates/deadlines. | Responder | Discover/Manage | watch entry / pursuit relation, entitlement | `DSC-004` | Watched-opportunity relationship used by timeline/deadline UI | F4 | Define watch as organization/user-scoped relationship to RFx, not a duplicate opportunity record. Commercial gating must remain policy-driven. |
| `DSC-008` | Track and surface deadlines for saved/pursued opportunities. | Responder / platform | Discover/Manage | deadline projection, saved/watch/pursuit references | `DSC-004` | Deadline state, approaching/expired events and workspace reminders | F4 | Seeded edge does not express its real inputs. Needs a normalized relationship model supporting saved/watched/pursued RFxs; do not duplicate canonical RFx dates. |
| `RSP-001` | Label RFx source as Discovered, Potential Match or Invited; none means qualified/endorsed. | Responder | Discover/Qualify | discovery-source attribution, opportunity projection | `DSC-004` | Explainable entry/source label | F4 | Preserve strict semantics: source is how the RFx surfaced, never qualification, endorsement or award likelihood. |
| `RSP-002` | Show match explanation and requirement summary: alignment, confirmations, gaps, deadline, value, issuer, location, evaluation and dates. | Responder | Qualify | `MatchExplanation`, requirement/evaluation summary, public issuer/location projection | `RSP-001` | Bounded opportunity-fit explanation | F4 | Consume published requirement, criteria and evaluation-definition projections. Do not infer eligibility from missing/unverified organization data. |
| `RSP-003` | Go/No-Go workspace for fit, eligibility, capacity, economics, competition context and gaps. | Responder | Qualify/Decide | pursuit assessment, `GapAssessment`, responder-entered considerations | `RSP-002` | Decision-ready assessment | F4 | Keep private responder decision data separate from issuer-visible RFx/response data. “Competition context” must remain legitimate/non-sensitive. |
| `RSP-004` | Persist Pursue / Watch / Decline and change workflow state accordingly. | Responder | Qualify/Decide | `Pursuit` relationship/state | `RSP-003` | Organization-specific pursuit state; Pursue unlocks response construction | F4 | Convergence should define this state machine centrally. `PURSUE` should be an explicit predecessor for response workspace creation. |
| `DSC-010` | Search/recommend organizations that fill opportunity capability/geography gaps. | Responder / teammate seeker | Gap/Team | partner discovery query/result, capability/geography filters | none | Candidate partner results for an RFx gap | F5 | This should be the reusable discovery/search capability for partner finding. It should consume Wave 3 organization discovery and RFx gap context, not Wave 5 recommendations. |
| `RSP-006` | Identify missing/unconfirmed capabilities or requirements against organization profile. | Responder / platform | Qualify/Gap | `GapAssessment`, requirement/supplier-criterion alignment | `ISS-007` | Typed gaps with known/unknown/missing semantics | F5 | Should consume `ISS-006` requirements as well as `ISS-007` supplier criteria and Wave 3 profile/credential projections. Missing evidence is not automatically failure. |
| `RSP-007` | Offer Find a teammate scoped to a detected RFx gap. | Responder | Gap/Team | gap-to-partner-search command/context | `RSP-006` | Contextual transition into partner discovery | F5 | Avoid duplicate search logic: this is the responder action/orchestration layer; `DSC-010` supplies partner discovery and `TEM-001` supplies RFx teaming workflow context. |
| `RSP-008` | Offer relevant provider assistance such as APEX, financing, workforce or certification support for a gap. | Responder | Gap/Resource | gap-to-resource context, provider discovery request | `RSP-006` | Contextual transition into official resource discovery/connection | F5 | Reuse Wave 3 `DSC-011`/provider profile and routing contracts. Wave 4 must not create a second provider directory/referral system. |
| `RSP-009` | Create a requirement-driven response workspace directly from issuer requirements when Pursue is selected. | Responder | Respond | `Response`, requirement snapshot/reference set, response items | `ISS-006` | Organization-owned response workspace linked to RFx/version | F6 | Seeded dependency omits the responder decision. Proposed convergence predecessor: `RSP-004 = Pursue` plus stable published requirement contract. |
| `RSP-010` | Track every required response element and completion state in a compliance checklist/matrix. | Responder | Respond | `ResponseRequirementItem`, compliance matrix, completion status | `RSP-009` | Requirement-by-requirement response readiness structure | F6 | Must link to stable issuer requirement/response-instruction IDs rather than copy untraceable text. This is the core RFx ↔ response linkage seam. |
| `RSP-017` | Continuously check required components, pricing, credentials, attachments and addenda acknowledgment. | Responder / platform | Respond/Readiness | completeness evaluator, validation findings | `RSP-010` | Live readiness status with explicit missing items | F6 | Wave 5 addenda/collaboration features are optional extension inputs. Validator must not require future features that are not enabled for the RFx. |
| `RSP-018` | Run final administrative validation before submission. | Responder / platform | Readiness | final readiness result, submission-mode validation | `RSP-017` | Authoritative ready/not-ready decision with remediation | F6 | Must re-read canonical RFx deadline/version/requirements and submission mode at action time; stale client completion cannot authorize submit. |
| `RSP-019` | Review assembled package, pricing, attachments, team, representations and addenda before submit. | Responder | Readiness/Submit | assembled response projection, final attestations/review | `RSP-018` | Human final-review checkpoint before submission/handoff | F6 | Team/addenda sections must be conditional. The review surface must be generated from the canonical response, not become a second response document. |
| `RSP-020` | Timestamp/lock hosted submission and generate immutable receipt/version. | Responder / platform / issuer receiver | Submit | `Submission`, `SubmissionReceipt`, immutable submitted version | `RSP-019` | Auditable hosted submission and receipt | F6 | Applies only when the RFx submission authority is hosted by RFxchange. Must be atomic/idempotent; editable response and submitted version remain distinct. |
| `RSP-021` | Prepare in RFxchange then route to an external submission system without falsely recording submission. | Responder / platform | Submit | `ExternalSubmissionHandoff`, destination/instructions, prepared package | `RSP-019` | Auditable handoff/preparation state, never fabricated external receipt | F6 | Hosted and external submission are mutually exclusive terminal modes for a given submission action. External receipt/award authority remains external unless independently verified. |
| `TEM-001` | Search organizations by missing capability, service geography, role and opportunity need. | Responder / team lead | Gap/Team | RFx-scoped team search context, partner results | `DSC-009` | RFx-specific partner-search workflow | F7 | **Dependency defect candidate:** `DSC-009` is Wave 5 advanced opportunity recommendation, while `TEM-001` is Wave 4 core. Proposed architecture: consume `RSP-006` gap context + reusable `DSC-010` partner discovery instead. |
| `TEM-002` | Invite an organization to an RFx in a defined proposed role/capacity. | Responder / team lead | Gap/Team | `TeamInvitation`, RFx/pursuit context, proposed capacity | `TEM-001` | Pending RFx-scoped team invitation | F7 | Invitation must carry minimum necessary RFx context and must not grant organization/RFx authority merely by token/link possession. |
| `TEM-003` | Invitee reviews opportunity, issuer, role and requirements and accepts/declines. | Invitee organization | Gap/Team | `TeamInvitation`, `TeamParticipation` | `TEM-002` | Accepted/declined invitation state | F7 | Acceptance creates only the platform teaming context permitted by this wave; it is not a subcontract/JV/legal teaming agreement. |
| `TEM-004` | Explicit nonbinding team-formation disclaimer. | Team lead / invitee | Gap/Team | legal-boundary acknowledgment/presentation | `TEM-002` | Evidenced presentation of nonbinding boundary | F7 | Must align with `EDU-013`; legal boundary is substantive product behavior, while EDU-013 is just-in-time explanation. |
| `ACQ-007` | Non-member team invitee registers, completes organization setup and returns to the team invitation/opportunity. | External invitee | Need/Entry/Team | `TeamInvitation`, acquisition-context envelope, invitation delivery | none | Resumable external-to-member team invitation journey | F7 | Missing dependencies. Proposed convergence: Wave 2 `ACQ-003` context preservation + `TEM-002` invitation + Wave 3 transactional communications reliability. Registration context never grants team acceptance or RFx authority. |
| `EDU-011` | First RFx creation education: publication, visibility, requirements, deadlines, evaluation, addenda, authority and accuracy. | First-time issuer | Education/Build | contextual education checkpoint | none | Just-in-time issuer explainer inside canonical authoring/publish flow | F8 | Must be feature-aware: addenda/advanced approvals remain Wave 5. Education may explain future lifecycle concepts without pretending disabled functionality is available. |
| `EDU-012` | First RFx response education: requirements, compliance, submission, team members, deadlines and external submission where applicable. | First-time responder | Education/Respond | contextual education checkpoint | none | Just-in-time responder explainer tied to actual submission mode/workspace | F8 | Should consume the response/submission contracts (`RSP-009` onward); only explain external submission when the RFx actually uses that mode. |
| `EDU-013` | First teaming invitation education explaining that invitation is not itself a subcontract, JV, teaming agreement or legal relationship. | First-time team lead / invitee | Education/Team | contextual education checkpoint, legal-boundary copy | none | Just-in-time teaming explainer | F8 | Align with `TEM-004`; education cannot substitute for the required legal-boundary behavior in the invitation workflow. |

## 8. Family view and natural build clusters

This view is intentionally **not** a final Wave 4 roadmap. It shows the coherent implementation clusters exposed by the crosswalk.

### F1 — RFx Kernel & Request Typing — 2 features

`ISS-001`, `ISS-002`

Creates the canonical RFx identity, organization ownership, type configuration and state/version seams used by every other family.

### F2 — Issuer Authoring & Definition — 8 features

`ISS-003`, `ISS-005`, `ISS-006`, `ISS-007`, `ISS-009`, `ISS-011`, `ISS-016`, `ISS-018`

Builds one structured issuer authoring model from need through publish readiness. The highest-value architecture seam is stable requirement/criterion identity so response and future evaluation never need to reverse-engineer a generated solicitation document.

### F3 — Publication, Public Projection & Product Boundary — 3 features

`ISS-019`, `ISS-020`, `ACQ-009`

Turns a ready RFx into a live opportunity and defines controlled sharing plus free/advanced capability boundaries.

### F4 — Opportunity Discovery & Pursuit — 9 features

`DSC-004`, `DSC-005`, `DSC-006`, `DSC-007`, `DSC-008`, `RSP-001`, `RSP-002`, `RSP-003`, `RSP-004`

Consumes the published opportunity projection, lets organizations discover/manage RFxs, explains fit without claiming qualification and creates the responder pursuit relationship.

### F5 — Gap, Partner & Resource Resolution — 4 features

`DSC-010`, `RSP-006`, `RSP-007`, `RSP-008`

Transforms requirements/supplier criteria into explainable gaps and routes those gaps into existing partner/resource discovery systems.

### F6 — Response Construction & Submission — 7 features

`RSP-009`, `RSP-010`, `RSP-017`, `RSP-018`, `RSP-019`, `RSP-020`, `RSP-021`

Creates the requirement-linked response, continuously proves completeness and terminates in either an immutable hosted submission or an explicitly external handoff.

### F7 — RFx Teaming & Team Acquisition — 5 features

`TEM-001`, `TEM-002`, `TEM-003`, `TEM-004`, `ACQ-007`

Uses the partner-discovery capability in an RFx-specific teaming journey while preserving the legal/non-authority boundary and supporting non-member acquisition.

### F8 — Just-in-Time RFx Education — 3 features

`EDU-011`, `EDU-012`, `EDU-013`

Explains the real workflow at first use without creating an independent tutorial product or exposing future-wave functionality as if implemented.

**Coverage check: 2 + 8 + 3 + 9 + 4 + 7 + 5 + 3 = 41.**

## 9. High-value convergence findings

### 9.1 `TEM-001` has an apparent cross-wave dependency defect

The source tracker seeds `TEM-001` against `DSC-009` (Advanced opportunity recommendations), but `DSC-009` is a Wave 5 feature and `TEM-001` is Wave 4 core. This would force core RFx teaming through a later recommendation product.

Recommended convergence direction:

`RSP-006 GapAssessment` → `DSC-010 Partner Discovery` → `TEM-001 RFx-scoped teammate search` → `TEM-002 invitation`

Do not update the canonical dependency map from this document alone; review this edge during RFx Core convergence.

### 9.2 `DSC-010`, `TEM-001` and `RSP-007` are complementary, not duplicates

Proposed separation of responsibility:

- `DSC-010` = reusable partner discovery/search capability.
- `TEM-001` = RFx-scoped teaming workflow/search context.
- `RSP-007` = responder action that launches the team-finding path from a detected gap.

A single partner search service can satisfy these without three independent recommendation engines.

### 9.3 `ACQ-007` should reuse the acquisition-context architecture created in Wave 2

The external team invitation is a later consumer of the typed acquisition-context envelope, not a new registration mechanism. The invite link identifies intended navigation/context; it must not grant team membership, organization authority or protected RFx access.

Likely convergence inputs:

- `ACQ-003` — context preservation;
- `TEM-002` — actual invitation;
- Wave 3 communications reliability — invitation delivery and idempotency.

### 9.4 Real RFx discovery/share behavior needs the `ISS-019` publication projection

`ACQ-009` currently points only at the Wave 2 public landing capability, and `DSC-004` has no seeded dependency. Once live RFxs exist, both should consume the authoritative public/participant opportunity projection created by publication.

Conceptually:

`ISS-019 publish` → `PublicOpportunityProjection` → `DSC-004 search/browse` + `ACQ-009 share link`

### 9.5 Publication is the primary RFx integration event

`ISS-019` is more than a status flip. It is the boundary at which a draft becomes eligible for:

- public/participant opportunity projection;
- map presence where permitted;
- search indexing;
- matching;
- saved-search evaluation;
- alerts;
- deadlines/timeline;
- acquisition/share routes;
- audit lifecycle.

Convergence should define an idempotent publication event/transaction rather than letting each downstream feature infer publication independently.

### 9.6 Requirements need stable identity before response work begins

`ISS-006` → `RSP-009` → `RSP-010` makes the core lineage visible:

`RFxRequirement` → `ResponseRequirementItem` → later `EvaluationCriterionAssessment`

Even though substantive evaluation is Wave 5, Wave 4 should create identifiers and version semantics that allow evaluation to assess the exact requirement/criterion/responded content that was published and submitted.

### 9.7 Evaluation definition belongs in Wave 4; evaluator workflow does not

`ISS-009` is necessary before publication because responders must know how the issuer intends to evaluate the request. Wave 4 should persist the evaluation-definition contract. Wave 5 can add:

- evaluator assignment/COI;
- score entry;
- consensus;
- clarifications/negotiation;
- selection/award communications;
- post-award outcome tracking.

Do not make Wave 4’s response/submission path depend on those future workflows.

### 9.8 Basic readiness cannot depend on future premium collaboration/addenda

`ISS-016`, `RSP-017` and `RSP-019` mention approvals, addenda, team state and related artifacts that receive richer implementation in Wave 5. The validator architecture should use **enabled/configured requirements**:

- if an RFx has no approval workflow, no approval artifact is required;
- if no addendum exists, no acknowledgment is required;
- if no team exists, team completeness does not block submission;
- if future premium modules are disabled, core Wave 4 remains complete and truthful.

### 9.9 Hosted and external submission are distinct authority modes

`RSP-020` and `RSP-021` should not be two buttons that can both create “submitted” state.

- **Hosted:** RFxchange is the receiving authority for the submission action and can timestamp, lock and receipt the submission.
- **External:** RFxchange prepares/routes the response but cannot claim receipt by the external authority unless independently confirmed.

The RFx type/configuration should define the permitted submission mode before the responder reaches final readiness.

### 9.10 Wave 4 commercial features should reuse, not rebuild, commercial state

`ISS-020`, `DSC-005`, `DSC-006` and `DSC-007` contain free-vs-paid behavior. Wave 4 should implement capability/limit checks against the existing organization commercial-state/entitlement boundary. It should not pull Wave 6 checkout, billing or plan-purchase implementation forward.

## 10. Proposed dependency corrections for convergence review

The following are **review candidates only**. They are intentionally not written to the canonical dependency map by this planning lane.

| Feature | Seeded dependency | Proposed convergence direction | Reason |
| --- | --- | --- | --- |
| `TEM-001` | `DSC-009` | `RSP-006`, `DSC-010` | Remove Wave 5 recommendation blocker; RFx team search should originate from a detected gap and reusable partner-discovery capability. |
| `ACQ-007` | none | `ACQ-003`, `TEM-002`, communications reliability | Non-member team acquisition requires a real invitation, resumable acquisition context and reliable delivery. |
| `ACQ-009` | `ACQ-002` | `ACQ-002`, `ISS-019` | Public landing semantics plus a real published RFx projection are both required. |
| `DSC-004` | none | `ISS-019` + Wave 3 controlled discovery substrate | Search requires live published opportunity/index projection. |
| `DSC-006` | `DSC-005` | `DSC-005` + `COMMS-003/004/005` seam | Saved-search matching and reliable delivery are separate dependencies. |
| `DSC-008` | `DSC-004` | `DSC-004` + normalized saved/watch/pursuit relationship | Deadline management is driven by relationships to an RFx, not browsing alone. |
| `ISS-009` | `ISS-005` | `ISS-005`, `ISS-006` | Evaluation definition should reference the stable requirement model. |
| `ISS-011` | `ISS-005` | `ISS-005`, `ISS-006`, `ISS-009` | Structured package includes requirements and evaluation definition. |
| `ISS-016` | `ISS-005` | typed RFx + requirements + evaluation + package + issuer authority | Readiness must validate the complete enabled RFx contract, not only builder existence. |
| `RSP-009` | `ISS-006` | `ISS-006`, `RSP-004(Pursue)` | Response workspace should be created from a deliberate pursuit decision against published requirements. |
| `RSP-007` | `RSP-006` | `RSP-006` + `DSC-010`/`TEM-001` seam | Use one partner-discovery implementation and RFx-scoped teaming workflow. |
| `RSP-008` | `RSP-006` | `RSP-006` + Wave 3 resource-discovery/provider seam | Reuse the official resource network rather than duplicate provider routing. |

## 11. Cross-wave seams to preserve

### From Wave 2

- `ACQ-002` public acquisition landing semantics.
- `ACQ-003` typed acquisition context/resumption.
- authoritative organization/geography/profile/marker/OPEN lifecycle.

### From Wave 3

- controlled network/map discovery;
- capability and organization search;
- enriched profile/credentials/locations;
- reliable transactional communications;
- referral/resource-provider systems;
- persistent/contextual education framework.

### Into Wave 5

Wave 4 should expose stable contracts for, but not complete:

- evaluator assignment and COI;
- weighted/locked advanced evaluation behavior;
- scoring/consensus/clarification;
- Q&A/addenda/version enhancements;
- advanced issuer/responder collaboration;
- selection/award communications;
- post-award lifecycle/outcome;
- credibility/trust consequences;
- advanced recommendations and intelligence.

### Into Wave 6+

- advanced templates/reuse;
- premium/private invitation workflows;
- richer entitlements and plan limits;
- billing/checkout decisions;
- advanced AI drafting/qualification;
- institutional integrations and economic intelligence.

## 12. Convergence questions exposed by the crosswalk

The Extra High RFx Core convergence pass should explicitly decide:

1. What is the canonical RFx lifecycle state machine, and which states belong to the RFx versus issuer workflow?
2. What are the supported `RFxType` values at Wave 4 launch, and which behavior is configuration versus subtype logic?
3. How are `RFxRequirement`, response instructions and `EvaluationCriterion` linked and versioned?
4. What is the minimum publish transaction and immutable publication snapshot/version contract?
5. What is the exact `PublicOpportunityProjection` versus authenticated responder projection?
6. What is the responder `Pursuit` state machine and ownership/privacy model?
7. How are unknown, missing, unconfirmed and failed requirements distinguished in `GapAssessment`?
8. What is the canonical `Response` lifecycle and relationship to RFx publication versions?
9. What constitutes an immutable `Submission`, and what can/cannot change afterward?
10. How is hosted versus external submission mode represented and validated?
11. What minimum teaming context is visible to invitees before acceptance?
12. Which entitlement checks are core policy hooks versus future commercial implementation?
13. Which proposed dependency corrections above should become canonical?
14. What final Wave 4 slice decomposition best preserves these object/state boundaries?

## 13. Exit criteria for this planning lane

This Feature Crosswalk lane is complete when:

- all 41 Wave 4 Feature IDs appear exactly once in the crosswalk;
- each feature has an actor, transaction stage, primary object/contract, current dependency, output/handoff and implementation family;
- overlaps are resolved conceptually rather than producing duplicate architecture;
- apparent dependency defects are listed for later canonical review;
- Wave 5+ seams are explicit so future capabilities are not accidentally pulled into Wave 4;
- no Feature ID completion state, tracker count or canonical dependency has been changed;
- Wave 4 implementation remains unauthorized until the repository reaches the appropriate wave exit and explicit authorization is given.
