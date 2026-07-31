import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("participant workspace requires the canonical authenticated route resolver", async () => {
  const canvas = await source("app/geography/canvas/page.tsx");
  assert.match(canvas, /resolveParticipantRoute/);
  assert.match(canvas, /RFXCHANGE_SESSION_COOKIE_NAME/);
  assert.doesNotMatch(canvas, /map remains usable as a preview/i);
  assert.doesNotMatch(canvas, /homeGeographyId:\s*null,\s*markerOverlay:\s*null/);
});

test("participant account is real authenticated organization state rather than a fixture", async () => {
  const account = await source("app/organization-profile/page.tsx");
  assert.match(account, /resolveParticipantRoute/);
  assert.match(account, /getByOrganizationId/);
  assert.doesNotMatch(account, /EssentialProfilePanel/);
  assert.doesNotMatch(account, /Harborlight/i);
});

test("legacy activation routes forward to canonical runtime instead of preview components", async () => {
  for (const path of [
    "app/organization-resolution/page.tsx",
    "app/organization-authority/page.tsx",
    "app/organization-location/page.tsx",
    "app/organization-activation/page.tsx",
  ]) {
    const file = await source(path);
    assert.match(file, /resolveParticipantRoute/);
    assert.match(file, /redirect\(/);
    assert.doesNotMatch(file, /Harborlight/i);
    assert.doesNotMatch(file, /createPortsmouth/);
  }
});

test("administrative routes require persisted authority permissions and scoped grants", async () => {
  const runtime = await source("src/infrastructure/auth/admin-route-runtime.ts");
  assert.match(runtime, /getBySubject/);
  assert.match(runtime, /evaluatePrivilegedAdministratorAccess/);
  assert.match(runtime, /authorizeScopedAdministrativeAction/);
  assert.match(runtime, /listByAdministratorId/);
  assert.doesNotMatch(runtime, /isAdmin/);

  const claims = await source("app/admin/organization-claims/page.tsx");
  assert.match(claims, /organization\.claim\.read/);
  assert.match(claims, /GEOGRAPHY:/);
  assert.doesNotMatch(claims, /Harborlight/i);

  const organization360 = await source("app/admin/organizations/[organizationId]/page.tsx");
  assert.match(organization360, /organization\.profile\.read/);
  assert.match(organization360, /ORGANIZATION:/);
  assert.match(organization360, /buildOrganization360/);
  assert.doesNotMatch(organization360, /createPortsmouthOrganization360Preview/);
});

test("trusted session establishment is not coupled to participant activation for administrators", async () => {
  const session = await source("app/api/auth/session/route.ts");
  assert.match(session, /issueSessionCookie/);
  assert.match(session, /FirestorePlatformAdministratorLifecycleRepository/);
  assert.match(session, /existingContext \|\| provisionalOrganizationName/);
  assert.match(session, /Organization name is required to begin participant activation/);

  const signIn = await source("src/components/auth/SignInClient.tsx");
  assert.match(signIn, /isAdministrativeReturnTarget/);
  assert.match(signIn, /ActivationJourneyState \| null/);
  assert.match(signIn, /returnTo === "\/admin"/);
});

test("onboarding consumes canonical role and objective vocabularies", async () => {
  const client = await source("src/components/onboarding/ActivationJourneyClient.tsx");
  assert.match(client, /ORGANIZATION_PARTICIPATION_ROLES\.map/);
  assert.match(client, /ORGANIZATION_BUSINESS_OBJECTIVES\.map/);
  assert.match(client, /send-receive-referrals/);
  assert.match(client, /Send and receive referrals/);
  assert.match(client, /ORGANIZATION_RELATIONSHIPS\.map/);
  assert.match(client, /does not grant account authority/);
  assert.doesNotMatch(client, /const ROLE_OPTIONS =/);
  assert.doesNotMatch(client, /const OBJECTIVE_OPTIONS =/);
});

test("organization relationship metadata is descriptive and persisted separately from authorization", async () => {
  const onboarding = await source("src/domain/onboarding/model.ts");
  assert.match(onboarding, /ORGANIZATION_RELATIONSHIPS/);
  assert.match(onboarding, /Descriptive onboarding metadata only/);
  assert.match(onboarding, /durable control continues to require membership \+ authorization establishment/);
  const session = await source("app/api/auth/session/route.ts");
  assert.match(session, /organizationRelationship/);
  assert.match(session, /updateActivationJourneyContext/);
});

test("public root preserves distinct Join and Sign in entry points", async () => {
  const root = await source("app/page.tsx");
  assert.match(root, /href="\/join"/);
  assert.match(root, /href="\/signin"/);
});
