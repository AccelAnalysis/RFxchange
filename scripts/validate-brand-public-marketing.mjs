import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [home, marketing, chrome, assets, credits, styles, roadmap] = await Promise.all([
  read("app/page.tsx"),
  read("src/content/marketing.ts"),
  read("src/components/marketing/MarketingChrome.tsx"),
  read("src/content/public-assets.ts"),
  read("app/image-credits/page.tsx"),
  read("app/home-b4.module.css"),
  read("docs/brand/BRAND_IMPLEMENTATION_ROADMAP.md"),
]);

for (const statement of [
  "Available now",
  "In development",
  "Planned product pathway",
  "Planned product model · not live market activity",
  "Stock photography supplies atmosphere only",
  "Real evidence—or a clear label",
]) {
  assert.ok(`${home}\n${marketing}`.includes(statement), `Brand B4 availability/evidence statement is missing: ${statement}.`);
}

assert.ok(
  home.includes('href="/join"') &&
    home.includes('href="/signin"') &&
    home.includes('href="#how-it-works"') &&
    home.includes('href="/how-it-works"') &&
    home.includes('href="/image-credits"'),
  "Brand B4 must preserve acquisition entry and dedicated process/provenance routes.",
);

assert.ok(
  chrome.includes("By Accel Analysis") &&
    chrome.includes("© 2026 The RFxchange. By Accel Analysis.") &&
    !chrome.includes("Hi-Coworking initiative"),
  "Brand B4 must use the governed parent endorsement and remove the legacy initiative label.",
);

for (const policy of [
  "stockPhotographyIsProductEvidence: false",
  "fabricatedScreensAllowed: false",
  "fabricatedOrganizationsAllowed: false",
  "fabricatedStatisticsAllowed: false",
  "fabricatedTestimonialsAllowed: false",
  "finalCommercialLicenseReviewRequired: true",
]) {
  assert.ok(assets.includes(policy), `Brand B4 asset policy is missing ${policy}.`);
}
assert.ok(
  assets.includes('evidenceUse: "atmosphere-only"') &&
    credits.includes("publicImageAssetList.map") &&
    credits.includes("atmosphere only—not product evidence"),
  "Brand B4 must centralize and display public-image provenance and evidence use.",
);

for (const prohibited of [
  "guaranteed leads",
  "guaranteed contracts",
  "live dashboard",
  "trusted businesses",
  "qualified routing",
  "A Hi-Coworking initiative",
]) {
  assert.equal(`${home}\n${marketing}\n${chrome}`.toLowerCase().includes(prohibited.toLowerCase()), false, `Brand B4 prohibited or unsupported claim remains: ${prohibited}.`);
}

assert.equal(home.includes("NetworkField"), false, "Brand B4 cannot present a synthetic network graphic as live product evidence.");
assert.equal(home.includes("<video"), false, "Brand B4 cannot introduce ungoverned public video in this gate.");
assert.equal(home.includes("<audio"), false, "Brand B4 cannot introduce autoplay or public audio.");

assert.ok(
  styles.includes("object-fit: cover") &&
    styles.includes("@media (prefers-reduced-motion: reduce)") &&
    styles.includes("@media (prefers-reduced-transparency: reduce)"),
  "Brand B4 must include responsive full-bleed media and sensory fallbacks.",
);
assert.ok(
  roadmap.includes("Brand Gate B4 — Public marketing and acquisition") &&
    roadmap.includes("no invented market evidence") &&
    roadmap.includes("acquisition context survives public-to-activation journeys"),
  "Brand B4 must remain aligned with canonical acceptance.",
);

console.log(
  "Brand Gate B4 public marketing validated: governed parent endorsement, truthful current/planned availability, real-image provenance, evidence-only claims, dedicated routes, acquisition entry, accessibility and sensory fallbacks.",
);
