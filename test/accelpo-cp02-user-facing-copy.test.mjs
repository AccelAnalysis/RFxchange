import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("AccelPO user-facing surfaces stay task-first and do not expose implementation language", async () => {
  const app = await read("apps/accelpo/app.js");
  const organizationSurfaces = await read("apps/accelpo/src/organization-settings/surfaces.js");
  const renderedSources = `${app}\n${organizationSurfaces}`;

  const forbidden = [
    /This preview is ready for the next connected step/i,
    /Preview workspace/i,
    /shared organization profile/i,
    /profile authority/i,
    /duplicate organization record/i,
    /Current safe projections/i,
    /role-safe organization projection/i,
    /trusted command definitions/i,
    /P2 server command/i,
    /CP-03/i,
    /shared commercial record/i,
    /entitlement version/i,
    /Entitlement-backed/i,
    /production values remain/i,
    /does not impose universal dollar thresholds/i,
    /billing handoff ready/i,
    /payment processing/i,
  ];

  for (const pattern of forbidden) {
    assert.doesNotMatch(renderedSources, pattern, `user-facing copy must not contain ${pattern}`);
  }

  assert.match(app, /Not available yet\./);
  assert.match(organizationSurfaces, /Owner uses 1 seat\. Pending invites reserve 1 seat\./);
  assert.match(organizationSurfaces, /Set purchasing rules\./);
});

test("preview data uses user-realistic labels instead of implementation labels", async () => {
  const runtime = await read("apps/accelpo/src/organization-settings/runtime.js");

  assert.match(runtime, /plan: Object\.freeze\(\{ name: "Growth"/);
  assert.doesNotMatch(runtime, /name: "Preview plan"/);
});
