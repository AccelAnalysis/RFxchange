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
const inactiveBoundMembership = Object.freeze({ ...membership, status: "inactive" });
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

test("known credential rejection is unauthenticated rather than dependency recovery", async () => {
  for (const code of ["credential-invalid", "credential-revoked", "account-disabled"]) {
    const result = await resolveParticipantRouteWithDependencies(
      { sessionCookie: "session" },
      dependencies({
        authenticateSessionCookie: async () => {
          throw new ServerSessionError(code, "known rejection");
        },
      }),
    );
    assert.equal(result.kind, "unauthenticated", code);
  }
});

test("authentication backend and unexpected authentication failures are retryable", async () => {
  for (const error of [
    new ServerSessionError(
      "authentication-backend-unavailable",
      "Firebase Admin temporarily unavailable",
    ),
    new Error("identity repository unavailable"),
  ]) {
    await expectDependencyFailure(
      () => resolveParticipantRouteWithDependencies(
        { sessionCookie: "session" },
        dependencies({ authenticateSessionCookie: async () => { throw error; } }),
      ),
      "authentication",
    );
  }
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

test("incomplete pre-workspace lifecycle continues activation", async () => {
  const result = await resolveParticipantRouteWithDependencies(
    { sessionCookie: "session" },
    dependencies({
      loadWorkspaceProjection: async () => projection({
        state: {
          lifecycleState: "organization-identified",
          organization: null,
          membershipId: null,
          controlledPlatformUrl: null,
        },
        membership: null,
        activeMemberships: [],
      }),
    }),
  );
  assert.equal(result.kind, "activation-required");
  assert.equal(result.reason, "activation-incomplete");
});

test("workspace dependency failure never becomes activation", async () => {
  await expectDependencyFailure(
    () => resolveParticipantRouteWithDependencies(
      { sessionCookie: "session" },
      dependencies({
        loadWorkspaceProjection: async () => { throw new Error("Firestore unavailable"); },
      }),
    ),
    "workspace-state",
  );
});

test("controlled/open workspace requires complete persisted organization identity", async () => {
  await expectDependencyFailure(
    () => resolveParticipantRouteWithDependencies(
      { sessionCookie: "session" },
      dependencies({
        loadWorkspaceProjection: async () => projection({
          state: { organization: null },
          membership: null,
          boundMembership: null,
          activeMemberships: [],
        }),
      }),
    ),
    "workspace-state",
  );
});

test("missing or cross-owned persisted binding cannot enter access resolution", async () => {
  for (const boundMembership of [
    null,
    { ...inactiveBoundMembership, id: "another-membership" },
    { ...inactiveBoundMembership, userId: "another-user" },
    { ...inactiveBoundMembership, organizationId: "another-org" },
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

test("active persisted binding must agree with active projection", async () => {
  for (const changedMembership of [
    null,
    { ...membership, status: "inactive" },
    { ...membership, id: "another-membership" },
    { ...membership, userId: "another-user" },
    { ...membership, organizationId: "another-org" },
  ]) {
    await expectDependencyFailure(
      () => resolveParticipantRouteWithDependencies(
        { sessionCookie: "session" },
        dependencies({
          loadWorkspaceProjection: async () => projection({
            membership: changedMembership,
            boundMembership: membership,
            activeMemberships: changedMembership ? [changedMembership] : [replacementMembership],
          }),
        }),
      ),
      "workspace-state",
    );
  }
});

test("deactivated binding with no active membership enters account resolution, not Retry or activation", async () => {
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
  assert.equal(result.kind, "access-resolution-required");
  assert.equal(result.reason, "account-resolution");
  assert.deepEqual(result.options, []);
  assert.equal(result.state.organization.id, "org-route-3a");
  assert.equal(result.state.membershipId, "membership-route-3a");
});

test("another active organization never inherits the stale controlled lifecycle", async () => {
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
  assert.equal(result.kind, "access-resolution-required");
  assert.equal(result.reason, "organization-resolution");
  assert.deepEqual(result.options, [{
    organizationId: replacementMembership.organizationId,
    membershipId: replacementMembership.id,
  }]);
  assert.equal(result.selectedOrganizationId, null);
  assert.equal(result.state.organization.id, "org-route-3a");
  assert.equal(result.state.accessJourneyId, "journey-route-3a");
});

test("another active organization never inherits the stale OPEN lifecycle even when explicitly selected", async () => {
  const staleOpenProjection = projection({
    state: {
      lifecycleState: "open-platform",
      controlledPlatformUrl: "/exchange",
    },
    membership: null,
    boundMembership: inactiveBoundMembership,
    activeMemberships: [replacementMembership, secondReplacementMembership],
  });
  const result = await resolveParticipantRouteWithDependencies(
    {
      sessionCookie: "session",
      requestedOrganizationId: replacementMembership.organizationId,
    },
    dependencies({ loadWorkspaceProjection: async () => staleOpenProjection }),
  );
  assert.equal(result.kind, "access-resolution-required");
  assert.equal(result.reason, "organization-resolution");
  assert.equal(result.selectedOrganizationId, replacementMembership.organizationId);
  assert.equal(result.state.organization.id, "org-route-3a");
  assert.equal(result.state.membershipId, "membership-route-3a");
  assert.equal(result.state.lifecycleState, "open-platform");
  assert.equal("membership" in result, false);
});

test("invalid requested alternative is not silently selected during access resolution", async () => {
  const result = await resolveParticipantRouteWithDependencies(
    { sessionCookie: "session", requestedOrganizationId: "org-not-owned" },
    dependencies({
      loadWorkspaceProjection: async () => projection({
        membership: null,
        boundMembership: inactiveBoundMembership,
        activeMemberships: [replacementMembership],
      }),
    }),
  );
  assert.equal(result.kind, "access-resolution-required");
  assert.equal(result.selectedOrganizationId, null);
});

test("wrong requested organization remains governed for a healthy active binding", async () => {
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
        loadRestrictions: async () => { throw new Error("restriction repository unavailable"); },
      }),
    ),
    "restriction-state",
  );
});

test("active restriction remains a governed restriction result", async () => {
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

test("healthy protected route resolves only the original authorized binding", async () => {
  const result = await resolveParticipantRouteWithDependencies(
    { sessionCookie: "session" },
    dependencies(),
  );
  assert.equal(result.kind, "authorized");
  assert.equal(result.state.organization.id, "org-route-3a");
  assert.equal(result.membership.id, "membership-route-3a");
});
