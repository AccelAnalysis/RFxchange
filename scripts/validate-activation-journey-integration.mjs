import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [
  home,
  joinPage,
  geographyRoute,
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
  read("app/geography/canvas/page.tsx"),
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
assert.ok(joinPage.includes("ActivationJourneyClient"), "The /join route must render the real activation client.");

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
]) {
  assert.ok(client.includes(requirement), `Activation client is missing ${requirement}.`);
}
assert.ok(
  !client.includes('<Link href="/" aria-label="RFxchange home"><BrandWordmark compact /></Link>'),
  "Activation header must not wrap the already-linked BrandWordmark in another anchor.",
);
assert.ok(
  client.includes('>Register</button>') &&
    client.includes('>Sign in</button>') &&
    client.includes('setAuthMode("signin")'),
  "Activation entry must expose an explicit returning-user Sign in mode and return to it after registration/sign-out recovery.",
);
assert.ok(
  !client.includes("Harborlight") && !client.includes("200 High St"),
  "Production activation must not depend on deterministic Slice 2.x preview identities.",
);

for (const requirement of [
  "issueSessionCookie",
  "csrfVerified: true",
  "ACTIVATION_CSRF_COOKIE",
  "httpOnly: true",
  "createServerActivationJourneyService",
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
  activationRoute.includes("authenticateSessionCookie") &&
    activationRoute.includes("email-verification-required"),
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
  coordinator.includes('"organization-activated"') &&
    coordinator.includes('"controlled-platform"') &&
    !coordinator.includes('"open-platform"'),
  "Integration gate must stop at controlled-platform and never manufacture OPEN.",
);
assert.ok(
  coordinator.includes("orientationBridgeAcknowledgedAt") &&
    !coordinator.includes("EDU-001") &&
    !coordinator.includes("EDU-008"),
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

assert.ok(
  activationContext.includes("orientationBridgeAcknowledgedAt") &&
    activationContext.includes("legalAcceptance") &&
    activationContext.includes("activeLocationDraftId"),
  "Activation context must support resumable registration without claiming canonical authority.",
);

for (const requirement of [
  "createFirestoreOrganizationMarkerRepositories",
  "projectPublicOrganizationMarker",
  "TigerWebBoundarySnapshotRepository",
  "accessibleLocationLabel",
  "pointOverlays={pointOverlays}",
]) {
  assert.ok(
    geographyRoute.includes(requirement),
    `Controlled Exchange map is missing persisted marker projection requirement: ${requirement}.`,
  );
}
assert.ok(
  geographyRoute.includes('activation?.status === "active"') &&
    geographyRoute.includes('kind: "organization-marker"') &&
    geographyRoute.includes("activated: true"),
  "Only a real active marker may be rendered as the participant's activated organization marker.",
);

const architectureLower = architecture.toLowerCase();
for (const phrase of [
  "no feature-id completion change",
  "does not complete `edu-001`–`edu-008`",
  "never advances `open-platform`",
  "participant-created organization",
  "real active marker",
]) {
  assert.ok(
    architectureLower.includes(phrase),
    `Activation architecture authority is missing: ${phrase}`,
  );
}

console.log(
  "Activation Journey Integration Gate validated: public Join, explicit returning-user sign in, valid wordmark markup, trusted Firebase session, canonical runtime order, resumable server orchestration, real geocoding/profile/marker activation, privacy-safe real marker rendering, audited creator authority, orientation non-completion, and controlled-platform stop.",
);
