import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import { RfxIss006GovernedDraftService } from "../src/application/rfx/iss006-governed-draft-service.ts";
import { RfxDraftError } from "../src/application/rfx/rfx-draft-service.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import { standardOrganizationRolePreset } from "../src/domain/authorization/organization-role-presets.ts";
import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import {
  RFX_ISS006_GOVERNED_CURRENCY_CODES,
  RfxIss006GovernanceError,
  assertRfxIss006StructuredValueAuthority,
} from "../src/domain/rfx/iss006-governance.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
} from "../src/domain/users/model.ts";

const NOW = "2026-08-13T20:00:00.000Z";

function requestFingerprint(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function fixture({ existingCommand = null, existingAggregate = null } = {}) {
  const issuer = createOrganizationAccount({ id: "org-issuer", now: NOW });
  const other = createOrganizationAccount({ id: "org-other", now: NOW });
  const user = createUserIdentity({
    id: "user-issuer",
    name: "Issuer",
    primaryEmail: "issuer@example.test",
    loginProvider: "firebase",
    loginSubject: "subject-issuer",
    now: NOW,
  });
  const membership = createOrganizationMembership(user, issuer, {
    id: "membership-issuer",
    now: NOW,
  });
  const preset = standardOrganizationRolePreset("primary-administrator");
  const authorization = createOrganizationUserAuthorization(membership, issuer, {
    roleKey: preset.key,
    permissions: preset.permissions,
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
      expiresAt: "2026-08-14T20:00:00.000Z",
    },
    source: "session-cookie",
  });

  const geographyStates = new Map([
    ["county-released", "released"],
    ["county-visible-unreleased", "visible-unreleased"],
    ["county-limited", "limited"],
    ["county-restricted", "restricted"],
  ]);
  let geographyReads = 0;
  const repository = {
    async getCommand() { return existingCommand; },
    async getById() { return existingAggregate; },
    async listByIssuerOrganizationId() { return []; },
    async getPublicationSnapshot() { return null; },
    async getProjection() { return null; },
    async save() { throw new Error("unexpected persistence"); },
    async publish() { throw new Error("unexpected publication"); },
  };
  const dependencies = {
    authorization: {
      accountSecurity: {
        async inspect(subject) {
          return {
            provider: "firebase",
            subject,
            email: user.primaryEmail,
            emailVerified: true,
            disabled: false,
            tokensValidAfter: null,
            mfaEnrolled: false,
            lastSignInAt: NOW,
          };
        },
      },
      organizations: {
        async getById(id) { return [issuer, other].find((item) => item.id === id) ?? null; },
        async create() {},
      },
      memberships: {
        async getById(id) { return id === membership.id ? membership : null; },
        async listByUserId() { return []; },
        async listActiveByUserId() { return []; },
        async listByOrganizationId() { return []; },
        async create() {},
      },
      authorizations: {
        async getByMembershipId(id) { return id === membership.id ? authorization : null; },
        async listByUserId() { return []; },
        async listByOrganizationId() { return []; },
        async save() {},
      },
      restrictions: {
        async getById() { return null; },
        async getForOrganization() { return null; },
        async getForMembership() { return null; },
        async save() {},
      },
    },
    catalog: {},
    repository,
    geographies: {
      async getById(id) {
        geographyReads += 1;
        const releaseState = geographyStates.get(String(id));
        return releaseState ? { id, releaseState } : null;
      },
      async save() {},
    },
    locations: {
      async getByOrganizationId(id) {
        return String(id) === String(issuer.id)
          ? { id: "location-issuer", organizationId: issuer.id, geographyId: "county-released" }
          : null;
      },
    },
    interpretations: { async getRecord() { return null; } },
  };

  const service = new RfxIss006GovernedDraftService(dependencies);
  const packageInput = (overrides = {}) => ({
    title: "Boundary fixture",
    marketNeed: {},
    scope: "",
    requestedOutputs: [],
    timing: {},
    performanceLocation: { mode: "locality", localityId: "county-released" },
    estimatedValue: { mode: "exact", currency: "USD", amountMinor: 100 },
    engagementTerm: {
      mode: "milestone-based",
      expectedStart: "2026-09-01",
      expectedCompletion: "2026-10-01",
    },
    requirements: [],
    ...overrides,
  });

  return { issuer, other, membership, context, service, packageInput, geographyReads: () => geographyReads };
}

test("ISS-006 currency projection exactly matches pinned AMACS 0.5.0", async () => {
  const registries = JSON.parse(
    await readFile(new URL("../src/generated/amacs/0.5.0/registries.json", import.meta.url), "utf8"),
  );
  const currentCurrencyCodes = registries.registries.units
    .filter((unit) => unit.status === "active" && unit.unit_family === "currency" && unit.data_type === "currency")
    .map((unit) => unit.code);
  assert.deepEqual(currentCurrencyCodes, RFX_ISS006_GOVERNED_CURRENCY_CODES);
});

test("ISS-006 accepts released locality and rejects ineligible/tampered locality", async () => {
  const accepted = fixture();
  await accepted.service.validatePerformanceLocation(
    { mode: "locality", localityId: "county-released" },
    accepted.issuer.id,
  );
  for (const localityId of ["county-visible-unreleased", "county-limited", "county-restricted", "county-missing", "COUNTY-RELEASED!"]) {
    const f = fixture();
    await assert.rejects(
      f.service.validatePerformanceLocation({ mode: "locality", localityId }, f.issuer.id),
      (error) => error instanceof RfxDraftError && error.code === "invalid",
    );
  }
});

test("ISS-006 revalidates organization-location locality", async () => {
  const f = fixture();
  await f.service.validatePerformanceLocation(
    { mode: "organization-location", organizationLocationId: "location-issuer" },
    f.issuer.id,
  );
  await assert.rejects(
    f.service.validatePerformanceLocation(
      { mode: "organization-location", organizationLocationId: "forged-location" },
      f.issuer.id,
    ),
    (error) => error instanceof RfxDraftError && error.code === "invalid",
  );
});

test("ISS-006 accepts governed currencies and rejects arbitrary/unsupported currency", () => {
  for (const currency of RFX_ISS006_GOVERNED_CURRENCY_CODES) {
    assert.doesNotThrow(() =>
      assertRfxIss006StructuredValueAuthority({
        estimatedValue: { mode: "exact", currency, amountMinor: 100 },
        engagementTerm: { mode: "fixed", duration: { value: 1, unit: "months" }, note: null },
      }),
    );
  }
  for (const currency of ["ZZZ", "JPY"]) {
    assert.throws(
      () => assertRfxIss006StructuredValueAuthority({
        estimatedValue: { mode: "range", currency, minimumMinor: 100, maximumMinor: 200 },
        engagementTerm: { mode: "fixed", duration: { value: 1, unit: "months" }, note: null },
      }),
      RfxIss006GovernanceError,
    );
  }
});

test("ISS-006 accepts valid milestone chronology and rejects reversed chronology", () => {
  assert.doesNotThrow(() =>
    assertRfxIss006StructuredValueAuthority({
      estimatedValue: { mode: "not-disclosed" },
      engagementTerm: { mode: "milestone-based", expectedStart: "2026-09-01", expectedCompletion: "2026-09-01" },
    }),
  );
  assert.throws(
    () => assertRfxIss006StructuredValueAuthority({
      estimatedValue: { mode: "not-disclosed" },
      engagementTerm: { mode: "milestone-based", expectedStart: "2026-10-01", expectedCompletion: "2026-09-01" },
    }),
    /completion cannot precede expected start/,
  );
});

test("ISS-006 exact replay returns before current geography revalidation", async () => {
  const inputPackage = fixture().packageInput({ performanceLocation: { mode: "locality", localityId: "county-missing" } });
  const aggregateId = "rfx-replay";
  const commandId = "command-replay";
  const issuerId = "org-issuer";
  const expectedVersion = 2;
  const fingerprint = requestFingerprint({
    action: "save-package",
    issuerOrganizationId: issuerId,
    rfxId: aggregateId,
    expectedVersion,
    package: inputPackage,
  });
  const committedAggregate = { id: aggregateId, issuerOrganizationId: issuerId, version: 3 };
  const existingCommand = {
    id: commandId,
    issuerOrganizationId: issuerId,
    rfxId: aggregateId,
    action: "save-package",
    requestFingerprint: fingerprint,
    resultingVersion: 3,
    recordedAt: NOW,
  };
  const f = fixture({ existingCommand, existingAggregate: committedAggregate });
  const result = await f.service.savePackage(
    {
      context: f.context,
      organizationId: issuerId,
      membershipId: String(f.membership.id),
      commandId,
    },
    { rfxId: aggregateId, expectedVersion, package: inputPackage },
  );
  assert.equal(result.replayed, true);
  assert.equal(f.geographyReads(), 0);
});

test("ISS-006 wrong-organization denial precedes geography inspection", async () => {
  const f = fixture();
  await assert.rejects(
    f.service.savePackage(
      {
        context: f.context,
        organizationId: String(f.other.id),
        membershipId: String(f.membership.id),
        commandId: "wrong-org-command",
      },
      {
        rfxId: "rfx-wrong-org",
        expectedVersion: 1,
        package: f.packageInput({ performanceLocation: { mode: "locality", localityId: "county-missing" } }),
      },
    ),
    (error) => error instanceof RfxDraftError && error.code === "forbidden",
  );
  assert.equal(f.geographyReads(), 0);
});

test("ISS-006 package transaction checks exact replay before atomic released-geography guard", async () => {
  const source = await readFile(
    new URL("../src/infrastructure/rfx/iss006-governed-rfx-repository.ts", import.meta.url),
    "utf8",
  );
  const replayRead = source.indexOf("transaction.get(commandRef)");
  const governedReads = source.indexOf("transaction.getAll(");
  const releaseGuard = source.indexOf('geography.releaseState !== "released"');
  const aggregateWrite = source.indexOf("transaction.set(aggregateRef");
  assert.ok(replayRead >= 0 && governedReads > replayRead);
  assert.ok(releaseGuard > governedReads && aggregateWrite > releaseGuard);
});
