# AccelPO CP-08 RFxBridge

CP-08 is the versioned boundary between AccelPO purchasing and the canonical RFxchange supplier experience. It does not create an AccelPO marketplace, supplier directory, offer engine, map, or fulfillment engine.

## Connection contract

| Surface | Contract |
| --- | --- |
| Chassis part | `CP-08-rfx-bridge` |
| Contract version | `1` |
| Routes | None; RFxchange owns the supplier/opportunity experience |
| Identity | Shared CP-01 organization/user context |
| Consequential writes | CP-03 only; Purchase Case target/version is rechecked server-side |
| Publish authority | Existing shared `rfx.publish` organization permission |
| Reads | CP-04 `offer-summary` and `fulfillment-summary` projections only |
| Files | CP-07 evidence IDs only after explicit `released` state; no storage URL crosses the bridge |
| RFxchange link | Injected canonical `/opportunities/{id}` base URL |

## Supplier-safe projection

`createSupplierSafeNeedProjection` is a runtime allowlist. It permits only need/specification, quantity, timing, permitted fulfillment method/geography, response deadline, supplier requirements, and explicitly released file metadata. Unknown fields are discarded.

It never copies organization budgets, approval state/history, internal reasons or comments, employee contact details, competing offers, raw storage paths, or raw file URLs. The CP-03 command definitions rebuild and validate this allowlist on the server rather than trusting the browser-created object.

## Commands

CP-08 defines these CP-03 command names:

- `rfxbridge.create-opportunity`
- `rfxbridge.update-opportunity`
- `rfxbridge.close-opportunity`
- `rfxbridge.withdraw-opportunity`

`createCP08RFxBridgeCommandDefinitions` provides the server definitions for the existing CP-03 registry. All four commands require an idempotency key, `rfx.publish`, and the current Purchase Case version. Their trusted target is the organization-scoped `accelpoPurchaseCases` record, and successful canonical operations update only the Purchase Case link/flow/status/version in the same CP-03 transaction.

Create retries default to one deterministic idempotency key per Purchase Case. Update retries bind the canonical opportunity to a stable source revision. Close/withdraw retries bind the canonical opportunity to a stable mutation identity. The injected canonical adapter must also honor the idempotency key because a Firestore transaction may retry after the canonical operation has committed. The returned contract must contain version `1` and the same canonical RFxchange opportunity ID.

Both `source-first` and `authorize-first` flows use the same bridge contract. Once a Purchase Case is linked, CP-08 rejects an attempt to change its sourcing flow or substitute a different canonical opportunity. CP-08 intentionally has no award command; P7 remains the single award/order boundary and the initial bridge is single-award only.

## Queries

Buyer offer comparison uses CP-04 `offer-summary` and preserves every returned offer, including losing/not-selected offers. The bridge allowlists canonical offer identity, permitted supplier identity, quantity/fit, price components, fulfillment timing, validity/terms, deviations, and optional quote-evidence metadata.

Selected-supplier/fulfillment updates use CP-04 `fulfillment-summary` and are allowlisted again before they are returned to an AccelPO caller.

## Owned data and events

CP-08 owns no duplicate opportunity, supplier, offer, or fulfillment records. The canonical RFxchange services remain authoritative. AccelPO retains only the canonical opportunity reference and sourcing link state on the versioned Purchase Case through CP-03.

CP-08 does not emit transactional task notifications itself; CP-06 remains the durable task/notification system. RFxchange opportunity/offer/fulfillment lifecycle events remain owned by the canonical RFxchange domain.

## External port

`CanonicalRFxBridgePort` is the server-side adapter seam used by the CP-03 command definitions. A production implementation must call the existing RFxchange RFx authoring/publication and supplier/offer/fulfillment services with the server-authenticated actor attribution and the supplied idempotency key. It must not persist a parallel opportunity or offer model.

## Focused checks

`test/accelpo-cp08-rfx-bridge.test.mjs` and `test/accelpo-cp08-rfx-bridge-commands.test.mjs` verify:

- chassis registration with no new marketplace route;
- private purchasing fields cannot enter the supplier-safe projection;
- only explicitly released file metadata is bridged;
- create/update/close/withdraw are CP-03 commands;
- server commands target and version the Purchase Case;
- canonical delegation retains organization/user/membership attribution and safe payloads only;
- retries reuse one canonical opportunity identity;
- a Purchase Case cannot be relinked to a different canonical opportunity;
- both sourcing flows use one versioned contract;
- offers/fulfillment are read through CP-04 and re-allowlisted;
- losing offers remain available for history;
- bridge version mismatches fail closed; and
- CP-08 exposes no award or split-award operation.

## Integration dependencies

The current RFxchange repository already has canonical RFx draft/publication services and the canonical opportunity route, but it does not yet expose a small-purchase adapter that maps the CP-08 supplier-safe need into the governed RFx request-family/package/definition inputs. CP-08 therefore provides the versioned canonical port and CP-03 command definitions without inventing a second RFx implementation. Wiring that adapter is the remaining production integration dependency.

CP-04 currently guarantees the core offer fields (`canonicalOfferId`, supplier name, quantity, all-in amount, currency, fulfillment timing, validity, terms, deviations, quote-evidence status). CP-08 also accepts role-safe component/fit fields when CP-04 publishes them; until then those additive comparison fields remain `null` rather than reading around CP-04. The same applies to canonical offer/opportunity identifiers on fulfillment projections until CP-04 adds those buyer-safe fields.
