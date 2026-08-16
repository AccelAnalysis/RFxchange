# Resources Stage 2 Mobile Composition Consumption

**Lane:** 04 — Resources  
**Base:** `e46f57473d9a1ead6b90c7f48a317252f3416f09`  
**Stage 1 contracts:** merged through PR #218 and closed by `MOBILE_EXCHANGE_STAGE_1_ARCHITECTURE_LOCK.md`  
**Shared Stage 2 presentation dependency:** Lane 01 mobile shell/sheet/card React composition; no Lane 01 Stage 2 candidate existed when this bounded domain adapter was opened.

## Purpose

This change binds the existing authoritative Resources/provider domain projections to the merged shared mobile Exchange contracts. It does not create a Resources-private shell, map, bottom sheet, card framework, selection store, favorite system, action rail, or detail framework.

The primary binding is:

- `src/application/resource-network/mobile-resource-exchange.ts`

It consumes current server-authorized:

- `ProviderDiscoveryProjection` records;
- `ProviderResourceProjection` records;
- provider-purpose sender/recipient referral projections;
- current OPEN, `referral.manage`, and `resource.manage` authorization facts;
- current shared sheet state and localized copy supplied by the shared composition.

It returns shared Stage 1 contracts for:

- Resources map objects and service-territory areas;
- exactly four Resources action positions;
- provider, published-resource, and authorized request cards;
- focal record plus separately keyed provider-organization selection;
- shared detail context;
- shared sheet card/action payloads.

## Projection rules

### Providers

A provider card is created only from a current discoverable provider projection whose service geography remains released. The card identifies the organization as an Official Resource Provider because that fact is already established by the minimized server projection. It does not infer provider authority from registration, organization type, profile completion, payment, Founding recognition, verification, marker presence, or client state.

Provider metadata may include the current published services, categories, populations served, eligibility, intake, explicitly maintained availability, relevance explanation, service territory, and provenance/update time already present in the authorized projection.

### Published resources

A Resource card is created only from a current `published` `ProviderResourceProjection`. Draft, withdrawn, expired, suppressed, or otherwise absent records are not made visible by the adapter.

A resource remains a focal record distinct from its provider organization. Resource selection therefore uses:

```text
focal record: provider-resource:<resourceId>
associated organization: organization:<providerOrganizationId>
associated marker: provider organization marker, when one is authorized
```

The adapter never fabricates a point marker for a Resource merely because the record has geography identifiers.

### Provider requests

Request cards are created only when:

- the current caller has OPEN participant authority;
- the current caller has `referral.manage`;
- the projection is an authorized sender/recipient projection;
- `purpose === provider-connection`; and
- the exact provider context is present.

Ordinary referrals and unrelated private records are excluded. A request card does not make the request public and does not grant action authority.

## Service territory

The provider organization marker and provider service territory remain distinct:

- the marker is the permitted privacy-safe organization point projection;
- the service territory is a shared `ExchangeMapAreaProjection` associated with the provider organization selection key;
- authoritative geometry remains supplied by the Resource domain through an opaque geometry reference plus its already-authorized geometry sidecar;
- unreleased territory is not projected;
- no arbitrary client polygon becomes provider authority.

Selecting a provider, one of its published Resources, or one of its authorized provider requests may emphasize the same provider service territory without converting that area into an organization marker or Resource point.

## Four Resources actions

The adapter supplies exactly these positions:

1. `resources.find-providers` — **Find Providers**
2. `resources.browse-resources` — **Browse Resources**
3. `resources.my-requests` — **My Requests**
4. `resources.provider-status` — **Provider Status**

Authorization is projected independently:

- Find Providers and Browse Resources require the real OPEN Resources discovery boundary, not `referral.manage`;
- My Requests additionally requires `referral.manage`;
- Provider Status additionally requires `resource.manage` and own-organization applicability;
- external organization selection never exposes another organization's provider application or review workflow.

The shared action rail remains Lane 01-owned. This adapter supplies the Resources domain truth consumed by that rail.

## Card, media, favorite, and detail truth

- Provider and Resource cards use `LensResultCardModel`; no private card type is introduced.
- Current provider/resource projections do not include an accepted public media reference, so `media` remains `null`; private evidence or Storage references are never substituted.
- `RES-LENS-009` does not yet have a governed persisted saved-Resource relation. The resource-card star is therefore projected as visible but disabled, with `favorited: null`, no handler, and `not-operational` truth. The adapter does not create local or client-only persistence.
- Real record actions are limited to current provider/resource/request routes and a real intake URL where supplied.
- Shared detail is opened from the same focal identity used by the card; return remains the Resources lens and the shared composition owns map/sheet restoration.

## Shared integration contract

Lane 01 should consume this adapter after its current server loaders have resolved and revalidated Resources data. The shared composition supplies:

- current `ExchangeSheetState`;
- localized platform labels/functions;
- current camera and geography context;
- server-derived action authorization facts.

Lane 01 then renders the returned:

- `map`;
- `serviceTerritories` geometry bindings;
- `actionRail`;
- `sheet` card payload;
- `selection`; and
- `detail`.

If Lane 01's Stage 2 candidate requires a new generalized capability beyond the merged Stage 1 contracts, Lane 04 must raise a Shared Contract Request rather than add a private Resources implementation.

## Evidence

Focused tests in `test/resources-mobile-stage2-consumption.test.mjs` cover:

- exactly four Resources actions and independent authorization;
- released-provider and published-resource filtering;
- provider card and Resource card binding;
- service-territory geometry and marker distinction;
- focal Resource / associated provider / marker / area / detail consistency;
- disabled favorite truth;
- provider-purpose request privacy and `referral.manage` gating;
- fail-closed behavior without OPEN authority; and
- explicit no-fabricated-resource-marker and no-client-provider-authority policies.

## Stop boundary

This change does not:

- implement Lane 01 React/CSS mobile infrastructure;
- modify provider application or approval lifecycle;
- grant provider status from client state;
- expose unpublished Resources or private provider data;
- add a saved-Resource persistence model;
- broaden provider publication, request, commercial, verification, membership, or geography authority; or
- claim the integrated Stage 2 mobile experience is complete before Lane 01 reconciliation.
