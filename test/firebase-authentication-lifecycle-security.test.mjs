import assert from "node:assert/strict";
import test from "node:test";

import {
  authenticationAccountState,
  authenticationCredentialState,
  evaluateAuthenticatedOrganizationAccess,
} from "../src/application/auth/account-security.ts";
import {
  accountSecuritySnapshotFromFirebaseUser,
  FirebaseAccountSecurityService,
} from "../src/infrastructure/auth/firebase-account-security.ts";
import { FirebaseServerSessionBoundary } from "../src/infrastructure/auth/firebase-server-session.ts";

const NOW = "2026-07-29T20:45:00.000Z";

function snapshot(overrides = {}) {
  return {
    provider: "firebase",
    subject: "firebase_uid_004",
    email: "security@example.com",
    emailVerified: true,
    disabled: false,
    mfaEnrolled: false,
    tokensValidAfter: "2026-07-29T20:00:00.000Z",
    lastSignInAt: "2026-07-29T20:40:00.000Z",
    ...overrides,
  };
}

function firebaseUser(overrides = {}) {
  return {
    uid: "firebase_uid_004",
    email: "security@example.com",
    emailVerified: true,
    disabled: false,
    multiFactor: { enrolledFactors: [] },
    tokensValidAfterTime: "Wed, 29 Jul 2026 20:00:00 GMT",
    metadata: { lastSignInTime: "Wed, 29 Jul 2026 20:40:00 GMT" },
    ...overrides,
  };
}

test("account state requires verified email and fails closed for disabled identities", () => {
  assert.equal(authenticationAccountState(snapshot()), "active");
  assert.equal(
    authenticationAccountState(snapshot({ emailVerified: false })),
    "email-verification-required",
  );
  assert.equal(
    authenticationAccountState(snapshot({ emailVerified: false, disabled: true })),
    "disabled",
  );
});

test("credential state compares authentication time with provider revocation time", () => {
  assert.equal(authenticationCredentialState(snapshot(), "2026-07-29T20:30:00.000Z"), "current");
  assert.equal(
    authenticationCredentialState(
      snapshot({ tokensValidAfter: "2026-07-29T20:35:00.000Z" }),
      "2026-07-29T20:30:00.000Z",
    ),
    "revoked",
  );
});

test("organization access eligibility denies each authentication and ARC lifecycle failure", () => {
  const base = {
    account: snapshot(),
    credentialAuthenticatedAt: "2026-07-29T20:30:00.000Z",
    membershipStatus: "active",
    restrictionState: "none",
  };

  assert.deepEqual(evaluateAuthenticatedOrganizationAccess(base), { allowed: true });
  assert.equal(
    evaluateAuthenticatedOrganizationAccess({ ...base, account: snapshot({ disabled: true }) }).reason,
    "account-disabled",
  );
  assert.equal(
    evaluateAuthenticatedOrganizationAccess({
      ...base,
      account: snapshot({ tokensValidAfter: "2026-07-29T20:35:00.000Z" }),
    }).reason,
    "credential-revoked",
  );
  assert.equal(
    evaluateAuthenticatedOrganizationAccess({
      ...base,
      account: snapshot({ emailVerified: false }),
    }).reason,
    "email-verification-required",
  );
  assert.equal(
    evaluateAuthenticatedOrganizationAccess({ ...base, membershipStatus: "inactive" }).reason,
    "membership-inactive",
  );
  assert.deepEqual(
    evaluateAuthenticatedOrganizationAccess({ ...base, restrictionState: "suspended" }),
    {
      allowed: false,
      reason: "organization-access-restricted",
      restrictionState: "suspended",
    },
  );
});

test("Firebase user records map to provider-neutral account security snapshots", () => {
  const mapped = accountSecuritySnapshotFromFirebaseUser(
    firebaseUser({ multiFactor: { enrolledFactors: [{ factorId: "phone" }] } }),
  );
  assert.equal(mapped.provider, "firebase");
  assert.equal(mapped.subject, "firebase_uid_004");
  assert.equal(mapped.emailVerified, true);
  assert.equal(mapped.mfaEnrolled, true);
  assert.equal(mapped.tokensValidAfter, "2026-07-29T20:00:00.000Z");
});

test("disable revokes sessions and restore never restores old credentials", async () => {
  const calls = [];
  let current = firebaseUser();
  const auth = {
    async getUser(uid) {
      calls.push(["getUser", uid]);
      return current;
    },
    async updateUser(uid, properties) {
      calls.push(["updateUser", uid, properties]);
      current = firebaseUser({ ...current, disabled: properties.disabled ?? current.disabled });
      return current;
    },
    async revokeRefreshTokens(uid) {
      calls.push(["revokeRefreshTokens", uid]);
      current = firebaseUser({
        ...current,
        tokensValidAfterTime: "Wed, 29 Jul 2026 20:45:00 GMT",
      });
    },
  };
  const service = new FirebaseAccountSecurityService(auth);

  const disabled = await service.disable("firebase_uid_004");
  assert.equal(disabled.disabled, true);
  assert.ok(calls.some((call) => call[0] === "revokeRefreshTokens"));

  const restored = await service.restore("firebase_uid_004");
  assert.equal(restored.disabled, false);
  assert.equal(restored.tokensValidAfter, "2026-07-29T20:45:00.000Z");
});

test("server session boundary exposes disabled and revoked credential states distinctly", async () => {
  const resolver = {
    async resolve() {
      throw new Error("identity resolution must not run after failed provider verification");
    },
  };

  const disabledBoundary = new FirebaseServerSessionBoundary(
    {
      verifyIdToken: async () => {
        throw Object.assign(new Error("disabled"), { code: "auth/user-disabled" });
      },
      createSessionCookie: async () => "unused",
      verifySessionCookie: async () => {
        throw Object.assign(new Error("disabled"), { code: "auth/user-disabled" });
      },
    },
    resolver,
  );
  await assert.rejects(
    disabledBoundary.authenticateIdToken({ idToken: "token", now: NOW }),
    (error) => error.code === "account-disabled",
  );

  const revokedBoundary = new FirebaseServerSessionBoundary(
    {
      verifyIdToken: async () => {
        throw Object.assign(new Error("revoked"), { code: "auth/id-token-revoked" });
      },
      createSessionCookie: async () => "unused",
      verifySessionCookie: async () => {
        throw Object.assign(new Error("revoked"), { code: "auth/session-cookie-revoked" });
      },
    },
    resolver,
  );
  await assert.rejects(
    revokedBoundary.authenticateSessionCookie({ sessionCookie: "cookie", now: NOW }),
    (error) => error.code === "credential-revoked",
  );
});
