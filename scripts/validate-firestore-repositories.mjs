import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const branchFiles = {
  package: "package.json",
  support: "src/infrastructure/firestore/support.ts",
  repositories: "src/infrastructure/firestore/repositories.ts",
  runtime: "src/infrastructure/firestore/runtime.ts",
  firebaseAdmin: "src/infrastructure/firebase/admin.ts",
  queryContracts: "src/infrastructure/firestore/query-contracts.ts",
  organizationResolution:
    "src/infrastructure/firestore/organization-resolution-repositories.ts",
};

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(absolute);
      return entry.isFile() && /\.(ts|tsx)$/.test(entry.name) ? [absolute] : [];
    }),
  );
  return nested.flat();
}

const packageJson = JSON.parse(await read(branchFiles.package));
assert.equal(
  packageJson.dependencies?.["firebase-admin"],
  "14.2.0",
  "INF-002 must pin the reviewed Firebase Admin SDK version.",
);

const support = await read(branchFiles.support);
const repositories = await read(branchFiles.repositories);
const runtime = await read(branchFiles.runtime);
const firebaseAdmin = await read(branchFiles.firebaseAdmin);
const queryContracts = await read(branchFiles.queryContracts);
const organizationResolution = await read(branchFiles.organizationResolution);

for (const required of [
  "FieldValue.serverTimestamp()",
  "schemaVersion: FIRESTORE_SCHEMA_VERSION",
  "ref.create(",
  "runTransaction",
  "assertOrganizationScopedFirestoreRecord",
]) {
  assert.ok(support.includes(required), `INF-002 support is missing required behavior: ${required}`);
}

assert.ok(
  !support.includes(".add("),
  "INF-002 must use canonical stable document IDs rather than Firestore auto IDs.",
);

for (const adapter of [
  "FirestoreOrganizationAccountRepository",
  "FirestoreOrganizationProfileRepository",
  "FirestoreUserIdentityRepository",
  "FirestoreOrganizationMembershipRepository",
  "FirestoreOrganizationUserAuthorizationRepository",
  "FirestoreOrganizationAuditRepository",
  "FirestoreAccessLifecycleRepository",
  "FirestoreAccessRestrictionRepository",
  "FirestoreLegalDocumentVersionRepository",
  "FirestoreLegalAcknowledgementRepository",
  "FirestoreOrganizationAuthorityRepresentationRepository",
  "FirestorePlatformChangeDirectiveRepository",
  "FirestoreRetentionPolicyRepository",
  "FirestoreRecordRetentionAssignmentRepository",
  "FirestorePlatformAdministratorAuthorityContextRepository",
  "FirestoreAdminPermissionGrantRepository",
]) {
  assert.ok(repositories.includes(`class ${adapter}`), `Missing INF-002 adapter: ${adapter}`);
}

for (const collectionKey of [
  "organizations",
  "organizationProfiles",
  "users",
  "organizationMemberships",
  "organizationAuthorizations",
  "organizationAuditEvents",
  "accessJourneys",
  "accessRestrictions",
  "legalDocumentVersions",
  "legalAcknowledgements",
  "organizationAuthorityRepresentations",
  "platformChangeDirectives",
  "retentionPolicies",
  "retentionAssignments",
  "adminAuthorityContexts",
  "adminPermissionGrants",
]) {
  assert.ok(
    repositories.includes(`\"${collectionKey}\"`),
    `INF-002 does not bind canonical collection ${collectionKey}.`,
  );
}

assert.ok(
  repositories.includes("StaticAdminPermissionCatalogRepository"),
  "The static administrative permission catalog must remain a code-backed domain catalog.",
);

for (const required of ["getFirestore(", "getFirebaseAdminApp", "createFirestoreFoundationRepositories"]) {
  assert.ok(runtime.includes(required), `Firestore server composition is missing: ${required}`);
}
for (const required of ["getApps()", "initializeApp()", "getFirebaseAdminApp"]) {
  assert.ok(firebaseAdmin.includes(required), `Shared Firebase Admin composition is missing: ${required}`);
}

for (const source of [runtime, firebaseAdmin]) {
  for (const forbidden of ["serviceAccount", "private_key", "credential.cert", "FIREBASE_PRIVATE_KEY"]) {
    assert.ok(
      !source.includes(forbidden),
      `Firebase Admin runtime must not embed or request long-lived credentials: ${forbidden}`,
    );
  }
}

assert.ok(
  queryContracts.includes("FIRESTORE_QUERY_CONTRACTS") &&
    queryContracts.includes("FIRESTORE_MANUAL_INDEX_CONTRACTS"),
  "INF-002 query shapes must remain exposed to INF-005 index planning.",
);
for (const required of [
  "FirestoreOrganizationDiscoveryRepository",
  "FirestoreOrganizationResolutionRepository",
  "FirestoreOrganizationResolutionUnitOfWork",
  "organizationEntityKeys",
  "transaction.create",
]) {
  assert.ok(
    organizationResolution.includes(required),
    `Organization resolution persistence is missing: ${required}`,
  );
}
assert.ok(
  queryContracts.includes("active-memberships-by-user") &&
    queryContracts.includes("legal-document-by-kind-version") &&
    queryContracts.includes("restriction-by-organization"),
  "INF-002 query contract inventory is incomplete.",
);

const domainRoot = path.join(root, "src/domain");
for (const file of await sourceFiles(domainRoot)) {
  const source = await readFile(file, "utf8");
  assert.ok(
    !source.includes("firebase-admin") && !source.includes("firebase/firestore"),
    `Domain source must remain Firebase-independent: ${path.relative(root, file)}`,
  );
}

console.log("INF-002 Firestore repository adapter validation passed.");
