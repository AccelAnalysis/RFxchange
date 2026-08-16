import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ISS-016 and ISS-018 readiness targets are real and stale previews are version-bound", async () => {
  const [publication, workspace, panel, publicationService] = await Promise.all([
    read("src/domain/rfx/publication.ts"),
    read("src/components/rfx/RFxDraftWorkspace.tsx"),
    read("src/components/rfx/RFxPublicationPanel.tsx"),
    read("src/application/rfx/wave4-gap-publication-service.ts"),
  ]);

  assert.doesNotMatch(publication, /#rfx-package-/);
  for (const anchor of ["#rfx-need", "#rfx-timing", "#rfx-performance-location"]) assert.match(publication, new RegExp(anchor));
  for (const id of [
    "rfx-definition-requirements",
    "rfx-definition-responseStructure",
    "rfx-definition-evaluationDefinition",
  ]) assert.match(workspace, new RegExp(`id="${id}"`));

  assert.match(panel, /const moduleAnchors = \[/);
  assert.match(panel, /placeholder\.removeAttribute\("id"\)/);
  assert.match(panel, /target\.id = recoveryId/);
  assert.match(panel, /querySelectorAll<HTMLElement>\("\[data-rfx-requirement\]"\)/);
  assert.match(panel, /const assignedId = `rfx-requirement-\$\{requirement\.id\}`/);
  assert.match(panel, /row\.id = assignedId/);

  assert.match(panel, /const draftStateKey = `\$\{aggregate\.id\}:\$\{aggregate\.version\}:\$\{audience\}`/);
  assert.match(panel, /readinessState\?\.key === draftStateKey \? readinessState\.value : null/);
  assert.match(panel, /previewState\?\.key === draftStateKey \? previewState\.value : null/);
  assert.match(panel, /const aggregateStateKey = `\$\{aggregate\.id\}:\$\{aggregate\.version\}:\$\{aggregate\.lifecycleState\}`/);

  assert.match(publicationService, /geographyQualifierRequirements/);
  assert.match(publicationService, /geography\.releaseState !== "released"/);
  assert.match(publicationService, /workspaceTarget: `#rfx-requirement-\$\{requirementId\}`/);
  assert.match(publicationService, /sourcePath: `definition\.requirements\.\$\{requirementId\}\.qualifiers`/);
  assert.match(publicationService, /status: "blocked" as const/);
  assert.match(publicationService, /preview: null/);
});

test("ISS-019 revalidates publication authority transactionally and reloads authoritative replay", async () => {
  const [repository, service, runtime, publicationService, contract] = await Promise.all([
    read("src/infrastructure/rfx/wave4-gap-publication-repository.ts"),
    read("src/application/rfx/wave4-gap-publication-service.ts"),
    read("src/infrastructure/rfx/runtime.ts"),
    read("src/application/rfx/rfx-publication-service.ts"),
    read("src/domain/rfx/repository.ts"),
  ]);

  assert.match(repository, /organizationProfiles/);
  assert.match(repository, /organizationLocations/);
  assert.match(repository, /runTransaction/);
  assert.match(repository, /definitionGeographyQualifierIds/);
  assert.match(repository, /qualifierGeographyRefs/);
  assert.match(repository, /currentQualifierGeographyIds/);
  assert.match(repository, /sameStringList\(currentQualifierGeographyIds, qualifierGeographyIds\)/);
  assert.match(repository, /qualifierGeographySnapshots\.some\([\s\S]{0,180}releaseState[\s\S]{0,100}released/);

  const replayRead = repository.indexOf("transaction.get(commandRef)");
  const accountInspect = repository.indexOf("accountSecurity.inspect(bundle.authentication.subject)");
  assert.ok(replayRead >= 0 && accountInspect > replayRead, "exact replay must precede mutable account-state checks");
  assert.match(repository, /authenticationAccountState\(account\) !== "active"/);
  assert.match(repository, /authenticationCredentialState\(account, bundle\.authentication\.authenticatedAt\) !== "current"/);
  assert.match(repository, /responseDeadlineOpen\(current, this\.now\(\)\)/);
  assert.match(repository, /RFx publication deadline is no longer open/);

  assert.match(contract, /readonly authentication: Readonly/);
  assert.match(contract, /provider: string/);
  assert.match(contract, /subject: string/);
  assert.match(contract, /authenticatedAt: string/);
  assert.match(publicationService, /authentication: Object\.freeze/);
  assert.match(publicationService, /publishDecision\.context\.authentication\.subject/);

  assert.match(service, /if \(!result\.replayed\)/);
  assert.match(service, /getPublicationSnapshot/);
  assert.match(service, /getProjection/);
  assert.match(runtime, /const accountSecurity = createServerFirebaseAccountSecurityService\(\)/);
  assert.match(runtime, /new Wave4GapPublicationRepository\(db, baseRepository, accountSecurity\)/);
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
