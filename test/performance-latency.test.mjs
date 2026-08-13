import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("login reuses one activation hydration and returning users skip geography seeding", async () => {
  const session = await source("app/api/auth/session/route.ts");
  const journey = await source("src/application/onboarding/activation-journey.ts");

  assert.match(session, /activation\.bootstrap\(issued\.context, provisionalOrganizationName\)/);
  assert.doesNotMatch(session, /activation\.state\(issued\.context\)/);
  assert.match(session, /"activation-state"/);
  assert.match(session, /"session-cookie"/);

  const bootstrap = journey.slice(journey.indexOf("async bootstrap("), journey.indexOf("async acceptLegal("));
  assert.match(bootstrap, /let activation = await this\.dependencies\.contexts\.getByUserId/);
  assert.match(bootstrap, /if \(!activation\) \{/);
  assert.match(bootstrap, /Promise\.all\(/);
  assert.match(bootstrap, /this\.dependencies\.releasedGeographies\.map/);
  assert.match(bootstrap, /return this\.stateFor\(context, activation\)/);
  assert.ok(
    bootstrap.indexOf("if (!activation)") < bootstrap.indexOf("this.dependencies.releasedGeographies.map"),
    "Released-geography initialization must remain inside first-time activation creation.",
  );
});

test("optimized login preserves acquisition context without replacing the map-first destination", async () => {
  const session = await source("app/api/auth/session/route.ts");
  assert.match(session, /function withBoundAcquisition/);
  assert.match(session, /acquisitionContext: acquisitionState\(context\)/);
  assert.doesNotMatch(session, /"\/acquisition\/continue"/);
  assert.match(session, /state = withBoundAcquisition\(state, boundAcquisition\)/);
});

test("successful Firebase authentication does not immediately force a second token refresh", async () => {
  const browserAuth = await source("src/infrastructure/auth/firebase-browser.ts");
  assert.match(browserAuth, /const freshlyAuthenticated = new WeakSet<Auth>\(\)/);
  assert.match(browserAuth, /freshlyAuthenticated\.add\(this\.auth\)/);
  assert.match(browserAuth, /const justAuthenticated = freshlyAuthenticated\.delete\(this\.auth\)/);
  assert.match(browserAuth, /getIdToken\(forceRefresh && !justAuthenticated\)/);
});

test("activation state hydrates independent persistence in parallel", async () => {
  const journey = await source("src/application/onboarding/activation-journey.ts");
  const stateFor = journey.slice(journey.indexOf("private async stateFor("), journey.indexOf("private nextStep("));
  assert.match(stateFor, /Promise\.all\(\[\s*this\.dependencies\.lifecycle\.getById/);
  assert.match(stateFor, /this\.dependencies\.selections\.getByUserId/);
  assert.match(stateFor, /this\.dependencies\.accountSecurity\.inspect/);
  assert.match(stateFor, /this\.dependencies\.resolutions\.getByAccessJourneyId/);
  assert.match(stateFor, /this\.dependencies\.memberships\.listActiveByUserId/);
  assert.match(stateFor, /const \[selectedDefinition, organization, profile, location, completion, marker\] = await Promise\.all/);
  assert.doesNotMatch(stateFor, /orientations\.getById/);
});

test("activation actions use narrow preconditions instead of pre-hydrating full state", async () => {
  const route = await source("app/api/onboarding/activation/route.ts");
  assert.match(route, /async function legalAccepted/);
  assert.match(route, /async function verifiedEmail/);
  assert.match(route, /synchronizeActivationContextFromActiveMembership/);

  for (const action of ["begin-location", "confirm-location", "save-profile", "create-organization", "select-existing-organization"]) {
    const start = route.indexOf(`case "${action}"`);
    assert.notEqual(start, -1, `Missing ${action} action.`);
    const nextCase = route.indexOf("case \"", start + 6);
    const block = route.slice(start, nextCase === -1 ? undefined : nextCase);
    assert.doesNotMatch(block, /synchronizedState\(/, `${action} must not hydrate full state before the operation.`);
  }
});

test("protected participant routes use a lightweight workspace projection", async () => {
  const runtime = await source("src/infrastructure/auth/participant-route-runtime.ts");
  const projection = await source("src/infrastructure/auth/participant-workspace-state.ts");

  assert.match(runtime, /loadParticipantWorkspaceProjection/);
  assert.doesNotMatch(runtime, /createServerActivationJourneyService/);
  assert.doesNotMatch(runtime, /ActivationJourneyState/);
  assert.match(projection, /activation context \+ active memberships/);
  assert.match(projection, /access lifecycle/);
  for (const heavyDependency of [
    "accountSecurity.inspect",
    "markerActivations",
    "completions.getByOrganizationId",
    "locations.getByOrganizationId",
    "profiles.getByOrganizationId",
  ]) {
    assert.equal(projection.includes(heavyDependency), false, `Workspace route projection must not hydrate ${heavyDependency}.`);
  }
});

test("account marker status remains authoritative even when map projection is unavailable", async () => {
  const profilePage = await source("app/organization-profile/page.tsx");
  assert.match(profilePage, /createFirestoreOrganizationMarkerRepositories/);
  assert.match(profilePage, /markerRepositories\.activations\.getByOrganizationId\(organizationId\)/);
  assert.match(profilePage, /markerActivation\?\.status === "active"/);
  assert.doesNotMatch(profilePage, /mapProjection \? "Active" : "Not active"/);
});

test("client transitions avoid full browser reloads and activation entry is immediately available", async () => {
  const paths = [
    "src/components/auth/SignInClient.tsx",
    "src/components/auth/SignOutButton.tsx",
    "src/components/first-value/FirstValueChoiceClient.tsx",
    "src/components/onboarding/SpatialActivationExperience.tsx",
  ];
  const sources = await Promise.all(paths.map(source));
  for (const [index, value] of sources.entries()) {
    assert.doesNotMatch(value, /window\.location\.assign/, `${paths[index]} must use Next.js navigation.`);
  }

  const spatial = sources[3];
  assert.match(spatial, /router\.prefetch\(workspaceUrl\)/);
  assert.match(spatial, /router\.replace\(workspaceUrl\)/);
  assert.match(spatial, /reducedMotion \? 50 : 900/);
  assert.match(spatial, />Enter now</);
  assert.doesNotMatch(spatial, /3_400/);
});

test("critical server paths expose named latency measurements", async () => {
  const timing = await source("src/infrastructure/observability/server-timing.ts");
  const session = await source("app/api/auth/session/route.ts");
  const activation = await source("app/api/onboarding/activation/route.ts");
  const spatialModel = await source("app/api/onboarding/spatial-model/route.ts");
  const participantMap = await source("src/infrastructure/geography/participant-map-runtime.ts");

  assert.match(timing, /Server-Timing/);
  assert.match(timing, /rfx\.server-timing/);
  for (const label of ["session-cookie", "activation-state", "firestore-context"]) {
    assert.ok(session.includes(label), `Session timing must include ${label}.`);
  }
  for (const label of ["auth", "firestore-precondition", "account-security", "geocoder"]) {
    assert.ok(activation.includes(label), `Activation timing must include ${label}.`);
  }
  assert.match(spatialModel, /"map-model"/);
  assert.match(participantMap, /"map-model"/);
});
