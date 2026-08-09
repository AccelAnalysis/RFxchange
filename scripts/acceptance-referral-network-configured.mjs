import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";

import { applicationDefault, deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

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
import { evaluateOrganizationMarkerActivation } from "../src/domain/organization-markers/model.ts";
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
assert.ok(["seed", "seed-external-recipient", "inspect", "cleanup"].includes(mode), "Use seed, seed-external-recipient, inspect, or cleanup.");
assert.ok(statePath, "RFXCHANGE_ACCEPTANCE_STATE_FILE is required.");
assert.ok(projectId, "RFXCHANGE_EXPECTED_PROJECT_ID is required.");
assert.equal(
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  projectId,
  "Configured browser and Admin acceptance project IDs must match.",
);

const app = initializeApp({ credential: applicationDefault(), projectId }, `slice-3-5-acceptance-${Date.now()}`);
const auth = getAuth(app);
const db = getFirestore(app);
const schemaVersion = 1;

async function persist(collection, id, value) {
  const ref = db.collection(collection).doc(String(id));
  assert.equal((await ref.get()).exists, false, `Refusing to overwrite ${collection}/${String(id)}.`);
  await ref.set({ ...value, schemaVersion });
}

function profileFor(organization, label, email, now, runId) {
  const base = createOrganizationProfile(organization, {
    id: `profile_${organization.id}`,
    displayName: label,
    now,
  });
  const capability = createOrganizationCapability({
    id: `cap_${organization.id}`,
    kind: "service",
    category: "professional-business-services",
    name: "Business introduction coordination",
    description: "Coordinates permissioned business introductions with explicit participant consent.",
  });
  return updateEssentialOrganizationProfile(base, {
    displayName: label,
    organizationType: "for-profit-business",
    website: { disposition: "available", url: `https://${runId}.example.test` },
    mainContact: {
      displayName: `${label} Main Contact`,
      roleTitle: "Business Development",
      email,
      publiclyVisible: true,
    },
    capabilities: [capability],
    participationRoles: ["business", "supplier"],
    businessObjectives: ["send-receive-referrals"],
    now,
  });
}

function locationFor(organization, actor, membershipId, coordinate, addressLine1, now) {
  const candidate = createOrganizationGeocodeCandidate({
    id: `candidate_${organization.id}`,
    geographyId: String(PORTSMOUTH_CONTROLLED_LOCALITY.id),
    coordinate,
    matchedAddress: `${addressLine1}, Portsmouth, VA 23704`,
    quality: "rooftop",
    provider: "configured-acceptance-fixture",
    providerReference: `fixture-${organization.id}`,
    benchmark: "slice-3.5-configured-acceptance",
    retrievedAt: now,
  });
  const draft = createOrganizationLocationDraft({
    id: `draft_${organization.id}`,
    organizationId: String(organization.id),
    requestedByUserId: String(actor.id),
    membershipId,
    primaryGeographyId: String(PORTSMOUTH_CONTROLLED_LOCALITY.id),
    physicalAddress: structuredPostalAddress({
      addressLine1,
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
    confirmedByUserId: String(actor.id),
    confirmedByMembershipId: membershipId,
    now,
  });
}

function completionAndMarker(organization, profile, location, actor, membershipId, now) {
  const serviceGeography = createOrganizationServiceGeography({
    organizationId: String(organization.id),
    primaryGeographyId: String(PORTSMOUTH_CONTROLLED_LOCALITY.id),
    serviceGeographyIds: [String(PORTSMOUTH_CONTROLLED_LOCALITY.id)],
    updatedByUserId: String(actor.id),
    updatedByMembershipId: membershipId,
    now,
  });
  const completion = evaluateOrganizationProfileCompletion({ profile, location, serviceGeographies: serviceGeography, now });
  assert.equal(completion.status, "active");
  const marker = evaluateOrganizationMarkerActivation({
    organization,
    relationshipAuthorized: true,
    geography: PORTSMOUTH_CONTROLLED_LOCALITY,
    participation: { allowed: true, authority: "released" },
    location,
    profileCompletion: completion,
    restriction: null,
    now,
  });
  assert.equal(marker.status, "active");
  return { serviceGeography, completion, marker };
}

async function seed() {
  const geographySnapshot = await db.collection("geographies").doc(String(PORTSMOUTH_CONTROLLED_LOCALITY.id)).get();
  assert.equal(geographySnapshot.exists, true, "The selected real project must already contain the canonical Portsmouth geography.");

  const runId = `s35-${Date.now()}-${randomBytes(3).toString("hex")}`;
  const now = new Date().toISOString();
  const password = `RFxchange-${randomBytes(18).toString("base64url")}!7a`;
  const email = `${runId}@example.test`;
  const externalEmail = `${runId}-external@example.test`;
  const firebase = await auth.createUser({ email, password, emailVerified: true, displayName: "Slice 3.5 Acceptance Manager" });
  const userId = `usr_${createHash("sha256").update(`rfxchange:user:firebase:${firebase.uid}`, "utf8").digest("hex").slice(0, 32)}`;
  const senderOrganizationId = `org_${runId}_sender`;
  const recipientOrganizationId = `org_${runId}_recipient`;
  const membershipId = `membership_${runId}_sender`;
  const recipientFixtureMembershipId = `membership_${runId}_recipient_fixture`;
  const journeyId = `activation-${userId}`;

  const user = createUserIdentity({
    id: userId,
    name: "Slice 3.5 Acceptance Manager",
    primaryEmail: email,
    loginProvider: "firebase",
    loginSubject: firebase.uid,
    now,
  });
  const sender = createOrganizationAccount({ id: senderOrganizationId, now });
  const recipient = createOrganizationAccount({ id: recipientOrganizationId, now });
  const membership = createOrganizationMembership(user, sender, { id: membershipId, now });
  const authorization = createOrganizationUserAuthorization(membership, sender, {
    roleKey: "primary-administrator",
    permissions: ["organization.profile.manage", "referral.manage"],
    now,
  });
  const senderProfile = profileFor(sender, `Referral Sender ${runId}`, email, now, runId);
  const recipientProfile = profileFor(recipient, `Referral Recipient ${runId}`, externalEmail, now, runId);
  const senderLocation = locationFor(sender, user, membershipId, [-76.2982, 36.8354], "400 Crawford Street", now);
  const recipientLocation = locationFor(recipient, user, recipientFixtureMembershipId, [-76.3042, 36.8394], "700 Crawford Street", now);
  const senderSpatial = completionAndMarker(sender, senderProfile, senderLocation, user, membershipId, now);
  const recipientSpatial = completionAndMarker(recipient, recipientProfile, recipientLocation, user, recipientFixtureMembershipId, now);

  let lifecycle = createAccessLifecycle({ id: journeyId, now });
  lifecycle = advanceAccessLifecycle(lifecycle, "account-started", now);
  lifecycle = associateAccessJourneyWithUser(lifecycle, user.id, now);
  for (const state of ["account-activated", "geography-selected", "organization-resolved", "organization-registered", "organization-activated", "controlled-platform", "open-platform"]) {
    lifecycle = advanceAccessLifecycle(lifecycle, state, now);
  }
  let activation = createActivationJourneyContext({
    userId: user.id,
    provisionalOrganizationName: senderProfile.displayName,
    organizationRelationship: "owner",
    organizationIdentitySeed: { websiteDisposition: "available", websiteUrl: senderProfile.website.url },
    now,
  });
  activation = updateActivationJourneyContext(activation, {
    legalAcceptance: createActivationLegalAcceptance(now),
    orientationBridgeAcknowledgedAt: now,
    organizationId: sender.id,
    membershipId: membership.id,
    now,
  });
  const selection = createPrimaryOperatingGeographySelection(user.id, accessJourneyId(journeyId), PORTSMOUTH_CONTROLLED_LOCALITY.id, now);
  const geographyAuthorization = createGeographyParticipationAuthorization(PORTSMOUTH_CONTROLLED_LOCALITY, {
    id: `geography-auth-${runId}`,
    subject: { kind: "user", userId: user.id },
    activities: ["network-participation"],
    now,
  });

  const records = [
    ["users", user.id, user],
    ["organizations", sender.id, sender],
    ["organizations", recipient.id, recipient],
    ["organizationProfiles", senderProfile.id, senderProfile],
    ["organizationProfiles", recipientProfile.id, recipientProfile],
    ["organizationMemberships", membership.id, membership],
    ["organizationAuthorizations", membership.id, authorization],
    ["activationJourneyContexts", user.id, activation],
    ["accessJourneys", lifecycle.id, lifecycle],
    ["primaryGeographySelections", user.id, selection],
    ["geographyParticipationAuthorizations", geographyAuthorization.id, geographyAuthorization],
    ["organizationLocations", sender.id, senderLocation],
    ["organizationLocations", recipient.id, recipientLocation],
    ["organizationServiceGeographies", sender.id, senderSpatial.serviceGeography],
    ["organizationServiceGeographies", recipient.id, recipientSpatial.serviceGeography],
    ["organizationProfileCompletions", sender.id, senderSpatial.completion],
    ["organizationProfileCompletions", recipient.id, recipientSpatial.completion],
    ["organizationMarkerActivations", sender.id, senderSpatial.marker],
    ["organizationMarkerActivations", recipient.id, recipientSpatial.marker],
  ];
  try {
    for (const [collection, id, value] of records) await persist(collection, id, value);
  } catch (error) {
    await auth.deleteUser(firebase.uid).catch(() => undefined);
    throw error;
  }

  const state = {
    runId,
    projectId,
    email,
    password,
    externalEmail,
    firebaseUid: firebase.uid,
    userId,
    senderOrganizationId,
    recipientOrganizationId,
    senderOrganizationName: senderProfile.displayName,
    recipientOrganizationName: recipientProfile.displayName,
    membershipId,
    journeyId,
    geographyAuthorizationId: String(geographyAuthorization.id),
    createdRecords: records.map(([collection, id]) => [collection, String(id)]),
  };
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  await chmod(statePath, 0o600);
  console.log(JSON.stringify({ seeded: true, runId, projectId, createdRecords: records.length }));
}

async function loadState() {
  const state = JSON.parse(await readFile(statePath, "utf8"));
  assert.equal(state.projectId, projectId, "Acceptance state belongs to another Firebase project.");
  assert.match(state.runId, /^s35-\d+-[a-f0-9]{6}$/);
  return state;
}

async function seedExternalRecipient() {
  const state = await loadState();
  assert.equal(state.externalActor, undefined, "External recipient fixture is already seeded.");
  const referrals = await documentsFor(db.collection("businessReferrals").where("senderOrganizationId", "==", state.senderOrganizationId));
  const externalReferral = referrals.find((document) => document.data().recipient?.kind === "external");
  assert.ok(externalReferral, "External referral must be sent before seeding its recipient.");
  const communication = (await documentsFor(db.collection("referralCommunicationIntents").where("referralId", "==", externalReferral.id)))[0];
  const continueUrl = communication?.data().request?.variables?.continue_url;
  assert.equal(typeof continueUrl, "string", "External referral communication must contain the signed continuation URL.");
  assert.equal(new URL(continueUrl).origin, "http://localhost:3000", "Configured acceptance continuation must return to the local application origin.");

  const now = new Date().toISOString();
  const password = `RFxchange-${randomBytes(18).toString("base64url")}!8b`;
  const firebase = await auth.createUser({ email: state.externalEmail, password, emailVerified: true, displayName: "Slice 3.5 External Recipient" });
  const userId = `usr_${createHash("sha256").update(`rfxchange:user:firebase:${firebase.uid}`, "utf8").digest("hex").slice(0, 32)}`;
  const organizationId = `org_${state.runId}_external`;
  const membershipId = `membership_${state.runId}_external`;
  const journeyId = `activation-${userId}`;
  const user = createUserIdentity({ id: userId, name: "Slice 3.5 External Recipient", primaryEmail: state.externalEmail, loginProvider: "firebase", loginSubject: firebase.uid, now });
  const organization = createOrganizationAccount({ id: organizationId, now });
  const membership = createOrganizationMembership(user, organization, { id: membershipId, now });
  const authorization = createOrganizationUserAuthorization(membership, organization, { roleKey: "referral-manager", permissions: ["referral.manage"], now });
  const profile = profileFor(organization, `External Referral Organization ${state.runId}`, state.externalEmail, now, `${state.runId}-external`);
  const location = locationFor(organization, user, membershipId, [-76.3092, 36.8414], "900 Crawford Street", now);
  const spatial = completionAndMarker(organization, profile, location, user, membershipId, now);
  let lifecycle = createAccessLifecycle({ id: journeyId, now });
  lifecycle = advanceAccessLifecycle(lifecycle, "account-started", now);
  lifecycle = associateAccessJourneyWithUser(lifecycle, user.id, now);
  for (const lifecycleState of ["account-activated", "geography-selected", "organization-resolved", "organization-registered", "organization-activated", "controlled-platform", "open-platform"]) lifecycle = advanceAccessLifecycle(lifecycle, lifecycleState, now);
  let activation = createActivationJourneyContext({ userId: user.id, provisionalOrganizationName: profile.displayName, organizationRelationship: "owner", organizationIdentitySeed: { websiteDisposition: "available", websiteUrl: profile.website.url }, now });
  activation = updateActivationJourneyContext(activation, { legalAcceptance: createActivationLegalAcceptance(now), orientationBridgeAcknowledgedAt: now, organizationId: organization.id, membershipId: membership.id, now });
  const selection = createPrimaryOperatingGeographySelection(user.id, accessJourneyId(journeyId), PORTSMOUTH_CONTROLLED_LOCALITY.id, now);
  const geographyAuthorization = createGeographyParticipationAuthorization(PORTSMOUTH_CONTROLLED_LOCALITY, { id: `geography-auth-${state.runId}-external`, subject: { kind: "user", userId: user.id }, activities: ["network-participation"], now });
  const records = [
    ["users", user.id, user],
    ["organizations", organization.id, organization],
    ["organizationProfiles", profile.id, profile],
    ["organizationMemberships", membership.id, membership],
    ["organizationAuthorizations", membership.id, authorization],
    ["activationJourneyContexts", user.id, activation],
    ["accessJourneys", lifecycle.id, lifecycle],
    ["primaryGeographySelections", user.id, selection],
    ["geographyParticipationAuthorizations", geographyAuthorization.id, geographyAuthorization],
    ["organizationLocations", organization.id, location],
    ["organizationServiceGeographies", organization.id, spatial.serviceGeography],
    ["organizationProfileCompletions", organization.id, spatial.completion],
    ["organizationMarkerActivations", organization.id, spatial.marker],
  ];
  try {
    for (const [collection, id, value] of records) await persist(collection, id, value);
  } catch (error) {
    await auth.deleteUser(firebase.uid).catch(() => undefined);
    throw error;
  }
  state.createdRecords.push(...records.map(([collection, id]) => [collection, String(id)]));
  state.externalActor = { firebaseUid: firebase.uid, userId, organizationId, membershipId, journeyId, password, continueUrl };
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  await chmod(statePath, 0o600);
  console.log(JSON.stringify({ seededExternalRecipient: true, runId: state.runId, createdRecords: records.length }));
}

async function documentsFor(query) {
  const snapshot = await query.get();
  return snapshot.docs;
}

async function inspect() {
  const state = await loadState();
  const referrals = await documentsFor(db.collection("businessReferrals").where("senderOrganizationId", "==", state.senderOrganizationId));
  const statuses = referrals.map((document) => document.data().status).sort();
  const external = referrals.find((document) => document.data().recipient?.kind === "external");
  const existing = referrals.find((document) => document.data().recipient?.kind === "organization");
  assert.ok(existing, "Configured acceptance must create an existing-organization referral.");
  assert.ok(external, "Configured acceptance must create an external referral.");
  assert.equal(existing.data().recipient.organizationId, state.recipientOrganizationId);
  assert.equal(external.data().recipient.email, state.externalEmail);
  assert.equal(external.data().attachedRecipientOrganizationId, state.externalActor?.organizationId, "External referral must attach only to the legitimate recipient organization.");
  assert.equal(external.data().recipientActorUserId, state.externalActor?.userId, "External referral must preserve the legitimate recipient actor.");
  assert.equal(external.data().status, "closed", "Configured browser must complete the external referral through contact and sender close.");
  const education = await documentsFor(db.collection("referralEducationAcknowledgements").where("organizationId", "==", state.senderOrganizationId));
  const communications = await Promise.all(referrals.map((document) => documentsFor(db.collection("referralCommunicationIntents").where("referralId", "==", document.id))));
  assert.equal(education.length >= 2, true, "Both referral sends must record first-use education acknowledgement evidence.");
  assert.equal(communications.flat().length, 2, "Both referral sends must preserve communication intents.");
  assert.equal(external.data().acquisitionContextId !== null, true, "External referral must preserve an acquisition context.");
  console.log(JSON.stringify({
    inspected: true,
    referrals: referrals.length,
    statuses,
    educationAcknowledgements: education.length,
    communicationIntents: communications.flat().length,
    externalAcquisitionIssued: true,
  }));
}

async function cleanup() {
  const state = await loadState();
  const deleteRefs = new Map();
  const schedule = (document) => {
    const ref = document.ref ?? document;
    deleteRefs.set(ref.path, ref);
  };
  for (const [collection, id] of state.createdRecords) schedule(db.collection(collection).doc(id));

  const referrals = await documentsFor(db.collection("businessReferrals").where("senderOrganizationId", "==", state.senderOrganizationId));
  const referralIds = referrals.map((document) => document.id);
  referrals.forEach(schedule);
  for (const document of await documentsFor(db.collection("businessReferralEvents").where("senderOrganizationId", "==", state.senderOrganizationId))) schedule(document);
  for (const document of await documentsFor(db.collection("businessReferralCommands").where("actorOrganizationId", "==", state.senderOrganizationId))) schedule(document);
  for (const document of await documentsFor(db.collection("referralEducationAcknowledgements").where("organizationId", "==", state.senderOrganizationId))) schedule(document);
  for (const document of await documentsFor(db.collection("organizationAuditEvents").where("organizationId", "==", state.senderOrganizationId))) schedule(document);
  const acquisitionContextIds = [];
  for (const referralId of referralIds) {
    for (const document of await documentsFor(db.collection("referralCommunicationIntents").where("referralId", "==", referralId))) schedule(document);
    for (const document of await documentsFor(db.collection("acquisitionContexts").where("intent.subjectReference", "==", referralId))) {
      acquisitionContextIds.push(document.id);
      schedule(document);
    }
  }
  for (const contextId of acquisitionContextIds) {
    for (const document of await documentsFor(db.collection("acquisitionContextEvents").where("acquisitionContextId", "==", contextId))) schedule(document);
  }

  const refs = [...deleteRefs.values()];
  while (refs.length) {
    const batch = db.batch();
    for (const ref of refs.splice(0, 400)) batch.delete(ref);
    await batch.commit();
  }
  await auth.deleteUser(state.firebaseUid).catch((error) => {
    if (error?.code !== "auth/user-not-found") throw error;
  });
  if (state.externalActor?.firebaseUid) {
    await auth.deleteUser(state.externalActor.firebaseUid).catch((error) => {
      if (error?.code !== "auth/user-not-found") throw error;
    });
  }

  const residual = [];
  for (const [collection, id] of state.createdRecords) {
    if ((await db.collection(collection).doc(id).get()).exists) residual.push(`${collection}/${id}`);
  }
  for (const document of await documentsFor(db.collection("businessReferrals").where("senderOrganizationId", "==", state.senderOrganizationId))) residual.push(document.ref.path);
  for (const document of await documentsFor(db.collection("organizationAuditEvents").where("organizationId", "==", state.senderOrganizationId))) residual.push(document.ref.path);
  assert.deepEqual(residual, [], "Configured acceptance cleanup left residual records.");
  await auth.getUser(state.firebaseUid).then(
    () => assert.fail("Configured acceptance cleanup left the Firebase Auth user."),
    (error) => assert.equal(error?.code, "auth/user-not-found"),
  );
  if (state.externalActor?.firebaseUid) {
    await auth.getUser(state.externalActor.firebaseUid).then(
      () => assert.fail("Configured acceptance cleanup left the external Firebase Auth user."),
      (error) => assert.equal(error?.code, "auth/user-not-found"),
    );
  }
  console.log(JSON.stringify({ cleaned: true, deletedRecords: deleteRefs.size, residualRecords: 0, residualAuthUsers: 0 }));
}

try {
  if (mode === "seed") await seed();
  if (mode === "seed-external-recipient") await seedExternalRecipient();
  if (mode === "inspect") await inspect();
  if (mode === "cleanup") await cleanup();
} finally {
  await deleteApp(app);
}
