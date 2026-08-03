# RFx Core feature crosswalk

**Status: CANONICAL PLANNING CROSSWALK — 41 WAVE 4 FEATURE IDs ACCOUNTED FOR; NO FEATURE IS COMPLETE.**

This crosswalk converts the 41 existing Wave 4 tracker items into one coherent implementation sequence. It preserves every Feature ID exactly once and does not add, delete, rename or mark an item complete.

## 1. Coverage

| Source family | Count | IDs |
| --- | ---: | --- |
| Acquisition | 2 | `ACQ-007`, `ACQ-009` |
| Education | 3 | `EDU-011`, `EDU-012`, `EDU-013` |
| Discovery | 6 | `DSC-004`, `DSC-005`, `DSC-006`, `DSC-007`, `DSC-008`, `DSC-010` |
| Issuer | 12 | `ISS-001`, `ISS-002`, `ISS-003`, `ISS-005`, `ISS-006`, `ISS-007`, `ISS-009`, `ISS-011`, `ISS-016`, `ISS-018`, `ISS-019`, `ISS-020` |
| Responder | 14 | `RSP-001`, `RSP-002`, `RSP-003`, `RSP-004`, `RSP-006`, `RSP-007`, `RSP-008`, `RSP-009`, `RSP-010`, `RSP-017`, `RSP-018`, `RSP-019`, `RSP-020`, `RSP-021` |
| Teaming | 4 | `TEM-001`, `TEM-002`, `TEM-003`, `TEM-004` |
| **Total** | **41** | **All Wave 4 RFx Core IDs** |

## 2. Adopted planning slices

| Slice | Purpose | Feature IDs | Count |
| --- | --- | --- | ---: |
| 4.1 | RFx kernel, ownership, request families and draft entry | `ISS-001`, `ISS-002`, `ISS-003` | 3 |
| 4.2 | Need, scope, performance location, value, term and structured requirement foundation | `ISS-005`, `ISS-006` | 2 |
| 4.3 | AMACS capability requirements, response structure and evaluation definition | `ISS-007`, `ISS-009`, `ISS-011` | 3 |
| 4.4 | Publication readiness, responder preview, publication, sharing and basic/advanced boundary | `ISS-016`, `ISS-018`, `ISS-019`, `ISS-020`, `ACQ-009` | 5 |
| 4.5 | Opportunity discovery, saved searches, alerts, watching and deadlines | `DSC-004`, `DSC-005`, `DSC-006`, `DSC-007`, `DSC-008` | 5 |
| 4.6 | Match explanation, Go/No-Go, pursuit and capability-gap assessment | `RSP-001`, `RSP-002`, `RSP-003`, `RSP-004`, `RSP-006` | 5 |
| 4.7 | Gap-to-team/resource routing, teammate discovery, invitation, acceptance and external invite acquisition | `DSC-010`, `RSP-007`, `RSP-008`, `TEM-001`, `TEM-002`, `TEM-003`, `TEM-004`, `ACQ-007` | 8 |
| 4.8 | Requirement-driven response workspace, compliance matrix and continuous readiness | `RSP-009`, `RSP-010`, `RSP-017` | 3 |
| 4.9 | Final validation, assembled review, hosted submission and external handoff | `RSP-018`, `RSP-019`, `RSP-020`, `RSP-021` | 4 |
| 4.10 | Contextual first-use issuer, responder and teammate education | `EDU-011`, `EDU-012`, `EDU-013` | 3 |
| **Total** |  |  | **41** |

## 3. Feature-to-contract crosswalk

### Slice 4.1 — RFx kernel and request families

| Feature | Converged responsibility | Primary contracts |
| --- | --- | --- |
| `ISS-001` | One organization-owned RFx aggregate shared across issuer, responder and future evaluator views. | `RFx`, `RFxVersion`, ownership, lifecycle, append-only events |
| `ISS-002` | AMACS request-family configuration over the single aggregate; no parallel RFI/RFQ/RFP products. | `RequestFamilySnapshot`, family-specific lifecycle/modules/endpoints |
| `ISS-003` | Create from blank; extensible seams for templates/prior RFxs without making paid/future sources mandatory. | `RFxCreationSource`, draft initialization |

### Slice 4.2 — Structured need and requirement foundation

| Feature | Converged responsibility | Primary contracts |
| --- | --- | --- |
| `ISS-005` | Modular operational builder organized by task, not a separate document editor. | `RFxPackage`, module completion, autosave/version conflict |
| `ISS-006` | Structured scope, outputs, requirements, quantities, performance locations, dates, value, term, credentials, insurance and evidence. | `RFxRequirement`, `PerformanceLocation`, `EstimatedValue`, `EngagementTerm` |

### Slice 4.3 — AMACS requirements, response and evaluation definition

| Feature | Converged responsibility | Primary contracts |
| --- | --- | --- |
| `ISS-007` | AMACS-backed required/preferred capabilities and structured qualifiers beyond NAICS. | `CapabilityRequirement`, evidence/credential/geography/capacity qualifiers |
| `ISS-009` | Evaluation method, gates and factors linked to requirements and response evidence; frozen at publication. | `EvaluationDefinition`, `EvaluationFactor`, factor links/weights |
| `ISS-011` | Standardized, expandable response structure using AMACS sections/templates and issuer-added sections. | `ResponseStructure`, `ResponseSectionDefinition` |

### Slice 4.4 — Readiness and publication

| Feature | Converged responsibility | Primary contracts |
| --- | --- | --- |
| `ISS-016` | Server-authoritative publication checks with deep-linked findings and authority revalidation. | `PublicationReadinessResult`, `ReadinessFinding` |
| `ISS-018` | Preview from the same permitted projection used after publication. | `ResponderOpportunityProjection` preview mode |
| `ISS-019` | Atomic/idempotent publication, immutable version snapshot, opportunity projection, geography/index/timeline/events. | `RFxPublished`, `PublicOpportunityProjection` |
| `ISS-020` | Basic issuance available under approved commercial policy; advanced capabilities consume entitlement policy without changing match truth. | RFx capability/entitlement policy |
| `ACQ-009` | Controlled share link resolving through the permitted opportunity projection and existing acquisition context. | `RFxShareLink`, `AcquisitionContext` |

### Slice 4.5 — Opportunity discovery and management

| Feature | Converged responsibility | Primary contracts |
| --- | --- | --- |
| `DSC-004` | Search permitted published RFxs and view substantive permitted requirements. | opportunity search/index/query result |
| `DSC-005` | Save organization/user-scoped searches under commercial policy. | `SavedOpportunitySearch` |
| `DSC-006` | Alerts/digests from saved-search matches through existing reliable communications. | match event, notification request, delivery policy |
| `DSC-007` | Watch an RFx through one relationship model; no duplicate opportunity. | `OpportunityWatch`/pursuit relation |
| `DSC-008` | Surface canonical deadlines for saved/watched/pursued RFxs. | deadline projection and reminder events |

### Slice 4.6 — Fit, decision and pursuit

| Feature | Converged responsibility | Primary contracts |
| --- | --- | --- |
| `RSP-001` | Distinguish Discovered, Potential Match and Invited; none means qualified or endorsed. | discovery-source attribution |
| `RSP-002` | Explain AMACS capability/requirement alignment, confirmations, gaps, dates, value and location. | `MatchExplanation` |
| `RSP-003` | Private responder Go/No-Go assessment for fit, eligibility, capacity, economics and gaps. | `PursuitAssessment` |
| `RSP-004` | Persist Pursue/Watch/Decline and unlock response only after authorized Pursue. | `Pursuit` state machine |
| `RSP-006` | Typed missing/unconfirmed capability, requirement and evidence gaps. | `GapAssessment` |

### Slice 4.7 — Gap resolution and teaming

| Feature | Converged responsibility | Primary contracts |
| --- | --- | --- |
| `DSC-010` | Reuse Wave 3 organization discovery for gap-scoped teammate candidates. | partner discovery query/result |
| `RSP-007` | Route an RFx gap to teammate discovery with context preserved. | gap-to-team command/context |
| `RSP-008` | Route an RFx readiness gap to approved resource-provider discovery; no duplicate provider directory. | gap-to-resource context |
| `TEM-001` | RFx-scoped teammate search by missing capability, role, geography and need. | RFx team search context |
| `TEM-002` | Invite an organization in a defined proposed capacity with minimum necessary context. | `TeamInvitation` |
| `TEM-003` | Invitee reviews and accepts/declines without token possession granting authority. | `TeamParticipation` |
| `TEM-004` | Present/evidence the nonbinding legal boundary. | team-boundary acknowledgment |
| `ACQ-007` | Nonmember invitation survives account/organization activation and returns to the pending invite without auto-acceptance. | acquisition context + communications + invitation |

### Slice 4.8 — Response construction

| Feature | Converged responsibility | Primary contracts |
| --- | --- | --- |
| `RSP-009` | Create an organization-owned response from the published requirement/section snapshot after Pursue. | `Response`, RFx version reference |
| `RSP-010` | Requirement/section-linked compliance matrix with stable IDs. | `ResponseRequirementItem` |
| `RSP-017` | Continuous completeness checks for enabled requirements, sections, pricing, credentials, attachments and acknowledgments. | response readiness findings |

### Slice 4.9 — Review and submission

| Feature | Converged responsibility | Primary contracts |
| --- | --- | --- |
| `RSP-018` | Final server-side validation against current RFx version, deadline, permissions and submission mode. | final readiness result |
| `RSP-019` | Human review of the assembled canonical response projection. | submission review projection/attestation |
| `RSP-020` | Atomic hosted submission, locked submitted version and immutable receipt. | `Submission`, `SubmissionReceipt` |
| `RSP-021` | Explicit external handoff/preparation without false receipt claim. | `ExternalSubmissionHandoff` |

### Slice 4.10 — Contextual education

| Feature | Converged responsibility | Primary contracts |
| --- | --- | --- |
| `EDU-011` | First-use issuer explanation inside the real builder, limited to enabled capabilities. | contextual issuer education state |
| `EDU-012` | First-use responder explanation inside the real response/submission mode. | contextual responder education state |
| `EDU-013` | First-use teaming explanation aligned with `TEM-004`; not a substitute for the legal boundary. | contextual teammate education state |

## 4. Reviewed dependency findings for later dependency-map reconciliation

These findings are adopted by the convergence but do not modify the live dependency map in this documentation PR. They must be reconciled into the dependency map before the affected implementation slice begins.

| Feature | Convergence dependency direction | Reason |
| --- | --- | --- |
| `ISS-009` | add stable requirements from `ISS-006` | Evaluation factors must link to requirement evidence. |
| `ISS-016` | consume `ISS-002`, `ISS-005`, `ISS-006`, `ISS-007`, `ISS-009`, `ISS-011` plus issuer authority | Readiness cannot validate only the outer builder. |
| `ISS-019` | require `ISS-016` and responder preview contract from `ISS-018` | Publication and preview must share the same projection logic. |
| `ACQ-009` | require live `ISS-019` projection plus existing `ACQ-002/003` context | A share link cannot predate the authoritative opportunity. |
| `DSC-004` | require `ISS-019` and the Wave 3 controlled discovery substrate | Search requires a live producer and controlled workspace. |
| `DSC-006` | require `DSC-005` plus `COMMS-003/004/005` | Matching and reliable delivery are separate but both necessary. |
| `RSP-009` | require `RSP-004 = pursue` plus published stable requirements | Response creation must follow an explicit pursuit decision. |
| `TEM-001` | replace seeded `DSC-009` with `RSP-006` + `DSC-010` | Core teaming cannot depend on Wave 5 advanced recommendations. |
| `ACQ-007` | require `ACQ-003`, `TEM-002` and `COMMS-003` | External invitation continuity needs a real invite, context and delivery. |
| `RSP-008` | require the applicable Wave 3 provider service/routing authority | RFx Core reuses rather than duplicates resource discovery. |

## 5. Wave 5 seam

Wave 4 freezes evaluation definitions but does not complete evaluator/award features. `EVA-*`, advanced issuer Q&A/addenda, evaluator assignment/conflicts/scoring/consensus, recommendation/approval, selection/award and outcomes remain later authority.
