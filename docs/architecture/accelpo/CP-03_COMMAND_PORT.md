# AccelPO CP-03 CommandPort

CP-03 is the single trusted write boundary for AccelPO. It accepts a client-owned command name,
organization selection, payload, expected record version, retry identity, and request identity. The
server derives the actor and membership from the verified shared RFxchange Firebase identity.

## Connection contract

| Surface | Contract |
| --- | --- |
| Route | `POST /api/accelpo/commands` |
| Client authentication | Existing RFxchange session cookie or verified Firebase ID token |
| Organization context | Client selection is a hint; the server resolves one active membership in that organization |
| Capability | Each registered command declares one shared organization capability |
| Target | Each registered command may declare a trusted record target, owner field, and version field |
| Commit | Handler receives only a server transaction surface; the receipt and handler writes commit together |
| Replay | Idempotency key is scoped to actor, membership, organization, and command; request identity is the fallback |
| Result | Versioned result with `committed` or `replayed` status and actionable error codes |

## Server checks

Before a handler runs, CP-03 validates the envelope and command registration, authenticates the
current user, resolves the active organization membership, re-evaluates account/restriction state,
checks the declared capability, and rechecks organization, membership, authorization, and
restriction records inside the transaction. A declared target is then checked for existence,
tenant ownership, actor ownership where applicable, and expected version.

Cross-tenant targets return not-found semantics. Same-tenant records owned by another actor return
forbidden semantics. Stale versions return a conflict with the current safe version and never
overwrite the record.

## Owned persistence

CP-03 owns the immutable, organization-scoped `accelPoCommandReceipts` record. It stores the command
identity, actor attribution, organization, request/idempotency identities, input fingerprint,
committed result, and resulting version. It does not own Purchase Cases, approvals, budgets,
offers, files, tasks, or notifications.

## Chassis registration

The static AccelPO chassis registry mounts `CP-03-command-port` at the `IdentityContext` and
`CommandPort` connection points. Future application parts extend the one server command registry
with their typed definitions; they do not create another write route or direct sensitive writes.

No domain command is registered by CP-03 itself. The current branch contains the chassis and CP-04
seams, but domain parts P1–P10 still need to supply command definitions before the endpoint can
perform a Purchase Case action.
