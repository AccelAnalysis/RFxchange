import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("DSC-004 scans bounded canonical pages and continues without a fixed visibility horizon", async () => {
  const [repository, boundedService, domain, workspace, runtime, requestFamilySource] = await Promise.all([
    read("src/infrastructure/rfx/wave4-gap-opportunity-discovery-repository.ts"),
    read("src/application/rfx/bounded-opportunity-discovery-service.ts"),
    read("src/domain/rfx/discovery.ts"),
    read("src/components/rfx/OpportunityDiscoveryWorkspace.tsx"),
    read("src/infrastructure/rfx/opportunity-discovery-runtime.ts"),
    read("standards/amacs/releases/0.5.0/source/request-families.jsonl"),
  ]);

  assert.match(repository, /listProjectionPage/);
  assert.match(repository, /where\("payload\.timing\.responseDeadline", ">=", minimumDeadline\)/);
  assert.match(repository, /orderBy\("payload\.timing\.responseDeadline", "asc"\)/);
  assert.match(repository, /orderBy\(FieldPath\.documentId\(\), "asc"\)/);
  assert.match(repository, /startAfter\(decoded\.deadline, decoded\.reference\)/);
  assert.match(repository, /cursorAfterProjection/);
  assert.match(repository, /\.limit\(pageSize\)/);
  assert.doesNotMatch(repository, /while \(true\)|MAX_DISCOVERY_SCAN|10_000/);
  assert.doesNotMatch(repository, /providerAccountAuthoritative|saveMatch\(/,
    "DSC-006 match-authority behavior must remain outside this split.");

  assert.match(boundedService, /participantDatastoreCursor/);
  assert.match(boundedService, /minimumDeadline = now\.slice\(0, 10\)/);
  assert.match(boundedService, /MAX_PROJECTION_PAGES_PER_REQUEST = 4/);
  assert.match(boundedService, /scannedPages < MAX_PROJECTION_PAGES_PER_REQUEST/);
  assert.match(boundedService, /boundedScanCursor/);
  assert.match(boundedService, /participantCursor\(queryHash, boundedScanCursor\)/);
  assert.match(boundedService, /matching\.length < query\.limit \+ 1/);
  assert.match(boundedService, /cursorAfterProjection\(lastSelected\)/);
  assert.doesNotMatch(boundedService, /targetMatchCount|rawOffset|offset \+ query\.limit/);
  assert.match(boundedService, /watchedReferences\.map\(\(reference\) => this\.boundedRepository\.getProjection\(reference\)\)/);
  assert.doesNotMatch(boundedService, /listProjections\(/);
  assert.doesNotMatch(boundedService, /10_000/);

  assert.match(domain, /requestFamilyIndexKeyForProjection/);
  assert.match(domain, /LEGACY_REQUEST_FAMILY_LABEL_TO_CANONICAL_KEY/);
  assert.doesNotMatch(domain, /input\.projection\.requestFamilyIndexKey\.toLocaleLowerCase/);
  for (const line of requestFamilySource.trim().split("\n")) {
    const record = JSON.parse(line);
    assert.match(domain, new RegExp(record.preferred_label.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(domain, new RegExp(record.request_family_id.toLowerCase()));
  }

  for (const attr of [
    "data-opportunity-request-family-filter",
    "data-opportunity-capability-filter",
    "data-opportunity-locality-filter",
  ]) assert.match(workspace, new RegExp(attr));
  assert.match(workspace, /requestFamilyKeys\.length \? result\.query\.requestFamilyKeys : \[""\]/);
  assert.match(workspace, /capabilityIds\.length \? result\.query\.capabilityIds : \[""\]/);
  assert.match(workspace, /localityIds\.length \? result\.query\.localityIds : \[""\]/);
  assert.doesNotMatch(workspace, /type="hidden" name="requestFamily"/);
  assert.doesNotMatch(workspace, /type="hidden" name="capability"/);
  assert.doesNotMatch(workspace, /type="hidden" name="locality"/);
});

test("DSC-005 replays before version conflict and validates all governed filters", async () => {
  const [service, runtime] = await Promise.all([
    read("src/application/rfx/wave4-gap-opportunity-discovery-service.ts"),
    read("src/infrastructure/rfx/opportunity-discovery-runtime.ts"),
  ]);

  const commandRead = service.indexOf("getCommand(commandId)");
  const currentRead = service.indexOf("getSavedSearch(savedSearchId)");
  const versionConflict = service.indexOf("existing.version !== expectedVersion");
  assert.ok(commandRead >= 0 && currentRead > commandRead && versionConflict > commandRead);
  assert.doesNotMatch(service.slice(0, commandRead), /createdAt|updatedAt/);
  assert.match(runtime, /loadImmutableAmacsCatalog/);
  assert.match(runtime, /hasCanonicalCapability/);
  assert.match(runtime, /getRequestFamily/);
  assert.match(runtime, /geographyId/);
  assert.match(runtime, /db\.getAll/);
  assert.match(runtime, /releaseState/);
  assert.match(runtime, /validateGovernedFilters/);
  assert.match(runtime, /BoundedOpportunityDiscoveryService/);
});

test("discovery-query split does not introduce Exchange or lens gating", async () => {
  const [exchange, canvas] = await Promise.all([
    read("app/exchange/page.tsx"),
    read("app/geography/canvas/page.tsx"),
  ]);
  assert.match(exchange, /geography\/canvas/);
  assert.doesNotMatch(canvas, /lifecycleState !== "open-platform"/);
});
