import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { projectExchangeRoomActions } from "../src/application/participant/exchange-room-actions.ts";

const source = readFileSync(
  new URL("../src/application/participant/exchange-room-actions.ts", import.meta.url),
  "utf8",
);

const authorization = Object.freeze({
  rfxCreate: false,
  referralManage: false,
  resourceManage: false,
});

function input(activeLens, overrides = {}) {
  return Object.freeze({
    activeLens,
    viewerOrganizationId: "organization-viewer",
    selectedOrganizationId: "organization-viewer",
    selectedOrganizationIsOfficialResourceProvider: false,
    openPlatformActionsAuthorized: true,
    actionAuthorization: authorization,
    ...overrides,
  });
}

test("successor privileged actions fail closed without their exact permission", () => {
  assert.match(source, /actionAuthorization\?\.rfxCreate \?\? false/);
  assert.match(source, /actionAuthorization\?\.referralManage \?\? false/);
  assert.match(source, /actionAuthorization\?\.resourceManage \?\? false/);

  const actions = projectExchangeRoomActions(input("opportunities-rfx"));
  assert.deepEqual(actions.map(({ id }) => id), [
    "opportunities.create-view",
    "opportunities.manage-respond",
    "opportunities.team",
    "opportunities.watch",
  ]);
  assert.equal(actions[0].variant, "own");
  assert.equal(actions[0].authorized, false);
  assert.equal(actions[0].availability, "disabled");
  assert.equal(actions[0].disabledReason, "not-authorized");
  assert.equal(actions[0].resolvedHandler, null);
  assert.equal(actions[1].availability, "disabled");
  assert.equal(actions[1].disabledReason, "not-authorized");
});

test("current issuer and responder RFx workflows activate without inventing response persistence", () => {
  const own = projectExchangeRoomActions(input("opportunities-rfx", {
    actionAuthorization: { ...authorization, rfxCreate: true },
  }));
  assert.equal(own[0].labelKey, "opportunities.create-view.own");
  assert.deepEqual(own[0].resolvedHandler, { kind: "href", href: "/opportunities/manage" });
  assert.deepEqual(own[1].resolvedHandler, { kind: "href", href: "/opportunities/manage" });
  assert.equal(own[2].availability, "disabled");
  assert.equal(own[3].availability, "disabled");

  const external = projectExchangeRoomActions(input("opportunities-rfx", {
    selectedOrganizationId: "organization-other",
    currentOpportunityReference: "RFX 001",
  }));
  assert.equal(external[0].variant, "external");
  assert.equal(external[0].labelKey, "opportunities.create-view.external");
  assert.deepEqual(external[0].resolvedHandler, {
    kind: "href",
    href: "/opportunities/RFX%20001",
  });
  assert.deepEqual(external[1].resolvedHandler, {
    kind: "href",
    href: "/opportunities/RFX%20001/assess",
  });
  assert.deepEqual(external[2].resolvedHandler, {
    kind: "href",
    href: "/opportunities/RFX%20001/assess",
  });
  assert.equal(external[3].availability, "disabled");
});

test("Resources activates current offer edit view and authorized request entry while future share/save stay gray", () => {
  const own = projectExchangeRoomActions(input("resources", {
    actionAuthorization: { ...authorization, resourceManage: true },
  }));
  assert.equal(own.length, 4);
  assert.deepEqual(own[0].resolvedHandler, { kind: "href", href: "/resources?manage=offer" });
  assert.deepEqual(own[1].resolvedHandler, { kind: "href", href: "/resources?manage=edit" });
  assert.equal(own[2].availability, "disabled");
  assert.equal(own[3].availability, "disabled");

  const external = projectExchangeRoomActions(input("resources", {
    selectedOrganizationId: "organization-provider",
    selectedOrganizationIsOfficialResourceProvider: true,
    actionAuthorization: { ...authorization, referralManage: true },
  }));
  assert.equal(external[0].labelKey, "resources.offer-request.external");
  assert.deepEqual(external[0].resolvedHandler, {
    kind: "href",
    href: "/resources?organization=organization-provider&provider=organization-provider",
  });
  assert.equal(external[1].id, "resources.manage-view");
  assert.equal(external[1].labelKey, "resources.manage-view.external");
  assert.deepEqual(external[1].resolvedHandler, {
    kind: "href",
    href: "/resources?organization=organization-provider&provider=organization-provider",
  });
});

test("external Resource request remains permission-bound even when provider detail is viewable", () => {
  const external = projectExchangeRoomActions(input("resources", {
    selectedOrganizationId: "organization-provider",
    selectedOrganizationIsOfficialResourceProvider: true,
  }));
  assert.equal(external[0].authorized, false);
  assert.equal(external[0].availability, "disabled");
  assert.equal(external[0].disabledReason, "not-authorized");
  assert.equal(external[1].availability, "active");
});

test("closed or restricted participants cannot activate a successor action", () => {
  const actions = projectExchangeRoomActions(input("resources", {
    selectedOrganizationId: "organization-provider",
    selectedOrganizationIsOfficialResourceProvider: true,
    openPlatformActionsAuthorized: false,
    actionAuthorization: { rfxCreate: true, referralManage: true, resourceManage: true },
  }));
  for (const operational of actions.slice(0, 2)) {
    assert.equal(operational.authorized, false);
    assert.equal(operational.availability, "disabled");
    assert.equal(operational.disabledReason, "not-authorized");
    assert.equal(operational.resolvedHandler, null);
  }
});

test("Capabilities exposes four governed positions without referral handlers or fabricated composition", () => {
  const actions = projectExchangeRoomActions(input("capabilities", {
    selectedOrganizationId: "organization-other",
    actionAuthorization: { rfxCreate: true, referralManage: true, resourceManage: true },
  }));
  assert.deepEqual(actions.map(({ id }) => id), [
    "capabilities.manage-view",
    "capabilities.classify-match",
    "capabilities.evidence-refer",
    "capabilities.gaps-save",
  ]);
  assert.ok(actions.every((action) => action.availability === "disabled"));
  assert.ok(actions.every((action) => action.resolvedHandler === null));
  assert.ok(actions.every((action) => !action.id.startsWith("referrals.")));
});
