import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const repoRoot = new URL("../", import.meta.url);

async function read(path) {
  return readFile(new URL(path, repoRoot), "utf8");
}

function collectStrings(value, path = "root", output = []) {
  if (typeof value === "string") {
    output.push({ path, value });
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStrings(item, `${path}[${index}]`, output));
    return output;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, child]) => collectStrings(child, `${path}.${key}`, output));
  }

  return output;
}

const prohibitedMarketingPatterns = [
  /\bgovern(?:ed|ance)\b/i,
  /\bauthoritative\b/i,
  /\bcontrolled geography\b/i,
  /\bimplementation(?:\s+(?:slice|runtime|authority|state|evidence))?\b/i,
  /\bacceptance tests?\b/i,
  /\bindependent acceptance\b/i,
  /\bverification debt\b/i,
  /\bowning domains?\b/i,
  /\bdomain authority\b/i,
  /\b(?:wave|slice)\s+\d+\b/i,
  /\brelease sequence\b/i,
  /\bexact-head\b/i,
  /\bsource sha\b/i,
  /\bbuild identity\b/i,
  /\bbottom matter\b/i,
  /\bapproved slices?\b/i,
  /\bcurrent release boundary\b/i,
  /\breal (?:organization|geography|map|marker|market activity)\b/i,
];

function assertNoInternalParticipantLanguage(entries) {
  const violations = [];
  for (const entry of entries) {
    for (const pattern of prohibitedMarketingPatterns) {
      if (pattern.test(entry.value)) {
        violations.push(`${entry.path}: ${JSON.stringify(entry.value)} matched ${pattern}`);
      }
    }
  }
  assert.deepEqual(violations, []);
}

test("canonical English public marketing stays behind the participant-language firewall", async () => {
  const [baseDictionary, marketingPages, marketingSource] = await Promise.all([
    read("src/i18n/messages/en-US.json").then(JSON.parse),
    read("src/i18n/messages/marketing-pages/en-US.json").then(JSON.parse),
    read("src/content/marketing.ts"),
  ]);

  const entries = [
    ...collectStrings(baseDictionary.marketing, "base.marketing"),
    ...collectStrings(marketingPages, "marketingPages"),
    { path: "src/content/marketing.ts", value: marketingSource },
  ];

  assertNoInternalParticipantLanguage(entries);
  assert.equal(baseDictionary.marketing.footer.bottomMatter, "Legal");
  assert.equal(marketingPages.availability.items.at(-1)?.status, "Coming next");
});

test("public and participant chrome do not render build or release-engineering diagnostics", async () => {
  const [chrome, profile] = await Promise.all([
    read("src/components/marketing/MarketingChrome.tsx"),
    read("app/organization-profile/page.tsx"),
  ]);

  for (const surface of [chrome, profile]) {
    for (const token of ["currentBuildIdentity", "commitSha", "shortSha", "RFXCHANGE_BUILD_SHA", "Build SHA", "Current release boundary", "approved slices"]) {
      assert.equal(surface.includes(token), false, `participant surface must not contain ${token}`);
    }
  }

  assert.doesNotMatch(chrome, />\s*SHA\s*\{/);
});

test("brand authority makes the participant-language firewall governing", async () => {
  const brandReadme = await read("docs/brand/README.md");
  const firewall = await read("docs/brand/PARTICIPANT_LANGUAGE_FIREWALL.md");

  assert.match(brandReadme, /PARTICIPANT_LANGUAGE_FIREWALL\.md/);
  assert.match(firewall, /Development governance is internal\. Product truth is external\./);
  assert.match(firewall, /must not be rendered in ordinary public or participant chrome/i);
});

test("completion governance forbids redundant implementation confirmation", async () => {
  const completion = await read("docs/program/FOUR_LENS_COMPLETION_GOVERNANCE_AMENDMENT.md");

  assert.match(completion, /explicit participant\/product-owner instruction to implement a bounded change is authorization/i);
  assert.match(completion, /Do not add a second generic `proceed\?`/i);
  assert.match(completion, /Routine copy changes, visual refinements, responsive fixes, navigation cleanup/i);
});
