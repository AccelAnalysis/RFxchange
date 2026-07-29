# INF-005 — Firestore index management

## Status

Implemented for the current RFxchange Firestore foundation query set.

## Decision

Firestore indexes are query-contract driven. RFxchange does not create manual composite indexes speculatively.

The current INF-002 repository layer uses document-ID lookups and equality (`==`) filters only. It has no range/inequality filters, `orderBy`, collection-group queries, or vector queries.

Cloud Firestore automatic indexes support single equality filters and compound equality queries through index merging. The current query set therefore requires no manual composite indexes.

## Index strategies

`src/infrastructure/firestore/query-contracts.ts` assigns every approved query one of three strategies:

- `automatic-single-field` — one equality filter;
- `automatic-equality-merge` — multiple equality filters served through automatic index merging;
- `manual-composite` — reserved for a future query shape that actually requires a manual index.

The current compound-equality queries are:

- `user-by-login`;
- `active-memberships-by-user`;
- `restriction-by-organization`;
- `restriction-by-membership`;
- `legal-document-by-kind-version`.

None currently require `manual-composite`.

## Source-controlled configuration

`firestore.indexes.json` is the canonical Firebase CLI index file:

```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

The empty `indexes` array means there are no manual indexes required today; Firestore automatic indexing remains active. `fieldOverrides` is empty so default automatic indexing is not weakened by exemptions.

`firebase.json` binds both Firestore configuration files:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

## Query-contract-first process

A new manual index follows this sequence:

```text
repository query requirement
→ approved query contract
→ index-strategy decision
→ exact manual index if required
→ validation
→ staging deployment/readiness
→ production deployment
```

A manual index must not be introduced merely because a future query seems likely.

## Manual-index triggers

Index design must be revisited when a repository adds a query involving, for example:

- equality plus ordering on another field;
- equality plus range/inequality filtering;
- multiple range/inequality fields;
- array operators combined with additional clauses where manual indexing is required or recommended;
- collection-group querying;
- a Firestore missing-index requirement for an approved query.

The exact index should be based on the approved query shape rather than guessed.

## Environment policy

The same source-controlled index definitions are deployed independently to development/staging/production environments.

Development remains emulator-first. New manual indexes should be validated in staging before production. Production code must not rely on a newly declared manual index until that index is available in the production database.

## Validation

`npm run validate:firestore-indexes` verifies that:

1. `firebase.json` references `firestore.indexes.json`;
2. the file contains `indexes` and `fieldOverrides` arrays;
3. query contracts expose explicit index strategies;
4. the old speculative `compositeIndexCandidate` flag is gone;
5. current repository filters remain equality-only;
6. no `orderBy` is introduced without renewed index review;
7. no speculative manual indexes or field exemptions exist for the current query set.

Architecture tests protect the same foundation decisions.

## Deliberately deferred

INF-005 does not add future RFx discovery/search indexes, geography/map indexes, vector indexes, index exemptions, production index deployment automation, or Query Explain performance tuning. Those belong with the query surfaces that require them.

## Acceptance result

INF-005 is complete when Firestore index configuration is source-controlled and bound to Firebase, every current repository query has an explicit index strategy, unnecessary manual indexes are absent, and CI prevents future complex query shapes from bypassing index review.
