# Wave 1 Slice 1.8 — Organization and Platform Authority Foundations

## Scope

This slice implements only:

- GOV-004 — Primary admin organizational authority representation
- GOV-006 — Feature/geography/platform change authority foundation
- ADM-008 — Emergency intervention versus normal change distinction

## GOV-004 — organization authority representation

The initial organization user must explicitly represent that they have authority to establish, or begin establishing, the organization account.

This slice records that representation as immutable evidence tied to:

- user ID
- organization membership ID
- organization ID
- the fixed authority statement
- representation timestamp
- explicit-user-action evidence

The record is a **representation by the user**. It is not platform verification of corporate authority, not a legal opinion, and not a replacement for later claim/verification workflows.

Creation requires an active membership matching the exact user and organization. Cross-user and cross-tenant representations are rejected.

No Primary Admin role preset is introduced here. Standard organization role bundles are a later feature.

## GOV-006 — reserved platform change authority

The platform governance domain establishes reserved change surfaces for:

1. features
2. workflows
3. geography
4. eligibility
5. APIs
6. integrations

Supported change operations are:

- add
- modify
- remove
- temporarily disable

A platform change directive records:

- directive ID
- opaque platform actor ID
- explicit `platform-governance` authority boundary
- target kind and target key
- operation
- change mode
- reason
- communication evidence/status
- created timestamp
- effective timestamp

The platform actor identifier is intentionally not an organization user or organization membership identifier. The later administrator authorization architecture will decide which administrative identities may issue which directives.

This slice establishes the governance contract without prematurely implementing administrator roles, permissions, scopes, conditions, UI, feature flags, deployment operations, or geography mutations.

## ADM-008 — emergency/security intervention versus normal changes

Two change modes are intentionally distinct.

### Normal change

A normal change requires communication before it becomes effective.

The directive therefore requires completed communication evidence with a communication timestamp that is not later than the effective timestamp.

### Emergency/security intervention

An emergency/security intervention may take effect immediately when required for security or operational protection.

The directive's effective timestamp is the creation timestamp. Communication may still be pending at the moment of intervention, or may already be completed.

This does not eliminate the communication obligation; it distinguishes the timing rule so urgent intervention is not blocked by the normal-change communication gate.

## Persistence boundary

Organization authority representations and platform change directives are immutable historical evidence through append/read repository ports.

No update or delete operations are exposed.

The mutable product configuration affected by a directive is intentionally not modeled in this slice.

## Explicit deferrals

This slice does not implement:

- Primary Admin / Owner organization role preset
- organization claim verification or corporate-authority verification
- legal-document content or counsel approval
- platform administrator identity model
- administrator role/permission engine
- admin scope or conditional approvals
- platform-change approval workflow
- policy publication workflow
- notification delivery
- feature flags
- maintenance controls
- actual geography availability mutation
- API/integration runtime mutation
- rollback engine
- deployment controls
- administrative UI
- database adapters or migrations
- tracker spreadsheet updates

## Acceptance criteria

Slice 1.8 is acceptable when tests and architecture guardrails prove:

1. an active organization user can explicitly represent authority to establish/begin establishing the organization account;
2. the representation preserves user, membership, organization, fixed statement, timestamp, and explicit-user-action evidence;
3. the representation does not claim that authority has been verified;
4. inactive, cross-user, and cross-tenant representations are rejected;
5. platform change targets cover feature, workflow, geography, eligibility, API, and integration;
6. platform change operations cover add, modify, remove, and temporarily disable;
7. platform change directives use a distinct platform-governance authority boundary;
8. normal changes require completed communication before effectiveness;
9. emergency/security interventions can become effective immediately while communication remains pending;
10. governance authority persistence remains append/read only.
