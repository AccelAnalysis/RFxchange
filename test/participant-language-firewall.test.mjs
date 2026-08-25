import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";

import { rewriteParticipantText } from "../src/i18n/participant-language-firewall.ts";

const repoRoot = new URL("../", import.meta.url);

async function read(path) {
  return readFile(new URL(path, repoRoot), "utf8");
}

async function filesUnder(path) {
  const root = new URL(path, repoRoot);
  const output = [];

  async function walk(directory, relative) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
      const childRelative = `${relative}${entry.name}${entry.isDirectory() ? "/" : ""}`;
      if (entry.isDirectory()) await walk(child, childRelative);
      else output.push(childRelative);
    }
  }

  await walk(root, path);
  return output;
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

const multilingualSourcePatterns = [
  /\bgovern(?:ed|ance|ed workflow|ed release|ed lifecycle)\b/i,
  /\b(?:wave|slice)\s+\d+(?:\.\d+)?\b/i,
  /\b(?:source|build)\s+sha\b/i,
  /\bbuild identity\b/i,
  /\bcurrent release boundary\b/i,
  /\bapproved slices?\b/i,
  /\bacceptance tests?\b/i,
  /\bexact-head\b/i,
  /\bgobernad[ao]s?\b/i,
  /\bOla\s+\d+(?:\.\d+)?\b/i,
  /\bgouverné(?:e|es|s)?\b/i,
  /\bVague\s+\d+(?:\.\d+)?\b/i,
  /\bgovernat[oaie]\b/i,
  /\bOnda\s+\d+(?:\.\d+)?\b/i,
  /\bgeregelte[nmrs]?\b/i,
  /\bWelle\s+\d+(?:\.\d+)?\b/i,
];

function assertNoInternalParticipantLanguage(entries, patterns = prohibitedMarketingPatterns) {
  const violations = [];
  for (const entry of entries) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
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

test("all localized participant message sources are source-clean, not merely runtime-filtered", async () => {
  const messageFiles = (await filesUnder("src/i18n/messages/"))
    .filter((path) => path.endsWith(".json"));
  const directLocaleFiles = [
    "src/application/rfx/rfx-mobile-task-locale.ts",
  ];
  const entries = [];

  for (const path of messageFiles) {
    const value = JSON.parse(await read(path));
    entries.push(...collectStrings(value, path));
  }
  for (const path of directLocaleFiles) {
    entries.push({ path, value: await read(path) });
  }

  assertNoInternalParticipantLanguage(entries, multilingualSourcePatterns);
});

test("legacy internal strings are normalized before participant dictionaries render", async () => {
  const getDictionarySource = await read("src/i18n/get-dictionary.ts");

  assert.match(getDictionarySource, /return applyParticipantLanguageFirewall\(dictionaries\[locale\], locale\)/);
  assert.equal(rewriteParticipantText("Create a governed RFx draft"), "Create an RFx draft");
  assert.equal(rewriteParticipantText("Governed lifecycle"), "Status");
  assert.equal(rewriteParticipantText("Projection digest"), "Preview reference");
  assert.equal(rewriteParticipantText("Find real published opportunities"), "Find published opportunities");
  assert.equal(
    rewriteParticipantText("Publication is atomic and cannot be undone in this slice."),
    "Eligible organizations can publish an RFx. Publishing makes it available to responders and cannot currently be undone.",
  );
  assert.equal(
    rewriteParticipantText("Search saved with its current governed filters."),
    "Search saved with its current filters.",
  );

  assert.equal(rewriteParticipantText("Próxima vía gobernada", "es"), "Próximas funciones");
  assert.equal(rewriteParticipantText("La asistencia gobernada ayuda.", "es"), "La asistencia ayuda.");
  assert.equal(rewriteParticipantText("Prochaine voie gouvernée", "fr"), "Fonctionnalités à venir");
  assert.equal(rewriteParticipantText("L’assistance gouvernée aide.", "fr"), "L’assistance aide.");
  assert.equal(rewriteParticipantText("Prossimo percorso governato", "it"), "Funzionalità in arrivo");
  assert.equal(rewriteParticipantText("L'assistenza governata aiuta.", "it"), "L'assistenza aiuta.");
  assert.equal(rewriteParticipantText("Nächster geregelter Pfad", "de"), "Kommende Funktionen");
  assert.equal(rewriteParticipantText("Geregelte Unterstützung hilft.", "de"), "Unterstützung hilft.");
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
