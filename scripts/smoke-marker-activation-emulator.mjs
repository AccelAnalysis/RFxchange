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
  createAccessRestriction,
  organizationRestrictionTarget,
} from "../src/domain/lifecycle/model.ts";
import {
  createOrganizationMarkerEvent,
  evaluateOrganizationMarkerActivation,
} from "../src/domain/organization-markers/model.ts";
import {
  createOrganizationAccount,
} from "../src/domain/organizations/model.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
} from "../src/domain/users/model.ts";
import {
  PORTSMOUTH_CONTROLLED_LOCALITY,
} from "../src/data/geography/hampton-roads-controlled-locality.ts";
import {
  createFirestoreOrganizationMarkerRepositories,
} from "../src/infrastructure/firestore/organization-marker.ts";

assert.equal(
  process.env.FIRESTORE_EMULATOR_HOST,
  "127.0.0.1:8080",
  "Slice 2.8 acceptance must use the Firestore emulator.",
);

const projectId = "demo-rfxchange";
const runId = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const now = new Date().toISOString();
const later = new Date(Date.now() + 60_000).toISOString();
const adminApp = initializeAdminApp({ projectId }, `marker-admin-${runId}`);
const adminDb = getAdminFirestore(adminApp);
const clientApp = initializeClientApp({
  apiKey: "demo-api-key",
  authDomain: `${projectId}.firebaseapp.com`,
  projectId,
  appId: `1:123:web:marker-${runId}`,
}, `marker-client-${runId}`);
const clientDb = getClientFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);

const organization = createOrganizationAccount({
  id: `org_marker_${runId}`,
  now,
});
const user = createUserIdentity({
  id: `user_marker_${runId}`,
  name: "Marker Activation Administrator",
  primaryEmail: `marker-${runId}@example.test`,
  loginProvider: "firebase",
  loginSubject: `subject-marker-${runId}`,
  now,
});
const membership = createOrganizationMembership(user, organization, {
  id: `membership_marker_${runId}`,
  now,
});
const location = Object.freeze({
  id: organization.id,
  organizationId: organization.id,
  sourceDraftId: `draft_marker_${runId}`,
  geographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
  physicalAddress: Object.freeze({
    addressLine1: "200 High St",
    addressLine2: null,
    locality: "Portsmouth",
    regionCode: "VA",
    postalCode: "23704",
    countryCode: "US",
  }),
  mailingAddress: null,
  isHomeOrPrivate: false,
  visibility: "approximate",
  coordinate: Object.freeze([-76.297933263584, 36.835462854397]),
  geocodeQuality: "address-range",
  geocodeProvenance: Object.freeze({
    provider: "U.S. Census Geocoder",
    providerReference: "122199924",
    benchmark: "Public_AR_Current",
    retrievedAt: now,
  }),
  confirmedByUserId: user.id,
  confirmedByMembershipId: membership.id,
  confirmedAt: now,
  updatedAt: now,
});
const completion = Object.freeze({
  id: organization.id,
  organizationId: organization.id,
  profileId: `profile_marker_${runId}`,
  credentialFamily: "active",
  credentialKey: "profile-complete",
  status: "active",
  missingRequirements: Object.freeze([]),
  sourceProfileUpdatedAt: now,
  sourceLocationUpdatedAt: now,
  sourceServiceGeographyUpdatedAt: now,
  firstActivatedAt: now,
  lastTransitionAt: now,
  evaluatedAt: now,
});
const active = evaluateOrganizationMarkerActivation({
  organization,
  relationshipAuthorized: true,
  geography: PORTSMOUTH_CONTROLLED_LOCALITY,
  participation: { allowed: true, authority: "released" },
  location,
  profileCompletion: completion,
  restriction: null,
  now,
});
const activeEvent = createOrganizationMarkerEvent({
  id: `marker_event_active_${runId}`,
  activation: active,
  reason: "All authoritative activation gates passed.",
  now,
});
const activeAudit = createOrganizationActionAuditEvent(
  user,
  membership,
  organization,
  {
    id: `marker_audit_active_${runId}`,
    action: "organization.marker.activated",
    occurredAt: now,
  },
);
const cleanup = [
  ["organizationMarkerActivations", active.id],
  ["organizationMarkerEvents", activeEvent.id],
  ["organizationAuditEvents", activeAudit.id],
];

try {
  const repositories = createFirestoreOrganizationMarkerRepositories(adminDb);
  await repositories.unitOfWork.save({
    activation: active,
    event: activeEvent,
    auditEvent: activeAudit,
  });
  const persisted = await repositories.activations.getByOrganizationId(
    organization.id,
  );
  assert.equal(persisted?.status, "active");
  assert.equal(persisted?.firstActivatedAt, active.firstActivatedAt);

  const repeated = evaluateOrganizationMarkerActivation({
    organization,
    relationshipAuthorized: true,
    geography: PORTSMOUTH_CONTROLLED_LOCALITY,
    participation: { allowed: true, authority: "released" },
    location,
    profileCompletion: completion,
    restriction: null,
    prior: persisted,
    now: later,
  });
  await repositories.unitOfWork.save({
    activation: repeated,
    event: null,
    auditEvent: null,
  });
  assert.equal(
    (
      await adminDb
        .collection("organizationMarkerEvents")
        .where("organizationId", "==", organization.id)
        .get()
    ).size,
    1,
    "Idempotent recalculation must not duplicate activation events.",
  );

  const restriction = createAccessRestriction(
    organizationRestrictionTarget(organization),
    {
      id: `restriction_marker_${runId}`,
      state: "integrity-hold",
      now: later,
    },
  );
  const inactive = evaluateOrganizationMarkerActivation({
    organization,
    relationshipAuthorized: true,
    geography: PORTSMOUTH_CONTROLLED_LOCALITY,
    participation: { allowed: true, authority: "released" },
    location,
    profileCompletion: completion,
    restriction,
    prior: repeated,
    now: later,
  });
  const inactiveEvent = createOrganizationMarkerEvent({
    id: `marker_event_inactive_${runId}`,
    activation: inactive,
    priorStatus: repeated.status,
    reason: "Organization integrity hold blocks public map presence.",
    now: later,
  });
  const inactiveAudit = createOrganizationActionAuditEvent(
    user,
    membership,
    organization,
    {
      id: `marker_audit_inactive_${runId}`,
      action: "organization.marker.deactivated",
      occurredAt: later,
    },
  );
  cleanup.push(
    ["organizationMarkerEvents", inactiveEvent.id],
    ["organizationAuditEvents", inactiveAudit.id],
  );
  await repositories.unitOfWork.save({
    activation: inactive,
    event: inactiveEvent,
    auditEvent: inactiveAudit,
  });
  const deactivated = await repositories.activations.getByOrganizationId(
    organization.id,
  );
  assert.equal(deactivated?.status, "inactive");
  assert.deepEqual(deactivated?.blockingReasons, ["organization-blocked"]);
  assert.equal(deactivated?.firstActivatedAt, active.firstActivatedAt);

  for (const [collection, id] of [
    ["organizationMarkerActivations", active.id],
    ["organizationMarkerEvents", activeEvent.id],
  ]) {
    await assert.rejects(
      () => getDoc(doc(clientDb, collection, id)),
      (error) => error?.code === "permission-denied",
    );
  }
  console.log("Slice 2.8 marker activation Firestore emulator acceptance passed.");
} finally {
  for (const [collection, id] of cleanup.reverse()) {
    await adminDb.collection(collection).doc(id).delete().catch(() => undefined);
  }
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}
