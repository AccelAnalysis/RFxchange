import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveUserIdentity,
  UserIdentityResolutionError,
} from "../src/application/auth/resolve-user-identity.ts";
import {
  FirebaseUserIdentityIdStrategy,
  trustedIdentityFromFirebasePrincipal,
} from "../src/infrastructure/auth/firebase-user-resolution.ts";
import { createUserIdentity } from "../src/domain/users/model.ts";

const NOW = "2026-07-29T20:30:00.000Z";

class InMemoryUserIdentityRepository {
  constructor(seed = []) {
    this.byId = new Map(seed.map((user) => [user.id, user]));
    this.emailLookups = 0;
    this.createCount = 0;
    this.failAfterCreateOnce = false;
  }

  async getById(id) {
    return this.byId.get(id) ?? null;
  }

  async getByPrimaryEmail(primaryEmail) {
    this.emailLookups += 1;
    return [...this.byId.values()].find((user) => user.primaryEmail === primaryEmail) ?? null;
  }

  async getByLogin(provider, subject) {
    return (
      [...this.byId.values()].find(
        (user) => user.login.provider === provider && user.login.subject === subject,
      ) ?? null
    );
  }

  async create(user) {
    this.createCount += 1;
    if (this.byId.has(user.id)) throw new Error("already exists");
    this.byId.set(user.id, user);
    if (this.failAfterCreateOnce) {
      this.failAfterCreateOnce = false;
      throw new Error("simulated concurrent create race");
    }
  }
}

const ids = new FirebaseUserIdentityIdStrategy();

function principal(overrides = {}) {
  return {
    provider: "firebase",
    subject: "firebase_uid_001",
    email: "Jamie@Example.com",
    displayName: "Firebase Name",
    emailVerified: false,
    isAnonymous: false,
    ...overrides,
  };
}

function resolverInput(overrides = {}) {
  return {
    identity: principal(),
    requestedName: "Jamie Rivera",
    now: NOW,
    ...overrides,
  };
}

test("AUTH-002 deterministically derives an RFxchange UserId without reusing the Firebase UID", () => {
  const first = ids.createId({ provider: "firebase", subject: "firebase_uid_001" });
  const second = ids.createId({ provider: "firebase", subject: "firebase_uid_001" });

  assert.equal(first, second);
  assert.match(first, /^usr_[a-f0-9]{32}$/);
  assert.notEqual(first, "firebase_uid_001");
});

test("AUTH-002 creates one RFxchange identity from a trusted Firebase principal", async () => {
  const users = new InMemoryUserIdentityRepository();
  const resolved = await resolveUserIdentity(resolverInput(), { users, ids });

  assert.equal(resolved.kind, "created");
  assert.equal(resolved.user.name, "Jamie Rivera");
  assert.equal(resolved.user.primaryEmail, "jamie@example.com");
  assert.equal(resolved.user.login.provider, "firebase");
  assert.equal(resolved.user.login.subject, "firebase_uid_001");
  assert.equal(resolved.emailVerified, false);
  assert.equal(users.createCount, 1);
});

test("AUTH-002 resolves repeated sign-ins to the same RFxchange identity", async () => {
  const users = new InMemoryUserIdentityRepository();
  const first = await resolveUserIdentity(resolverInput(), { users, ids });
  const second = await resolveUserIdentity(
    resolverInput({
      identity: principal({ email: "changed@example.com", displayName: "Changed Provider Name" }),
      requestedName: "Changed Requested Name",
    }),
    { users, ids },
  );

  assert.equal(first.kind, "created");
  assert.equal(second.kind, "existing");
  assert.equal(second.user.id, first.user.id);
  assert.equal(second.user.primaryEmail, "jamie@example.com");
  assert.equal(second.user.name, "Jamie Rivera");
  assert.equal(users.createCount, 1);
});

test("AUTH-002 does not auto-link an existing RFxchange user merely by matching email", async () => {
  const preexisting = createUserIdentity({
    id: "user_existing",
    name: "Existing Person",
    primaryEmail: "jamie@example.com",
    loginProvider: "legacy-provider",
    loginSubject: "legacy_subject",
    now: NOW,
  });
  const users = new InMemoryUserIdentityRepository([preexisting]);

  const resolved = await resolveUserIdentity(resolverInput(), { users, ids });

  assert.equal(resolved.kind, "created");
  assert.notEqual(resolved.user.id, preexisting.id);
  assert.equal(users.emailLookups, 0);
});

test("AUTH-002 accepts provider display name when onboarding did not supply a name", async () => {
  const users = new InMemoryUserIdentityRepository();
  const resolved = await resolveUserIdentity(
    resolverInput({ requestedName: null }),
    { users, ids },
  );

  assert.equal(resolved.user.name, "Firebase Name");
});

test("AUTH-002 rejects anonymous principals and incomplete first-login profiles", async () => {
  const users = new InMemoryUserIdentityRepository();

  await assert.rejects(
    resolveUserIdentity(
      resolverInput({ identity: principal({ isAnonymous: true }) }),
      { users, ids },
    ),
    (error) =>
      error instanceof UserIdentityResolutionError &&
      error.code === "anonymous-identity-not-supported",
  );

  await assert.rejects(
    resolveUserIdentity(
      resolverInput({ identity: principal({ email: null }) }),
      { users, ids },
    ),
    (error) =>
      error instanceof UserIdentityResolutionError && error.code === "email-required-for-new-user",
  );

  await assert.rejects(
    resolveUserIdentity(
      resolverInput({
        requestedName: null,
        identity: principal({ displayName: null }),
      }),
      { users, ids },
    ),
    (error) =>
      error instanceof UserIdentityResolutionError && error.code === "name-required-for-new-user",
  );
});

test("AUTH-002 re-reads a deterministic identity after a concurrent create race", async () => {
  const users = new InMemoryUserIdentityRepository();
  users.failAfterCreateOnce = true;

  const resolved = await resolveUserIdentity(resolverInput(), { users, ids });

  assert.equal(resolved.kind, "existing");
  assert.equal(resolved.user.login.subject, "firebase_uid_001");
  assert.equal(users.createCount, 1);
});

test("AUTH-002 maps the AUTH-001 Firebase principal shape without changing provider subject", () => {
  const trusted = trustedIdentityFromFirebasePrincipal(principal({ emailVerified: true }));

  assert.equal(trusted.provider, "firebase");
  assert.equal(trusted.subject, "firebase_uid_001");
  assert.equal(trusted.emailVerified, true);
});
