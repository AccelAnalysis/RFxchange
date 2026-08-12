import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [
  model,
  service,
  runtime,
  route,
  page,
  workspace,
  builder,
  styles,
  rules,
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
  read("src/infrastructure/rfx/runtime.ts"),
  read("app/api/rfx/route.ts"),
  read("app/opportunities/manage/page.tsx"),
  read("src/components/rfx/RFxDraftWorkspace.tsx"),
  read("src/components/rfx/RFxPackageBuilder.tsx"),
  read("src/components/rfx/RFxDraftWorkspace.module.css"),
  read("firestore.rules"),
  read("package.json"),
  read(".github/workflows/ci.yml"),
  read("docs/slices/SLICE_4_2_EXECUTION_AUTHORITY.md"),
  read("docs/architecture/WAVE_4_SLICE_4_2.md"),
  read("docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md"),
  read("docs/tracking/RFxchange_DEPENDENCY_MAP.md"),
  read("scripts/acceptance-exchange-shell-emulator.mjs"),
  read("scripts/smoke-rfx-kernel-emulator.mjs"),
  ...["en-US", "es", "fr", "it", "de"].map((locale) =>
    read(`src/i18n/messages/rfx/${locale}.json`),
  ),
]);

for (const boundary of [
  "RfxPackage",
  "MarketNeed",
  "RequestedOutput",
  "RfxTiming",
  "PerformanceLocation",
  "EstimatedValue",
  "EngagementTerm",
  "RfxFoundationRequirement",
  "RfxPackageModuleStatus",
])
  assert.ok(
    model.includes(boundary),
    `RFx package boundary missing: ${boundary}`,
  );
for (const variant of [
  "solution-open",
  "outcome-constrained",
  "approach-constrained",
  "specified-solution",
  "issuer-primary-location",
  "organization-location",
  "exact-address",
  "locality",
  "multiple",
  "not-disclosed",
  "fixed-with-options",
  "milestone-based",
])
  assert.ok(model.includes(variant), `RFx package variant missing: ${variant}`);
assert.match(model, /normalizeRfxPackage/);
assert.match(model, /saveRfxPackage/);
assert.match(model, /moduleStatus/);
assert.match(model, /amountMinor/);
assert.match(model, /RFX_PACKAGE_SCHEMA_VERSION = 1/);
assert.match(service, /permission: "rfx\.create"/);
assert.match(service, /locations\.getByOrganizationId/);
assert.match(service, /geographies\.getById/);
assert.match(service, /interpretations\.getRecord/);
assert.match(service, /"partially_confirmed", "confirmed"/);
assert.match(service, /action: "save-package"/);
assert.match(service, /kind: "rfx-package-saved"/);
assert.match(service, /action: "rfx\.package-saved"/);
assert.match(runtime, /createFirestoreOrganizationLocationRepositories/);
assert.match(runtime, /createFirestoreGeographyRepositories/);
assert.match(runtime, /FirestoreAiInterpretationRepository/);
assert.match(route, /action === "save-package"/);
assert.match(route, /Same-origin request required/);
assert.match(page, /performanceLocationOption/);
assert.match(workspace, /RFxPackageBuilder/);
assert.match(builder, /1_200/);
assert.match(builder, /formRevision\.current === savingRevision/);
assert.match(builder, /data-rfx-package-save/);
assert.match(builder, /\/api\/ai\/amacs\/interpret/);
assert.match(builder, /buyer_need_definition/);
assert.match(builder, /\/api\/ai\/amacs\/disposition/);
assert.match(builder, /interpretUnavailable/);
assert.match(styles, /content-visibility: auto/);
assert.match(styles, /contain-intrinsic-block-size: auto 620px/);
assert.doesNotMatch(styles, /contain-intrinsic-size: auto 620px/);
assert.match(styles, /max-width: 620px/);
for (const collection of [
  "rfxAggregates",
  "rfxEvents",
  "rfxCommands",
  "organizationAuditEvents",
  "aiInterpretationRecords",
  "aiInterpretationCandidates",
])
  assert.match(rules, new RegExp(`/${collection}/`));
assert.match(packageJson, /validate:rfx-package/);
assert.match(packageJson, /smoke:rfx-kernel/);
assert.match(workflow, /smoke-rfx-kernel-emulator/);
assert.match(authority, /ISS-005/);
assert.match(authority, /ISS-006/);
assert.match(evidence, /Configured-browser acceptance/);
assert.match(tracker, /438 total · 175 Done · 263 Not Started/);
assert.match(tracker, /RFx Core: \*\*23\/41\*\*/);
for (const id of ["ISS-005", "ISS-006"])
  assert.match(tracker, new RegExp("\\[x\\] `" + id + "`"));
assert.match(dependency, /Slice 4\.2 implementation result/);
assert.match(browserAcceptance, /RFx package version 3/);
assert.match(browserAcceptance, /moduleStatus/);
assert.match(smoke, /rfx-package-saved/);
assert.match(smoke, /current version is 4/);
for (const [index, locale] of locales.entries()) {
  const parsed = JSON.parse(locale);
  for (const key of [
    "module",
    "moduleStatus",
    "packageTitle",
    "sourceStatement",
    "savePackage",
    "locationMode",
    "requirementsBoundary",
  ])
    assert.ok(parsed[key], `RFx package locale ${index + 1} missing ${key}`);
}
for (const forbidden of ["amended", "awarded", "submitted"])
  assert.doesNotMatch(
    model,
    new RegExp(`lifecycleState: [^\\n]*${forbidden}`),
    `Later lifecycle state leaked into Slice 4.2: ${forbidden}`,
  );

console.log(
  "Slice 4.2 RFx structured package, geography, value, term, requirements, recovery, optional interpretation, localization, and stop boundaries validated.",
);
