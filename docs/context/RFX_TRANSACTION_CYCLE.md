# RFxchange RFx Transaction Cycle

## Core model

RFxchange models a complete economic-request cycle rather than a simple RFP upload/download flow:

```text
Need
→ Build RFx
→ Publish
→ Discover / Match
→ Qualify
→ Respond
→ Evaluate
→ Select / Award / Connect
→ Execute
→ Outcome
→ Intelligence
```

## One RFx object

RFI, Sources Sought, RFQ, RFP, IFB/ITB, qualifications requests, supplier/subcontractor requests, teaming requests, lighter service/product requests and site-selection RFIs use one structured RFx object/workflow engine with AMACS request-family-specific templates and governance.

Do not build an unrelated issuer document builder and responder proposal application. A requirement authored on the issuer side has a stable identity and corresponding responder state and, where applicable, later evaluation state.

Generated documents, public opportunity cards, map beacons, response workspaces and evaluator views are projections or linked artifacts around the same RFx transaction; none becomes a competing canonical RFx record.

## AMACS relationship

AMACS supplies versioned:

- request families and default lifecycles;
- market-capability hierarchy and aliases;
- requirement types and team-coverage constraints;
- response-section/template definitions;
- decision-factor/template definitions;
- readiness rules.

RFxchange snapshots the applicable AMACS release and labels at publication while retaining stable IDs for joins/migrations. Organization capability claims remain RFxchange records and are not verified merely because they reference AMACS.

See `docs/rfx/README.md` and `docs/rfx/AMACS_INTEGRATION_CONTRACT.md`.

## Issuer path

The issuer starts with the need, then defines scope, outputs, structured performance location, structured value, structured engagement term, requirements, schedule, commercial terms, response structure and evaluation method.

Capability requirements use AMACS concepts plus separate credential, experience, geography, capacity, delivery and evidence qualifiers rather than free text or broad industry codes alone.

Before publication, the issuer establishes evaluation logic and the system validates readiness, dates, authority, attachments and enabled approval rules. Findings link to their exact source fields.

Publication snapshots the RFx/AMACS version and creates a searchable/matchable opportunity, permitted geographic context, response timeline, notifications and auditable lifecycle state.

## Structured location, value and term

Performance location is stored as an authoritative organization location, exact geocoded address, locality-only scope or a structured set of multiple locations. Exact address precision and published visibility remain separate.

Estimated value is stored as exact amount, numeric range or not disclosed in integer minor currency units.

Engagement term is stored as fixed, fixed-with-options, ongoing or milestone-based structured duration/date data. Human summaries are derived from the structured values.

## Discovery states

Keep these meanings distinct:

- **Discovered** — participant found the opportunity.
- **Potential Match** — platform found sufficient profile overlap to surface it.
- **Invited** — issuer or another authorized participant explicitly invited the organization.

None means universally qualified, verified, endorsed, profitable or likely to win.

## Responder path

The responder understands why the RFx is visible, assesses fit/eligibility/capacity/economics/gaps, and chooses Pursue, Watch or Decline where supported.

If a capability/readiness gap exists, the Exchange connects the responder to real teammate discovery or approved contextual resources rather than treating every gap as terminal. Wave 4 reuses Wave 3 organization/provider discovery rather than creating duplicates.

## Response workspace

Structured issuer requirements/sections become a response plan linked by stable IDs. Reusable organization/profile/document data may assist, but the responder reviews and confirms submitted information.

Team discovery/invitation is not itself a legal teaming agreement, joint venture, subcontract or mentor-protégé relationship. The lead controls final submission unless explicit organization permissions say otherwise.

## Q&A and addenda

Questions, answers and material changes attach to the RFx lifecycle. Material changes create controlled version/addendum state and responders are notified/acknowledge where rules require.

The substantive Q&A/addendum feature set remains later-wave scope unless explicitly authorized; Wave 4 leaves stable version/acknowledgment seams without claiming those features complete.

## Submission

For hosted RFxs, submission is revalidated, timestamped, versioned, locked and receipted. Editable response state remains distinct from the immutable submitted version.

For external systems of record, RFxchange supports preparation/routing but does not falsely represent external submission or receipt.

## Evaluation

Evaluation definition is established before publication and linked to requirements/response evidence. Wave 4 freezes this definition; Wave 5 owns substantive evaluator assignment, conflicts, individual scoring, clarification, consensus, recommendation, approval and selection/award.

The platform may support criteria, scoring, comments and comparison but must not autonomously choose the winner.

## Outcomes

Not every RFx ends in an award. Outcomes vary by request family. RFxchange records enough downstream state to know whether a connection progressed to a relationship, completion and reported/verified economic outcome without becoming a full ERP.

## Intelligence flywheel

Requirements reveal demand; responses reveal capability/interest; declines reveal barriers; teaming/resource searches reveal gaps; selections reveal connections; outcomes reveal activity. That intelligence should improve future profiles, matching, programs, AMACS editorial priorities and network understanding.
