import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("DSC-004 scans bounded canonical pages only until the requested governed result window is complete", async () => {
  const [repository, boundedService, wave4Service, domain, workspace, runtime] = await Promise.all([
    read("src/infrastructure/rfx/wave4-gap-opportunity-discovery-repository.ts"),
    read("src/application/rfx/bounded-opportunity-discovery-service.ts"),
    read("src/application/rfx/wave4-gap-opportunity-discovery-service.ts"),
    read("src/domain/rfx/discovery.ts"),
    read("src/components/rfx/OpportunityDiscoveryWorkspace.tsx"),
    read("src/infrastructure/rfx/opportunity-discovery-runtime.ts"),
  ]);

  assert.match(repository, /listProjectionPage/);
  assert.match(repository, /orderBy\("payload\.timing\.responseDeadline", "asc"\)/);
  assert.match(repository, /orderBy\(FieldPath\.documentId\(\), "asc"\)/);
  assert.match(repository, /startAfter\(decoded\.deadline, decoded\.reference\)/);
  assert.match(repository, /\.limit\(pageSize\)/);
  assert.doesNotMatch(repository, /while \(true\)|MAX_DISCOVERY_SCAN|10_000/);
  assert.doesNotMatch(repository, /providerAccountAuthoritative|saveMatch\(/,
    "DSC-006 match-authority behavior must remain outside this split.");

  assert.match(boundedService, /targetMatchCount = offset \+ query\.limit \+ 1/);
  assert.match(boundedService, /listProjectionPage\(datastoreCursor, 120\)/);
  assert.match(boundedService, /while \(datastoreCursor && matching\.length < targetMatchCount\)/);
  assert.match(boundedService, /watchedReferences\.map\(\(reference\) => this\.boundedRepository\.getProjection\(reference\)\)/);
  assert.doesNotMatch(boundedService, /listProjections\(/);
  assert.match(wave4Service, /Number\.isSafeInteger\(offset\)/);
  assert.doesNotMatch(wave4Service, /offset > 10_000|10_000/);
  assert.match(runtime, /BoundedOpportunityDiscoveryService/);

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
});

test("DSC-005 replays before version conflict and validates capability filters against pinned AMACS", async () => {
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
  assert.match(runtime, /validateCapabilityIds/);
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
