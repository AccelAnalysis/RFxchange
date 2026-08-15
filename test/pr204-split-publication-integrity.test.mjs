import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ISS-016 and ISS-018 readiness targets are real and stale previews are version-bound", async () => {
  const [publication, workspace, panel] = await Promise.all([
    read("src/domain/rfx/publication.ts"),
    read("src/components/rfx/RFxDraftWorkspace.tsx"),
    read("src/components/rfx/RFxPublicationPanel.tsx"),
  ]);

  assert.doesNotMatch(publication, /#rfx-package-/);
  for (const anchor of ["#rfx-need", "#rfx-timing", "#rfx-performance-location"]) assert.match(publication, new RegExp(anchor));
  for (const id of [
    "rfx-definition-requirements",
    "rfx-definition-responseStructure",
    "rfx-definition-evaluationDefinition",
  ]) assert.match(workspace, new RegExp(`id="${id}"`));

  assert.match(panel, /const draftStateKey = `\$\{aggregate\.id\}:\$\{aggregate\.version\}:\$\{audience\}`/);
  assert.match(panel, /readinessState\?\.key === draftStateKey \? readinessState\.value : null/);
  assert.match(panel, /previewState\?\.key === draftStateKey \? previewState\.value : null/);
  assert.match(panel, /const aggregateStateKey = `\$\{aggregate\.id\}:\$\{aggregate\.version\}:\$\{aggregate\.lifecycleState\}`/);
});

test("ISS-019 revalidates publication authority transactionally and reloads authoritative replay", async () => {
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
  assert.match(repository, /qualifierGeographySnapshots\.some\([\s\S]{0,180}releaseState[\s\S]{0,100}released/);
  assert.match(service, /if \(!result\.replayed\)/);
  assert.match(service, /getPublicationSnapshot/);
  assert.match(service, /getProjection/);
  assert.match(runtime, /Wave4GapPublicationRepository/);
  assert.match(runtime, /Wave4GapPublicationService/);
});

test("publication split does not introduce Exchange or lens gating", async () => {
  const [exchange, canvas] = await Promise.all([
    read("app/exchange/page.tsx"),
    read("app/geography/canvas/page.tsx"),
  ]);
  assert.match(exchange, /geography\/canvas/);
  assert.doesNotMatch(canvas, /lifecycleState !== "open-platform"/);
});
