# Post-Wave 3 Stabilization 6 — data correctness and participant UX

**Execution baseline:** `35dc3cbc570a6e15336ddba36e50691c0028f24e`

**Feature-ID effect:** none

## Referral identity

Referral persistence and Firestore queries already used stable sender and attached-recipient organization IDs after Stabilization 1B. The remaining defect was recipient-side map projection: it recovered the sender marker by comparing a display name. Both sender and recipient projections now carry `senderOrganizationId` and `recipientOrganizationId`, and every map/detail join resolves the other organization by ID. Display-name snapshots remain readable historical labels only.

## Truthful governed catalogs

The complete AMACS 0.5.0 catalog remains available through the existing deterministic Domain → Family → Capability fallback. The participant picker now reports the exact number of matching and currently displayed results and reveals the next bounded set on request. No governed match is silently hidden behind a fixed 30-result slice.

NAICS selection is pinned to the official U.S. Census Bureau [2022 NAICS Structure](https://www.census.gov/naics/2022NAICS/2022_NAICS_Structure.xlsx). The ingested source checksum is `217c9e0d4d74e7517bc288f5f308b73aa0de5ee787976a6dd222412be28ada22`; the generated projection contains 1,012 unique six-digit industries. The participant selects an exact governed code/title pair. The server resolves the code against the pinned release and constructs the stored title, version and provenance itself, so client-authored text cannot masquerade as authoritative NAICS identity. Free-text industries served remain separate descriptive context.

Previously stored NAICS descriptors remain visible and are preserved by default when they cannot be represented exactly by the governed release, including older versions and authorized imports. Preservation copies only server-classified historical descriptors from the stored record; a client cannot manufacture historical provenance. Distinct imported provenance remains preserved even when its code and version match a new governed selection. The current governed selection can be added, replaced or cleared independently, while removing historical descriptors requires a separate explicit participant choice. The server read carries the profile timestamp into the Firestore transaction, which rejects a concurrent stale merge rather than resurrecting removed history.

NAICS remains descriptive/filter metadata. It does not establish capability, evidence, verification, eligibility, qualification, procurement readiness or credibility, and it cannot create an AMACS capability assertion.

## Currently live navigation

The shared participant navigation now names the live map destination `Network` and exposes only currently live post-Wave 3 destinations: Network, Referrals, Resources, Quick Start and Account. The future Opportunities/RFx destination is absent rather than appearing functional. Navigation and changed catalog controls are localized for `en-US`, Spanish, French, Italian and German.

## Scope boundary

This stabilization changes no Feature ID or tracker total; totals remain `438 total · 152 Done · 286 Not Started`. It does not implement RFx Core, an Opportunities runtime, PR #150’s final lens hierarchy, the future Exchange shell, Intelligence or Locations runtime, Dark Appearance, Presentation Mode, B6b, automatic translation of participant-authored content or any later slice/gate.
