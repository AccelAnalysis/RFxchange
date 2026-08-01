import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const expectedColors = {
  "--exchange-black": "#0b0b0d",
  "--rf-gold": "#d6a23a",
  "--warm-ivory": "#f7f3ea",
  "--graphite": "#252932",
  "--signal-blue": "#2e5eaa",
  "--growth-green": "#3b7b57",
};

const css = (await read("app/globals.css")).toLowerCase();
for (const [token, value] of Object.entries(expectedColors)) {
  if (!css.includes(`${token}: ${value}`)) {
    throw new Error(`BRD-003 missing or changed brand token ${token}: ${value}`);
  }
}

for (const typographyRequirement of [
  '--font-display: "aptos display", "aptos"',
  '--font-body: "aptos"',
  "font-family: var(--font-body)",
  "h1, h2, h3 { font-family: var(--font-display)",
  "h1 { font-size:",
  "h2 { font-size:",
  "h3 { font-size:",
]) {
  if (!css.includes(typographyRequirement)) {
    throw new Error(`BRD-005 typography hierarchy missing requirement: ${typographyRequirement}`);
  }
}

const home = (await read("app/page.tsx")).toLowerCase();
for (const cta of [">join the exchange — free<", ">see how it works<"]) {
  if (!home.includes(cta)) throw new Error(`Public positioning missing required CTA: ${cta}`);
}
if (!home.includes('href="/join"')) throw new Error("Join CTA must resolve to the production organization-activation surface.");
if (!home.includes('href="#how-it-works"')) throw new Error("See How It Works CTA must resolve to the public journey surface.");
if (!home.includes("publicdifferentiation.map")) {
  throw new Error("ACQ-001 requires the public differentiation model to render on the landing page.");
}

const marketing = await read("src/content/marketing.ts");
const marketingLower = marketing.toLowerCase();
for (const requirement of [
  "shared environment to be discovered by capability",
  "more than a directory",
  "not a social feed",
  "broader than a bid portal",
]) {
  if (!marketingLower.includes(requirement)) {
    throw new Error(`ACQ-001 public positioning missing requirement: ${requirement}`);
  }
}

const publicCopy = [
  await read("app/page.tsx"),
  marketing,
].join("\n").toLowerCase();

const prohibited = [
  "guaranteed leads",
  "guaranteed contracts",
  "we will create jobs",
  "one referral pays for membership",
  "replaces your crm",
  "the only platform you need",
];
for (const phrase of prohibited) {
  if (publicCopy.includes(phrase)) throw new Error(`Prohibited public claim found: ${phrase}`);
}

const wordmark = await read("src/components/brand/BrandWordmark.tsx");
for (const requirement of [
  '<span className="brand-rf">RF</span>',
  '<span className="brand-xchange">xchange</span>',
  '<sup className="brand-tm">™</sup>',
  "data-on-dark={onDark}",
]) {
  if (!wordmark.includes(requirement)) throw new Error(`BRD-001 wordmark missing requirement: ${requirement}`);
}
for (const styleRequirement of [
  ".brand-rf { color: var(--rf-gold)",
  ".brand-xchange { color: var(--exchange-black)",
  '.brand-wordmark[data-on-dark="true"] .brand-xchange',
  "color: var(--white)",
]) {
  if (!css.includes(styleRequirement.toLowerCase())) {
    throw new Error(`BRD-001 wordmark styling missing requirement: ${styleRequirement}`);
  }
}

const trademarkSurfaces = [wordmark, await read("app/page.tsx"), marketing].join("\n");
if (!wordmark.includes("™")) throw new Error("BRD-014 requires the trademark mark in the primary wordmark.");
if (trademarkSurfaces.includes("®")) {
  throw new Error("BRD-014 registered mark may not be used in product/public surfaces until counsel approval is recorded.");
}

const network = await read("src/components/marketing/NetworkField.tsx");
if (!network.includes("#D6A23A")) throw new Error("Golden connection path language is missing.");

await import("./validate-brand-semantic-foundation.mjs");
await import("./validate-brand-shared-primitives.mjs");
await import("./validate-brand-cartographic-convergence.mjs");

console.log("Wave 0 product-system validation passed, including ACQ-001 and core brand foundation BRD-001/003/005/014.");
