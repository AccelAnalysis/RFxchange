import assert from "node:assert/strict";
import test from "node:test";

import {
  ACCELPO_COMMAND_REGISTRY,
  AccelPoCommandError,
  AccelPoCommandRegistry,
  commandTargetDescriptor,
  parseClientCommandEnvelope,
  stableCommandSerialization,
} from "../src/application/accelpo/command-port.ts";
import {
  CP03_COMMAND_PORT_PART,
  CP03_COMMAND_REGISTRATION,
} from "../apps/accelpo/src/command-port/part.ts";
import { createAccelPOCommandClient } from "../apps/accelpo/src/command-port/client.ts";
import { createAccelPOPartRegistry } from "../apps/accelpo/src/chassis/registry.ts";

const validRequest = {
  commandName: "purchase-case.save",
  organizationContext: { organizationId: "org-one" },
  payload: { title: "Laptop stands", quantity: 4 },
  expectedVersion: 2,
  idempotencyKey: "purchase-case-save-round-1",
  requestId: "request-2026-09-14-001",
};

test("CP-03 parses a client envelope without accepting a client actor", () => {
  const parsed = parseClientCommandEnvelope(validRequest);
  assert.equal(parsed.organizationContext.organizationId, "org-one");
  assert.equal(parsed.requestId, validRequest.requestId);
  assert.equal("actor" in parsed, false);
  assert.throws(
    () => parseClientCommandEnvelope({ ...validRequest, actor: { userId: "attacker" } }),
    (error) => error instanceof AccelPoCommandError && error.code === "validation-failure",
  );
  assert.throws(
    () => parseClientCommandEnvelope({ ...validRequest, membershipId: "other-membership" }),
    (error) => error instanceof AccelPoCommandError && error.code === "validation-failure",
  );
});

test("CP-03 command fingerprints can be stable across object key order", () => {
  assert.equal(
    stableCommandSerialization({ b: 2, a: { d: false, c: true } }),
    stableCommandSerialization({ a: { c: true, d: false }, b: 2 }),
  );
  assert.notEqual(
    stableCommandSerialization({ ...validRequest.payload, quantity: 5 }),
    stableCommandSerialization(validRequest.payload),
  );
});

test("CP-03 validates trusted target descriptors before reading a record", () => {
  assert.deepEqual(
    commandTargetDescriptor({
      collection: "accelPoPurchaseCases",
      recordId: "case-one",
      owner: { field: "requesterUserId", kind: "user" },
      versionField: "version",
    }),
    {
      collection: "accelPoPurchaseCases",
      recordId: "case-one",
      owner: { field: "requesterUserId", kind: "user" },
      versionField: "version",
    },
  );
  assert.throws(
    () => commandTargetDescriptor({ collection: "../../organizations", recordId: "case-one" }),
    (error) => error instanceof AccelPoCommandError && error.code === "validation-failure",
  );
  assert.throws(
    () => commandTargetDescriptor({ collection: "accelPoPurchaseCases", recordId: "../other" }),
    (error) => error instanceof AccelPoCommandError && error.code === "validation-failure",
  );
});

test("registered command definitions remain unique and are exposed through one registry", () => {
  const registry = new AccelPoCommandRegistry();
  const definition = {
    name: "purchase-case.test",
    permission: "purchasing.request",
    handle: () => ({ data: { ok: true } }),
  };
  registry.register(definition);
  assert.equal(registry.get(definition.name), definition);
  assert.throws(() => registry.register(definition), /already registered/);
  assert.equal(ACCELPO_COMMAND_REGISTRY.list().length, 0);
});

test("CP-03 is registered in the existing shell registry and exposes one endpoint", () => {
  const registry = createAccelPOPartRegistry();
  assert.deepEqual(registry.get(CP03_COMMAND_PORT_PART.id), CP03_COMMAND_PORT_PART);
  assert.equal(CP03_COMMAND_REGISTRATION.endpoint, "/api/accelpo/commands");
});

test("the browser client preserves structured conflict details", async () => {
  let captured = null;
  const client = createAccelPOCommandClient({
    endpoint: "/api/accelpo/commands",
    fetcher: async (url, init) => {
      captured = { url, init };
      return new Response(JSON.stringify({
        error: "This record changed before the action could be completed.",
        code: "command-version-conflict",
        details: { currentVersion: 3 },
      }), { status: 409, headers: { "content-type": "application/json" } });
    },
  });

  await assert.rejects(
    () => client.execute(validRequest),
    (error) => error.code === "command-version-conflict" && error.details.currentVersion === 3,
  );
  assert.equal(captured.url, "/api/accelpo/commands");
  assert.equal(captured.init.method, "POST");
  assert.equal(JSON.parse(captured.init.body).organizationContext.organizationId, "org-one");
  assert.equal(JSON.parse(captured.init.body).idempotencyKey, validRequest.idempotencyKey);
});
