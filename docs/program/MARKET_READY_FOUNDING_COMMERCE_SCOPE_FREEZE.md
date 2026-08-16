# Market-Ready Founding Commerce — Scope Freeze

Authoritative scope for `WP-MARKET-READY-FOUNDING-COMMERCE-01`.

## Base and dependencies

PR #188's base SHA is Control Room provenance only. After #188 merges, Control Room must create `governance/market-ready-founding-commerce-implementation-activation.json` with the exact then-current merged `main` SHA before `commercial/founding-live-commerce` begins.

Required foundations are the merged `COM-038` commercial boundary, current organization authorization, current Founding acquisition/offer surfaces, and the current MRFC registry. Phase 2 runs in parallel and is not a commercial implementation dependency. `COM-039`–`COM-041` remain unresolved and are not redefined here.

The existing Firebase Functions background-job runner/store are consumed as shared infrastructure under the existing webhook extension convention. This packet does not own or rewrite those shared files unless a later Control Room scope amendment explicitly permits it.

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
- `functions/package.json`
- `functions/src/index.ts`
- `functions/src/market-ready-founding-commerce-functions.ts`
- `functions/src/application/market-ready-founding-commerce-*.ts`
- `functions/src/runtime/market-ready-founding-commerce-*.ts`
- `functions/test/market-ready-founding-commerce-*.test.mjs`
- `test/firestore-schema.test.mjs`
- `test/market-ready-founding-commerce-*.test.mjs`
- `scripts/validate-market-ready-founding-commerce-*.mjs`
- `docs/program/evidence/market-ready-founding-commerce/**`

The Functions entrypoint is owned only to export the bounded commercial webhook function. `functions/package.json` and the root lockfile are owned only for dependencies required by that commercial adapter. New Functions application/runtime/test files must use the `market-ready-founding-commerce-` prefix. Shared background-job runner/store files remain read-only dependencies.

The canonical Firestore schema file and its existing exact-schema test are owned only for the commercial registration required by existing schema conventions. Marketing locale files are owned only for bounded Founding-offer reconciliation.

No other path is implicitly owned. A newly discovered path requirement needs a Control Room scope amendment before edit.

## Control Room scope amendment — 2026-08-15

Control Room authorizes these additional **exact files only** for the remaining Critical convergence of `WP-MARKET-READY-FOUNDING-COMMERCE-01`:

- `firestore.rules`
- `src/infrastructure/auth/firebase-server.ts`
- `src/infrastructure/firestore/support.ts`
- `test/commercial-payment-boundary.test.mjs`
- `src/components/acquisition/FoundingAcquisitionContinuation.tsx`
- `scripts/validate-post-wave3-marketing-surfaces.mjs`
- `src/application/participant/participant-lens-registry.ts`

This amendment is narrow and does not transfer general ownership of their parent directories.

The first four files are owned only for the Issue #192 commercial-authority persistence/security boundary already required by this packet: server-only commercial authority, canonical Firestore support, and direct-client denial evidence. They may not be used to redesign unrelated authorization, persistence, or participant behavior.

`src/components/acquisition/FoundingAcquisitionContinuation.tsx` is a one-file Lane 01 shared-contract seam owned only to connect the already-governed post-value Founding continuation to the packet-owned `/commercial/founding` surface. Its localized copy, eligibility semantics, and surrounding participant-shell behavior remain unchanged. No other `src/components/acquisition/**`, participant-shell, orientation, or Exchange Room path is authorized by this amendment.

`scripts/validate-post-wave3-marketing-surfaces.mjs` is owned only to reconcile its existing preserved-intent assertion with that same one-file continuation change. It must continue to require the public `/founding` conversion actions to enter `/acquisition/founding`; only the already-qualified post-value continuation assertion may point to `/commercial/founding`.

`src/application/participant/participant-lens-registry.ts` is owned only to classify the exact `/commercial/founding` participant destination as part of the already-mounted persistent authenticated participant route family. This amendment does not authorize changing lens identities, lens destinations, availability, active navigation state, utilities, shared-shell rendering, or any other participant route. The commerce component may report an authorized participant only after its protected status request succeeds, so signed-out, loading, and failed authorization states remain without participant navigation.

Shared background-job runner/store files remain read-only dependencies. This amendment does not authorize Phase 2, Opportunities/RFx, Resources, Intelligence, Referrals, Independent Acceptance, merge, deployment, or live Checkout work.

## Non-owned paths

- `src/application/participant/**` except the exact amended `src/application/participant/participant-lens-registry.ts`
- `src/components/participant/**`
- `app/geography/canvas/**`
- `src/i18n/messages/network/**`
- Phase 2 controller/evidence paths
- Opportunities/RFx domain paths
- Resources domain paths
- Intelligence analytical paths
- Referrals domain paths
- `functions/src/application/background-jobs.ts`
- `functions/src/runtime/firestore-background-job-store.ts`
- other shared Functions runtime files not explicitly listed above
- `governance/four-lens-requirements.json`
- `governance/four-lens-workstreams.json`
- Independent Acceptance dispositions/evidence

Any needed shared participant-shell seam beyond the exact amended file above must be requested from Lane 01.
