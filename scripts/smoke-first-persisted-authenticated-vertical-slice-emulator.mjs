import assert from "node:assert/strict";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import { connectAuthEmulator, inMemoryPersistence, initializeAuth } from "firebase/auth";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

import { AuthenticatedOrganizationWorkspaceService } from "../src/application/auth/authenticated-organization-workspace.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import { createOrganizationAccount, createOrganizationProfile } from "../src/domain/organizations/model.ts";
import { createOrganizationMembership } from "../src/domain/users/model.ts";
import { FirebaseAccountSecurityService } from "../src/infrastructure/auth/firebase-account-security.ts";
import { FirebaseBrowserAuthenticationProvider } from "../src/infrastructure/auth/firebase-browser.ts";
import { FirebaseServerSessionBoundary } from "../src/infrastructure/auth/firebase-server-session.ts";
import { FirebaseUserIdentityResolver } from "../src/infrastructure/auth/firebase-user-resolution.ts";
import { createFirestoreFoundationRepositories } from "../src/infrastructure/firestore/repositories.ts";

assert.equal(
  process.env.FIREBASE_AUTH_EMULATOR_HOST,
  "127.0.0.1:9099",
  "INF-009 acceptance must use the Firebase Auth emulator.",
);
assert.equal(
  process.env.FIRESTORE_EMULATOR_HOST,
  "127.0.0.1:8080",
  "INF-009 acceptance must use the Firestore emulator.",
);

const projectId = "demo-rfxchange";
const runId = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const clientApp = initializeClientApp(
  {
    apiKey: "demo-api-key",
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    appId: `1:123:web:inf009-${runId}`,
  },
  `inf009-client-${runId}`,
);
const clientAuth = initializeAuth(clientApp, { persistence: inMemoryPersistence });
connectAuthEmulator(clientAuth, "http://127.0.0.1:9099", { disableWarnings: true });
const browser = new FirebaseBrowserAuthenticationProvider(clientAuth);

const adminApp = initializeAdminApp({ projectId }, `inf009-admin-${runId}`);
const adminAuth = getAdminAuth(adminApp);
const adminDb = getAdminFirestore(adminApp);
const accountSecurity = new FirebaseAccountSecurityService(adminAuth);

const email = `inf009-${runId}@example.test`;
const password = "RFxchange-INF-009-Smoke-123!";
const orgId = `org_inf009_${runId}`;
const profileId = `profile_inf009_${runId}`;
const membershipId = `mem_inf009_${runId}`;
let firebaseUid = null;
let rfxchangeUserId = null;

function workspace(repositories) {
  return new AuthenticatedOrganizationWorkspaceService({
    accountSecurity,
    organizations: repositories.organizations.accounts,
    profiles: repositories.organizations.profiles,
    memberships: repositories.users.memberships,
    authorizations: repositories.organizationAuthorization,
    restrictions: repositories.lifecycle.restrictions,
  });
}

async function deleteIfExists(collection, id) {
  if (!id) return;
  await adminDb.collection(collection).doc(id).delete();
}

try {
  const registered = await browser.registerWithEmailAndPassword(email, password);
  firebaseUid = registered.subject;
  await adminAuth.updateUser(firebaseUid, { emailVerified: true, displayName: "INF 009 Persisted User" });

  // Refresh provider claims after the authoritative verification/display-name update.
  await browser.signOut();
  await browser.signInWithEmailAndPassword(email, password);
  const idToken = await browser.getIdToken(true);
  assert.ok(idToken, "Firebase Auth emulator must issue an ID token for INF-009.");

  const repositoriesBeforeReload = createFirestoreFoundationRepositories(adminDb);
  const boundaryBeforeReload = new FirebaseServerSessionBoundary(
    adminAuth,
    new FirebaseUserIdentityResolver(repositoriesBeforeReload.users.users),
    { secureCookies: false },
  );
  const issued = await boundaryBeforeReload.issueSessionCookie({
    idToken,
    csrfVerified: true,
    requestedName: "INF 009 Persisted User",
    now: new Date().toISOString(),
  });
  rfxchangeUserId = issued.context.user.id;
  assert.notEqual(
    rfxchangeUserId,
    firebaseUid,
    "INF-009 must resolve Firebase UID to a distinct stable RFxchange UserId.",
  );

  const domainNow = new Date().toISOString();
  const organization = createOrganizationAccount({ id: orgId, now: domainNow });
  const profile = createOrganizationProfile(organization, {
    id: profileId,
    displayName: "INF 009 Persisted Organization",
    now: domainNow,
  });
  const membership = createOrganizationMembership(issued.context.user, organization, {
    id: membershipId,
    now: domainNow,
  });
  const authorization = createOrganizationUserAuthorization(membership, organization, {
    roleKey: "owner",
    permissions: ["organization.profile.manage", "rfx.create"],
    now: domainNow,
  });

  await repositoriesBeforeReload.organizations.accounts.create(organization);
  await repositoriesBeforeReload.organizations.profiles.create(profile);
  await repositoriesBeforeReload.users.memberships.create(membership);
  await repositoriesBeforeReload.organizationAuthorization.save(authorization);

  const firstWorkspace = await workspace(repositoriesBeforeReload).resolve({
    context: issued.context,
    requestedOrganizationId: orgId,
    permission: "organization.profile.manage",
  });
  assert.equal(firstWorkspace.kind, "authorized");
  assert.equal(firstWorkspace.organization.organizationId, orgId);
  assert.equal(firstWorkspace.organization.profile.displayName, "INF 009 Persisted Organization");
  assert.equal(firstWorkspace.membership.id, membershipId);
  assert.equal(firstWorkspace.authorization.membershipId, membershipId);
  assert.equal(firstWorkspace.permission, "organization.profile.manage");

  for (const [collection, id] of [
    ["users", rfxchangeUserId],
    ["organizations", orgId],
    ["organizationProfiles", profileId],
    ["organizationMemberships", membershipId],
    ["organizationAuthorizations", membershipId],
  ]) {
    const snapshot = await adminDb.collection(collection).doc(id).get();
    assert.equal(snapshot.exists, true, `${collection}/${id} must be persisted before reload.`);
    assert.equal(snapshot.data()?.schemaVersion, 1, `${collection}/${id} must use canonical Firestore schema metadata.`);
  }

  // Simulate leaving the browser and rebuilding the server-side composition from persisted provider state.
  await browser.signOut();
  const repositoriesAfterReload = createFirestoreFoundationRepositories(adminDb);
  const boundaryAfterReload = new FirebaseServerSessionBoundary(
    adminAuth,
    new FirebaseUserIdentityResolver(repositoriesAfterReload.users.users),
    { secureCookies: false },
  );
  const reloadedContext = await boundaryAfterReload.authenticateSessionCookie({
    sessionCookie: issued.cookie.value,
    now: new Date().toISOString(),
  });
  assert.equal(reloadedContext.authentication.source, "session-cookie");
  assert.equal(reloadedContext.user.id, rfxchangeUserId, "Reload must resolve the same persisted RFxchange user.");

  const reloadedWorkspace = await workspace(repositoriesAfterReload).resolve({
    context: reloadedContext,
    requestedOrganizationId: orgId,
    permission: "organization.profile.manage",
  });
  assert.equal(reloadedWorkspace.kind, "authorized");
  assert.equal(reloadedWorkspace.organization.organizationId, firstWorkspace.organization.organizationId);
  assert.equal(reloadedWorkspace.organization.profile.id, firstWorkspace.organization.profile.id);
  assert.equal(reloadedWorkspace.membership.id, firstWorkspace.membership.id);
  assert.deepEqual(reloadedWorkspace.authorization.permissions, firstWorkspace.authorization.permissions);
  assert.equal(reloadedWorkspace.context.user.id, firstWorkspace.context.user.id);

  console.log(
    "INF-009 persisted authenticated vertical slice passed: login -> identity -> membership -> organization -> permission -> Firestore -> session reload -> same authorized organization.",
  );
} finally {
  await Promise.allSettled([
    deleteIfExists("organizationAuthorizations", membershipId),
    deleteIfExists("organizationMemberships", membershipId),
    deleteIfExists("organizationProfiles", profileId),
    deleteIfExists("organizations", orgId),
    deleteIfExists("users", rfxchangeUserId),
  ]);
  if (firebaseUid) await adminAuth.deleteUser(firebaseUid).catch(() => undefined);
  await deleteAdminApp(adminApp);
  await deleteClientApp(clientApp);
}
