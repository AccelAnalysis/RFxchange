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

const publicCopy = [
  await read("app/page.tsx"),
  await read("src/content/marketing.ts"),
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

console.log("Wave 0 product-system validation passed.");
