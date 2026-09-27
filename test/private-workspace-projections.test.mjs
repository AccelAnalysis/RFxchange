import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import * as crypto from "node:crypto";
import * as buffer from "node:buffer";
import { loadTypeScript } from "./helpers/load-typescript.mjs";
const require = createRequire(import.meta.url);
const next = require("next/server");

function routeFixture(route, access) {
  const reads = [],
    resolutions = [];
  const snapshot = {
    privateEvidence: ["owner-only"],
    publicCredentials: [],
    publicAssets: [],
    publicAdditionalLocations: [],
  };
  const service = {
    snapshot: async (id) => {
      reads.push(id);
      return snapshot;
    },
  };
  const dependencies = {
    "next/server": next,
    "next/headers": {},
    "node:crypto": crypto,
    "node:buffer": buffer,
    "@/src/infrastructure/http/application-request-origin": {},
    "@/src/application/market-profile/market-profile": {},
    "@/src/application/resource-network/resource-network": {},
    "@/src/application/organization-enrichment/organization-enrichment": {},
    "@/src/application/storage/organization-asset-upload-boundary": {},
    "@/src/application/storage/store-organization-asset": {},
    "@/src/domain/organization-enrichment/model": {},
    "@/src/domain/storage/model": {},
    "@/src/infrastructure/firebase/admin": {},
    "@/src/infrastructure/firestore/repositories": {},
    "@/src/infrastructure/firestore/runtime": {},
    "@/src/infrastructure/storage/firebase-private-object-store": {},
    "@/src/infrastructure/storage/firestore-stored-asset-repository": {},
    "@/src/infrastructure/auth/participant-route-runtime": {
      RFXCHANGE_SESSION_COOKIE_NAME: "session",
      resolveParticipantRoute: async (input) => {
        resolutions.push(input);
        return access;
      },
    },
    "@/src/infrastructure/http/api-problem": {
      apiProblem: () => {
        throw Error("Unexpected dependency failure");
      },
    },
    "@/src/infrastructure/market-profile/runtime": { createServerMarketProfileService: async () => service },
    "@/src/infrastructure/organization-enrichment/runtime": {
      createServerOrganizationEnrichmentService: () => service,
    },
    "@/src/infrastructure/resource-network/runtime": {},
    "@/src/infrastructure/resource-network/workspace-runtime": {
      loadAuthorizedResourceWorkspace: async (current) => {
        reads.push(current.membership.organizationId);
        return snapshot;
      },
    },
  };
  const handler = loadTypeScript(new URL(`../app/api/${route}/route.ts`, import.meta.url), dependencies).GET;
  const params =
    route === "resources"
      ? "view=workspace&scopeOrganization=requested-org"
      : `organizationId=requested-org${route === "organization-enrichment" ? "&view=editor" : ""}`;
  return {
    reads,
    resolutions,
    get: () =>
      handler(
        new next.NextRequest(`https://example.test/api/${route}?${params}`, {
          headers: { cookie: "session=verified-cookie" },
        }),
      ),
  };
}
for (const route of ["organization-market-profile", "organization-enrichment", "resources"]) {
  test(`${route}: private refresh requires current participant authority`, async () => {
    for (const [access, expected] of [
      [{ kind: "unauthenticated" }, 401],
      [{ kind: "forbidden" }, 403],
    ]) {
      const f = routeFixture(route, access);
      assert.equal((await f.get()).status, expected);
      assert.deepEqual(f.reads, []);
      assert.deepEqual(f.resolutions, [{ sessionCookie: "verified-cookie", requestedOrganizationId: "requested-org" }]);
    }
  });
  test(`${route}: private refresh uses the authorized organization and cannot be cached publicly`, async () => {
    const f = routeFixture(route, {
      kind: "authorized",
      membership: { organizationId: "authorized-org" },
      state: { lifecycleState: "open-platform" },
    });
    const response = await f.get();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(f.reads, ["authorized-org"]);
    assert.deepEqual((await response.json()).privateEvidence, ["owner-only"]);
  });
}
test("Resources refresh retains the OPEN lifecycle gate", async () => {
  const f = routeFixture("resources", { kind: "authorized", state: { lifecycleState: "controlled-platform" } });
  assert.equal((await f.get()).status, 403);
  assert.deepEqual(f.reads, []);
});
