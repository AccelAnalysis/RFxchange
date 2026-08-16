import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function leafKeys(value, prefix = "") {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === "object" && !Array.isArray(child)
      ? leafKeys(child, path)
      : [path];
  }).sort();
}

test("ISS-007 and ISS-011 preserve same-draft edits and support governed structured authoring", async () => {
  const [workspace, builder, editor, service, repository, firestore, runtime, authority, authorityRoute, unitAuthority, dictionary, ...catalogText] = await Promise.all([
    read("src/components/rfx/RFxDraftWorkspace.tsx"),
    read("src/components/rfx/RFxDefinitionBuilder.tsx"),
    read("src/components/rfx/RFxStructuredQualifierEditor.tsx"),
    read("src/application/rfx/wave4-gap-governed-draft-service.ts"),
    read("src/infrastructure/rfx/iss006-governed-rfx-repository.ts"),
    read("src/infrastructure/firestore/rfx.ts"),
    read("src/infrastructure/rfx/runtime.ts"),
    read("src/infrastructure/rfx/authoring-authority-draft-service.ts"),
    read("app/api/rfx/qualifier-authority/route.ts"),
    read("src/infrastructure/amacs/rfx-qualifier-authority.ts"),
    read("src/i18n/get-dictionary.ts"),
    ...["en-US", "es", "fr", "it", "de"].map((locale) => read(`src/i18n/messages/rfx-qualifier/${locale}.json`)),
  ]);

  assert.match(workspace, /key=\{`\$\{selectedDraft\.id\}:definition`\}/);
  assert.doesNotMatch(workspace, /key=\{`\$\{selectedDraft\.id\}:\$\{selectedDraft\.version\}:definition`\}/);
  assert.match(workspace, /key=\{`\$\{selectedDraft\.id\}:qualifiers`\}/);
  assert.match(builder, /interface AcknowledgedDefinitionCommit/);
  assert.match(builder, /qualifierBase: string/);
  assert.match(builder, /qualifierDirty: boolean/);
  assert.match(builder, /textQualifierIntent: item\.qualifierDirty[\s\S]{0,120}\? "set"[\s\S]{0,60}: "remove"[\s\S]{0,60}: "preserve"/);
  assert.match(builder, /submittedQualifier === undefined \|\|[\s\S]{0,120}authoritative\.qualifier !== submittedQualifier/);
  assert.match(builder, /qualifierBase: authoritative\.qualifier,[\s\S]{0,120}qualifierDirty: requirement\.qualifier !== submittedQualifier/);

  for (const kind of ["text", "quantity", "boolean", "geography"]) assert.match(editor, new RegExp(`"${kind}"`));
  assert.match(editor, /\/api\/rfx\/qualifier-authority/);
  assert.match(editor, /data-rfx-qualifier-dimension/);
  assert.match(editor, /selectedDimension\.allowedUnitIds\.includes\(unit\)/);
  assert.match(editor, /propertyId: selectedDimension\.id/);
  assert.match(editor, /data-rfx-qualifier-unit/);
  assert.match(editor, /allowedUnits\.map/);
  assert.match(editor, /data-rfx-qualifier-localities/);
  assert.match(editor, /multiple/);
  assert.doesNotMatch(editor, /localityIds[\s\S]{0,120}<input/);
  assert.match(editor, /data-rfx-existing-qualifiers/);
  assert.match(editor, /data-rfx-remove-qualifier/);
  assert.match(editor, /async function removeQualifier/);
  assert.match(editor, /qualifiers: nextQualifiers/);
  assert.match(editor, /selected\.qualifiers\.filter/);
  assert.match(editor, /Promise<boolean>/);
  assert.match(editor, /const saved = await saveQualifiers/);
  assert.match(editor, /if \(!saved\) return/);
  assert.match(editor, /nextQualifier = qualifier\(\)[\s\S]{0,160}catch \(error\)/);
  assert.match(editor, /const effectiveRequirementId = definition\?\.requirements\.some/);
  assert.match(editor, /definition\?\.requirements\[0\]\?\.id \?\? ""/);
  assert.match(editor, /value=\{effectiveRequirementId\}/);
  assert.doesNotMatch(editor, /setRequirementId\(requirements\[0\]\?\.id/);

  assert.match(service, /optionalStable\([\s\S]{0,140}responseTemplateId/);
  assert.match(service, /optionalStable\([\s\S]{0,140}decisionTemplateId/);
  assert.match(service, /mergeLosslessQualifiers/);
  assert.match(service, /type TextQualifierIntent = "preserve" \| "set" \| "remove"/);
  assert.match(service, /if \(intent !== "preserve" && currentValue !== baseValue\)/);
  assert.match(service, /const hasExplicitQualifiers = Array\.isArray\(requirement\.qualifiers\)/);
  assert.match(service, /if \(hasExplicitQualifiers\)[\s\S]{0,180}qualifiers: Object\.freeze\(\[\.\.\.incoming\]\)/);
  assert.doesNotMatch(service, /incoming\.length === 0 && firstExistingText/);

  assert.match(repository, /reconcileDefinitionForPackage/);
  assert.match(firestore, /definitionGeographyQualifierIds/);
  assert.match(firestore, /assertReleasedQualifierGeographies/);
  assert.match(runtime, /AuthoringAuthorityRfxDraftService/);
  assert.match(runtime, /loadServerRfxQualifierAuthority/);
  assert.match(runtime, /loadRfxQuantityUnitAuthority/);
  assert.match(runtime, /loadRfxQuantityDimensionAuthority/);
  assert.match(runtime, /db\.collection\("geographies"\)\.get\(\)/);
  assert.match(runtime, /releaseState !== "released"/);
  assert.doesNotMatch(authority, /Wave4GapPublicationService/);

  assert.match(authority, /loadRfxQuantityUnitAuthority/);
  assert.match(authority, /loadRfxQuantityDimensionAuthority/);
  assert.match(authority, /dimensionById\.get\(propertyId\)/);
  assert.match(authority, /dimension\.allowedUnitIds\.includes\(unitId\)/);
  assert.match(authority, /unit\.unitFamily !== dimension\.unitFamily/);
  assert.match(authority, /geography\.releaseState !== "released"/);
  assert.match(authority, /expectedFactorTreatment/);
  assert.match(authority, /method === "scored" \|\| method === "formula"/);
  assert.match(authority, /authorizeOrganizationOperation/);
  assert.match(authority, /getCommand\(commandId\)/);
  assert.match(authority, /assertAuthorityInputBounds/);

  assert.match(authorityRoute, /loadServerRfxQualifierAuthority/);
  assert.doesNotMatch(authorityRoute, /standards\/amacs|generated\/amacs|infrastructure\/amacs|ajv\/dist/i);
  assert.match(unitAuthority, /src\/generated\/amacs\/0\.5\.0\/registries\.json/);
  assert.match(unitAuthority, /generated\.registries\.units/);
  assert.match(unitAuthority, /generated\.registries\.properties/);
  assert.match(unitAuthority, /allowed_unit_ids/);
  assert.match(unitAuthority, /activeUnitIds\.has\(value\)/);
  assert.match(editor, /useI18n/);
  assert.match(dictionary, /rfxQualifier/);

  const catalogs = catalogText.map((text) => JSON.parse(text));
  const expectedKeys = leafKeys(catalogs[0]);
  for (const catalog of catalogs) assert.deepEqual(leafKeys(catalog), expectedKeys);
  for (const catalog of catalogs) {
    assert.equal(typeof catalog.removeQualifier, "string");
    assert.equal(typeof catalog.removed, "string");
  }
});

test("ISS-009 rejects incompatible requirement treatments and authoritative factor methods", async () => {
  const [service, authority] = await Promise.all([
    read("src/application/rfx/wave4-gap-governed-draft-service.ts"),
    read("src/infrastructure/rfx/authoring-authority-draft-service.ts"),
  ]);
  assert.match(service, /factorRequirementTreatmentCompatible/);
  assert.match(service, /linked requirement treatment is incompatible/i);
  assert.match(service, /assertFactorRequirementTreatmentCompatibility\(definition\)/);
  assert.match(authority, /method === "gate"[\s\S]{0,100}"required-condition"/);
  assert.match(authority, /method === "narrative"[\s\S]{0,100}"informational-only"/);
  assert.match(authority, /method === "scored" \|\| method === "formula"[\s\S]{0,100}"scored-factor"/);
});

test("split authoring work does not introduce Exchange or lens gating", async () => {
  const [exchange, canvas] = await Promise.all([
    read("app/exchange/page.tsx"),
    read("app/geography/canvas/page.tsx"),
  ]);
  assert.match(exchange, /geography\/canvas/);
  assert.doesNotMatch(canvas, /lifecycleState !== "open-platform"/);
});
