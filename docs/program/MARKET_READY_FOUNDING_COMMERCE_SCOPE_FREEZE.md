# Market-Ready Founding Commerce — Scope Freeze

Authoritative additive scope for `WP-MARKET-READY-FOUNDING-COMMERCE-01`.

This file supersedes the earlier statement that candidate paths would be narrowed later.

## Dependencies

Implementation may begin only after PR #188 merges. The builder starts from the then-current merged `main` and records the exact SHA.

Required existing foundations:

- `docs/architecture/WAVE_1_SLICE_1_30.md` / merged `COM-038` organization commercial state and provider-neutral payment boundary;
- current authenticated participant, organization-membership, and organization-operation authorization;
- current Founding acquisition and offer surfaces;
- current packet-local MRFC requirements and amendments;
- commercial-term reconciliation before production commercial activation.

`WP-EXCHANGE-ROOM-PHASE2-01` runs in parallel and is not an implementation dependency. Final Market-Ready integration depends on both.

`COM-039`, `COM-040`, and `COM-041` remain unresolved tracker IDs and are not redefined by this packet.

## Owned paths

- `src/domain/commercial/**`
- `src/application/commercial/**`
- `src/infrastructure/commercial/**`
- `src/infrastructure/firestore/commercial-*.ts`
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
- `test/market-ready-founding-commerce-*.test.mjs`
- `scripts/validate-market-ready-founding-commerce-*.mjs`
- `docs/program/evidence/market-ready-founding-commerce/**`

The marketing locale files are owned only for bounded reconciliation of the existing Founding offer. This packet does not authorize a marketing redesign.

No other path is implicitly owned. A newly discovered path requirement needs a Control Room scope amendment before edit.

## Non-owned paths

- `src/application/participant/**`
- `src/components/participant/**`
- `app/geography/canvas/**`
- `src/i18n/messages/network/**`
- Phase 2 action/lens controller tests, scripts, and evidence
- Opportunities/RFx domain/runtime paths
- Resources domain/runtime paths
- Intelligence analytical/runtime paths
- Referrals domain/runtime paths
- `governance/four-lens-requirements.json`
- `governance/four-lens-workstreams.json`
- Independent Acceptance evidence/dispositions

If commerce needs a shared participant-shell or navigation seam, it must use a Shared Contract Request to Lane 01.