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

RFI, RFQ, RFP, Sources Sought/capability requests, supplier/subcontractor requests and lighter service/product/partner requests should use one structured RFx object/workflow engine with type-specific templates and governance.

Do not build an unrelated issuer document builder and responder proposal application. A requirement authored on the issuer side should have a corresponding responder state and, where applicable, evaluation state.

## Issuer path

The issuer starts with the need, then defines scope, deliverables, requirements, schedule, commercial terms and evaluation. Capability requirements should be structured rather than expressed only as broad industry codes.

Before publication, the issuer establishes evaluation logic and the system validates readiness, dates, authority, attachments and required approvals.

Publication should create a searchable/matchable opportunity, geographic context where relevant, response timeline, notifications and auditable lifecycle state.

## Discovery states

Keep these meanings distinct:
- **Discovered** — participant found the opportunity.
- **Potential Match** — platform found sufficient profile overlap to surface it.
- **Invited** — issuer or another authorized participant explicitly invited the organization.

None of these states means universally qualified, verified or endorsed.

## Responder path

The responder should understand why the RFx is visible, assess fit/eligibility/capacity/economics/gaps, and choose Pursue, Watch or Decline where supported.

If a capability/readiness gap exists, the Exchange should connect the responder to teammate discovery or contextual resources rather than treating every gap as a terminal dead end.

## Response workspace

Structured issuer requirements become a response plan. Reusable organization/profile/document data may assist, but the responder reviews and confirms submitted information.

Team discovery is not itself a legal teaming agreement, joint venture, subcontract or mentor-protégé relationship.

## Q&A and addenda

Questions and answers attach to the RFx lifecycle. Material changes create controlled addenda/version state and responders are notified/acknowledge where rules require.

## Submission

For RFxs hosted in RFxchange, submission is timestamped, versioned and receipted according to rules. For external systems of record, RFxchange may support preparation and routing but must not falsely represent external submission.

## Evaluation

Evaluation should organize compliance, individual evaluation, clarification, consensus, recommendation and approval according to the issuer's rules. The platform may support criteria, scoring, comments and comparison but must not autonomously choose the winner.

## Outcomes

Not every RFx ends in an award. Outcomes vary by request type. RFxchange records enough downstream state to know whether a connection progressed to a relationship, completion and reported/verified economic outcome without becoming a full ERP.

## Intelligence flywheel

Requirements reveal demand; responses reveal capability/interest; declines reveal barriers; teaming/resource searches reveal gaps; selections reveal connections; outcomes reveal activity. That intelligence should improve future profiles, matching, programs and network understanding.
