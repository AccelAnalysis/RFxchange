# Wave 1 Slice 1.6 — Access lifecycle and restriction foundations

## Scope

This slice implements only:

- **ARC-007 — Onboarding/access state machine**
- **ARC-008 — Restriction states**

It builds on the organization tenant, user membership, organization-scoped ownership, permission, and audit foundations established in Slices 1.1–1.5.

## Governing rule

RFxchange tracks **normal onboarding/access progress** separately from **restriction/enforcement state**.

A restriction does not erase or rewrite where a journey had progressed. For example, an organization may already have reached `open-platform` while an organization-level `integrity-hold` temporarily overrides normal access.

This follows the canonical user-journey language that the restriction states can coexist with the primary lifecycle states.

## ARC-007 canonical lifecycle

The persisted lifecycle order is:

1. `visitor`
2. `account-started`
3. `account-activated`
4. `geography-selected`
5. `organization-resolved`
6. `organization-registered`
7. `organization-activated`
8. `controlled-platform`
9. `open-platform`

`AccessLifecycleRecord` stores the current state and timestamps under a stable `AccessJourneyId`.

A new journey always starts at `visitor`.

Normal lifecycle advancement is deliberately strict:

- only the immediate next canonical state is allowed;
- skipping states is rejected;
- moving backward is rejected;
- `open-platform` is the terminal normal progression state.

This creates a stable persisted state machine without yet deciding which UI, service, or workflow completes each transition.

## Early lifecycle identity boundary

The lifecycle begins before an organization necessarily exists and may begin before a stable user identity exists.

For that reason, `AccessLifecycleRecord` does **not** require `organizationId`, `membershipId`, or a user binding at creation.

Slice 2.1 later exercised the deferred association point by adding an optional `userId` binding after the visitor stage. Visitor journeys remain valid without identity. Once bound, the journey cannot be rebound to a different user, and authenticated geography transitions require the binding to match the trusted RFxchange user. Organization and membership identity remain absent until their later lifecycle stages.

## ARC-008 restriction states

The restriction catalog is:

- `none`
- `restricted`
- `suspended`
- `integrity-hold`
- `terminated`

`none` represents the absence of an active restriction while allowing the restriction record to remain persistable.

Restriction state is modeled independently from lifecycle progress.

## Restriction scope

The source user journey distinguishes user suspension from organization suspension, so the foundation supports two explicit target scopes:

### Organization target

Applies to an `OrganizationAccount` tenant and derives `organizationId` directly from that established organization.

### Membership target

Applies to a specific `OrganizationMembership` and derives:

- `organizationId`;
- `membershipId`;
- `userId`.

The membership must belong to the supplied organization tenant, preventing cross-tenant restriction attribution.

This creates the foundation for later user-level and organization-level enforcement without implementing the administrator workflow that applies those restrictions.

## Restriction transitions

Non-terminal restriction states may be changed or cleared back to `none` so later administration can support investigation, remediation, suspension, restoration, or escalation workflows.

`terminated` is terminal in this foundation. Once a restriction reaches `terminated`, it cannot transition back to another state through the normal restriction state machine.

Any exceptional restoration or correction policy, if ever allowed, must be introduced explicitly in a later governance/admin slice rather than silently weakening the terminal state here.

## Effective access resolution

`resolveEffectivePlatformAccess` provides the minimum shared interpretation needed by future routing/enforcement layers:

1. if an active restriction exists, return restriction mode while preserving the underlying lifecycle state;
2. otherwise, `controlled-platform` returns controlled-platform mode;
3. otherwise, `open-platform` returns open-platform mode;
4. all earlier lifecycle states return onboarding mode.

This does not define which individual features remain available under `restricted`, `suspended`, or `integrity-hold`. It only establishes that restriction state overrides normal lifecycle access classification.

## Geographic availability is a different state domain

**Geographic availability states are separate** from ARC-008 access restrictions.

The user journey also defines locality availability concepts such as Released, Visible / Unreleased, Limited, and Restricted. Those describe whether a geography supports participation; they are not the same record as an organization/user restriction.

Slice 1.6 deliberately does not merge locality availability with account/access enforcement.

## Persistence boundary

The architecture defines separate persistence ports for:

- `AccessLifecycleRepository`;
- `AccessRestrictionRepository`.

Lifecycle records can be loaded and saved by journey ID.

Restriction records can be loaded by restriction ID and resolved by either organization or membership scope.

Concrete database technology, transactions, history tables, and adapters remain deferred.

## Acceptance evidence

### ARC-007

Satisfied when:

- all nine canonical lifecycle states are present in exact order;
- new journeys begin at Visitor;
- lifecycle state is persistable;
- only immediate forward progression is allowed;
- skipping, regression, and post-open advancement are rejected;
- controlled and open platform access modes are distinguishable.

### ARC-008

Satisfied when:

- Restricted, Suspended, Integrity Hold, and Terminated are explicit states;
- restriction state is separate from lifecycle progress;
- organization-level and membership/user-level restriction targets are supported;
- membership restriction targets cannot cross organization tenants;
- restriction state overrides normal access classification without erasing lifecycle progress;
- non-terminal restrictions can be restored or changed;
- termination is terminal.

Behavioral tests cover all of these invariants.

## Explicitly deferred

This slice does **not** implement:

- onboarding pages, forms, routing, or visual progress UI;
- authentication/session runtime transitions;
- geography-selection storage or locality availability state;
- organization claim/create workflows;
- organization marker activation;
- controlled-platform orientation experience;
- first-value-action release logic;
- administrative restriction/suspension UI;
- evidence, case management, notices, appeals, or reinstatement workflow;
- feature-specific restriction matrices;
- automatic security/fraud triggers;
- permission changes caused by restriction state;
- billing or membership entitlement state;
- audit records for lifecycle/restriction changes beyond the ARC-006 foundation;
- database adapters or migrations.

Those remain later slices. Slice 1.6 establishes only the canonical persisted state vocabulary, transition rules, scope boundaries, and minimum effective-access interpretation.
