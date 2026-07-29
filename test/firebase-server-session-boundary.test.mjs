import assert from "node:assert/strict";
import test from "node:test";

import {
  FirebaseServerSessionBoundary,
  RFXCHANGE_SESSION_COOKIE_NAME,
  RFXCHANGE_SESSION_DURATION_MS,
} from "../src/infrastructure/auth/firebase-server-session.ts";

const NOW = "2026-07-29T20:30:00.000Z";
const NOW_SECONDS = Math.floor(Date.parse(NOW) / 1000);

function decoded(overrides = {}) {
  return {
    uid: "firebase_uid_001",
    email: "jamie@example.com",
    name: "Jamie Rivera",
    email_verified: true,
    auth_time: NOW_SECONDS - 30,
    iat: NOW_SECONDS - 30,
    exp: NOW_SECONDS + 3600,
    firebase: { sign_in_provider: "password", identities: {} },
    aud: "demo-rfxchange",
    iss: "https://securetoken.google.com/demo-rfxchange",
    sub: "firebase_uid_001",
    ...overrides,
  };
}

function user() {
  return {
    id: "usr_internal_001",
    name: "Jamie Rivera",
    primaryEmail: "jamie@example.com",
    login: { provider: "firebase", subject: "firebase_uid_001" },
    security: { mfaEnabled: false, credentialVersion: 1 },
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function fixture() {
  const calls = [];
  const auth = {
    async verifyIdToken(value, checkRevoked) {
      calls.push(["verifyIdToken", value, checkRevoked]);
      return decoded();
    },
    async createSessionCookie(value, options) {
      calls.push(["createSessionCookie", value, options.expiresIn]);
      return "firebase-session-cookie";
    },
    async verifySessionCookie(value, checkRevoked) {
      calls.push(["verifySessionCookie", value, checkRevoked]);
      return decoded({ exp: NOW_SECONDS + 86400 });
    },
  };
  const resolver = {
    async resolve(input) {
      calls.push(["resolve", input.principal.subject, input.requestedName ?? null]);
      return { kind: "existing", user: user(), emailVerified: true };
    },
  };
  return { calls, boundary: new FirebaseServerSessionBoundary(auth, resolver, { secureCookies: true }) };
}

test("ID tokens are revocation-checked before becoming an authenticated RFxchange context", async () => {
  const { calls, boundary } = fixture();
  const context = await boundary.authenticateIdToken({ idToken: "id-token", now: NOW });
  assert.equal(context.user.id, "usr_internal_001");
  assert.equal(context.authentication.subject, "firebase_uid_001");
  assert.equal(context.authentication.source, "id-token");
  assert.deepEqual(calls[0], ["verifyIdToken", "id-token", true]);
});

test("session exchange requires CSRF verification and recent authentication", async () => {
  const { boundary } = fixture();
  await assert.rejects(
    boundary.issueSessionCookie({ idToken: "id-token", csrfVerified: false, now: NOW }),
    (error) => error.code === "csrf-verification-required",
  );

  const staleAuth = {
    verifyIdToken: async () => decoded({ auth_time: NOW_SECONDS - 301 }),
    createSessionCookie: async () => "unused",
    verifySessionCookie: async () => decoded(),
  };
  const resolver = { resolve: async () => ({ kind: "existing", user: user(), emailVerified: true }) };
  const stale = new FirebaseServerSessionBoundary(staleAuth, resolver);
  await assert.rejects(
    stale.issueSessionCookie({ idToken: "id-token", csrfVerified: true, now: NOW }),
    (error) => error.code === "recent-authentication-required",
  );
});

test("session exchange returns hardened cookie metadata and authenticated context", async () => {
  const { calls, boundary } = fixture();
  const issued = await boundary.issueSessionCookie({
    idToken: "id-token",
    csrfVerified: true,
    requestedName: "Jamie Rivera",
    now: NOW,
  });
  assert.equal(issued.cookie.name, RFXCHANGE_SESSION_COOKIE_NAME);
  assert.equal(issued.cookie.httpOnly, true);
  assert.equal(issued.cookie.secure, true);
  assert.equal(issued.cookie.sameSite, "lax");
  assert.equal(issued.cookie.path, "/");
  assert.equal(issued.cookie.maxAgeSeconds, RFXCHANGE_SESSION_DURATION_MS / 1000);
  assert.ok(calls.some((call) => call[0] === "createSessionCookie" && call[2] === RFXCHANGE_SESSION_DURATION_MS));
});

test("session cookies are revocation-checked before RFxchange identity resolution", async () => {
  const { calls, boundary } = fixture();
  const context = await boundary.authenticateSessionCookie({ sessionCookie: "cookie", now: NOW });
  assert.equal(context.authentication.source, "session-cookie");
  assert.deepEqual(calls[0], ["verifySessionCookie", "cookie", true]);
});
