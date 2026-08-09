import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";
import {
  applicationDefault,
  deleteApp,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { createPlatformAdministratorAuthorityContext } from "../src/domain/admin-authorization/model.ts";
import { createAdminPermissionGrant } from "../src/domain/admin-authorization/grants.ts";
import { createPlatformAdministratorRoleConfiguration } from "../src/domain/admin-authorization/role-configuration.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import {
  createPrimaryOperatingGeographySelection,
  createGeographyParticipationAuthorization,
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
import {
  createOrganizationAccount,
  createOrganizationProfile,
} from "../src/domain/organizations/model.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
} from "../src/domain/users/model.ts";
import { PORTSMOUTH_CONTROLLED_LOCALITY } from "../src/data/geography/hampton-roads-controlled-locality.ts";

const mode = process.argv[2];
const statePath = process.env.RFXCHANGE_ACCEPTANCE_STATE_FILE?.trim();
const projectId = process.env.RFXCHANGE_EXPECTED_PROJECT_ID?.trim();
assert.ok(["seed", "inspect", "cleanup"].includes(mode));
assert.ok(statePath);
assert.ok(projectId);
assert.equal(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(), projectId);
const app = initializeApp(
  { credential: applicationDefault(), projectId },
  `slice-3-6-acceptance-${Date.now()}`,
);
const auth = getAuth(app);
const db = getFirestore(app);
const schemaVersion = 1;
async function persist(collection, id, value) {
  const ref = db.collection(collection).doc(String(id));
  assert.equal(
    (await ref.get()).exists,
    false,
    `Refusing to overwrite ${collection}/${String(id)}.`,
  );
  await ref.set({ ...value, schemaVersion });
}
function profileFor(organization, email, now, runId) {
  const base = createOrganizationProfile(organization, {
    id: `profile_${organization.id}`,
    displayName: `Provider Foundation ${runId}`,
    now,
  });
  return updateEssentialOrganizationProfile(base, {
    displayName: base.displayName,
    organizationType: "nonprofit-organization",
    website: { disposition: "available", url: `https://${runId}.example.test` },
    mainContact: {
      displayName: "Jordan Ellis",
      roleTitle: "Programs Director",
      email,
      publiclyVisible: true,
    },
    capabilities: [
      createOrganizationCapability({
        id: `cap_${organization.id}`,
        kind: "resource-provider-function",
        category: "professional-business-services",
        name: "Small business technical assistance",
        description:
          "Provides structured contracting and capital-readiness assistance to eligible local organizations.",
      }),
    ],
    participationRoles: ["nonprofit"],
    businessObjectives: ["find-resources-support"],
    now,
  });
}
function locationFor(organization, user, membershipId, now) {
  const candidate = createOrganizationGeocodeCandidate({
    id: `candidate_${organization.id}`,
    geographyId: String(PORTSMOUTH_CONTROLLED_LOCALITY.id),
    coordinate: [-76.2982, 36.8354],
    matchedAddress: "400 Crawford Street, Portsmouth, VA 23704",
    quality: "rooftop",
    provider: "configured-acceptance-fixture",
    providerReference: `fixture-${organization.id}`,
    benchmark: "slice-3.6-configured-acceptance",
    retrievedAt: now,
  });
  const draft = createOrganizationLocationDraft({
    id: `draft_${organization.id}`,
    organizationId: String(organization.id),
    requestedByUserId: String(user.id),
    membershipId,
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
  const confirmation = confirmOrganizationLocationDraft(
    draft,
    candidate.id,
    now,
  );
  return createConfirmedOrganizationLocation({
    draft: confirmation.draft,
    candidate: confirmation.candidate,
    confirmedByUserId: String(user.id),
    confirmedByMembershipId: membershipId,
    now,
  });
}
function openLifecycle(user, organization, membership, profile, now) {
  const journeyId = `activation-${user.id}`;
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
  ])
    lifecycle = advanceAccessLifecycle(lifecycle, state, now);
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
  return {
    journeyId,
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
        id: `geography-auth-${user.id}`,
        subject: { kind: "user", userId: user.id },
        activities: ["network-participation"],
        now,
      },
    ),
  };
}
async function firebaseActor(runId, label) {
  const password = `RFxchange-${randomBytes(18).toString("base64url")}!9c`;
  const email = `${runId}-${label}@example.test`;
  const firebase = await auth.createUser({
    email,
    password,
    emailVerified: true,
    displayName: `Slice 3.6 ${label}`,
  });
  const userId = `usr_${createHash("sha256").update(`rfxchange:user:firebase:${firebase.uid}`).digest("hex").slice(0, 32)}`;
  return {
    firebase,
    email,
    password,
    user: createUserIdentity({
      id: userId,
      name: `Slice 3.6 ${label}`,
      primaryEmail: email,
      loginProvider: "firebase",
      loginSubject: firebase.uid,
      now: new Date().toISOString(),
    }),
  };
}
async function seed() {
  assert.equal(
    (
      await db
        .collection("geographies")
        .doc(String(PORTSMOUTH_CONTROLLED_LOCALITY.id))
        .get()
    ).exists,
    true,
  );
  const runId = `s36-${Date.now()}-${randomBytes(3).toString("hex")}`;
  const now = new Date().toISOString();
  const manager = await firebaseActor(runId, "manager");
  const viewer = await firebaseActor(runId, "viewer");
  const noPermissionAdmin = await firebaseActor(runId, "admin-no-permission");
  const organization = createOrganizationAccount({ id: `org_${runId}`, now });
  const managerMembership = createOrganizationMembership(
    manager.user,
    organization,
    { id: `membership_${runId}_manager`, now },
  );
  const viewerMembership = createOrganizationMembership(
    viewer.user,
    organization,
    { id: `membership_${runId}_viewer`, now },
  );
  const profile = profileFor(organization, manager.email, now, runId);
  const location = locationFor(
    organization,
    manager.user,
    managerMembership.id,
    now,
  );
  const serviceGeography = createOrganizationServiceGeography({
    organizationId: String(organization.id),
    primaryGeographyId: String(PORTSMOUTH_CONTROLLED_LOCALITY.id),
    serviceGeographyIds: [String(PORTSMOUTH_CONTROLLED_LOCALITY.id)],
    updatedByUserId: String(manager.user.id),
    updatedByMembershipId: String(managerMembership.id),
    now,
  });
  const completion = evaluateOrganizationProfileCompletion({
    profile,
    location,
    serviceGeographies: serviceGeography,
    now,
  });
  assert.equal(completion.status, "active");
  const managerLifecycle = openLifecycle(
    manager.user,
    organization,
    managerMembership,
    profile,
    now,
  );
  const viewerLifecycle = openLifecycle(
    viewer.user,
    organization,
    viewerMembership,
    profile,
    now,
  );
  const managerAuthorization = createOrganizationUserAuthorization(
    managerMembership,
    organization,
    {
      roleKey: "primary-administrator",
      permissions: ["organization.profile.manage", "resource.manage"],
      now,
    },
  );
  const viewerAuthorization = createOrganizationUserAuthorization(
    viewerMembership,
    organization,
    { roleKey: "viewer", permissions: [], now },
  );
  const managerAdminId = `admin_${runId}_manager`;
  const noPermissionAdminId = `admin_${runId}_no_permission`;
  const managerAuthority = createPlatformAdministratorAuthorityContext({
    administratorId: managerAdminId,
    rolePresetKeys: ["platform-administrator"],
    effectivePermissions: [
      "provider.application.read",
      "provider.application.review",
    ],
  });
  const noPermissionAuthority = createPlatformAdministratorAuthorityContext({
    administratorId: noPermissionAdminId,
    rolePresetKeys: ["technical-system-administrator"],
    effectivePermissions: ["admin.authority.read"],
  });
  const managerAccount = {
    administratorId: managerAdminId,
    subject: manager.firebase.uid,
    protectedAccount: false,
    status: "active",
    access: createPlatformAdministratorRoleConfiguration({
      administratorId: managerAdminId,
      rolePresetKeys: ["platform-administrator"],
      addedPermissions: [
        "provider.application.read",
        "provider.application.review",
      ],
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
  };
  const noPermissionAccount = {
    administratorId: noPermissionAdminId,
    subject: noPermissionAdmin.firebase.uid,
    protectedAccount: false,
    status: "active",
    access: createPlatformAdministratorRoleConfiguration({
      administratorId: noPermissionAdminId,
      rolePresetKeys: ["technical-system-administrator"],
      addedPermissions: ["admin.authority.read"],
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
  };
  const grants = [
    createAdminPermissionGrant({
      id: `grant_${runId}_read`,
      administratorId: managerAdminId,
      permission: "provider.application.read",
      scope: "GLOBAL",
      createdAt: now,
    }),
    createAdminPermissionGrant({
      id: `grant_${runId}_review`,
      administratorId: managerAdminId,
      permission: "provider.application.review",
      scope: "GLOBAL",
      createdAt: now,
    }),
    createAdminPermissionGrant({
      id: `grant_${runId}_no_permission`,
      administratorId: noPermissionAdminId,
      permission: "admin.authority.read",
      scope: "GLOBAL",
      createdAt: now,
    }),
  ];
  const records = [
    ["users", manager.user.id, manager.user],
    ["users", viewer.user.id, viewer.user],
    ["users", noPermissionAdmin.user.id, noPermissionAdmin.user],
    ["organizations", organization.id, organization],
    ["organizationProfiles", profile.id, profile],
    ["organizationMemberships", managerMembership.id, managerMembership],
    ["organizationMemberships", viewerMembership.id, viewerMembership],
    ["organizationAuthorizations", managerMembership.id, managerAuthorization],
    ["organizationAuthorizations", viewerMembership.id, viewerAuthorization],
    ["activationJourneyContexts", manager.user.id, managerLifecycle.activation],
    ["activationJourneyContexts", viewer.user.id, viewerLifecycle.activation],
    [
      "accessJourneys",
      managerLifecycle.lifecycle.id,
      managerLifecycle.lifecycle,
    ],
    ["accessJourneys", viewerLifecycle.lifecycle.id, viewerLifecycle.lifecycle],
    ["primaryGeographySelections", manager.user.id, managerLifecycle.selection],
    ["primaryGeographySelections", viewer.user.id, viewerLifecycle.selection],
    [
      "geographyParticipationAuthorizations",
      managerLifecycle.geographyAuthorization.id,
      managerLifecycle.geographyAuthorization,
    ],
    [
      "geographyParticipationAuthorizations",
      viewerLifecycle.geographyAuthorization.id,
      viewerLifecycle.geographyAuthorization,
    ],
    ["organizationLocations", organization.id, location],
    ["organizationServiceGeographies", organization.id, serviceGeography],
    ["organizationProfileCompletions", organization.id, completion],
    ["platformAdministrators", managerAdminId, managerAccount],
    ["platformAdministrators", noPermissionAdminId, noPermissionAccount],
    ["adminAuthorityContexts", managerAdminId, managerAuthority],
    ["adminAuthorityContexts", noPermissionAdminId, noPermissionAuthority],
    ...grants.map((grant) => ["adminPermissionGrants", grant.id, grant]),
  ];
  try {
    for (const [collection, id, value] of records)
      await persist(collection, id, value);
  } catch (error) {
    await Promise.allSettled(
      [
        manager.firebase.uid,
        viewer.firebase.uid,
        noPermissionAdmin.firebase.uid,
      ].map((uid) => auth.deleteUser(uid)),
    );
    throw error;
  }
  const state = {
    runId,
    projectId,
    organizationId: String(organization.id),
    manager: {
      email: manager.email,
      password: manager.password,
      firebaseUid: manager.firebase.uid,
    },
    viewer: {
      email: viewer.email,
      password: viewer.password,
      firebaseUid: viewer.firebase.uid,
    },
    noPermissionAdmin: {
      email: noPermissionAdmin.email,
      password: noPermissionAdmin.password,
      firebaseUid: noPermissionAdmin.firebase.uid,
    },
    createdRecords: records.map(([collection, id]) => [collection, String(id)]),
  };
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, {
    mode: 0o600,
  });
  await chmod(statePath, 0o600);
  console.log(
    JSON.stringify({
      seeded: true,
      runId,
      projectId,
      organizationId: state.organizationId,
      createdRecords: records.length,
    }),
  );
}
async function loadState() {
  const state = JSON.parse(await readFile(statePath, "utf8"));
  assert.equal(state.projectId, projectId);
  return state;
}
async function docs(query) {
  return (await query.get()).docs;
}
async function inspect() {
  const state = await loadState();
  const application = await db
    .collection("providerApplications")
    .doc(state.organizationId)
    .get();
  assert.equal(application.data()?.status, "approved");
  assert.equal(
    application.data()?.content?.eligibility,
    "Eligibility is reviewed case by case; call before submitting private documents.",
  );
  const [events, versions, commands, audits, adminAudits, status, profile] =
    await Promise.all([
      docs(
        db
          .collection("providerApplicationEvents")
          .where("organizationId", "==", state.organizationId),
      ),
      docs(
        db
          .collection("providerApplicationVersions")
          .where("organizationId", "==", state.organizationId),
      ),
      docs(
        db
          .collection("providerApplicationCommands")
          .where("organizationId", "==", state.organizationId),
      ),
      docs(
        db
          .collection("organizationAuditEvents")
          .where("organizationId", "==", state.organizationId),
      ),
      docs(
        db
          .collection("platformAdministrativeAuditEvents")
          .where("target.organizationId", "==", state.organizationId),
      ),
      db
        .collection("officialResourceProviderStatuses")
        .doc(state.organizationId)
        .get(),
      db.collection("providerServiceProfiles").doc(state.organizationId).get(),
    ]);
  assert.deepEqual(
    events.map((item) => item.data().kind).sort(),
    [
      "approved",
      "draft-saved",
      "response-saved",
      "information-requested",
      "resubmitted",
      "review-started",
      "review-started",
      "service-profile-updated",
      "submitted",
    ].sort(),
  );
  assert.equal(versions.length, events.length);
  assert.equal(commands.length, events.length);
  assert.equal(audits.length, 5);
  assert.equal(adminAudits.length, 4);
  assert.equal(status.data()?.status, "official-resource-provider");
  assert.equal(profile.data()?.availability, "limited");
  assert.equal(profile.data()?.visibility, "owner-and-administrators");
  assert.equal("verified" in (status.data() ?? {}), false);
  console.log(
    JSON.stringify({
      inspected: true,
      status: application.data().status,
      events: events.length,
      versions: versions.length,
      commands: commands.length,
      organizationAudits: audits.length,
      adminAudits: adminAudits.length,
      profileAvailability: profile.data().availability,
    }),
  );
}
async function cleanup() {
  const state = await loadState();
  const refs = new Map();
  const schedule = (record) => {
    const ref = record.ref ?? record;
    refs.set(ref.path, ref);
  };
  for (const [collection, id] of state.createdRecords)
    schedule(db.collection(collection).doc(id));
  for (const collection of [
    "providerApplicationVersions",
    "providerApplicationEvents",
    "providerApplicationCommands",
    "organizationAuditEvents",
  ])
    for (const record of await docs(
      db
        .collection(collection)
        .where("organizationId", "==", state.organizationId),
    ))
      schedule(record);
  for (const record of await docs(
    db
      .collection("platformAdministrativeAuditEvents")
      .where("target.organizationId", "==", state.organizationId),
  ))
    schedule(record);
  for (const collection of [
    "providerApplications",
    "officialResourceProviderStatuses",
    "providerServiceProfiles",
  ])
    schedule(db.collection(collection).doc(state.organizationId));
  const pending = [...refs.values()];
  while (pending.length) {
    const batch = db.batch();
    for (const ref of pending.splice(0, 400)) batch.delete(ref);
    await batch.commit();
  }
  await Promise.all(
    [
      state.manager.firebaseUid,
      state.viewer.firebaseUid,
      state.noPermissionAdmin.firebaseUid,
    ].map((uid) =>
      auth.deleteUser(uid).catch((error) => {
        if (error?.code !== "auth/user-not-found") throw error;
      }),
    ),
  );
  const residual = [];
  for (const ref of refs.values())
    if ((await ref.get()).exists) residual.push(ref.path);
  assert.deepEqual(residual, []);
  for (const uid of [
    state.manager.firebaseUid,
    state.viewer.firebaseUid,
    state.noPermissionAdmin.firebaseUid,
  ])
    await auth.getUser(uid).then(
      () => assert.fail("Residual Auth user"),
      (error) => assert.equal(error?.code, "auth/user-not-found"),
    );
  console.log(
    JSON.stringify({
      cleaned: true,
      deletedRecords: refs.size,
      residualRecords: 0,
      residualAuthUsers: 0,
    }),
  );
}
try {
  if (mode === "seed") await seed();
  if (mode === "inspect") await inspect();
  if (mode === "cleanup") await cleanup();
} finally {
  await deleteApp(app);
}
