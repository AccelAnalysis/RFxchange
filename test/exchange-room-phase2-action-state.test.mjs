import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = new URL("../", import.meta.url);

function project(activeLens, selectedOrganizationId, openPlatformActionsAuthorized) {
  const source = `
    import { projectExchangeRoomActions } from "./src/application/participant/exchange-room-actions.ts";
    console.log(JSON.stringify(projectExchangeRoomActions({
      activeLens: ${JSON.stringify(activeLens)},
      viewerOrganizationId: "org-self",
      selectedOrganizationId: ${JSON.stringify(selectedOrganizationId)},
      selectedOrganizationIsOfficialResourceProvider: true,
      openPlatformActionsAuthorized: ${JSON.stringify(openPlatformActionsAuthorized)}
    })));
  `;
  const result = spawnSync(process.execPath, [
    "--experimental-transform-types",
    "--experimental-loader", "./scripts/node-typescript-source-loader.mjs",
    "--input-type=module", "--eval", source,
  ], { cwd: new URL(".", root), encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return new Map(JSON.parse(result.stdout.trim().split("\n").at(-1)).map((action) => [action.id, action]));
}

test("disabled reasons distinguish missing function, wrong context and current authority", () => {
  const openSelf = project("opportunities-rfx", "org-self", true);
  assert.equal(openSelf.get("opportunities.find").availability, "active");
  assert.equal(openSelf.get("opportunities.create-rfx").resolvedHandler.href, "/opportunities/manage");
  assert.equal(openSelf.get("opportunities.pursue-respond").disabledReason, "not-applicable");
  assert.equal(openSelf.get("opportunities.team").disabledReason, "not-operational");

  const openExternal = project("opportunities-rfx", "org-other", true);
  assert.equal(openExternal.get("opportunities.create-rfx").disabledReason, "not-applicable");
  assert.equal(openExternal.get("opportunities.create-rfx").resolvedHandler, null);

  const controlled = project("opportunities-rfx", "org-self", false);
  assert.equal(controlled.get("opportunities.find").disabledReason, "not-authorized");
  assert.equal(controlled.get("opportunities.find").resolvedHandler, null);
});

test("Intelligence remains usable in the Room while unfinished intelligence functions stay individual", () => {
  const actions = project("intelligence", "org-self", false);
  assert.equal(actions.size, 4);
  assert.equal(actions.get("intelligence.organizations").availability, "active");
  assert.equal(actions.get("intelligence.capabilities").availability, "active");
  assert.equal(actions.get("intelligence.locations").disabledReason, "not-operational");
  assert.equal(actions.get("intelligence.layers").disabledReason, "not-operational");
});
