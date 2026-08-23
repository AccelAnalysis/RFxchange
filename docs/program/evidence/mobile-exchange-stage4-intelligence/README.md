# Mobile Exchange Stage 4 — Intelligence evidence

## Bound packet

- Work packet: `WP-MOBILE-EXCHANGE-STAGE4-INTELLIGENCE-01`
- Lane: Intelligence
- Immutable requirement: `MOB36-INTELLIGENCE-001`
- Activation epoch: `mobile-exchange-stage4-intelligence-2026-08-18`
- Activation base recorded by Control Room: `3830577e14b7b1bc6878965d26369529de2ebbbb`
- Reconciled implementation base: merged `main` `8f348c8c86a2a8eb1eeb6402a170a9120824d7ae`
- Dependency evidence: post-merge production CI run `32109036958` succeeded on that exact merged main.
- Release class: Elevated
- Optional independent assurance: not performed; this is builder/repository evidence only.

## Implemented boundary

The Stage 4 Intelligence adapter projects the existing server-authorized organization Network view through the merged Stage 3 whole-lens contracts. It does not create a second shell, renderer, card framework, selection store, analytical layer, note/comment store, follow state, comparison store, or private action handler.

The production route now passes the already-authorized participant route and Network discovery result through a server-only Intelligence boundary before handing the same authoritative discovery to the existing shared Exchange workspace. The boundary independently requires:

- the Network query geography to equal the authorized map geography;
- server-revalidated shared geography and domain-revalidated empty layer state;
- one full organization identity across map, result card, detail target, focused deep link, and spatial disposition;
- a separately server-authorized focused discovery result before a selected organization is admitted;
- no result map/card retention for restricted or unavailable states; and
- exactly four current immutable Intelligence action IDs in their governed positions.

## Record truth

Every current Intelligence result is typed as `organization-network-result` and carries:

- projection visibility for the authorized participant organization;
- first-party/server-derived source identity;
- selected canonical geography, boundary authority, and source layer;
- source vintage and exact projection/effective timestamp;
- authoritative-projection quality basis;
- explicit discovery and qualification caveats; and
- bounded page/projected/total/candidate-limit coverage with `fullMarketMeasure: false`.

The current approved analytical-layer registry is empty. The adapter therefore returns domain-revalidated empty layer state and never turns `totalMatched`, match scores, organizations, or capabilities into market size, density, activity, share, gap, or impact claims.

## Scope enforcement

The Intelligence domain scope policy models `private | team | organization | public` separately and requires an exact server-derived authority context:

- private: exact user and organization;
- team: exact organization and permitted team ID;
- organization: exact viewing organization; and
- public: explicit public-record permission.

The current organization Network projection uses only the organization-scoped participant projection. No private, team, note, draft, version-history, or related-domain activity record is introduced by this packet.

## PR #220 reconciliation

Useful PR #220 work was reconciled rather than merged:

- retained: authoritative organization/capability source binding, privacy-safe coordinates, full map/card/detail identity, focused-selection narrowing, explicit coverage caveats, empty analytical layers, and hidden unsupported save/favorite state;
- superseded: the four legacy Stage 2 action IDs, the pre-Stage-3 composition/continuity shapes, and PR-specific integration assumptions;
- intentionally not imported: its optional ORG-018/ORG-019 enrichment loader. Those records are outside this immutable requirement and would not authorize an analytical layer or new Site runtime.

The current immutable action sequence is:

1. `intelligence.add-view`
2. `intelligence.edit-note`
3. `intelligence.compare`
4. `intelligence.track`

All four stay truthfully disabled because no current approved insight, note, compare, or follow handler exists. Own/external labels still resolve through the existing five-locale shared action catalog.

## Stop boundary

This packet did not modify shared participant contracts/components, governance ledgers, trackers, deployment configuration, Firebase rules, or any other lane’s domain. It did not add a dataset, analytical layer, fabricated statistic, persistence operation, release, or optional `Verified` claim.

See [VERIFICATION.md](./VERIFICATION.md) for commands and acceptance mapping.
