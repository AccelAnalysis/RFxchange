import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("remaining Wave 4 corrections do not re-gate the map-first Exchange", async () => {
  const [exchange, canvas] = await Promise.all([
    read("app/exchange/page.tsx"),
    read("app/geography/canvas/page.tsx"),
  ]);
  assert.match(exchange, /geography\/canvas/);
  assert.doesNotMatch(canvas, /lifecycleState !== "open-platform"/);
});

test("ISS-007 and ISS-011 preserve the correct draft and support structured/partial definition authoring", async () => {
  const [workspace, builder, service] = await Promise.all([
    read("src/components/rfx/RFxDraftWorkspace.tsx"),
    read("src/components/rfx/RFxDefinitionBuilder.tsx"),
    read("src/application/rfx/rfx-draft-service.ts"),
  ]);
  assert.match(workspace, /<RFxDefinitionBuilder[\s\S]{0,180}key=\{selectedDraft\.id\}/);
  assert.match(builder, /qualifierKind/);
  for (const kind of ["quantity", "boolean", "geography"]) assert.match(builder, new RegExp(`"${kind}"`));
  assert.doesNotMatch(service, /stable\(\s*String\(responseInput\.responseTemplateId/);
  assert.doesNotMatch(service, /stable\(\s*String\(evaluationInput\.decisionTemplateId/);
  assert.match(service, /reconcileDefinitionForPackage/);
});

test("ISS-009 rejects semantically incompatible evaluation links", async () => {
  const model = await read("src/domain/rfx/model.ts");
  assert.match(model, /factorRequirementTreatmentCompatible/);
  assert.match(model, /linked requirement treatment is incompatible/i);
});

test("ISS-016 and ISS-018 readiness targets are real and stale previews are cleared", async () => {
  const [publication, definitionBuilder, panel] = await Promise.all([
    read("src/domain/rfx/publication.ts"),
    read("src/components/rfx/RFxDefinitionBuilder.tsx"),
    read("src/components/rfx/RFxPublicationPanel.tsx"),
  ]);
  assert.doesNotMatch(publication, /#rfx-package-/);
  for (const anchor of ["#rfx-need", "#rfx-timing", "#rfx-performance-location"]) assert.match(publication, new RegExp(anchor));
  for (const id of ["rfx-definition-requirements", "rfx-definition-responseStructure", "rfx-definition-evaluationDefinition"]) assert.match(definitionBuilder, new RegExp(`id="${id}"`));
  const versionEffect = panel.indexOf("aggregate.version");
  assert.ok(versionEffect >= 0);
  assert.match(panel.slice(Math.max(0, versionEffect - 900), versionEffect + 1500), /setReadiness\(null\)/);
  assert.match(panel.slice(Math.max(0, versionEffect - 900), versionEffect + 1500), /setPreview\(null\)/);
});

test("ISS-019 revalidates publication inputs transactionally and reloads concurrent replay", async () => {
  const [repository, service] = await Promise.all([
    read("src/infrastructure/firestore/rfx.ts"),
    read("src/application/rfx/rfx-publication-service.ts"),
  ]);
  assert.match(repository, /organizationProfiles/);
  assert.match(repository, /organizationLocations/);
  assert.match(service, /if \(result === "replayed"\)/);
  assert.match(service, /getPublicationSnapshot/);
  assert.match(service, /getProjection/);
});

test("ACQ-009 preserves an authenticated-participant opportunity through sign-in", async () => {
  const page = await read("app/opportunities/[reference]/page.tsx");
  assert.match(page, /authenticated-participants/);
  assert.match(page, /signin/);
  assert.match(page, /returnTo/);
  assert.match(page, /acquisition/i);
});

test("DSC-004 discovers beyond the old 250-record horizon, handles legacy projections, and exposes structured filters", async () => {
  const [repository, domain, workspace] = await Promise.all([
    read("src/infrastructure/firestore/opportunity-discovery.ts"),
    read("src/domain/rfx/discovery.ts"),
    read("src/components/rfx/OpportunityDiscoveryWorkspace.tsx"),
  ]);
  assert.match(repository, /startAfter/);
  assert.doesNotMatch(repository, /Math\.min\(250,\s*limit\)/);
  assert.match(domain, /requestFamilyIndexKeyForProjection/);
  assert.doesNotMatch(domain, /input\.projection\.requestFamilyIndexKey\.toLocaleLowerCase/);
  for (const attr of [
    "data-opportunity-request-family-filter",
    "data-opportunity-capability-filter",
    "data-opportunity-locality-filter",
  ]) assert.match(workspace, new RegExp(attr));
});

test("DSC-005 exact replay precedes version conflict and capability IDs use the pinned AMACS catalog", async () => {
  const [service, runtime] = await Promise.all([
    read("src/application/rfx/opportunity-discovery-service.ts"),
    read("src/infrastructure/rfx/opportunity-discovery-runtime.ts"),
  ]);
  const commandRead = service.indexOf("getCommand(commandId)");
  const versionConflict = service.indexOf("existing.version !== expectedVersion");
  assert.ok(commandRead >= 0 && versionConflict > commandRead, "Saved-search exact replay must precede current-version conflict handling.");
  assert.match(runtime, /loadImmutableAmacsCatalog/);
  assert.match(service, /validateCapabilityIds/);
});

test("DSC-006 has durable discovery-evaluation retry and a real alert delivery consumer", async () => {
  const [api, functions] = await Promise.all([
    read("app/api/rfx/route.ts"),
    read("functions/src/background-job-functions.ts"),
  ]);
  assert.match(api, /queueOpportunityDiscoveryEvaluation/);
  assert.match(functions, /opportunityAlertIntents/);
  assert.match(functions, /opportunityDiscoveryEvaluations/);
  assert.match(functions, /transactional/i);
  assert.match(functions, /onSchedule/);
});
