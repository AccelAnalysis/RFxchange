# TestRFx → RFxchange Port Admission Gate

**Status:** Phase 2 governance gate
**Effect:** Blocks donor runtime/data ports until all required evidence exists

## Gate question

A donor feature is admissible only when the proposed RFxchange change can answer **yes** to every applicable question below without relying on TestRFx runtime authority.

## G0 — Contract mapping

Required before a work packet is proposed:

- feature row exists in the reconciliation matrix;
- one or more contract-map IDs are assigned;
- canonical identity is named;
- canonical persistence is named;
- consequential server command is named, or the row explicitly states that no command exists;
- authorization and negative cases are named;
- participant/public projection is named;
- audit/event and retry/rollback behavior are named;
- current RFxchange packet/PR ownership is reconciled.

Failure at G0 means the donor feature remains reference-only.

## G1 — Bounded work packet

Control Room must record:

- immutable requirement IDs;
- exact current `main` base SHA;
- lane/domain owner;
- owned and non-owned paths;
- dependencies and conflicting current PRs;
- release class;
- acceptance/evidence obligations;
- explicit stop boundary.

A convergence branch may not bypass current Stage 4 or RFx packet ownership.

## G2 — Domain readiness

Before UI implementation:

- every required command/repository/event exists in RFxchange or is built first in the owning domain packet;
- Firebase Auth/user/membership/authorization resolution is used;
- Firestore collection conventions and indexes are reviewed;
- Security Rules remain direct-client-deny where the application uses Admin/server authority;
- no browser state, fixture, route parameter, or donor session grants authority;
- no SQL/Neon or MapLibre production dependency enters RFxchange.

## G3 — Data migration readiness

Required for `MIGRATE DATA`:

1. versioned JSON/CSV manifest;
2. stable external source authority and record IDs;
3. source URL/use basis, retrieval time and content hash;
4. deterministic idempotency key;
5. canonical destination identity;
6. dry-run report with accepted/skipped/duplicate/conflicted/rejected counts;
7. conflict-review workflow;
8. emulator execution;
9. protected Firebase Admin or migration Function;
10. canonical server-command promotion;
11. migration event/audit;
12. separate verification of private canonical records and public projections.

Prohibited data:

- passwords, HMAC sessions, custom verification tokens;
- static preview users;
- illustrative organizations/media;
- local browser workspaces as canonical truth;
- SQL migration output copied directly into Firestore.

## G4 — Implementation acceptance

Every convergence PR must run the applicable subset of:

- Auth emulator;
- Firestore emulator;
- Functions tests;
- Storage emulator;
- Security Rules tests;
- wrong-tenant, missing-permission, revoked-membership and restricted-account negatives;
- deterministic authorization projection;
- architecture tests;
- typecheck;
- lint;
- production build;
- configured browser;
- 390px mobile;
- reduced motion;
- five locales;
- marker/card/detail/return continuity;
- console/exception check;
- visible build identity.

## G5 — Merge and release

Merge requires:

- exact-head CI;
- no known material security, privacy, tenancy, authority, integrity, accessibility or continuity defect;
- current dependency reconciliation;
- durable evidence record;
- no false `Verified`, `live`, or production claim.

Release remains risk-based under existing RFxchange governance. A visual match to TestRFx is never release evidence.

## Prohibited implementation patterns

- blind file copy;
- generic `exchange_records` collection;
- dual write or donor API call from RFxchange;
- direct client writes to protected canonical collections;
- MapLibre/OpenFreeMap provider code inside the Mapbox runtime;
- TestRFx custom session or browser actor resolution;
- local-only Save/Watch success presented as durable;
- arbitrary iframe/video URL;
- private Storage path/token in public cards;
- automatic geocode centroid/approximation;
- imported fixture or illustrative content;
- new private shell, card framework, map, action registry or selection store.

## Disposition transitions

Allowed transitions:

```text
not-started
→ contract-mapped
→ packet-authorized
→ implemented-not-verified
→ merged
→ released (when separately proven)
```

`SUPERSEDED` and `RETIRE` rows close with no runtime port. `DEFER` requires explicit current authority before reactivation.
