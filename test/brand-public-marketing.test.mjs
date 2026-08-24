import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const home = await read("app/page.tsx");
const founding = await read("app/founding/page.tsx");
const availability = await read("src/components/marketing/MarketingAvailability.tsx");
const marketing = await read("src/content/marketing.ts");
const chrome = await read("src/components/marketing/MarketingChrome.tsx");
const assets = await read("src/content/public-assets.ts");
const englishCatalogText = await read("src/i18n/messages/en-US.json");
const marketingCatalogText = await read("src/i18n/messages/marketing-pages/en-US.json");
const englishCatalog = JSON.parse(englishCatalogText);
const marketingCatalog = JSON.parse(marketingCatalogText);

test("Brand B4 clearly distinguishes available and upcoming product state", () => {
  assert.match(marketing, /Available now/);
  assert.match(marketing, /Coming next/);
  assert.match(marketing, /More Exchange workflows/);
  assert.match(availability, /item\.kind === "live"/);
  assert.equal(
    marketingCatalog.availability.items.filter((item) => item.kind === "live").length,
    3,
  );
  assert.equal(
    marketingCatalog.availability.items.filter((item) => item.kind === "planned").length,
    1,
  );
  assert.match(marketingCatalog.home.hero.stockNote, /Images are illustrative/);
  assert.match(home, /<MarketingAvailability/);
  assert.match(founding, /<MarketingAvailability/);
});

test("Brand B4 preserves public acquisition and dedicated information routes", () => {
  const publicNavigation = `${home}\n${founding}\n${chrome}`;
  assert.match(publicNavigation, /href="\/join"/);
  assert.match(publicNavigation, /href="\/signin"/);
  assert.match(home, /href="#how-it-works"/);
  assert.match(chrome, /href="\/how-it-works"/);
  assert.match(home, /href="\/image-credits"/);
  assert.match(home, /href="\/founding"/);
  assert.match(founding, /href="#availability"/);
});

test("Brand B4 applies the parent endorsement", () => {
  assert.equal(englishCatalog.marketing.footer.byline, "By Accel Analysis");
  assert.equal(
    englishCatalog.marketing.footer.copyright,
    "© 2026 The RFxchange. By Accel Analysis.",
  );
  assert.match(chrome, /dictionary\.marketing\.footer\.byline/);
  assert.doesNotMatch(
    `${chrome}\n${englishCatalogText}\n${marketingCatalogText}`,
    /Hi-Coworking initiative/,
  );
});

test("Brand B4 public assets preserve provenance without turning diagnostics into customer copy", () => {
  assert.match(assets, /stockPhotographyIsProductEvidence: false/);
  assert.match(assets, /fabricatedScreensAllowed: false/);
  assert.match(assets, /fabricatedStatisticsAllowed: false/);
  assert.match(assets, /evidenceUse: "atmosphere-only"/);
  assert.doesNotMatch(marketingCatalogText, /governed|Wave 3|authoritative|Next governed pathway/i);
});
