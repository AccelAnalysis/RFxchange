import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [
  home,
  joinPage,
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

assert.ok(home.includes('href="/join"'), "Public Join must enter the activation journey.");
assert.ok(
  home.includes('href="/signin"') && home.includes(">Sign in</Link>"),
  "Public home must expose a direct returning-user Sign in entry alongside Join.",
);
assert.ok(joinPage.includes("ActivationJourneyClient"), "The /join route must render the real activation client.");
assert.ok(signInPage.includes("SignInClient") && signInPage.includes("safeReturnTo"), "The /signin route must render returning-user sign-in and constrain return targets.");
assert.ok(
  signInClient.includes("signInWithEmailAndPassword") &&
    signInClient.includes('window.location.assign("/join")') &&
    signInClient.includes("participantWorkspaceEligible") &&
    signInClient.includes("isAdministrativeReturnTarget") &&
    signInClient.includes("returnTo ?? workspaceUrl") &&
    signInClient.includes("resume exactly where you left"),
  "Returning-user sign in must establish the trusted session, resume incomplete activation, keep admin routing independent, and return lifecycle-eligible participants to the protected target/Exchange.",
);

for (const requirement of [
  "registerWithEmailAndPassword",
  "signInWithEmailAndPassword",
  "sendVerificationEmail",
  "select-geography",
  "search-organizations",
  "create-organization",
  "begin-location",
  "confirm-location",
  "save-profile",
  "MapboxLocalityCanvas",
  "Confirm this map position",
  "Your real marker is active",
  "ORGANIZATION_PARTICIPATION_ROLES.map",
  "ORGANIZATION_BUSINESS_OBJECTIVES.map",
  "ORGANIZATION_RELATIONSHIPS.map",
]) {
  assert.ok(client.includes(requirement), `Activation client is missing ${requirement}.`);
}
assert.ok(
  !client.includes('<Link href="/" aria-label="RFxchange home"><BrandWordmark compact /></Link>'),
  "Activation header must not wrap the already-linked BrandWordmark in another anchor.",
);
assert.ok(
  client.includes('>Register</button>') && client.includes('>Sign in</button>') && client.includes('setAuthMode("signin")'),
  "Activation entry must preserve an in-context sign-in fallback and return to it after registration/sign-out recovery.",
);
assert.ok(!client.includes("Harborlight") && !client.includes("200 High St"), "Production activation must not depend on deterministic preview identities.");

for (const requirement of [
  "issueSessionCookie",
  "csrfVerified: true",
  "ACTIVATION_CSRF_COOKIE",
  "httpOnly: true",
  "createServerActivationJourneyService",
  "organizationRelationship",
  "FirestorePlatformAdministratorLifecycleRepository",
  "existingContext || provisionalOrganizationName",
]) {
  assert.ok(sessionRoute.includes(requirement), `Trusted session exchange is missing ${requirement}.`);
}

for (const action of [
  "accept-legal",
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
  coordinator.includes('"organization-activated"') && coordinator.includes('"controlled-platform"') && !coordinator.includes('"open-platform"'),
  "Integration gate must stop at controlled-platform and never manufacture OPEN.",
);
assert.ok(
  coordinator.includes("orientationBridgeAcknowledgedAt") && !coordinator.includes("EDU-001") && !coordinator.includes("EDU-008"),
  "Orientation bridge must preserve runtime position without writing EDU completion.",
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
  authClient.includes("configuredAuthEmulatorUrl") && authClient.includes("NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL") && !authClient.includes('return "http://127.0.0.1:9099"'),
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
  "never grants organization authority or any permission",
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
assert.equal(participantRuntime.includes('state.nextStep !== "complete"'), false, "UI next-step labels must not become participant authorization criteria.");

for (const requirement of [
  "resolveParticipantRoute",
  "createFirestoreOrganizationMarkerRepositories",
  "projectPublicOrganizationMarker",
  "TigerWebBoundarySnapshotRepository",
  "accessibleLocationLabel",
  "pointOverlays={pointOverlays}",
  'markerActivation?.status !== "active"',
  'kind: "organization-marker"',
  "activated: true",
]) {
  assert.ok(geographyRoute.includes(requirement), `Controlled Exchange map is missing ${requirement}.`);
}
assert.equal(geographyRoute.includes("map remains usable as a preview"), false, "Anonymous preview fallback must not return to the protected map route.");

const architectureLower = architecture.toLowerCase();
for (const phrase of [
  "no feature-id completion change",
  "does not complete `edu-001`–`edu-008`",
  "participant-created organization",
  "real active marker",
  "public visitors receive the marketing/authentication surface only",
  "free account is a real rfxchange account",
]) {
  assert.ok(architectureLower.includes(phrase), `Activation/convergence architecture authority is missing: ${phrase}`);
}
assert.ok(
  architecture.includes("Organization Activated") && architecture.includes("Controlled Exchange") && architecture.includes("OPEN"),
  "Architecture must distinguish marker activation, controlled workspace access and future OPEN.",
);

console.log(
  "Activation + Runtime Convergence Gate validated: public marketing/auth entry, safe returning-user routing, trusted Firebase session, canonical activation orchestration, lifecycle-authoritative account-only participant routing, real marker rendering, canonical roles/objectives/relationship metadata, and controlled-platform stop.",
);