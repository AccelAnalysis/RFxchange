# Administration production repair — 2026-09-05

PR #260 is reconciled with merged RFx cycle work and repaired before release. Its administrative directories continue to use server-authorized destinations and records; unsupported scope/runtime combinations stay unavailable.

- User 360 requires profile and access grants in the same scope. Organization-scoped projections exclude other organizations' memberships, permissions and profiles, including mismatched authorization records. Unloaded invitation/restriction facts do not appear as zero.
- Firestore scope predicates run before pagination. Organization user directories page memberships within the organization before hydrating users. Geography definitions use their canonical document identity. Per-collection cursors prevent mixed authority/credential pages from skipping records.
- Search, clear, selection, pagination, detail links and reauthentication preserve the selected scope. Empty filtered pages retain a next-page action. Unsupported scoped Analytics and other runtime combinations are absent from navigation.
- Canonical record fields replace guessed field paths. Organization counts use exact, permission-appropriate scoped aggregation. Active restrictions exclude cleared `none` records. Bounded provider source-package samples are explicitly labeled incomplete.
- Source-package reads require the existing `provider.seed.promote` permission. No permission catalog, grant, participant write, commercial setting or tracker completion is expanded.

Focused unit tests exercise scoped User 360, same-scope permission conjunction and unavailable navigation. A disposable Firestore emulator test exercises pre-pagination isolation, geography identity, mixed-collection cursors, scoped membership counts, cleared restrictions and denied promotion reads, then removes its fixtures. The emulator test is part of production CI. Repository checks and exact candidate/merged-main CI remain required before deployment. These are builder delivery checks, not independent assurance.
