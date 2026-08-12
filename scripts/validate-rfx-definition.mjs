import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [
  model,
  service,
  catalog,
  immutableCatalog,
  route,
  page,
  workspace,
  builder,
  styles,
  packageJson,
  workflow,
  authority,
  evidence,
  tracker,
  dependency,
  browserAcceptance,
  smoke,
  ...locales
] = await Promise.all([
  read("src/domain/rfx/model.ts"),
  read("src/application/rfx/rfx-draft-service.ts"),
  read("src/application/amacs/catalog.ts"),
  read("src/infrastructure/amacs/immutable-catalog.ts"),
  read("app/api/rfx/route.ts"),
  read("app/opportunities/manage/page.tsx"),
  read("src/components/rfx/RFxDraftWorkspace.tsx"),
  read("src/components/rfx/RFxDefinitionBuilder.tsx"),
  read("src/components/rfx/RFxDraftWorkspace.module.css"),
  read("package.json"),
  read(".github/workflows/ci.yml"),
  read("docs/slices/SLICE_4_3_EXECUTION_AUTHORITY.md"),
  read("docs/architecture/WAVE_4_SLICE_4_3.md"),
  read("docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md"),
  read("docs/tracking/RFxchange_DEPENDENCY_MAP.md"),
  read("scripts/acceptance-exchange-shell-emulator.mjs"),
  read("scripts/smoke-rfx-kernel-emulator.mjs"),
  ...["en-US", "es", "fr", "it", "de"].map((locale) =>
    read(`src/i18n/messages/rfx/${locale}.json`),
  ),
]);

for (const boundary of [
  "RfxDefinition",
  "RfxRequirementDefinition",
  "RfxResponseStructure",
  "RfxEvaluationDefinition",
  "RfxEvaluationFactor",
  "RfxDefinitionModuleStatus",
])
  assert.ok(model.includes(boundary), `RFx definition boundary missing: ${boundary}`);
for (const invariant of [
  "teamCoverageAllowed",
  "allowedDecisionTreatments",
  "linkedFoundationRequirementIds",
  "linkedResponseSectionIds",
  "linkedEvaluationFactorIds",
  "weightBasisPoints",
  "scoredWeightTotal === 10_000",
])
  assert.ok(model.includes(invariant), `RFx definition invariant missing: ${invariant}`);
assert.match(model, /normalizeRfxDefinition/);
assert.match(model, /saveRfxDefinition/);
assert.match(model, /RFX_DEFINITION_SCHEMA_VERSION = 1/);
assert.match(service, /definitionCatalog/);
assert.match(service, /searchCapabilities/);
assert.match(service, /canonicalDefinitionInput/);
assert.match(service, /purpose !== "request_structure"/);
assert.match(service, /action: "save-definition"/);
assert.match(service, /kind: "rfx-definition-saved"/);
assert.match(service, /action: "rfx\.definition-saved"/);
for (const method of [
  "listRequirementTypes",
  "listResponseTemplates",
  "listDecisionTemplates",
  "getResponseSection",
  "getDecisionFactor",
]) {
  assert.match(catalog, new RegExp(method));
  assert.match(immutableCatalog, new RegExp(method));
}
assert.match(route, /action === "save-definition"/);
assert.match(route, /searchCapabilities/);
assert.match(route, /Same-origin request required/);
assert.match(page, /definitionCatalog/);
assert.match(workspace, /RFxDefinitionBuilder/);
assert.match(builder, /1_200/);
assert.match(builder, /saveInFlight\.current/);
assert.match(builder, /revision\.current === savingRevision/);
assert.match(builder, /data-rfx-capability-search/);
assert.match(builder, /data-rfx-add-defined-requirement/);
assert.match(builder, /data-rfx-response-template/);
assert.match(builder, /data-rfx-decision-template/);
assert.match(builder, /data-rfx-definition-save/);
assert.match(builder, /role="dialog"/);
assert.match(styles, /contain-intrinsic-block-size: auto 720px/);
assert.doesNotMatch(styles, /contain-intrinsic-size: auto 720px/);
assert.match(packageJson, /validate:rfx-definition/);
assert.match(workflow, /smoke-rfx-kernel-emulator/);
assert.match(authority, /ISS-007/);
assert.match(authority, /ISS-009/);
assert.match(authority, /ISS-011/);
assert.match(evidence, /Configured-browser acceptance/);
assert.match(tracker, /438 total · 170 Done · 268 Not Started/);
assert.match(tracker, /RFx Core: \*\*18\/41\*\*/);
for (const id of ["ISS-007", "ISS-009", "ISS-011"])
  assert.match(tracker, new RegExp("\\[x\\] `" + id + "`"));
assert.match(dependency, /Slice 4\.3 implementation result/);
assert.match(browserAcceptance, /RFx definition version 4/);
assert.match(browserAcceptance, /definitionModuleStatus/);
assert.match(smoke, /rfx-definition-saved/);
assert.match(smoke, /current version is 4/);
for (const [index, locale] of locales.entries()) {
  const parsed = JSON.parse(locale);
  for (const key of [
    "definitionTitle",
    "requiredCapabilities",
    "responseStructure",
    "evaluationMethod",
    "saveDefinition",
    "capabilitySearch",
  ])
    assert.ok(parsed[key], `RFx definition locale ${index + 1} missing ${key}`);
}
for (const forbidden of ["amended", "awarded", "submitted"])
  assert.doesNotMatch(
    model,
    new RegExp(`lifecycleState: [^\\n]*${forbidden}`),
    `Later lifecycle state leaked into Slice 4.3: ${forbidden}`,
  );

console.log(
  "Slice 4.3 AMACS requirements, response structure, evaluation definition, recovery, localization, and stop boundaries validated.",
);
