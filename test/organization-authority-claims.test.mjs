import assert from "node:assert/strict";
import test from "node:test";

import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import {
  OrganizationAuthorityError,
  OrganizationAuthorityService,
  OrganizationClaimsAdministrationService,
} from "../src/application/organization-claims/organization-authority.ts";
import {
  createAdminPermissionGrant,
} from "../src/domain/admin-authorization/grants.ts";
import { createPlatformAdministratorAuthorityContext } from "../src/domain/admin-authorization/model.ts";
import { geographyId } from "../src/domain/geography/model.ts";
import {
  advanceAccessLifecycle,
  associateAccessJourneyWithUser,
  createAccessLifecycle,
} from "../src/domain/lifecycle/model.ts";
import {
  createOrganizationAccount,
  createOrganizationProfile,
} from "../src/domain/organizations/model.ts";
import {
  createOrganizationResolutionRecord,
} from "../src/domain/organization-resolution/model.ts";
import {
  createOrganizationAuthorityClaim,
  createOrganizationAuthorityEvidence,
  ORGANIZATION_CLAIMS_CONSOLE_CATEGORIES,
} from "../src/domain/organization-claims/model.ts";
import { createUserIdentity } from "../src/domain/users/model.ts";

const NOW = "2026-07-30T18:00:00.000Z";
const GEO = geographyId("us-va-portsmouth");

function fixture(suffix = "one") {
  const user = createUserIdentity({
    id: `user-${suffix}`,
    name: `Authority ${suffix}`,
    primaryEmail: `${suffix}@harborlight.example`,
    loginProvider: "firebase",
    loginSubject: `subject-${suffix}`,
    now: NOW,
  });
  const context = authenticatedServerContext({
    user,
    claims: {
      provider: "firebase",
      subject: user.login.subject,
      email: user.primaryEmail,
      displayName: user.name,
      emailVerified: true,
      isAnonymous: false,
      authenticatedAt: NOW,
      issuedAt: NOW,
      expiresAt: "2026-07-30T19:00:00.000Z",
    },
    source: "session-cookie",
  });
  const organization = createOrganizationAccount({ id: "org-harborlight", now: NOW });
  const profile = createOrganizationProfile(organization, {
    id: "profile-harborlight",
    displayName: "Harborlight Fabrication",
    now: NOW,
  });
  let lifecycle = createAccessLifecycle({ id: `journey-${suffix}`, now: NOW });
  for (const state of [
    "account-started",
    "account-activated",
    "geography-selected",
    "organization-resolved",
  ]) {
    lifecycle = advanceAccessLifecycle(lifecycle, state, NOW);
    if (state === "account-activated") {
      lifecycle = associateAccessJourneyWithUser(lifecycle, user.id, NOW);
    }
  }
  const resolution = createOrganizationResolutionRecord({
    id: `resolution-${suffix}`,
    userId: user.id,
    accessJourneyId: lifecycle.id,
    organizationId: organization.id,
    profileId: profile.id,
    disposition: "existing-organization-selected",
    provisionalIdentity: {
      displayName: profile.displayName,
      geographyId: GEO,
      domain: "harborlight.example",
    },
    decisionReason: "Participant selected the organization.",
    now: NOW,
  });
  return { user, context, organization, profile, lifecycle, resolution };
}

function verifiedEvidence(kind = "domain-email", suffix = "one") {
  return createOrganizationAuthorityEvidence({
    id: `evidence-${suffix}`,
    kind,
    reference: `${kind}:${suffix}`,
    ...(kind === "organization-document" ? { storedAssetId: `asset-${suffix}` } : {}),
    status: "verified",
    verifiedBy: kind === "existing-administrator-invitation"
      ? "existing-administrator"
      : kind === "administrative-review" || kind === "organization-document"
        ? "platform-administrator"
        : "system",
    submittedAt: NOW,
    verifiedAt: NOW,
  });
}

function memoryDependencies(fixtures, existingClaims = []) {
  const claims = [...existingClaims];
  const events = [];
  const decisions = [];
  const approvals = [];
  const communications = [];
  let counter = 0;
  return {
    claims,
    events,
    decisions,
    approvals,
    communications,
    dependencies: {
      claims: {
        async getById(id) { return claims.find((claim) => claim.id === id) ?? null; },
        async listByOrganizationId(id) { return claims.filter((claim) => claim.organizationId === id); },
        async listByUserId(id) { return claims.filter((claim) => claim.userId === id); },
        async listByStatus(status) { return claims.filter((claim) => claim.status === status); },
        async listByGeographyId(id) { return claims.filter((claim) => claim.geographyId === id); },
        async create(claim, event) { claims.push(claim); events.push(event); },
      },
      unitOfWork: {
        async update(input) {
          claims.splice(claims.findIndex((claim) => claim.id === input.claim.id), 1, input.claim);
          events.push(input.event);
          if (input.decision) decisions.push(input.decision);
        },
        async approve(input) {
          claims.splice(claims.findIndex((claim) => claim.id === input.claim.id), 1, input.claim);
          events.push(input.event);
          decisions.push(input.decision);
          approvals.push(input);
        },
      },
      resolutions: {
        async getByAccessJourneyId(id) {
          return fixtures.find((entry) => entry.resolution.accessJourneyId === id)?.resolution ?? null;
        },
        async listByUserId() { return []; },
      },
      lifecycle: {
        async getById(id) {
          return fixtures.find((entry) => entry.lifecycle.id === id)?.lifecycle ?? null;
        },
        async save() {},
      },
      ids: {
        claim: () => `claim-${++counter}`,
        event: () => `event-${++counter}`,
        decision: () => `decision-${++counter}`,
        membership: () => `membership-${++counter}`,
        audit: () => `audit-${++counter}`,
      },
      now: () => NOW,
      communications: {
        async schedule(input) { communications.push(input); },
      },
    },
  };
}

test("ORG-004 establishes authority through every approved evidence pathway without Verification", async () => {
  for (const [index, kind] of [
    "domain-email",
    "existing-administrator-invitation",
    "administrative-review",
    "organization-document",
    "authoritative-record",
  ].entries()) {
    const current = fixture(`path-${index}`);
    const memory = memoryDependencies([current]);
    const service = new OrganizationAuthorityService(memory.dependencies);
    const evidence = verifiedEvidence(kind, `path-${index}`);
    const claim = await service.submit({
      context: current.context,
      accessJourneyId: current.lifecycle.id,
      geographyId: GEO,
      evidence: [evidence],
      ...(kind === "organization-document"
        ? {
            storedAssets: [{
              id: evidence.storedAssetId,
              organizationId: current.organization.id,
              category: "authority-evidence",
              sensitivity: "sensitive-evidence",
              visibility: "private",
              status: "active",
            }],
          }
        : {}),
      reason: `Authority submitted through ${kind}.`,
    });
    const result = await service.establishFromVerifiedEvidence({
      context: current.context,
      claim,
      organization: current.organization,
      user: current.user,
      lifecycle: current.lifecycle,
      decisionMaker: kind === "existing-administrator-invitation"
        ? "existing-administrator"
        : "system",
      decisionMakerId: kind === "existing-administrator-invitation"
        ? current.user.id
        : "authority-evidence-verifier",
      reason: `Verified ${kind}.`,
    });
    assert.equal(result.claim.authorityEstablished, true);
    assert.equal(result.claim.verificationState, "not-evaluated");
    assert.equal(memory.approvals[0].lifecycle.state, "organization-registered");
    assert.equal(memory.approvals[0].authorization.roleKey, "primary-administrator");
    assert.equal(memory.approvals[0].membership.organizationId, current.organization.id);
    assert.equal(memory.communications[0].event, "authority-approved");
  }
});

test("ORG-004 keeps private document evidence controlled and blocks conflicts from automatic authority", async () => {
  const first = fixture("first");
  const second = fixture("second");
  const existing = createOrganizationAuthorityClaim({
    id: "claim-existing",
    resolution: first.resolution,
    geographyId: GEO,
    evidence: [verifiedEvidence("domain-email", "first")],
    now: NOW,
  });
  const memory = memoryDependencies([first, second], [existing]);
  const service = new OrganizationAuthorityService(memory.dependencies);

  await assert.rejects(
    () => service.submit({
      context: second.context,
      accessJourneyId: second.lifecycle.id,
      geographyId: GEO,
      evidence: [verifiedEvidence("organization-document", "bad")],
      storedAssets: [],
      reason: "Document claim.",
    }),
    (error) => error instanceof OrganizationAuthorityError && error.code === "document-evidence-invalid",
  );

  const conflict = await service.submit({
    context: second.context,
    accessJourneyId: second.lifecycle.id,
    geographyId: GEO,
    evidence: [verifiedEvidence("authoritative-record", "second")],
    reason: "Competing authoritative record.",
  });
  assert.equal(conflict.status, "conflict");
  assert.deepEqual(conflict.conflictingClaimIds, [existing.id]);
  await assert.rejects(
    () => service.establishFromVerifiedEvidence({
      context: second.context,
      claim: conflict,
      organization: second.organization,
      user: second.user,
      lifecycle: second.lifecycle,
      decisionMaker: "system",
      decisionMakerId: "system",
      reason: "Should not bypass conflict.",
    }),
    (error) => error.code === "claim-conflict",
  );
  assert.equal(memory.approvals.length, 0);
});

function adminContext(scope, permissions = ["organization.claim.read", "organization.claim.adjudicate"]) {
  const authority = createPlatformAdministratorAuthorityContext({
    administratorId: "admin-claims",
    rolePresetKeys: ["platform-administrator"],
    effectivePermissions: permissions,
  });
  return {
    authority,
    grants: permissions.map((permission, index) =>
      createAdminPermissionGrant({
        id: `grant-${index}-${scope}`,
        administratorId: authority.administratorId,
        permission,
        scope,
        createdAt: NOW,
      }),
    ),
    now: NOW,
  };
}

function consoleRecord(overrides = {}) {
  return {
    organizationId: "org-harborlight",
    displayName: "Harborlight Fabrication",
    geographyId: GEO,
    origin: "seeded",
    claimState: "unclaimed",
    activationState: "incomplete",
    verificationState: "not-evaluated",
    roles: [],
    integrityState: "normal",
    restrictionState: "none",
    claimId: null,
    ...overrides,
  };
}

test("ADM-065 finds every required claim/status category while enforcing organization scope", () => {
  const records = [
    consoleRecord(),
    consoleRecord({ claimState: "claimed", activationState: "active" }),
    consoleRecord({ verificationState: "pending" }),
    consoleRecord({ verificationState: "verified" }),
    consoleRecord({ roles: ["provider", "issuer"] }),
    consoleRecord({ integrityState: "duplicate" }),
    consoleRecord({ restrictionState: "restricted" }),
    consoleRecord({ restrictionState: "suspended" }),
    consoleRecord({ restrictionState: "terminated" }),
  ];
  const service = new OrganizationClaimsAdministrationService(memoryDependencies([]).dependencies);
  const context = adminContext("ORGANIZATION:org-harborlight");
  for (const category of ORGANIZATION_CLAIMS_CONSOLE_CATEGORIES) {
    const result = service.filterConsole({
      context,
      records,
      category,
      ...(category === "geography" ? { geographyId: GEO } : {}),
    });
    assert.ok(result.length > 0, `Expected a result for ${category}.`);
  }
  const denied = service.filterConsole({
    context: adminContext("ORGANIZATION:other-org"),
    records,
    category: "seeded",
  });
  assert.deepEqual(denied, []);
  const geographyScoped = service.filterConsole({
    context: adminContext(`GEOGRAPHY:${GEO}`),
    records: [
      ...records,
      consoleRecord({
        organizationId: "org-outside-geography",
        geographyId: geographyId("us-md-baltimore"),
      }),
    ],
    category: "seeded",
    geographyId: GEO,
  });
  assert.equal(geographyScoped.length, records.length);
});

test("ADM-066 follows the evidence workflow, approves atomically, audits, and preserves conflicts", async () => {
  const claimant = fixture("conflict");
  let claim = createOrganizationAuthorityClaim({
    id: "claim-conflict",
    resolution: claimant.resolution,
    geographyId: GEO,
    evidence: [verifiedEvidence("administrative-review", "conflict")],
    conflictingClaimIds: ["claim-original"],
    now: NOW,
  });
  const memory = memoryDependencies([claimant], [claim]);
  const service = new OrganizationClaimsAdministrationService(memory.dependencies);
  const context = adminContext("ORGANIZATION:org-harborlight");
  claim = await service.recordReviewStep({
    context,
    claim,
    step: "existing-administrator-notified",
    reason: "Notified the existing administrator.",
  });
  claim = await service.recordReviewStep({
    context,
    claim,
    step: "evidence-compared",
    reason: "Compared both claim evidence sets.",
  });
  claim = await service.adjudicate({
    context,
    claim,
    organization: claimant.organization,
    user: claimant.user,
    lifecycle: claimant.lifecycle,
    outcome: "approved",
    reason: "Reviewed evidence establishes claimant authority.",
    relatedCaseId: "case-claim-001",
    security: {
      reauthenticatedAt: NOW,
      mfaVerifiedAt: NOW,
    },
  });
  assert.equal(claim.status, "approved");
  assert.deepEqual(claim.conflictingClaimIds, ["claim-original"]);
  assert.equal(memory.decisions[0].verificationState, "not-evaluated");
  assert.equal(memory.approvals[0].auditEvent.relatedCaseId, "case-claim-001");
  assert.deepEqual(memory.approvals[0].auditEvent.priorState, {
    status: "evidence-compared",
    authorityEstablished: false,
  });
  assert.equal(memory.events.length, 3);
  assert.equal(memory.communications[0].event, "existing-administrator-notified");
  assert.equal(memory.communications.at(-1).event, "authority-approved");
});

test("ADM-066 permits case-scoped adjudication without widening organization access", async () => {
  const claimant = fixture("case-scope");
  let claim = createOrganizationAuthorityClaim({
    id: "claim-case-scope",
    resolution: claimant.resolution,
    geographyId: GEO,
    evidence: [verifiedEvidence("administrative-review", "case-scope")],
    now: NOW,
  });
  const memory = memoryDependencies([claimant], [claim]);
  const organizationContext = adminContext("ORGANIZATION:org-harborlight");
  const service = new OrganizationClaimsAdministrationService(memory.dependencies);
  claim = await service.recordReviewStep({
    context: organizationContext,
    claim,
    step: "evidence-compared",
    reason: "Compared submitted evidence.",
  });

  const deniedContext = adminContext("CASE:case-other");
  await assert.rejects(
    () => service.adjudicate({
      context: deniedContext,
      claim,
      organization: claimant.organization,
      user: claimant.user,
      lifecycle: claimant.lifecycle,
      outcome: "denied",
      reason: "Out-of-scope denial.",
      relatedCaseId: "case-claim-scope",
      security: { reauthenticatedAt: NOW, mfaVerifiedAt: NOW },
    }),
    (error) => error instanceof OrganizationAuthorityError && error.code === "organization-scope-denied",
  );

  const caseContext = adminContext("CASE:case-claim-scope");
  const decided = await service.adjudicate({
    context: caseContext,
    claim,
    organization: claimant.organization,
    user: claimant.user,
    lifecycle: claimant.lifecycle,
    outcome: "denied",
    reason: "Evidence did not establish authority.",
    relatedCaseId: "case-claim-scope",
    security: { reauthenticatedAt: NOW, mfaVerifiedAt: NOW },
  });
  assert.equal(decided.status, "denied");
  assert.equal(memory.approvals.length, 0);
  assert.equal(memory.decisions.length, 1);
});
