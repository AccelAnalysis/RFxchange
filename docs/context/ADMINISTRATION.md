# RFxchange Administration Context

## Administrative portal role

The administrative portal is the operating control plane for the RFxchange. It governs organizations, users/access, geography, RFx activity, credibility, providers, referrals, commerce, support, trust/safety and network integrity.

## Authority model

Do not use a binary `isAdmin` security model. Administrative authority is evaluated from:

```text
Role preset + granular permission + scope + conditions
```

Scopes may include GLOBAL, GEOGRAPHY, ORGANIZATION and CASE. Sensitive actions may also require justification, evidence, recent re-authentication or secondary approval.

Technical/system authority must not automatically inherit marketplace, verification, credibility, financial, RFx-evaluation or permanent-enforcement authority.

## Audit discipline

Sensitive administrative decisions preserve immutable/append-only history containing actor, action, target, reason, time and previous/new state where applicable. Corrections should be additive; history is not silently rewritten.

## Organization 360

Opening an organization should preserve organization scope while exposing authoritative contexts such as:
- Overview
- Users
- Profile
- Locations & Service Areas
- Capabilities
- RFx / Responses
- Referrals / Teaming
- Resources
- Credibility
- Commerce
- Support
- Audit

The status header should make active vs restricted/integrity-hold conditions immediately legible and provide access to the governing case where permitted.

## Organizations and claims console

Administrators need to locate organization records by identity/claim/status categories including seeded, unclaimed, claimed, active, incomplete, verification pending, verified, provider, issuer, duplicate, restricted, suspended, terminated and geography.

## Claim conflict adjudication

A conflicting claim follows an auditable evidence-based workflow:

```text
Claim submitted
→ authority evidence requested
→ existing administrator notified where applicable
→ evidence compared
→ authorized decision
→ membership assigned/rejected
→ decision logged
```

Do not destructively merge organization history or silently transfer authority.

## Verification boundary

Claim/management authority and Organization Verification are separate. Administrators may establish a user's right to control an organization without representing that the organization has satisfied Verification criteria.

## Institutional administration

Scoped institutional/locality administrators are distinct from platform administrators. Geography/program scope must be enforced server-side, and delegated institutional access must not grant global private-data, verification, credibility, enforcement, billing or market-ranking authority.
