import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";
import { applicationDefault, deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { createAdminPermissionGrant } from "../src/domain/admin-authorization/grants.ts";
import { createPlatformAdministratorAuthorityContext } from "../src/domain/admin-authorization/model.ts";
import { createPlatformAdministratorRoleConfiguration } from "../src/domain/admin-authorization/role-configuration.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import {
  createGeographyParticipationAuthorization,
  createPrimaryOperatingGeographySelection,
} from "../src/domain/geography/model.ts";
import {
  accessJourneyId,
  advanceAccessLifecycle,
  associateAccessJourneyWithUser,
  createAccessLifecycle,
} from "../src/domain/lifecycle/model.ts";
import {
  confirmOrganizationLocationDraft,
  createConfirmedOrganizationLocation,
  createOrganizationGeocodeCandidate,
  createOrganizationLocationDraft,
  createOrganizationServiceGeography,
  structuredPostalAddress,
} from "../src/domain/organization-location/model.ts";
import {
  createActivationJourneyContext,
  createActivationLegalAcceptance,
  updateActivationJourneyContext,
} from "../src/domain/onboarding/model.ts";
import {
  createOrganizationCapability,
  evaluateOrganizationProfileCompletion,
  updateEssentialOrganizationProfile,
} from "../src/domain/organization-profile/model.ts";
import { createOrganizationAccount, createOrganizationProfile } from "../src/domain/organizations/model.ts";
import { createOrganizationMembership, createUserIdentity } from "../src/domain/users/model.ts";
import { PORTSMOUTH_CONTROLLED_LOCALITY } from "../src/data/geography/hampton-roads-controlled-locality.ts";

const mode = process.argv[2];
const statePath = process.env.RFXCHANGE_ACCEPTANCE_STATE_FILE?.trim();
const projectId = process.env.RFXCHANGE_EXPECTED_PROJECT_ID?.trim();

assert.ok(["seed", "inspect", "require-reauthentication", "cleanup", "assert-zero"].includes(mode));
assert.ok(statePath, "RFXCHANGE_ACCEPTANCE_STATE_FILE is required.");
assert.ok(projectId, "RFXCHANGE_EXPECTED_PROJECT_ID is required.");
assert.equal(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(), projectId);

const app = initializeApp(
  { credential: applicationDefault(), projectId },
  `stabilization-7-acceptance-${Date.now()}`,
);
const auth = getAuth(app);
const db = getFirestore(app);
const schemaVersion = 1;

async function persist(collection, id, value) {
  const ref = db.collection(collection).doc(String(id));
  assert.equal((await ref.get()).exists, false, `Refusing to overwrite ${ref.path}.`);
  await ref.set({ ...value, schemaVersion });
}

async function firebaseActor(runId, label) {
  const password = `RFxchange-${randomBytes(18).toString("base64url")}!9c`;
  const email = `${runId}-${label}@example.test`;
  const firebase = await auth.createUser({
    email,
    password,
    emailVerified: true,
    displayName: `Stabilization 7 ${label}`,
  });
  const userId = `usr_${createHash("sha256")
    .update(`rfxchange:user:firebase:${firebase.uid}`)
    .digest("hex")
    .slice(0, 32)}`;
  return Object.freeze({
    firebase,
    email,
    password,
    user: createUserIdentity({
      id: userId,
      name: `Stabilization 7 ${label}`,
      primaryEmail: email,
      loginProvider: "firebase",
      loginSubject: firebase.uid,
      now: new Date().toISOString(),
    }),
  });
}

function profileFor(organization, email, now, runId) {
  const base = createOrganizationProfile(organization, {
    id: `profile_${runId}`,
    displayName: `Administrative Acceptance ${runId}`,
    now,
  });
  return updateEssentialOrganizationProfile(base, {
    displayName: base.displayName,
    organizationType: "for-profit-business",
    website: { disposition: "available", url: `https://${runId}.example.test` },
    mainContact: {
      displayName: "Jordan Ellis",
      roleTitle: "Operations Director",
      email,
      publiclyVisible: true,
    },
    capabilities: [
      createOrganizationCapability({
        id: `cap_${runId}`,
        kind: "service",
        category: "professional-business-services",
        name: "Administrative operations support",
        description: "Supports configured administrative acceptance without creating public evidence.",
      }),
    ],
    participationRoles: [],
    businessObjectives: [],
    now,
  });
}

function locationFor(organization, user, membership, now, runId) {
  const candidate = createOrganizationGeocodeCandidate({
    id: `candidate_${runId}`,
    geographyId: String(PORTSMOUTH_CONTROLLED_LOCALITY.id),
    coordinate: [-76.2982, 36.8354],
    matchedAddress: "400 Crawford Street, Portsmouth, VA 23704",
    quality: "rooftop",
    provider: "configured-acceptance-fixture",
    providerReference: `fixture-${runId}`,
    benchmark: "post-wave-3-stabilization-7",
    retrievedAt: now,
  });
  const draft = createOrganizationLocationDraft({
    id: `draft_${runId}`,
    organizationId: String(organization.id),
    requestedByUserId: String(user.id),
    membershipId: String(membership.id),
    primaryGeographyId: String(PORTSMOUTH_CONTROLLED_LOCALITY.id),
    physicalAddress: structuredPostalAddress({
      addressLine1: "400 Crawford Street",
      locality: "Portsmouth",
      regionCode: "VA",
      postalCode: "23704",
    }),
    isHomeOrPrivate: false,
    visibility: "approximate",
    candidates: [candidate],
    now,
  });
  const confirmation = confirmOrganizationLocationDraft(draft, candidate.id, now);
  return createConfirmedOrganizationLocation({
    draft: confirmation.draft,
    candidate: confirmation.candidate,
    confirmedByUserId: String(user.id),
    confirmedByMembershipId: String(membership.id),
    now,
  });
}

function openLifecycle(user, organization, membership, profile, now, runId) {
  const journeyId = `activation-${String(user.id)}`;
  let lifecycle = createAccessLifecycle({ id: journeyId, now });
  lifecycle = advanceAccessLifecycle(lifecycle, "account-started", now);
  lifecycle = associateAccessJourneyWithUser(lifecycle, user.id, now);
  for (const state of [
    "account-activated",
    "geography-selected",
    "organization-resolved",
    "organization-registered",
    "organization-activated",
    "controlled-platform",
    "open-platform",
  ]) lifecycle = advanceAccessLifecycle(lifecycle, state, now);

  let activation = createActivationJourneyContext({
    userId: user.id,
    provisionalOrganizationName: profile.displayName,
    organizationRelationship: "authorized-representative",
    organizationIdentitySeed: {
      websiteDisposition: "available",
      websiteUrl: profile.website.url,
    },
    now,
  });
  activation = updateActivationJourneyContext(activation, {
    legalAcceptance: createActivationLegalAcceptance(now),
    orientationBridgeAcknowledgedAt: now,
    organizationId: organization.id,
    membershipId: membership.id,
    now,
  });
  return Object.freeze({
    lifecycle,
    activation,
    selection: createPrimaryOperatingGeographySelection(
      user.id,
      accessJourneyId(journeyId),
      PORTSMOUTH_CONTROLLED_LOCALITY.id,
      now,
    ),
    geographyAuthorization: createGeographyParticipationAuthorization(
      PORTSMOUTH_CONTROLLED_LOCALITY,
      {
        id: `geography-auth-${runId}-${String(user.id)}`,
        subject: { kind: "user", userId: user.id },
        activities: ["network-participation"],
        now,
      },
    ),
  });
}

function administratorAccount(actor, administratorId, rolePresetKeys, permissions, now) {
  return Object.freeze({
    administratorId,
    subject: actor.firebase.uid,
    protectedAccount: false,
    status: "active",
    access: createPlatformAdministratorRoleConfiguration({
      administratorId,
      rolePresetKeys,
      addedPermissions: permissions,
      createdAt: now,
    }),
    scopeLimits: ["GLOBAL"],
    security: {
      locked: false,
      credentialResetRequired: false,
      mfaRequired: false,
      reauthenticationRequiredAfter: null,
      sessionsTerminatedAt: null,
    },
    createdAt: now,
    updatedAt: now,
  });
}

async function seed() {
  assert.equal(
    (await db.collection("geographies").doc(String(PORTSMOUTH_CONTROLLED_LOCALITY.id)).get()).exists,
    true,
  );

  const runId = `s7-${Date.now()}-${randomBytes(3).toString("hex")}`;
  const now = new Date().toISOString();
  const createdActors = [];
  const createdRecordRefs = [];
  try {
  const superAdmin = await firebaseActor(runId, "super-admin");
  createdActors.push(superAdmin);
  const narrowAdmin = await firebaseActor(runId, "narrow-admin");
  createdActors.push(narrowAdmin);
  const participant = await firebaseActor(runId, "participant");
  createdActors.push(participant);
  const organization = createOrganizationAccount({ id: `org_${runId}`, now });
  const superMembership = createOrganizationMembership(superAdmin.user, organization, {
    id: `membership_${runId}_super`,
    now,
  });
  const participantMembership = createOrganizationMembership(participant.user, organization, {
    id: `membership_${runId}_participant`,
    now,
  });
  const profile = profileFor(organization, superAdmin.email, now, runId);
  const location = locationFor(organization, superAdmin.user, superMembership, now, runId);
  const serviceGeography = createOrganizationServiceGeography({
    organizationId: String(organization.id),
    primaryGeographyId: String(PORTSMOUTH_CONTROLLED_LOCALITY.id),
    serviceGeographyIds: [String(PORTSMOUTH_CONTROLLED_LOCALITY.id)],
    updatedByUserId: String(superAdmin.user.id),
    updatedByMembershipId: String(superMembership.id),
    now,
  });
  const completion = evaluateOrganizationProfileCompletion({
    profile,
    location,
    serviceGeographies: serviceGeography,
    now,
  });
  assert.equal(completion.status, "active");
  const superLifecycle = openLifecycle(superAdmin.user, organization, superMembership, profile, now, runId);
  const participantLifecycle = openLifecycle(participant.user, organization, participantMembership, profile, now, runId);
  const superAdminId = `admin_${runId}_super`;
  const narrowAdminId = `admin_${runId}_narrow`;
  const superPermissions = ["organization.claim.read", "provider.application.read"];
  const narrowPermissions = ["provider.application.read"];
  const superAccount = administratorAccount(superAdmin, superAdminId, ["super-admin"], superPermissions, now);
  const narrowAccount = administratorAccount(narrowAdmin, narrowAdminId, ["platform-administrator"], narrowPermissions, now);
  const superAuthority = createPlatformAdministratorAuthorityContext({
    administratorId: superAdminId,
    rolePresetKeys: ["super-admin"],
    effectivePermissions: superPermissions,
  });
  const narrowAuthority = createPlatformAdministratorAuthorityContext({
    administratorId: narrowAdminId,
    rolePresetKeys: ["platform-administrator"],
    effectivePermissions: narrowPermissions,
  });
  const grants = [
    createAdminPermissionGrant({
      id: `grant_${runId}_super_claims`,
      administratorId: superAdminId,
      permission: "organization.claim.read",
      scope: "GLOBAL",
      createdAt: now,
    }),
    createAdminPermissionGrant({
      id: `grant_${runId}_super_providers`,
      administratorId: superAdminId,
      permission: "provider.application.read",
      scope: "GLOBAL",
      createdAt: now,
    }),
    createAdminPermissionGrant({
      id: `grant_${runId}_narrow_providers`,
      administratorId: narrowAdminId,
      permission: "provider.application.read",
      scope: "GLOBAL",
      createdAt: now,
    }),
  ];
  const records = [
    ["users", superAdmin.user.id, superAdmin.user],
    ["users", narrowAdmin.user.id, narrowAdmin.user],
    ["users", participant.user.id, participant.user],
    ["organizations", organization.id, organization],
    ["organizationProfiles", profile.id, profile],
    ["organizationMemberships", superMembership.id, superMembership],
    ["organizationMemberships", participantMembership.id, participantMembership],
    ["organizationAuthorizations", superMembership.id, createOrganizationUserAuthorization(superMembership, organization, { roleKey: "primary-administrator", permissions: ["organization.profile.manage"], now })],
    ["organizationAuthorizations", participantMembership.id, createOrganizationUserAuthorization(participantMembership, organization, { roleKey: "viewer", permissions: [], now })],
    ["activationJourneyContexts", superAdmin.user.id, superLifecycle.activation],
    ["activationJourneyContexts", participant.user.id, participantLifecycle.activation],
    ["accessJourneys", superLifecycle.lifecycle.id, superLifecycle.lifecycle],
    ["accessJourneys", participantLifecycle.lifecycle.id, participantLifecycle.lifecycle],
    ["primaryGeographySelections", superAdmin.user.id, superLifecycle.selection],
    ["primaryGeographySelections", participant.user.id, participantLifecycle.selection],
    ["geographyParticipationAuthorizations", superLifecycle.geographyAuthorization.id, superLifecycle.geographyAuthorization],
    ["geographyParticipationAuthorizations", participantLifecycle.geographyAuthorization.id, participantLifecycle.geographyAuthorization],
    ["organizationLocations", organization.id, location],
    ["organizationServiceGeographies", organization.id, serviceGeography],
    ["organizationProfileCompletions", organization.id, completion],
    ["platformAdministrators", superAdminId, superAccount],
    ["platformAdministrators", narrowAdminId, narrowAccount],
    ["adminAuthorityContexts", superAdminId, superAuthority],
    ["adminAuthorityContexts", narrowAdminId, narrowAuthority],
    ...grants.map((grant) => ["adminPermissionGrants", grant.id, grant]),
  ];

  for (const [collection, id, value] of records) {
    await persist(collection, id, value);
    createdRecordRefs.push(db.collection(collection).doc(String(id)));
  }

  const state = {
    runId,
    projectId,
    organizationId: String(organization.id),
    superAdminId,
    actors: {
      superAdmin: { email: superAdmin.email, password: superAdmin.password, firebaseUid: superAdmin.firebase.uid },
      narrowAdmin: { email: narrowAdmin.email, password: narrowAdmin.password, firebaseUid: narrowAdmin.firebase.uid },
      participant: { email: participant.email, password: participant.password, firebaseUid: participant.firebase.uid },
    },
    createdRecords: records.map(([collection, id]) => [collection, String(id)]),
  };
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  await chmod(statePath, 0o600);
  console.log(JSON.stringify({ seeded: true, runId, projectId, createdRecords: records.length, authUsers: 3 }));
  } catch (error) {
    await Promise.allSettled(createdRecordRefs.map((ref) => ref.delete()));
    await Promise.allSettled(createdActors.map((actor) => auth.deleteUser(actor.firebase.uid)));
    throw error;
  }
}

async function loadState() {
  const state = JSON.parse(await readFile(statePath, "utf8"));
  assert.equal(state.projectId, projectId);
  return state;
}

async function inspect() {
  const state = await loadState();
  for (const [collection, id] of state.createdRecords) {
    assert.equal((await db.collection(collection).doc(id).get()).exists, true, `${collection}/${id} is missing.`);
  }
  for (const actor of Object.values(state.actors)) assert.equal((await auth.getUser(actor.firebaseUid)).disabled, false);
  console.log(JSON.stringify({ inspected: true, records: state.createdRecords.length, authUsers: 3 }));
}

async function requireReauthentication() {
  const state = await loadState();
  const ref = db.collection("platformAdministrators").doc(state.superAdminId);
  const snapshot = await ref.get();
  assert.equal(snapshot.exists, true);
  const requiredAfter = new Date().toISOString();
  await ref.update({
    "security.reauthenticationRequiredAfter": requiredAfter,
    "security.sessionsTerminatedAt": requiredAfter,
    updatedAt: requiredAfter,
  });
  console.log(JSON.stringify({ reauthenticationRequired: true, administratorId: state.superAdminId, requiredAfter }));
}

async function cleanup() {
  const state = await loadState();
  const refs = state.createdRecords.map(([collection, id]) => db.collection(collection).doc(id));
  while (refs.length) {
    const batch = db.batch();
    for (const ref of refs.splice(0, 400)) batch.delete(ref);
    await batch.commit();
  }
  await Promise.all(Object.values(state.actors).map((actor) =>
    auth.deleteUser(actor.firebaseUid).catch((error) => {
      if (error?.code !== "auth/user-not-found") throw error;
    }),
  ));
  await assertZero(state);
  console.log(JSON.stringify({ cleaned: true, residualRecords: 0, residualAuthUsers: 0 }));
}

async function assertZero(stateInput) {
  const state = stateInput ?? await loadState();
  const residualRecords = [];
  for (const [collection, id] of state.createdRecords) {
    if ((await db.collection(collection).doc(id).get()).exists) residualRecords.push(`${collection}/${id}`);
  }
  assert.deepEqual(residualRecords, []);
  for (const actor of Object.values(state.actors)) {
    await auth.getUser(actor.firebaseUid).then(
      () => assert.fail("Residual Auth user"),
      (error) => assert.equal(error?.code, "auth/user-not-found"),
    );
  }
  if (!stateInput) console.log(JSON.stringify({ zeroResidual: true, residualRecords: 0, residualAuthUsers: 0 }));
}

try {
  if (mode === "seed") await seed();
  if (mode === "inspect") await inspect();
  if (mode === "require-reauthentication") await requireReauthentication();
  if (mode === "cleanup") await cleanup();
  if (mode === "assert-zero") await assertZero();
} finally {
  await deleteApp(app);
}
