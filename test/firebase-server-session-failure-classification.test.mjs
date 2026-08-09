import assert from "node:assert/strict";
import test from "node:test";

import { ServerSessionError } from "../src/application/auth/server-session.ts";
import { FirebaseServerSessionBoundary } from "../src/infrastructure/auth/firebase-server-session.ts";

const NOW = "2026-08-09T17:00:00.000Z";

function firebaseError(code, message = code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function boundaryForVerificationError(error) {
  const auth = {
    async verifyIdToken() { throw error; },
    async createSessionCookie() { throw error; },
    async verifySessionCookie() { throw error; },
  };
  const resolver = {
    async resolve() {
      throw new Error("Identity resolution must not run after verification failure.");
    },
  };
  return new FirebaseServerSessionBoundary(auth, resolver, { secureCookies: false });
}

async function expectSessionCode(operation, expectedCode) {
  await assert.rejects(
    operation,
    (error) => error instanceof ServerSessionError && error.code === expectedCode,
  );
}

test("recognized malformed, expired, or deleted Firebase credentials remain signed-out failures", async () => {
  for (const code of [
    "auth/argument-error",
    "auth/invalid-id-token",
    "auth/id-token-expired",
    "auth/invalid-session-cookie",
    "auth/session-cookie-expired",
    "auth/user-not-found",
  ]) {
    const boundary = boundaryForVerificationError(firebaseError(code));
    await expectSessionCode(
      () => boundary.authenticateSessionCookie({ sessionCookie: "bad-session", now: NOW }),
      "credential-invalid",
    );
  }
});

test("revoked and disabled Firebase credentials retain their governed classifications", async () => {
  await expectSessionCode(
    () => boundaryForVerificationError(firebaseError("auth/session-cookie-revoked"))
      .authenticateSessionCookie({ sessionCookie: "revoked-session", now: NOW }),
    "credential-revoked",
  );
  await expectSessionCode(
    () => boundaryForVerificationError(firebaseError("auth/user-disabled"))
      .authenticateSessionCookie({ sessionCookie: "disabled-session", now: NOW }),
    "account-disabled",
  );
});

test("recognized Firebase Admin configuration failures are retryable backend failures", async () => {
  for (const failure of [
    firebaseError("app/invalid-credential"),
    firebaseError("app/invalid-app-options"),
    firebaseError("auth/internal-error"),
    new Error("Application Default Credentials are temporarily unavailable"),
  ]) {
    await expectSessionCode(
      () => boundaryForVerificationError(failure)
        .authenticateSessionCookie({ sessionCookie: "otherwise-valid-session", now: NOW }),
      "authentication-backend-unavailable",
    );
  }
});

test("unknown provider and network failures never invalidate an existing participant session", async () => {
  for (const failure of [
    firebaseError("auth/network-request-failed", "upstream connection reset"),
    firebaseError("auth/too-many-requests", "provider temporarily unavailable"),
    new Error("socket hang up"),
    Object.freeze({ code: "provider/unrecognized" }),
  ]) {
    await expectSessionCode(
      () => boundaryForVerificationError(failure)
        .authenticateSessionCookie({ sessionCookie: "otherwise-valid-session", now: NOW }),
      "authentication-backend-unavailable",
    );
  }
});
