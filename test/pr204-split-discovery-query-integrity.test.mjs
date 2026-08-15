import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("DSC-004 exhaustively scans projections, handles legacy request-family data, and preserves structured filters", async () => {
  const [repository, service, domain, workspace] = await Promise.all([
    read("src/infrastructure/rfx/wave4-gap-opportunity-discovery-repository.ts"),
    read("src/application/rfx/wave4-gap-opportunity-discovery-service.ts"),
    read("src/domain/rfx/discovery.ts"),
    read("src/components/rfx/OpportunityDiscoveryWorkspace.tsx"),
  ]);

  assert.match(repository, /startAfter/);
  assert.match(repository, /while \(true\)/);
  assert.doesNotMatch(repository, /MAX_DISCOVERY_SCAN|10_000|Math\.min\(250,\s*limit\)/);
  assert.doesNotMatch(repository, /providerAccountAuthoritative|saveMatch\(/,
    "DSC-006 match-authority behavior must remain outside this split.");
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
  assert.match(runtime, /Wave4GapOpportunityDiscoveryService/);
});

test("discovery-query split does not introduce Exchange or lens gating", async () => {
  const [exchange, canvas] = await Promise.all([
    read("app/exchange/page.tsx"),
    read("app/geography/canvas/page.tsx"),
  ]);
  assert.match(exchange, /geography\/canvas/);
  assert.doesNotMatch(canvas, /lifecycleState !== "open-platform"/);
});
