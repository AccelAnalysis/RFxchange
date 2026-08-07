import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const home = await read("app/page.tsx");
const marketing = await read("src/content/marketing.ts");
const chrome = await read("src/components/marketing/MarketingChrome.tsx");
const assets = await read("src/content/public-assets.ts");
const englishCatalogText = await read("src/i18n/messages/en-US.json");
const englishCatalog = JSON.parse(englishCatalogText);

test("Brand B4 clearly distinguishes current and future product state", () => {
  assert.match(marketing, /Available now/);
  assert.match(marketing, /In development/);
  assert.match(marketing, /Planned product pathway/);
  assert.equal(
    englishCatalog.home.model.label,
    "Planned product model · not live market activity",
  );
  assert.match(
    englishCatalog.home.hero.evidenceNote,
    /Stock photography supplies atmosphere only/,
  );
  assert.match(home, /home\.model\.label/);
  assert.match(home, /home\.hero\.evidenceNote/);
});

test("Brand B4 preserves public acquisition and dedicated information routes", () => {
  assert.match(home, /href="\/join"/);
  assert.match(home, /href="\/signin"/);
  assert.match(home, /href="#how-it-works"/);
  assert.match(home, /href="\/how-it-works"/);
  assert.match(home, /href="\/image-credits"/);
});

test("Brand B4 applies the governed parent endorsement", () => {
  assert.equal(englishCatalog.marketing.footer.byline, "By Accel Analysis");
  assert.equal(
    englishCatalog.marketing.footer.copyright,
    "© 2026 The RFxchange. By Accel Analysis.",
  );
  assert.match(chrome, /dictionary\.marketing\.footer\.byline/);
  assert.doesNotMatch(`${chrome}\n${englishCatalogText}`, /Hi-Coworking initiative/);
});

test("Brand B4 public assets are provenance-governed and never product evidence", () => {
  assert.match(assets, /stockPhotographyIsProductEvidence: false/);
  assert.match(assets, /fabricatedScreensAllowed: false/);
  assert.match(assets, /fabricatedStatisticsAllowed: false/);
  assert.match(assets, /evidenceUse: "atmosphere-only"/);
});
