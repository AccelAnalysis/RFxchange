import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const read = (path) => readFile(resolve(root, path), "utf8");

const [tokens, semanticCss, layout, globals, brandSystem, roadmap] = await Promise.all([
  read("src/design/tokens.ts"),
  read("src/design/semantic-tokens.css"),
  read("app/layout.tsx"),
  read("app/globals.css"),
  read("docs/brand/RFXCHANGE_BRAND_EXPERIENCE_SYSTEM.md"),
  read("docs/brand/BRAND_IMPLEMENTATION_ROADMAP.md"),
]);

const approvedPalette = Object.freeze({
  exchangeBlack: "#0B0B0D",
  warmIvory: "#F7F3EA",
  graphite: "#252932",
  rfGold: "#D6A23A",
  accessibleDarkGold: "#8A6418",
  signalBlue: "#2E5EAA",
  growthGreen: "#3B7B57",
});

for (const [name, value] of Object.entries(approvedPalette)) {
  assert.ok(
    tokens.includes(`${name}: "${value}"`),
    `Brand B1 must preserve approved ${name} as ${value}.`,
  );
  assert.ok(
    semanticCss.toLowerCase().includes(value.toLowerCase()),
    `Brand B1 CSS contract must preserve approved ${name} as ${value}.`,
  );
}

for (const required of [
  "semanticColorModes",
  "exchangeLight",
  "defaultSemanticColorMode",
  "spacing",
  "radii",
  "elevation",
  "borders",
  "focus",
  "typographyRoles",
  "motionDurations",
  "motionEasing",
  "objectSemanticTokens",
  "semanticTokenPolicy",
]) {
  assert.ok(tokens.includes(required), `Brand B1 token foundation is missing ${required}.`);
}

for (const objectRole of [
  "node",
  "beacon",
  "field",
  "path",
  "seal",
  "locality",
  "organization",
  "opportunity",
  "serviceTerritory",
  "connection",
  "outcome",
  "evidence",
]) {
  assert.ok(tokens.includes(objectRole), `Brand B1 object semantics are missing ${objectRole}.`);
}

for (const cssRole of [
  "--semantic-canvas",
  "--semantic-text-primary",
  "--semantic-text-connection-small",
  "--semantic-action-selected-background",
  "--semantic-state-positive-resolution",
  "--space-md",
  "--radius-panel",
  "--elevation-overlay",
  "--focus-outline-width",
  "--type-interface-family",
  "--motion-panel",
  "--ease-spatial",
  "--object-node-organization-fill",
  "--object-beacon-opportunity-fill",
  "--object-field-service-outline",
  "--object-path-connection",
  "--object-path-outcome",
  "--object-seal-evidence-structure",
  "--object-locality-restricted",
]) {
  assert.ok(semanticCss.includes(cssRole), `Brand B1 CSS contract is missing ${cssRole}.`);
}

assert.ok(
  layout.includes('import "../src/design/semantic-tokens.css";') &&
    layout.indexOf("semantic-tokens.css") < layout.indexOf("./globals.css"),
  "Brand B1 semantic variables must load before legacy global compatibility styles.",
);

for (const [legacyName, value] of Object.entries({
  "--exchange-black": "#0b0b0d",
  "--rf-gold": "#d6a23a",
  "--warm-ivory": "#f7f3ea",
  "--graphite": "#252932",
  "--signal-blue": "#2e5eaa",
  "--growth-green": "#3b7b57",
})) {
  assert.ok(
    globals.toLowerCase().includes(`${legacyName}: ${value}`),
    `Brand B1 must retain legacy raw-token compatibility for ${legacyName}.`,
  );
}

function rgb(hex) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16) / 255);
}

function luminance(hex) {
  const channels = rgb(hex).map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

assert.ok(
  contrast(approvedPalette.accessibleDarkGold, approvedPalette.warmIvory) >= 4.5,
  "Accessible Dark Gold must meet WCAG AA normal-text contrast on Warm Ivory.",
);
assert.ok(
  contrast(approvedPalette.rfGold, approvedPalette.warmIvory) < 4.5,
  "RF Gold must not be mistaken for the approved small-text gold on Warm Ivory.",
);
assert.ok(
  tokens.includes("connectionSmall: brandPalette.accessibleDarkGold") &&
    semanticCss.includes("--semantic-text-connection-small: var(--brand-accessible-dark-gold)"),
  "Small gold-family text must resolve through Accessible Dark Gold.",
);

assert.ok(
  tokens.includes('display: \'"Aptos Display", "Aptos"') &&
    tokens.includes('interface: \'"Aptos", "Segoe UI"'),
  "Brand B1 must preserve Aptos/system-safe typography roles.",
);
assert.equal(tokens.includes("@font-face"), false, "Brand B1 cannot bundle or declare a font face.");
assert.equal(semanticCss.includes("@font-face"), false, "Brand B1 cannot bundle or declare a font face.");
assert.equal(
  semanticCss.includes("prefers-color-scheme: dark") || semanticCss.includes("data-theme=\"dark\""),
  false,
  "Brand B1 cannot implement the separately governed Intelligence Dark capability.",
);

assert.ok(
  tokens.includes("domainObjectTokensAuthorizeRuntimeObjects: false") &&
    brandSystem.includes("Nodes are participants. Beacons are demand. Paths are interactions. Fields are geography or service coverage. Seals are evidence."),
  "Object semantic tokens must preserve the proprietary grammar without authorizing runtime objects.",
);
assert.ok(
  roadmap.includes("Brand Gate B1 — Semantic design foundation — COMPLETE IN PR #109") &&
    roadmap.includes("Brand Gate B2 — Shared component primitives — NEXT; EXPLICIT AUTHORIZATION REQUIRED") &&
    roadmap.includes("no broad visual change"),
  "Completed Brand B1 authority and the B2 handoff must remain explicit in the canonical roadmap.",
);

const governedPrimitiveDirectories = [
  "src/components/brand",
  "src/components/participant",
  "src/components/ui",
];
const codeExtensions = new Set([".css", ".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const rawApprovedPattern = /#(?:0b0b0d|f7f3ea|252932|d6a23a|8a6418|2e5eaa|3b7b57)\b/gi;

async function walk(relativeDirectory, allowedExtensions = null) {
  const absoluteDirectory = resolve(root, relativeDirectory);
  let entries;
  try {
    entries = await readdir(absoluteDirectory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  const paths = [];
  for (const entry of entries) {
    const relativePath = join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      paths.push(...await walk(relativePath, allowedExtensions));
    } else if (allowedExtensions === null || allowedExtensions.has(extname(entry.name))) {
      paths.push(relativePath);
    }
  }
  return paths;
}

for (const directory of governedPrimitiveDirectories) {
  for (const path of await walk(directory, codeExtensions)) {
    const source = await read(path);
    const rawColors = source.match(rawApprovedPattern) ?? [];
    assert.equal(
      rawColors.length,
      0,
      `${path} contains approved raw brand colors; shared primitives must consume semantic or compatibility variables.`,
    );
  }
}

for (const directory of ["app", "src", "public"]) {
  for (const path of await walk(directory)) {
    assert.equal(
      /\.(?:woff2?|ttf|otf|eot)$/i.test(path),
      false,
      `Brand B1 cannot add unlicensed font asset ${path}.`,
    );
  }
}

console.log(
  "Brand Gate B1 semantic foundation validated: exact palette, accessible gold text, Exchange Light roles, compatibility aliases, object semantics, motion/type/layout tokens, drift controls, and completed B2 handoff authority.",
);
