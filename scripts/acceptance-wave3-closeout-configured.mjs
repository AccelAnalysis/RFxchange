import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applicationDefault, deleteApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const mode = process.argv[2];
const statePath = process.env.RFXCHANGE_ACCEPTANCE_STATE_FILE?.trim();
const projectId = process.env.RFXCHANGE_EXPECTED_PROJECT_ID?.trim();
const storageBucket = process.env.RFXCHANGE_FIREBASE_STORAGE_BUCKET?.trim();

assert.ok(["inspect", "cleanup", "assert-zero"].includes(mode));
assert.ok(statePath);
assert.ok(projectId);
assert.ok(storageBucket);

const state = JSON.parse(await readFile(statePath, "utf8"));
assert.equal(state.projectId, projectId);
assert.ok(state.runId);
if (mode !== "assert-zero") assert.ok(state.organizationId);

const app = initializeApp(
  { credential: applicationDefault(), projectId, storageBucket },
  `wave-3-closeout-${Date.now()}`,
);
const db = getFirestore(app);
const bucket = getStorage(app).bucket(storageBucket);
const organizationId = state.organizationId ?? null;

const marketCollections = [
  "organizationCapabilityClaims",
  "organizationIndustryProfiles",
  "organizationPastPerformance",
  "organizationMarketPreferences",
  "organizationProvisionalTerms",
  "organizationMarketProfileEvents",
  "organizationMarketProfileCommands",
];
const enrichmentCollections = [
  "organizationCredentials",
  "organizationProfileAssets",
  "organizationAdditionalLocationDrafts",
  "organizationAdditionalLocations",
  "organizationEnrichmentEvents",
  "organizationEnrichmentCommands",
  "storedAssets",
];
const closeoutCollections = [...marketCollections, ...enrichmentCollections];

async function organizationDocuments(collection) {
  assert.ok(organizationId);
  return (await db.collection(collection).where("organizationId", "==", organizationId).get()).docs;
}

async function recordsByCollection() {
  return new Map(
    await Promise.all(
      closeoutCollections.map(async (collection) => [collection, await organizationDocuments(collection)]),
    ),
  );
}

async function inspect() {
  const records = await recordsByCollection();
  const claims = records.get("organizationCapabilityClaims");
  const credentials = records.get("organizationCredentials");
  const profileAssets = records.get("organizationProfileAssets");
  const additionalLocations = records.get("organizationAdditionalLocations");
  const storedAssets = records.get("storedAssets");

  assert.equal(claims.length, 1);
  assert.equal(claims[0].data().amacsReleaseVersion, "0.5.0");
  assert.equal(claims[0].data().source?.kind, "manual");
  assert.equal(claims[0].data().assertionStatus, "self_reported");
  assert.equal(claims[0].data().visibility, "network");
  assert.equal(records.get("organizationMarketProfileEvents").length, 1);
  assert.equal(records.get("organizationMarketProfileCommands").length, 1);
  for (const collection of [
    "organizationIndustryProfiles",
    "organizationPastPerformance",
    "organizationMarketPreferences",
    "organizationProvisionalTerms",
  ]) assert.equal(records.get(collection).length, 0);

  assert.equal(credentials.length, 1);
  assert.equal(credentials[0].data().status, "self_reported");
  assert.equal(credentials[0].data().visibility, "private");
  assert.equal(profileAssets.length, 1);
  assert.equal(profileAssets[0].data().publicationStatus, "private");
  assert.equal(additionalLocations.length, 1);
  assert.equal(additionalLocations[0].data().visibility, "approximate");
  assert.equal(additionalLocations[0].data().publicationStatus, "published");
  assert.ok(records.get("organizationAdditionalLocationDrafts").length >= 1);
  assert.ok(records.get("organizationEnrichmentEvents").length >= 5);
  assert.equal(
    records.get("organizationEnrichmentCommands").length,
    records.get("organizationEnrichmentEvents").length,
  );

  assert.equal(storedAssets.length, 1);
  const storedAsset = storedAssets[0].data();
  assert.equal(profileAssets[0].data().storedAssetId, storedAsset.id);
  assert.equal(storedAsset.visibility, "private");
  assert.equal(storedAsset.status, "active");
  assert.match(storedAsset.objectPath, new RegExp(`^organizations/${organizationId}/private/`));
  const [objectExists] = await bucket.file(storedAsset.objectPath).exists();
  assert.equal(objectExists, true);

  console.log(JSON.stringify({
    inspected: true,
    capabilityClaims: claims.length,
    marketEvents: records.get("organizationMarketProfileEvents").length,
    credentials: credentials.length,
    profileAssets: profileAssets.length,
    additionalLocations: additionalLocations.length,
    enrichmentEvents: records.get("organizationEnrichmentEvents").length,
    storedAssets: storedAssets.length,
    privateObjectExists: objectExists,
    fabricatedMarketRecords: 0,
  }));
}

async function cleanup() {
  const records = await recordsByCollection();
  const storedAssets = records.get("storedAssets");
  for (const record of storedAssets) {
    await bucket.file(record.data().objectPath).delete({ ignoreNotFound: true });
  }
  const pending = [...records.values()].flat();
  while (pending.length) {
    const batch = db.batch();
    for (const record of pending.splice(0, 400)) batch.delete(record.ref);
    await batch.commit();
  }
  await assertZero(storedAssets.map((record) => record.data().objectPath));
  console.log(JSON.stringify({
    cleaned: true,
    deletedRecords: [...records.values()].flat().length,
    deletedStorageObjects: storedAssets.length,
    residualCloseoutRecords: 0,
    residualStorageObjects: 0,
  }));
}

async function assertZero(objectPaths = []) {
  if (organizationId) {
    const records = await recordsByCollection();
    const residual = [...records.values()].flat();
    assert.deepEqual(residual.map((record) => record.ref.path), []);
  }
  for (const objectPath of objectPaths) {
    const [exists] = await bucket.file(objectPath).exists();
    assert.equal(exists, false, `${objectPath} must be removed.`);
  }
  if (mode === "assert-zero") {
    const collections = await db.listCollections();
    const fixtureDocuments = [];
    for (const collection of collections) {
      const snapshot = await collection.get();
      for (const document of snapshot.docs) {
        if (document.id.includes(state.runId) || JSON.stringify(document.data()).includes(state.runId)) {
          fixtureDocuments.push(document.ref.path);
        }
      }
    }
    assert.deepEqual(fixtureDocuments, []);
    const [organizationObjects] = await bucket.getFiles({ prefix: "organizations/" });
    const fixtureObjects = organizationObjects
      .map((file) => file.name)
      .filter((name) => name.includes(state.runId));
    assert.deepEqual(fixtureObjects, []);
    console.log(JSON.stringify({
      inspected: true,
      scannedCollections: collections.length,
      residualFixtureDocuments: 0,
      residualCloseoutRecords: 0,
      residualStorageObjects: 0,
    }));
  }
}

try {
  if (mode === "inspect") await inspect();
  else if (mode === "cleanup") await cleanup();
  else await assertZero();
} finally {
  await deleteApp(app);
}
