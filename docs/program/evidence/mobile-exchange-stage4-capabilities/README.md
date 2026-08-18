# Mobile Exchange Stage 4 — Capabilities domain-adapter evidence

Work packet: `WP-MOBILE-EXCHANGE-STAGE4-CAPABILITIES-01`

Lane: Capabilities

Exact implementation base: `8f348c8c86a2a8eb1eeb6402a170a9120824d7ae`

Requirements: `MOB36-CAPABILITIES-001`, `MOB36-CAPABILITIES-AMACS-001`

Release class: Elevated

This packet implements the owned Capabilities domain adapter and direct authenticated route. It consumes the merged shared mobile Exchange contracts and `ExchangeSpatialScene`; it does not modify those shared contracts or activate the permanent Capabilities navigation pointer, which remains Shared-lane owned.

## Implemented truth boundary

- Organization capability cards, map objects, details, comparison, and gap projections are derived only from confirmed authoritative market-profile claims or permitted public/network projections.
- The viewer organization's complete market profile reuses the existing authorized organization-profile service; external records reuse the authorized Network discovery projection.
- Query-selected organizations are accepted only when the server-authorized discovery result contains that exact organization. Invalid or stale browser identifiers fall back without granting disclosure.
- Current and historical AMACS identities remain distinct. The runtime requires immutable AMACS `0.5.0` at source commit `da7879f2609271b067ae6d02875e9388a02c4fe5`; historical claim snapshots remain visible but are marked non-current.
- Manual AMACS browse/search remains available from the pinned catalog. Interpretation candidates have no input to the lens projection and cannot create or confirm a capability.
- The exact four canonical Capabilities action positions are retained for own and external selections. Only currently authorized handlers are active. RFx matching, referral entry, evidence editing, and save/follow remain disabled where no authoritative workflow exists.
- Evidence-submitted and Verified assertion states are displayed separately. A capability's visibility is explicitly not qualification, verification, recommendation, or an RFx match.

## Deliberate non-changes

- No participant shared contract, navigation registry, spatial-context serializer, shared action registry, or shared map renderer was changed.
- No generated AMACS projection, RFx, referral, resource-provider, tracker, governance, deployment, or release artifact was changed.
- No fabricated capability, organization, evidence, score, qualification, match, referral, or saved relationship was introduced.

The shared permanent-navigation activation and cross-lens configured-browser journey remain Integration/Shared-lane work. This domain candidate is therefore opened as a draft and does not claim merged, live, released, independently Verified, or tracker-complete status.
