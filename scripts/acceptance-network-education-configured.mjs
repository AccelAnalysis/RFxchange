import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applicationDefault, deleteApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const mode = process.argv[2];
const statePath = process.env.RFXCHANGE_ACCEPTANCE_STATE_FILE?.trim();
const projectId = process.env.RFXCHANGE_EXPECTED_PROJECT_ID?.trim();

assert.ok(["inspect", "cleanup"].includes(mode));
assert.ok(statePath);
assert.ok(projectId);

const app = initializeApp(
  { credential: applicationDefault(), projectId },
  `slice-3-8-acceptance-${Date.now()}`,
);
const db = getFirestore(app);
const state = JSON.parse(await readFile(statePath, "utf8"));
assert.equal(state.projectId, projectId);
assert.ok(state.resourceNetwork);

const providerOrganizationId = state.resourceNetwork.providerOrganizationId;
const businessOrganizationId = state.resourceNetwork.requesterOrganizationId;
const organizationIds = [providerOrganizationId, businessOrganizationId];

async function documents(collection, field, value) {
  return (await db.collection(collection).where(field, "==", value).get()).docs;
}

async function educationRecords(collection) {
  const records = [];
  for (const organizationId of organizationIds) {
    records.push(...(await documents(collection, "organizationId", organizationId)));
  }
  return records;
}

async function inspect() {
  const [progressRecords, eventRecords, commandRecords] = await Promise.all([
    educationRecords("networkEducationProgress"),
    educationRecords("networkEducationEvents"),
    educationRecords("networkEducationCommands"),
  ]);
  assert.equal(progressRecords.length, 2);
  assert.ok(eventRecords.length >= 5);
  assert.equal(commandRecords.length, eventRecords.length);

  const progressByOrganization = new Map(
    progressRecords.map((record) => [record.data().organizationId, record.data()]),
  );
  const providerProgress = progressByOrganization.get(providerOrganizationId);
  const businessProgress = progressByOrganization.get(businessOrganizationId);
  assert.equal(providerProgress?.recommendedPath, "resource-provider");
  assert.equal(providerProgress?.activePath, "quick-start");
  assert.ok(providerProgress?.completedItemKeys.includes("quick-start-understand"));
  assert.equal(businessProgress?.recommendedPath, "business");
  assert.ok(businessProgress?.viewedExplainerKeys.includes("capability-suggestion"));

  for (const record of [...progressRecords, ...eventRecords]) {
    assert.ok(record.data().membershipId, `${record.ref.path} must stay membership-bound.`);
  }

  const [providerStatus, businessStatus, providerApplication, businessApplication] =
    await Promise.all([
      db.collection("officialResourceProviderStatuses").doc(providerOrganizationId).get(),
      db.collection("officialResourceProviderStatuses").doc(businessOrganizationId).get(),
      db.collection("providerApplications").doc(providerOrganizationId).get(),
      db.collection("providerApplications").doc(businessOrganizationId).get(),
    ]);
  assert.equal(providerStatus.data()?.status, "official-resource-provider");
  assert.equal(businessStatus.exists, false);
  if (providerApplication.exists) {
    assert.equal(providerApplication.data()?.organizationId, providerOrganizationId);
    assert.equal(providerApplication.data()?.status, "approved");
  }
  assert.equal(businessApplication.exists, false);

  console.log(
    JSON.stringify({
      inspected: true,
      progressRecords: progressRecords.length,
      eventRecords: eventRecords.length,
      commandRecords: commandRecords.length,
      providerRecommendation: providerProgress.recommendedPath,
      businessRecommendation: businessProgress.recommendedPath,
      providerAuthorityUnchanged: true,
      businessAuthorityUnchanged: true,
      preservedProviderApplication: providerApplication.exists,
      educationCreatedApplications: 0,
    }),
  );
}

async function cleanup() {
  const records = (
    await Promise.all(
      [
        "networkEducationProgress",
        "networkEducationEvents",
        "networkEducationCommands",
      ].map(educationRecords),
    )
  ).flat();
  const pending = [...records];
  while (pending.length) {
    const batch = db.batch();
    for (const record of pending.splice(0, 400)) batch.delete(record.ref);
    await batch.commit();
  }
  const residual = (
    await Promise.all(
      [
        "networkEducationProgress",
        "networkEducationEvents",
        "networkEducationCommands",
      ].map(educationRecords),
    )
  ).flat();
  assert.deepEqual(
    residual.map((record) => record.ref.path),
    [],
  );
  console.log(
    JSON.stringify({
      cleaned: true,
      deletedRecords: records.length,
      residualEducationRecords: 0,
    }),
  );
}

try {
  if (mode === "inspect") await inspect();
  else await cleanup();
} finally {
  await deleteApp(app);
}
