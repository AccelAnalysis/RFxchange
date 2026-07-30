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
→ Controlled Platform Entry
→ First-Value Action
→ OPEN Platform Release
→ Progressive Enrichment / Verification / Additional Users / Credibility
```

A useful state model is:

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

Restriction states may coexist, including Restricted, Suspended, Integrity Hold and Terminated.

## Non-negotiable structural rule

A person must not pass through an independent "personal RFxchange account" stage that becomes the operating product model. Authentication creates the user identity; the user is attached to an organization account and acts beneath that organization.

## Geography precedes orientation

The user selects the organization's primary locality before the interactive orientation so the tutorial can occur inside a recognizable geographic context.

The platform asks where the organization is primarily based, resolves the locality to canonical geographic identity (including FIPS where applicable), and validates participation server-side.

## Orientation

Orientation is not a generic product tour. It is a synthetic, three-organization Exchange journey showing how an issuer, responder and teammate interact across an RFx lifecycle. It should teach the network model before the user is asked to finish their own organization presence.

## Organization resolution

The organization name captured early in signup is reused. Resolution combines that provisional identity with selected geography, seeded data and existing RFxchange organizations.

The user chooses either:

- **This is my organization**, or
- **None of these — create this organization**.

Provisional information should carry forward rather than forcing repeated entry.

## Authority is separate from verification

If the user claims an existing organization, the platform establishes whether the person may manage it. Evidence may include domain email, an existing administrator invitation, administrative review, organization documents or authoritative records.

Successful authority establishes the user/organization administrative relationship. It does **not** automatically make the organization Verified.

## Location

After authority is established, the platform captures the organization location and geocodes it. The user confirms the map position.

Actual internal location and public display location are distinct concepts. Public visibility may be exact, approximate or locality-only where policy permits.

## Essential registration

Before activation, collect only enough information for meaningful network participation:

- organization identity,
- primary contact,
- organization type,
- primary location,
- at least one meaningful capability/function,
- service geography,
- one or more organization roles,
- business objectives,
- visibility settings.

A broad value like "Services" is not a meaningful capability when a more specific service can be stated.

## Profile Complete

`Profile Complete` is an automatically derived organization-level state/credential based on required fields. It is not self-awarded.

The completion gate must reflect identity/contact, capability, geography, visibility and role requirements—not merely minimum identity.

## Marker activation

Once the minimum activation requirements are satisfied, the organization's real marker appears in the selected locality. This is a deliberate success moment.

The selected geography remains prominent; surrounding geography remains contextually visible but subordinate. Marker activation must use confirmed organization location and legitimate profile completion.

## Controlled platform entry

After marker activation, the user enters the real application from the organization's perspective, centered on the selected locality. This stage bridges onboarding and the open network.

## First value

The first real action should be driven by stated business objectives—for example finding opportunities, customers, suppliers, teammates, referrals or resources, or issuing an opportunity.

## OPEN gate

OPEN is a terminal activation state, not a generic authenticated state. At minimum, release requires the relevant user/account, policy, organization relationship, geography, profile, location/marker and education/first-value conditions.

OPEN does not require Organization Verified status.

## Progressive enrichment

Advanced certifications, richer capability detail, verification evidence, additional users, credibility and commercial choices occur after the minimum activation path unless a specific workflow genuinely requires them earlier.
