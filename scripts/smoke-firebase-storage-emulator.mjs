import assert from "node:assert/strict";

import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  initializeAuth,
} from "firebase/auth";
import { connectFirestoreEmulator, doc, getDoc, getFirestore as getClientFirestore } from "firebase/firestore";
import {
  connectStorageEmulator,
  getBytes,
  getStorage as getClientStorage,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

import { readOrganizationAsset, storeOrganizationAsset } from "../src/application/storage/store-organization-asset.ts";
import { storedAssetId } from "../src/domain/storage/model.ts";
import { FirebasePrivateObjectStore } from "../src/infrastructure/storage/firebase-private-object-store.ts";
import { FirestoreStoredAssetRepository } from "../src/infrastructure/storage/firestore-stored-asset-repository.ts";

assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:9099");
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
assert.equal(process.env.FIREBASE_STORAGE_EMULATOR_HOST, "127.0.0.1:9199");

const projectId = "demo-rfxchange";
const bucketName = `${projectId}.appspot.com`;
const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const adminApp = initializeAdminApp({ projectId, storageBucket: bucketName }, `inf-008-admin-${runId}`);
const db = getAdminFirestore(adminApp);
const dependencies = {
  assets: new FirestoreStoredAssetRepository(db),
  objects: new FirebasePrivateObjectStore(adminApp, bucketName),
};

function createClient(name, withAuth) {
  const app = initializeClientApp(
    {
      apiKey: "demo-api-key",
      authDomain: `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: bucketName,
      appId: `1:123:web:${name}`,
    },
    `${name}-${runId}`,
  );
  let auth = null;
  if (withAuth) {
    auth = initializeAuth(app, { persistence: inMemoryPersistence });
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }
  const storage = getClientStorage(app, `gs://${bucketName}`);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  const firestore = getClientFirestore(app);
  connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
  return { app, auth, storage, firestore };
}

async function expectStorageDenied(operation, label) {
  await assert.rejects(operation, (error) => {
    const code = typeof error === "object" && error !== null && "code" in error ? error.code : null;
    assert.ok(
      code === "storage/unauthorized" || code === "storage/unknown",
      `${label} returned unexpected Storage error ${String(code)}.`,
    );
    return true;
  });
}

const anonymous = createClient("anonymous", false);
const authenticated = createClient("authenticated", true);

try {
  await createUserWithEmailAndPassword(authenticated.auth, `inf008-${runId}@example.test`, "Correct-Horse-44!");

  const logoBytes = new TextEncoder().encode("private-rfxchange-logo-bytes");
  const memberActor = {
    kind: "organization-member",
    organizationId: "org-storage-a",
    permissions: ["organization.profile.manage"],
  };
  const logo = await storeOrganizationAsset(
    {
      actor: memberActor,
      id: `asset-logo-${runId}`,
      organizationId: "org-storage-a",
      category: "organization-logo",
      originalFilename: "RFxchange Logo.png",
      contentType: "image/png",
      bytes: logoBytes,
      createdByUserId: "user-storage-a",
      now: new Date().toISOString(),
    },
    dependencies,
  );

  assert.equal(logo.status, "active");
  assert.equal(logo.visibility, "private");
  assert.match(logo.objectPath, /^organizations\/org-storage-a\/private\/organization-logo\//);
  assert.match(logo.sha256, /^[a-f0-9]{64}$/);

  const sameOrganizationRead = await readOrganizationAsset(
    { actor: memberActor, assetId: logo.id },
    dependencies,
  );
  assert.deepEqual([...sameOrganizationRead.bytes], [...logoBytes]);

  await assert.rejects(
    readOrganizationAsset(
      {
        actor: {
          kind: "organization-member",
          organizationId: "org-storage-b",
          permissions: ["organization.profile.manage"],
        },
        assetId: logo.id,
      },
      dependencies,
    ),
    (error) => error?.code === "wrong-organization",
  );

  const adminRead = await readOrganizationAsset(
    {
      actor: { kind: "platform-administrator", permissions: ["organization.asset.read"] },
      assetId: logo.id,
    },
    dependencies,
  );
  assert.deepEqual([...adminRead.bytes], [...logoBytes]);

  await assert.rejects(
    readOrganizationAsset(
      { actor: { kind: "platform-administrator", permissions: [] }, assetId: logo.id },
      dependencies,
    ),
    (error) => error?.code === "missing-permission",
  );

  const evidenceBytes = new TextEncoder().encode("sensitive verification evidence");
  const evidence = await storeOrganizationAsset(
    {
      actor: {
        kind: "organization-member",
        organizationId: "org-storage-a",
        permissions: ["credibility.manage"],
      },
      id: `asset-evidence-${runId}`,
      organizationId: "org-storage-a",
      category: "verification-evidence",
      originalFilename: "verification.pdf",
      contentType: "application/pdf",
      bytes: evidenceBytes,
      createdByUserId: "user-storage-a",
      now: new Date().toISOString(),
    },
    dependencies,
  );
  assert.equal(evidence.sensitivity, "sensitive-evidence");

  const metadata = await db.collection("storedAssets").doc(evidence.id).get();
  assert.equal(metadata.exists, true);
  assert.equal(metadata.data()?.status, "active");
  assert.equal(metadata.data()?.objectPath, evidence.objectPath);
  assert.equal(metadata.data()?.organizationId, "org-storage-a");

  await expectStorageDenied(
    uploadBytes(
      storageRef(anonymous.storage, `organizations/org-storage-a/private/organization-logo/direct-${runId}/object.png`),
      logoBytes,
      { contentType: "image/png" },
    ),
    "anonymous direct upload",
  );
  await expectStorageDenied(
    uploadBytes(
      storageRef(authenticated.storage, `organizations/org-storage-a/private/organization-logo/direct-auth-${runId}/object.png`),
      logoBytes,
      { contentType: "image/png" },
    ),
    "authenticated direct upload",
  );
  await expectStorageDenied(
    getBytes(storageRef(anonymous.storage, evidence.objectPath)),
    "anonymous sensitive-evidence read",
  );
  await expectStorageDenied(
    getBytes(storageRef(authenticated.storage, evidence.objectPath)),
    "authenticated sensitive-evidence read",
  );

  await assert.rejects(
    getDoc(doc(authenticated.firestore, "storedAssets", evidence.id)),
    (error) => error?.code === "permission-denied",
  );

  assert.equal(
    (await dependencies.assets.getById(storedAssetId(evidence.id)))?.sha256,
    evidence.sha256,
  );

  console.log("INF-008 Firebase Storage foundation emulator smoke test passed.");
} finally {
  await Promise.allSettled([
    deleteClientApp(anonymous.app),
    deleteClientApp(authenticated.app),
    deleteAdminApp(adminApp),
  ]);
}
