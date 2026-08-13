import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const expectedIds = [
  "opportunities.find", "opportunities.create-rfx", "opportunities.pursue-respond", "opportunities.team",
  "resources.find-providers", "resources.browse-resources", "resources.my-requests", "resources.provider-status",
  "intelligence.organizations", "intelligence.capabilities", "intelligence.locations", "intelligence.layers",
  "referrals.new", "referrals.sent", "referrals.received", "referrals.starred",
];

test("Phase 2 freezes exactly sixteen stable action identities", () => {
  const source = read("src/application/participant/exchange-room-actions.ts");
  for (const id of expectedIds) assert.match(source, new RegExp(`id: \\"${id.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\"`));
  assert.equal((source.match(/canonicalLabel:/g) ?? []).length, 16);
  assert.equal((source.match(/order: [1234],/g) ?? []).length, 16);
});

test("five governed locale catalogs cover the exact sixteen actions", () => {
  for (const locale of ["en-US", "es", "fr", "it", "de"]) {
    const catalog = JSON.parse(read(`src/i18n/messages/network/exchange-room-phase2/${locale}.json`));
    assert.deepEqual(Object.keys(catalog.actions), expectedIds, locale);
    assert.ok(catalog.actionsLabel.trim(), locale);
  }
});
