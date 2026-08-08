# RFxchange Product Principles

## Product definition

The RFxchange is a **map-based business growth network** that makes local and regional economic activity visible, connected and actionable. Its principal objects are organizations, capabilities, market needs, opportunities/RFxs, referrals, teams, resource providers, credibility evidence, outcomes and geography.

It is not primarily:

- a social feed;
- a static business directory;
- a conventional bid portal;
- a CRM replacement;
- an ERP or contract-management system;
- a general-purpose AI chatbot; or
- a pay-to-rank marketplace.

## Organization-centered architecture

The market entity is the **Organization**. A person has an authenticated user identity, but participates through explicit organization membership, role and permission state.

The fundamental hierarchy is:

```text
Organization Account
  → Organization Profile
  → Registered Users
  → Roles / Permissions / Scope
```

A user must not accidentally become an independent market participant merely because authentication succeeds.

## Primary activation moment

The onboarding objective is not “account created.” The primary activation moment is:

> The organization has established enough legitimate identity, geography, authority, location and profile state for its real marker to appear in the controlled map environment.

The open platform release occurs later, after the complete release gate is satisfied.

## Geography is authority, not decoration

Locality state affects what a participant may do. Browser state and visual map position cannot grant geographic access. Canonical locality identifiers, release state and participation rules are server-authoritative.

## Progressive registration

Do not front-load every enrichment, verification, certification, billing or advanced preference field before the user reaches real value. Establish the minimum identity and network position first, then progressively enrich.

AI-assisted capability interpretation belongs in post-activation market enrichment rather than becoming an activation blocker. Buyer need interpretation belongs at the beginning of the authorized RFx workflow, with a complete manual alternative.

## Capability over category

Industry codes and broad categories may assist discovery, but the Exchange should represent what an organization can actually provide, buy, issue, support or contribute. Capability-based discovery is a core differentiator.

NAICS and similar external classifications are descriptive/filter context, not proof of capability.

## Human language into governed market structure

Participants should be able to begin with ordinary business language:

- a seller explains what the organization does;
- a buyer explains what is happening and what outcome it wants;
- a business explains what resource help it needs.

The platform may help translate those statements into governed AMACS-backed structures. Participants should not be required to know taxonomy terminology before receiving value.

The governing rule is:

> **AI or other assistance interprets and proposes. AMACS defines and constrains. The participant confirms. RFxchange stores and operates the authoritative market record.**

## Interpretation is not authority

Keep these stages distinct:

```text
participant-authored source
→ non-authoritative interpretation candidate
→ participant disposition
→ separate server-authorized domain write
→ authoritative market record
```

An accepted suggestion is still not the authoritative write. Suggested, rejected, unresolved or withdrawn interpretation candidates cannot influence authoritative discovery, matching, qualification, verification, credibility, publication or outcome reporting.

The model may not invent AMACS IDs or silently convert websites, documents, free text, NAICS, past responses or public sources into organization capability assertions or RFx requirements.

Provider/model/prompt/usage/cost provenance belongs to RFxchange operations and remains separate from AMACS semantics and participant-facing domain records.

## Manual operation is part of the product

Core participation cannot depend on an AI provider being available, affordable or enabled.

The participant must be able to:

- describe and edit a need manually;
- browse Domain → Family → Capability;
- search controlled labels and aliases;
- add or remove structured fields;
- propose a provisional term when no concept fits; and
- continue through the applicable workflow when AI is declined, unavailable, disabled, rate-limited or over budget.

AI usage should be bounded, metered and reserved for interpretation or explanation where it adds value. Deterministic comparison of already-structured records does not require an LLM.

## Need, solution and outcome separation

A buyer's observed condition, desired outcome, proposed solution, capability requirements and later outcome observation are different concepts.

Do not prematurely turn a problem into one prescribed solution when the market should be allowed to propose alternatives. Do not represent a target state as though it were an observed post-delivery result.

## Claim, evidence, verification and credibility separation

The following are distinct:

- an AMACS concept exists;
- an interpretation candidate is suggested;
- an organization self-reports a capability;
- evidence is supplied;
- evidence or capability is independently verified;
- a particular RFx requirement is satisfied;
- credibility is earned through its own governed events.

Do not collapse them into one badge, seal, status or score.

## Connect workflows rather than isolated modules

Opportunity discovery, teaming, resources, referrals and credibility should reinforce one another. Example:

```text
Opportunity → capability gap → teammate/resource → response → outcome → intelligence
```

Do not implement these as unrelated islands if the shared product model can express the relationship.

## Contextual, consented resource routing

The Exchange should surface resources while a business is trying to accomplish something, but provider recommendations and referrals must be purpose-specific, territory/eligibility aware, capacity conscious, consented and limited to minimum necessary information.

A resource recommendation or accepted referral is not provider acceptance, service completion, financing approval, endorsement or verified economic impact.

## Trust and commercial neutrality

Payment cannot create substantive trust.

- Membership does not make an organization Verified.
- Founding status is recognition, not credibility.
- Paid placement must not masquerade as capability matching.
- Commercial status cannot satisfy legitimate RFx qualification unless the issuer separately specifies an appropriate underlying factual requirement.
- A free organization may accumulate substantial credibility.
- Commercial status cannot improve AI interpretation, change canonical AMACS meaning or turn a suggestion into an assertion.

## Authority separation

Keep these concepts distinct:

- user authentication;
- organization membership;
- organization claim or management authority;
- organization verification;
- platform administrative authority;
- institutional or locality administrative authority;
- commercial entitlement;
- interpretation assistance;
- capability assertion;
- evidence and verification;
- credibility;
- RFx qualification; and
- outcome confirmation.

Do not collapse them into a single “admin,” “verified,” “qualified,” “AI approved” or “premium” flag.

## Auditable state

Sensitive decisions must preserve attributable history. Claims, access changes, restrictions, interpretation disposition, authoritative writes, verification, credibility, policy acknowledgements and administrative corrections should be represented as controlled state plus durable evidence or audit history rather than destructive mutation.

## Market claims discipline

The Exchange improves pathways preceding business outcomes; it does not guarantee leads, awards, revenue, financing, jobs, partner performance or procurement eligibility. Product copy and UI state must distinguish suggestion, self-report, discovery, potential match, invitation, qualification, selection, reported outcome and verified outcome.

## Density is part of the product

A network with useful organizations, opportunities, providers and relationships is more valuable than a feature-rich but empty application. Core participation should remain low-friction enough to build real density.

AI assistance should reduce taxonomy and procurement burden, not become a new gate that slows participation or creates an empty, over-engineered network.
