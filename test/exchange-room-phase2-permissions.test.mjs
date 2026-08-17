import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { projectExchangeRoomActions } from "../src/application/participant/exchange-room-actions.ts";

const source = readFileSync(
  new URL("../src/application/participant/exchange-room-actions.ts", import.meta.url),
  "utf8",
);

const activeCapable = [
  "opportunities.find",
  "opportunities.create-rfx",
  "resources.find-providers",
  "resources.browse-resources",
  "resources.my-requests",
  "resources.provider-status",
  "intelligence.organizations",
  "intelligence.capabilities",
];

const gray = [
  "opportunities.pursue-respond",
  "opportunities.team",
  "intelligence.locations",
  "intelligence.layers",
  "referrals.new",
  "referrals.sent",
  "referrals.received",
  "referrals.starred",
];

const resourcesInput = Object.freeze({
  activeLens: "resources",
  viewerOrganizationId: "organization-viewer",
  selectedOrganizationId: "organization-viewer",
  selectedOrganizationIsOfficialResourceProvider: false,
  openPlatformActionsAuthorized: true,
  actionAuthorization: Object.freeze({
    rfxCreate: false,
    referralManage: false,
    resourceManage: false,
  }),
});

test("privileged Phase 2 actions fail closed without exact permission", () => {
  assert.match(source, /actionAuthorization\?\.rfxCreate \?\? false/);
  assert.match(source, /actionAuthorization\?\.referralManage \?\? false/);
  assert.match(source, /actionAuthorization\?\.resourceManage \?\? false/);
  assert.match(source, /id: "resources\.my-requests"[^\n]*authorization: "open-platform-referral-manage"/);
  assert.match(source, /id: "resources\.provider-status"[^\n]*authorization: "open-platform-resource-manage"/);
});

test("Resources discovery remains OPEN while private request and provider management retain stronger authority", () => {
  const actions = projectExchangeRoomActions(resourcesInput);
  assert.equal(actions.length, 4);
  assert.deepEqual(actions.map((action) => action.id), [
    "resources.find-providers",
    "resources.browse-resources",
    "resources.my-requests",
    "resources.provider-status",
  ]);

  const [findProviders, browseResources, myRequests, providerStatus] = actions;
  assert.equal(findProviders?.authorization, "open-platform");
  assert.equal(findProviders?.authorized, true);
  assert.equal(findProviders?.availability, "active");
  assert.equal(browseResources?.authorization, "open-platform");
  assert.equal(browseResources?.authorized, true);
  assert.equal(browseResources?.availability, "active");

  assert.equal(myRequests?.authorization, "open-platform-referral-manage");
  assert.equal(myRequests?.authorized, false);
  assert.equal(myRequests?.availability, "disabled");
  assert.equal(myRequests?.disabledReason, "not-authorized");

  assert.equal(providerStatus?.authorization, "open-platform-resource-manage");
  assert.equal(providerStatus?.applicable, true);
  assert.equal(providerStatus?.authorized, false);
  assert.equal(providerStatus?.availability, "disabled");
  assert.equal(providerStatus?.disabledReason, "not-authorized");
});

test("Resources management actions activate only with their own current server-derived permission", () => {
  const actions = projectExchangeRoomActions({
    ...resourcesInput,
    actionAuthorization: Object.freeze({
      rfxCreate: false,
      referralManage: true,
      resourceManage: true,
    }),
  });
  assert.equal(actions[2]?.availability, "active");
  assert.equal(actions[3]?.availability, "active");

  const externalSelection = projectExchangeRoomActions({
    ...resourcesInput,
    selectedOrganizationId: "organization-other",
    actionAuthorization: Object.freeze({
      rfxCreate: false,
      referralManage: true,
      resourceManage: true,
    }),
  });
  assert.equal(externalSelection[3]?.applicable, false);
  assert.equal(externalSelection[3]?.availability, "disabled");
  assert.equal(externalSelection[3]?.disabledReason, "not-applicable");
});

test("closed or restricted participants see every Resources action fail closed", () => {
  const actions = projectExchangeRoomActions({
    ...resourcesInput,
    openPlatformActionsAuthorized: false,
    actionAuthorization: Object.freeze({
      rfxCreate: true,
      referralManage: true,
      resourceManage: true,
    }),
  });
  for (const action of actions) {
    assert.equal(action.authorized, false, action.id);
    assert.equal(action.availability, "disabled", action.id);
    assert.equal(action.disabledReason, "not-authorized", action.id);
    assert.equal(action.resolvedHandler, null, action.id);
  }
});

test("Intelligence actions require Network discovery", () => {
  assert.match(source, /networkDiscoveryAvailable \?\? false/);
});

test("the eight ACTIVE-capable positions remain operational entries", () => {
  assert.equal(activeCapable.length, 8);
  for (const id of activeCapable) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(source, new RegExp(`id: "${escaped}"[^\\n]*operational: true`), id);
  }
});

test("the eight GRAY positions stay non-operational with no handler", () => {
  assert.equal(gray.length, 8);
  for (const id of gray) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(
      source,
      new RegExp(`id: "${escaped}"[^\\n]*operational: false[^\\n]*handler: null`),
      id,
    );
  }
});

test("New Referral remains individually disabled until an adapter opens the real composer", () => {
  assert.match(source, /id: "referrals\.new"[^\n]*operational: false[^\n]*handler: null/);
});
