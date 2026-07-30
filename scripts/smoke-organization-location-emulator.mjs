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
import { PORTSMOUTH_CONTROLLED_LOCALITY } from "../src/data/geography/hampton-roads-controlled-locality.ts";
import {
  confirmOrganizationLocationDraft,
  createConfirmedOrganizationLocation,
  createOrganizationGeocodeCandidate,
  createOrganizationLocationDraft,
  createOrganizationLocationEvent,
  createOrganizationServiceGeography,
  structuredPostalAddress,
} from "../src/domain/organization-location/model.ts";
import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
} from "../src/domain/users/model.ts";
import {
  createFirestoreOrganizationLocationRepositories,
} from "../src/infrastructure/firestore/organization-location.ts";

assert.equal(
  process.env.FIRESTORE_EMULATOR_HOST,
  "127.0.0.1:8080",
  "Slice 2.6 acceptance must use the Firestore emulator.",
);

const projectId = "demo-rfxchange";
const runId = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const now = new Date().toISOString();
const adminApp = initializeAdminApp({ projectId }, `location-admin-${runId}`);
const adminDb = getAdminFirestore(adminApp);
const clientApp = initializeClientApp({
  apiKey: "demo-api-key",
  authDomain: `${projectId}.firebaseapp.com`,
  projectId,
  appId: `1:123:web:location-${runId}`,
}, `location-client-${runId}`);
const clientDb = getClientFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);

const organization = createOrganizationAccount({
  id: `org_location_${runId}`,
  now,
});
const user = createUserIdentity({
  id: `user_location_${runId}`,
  name: "Location Emulator Administrator",
  primaryEmail: `location-${runId}@example.test`,
  loginProvider: "firebase",
  loginSubject: `subject-location-${runId}`,
  now,
});
const membership = createOrganizationMembership(user, organization, {
  id: `membership_location_${runId}`,
  now,
});
const physicalAddress = structuredPostalAddress({
  addressLine1: "200 High St",
  locality: "Portsmouth",
  regionCode: "VA",
  postalCode: "23704",
});
const mailingAddress = structuredPostalAddress({
  addressLine1: "PO Box 430",
  locality: "Portsmouth",
  regionCode: "VA",
  postalCode: "23705",
});
const candidate = createOrganizationGeocodeCandidate({
  id: `candidate_${runId}`,
  geographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
  coordinate: [-76.297933263584, 36.835462854397],
  matchedAddress: "200 HIGH ST, PORTSMOUTH, VA, 23704",
  quality: "address-range",
  provider: "U.S. Census Geocoder",
  providerReference: "tiger-line:122199924",
  benchmark: "Public_AR_Current",
  retrievedAt: now,
});
const initialDraft = createOrganizationLocationDraft({
  id: `draft_${runId}`,
  organizationId: organization.id,
  requestedByUserId: user.id,
  membershipId: membership.id,
  primaryGeographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
  physicalAddress,
  mailingAddress,
  isHomeOrPrivate: true,
  candidates: [candidate],
  now,
});
const geocodedEvent = createOrganizationLocationEvent({
  id: `event_geocoded_${runId}`,
  organizationId: organization.id,
  userId: user.id,
  membershipId: membership.id,
  kind: "address-geocoded",
  subjectId: initialDraft.id,
  newState: { state: initialDraft.state, candidateCount: initialDraft.candidates.length },
  reason: "Emulator address geocoded.",
  now,
});
const confirmation = confirmOrganizationLocationDraft(initialDraft, candidate.id, now);
const location = createConfirmedOrganizationLocation({
  draft: confirmation.draft,
  candidate: confirmation.candidate,
  confirmedByUserId: user.id,
  confirmedByMembershipId: membership.id,
  now,
});
const confirmationEvent = createOrganizationLocationEvent({
  id: `event_confirmed_${runId}`,
  organizationId: organization.id,
  userId: user.id,
  membershipId: membership.id,
  kind: "location-confirmed",
  subjectId: location.id,
  priorState: { state: initialDraft.state },
  newState: { state: confirmation.draft.state, geographyId: location.geographyId },
  reason: "Emulator user confirmed the map candidate.",
  now,
});
const confirmationAudit = createOrganizationActionAuditEvent(
  user,
  membership,
  organization,
  {
    id: `audit_location_${runId}`,
    action: "organization.location.confirmed",
    occurredAt: now,
  },
);
const serviceGeographies = createOrganizationServiceGeography({
  organizationId: organization.id,
  primaryGeographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
  serviceGeographyIds: [PORTSMOUTH_CONTROLLED_LOCALITY.id],
  updatedByUserId: user.id,
  updatedByMembershipId: membership.id,
  now,
});
const serviceEvent = createOrganizationLocationEvent({
  id: `event_service_${runId}`,
  organizationId: organization.id,
  userId: user.id,
  membershipId: membership.id,
  kind: "service-geographies-changed",
  subjectId: serviceGeographies.id,
  newState: { serviceGeographyIds: serviceGeographies.serviceGeographyIds },
  reason: "Emulator service geography selected.",
  now,
});
const serviceAudit = createOrganizationActionAuditEvent(
  user,
  membership,
  organization,
  {
    id: `audit_service_${runId}`,
    action: "organization.service-geographies.changed",
    occurredAt: now,
  },
);
const cleanup = [
  ["organizationLocationDrafts", initialDraft.id],
  ["organizationLocations", location.id],
  ["organizationLocationEvents", geocodedEvent.id],
  ["organizationLocationEvents", confirmationEvent.id],
  ["organizationLocationEvents", serviceEvent.id],
  ["organizationServiceGeographies", serviceGeographies.id],
  ["organizationAuditEvents", confirmationAudit.id],
  ["organizationAuditEvents", serviceAudit.id],
];

try {
  const repositories = createFirestoreOrganizationLocationRepositories(adminDb);
  await repositories.drafts.save(initialDraft, geocodedEvent);
  await repositories.unitOfWork.confirm({
    draft: confirmation.draft,
    location,
    event: confirmationEvent,
    auditEvent: confirmationAudit,
  });
  await repositories.unitOfWork.saveServiceGeographies({
    serviceGeographies,
    event: serviceEvent,
    auditEvent: serviceAudit,
  });

  const persistedDraft = await adminDb
    .collection("organizationLocationDrafts")
    .doc(initialDraft.id)
    .get();
  const persistedLocation = await adminDb
    .collection("organizationLocations")
    .doc(location.id)
    .get();
  const persistedService = await adminDb
    .collection("organizationServiceGeographies")
    .doc(serviceGeographies.id)
    .get();
  assert.equal(persistedDraft.data()?.state, "confirmed");
  assert.equal(persistedLocation.data()?.geographyId, PORTSMOUTH_CONTROLLED_LOCALITY.id);
  assert.deepEqual(persistedLocation.data()?.coordinate, [-76.297933263584, 36.835462854397]);
  assert.deepEqual(
    persistedService.data()?.serviceGeographyIds,
    [PORTSMOUTH_CONTROLLED_LOCALITY.id],
  );
  assert.equal(
    (
      await adminDb
        .collection("organizationLocationEvents")
        .where("organizationId", "==", organization.id)
        .get()
    ).size,
    3,
  );

  for (const [collection, id] of [
    ["organizationLocationDrafts", initialDraft.id],
    ["organizationLocations", location.id],
    ["organizationLocationEvents", confirmationEvent.id],
    ["organizationServiceGeographies", serviceGeographies.id],
  ]) {
    await assert.rejects(
      () => getDoc(doc(clientDb, collection, id)),
      (error) => error?.code === "permission-denied",
    );
  }
  console.log("Slice 2.6 organization location Firestore emulator acceptance passed.");
} finally {
  for (const [collection, id] of cleanup.reverse()) {
    await adminDb.collection(collection).doc(id).delete().catch(() => undefined);
  }
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}
