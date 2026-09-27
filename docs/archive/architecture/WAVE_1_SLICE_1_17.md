# Wave 1 Slice 1.17 — ADM-019 + ADM-021 + ADM-033 + ADM-049 + ADM-095

## Scope

This slice establishes the administrative constitution that sits above ordinary permission bundles:

- `ADM-019` — Reserved Super Admin action policy
- `ADM-021` — General Platform Administrator bundle guardrails
- `ADM-033` — Marketplace administrator decision guardrails
- `ADM-049` — Technical-versus-marketplace authority separation
- `ADM-095` — Administrative separation-of-authority guardrails

## Reserved authority

Reserved actions include granting/removing Super Admin authority, global permission-template changes, permanent organization termination, integrity-hold override, platform-wide commercial/founding-policy changes, verification/credibility-policy changes, retention override, production emergency/integration control, restricted-data unlock and destructive-data approval.

Authorization remains capability-driven. Runtime code does not branch on the `super-admin` role name. Each reserved action requires a composite set of named capabilities. The default Super Admin preset satisfies those composites; ordinary role presets do not.

This means broad operating permissions are insufficient for a reserved action.

## General Platform Administrator

The existing Platform Administrator preset remains the ordinary operations role. It can perform representative daily operations such as organization metadata correction, support-case updates, RFx moderation review and provider-application review, but it fails every reserved-authority composite by default.

## Marketplace neutrality

The RFx & Marketplace Administrator supports and repairs the workflow; it is not the issuer.

The following classes of actions are categorically denied through the platform-administrator path:

- rewriting issuer requirements without issuer authorization;
- changing evaluator scores;
- selecting a winner;
- fabricating submissions;
- changing a submission after deadline;
- inserting an award;
- suppressing a valid response to favor another party;
- exposing confidential responses;
- retroactively changing procurement rules.

These denials apply even to otherwise broad administrative authority because issuer decision authority is outside the platform-administrator boundary.

## Technical separation

Technical/System Administrator retains infrastructure capabilities such as system health and controlled maintenance but does not default to:

- credibility verification or badge authority;
- financial adjustment authority;
- RFx moderation/evaluation authority;
- administrator removal/permanent termination authority.

Infrastructure authority therefore remains distinct from marketplace/governance authority.

## Cross-domain governing principles

The slice codifies nine invariants:

1. verification is not endorsement;
2. membership is not credibility;
3. payment does not improve matching rank;
4. platform administration is not issuer winner-selection authority;
5. institutional administration is not business ownership;
6. support authority is not silent unrestricted impersonation;
7. technical maintenance is not marketplace authority;
8. removing access does not erase historical evidence;
9. administrative actions remain attributable to individual administrators.

## Boundary event evidence

Every boundary evaluation can emit an immutable event containing administrator, action, outcome, reason, timestamp and any missing reserved capabilities. Denied RFx/marketplace attempts are therefore server-side policy decisions with attributable evidence rather than UI-only restrictions.

`adminAuthorityBoundaryEvents` is append-only at the repository boundary. This focused evidence does not claim completion of the later platform-wide audit-log feature (`ADM-085`).

## Acceptance

The slice is complete only when tests prove:

- every reserved action is allowed by the default Super Admin capability set and denied by the ordinary Platform Administrator bundle;
- Platform Administrator can still perform representative daily operations;
- marketplace decision actions are categorically denied, including for broad administrators;
- denied marketplace attempts generate attributable boundary events;
- Technical/System Administrator can operate infrastructure while protected marketplace/governance capabilities remain absent;
- verification capability alone does not imply endorsement capability;
- cross-domain prohibited assumptions are denied;
- the policy contains no runtime hard-coded Super Admin role-name branch;
- the full production CI suite remains green.
