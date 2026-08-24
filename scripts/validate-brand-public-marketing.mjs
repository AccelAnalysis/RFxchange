import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [
  home,
  founding,
  availability,
  marketing,
  chrome,
  assets,
  credits,
  homeStyles,
  foundingStyles,
  roadmap,
  baseEnglishCatalog,
  marketingEnglishCatalog,
] = await Promise.all([
  read("app/page.tsx"),
  read("app/founding/page.tsx"),
  read("src/components/marketing/MarketingAvailability.tsx"),
  read("src/content/marketing.ts"),
  read("src/components/marketing/MarketingChrome.tsx"),
  read("src/content/public-assets.ts"),
  read("app/image-credits/page.tsx"),
  read("app/home-b4.module.css"),
  read("app/founding/founding.module.css"),
  read("docs/brand/BRAND_IMPLEMENTATION_ROADMAP.md"),
  read("src/i18n/messages/en-US.json"),
  read("src/i18n/messages/marketing-pages/en-US.json"),
]);

const canonicalPublicSurface = [
  home,
  founding,
  availability,
  marketing,
  chrome,
  baseEnglishCatalog,
  marketingEnglishCatalog,
].join("\n");

for (const statement of [
  "Available now",
  "Coming next",
  "Use what is available today. More tools are on the way.",
  "Images are illustrative unless otherwise identified.",
  "AI can suggest. People confirm.",
  "Founding recognition does not imply",
]) {
  assert.ok(canonicalPublicSurface.includes(statement), `Required customer-facing statement is missing: ${statement}.`);
}

assert.ok(
  home.includes('href="/join"') &&
    home.includes('href="/signin"') &&
    home.includes('href="#how-it-works"') &&
    chrome.includes('href="/how-it-works"') &&
    home.includes('href="/image-credits"') &&
    founding.includes('href="#availability"'),
  "Public marketing must preserve activation, sign-in, process, provenance and availability routes.",
);

assert.ok(
  baseEnglishCatalog.includes("By Accel Analysis") &&
    baseEnglishCatalog.includes("© 2026 The RFxchange. By Accel Analysis.") &&
    !canonicalPublicSurface.includes("Hi-Coworking initiative"),
  "Public marketing must preserve the parent endorsement and remove the legacy initiative label.",
);

for (const policy of [
  "stockPhotographyIsProductEvidence: false",
  "fabricatedScreensAllowed: false",
  "fabricatedOrganizationsAllowed: false",
  "fabricatedStatisticsAllowed: false",
  "fabricatedTestimonialsAllowed: false",
  "finalCommercialLicenseReviewRequired: true",
]) {
  assert.ok(assets.includes(policy), `Public asset policy is missing ${policy}.`);
}
assert.ok(
  assets.includes('evidenceUse: "atmosphere-only"') &&
    credits.includes("publicImageAssetList.map"),
  "Public marketing must retain centralized image provenance.",
);

for (const prohibited of [
  "guaranteed leads",
  "guaranteed contracts",
  "live dashboard",
  "trusted businesses",
  "qualified routing",
  "A Hi-Coworking initiative",
  "Next governed pathway",
  "Wave 3 is complete",
  "governed assistance",
  "later governed work",
  "authoritative state",
  "controlled geography",
  "approved slices",
  "Bottom Matter",
]) {
  assert.equal(canonicalPublicSurface.toLowerCase().includes(prohibited.toLowerCase()), false, `Prohibited or internal public language remains: ${prohibited}.`);
}

assert.equal(home.includes("NetworkField"), false, "Public marketing cannot present a synthetic network graphic as live product evidence.");
assert.equal(home.includes("<video"), false, "Public marketing cannot introduce unapproved public video.");
assert.equal(home.includes("<audio"), false, "Public marketing cannot introduce autoplay or public audio.");
assert.ok(home.includes("<MarketingAvailability") && founding.includes("<MarketingAvailability"), "Both public pages must consume the shared availability source.");
assert.ok(availability.includes('item.kind === "live"'), "Shared availability must visually distinguish current and upcoming product state.");

const normalizedStyles = `${homeStyles}\n${foundingStyles}`.replace(/\s+/g, "").toLowerCase();
for (const styleRequirement of [
  "object-fit:cover",
  "@media(prefers-reduced-motion:reduce)",
  "@media(prefers-reduced-transparency:reduce)",
]) {
  assert.ok(normalizedStyles.includes(styleRequirement), `Public marketing sensory/responsive style is missing: ${styleRequirement}.`);
}
assert.ok(
  roadmap.includes("Brand Gate B4 — Public marketing and acquisition") &&
    roadmap.includes("no invented market evidence") &&
    roadmap.includes("acquisition context survives public-to-activation journeys"),
  "Public marketing must remain aligned with canonical Brand Gate B4 acceptance.",
);

console.log(
  "Public marketing validated: customer-language value proposition, clear availability, parent endorsement, image provenance, Founding conversion, acquisition routes, accessibility and sensory fallbacks.",
);
