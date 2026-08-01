import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const home = await read("app/page.tsx");
const marketing = await read("src/content/marketing.ts");
const chrome = await read("src/components/marketing/MarketingChrome.tsx");
const assets = await read("src/content/public-assets.ts");

test("Brand B4 clearly distinguishes current and future product state", () => {
  assert.match(marketing, /Available now/);
  assert.match(marketing, /In development/);
  assert.match(marketing, /Planned product pathway/);
  assert.match(home, /Planned product model · not live market activity/);
  assert.match(home, /Stock photography supplies atmosphere only/);
});

test("Brand B4 preserves public acquisition and dedicated information routes", () => {
  assert.match(home, /href="\/join"/);
  assert.match(home, /href="\/signin"/);
  assert.match(home, /href="#how-it-works"/);
  assert.match(home, /href="\/how-it-works"/);
  assert.match(home, /href="\/image-credits"/);
});

test("Brand B4 applies the governed parent endorsement", () => {
  assert.match(chrome, /By Accel Analysis/);
  assert.doesNotMatch(chrome, /Hi-Coworking initiative/);
});

test("Brand B4 public assets are provenance-governed and never product evidence", () => {
  assert.match(assets, /stockPhotographyIsProductEvidence: false/);
  assert.match(assets, /fabricatedScreensAllowed: false/);
  assert.match(assets, /fabricatedStatisticsAllowed: false/);
  assert.match(assets, /evidenceUse: "atmosphere-only"/);
});
