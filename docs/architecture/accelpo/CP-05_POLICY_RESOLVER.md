# AccelPO CP-05 PolicyResolver

CP-05 is the organization-scoped purchasing-policy resolution boundary for AccelPO. It converts a
trusted purchase context plus the organization's active versioned policy into the exact approval,
budget, evidence, routing, exception, and sourcing behavior that downstream parts must follow.

It does not own an AccelPO screen, a second authorization system, or a client-editable policy
engine. Policy administration belongs to the later policy/setup part. Consequential policy writes
must go through CP-03, and any participant-facing policy reads must use CP-04 projections.

## Contract

The resolver input carries the active organization, department/cost area, category, amount and
currency, provider context, needed-by date, trusted requester identity/capabilities, requested
purchasing mode, and relevant exception codes.

A configured resolution returns:

- the applicable policy/version identifiers;
- department/cost-area routing;
- sequential, parallel, or no-approval requirements;
- the matched organization-defined amount/category conditions;
- delegation and exception behavior;
- no-budget or organization-entered budget behavior;
- evidence requirements (`none`, `receipt`, `photo`, `receipt-or-photo`, `receipt-and-photo`, or
  `service-completion`);
- the configured sourcing order for direct-provider, source-first, or authorize-first purchasing;
- the capability requirement and resolved requester authority to publish community sourcing.

If the organization has no active policy version, CP-05 returns `not-configured` and does not invent
a default threshold or purchasing path.

## Trust boundary

`PolicyVersionSource` is a trusted server/infrastructure adapter and is organization-scoped at the
method boundary. The caller supplies an organization ID; the source receives only that organization,
and CP-05 rejects a returned policy whose tenant does not match. A client cannot provide a policy or
approval route to the resolver.

Requester permissions in `TrustedPolicyRequester` must come from CP-01/server authorization. The
resolver never treats a UI-only permission claim as authority. A requested sourcing mode is checked
against the organization's configured allowed modes; disallowed modes return no sourcing order and
no publish authority.

No company-independent dollar threshold is embedded in CP-05. Amount thresholds exist only in the
organization's policy data.

## Rule precedence

Rules are matched against the policy context, sorted by ascending numeric priority and then rule ID,
and applied in that deterministic order. Higher-priority rules therefore replace a lower-priority
facet when both match. Rules replace complete policy facets rather than deep-merging arbitrary
partial client data.

## Historical authorization

`captureAuthorizationPolicySnapshot()` produces a detached, deeply frozen snapshot of the resolved
policy decision. The authorization part must persist that snapshot through CP-03 when an
authorization round is submitted. Later policy edits therefore do not rewrite the approval route,
budget behavior, evidence requirement, sourcing order, or policy version recorded for the historical
round.

## Chassis registration

The static chassis registry mounts `CP-05-policy-resolver` at `IdentityContext` and `PolicyResolver`.
CP-05 contributes no routes and owns no user-facing copy.

## Owned data and external ports

CP-05 owns the policy **contract and resolution semantics**, not a new browser-readable collection.
Its external source port is `PolicyVersionSource`. P2 policy administration must provide durable
versioned policy records through the existing trusted persistence model, use CP-03 for writes, and
expose only role-safe administrative views through CP-04.
