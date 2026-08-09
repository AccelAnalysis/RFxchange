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
const inactiveBoundMembership = Object.freeze({
  ...membership,
  status: "inactive",
});
const replacementMembership = Object.freeze({
  id: "membership-route-replacement",
  userId: "user-route-3a",
  organizationId: "org-route-replacement",
  status: "active",
});
const secondReplacementMembership = Object.freeze({
  id: "membership-route-replacement-2",
  userId: "user-route-3a",
  organizationId: "org-route-replacement-2",
  status: "active",
});

function projection(overrides = {}) {
  const projectedMembership = overrides.membership === undefined ? membership : overrides.membership;
  const projectedBoundMembership = overrides.boundMembership === undefined
    ? membership
    : overrides.boundMembership;
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
    activeMemberships: Object.freeze(
      overrides.activeMemberships ?? (projectedMembership ? [projectedMembership] : []),
    ),
    boundMembership: projectedBoundMembership,
    membership: projectedMembership,
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
  assert.equal(result.reason, "activation-context-required");
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
    activeMemberships: [],
  });
  const result = await resolveParticipantRouteWithDependencies(
    { sessionCookie: "session" },
    dependencies({ loadWorkspaceProjection: async () => incomplete }),
  );

  assert.equal(result.kind, "activation-required");
  assert.equal(result.reason, "activation-incomplete");
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

test("controlled workspace with structurally missing organization identity remains a recoverable state failure", async () => {
  await expectDependencyFailure(
    () => resolveParticipantRouteWithDependencies(
      { sessionCookie: "session" },
      dependencies({
        loadWorkspaceProjection: async () => projection({
          state: { organization: null },
          membership: null,
          activeMemberships: [],
        }),
      }),
    ),
    "workspace-state",
  );
});

test("missing persisted activation membership cannot be repaired through another active organization", async () => {
  await expectDependencyFailure(
    () => resolveParticipantRouteWithDependencies(
      { sessionCookie: "session" },
      dependencies({
        loadWorkspaceProjection: async () => projection({
          membership: null,
          boundMembership: null,
          activeMemberships: [replacementMembership],
        }),
      }),
    ),
    "workspace-state",
  );
});

test("cross-owned persisted activation membership cannot enter governed repair", async () => {
  for (const boundMembership of [
    { ...inactiveBoundMembership, userId: "another-user" },
    { ...inactiveBoundMembership, organizationId: "another-org" },
    { ...inactiveBoundMembership, id: "another-membership" },
  ]) {
    await expectDependencyFailure(
      () => resolveParticipantRouteWithDependencies(
        { sessionCookie: "session" },
        dependencies({
          loadWorkspaceProjection: async () => projection({
            membership: null,
            boundMembership,
            activeMemberships: [replacementMembership],
          }),
        }),
      ),
      "workspace-state",
    );
  }
});

test("active persisted binding missing from active projection remains fail-closed", async () => {
  await expectDependencyFailure(
    () => resolveParticipantRouteWithDependencies(
      { sessionCookie: "session" },
      dependencies({
        loadWorkspaceProjection: async () => projection({
          membership: null,
          boundMembership: membership,
          activeMemberships: [replacementMembership],
        }),
      }),
    ),
    "workspace-state",
  );
});

test("deactivated activation membership with no active membership routes to account resolution instead of Retry", async () => {
  const result = await resolveParticipantRouteWithDependencies(
    { sessionCookie: "session" },
    dependencies({
      loadWorkspaceProjection: async () => projection({
        membership: null,
        boundMembership: inactiveBoundMembership,
        activeMemberships: [],
      }),
    }),
  );

  assert.equal(result.kind, "activation-required");
  assert.equal(result.reason, "account-resolution");
  assert.equal(result.state.membershipId, "membership-route-3a");
});

test("deactivated activation membership with one remaining active membership resumes organization access", async () => {
  const result = await resolveParticipantRouteWithDependencies(
    { sessionCookie: "session" },
    dependencies({
      loadWorkspaceProjection: async () => projection({
        membership: null,
        boundMembership: inactiveBoundMembership,
        activeMemberships: [replacementMembership],
      }),
    }),
  );

  assert.equal(result.kind, "authorized");
  assert.equal(result.membership.id, replacementMembership.id);
  assert.equal(result.state.organization.id, replacementMembership.organizationId);
  assert.equal(result.state.membershipId, replacementMembership.id);
});

test("multiple remaining active memberships require organization resolution until one is requested", async () => {
  const staleProjection = projection({
    membership: null,
    boundMembership: inactiveBoundMembership,
    activeMemberships: [replacementMembership, secondReplacementMembership],
  });
  const unresolved = await resolveParticipantRouteWithDependencies(
    { sessionCookie: "session" },
    dependencies({ loadWorkspaceProjection: async () => staleProjection }),
  );
  assert.equal(unresolved.kind, "activation-required");
  assert.equal(unresolved.reason, "organization-resolution");

  const selected = await resolveParticipantRouteWithDependencies(
    {
      sessionCookie: "session",
      requestedOrganizationId: replacementMembership.organizationId,
    },
    dependencies({ loadWorkspaceProjection: async () => staleProjection }),
  );
  assert.equal(selected.kind, "authorized");
  assert.equal(selected.membership.id, replacementMembership.id);
  assert.equal(selected.state.organization.id, replacementMembership.organizationId);
});

test("controlled workspace rejects contradictory active membership drift as state failure", async () => {
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
          loadWorkspaceProjection: async () => projection({
            membership: changedMembership,
            boundMembership: membership,
            activeMemberships: [changedMembership],
          }),
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
