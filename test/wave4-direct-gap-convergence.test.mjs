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

test("remaining Wave 4 corrections do not re-gate the map-first Exchange", async () => {
  const [exchange, canvas] = await Promise.all([
    read("app/exchange/page.tsx"),
    read("app/geography/canvas/page.tsx"),
  ]);
  assert.match(exchange, /geography\/canvas/);
  assert.doesNotMatch(canvas, /lifecycleState !== "open-platform"/);
});

test("ISS-007 and ISS-011 preserve the correct draft and support lossless structured/partial definition authoring", async () => {
  const [workspace, definitionBuilder, qualifierEditor, service, repository, baseRepository, dictionary, ...qualifierCatalogText] = await Promise.all([
    read("src/components/rfx/RFxDraftWorkspace.tsx"),
    read("src/components/rfx/RFxDefinitionBuilder.tsx"),
    read("src/components/rfx/RFxStructuredQualifierEditor.tsx"),
    read("src/application/rfx/wave4-gap-governed-draft-service.ts"),
    read("src/infrastructure/rfx/iss006-governed-rfx-repository.ts"),
    read("src/infrastructure/firestore/rfx.ts"),
    read("src/i18n/get-dictionary.ts"),
    ...["en-US", "es", "fr", "it", "de"].map((locale) =>
      read(`src/i18n/messages/rfx-qualifier/${locale}.json`)),
  ]);
  assert.match(
    workspace,
    /<RFxDefinitionBuilder[\s\S]{0,220}key=\{`\$\{selectedDraft\.id\}:definition`\}/,
    "The main definition editor must reset by RFx draft identity without remounting on same-draft version refreshes.",
  );
  assert.doesNotMatch(
    workspace,
    /key=\{`\$\{selectedDraft\.id\}:\$\{selectedDraft\.version\}:definition`\}/,
    "A committed same-draft version refresh must not discard dirty or in-flight definition edits.",
  );
  assert.match(definitionBuilder, /const synchronizedAggregate = useRef\(\{/);
  assert.match(
    definitionBuilder,
    /if \(dirty \|\| saving \|\| saveInFlight\.current\) \{[\s\S]{0,160}setForm\(\(current\) => \(\{/,
    "A dirty or in-flight editor must reconcile authoritative state without remounting or replacing unrelated local edits.",
  );
  assert.match(
    definitionBuilder,
    /const acknowledgedCommit =[\s\S]{0,240}acknowledgedDefinitionCommit\.current/,
    "Only the exact aggregate returned by this editor's save may advance its qualifier baseline.",
  );
  assert.match(
    definitionBuilder,
    /submittedQualifier === undefined \|\|[\s\S]{0,100}authoritative\.qualifier !== submittedQualifier[\s\S]{0,80}return requirement/,
    "Dirty qualifier input must retain its original baseline for unrelated or mismatched aggregate refreshes.",
  );
  assert.match(
    definitionBuilder,
    /qualifierBase: authoritative\.qualifier,[\s\S]{0,100}qualifierDirty: requirement\.qualifier !== submittedQualifier/,
    "An acknowledged editor save must advance the baseline while preserving edits made during the request.",
  );
  assert.match(
    definitionBuilder,
    /if \(!requirement\.qualifierDirty\)[\s\S]{0,180}qualifier: authoritative\.qualifier,[\s\S]{0,80}qualifierBase: authoritative\.qualifier/,
    "Clean qualifier fields must absorb the latest authoritative value and baseline.",
  );
  assert.match(
    definitionBuilder,
    /const authoritativeForm = initialForm\(aggregate\)/,
    "Same-draft version refreshes must construct the latest authoritative form state.",
  );
  assert.match(
    definitionBuilder,
    /setForm\(authoritativeForm\)/,
    "A clean editor must refresh from the latest authoritative aggregate without a component remount.",
  );
  assert.match(qualifierEditor, /qualifierKind/);
  for (const kind of ["text", "quantity", "boolean", "geography"])
    assert.match(qualifierEditor, new RegExp(`"${kind}"`));
  assert.match(service, /optionalStable\([\s\S]{0,120}responseInput\.responseTemplateId/);
  assert.match(service, /optionalStable\([\s\S]{0,120}evaluationInput\.decisionTemplateId/);
  assert.match(service, /mergeLosslessQualifiers/);
  assert.match(service, /getById\(result\.aggregate\.id\)/);
  assert.match(repository, /reconcileDefinitionForPackage/);

  assert.match(qualifierEditor, /useI18n/);
  assert.match(qualifierEditor, /t\("rfxQualifier\.title"\)/);
  assert.match(qualifierEditor, /t\("rfxQualifier\.error\.save"\)/);
  assert.doesNotMatch(qualifierEditor, />Structured qualifiers</);
  assert.match(dictionary, /rfxQualifier/);
  const qualifierCatalogs = qualifierCatalogText.map((text) => JSON.parse(text));
  const expectedQualifierKeys = leafKeys(qualifierCatalogs[0]);
  for (const catalog of qualifierCatalogs) {
    assert.deepEqual(leafKeys(catalog), expectedQualifierKeys);
  }
  assert.equal(new Set(qualifierCatalogs.map((catalog) => catalog.title)).size, 5);

  assert.match(baseRepository, /definitionGeographyQualifierIds/);
  assert.match(baseRepository, /assertReleasedQualifierGeographies/);
  assert.match(baseRepository, /qualifierGeographyRefs/);
  assert.match(baseRepository, /snapshot\.get\("releaseState"\) !== "released"/);
  assert.match(
    baseRepository,
    /publish\([\s\S]*qualifierGeographyRefs[\s\S]*assertReleasedQualifierGeographies\(qualifierGeographySnapshots\)/,
    "Geography qualifiers must be revalidated again in the base publication transaction.",
  );
});

test("ISS-009 rejects semantically incompatible evaluation links", async () => {
  const service = await read("src/application/rfx/wave4-gap-governed-draft-service.ts");
  assert.match(service, /factorRequirementTreatmentCompatible/);
  assert.match(service, /linked requirement treatment is incompatible/i);
  assert.match(service, /assertFactorRequirementTreatmentCompatibility\(definition\)/);
});

test("ISS-016 and ISS-018 readiness targets are real and stale previews are version-bound", async () => {
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

  assert.match(
    panel,
    /const draftStateKey = `\$\{aggregate\.id\}:\$\{aggregate\.version\}:\$\{audience\}`/,
    "Readiness and preview identity must include the RFx id, exact aggregate version, and audience.",
  );
  assert.match(
    panel,
    /readinessState\?\.key === draftStateKey \? readinessState\.value : null/,
    "Stale readiness must not render after RFx identity/version/audience changes.",
  );
  assert.match(
    panel,
    /previewState\?\.key === draftStateKey \? previewState\.value : null/,
    "Stale preview must not render after RFx identity/version/audience changes.",
  );
  assert.match(
    panel,
    /const aggregateStateKey = `\$\{aggregate\.id\}:\$\{aggregate\.version\}:\$\{aggregate\.lifecycleState\}`/,
    "Published projection state must be bound to the exact RFx aggregate identity and lifecycle.",
  );
  assert.doesNotMatch(
    panel,
    /useEffect\([\s\S]{0,500}set(?:Readiness|Preview|Busy)\([^)]*\)/,
    "ISS-018 invalidation must not depend on synchronous state resets inside an effect.",
  );
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
  assert.match(repository, /definitionGeographyQualifierIds/);
  assert.match(repository, /qualifierGeographyRefs/);
  assert.match(repository, /currentQualifierGeographyIds/);
  assert.match(repository, /sameStringList\(currentQualifierGeographyIds, qualifierGeographyIds\)/);
  assert.match(
    repository,
    /qualifierGeographySnapshots\.some\([\s\S]{0,180}releaseState[\s\S]{0,100}released/,
    "The active Wave 4 publication transaction must fail closed if qualifier locality authority changes.",
  );
  assert.match(service, /if \(!result\.replayed\)/);
  assert.match(service, /getPublicationSnapshot/);
  assert.match(service, /getProjection/);
  assert.match(runtime, /Wave4GapPublicationRepository/);
  assert.match(runtime, /Wave4GapPublicationService/);
});

test("ACQ-009 issues acquisition context before authenticated-participant sign-in", async () => {
  const [page, startRoute, acquisitionService] = await Promise.all([
    read("app/opportunities/[reference]/page.tsx"),
    read("app/api/acquisition/start/route.ts"),
    read("src/application/acquisition/acquisition-context.ts"),
  ]);
  assert.match(page, /authenticated-participants/);
  assert.match(page, /api\/acquisition\/start\?opportunityReference=/);
  assert.doesNotMatch(page, /signin\?returnTo=.*acquisition=/);
  assert.match(startRoute, /export async function GET/);
  assert.match(startRoute, /resolveOpportunityPublicationAudience/);
  assert.match(startRoute, /audience !== "authenticated-participants"/);
  assert.match(startRoute, /issueValidatedOpportunity/);
  assert.match(startRoute, /RFXCHANGE_ACQUISITION_COOKIE_NAME/);
  assert.match(startRoute, /signin\?returnTo=/);
  assert.match(acquisitionService, /async issueValidatedOpportunity/);
});

test("DSC-004 has no fixed discovery horizon, handles legacy projections, and exposes structured filters", async () => {
  const [repository, service, domain, workspace] = await Promise.all([
    read("src/infrastructure/rfx/wave4-gap-opportunity-discovery-repository.ts"),
    read("src/application/rfx/wave4-gap-opportunity-discovery-service.ts"),
    read("src/domain/rfx/discovery.ts"),
    read("src/components/rfx/OpportunityDiscoveryWorkspace.tsx"),
  ]);
  assert.match(repository, /startAfter/);
  assert.match(repository, /while \(true\)/);
  assert.doesNotMatch(repository, /MAX_DISCOVERY_SCAN|10_000|Math\.min\(250,\s*limit\)/);
  assert.match(service, /override async discover/);
  assert.match(service, /Number\.isSafeInteger\(offset\)/);
  assert.doesNotMatch(service, /offset > 10_000|10_000/);
  assert.match(domain, /requestFamilyIndexKeyForProjection/);
  assert.doesNotMatch(domain, /input\.projection\.requestFamilyIndexKey\.toLocaleLowerCase/);
  for (const attr of [
    "data-opportunity-request-family-filter",
    "data-opportunity-capability-filter",
    "data-opportunity-locality-filter",
  ]) assert.match(workspace, new RegExp(attr));
  assert.match(workspace, /requestFamilyKeys\.slice\(1\)\.map/);
  assert.match(workspace, /capabilityIds\.slice\(1\)\.map/);
  assert.match(workspace, /localityIds\.slice\(1\)\.map/);
  assert.match(workspace, /type="hidden" name="requestFamily"/);
  assert.match(workspace, /type="hidden" name="capability"/);
  assert.match(workspace, /type="hidden" name="locality"/);
  assert.match(workspace, /t\("rfxWorkspace\.capabilitySearch"\)/);
  assert.doesNotMatch(
    workspace,
    /AMACS request family ID|AMACS capability ID|>AMACS capability</,
    "New discovery-filter copy must not bypass the five-locale catalog.",
  );
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

test("DSC-006 has durable, resumable, authority-revalidated discovery evaluation and alert delivery", async () => {
  const [api, reliability, evaluationWorker, alertWorker, canonicalDiscoveryRepository, functionsIndex] = await Promise.all([
    read("app/api/rfx/route.ts"),
    read("src/infrastructure/rfx/opportunity-discovery-reliability.ts"),
    read("functions/src/opportunity-discovery-evaluation-functions.ts"),
    read("functions/src/opportunity-discovery-functions.ts"),
    read("src/infrastructure/firestore/opportunity-discovery.ts"),
    read("functions/src/index.ts"),
  ]);
  assert.match(api, /queueOpportunityDiscoveryEvaluation/);
  assert.doesNotMatch(api, /completeOpportunityDiscoveryEvaluation/);
  assert.match(api, /status:\s*"pending",\s*\.\.\.evaluated/);
  assert.match(reliability, /opportunityDiscoveryEvaluations/);
  assert.match(evaluationWorker, /opportunityDiscoveryEvaluations/);
  assert.match(evaluationWorker, /runTransaction/);
  assert.match(evaluationWorker, /organizationMemberships/);
  assert.match(evaluationWorker, /accessRestrictions/);
  assert.match(evaluationWorker, /orderBy\(FieldPath\.documentId\(\)\)/);
  assert.doesNotMatch(evaluationWorker, /where\("status", "==", "active"\)\.limit\(500\)/);
  assert.match(evaluationWorker, /referenceAlreadyPresent/);
  assert.match(evaluationWorker, /referenceAlreadyPresent\s*\?\s*existingSummary/);
  assert.match(evaluationWorker, /opportunity_summary:\s*nextSummary/);
  assert.match(evaluationWorker, /class SavedSearchAuthorityChangedError/);
  assert.match(evaluationWorker, /error instanceof SavedSearchAuthorityChangedError\) continue/);
  assert.match(evaluationWorker, /savedSearchCursorId/);
  assert.match(evaluationWorker, /async function checkpointEvaluation/);
  assert.match(evaluationWorker, /query = query\.startAfter\(cursorId\)/);
  assert.match(
    evaluationWorker,
    /await checkpointEvaluation\(db, evaluationId, claimId, nextCursorId\)/,
    "Every fully processed saved-search page must persist its continuation cursor before the worker advances.",
  );
  assert.match(
    evaluationWorker,
    /leaseUntil: Timestamp\.fromMillis\(now\.toMillis\(\) \+ 5 \* 60_000\)/,
    "Checkpointing must renew the evaluation lease while exhaustive work continues.",
  );
  assert.match(canonicalDiscoveryRepository, /nextUniqueReferences/);
  assert.match(canonicalDiscoveryRepository, /nextUniqueReferences\.length && nextSummary/);
  assert.match(canonicalDiscoveryRepository, /opportunity_summary:\s*opportunitySummary/);
  assert.match(alertWorker, /opportunityAlertIntents/);
  assert.match(alertWorker, /executeReliableTransactionalEmailJob/);
  assert.match(alertWorker, /FirestoreBackgroundJobStore/);
  assert.match(alertWorker, /FirestoreTransactionalEmailDeliveryAuditStore/);
  assert.match(alertWorker, /organizationMemberships/);
  assert.match(alertWorker, /accessRestrictions/);
  assert.match(alertWorker, /orderBy\(FieldPath\.documentId\(\)\)/);
  assert.doesNotMatch(alertWorker, /where\("status", "==", "queued"\)\.limit\(25\)/);
  assert.match(
    alertWorker,
    /secrets:\s*\["RFXCHANGE_MICROSOFT_CLIENT_SECRET"\]/,
    "The deployed opportunity-alert scheduler must bind the managed Microsoft client secret.",
  );
  assert.match(functionsIndex, /scheduledOpportunityDiscoveryEvaluation/);
  assert.match(functionsIndex, /scheduledOpportunityAlertDelivery/);
});
