# Post-Wave 3 Stabilization 6 — data correctness and participant UX

**Execution baseline:** `35dc3cbc570a6e15336ddba36e50691c0028f24e`

**Feature-ID effect:** none

## Referral identity

Referral persistence and Firestore queries already used stable sender and attached-recipient organization IDs after Stabilization 1B. The remaining defect was recipient-side map projection: it recovered the sender marker by comparing a display name. Both sender and recipient projections now carry `senderOrganizationId` and `recipientOrganizationId`, and every map/detail join resolves the other organization by ID. Display-name snapshots remain readable historical labels only.

## Truthful governed catalogs

The complete AMACS 0.5.0 catalog remains available through the existing deterministic Domain → Family → Capability fallback. The participant picker now reports the exact number of matching and currently displayed results and reveals the next bounded set on request. No governed match is silently hidden behind a fixed 30-result slice.

NAICS selection is pinned to the official U.S. Census Bureau [2022 NAICS Structure](https://www.census.gov/naics/2022NAICS/2022_NAICS_Structure.xlsx). The ingested source checksum is `217c9e0d4d74e7517bc288f5f308b73aa0de5ee787976a6dd222412be28ada22`; the generated projection contains 1,012 unique six-digit industries. The participant selects an exact governed code/title pair. The server resolves the code against the pinned release and constructs the stored title, version and provenance itself, so client-authored text cannot masquerade as authoritative NAICS identity. Free-text industries served remain separate descriptive context.

Previously stored NAICS descriptors remain visible and are preserved by default when they cannot be represented exactly by the governed release, including older versions and authorized imports. Preservation copies only server-classified historical descriptors from the stored record; a client cannot manufacture historical provenance. Distinct imported provenance remains preserved even when its code and version match a new governed selection. Up to 30 current governed selections can be added, replaced or cleared independently of a migration-safe bound of 30 preserved historical descriptors, while removing historical descriptors requires a separate explicit participant choice. A monotonic profile revision is checked again inside the Firestore transaction, which rejects a concurrent stale merge without relying on lossy timestamp conversion or resurrecting removed history. Exact authorized command receipts are replayed before enforcing fields introduced by this migration, so an in-flight pre-deployment success remains recoverable.

NAICS remains descriptive/filter metadata. It does not establish capability, evidence, verification, eligibility, qualification, procurement readiness or credibility, and it cannot create an AMACS capability assertion.

## Currently live navigation at the stabilization checkpoint

At the time Stabilization 6 merged, the shared participant navigation named the live map destination `Network` and exposed only destinations with working runtime: Network, Referrals, Resources, Quick Start and Account. The future Opportunities/RFx destination was removed rather than appearing functional. Navigation and changed catalog controls were localized for `en-US`, Spanish, French, Italian and German.

That result remains accurate historical evidence. It was a valid temporary capability-truthfulness correction at the post-Wave-3 checkpoint; it did not establish the permanent participant information architecture.

## Architectural reconciliation — August 11, 2026

The merged Exchange Interaction Architecture and the separately authorized no-Feature-ID shell gate supersede the narrower navigation rule for the ongoing participant shell without rewriting the historical result above.

Participant-facing truthfulness now has four parts:

1. **Structural truthfulness** — show the governed permanent lens architecture rather than a disposable taxonomy.
2. **Capability truthfulness** — visible does not mean available; unavailable lenses have no action, href, fabricated state or current-page treatment.
3. **State truthfulness** — unavailable, loading, empty, error, restricted and recovery states describe the relevant surface accurately.
4. **Continuity truthfulness** — ordinary lens movement stays visibly inside one authenticated Exchange.

The permanent lens order is therefore:

`Opportunities/RFx | Resources | Intelligence | Referrals`

During the shell gate:

- Opportunities/RFx is present first but explicitly unavailable, non-routable and never current;
- Resources, Intelligence and Referrals use their existing authorized runtime;
- `/geography/canvas` remains the stable Intelligence route, and Network remains its current organization-network view/domain concept;
- Quick Start and Account move to a separate Account utility control;
- Administration remains limited to implemented, server-authorized destinations and fails closed;
- the participant shell persists across ordinary client-side route changes; and
- route-specific loading remains below the shell rather than replacing it with the former `Preparing this page` treatment.

This reconciliation does not make Opportunities/RFx available, implement any RFx Feature ID, create an RFx route or record, add Intelligence datasets, restore Locations as a peer lens, or begin Slice 4.1 runtime.

## Scope boundary

This stabilization and its later shell reconciliation change no Feature ID or tracker total; totals remain `438 total · 152 Done · 286 Not Started`. Activation remains `43/43`, Network remains `38/38`, Wave 4 RFx Core remains `0/41`, and B6b remains intentionally pending. Stabilization 2C remains separate and parked.
