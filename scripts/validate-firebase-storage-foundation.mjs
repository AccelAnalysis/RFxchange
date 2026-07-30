import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const firebaseConfig = JSON.parse(await readFile(new URL("../firebase.json", import.meta.url), "utf8"));
const storageRules = await readFile(new URL("../storage.rules", import.meta.url), "utf8");
const firestoreRules = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");
const model = await readFile(new URL("../src/domain/storage/model.ts", import.meta.url), "utf8");
const application = await readFile(
  new URL("../src/application/storage/store-organization-asset.ts", import.meta.url),
  "utf8",
);
const objectAdapter = await readFile(
  new URL("../src/infrastructure/storage/firebase-private-object-store.ts", import.meta.url),
  "utf8",
);
const metadataAdapter = await readFile(
  new URL("../src/infrastructure/storage/firestore-stored-asset-repository.ts", import.meta.url),
  "utf8",
);
const documentation = await readFile(
  new URL("../docs/architecture/INF-008-firebase-storage-foundation.md", import.meta.url),
  "utf8",
);

assert.equal(firebaseConfig.storage?.rules, "storage.rules", "firebase.json must bind Storage Rules.");
assert.equal(firebaseConfig.emulators?.storage?.port, 9199, "Storage emulator must remain pinned to port 9199.");
assert.match(storageRules, /function\s+serverManagedOnly\s*\(\s*\)\s*\{\s*return\s+false\s*;/s);
assert.match(storageRules, /organizations\/\{organizationId\}\/private\/\{category\}\/\{assetId\}\/\{fileName\}/);
assert.match(storageRules, /match\s+\/\{allPaths=\*\*\}[\s\S]*allow\s+read\s*,\s*write\s*:\s*if\s+false/);
assert.doesNotMatch(storageRules, /allow\s+[^;]+:\s*if\s+true/);
assert.match(firestoreRules, /match\s+\/storedAssets\/\{documentId\}/);

for (const category of [
  "organization-logo",
  "organization-media",
  "authority-evidence",
  "verification-evidence",
  "rfx-document",
]) {
  assert.ok(model.includes(`\"${category}\"`), `Missing stored asset category: ${category}`);
}
for (const required of [
  'visibility: "private"',
  "STORED_ASSET_POLICIES",
  "evaluateStoredAssetAccess",
  "sensitive-evidence",
  "organizations/${input.organizationId}/private/",
  "activateStoredAsset",
]) {
  assert.ok(model.includes(required), `Stored asset model is missing: ${required}`);
}

assert.ok(application.includes("PrivateObjectStore"), "Application layer needs a provider-independent object port.");
assert.ok(application.includes("evaluateStoredAssetAccess"), "Storage operations must evaluate tenant/permission access.");
assert.ok(application.includes("dependencies.assets.create(draft)"), "Pending metadata must precede object upload.");
assert.ok(application.includes("dependencies.assets.save(active)"), "Active metadata must follow object verification.");
assert.ok(!application.includes("firebase-admin") && !application.includes("firebase/storage"), "Application storage must remain Firebase-independent.");
assert.ok(objectAdapter.includes('from "firebase-admin/storage"'), "Firebase adapter must use the reviewed Admin Storage boundary.");
assert.ok(objectAdapter.includes('cacheControl: "private, no-store, max-age=0"'), "Objects must default to private/no-store metadata.");
assert.ok(!objectAdapter.includes("getDownloadURL") && !objectAdapter.includes("getSignedUrl"), "INF-008 must not create bearer download URLs.");
assert.ok(metadataAdapter.includes('STORED_ASSET_COLLECTION = "storedAssets"'), "Stored asset metadata collection is missing.");
assert.ok(metadataAdapter.includes("FieldValue.serverTimestamp()"), "Stored asset persistence needs server timestamps.");
assert.ok(metadataAdapter.includes('.where("organizationId", "==", organizationId)'), "Stored asset metadata lookup must be tenant scoped.");

for (const phrase of [
  "private by default",
  "Firebase UID",
  "Firestore metadata",
  "sensitive evidence",
  "organization boundary",
  "administrative boundary",
  "no public download URL",
  "Storage emulator",
]) {
  assert.ok(documentation.toLowerCase().includes(phrase.toLowerCase()), `INF-008 documentation is missing: ${phrase}`);
}

console.log("INF-008 Firebase Storage foundation architecture validated.");
