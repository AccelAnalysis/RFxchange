# Shared Contract Request — Intelligence Layer State and Generic Selection

**Request ID:** `SCR-INTEL-001`  
**Status:** **PROPOSED — REQUIRES CONTROL ROOM / LANE 01 ACTIVATION AND ACCEPTANCE**  
**Requesting lane:** 03 — Intelligence  
**Originating packet:** `WP-INTEL-ROADMAP-01`  
**Activation epoch:** `initial-operational-2026-08-12`  
**Immutable activation base:** `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`

## 1. Request

Lane 03 requests a bounded Shared Exchange contract extension before a live configurable Intelligence layer foundation is implemented.

The request has two related parts:

1. add a versioned, non-authorizing seam for **active Intelligence layer state** within the shared participant spatial context; and
2. evolve the current organization-centric selection seam into a backward-compatible **generic selected-object reference** capable of representing future permitted organization, location, site/facility, RFx and analytical objects.

This request does not authorize either change. Lane 01 owns the shared contract and implementation decision under `SHARED_EXCHANGE_CONTRACTS.md`.

## 2. Current shared-contract limitation

Current `ParticipantSpatialContext` v1 correctly preserves:

- participant/membership/organization/geography scope;
- active lens;
- an organization-centric selection (`organizationId`, `markerId`, optional `relationshipId`);
- map camera;
- per-lens search/filter/result/list state;
- panel state; and
- origin/return state.

Its policy correctly states that it stores no authorization, private coordinates or domain records and that the server revalidates selected objects/actions.

That contract is sufficient for current organization-centered Network/Resources/Referrals continuity but does not yet represent:

- which Intelligence analytical layers are active;
- a selected canonical locality/location analytical object independently of an organization marker;
- a future site/facility object;
- a selected RFx analytical object; or
- another governed analytical object type.

Lane 03 must not add a private parallel session store or fork the selected-object contract to work around those limitations.

## 3. Requested contract shape

Lane 01 should determine the final shared schema. Lane 03 needs behavior equivalent to the following concepts.

### 3.1 Optional layer state

A versioned Intelligence-specific extension under the shared context, for example:

```text
intelligence: {
  layerStateVersion,
  activeLayerIds[],
  layerControlStateById{}
}
```

Requirements:

- layer IDs are stable strings defined by the Intelligence layer registry, not client-generated authority;
- parsing rejects malformed/oversized state;
- state is scoped to current participant + membership + organization + geography as the existing context is;
- unknown/removed layer IDs are dropped safely;
- control values are validated against the current layer contract before use;
- storage contains presentation continuity only, never source records, private coordinates or authorization;
- sign-out/session replacement/scope change retains current shared invalidation behavior; and
- the server remains authoritative for whether the layer and its data are permitted.

### 3.2 Generic selected-object seam

The shared selection should support a stable non-authorizing reference conceptually equivalent to:

```text
selectedObject: {
  type,
  id
}
```

with compatibility fields or a migration path for the current organization/marker/relationship selection.

Initial object-type authority should remain closed/registered rather than accepting arbitrary client strings. The contract must support only types for which a consuming domain has a current server revalidation path.

Potential future types include:

- `organization`;
- `geography` / `location` where Lane 01 and geography authority establish the exact vocabulary;
- `rfx`/`opportunity` after RFx cross-lens analytical authority exists;
- `site` only after authoritative Site & Facility Intelligence exists; and
- a bounded analytical object type if one is later justified.

This request does **not** require all of those types to be enabled in the first shared implementation.

## 4. Required invariants

Any accepted Shared Exchange extension must preserve:

- client state is non-authorizing;
- source/domain data remain server-authorized and minimized;
- no private coordinates or domain records are persisted in presentation continuity state;
- exact participant/membership/organization/geography scope;
- invalidation on sign-out, session replacement, scope mismatch and invalid schema;
- server revalidation when a selected object or layer is restored;
- safe fallback to the current home organization/spatial context when restoration is no longer valid;
- persistent shell and current map/list/detail behavior;
- URL/history continuity without treating URL state as authority;
- backward compatibility or explicit migration from `PARTICIPANT_SPATIAL_CONTEXT_VERSION = 1`;
- bounded storage size; and
- no shared dependency on Intelligence-specific data repositories.

## 5. Ownership boundary

### Lane 01 owns

- shared context schema/versioning;
- generic selected-object contract;
- session persistence/migration/invalidation;
- shared renderer/selection/list-detail synchronization mechanics; and
- shared architecture/acceptance tests.

### Lane 03 owns

- Intelligence layer IDs and semantic registry;
- layer source/provenance/privacy contracts;
- analytical controls defined by layer semantics;
- Intelligence-specific data projections; and
- Intelligence participant copy/caveats/provenance presentation.

Lane 03 must not make the shared context depend directly on AMACS, Network, site, RFx, Resource or Referral repositories.

## 6. Acceptance required from Lane 01

A future activated Shared Exchange packet should prove at least:

1. versioned migration/parse behavior from current v1 state;
2. malformed/unknown layer state fails safely;
3. unknown or unauthorized selected-object references are cleared/narrowed after server revalidation;
4. sign-out/session/scope invalidation remains correct;
5. no authorization/private coordinate/domain record is stored;
6. existing organization selection and Resources/Referrals/Opportunities continuity regressions remain green;
7. map/list/detail parity remains intact;
8. 390px/mobile, keyboard, screen-reader and reduced-motion behavior does not regress;
9. all current participant lens navigation remains inside one Exchange shell; and
10. no Intelligence dataset or live analytical layer is introduced by the shared packet.

Independent Acceptance/Integration remains separate according to the Four-Lens program.

## 7. Proposed Control Room packet

**Proposed packet ID:** `WP-SHARED-INTEL-LAYER-STATE-01`

**Boundary:** implement and accept only the shared context/selection extension above. No Intelligence data source, calculation, heatmap, site, RFx/Resources/Referrals private record, outcome or visual analytical layer.

## 8. Current disposition

`WP-INTEL-ROADMAP-01` records this request and stops. Until Lane 01 accepts a shared solution, Lane 03 should not implement a private alternative for active layer persistence or generic selected-object continuity.
