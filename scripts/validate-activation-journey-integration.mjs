import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [
  home,
  joinPage,
  spatialActivation,
  signInPage,
  signInClient,
  geographyRoute,
  participantRuntime,
  client,
  sessionRoute,
  activationRoute,
  coordinator,
  runtime,
  authClient,
  creatorAuthority,
  creatorAuthorityRepository,
  activationContext,
  architecture,
] = await Promise.all([
  read("app/page.tsx"),
  read("app/join/page.tsx"),
  read("src/components/onboarding/SpatialActivationExperience.tsx"),
  read("app/signin/page.tsx"),
  read("src/components/auth/SignInClient.tsx"),
  read("app/geography/canvas/page.tsx"),
  read("src/infrastructure/auth/participant-route-runtime.ts"),
  read("src/components/onboarding/ActivationJourneyClient.tsx"),
  read("app/api/auth/session/route.ts"),
  read("app/api/onboarding/activation/route.ts"),
  read("src/application/onboarding/activation-journey.ts"),
  read("src/infrastructure/onboarding/runtime.ts"),
  read("src/infrastructure/auth/firebase-client.ts"),
  read("src/application/onboarding/participant-created-authority.ts"),
  read("src/infrastructure/firestore/organization-authority-claims.ts"),
  read("src/domain/onboarding/model.ts"),
  read("docs/architecture/ACTIVATION_JOURNEY_INTEGRATION_GATE.md"),
]);

assert.ok(home.includes('href="/join"'));
assert.ok(home.includes('href="/signin"') && home.includes(">Sign in</Link>"));
assert.ok(joinPage.includes("SpatialActivationExperience") && spatialActivation.includes("ActivationJourneyClient"));
assert.ok(signInPage.includes("SignInClient") && signInPage.includes("safeReturnTo"));
assert.ok(
  signInClient.includes("signInWithEmailAndPassword") &&
    signInClient.includes('window.location.assign("/join?begin=1")') &&
    signInClient.includes("participantWorkspaceEligible") &&
    signInClient.includes("isAdministrativeReturnTarget") &&
    signInClient.includes("returnTo ?? workspaceUrl"),
  "Returning-user sign in must authenticate first, resume known activation, and route new accounts to setup.",
);
assert.equal(signInClient.includes("Organization name"), false, "Sign in must not ask for organization name.");

for (const requirement of [
  "registerWithEmailAndPassword",
  "signInWithEmailAndPassword",
  "sendVerificationEmail",
  "search-geographies",
  "select-census-geography",
  "search-organizations",
  "create-organization",
  "begin-location",
  "confirm-location",
  "save-profile",
  "MapboxLocalityCanvas",
  "Confirm this map position",
  "Your real marker is active",
  "ORGANIZATION_RELATIONSHIPS.map",
  "ORGANIZATION_CAPABILITY_CATEGORIES.map",
  'role="combobox"',
  'role="listbox"',
  "AbortController",
  "Your organization is ready",
  "Enter the Exchange",
]) {
  assert.ok(client.includes(requirement), `Activation client is missing ${requirement}.`);
}
assert.equal(client.includes("ORGANIZATION_PARTICIPATION_ROLES.map"), false);
assert.equal(client.includes("ORGANIZATION_BUSINESS_OBJECTIVES.map"), false);
assert.equal(client.toLowerCase().includes("controlled exchange"), false);
assert.ok(client.includes('href="/terms"') && client.includes('href="/platform-rules"') && client.includes('href="/privacy"'));
assert.ok(client.includes("reloadCurrentPrincipal") && client.includes("Firebase still reports this email as unverified"));
assert.ok(client.includes('>Register</button>') && client.includes('>Sign in</button>'));
assert.ok(!client.includes("Harborlight") && !client.includes("200 High St"));

for (const requirement of [
  "ExchangeSpatialScene",
  "activationState !== null",
  '"regional"',
  '"locality"',
  '"organization"',
  "/api/onboarding/home-scene",
  "data-entering-workspace",
]) {
  assert.ok(spatialActivation.includes(requirement), `Spatial activation runtime is missing ${requirement}.`);
}

for (const requirement of [
  "issueSessionCookie",
  "csrfVerified: true",
  "ACTIVATION_CSRF_COOKIE",
  "httpOnly: true",
  "createServerActivationJourneyService",
  "organizationRelationship",
  "existingContext || provisionalOrganizationName",
  "let state = null",
]) {
  assert.ok(sessionRoute.includes(requirement), `Trusted session exchange is missing ${requirement}.`);
}
assert.equal(sessionRoute.includes("Organization name is required to begin participant activation"), false);

for (const action of [
  "accept-legal",
  "search-geographies",
  "select-census-geography",
  "select-geography",
  "acknowledge-orientation-position",
  "search-organizations",
  "create-organization",
  "select-existing-organization",
  "begin-location",
  "confirm-location",
  "save-profile",
]) {
  assert.ok(activationRoute.includes(`case "${action}"`), `Activation API is missing ${action}.`);
}
assert.ok(activationRoute.includes("authenticateSessionCookie") && activationRoute.includes("email-verification-required"));
assert.ok(activationRoute.includes("CensusTigerLocalityDirectory") && activationRoute.includes("definitions.save(geography)"));
assert.ok(activationRoute.includes("LOCALITY_CACHE_TTL_MS") && activationRoute.includes("localitySuggestionCache"));
assert.equal(activationRoute.includes("participationRoles"), false);
assert.equal(activationRoute.includes("businessObjectives"), false);

for (const authority of [
  "PrimaryOperatingGeographyService",
  "OrganizationResolutionService",
  "OrganizationLocationService",
  "EssentialOrganizationProfileService",
  "OrganizationMarkerActivationService",
  "ParticipantCreatedOrganizationAuthorityService",
]) {
  assert.ok(coordinator.includes(authority), `Activation coordinator must consume ${authority}.`);
}
assert.ok(coordinator.includes('"organization-activated"') && coordinator.includes('"controlled-platform"') && !coordinator.includes('"open-platform"'));
assert.ok(coordinator.includes("organizationIdentitySeed") && coordinator.includes("profileSeed"));
assert.ok(coordinator.includes("context.user.name") && coordinator.includes("context.user.primaryEmail"));
assert.equal(coordinator.includes("participationRoles:"), false);
assert.equal(coordinator.includes("businessObjectives:"), false);

assert.ok(
  runtime.includes("CensusOrganizationGeocodingProvider") &&
    runtime.includes("TigerWebBoundarySnapshotRepository") &&
    runtime.includes("FirebaseAccountSecurityService") &&
    runtime.includes("createServerPrimaryOperatingGeographyService") &&
    runtime.includes("createServerOrganizationResolutionService"),
);
assert.ok(authClient.includes("configuredAuthEmulatorUrl") && authClient.includes("NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL"));
assert.ok(creatorAuthority.includes('standardOrganizationRolePreset("primary-administrator")') && creatorAuthority.includes("emailVerified"));
assert.ok(creatorAuthorityRepository.includes("establishParticipantCreated") && creatorAuthorityRepository.includes("organizationAuditEvents"));

for (const requirement of [
  "orientationBridgeAcknowledgedAt",
  "legalAcceptance",
  "activeLocationDraftId",
  "organizationRelationship",
  "organizationIdentitySeed",
  "Descriptive onboarding metadata only",
  "durable control continues to require membership + authorization establishment",
]) {
  assert.ok(activationContext.includes(requirement), `Activation context is missing ${requirement}.`);
}

for (const requirement of [
  "authenticateSessionCookie",
  "controlled-platform",
  "open-platform",
  "memberships.getById",
  "getForOrganization",
  "getForMembership",
  "wrong-organization",
  "restricted",
  "workspaceLifecycleEligible",
]) {
  assert.ok(participantRuntime.includes(requirement), `Participant route runtime is missing ${requirement}.`);
}
assert.equal(participantRuntime.includes('state.nextStep !== "complete"'), false);

for (const requirement of [
  "resolveParticipantRoute",
  "createFirestoreOrganizationMarkerRepositories",
  "projectPublicOrganizationMarker",
  "TigerWebBoundarySnapshotRepository",
  "ControlledLocalityMapService",
  ".create(selection)",
  "accessibleLocationLabel",
  "ExchangeSpatialScene",
  'mode="organization"',
  "marker={authenticated.homeMarker}",
  'markerActivation?.status !== "active"',
]) {
  assert.ok(geographyRoute.includes(requirement), `Exchange map is missing ${requirement}.`);
}
assert.equal(geographyRoute.includes("map remains usable as a preview"), false);
assert.equal(geographyRoute.includes("createControlledLocalityPreview"), false);

const architectureLower = architecture.toLowerCase();
for (const phrase of [
  "no feature-id completion change",
  "participant-created organization",
  "public visitors receive the marketing/authentication surface only",
  "free account is a real rfxchange account",
  "spatial activation background",
  "every activated organization can both issue and respond",
  "official resource provider boundary",
  "customer-facing terminology",
]) {
  assert.ok(architectureLower.includes(phrase), `Activation architecture is missing: ${phrase}`);
}

console.log(
  "Activation convergence validated: authentication-only sign-in, carried identity, cached accessible locality typeahead, categorized capabilities, universal opportunity participation, and customer-facing Exchange copy.",
);
