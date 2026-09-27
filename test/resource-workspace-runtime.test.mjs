import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScript } from "./helpers/load-typescript.mjs";
import * as query from "../src/application/resource-network/resource-network-workspace.ts";

class DependencyUnavailable extends Error {}
const access = { membership: { id: "member-a", organizationId: "org-a" }, context: { user: { id: "user-a" } } };
function fixture({ permissions = [], unavailable = false, failing = false } = {}) {
  const calls = [];
  const projection = { model: { selectedGeography: { id: "geo-a" } }, homeMarker: { id: "home" } };
  const referrals = [
    { id: "request-1", purpose: "provider-connection", providerContext: { providerOrganizationId: "provider-a" } },
  ];
  const privateRead = async (name, value, actor) => {
    calls.push([name, actor]);
    if (failing) throw Error("offline");
    return value;
  };
  const deps = {
    "@/src/application/resource-network/resource-network-workspace": query,
    "@/src/infrastructure/auth/participant-route-runtime": {
      ParticipantRouteDependencyUnavailableError: DependencyUnavailable,
    },
    "@/src/infrastructure/firestore/runtime": {
      getServerFirestore: () => ({}),
      createServerFirestoreFoundationRepositories: () => ({
        organizationAuthorization: {
          getByMembershipId: async (id) => {
            assert.equal(id, "member-a");
            return { permissions };
          },
        },
      }),
    },
    "@/src/infrastructure/geography/participant-map-runtime": {
      loadAuthorizedParticipantMapProjection: async () => (unavailable ? null : projection),
    },
    "@/src/infrastructure/referrals/runtime": {
      createServerReferralNetworkService: () => ({ snapshot: (actor) => privateRead("referrals", referrals, actor) }),
    },
    "@/src/infrastructure/resource-network/runtime": {
      createServerResourceNetworkService: () => ({
        ownerSnapshot: (actor) => privateRead("owner", { resources: [] }, actor),
        messages: (actor) => privateRead("messages", [], actor),
      }),
    },
    "@/src/infrastructure/network-discovery/runtime": {
      loadAuthorizedNetworkDiscovery: async (input) => {
        calls.push(["network", input]);
        return {
          available: true,
          projection: {
            organizations: [
              {
                organizationId: "provider-a",
                marker: { id: "marker-a", coordinate: [1, 2], accessibleLocationLabel: "Public location" },
                profile: { displayName: "Provider A" },
              },
            ],
          },
        };
      },
    },
    "@/src/infrastructure/resource-network/discovery-runtime": {
      loadAuthorizedResourceDiscovery: async (input) => {
        calls.push(["discovery", input]);
        return {
          available: true,
          projection: {
            providers: [{ organizationId: "provider-a" }],
            resources: [{ id: "resource-1", organizationId: "provider-a" }],
            listings: [],
          },
        };
      },
    },
  };
  return {
    calls,
    load: loadTypeScript(new URL("../src/infrastructure/resource-network/workspace-runtime.ts", import.meta.url), deps)
      .loadAuthorizedResourceWorkspace,
  };
}

test("workspace reads no private adjuncts without their permissions and drops unauthorized selections", async () => {
  const { load, calls } = fixture();
  const result = await load(access, { request: "request-1", provider: "not-visible" });
  assert.deepEqual(result.adjunctState, { requests: "restricted", management: "restricted" });
  assert.equal(
    calls.some(([name]) => ["referrals", "owner", "messages"].includes(name)),
    false,
  );
  assert.equal(result.queryState.requestId, null);
  assert.equal(result.queryState.providerId, null);
  assert.equal(result.commandRecoveryScope, "org-a:member-a");
});

test("optional private failures preserve authorized public discovery with explicit unavailable state", async () => {
  const { load, calls } = fixture({ permissions: ["referral.manage", "resource.manage"], failing: true });
  const result = await load(access, {});
  assert.deepEqual(result.adjunctState, { requests: "unavailable", management: "unavailable" });
  assert.deepEqual(result.referrals, []);
  assert.equal(result.owner, null);
  assert.equal(result.providers[0].organizationId, "provider-a");
  for (const [name, actor] of calls.filter(([name]) => ["referrals", "owner"].includes(name))) {
    assert.equal(actor.organizationId, "org-a", name);
    assert.equal(actor.membershipId, "member-a", name);
  }
});

test("provider, resource and request selections retain their authorized marker during revalidation", async () => {
  for (const [kind, id] of [
    ["provider", "provider-a"],
    ["resource", "resource-1"],
    ["request", "request-1"],
  ]) {
    const { load, calls } = fixture({ permissions: ["referral.manage"] });
    const result = await load(access, {}, { kind, id });
    assert.equal(calls.find(([name]) => name === "network")[1].focusedOrganizationId, "provider-a");
    assert.equal(result.queryState[`${kind}Id`], id);
    assert.equal(result.organizations[0].marker.id, "marker-a");
  }
  const { load } = fixture();
  assert.equal((await load(access, { organization: "provider-a" })).queryState.organizationId, "provider-a");
});

test("a missing authorized map is retryable dependency failure, never an empty or fabricated workspace", async () => {
  await assert.rejects(fixture({ unavailable: true }).load(access, {}), DependencyUnavailable);
});
