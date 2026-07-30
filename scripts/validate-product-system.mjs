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
    throw new Error(`Missing or changed brand token ${token}: ${value}`);
  }
}

const home = (await read("app/page.tsx")).toLowerCase();
for (const cta of [">join<", ">see how it works<"]) {
  if (!home.includes(cta)) throw new Error(`Public positioning missing required CTA: ${cta}`);
}
if (!home.includes('href="#join"')) throw new Error("Join CTA must resolve to the public join surface.");
if (!home.includes('href="#how-it-works"')) throw new Error("See How It Works CTA must resolve to the public journey surface.");
if (!home.includes('publicdifferentiation.map')) {
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
if (!wordmark.includes("™")) throw new Error("Trademark mark must be present in the primary wordmark.");
if (wordmark.includes("®")) throw new Error("Registered mark may not be used until counsel approval is recorded.");

const network = await read("src/components/marketing/NetworkField.tsx");
if (!network.includes("#D6A23A")) throw new Error("Golden connection path language is missing.");

console.log("Wave 0 product-system validation passed, including ACQ-001 public positioning.");
