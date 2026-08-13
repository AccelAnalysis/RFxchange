# Market-Ready Founding Commerce — Scope Freeze

Authoritative scope for `WP-MARKET-READY-FOUNDING-COMMERCE-01`.

## Base and dependencies

PR #188's base SHA is Control Room provenance only. After #188 merges, Control Room must create `governance/market-ready-founding-commerce-implementation-activation.json` with the exact then-current merged `main` SHA before `commercial/founding-live-commerce` begins.

Required foundations are the merged `COM-038` commercial boundary, current organization authorization, current Founding acquisition/offer surfaces, and the current MRFC registry. Phase 2 runs in parallel and is not a commercial implementation dependency. `COM-039`–`COM-041` remain unresolved and are not redefined here.

## Owned paths

- `src/domain/commercial/**`
- `src/application/commercial/**`
- `src/infrastructure/commercial/**`
- `src/infrastructure/firestore/commercial-*.ts`
- `src/infrastructure/firestore/schema.ts`
- `app/api/commercial/**`
- `app/commercial/**`
- `app/founding/**`
- `app/acquisition/founding/**`
- `src/components/commercial/**`
- `src/i18n/messages/market-ready-founding-commerce/**`
- `src/i18n/get-dictionary.ts`
- `src/i18n/messages/marketing-pages/en-US.json`
- `src/i18n/messages/marketing-pages/es.json`
- `src/i18n/messages/marketing-pages/fr.json`
- `src/i18n/messages/marketing-pages/it.json`
- `src/i18n/messages/marketing-pages/de.json`
- `.env.example`
- `package.json`
- `package-lock.json`
- `test/firestore-schema.test.mjs`
- `test/market-ready-founding-commerce-*.test.mjs`
- `scripts/validate-market-ready-founding-commerce-*.mjs`
- `docs/program/evidence/market-ready-founding-commerce/**`

The canonical Firestore schema file and its existing exact-schema test are owned only for the commercial registration required by existing schema conventions. Marketing locale files are owned only for bounded Founding-offer reconciliation.

No other path is implicitly owned. A newly discovered path requirement needs a Control Room scope amendment before edit.

## Non-owned paths

- `src/application/participant/**`
- `src/components/participant/**`
- `app/geography/canvas/**`
- `src/i18n/messages/network/**`
- Phase 2 controller/evidence paths
- Opportunities/RFx domain paths
- Resources domain paths
- Intelligence analytical paths
- Referrals domain paths
- `governance/four-lens-requirements.json`
- `governance/four-lens-workstreams.json`
- Independent Acceptance dispositions/evidence

Any needed shared participant-shell seam must be requested from Lane 01.