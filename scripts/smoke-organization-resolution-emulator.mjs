import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import {
  OrganizationResolutionError,
  OrganizationResolutionService,
} from "../src/application/organization-resolution/organization-resolution.ts";
import { createPrimaryOperatingGeographySelection, geographyId } from "../src/domain/geography/model.ts";
import {
  advanceAccessLifecycle,
  associateAccessJourneyWithUser,
  createAccessLifecycle,
} from "../src/domain/lifecycle/model.ts";
import {
  createOrganizationAccount,
  createOrganizationProfile,
} from "../src/domain/organizations/model.ts";
import {
  createOrganizationDataProvenance,
  createOrganizationDiscoveryRecord,
} from "../src/domain/organization-resolution/model.ts";
import { createUserIdentity } from "../src/domain/users/model.ts";
import { createFirestoreGeographyRepositories } from "../src/infrastructure/firestore/geography-repositories.ts";
import { createFirestoreOrganizationResolutionRepositories } from "../src/infrastructure/firestore/organization-resolution-repositories.ts";
import { createFirestoreFoundationRepositories } from "../src/infrastructure/firestore/repositories.ts";

assert.equal(
  process.env.FIRESTORE_EMULATOR_HOST,
  "127.0.0.1:8080",
  "Slice 2.3 acceptance must use the Firestore emulator.",
);

const projectId = "demo-rfxchange";
const runId = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const adminApp = initializeAdminApp({ projectId }, `resolution-admin-${runId}`);
const adminDb = getAdminFirestore(adminApp);
const clientApp = initializeClientApp(
  {
    apiKey: "demo-api-key",
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    appId: `1:123:web:resolution-${runId}`,
  },
  `resolution-client-${runId}`,
);
const clientDb = getClientFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);

const now = new Date().toISOString();
const portsmouth = geographyId(`us-va-portsmouth-resolution-${runId}`);
const foundation = createFirestoreFoundationRepositories(adminDb);
const geography = createFirestoreGeographyRepositories(adminDb);
const repositories = createFirestoreOrganizationResolutionRepositories(adminDb);
const cleanup = [];

function participant(suffix) {
  const user = createUserIdentity({
    id: `usr_resolution_${suffix}_${runId}`,
    name: `Resolution ${suffix}`,
    primaryEmail: `resolution-${suffix}-${runId}@example.test`,
    loginProvider: "firebase",
    loginSubject: `firebase-resolution-${suffix}-${runId}`,
    now,
  });
  const context = authenticatedServerContext({
    user,
    claims: {
      provider: "firebase",
      subject: user.login.subject,
      email: user.primaryEmail,
      displayName: user.name,
      emailVerified: true,
      isAnonymous: false,
      authenticatedAt: now,
      issuedAt: now,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
    source: "session-cookie",
  });
  let journey = createAccessLifecycle({
    id: `journey_resolution_${suffix}_${runId}`,
    now,
  });
  journey = advanceAccessLifecycle(journey, "account-started", now);
  journey = advanceAccessLifecycle(journey, "account-activated", now);
  journey = associateAccessJourneyWithUser(journey, user.id, now);
  journey = advanceAccessLifecycle(journey, "geography-selected", now);
  const selection = createPrimaryOperatingGeographySelection(
    user.id,
    journey.id,
    portsmouth,
    now,
  );
  cleanup.push(["primaryGeographySelections", user.id], ["accessJourneys", journey.id]);
  return { user, context, journey, selection };
}

function serviceFor(fixture, suffix) {
  let counter = 0;
  return new OrganizationResolutionService({
    lifecycle: foundation.lifecycle.lifecycle,
    geographySelections: geography.selections,
    accounts: foundation.organizations.accounts,
    profiles: foundation.organizations.profiles,
    discovery: repositories.discovery,
    resolutions: repositories.resolutions,
    unitOfWork: repositories.unitOfWork,
    ids: {
      resolution: () => `resolution_${suffix}_${++counter}_${runId}`,
      organization: () => `org_${suffix}_${++counter}_${runId}`,
      profile: () => `profile_${suffix}_${++counter}_${runId}`,
      discovery: () => `discovery_${suffix}_${++counter}_${runId}`,
      entityKey: (value) =>
        createHash("sha256").update(value).digest("hex"),
    },
    now: () => now,
  });
}

const seededAccount = createOrganizationAccount({
  id: `org_seeded_${runId}`,
  now,
});
const seededProfile = createOrganizationProfile(seededAccount, {
  id: `profile_seeded_${runId}`,
  displayName: "Harborlight Fabrication LLC",
  now,
});
const seededDiscovery = createOrganizationDiscoveryRecord(
  seededAccount,
  seededProfile,
  {
    id: `discovery_seeded_${runId}`,
    origin: "seeded",
    identity: {
      displayName: seededProfile.displayName,
      aliases: ["Harborlight Fabrication"],
      categories: ["Metal Fabrication"],
      geographyId: portsmouth,
      domain: "harborlight.example",
      phone: "757-555-0100",
    },
    provenance: createOrganizationDataProvenance({
      kind: "seeded-public",
      sourceLabel: "Emulator organization seed",
      sourceRecordId: `seed-${runId}`,
      observedAt: now,
    }),
    publicDomain: true,
    publicPhone: false,
    now,
  },
);
cleanup.push(
  ["organizations", seededAccount.id],
  ["organizationProfiles", seededProfile.id],
  ["organizationDiscoveryRecords", seededDiscovery.id],
);

try {
  await foundation.organizations.accounts.create(seededAccount);
  await foundation.organizations.profiles.create(seededProfile);
  await repositories.discovery.save(seededDiscovery);

  const existingParticipant = participant("existing");
  await geography.selectionUnitOfWork.commit(
    existingParticipant.selection,
    existingParticipant.journey,
  );
  const existingService = serviceFor(existingParticipant, "existing");
  const search = await existingService.search({
    context: existingParticipant.context,
    accessJourneyId: existingParticipant.journey.id,
    provisionalIdentity: {
      displayName: "Harborlight Fabrication",
      domain: "harborlight.example",
    },
  });
  assert.equal(search.candidates[0]?.organizationId, seededAccount.id);
  const selected = await existingService.selectExisting({
    context: existingParticipant.context,
    accessJourneyId: existingParticipant.journey.id,
    provisionalIdentity: {
      displayName: "Harborlight Fabrication",
      domain: "harborlight.example",
    },
    organizationId: seededAccount.id,
    decisionReason: "Emulator participant selected the seeded record.",
  });
  cleanup.push(["organizationResolutions", selected.resolution.id]);
  assert.equal(selected.lifecycle.state, "organization-resolved");
  assert.equal(selected.authorityEstablished, false);
  assert.equal(
    (
      await adminDb
        .collection("organizationMemberships")
        .where("userId", "==", existingParticipant.user.id)
        .get()
    ).empty,
    true,
  );

  const creatingParticipant = participant("create");
  await geography.selectionUnitOfWork.commit(
    creatingParticipant.selection,
    creatingParticipant.journey,
  );
  const creatingService = serviceFor(creatingParticipant, "create");
  const created = await creatingService.createNew({
    context: creatingParticipant.context,
    accessJourneyId: creatingParticipant.journey.id,
    provisionalIdentity: {
      displayName: "Tidewater Precision Systems",
      categories: ["Precision Machining"],
      domain: "tidewater-precision.example",
      phone: "757-555-0400",
      governmentIdentifiers: [
        {
          scheme: "SCC",
          jurisdiction: "VA",
          value: `SCC-${runId}`,
        },
      ],
    },
    reviewedCandidateOrganizationIds: [],
    decisionReason: "No appropriate organization match was found.",
  });
  cleanup.push(
    ["organizations", created.organization.id],
    ["organizationProfiles", created.profile.id],
    ["organizationDiscoveryRecords", `discovery_create_3_${runId}`],
    ["organizationResolutions", created.resolution.id],
  );
  const entityKeySnapshots = await adminDb
    .collection("organizationEntityKeys")
    .where("organizationId", "==", created.organization.id)
    .get();
  assert.equal(entityKeySnapshots.size, 2);
  for (const snapshot of entityKeySnapshots.docs) {
    cleanup.push(["organizationEntityKeys", snapshot.id]);
  }
  assert.equal(
    (
      await adminDb
        .collection("accessJourneys")
        .doc(creatingParticipant.journey.id)
        .get()
    ).data()?.state,
    "organization-resolved",
  );

  const duplicateParticipant = participant("duplicate");
  await geography.selectionUnitOfWork.commit(
    duplicateParticipant.selection,
    duplicateParticipant.journey,
  );
  const duplicateService = serviceFor(duplicateParticipant, "duplicate");
  await assert.rejects(
    duplicateService.createNew({
      context: duplicateParticipant.context,
      accessJourneyId: duplicateParticipant.journey.id,
      provisionalIdentity: {
        displayName: "Different Display Name",
        governmentIdentifiers: [
          {
            scheme: "SCC",
            jurisdiction: "VA",
            value: `SCC-${runId}`,
          },
        ],
      },
      reviewedCandidateOrganizationIds: [created.organization.id],
      decisionReason: "Attempted duplicate identity.",
    }),
    (error) =>
      error instanceof OrganizationResolutionError &&
      error.code === "new-organization-blocked",
  );

  await assert.rejects(
    getDoc(doc(clientDb, "organizationDiscoveryRecords", seededDiscovery.id)),
    (error) => error?.code === "permission-denied",
  );
  await assert.rejects(
    getDoc(doc(clientDb, "organizationResolutions", created.resolution.id)),
    (error) => error?.code === "permission-denied",
  );

  console.log(
    "Slice 2.3 emulator acceptance passed: seeded discovery -> explainable match -> atomic existing/new resolution -> duplicate conflict; membership/authority and direct client access denied.",
  );
} finally {
  await Promise.allSettled(
    cleanup.map(([collection, id]) =>
      adminDb.collection(collection).doc(id).delete(),
    ),
  );
  await deleteAdminApp(adminApp);
  await deleteClientApp(clientApp);
}
