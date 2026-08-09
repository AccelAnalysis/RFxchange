import assert from "node:assert/strict";
import {
  deleteApp as deleteAdminApp,
  initializeApp as initializeAdminApp,
} from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

import {
  createNetworkDiscoveryQuery,
  NetworkDiscoveryService,
} from "../src/application/network-discovery/network-discovery.ts";
import {
  createAccessRestriction,
  organizationRestrictionTarget,
} from "../src/domain/lifecycle/model.ts";
import {
  confirmOrganizationLocationDraft,
  createConfirmedOrganizationLocation,
  createOrganizationGeocodeCandidate,
  createOrganizationLocationDraft,
  createOrganizationServiceGeography,
  geographicPositionWithinBoundary,
  structuredPostalAddress,
} from "../src/domain/organization-location/model.ts";
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
import { TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES } from "../src/data/geography/tigerweb-2025-hampton-roads-boundaries.ts";
import {
  createFirestoreOrganizationLocationRepositories,
} from "../src/infrastructure/firestore/organization-location.ts";
import {
  createFirestoreEssentialOrganizationProfileRepositories,
} from "../src/infrastructure/firestore/organization-profile.ts";
import { FirestoreOrganizationMarketProfileRepository } from "../src/infrastructure/firestore/market-profile.ts";
import {
  FirestoreAccessRestrictionRepository,
  FirestoreOrganizationProfileRepository,
} from "../src/infrastructure/firestore/repositories.ts";

assert.equal(
  process.env.FIRESTORE_EMULATOR_HOST,
  "127.0.0.1:8080",
  "Slice 3.2 acceptance must use the Firestore emulator.",
);

const projectId = "demo-rfxchange";
const runId = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const now = new Date().toISOString();
const adminApp = initializeAdminApp({ projectId }, `network-discovery-admin-${runId}`);
const adminDb = getAdminFirestore(adminApp);
const cleanup = [];
const baseGeographyId = String(PORTSMOUTH_CONTROLLED_LOCALITY.id);
const norfolkGeographyId = "us-va-norfolk";
const selectedFeature = TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES.features.find(
  (feature) => feature.properties.geographyId === baseGeographyId,
);
assert.ok(selectedFeature, "Portsmouth authoritative boundary fixture is required.");
const selectedGeometry = selectedFeature.geometry;

function stripSchemaVersion(data) {
  if (!data || typeof data !== "object") return data;
  const { schemaVersion: _schemaVersion, ...record } = data;
  return record;
}

async function persist(collection, id, value) {
  await adminDb.collection(collection).doc(String(id)).set({ ...value, schemaVersion: 1 });
  cleanup.push([collection, String(id)]);
}

function actor(label) {
  const organization = createOrganizationAccount({
    id: `org_network_${label}_${runId}`,
    now,
  });
  const user = createUserIdentity({
    id: `user_network_${label}_${runId}`,
    name: `${label} Network User`,
    primaryEmail: `${label}-${runId}@example.test`,
    loginProvider: "firebase",
    loginSubject: `subject-network-${label}-${runId}`,
    now,
  });
  const membership = createOrganizationMembership(user, organization, {
    id: `membership_network_${label}_${runId}`,
    now,
  });
  return { organization, user, membership };
}

function profileFor(subject, input) {
  const base = createOrganizationProfile(subject.organization, {
    id: `profile_${subject.organization.id}`,
    displayName: input.displayName,
    now,
  });
  const capability = createOrganizationCapability({
    id: `cap_${subject.organization.id}`,
    kind: "service",
    name: input.capabilityName,
    description: input.capabilityDescription,
  });
  return updateEssentialOrganizationProfile(base, {
    displayName: input.displayName,
    organizationType: "for-profit-business",
    website: { disposition: "available", url: `https://${input.slug}.example.test` },
    mainContact: {
      displayName: `${input.displayName} Contact`,
      roleTitle: "Business Development",
      email: `${input.slug}-${runId}@example.test`,
      publiclyVisible: true,
    },
    capabilities: [capability],
    participationRoles: ["business", "supplier"],
    businessObjectives: ["find-opportunities", "find-teammates"],
    now,
  });
}

function locationFor(subject, input) {
  const address = structuredPostalAddress({
    addressLine1: input.addressLine1,
    locality: "Portsmouth",
    regionCode: "VA",
    postalCode: "23704",
  });
  const candidate = createOrganizationGeocodeCandidate({
    id: `candidate_${subject.organization.id}`,
    geographyId: baseGeographyId,
    coordinate: input.coordinate,
    matchedAddress: `${input.addressLine1}, Portsmouth, VA 23704`,
    quality: "rooftop",
    provider: "emulator-fixture",
    providerReference: `fixture-${subject.organization.id}`,
    benchmark: "slice-3.2",
    retrievedAt: now,
  });
  const draft = createOrganizationLocationDraft({
    id: `draft_${subject.organization.id}`,
    organizationId: subject.organization.id,
    requestedByUserId: subject.user.id,
    membershipId: subject.membership.id,
    primaryGeographyId: baseGeographyId,
    physicalAddress: address,
    isHomeOrPrivate: input.visibility === "locality-only",
    visibility: input.visibility,
    candidates: [candidate],
    now,
  });
  const confirmation = confirmOrganizationLocationDraft(draft, candidate.id, now);
  return createConfirmedOrganizationLocation({
    draft: confirmation.draft,
    candidate: confirmation.candidate,
    confirmedByUserId: subject.user.id,
    confirmedByMembershipId: subject.membership.id,
    now,
  });
}

function serviceGeographiesFor(subject, serviceGeographyIds) {
  return createOrganizationServiceGeography({
    organizationId: subject.organization.id,
    primaryGeographyId: baseGeographyId,
    serviceGeographyIds,
    updatedByUserId: subject.user.id,
    updatedByMembershipId: subject.membership.id,
    now,
  });
}

async function persistDiscoverable(subject, input) {
  const profile = profileFor(subject, input);
  const location = locationFor(subject, input);
  const serviceGeographies = serviceGeographiesFor(subject, input.serviceGeographyIds);
  const completion = evaluateOrganizationProfileCompletion({
    profile,
    location,
    serviceGeographies,
    now,
  });
  assert.equal(completion.status, "active");
  const activation = Object.freeze({
    id: subject.organization.id,
    organizationId: subject.organization.id,
    geographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
    status: "active",
    coordinateSource: "confirmed-canonical-location",
    blockingReasons: Object.freeze([]),
    sourceLocationUpdatedAt: location.updatedAt,
    sourceProfileCompletionEvaluatedAt: completion.evaluatedAt,
    firstActivatedAt: now,
    lastTransitionAt: now,
    evaluatedAt: now,
  });
  await Promise.all([
    persist("organizationProfiles", profile.id, profile),
    persist("organizationProfileCompletions", subject.organization.id, completion),
    persist("organizationLocations", subject.organization.id, location),
    persist("organizationServiceGeographies", subject.organization.id, serviceGeographies),
    persist("organizationMarkerActivations", subject.organization.id, activation),
  ]);
  return { profile, location, serviceGeographies, completion, activation };
}

const viewer = actor("viewer");
const exact = actor("exact");
const approximate = actor("approximate");
const localityOnly = actor("locality");
const restricted = actor("restricted");

const viewerRecords = await persistDiscoverable(viewer, {
  displayName: "Viewer Marine Services",
  slug: "viewer-marine",
  capabilityName: "Marine maintenance coordination",
  capabilityDescription: "Coordinates maintenance activity for marine facilities.",
  addressLine1: "400 Crawford Street",
  coordinate: [-76.2982, 36.8354],
  visibility: "exact",
  serviceGeographyIds: [baseGeographyId],
});
const exactRecords = await persistDiscoverable(exact, {
  displayName: "Harbor Cybersecurity Group",
  slug: "harbor-cyber",
  capabilityName: "Cybersecurity risk assessment",
  capabilityDescription: "Performs cyber risk assessments and security-control reviews.",
  addressLine1: "500 Crawford Street",
  coordinate: [-76.3002, 36.8364],
  visibility: "exact",
  serviceGeographyIds: [baseGeographyId, norfolkGeographyId],
});
await persist("organizationCapabilityClaims", `structured_${exact.organization.id}`, {
  id: `structured_${exact.organization.id}`,
  organizationId: exact.organization.id,
  capabilityId: "AMACS-CAP-000113",
  amacsReleaseVersion: "0.5.0",
  labelSnapshot: "Cybersecurity risk assessment",
  definitionSnapshot: "The organizational ability to provide or perform cybersecurity risk assessment.",
  domainId: "AMACS-DOM-000004",
  domainLabelSnapshot: "Digital, Data, and Technology",
  familyId: "AMACS-FAM-000021",
  familyLabelSnapshot: "Cybersecurity and Information Assurance",
  entityScope: "reporting_entity",
  marketRoleIds: ["AMACS-MROLE-000003"],
  deliveryRoles: ["prime"],
  serviceGeographyIds: [baseGeographyId, norfolkGeographyId],
  specialties: ["Security-control reviews"],
  capacity: null,
  evidenceIds: [],
  assertionStatus: "self_reported",
  visibility: "network",
  source: { kind: "manual" },
  assertedByUserId: exact.user.id,
  assertedByMembershipId: exact.membership.id,
  createdAt: now,
  updatedAt: now,
});
const approximateRecords = await persistDiscoverable(approximate, {
  displayName: "Tidewater Security Advisory",
  slug: "tidewater-security",
  capabilityName: "Cybersecurity compliance support",
  capabilityDescription: "Supports security compliance and remediation planning.",
  addressLine1: "600 Crawford Street",
  coordinate: [-76.3022, 36.8374],
  visibility: "approximate",
  serviceGeographyIds: [baseGeographyId],
});
const localityRecords = await persistDiscoverable(localityOnly, {
  displayName: "Port City Electrical Services",
  slug: "port-city-electrical",
  capabilityName: "Industrial electrical maintenance",
  capabilityDescription: "Maintains industrial electrical systems and facility controls.",
  addressLine1: "700 Crawford Street",
  coordinate: [-76.3042, 36.8384],
  visibility: "locality-only",
  serviceGeographyIds: [baseGeographyId],
});
const restrictedRecords = await persistDiscoverable(restricted, {
  displayName: "Restricted Cyber Vendor",
  slug: "restricted-cyber",
  capabilityName: "Cybersecurity risk assessment",
  capabilityDescription: "This record must not enter discovery while restricted.",
  addressLine1: "800 Crawford Street",
  coordinate: [-76.3062, 36.8394],
  visibility: "exact",
  serviceGeographyIds: [baseGeographyId, norfolkGeographyId],
});
const restriction = createAccessRestriction(
  organizationRestrictionTarget(restricted.organization),
  {
    id: `restriction_${restricted.organization.id}`,
    state: "suspended",
    now,
  },
);
await persist("accessRestrictions", restriction.id, restriction);

const candidateSource = {
  async listByBaseGeographyId(geographyId, limit) {
    const snapshot = await adminDb
      .collection("organizationMarkerActivations")
      .where("geographyId", "==", geographyId)
      .limit(limit)
      .get();
    return Object.freeze(snapshot.docs.map((document) => stripSchemaVersion(document.data())));
  },
};
const profileRepositories = createFirestoreEssentialOrganizationProfileRepositories(adminDb);
const locationRepositories = createFirestoreOrganizationLocationRepositories(adminDb);
const service = new NetworkDiscoveryService({
  candidates: candidateSource,
  profiles: new FirestoreOrganizationProfileRepository(adminDb),
  completions: profileRepositories.completions,
  locations: locationRepositories.locations,
  serviceGeographies: locationRepositories.serviceGeographies,
  restrictions: new FirestoreAccessRestrictionRepository(adminDb),
  capabilityClaims: new FirestoreOrganizationMarketProfileRepository(adminDb).claims,
});

try {
  const browseQuery = createNetworkDiscoveryQuery({
    baseGeographyId,
    allowedServiceGeographyIds: [baseGeographyId, norfolkGeographyId],
  });
  const browse = await service.search({
    viewerOrganizationId: viewer.organization.id,
    selectedGeography: PORTSMOUTH_CONTROLLED_LOCALITY,
    selectedGeographyGeometry: selectedGeometry,
    query: browseQuery,
  });
  assert.equal(browse.totalMatched, 3, "Browse must include only the three permitted counterparty organizations.");
  assert.equal(
    browse.organizations.some((entry) => entry.organizationId === viewer.organization.id),
    false,
    "Discovery must not duplicate the viewer's home organization.",
  );
  assert.equal(
    browse.organizations.some((entry) => entry.organizationId === restricted.organization.id),
    false,
    "Restricted organizations must fail closed from discovery.",
  );

  const cybersecurity = await service.search({
    viewerOrganizationId: viewer.organization.id,
    selectedGeography: PORTSMOUTH_CONTROLLED_LOCALITY,
    selectedGeographyGeometry: selectedGeometry,
    query: createNetworkDiscoveryQuery({
      capability: "cybersecurity",
      baseGeographyId,
      allowedServiceGeographyIds: [baseGeographyId, norfolkGeographyId],
    }),
  });
  assert.equal(cybersecurity.totalMatched, 2);
  assert.deepEqual(
    cybersecurity.organizations.map((entry) => entry.profile.displayName).sort(),
    ["Harbor Cybersecurity Group", "Tidewater Security Advisory"],
  );
  assert.ok(cybersecurity.organizations.every((entry) => entry.match.kind === "capability"));
  assert.ok(cybersecurity.organizations.every((entry) => entry.match.matchedCapabilityNames.length === 1));
  const structuredCybersecurity = cybersecurity.organizations.find((entry) => entry.organizationId === exact.organization.id);
  assert.equal(structuredCybersecurity?.match.source, "confirmed-structured");
  assert.equal(structuredCybersecurity?.capabilities[0]?.provenanceLabel, "Organization claimed");
  assert.equal(cybersecurity.organizations.find((entry) => entry.organizationId === approximate.organization.id)?.match.source, "legacy-essential");

  const norfolkService = await service.search({
    viewerOrganizationId: viewer.organization.id,
    selectedGeography: PORTSMOUTH_CONTROLLED_LOCALITY,
    selectedGeographyGeometry: selectedGeometry,
    query: createNetworkDiscoveryQuery({
      capability: "cybersecurity",
      baseGeographyId,
      serviceGeographyId: norfolkGeographyId,
      allowedServiceGeographyIds: [baseGeographyId, norfolkGeographyId],
    }),
  });
  assert.equal(norfolkService.totalMatched, 1);
  assert.equal(norfolkService.organizations[0]?.organizationId, exact.organization.id);

  const exactProjection = browse.organizations.find((entry) => entry.organizationId === exact.organization.id);
  const approximateProjection = browse.organizations.find((entry) => entry.organizationId === approximate.organization.id);
  const localityProjection = browse.organizations.find((entry) => entry.organizationId === localityOnly.organization.id);
  assert.ok(exactProjection && approximateProjection && localityProjection);

  assert.equal(exactProjection.profile.location.visibility, "exact");
  assert.deepEqual(exactProjection.marker.coordinate, exactRecords.location.coordinate);

  assert.equal(approximateProjection.profile.location.visibility, "approximate");
  assert.notDeepEqual(
    approximateProjection.marker.coordinate,
    approximateRecords.location.coordinate,
    "Approximate public marker must not expose the private canonical coordinate.",
  );

  assert.equal(localityProjection.profile.location.visibility, "locality-only");
  assert.notDeepEqual(
    localityProjection.marker.coordinate,
    localityRecords.location.coordinate,
    "Locality-only public marker must not expose the private canonical coordinate.",
  );
  assert.equal(
    geographicPositionWithinBoundary(localityProjection.marker.coordinate, selectedGeometry),
    true,
    "Locality-only marker must remain geographically anchored inside the authoritative boundary.",
  );

  assert.equal(viewerRecords.completion.status, "active");
  assert.equal(restrictedRecords.completion.status, "active");
  console.log(
    "Slice 3.2 controlled Network discovery Firestore emulator acceptance passed: persisted capability/filter search, self/restriction exclusion, and exact/approximate/locality-only privacy projections.",
  );
} finally {
  for (const [collection, id] of cleanup.reverse()) {
    await adminDb.collection(collection).doc(id).delete().catch(() => undefined);
  }
  await deleteAdminApp(adminApp);
}
