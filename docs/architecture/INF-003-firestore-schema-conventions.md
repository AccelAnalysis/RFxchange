# INF-003 — Canonical Firestore Collection and Document Conventions

## Scope

INF-003 defines the storage contract that future Firestore repository adapters must follow. It does not add the Firebase SDK, create Firestore data, deploy rules/indexes, or implement repositories.

The domain remains provider-independent. Firestore-specific path, metadata, relationship, versioning, and migration conventions live in `src/infrastructure/firestore/schema.ts`.

## Governing tenancy rule

RFxchange uses top-level Firestore collections with explicit tenant identifiers on organization-scoped records.

Organization ownership is **not inferred from a nested path** and is never represented by a user ID.

For example:

```text
organizations/{organizationId}
organizationProfiles/{profileId}
organizationMemberships/{membershipId}
organizationAuthorizations/{membershipId}
organizationAuditEvents/{auditEventId}
```

An organization-scoped record such as an organization profile, membership, authorization, legal acknowledgement, authority representation, or organization audit event must preserve `organizationId` as a field even when another relationship field could indirectly resolve the tenant.

This allows later Security Rules and server authorization to evaluate tenant ownership directly and supports top-level cross-domain queries without sacrificing tenant isolation.

## Canonical collection registry

The current foundation maps to these collections:

| Collection | Document ID source | Scope | Mutation policy |
| --- | --- | --- | --- |
| `organizations` | `OrganizationAccount.id` | organization root | mutable |
| `organizationProfiles` | `OrganizationProfile.id` | organization | mutable |
| `users` | `UserIdentity.id` | user | mutable |
| `organizationMemberships` | `OrganizationMembership.id` | organization | mutable |
| `organizationAuthorizations` | `membershipId` | organization | mutable |
| `organizationAuditEvents` | audit event `id` | organization | append-only |
| `accessJourneys` | journey `id` | platform/early lifecycle | mutable |
| `accessRestrictions` | restriction `id` | mixed target scope | mutable |
| `legalDocumentVersions` | document-version `id` | platform | append-only |
| `legalAcknowledgements` | acknowledgement `id` | organization | append-only |
| `organizationAuthorityRepresentations` | representation `id` | organization | append-only |
| `platformChangeDirectives` | directive `id` | platform | append-only |
| `retentionPolicies` | policy `id` | platform | append-only |
| `retentionAssignments` | assignment `id` | mixed record scope | append-only |
| `adminAuthorityContexts` | `administratorId` | platform | mutable resolved state |
| `adminPermissionGrants` | grant `id` | platform | append-only |

Future feature domains may add collections, but they must follow the same stable-ID, tenant-attribution, timestamp, schema-version, and migration conventions before an adapter is merged.

## Stable document IDs

Primary Firestore documents use stable RFxchange domain identifiers. Auto-generated Firestore IDs are not the default for domain records.

Rules:

1. document IDs are immutable;
2. IDs cannot contain `/`;
3. the document path is deterministic from collection + domain identity;
4. one-to-one state without a separate domain ID may use the relationship identity that uniquely owns it, such as `membershipId` for `organizationAuthorizations` and `administratorId` for `adminAuthorityContexts`;
5. changing a domain identifier requires a migration rather than renaming a Firestore document in place.

## References and relationships

Relationships use stable ID fields rather than Firestore `DocumentReference` values.

Examples:

- `organizationId`
- `userId`
- `membershipId`
- `documentVersionId`
- `policyId`
- `administratorId`

This keeps the domain and serialized record shape portable, makes authorization predicates visible, and avoids requiring a Firestore client object merely to interpret a relationship.

Redundant relationship IDs are acceptable when the domain already preserves them for audit/security/query purposes. They must agree with the canonical record identity and must never be used to invent cross-tenant ownership.

## Persistence metadata and timestamps

Every Firestore document must carry integer `schemaVersion`. Initial version is `1`.

Persistence time is server-assigned by the Firestore adapter:

- `createdAt` is assigned by the server when a record is first persisted;
- mutable records use server-assigned `updatedAt` on each write;
- append-only records do not gain mutable `updatedAt` semantics.

Domain event times such as `occurredAt`, `recordedAt`, `representedAt`, `classifiedAt`, or `effectiveAt` remain separate business/audit timestamps and must not be replaced by persistence time.

Where an existing mutable domain aggregate already exposes `createdAt` / `updatedAt`, the adapter maps those fields to Firestore timestamp values and returns ISO-normalized values to the domain. Clients must not be trusted to fabricate authoritative persistence timestamps.

## Append-only records

Collections marked append-only preserve the existing architecture invariant that history is not rewritten through normal repository operations.

Append-only includes current legal acknowledgement evidence, organization audit events, organization authority representations, platform change directives, retention policies/assignments, and admin permission grants.

Corrections or later state changes must be modeled as additional records/events where the owning domain requires that behavior. A Firestore adapter must not quietly introduce `update` or `delete` behavior for an append-only repository port.

## Query and indexing strategy

INF-003 defines query conventions but does not create indexes.

1. organization-scoped queries must include an explicit `organizationId` predicate when the query crosses more than one tenant;
2. stable lookup by document ID should be preferred over query-by-ID fields;
3. lookup fields already required by repository ports (for example `userId`, `membershipId`, `organizationId`, `documentVersionId`, `policyKey`, `administratorId`) are legitimate query fields;
4. composite indexes must be justified by an approved repository/query contract rather than pre-created speculatively;
5. INF-005 will create and source-control `firestore.indexes.json` from those contracts;
6. unbounded arrays and giant denormalized documents should not be used as substitutes for queryable child records.

## Security boundary

The schema is not authorization.

Later Firestore Security Rules and server application services must enforce:

- authenticated identity;
- exact organization membership;
- granular permission requirements;
- restriction/access state;
- administrator authority where applicable;
- append-only immutability where applicable.

Firestore paths alone never prove authority.

No secret belongs in Firestore merely because a record is server-readable. Firebase service-account credentials, Stripe secret keys, Microsoft credentials, webhook signing secrets, API refresh tokens, and similar privileged material belong in dedicated secret/environment systems.

## Storage boundary

Firestore stores metadata and references for files. File bytes and sensitive evidence documents belong in Firebase Storage when INF-008 introduces that boundary.

Do not store base64 documents, large binary payloads, service-account files, or private keys inside Firestore documents.

## Schema versioning

`schemaVersion` is required on every persisted document and begins at `1`.

Schema changes follow these rules:

1. additive compatible fields are preferred;
2. required field or semantic changes increment the applicable persisted schema version;
3. readers must fail explicitly on an unsupported future schema version;
4. migrations must be idempotent and environment-specific;
5. append-only historical evidence is not reinterpreted in place merely to match a newer model;
6. migration state/checkpoints belong to explicit migration tooling, not arbitrary client writes;
7. production migrations require review, backup/recovery consideration, dry-run evidence where practical, and an explicit production target.

## Collection migrations

Firestore does not provide an atomic collection rename. A collection/path change therefore follows an explicit migration sequence:

```text
introduce new schema/path
→ copy or transform idempotently
→ verify counts/invariants
→ switch application reads/writes
→ observe
→ retire old path under retention policy
```

Do not dual-write indefinitely. Any temporary dual-write period requires a defined source of truth and reconciliation rule.

## Environment boundary

All schema and migration work follows INF-001 environment separation:

- local development uses the Emulator Suite by default;
- remote staging requires a dedicated non-production Firebase project;
- production is Firebase project `rfxchange`;
- migrations and deployment commands must name an explicit environment/project and must never silently fall back from development/staging to production.

## Explicit deferrals

INF-003 does **not** implement:

- Firebase SDK dependencies;
- Firestore repository adapters — INF-002;
- Firestore Security Rules — INF-004;
- composite index declarations/deployment — INF-005;
- Firebase Authentication — AUTH-001 and later;
- Firestore migrations or seed execution;
- production data creation;
- Firebase Storage;
- Cloud Functions;
- billing, email, or provider secrets.

## Acceptance criteria

INF-003 is acceptable when repository guardrails/tests prove:

1. canonical collection names are source-controlled;
2. document IDs are deterministic from stable RFxchange identities;
3. organization-scoped collections explicitly require `organizationId`;
4. user identity remains separate from organization ownership;
5. append-only collections cannot be mistaken for mutable records in the convention registry;
6. relationships use stable IDs rather than provider-specific document references;
7. schema version `1` and server timestamp policy are explicit;
8. composite indexes remain query-contract driven and deferred to INF-005;
9. schema migration rules are documented; and
10. no Firebase SDK or concrete repository adapter is introduced by this slice.
