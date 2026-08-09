import assert from "node:assert/strict";
import test from "node:test";

import { ServerSessionError } from "../src/application/auth/server-session.ts";
import {
  ParticipantRouteDependencyUnavailableError,
  resolveParticipantRouteWithDependencies,
} from "../src/infrastructure/auth/participant-route-classification.ts";

const context = Object.freeze({
  user: Object.freeze({ id: "user-route-3a" }),
  authentication: Object.freeze({
    provider: "firebase",
    subject: "subject-route-3a",
    authenticatedAt: "2026-08-09T12:00:00.000Z",
    issuedAt: "2026-08-09T12:00:00.000Z",
    expiresAt: "2026-08-10T12:00:00.000Z",
    source: "session-cookie",
  }),
});

const membership = Object.freeze({
  id: "membership-route-3a",
  userId: "user-route-3a",
  organizationId: "org-route-3a",
  status: "active",
});

function projection(overrides = {}) {
  return Object.freeze({
    state: Object.freeze({
      accessJourneyId: "journey-route-3a",
      lifecycleState: "controlled-platform",
      organization: Object.freeze({ id: "org-route-3a" }),
      membershipId: "membership-route-3a",
      controlledPlatformUrl: "/orientation",
      acquisitionContext: null,
      ...(overrides.state ?? {}),
    }),
    membership: overrides.membership === undefined ? membership : overrides.membership,
  });
}

function dependencies(overrides = {}) {
  return Object.freeze({
    authenticateSessionCookie: async () => context,
    loadWorkspaceProjection: async () => projection(),
    loadRestrictions: async () => Object.freeze({
      organizationState: null,
      membershipState: null,
    }),
    ...overrides,
  });
}

async function expectDependencyFailure(operation, stage) {
  await assert.rejects(
    operation,
    (error) =>
      error instanceof ParticipantRouteDependencyUnavailableError &&
      error.code === "participant-dependency-unavailable" &&
      error.stage === stage &&
      error.cause instanceof Error,
  );
}

test("missing session is unauthenticated without touching dependencies", async () => {
  let authenticationCalls = 0;
  const result = await resolveParticipantRouteWithDependencies({}, dependencies({
    authenticateSessionCookie: async () => {
      authenticationCalls += 1;
      return context;
    },
  }));

  assert.equal(result.kind, "unauthenticated");
  assert.equal(authenticationCalls, 0);
});

test("invalid or revoked session is unauthenticated rather than a service failure", async () => {
  for (const code of ["credential-invalid", "credential-revoked", "account-disabled"]) {
    const result = await resolveParticipantRouteWithDependencies(
      { sessionCookie: "session" },
      dependencies({
        authenticateSessionCookie: async () => {
          throw new ServerSessionError(code, "expected credential rejection");
        },
      }),
    );
    assert.equal(result.kind, "unauthenticated", code);
  }
});

test("authentication backend failure reaches the retryable dependency boundary", async () => {
  await expectDependencyFailure(
    () => resolveParticipantRouteWithDependencies(
      { sessionCookie: "session" },
      dependencies({
        authenticateSessionCookie: async () => {
          throw new ServerSessionError(
            "authentication-backend-unavailable",
            "Firebase Admin temporarily unavailable",
          );
        },
      }),
    ),
    "authentication",
  );
});

test("unexpected authentication failure is not misclassified as signed out", async () => {
  await expectDependencyFailure(
    () => resolveParticipantRouteWithDependencies(
      { sessionCookie: "session" },
      dependencies({
        authenticateSessionCookie: async () => {
          throw new Error("identity repository unavailable");
        },
      }),
    ),
    "authentication",
  );
});

test("only an absent activation context resolves to fresh activation", async () => {
  const result = await resolveParticipantRouteWithDependencies(
    { sessionCookie: "session" },
    dependencies({ loadWorkspaceProjection: async () => null }),
  );

  assert.equal(result.kind, "activation-required");
  assert.equal(result.state, null);
});

test("an incomplete pre-workspace lifecycle can continue activation", async () => {
  const incomplete = projection({
    state: {
      lifecycleState: "organization-identified",
      organization: null,
      membershipId: null,
      controlledPlatformUrl: null,
    },
    membership: null,
  });
  const result = await resolveParticipantRouteWithDependencies(
    { sessionCookie: "session" },
    dependencies({ loadWorkspaceProjection: async () => incomplete }),
  );

  assert.equal(result.kind, "activation-required");
  assert.equal(result.state.lifecycleState, "organization-identified");
});

test("workspace projection failure never becomes a new activation journey", async () => {
  await expectDependencyFailure(
    () => resolveParticipantRouteWithDependencies(
      { sessionCookie: "session" },
      dependencies({
        loadWorkspaceProjection: async () => {
          throw new Error("Firestore unavailable");
        },
      }),
    ),
    "workspace-state",
  );
});

test("controlled workspace with missing durable identity is a recoverable state failure", async () => {
  await expectDependencyFailure(
    () => resolveParticipantRouteWithDependencies(
      { sessionCookie: "session" },
      dependencies({
        loadWorkspaceProjection: async () => projection({ membership: null }),
      }),
    ),
    "workspace-state",
  );
});

test("controlled workspace rejects cross-user or cross-tenant membership drift as state failure", async () => {
  for (const changedMembership of [
    { ...membership, userId: "another-user" },
    { ...membership, organizationId: "another-org" },
    { ...membership, id: "another-membership" },
    { ...membership, status: "inactive" },
  ]) {
    await expectDependencyFailure(
      () => resolveParticipantRouteWithDependencies(
        { sessionCookie: "session" },
        dependencies({
          loadWorkspaceProjection: async () => projection({ membership: changedMembership }),
        }),
      ),
      "workspace-state",
    );
  }
});

test("wrong requested organization remains a governed routing result", async () => {
  const result = await resolveParticipantRouteWithDependencies(
    { sessionCookie: "session", requestedOrganizationId: "org-other" },
    dependencies(),
  );

  assert.equal(result.kind, "wrong-organization");
  assert.equal(result.state.organization.id, "org-route-3a");
});

test("restriction dependency failure reaches retryable recovery", async () => {
  await expectDependencyFailure(
    () => resolveParticipantRouteWithDependencies(
      { sessionCookie: "session" },
      dependencies({
        loadRestrictions: async () => {
          throw new Error("restriction repository unavailable");
        },
      }),
    ),
    "restriction-state",
  );
});

test("active restrictions remain governed restriction results", async () => {
  const result = await resolveParticipantRouteWithDependencies(
    { sessionCookie: "session" },
    dependencies({
      loadRestrictions: async () => Object.freeze({
        organizationState: null,
        membershipState: "suspended",
      }),
    }),
  );

  assert.equal(result.kind, "restricted");
  assert.equal(result.restrictionState, "suspended");
});

test("healthy protected route resolves authorized state", async () => {
  const result = await resolveParticipantRouteWithDependencies(
    { sessionCookie: "session" },
    dependencies(),
  );

  assert.equal(result.kind, "authorized");
  assert.equal(result.state.organization.id, "org-route-3a");
  assert.equal(result.membership.id, "membership-route-3a");
});
