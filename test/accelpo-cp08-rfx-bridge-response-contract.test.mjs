import assert from "node:assert/strict";
import test from "node:test";

import {
  CP08_RFX_BRIDGE_COMMANDS,
  createCP08RFxBridgeCommandDefinitions,
} from "../apps/accelpo/src/rfx-bridge/index.ts";

const ORG = "org-alpha";
const CASE = "case-100";
const OPPORTUNITY = "rfx-canonical-200";

function context(commandName, payload, update) {
  return {
    command: {
      commandName,
      organizationContext: { organizationId: ORG },
      payload,
      expectedVersion: 2,
      idempotencyKey: `${commandName}-retry-safe`,
      requestId: `${commandName}-request`,
      actor: { userId: "user-1", membershipId: "membership-1", organizationId: ORG },
    },
    commandId: "accelpo_cmd_response_contract",
    actor: { userId: "user-1", membershipId: "membership-1", organizationId: ORG },
    permission: "rfx.publish",
    target: {
      path: `accelpoPurchaseCases/${CASE}`,
      exists: true,
      data: {
        organizationId: ORG,
        version: 2,
        canonicalOpportunityId: OPPORTUNITY,
        sourcingFlow: "source-first",
        sourcingPublicationAuthorized: true,
      },
    },
    currentVersion: 2,
    now: "2026-09-14T23:00:00.000Z",
    transaction: {
      async get() { throw new Error("not expected"); },
      create() {},
      set() {},
      update,
    },
  };
}

test("CP-08 rejects an adapter that tries to relink an existing Purchase Case to a different opportunity", async () => {
  let wrote = false;
  const update = createCP08RFxBridgeCommandDefinitions({
    async createOpportunity() { throw new Error("not expected"); },
    async updateOpportunity() {
      return { canonicalOpportunityId: "rfx-different", state: "open" };
    },
    async closeOpportunity() { throw new Error("not expected"); },
    async withdrawOpportunity() { throw new Error("not expected"); },
  })[1];

  await assert.rejects(
    () => update.handle(context(
      CP08_RFX_BRIDGE_COMMANDS.UPDATE_OPPORTUNITY,
      {
        bridgeVersion: 1,
        purchaseCaseId: CASE,
        canonicalOpportunityId: OPPORTUNITY,
        flow: "source-first",
        supplierSafeNeed: {
          bridgeVersion: 1,
          need: { title: "Need", specification: null, quantity: 1, quantityUnit: "each" },
          timing: { neededBy: null, responseDeadline: "2026-09-20T17:00:00.000Z" },
          fulfillment: { method: "delivery", geography: "Virginia" },
          supplierRequirements: [],
          releasedFiles: [],
        },
      },
      () => { wrote = true; },
    )),
    /different opportunity than the linked Purchase Case/,
  );
  assert.equal(wrote, false);
});

test("CP-08 rejects an unexpected terminal state from the canonical adapter", async () => {
  let wrote = false;
  const close = createCP08RFxBridgeCommandDefinitions({
    async createOpportunity() { throw new Error("not expected"); },
    async updateOpportunity() { throw new Error("not expected"); },
    async closeOpportunity() {
      return { canonicalOpportunityId: OPPORTUNITY, state: "open" };
    },
    async withdrawOpportunity() { throw new Error("not expected"); },
  })[2];

  await assert.rejects(
    () => close.handle(context(
      CP08_RFX_BRIDGE_COMMANDS.CLOSE_OPPORTUNITY,
      { purchaseCaseId: CASE, canonicalOpportunityId: OPPORTUNITY },
      () => { wrote = true; },
    )),
    /unexpected opportunity state/,
  );
  assert.equal(wrote, false);
});
