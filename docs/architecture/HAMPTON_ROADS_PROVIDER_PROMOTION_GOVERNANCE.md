# Hampton Roads Provider Comparison and Promotion Governance

**Status:** Implemented — Not Verified

**Production authority:** `AccelAnalysis/RFxchange`

**Applies to:** Hampton Roads source-backed provider seeding after Geography Fabric enrichment

**Effective:** 2026-08-23

## Purpose

This packet defines the evidence and administrative decisions required before a source-backed Hampton Roads provider candidate may enter a protected Firebase promotion command.

It does not perform canonical Organization search, infer identity, write Firestore, create an Organization or Location, publish a Resource, or make a provider discoverable. Those actions require a later server-side adapter operating against current persisted truth.

## Promotion sequence

```text
PR #243 source migration plan
        ↓
accepted-location Geography Fabric enrichment
        ↓
Provider Seed Promotion Candidate
        ↓
canonical Organization comparison evidence
        ↓
administrative comparison outcome
        ↓
separate promotion approval
        ↓
preview command
        ↓
explicit committed command
        ↓
protected Firebase adapter (later packet)
```

No step may infer the approval supplied by another step.

## Candidate eligibility

A promotion candidate binds:

- market and source seed identity;
- provider classification and participation policy;
- source-backed provider/Resource description;
- donor repository and commit provenance;
- source-plan and source-record fingerprints;
- accepted location and accepted-point fingerprint;
- geography enrichment status and profile fingerprint;
- original migration disposition.

Only candidates with an accepted location and completed geography enrichment may enter canonical comparison.

Candidates with `needs_geocode_review`, `off_map_unresolved`, or `held_out` dispositions cannot be made promotion-ready. Candidates marked `needs_identity_review` remain in an identity-resolution path and cannot pass through ordinary approval.

## Canonical comparison

Canonical comparison records the current Organization-search evidence rather than silently choosing an identity.

Each potential match records:

- canonical Organization ID and display name;
- one or more match bases;
- confidence;
- bounded evidence summary.

Supported bases include authoritative source identity, website domain, accepted address, display name, alias, and manual research.

The reviewer selects one explicit outcome:

- create a new unclaimed canonical Organization;
- attach to an existing canonical Organization;
- require identity review;
- reject the candidate.

Attachment to an existing Organization is valid only when the selected Organization is present in the recorded comparison evidence. A caller cannot name an unrelated Organization outside the review record.

## Separate approval

Comparison and approval remain separate facts.

The approval binds the candidate record, geography profile, and comparison fingerprints and records:

- approval, rejection, or deferral decision;
- create-versus-attach target mode;
- reserved or selected target Organization ID;
- approving administrator;
- current authority context;
- rationale and timestamp.

A stale candidate, changed geography profile, changed comparison, or mismatched target Organization invalidates approval construction.

## Preview and commit commands

Only an approved decision may produce a promotion command.

A preview command remains non-publishing and exists so the later adapter can show the exact proposed writes before mutation.

A committed command additionally requires the exact production confirmation phrase:

```text
PROMOTE APPROVED PROVIDER
```

Both command forms remain bound to the approving administrator and authority context in this packet. The later server adapter must still resolve current administrator authorization; stored identifiers and Firestore paths never prove current authority.

Every command explicitly carries:

- target Organization mode and ID;
- target Location ID;
- target draft provider Resource ID;
- Geography Fabric profile ID;
- candidate, geography, comparison, approval, and request fingerprints;
- `publishProviderDiscovery: false`;
- `publishResource: false`.

Canonical creation and publication are intentionally distinct. Promotion may create or attach canonical records without automatically making a provider discoverable or a Resource public.

## Fingerprint boundary

Fingerprint strings bind one stage to the evidence observed by the caller, but a string supplied to this domain model is not authority and is not proof that persisted records still agree.

The protected Firebase adapter must recompute deterministic fingerprints from the current persisted candidate, Geography Fabric profile, canonical-search evidence, comparison, and approval. It must reject a command when any recomputed value differs from the command binding, even if the command shape is otherwise valid.

The adapter must also enforce command idempotency and immutable audit/event behavior in one atomic transaction.

## Identity outcomes

### New Organization

A new-Organization approval reserves a deterministic target Organization ID. The later adapter must verify that the ID is still unused or idempotently belongs to the same approved promotion before creating an unclaimed canonical Organization.

### Existing Organization

An existing-Organization approval retains the exact selected Organization from comparison evidence. The later adapter must reload that Organization and verify that it remains the intended canonical identity; it cannot trust the path or selected client state.

### Identity review

A flagged candidate can be deferred for dedicated identity resolution. It cannot generate preview or commit commands.

### Rejection

A rejected candidate remains a durable reviewed result and cannot generate promotion commands.

## Production adapter requirements

The following packet must implement a server-only Firebase adapter that:

1. resolves current administrator authority;
2. loads current candidate, geography profile, comparison, and approval records;
3. recomputes all fingerprints;
4. checks target Organization state and canonical identity evidence;
5. performs preview without writes;
6. performs committed Organization/Location/profile/Resource-draft writes atomically where feasible;
7. records idempotent command and event facts;
8. never publishes provider discovery or the Resource implicitly;
9. preserves unresolved and held-out records outside the map and participant projections;
10. returns a committed receipt that identifies exactly what changed.

## Packet boundaries

This domain packet does not:

- connect to Firebase Admin;
- query canonical Organizations;
- approve a match automatically;
- create or update Organizations;
- create a confirmed Location;
- write a Geography Fabric profile;
- create a provider application or discovery projection;
- publish a Resource;
- promote source data in production.

Its purpose is to ensure the later adapter cannot infer comparison or approval merely because a source record exists.
