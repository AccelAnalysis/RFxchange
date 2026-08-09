import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("application recovery boundary offers retry without exposing server details", async () => {
  const [boundary, styles, routeRuntime, classification, workspaceState] = await Promise.all([
    read("app/error.tsx"),
    read("app/error.module.css"),
    read("src/infrastructure/auth/participant-route-runtime.ts"),
    read("src/infrastructure/auth/participant-route-classification.ts"),
    read("src/infrastructure/auth/participant-workspace-state.ts"),
  ]);

  assert.match(boundary, /Your RFxchange progress is still here\./);
  assert.match(boundary, /account, organization,\s*profile, and activation progress are not reset/);
  assert.match(boundary, /onClick=\{reset\}/);
  assert.match(boundary, /RFxchange home/);
  assert.match(boundary, /error\.digest/);
  assert.doesNotMatch(boundary, /error\.message/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /@media \(max-width: 520px\)/);

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
