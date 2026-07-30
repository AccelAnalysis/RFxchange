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

import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import { standardOrganizationRolePreset } from "../src/domain/authorization/organization-role-presets.ts";
import { geographyId } from "../src/domain/geography/model.ts";
import {
  advanceAccessLifecycle,
  associateAccessJourneyWithUser,
  createAccessLifecycle,
} from "../src/domain/lifecycle/model.ts";
import { createOrganizationAccount, createOrganizationProfile } from "../src/domain/organizations/model.ts";
import {
  createOrganizationResolutionRecord,
} from "../src/domain/organization-resolution/model.ts";
import {
  createOrganizationAuthorityClaim,
  createOrganizationAuthorityClaimSubmittedEvent,
  createOrganizationAuthorityDecision,
  createOrganizationAuthorityEvidence,
  transitionOrganizationAuthorityClaim,
} from "../src/domain/organization-claims/model.ts";
import { createOrganizationMembership, createUserIdentity } from "../src/domain/users/model.ts";
import {
  createFirestoreOrganizationAuthorityClaims,
} from "../src/infrastructure/firestore/organization-authority-claims.ts";

assert.equal(
  process.env.FIRESTORE_EMULATOR_HOST,
  "127.0.0.1:8080",
  "Slice 2.5 acceptance must use the Firestore emulator.",
);

const projectId = "demo-rfxchange";
const runId = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const adminApp = initializeAdminApp({ projectId }, `authority-admin-${runId}`);
const adminDb = getAdminFirestore(adminApp);
const clientApp = initializeClientApp({
  apiKey: "demo-api-key",
  authDomain: `${projectId}.firebaseapp.com`,
  projectId,
  appId: `1:123:web:authority-${runId}`,
}, `authority-client-${runId}`);
const clientDb = getClientFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);

const now = new Date().toISOString();
const organization = createOrganizationAccount({ id: `org_authority_${runId}`, now });
const profile = createOrganizationProfile(organization, {
  id: `profile_authority_${runId}`,
  displayName: "Authority Emulator Organization",
  now,
});
const user = createUserIdentity({
  id: `user_authority_${runId}`,
  name: "Authority Emulator User",
  primaryEmail: `authority-${runId}@example.test`,
  loginProvider: "firebase",
  loginSubject: `subject-authority-${runId}`,
  now,
});
let lifecycle = createAccessLifecycle({ id: `journey_authority_${runId}`, now });
lifecycle = advanceAccessLifecycle(lifecycle, "account-started", now);
lifecycle = advanceAccessLifecycle(lifecycle, "account-activated", now);
lifecycle = associateAccessJourneyWithUser(lifecycle, user.id, now);
lifecycle = advanceAccessLifecycle(lifecycle, "geography-selected", now);
lifecycle = advanceAccessLifecycle(lifecycle, "organization-resolved", now);
const resolution = createOrganizationResolutionRecord({
  id: `resolution_authority_${runId}`,
  userId: user.id,
  accessJourneyId: lifecycle.id,
  organizationId: organization.id,
  profileId: profile.id,
  disposition: "existing-organization-selected",
  provisionalIdentity: {
    displayName: profile.displayName,
    geographyId: geographyId(`geo_authority_${runId}`),
  },
  decisionReason: "Emulator resolution.",
  now,
});
const evidence = createOrganizationAuthorityEvidence({
  id: `evidence_authority_${runId}`,
  kind: "authoritative-record",
  reference: `authoritative-record:${runId}`,
  status: "verified",
  verifiedBy: "system",
  submittedAt: now,
  verifiedAt: now,
});
const claim = createOrganizationAuthorityClaim({
  id: `claim_authority_${runId}`,
  resolution,
  geographyId: resolution.provisionalIdentity.geographyId,
  evidence: [evidence],
  now,
});
const submitted = createOrganizationAuthorityClaimSubmittedEvent({
  id: `event_submitted_${runId}`,
  claim,
  reason: "Emulator authority claim.",
  now,
});
const membership = createOrganizationMembership(user, organization, {
  id: `membership_authority_${runId}`,
  now,
});
const preset = standardOrganizationRolePreset("primary-administrator");
const authorization = createOrganizationUserAuthorization(membership, organization, {
  roleKey: preset.key,
  permissions: preset.permissions,
  now,
});
const approved = transitionOrganizationAuthorityClaim({
  claim,
  eventId: `event_approved_${runId}`,
  actor: { kind: "system", id: "emulator-authority-verifier" },
  toStatus: "approved",
  action: "organization.authority-claim.approved",
  reason: "Authoritative record verified.",
  membershipId: membership.id,
  now,
});
const decision = createOrganizationAuthorityDecision({
  id: `decision_authority_${runId}`,
  claim: approved.claim,
  outcome: "approved",
  decisionMaker: "system",
  decisionMakerId: "emulator-authority-verifier",
  reason: "Authoritative record verified.",
  now,
});
const registeredLifecycle = advanceAccessLifecycle(lifecycle, "organization-registered", now);
const cleanup = [
  ["organizations", organization.id],
  ["organizationProfiles", profile.id],
  ["users", user.id],
  ["accessJourneys", lifecycle.id],
  ["organizationResolutions", resolution.id],
  ["organizationAuthorityClaims", claim.id],
  ["organizationAuthorityClaimEvents", submitted.id],
  ["organizationAuthorityClaimEvents", approved.event.id],
  ["organizationAuthorityDecisions", decision.id],
  ["organizationMemberships", membership.id],
  ["organizationAuthorizations", authorization.membershipId],
];

try {
  for (const [collection, record] of [
    ["organizations", organization],
    ["organizationProfiles", profile],
    ["users", user],
    ["accessJourneys", lifecycle],
    ["organizationResolutions", resolution],
  ]) {
    await adminDb.collection(collection).doc(record.id).set({ ...record, schemaVersion: 1 });
  }
  const repositories = createFirestoreOrganizationAuthorityClaims(adminDb);
  await repositories.claims.create(claim, submitted);
  await repositories.unitOfWork.approve({
    ...approved,
    decision,
    membership,
    authorization,
    lifecycle: registeredLifecycle,
  });

  assert.equal((await adminDb.collection("organizationAuthorityClaims").doc(claim.id).get()).data()?.status, "approved");
  assert.equal((await adminDb.collection("organizationMemberships").doc(membership.id).get()).data()?.organizationId, organization.id);
  assert.equal((await adminDb.collection("organizationAuthorizations").doc(membership.id).get()).data()?.roleKey, "primary-administrator");
  assert.equal((await adminDb.collection("accessJourneys").doc(lifecycle.id).get()).data()?.state, "organization-registered");
  assert.equal((await adminDb.collection("organizationAuthorityDecisions").doc(decision.id).get()).data()?.verificationState, "not-evaluated");

  for (const [collection, id] of [
    ["organizationAuthorityClaims", claim.id],
    ["organizationAuthorityClaimEvents", approved.event.id],
    ["organizationAuthorityDecisions", decision.id],
  ]) {
    await assert.rejects(
      () => getDoc(doc(clientDb, collection, id)),
      (error) => error?.code === "permission-denied",
    );
  }
  console.log("Slice 2.5 organization authority Firestore emulator acceptance passed.");
} finally {
  for (const [collection, id] of cleanup.reverse()) {
    await adminDb.collection(collection).doc(id).delete().catch(() => undefined);
  }
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}
