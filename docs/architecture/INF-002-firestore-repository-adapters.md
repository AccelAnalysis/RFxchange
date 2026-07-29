# INF-002 — Firestore repository adapters

## Status

Implemented as the Wave 1 persistence adapter foundation after INF-001 environment conventions and INF-003 canonical Firestore schema conventions.

## Purpose

INF-002 gives the existing RFxchange domain repository ports concrete Firestore implementations without importing Firebase into `src/domain`.

The dependency direction remains:

```text
domain models + repository ports
        ↑ implemented by
infrastructure/firestore adapters
        ↑ composed with
firebase-admin Firestore server runtime
```

Application services may depend on the domain ports and receive these adapters through composition. Domain code does not know that Firestore exists.

## Runtime boundary

`firebase-admin` is a server/back-end dependency only. The runtime composition module initializes the Firebase Admin default app and obtains a server Firestore instance.

The repository does not contain or request a service-account private key. Google-hosted deployments should use Application Default Credentials. Local development should use the Firebase Local Emulator Suite unless a specific reviewed task requires remote staging access.

## Adapter coverage

INF-002 implements the current canonical persistence ports mapped by INF-003:

- organization accounts;
- organization profiles;
- user identities;
- organization memberships;
- organization user authorizations;
- organization audit events;
- access lifecycle journeys;
- access restrictions;
- legal document versions;
- legal acknowledgements;
- organization authority representations;
- platform change directives;
- retention policy classifications;
- record retention assignments;
- administrator authority contexts;
- administrator permission grants.

The administrative permission catalog remains code-backed because it is a static domain catalog, not mutable Firestore state.

## Persistence rules enforced by the adapters

### Stable document identity

The adapters use the stable domain identifier specified by INF-003 as the Firestore document ID. They do not call collection `add()` and do not default to Firestore-generated IDs.

On read, the adapter verifies that the stored canonical identity field (`id`, `membershipId`, or `administratorId`) agrees with the Firestore document ID.

### Organization ownership

Collections marked organization-scoped by INF-003 must carry explicit `organizationId`. The adapter checks this before persistence and again when hydrating persisted records.

A path never substitutes for tenant ownership.

### Server timestamps

Persistence timestamps are authoritative server timestamps:

- `createdAt` is assigned on initial persistence;
- mutable records receive server-assigned `updatedAt` on save;
- a mutable save preserves the original persisted `createdAt`;
- append-only records never gain mutable update semantics.

Where the domain exposes `createdAt` / `updatedAt`, Firestore timestamps are normalized back to ISO strings when records are returned to the domain. Persistence-only `createdAt` metadata is stripped from domain records that do not expose that field.

### Append-only history

Append-only repositories use Firestore document `create()` semantics. Reusing an existing stable ID fails rather than silently replacing history.

This applies to audit events, legal evidence, organization authority representations, platform change directives, retention classifications/assignments, and administrator grants.

### Schema version

Every persisted record carries `schemaVersion`. Readers reject missing/invalid versions and explicitly reject records written with a future schema version unsupported by the current application.

## Query contracts

`src/infrastructure/firestore/query-contracts.ts` records every non-document-ID query introduced by these adapters.

The contracts identify the query field set and cardinality. Multi-field queries are marked as composite-index candidates. INF-005 will materialize only the indexes required by these approved contracts.

Important current composite-index candidates include:

- user by login provider + subject;
- active memberships by user + status;
- access restriction by target kind + organization;
- access restriction by target kind + membership;
- legal document by kind + version.

No speculative index definitions are introduced by INF-002.

## Local development

The intended development path is emulator-first.

After pulling this slice locally and installing dependencies:

```bash
nvm use
npm install
firebase emulators:start --only firestore
```

The Firestore emulator is already configured on port `8080` by INF-001.

When running application code against the emulator, use the Firebase CLI/project environment so `FIRESTORE_EMULATOR_HOST` and the development project identity are resolved locally. Do not create a production service-account JSON file for this workflow.

## Validation

`npm run validate:firestore-repositories` checks that:

- the reviewed Firebase Admin SDK version is pinned;
- stable IDs, schema metadata and server timestamps remain in the persistence support layer;
- every INF-003 foundation collection has an adapter binding;
- append-only writes preserve create-only semantics;
- no Firebase imports leak into domain source;
- no long-lived service-account credential pattern is introduced by the runtime;
- the query-contract inventory required by INF-005 remains present.

The validator is included in `npm run validate` and therefore in the production CI `npm run check` path.

## Deferred work

INF-002 does **not** add:

- Firestore Security Rules — INF-004;
- Firestore composite indexes — INF-005;
- Firebase Authentication — AUTH-001 onward;
- client-side direct Firestore access;
- production secrets or service-account keys;
- Storage, Functions, Stripe, or Microsoft integrations.

Those concerns remain separate infrastructure/provider slices.
