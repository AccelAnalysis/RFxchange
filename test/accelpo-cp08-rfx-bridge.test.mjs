import assert from "node:assert/strict";
import test from "node:test";

import {
  CP08_RFX_BRIDGE_COMMANDS,
  CP08_RFX_BRIDGE_VERSION,
  RFxBridgeError,
  RFxBridgeService,
  createSupplierSafeNeedProjection,
} from "../apps/accelpo/src/rfx-bridge/index.ts";
import { createAccelPOPartRegistry } from "../apps/accelpo/src/chassis/registry.ts";

const ORG = "org-alpha";
const CASE = "case-100";

function safeNeed() {
  return createSupplierSafeNeedProjection({
    title: "Replacement field laptops",
    specification: "Three rugged laptops with 32 GB RAM.",
    quantity: 3,
    quantityUnit: "each",
    neededBy: "2026-10-01T12:00:00Z",
    responseDeadline: "2026-09-20T17:00:00Z",
    fulfillmentMethod: "delivery",
    fulfillmentGeography: "Hampton Roads, Virginia",
    supplierRequirements: ["Authorized reseller", "Ships within five business days"],
    files: [
      {
        id: "evidence-public",
        originalFilename: "specification.pdf",
        contentType: "application/pdf",
        size: 1024,
        releaseStatus: "released",
        storageUrl: "https://private.example/released-but-never-copy-url",
      },
      {
        id: "evidence-private",
        originalFilename: "internal-quote.pdf",
        contentType: "application/pdf",
        releaseStatus: "private",
        storageUrl: "https://private.example/internal",
      },
    ],
    budgetAmount: 7500,
    approvalHistory: [{ actor: "CFO", note: "Private" }],
    internalReason: "Private reason",
    requesterEmail: "employee@example.com",
    competingOffers: [{ supplier: "Other supplier" }],
  });
}

class MemoryCommandPort {
  constructor() {
    this.calls = [];
    this.byIdempotency = new Map();
  }

  async execute(request) {
    this.calls.push(request);
    const prior = this.byIdempotency.get(request.idempotencyKey);
    if (prior) return { ...prior, status: "replayed", replayed: true };
    const state = request.commandName === CP08_RFX_BRIDGE_COMMANDS.CLOSE_OPPORTUNITY
      ? "closed"
      : request.commandName === CP08_RFX_BRIDGE_COMMANDS.WITHDRAW_OPPORTUNITY
        ? "withdrawn"
        : "open";
    const result = {
      commandPortVersion: 1,
      commandId: `command-${this.calls.length}`,
      commandName: request.commandName,
      requestId: request.requestId,
      status: "committed",
      replayed: false,
      resultingVersion: 1,
      data: {
        bridgeVersion: CP08_RFX_BRIDGE_VERSION,
        purchaseCaseId: request.payload.purchaseCaseId,
        canonicalOpportunityId: request.payload.canonicalOpportunityId ?? "rfx-canonical-100",
        flow: request.payload.flow ?? "source-first",
        state,
      },
    };
    this.byIdempotency.set(request.idempotencyKey, result);
    return result;
  }
}

class MemoryQueryPort {
  constructor() {
    this.calls = [];
  }

  async read(input) {
    this.calls.push(input);
    if (input.query.projection === "offer-summary") {
      return {
        outcome: "success",
        projection: "offer-summary",
        nextCursor: null,
        items: [
          {
            id: "offer-row-1",
            purchaseCaseId: CASE,
            canonicalOfferId: "offer-canonical-1",
            providerName: "Alpha Supplier",
            quantity: 3,
            fitSummary: "Meets requested quantity and specification",
            subtotalAmount: 3000,
            shippingAmount: 125,
            taxAmount: 175,
            feeAmount: 0,
            otherAmount: 0,
            allInAmount: 3300,
            currency: "USD",
            fulfillmentTiming: "4 business days",
            validUntil: "2026-09-22T00:00:00Z",
            terms: "Net 30",
            deviations: null,
            quoteEvidenceId: "evidence-quote-1",
            quoteEvidenceStatus: "released-to-buyer",
            status: "selected",
            supplierInternalMargin: 0.42,
          },
          {
            id: "offer-row-2",
            purchaseCaseId: CASE,
            canonicalOfferId: "offer-canonical-2",
            providerName: "Beta Supplier",
            quantity: 3,
            allInAmount: 3425,
            currency: "USD",
            fulfillmentTiming: "3 business days",
            deviations: "Alternate carrying case",
            status: "not-selected",
            privateSupplierNote: "Never expose",
          },
        ],
      };
    }
    if (input.query.projection === "fulfillment-summary") {
      return {
        outcome: "success",
        projection: "fulfillment-summary",
        nextCursor: null,
        items: [{
          id: "fulfillment-1",
          purchaseCaseId: CASE,
          canonicalOpportunityId: "rfx-canonical-100",
          canonicalOfferId: "offer-canonical-1",
          providerName: "Alpha Supplier",
          state: "in-transit",
          orderReference: "PO-100",
          confirmationAt: "2026-09-21T12:00:00Z",
          neededBy: "2026-10-01T12:00:00Z",
          deliveredAt: null,
          receivedAt: null,
          exceptionCode: null,
          exceptionSummary: null,
          internalDispatchContact: "private@example.com",
        }],
      };
    }
    return { outcome: "empty", projection: input.query.projection, items: [], nextCursor: null };
  }
}

function service() {
  const commandPort = new MemoryCommandPort();
  const queryPort = new MemoryQueryPort();
  return {
    commandPort,
    queryPort,
    bridge: new RFxBridgeService({
      commandPort,
      queryPort,
      rfxchangeOpportunityBaseUrl: "https://exchange.example/opportunities/",
    }),
  };
}

test("CP-08 registers only as a bridge and does not add an AccelPO marketplace route", () => {
  const registry = createAccelPOPartRegistry();
  const part = registry.get("CP-08-rfx-bridge");
  assert.ok(part);
  assert.deepEqual(part.routes, []);
  assert.deepEqual(part.permissions, ["purchase.request", "purchase.sourcing.publish", "purchase.offers.view"]);
  assert.ok(part.connectionPoints.includes("RFxBridge"));
});

test("supplier-safe projection is an allowlist and includes only explicitly released file metadata", () => {
  const projection = safeNeed();
  const serialized = JSON.stringify(projection);
  assert.equal(projection.bridgeVersion, 1);
  assert.equal(projection.releasedFiles.length, 1);
  assert.equal(projection.releasedFiles[0].evidenceId, "evidence-public");
  for (const forbidden of [
    "budgetAmount",
    "approvalHistory",
    "internalReason",
    "requesterEmail",
    "competingOffers",
    "storageUrl",
    "private.example",
    "evidence-private",
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("create opportunity goes through CP-03, supports source-first, and retries with one canonical opportunity", async () => {
  const { bridge, commandPort } = service();
  const input = {
    organizationId: ORG,
    purchaseCaseId: CASE,
    flow: "source-first",
    supplierSafeNeed: safeNeed(),
    requestId: "request-100",
  };
  const first = await bridge.publishSupplierSafeNeed(input);
  const second = await bridge.publishSupplierSafeNeed({ ...input, requestId: "request-101" });

  assert.equal(commandPort.calls[0].commandName, CP08_RFX_BRIDGE_COMMANDS.CREATE_OPPORTUNITY);
  assert.equal(commandPort.calls[0].organizationContext.organizationId, ORG);
  assert.equal(commandPort.calls[0].idempotencyKey, `rfxbridge:create:${CASE}`);
  assert.equal(commandPort.calls[0].payload.bridgeVersion, 1);
  assert.equal(JSON.stringify(commandPort.calls[0].payload).includes("budgetAmount"), false);
  assert.equal(first.canonicalOpportunityId, "rfx-canonical-100");
  assert.equal(second.canonicalOpportunityId, first.canonicalOpportunityId);
  assert.equal(first.rfxchangeHref, "https://exchange.example/opportunities/rfx-canonical-100");
});

test("authorize-first uses the same canonical contract and update/close/withdraw remain CP-03 commands", async () => {
  const { bridge, commandPort } = service();
  const published = await bridge.publishSupplierSafeNeed({
    organizationId: ORG,
    purchaseCaseId: CASE,
    flow: "authorize-first",
    supplierSafeNeed: safeNeed(),
    requestId: "request-authorized",
  });
  assert.equal(published.flow, "authorize-first");

  await bridge.updateSupplierSafeNeed({
    organizationId: ORG,
    purchaseCaseId: CASE,
    canonicalOpportunityId: published.canonicalOpportunityId,
    flow: "authorize-first",
    supplierSafeNeed: safeNeed(),
    sourceRevision: "revision-2",
    requestId: "request-update",
  });
  await bridge.closeOpportunity({
    organizationId: ORG,
    purchaseCaseId: CASE,
    canonicalOpportunityId: published.canonicalOpportunityId,
    mutationId: "close-intent-1",
    requestId: "request-close",
  });
  await bridge.withdrawOpportunity({
    organizationId: ORG,
    purchaseCaseId: CASE,
    canonicalOpportunityId: published.canonicalOpportunityId,
    mutationId: "withdraw-intent-1",
    requestId: "request-withdraw",
  });

  assert.deepEqual(commandPort.calls.slice(1).map((call) => call.commandName), [
    CP08_RFX_BRIDGE_COMMANDS.UPDATE_OPPORTUNITY,
    CP08_RFX_BRIDGE_COMMANDS.CLOSE_OPPORTUNITY,
    CP08_RFX_BRIDGE_COMMANDS.WITHDRAW_OPPORTUNITY,
  ]);
});

test("buyer offer comparison reads through CP-04, keeps losing offers, and allowlists comparison fields", async () => {
  const { bridge, queryPort } = service();
  const offers = await bridge.readOfferComparisons(ORG, CASE);
  assert.equal(queryPort.calls[0].query.projection, "offer-summary");
  assert.deepEqual(queryPort.calls[0].query.filters, [{ field: "purchaseCaseId", operator: "==", value: CASE }]);
  assert.deepEqual(offers.map((offer) => offer.canonicalOfferId), ["offer-canonical-1", "offer-canonical-2"]);
  assert.equal(offers[0].price.allInAmount, 3300);
  assert.equal(offers[0].price.shippingAmount, 125);
  assert.equal(offers[0].fitSummary, "Meets requested quantity and specification");
  assert.equal(offers[1].status, "not-selected");
  const serialized = JSON.stringify(offers);
  assert.equal(serialized.includes("supplierInternalMargin"), false);
  assert.equal(serialized.includes("privateSupplierNote"), false);
});

test("selected supplier fulfillment updates are CP-04 projections and private dispatch data is omitted", async () => {
  const { bridge, queryPort } = service();
  const updates = await bridge.readFulfillmentUpdates(ORG, CASE);
  assert.equal(queryPort.calls[0].query.projection, "fulfillment-summary");
  assert.equal(updates[0].canonicalOfferId, "offer-canonical-1");
  assert.equal(updates[0].supplierName, "Alpha Supplier");
  assert.equal(JSON.stringify(updates).includes("internalDispatchContact"), false);
});

test("CP-08 has no award or split-award action; P7 remains the award boundary", () => {
  const { bridge } = service();
  assert.equal("award" in bridge, false);
  assert.equal("splitAward" in bridge, false);
  assert.equal(Object.values(CP08_RFX_BRIDGE_COMMANDS).some((name) => name.includes("award")), false);
});

test("bridge contract version mismatch fails closed", async () => {
  const queryPort = new MemoryQueryPort();
  const commandPort = {
    async execute(request) {
      return {
        commandPortVersion: 1,
        commandId: "command-bad-version",
        commandName: request.commandName,
        requestId: request.requestId,
        status: "committed",
        replayed: false,
        resultingVersion: 1,
        data: {
          bridgeVersion: 99,
          purchaseCaseId: CASE,
          canonicalOpportunityId: "rfx-canonical-100",
          flow: "source-first",
          state: "open",
        },
      };
    },
  };
  const bridge = new RFxBridgeService({
    commandPort,
    queryPort,
    rfxchangeOpportunityBaseUrl: "https://exchange.example/opportunities/",
  });
  await assert.rejects(
    () => bridge.publishSupplierSafeNeed({
      organizationId: ORG,
      purchaseCaseId: CASE,
      flow: "source-first",
      supplierSafeNeed: safeNeed(),
      requestId: "request-bad-version",
    }),
    (error) => error instanceof RFxBridgeError && error.code === "contract-mismatch",
  );
});
