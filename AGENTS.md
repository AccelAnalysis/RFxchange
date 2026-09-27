# RFxchange engineering instructions

## Product

- RFxchange is one organization-centered Exchange. Its participant lenses are Opportunities/RFx, Resources, Intelligence and Capabilities, in that order. Referrals is a cross-lens workflow and account utility.
- The root Next app owns the Exchange and shared authorized APIs. `apps/admin` is the administrative boundary; `apps/marketing` is the acquisition website. AccelPO is the separate purchasing PWA, sharing Firebase identity, organizations, memberships, permissions and entitlements. Do not add another Exchange app or duplicate those services.
- Organization owners count toward seat allowances. AccelPO remains task-first; community sourcing belongs to RFxchange.
- Use ordinary business language, focused views, accessible controls and responsive layouts. Preserve map/list selection, geography, privacy-safe coordinates, reduced motion and keyboard access. Consult `docs/design` and `docs/brand` for applicable visual rules.
- Show real permitted records and accurate loading, empty, restricted and error states. Do not invent market activity or infer verification/credibility from payment or membership status.

## Security and integrity

- Authenticate and authorize every protected server read and command; client navigation and cached presentation state never grant authority.
- Preserve organization/membership isolation, default-denied browser Firestore access, private evidence handling, current lifecycle and geography checks, and same-origin write protection.
- Use existing domain/application services and provider adapters. Preserve atomic expected-version checks, command replay/fingerprint handling and auditable consequential writes.
- AI proposals are non-authoritative. Validate AMACS identifiers against the pinned release; acceptance requires an authorized domain command.
- Never commit secrets, weaken negative authorization tests, expose private data, enable live payments or perform destructive data migrations as a cleanup shortcut.

## Change loop

1. Start from current `main`, inspect affected code and keep unrelated work intact.
2. Change the existing implementation. Delete superseded components, unused paths and obsolete tests in the same change. Compatibility code needs an actual supported caller and an explicit retirement condition.
3. Prefer behavioral tests. Component names, incidental attributes, exact prose, file counts and historical tracker arithmetic are not product contracts. Keep tests of authorization, tenancy, transactions, routing, accessibility and observable behavior.
4. Run `npm run check:fast`. Firebase-sensitive changes also require `npm run test:firebase`; production artifacts require `npm run check:build`. `npm run check` runs all three exactly once. CI computes sensitive paths with `scripts/ci-scope.mjs` and retains a manual full run.
5. Publish a reviewable branch/PR. Merge only after applicable checks pass on the candidate. Report what is implemented, merged and deployed separately; do not claim production performance without measurement.

Node 24.18.x or newer within Node 24 is the development toolchain; deployed Functions use Node 22. Production builds must bind `RFXCHANGE_BUILD_SHA` to their source commit. Keep automatic production rollouts paused unless deployment is explicitly requested; retain the existing rollback path.

## Documentation

Current explicit user instructions govern task scope. Read relevant product/security contracts, not a universal list of historical packets. `docs/archive`, old wave/program closeouts and trackers retain provenance; they do not require preserving obsolete UI, new parallel apps, independent acceptance ceremonies or source-text locks. No ordinary cleanup requires tracker arithmetic or extra approval.

Use `docs/architecture/DELIVERY_AND_EXCHANGE_RUNTIME.md` for the current delivery and UI lifecycle. Update documentation when a product/security contract changes; avoid new governance layers.
