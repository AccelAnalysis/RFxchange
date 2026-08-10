import assert from "node:assert/strict";
import test from "node:test";

import { apiProblem } from "../src/infrastructure/http/api-problem.ts";

const ids = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
];

function request(correlationId = null) {
  const headers = new Headers();
  if (correlationId) headers.set("x-rfxchange-correlation-id", correlationId);
  return { headers, method: "POST", url: "https://rfxchange.example/api/resources?private=true" };
}

test("API problems return bounded participant copy and opaque identifiers without cause detail", async () => {
  const reports = [];
  const cause = Object.assign(new Error("Firebase provider body: secret-tenant"), {
    code: "auth/internal-error",
    stack: "private-stack-trace",
  });
  let index = 0;
  const response = apiProblem(request("attacker-controlled-value"), {
    status: 599,
    participantMessage: "The request is temporarily unavailable.",
    code: "dependency-unavailable",
    cause,
  }, {
    id: () => ids[index++],
    report: (event) => reports.push(event),
  });
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.equal(body.error, "The request is temporarily unavailable.");
  assert.equal(body.code, "dependency-unavailable");
  assert.equal(body.correlationId, ids[0]);
  assert.equal(body.supportId, ids[1]);
  assert.equal(response.headers.get("x-rfxchange-correlation-id"), ids[0]);
  assert.equal(response.headers.get("x-rfxchange-support-id"), ids[1]);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(JSON.stringify(body).includes("Firebase"), false);
  assert.equal(JSON.stringify(body).includes("secret-tenant"), false);
  assert.equal(JSON.stringify(body).includes("private-stack-trace"), false);
  assert.deepEqual(reports, [{
    event: "api.problem",
    correlationId: ids[0],
    supportId: ids[1],
    method: "POST",
    pathname: "/api/resources",
    status: 500,
    publicCode: "dependency-unavailable",
    causeName: "Error",
    causeCode: "auth/internal-error",
  }]);
  assert.equal(JSON.stringify(reports).includes("secret-tenant"), false);
  assert.equal(JSON.stringify(reports).includes("private-stack-trace"), false);
});

test("API problems continue only validated opaque correlations and suppress unsafe public fields", async () => {
  const reports = [];
  const response = apiProblem(request(ids[2].toUpperCase()), {
    status: 409,
    participantMessage: " ".repeat(300),
    code: "provider/raw error",
  }, {
    id: () => ids[0],
    report: (event) => reports.push(event),
  });
  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.error, "The request could not be completed.");
  assert.equal(body.code, undefined);
  assert.equal(body.correlationId, ids[2]);
  assert.equal(body.supportId, ids[0]);
  assert.equal(reports[0].causeName, "undefined");
});

test("API problems replace invalid generated identifiers with opaque UUIDs", async () => {
  const response = apiProblem(request(), {
    status: 503,
    participantMessage: "The dependency is temporarily unavailable.",
  }, {
    id: () => "predictable-internal-identifier",
    report: () => undefined,
  });
  const body = await response.json();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  assert.match(body.correlationId, uuid);
  assert.match(body.supportId, uuid);
  assert.notEqual(body.correlationId, body.supportId);
});
