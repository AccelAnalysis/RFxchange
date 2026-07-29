import assert from "node:assert/strict";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import {
  applyActionCode,
  confirmPasswordReset,
  connectAuthEmulator,
  inMemoryPersistence,
  initializeAuth,
} from "firebase/auth";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";

import {
  authenticationCredentialState,
  evaluateAuthenticatedOrganizationAccess,
} from "../src/application/auth/account-security.ts";
import { FirebaseAccountSecurityService } from "../src/infrastructure/auth/firebase-account-security.ts";
import { FirebaseBrowserAuthenticationProvider } from "../src/infrastructure/auth/firebase-browser.ts";
import { FirebaseBrowserAuthenticationLifecycle } from "../src/infrastructure/auth/firebase-browser-lifecycle.ts";

assert.equal(
  process.env.FIREBASE_AUTH_EMULATOR_HOST,
  "127.0.0.1:9099",
  "AUTH-004 smoke test must use the Firebase Auth emulator.",
);

const projectId = "demo-rfxchange";
const emulatorBaseUrl = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`;
const clientApp = initializeClientApp(
  {
    apiKey: "demo-api-key",
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    appId: "1:123:web:auth004",
  },
  `auth-004-client-${Date.now()}`,
);
const clientAuth = initializeAuth(clientApp, { persistence: inMemoryPersistence });
connectAuthEmulator(clientAuth, emulatorBaseUrl, { disableWarnings: true });
const browser = new FirebaseBrowserAuthenticationProvider(clientAuth);
const lifecycle = new FirebaseBrowserAuthenticationLifecycle(clientAuth);

const adminApp = initializeAdminApp({ projectId }, `auth-004-admin-${Date.now()}`);
const adminAuth = getAdminAuth(adminApp);
const security = new FirebaseAccountSecurityService(adminAuth);

const email = `auth-004-${Date.now()}@example.test`;
const originalPassword = "RFxchange-AUTH-004-Original-123!";
const recoveredPassword = "RFxchange-AUTH-004-Recovered-456!";
let uid = null;

async function outOfBandCodes() {
  const response = await fetch(`${emulatorBaseUrl}/emulator/v1/projects/${projectId}/oobCodes`);
  assert.equal(response.ok, true, "Auth emulator out-of-band code endpoint must respond.");
  const payload = await response.json();
  return Array.isArray(payload.oobCodes) ? payload.oobCodes : [];
}

function isMode(record, requestType, mode) {
  return record.requestType === requestType || record.mode === mode;
}

function authTimeIso(decoded) {
  return new Date(decoded.auth_time * 1000).toISOString();
}

try {
  const registered = await browser.registerWithEmailAndPassword(email, originalPassword);
  uid = registered.subject;

  const initial = await security.inspect(uid);
  assert.equal(initial.emailVerified, false);
  assert.equal(
    evaluateAuthenticatedOrganizationAccess({
      account: initial,
      credentialAuthenticatedAt: new Date().toISOString(),
      membershipStatus: "active",
      restrictionState: "none",
    }).reason,
    "email-verification-required",
  );

  await lifecycle.sendVerificationEmail();
  const verification = (await outOfBandCodes()).find(
    (record) => record.email === email && isMode(record, "VERIFY_EMAIL", "verifyEmail"),
  );
  assert.ok(verification?.oobCode, "Auth emulator must expose an email-verification action code.");
  await applyActionCode(clientAuth, verification.oobCode);
  const verifiedPrincipal = await lifecycle.reloadCurrentPrincipal();
  assert.equal(verifiedPrincipal?.emailVerified, true);

  await lifecycle.requestPasswordRecovery(email);
  await lifecycle.requestPasswordRecovery(`missing-${Date.now()}@example.test`);
  const recovery = (await outOfBandCodes()).find(
    (record) => record.email === email && isMode(record, "PASSWORD_RESET", "resetPassword"),
  );
  assert.ok(recovery?.oobCode, "Auth emulator must expose a password-recovery action code.");
  await confirmPasswordReset(clientAuth, recovery.oobCode, recoveredPassword);

  await browser.signOut();
  await assert.rejects(
    browser.signInWithEmailAndPassword(email, originalPassword),
    (error) => ["auth/invalid-credential", "auth/wrong-password"].includes(error?.code),
  );
  await browser.signInWithEmailAndPassword(email, recoveredPassword);

  const activeToken = await browser.getIdToken(true);
  assert.ok(activeToken, "Recovered account must issue a fresh ID token.");
  const activeClaims = await adminAuth.verifyIdToken(activeToken, true);
  const active = await security.inspect(uid);
  assert.deepEqual(
    evaluateAuthenticatedOrganizationAccess({
      account: active,
      credentialAuthenticatedAt: authTimeIso(activeClaims),
      membershipStatus: "active",
      restrictionState: "none",
    }),
    { allowed: true },
  );

  const disabled = await security.disable(uid);
  assert.equal(disabled.disabled, true);
  await browser.signOut();
  await assert.rejects(
    browser.signInWithEmailAndPassword(email, recoveredPassword),
    (error) => error?.code === "auth/user-disabled",
  );

  const restored = await security.restore(uid);
  assert.equal(restored.disabled, false);
  await browser.signInWithEmailAndPassword(email, recoveredPassword);
  const preRevocationToken = await browser.getIdToken(true);
  assert.ok(preRevocationToken);
  const preRevocationClaims = await adminAuth.verifyIdToken(preRevocationToken, false);

  await new Promise((resolve) => setTimeout(resolve, 1100));
  const revoked = await security.revokeSessions(uid);
  assert.equal(
    authenticationCredentialState(revoked, authTimeIso(preRevocationClaims)),
    "revoked",
  );
  assert.equal(
    evaluateAuthenticatedOrganizationAccess({
      account: revoked,
      credentialAuthenticatedAt: authTimeIso(preRevocationClaims),
      membershipStatus: "active",
      restrictionState: "none",
    }).reason,
    "credential-revoked",
  );
  await assert.rejects(
    adminAuth.verifyIdToken(preRevocationToken, true),
    (error) => error?.code === "auth/id-token-revoked",
  );

  console.log("AUTH-004 Firebase authentication lifecycle emulator smoke test passed.");
} finally {
  if (uid) {
    await adminAuth.deleteUser(uid).catch(() => undefined);
  }
  await deleteAdminApp(adminApp);
  await deleteClientApp(clientApp);
}
