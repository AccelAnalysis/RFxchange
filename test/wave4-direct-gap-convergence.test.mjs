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

test("ISS-007 and ISS-011 preserve the correct draft and support lossless structured/partial definition authoring", async () => {
  const [workspace, qualifierEditor, service, repository] = await Promise.all([
    read("src/components/rfx/RFxDraftWorkspace.tsx"),
    read("src/components/rfx/RFxStructuredQualifierEditor.tsx"),
    read("src/application/rfx/wave4-gap-governed-draft-service.ts"),
    read("src/infrastructure/rfx/iss006-governed-rfx-repository.ts"),
  ]);
  assert.match(workspace, /<RFxDefinitionBuilder[\s\S]{0,220}key=\{selectedDraft\.id\}/);
  assert.match(qualifierEditor, /qualifierKind/);
  for (const kind of ["text", "quantity", "boolean", "geography"])
    assert.match(qualifierEditor, new RegExp(`"${kind}"`));
  assert.match(service, /optionalStable\([\s\S]{0,120}responseInput\.responseTemplateId/);
  assert.match(service, /optionalStable\([\s\S]{0,120}evaluationInput\.decisionTemplateId/);
  assert.match(service, /mergeLosslessQualifiers/);
  assert.match(service, /getById\(result\.aggregate\.id\)/);
  assert.match(repository, /reconcileDefinitionForPackage/);
});

test("ISS-009 rejects semantically incompatible evaluation links", async () => {
  const service = await read("src/application/rfx/wave4-gap-governed-draft-service.ts");
  assert.match(service, /factorRequirementTreatmentCompatible/);
  assert.match(service, /linked requirement treatment is incompatible/i);
  assert.match(service, /assertFactorRequirementTreatmentCompatibility\(definition\)/);
});

test("ISS-016 and ISS-018 readiness targets are real and stale previews are cleared", async () => {
  const [publication, workspace, panel] = await Promise.all([
    read("src/domain/rfx/publication.ts"),
    read("src/components/rfx/RFxDraftWorkspace.tsx"),
    read("src/components/rfx/RFxPublicationPanel.tsx"),
  ]);
  assert.doesNotMatch(publication, /#rfx-package-/);
  for (const anchor of ["#rfx-need", "#rfx-timing", "#rfx-performance-location"])
    assert.match(publication, new RegExp(anchor));
  for (const id of [
    "rfx-definition-requirements",
    "rfx-definition-responseStructure",
    "rfx-definition-evaluationDefinition",
  ]) assert.match(workspace, new RegExp(`id="${id}"`));
  const versionEffect = panel.indexOf("aggregate.version");
  assert.ok(versionEffect >= 0);
  assert.match(panel.slice(Math.max(0, versionEffect - 1200), versionEffect + 1800), /setReadiness\(null\)/);
  assert.match(panel.slice(Math.max(0, versionEffect - 1200), versionEffect + 1800), /setPreview\(null\)/);
});

test("ISS-019 revalidates publication inputs transactionally and reloads concurrent replay", async () => {
  const [repository, service, runtime] = await Promise.all([
    read("src/infrastructure/rfx/wave4-gap-publication-repository.ts"),
    read("src/application/rfx/wave4-gap-publication-service.ts"),
    read("src/infrastructure/rfx/runtime.ts"),
  ]);
  assert.match(repository, /organizationProfiles/);
  assert.match(repository, /organizationLocations/);
  assert.match(repository, /runTransaction/);
  assert.match(service, /if \(!result\.replayed\)/);
  assert.match(service, /getPublicationSnapshot/);
  assert.match(service, /getProjection/);
  assert.match(runtime, /Wave4GapPublicationRepository/);
  assert.match(runtime, /Wave4GapPublicationService/);
});

test("ACQ-009 preserves an authenticated-participant opportunity through sign-in", async () => {
  const page = await read("app/opportunities/[reference]/page.tsx");
  assert.match(page, /authenticated-participants/);
  assert.match(page, /signin/);
  assert.match(page, /returnTo/);
  assert.match(page, /acquisition/i);
});

test("DSC-004 has no fixed discovery horizon, handles legacy projections, and exposes structured filters", async () => {
  const [repository, domain, workspace] = await Promise.all([
    read("src/infrastructure/rfx/wave4-gap-opportunity-discovery-repository.ts"),
    read("src/domain/rfx/discovery.ts"),
    read("src/components/rfx/OpportunityDiscoveryWorkspace.tsx"),
  ]);
  assert.match(repository, /startAfter/);
  assert.match(repository, /while \(true\)/);
  assert.doesNotMatch(repository, /MAX_DISCOVERY_SCAN|10_000|Math\.min\(250,\s*limit\)/);
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
    read("src/application/rfx/wave4-gap-opportunity-discovery-service.ts"),
    read("src/infrastructure/rfx/opportunity-discovery-runtime.ts"),
  ]);
  const commandRead = service.indexOf("getCommand(commandId)");
  const currentRead = service.indexOf("getSavedSearch(savedSearchId)");
  const versionConflict = service.indexOf("existing.version !== expectedVersion");
  assert.ok(commandRead >= 0 && currentRead > commandRead && versionConflict > commandRead,
    "Saved-search exact replay must precede current record/version handling.");
  assert.doesNotMatch(
    service.slice(0, commandRead),
    /createdAt|updatedAt/,
    "Retry fingerprint construction must not depend on retry-time timestamps.",
  );
  assert.match(runtime, /loadImmutableAmacsCatalog/);
  assert.match(runtime, /validateCapabilityIds/);
  assert.match(runtime, /Wave4GapOpportunityDiscoveryService/);
});

test("DSC-006 has durable, authority-revalidated discovery evaluation and alert delivery", async () => {
  const [api, reliability, evaluationWorker, alertWorker, functionsIndex] = await Promise.all([
    read("app/api/rfx/route.ts"),
    read("src/infrastructure/rfx/opportunity-discovery-reliability.ts"),
    read("functions/src/opportunity-discovery-evaluation-functions.ts"),
    read("functions/src/opportunity-discovery-functions.ts"),
    read("functions/src/index.ts"),
  ]);
  assert.match(api, /queueOpportunityDiscoveryEvaluation/);
  assert.match(api, /completeOpportunityDiscoveryEvaluation/);
  assert.match(reliability, /opportunityDiscoveryEvaluations/);
  assert.match(evaluationWorker, /opportunityDiscoveryEvaluations/);
  assert.match(evaluationWorker, /runTransaction/);
  assert.match(evaluationWorker, /organizationMemberships/);
  assert.match(evaluationWorker, /accessRestrictions/);
  assert.match(evaluationWorker, /orderBy\(FieldPath\.documentId\(\)\)/);
  assert.doesNotMatch(evaluationWorker, /where\("status", "==", "active"\)\.limit\(500\)/);
  assert.match(alertWorker, /opportunityAlertIntents/);
  assert.match(alertWorker, /executeReliableTransactionalEmailJob/);
  assert.match(alertWorker, /FirestoreBackgroundJobStore/);
  assert.match(alertWorker, /FirestoreTransactionalEmailDeliveryAuditStore/);
  assert.match(alertWorker, /organizationMemberships/);
  assert.match(alertWorker, /accessRestrictions/);
  assert.match(alertWorker, /orderBy\(FieldPath\.documentId\(\)\)/);
  assert.doesNotMatch(alertWorker, /where\("status", "==", "queued"\)\.limit\(25\)/);
  assert.match(functionsIndex, /scheduledOpportunityDiscoveryEvaluation/);
  assert.match(functionsIndex, /scheduledOpportunityAlertDelivery/);
});