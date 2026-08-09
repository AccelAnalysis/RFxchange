import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const requiredRecoveryKeys = [
  "eyebrow",
  "title",
  "lede",
  "supporting",
  "retry",
  "home",
  "supportReference",
];

const requiredAccessResolutionKeys = [
  "accessEyebrow",
  "accountTitle",
  "accountBody",
  "accountNext",
  "organizationTitle",
  "organizationBody",
  "organizationBoundary",
  "activeMemberships",
  "selectOrganization",
  "selectedOrganization",
  "organizationFallback",
];

test("application recovery boundary is localized, retryable, and does not invent participant state", async () => {
  const [
    boundary,
    styles,
    routeRuntime,
    classification,
    workspaceState,
    dictionary,
    ...recoveryCatalogTexts
  ] = await Promise.all([
    read("app/error.tsx"),
    read("app/error.module.css"),
    read("src/infrastructure/auth/participant-route-runtime.ts"),
    read("src/infrastructure/auth/participant-route-classification.ts"),
    read("src/infrastructure/auth/participant-workspace-state.ts"),
    read("src/i18n/get-dictionary.ts"),
    read("src/i18n/messages/recovery/en-US.json"),
    read("src/i18n/messages/recovery/es.json"),
    read("src/i18n/messages/recovery/fr.json"),
    read("src/i18n/messages/recovery/it.json"),
    read("src/i18n/messages/recovery/de.json"),
  ]);

  assert.match(boundary, /useI18n/);
  for (const key of requiredRecoveryKeys) {
    assert.match(boundary, new RegExp(`recovery\\.${key}`));
  }
  assert.match(boundary, /onClick=\{reset\}/);
  assert.match(boundary, /error\.digest/);
  assert.doesNotMatch(boundary, /error\.message/);
  assert.doesNotMatch(boundary, /Your RFxchange progress is still here/);
  assert.doesNotMatch(boundary, /account, organization|activation progress are not reset/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /@media \(max-width: 520px\)/);

  const catalogs = recoveryCatalogTexts.map((text) => JSON.parse(text));
  const referenceKeys = Object.keys(catalogs[0]);
  for (const key of [...requiredRecoveryKeys, ...requiredAccessResolutionKeys]) {
    assert.ok(referenceKeys.includes(key), `Recovery catalog must include ${key}`);
  }
  for (const catalog of catalogs) {
    assert.deepEqual(Object.keys(catalog), referenceKeys);
    assert.ok(Object.values(catalog).every((value) => typeof value === "string" && value.trim()));
  }
  assert.match(dictionary, /recoveryEnUS/);
  assert.match(dictionary, /recovery:/);

  assert.match(routeRuntime, /resolveParticipantRouteWithDependencies/);
  assert.match(routeRuntime, /measureServerOperation/);
  assert.match(routeRuntime, /participant-route\.auth/);
  assert.match(classification, /ParticipantRouteDependencyUnavailableError/);
  assert.match(classification, /isExpectedSessionRejection/);
  assert.match(classification, /dependencyUnavailable\(\s*"authentication"/);
  assert.match(classification, /dependencyUnavailable\(\s*"workspace-state"/);
  assert.match(classification, /dependencyUnavailable\("restriction-state"/);
  assert.match(classification, /if \(!projection\)/);
  assert.match(workspaceState, /if \(!activation\) return null;/);
  assert.match(workspaceState, /ParticipantWorkspaceProjectionError\("lifecycle-missing"\)/);
  assert.match(workspaceState, /ParticipantWorkspaceProjectionError\("lifecycle-owner-mismatch"\)/);
});
