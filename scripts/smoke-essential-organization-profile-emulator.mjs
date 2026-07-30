import assert from "node:assert/strict";
import {
  deleteApp as deleteClientApp,
  initializeApp as initializeClientApp,
} from "firebase/app";
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore as getClientFirestore,
} from "firebase/firestore";
import {
  deleteApp as deleteAdminApp,
  initializeApp as initializeAdminApp,
} from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

import { createOrganizationActionAuditEvent } from "../src/domain/audit/model.ts";
import {
  createOrganizationCapability,
  createOrganizationProfileEvent,
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
import {
  createFirestoreEssentialOrganizationProfileRepositories,
} from "../src/infrastructure/firestore/organization-profile.ts";
import {
  FirestoreOrganizationProfileRepository,
} from "../src/infrastructure/firestore/repositories.ts";

assert.equal(
  process.env.FIRESTORE_EMULATOR_HOST,
  "127.0.0.1:8080",
  "Slice 2.7 acceptance must use the Firestore emulator.",
);

const projectId = "demo-rfxchange";
const runId = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const now = new Date().toISOString();
const later = new Date(Date.now() + 60_000).toISOString();
const adminApp = initializeAdminApp({ projectId }, `profile-admin-${runId}`);
const adminDb = getAdminFirestore(adminApp);
const clientApp = initializeClientApp({
  apiKey: "demo-api-key",
  authDomain: `${projectId}.firebaseapp.com`,
  projectId,
  appId: `1:123:web:profile-${runId}`,
}, `profile-client-${runId}`);
const clientDb = getClientFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);

const organization = createOrganizationAccount({
  id: `org_profile_${runId}`,
  now,
});
const baseProfile = createOrganizationProfile(organization, {
  id: `profile_${runId}`,
  displayName: "Essential Profile Emulator Organization",
  now,
});
const user = createUserIdentity({
  id: `user_profile_${runId}`,
  name: "Essential Profile Administrator",
  primaryEmail: `profile-${runId}@example.test`,
  loginProvider: "firebase",
  loginSubject: `subject-profile-${runId}`,
  now,
});
const membership = createOrganizationMembership(user, organization, {
  id: `membership_profile_${runId}`,
  now,
});
const capability = createOrganizationCapability({
  id: `capability_${runId}`,
  kind: "service",
  name: "Precision marine metal fabrication",
  description: "Fabricates corrosion-resistant assemblies for marine equipment.",
});
const profile = updateEssentialOrganizationProfile(baseProfile, {
  displayName: "Essential Profile Emulator Organization",
  organizationType: "for-profit-business",
  website: { disposition: "available", url: "https://emulator.example.test" },
  mainContact: {
    displayName: "Morgan Lee",
    roleTitle: "Operations Director",
    email: `operations-${runId}@example.test`,
    publiclyVisible: false,
  },
  capabilities: [capability],
  participationRoles: ["business", "supplier"],
  businessObjectives: ["find-opportunities", "find-teammates"],
  now,
});
const location = Object.freeze({
  updatedAt: now,
  visibility: "locality-only",
});
const serviceGeographies = Object.freeze({
  serviceGeographyIds: Object.freeze(["geo-portsmouth-va"]),
  updatedAt: now,
});
const activeCompletion = evaluateOrganizationProfileCompletion({
  profile,
  location,
  serviceGeographies,
  now,
});
const activeEvent = createOrganizationProfileEvent({
  id: `profile_event_active_${runId}`,
  profile,
  userId: user.id,
  membershipId: membership.id,
  kind: "essential-profile-updated",
  completion: activeCompletion,
  reason: "Emulator essential profile update.",
  now,
});
const activeAudit = createOrganizationActionAuditEvent(
  user,
  membership,
  organization,
  {
    id: `profile_audit_active_${runId}`,
    action: "organization.profile.essential-updated",
    occurredAt: now,
  },
);
const cleanup = [
  ["organizationProfiles", baseProfile.id],
  ["organizationProfileCompletions", organization.id],
  ["organizationProfileEvents", activeEvent.id],
  ["organizationAuditEvents", activeAudit.id],
];

try {
  await adminDb
    .collection("organizationProfiles")
    .doc(baseProfile.id)
    .set({ ...baseProfile, schemaVersion: 1 });
  const repositories = createFirestoreEssentialOrganizationProfileRepositories(adminDb);
  await repositories.unitOfWork.save({
    profile,
    expectedProfileUpdatedAt: baseProfile.updatedAt,
    completion: activeCompletion,
    event: activeEvent,
    auditEvent: activeAudit,
  });

  const profileRepository = new FirestoreOrganizationProfileRepository(adminDb);
  const persistedProfile = await profileRepository.getById(baseProfile.id);
  const persistedCompletion =
    await repositories.completions.getByOrganizationId(organization.id);
  assert.equal(persistedProfile?.id, baseProfile.id);
  assert.equal(persistedProfile?.organizationId, organization.id);
  assert.equal(persistedProfile?.capabilities?.[0]?.name, capability.name);
  assert.equal(persistedCompletion?.status, "active");
  assert.equal(persistedCompletion?.credentialKey, "profile-complete");

  const reducedProfile = updateEssentialOrganizationProfile(persistedProfile, {
    displayName: persistedProfile.displayName,
    organizationType: persistedProfile.organizationType,
    website: persistedProfile.website,
    mainContact: persistedProfile.mainContact,
    capabilities: [],
    participationRoles: persistedProfile.participationRoles,
    businessObjectives: persistedProfile.businessObjectives,
    now: later,
  });
  const inactiveCompletion = evaluateOrganizationProfileCompletion({
    profile: reducedProfile,
    location,
    serviceGeographies,
    prior: persistedCompletion,
    now: later,
  });
  const inactiveEvent = createOrganizationProfileEvent({
    id: `profile_event_inactive_${runId}`,
    profile: reducedProfile,
    userId: user.id,
    membershipId: membership.id,
    kind: "profile-completion-recalculated",
    priorCompletionStatus: persistedCompletion.status,
    completion: inactiveCompletion,
    reason: "Emulator requirement removal recalculation.",
    now: later,
  });
  const inactiveAudit = createOrganizationActionAuditEvent(
    user,
    membership,
    organization,
    {
      id: `profile_audit_inactive_${runId}`,
      action: "organization.profile.completion-recalculated",
      occurredAt: later,
    },
  );
  cleanup.push(
    ["organizationProfileEvents", inactiveEvent.id],
    ["organizationAuditEvents", inactiveAudit.id],
  );
  await repositories.unitOfWork.save({
    profile: reducedProfile,
    expectedProfileUpdatedAt: persistedProfile.updatedAt,
    completion: inactiveCompletion,
    event: inactiveEvent,
    auditEvent: inactiveAudit,
  });
  const recalculated = await repositories.completions.getByOrganizationId(
    organization.id,
  );
  assert.equal(recalculated?.status, "inactive");
  assert.deepEqual(recalculated?.missingRequirements, ["meaningful-capability"]);
  assert.equal(recalculated?.firstActivatedAt, activeCompletion.firstActivatedAt);
  assert.equal(
    (
      await adminDb
        .collection("organizationProfileEvents")
        .where("organizationId", "==", organization.id)
        .get()
    ).size,
    2,
  );

  for (const [collection, id] of [
    ["organizationProfiles", baseProfile.id],
    ["organizationProfileCompletions", organization.id],
    ["organizationProfileEvents", inactiveEvent.id],
  ]) {
    await assert.rejects(
      () => getDoc(doc(clientDb, collection, id)),
      (error) => error?.code === "permission-denied",
    );
  }
  console.log("Slice 2.7 essential organization profile Firestore emulator acceptance passed.");
} finally {
  for (const [collection, id] of cleanup.reverse()) {
    await adminDb.collection(collection).doc(id).delete().catch(() => undefined);
  }
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}
