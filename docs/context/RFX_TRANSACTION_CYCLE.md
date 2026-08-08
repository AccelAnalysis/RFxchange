# RFxchange RFx Transaction Cycle

## Core model

RFxchange models a complete economic-request cycle rather than a simple RFP upload/download flow:

```text
Participant describes a need
→ assisted or manual interpretation
→ participant confirms structured MarketNeed
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

The interpretation step reduces the burden on an issuer who knows the problem or desired outcome but does not yet know the correct request family, capability language or solution structure. It is assistance, not authority.

## One RFx object

RFI, Sources Sought, RFQ, RFP, IFB/ITB, qualifications requests, supplier/subcontractor requests, teaming requests, lighter service/product requests and site-selection RFIs use one structured RFx object/workflow engine with AMACS request-family-specific templates and governance.

Do not build an unrelated issuer document builder and responder proposal application. A requirement authored on the issuer side has a stable identity and corresponding responder state and, where applicable, later evaluation state.

Generated documents, public opportunity cards, map beacons, response workspaces and evaluator views are projections or linked artifacts around the same RFx transaction; none becomes a competing canonical RFx record.

## AMACS 0.5.0 relationship

RFxchange consumes immutable AMACS 0.5.0 through the current integration authority. AMACS supplies versioned:

- the structured `MarketNeed` contract;
- provider-neutral `InterpretationRecord` and `InterpretationCandidate` contracts;
- optional concept-interpretation guidance;
- request families and default lifecycles;
- market-capability hierarchy, aliases and relationships;
- properties, units and market roles;
- requirement types and team-coverage constraints;
- credential/evidence types;
- response-section/template definitions;
- decision-factor/template definitions;
- readiness rules; and
- outcome types.

RFxchange supplies organization authority, participant experience, server-side AI/provider implementation, interpretation provenance, privacy, cost controls, lifecycle, geography, publication, matching, responses, decisions and outcomes.

The governing rule is:

> **AI or other assistance interprets and proposes. AMACS defines and constrains. The participant confirms. RFxchange stores and operates the authoritative market record.**

An interpretation record or candidate is never an organization capability assertion, RFx requirement, verification, qualification, award or taxonomy change by itself. Even an accepted candidate requires a separate server-authorized domain write.

RFxchange snapshots the applicable AMACS release and labels at publication while retaining stable IDs for joins and governed migrations. Organization capability assertions remain RFxchange records and are not verified merely because they reference AMACS.

See `docs/rfx/README.md`, `docs/rfx/AMACS_0_5_RECONCILIATION.md`, `docs/rfx/AMACS_INTEGRATION_CONTRACT.md` and `docs/slices/AI_AMACS_INTERPRETATION_FOUNDATION.md`.

## Need, solution and outcome boundaries

Keep these concepts distinct:

- **Source statement** — what the issuer says in its own words.
- **Observed condition** — what is happening now.
- **Desired outcome** — the target state the issuer wants to achieve.
- **Solution posture** — whether the market may propose alternatives or must respond to a defined approach.
- **Proposed solution** — one possible product, service, method or combination.
- **Capability requirement** — what a responder or accepted team must be able to do.
- **Outcome observation** — what actually happened after a decision or delivery.

A desired outcome is not a post-delivery outcome. A proposed solution must not silently become the only permitted pathway while the need remains solution-open.

## Issuer interpretation path

An issuer may:

1. describe what is happening and what success would look like;
2. enter known geography, timing, commercial context and constraints;
3. identify known facts, assumptions and unresolved questions;
4. receive a bounded, source-grounded interpretation based on the pinned AMACS release;
5. answer focused clarification questions;
6. accept, edit, reject or leave suggestions unresolved;
7. continue manually when assistance is declined, unavailable, disabled or over budget; and
8. authorize a separate write of the confirmed MarketNeed and later RFx requirements.

The system may recommend a request family and candidate capabilities. The issuer retains final authority and remains responsible for legal, procurement and business judgments.

## Issuer RFx path

After need confirmation, the issuer defines scope, outputs, structured performance location, structured value, structured engagement term, requirements, schedule, commercial terms, response structure and evaluation method.

Capability requirements use AMACS concepts plus separate credential, experience, geography, capacity, delivery and evidence qualifiers rather than free text or broad industry codes alone.

Before publication, the issuer establishes evaluation logic and the system validates readiness, dates, authority, attachments and enabled approval rules. Findings link to their exact source fields.

Publication snapshots the RFx and AMACS version and creates a searchable/matchable opportunity, permitted geographic context, response timeline, notifications and auditable lifecycle state.

## Seller capability declaration before matching

Responder organizations should not need to know AMACS terminology before declaring what they do.

The supply-side sequence is:

```text
Organization explains products, services and work performed
→ bounded interpretation candidates from AMACS 0.5.0
→ participant accepts, edits, rejects or selects none
→ separate authorized organization-capability assertion
→ evidence and verification remain separate
```

A website, capability statement, document, NAICS code, AI output or past response may inform a suggestion only when authorized. It does not automatically prove or create a capability assertion.

## Structured location, value and term

Performance location is stored as an authoritative organization location, exact geocoded address, locality-only scope or a structured set of multiple locations. Exact address precision and published visibility remain separate.

Estimated value is stored as exact amount, numeric range or not disclosed in integer minor currency units.

Engagement term is stored as fixed, fixed-with-options, ongoing or milestone-based structured duration/date data. Human summaries are derived from the structured values.

## Discovery states

Keep these meanings distinct:

- **Discovered** — participant found the opportunity.
- **Potential Match** — RFxchange found sufficient confirmed profile overlap to surface it.
- **Invited** — issuer or another authorized participant explicitly invited the organization.

None means universally qualified, verified, endorsed, profitable or likely to win. Suggested, rejected or unresolved interpretation candidates do not influence authoritative matching.

## Responder path

The responder understands why the RFx is visible, assesses fit, eligibility, capacity, economics and gaps, and chooses Pursue, Watch or Decline where supported.

If a capability or readiness gap exists, the Exchange connects the responder to real teammate discovery or approved contextual resources rather than treating every gap as terminal. Wave 4 reuses Wave 3 organization/provider discovery rather than creating duplicates.

## Gap-to-team/resource pathway

A detected gap may lead to:

```text
Opportunity
→ explainable capability/readiness gap
→ teammate or resource discovery
→ consented connection/referral
→ increased readiness
→ response decision
```

The resource provider retains service, eligibility and capacity authority. A referral or recommendation is not program acceptance, financing approval, endorsement or guaranteed response.

## Response workspace

Structured issuer requirements and response sections become a response plan linked by stable IDs. Reusable organization/profile/document data may assist, but the responder reviews and confirms submitted information.

AI assistance cannot silently insert stale organization claims, generate legal representations, submit a response or claim compliance. Participant-authored response text remains participant-authored and outside automatic translation.

Team discovery or invitation is not itself a legal teaming agreement, joint venture, subcontract or mentor-protégé relationship. The lead controls final submission unless explicit organization permissions say otherwise.

## Q&A and addenda

Questions, answers and material changes attach to the RFx lifecycle. Material changes create controlled version/addendum state and responders are notified and acknowledge where rules require.

The substantive Q&A/addendum feature set remains later-wave scope unless explicitly authorized; Wave 4 leaves stable version/acknowledgment seams without claiming those features complete.

## Submission

For hosted RFxs, submission is revalidated, timestamped, versioned, locked and receipted. Editable response state remains distinct from the immutable submitted version.

For external systems of record, RFxchange supports preparation and routing but does not falsely represent external submission or receipt.

## Evaluation

Evaluation definition is established before publication and linked to requirements and response evidence. Wave 4 freezes this definition; Wave 5 owns substantive evaluator assignment, conflicts, individual scoring, clarification, consensus, recommendation, approval and selection/award.

The platform may support criteria, scoring, comments and comparison but must not autonomously choose the winner.

## Outcomes

Not every RFx ends in an award. Outcomes vary by request family. RFxchange records enough downstream state to know whether a connection progressed to a relationship, completion and reported or verified economic outcome without becoming a full ERP.

A referral sent, profile match, team invitation, pursuit decision, response submission or selection notice is not itself a verified economic outcome.

## Intelligence flywheel

Confirmed requirements reveal demand; confirmed organization capability assertions reveal supply; responses reveal market interest; declines reveal barriers; teaming and resource searches reveal gaps; referrals reveal navigation friction; selections reveal productive connections; and outcomes reveal actual activity.

Interpretation candidates and their dispositions may improve prompts, retrieval and future governed proposals, but they do not automatically alter AMACS or authoritative market data.

The complete learning path is:

```text
Need
→ interpreted and confirmed structure
→ market interaction
→ decision / connection
→ reported and verified outcome where available
→ governed RFxchange and AMACS learning
```
