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
  assert.match(account, /Opportunity participation/);
  assert.match(account, /Every RFxchange organization can discover and respond/);
  assert.doesNotMatch(account, /EssentialProfilePanel/);
  assert.doesNotMatch(account, /Harborlight/i);
  assert.doesNotMatch(account, />Participation roles</);
  assert.doesNotMatch(account, />Business objectives</);
  assert.doesNotMatch(account, /Controlled Exchange/);
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

test("sign-in is authentication-only and account setup follows successful authentication", async () => {
  const session = await source("app/api/auth/session/route.ts");
  assert.match(session, /issueSessionCookie/);
  assert.match(session, /existingContext \|\| provisionalOrganizationName/);
  assert.match(session, /let state = null/);
  assert.doesNotMatch(session, /Organization name is required to begin participant activation/);

  const signIn = await source("src/components/auth/SignInClient.tsx");
  assert.match(signIn, /isAdministrativeReturnTarget/);
  assert.match(signIn, /ActivationJourneyState \| null/);
  assert.match(signIn, /returnTo === "\/admin"/);
  assert.match(signIn, /\/join\?begin=1/);
  assert.doesNotMatch(signIn, /Organization name/);
});

test("activation uses categorized capabilities and universal buyer-supplier participation", async () => {
  const client = await source("src/components/onboarding/ActivationJourneyClient.tsx");
  assert.match(client, /ORGANIZATION_CAPABILITY_CATEGORIES\.map/);
  assert.match(client, /Capability category/);
  assert.match(client, /Other category/);
  assert.match(client, /Every activated organization can both issue and respond to opportunities/);
  assert.match(client, /ORGANIZATION_RELATIONSHIPS\.map/);
  assert.doesNotMatch(client, /ORGANIZATION_PARTICIPATION_ROLES\.map/);
  assert.doesNotMatch(client, /ORGANIZATION_BUSINESS_OBJECTIVES\.map/);
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

test("activation context carries organization identity signals forward", async () => {
  const onboarding = await source("src/domain/onboarding/model.ts");
  assert.match(onboarding, /organizationIdentitySeed/);
  assert.match(onboarding, /websiteDisposition/);
  assert.match(onboarding, /websiteUrl/);
  assert.match(onboarding, /phone/);
  const coordinator = await source("src/application/onboarding/activation-journey.ts");
  assert.match(coordinator, /profileSeed/);
  assert.match(coordinator, /context\.user\.name/);
  assert.match(coordinator, /context\.user\.primaryEmail/);
  assert.match(coordinator, /normalizedWebsiteUrl/);
});

test("locality search is cached, debounced and exposed as an accessible combobox", async () => {
  const route = await source("app/api/onboarding/activation/route.ts");
  assert.match(route, /LOCALITY_CACHE_TTL_MS/);
  assert.match(route, /localitySuggestionCache/);
  const client = await source("src/components/onboarding/ActivationJourneyClient.tsx");
  assert.match(client, /setTimeout/);
  assert.match(client, /AbortController/);
  assert.match(client, /role="combobox"/);
  assert.match(client, /role="listbox"/);
  assert.match(client, /aria-activedescendant/);
});

test("customer-facing activation copy enters the Exchange without internal terminology", async () => {
  const client = await source("src/components/onboarding/ActivationJourneyClient.tsx");
  assert.match(client, /Your organization is ready/);
  assert.match(client, />Enter the Exchange</);
  assert.doesNotMatch(client, /controlled Exchange/i);
});

test("public root preserves distinct Join and Sign in entry points", async () => {
  const root = await source("app/page.tsx");
  assert.match(root, /href="\/join"/);
  assert.match(root, /href="\/signin"/);
});
