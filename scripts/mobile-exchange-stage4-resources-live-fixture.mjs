import assert from "node:assert/strict";

import { deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { createReferral, transitionReferral } from "../src/domain/referrals/model.ts";
import {
  createProviderPublication,
  createProviderResource,
  updateProviderPublication,
  updateProviderResource,
} from "../src/domain/resource-network/model.ts";

const projectId = process.env.GCLOUD_PROJECT?.trim()
  || process.env.GOOGLE_CLOUD_PROJECT?.trim()
  || "rfxchange";
const password = process.env.RFXCHANGE_RESOURCES_BROWSER_PASSWORD?.trim()
  || "Resources-Browser-9!fixture";
const now = new Date().toISOString();
const app = initializeApp({ projectId }, `resources-live-fixture-${Date.now()}`);
const db = getFirestore(app);
const auth = getAuth(app);

function record(value) { return { ...value, schemaVersion: 1 }; }

async function latestAcceptanceUser() {
  const result = await auth.listUsers(1_000);
  const candidates = result.users
    .filter((user) => user.email?.startsWith("shell-") && user.email.endsWith("@example.test"))
    .sort((left, right) => Number(right.metadata.creationTime ? Date.parse(right.metadata.creationTime) : 0) - Number(left.metadata.creationTime ? Date.parse(left.metadata.creationTime) : 0));
  assert.ok(candidates[0]?.email, "The configured participant fixture has not been seeded yet.");
  return candidates[0];
}

function providerStatus(organizationId) {
  return Object.freeze({
    id: organizationId,
    organizationId,
    status: "official-resource-provider",
    sourceApplicationId: organizationId,
    sourceApplicationVersion: 4,
    approvedAt: now,
    approvedByAdministratorId: "resources-browser-fixture",
  });
}

function providerProfile(organizationId, serviceGeographyId, actor, availability = "available") {
  return Object.freeze({
    id: organizationId,
    organizationId,
    sourceApplicationId: organizationId,
    sourceApplicationVersion: 4,
    version: 1,
    categories: Object.freeze(["technical-assistance", "capital-provider"]),
    otherCategoryDescription: null,
    services: Object.freeze([
      Object.freeze({ id: "service-capital", name: "Capital readiness", description: "Application and underwriting preparation for local organizations.", availability, capacityNote: null }),
      Object.freeze({ id: "service-procurement", name: "Procurement clinic", description: "Contracting and supplier-readiness support.", availability: "limited", capacityNote: null }),
    ]),
    populationsServed: "Organizations preparing for financing, procurement, and sustainable growth.",
    eligibility: "Organizations operating in the released locality; final eligibility is confirmed during provider intake.",
    intakeMethod: "Send a private provider request through RFxchange.",
    modalities: Object.freeze(["hybrid", "virtual"]),
    languages: Object.freeze(["English", "Spanish"]),
    officialContact: Object.freeze({ displayName: "Resource Program Team", roleTitle: "Program Director", email: "resources@example.test", phone: null }),
    serviceGeographyId,
    availability,
    visibility: "owner-and-administrators",
    status: "active",
    updatedBy: Object.freeze(actor),
    updatedAt: now,
  });
}

async function seedProvider({ organizationId, displayName, serviceGeographyId, resourceGeographyId, actor, owner = false }) {
  const profile = providerProfile(organizationId, serviceGeographyId, actor, owner ? "limited" : "available");
  const draftPublication = createProviderPublication({
    organizationId,
    sourceProfileVersion: profile.version,
    visibleServiceIds: profile.services.map((service) => service.id),
    actorUserId: actor.userId,
    actorMembershipId: actor.membershipId,
    now,
  });
  const publication = updateProviderPublication({
    current: draftPublication,
    expectedVersion: draftPublication.version,
    sourceProfileVersion: profile.version,
    visibleServiceIds: draftPublication.visibleServiceIds,
    action: "publish",
    actorUserId: actor.userId,
    actorMembershipId: actor.membershipId,
    now,
  });
  const draftResource = createProviderResource({
    id: owner ? `resource-owner-${organizationId}` : `resource-public-${organizationId}`,
    organizationId,
    kind: "program",
    title: owner ? "Owner resource draft fixture" : "Capital readiness clinic",
    summary: owner ? "A provider-managed resource used to exercise owner management." : "Published application preparation and capital-readiness support.",
    description: owner ? "This record remains available to the owning provider management surface." : "A real published Resource Network program for organizations preparing finance applications.",
    serviceIds: ["service-capital"],
    geographyIds: [String(resourceGeographyId)],
    modalities: ["hybrid"],
    eligibility: "Organizations operating in the released service territory.",
    intakeUrl: owner ? null : "https://provider.example.test/intake",
    visibility: "network",
    actorUserId: actor.userId,
    now,
  });
  const resource = owner ? draftResource : updateProviderResource({
    current: draftResource,
    expectedVersion: draftResource.version,
    action: "publish",
    actorUserId: actor.userId,
    now,
  });
  await Promise.all([
    db.collection("officialResourceProviderStatuses").doc(organizationId).set(record(providerStatus(organizationId))),
    db.collection("providerServiceProfiles").doc(organizationId).set(record(profile)),
    db.collection("providerDiscoveryPublications").doc(organizationId).set(record(publication)),
    db.collection("providerResources").doc(resource.id).set(record(resource)),
  ]);
  return Object.freeze({ organizationId, displayName, publication, resource });
}

try {
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, "FIREBASE_AUTH_EMULATOR_HOST is required.");
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, "FIRESTORE_EMULATOR_HOST is required.");
  const user = await latestAcceptanceUser();
  await auth.updateUser(user.uid, { password });
  const userRecords = await db.collection("users").get();
  const participantUserDocument = userRecords.docs.find((document) => document.data().login?.subject === user.uid);
  assert.ok(participantUserDocument, "The configured participant identity is missing.");
  const participantUser = Object.freeze({ id: participantUserDocument.id, ...participantUserDocument.data() });
  const membershipRecords = await db.collection("organizationMemberships").where("userId", "==", participantUser.id).get();
  assert.equal(membershipRecords.size, 1, "The configured participant membership is ambiguous.");
  const participantMembership = Object.freeze({ id: membershipRecords.docs[0].id, ...membershipRecords.docs[0].data() });
  const participantOrganizationSnapshot = await db.collection("organizations").doc(String(participantMembership.organizationId)).get();
  assert.ok(participantOrganizationSnapshot.exists, "The configured participant organization is missing.");
  const participantOrganization = Object.freeze({ id: participantOrganizationSnapshot.id, ...participantOrganizationSnapshot.data() });
  const runSuffix = participantOrganization.id.replace(/^org_/, "");
  const harborOrganizationSnapshot = await db.collection("organizations").doc(`org_harbor_${runSuffix}`).get();
  assert.ok(harborOrganizationSnapshot.exists, "The configured Harbor organization is missing.");
  const harborOrganization = Object.freeze({ id: harborOrganizationSnapshot.id, ...harborOrganizationSnapshot.data() });
  const participantServiceGeography = await db.collection("organizationServiceGeographies").doc(participantOrganization.id).get();
  const harborServiceGeography = await db.collection("organizationServiceGeographies").doc(harborOrganization.id).get();
  assert.ok(participantServiceGeography.exists && harborServiceGeography.exists, "Service geography fixtures are required.");
  const participantActor = Object.freeze({ userId: String(participantUser.id), membershipId: String(participantMembership.id ?? participantMembership.membershipId) });
  const harborActor = Object.freeze({ userId: `user-${harborOrganization.id}`, membershipId: `membership-${harborOrganization.id}` });
  const owner = await seedProvider({ organizationId: participantOrganization.id, displayName: participantOrganization.name ?? "Configured Shell Acceptance Organization", serviceGeographyId: participantServiceGeography.id, resourceGeographyId: participantServiceGeography.data().primaryGeographyId, actor: participantActor, owner: true });
  const provider = await seedProvider({ organizationId: harborOrganization.id, displayName: "Harbor Systems Group", serviceGeographyId: harborServiceGeography.id, resourceGeographyId: harborServiceGeography.data().primaryGeographyId, actor: harborActor });
  const draftReferral = createReferral({
    id: `provider-request-${participantOrganization.id}`,
    senderOrganizationId: participantOrganization.id,
    senderOrganizationName: "Configured Shell Acceptance Organization",
    recipient: { kind: "organization", organizationId: provider.organizationId, displayName: provider.displayName, notificationEmail: null },
    need: "introduction",
    summary: "We need capital-readiness intake support.",
    urgency: "standard",
    preferredContactMethod: "platform",
    purpose: "provider-connection",
    providerContext: { providerOrganizationId: provider.organizationId, serviceId: "service-capital", publicationVersion: provider.publication.version },
    sharedFields: ["sender-organization", "summary"],
    consentAcknowledged: true,
    correlationId: `resources-browser:${participantOrganization.id}`,
    actorUserId: participantActor.userId,
    actorMembershipId: participantActor.membershipId,
    now,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000).toISOString(),
  });
  const referral = transitionReferral({ referral: draftReferral, expectedVersion: draftReferral.version, to: "sent", actorUserId: participantActor.userId, now });
  await db.collection("businessReferrals").doc(referral.id).set(record(referral));
  console.log(JSON.stringify({ email: user.email, password, providerOrganizationId: provider.organizationId, resourceId: provider.resource.id, requestId: referral.id, ownerResourceId: owner.resource.id }));
} finally {
  await deleteApp(app);
}
