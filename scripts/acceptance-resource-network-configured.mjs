import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { applicationDefault, deleteApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";

const mode = process.argv[2];
const statePath = process.env.RFXCHANGE_ACCEPTANCE_STATE_FILE?.trim();
const projectId = process.env.RFXCHANGE_EXPECTED_PROJECT_ID?.trim();
assert.ok(["setup", "inspect", "cleanup"].includes(mode));
assert.ok(statePath);
assert.ok(projectId);
const app = initializeApp({ credential: applicationDefault(), projectId }, `slice-3-7-acceptance-${Date.now()}`);
const db = getFirestore(app);
const schemaVersion = 1;
const state = JSON.parse(await readFile(statePath, "utf8"));
assert.equal(state.projectId, projectId);

async function create(collection, id, value) {
  const ref = db.collection(collection).doc(String(id));
  assert.equal((await ref.get()).exists, false, `Refusing to overwrite ${ref.path}.`);
  await ref.set({ ...value, schemaVersion });
  state.createdRecords.push([collection, String(id)]);
}

async function setup() {
  const now = new Date().toISOString();
  const organizationId = state.organizationId;
  const providerProfileSnapshot = await db.collection("organizationProfiles").where("organizationId", "==", organizationId).limit(1).get();
  const providerProfile = providerProfileSnapshot.docs[0].data();
  const providerLocation = (await db.collection("organizationLocations").doc(organizationId).get()).data();
  const providerServiceGeography = (await db.collection("organizationServiceGeographies").doc(organizationId).get()).data();
  const providerCompletion = (await db.collection("organizationProfileCompletions").doc(organizationId).get()).data();
  const managerMembershipId = state.createdRecords.find(([collection, id]) => collection === "organizationMemberships" && id.endsWith("_manager"))[1];
  const managerMembership = (await db.collection("organizationMemberships").doc(managerMembershipId).get()).data();
  const managerAuthorizationRef = db.collection("organizationAuthorizations").doc(managerMembershipId);
  const managerAuthorization = (await managerAuthorizationRef.get()).data();
  await managerAuthorizationRef.set({ ...managerAuthorization, permissions: [...new Set([...managerAuthorization.permissions, "referral.manage"])], updatedAt: now, schemaVersion });

  const viewerUserSnapshot = await db.collection("users").where("login.subject", "==", state.viewer.firebaseUid).limit(1).get();
  assert.equal(viewerUserSnapshot.size, 1);
  const viewerUser = viewerUserSnapshot.docs[0].data();
  const oldViewerMembershipId = state.createdRecords.find(([collection, id]) => collection === "organizationMemberships" && id.endsWith("_viewer"))[1];
  const oldViewerMembershipRef = db.collection("organizationMemberships").doc(oldViewerMembershipId);
  const oldViewerMembership = (await oldViewerMembershipRef.get()).data();
  await oldViewerMembershipRef.set({ ...oldViewerMembership, status: "inactive", updatedAt: now, schemaVersion });

  const requesterOrganizationId = `org_${state.runId}_requester`;
  const requesterProfileId = `profile_${requesterOrganizationId}`;
  const requesterMembershipId = `membership_${state.runId}_requester`;
  const requesterOrganization = { id: requesterOrganizationId, createdAt: now, updatedAt: now };
  const requesterProfile = { ...providerProfile, id: requesterProfileId, organizationId: requesterOrganizationId, displayName: `Resource Requester ${state.runId}`, createdAt: now, updatedAt: now };
  const requesterMembership = { id: requesterMembershipId, userId: viewerUser.id, organizationId: requesterOrganizationId, status: "active", createdAt: now, updatedAt: now };
  const requesterAuthorization = createOrganizationUserAuthorization(requesterMembership, requesterOrganization, { roleKey: "primary-administrator", permissions: ["referral.manage"], now });
  const requesterLocation = { ...providerLocation, id: requesterOrganizationId, organizationId: requesterOrganizationId, sourceDraftId: `draft_${requesterOrganizationId}`, coordinate: [-76.3105, 36.8422], confirmedByUserId: viewerUser.id, confirmedByMembershipId: requesterMembershipId, confirmedAt: now, updatedAt: now };
  const requesterServiceGeography = { ...providerServiceGeography, id: requesterOrganizationId, organizationId: requesterOrganizationId, updatedByUserId: viewerUser.id, updatedByMembershipId: requesterMembershipId, updatedAt: now };
  const requesterCompletion = { ...providerCompletion, id: requesterOrganizationId, organizationId: requesterOrganizationId, profileId: requesterProfileId, evaluatedAt: now };
  const viewerActivationRef = db.collection("activationJourneyContexts").doc(viewerUser.id);
  const viewerActivation = (await viewerActivationRef.get()).data();
  await viewerActivationRef.set({ ...viewerActivation, provisionalOrganizationName: requesterProfile.displayName, organizationId: requesterOrganizationId, membershipId: requesterMembershipId, updatedAt: now, schemaVersion });

  for (const [collection, id, value] of [
    ["organizations", requesterOrganizationId, requesterOrganization],
    ["organizationProfiles", requesterProfileId, requesterProfile],
    ["organizationMemberships", requesterMembershipId, requesterMembership],
    ["organizationAuthorizations", requesterMembershipId, requesterAuthorization],
    ["organizationLocations", requesterOrganizationId, requesterLocation],
    ["organizationServiceGeographies", requesterOrganizationId, requesterServiceGeography],
    ["organizationProfileCompletions", requesterOrganizationId, requesterCompletion],
  ]) await create(collection, id, value);

  const geographyId = providerServiceGeography.primaryGeographyId;
  const marker = (id, location, completion) => ({ id, organizationId: id, geographyId, status: "active", coordinateSource: "confirmed-canonical-location", blockingReasons: [], sourceLocationUpdatedAt: location.updatedAt, sourceProfileCompletionEvaluatedAt: completion.evaluatedAt, firstActivatedAt: now, lastTransitionAt: now, evaluatedAt: now });
  await create("organizationMarkerActivations", organizationId, marker(organizationId, providerLocation, providerCompletion));
  await create("organizationMarkerActivations", requesterOrganizationId, marker(requesterOrganizationId, requesterLocation, requesterCompletion));

  const seededProviderStatus = { id: organizationId, organizationId, status: "official-resource-provider", sourceApplicationId: organizationId, sourceApplicationVersion: 1, approvedAt: now, approvedByAdministratorId: `admin_${state.runId}_manager` };
  const seededProviderServiceProfile = { id: organizationId, organizationId, sourceApplicationId: organizationId, sourceApplicationVersion: 1, version: 1, categories: ["technical-assistance", "capital-provider"], otherCategoryDescription: null, services: [{ id: "service-capital-readiness", name: "Capital readiness", description: "Structured preparation for financing and lender intake.", availability: "available", capacityNote: null }, { id: "service-contracting", name: "Contract readiness", description: "Workshops and technical assistance for institutional contracting.", availability: "limited", capacityNote: null }], populationsServed: "Small organizations operating in Portsmouth and nearby controlled localities.", eligibility: "Organization eligibility is confirmed during provider intake.", intakeMethod: "Submit the provider intake form; publication does not guarantee acceptance.", modalities: ["hybrid", "virtual"], languages: ["English", "Spanish"], officialContact: { displayName: "Jordan Ellis", roleTitle: "Programs Director", email: state.manager.email, phone: null }, serviceGeographyId: organizationId, availability: "available", visibility: "owner-and-administrators", status: "active", updatedByUserId: managerMembership.userId, updatedByMembershipId: managerMembershipId, createdAt: now, updatedAt: now };
  const providerStatusRef = db.collection("officialResourceProviderStatuses").doc(organizationId);
  const providerServiceProfileRef = db.collection("providerServiceProfiles").doc(organizationId);
  const [providerStatusSnapshot, providerServiceProfileSnapshot] = await Promise.all([providerStatusRef.get(), providerServiceProfileRef.get()]);
  if (!providerStatusSnapshot.exists) await create("officialResourceProviderStatuses", organizationId, seededProviderStatus);
  if (!providerServiceProfileSnapshot.exists) await create("providerServiceProfiles", organizationId, seededProviderServiceProfile);
  const providerStatus = providerStatusSnapshot.exists ? providerStatusSnapshot.data() : seededProviderStatus;
  const providerServiceProfile = providerServiceProfileSnapshot.exists ? providerServiceProfileSnapshot.data() : seededProviderServiceProfile;
  assert.equal(providerStatus?.organizationId, organizationId);
  assert.equal(providerStatus?.status, "official-resource-provider");
  assert.equal(providerServiceProfile?.organizationId, organizationId);
  assert.equal(providerServiceProfile?.status, "active");
  assert.ok(Array.isArray(providerServiceProfile?.services) && providerServiceProfile.services.length > 0);
  const visibleServiceIds = providerServiceProfile.services.map((service) => service.id);
  const publication = { id: organizationId, organizationId, version: 1, status: "published", sourceProfileVersion: providerServiceProfile.version, visibleServiceIds, publishedAt: now, withdrawnAt: null, updatedByUserId: managerMembership.userId, updatedByMembershipId: managerMembershipId, updatedAt: now };
  const resourceId = `provider_resource_${state.runId}`;
  const resource = { id: resourceId, organizationId, version: 1, kind: "workshop", title: "Capital readiness clinic", summary: "A provider-maintained clinic for financing preparation.", description: "Participants review financing readiness and the provider's own intake requirements.", serviceIds: [visibleServiceIds[0]], geographyIds: [String(geographyId)], modalities: ["hybrid"], eligibility: "Organizations in the maintained service territory; final eligibility is determined at intake.", intakeUrl: "https://example.test/provider-intake", startsAt: null, endsAt: null, visibility: "network", status: "published", moderation: { status: "clear", reason: null }, createdByUserId: managerMembership.userId, updatedByUserId: managerMembership.userId, publishedAt: now, withdrawnAt: null, createdAt: now, updatedAt: now };
  await create("providerDiscoveryPublications", organizationId, publication);
  await create("providerResources", resourceId, resource);

  state.resourceNetwork = { requesterOrganizationId, requesterMembershipId, providerOrganizationId: organizationId, providerResourceId: resourceId };
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ setup: true, requesterOrganizationId, providerOrganizationId: organizationId, createdRecords: state.createdRecords.length }));
}

async function inspect() {
  assert.ok(state.resourceNetwork);
  const { requesterOrganizationId, providerOrganizationId, providerResourceId } = state.resourceNetwork;
  const [publication, resource, referrals, messages, invitations] = await Promise.all([
    db.collection("providerDiscoveryPublications").doc(providerOrganizationId).get(),
    db.collection("providerResources").doc(providerResourceId).get(),
    db.collection("businessReferrals").where("senderOrganizationId", "==", requesterOrganizationId).get(),
    db.collection("providerRequestMessages").where("requesterOrganizationId", "==", requesterOrganizationId).get(),
    db.collection("providerAcquisitionInvitations").where("organizationId", "==", providerOrganizationId).get(),
  ]);
  assert.equal(publication.data()?.status, "published");
  assert.equal(resource.data()?.status, "published");
  console.log(JSON.stringify({ inspected: true, referrals: referrals.size, messages: messages.size, invitations: invitations.size, publication: publication.data()?.status, resource: resource.data()?.status }));
}

async function cleanup() {
  const { requesterOrganizationId, providerOrganizationId } = state.resourceNetwork;
  const refs = new Map();
  const schedule = (record) => { const ref = record.ref ?? record; refs.set(ref.path, ref); };
  for (const [collection, id] of state.createdRecords) schedule(db.collection(collection).doc(id));
  const query = async (collection, field, value) => { for (const record of (await db.collection(collection).where(field, "==", value).get()).docs) schedule(record); };
  for (const organizationId of [requesterOrganizationId, providerOrganizationId]) {
    for (const collection of ["providerResources", "providerNetworkEvents", "providerNetworkCommands", "providerAcquisitionInvitations", "organizationAuditEvents"]) await query(collection, "organizationId", organizationId);
    await query("businessReferralCommands", "actorOrganizationId", organizationId);
    await query("referralEducationAcknowledgements", "organizationId", organizationId);
  }
  await query("businessReferrals", "senderOrganizationId", requesterOrganizationId);
  await query("businessReferralEvents", "senderOrganizationId", requesterOrganizationId);
  await query("providerRequestMessages", "requesterOrganizationId", requesterOrganizationId);
  const referrals = [...refs.values()].filter((ref) => ref.parent.id === "businessReferrals");
  for (const referralRef of referrals) {
    const referral = (await referralRef.get()).data();
    if (referral?.communicationMessageId) schedule(db.collection("referralCommunicationIntents").doc(referral.communicationMessageId));
  }
  const invitations = [...refs.values()].filter((ref) => ref.parent.id === "providerAcquisitionInvitations");
  for (const invitationRef of invitations) {
    const invitation = (await invitationRef.get()).data();
    if (invitation?.acquisitionContextId) {
      schedule(db.collection("acquisitionContexts").doc(invitation.acquisitionContextId));
      await query("acquisitionContextEvents", "contextId", invitation.acquisitionContextId);
    }
  }
  const pending = [...refs.values()];
  while (pending.length) { const batch = db.batch(); for (const ref of pending.splice(0, 400)) batch.delete(ref); await batch.commit(); }
  const { getAuth } = await import("firebase-admin/auth");
  const auth = getAuth(app);
  for (const uid of [state.manager.firebaseUid, state.viewer.firebaseUid, state.noPermissionAdmin.firebaseUid]) await auth.deleteUser(uid).catch((error) => { if (error?.code !== "auth/user-not-found") throw error; });
  const residualRecords = [];
  for (const ref of refs.values()) if ((await ref.get()).exists) residualRecords.push(ref.path);
  assert.deepEqual(residualRecords, []);
  for (const uid of [state.manager.firebaseUid, state.viewer.firebaseUid, state.noPermissionAdmin.firebaseUid]) await auth.getUser(uid).then(() => assert.fail("Residual Auth identity"), (error) => assert.equal(error?.code, "auth/user-not-found"));
  console.log(JSON.stringify({ cleaned: true, deletedRecords: refs.size, residualRecords: 0, residualAuthUsers: 0 }));
}

try { if (mode === "setup") await setup(); else if (mode === "inspect") await inspect(); else await cleanup(); }
finally { await deleteApp(app); }
