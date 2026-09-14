import assert from "node:assert/strict";
import test from "node:test";

import {
  CP08_RFX_BRIDGE_COMMANDS,
  createCP08RFxBridgeCommandDefinitions,
  createSupplierSafeNeedProjection,
} from "../apps/accelpo/src/rfx-bridge/index.ts";

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
    supplierRequirements: ["Authorized reseller"],
    files: [{
      id: "evidence-public",
      originalFilename: "specification.pdf",
      contentType: "application/pdf",
      size: 1024,
      releaseStatus: "released",
      storageUrl: "https://private.example/never-copy-this-url",
    }],
    budgetAmount: 7500,
    requesterEmail: "private@example.com",
  });
}

function supplierSafePayload() {
  const safe = safeNeed();
  return {
    bridgeVersion: 1,
    need: safe.need,
    timing: safe.timing,
    fulfillment: safe.fulfillment,
    supplierRequirements: safe.supplierRequirements,
    releasedFiles: safe.releasedFiles,
  };
}

test("CP-08 CP-03 definitions target/version the Purchase Case and delegate only to the canonical RFx port", async () => {
  const calls = [];
  const canonical = {
    async createOpportunity(input) {
      calls.push({ kind: "create", input });
      return { canonicalOpportunityId: "rfx-canonical-200", state: "open" };
    },
    async updateOpportunity(input) {
      calls.push({ kind: "update", input });
      return { canonicalOpportunityId: input.canonicalOpportunityId, state: "open" };
    },
    async closeOpportunity(input) {
      calls.push({ kind: "close", input });
      return { canonicalOpportunityId: input.canonicalOpportunityId, state: "closed" };
    },
    async withdrawOpportunity(input) {
      calls.push({ kind: "withdraw", input });
      return { canonicalOpportunityId: input.canonicalOpportunityId, state: "withdrawn" };
    },
  };
  const definitions = createCP08RFxBridgeCommandDefinitions(canonical);
  assert.deepEqual(definitions.map((definition) => definition.name), Object.values(CP08_RFX_BRIDGE_COMMANDS));
  assert.ok(definitions.every((definition) => definition.permission === "rfx.publish"));
  assert.ok(definitions.every((definition) => definition.idempotency === "required"));
  assert.ok(definitions.every((definition) => definition.requiresExpectedVersion === true));

  const create = definitions[0];
  assert.deepEqual(create.target({ purchaseCaseId: CASE }), {
    collection: "accelpoPurchaseCases",
    recordId: CASE,
    organizationField: "organizationId",
    versionField: "version",
  });
  const writes = [];
  const outcome = await create.handle({
    command: {
      commandName: CP08_RFX_BRIDGE_COMMANDS.CREATE_OPPORTUNITY,
      organizationContext: { organizationId: ORG },
      payload: {
        bridgeVersion: 1,
        purchaseCaseId: CASE,
        flow: "source-first",
        supplierSafeNeed: supplierSafePayload(),
      },
      expectedVersion: 0,
      idempotencyKey: `rfxbridge:create:${CASE}`,
      requestId: "command-request-1",
      actor: { userId: "user-1", membershipId: "membership-1", organizationId: ORG },
    },
    commandId: "accelpo_cmd_test",
    actor: { userId: "user-1", membershipId: "membership-1", organizationId: ORG },
    permission: "rfx.publish",
    target: { path: `accelpoPurchaseCases/${CASE}`, exists: true, data: { organizationId: ORG, version: 0 } },
    currentVersion: 0,
    now: "2026-09-14T23:00:00.000Z",
    transaction: {
      async get() { throw new Error("not expected"); },
      create(path, data) { writes.push({ method: "create", path, data }); },
      set(path, data) { writes.push({ method: "set", path, data }); },
      update(path, data) { writes.push({ method: "update", path, data }); },
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].input.organizationId, ORG);
  assert.equal(calls[0].input.purchaseCaseId, CASE);
  assert.equal(JSON.stringify(calls[0].input).includes("budgetAmount"), false);
  assert.equal(JSON.stringify(calls[0].input).includes("private@example.com"), false);
  assert.equal(JSON.stringify(calls[0].input).includes("private.example"), false);
  assert.equal(outcome.data.canonicalOpportunityId, "rfx-canonical-200");
  assert.equal(outcome.resultingVersion, 1);
  assert.equal(writes[0].path, `accelpoPurchaseCases/${CASE}`);
  assert.equal(writes[0].data.canonicalOpportunityId, "rfx-canonical-200");
  assert.equal(writes[0].data.version, 1);
});

test("CP-08 command definitions reject a mismatched canonical opportunity link before external mutation", async () => {
  let called = false;
  const canonical = {
    async createOpportunity() { throw new Error("not expected"); },
    async updateOpportunity() { called = true; throw new Error("not expected"); },
    async closeOpportunity() { called = true; throw new Error("not expected"); },
    async withdrawOpportunity() { called = true; throw new Error("not expected"); },
  };
  const update = createCP08RFxBridgeCommandDefinitions(canonical)[1];
  await assert.rejects(
    () => update.handle({
      command: {
        commandName: CP08_RFX_BRIDGE_COMMANDS.UPDATE_OPPORTUNITY,
        organizationContext: { organizationId: ORG },
        payload: {
          bridgeVersion: 1,
          purchaseCaseId: CASE,
          canonicalOpportunityId: "rfx-wrong",
          flow: "source-first",
          supplierSafeNeed: supplierSafePayload(),
        },
        expectedVersion: 1,
        idempotencyKey: "update-1",
        requestId: "command-request-2",
        actor: { userId: "user-1", membershipId: "membership-1", organizationId: ORG },
      },
      commandId: "accelpo_cmd_test_2",
      actor: { userId: "user-1", membershipId: "membership-1", organizationId: ORG },
      permission: "rfx.publish",
      target: {
        path: `accelpoPurchaseCases/${CASE}`,
        exists: true,
        data: {
          organizationId: ORG,
          version: 1,
          canonicalOpportunityId: "rfx-canonical-200",
          sourcingFlow: "source-first",
        },
      },
      currentVersion: 1,
      now: "2026-09-14T23:00:00.000Z",
      transaction: { async get() { throw new Error("not expected"); }, create() {}, set() {}, update() {} },
    }),
    /linked RFxchange opportunity is unavailable/,
  );
  assert.equal(called, false);
});
