# RFx ↔ Exchange Network Integration Contracts

**Status: PARALLEL PLANNING ANALYSIS — NON-CANONICAL UNTIL RFx CORE CONVERGENCE REVIEW**

This document defines the proposed integration boundaries between **Wave 4 RFx Core** and the surrounding RFxchange platform. It is a planning artifact only. It does **not** authorize Wave 4 implementation, alter Feature-ID completion state, replace `docs/tracking/RFxchange_DEPENDENCY_MAP.md`, or make the provisional contract names below canonical schema/API names.

The purpose is to ensure RFx Core becomes a first-class participant in the existing Exchange rather than a second platform hidden inside it.

---

## 1. Product boundary

RFxchange already has or will have platform-owned systems for:

- organization identity, authority, membership and profile;
- controlled geography and spatial projection;
- capability-based Network discovery;
- acquisition-context continuity;
- referrals;
- official resource providers and resource routing;
- transactional communications;
- credibility/evidence;
- commercial capability policy;
- administration/audit;
- later intelligence/outcomes.

Wave 4 introduces the live RFx transaction path:

`Need → Build RFx → Publish → Discover/Match → Qualify → Respond → Submit`

and creates structured seams for later:

`Evaluate → Select/Award/Connect → Execute → Outcome → Intelligence`.

The governing integration invariant is:

> **RFx Core owns the RFx transaction and its transaction-specific artifacts. Surrounding Exchange systems retain ownership of their own identities, authority, geography, discovery substrates, referral/provider lifecycles, communications delivery, credibility decisions, commercial policy and institutional systems of record.**

RFx Core may consume projections from those systems and emit context/events to them. It must not silently fork them.

---

## 2. Source and authority rules

This analysis is grounded in:

- `/AGENTS.md`;
- `docs/context/RFX_TRANSACTION_CYCLE.md`;
- `docs/context/ORGANIZATION_MODEL.md`;
- `docs/context/MAP_AND_GEOGRAPHY.md`;
- `docs/context/ACQUISITION_AND_RETENTION.md`;
- `docs/context/CREDIBILITY_SYSTEM.md`;
- `docs/slices/WAVE_3_ROADMAP.md`;
- Wave 3 slice briefs for communications, Network discovery, profile enrichment, credentials/locations, referrals, provider foundation and provider routing;
- the live Wave 4 Feature-ID inventory in the canonical tracker;
- parallel Wave 4 planning work for the Feature Crosswalk and Product Workspaces / UX.

Authority rules:

1. The canonical tracker remains completion authority.
2. The canonical dependency map remains sequencing authority.
3. Existing organization/geography/security architecture remains authoritative unless a later approved task intentionally changes it.
4. This document may identify dependency or contract corrections for convergence review, but does not make them canonical.
5. A contract may carry **context**, **evidence**, **projection** or **intent** without granting authority.
6. URLs, browser state, map viewport, acquisition context, recommendation rank, invitation tokens and notification delivery never grant RFx or organization authority by themselves.

---

## 3. Integration principles

### 3.1 One owner per source of truth

Every durable fact should have one authoritative owner.

Examples:

- organization legal/market identity → Organization domain;
- user membership/permissions → Identity/Organization authority domain;
- canonical locality/release state → Geography domain;
- RFx requirements → RFx Core;
- responder answer → RFx Core Response domain;
- referral lifecycle → Referral domain;
- provider approval/service profile → Resource Provider domain;
- delivery attempt/status → Communications domain;
- credibility badge/status → Credibility domain.

RFx Core references those facts; it does not copy them into competing mutable records.

### 3.2 Projection, not database reach-through

RFx Core should consume bounded, typed projections instead of reaching directly into another domain's persistence structure.

A projection should expose only the fields necessary for the RFx decision at hand and should encode provenance/visibility where material.

### 3.3 Context is not authority

A context object may explain:

- why a user arrived;
- which RFx triggered a partner search;
- which requirement caused a resource need;
- which invitation should resume after activation.

It must not itself authorize:

- organization membership;
- RFx management;
- submission;
- provider status;
- referral acceptance;
- team participation;
- evaluator access.

Authorization is re-evaluated server-side against canonical authority at the action boundary.

### 3.4 Events communicate completed facts

Cross-domain events should represent facts already committed by the owning domain.

Example:

`RFxPublished`

means the RFx publication transaction has succeeded. Discovery, communications and acquisition projections may react to it; they do not decide publication validity.

### 3.5 Commands request work; events report work

Use the conceptual distinction:

- **Command / request:** `RequestOpportunityIndexing`, `RequestTransactionalCommunication`, `RequestProviderMatches`.
- **Event / fact:** `RFxPublished`, `SubmissionReceived`, `TeamInvitationAccepted`.

A downstream system may reject or fail a command without rewriting the upstream canonical state unless the product contract explicitly makes that downstream result part of the upstream transaction.

### 3.6 Fail closed on protected data

If projection authorization, geography eligibility, organization scope or visibility cannot be established, protected data is omitted or access is denied.

No integration may fall back to a richer internal record merely because a projection service is unavailable.

### 3.7 Commercial policy is orthogonal to substantive authority

A plan may enable a feature, capacity or convenience. It cannot make an organization:

- qualified for an RFx;
- Verified;
- an Official Resource Provider;
- credible/trusted;
- authorized to act for another organization;
- eligible to see restricted RFx data.

---

## 4. Domain ownership matrix

| Domain/system | Owns | RFx Core may consume | RFx Core may emit | RFx Core must not own |
| --- | --- | --- | --- | --- |
| Organization / identity | org identity, memberships, role/permission authority, profile | scoped organization identity, capabilities, credentials, locations, preferences | RFx participation/activity references | duplicate organization identity or membership |
| Geography | locality identity, release state, boundaries, canonical geo relationships | locality eligibility, performance/service geography primitives, privacy-safe projections | opportunity performance/visibility geography intents | locality release or canonical boundaries |
| Network discovery | reusable search/filter/map discovery substrate | query contracts, organization/resource discovery results | published opportunity projection/index requests | second generic search platform |
| Acquisition | typed preserved-entry context | recovered opportunity/team/referral/provider context | opportunity/team share entry context | separate registration/session authority |
| Referral | referral lifecycle, consent, minimum-necessary sharing | referral references/context where RFx-relevant | request to initiate/associate referral | parallel referral record/lifecycle |
| Resource Provider | official status, service profile, territory, eligibility/intake | provider search/routing results | RFx gap assistance context / connection request | provider approval or duplicate provider directory |
| Teaming | RFx-scoped invitation/participation lifecycle once canonicalized | participation/invitation summary | gap/team-search context and RFx invitation context | legal subcontract/JV relationship |
| Communications | template/version, delivery intent, attempt/status/retry | delivery correlation/status when needed | communication intent + variables + deep link | SMTP/provider delivery state |
| Credibility | verification, badges, evidence governance | eligible credential/badge projection only when legitimate | platform-observed RFx evidence event | self-awarding badges or ranking shortcuts |
| Commercial policy | entitlements, limits, capability flags | capability decision/limits | usage-meter facts where approved | billing state as RFx qualification |
| Audit/admin | platform audit/case/privileged review | scoped authority/decision references | consequential RFx audit facts | generic admin authority engine |
| Intelligence/outcomes | aggregate/derived insight and later outcome models | later insights where approved | privacy-safe transaction facts/signals | analytics-derived authority or qualification |

---

## 5. Common contract envelope

Cross-domain contracts should carry enough metadata to be auditable and safely replayed without coupling every domain to the same persistence model.

### 5.1 Provisional envelope

```ts
interface ExchangeContractEnvelope<TPayload> {
  contractType: string;
  contractVersion: number;
  eventId?: string;
  correlationId: string;
  causationId?: string;
  occurredAt?: string;
  requestedAt?: string;
  actor?: {
    userId?: string;
    organizationId?: string;
    authorityContextId?: string;
  };
  subject: {
    organizationId?: string;
    rfxId?: string;
    responseId?: string;
    submissionId?: string;
    invitationId?: string;
    referralId?: string;
    providerId?: string;
  };
  sourceDomain: string;
  payload: TPayload;
}
```

Names are provisional. Convergence may use a different event infrastructure.

### 5.2 Required semantics

- `eventId` identifies a committed fact and supports deduplication.
- `correlationId` follows a user/business journey across domains.
- `causationId` links a resulting fact to the command/event that caused it where useful.
- actor identity is informational/audit context only; consumers re-check authority before protected actions.
- contract versioning is explicit.
- a subject reference never implies permission to read the subject.

### 5.3 Idempotency

Every side-effecting consumer must define an idempotency boundary.

Examples:

- one opportunity index projection per RFx publication/version;
- one communication intent per event/template/recipient purpose;
- one team invitation per explicit invitation command/idempotency key;
- one hosted submission receipt per accepted submission transaction.

---

# 6. Organization and profile integration

## 6.1 Ownership boundary

The Organization domain owns the business identity. RFx records reference `organizationId` for issuer, responder and participating organizations.

RFx Core must not create a second mutable issuer/vendor profile just because an RFx needs a snapshot.

Where transaction integrity requires historical evidence, RFx Core may preserve **transaction snapshots** with provenance and captured-at metadata. A snapshot is evidence of what was used at that time, not a new canonical organization profile.

## 6.2 `OrganizationRFxContextProjection`

Proposed bounded projection used during authoring, matching, pursuit and response assistance.

Possible fields:

```ts
interface OrganizationRFxContextProjection {
  organizationId: string;
  displayName: string;
  publicIdentityStatus: string;
  roles: string[];
  capabilities: CapabilityProjection[];
  industries?: IndustryProjection[];
  identifiers?: CredentialProjection[];
  pastPerformance?: PastPerformanceProjection[];
  locations: OrganizationLocationProjection[];
  serviceGeographies: GeographyReference[];
  preferences?: RFxPreferenceProjection;
  credibility?: RFxEligibleCredibilityProjection[];
  provenance: ProjectionProvenance;
}
```

The projection must respect:

- field visibility;
- organization scope;
- self-reported vs authoritative provenance;
- exact-location privacy;
- distinction between descriptive role and actual permission.

## 6.3 Capability integration

RFx supplier criteria and gap assessment may compare against structured organization capabilities from Wave 3.

Rules:

- capability match is evidence of possible alignment, not automatic qualification;
- NAICS can filter/contextualize but cannot substitute for a capability;
- missing profile evidence may mean `unknown/unconfirmed`, not automatically `failed`;
- issuer requirements remain canonical RFx facts, while organization capability facts remain organization-owned.

## 6.4 Credential integration

RFx may consume credential/identifier projections to evaluate required/preferred criteria.

A projection should distinguish at least:

- self-reported;
- evidence-present;
- source/issuer known;
- administratively reviewed;
- credibility-Verified where that later state exists;
- expired/invalid where authoritative status exists.

RFx must never convert "uploaded credential evidence" into "Verified" on its own.

## 6.5 Organization participation references

RFx-specific relationships should reference the organization and preserve their own lifecycle:

- issuer organization;
- responder organization;
- watching/pursuing organization;
- invited team organization;
- participating team organization;
- later evaluator organization/user context where applicable.

Do not encode these as organization profile roles merely because the organization participated once.

---

# 7. Geography and map integration

## 7.1 Geography concepts RFx must keep separate

RFx Core should not use a single ambiguous `location` field.

At minimum convergence should distinguish:

1. **Issuer base geography** — where the issuer organization is based/presented.
2. **Performance location** — where work/delivery/service is expected.
3. **Eligible responder geography** — if participation is geographically constrained.
4. **Visibility/distribution geography** — where the opportunity may appear within RFxchange.
5. **Responder service geography** — where a responding organization says it can perform.
6. **Provider service territory** — where a resource provider serves businesses.

These are related but not interchangeable.

## 7.2 `RFxGeographyDefinition`

Proposed RFx-owned geography intent:

```ts
interface RFxGeographyDefinition {
  performanceLocations: PerformanceLocationRef[];
  eligibleGeographies?: GeographyReference[];
  visibilityGeographies?: GeographyReference[];
  remoteAllowed?: boolean;
  geographyNotes?: string;
}
```

RFx owns the requirement/intent; Geography validates canonical identifiers and release/participation constraints.

## 7.3 `OpportunityMapProjection`

A published RFx may generate one or more privacy-safe map representations.

The projection should contain only renderer-ready, authorized geography semantics such as:

- RFx/opportunity identity;
- display category/type;
- canonical geography refs;
- permitted coordinate/area representation;
- publication/status projection;
- deadline summary;
- selected public issuer identity;
- deep-link reference.

It must not include:

- private issuer coordinates merely because the issuer has an internal exact address;
- nonpublic response/submission data;
- unreleased/restricted locality participation the viewer is not entitled to see.

## 7.4 Map authority

Map viewport, zoom, camera and client filter state never decide RFx eligibility or access.

The Geography domain remains the authority for locality release and geographic participation. RFx Core owns RFx requirements using canonical geography references.

## 7.5 No duplicate map engine

Wave 4 opportunities plug into the Network map layer contract established in Wave 3. RFx Core should expose an opportunity projection/layer source; it should not create an RFx-only map renderer with separate locality rules.

---

# 8. Network discovery integration

## 8.1 Network discovery owns the reusable substrate

Wave 3 establishes capability search, geography filters, map/list/detail synchronization and reusable entity discovery.

Wave 4 adds a new source domain: published RFx opportunities.

Conceptually:

```text
RFx Core
  RFxPublished
      ↓
Public/Participant Opportunity Projection
      ↓
Network Discovery indexing/query/map substrate
      ↓
Opportunity search/list/map/detail entry
```

## 8.2 `PublicOpportunityProjection`

This is the minimum-safe public/share projection for permitted RFxs.

Possible fields:

- `rfxId` / public opportunity ID;
- type;
- title;
- plain-language summary;
- issuer public identity projection;
- publish date;
- deadline/date range;
- permitted performance/visibility geography;
- substantive but privacy-safe requirement summary;
- public attachments/terms where explicitly allowed;
- public status;
- acquisition CTA/deep-link target.

The public projection is not the full participant/responder projection.

## 8.3 `ParticipantOpportunityProjection`

Authenticated permitted users may receive a richer projection including:

- detailed structured requirements available to prospective responders;
- supplier criteria disclosed by issuer rules;
- evaluation basis disclosed to responders;
- submission mode;
- Q&A/addendum summary when later enabled;
- pursuit/watch context for the active organization;
- match explanation calculated separately from canonical RFx facts.

## 8.4 `OpportunityIndexProjection`

Discovery/search should index a purpose-built projection, not arbitrary RFx JSON.

Potential indexed concepts:

- title/summary;
- structured capabilities;
- products/services;
- requirement categories;
- credential criteria;
- issuer/category metadata;
- performance geography;
- deadline;
- RFx type;
- value range only when approved for visibility;
- status/publication version.

Protected/free-text internal material must not accidentally enter search indexes.

## 8.5 Discovery source attribution

Responder UI may show:

- Discovered;
- Potential Match;
- Invited.

A proposed contract:

```ts
interface OpportunityEntryContext {
  rfxId: string;
  source: "discovered" | "potential_match" | "invited" | "shared" | "alert" | "saved_search";
  sourceReferenceId?: string;
  explanation?: MatchExplanationProjection;
}
```

These labels explain **how the opportunity surfaced**, never qualification, endorsement or award probability.

## 8.6 Saved search / alert / watch boundaries

Convergence should determine final ownership, but a clean split is:

- Discovery owns saved query definitions and query matching.
- Communications owns delivery.
- RFx owns opportunity facts/dates.
- A pursuit/relationship domain owns active organization-to-RFx state such as Watch/Pursue/Decline.

No subsystem should copy RFx deadlines into a separate mutable deadline source.

---

# 9. Acquisition and public-entry integration

## 9.1 Wave 2 acquisition context is the reusable entry envelope

Wave 4 must consume the typed acquisition-context mechanism instead of adding bespoke `returnUrl` logic for opportunities and team invitations.

Supported Wave 4 entry contexts include at least:

- opportunity/public RFx;
- team invitation;
- issuer invitation where later supported;
- RFx-related provider/resource path where appropriate.

## 9.2 `OpportunityAcquisitionContext`

Proposed payload carried inside the canonical acquisition envelope:

```ts
interface OpportunityAcquisitionContext {
  kind: "opportunity";
  rfxId: string;
  publicProjectionVersion?: number;
  entrySource?: "share" | "search" | "social" | "newsletter" | "email" | "provider" | "direct";
  campaignAttribution?: AttributionRef;
}
```

This payload says why the user arrived. It grants nothing.

After legitimate activation/open-gate completion the server resolves the current RFx and returns the participant to the **currently permitted** destination.

If the RFx has closed, expired, become restricted or been withdrawn, the system must show the truthful current state rather than restore stale access.

## 9.3 `TeamInvitationAcquisitionContext`

```ts
interface TeamInvitationAcquisitionContext {
  kind: "team_invitation";
  invitationId: string;
  rfxId: string;
}
```

The invitation is re-resolved after activation. Possession of the context/token cannot:

- accept the invitation;
- create organization authority;
- bypass RFx visibility rules;
- disclose protected opportunity information before the invitee is legitimately entitled.

## 9.4 Share-link boundary

`ACQ-009` should use a controlled share reference resolving to `PublicOpportunityProjection`.

A share URL is not an authorization bearer token for protected RFx content.

Revocation, withdrawal, publication-version replacement and status changes must be respected at resolution time.

---

# 10. Teaming integration

## 10.1 Purpose

RFx Core should identify the **transaction need** for a teammate; the reusable Network discovery substrate finds organizations; the Teaming domain owns the RFx-scoped invitation/participation lifecycle.

Proposed chain:

`RFx requirement/criterion → GapAssessment → PartnerSearchContext → candidate organizations → TeamInvitation → TeamParticipation`

## 10.2 `GapAssessment`

RFx Core owns the relationship between an RFx requirement/criterion and the responder's known organization profile evidence.

Proposed semantics per gap item:

- `confirmed_match`;
- `possible_match`;
- `unknown_or_unconfirmed`;
- `missing`;
- `not_applicable`.

Convergence should settle exact state names.

A gap is not automatically a disqualification unless the RFx requirement/criterion semantics say so.

## 10.3 `PartnerSearchContext`

```ts
interface PartnerSearchContext {
  rfxId: string;
  pursuitId: string;
  organizationId: string;
  gapItems: GapReference[];
  requiredCapabilities?: CapabilityReference[];
  preferredCapabilities?: CapabilityReference[];
  performanceGeography?: GeographyReference[];
  desiredRole?: string;
}
```

This context seeds reusable organization discovery. It does not create team state.

## 10.4 `TeamInvitationContext`

The Teaming domain should own the invitation lifecycle, while RFx provides the minimum RFx context necessary for the invite.

Possible fields:

- invitation ID;
- RFx ID;
- inviting organization;
- invited organization/contact target;
- proposed capacity/role;
- selected gap/requirement references;
- minimum public/participant RFx summary;
- expiry;
- nonbinding boundary version;
- acquisition context reference for external invitee.

## 10.5 `TeamParticipationProjection`

RFx Response may consume a bounded summary of accepted team participation when relevant to the response.

It must not infer:

- legal subcontract status;
- JV formation;
- pricing authority;
- permission to edit the prime responder's response;
- ownership of the submission.

Those require explicit future collaboration/authority contracts.

## 10.6 Teaming dependency correction candidate

The Feature Crosswalk identified the seeded `TEM-001 → DSC-009` edge as a likely cross-wave defect because `DSC-009` is later advanced opportunity recommendations.

This integration design supports instead:

`RSP-006 GapAssessment → DSC-010 reusable partner discovery → TEM-001 RFx-scoped search → TEM-002 invitation`.

This remains a convergence finding, not a dependency-map change.

---

# 11. Resource-provider integration

## 11.1 Resource Provider domain owns the provider

RFx Core must not create RFx-specific provider profiles, approval status or provider territory models.

It consumes Wave 3 Official Resource Provider projections.

## 11.2 `AssistanceNeedContext`

When a responder has a readiness gap, RFx may create a bounded resource-routing context:

```ts
interface AssistanceNeedContext {
  rfxId: string;
  pursuitId?: string;
  responseId?: string;
  organizationId: string;
  needCategory: string;
  requirementRefs?: string[];
  credentialRefs?: string[];
  geography?: GeographyReference[];
  urgency?: string;
  deadline?: string;
}
```

Examples:

- certification assistance;
- financing;
- workforce support;
- APEX/procurement technical assistance;
- insurance/bonding guidance where provider taxonomy supports it.

## 11.3 Provider search request

RFx should request results from the established provider search/routing contract using:

- service need;
- service territory;
- approved eligibility inputs;
- language/modality preferences where relevant;
- current Official Provider status.

Recommendations must be phrased as relevant routing suggestions, not guaranteed eligibility or endorsement.

## 11.4 Provider connection

If the business chooses to connect, reuse the Wave 3 referral/consent mechanism (`REF-006`), not a new RFx provider-message thread.

RFx Core may associate the resulting provider connection/referral ID with the RFx gap for continuity.

Provider acceptance/decline/redirect remains provider/referral lifecycle state.

## 11.5 Request-scoped communications

`RES-007` communication remains scoped to the legitimate provider request/referral. RFx context may be referenced, but RFx Core does not create open unsolicited provider messaging.

## 11.6 Provider-shared RFx opportunities

An Official Resource Provider may become an acquisition distributor for a permitted opportunity.

The provider share path should resolve through:

`Approved provider → permitted RFx PublicOpportunityProjection → ACQ acquisition context → legitimate activation → current RFx destination`.

Provider status does not give broader access to issuer/private responder data.

---

# 12. Referral integration

## 12.1 Referral is its own Network transaction

Wave 3 referrals are organization-owned, consented, auditable relationships. RFx Core should reference or initiate them rather than embedding a second referral lifecycle.

## 12.2 RFx-related referral contexts

Potential legitimate RFx uses include:

- referring a business to an Official Resource Provider because of an RFx gap;
- referring an opportunity to another organization where product rules permit;
- future post-award service/resource connections.

The Referral domain owns:

- sender/recipient;
- purpose;
- consent;
- minimum-necessary data sharing;
- accept/decline;
- referral lifecycle.

RFx owns only the RFx context/reference that motivated the referral.

## 12.3 `RFxReferralAssociation`

```ts
interface RFxReferralAssociation {
  rfxId: string;
  referralId: string;
  associationType: "resource_gap" | "opportunity_share" | "other_approved";
  requirementRefs?: string[];
}
```

This association is not a duplicate status tracker.

## 12.4 Privacy

RFx requirement text or responder data passed into a referral must follow REF-005 minimum-necessary sharing and consent.

A responder's private Go/No-Go notes, pricing draft or proprietary response content must never be transferred automatically merely because the referral originated from that RFx workspace.

---

# 13. Transactional communications integration

## 13.1 Communications owns delivery mechanics

RFx workflows emit communication intents/events through the provider-neutral Wave 3 communications substrate.

RFx must not call Microsoft/email provider contracts directly from the domain model.

## 13.2 `TransactionalCommunicationIntent`

Conceptual request:

```ts
interface TransactionalCommunicationIntent {
  intentId: string;
  originatingEventId: string;
  templateKey: string;
  templateVersionPolicy: string;
  recipientPurpose: string;
  recipientRef: string;
  variables: Record<string, SafeTemplateVariable>;
  deepLink: ControlledDeepLink;
  correlationId: string;
}
```

Recipient routing is resolved according to the communications/application boundary; domain events should not need provider-specific addresses where avoidable.

## 13.3 Candidate Wave 4 communication events

At minimum convergence should evaluate:

Issuer-side:

- collaborator invitation later when enabled;
- approval request later when enabled;
- RFx published;
- question received later;
- response/submission received;
- deadline/closure milestones where issuer notification is useful.

Responder-side:

- opportunity invitation;
- saved-search/alert match;
- watch deadline approaching;
- RFx update;
- addendum later;
- team invitation;
- team invitation accepted/declined;
- submission receipt;
- RFx cancelled/closed.

Team/provider:

- team invitation;
- provider referral/request;
- provider response;
- external acquisition invitation.

## 13.4 Idempotency

Reprocessing `RFxPublished` must not send duplicate publication communications.

Reprocessing a team invitation command must not create duplicate invitation email unless an explicit resend action is authorized and separately audited.

## 13.5 Deep links

Communication links carry context to a controlled resolver. They are not authorization grants.

The server re-resolves:

- user identity;
- organization membership;
- RFx visibility/state;
- invitation/referral status;
- acquisition/activation state.

---

# 14. Credibility integration

## 14.1 Credibility is not generic match rank

Existing product rules say credibility does not ordinarily influence RFx search/ranking.

RFx may use a credibility/verification fact only when the issuer explicitly defines a legitimate requirement, preference or informational criterion.

Examples:

- "Organization Verified required" if the product later supports that legitimate criterion;
- specified license/certification where authoritative evidence exists;
- past performance criterion with proper provenance.

A paid organization, Founder or sponsored organization receives no substantive match advantage from that status.

## 14.2 `RFxEligibleCredibilityProjection`

Possible consumer projection:

```ts
interface RFxEligibleCredibilityProjection {
  credentialType: string;
  status: string;
  effectiveAt?: string;
  expiresAt?: string;
  publicExplanation?: string;
  provenanceClass: string;
}
```

Raw evidence, admin notes, appeals, investigations, trust calculations and private feedback remain outside RFx Core.

## 14.3 RFx emits evidence; Credibility decides meaning

RFx transactions can generate high-quality platform-observed facts, for example:

- organization published RFx;
- organization submitted response;
- submission accepted by RFxchange;
- team invitation accepted;
- later issuer records selection;
- later transaction outcome confirmed.

These may become **credibility evidence inputs** later.

RFx Core does not award:

- Active;
- Experienced;
- Trusted;
- Verified;
- Endorsed

simply because an event occurred.

The Credibility domain evaluates configured criteria, invalidations, anti-gaming and governance.

## 14.4 Anti-gaming handoff

RFx evidence events should be durable enough to support later invalidation/reversal semantics without deleting transaction history.

Examples:

- cancelled RFx;
- withdrawn submission;
- invalidated transaction;
- duplicate/self-dealing transaction flags later.

Credibility can remove/reweight its contribution without rewriting RFx history.

---

# 15. Commercial/entitlement integration

## 15.1 RFx uses capability policy, not payment state directly

`ISS-020`, saved-search limits, watch features and later advanced workflow may depend on commercial capabilities.

RFx should query a bounded policy decision such as:

```ts
interface CapabilityDecision {
  capability: string;
  allowed: boolean;
  limit?: number;
  reasonCode?: string;
}
```

It should not derive product authority from Stripe/customer/subscription fields itself.

## 15.2 Free core boundary

Wave 4 should remain capable of the approved basic end-to-end path without future Wave 6 billing implementation.

Advanced features may expose disabled/upgrade affordances only where truthful and approved.

## 15.3 Neutrality

Commercial tier must not influence:

- RFx validity;
- substantive qualification;
- credential truth;
- credibility;
- provider approval;
- geographic authorization;
- issuer selection/award logic.

---

# 16. Audit and administration integration

## 16.1 RFx domain audit

RFx Core should preserve its own durable transaction events for state-changing actions.

Examples:

- RFx created;
- requirement changed;
- publish readiness evaluated;
- RFx published;
- publication withdrawn/cancelled later;
- response created;
- final validation executed;
- hosted submission received;
- external handoff initiated;
- team invitation association created.

## 16.2 Platform audit integration

Privileged/admin actions should also project into the platform's broader audit/case systems where required.

RFx should emit sufficient identifiers and before/after semantics for audit without making the generic admin engine part of RFx domain state.

## 16.3 Admin authority

Admin UI visibility or organization 360 access does not automatically grant the right to mutate an RFx. RFx management permissions and privileged override actions must be explicit during convergence.

---

# 17. External system-of-record integration

## 17.1 Hosted submission

When RFxchange is the submission authority:

- server re-validates current RFx/version/deadline;
- response is frozen into an immutable submission version;
- acceptance transaction is timestamped;
- receipt is issued;
- resulting event may notify issuer/responder;
- audit evidence is durable.

RFxchange may truthfully display **Submitted/Received** according to its own authoritative transaction.

## 17.2 External submission handoff

When another platform is authoritative:

- RFxchange may prepare/assemble response artifacts;
- preserve destination/instructions;
- record a handoff/launch action;
- optionally allow later user-reported or independently verified external status if a future feature governs it.

RFxchange must not claim:

- submitted;
- received;
- accepted;
- on time

solely because it opened an external URL or exported a package.

## 17.3 `ExternalSubmissionHandoff`

Possible fields:

- RFx/response IDs;
- prepared package version;
- destination class/reference;
- handoff timestamp;
- actor;
- instructions version;
- explicit authority disclaimer;
- later evidence reference if independently added.

---

# 18. Intelligence and outcome seam

## 18.1 Wave 4 does not implement the full intelligence engine

RFx Core should nevertheless emit structured facts that later intelligence can consume.

High-value categories include:

- demand categories/capabilities requested;
- performance geography;
- published opportunity volume;
- pursuit/watch/decline counts with privacy-safe aggregation;
- recurring gap categories;
- teammate searches;
- provider assistance needs;
- response/submission counts;
- external-vs-hosted submission mode;
- later selection/outcome facts.

## 18.2 Privacy-safe aggregation

Intelligence consumers should not require raw confidential proposal content merely to produce market insight.

Prefer structured RFx metadata and derived aggregates.

Examples:

- "18 opportunities requested capability X in locality Y"

rather than indexing proprietary response narrative.

## 18.3 No analytics-derived authority

Intelligence outputs may support prioritization/recommendation, but cannot independently grant RFx access, provider status, credibility or organization permissions.

---

# 19. Cross-domain event catalog

The following is a provisional catalog for convergence, not a committed event schema.

## 19.1 RFx Core facts emitted

### `RFxCreated`

Consumers may include audit/analytics only.

Must not trigger public discovery.

### `RFxPublicationReady`

Internal/issuer workflow fact. Does not mean published.

### `RFxPublished`

Potential consumers:

- opportunity projection;
- Network search/index;
- map layer;
- saved-search matching;
- communications;
- acquisition/share resolver;
- audit;
- intelligence.

### `RFxPublicationChanged`

Future version/addendum consumer seam. Must preserve version identity.

### `RFxClosed`

Consumers:

- search/map projection removal/update;
- deadline/watch state;
- communications;
- acquisition resolver;
- audit/intelligence.

### `PursuitDecisionRecorded`

Potential consumers:

- responder workflow;
- reminders;
- privacy-safe intelligence.

Private notes are not event payload by default.

### `RFxGapIdentified`

Potential consumers:

- partner discovery context;
- provider routing context;
- intelligence.

Must not publicly expose private organization shortcomings.

### `ResponseCreated`

Primarily RFx Core/audit; not issuer-visible by default merely because a responder started work.

### `ResponseReadinessEvaluated`

Private to responder/authorized collaborators unless product rules say otherwise.

### `SubmissionReceived`

Hosted mode only.

Potential consumers:

- issuer receipt/inbox;
- responder receipt;
- communications;
- audit;
- later evaluation;
- later credibility evidence/intelligence.

### `ExternalSubmissionHandoffRecorded`

Potential consumers:

- responder history;
- audit;
- limited intelligence.

Must never be consumed as a verified external submission fact.

## 19.2 Events RFx may consume

### `OrganizationProfileChanged`

May invalidate/update live match explanations or gap assessments, but must not rewrite historical submitted evidence.

### `CredentialStatusChanged`

May change current pursuit/readiness interpretation where legitimate; frozen submission snapshots remain historical.

### `GeographyReleaseChanged`

May alter future visibility/participation. Consequences for already-published RFxs require convergence rules.

### `TeamInvitationAccepted/Declined`

Updates RFx teaming context; does not grant response edit authority without separate collaboration permissions.

### `ProviderReferralAccepted/Declined/Redirected`

May update the responder's assistance context; does not change RFx requirement status automatically.

### `CommercialCapabilityChanged`

Changes availability/limits of commercial features, never substantive qualification or previously committed transaction history.

### `CredibilityStatusChanged`

May affect current criterion display if the issuer legitimately uses that credential. Historical submission evidence behavior requires snapshot/version rules.

---

# 20. Privacy and data-classification matrix

| Data | Default class | Typical public exposure | Participant RFx exposure | Notes |
| --- | --- | --- | --- | --- |
| RFx title/public summary | Public when published as public | Yes if permitted | Yes | controlled projection |
| issuer public identity | Public projection | Yes | Yes | never private internal fields |
| issuer exact private address | Private | No | No unless independently permitted | map uses privacy projection |
| RFx requirements | RFx visibility policy | substantive safe subset | full permitted responder set | internal-only requirements possible later |
| supplier criteria | RFx visibility policy | only approved summary | approved responder projection | hidden criteria require governance review |
| evaluation criteria | RFx visibility policy | usually bounded | responder-disclosed basis | later evaluator details separate |
| responder Go/No-Go notes | Private responder | No | responder org only | never issuer discovery data |
| response draft | Private responder | No | authorized response collaborators | issuer cannot see before legitimate submission |
| hosted submission | Protected transaction | No | issuer/evaluator per lifecycle | immutable version |
| organization capability | field visibility/provenance | approved public fields | RFx projection as permitted | self-reported must stay labeled |
| credential evidence document | Private/restricted | No by default | only minimum needed/authorized | badge/status projection preferred |
| team invitation | Protected relationship | No | inviter/invitee as authorized | minimal RFx context |
| provider referral/request | Protected relationship | No | request parties | minimum necessary sharing |
| communication delivery metadata | Operational/private | No | limited status if useful | provider refs hidden where appropriate |
| credibility raw evidence | Restricted | No | no | consume approved status projection |

---

# 21. Versioning and historical integrity

## 21.1 Current projection vs historical snapshot

RFx workflows need both concepts.

- **Current projection:** today's organization capability, credential or geography state.
- **Historical snapshot/reference:** what the RFx/submission relied on at a consequential transaction point.

Convergence must decide which fields are snapshotted at:

- publication;
- invitation;
- response creation;
- submission;
- later evaluation/award.

## 21.2 Requirement/version lineage

Cross-domain integrations should reference stable RFx requirement IDs plus RFx version identity.

A partner search or provider request should be able to say:

> This need arose from requirement `REQ-17` in RFx version `V3`.

If a later addendum changes `REQ-17`, the downstream context can be reconciled rather than losing lineage.

## 21.3 Projection replacement

Discovery/search/map should replace or retire projection versions deterministically when publication state changes.

Stale indexes must not continue exposing withdrawn/restricted content.

---

# 22. Failure and degradation rules

## 22.1 Discovery/index failure after publish

If canonical RFx publication succeeds but asynchronous indexing fails:

- RFx remains published according to the RFx domain;
- operations can observe retry/failure;
- direct permitted RFx route may remain valid;
- search/map may be temporarily incomplete;
- system must not silently roll back RFx publication unless publication contract explicitly requires synchronous indexing.

Convergence should decide which publication projections are transactional vs eventual.

## 22.2 Communication failure

A failed notification does not erase the domain event.

Communications retries according to policy and surfaces terminal failure to authorized operations.

If legal/product rules require successful delivery before a later action, that requirement must be explicit rather than assumed.

## 22.3 Provider search unavailable

RFx response work continues. The user receives truthful temporary-unavailable state and can revisit the gap.

Do not mark the requirement satisfied because routing failed.

## 22.4 Partner search unavailable

Same principle: pursuit/response remains intact; no team membership is inferred.

## 22.5 Credibility service unavailable

Do not substitute self-reported credential text for an authoritative credibility status. Show unavailable/unknown where needed and enforce any hard criterion server-side according to canonical evidence rules.

## 22.6 Acquisition context stale

Resolve the current object state. A stale link can land on a truthful closed/withdrawn/unavailable explanation; it cannot resurrect access.

---

# 23. UX/navigation handoff contracts

The Product Workspaces planning lane defines a set of high-value context-preserving transitions. This integration lane gives them domain ownership.

| Transition | Context producer | Destination owner | Required reference |
| --- | --- | --- | --- |
| Network discovery → RFx detail | Discovery | RFx | `rfxId`, entry/source context |
| RFx detail → pursuit | RFx/participant projection | RFx pursuit | `rfxId`, active org |
| Pursuit gap → teammate discovery | RFx gap | Network discovery | gap/capability/geography context |
| Partner result → team invite | Discovery | Teaming | candidate org + RFx/gap refs |
| Pursuit gap → resource search | RFx gap | Resource discovery | assistance need context |
| Provider result → connection | Resource discovery | Referral/provider routing | provider + need + consent context |
| Pursue → response | RFx pursuit | RFx response | RFx/version + active org |
| Public RFx → registration | RFx public projection | Acquisition | opportunity context |
| External team invite → registration | Teaming | Acquisition | invitation context |
| Notification → workflow | Communications | owning domain resolver | correlation + controlled deep link |
| Hosted submit → receipt | RFx response | RFx submission | immutable submission/receipt ID |
| External submit → handoff | RFx response | external boundary | handoff ID/destination |

Browser navigation state may assist UX, but the server rehydrates the canonical context from these references.

---

# 24. Wave 4 feature-to-integration mapping

This table identifies the principal surrounding Exchange integration for each current Wave 4 Feature ID. It does not replace the Feature Crosswalk.

| Feature | Primary integration seams |
| --- | --- |
| `ISS-001` | Organization ownership/authority, audit |
| `ISS-002` | product policy/type registry, later external-system modes |
| `ISS-003` | organization asset/template policy, audit |
| `ISS-005` | none required for core structure; geography/profile modules consume projections |
| `ISS-006` | Geography, organization credential/capability vocabularies, storage/doc references |
| `ISS-007` | Organization profile/capability/credential/geography projections |
| `ISS-009` | credibility/credential projection only where explicit, later evaluation seam |
| `ISS-011` | storage/document references, responder projection |
| `ISS-016` | organization authority, geography validation, entitlement where legitimate |
| `ISS-018` | responder/public projection contract |
| `ISS-019` | Discovery, map, communications, acquisition/share, audit, intelligence |
| `ISS-020` | Commercial capability policy |
| `ACQ-009` | Acquisition context + public opportunity projection |
| `DSC-004` | Network discovery + RFx opportunity index/projection |
| `DSC-005` | Discovery saved-search storage + commercial limits |
| `DSC-006` | Discovery match events + communications reliability |
| `DSC-007` | RFx relationship/watch + commercial policy |
| `DSC-008` | RFx canonical dates + relationship state + communications/reminders |
| `RSP-001` | Discovery attribution/invitation context |
| `RSP-002` | Organization profile + RFx requirement/evaluation projection |
| `RSP-003` | Organization profile, private pursuit assessment |
| `RSP-004` | organization-to-RFx pursuit relationship |
| `RSP-006` | Organization capability/credential/geography projection |
| `RSP-007` | Gap → Network partner discovery → Teaming |
| `RSP-008` | Gap → Resource discovery → referral/provider connection |
| `RSP-009` | Organization authority + RFx/version requirement set |
| `RSP-010` | stable RFx requirement lineage |
| `RSP-017` | credential/profile updates, future addenda seam |
| `RSP-018` | authority, canonical deadline/version, submission mode |
| `RSP-019` | Teaming projection, future addenda projection, storage/doc refs |
| `RSP-020` | communications, audit, later evaluation/credibility evidence |
| `RSP-021` | external system-of-record boundary, audit |
| `DSC-010` | Wave 3 organization discovery + RFx gap context |
| `TEM-001` | Network discovery + RFx gap context |
| `TEM-002` | Teaming lifecycle + communications + acquisition for external invitee |
| `TEM-003` | organization identity/authority + acquisition resume |
| `TEM-004` | legal-boundary/versioned presentation evidence |
| `ACQ-007` | Acquisition context + Teaming + communications |
| `EDU-011` | issuer workflow context only; no authority |
| `EDU-012` | response/submission mode context only |
| `EDU-013` | Teaming legal-boundary context |

---

# 25. Integration acceptance matrix

A future implementation should prove at minimum the following cross-domain behaviors.

## 25.1 Organization and authority

- issuer action fails closed for a user without authority for the issuer organization;
- responder response belongs to the correct active organization;
- switching organizations cannot reveal another organization's private pursuit/response data;
- profile projection changes do not rewrite previously received immutable submissions.

## 25.2 Geography

- unreleased/restricted geography cannot be enabled by browser/map state;
- opportunity projection uses approved performance/visibility geography;
- issuer private exact location is not leaked through opportunity map projection;
- service geography and base geography remain distinct in matching.

## 25.3 Discovery

- only published/permitted RFxs are indexed;
- withdrawn/restricted projection is retired;
- search result links resolve current RFx state;
- Potential Match never displays as Qualified/Verified/Endorsed;
- search index contains no protected response or issuer-internal material.

## 25.4 Acquisition

- opportunity context survives registration/activation and returns to the same current RFx;
- stale/closed opportunity context cannot restore access;
- team invitation context survives activation but does not auto-accept;
- manipulated resource IDs or cross-user contexts fail closed.

## 25.5 Teaming

- gap context can seed partner search without creating team membership;
- candidate organization result does not expose private organization fields;
- invitation acceptance creates only governed TeamParticipation;
- invitation link possession alone grants no response edit/submission authority;
- nonbinding legal boundary is presented/evidenced.

## 25.6 Resources/referrals

- RFx gap can route to approved providers without creating a duplicate provider directory;
- non-approved organizations cannot be returned as Official Providers;
- provider connection transfers only consented/minimum-necessary context;
- provider request communication stays scoped to the request;
- provider decline/redirect does not mutate RFx requirement satisfaction automatically.

## 25.7 Communications

- repeated domain-event processing does not duplicate messages;
- deep links re-check current authority/object state;
- terminal delivery failures are observable without altering canonical RFx state;
- template version/correlation can be audited.

## 25.8 Credibility

- commercial/founder status never improves RFx match qualification;
- self-reported credential does not become Verified;
- credibility affects RFx only when legitimately requested by issuer criteria;
- RFx activity emits evidence without directly awarding a badge.

## 25.9 Submission/external boundary

- hosted submission produces one immutable receipt/version under idempotent retry;
- external handoff cannot display confirmed external receipt without evidence;
- a response draft remains distinct from the immutable hosted submission;
- later consumers receive the submitted version, not the mutable current workspace.

---

# 26. Convergence findings / proposed dependency review

These findings should be evaluated during the Extra High RFx Core convergence pass before any dependency map changes.

### 26.1 `ISS-019` is the primary outward integration hinge

Publication is the point at which RFx Core becomes visible to:

- discovery;
- map;
- acquisition/share;
- communications;
- deadline/watch systems;
- audit;
- intelligence.

The final architecture should explicitly define whether those projections are committed atomically with publication or asynchronously from a durable publication event.

### 26.2 `DSC-004` should consume the live publication projection

The seeded Wave 4 search feature needs the `ISS-019` opportunity producer and Wave 3 discovery substrate. It should not query drafts directly.

### 26.3 `ACQ-009` requires both Wave 2 acquisition architecture and Wave 4 publication

Public landing semantics alone are insufficient for a live RFx share link. The link must resolve a currently permitted published RFx projection.

### 26.4 `DSC-006` should depend on communications reliability as a substrate

Saved-search matching and message delivery should remain separate responsibilities, but real alerts need Wave 3 communications reliability.

### 26.5 `RSP-006` needs organization profile/credential projections

Gap assessment cannot be implemented solely from RFx supplier criteria. It needs the Wave 3 market-profile and credential/location projections, with unknown/self-reported provenance semantics.

### 26.6 `RSP-007`, `DSC-010` and `TEM-001` should share one partner-discovery substrate

Do not build three recommendation engines.

### 26.7 `RSP-008` should reuse Wave 3 resource routing/referral

RFx readiness should provide the need context; provider discovery and consented connection stay in the Resource/Referral systems.

### 26.8 `ACQ-007` should reuse canonical acquisition-context continuity

No bespoke team-registration flow.

### 26.9 RFx evidence should be designed for later Credibility consumption

This is an event/evidence seam, not a Wave 4 badge implementation dependency.

---

# 27. Questions reserved for Extra High convergence

The High planning lane intentionally leaves these decisions open:

1. What is the final event/command transport pattern: in-process application events, Firestore outbox, task queue, or another durable mechanism?
2. Which publication side effects must be synchronous for `ISS-019` to succeed?
3. Is `PublicOpportunityProjection` stored/materialized or generated from canonical RFx on demand?
4. Is `ParticipantOpportunityProjection` materialized separately from public projection?
5. What fields are frozen at publication versus evaluated live from organization/geography state?
6. What organization/profile evidence is snapshotted at response creation vs final submission?
7. What is the final ownership of Watch/Pursue/Decline: RFx Core, Discovery, or a shared organization-RFx relationship aggregate?
8. How are saved-search matches deduplicated across RFx publication versions/addenda?
9. What exact geography semantics govern an RFx spanning multiple localities or unreleased areas?
10. Can a published RFx be visible outside the issuer's home locality, and which authority governs that distribution?
11. How does a locality release-state change affect an already-published RFx?
12. Which supplier criteria are public, participant-visible, evaluator-only or issuer-internal?
13. What credential state may count as a hard submission/readiness requirement before the Wave 5 credibility system is fully active?
14. What team participation data is legally/product-safe to include in the final response package?
15. Does accepting a team invitation ever grant collaboration rights, or is a separate explicit collaborator grant always required?
16. Is a provider connection represented only by `REF-006`, or does RFx need a lightweight association aggregate for multiple assistance requests?
17. Which RFx events become formal credibility evidence types in Wave 5?
18. How are invalidated/cancelled RFx events represented to downstream credibility/intelligence consumers?
19. What commercial capability-policy interface is canonical before Wave 6 billing entitlements exist?
20. What submission facts can be shared with intelligence without revealing confidential participation?
21. What is the official external-submission evidence model if a user later reports successful submission?
22. Which deep links can be public object links versus opaque protected relationship links?
23. How long are acquisition/invitation contexts valid and what replay policy applies?
24. Do RFx public/share projections need explicit audience scopes beyond public/authenticated/restricted?
25. What platform audit events require dual RFx-domain and generic-admin audit entries?

---

# 28. Explicit non-scope

This planning document does **not** implement or finalize:

- RFx database schemas;
- canonical state machines;
- canonical permission names;
- Wave 4 slice numbering;
- Wave 5 evaluation/award workflows;
- Q&A/addenda lifecycle;
- legal teaming agreements;
- provider approval/routing implementation;
- referral implementation;
- credibility scoring/badges;
- commercial billing/Stripe behavior;
- institutional APIs/integrations;
- analytics warehouse architecture;
- a second map/search engine;
- Feature-ID completion or dependency-map edits.

---

# 29. Exit from this planning lane

This lane is complete when the later RFx Core convergence pass can answer, for every RFx interaction with the broader Exchange:

1. **Who owns the fact?**
2. **What bounded projection/context crosses the boundary?**
3. **What authority is re-evaluated at action time?**
4. **What event reports a committed fact?**
5. **What command requests downstream work?**
6. **What privacy/provenance rules apply?**
7. **What is idempotent/replay-safe?**
8. **What happens if the downstream system fails?**
9. **What historical version/snapshot must remain auditable?**
10. **Which later wave consumes the seam without forcing its implementation into Wave 4?**

The target architecture is one Exchange with one RFx transaction engine connected through explicit contracts—not a collection of adjacent modules that each duplicate organization, geography, discovery, referral, provider, communication or credibility state.
