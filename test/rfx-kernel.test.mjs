import assert from "node:assert/strict";
import test from "node:test";

import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import {
  RfxDraftError,
  RfxDraftService,
} from "../src/application/rfx/rfx-draft-service.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import { standardOrganizationRolePreset } from "../src/domain/authorization/organization-role-presets.ts";
import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import { RfxPersistenceConflictError } from "../src/domain/rfx/repository.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
} from "../src/domain/users/model.ts";

const NOW = "2026-08-12T12:00:00.000Z";
const RELEASE = Object.freeze({
  version: "0.5.0",
  sourceCommit: "da7879f2609271b067ae6d02875e9388a02c4fe5",
  releasedAt: "2026-08-01T00:00:00.000Z",
  projectionVersion: "1",
});
const family = (id, label = "Request for Information") =>
  Object.freeze({
    request_family_id: id,
    code: "RFI",
    preferred_label: label,
    purpose:
      "Gather market information without necessarily seeking an immediate award.",
    default_endpoint: "information_reviewed",
    supports_award: false,
    default_response_template_id: "AMACS-RSPT-000001",
    default_decision_template_id: "AMACS-DECT-000001",
    lifecycle: ["draft", "published", "responses_received", "closed"],
    status: "active",
    default_governance_profile_id: "AMACS-GOV-000002",
    allowed_governance_profile_ids: ["AMACS-GOV-000001", "AMACS-GOV-000002"],
    recommended_requirement_bundle_ids: ["AMACS-RBND-000001"],
  });

function fixture() {
  let sequence = 0;
  let currentFamily = family("AMACS-REQ-000001");
  const secondFamily = family("AMACS-REQ-000002", "Request for Quotation");
  const organizations = [
    createOrganizationAccount({ id: "org-issuer", now: NOW }),
    createOrganizationAccount({ id: "org-other", now: NOW }),
  ];
  const users = [
    createUserIdentity({
      id: "user-issuer",
      name: "Issuer",
      primaryEmail: "issuer@example.test",
      loginProvider: "firebase",
      loginSubject: "subject-issuer",
      now: NOW,
    }),
    createUserIdentity({
      id: "user-other",
      name: "Other",
      primaryEmail: "other@example.test",
      loginProvider: "firebase",
      loginSubject: "subject-other",
      now: NOW,
    }),
  ];
  const memberships = users.map((user, index) =>
    createOrganizationMembership(user, organizations[index], {
      id: `membership-${index}`,
      now: NOW,
    }),
  );
  const authorizations = memberships.map((membership, index) => {
    const preset = standardOrganizationRolePreset(
      index === 0 ? "primary-administrator" : "viewer",
    );
    return createOrganizationUserAuthorization(
      membership,
      organizations[index],
      { roleKey: preset.key, permissions: preset.permissions, now: NOW },
    );
  });
  const contexts = users.map((user) =>
    authenticatedServerContext({
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
        expiresAt: "2026-08-13T12:00:00.000Z",
      },
      source: "session-cookie",
    }),
  );
  const controls = {
    account: { emailVerified: true, disabled: false, tokensValidAfter: null },
    inactiveMembershipId: null,
    restriction: null,
    otherCanCreate: false,
    raceReplayOnNextSave: false,
  };
  const state = {
    aggregates: new Map(),
    commands: new Map(),
    events: [],
    audits: [],
    interpretations: new Map(),
  };
  const repository = {
    async getById(id) {
      return state.aggregates.get(id) ?? null;
    },
    async listByIssuerOrganizationId(id) {
      return [...state.aggregates.values()].filter(
        (item) => item.issuerOrganizationId === id,
      );
    },
    async getCommand(id) {
      return state.commands.get(id) ?? null;
    },
    async save(bundle) {
      if (controls.raceReplayOnNextSave) {
        controls.raceReplayOnNextSave = false;
        const committedAggregate = Object.freeze({
          ...bundle.aggregate,
          updatedAt: "2026-08-12T12:00:01.000Z",
        });
        const committedCommand = Object.freeze({
          ...bundle.command,
          recordedAt: "2026-08-12T12:00:01.000Z",
        });
        state.aggregates.set(bundle.aggregate.id, committedAggregate);
        state.commands.set(bundle.command.id, committedCommand);
        state.events.push(bundle.event);
        state.audits.push(bundle.audit);
        return "replayed";
      }
      const prior = state.commands.get(bundle.command.id);
      if (prior) {
        if (
          prior.requestFingerprint === bundle.command.requestFingerprint &&
          prior.action === bundle.command.action &&
          prior.issuerOrganizationId === bundle.command.issuerOrganizationId
        )
          return "replayed";
        throw new RfxPersistenceConflictError(
          "RFx command identity collision.",
        );
      }
      const current = state.aggregates.get(bundle.aggregate.id);
      if (
        bundle.expectedVersion === null
          ? Boolean(current)
          : !current || current.version !== bundle.expectedVersion
      ) {
        throw new RfxPersistenceConflictError(
          `RFx changed; current version is ${current?.version ?? 0}.`,
        );
      }
      state.aggregates.set(bundle.aggregate.id, bundle.aggregate);
      state.commands.set(bundle.command.id, bundle.command);
      state.events.push(bundle.event);
      state.audits.push(bundle.audit);
      return "created";
    },
  };
  const catalog = {
    async getRelease() {
      return RELEASE;
    },
    async listRequestFamilies() {
      return [currentFamily, secondFamily];
    },
    async getRequestFamily(id) {
      return (
        [currentFamily, secondFamily].find(
          (item) => item.request_family_id === id,
        ) ?? null
      );
    },
  };
  const geography = Object.freeze({
    id: "county-51013",
    name: "Arlington County",
    releaseState: "released",
    bounds: Object.freeze({
      west: -77.18,
      south: 38.82,
      east: -77.03,
      north: 38.93,
    }),
  });
  const location = Object.freeze({
    id: organizations[0].id,
    organizationId: organizations[0].id,
    geographyId: geography.id,
    coordinate: Object.freeze([-77.09, 38.88]),
    physicalAddress: Object.freeze({
      addressLine1: "1101 Wilson Blvd",
      addressLine2: null,
      locality: "Arlington",
      regionCode: "VA",
      postalCode: "22209",
      countryCode: "US",
    }),
    geocodeProvenance: Object.freeze({
      provider: "census",
      providerReference: "fixture-1",
      benchmark: "Public_AR_Current",
      retrievedAt: NOW,
    }),
  });
  const service = new RfxDraftService({
    authorization: {
      accountSecurity: {
        async inspect(subject) {
          return {
            provider: "firebase",
            subject,
            email: `${subject}@example.test`,
            ...controls.account,
            mfaEnrolled: false,
            lastSignInAt: NOW,
          };
        },
      },
      organizations: {
        async getById(id) {
          return organizations.find((item) => item.id === id) ?? null;
        },
        async create() {},
      },
      memberships: {
        async getById(id) {
          const membership = memberships.find((item) => item.id === id) ?? null;
          return membership && controls.inactiveMembershipId === id
            ? { ...membership, status: "inactive" }
            : membership;
        },
        async listByUserId() {
          return [];
        },
        async listActiveByUserId() {
          return [];
        },
        async listByOrganizationId() {
          return [];
        },
        async create() {},
      },
      authorizations: {
        async getByMembershipId(id) {
          const authorization =
            authorizations.find((item) => item.membershipId === id) ?? null;
          return authorization &&
            controls.otherCanCreate &&
            id === memberships[1].id
            ? {
                ...authorization,
                permissions: [...authorization.permissions, "rfx.create"],
              }
            : authorization;
        },
        async listByUserId() {
          return [];
        },
        async listByOrganizationId() {
          return [];
        },
        async save() {},
      },
      restrictions: {
        async getById() {
          return null;
        },
        async getForOrganization() {
          return controls.restriction;
        },
        async getForMembership() {
          return null;
        },
        async save() {},
      },
    },
    catalog,
    repository,
    locations: {
      async getByOrganizationId(id) {
        return id === organizations[0].id ? location : null;
      },
    },
    geographies: {
      async getById(id) {
        return id === geography.id ? geography : null;
      },
      async save() {},
    },
    interpretations: {
      async getRecord(id) {
        return state.interpretations.get(id) ?? null;
      },
    },
    now: () => NOW,
    id: () => `generated-${++sequence}`,
  });
  const scope = (index, commandId) => ({
    context: contexts[index],
    organizationId: organizations[index].id,
    membershipId: memberships[index].id,
    commandId,
  });
  return {
    service,
    state,
    scope,
    organizations,
    users,
    memberships,
    contexts,
    controls,
    secondFamily,
    setFamily(value) {
      currentFamily = value;
    },
  };
}

function packageInput(
  performanceLocation = {
    mode: "issuer-primary-location",
    organizationLocationId: "org-issuer",
  },
) {
  return {
    title: "Regional facilities resilience",
    marketNeed: {
      sourceStatement: "Improve continuity across critical facilities.",
      observedCondition: "Recovery is inconsistent.",
      desiredOutcome: "Restore priority services within four hours.",
      affectedContext: "Three public facilities.",
      successMeasures: ["Four-hour recovery"],
      knownFacts: ["Three sites"],
      assumptions: ["Existing network remains"],
      constraints: ["No service interruption"],
      solutionPosture: "solution-open",
      proposedApproaches: [],
      prohibitedApproaches: ["Unplanned outage"],
      unresolvedQuestions: ["Final sequence"],
      interpretationRecordIds: [],
    },
    scope: "Assess, plan, and implement the approved continuity improvements.",
    requestedOutputs: [
      {
        id: "output-1",
        title: "Continuity plan",
        description: "Reviewed implementation plan.",
        quantity: { amount: 1, unit: "plan" },
        dueDate: "2026-10-01",
      },
    ],
    timing: {
      anticipatedStartDate: "2026-09-01",
      anticipatedCompletionDate: "2026-12-01",
      responseDeadline: "2026-08-28",
    },
    performanceLocation,
    estimatedValue: {
      mode: "range",
      currency: "usd",
      minimumMinor: 1000000,
      maximumMinor: 2500000,
    },
    engagementTerm: {
      mode: "fixed-with-options",
      baseDuration: { value: 3, unit: "months" },
      optionCount: 2,
      optionDuration: { value: 1, unit: "months" },
      note: "Options require approval.",
    },
    requirements: [
      {
        id: "requirement-1",
        kind: "evidence",
        title: "Continuity evidence",
        description: "Provide a comparable plan.",
        mandatory: true,
        quantity: null,
        dueDate: null,
        evidenceDescription: "Redacted prior example.",
      },
    ],
  };
}

async function expectForbiddenReason(promise, reason) {
  await assert.rejects(
    promise,
    (error) =>
      error instanceof RfxDraftError &&
      error.code === "forbidden" &&
      error.message.includes(`(${reason})`),
  );
}

test("creates one organization-owned private draft with the complete governed AMACS snapshot", async () => {
  const f = fixture();
  const result = await f.service.createDraft(f.scope(0, "create-1"), {
    requestFamilyId: "AMACS-REQ-000001",
    labelSnapshot: "Attacker override",
    amacsReleaseVersion: "invented",
  });
  assert.equal(result.aggregate.issuerOrganizationId, f.organizations[0].id);
  assert.equal(result.aggregate.createdByUserId, f.users[0].id);
  assert.equal(result.aggregate.createdByMembershipId, f.memberships[0].id);
  assert.equal(result.aggregate.lifecycleState, "draft");
  assert.equal(result.aggregate.version, 1);
  assert.deepEqual(result.aggregate.creationSource, {
    kind: "blank",
    schemaVersion: 1,
  });
  assert.equal(result.aggregate.requestFamily.amacsReleaseVersion, "0.5.0");
  assert.equal(
    result.aggregate.requestFamily.labelSnapshot,
    "Request for Information",
  );
  assert.equal(
    result.aggregate.requestFamily.amacsSourceCommit,
    RELEASE.sourceCommit,
  );
  assert.equal(
    result.aggregate.requestFamily.defaultResponseTemplateIdSnapshot,
    "AMACS-RSPT-000001",
  );
  assert.deepEqual(
    result.aggregate.requestFamily.allowedGovernanceProfileIdsSnapshot,
    ["AMACS-GOV-000001", "AMACS-GOV-000002"],
  );
  assert.deepEqual(
    f.state.events.map((event) => event.kind),
    ["rfx-draft-created"],
  );
  assert.equal(f.state.audits[0].action, "rfx.draft-created");
  assert.equal(
    JSON.stringify(f.state).includes("opportunityProjection"),
    false,
  );
});

test("exact command replay is stable and altered intent conflicts", async () => {
  const f = fixture();
  const first = await f.service.createDraft(f.scope(0, "create-retry"), {
    requestFamilyId: "AMACS-REQ-000001",
  });
  const replay = await f.service.createDraft(f.scope(0, "create-retry"), {
    requestFamilyId: "AMACS-REQ-000001",
  });
  assert.equal(replay.replayed, true);
  assert.equal(replay.aggregate.id, first.aggregate.id);
  assert.equal(f.state.aggregates.size, 1);
  assert.equal(f.state.events.length, 1);
  await assert.rejects(
    f.service.createDraft(f.scope(0, "create-retry"), {
      requestFamilyId: f.secondFamily.request_family_id,
    }),
    (error) => error instanceof RfxDraftError && error.code === "conflict",
  );
});

test("a concurrent exact replay returns the committed aggregate and receipt", async () => {
  const f = fixture();
  f.controls.raceReplayOnNextSave = true;
  const replay = await f.service.createDraft(f.scope(0, "create-race"), {
    requestFamilyId: "AMACS-REQ-000001",
  });
  assert.equal(replay.replayed, true);
  assert.equal(replay.aggregate.updatedAt, "2026-08-12T12:00:01.000Z");
  assert.equal(replay.receipt.recordedAt, "2026-08-12T12:00:01.000Z");
  assert.equal(f.state.events.length, 1);
  assert.equal(f.state.audits.length, 1);
});

test("request-family change checks version and retains historical meaning", async () => {
  const f = fixture();
  const created = await f.service.createDraft(f.scope(0, "create-change"), {
    requestFamilyId: "AMACS-REQ-000001",
  });
  f.setFamily(family("AMACS-REQ-000001", "A renamed future catalog label"));
  assert.equal(
    created.aggregate.requestFamily.labelSnapshot,
    "Request for Information",
  );
  const changed = await f.service.changeRequestFamily(f.scope(0, "change-1"), {
    rfxId: created.aggregate.id,
    expectedVersion: 1,
    requestFamilyId: f.secondFamily.request_family_id,
  });
  assert.equal(changed.aggregate.version, 2);
  assert.equal(
    changed.aggregate.requestFamily.labelSnapshot,
    "Request for Quotation",
  );
  assert.equal(
    f.state.events[1].priorRequestFamily.labelSnapshot,
    "Request for Information",
  );
  await assert.rejects(
    f.service.changeRequestFamily(f.scope(0, "change-stale"), {
      rfxId: created.aggregate.id,
      expectedVersion: 1,
      requestFamilyId: "AMACS-REQ-000001",
    }),
    (error) => error instanceof RfxDraftError && error.code === "conflict",
  );
  assert.equal(f.state.events.length, 2);
});

test("structured package save derives module status and preserves one versioned aggregate", async () => {
  const f = fixture();
  const created = await f.service.createDraft(f.scope(0, "package-create"), {
    requestFamilyId: "AMACS-REQ-000001",
  });
  const saved = await f.service.savePackage(f.scope(0, "package-save"), {
    rfxId: created.aggregate.id,
    expectedVersion: 1,
    package: packageInput(),
  });
  assert.equal(saved.aggregate.version, 2);
  assert.equal(saved.aggregate.lifecycleState, "draft");
  assert.equal(saved.aggregate.package.schemaVersion, 1);
  assert.equal(saved.aggregate.package.estimatedValue.currency, "USD");
  assert.deepEqual(Object.values(saved.aggregate.package.moduleStatus), [
    "complete",
    "complete",
    "complete",
    "complete",
    "complete",
    "complete",
  ]);
  assert.equal(
    saved.aggregate.package.performanceLocation.mode,
    "issuer-primary-location",
  );
  assert.equal(f.state.aggregates.size, 1);
  assert.equal(f.state.events.at(-1).kind, "rfx-package-saved");
  assert.equal(f.state.audits.at(-1).action, "rfx.package-saved");

  const replay = await f.service.savePackage(f.scope(0, "package-save"), {
    rfxId: created.aggregate.id,
    expectedVersion: 1,
    package: packageInput(),
  });
  assert.equal(replay.replayed, true);
  assert.equal(f.state.events.length, 2);
  await assert.rejects(
    f.service.savePackage(f.scope(0, "package-save"), {
      rfxId: created.aggregate.id,
      expectedVersion: 1,
      package: { ...packageInput(), title: "Altered intent" },
    }),
    (error) => error instanceof RfxDraftError && error.code === "conflict",
  );
  await assert.rejects(
    f.service.savePackage(f.scope(0, "package-stale"), {
      rfxId: created.aggregate.id,
      expectedVersion: 1,
      package: packageInput(),
    }),
    (error) => error instanceof RfxDraftError && error.code === "conflict",
  );
});

test("performance location variants are resolved from current geography authority", async () => {
  for (const [mode, selection] of [
    ["locality", { mode: "locality", localityId: "county-51013" }],
    [
      "exact-address",
      { mode: "exact-address", organizationLocationId: "org-issuer" },
    ],
    [
      "multiple",
      {
        mode: "multiple",
        locations: [
          {
            mode: "issuer-primary-location",
            organizationLocationId: "org-issuer",
          },
          { mode: "locality", localityId: "county-51013" },
        ],
      },
    ],
  ]) {
    const f = fixture();
    const created = await f.service.createDraft(f.scope(0, `create-${mode}`), {
      requestFamilyId: "AMACS-REQ-000001",
    });
    const saved = await f.service.savePackage(f.scope(0, `save-${mode}`), {
      rfxId: created.aggregate.id,
      expectedVersion: 1,
      package: packageInput(selection),
    });
    assert.equal(saved.aggregate.package.performanceLocation.mode, mode);
  }
});

test("invalid package variants and cross-tenant package writes fail without evidence", async () => {
  const f = fixture();
  const created = await f.service.createDraft(
    f.scope(0, "package-invalid-create"),
    { requestFamilyId: "AMACS-REQ-000001" },
  );
  const evidenceCount = f.state.events.length;
  await assert.rejects(
    f.service.savePackage(f.scope(0, "package-invalid-range"), {
      rfxId: created.aggregate.id,
      expectedVersion: 1,
      package: {
        ...packageInput(),
        estimatedValue: {
          mode: "range",
          currency: "USD",
          minimumMinor: 20,
          maximumMinor: 10,
        },
      },
    }),
    (error) => error instanceof RfxDraftError && error.code === "invalid",
  );
  await assert.rejects(
    f.service.savePackage(f.scope(0, "package-invalid-location"), {
      rfxId: created.aggregate.id,
      expectedVersion: 1,
      package: packageInput({
        mode: "locality",
        localityId: "county-invented",
      }),
    }),
    (error) => error instanceof RfxDraftError && error.code === "invalid",
  );
  const referencedPackage = packageInput();
  referencedPackage.marketNeed.interpretationRecordIds = [
    "interpretation-reviewed",
  ];
  await assert.rejects(
    f.service.savePackage(f.scope(0, "package-invented-interpretation"), {
      rfxId: created.aggregate.id,
      expectedVersion: 1,
      package: referencedPackage,
    }),
    (error) => error instanceof RfxDraftError && error.code === "invalid",
  );
  f.state.interpretations.set("interpretation-reviewed", {
    id: "interpretation-reviewed",
    organizationId: f.organizations[0].id,
    record: {
      organization_id: f.organizations[0].id,
      purpose: "buyer_need_definition",
      subject_ref: created.aggregate.id,
      record_status: "partially_confirmed",
    },
  });
  const reviewed = await f.service.savePackage(
    f.scope(0, "package-reviewed-interpretation"),
    {
      rfxId: created.aggregate.id,
      expectedVersion: 1,
      package: referencedPackage,
    },
  );
  assert.deepEqual(
    reviewed.aggregate.package.marketNeed.interpretationRecordIds,
    ["interpretation-reviewed"],
  );
  await assert.rejects(
    f.service.savePackage(f.scope(1, "package-other"), {
      rfxId: created.aggregate.id,
      expectedVersion: 1,
      package: packageInput(),
    }),
    (error) => error instanceof RfxDraftError && error.code === "forbidden",
  );
  assert.equal(f.state.events.length, evidenceCount + 1);
});

test("invalid AMACS IDs, missing permission, and cross-tenant identifiers fail closed", async () => {
  const f = fixture();
  await assert.rejects(
    f.service.createDraft(f.scope(0, "invalid-family"), {
      requestFamilyId: "AMACS-REQ-INVENTED",
    }),
    (error) => error instanceof RfxDraftError && error.code === "invalid",
  );
  await assert.rejects(
    f.service.createDraft(f.scope(1, "viewer-create"), {
      requestFamilyId: "AMACS-REQ-000001",
    }),
    (error) => error instanceof RfxDraftError && error.code === "forbidden",
  );
  const created = await f.service.createDraft(f.scope(0, "tenant-create"), {
    requestFamilyId: "AMACS-REQ-000001",
  });
  await assert.rejects(
    f.service.changeRequestFamily(
      { ...f.scope(0, "wrong-org"), organizationId: f.organizations[1].id },
      {
        rfxId: created.aggregate.id,
        expectedVersion: 1,
        requestFamilyId: f.secondFamily.request_family_id,
      },
    ),
    (error) => error instanceof RfxDraftError && error.code === "forbidden",
  );
  await assert.rejects(
    f.service.changeRequestFamily(f.scope(1, "other-org"), {
      rfxId: created.aggregate.id,
      expectedVersion: 1,
      requestFamilyId: f.secondFamily.request_family_id,
    }),
    (error) => error instanceof RfxDraftError && error.code === "forbidden",
  );
});

test("account, credential, membership, restriction, and actor boundaries deny RFx commands", async () => {
  const cases = [
    [
      "account-disabled",
      (f) => {
        f.controls.account.disabled = true;
      },
    ],
    [
      "credential-revoked",
      (f) => {
        f.controls.account.tokensValidAfter = "2026-08-13T00:00:00.000Z";
      },
    ],
    [
      "email-verification-required",
      (f) => {
        f.controls.account.emailVerified = false;
      },
    ],
    [
      "membership-inactive",
      (f) => {
        f.controls.inactiveMembershipId = f.memberships[0].id;
      },
    ],
    [
      "organization-access-restricted",
      (f) => {
        f.controls.restriction = {
          id: "restriction-1",
          target: {
            kind: "organization",
            organizationId: f.organizations[0].id,
          },
          state: "restricted",
          createdAt: NOW,
          updatedAt: NOW,
        };
      },
    ],
  ];
  for (const [reason, arrange] of cases) {
    const f = fixture();
    arrange(f);
    await expectForbiddenReason(
      f.service.createDraft(f.scope(0, `denied-${reason}`), {
        requestFamilyId: "AMACS-REQ-000001",
      }),
      reason,
    );
    assert.equal(f.state.aggregates.size, 0);
  }

  const f = fixture();
  await expectForbiddenReason(
    f.service.createDraft(
      {
        ...f.scope(0, "wrong-user"),
        organizationId: f.organizations[1].id,
        membershipId: f.memberships[1].id,
      },
      { requestFamilyId: "AMACS-REQ-000001" },
    ),
    "wrong-user",
  );
});

test("a command identity cannot replay across organization tenants", async () => {
  const f = fixture();
  await f.service.createDraft(f.scope(0, "shared-command"), {
    requestFamilyId: "AMACS-REQ-000001",
  });
  f.controls.otherCanCreate = true;
  await assert.rejects(
    f.service.createDraft(f.scope(1, "shared-command"), {
      requestFamilyId: "AMACS-REQ-000001",
    }),
    (error) => error instanceof RfxDraftError && error.code === "conflict",
  );
  assert.equal(f.state.aggregates.size, 1);
});
