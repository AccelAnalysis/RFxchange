import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  EXCHANGE_ROOM_ACTION_IDS,
  EXCHANGE_ROOM_ACTION_REGISTRY,
  LEGACY_EXCHANGE_ROOM_ACTION_DISPOSITIONS,
  LEGACY_EXCHANGE_ROOM_ACTION_IDS,
} from "../src/application/participant/exchange-room-actions.ts";

const root = new URL("../", import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"));

const expected = [
  "opportunities.create-view", "opportunities.manage-respond", "opportunities.team", "opportunities.watch",
  "resources.offer-request", "resources.manage-view", "resources.share", "resources.save",
  "intelligence.add-view", "intelligence.edit-note", "intelligence.compare", "intelligence.track",
  "capabilities.manage-view", "capabilities.classify-match", "capabilities.evidence-refer", "capabilities.gaps-save",
];

test("Stages 3–6 emits exactly the immutable sixteen positions in final lens order", () => {
  assert.deepEqual([...EXCHANGE_ROOM_ACTION_IDS], expected);
  assert.deepEqual(EXCHANGE_ROOM_ACTION_REGISTRY.map(({ id }) => id), expected);
  assert.equal(new Set(EXCHANGE_ROOM_ACTION_IDS).size, 16);
  for (const [lensIndex, lens] of ["opportunities-rfx", "resources", "intelligence", "capabilities"].entries()) {
    const group = EXCHANGE_ROOM_ACTION_REGISTRY.slice(lensIndex * 4, lensIndex * 4 + 4);
    assert.deepEqual(group.map(({ lens: value }) => value), [lens, lens, lens, lens]);
    assert.deepEqual(group.map(({ order }) => order), [1, 2, 3, 4]);
  }
});

test("all sixteen predecessor IDs have an explicit successor disposition but are never emitted", () => {
  assert.equal(LEGACY_EXCHANGE_ROOM_ACTION_IDS.length, 16);
  assert.deepEqual(Object.keys(LEGACY_EXCHANGE_ROOM_ACTION_DISPOSITIONS), [...LEGACY_EXCHANGE_ROOM_ACTION_IDS]);
  for (const legacyId of LEGACY_EXCHANGE_ROOM_ACTION_IDS) {
    assert.ok(LEGACY_EXCHANGE_ROOM_ACTION_DISPOSITIONS[legacyId], legacyId);
    if (legacyId !== "opportunities.team") {
      assert.equal(EXCHANGE_ROOM_ACTION_IDS.includes(legacyId), false, legacyId);
    }
  }
});

test("five successor catalogs contain both governed contextual labels for every position", () => {
  const labelKeys = EXCHANGE_ROOM_ACTION_REGISTRY.flatMap(
    ({ labelKey, externalLabelKey }) => [labelKey, externalLabelKey],
  );
  assert.equal(new Set(labelKeys).size, 32);
  for (const locale of ["en-US", "es", "fr", "it", "de"]) {
    const catalog = readJson(`src/i18n/messages/network/mobile-exchange-stages36/${locale}.json`);
    assert.deepEqual(Object.keys(catalog.actions), labelKeys, locale);
    assert.ok(Object.values(catalog.actions).every((label) => typeof label === "string" && label.trim()), locale);
    assert.deepEqual(Object.keys(catalog.disabledReasons).sort(), ["not-applicable", "not-authorized", "not-operational"]);
  }
});
