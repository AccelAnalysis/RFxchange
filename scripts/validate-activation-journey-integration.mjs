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
  existingWorkspace,
  participantMapRuntime,
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
  read("src/components/participant/ExistingWorkspaceFoundation.tsx"),
  read("src/infrastructure/geography/participant-map-runtime.ts"),
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

assert.ok(home.includes('href="/join"'), "Public Join must enter the activation journey.");
assert.ok(
  home.includes('href="/signin"') && home.includes(">Sign in</Link>"),
  "Public home must expose a direct returning-user Sign in entry alongside Join.",
);
assert.ok(
  joinPage.includes("SpatialActivationExperience") &&
    spatialActivation.includes("ActivationJourneyClient"),
  "The /join route must compose the real activation client through the canonical spatial activation runtime.",
);
assert.ok(
  signInPage.includes("SignInClient") && signInPage.includes("safeReturnTo"),
  "The /signin route must render returning-user sign-in and constrain return targets.",
);
assert.ok(
  signInClient.includes("signInWithEmailAndPassword") &&
    signInClient.includes('window.location.assign("/join?begin=1")') &&
    signInClient.includes("participantWorkspaceEligible") &&
    signInClient.includes("isAdministrativeReturnTarget") &&
    signInClient.includes("returnTo ?? workspaceUrl") &&
    signInClient.includes("resume exactly where you left"),
  "Returning-user sign in must establish the trusted session, resume incomplete activation, keep admin routing independent, route new accounts to setup, and return lifecycle-eligible participants to the protected target/Exchange.",
);
assert.equal(
  signInClient.includes("Organization name"),
  false,
  "Sign in must not ask for organization name.",
);

const authenticatedMapSurface = `${geographyRoute}\n${existingWorkspace}\n${participantMapRuntime}`;
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
  "real marker can be active",
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
assert.ok(
  client.includes('href="/terms"') &&
    client.includes('href="/platform-rules"') &&
    client.includes('href="/privacy"'),
  "Activation policy acceptance must expose the current readable legal documents.",
);
assert.ok(
  client.includes("reloadCurrentPrincipal") &&
    client.includes("await exchangeSession()") &&
    client.includes("Firebase still reports this email as unverified"),
  "Email verification must be observable and refresh the trusted RFxchange session after Firebase verification.",
);
assert.ok(
  !client.includes('<Link href="/" aria-label="RFxchange home"><BrandWordmark compact /></Link>'),
  "Activation header must not wrap the already-linked BrandWordmark in another anchor.",
);
assert.ok(
  client.includes('>Register</button>') &&
    client.includes('>Sign in</button>') &&
    client.includes('setAuthMode("signin")'),
  "Activation entry must preserve an in-context sign-in fallback and return to it after registration/sign-out recovery.",
);
assert.ok(
  !client.includes("Harborlight") && !client.includes("200 High St"),
  "Production activation must not depend on deterministic preview identities.",
);
assert.equal(
  client.includes("ORGANIZATION_PARTICIPATION_ROLES.map"),
  false,
  "Activation must not collect permanent participant roles.",
);
assert.equal(
  client.includes("ORGANIZATION_BUSINESS_OBJECTIVES.map"),
  false,
  "Activation must not collect business objectives.",
);
assert.equal(
  client.toLowerCase().includes("controlled exchange"),
  false,
  "Participant-facing activation copy must not expose internal terminology.",
);

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
assert.equal(
  sessionRoute.includes("Organization name is required to begin participant activation"),
  false,
  "Session establishment must not require organization context.",
);

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
assert.ok(
  activationRoute.includes("authenticateSessionCookie") && activationRoute.includes("email-verification-required"),
  "Activation mutations must require the trusted RFxchange session and gate organization resolution on verified email.",
);
assert.ok(
  activationRoute.includes("CensusTigerLocalityDirectory") &&
    activationRoute.includes("definitions.save(geography)"),
  "Home locality selection must resolve and persist Census authority server-side before lifecycle selection.",
);
assert.ok(
  activationRoute.includes("LOCALITY_CACHE_TTL_MS") &&
    activationRoute.includes("localitySuggestionCache"),
  "Locality typeahead must use the bounded server-side suggestion cache.",
);
assert.equal(
  activationRoute.includes("participationRoles"),
  false,
  "Activation API must not accept participant roles.",
);
assert.equal(
  activationRoute.includes("businessObjectives"),
  false,
  "Activation API must not accept business objectives.",
);

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
assert.ok(
  coordinator.includes('"organization-activated"') &&
    coordinator.includes('"controlled-platform"') &&
    !coordinator.match(/advanceAccessLifecycle\([\s\S]{0,120}"open-platform"/),
  "Activation coordinator must stop at controlled-platform; it may route an already-OPEN participant but cannot manufacture OPEN.",
);
assert.ok(
  coordinator.includes("orientationBridgeAcknowledgedAt") &&
    !coordinator.includes("EDU-001") &&
    !coordinator.includes("EDU-008"),
  "Orientation bridge must preserve runtime position without writing EDU completion.",
);
assert.ok(
  coordinator.includes("organizationIdentitySeed") &&
    coordinator.includes("profileSeed") &&
    coordinator.includes("context.user.name") &&
    coordinator.includes("context.user.primaryEmail") &&
    coordinator.includes("normalizedWebsiteUrl") &&
    coordinator.includes("https://${normalized}"),
  "Activation must carry, normalize, and reuse authoritative organization identity and contact data.",
);
assert.equal(
  coordinator.includes("participationRoles:"),
  false,
  "Activation coordinator must not persist participant-role selections.",
);
assert.equal(
  coordinator.includes("businessObjectives:"),
  false,
  "Activation coordinator must not persist objective selections.",
);

assert.ok(
  runtime.includes("CensusOrganizationGeocodingProvider") &&
    runtime.includes("TigerWebBoundarySnapshotRepository") &&
    runtime.includes("FirebaseAccountSecurityService") &&
    runtime.includes("createServerPrimaryOperatingGeographyService") &&
    runtime.includes("createServerOrganizationResolutionService"),
  "Activation runtime must compose real server authorities, Census geocoding and authoritative boundaries.",
);
assert.ok(
  authClient.includes("configuredAuthEmulatorUrl") &&
    authClient.includes("NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL") &&
    !authClient.includes('return "http://127.0.0.1:9099"'),
  "Local Firebase Auth must use the emulator only when explicitly configured.",
);

assert.ok(
  creatorAuthority.includes('standardOrganizationRolePreset("primary-administrator")') &&
    creatorAuthority.includes("emailVerified") &&
    creatorAuthority.includes("organization.authority.creator-established"),
  "A participant-created organization must establish verified creator authority using the standard primary-administrator preset and auditable evidence.",
);
assert.ok(
  creatorAuthorityRepository.includes("establishParticipantCreated") &&
    creatorAuthorityRepository.includes("organizationAuditEvents") &&
    creatorAuthorityRepository.includes("transaction.create(membershipRef") &&
    creatorAuthorityRepository.includes("transaction.create(authorizationRef"),
  "Participant-created authority must atomically persist membership, authorization, lifecycle and audit evidence.",
);

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
assert.equal(
  participantRuntime.includes('state.nextStep !== "complete"'),
  false,
  "UI next-step labels must not become participant authorization criteria.",
);

for (const requirement of [
  "resolveParticipantRoute",
  "createFirestoreOrganizationMarkerRepositories",
  "projectPublicOrganizationMarker",
  "TigerWebBoundarySnapshotRepository",
  "ControlledLocalityMapService",
  ".create(selection)",
  "accessibleLocationLabel",
  "ExistingWorkspaceFoundation",
  "ExchangeSpatialScene",
  'mode="organization"',
  "marker={homeMarker}",
  'markerActivation?.status !== "active"',
]) {
  assert.ok(authenticatedMapSurface.includes(requirement), `Exchange map is missing ${requirement}.`);
}
assert.ok(
  geographyRoute.includes("organizationId={authenticated.organizationId}") &&
    existingWorkspace.includes("Network discovery is not live yet"),
  "B6a must receive server-authorized organization identity and preserve truthful future-domain absence.",
);
assert.equal(
  geographyRoute.includes("map remains usable as a preview"),
  false,
  "Anonymous preview fallback must not return to the protected map route.",
);
assert.equal(
  authenticatedMapSurface.includes("createControlledLocalityPreview"),
  false,
  "Protected Exchange map must never substitute the Portsmouth preview for another persisted locality.",
);

const architectureLower = architecture.toLowerCase();
for (const phrase of [
  "no feature-id completion change",
  "selecting or creating an organization",
  "real marker activation",
  "public visitors receive marketing, authentication and required legal documents only",
  "free account is a real rfxchange account",
  "spatial activation background",
  "every activated organization can both issue and respond",
  "official resource provider boundary",
  "customer-facing terminology",
]) {
  assert.ok(architectureLower.includes(phrase), `Activation/convergence architecture authority is missing: ${phrase}`);
}
assert.ok(
  architecture.includes("Organization Activated") &&
    architecture.includes("controlled-platform") &&
    architecture.includes("OPEN"),
  "Architecture must distinguish marker activation, authenticated workspace access and future OPEN.",
);

console.log(
  "Activation + Runtime Convergence Gate validated: public marketing/auth entry, safe returning-user routing, trusted Firebase session, canonical activation orchestration, spatial onboarding progression, cached Census-authoritative locality selection, lifecycle-authoritative account-only B6a participant routing, real persistent marker rendering, categorized capabilities, universal opportunity participation, carried identity, and controlled-platform stop.",
);