# RFxchange User Journey — Normalized Implementation Context

## Governing journey

The RFxchange onboarding model is organization-centered from the first interaction. The canonical lifecycle is:

```text
Discover RFxchange
→ Create Organization Account + First User
→ Accept Terms / Privacy / Conduct
→ Select Operating Geography
→ Interactive Platform Orientation
→ Find / Claim / Create Organization
→ Establish Organizational Authority
→ Confirm Organization Location
→ Complete Essential Registration
→ Profile Complete + Marker Activation
→ Enter the Exchange
→ First-Value Action
→ OPEN Platform Release
→ Progressive Enrichment / Verification / Additional Users / Credibility
```

A useful internal state model is:

```text
Visitor
→ Account Started
→ Account Activated
→ Geography Selected
→ Organization Resolved
→ Organization Registered
→ Organization Activated
→ Controlled Platform
→ Open Platform
```

Internal state names such as `controlled-platform` must not become participant-facing copy.

## Non-negotiable structural rule

A person must not pass through an independent personal RFxchange account stage that becomes the operating product model. Authentication creates the user identity; the user is attached to an organization account and acts beneath that organization.

Returning sign-in requires email and password only. Organization name is collected during registration or in a separate organization-setup step after authentication, never as an authentication credential.

## Geography precedes orientation

The user selects the organization's primary locality before the interactive orientation so the tutorial can occur inside a recognizable geographic context.

Locality selection uses an accessible typeahead. Suggestions appear as the user types, are cached for responsive reuse, retain Census/FIPS identity, and are resolved again server-side before becoming authoritative.

## Orientation

Orientation is not a generic product tour. It is a synthetic, three-organization Exchange journey showing how an issuer, responder and teammate interact across an RFx lifecycle.

## Organization resolution

The organization name captured early in signup is reused. Resolution combines that provisional identity with selected geography, website/domain, phone where supplied, seeded data and existing RFxchange organizations.

The user chooses either:

- **This is my organization**, or
- **None of these — create this organization**.

Provisional organization website and phone are persisted as resumable activation context and carried into essential registration. The user must not re-enter them after refresh or later steps.

## Authority is separate from verification

If the user claims an existing organization, the platform establishes whether the person may manage it. Evidence may include domain email, an existing administrator invitation, administrative review, organization documents or authoritative records.

Successful authority establishes the user/organization administrative relationship. It does **not** automatically make the organization Verified or an Official Resource Provider.

## Location

After authority is established, the platform captures the organization location and geocodes it. The user confirms the map position.

Actual internal location and public display location are distinct. Public visibility may be exact, approximate or locality-only where policy permits.

## Essential registration

Before activation, collect only enough information for meaningful network participation:

- durable organization identity;
- explicit website or no-public-website disposition, carried forward from resolution;
- authenticated user name/email as the default organization contact;
- contact organization title and public-contact choice;
- primary location and visibility;
- service geography; and
- at least one specific capability with a controlled category and description.

Do not ask for organization type, participation roles, or business objectives during activation.

A broad value such as “Services” is not a meaningful capability. Selecting Other requires a custom category.

## Universal buyer and supplier behavior

Every activated organization may both find/respond to opportunities and create/issue opportunities, subject to organization authority, user permissions, integrity controls, and workflow rules.

Buyer, Supplier, and Issuer are contextual transaction positions rather than permanent registration classifications.

## Official Resource Provider

An organization does not self-declare Resource Provider during registration. After activation, it may submit a separate application that captures provider category, services/programs, service geography, eligibility, intake, contact, modality, language, and evidence. Administrator approval produces Official Resource Provider status.

## Profile Complete

`Profile Complete` is an automatically derived organization-level state/credential. It reflects identity, website disposition, contact, meaningful capability, service geography, location visibility, and confirmed location.

Organization type, participation roles, business objectives, paid status, Verification, and provider status are not completion requirements.

## Marker activation

Once the minimum activation requirements are satisfied, the organization's real marker appears in the selected locality. This is a deliberate success moment.

## Exchange entry

After marker activation, the user enters the real application from the organization's perspective. Customer-facing copy says **Enter the Exchange** or **Welcome to the RFxchange**; “Controlled Exchange” remains internal lifecycle language only.

## First value

The Exchange exposes both opportunity-discovery and opportunity-issuance pathways without requiring a business-objective declaration. First-value guidance may use observed actions, explicit post-activation choices, or contextual prompts.

## OPEN gate

OPEN is a terminal activation state, not a generic authenticated state. At minimum, release requires the relevant user/account, policy, organization relationship, geography, profile, location/marker and education/first-value conditions.

OPEN does not require Organization Verified or Official Resource Provider status.

## Progressive enrichment

Organization type, advanced certifications, richer capability detail, verification evidence, optional preferences, additional users, credibility and commercial choices occur after the minimum activation path unless a specific governed workflow genuinely requires them earlier.
