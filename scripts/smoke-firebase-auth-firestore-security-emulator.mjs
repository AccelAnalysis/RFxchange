import assert from "node:assert/strict";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import { connectAuthEmulator, inMemoryPersistence, initializeAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore as getClientFirestore,
  setDoc,
} from "firebase/firestore";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

import { authorizeOrganizationOperation } from "../src/application/auth/authorize-organization-operation.ts";
import { FirebaseAccountSecurityService } from "../src/infrastructure/auth/firebase-account-security.ts";
import { FirebaseBrowserAuthenticationProvider } from "../src/infrastructure/auth/firebase-browser.ts";
import { FirebaseServerSessionBoundary } from "../src/infrastructure/auth/firebase-server-session.ts";
import { FirebaseUserIdentityResolver } from "../src/infrastructure/auth/firebase-user-resolution.ts";

assert.equal(
  process.env.FIREBASE_AUTH_EMULATOR_HOST,
  "127.0.0.1:9099",
  "AUTH-005 security suite must use the Firebase Auth emulator.",
);
assert.equal(
  process.env.FIRESTORE_EMULATOR_HOST,
  "127.0.0.1:8080",
  "AUTH-005 security suite must use the Firestore emulator.",
);

const projectId = "demo-rfxchange";
const now = new Date().toISOString();
const permission = "organization.profile.manage";

function createClient(name) {
  const app = initializeClientApp(
    {
      apiKey: "demo-api-key",
      authDomain: `${projectId}.firebaseapp.com`,
      projectId,
      appId: `1:123:web:${name}`,
    },
    `${name}-${Date.now()}-${Math.random()}`,
  );
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const firestore = getClientFirestore(app);
  connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
  return { app, auth, firestore, browser: new FirebaseBrowserAuthenticationProvider(auth) };
}

function domainData(snapshot) {
  if (!snapshot.exists) return null;
  const data = { ...snapshot.data() };
  delete data.schemaVersion;
  return data;
}

function firestoreUserRepository(db) {
  return {
    async getById(id) {
      return domainData(await db.collection("users").doc(id).get());
    },
    async getByPrimaryEmail(email) {
      const result = await db
        .collection("users")
        .where("primaryEmail", "==", email.trim().toLowerCase())
        .limit(1)
        .get();
      return result.empty ? null : domainData(result.docs[0]);
    },
    async getByLogin(provider, subject) {
      const result = await db
        .collection("users")
        .where("login.provider", "==", provider)
        .where("login.subject", "==", subject)
        .limit(1)
        .get();
      return result.empty ? null : domainData(result.docs[0]);
    },
    async create(user) {
      await db.collection("users").doc(user.id).create({ ...user, schemaVersion: 1 });
    },
  };
}

function serverRepositories(db) {
  return {
    organizations: {
      async getById(id) {
        return domainData(await db.collection("organizations").doc(id).get());
      },
      async create(value) {
        await db.collection("organizations").doc(value.id).create({ ...value, schemaVersion: 1 });
      },
    },
    memberships: {
      async getById(id) {
        return domainData(await db.collection("organizationMemberships").doc(id).get());
      },
      async listByUserId() {
        return [];
      },
      async listActiveByUserId() {
        return [];
      },
      async listByOrganizationId() {
        return [];
      },
      async create(value) {
        await db.collection("organizationMemberships").doc(value.id).create({ ...value, schemaVersion: 1 });
      },
    },
    authorizations: {
      async getByMembershipId(id) {
        return domainData(await db.collection("organizationAuthorizations").doc(id).get());
      },
      async listByUserId() {
        return [];
      },
      async listByOrganizationId() {
        return [];
      },
      async save(value) {
        await db
          .collection("organizationAuthorizations")
          .doc(value.membershipId)
          .set({ ...value, schemaVersion: 1 });
      },
    },
    restrictions: {
      async getById(id) {
        return domainData(await db.collection("accessRestrictions").doc(id).get());
      },
      async getForOrganization(id) {
        const result = await db
          .collection("accessRestrictions")
          .where("target.kind", "==", "organization")
          .where("target.organizationId", "==", id)
          .limit(1)
          .get();
        return result.empty ? null : domainData(result.docs[0]);
      },
      async getForMembership(id) {
        const result = await db
          .collection("accessRestrictions")
          .where("target.kind", "==", "membership")
          .where("target.membershipId", "==", id)
          .limit(1)
          .get();
        return result.empty ? null : domainData(result.docs[0]);
      },
      async save(value) {
        await db.collection("accessRestrictions").doc(value.id).set({ ...value, schemaVersion: 1 });
      },
    },
  };
}

function membership(id, userId, organizationId, status = "active") {
  return { id, userId, organizationId, status, createdAt: now, updatedAt: now };
}

function authorization(membershipId, userId, organizationId, permissions) {
  return {
    membershipId,
    userId,
    organizationId,
    roleKey: "owner",
    permissions,
    createdAt: now,
    updatedAt: now,
  };
}

function organization(id) {
  return { id, createdAt: now, updatedAt: now };
}

async function expectPermissionDenied(operation, label) {
  await assert.rejects(
    operation,
    (error) => error?.code === "permission-denied" || error?.code === "firestore/permission-denied",
    label,
  );
}

const alice = createClient("auth005-alice");
const bob = createClient("auth005-bob");
const anonymous = createClient("auth005-anonymous");
const adminApp = initializeAdminApp({ projectId }, `auth005-admin-${Date.now()}`);
const adminAuth = getAdminAuth(adminApp);
const adminDb = getAdminFirestore(adminApp);

let aliceUid = null;
let bobUid = null;

try {
  const aliceEmail = `auth005-alice-${Date.now()}@example.test`;
  const bobEmail = `auth005-bob-${Date.now()}@example.test`;
  const password = "RFxchange-AUTH-005-Smoke-123!";

  const alicePrincipal = await alice.browser.registerWithEmailAndPassword(aliceEmail, password);
  const bobPrincipal = await bob.browser.registerWithEmailAndPassword(bobEmail, password);
  aliceUid = alicePrincipal.subject;
  bobUid = bobPrincipal.subject;
  await Promise.all([
    adminAuth.updateUser(aliceUid, { emailVerified: true, displayName: "Alice Owner" }),
    adminAuth.updateUser(bobUid, { emailVerified: true, displayName: "Bob User" }),
  ]);

  await Promise.all([alice.browser.signOut(), bob.browser.signOut()]);
  await Promise.all([
    alice.browser.signInWithEmailAndPassword(aliceEmail, password),
    bob.browser.signInWithEmailAndPassword(bobEmail, password),
  ]);

  const resolver = new FirebaseUserIdentityResolver(firestoreUserRepository(adminDb));
  const boundary = new FirebaseServerSessionBoundary(adminAuth, resolver, { secureCookies: false });
  const aliceToken = await alice.browser.getIdToken(true);
  const bobToken = await bob.browser.getIdToken(true);
  assert.ok(aliceToken && bobToken, "Auth emulator must issue tokens for both test users.");

  const aliceContext = await boundary.authenticateIdToken({
    idToken: aliceToken,
    requestedName: "Alice Owner",
    now,
  });
  const bobContext = await boundary.authenticateIdToken({
    idToken: bobToken,
    requestedName: "Bob User",
    now,
  });
  assert.notEqual(aliceContext.user.id, aliceUid, "RFxchange UserId must remain distinct from Firebase UID.");
  assert.notEqual(bobContext.user.id, bobUid, "RFxchange UserId must remain distinct from Firebase UID.");

  const orgA = organization("org_auth005_a");
  const orgB = organization("org_auth005_b");
  const orgC = organization("org_auth005_c");
  const memAliceA = membership("mem_auth005_alice_a", aliceContext.user.id, orgA.id);
  const memAliceInactive = membership(
    "mem_auth005_alice_inactive",
    aliceContext.user.id,
    orgB.id,
    "inactive",
  );
  const memAliceRestricted = membership(
    "mem_auth005_alice_restricted",
    aliceContext.user.id,
    orgC.id,
  );
  const memAliceNoPermission = membership(
    "mem_auth005_alice_no_permission",
    aliceContext.user.id,
    orgA.id,
  );

  const seed = [
    ["organizations", orgA.id, orgA],
    ["organizations", orgB.id, orgB],
    ["organizations", orgC.id, orgC],
    [
      "organizationProfiles",
      "prf_auth005_a",
      {
        id: "prf_auth005_a",
        organizationId: orgA.id,
        displayName: "AUTH-005 Authorized Organization",
        createdAt: now,
        updatedAt: now,
      },
    ],
    ["organizationMemberships", memAliceA.id, memAliceA],
    ["organizationMemberships", memAliceInactive.id, memAliceInactive],
    ["organizationMemberships", memAliceRestricted.id, memAliceRestricted],
    ["organizationMemberships", memAliceNoPermission.id, memAliceNoPermission],
    [
      "organizationAuthorizations",
      memAliceA.id,
      authorization(memAliceA.id, aliceContext.user.id, orgA.id, [permission]),
    ],
    [
      "organizationAuthorizations",
      memAliceInactive.id,
      authorization(memAliceInactive.id, aliceContext.user.id, orgB.id, [permission]),
    ],
    [
      "organizationAuthorizations",
      memAliceRestricted.id,
      authorization(memAliceRestricted.id, aliceContext.user.id, orgC.id, [permission]),
    ],
    [
      "organizationAuthorizations",
      memAliceNoPermission.id,
      authorization(memAliceNoPermission.id, aliceContext.user.id, orgA.id, []),
    ],
    [
      "accessRestrictions",
      "rst_auth005_membership",
      {
        id: "rst_auth005_membership",
        target: {
          kind: "membership",
          organizationId: orgC.id,
          membershipId: memAliceRestricted.id,
          userId: aliceContext.user.id,
        },
        state: "suspended",
        createdAt: now,
        updatedAt: now,
      },
    ],
  ];
  const batch = adminDb.batch();
  for (const [collection, id, value] of seed) {
    batch.set(adminDb.collection(collection).doc(id), { ...value, schemaVersion: 1 });
  }
  await batch.commit();

  const repositories = serverRepositories(adminDb);
  const dependencies = {
    accountSecurity: new FirebaseAccountSecurityService(adminAuth),
    organizations: repositories.organizations,
    memberships: repositories.memberships,
    authorizations: repositories.authorizations,
    restrictions: repositories.restrictions,
  };

  const noAuth = await authorizeOrganizationOperation(
    { context: null, organizationId: orgA.id, membershipId: memAliceA.id, permission },
    dependencies,
  );
  assert.deepEqual(noAuth, { allowed: false, reason: "unauthenticated" });

  const wrongUser = await authorizeOrganizationOperation(
    { context: bobContext, organizationId: orgA.id, membershipId: memAliceA.id, permission },
    dependencies,
  );
  assert.deepEqual(wrongUser, { allowed: false, reason: "wrong-user" });

  const wrongOrganization = await authorizeOrganizationOperation(
    { context: aliceContext, organizationId: orgB.id, membershipId: memAliceA.id, permission },
    dependencies,
  );
  assert.deepEqual(wrongOrganization, { allowed: false, reason: "wrong-organization" });

  const inactive = await authorizeOrganizationOperation(
    {
      context: aliceContext,
      organizationId: orgB.id,
      membershipId: memAliceInactive.id,
      permission,
    },
    dependencies,
  );
  assert.deepEqual(inactive, { allowed: false, reason: "membership-inactive" });

  const restricted = await authorizeOrganizationOperation(
    {
      context: aliceContext,
      organizationId: orgC.id,
      membershipId: memAliceRestricted.id,
      permission,
    },
    dependencies,
  );
  assert.deepEqual(restricted, {
    allowed: false,
    reason: "organization-access-restricted",
    restrictionState: "suspended",
  });

  const missingPermission = await authorizeOrganizationOperation(
    {
      context: aliceContext,
      organizationId: orgA.id,
      membershipId: memAliceNoPermission.id,
      permission,
    },
    dependencies,
  );
  assert.deepEqual(missingPermission, { allowed: false, reason: "missing-permission" });

  const authorized = await authorizeOrganizationOperation(
    { context: aliceContext, organizationId: orgA.id, membershipId: memAliceA.id, permission },
    dependencies,
  );
  assert.equal(authorized.allowed, true);
  assert.equal(authorized.context.user.id, aliceContext.user.id);
  assert.equal(authorized.organization.id, orgA.id);
  assert.equal(authorized.membership.id, memAliceA.id);

  const serverProfile = domainData(
    await adminDb.collection("organizationProfiles").doc("prf_auth005_a").get(),
  );
  assert.equal(serverProfile.displayName, "AUTH-005 Authorized Organization");

  const profilePath = "organizationProfiles/prf_auth005_a";
  await expectPermissionDenied(
    getDoc(doc(anonymous.firestore, profilePath)),
    "Unauthenticated direct client read must be denied.",
  );
  await expectPermissionDenied(
    setDoc(doc(anonymous.firestore, "organizationProfiles/prf_auth005_unauth_write"), {
      displayName: "Denied",
    }),
    "Unauthenticated direct client write must be denied.",
  );
  await expectPermissionDenied(
    getDoc(doc(alice.firestore, profilePath)),
    "Authenticated direct client read must remain denied by the server-managed rules boundary.",
  );
  await expectPermissionDenied(
    setDoc(doc(alice.firestore, "organizationProfiles/prf_auth005_auth_write"), {
      displayName: "Denied",
    }),
    "Authenticated direct client write must remain denied by the server-managed rules boundary.",
  );

  console.log("AUTH-005 Firebase Auth and Firestore security suite passed.");
} finally {
  if (aliceUid) await adminAuth.deleteUser(aliceUid).catch(() => undefined);
  if (bobUid) await adminAuth.deleteUser(bobUid).catch(() => undefined);
  await deleteAdminApp(adminApp);
  await Promise.all([
    deleteClientApp(alice.app),
    deleteClientApp(bob.app),
    deleteClientApp(anonymous.app),
  ]);
}
