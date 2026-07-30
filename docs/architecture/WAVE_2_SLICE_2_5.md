# Wave 2 Slice 2.5 — Organization authority and claims

## Scope

This slice implements `ORG-004`, `ADM-065`, and `ADM-066`. It begins only after an authenticated
participant has an immutable Slice 2.3 organization resolution. It establishes legitimate
management authority, exposes a scoped administrative claims projection, and preserves an
evidence-based conflict workflow.

Organization Verification, location/geocoding, Profile Complete, marker activation, and
Organization 360 remain outside this slice.

## Resolution, authority, and Verification

Three facts remain independent:

1. `OrganizationResolutionRecord` identifies which durable organization record the participant
   selected or created.
2. `OrganizationAuthorityClaim` establishes whether that participant may manage the organization.
3. Organization Verification remains `not-evaluated` throughout this slice.

An approved authority claim creates a normal active `OrganizationMembership` and the existing
`primary-administrator` authorization preset. There is no parallel `isOwner`, `isClaimed`, or
`isVerified` authorization flag. The access journey advances atomically from
`organization-resolved` to `organization-registered`.

## Approved evidence pathways

The typed claim model supports:

- verified business-domain email;
- invitation from an existing authorized administrator;
- administrative review;
- private organization documents; and
- authoritative records.

Document evidence must reference an active INF-008 `authority-evidence` asset with
`sensitive-evidence` sensitivity and private visibility. Raw document bytes, provider URLs, and
download tokens never enter the claim record or public projection.

An approved decision requires at least one verified evidence record. System and existing-admin
paths may approve an uncontested claim. Any competing non-denied claim forces the new claim to
`conflict` and blocks automatic authority.

## Conflict workflow

The controlled workflow is explicit:

```text
Claim submitted
→ evidence requested
→ existing administrator notified where applicable
→ evidence compared
→ authorized administrator decision
→ membership assigned or rejected
→ decision and audit evidence recorded
```

`organizationAuthorityClaims` is the current mutable workflow aggregate.
`organizationAuthorityClaimEvents` and `organizationAuthorityDecisions` are append-only. Approval
or denial never deletes a competing claim, replaces the current administrator, rewrites an earlier
event, or merges organization records. Every decision retains the conflicting claim IDs and
compared evidence references.

Admin decisions require:

- the named `organization.claim.adjudicate` permission;
- a matching GLOBAL, ORGANIZATION, GEOGRAPHY, or CASE grant as resolved for the action;
- completed evidence comparison;
- recent re-authentication for the sensitive administrative audit event; and
- an administrative case reference and rationale.

Approval atomically writes claim state, event, decision, membership, organization authorization,
lifecycle advancement, and immutable administrative audit. Denial writes the same decision/audit
evidence without creating membership.

## Claims console

The admin UI is a projection over authoritative organization, claim, Verification, restriction,
role, origin, integrity, and geography state. It does not own a second status source.

The typed filter contract covers seeded, unclaimed, claimed, active, incomplete, verification
pending, verified, provider, issuer, duplicate, restricted, suspended, terminated, and geography.
Every returned row is checked against the administrator's named permission and scoped grant.
Consequential state uses explicit text rather than color alone.

Private evidence stays separate from public identity. The console can show bounded evidence
references and status only after purpose-specific authorization; this slice does not create a
general evidence-download route.

## Communications

Claim communication is represented by a provider-neutral scheduling port. Evidence requests,
existing-admin notices, and decisions use stable correlation/idempotency keys and are intended for
the COMMS-001 provider boundary plus COMMS-002/INF-007 delivery composition. The claim domain and
service contain no Microsoft types or direct provider calls.

## Persistence and security

All three claim collections are top-level, organization-scoped, server-managed Firestore
collections. Direct anonymous and authenticated browser access is denied. Equality query contracts
cover organization, user, status, and geography; they use automatic Firestore indexes.

The emulator acceptance proves:

- claim submission plus append-only event persistence;
- atomic approval, membership, primary-administrator authorization, and lifecycle advancement;
- an immutable decision that explicitly leaves Verification not evaluated; and
- direct-client denial for claim, event, and decision records.

## UI

`/organization-authority` presents approved authority pathways, private-evidence language, and the
authority/Verification distinction. `/admin/organization-claims` provides a restrained, responsive
claims console with all required filters, visible administrative scope, evidence comparison,
workflow state, decision rationale, and audit/reauthentication consequences.

Both surfaces follow the canonical RFxchange design system: Exchange Black/Warm Ivory structure,
sparse RF Gold emphasis, explicit text state, clear focus affordances, minimal container chrome,
and mobile reflow rather than proportional shrinkage.
