# Slice 2.5 — Organization Authority & Claims

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs

- `ORG-004` — Organizational claim/authority validation
- `ADM-065` — Organization claims console and filters
- `ADM-066` — Claim conflict adjudication workflow

## Objective

Establish legitimate user authority over resolved organization records and provide platform administrators the tools needed to find, review and adjudicate organization-claim conflicts without destructive identity changes.

At slice exit, organization resolution can progress into an evidence-based authority decision, claims can be located by required identity/status categories, and conflicting claims can be resolved through an auditable workflow.

## Must read

- `/AGENTS.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/ADMINISTRATION.md`
- `docs/context/CREDIBILITY_SYSTEM.md`
- `docs/context/USER_JOURNEY.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- canonical tracker/dependency map
- merged Slice 2.3 organization-resolution contracts
- merged Slice 2.4 communications adapter when claim communications use it
- merged storage foundation (`INF-008`) for sensitive authority evidence boundaries
- `docs/slices/WAVE_2_ROADMAP.md`

## Prerequisite state

`ORG-004` follows `ORG-002` organization resolution. `ADM-065` follows the claim/create organization path; `ADM-066` builds on entity-resolution/conflict detection from `ORG-003`.

The reviewed dependency map intentionally makes `INF-008` an infrastructure prerequisite of later authority workflows rather than making Storage depend on `ORG-004`.

## Product rules

### `ORG-004`
Authority means the user may manage the organization. Establish it through approved evidence/pathways such as domain email, existing administrator invitation, administrative review, organization documents or authoritative records.

Successful authority creates/updates the legitimate organization membership/administrator relationship. It does **not** automatically grant Organization Verified status.

Sensitive evidence remains private and follows the existing storage/security architecture.

### `ADM-065`
The claims console must allow authorized admins to locate organization records across at least the documented categories: seeded, unclaimed, claimed, active, incomplete, verification pending, verified, provider, issuer, duplicate, restricted, suspended, terminated and geography.

The console is an administrative projection over authoritative organization/claim state; it must not become a second conflicting source of truth.

### `ADM-066`
Conflicting claims use a controlled workflow:

```text
Claim submitted
→ evidence requested
→ existing administrator notified where applicable
→ evidence compared
→ authorized admin decision
→ membership assigned/rejected
→ decision/audit evidence recorded
```

No existing organization history is silently overwritten. Do not resolve conflicts by destructive merge or by replacing the current administrator without evidence/history.

## Acceptance intent

- `ORG-004`: authority can be established through approved domain-email, invitation/review, document or authoritative-record evidence paths.
- `ADM-065`: admins can locate organization records by every required claim/identity/status category and geography within their permitted scope.
- `ADM-066`: conflicting claims are resolved through an auditable evidence-based decision and existing organization history is preserved.

## Expected implementation qualities

- claim state is explicit and typed;
- authority decisions are server-side and permission/scoped;
- sensitive evidence uses controlled Storage metadata/object paths and is never public by default;
- membership/admin assignment reuses existing organization access architecture instead of creating a parallel authority flag;
- claim events/decisions integrate with canonical administrative audit/case patterns where applicable;
- communications use the provider-neutral email boundary;
- tests cover approved, denied, conflicting, unauthorized-admin and cross-organization/scope cases;
- Verification remains separate from authority in data, UI copy and tests.

## Explicit non-scope

Do **not** implement in Slice 2.5:

- Organization Verification/credibility award workflow beyond preserving the separation and evidence boundary;
- location/address/geocoding (`ORG-005`, `ORG-006`);
- service geography/location privacy;
- Profile Complete;
- organization marker activation;
- full Organization 360 (`ADM-063`, `ADM-064`);
- future institutional/locality claim administration beyond existing scoped platform authority.

## Exit checkpoint

The system knows not only **which organization record** the participant selected, but whether that user has legitimately established authority to manage it; administrators have an auditable way to find and resolve claim conflicts.

## Completion discipline

Do not infer Verification, Profile Complete or marker activation from claim authority. Recalculate dependencies after merge before authorizing Slice 2.6.
