# RFxchange Platform Solution Architecture Document

**In-Place Modernization Architecture Baseline**


> **Architecture in one sentence:** RFxchange will be one shared platform core with three deliberately separated application surfaces — Marketing & Acquisition, Exchange, and Admin — using common identity, organization, event, billing, communications, and data services while preserving clean responsibility and deployment boundaries.

| Document | Value |
| --- | --- |
| Title | RFxchange Platform Solution Architecture Document |
| Version | 1.1 |
| Date | 11 September 2026 |
| Status | Adopted modernization target under the product-owner execution instruction; implementation and deployment remain separately reported |
| Platform owner | Accel Analysis, LLC / RFxchange |
| Primary repository | `AccelAnalysis/RFxchange` — existing production repository |

# Document Control

This document defines the target solution architecture for the in-place RFxchange modernization. It is intended to govern application boundaries, backend ownership, identity, data, integrations, deployment, and the principal cross-application workflows. Detailed PRDs, UI specifications, schemas, and implementation contracts should remain subordinate to this architecture.

## Architecture Inputs

- Current RFxchange product architecture and mobile Exchange model: one organization-centered Exchange with persistent map/search/drawer/card/detail behavior.
- Current product direction: permanent participant lenses are RFx, Resources, Intelligence, and Capabilities; Referrals is a cross-lens workflow managed through shared services and Menu surfaces.
- The onboarding/enrichment pattern reviewed in `AccelAnalysis/AccelProcure`, especially server-side parallel enrichment using public procurement sources and normalized source-aware persistence.
- The modernization infrastructure discussion in this project: Firebase as the platform core, Stripe for billing, Microsoft-based email integration, Telnyx for SMS, and Google Cloud Secret Manager for server-side credentials.
- The commercial and operating direction already established for RFxchange, including configurable membership/seat entitlements, promotions, regional campaigns, public acquisition, and mobile-first exchange behavior.

## Important Supersession Note

> **Modernization lens model:** Some older RFxchange program material names Referrals as the fourth permanent lens. This SAD adopts the later product direction: RFx, Resources, Intelligence, and Capabilities are the permanent participant lenses; Referrals is cross-lens functionality. The modernization implementation should not reintroduce Referrals as a permanent bottom-navigation lens unless this architecture decision is explicitly changed.

# 1. Executive Summary

RFxchange should be modernized as one platform with three independently deployable application surfaces rather than one oversized application containing participant, marketing, and platform-operations concerns. The three surfaces are the Marketing & Acquisition Suite, the authenticated Exchange App, and the Admin Console. They share a common Firebase/Google Cloud backend and a common organization graph, but each surface is optimized for a different job.

| Surface | Primary audience | Primary job | Should not own |
| --- | --- | --- | --- |
| Marketing & Acquisition | Prospects, public visitors, leads, partners | Acquire, educate, attribute, register, nurture, convert | Participant transaction logic or privileged platform administration |
| Exchange | Authenticated organization participants | Discover, transact, collaborate, respond, manage organization participation | Platform-wide administrative operations or marketing campaign authoring |
| Admin Console | RFxchange platform operators | Operate, support, review, configure, moderate, audit | Participant-first navigation or public acquisition experience |

The shared platform core owns identity, organizations, memberships, entitlements, canonical RFx/Resource/Intelligence/Capability records, referrals, public projections, domain events, communications, billing synchronization, and trusted integration services. The architecture deliberately separates user experience and deployment boundaries without duplicating platform truth.

# 2. Purpose, Scope, and Architectural Goals

## 2.1 Purpose

This SAD establishes the architecture baseline before the in-place modernization begins so that implementation can proceed without recreating the accumulated coupling, mismatched contracts, dead code paths, and mixed responsibilities discovered in earlier prototypes and in the current production evolution.

## 2.2 In Scope

- Application boundaries for Marketing & Acquisition, Exchange, and Admin.
- Firebase project and web-app/site topology for development and production.
- Shared identity, organization, membership, role, entitlement, and public-projection models.
- Registration, organization search/claim/create, enrichment, capability suggestion, and Exchange-ready onboarding.
- Marketing campaign attribution, lead capture, automated lifecycle email/SMS, activation, retention, and win-back foundations.
- Admin review queues, platform operations, billing/configuration controls, support functions, and audit requirements.
- Trusted backend boundaries for privileged operations, external integrations, billing, messaging, and enrichment.
- Logical data, event, integration, security, deployment, repository, migration, and observability architecture.

## 2.3 Out of Scope

- Pixel-level UI design. Visual and interaction standards are governed by the canonical **RFxchange Brand & Interface Design System**.
- Exact Firestore field-by-field schemas; this document establishes logical entities and ownership, with final schemas to be defined in implementation contracts.
- A final choice of search-index provider or advanced analytical warehouse.
- Final custom domains and new hosting destination IDs until verified in the live project. Production Firebase project identity and the three Web App IDs below are fixed.
- Detailed pricing copy or marketing content; commercial rules must be represented as configurable data rather than hard-coded UI behavior.

## 2.4 Architectural Goals

| Goal | Architecture response |
| --- | --- |
| In-place modernization | Retain Firebase project `rfxchange` (number `820964688242`), existing Auth identities, canonical Firestore data, Storage, Functions, integrations and Secret Manager. Extract application surfaces without replacing the backend. |
| Simpler participant experience | Keep participant concerns in the Exchange; remove platform-operator and campaign-authoring UI from the participant bundle. |
| Fast onboarding | Search existing organizations first, enrich automatically, ask for confirmation rather than manual re-entry. |
| Operational control | Provide a dedicated Admin Console with review queues, configuration, support, and audit. |
| Automated growth | Make Marketing & Acquisition a first-class application surface tied to campaign attribution and lifecycle events. |
| Secure integrations | Keep Stripe, Microsoft, Telnyx, SAM, AI, and other private credentials in trusted backend services and Secret Manager. |
| Independent evolution | Allow Marketing, Exchange, and Admin to deploy independently while using versioned shared packages/contracts. |

# 3. Architecture Principles

**One platform, three surfaces:** Application separation is a responsibility and deployment boundary, not a data silo. Canonical organizations, users, entitlements, events, and domain records remain shared.

**Organization-centered truth:** The organization is the durable business identity. Users participate through organization memberships; enrichment belongs to organizations, not individual users.

**Enrich before asking:** The system should use seeded data, public data, and existing platform knowledge before asking the user to type information already knowable.

**Confirm, do not silently overwrite:** Externally sourced data carries provenance and confidence. It may suggest canonical values, but conflicts and material changes require governed confirmation or review.

**Server-mediated privilege:** Money, entitlements, admin actions, awards, cross-organization state changes, enrichment, and communications execute through trusted backend code.

**Progressive availability:** A user should enter the Exchange once minimum readiness is achieved. Missing optional enrichment should reduce completeness, not unnecessarily block participation.

**Configuration over hard-coding:** Plans, seats, promotion limits, campaign rules, communication timing, and feature availability should be configuration-driven wherever practical.

**Events connect the platform:** Important state changes emit domain events that power notifications, lifecycle automation, analytics, auditing, and future intelligence.

**Mobile-first Exchange, desktop-capable Admin:** The participant application is map-first and mobile-first. Admin is optimized for dense operational review and can be desktop-first.

**No dead architecture:** Do not scaffold unused providers, routes, schemas, or services “for later” without an explicit near-term consumer. Abstractions exist only where they prevent real coupling.

# 4. Target Platform Overview

```text
RFxchange Platform
|
|-- Marketing & Acquisition Suite
|   |-- Public website and discovery
|   |-- Campaign landing pages
|   |-- Lead capture and attribution
|   |-- Pricing and conversion entry
|   |-- Public help / chatbot surface
|   `-- Lifecycle communication orchestration UI
|
|-- Exchange App
|   |-- Authenticated onboarding
|   |-- RFx lens
|   |-- Resources lens
|   |-- Intelligence lens
|   |-- Capabilities lens
|   |-- Cross-lens Referrals
|   `-- Organization/account participation
|
|-- Admin Console
|   |-- Organizations and claims
|   |-- Users and access
|   |-- Enrichment review and data quality
|   |-- Billing, plans, promotions, campaigns
|   |-- Moderation, support, configuration
|   `-- Audit and platform health
|
`-- Shared Platform Core
    |-- Firebase Auth
    |-- Firestore
    |-- Cloud Functions
    |-- Cloud Storage
    |-- Secret Manager
    |-- Cloud Tasks / Scheduler
    |-- Domain events and public projections
    `-- Trusted integration adapters
```

## 4.1 Logical Shells vs. Physical Applications

The platform still has three logical experience shells — public/acquisition, identity/onboarding, and authenticated Exchange — but these do not require three separate Firebase applications. The recommended physical application model is three apps: Marketing, Exchange, and Admin. The identity/onboarding journey spans Marketing and Exchange using a shared Auth and organization state model.

| Logical shell | Physical owner |
| --- | --- |
| Public / Acquisition | Marketing & Acquisition Suite |
| Identity entry / registration | Marketing owns acquisition entry; Exchange owns account creation and authenticated onboarding. Admin has an independent role-gated sign-in shell |
| Authenticated onboarding | Exchange App, with backend enrichment and Admin exception review |
| Authenticated Exchange | Exchange App |
| Platform operations | Admin Console |

# 5. Application Boundary Model

## 5.1 Marketing & Acquisition Suite

Marketing is a real application surface, not merely a brochure site. It owns the public acquisition journey from first visit through qualified registration entry, and it maintains campaign and lifecycle context that follows the user into the Exchange.

- Public home, value proposition, pricing, product education, legal/footer destinations, and support content.
- Public safe projections of selected opportunities, organizations, resources, and aggregate intelligence where strategically appropriate.
- Industry, geography, partner, referral, and paid regional campaign landing pages.
- Lead capture, first-touch/last-touch attribution, UTM/referral/campaign context, and anonymous-to-authenticated identity stitching where permitted.
- Registration entry and pre-auth organization search/preview when useful.
- Lifecycle journey definitions and operator-facing marketing configuration surfaces that are not privileged platform administration.
- Public chatbot/help experience using curated public knowledge only.

> **Boundary rule:** Marketing may initiate registration and organization discovery, but it must not implement its own organization database, entitlement logic, or participant transaction workflows.

## 5.2 Exchange App

The Exchange is the authenticated participant application. It owns the map-first, continuous participant experience and the transactional workflows performed by organizations and their members.

- Authenticated onboarding: organization claim/create, enrichment review, capability confirmation, and readiness.
- Persistent Exchange shell: map, universal search, floating controls, sliding results drawer, shared cards, shared detail surfaces, and bottom navigation.
- Permanent lenses: RFx, Resources, Intelligence, Capabilities.
- Cross-lens workflows: Referrals, favorites/watches, notifications, organization relationships, sharing, and account/member actions.
- Participant-safe organization and membership management according to entitlement and role.

## 5.3 Admin Console

The Admin Console is a separate web application deployed against the same production backend. Its purpose is to operate RFxchange as a platform. It should be independently deployable and may use a different, denser UI composition than the participant Exchange.

- Organization, user, membership, claim, and access review.
- Enrichment conflicts, low-confidence matches, duplicate/merge workflows, and data-quality queues.
- Plan, seat, entitlement, founding status, promotion, campaign, and configurable platform limits.
- RFx/resource/content moderation and exception management.
- Billing/support visibility and safe support operations.
- Feature configuration, lifecycle controls, operational dashboards, audit history, and system health.

## 5.4 Shared Packages vs. Shared Runtime

The apps should share code only where the concept is truly shared. Shared packages should contain types, validation, Firebase client initialization, auth/session helpers, design tokens/components, domain contracts, and safe query utilities. Privileged server logic must not be packaged into browser bundles.

# 6. Exchange Application Architecture

The modernization retains the established product model: the user remains inside one Exchange and changes what they are looking at through lenses. RFx, Resources, Intelligence, and Capabilities are projections of shared organization-centered data, not separate products.

## 6.1 Persistent Mobile Composition

- Persistent map as the base canvas.
- One universal search component whose semantic context changes by active lens.
- Floating translucent controls over the map rather than a conventional opaque mobile header.
- Three-state sliding result drawer: peek, working, expanded, with non-gesture accessibility controls.
- Four governed contextual action positions at the top of the working result surface.
- Shared Exchange card framework with lens-specific variants.
- Marker-to-card and card-to-marker synchronization.
- Reusable detail controller that returns the user to exact prior Exchange state.
- Bottom navigation: RFx | Resources | Intelligence | Capabilities | Menu.

## 6.2 Referrals

Referrals is a cross-lens domain service and workflow. A referral may originate from an organization, capability, RFx, resource, or intelligence record. Menu provides referral management; contextual “Refer” actions may appear anywhere allowed. Referrals should not require a permanent fifth data lens.

## 6.3 Shared Action Governance

The Exchange should resolve actions from context instead of letting pages invent buttons independently. Inputs include viewer, active organization, active lens, target record, ownership, permissions, entitlement, and workflow state. The result is a governed action set with visibility, applicability, authorization, and operational-state flags.

# 7. Identity, Organizations, and Authorization

## 7.1 Identity Model

```text
User (Firebase Auth identity)
|
+-- Organization Membership(s)
|   |-- role
|   |-- seat / entitlement context
|   `-- status
|
+-- Platform Role (rare; admin claims)
|
`-- Personal preferences / notification preferences

Organization
|-- canonical profile
|-- locations
|-- capabilities + evidence
|-- memberships
|-- RFx / resources / intelligence / referrals
|-- subscription / entitlements
`-- enrichment + provenance
```

## 7.2 Platform Roles vs. Organization Roles

| Role family | Examples | Where stored / enforced |
| --- | --- | --- |
| Platform role | super_admin, platform_admin, support_admin, data_admin, finance_admin, moderator | Existing persisted administrator lifecycle account, authority context, active scoped grants and provider-security checks; every privileged operation revalidated by the trusted backend. A claim or role name alone never grants administration. |
| Organization role | owner, admin, manager, member | Existing organization membership and authorization records in Firestore; evaluated by the trusted backend. Direct browser access remains denied. |

Platform roles and organization roles must never be conflated. An organization admin can administer their organization; that does not confer RFxchange platform administration rights.

## 7.3 Authentication

- Firebase Auth is the shared identity provider across Marketing registration, Exchange, and Admin.
- The same person may use the Exchange as an organization participant and Admin as a platform operator if their platform role allows it.
- Admin must fail closed: the application may render a sign-in shell, but privileged application initialization and data access require validated platform authorization.
- Multi-organization users switch active organization context explicitly; authorization remains tied to membership and entitlement.

# 8. Onboarding and Organization Claim

## 8.1 Minimum Data Asked of the User

Registration should capture only what is necessary to establish identity and locate the organization. The preferred sequence is name, work email/authentication, organization name, and one strong disambiguator such as website, ZIP code, or address. Everything else should be discovered, suggested, or deferred where possible.

## 8.2 Search Existing Organizations First

The RFxchange organization corpus is the first enrichment source. Before creating a new organization, onboarding searches existing seeded and claimed organizations. This reduces duplicate entities and lets a user claim an organization that already has geography, public identifiers, capability hints, or historical data.

## 8.3 Claim vs. Create

| Scenario | Behavior |
| --- | --- |
| High-confidence existing organization match | Offer “Is this your organization?” and begin a governed claim flow. |
| Ambiguous match | Request a disambiguator; if still ambiguous, allow claim submission and route to Admin review. |
| No match | Create a provisional organization and immediately begin enrichment. |
| Existing claimed organization | Use invitation/request-access flow rather than creating a duplicate organization. |

## 8.4 Exchange-Ready Definition

A user should not be blocked until a profile is exhaustive. Retain the existing activation and open-release predicates, including authentication/policy obligations, active organizational authority, confirmed geography/location, minimum profile and capability, and the applicable orientation/first-value requirements. This target must not bypass legal, restriction, membership, or geographic release checks. Optional enrichment continues after entry and contributes to profile completeness.

# 9. Enrichment Architecture

Enrichment is a shared backend capability owned by the organization domain. It should be callable during onboarding, from organization profile maintenance, from Admin data-quality operations, and from scheduled refreshes. The browser never holds private source credentials.

## 9.1 Enrichment Sources

| Source class | Examples | Purpose |
| --- | --- | --- |
| RFxchange internal | Seeded organizations, prior claims, prior enrichments, existing capabilities | Match/claim first; avoid duplicate organizations; reuse known truth. |
| Government procurement | SAM.gov, USAspending.gov | UEI/registration, award/past-performance signals, public procurement identity. |
| Organization web presence | Official website and structured pages | Description, services/capabilities, contact/location hints, public evidence. |
| Geographic | Address validation/geocoding, map provider | Canonical coordinates, locality/county/state, service-area support. |
| Business/public registries | State or other authoritative sources where practical | Legal identity, status, public business attributes. |
| AI-assisted extraction | Server-side model adapter | Normalize descriptions and suggest AMACS capability mappings from evidence; never treated as independent authoritative proof. |

## 9.2 Parallel Fan-Out and Nonfatal Failure

Independent sources should be queried concurrently. A missing SAM record or a temporarily unavailable public API should not fail the entire onboarding request. Each source produces a status, timestamp, result payload/reference, normalized findings, confidence, and error metadata where applicable.

## 9.3 Provenance and Confidence

```text
enrichmentRun
  organizationId
  startedAt / completedAt
  status
  sourceResults[]
    source
    succeeded
    retrievedAt
    normalizedFindings
    confidence
    sourceReference
    errorCode
  conflicts[]
  suggestedChanges[]
  overallConfidence
```

Canonical organization fields should retain provenance or an audit trail of how the value was established. Enrichment must not silently replace a user-confirmed legal identity, address, or capability because a lower-confidence source disagrees.

## 9.4 Capability Enrichment

Capability suggestions should combine organization description, website evidence, known classifications, procurement history, and user-supplied information, then map results into the AMACS taxonomy. Suggested mappings carry evidence and confidence; the organization can confirm, reject, or add capabilities.

## 9.5 Admin Exception Queue

- Low-confidence organization claim.
- Potential duplicate organization.
- Conflicting legal names/addresses/UEIs.
- Material capability dispute or suspicious evidence.
- Repeated enrichment failures from a critical source.
- User-requested merge/correction that affects shared platform identity.

# 10. Marketing and Lifecycle Architecture

Marketing & Acquisition is responsible for getting the right organizations into RFxchange and helping them reach activation. Because it shares the platform core, it can connect campaign source, organization identity, onboarding progress, first value, subscription, retention, and downstream usage without creating a disconnected CRM-like data island.

## 10.1 Acquisition Capabilities

- Campaign-specific landing pages by geography, industry, capability, partner, or promotion.
- Public discovery of safe RFxchange projections to create immediate utility before registration.
- Lead capture and campaign/referral attribution.
- Pricing/membership and conversion entry points.
- Organization finder / claim entry from the public experience.
- Custom region campaigns and governed sponsored placement inventory.

## 10.2 Attribution Model

```text
AcquisitionContext
  anonymousVisitorId (where permitted)
  leadId
  campaignId
  referralId
  firstTouch
  lastTouch
  landingPage
  geography
  interestSignals[]
  registeredUserId
  organizationId
  registeredAt
  activatedAt
  convertedAt
```

## 10.3 Lifecycle Automation

Lifecycle automation should be event-driven and state-aware rather than a collection of generic drip emails. The system determines the next useful action from current journey state and stops obsolete messages automatically.

| Trigger / condition | Example action |
| --- | --- |
| Registered, no organization claimed | Send completion reminder; deep-link back to organization finder. |
| Organization claimed, capabilities not confirmed | Send “we found capabilities for you” prompt. |
| Capabilities confirmed | Surface matching opportunities/resources rather than continuing setup reminders. |
| Response started but incomplete | Send permitted transactional reminder tied to the actual draft/deadline. |
| Subscription or entitlement change | Send billing/entitlement communication and adjust journeys. |
| Inactive but previously activated | Enroll in retention/win-back journey within communication preferences. |

## 10.4 Communications Engine

```text
Domain Event
    |
    v
Journey Evaluator
    |
    +--> immediate communication
    |
    `--> scheduled job --> Cloud Tasks / Scheduler
            |
            +--> Microsoft Graph Email
            `--> Telnyx SMS

Every send checks:
consent • channel preference • suppression • purpose • rate/frequency • current journey state
```

## 10.5 Marketing vs. Transactional Messaging

The communications model must distinguish transactional/service messages from promotional/marketing messages. Consent, unsubscribe/suppression, SMS permission, and channel preferences are first-class data. Marketing automation must not bypass these controls simply because it is triggered by an application event.

# 11. Admin Console Architecture

Admin is a separate web application with its own routing, bundle, deployment, and operational UX. It shares the production backend but receives no privileged credential in the browser. High-impact changes are executed through trusted server functions that revalidate authorization and write an audit event.

## 11.1 Primary Admin Domains

| Area | Representative responsibilities |
| --- | --- |
| Overview / Operations | Platform health, attention queues, key activity and conversion indicators. |
| Organizations | Search, inspect, merge, claim review, restriction/suspension workflows, data corrections. |
| Users & Memberships | Access support, membership visibility, platform-role administration through trusted flows. |
| Enrichment | Run/re-run enrichment, inspect source findings, resolve conflicts, approve merges/corrections. |
| RFx / Resources / Content | Moderation, exception handling, support visibility. |
| Billing & Entitlements | Stripe-linked status, plans, seats, overrides, founding/promotional controls, exception resolution. |
| Campaigns & Promotions | Regional campaigns, placement inventory, limits, schedules, advertiser configuration. |
| Lifecycle & Support | Journey configuration, suppression/support tools, communication history, chatbot/support configuration. |
| Audit & Configuration | Admin audit trail, feature configuration, system settings, controlled operational flags. |

## 11.2 Admin UX

Admin should be desktop-capable and information-dense: table/search/filter/queue patterns are appropriate. It does not need to inherit the Exchange map-first composition. Shared brand tokens and components may be reused, but participant navigation should not constrain platform-operator workflows.

# 12. Data Architecture

Firestore is the primary transactional store for the modernization baseline. The logical model should be designed around durable domain entities rather than copying screen forms into collections. Public exposure should use safe projections rather than granting anonymous access to canonical records.

## 12.1 Core Logical Entities

| Domain | Logical entities |
| --- | --- |
| Identity | users, userPreferences, notificationPreferences |
| Organizations | organizations, organizationLocations, organizationMemberships, organizationClaims |
| Capabilities | amacsNodes, organizationCapabilities, capabilityEvidence |
| Enrichment | enrichmentRuns, enrichmentSourceResults, enrichmentConflicts / suggested changes |
| RFx | opportunities/rfx, requirements, responses, teams, evaluations/awards, watches |
| Resources | resources, offers, requests, availability |
| Intelligence | insights, signals, datasets/metadata, geographies, derived metrics |
| Relationships | referrals, favorites, follows, watches, organizationRelationships |
| Commercial | plans, subscriptionsMirror, entitlements, seats, promotions, campaigns, placements |
| Marketing | leads, acquisitionContexts, journeys, journeyEnrollments, communicationJobs, communicationEvents |
| Operations | domainEvents, adminAuditEvents, supportCases, featureConfiguration |
| Public projection | publicOrganizations, publicOpportunities, publicResources, publicInsights / aggregated metrics |

## 12.2 Canonical vs. Derived Data

- Canonical records are the source of transaction truth: organizations, memberships, RFx, resources, entitlements, etc.
- Enrichment findings are source-aware evidence and suggestions; they are not automatically canonical truth.
- Public projections are derived safe read models intended for anonymous/public marketing use.
- Search indexes, analytics stores, and map aggregates are derived and rebuildable from canonical data/events.
- Stripe remains the billing-system source of truth for payment state; Firestore mirrors platform-required subscription/entitlement state through verified webhooks.

## 12.3 Geography

Organization and record geography is a platform domain, not a text-only address field. The baseline must store normalized addresses, coordinates, locality/county/state/country identifiers, and service-area information where applicable. Advanced spatial analytics may later use a dedicated geospatial/analytical store without changing the application boundaries defined here.

# 13. Event and Workflow Architecture

Important state changes should emit durable domain events. Events allow Marketing, notifications, analytics, audit, recommendations, and future intelligence to react without inserting those responsibilities directly into participant transaction code.

## 13.1 Representative Events

- `account_registered`
- `organization_match_found`
- `organization_claim_submitted`
- `organization_claimed`
- `organization_created`
- `enrichment_started`
- `enrichment_completed`
- `enrichment_conflict_created`
- `capability_suggested`
- `capability_confirmed`
- `exchange_activated`
- `rfx_viewed`
- `rfx_watched`
- `rfx_response_started`
- `rfx_response_submitted`
- `resource_saved`
- `referral_created`
- `subscription_started`
- `subscription_changed`
- `subscription_canceled`
- `promotion_activated`
- `admin_action_completed`

## 13.2 Event Delivery Pattern

For the modernization baseline, domain-event documents can be written transactionally with the canonical state change and processed by Cloud Functions. Delayed lifecycle actions should be materialized as scheduled communication/workflow jobs and dispatched through Cloud Tasks or scheduled functions. Handlers must be idempotent so retries do not duplicate billing, messaging, or state transitions.

# 14. Integration Architecture

| Integration | Responsibility | Boundary |
| --- | --- | --- |
| Stripe | Subscriptions, payments, payment links/checkout, billing events | Server-side SDK + verified webhooks; Firestore mirrors entitlements, never trusts browser claims. |
| Microsoft Graph / Microsoft email | Transactional and lifecycle email from approved mailboxes | Server-side adapter; credentials/tokens in Secret Manager; templates and send jobs governed by communications service. |
| Telnyx | SMS notifications/lifecycle messages | Server-side adapter; consent and opt-out enforcement; delivery events persisted. |
| Mapbox / MapLibre | Map rendering, geocoding/geography support as selected | Public map token may be browser-appropriate; private service credentials remain server-side. |
| SAM.gov | Entity registration enrichment | Server-side source adapter; API key in Secret Manager; failures are nonfatal to overall enrichment. |
| USAspending.gov | Award/past-performance signals | Server-side source adapter; normalized findings persisted with source metadata. |
| AI provider | Capability extraction/mapping, intelligence assistance, support/chat augmentation | Server-side provider adapter; structured outputs validated; AI is not authoritative truth. |

## 14.1 Integration Adapter Rule

Each external service should have one server-side adapter with a small platform-owned interface. Domain code asks for capabilities (send SMS, create checkout, fetch SAM entity, enrich website) rather than importing vendor SDKs throughout the codebase. This keeps provider changes bounded without over-abstracting the entire platform.

# 15. Firebase and Google Cloud Platform Model

| Service | Use in RFxchange |
| --- | --- |
| Firebase Authentication | Shared user identity across all application surfaces. |
| Cloud Firestore | Primary transactional domain store and configuration store. |
| Cloud Functions | Trusted domain operations, webhooks, enrichment, messaging, admin commands, event handlers. |
| Cloud Storage | Organization evidence, RFx attachments, resource media, controlled supporting documents. |
| Google Cloud Secret Manager | Stripe, Microsoft, Telnyx, SAM, AI and other non-public server credentials. |
| Cloud Tasks / Firebase task queues | Delayed/retryable lifecycle communication and workflow jobs. |
| Cloud Scheduler | Periodic refresh/reconciliation/maintenance where condition-triggered events are insufficient. |
| Firebase Hosting / App Hosting | Application delivery. Exact hosting product can differ by surface based on SPA vs. server-rendering needs. |
| Firebase App Check | Additional abuse protection for supported client-to-backend access paths. |

## 15.1 Direct Firestore vs. Backend API

The existing server-mediated data boundary is retained: direct browser Firestore and Storage access remains default-denied. Applications call the existing authenticated server handlers and domain services. Application separation does not authorize client SDK reads/writes to canonical records or a new authorization model. Public Marketing reads use explicit server-created safe projections.

# 16. Security Architecture

## 16.1 Security Requirements

- No Firebase Admin SDK, service account, Stripe secret, Microsoft secret, Telnyx API key, SAM API key, or AI secret may ship to a browser bundle.
- Firestore and Storage Rules must enforce tenant/organization boundaries independently of UI visibility.
- Privileged operations revalidate Firebase identity and required platform/organization authorization server-side.
- Admin Console route hiding is convenience only; server authorization is the control.
- Public marketing reads use purpose-built public projections with no private fields.
- Webhook endpoints verify provider signatures and are idempotent.
- Sensitive actions write immutable/append-oriented audit events and capture a reason when appropriate.
- Secrets are accessed by the minimum runtime identity required; development and production secrets remain isolated by project/environment.
- Rate limiting, abuse controls, input validation, output normalization, and file validation are part of each public/trusted boundary.

## 16.2 Data Minimization

The platform should store only data needed for RFxchange operation, legitimate enrichment, communications, billing, and support. Enrichment adapters should collect/normalize intended public business facts rather than indiscriminately retaining full third-party payloads.

# 17. Deployment and Environment Strategy

## 17.1 Firebase Project Strategy

Production remains the existing Firebase project **`rfxchange`**, project number **`820964688242`**. The product owner has registered these Web Apps:

| Application | Firebase App ID | Code and delivery boundary |
| --- | --- | --- |
| RFxchange Exchange | `1:820964688242:web:c6135b13f98d4055e1ddeb` | Retain the existing root Next.js app and App Hosting backend `rfxchange`, region `us-east4`, while extracting the other surfaces. |
| RFxchange Admin | `1:820964688242:web:dad47f91134e3e11e1ddeb` | Independent Next.js application at `apps/admin`, reusing the existing server authorization and audit services. |
| RFxchange Marketing | `1:820964688242:web:a0d73136aba27643e1ddeb` | Independent application at `apps/marketing`, with public acquisition and explicit Exchange handoff. |

Web App registration is SDK identity, not a hosting deployment or permission boundary. The user also created Hosting destinations; inventory their actual IDs and product type before binding them. Do not infer Hosting site IDs or App Hosting backend IDs from the Web App nickname. Preserve all existing registrations and resources.

Exchange's configured production origin is `https://rfxchange--rfxchange.us-east4.hosted.app`. New origins must be recorded after live inventory. Use separate App Hosting backends for the extracted server-rendered apps unless a reviewed implementation proves an equivalent secure deployment. Ordinary Firebase Hosting rewrites require special attention to the existing custom session and CSRF cookies; do not move the authenticated runtime behind them unchanged.

Use the existing emulators for local integration. A separate development project may be added when operationally needed; creating or migrating to a replacement production project is outside this modernization. No current data should be copied to an unverified environment.

### Cross-application identity and acquisition

- Firebase identities are shared. Browser sessions and cookies are origin-scoped and must not be assumed to transfer automatically.
- Marketing sends registration and sign-in to the configured Exchange origin. Preserve only validated acquisition parameters/opaque references and locale; never put credentials, session cookies, Firebase ID tokens or privileged data in URLs.
- Exchange validates incoming acquisition context through the existing service and binds it during account/organization activation. URL parameters never grant authority.
- Admin signs in on its own origin, establishes a host-only server session and revalidates the persisted administrator lifecycle, recent authentication and scoped grants. Organization administration is not platform administration.
- Shared links use explicit configured origins. Return destinations are validated local paths at their receiving application; no arbitrary cross-origin redirect is accepted.
- Secrets remain server-side and are bound only to an application's actual server consumers. App-specific public Firebase config must match the registrations above.

### Production hosting and Stabilization 2C

Follow `POST_WAVE_3_STABILIZATION_2C_SAME_SHA.md` for the existing Exchange backend. Preserve the previous serving build, confirm successful CI for the exact merged commit, bind `RFXCHANGE_BUILD_SHA` for BUILD and RUNTIME, deploy that exact commit, and capture actual Firebase build/rollout evidence. Keep automatic rollouts paused during commit-specific manual binding. A reachable page does not prove 2C; an unresolved historical 2C label does not prove an outage.

Frontend extraction must not deploy or overwrite Firestore/Storage rules, shared Functions, secrets, IAM or databases incidentally. Inventory first; preserve existing data and production service ownership.

## 17.2 Logical Production Sites

| Target | Example domain | Deployment independence |
| --- | --- | --- |
| marketing | `rfxchange.com` | Can deploy acquisition/public content without redeploying Exchange or Admin. |
| exchange | `app.rfxchange.com` | Can deploy participant experience independently. |
| admin | `admin.rfxchange.com` | Can deploy platform operations independently. |

## 17.3 Preview and Release

- All apps build from a pinned toolchain and shared lockfile/workspace configuration.
- Pull requests produce application-specific previews where supported.
- Firestore Rules, indexes, Functions, and shared contracts are tested before production deployment.
- A frontend-only deployment must not implicitly replace backend rules/functions unless that change is part of the release.
- Production releases are reversible where practical; schema changes use backward-compatible migration windows or explicit cutover steps.

# 18. Repository and Code Ownership Model

```text
RFxchange/
|-- apps/
|   |-- marketing/
|   |-- (Exchange remains at repository root during extraction)
|   `-- admin/
|
|-- packages/
|   |-- auth/
|   |-- firebase-client/
|   |-- domain-types/
|   |-- validation/
|   |-- ui/
|   `-- analytics-events/
|
|-- functions/
|   |-- organizations/
|   |-- enrichment/
|   |-- rfx/
|   |-- resources/
|   |-- intelligence/
|   |-- referrals/
|   |-- billing/
|   |-- communications/
|   |-- marketing/
|   `-- admin/
|
|-- firestore.rules
|-- firestore.indexes.json
|-- storage.rules
|-- firebase.json
`-- .firebaserc
```

## 18.1 Monorepo Rationale

The three applications should remain in one repository unless scale later creates a clear operational reason to split them. A monorepo makes shared contracts and Firebase configuration explicit, enables atomic cross-app changes when genuinely necessary, and avoids duplicating core types. Independent build/deploy targets preserve application separation.

## 18.2 Boundary Enforcement

- Browser packages cannot import trusted server modules.
- Marketing cannot import Exchange feature implementations; it consumes public projections/contracts.
- Admin cannot directly mutate canonical data through ad hoc client writes for privileged operations; it invokes trusted admin commands.
- Domain types and validation are versioned/shared so all surfaces speak the same canonical contract.
- Avoid empty “future” modules. Add an adapter or package when a real workflow consumes it.

# 19. Observability, Audit, and Supportability

## 19.1 Operational Observability

- Structured server logs with request/correlation IDs for Functions and integration calls.
- Enrichment-run status and per-source success/failure visibility.
- Communication job status, provider message ID, send/delivery/failure state, suppression reason.
- Stripe webhook processing status and reconciliation indicators.
- Application error reporting and performance monitoring appropriate to each surface.
- Admin attention queues for failed/retrying operational work rather than hidden background errors.

## 19.2 Admin Audit Events

```text
adminAuditEvent
  actorUid
  actorEmail (snapshot/display only)
  platformRole
  action
  targetType
  targetId
  before (selected safe fields)
  after (selected safe fields)
  reason
  requestId
  createdAt
```

Audit events should be append-oriented and separate from product analytics. Not every read requires a formal audit record, but privileged state-changing actions should.

# 20. Nonfunctional Requirements

| Area | Baseline requirement |
| --- | --- |
| Performance | Exchange shell prioritizes fast initial usable state, incremental data loading, viewport-aware map queries, and cached/derived public projections. |
| Reliability | Third-party failures degrade gracefully; critical jobs retry idempotently; user-facing state exposes recoverable failure instead of silent loss. |
| Accessibility | Keyboard/non-gesture alternatives, screen-reader labels, adequate contrast, focus management, and accessible drawer/detail controls. |
| Mobile | Exchange is mobile-first with safe-area handling and responsive desktop adaptation; Admin remains responsive but may be desktop-first. |
| Security | Least privilege, rules tests, trusted privileged operations, secret isolation, validated inputs, signed webhooks, public projections. |
| Maintainability | Typed contracts, bounded modules, one integration adapter per provider, independent apps, no duplicated organization truth. |
| Testability | Unit tests for domain logic; Firebase emulator tests for rules/functions; integration tests for providers behind mocks; E2E tests for critical journeys. |
| Privacy/Consent | Purpose-aware messaging consent and suppression; public vs. private data classifications; minimal data retention. |

# 21. Migration and Cutover Strategy

Modernize in place. Existing canonical records, Auth UIDs, organization IDs, memberships, administrator lifecycle/grants, RFx history, commercial state, media and audit records remain in `rfxchange`. Do not normalize or rewrite live records merely to match illustrative logical names in this document.

## 21.1 Existing model takes precedence over illustrative entities

The logical entity table describes responsibilities, not instructions to rename collections. Continue using the repository's existing collection contracts, including `organizationAuthorityClaims`, `organizationCapabilityClaims`, `businessReferrals`, `rfxAggregates`, `rfxEvents`, `rfxCommands`, `providerApplications`, `providerResources`, `organizationCommercialAccounts`, `acquisitionContexts` and `platformAdministrativeAuditEvents`. Resolve exact schemas from the existing repositories and domain contracts before modifying a consumer.

## 21.2 Cutover and cleanup

1. Verify existing production hosting and complete the applicable 2C release procedure.
2. Bring this SAD and Design System v2 into RFxchange and reconcile conflicting legacy guidance.
3. Extract Admin pages, required handlers and sign-in as an independently built application; retain server-side authorization, scope and audit behavior.
4. Build and deploy Marketing with its public pages and validated Exchange registration/acquisition handoff.
5. Apply Design System v2 to Exchange while preserving the persistent map, universal search, results sheet, four lenses and Menu, selection and return continuity.
6. Switch old application entry routes only after the destination has passed deployment and critical journey checks. Preserve useful deep links and a known rollback route.
7. Remove superseded UI/runtime code after consumers migrate. Consolidate redundant validators while keeping meaningful domain, authorization, tenancy, payment and workflow tests.

Do not delete live Firebase resources as code cleanup. Any later destructive cleanup requires a verified inventory, dependency checks, recoverable backup where applicable and specific authorization. A frontend release is not a data migration.

# 22. Delivery and completion

| Milestone | Completion means |
| --- | --- |
| Production hosting / 2C | Existing app is reachable; reviewed exact source, passing CI, build identity, successful rollout and rollback are established through the release procedure. |
| Architecture / design | This SAD governs in-place modernization; Design System v2 is the adopted visual target; source tokens and consumers are reconciled as implementation changes land. |
| Admin | Separate app builds and deploys; an authorized operator can use the implemented operational workflows; unauthenticated, ordinary-user, revoked, stale and wrong-scope requests cannot gain privileged access. Sensitive commands preserve audits. |
| Marketing | Separate app builds and deploys with current public content, responsive navigation and working acquisition/registration links into Exchange; no privileged data or keys enter its browser bundle. |
| Exchange convergence | Bright cool-neutral design, persistent map and results sheet, permanent RFx/Resources/Intelligence/Capabilities/Menu navigation, and cross-lens continuity work against existing domain services. Superseded runtime code is removed after cutover. |

Implementation, merge and deployment are distinct states. This document is a target and does not claim the milestones complete. Do not mark unrelated roadmap Feature IDs complete because their app has been extracted. Existing incomplete lifecycle/commerce integrations remain explicitly tracked until their real runtime and configuration are delivered; never invent provider credentials or report an unsent message as sent.

# 23. Architecture Decision Register

| ID | Status | Decision | Reason |
| --- | --- | --- | --- |
| ADR-01 | Amended | Retain production project `rfxchange`; use local emulators and a separate development project when needed. | Preserve production identities/data and avoid a greenfield migration. |
| ADR-02 | Accepted | Marketing, Exchange, and Admin are separate web applications/sites within each environment project. | Independent UX/deployment boundaries while sharing backend truth. |
| ADR-03 | Accepted | Admin Console is not embedded in the participant Exchange bundle. | Smaller participant app, clearer operations/security boundary, independent deployment. |
| ADR-04 | Accepted | Marketing & Acquisition is a first-class application surface, not only a brochure site. | Connect acquisition, onboarding, campaigns, lifecycle, and conversion to platform events. |
| ADR-05 | Accepted | Firebase Auth identity is shared across application surfaces. | One user identity and consistent organization membership. |
| ADR-06 | Accepted | Organizations, not users, own business profile/enrichment/capability truth. | Supports multi-seat organizations and durable organization identity. |
| ADR-07 | Accepted | Search existing RFxchange organizations before creating a new one. | Reduce duplicates and exploit existing seed/public data. |
| ADR-08 | Accepted | Enrichment is parallel, source-aware, confidence-scored, and nonfatal per source. | Fast onboarding and graceful handling of organizations without government records. |
| ADR-09 | Accepted | External enrichment suggests canonical changes; it does not silently overwrite confirmed truth. | Preserve provenance, trust, and operator/user correction. |
| ADR-10 | Accepted | Permanent participant lenses are RFx, Resources, Intelligence, Capabilities; Referrals is cross-lens. | Matches latest product direction and simplifies the navigation model. |
| ADR-11 | Accepted | Privileged operations execute server-side; the browser never receives Admin SDK or service credentials. | Security boundary independent of UI. |
| ADR-12 | Accepted | Stripe billing state is integrated through server/webhook flows; entitlements are mirrored to platform data. | Consistent access control and billing reconciliation. |
| ADR-13 | Accepted | Microsoft email and Telnyx SMS are accessed through a shared communications service. | Centralize consent, templates, retries, suppression, and delivery history. |
| ADR-14 | Accepted | Google Cloud Secret Manager stores non-public integration secrets. | Central secret lifecycle and environment isolation. |
| ADR-15 | Accepted | The codebase is a monorepo with independently deployable apps and shared typed packages. | Clean boundaries without duplicating contracts. |
| ADR-16 | Accepted | Privileged Admin changes generate audit events. | Accountability and supportability as the platform becomes commercial. |
| ADR-17 | Amended | Extract and cut over application surfaces in place; retain existing canonical collections and identifiers. | Remove runtime coupling without introducing a database migration. |
| ADR-18 | Proposed | Use Cloud Tasks/task queues for delayed lifecycle communication jobs. | Reliable scheduling/retry model that remains inside the Firebase/Google Cloud stack. |

# 24. Open Decisions and Future Extensions

| Decision | Current position |
| --- | --- |
| Frontend framework by app | Use TypeScript and shared packages. Exact React/Vite/Next.js choice may differ by surface; Marketing may justify server rendering/SEO while Exchange/Admin may favor SPA delivery. |
| Firebase Hosting vs. App Hosting | Application-boundary decision is independent of hosting product. Select per framework/rendering requirements during foundation. |
| Search provider | Begin behind a shared Exchange Search contract; choose Firestore-derived search vs. dedicated index based on measured needs. |
| Advanced geospatial analytics | Firestore remains transactional baseline; add derived geospatial/analytical storage only when map/intelligence queries justify it. |
| Analytics warehouse | Domain events are canonical inputs; BigQuery or another warehouse can be added later without becoming transaction truth. |
| AI provider/model routing | Keep server-side adapter and structured validation; provider/model choices remain configurable. |
| Production topology | `rfxchange` and the three App IDs in §17.1 are fixed. Inventory and record each actual Hosting/App Hosting destination and origin before deployment. |

# Appendix A. Representative End-to-End Workflows

## A.1 Campaign Visitor to Activated Exchange Participant

1. Visitor lands on a geography/industry campaign page; Marketing records permitted attribution context.
2. Visitor searches for their organization using the shared public organization projection/search service.
3. Visitor follows the validated acquisition handoff to Exchange, registers there using Firebase Auth, and continues authenticated onboarding on that same origin.
4. Exchange reuses the candidate organization match. The user claims the existing organization or creates a provisional one.
5. Trusted enrichment function fans out to applicable sources, normalizes findings, records provenance/confidence, and creates exceptions if needed.
6. User confirms/corrects organization data and reviews suggested AMACS capabilities.
7. Once minimum readiness is met, the Exchange activates and the user enters the persistent map-first shell.
8. Domain events stop setup reminders and may trigger value-oriented messaging such as relevant opportunity/resource matches.

## A.2 Ambiguous Organization Claim

1. User selects an organization whose claim evidence is below the automatic threshold.
2. System records a pending claim and allows limited progression according to policy without duplicating the organization.
3. Admin receives the claim in a review queue with source evidence and conflict context.
4. Admin approves, rejects, requests correction, or merges duplicate identity through a trusted server command.
5. Audit event records the decision; user membership and onboarding state update; lifecycle messaging reacts to the new state.

## A.3 Admin Changes a Commercial Entitlement

1. Admin opens organization billing/entitlement detail in the separate Admin Console.
2. Admin requests an authorized override or configuration change and provides a reason where required.
3. Trusted backend validates platform role and commercial invariants, updates canonical entitlement/configuration state, and coordinates with Stripe only where applicable.
4. Audit event records actor, target, before/after state, reason, and request ID.
5. Exchange sees the updated entitlement through the shared backend without any Admin code being present in the participant bundle.

# Appendix B. AccelProcure Lessons Carried Forward

The `AccelAnalysis/AccelProcure` repository is useful as an architectural precursor, especially its intended separation of registration, profiles, and enrichment. The clean RFxchange design keeps the useful ideas while correcting the incomplete wiring observed in that prototype.

| AccelProcure lesson | RFxchange modernization response |
| --- | --- |
| Registration should be lightweight. | Ask for minimum identity/organization disambiguation, then enrich rather than expanding the registration form. |
| Enrichment sources can run in parallel. | Use concurrent source adapters with independent success/failure and normalized findings. |
| A missing public record should not fail onboarding. | Per-source failures are nonfatal; completeness and confidence reflect what was found. |
| Normalized enrichment is more useful than dumping raw API responses. | Persist source-aware normalized findings, provenance, confidence, conflicts, and suggested canonical changes. |
| Registration/profile contracts must align end-to-end. | Use shared typed schemas/validation across forms, client services, Functions, and tests. |
| Profile creation cannot be implicit. | Organization and membership creation are explicit, transactional onboarding steps before enrichment depends on them. |
| An enrichment API is not an onboarding product by itself. | Wire the full journey: claim/create → enrich → confirm → capabilities → Exchange readiness → lifecycle events. |
| Empty future scaffolding becomes weight. | No unused provider abstractions, empty schema placeholders, or dead service routes in the modernization baseline. |

# Adoption Statement

> **Target architecture:** As adopted for the existing `AccelAnalysis/RFxchange` repository, this SAD should serve as the architecture authority for application boundaries and platform-core responsibilities. Lower-level PRDs and technical designs may add detail, but should not silently collapse Marketing, Exchange, and Admin back into one application or create competing organization/identity systems.



## Visual authority

All three applications SHALL conform to `../design/RFxchange_Brand_Interface_Design_System_v2.0.md`. The SAD does not prescribe page-level pixels. Design System v2 governs brand, colors, typography, geometry, spacing, glass, controls, navigation, motion, accessibility and responsive behavior. Bright white/cool-neutral surfaces and deep slate replace the prior ivory/black atmosphere. Screen specifications may compose these primitives but cannot introduce conflicting conventions. Integrate v2 tokens with current consumers instead of replacing incompatible exports blindly.

## Reference provenance

Adapted from `AccelAnalysis/AccelPO` SAD v1.0 and Design System v2 supplied by the product owner. AccelPO remains reference provenance; all modernization implementation belongs to `AccelAnalysis/RFxchange`. Older diagrams naming Referrals as a lens or obsolete founding prices are historical references. Current product/commercial decisions prevail.
