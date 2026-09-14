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
| Policy | CP-05 resolved sourcing mode/authority must be captured into the trusted Purchase Case handoff |
| Publish authority | Existing shared `rfx.publish` organization permission plus the CP-05-derived Purchase Case sourcing decision |
| Reads | CP-04 `offer-summary` and `fulfillment-summary` projections only |
| Files | CP-07 evidence records must be `uploaded` and explicitly `released`; no storage URL crosses the bridge |
| RFxchange link | Injected canonical `/opportunities/{id}` base URL |

## Supplier-safe projection

`createSupplierSafeNeedProjection` is a runtime allowlist. It permits only need/specification, quantity, timing, permitted fulfillment method/geography, response deadline, supplier requirements, and explicitly released file metadata. Unknown fields are discarded.

It never copies organization budgets, approval state/history, internal reasons or comments, employee contact details, competing offers, raw storage paths, or raw file URLs. The CP-03 command definitions rebuild and validate this allowlist on the server rather than trusting the browser-created object.

For every released file in a create/update command, the server transaction re-reads `accelpoEvidence/{evidenceId}` and requires the same organization, Purchase Case, uploaded status, released status, filename, content type, and size before the canonical RFx adapter is called. A client cannot release a file merely by setting a request field.

## Policy handoff

CP-05's merged `ResolvedSourcingPolicy` is the authority for sourcing behavior. It resolves `requestedMode`, `allowed`, `order`, `publishRequiredCapabilities`, and `requesterMayPublish`. CP-08 does not reimplement that policy engine.

The Purchase Case producer must persist a trusted handoff derived from the current CP-05 result before CP-08 publishing is enabled:

- `sourcingFlow` = the resolved `requestedMode` (`source-first` or `authorize-first` for this bridge);
- `sourcingPublicationAuthorized` = true only when the CP-05 sourcing result is allowed and the trusted requester is authorized to publish.

The CP-08 server command checks both values on the organization-scoped, versioned Purchase Case. A client-supplied flow cannot override the CP-05-derived decision.

## Commands

CP-08 defines these CP-03 command names:

- `rfxbridge.create-opportunity`
- `rfxbridge.update-opportunity`
- `rfxbridge.close-opportunity`
- `rfxbridge.withdraw-opportunity`

`createCP08RFxBridgeCommandDefinitions` provides the server definitions for the existing CP-03 registry, and `registerCP08RFxBridgeCommands` composes them into that one registry. All four commands require an idempotency key, `rfx.publish`, and the current Purchase Case version. Their trusted target is the organization-scoped `accelpoPurchaseCases` record, and successful canonical operations update only the Purchase Case link/flow/status/version in the same CP-03 transaction.

Create retries default to one deterministic idempotency key per Purchase Case. Update retries bind the canonical opportunity to a stable source revision. Close/withdraw retries bind the canonical opportunity to a stable mutation identity. The injected canonical adapter must also honor the idempotency key because a Firestore transaction may retry after the canonical operation has committed.

The returned canonical contract is validated fail-closed. Create requires a valid canonical opportunity identity/state. Update, close, and withdraw require RFxchange to return the exact opportunity already linked to the Purchase Case; close must return `closed` and withdraw must return `withdrawn`. A changed or malformed response is rejected before the AccelPO Purchase Case is mutated.

Both `source-first` and `authorize-first` flows use the same bridge contract. Once a Purchase Case is linked, CP-08 rejects an attempt to change its sourcing flow or substitute a different canonical opportunity. CP-08 intentionally has no award command; P7 remains the single award/order boundary and the initial bridge is single-award only.

## Queries

Buyer offer comparison uses CP-04 `offer-summary` and preserves every returned offer, including losing/not-selected offers. The bridge allowlists canonical offer identity, permitted supplier identity, quantity/fit, price components, fulfillment timing, validity/terms, deviations, and optional quote-evidence metadata.

Selected-supplier/fulfillment updates use CP-04 `fulfillment-summary` and are allowlisted again before they are returned to an AccelPO caller.

## Owned data and events

CP-08 owns no duplicate opportunity, supplier, offer, or fulfillment records. The canonical RFxchange services remain authoritative. AccelPO retains only the canonical opportunity reference and sourcing link state on the versioned Purchase Case through CP-03.

CP-08 does not emit transactional task notifications itself; CP-06 remains the durable task/notification system. RFxchange opportunity/offer/fulfillment lifecycle events remain owned by the canonical RFxchange domain.

## External port

`CanonicalRFxBridgePort` is the server-side adapter seam used by the CP-03 command definitions. A production implementation must call the existing RFxchange RFx authoring/publication and supplier/offer/fulfillment services with the server-authenticated actor attribution and supplied idempotency key. It must not persist a parallel opportunity or offer model.

## Focused checks

`test/accelpo-cp08-rfx-bridge.test.mjs`, `test/accelpo-cp08-rfx-bridge-commands.test.mjs`, and `test/accelpo-cp08-rfx-bridge-response-contract.test.mjs` verify:

- chassis registration with no new marketplace route;
- private purchasing fields cannot enter the supplier-safe projection;
- only explicitly released file metadata is bridged;
- CP-07 release state is rechecked server-side before publishing;
- CP-05-derived sourcing mode and publish authority cannot be overridden by the client;
- create/update/close/withdraw are CP-03 commands;
- server commands target and version the Purchase Case;
- canonical delegation retains organization/user/membership attribution and safe payloads only;
- retries reuse one canonical opportunity identity;
- a Purchase Case cannot be relinked to a different canonical opportunity;
- unexpected canonical opportunity identity/state fails closed;
- both sourcing flows use one versioned contract;
- offers/fulfillment are read through CP-04 and re-allowlisted;
- losing offers remain available for history;
- bridge version mismatches fail closed; and
- CP-08 exposes no award or split-award operation.

## Integration dependencies

The current RFxchange repository already has canonical RFx draft/publication services and the canonical opportunity route, but it does not yet expose a small-purchase adapter that maps the CP-08 supplier-safe need into the governed RFx request-family/package/definition inputs. CP-08 therefore provides the versioned canonical port and CP-03 command definitions without inventing a second RFx implementation. Wiring that adapter is the remaining RFx production integration dependency.

The Purchase Case workflow that consumes CP-05 must persist the trusted `sourcingFlow` and `sourcingPublicationAuthorized` handoff described above. This is a cross-part contract, not a CP-08-owned second policy model.

CP-07 is being developed in parallel. CP-08 currently binds released-file verification to CP-07's branch contract/collection name `accelpoEvidence`; reconcile that name if CP-07 changes before merge.

CP-04 currently guarantees the core offer fields (`canonicalOfferId`, supplier name, quantity, all-in amount, currency, fulfillment timing, validity, terms, deviations, quote-evidence status). CP-08 also accepts role-safe component/fit fields when CP-04 publishes them; until then those additive comparison fields remain `null` rather than reading around CP-04. The same applies to canonical offer/opportunity identifiers on fulfillment projections until CP-04 adds those buyer-safe fields.
