import assert from "node:assert/strict";
import test from "node:test";

import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import {
  assertRfxIss006AuthoritativeBoundary,
} from "../src/application/rfx/iss006-authoritative-boundary.ts";
import {
  RFX_ISS006_GOVERNED_CURRENCY_CODES,
} from "../src/domain/rfx/iss006-governance.ts";
import { RfxDraftError } from "../src/application/rfx/rfx-draft-service.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import { standardOrganizationRolePreset } from "../src/domain/authorization/organization-role-presets.ts";
import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
} from "../src/domain/users/model.ts";

const NOW = "2026-08-13T20:00:00.000Z";

function fixture() {
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
        async getById(id) {
          return [issuer, other].find((item) => item.id === id) ?? null;
        },
        async create() {},
      },
      memberships: {
        async getById(id) {
          return id === membership.id ? membership : null;
        },
        async listByUserId() { return []; },
        async listActiveByUserId() { return []; },
        async listByOrganizationId() { return []; },
        async create() {},
      },
      authorizations: {
        async getByMembershipId(id) {
          return id === membership.id ? authorization : null;
        },
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
          ? {
              id: "location-issuer",
              organizationId: issuer.id,
              geographyId: "county-released",
            }
          : null;
      },
    },
  };

  function packageInput(overrides = {}) {
    return {
      title: "Boundary-only fixture",
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
    };
  }

  return {
    issuer,
    other,
    membership,
    context,
    dependencies,
    packageInput,
    geographyReads: () => geographyReads,
  };
}

async function expectInvalid(promise, messagePattern) {
  await assert.rejects(
    promise,
    (error) =>
      error instanceof RfxDraftError &&
      error.code === "invalid" &&
      messagePattern.test(error.message),
  );
}

test("ISS-006 accepts a current released governed locality", async () => {
  const f = fixture();
  await assertRfxIss006AuthoritativeBoundary(
    {
      context: f.context,
      organizationId: String(f.issuer.id),
      membershipId: String(f.membership.id),
      package: f.packageInput(),
    },
    f.dependencies,
  );
  assert.equal(f.geographyReads(), 1);
});

test("ISS-006 rejects unreleased, limited, restricted, unavailable, and tampered localities", async () => {
  for (const localityId of [
    "county-visible-unreleased",
    "county-limited",
    "county-restricted",
    "county-missing",
    "COUNTY-RELEASED!",
  ]) {
    const f = fixture();
    await expectInvalid(
      assertRfxIss006AuthoritativeBoundary(
        {
          context: f.context,
          organizationId: String(f.issuer.id),
          membershipId: String(f.membership.id),
          package: f.packageInput({
            performanceLocation: { mode: "locality", localityId },
          }),
        },
        f.dependencies,
      ),
      /locality/i,
    );
  }
});

test("ISS-006 revalidates organization-location geography as released", async () => {
  const f = fixture();
  await assertRfxIss006AuthoritativeBoundary(
    {
      context: f.context,
      organizationId: String(f.issuer.id),
      membershipId: String(f.membership.id),
      package: f.packageInput({
        performanceLocation: {
          mode: "organization-location",
          organizationLocationId: "location-issuer",
        },
      }),
    },
    f.dependencies,
  );
});

test("ISS-006 accepts only the pinned AMACS 0.5.0 governed currency unit family", async () => {
  assert.deepEqual(RFX_ISS006_GOVERNED_CURRENCY_CODES, ["USD", "EUR", "GBP", "CAD"]);
  for (const currency of RFX_ISS006_GOVERNED_CURRENCY_CODES) {
    const f = fixture();
    await assertRfxIss006AuthoritativeBoundary(
      {
        context: f.context,
        organizationId: String(f.issuer.id),
        membershipId: String(f.membership.id),
        package: f.packageInput({
          estimatedValue: { mode: "exact", currency, amountMinor: 100 },
        }),
      },
      f.dependencies,
    );
  }
});

test("ISS-006 rejects arbitrary and valid-but-unsupported three-letter currencies", async () => {
  for (const currency of ["ZZZ", "JPY"]) {
    const f = fixture();
    await expectInvalid(
      assertRfxIss006AuthoritativeBoundary(
        {
          context: f.context,
          organizationId: String(f.issuer.id),
          membershipId: String(f.membership.id),
          package: f.packageInput({
            estimatedValue: { mode: "range", currency, minimumMinor: 100, maximumMinor: 200 },
          }),
        },
        f.dependencies,
      ),
      /currency/i,
    );
  }
});

test("ISS-006 accepts valid milestone chronology and rejects reversed chronology", async () => {
  const valid = fixture();
  await assertRfxIss006AuthoritativeBoundary(
    {
      context: valid.context,
      organizationId: String(valid.issuer.id),
      membershipId: String(valid.membership.id),
      package: valid.packageInput({
        engagementTerm: {
          mode: "milestone-based",
          expectedStart: "2026-09-01",
          expectedCompletion: "2026-09-01",
        },
      }),
    },
    valid.dependencies,
  );

  const reversed = fixture();
  await expectInvalid(
    assertRfxIss006AuthoritativeBoundary(
      {
        context: reversed.context,
        organizationId: String(reversed.issuer.id),
        membershipId: String(reversed.membership.id),
        package: reversed.packageInput({
          engagementTerm: {
            mode: "milestone-based",
            expectedStart: "2026-10-01",
            expectedCompletion: "2026-09-01",
          },
        }),
      },
      reversed.dependencies,
    ),
    /completion.*precede.*start/i,
  );
});

test("ISS-006 denies wrong-organization authority before reading locality truth", async () => {
  const f = fixture();
  await assert.rejects(
    assertRfxIss006AuthoritativeBoundary(
      {
        context: f.context,
        organizationId: String(f.other.id),
        membershipId: String(f.membership.id),
        package: f.packageInput({
          performanceLocation: { mode: "locality", localityId: "county-missing" },
        }),
      },
      f.dependencies,
    ),
    (error) => error instanceof RfxDraftError && error.code === "forbidden",
  );
  assert.equal(f.geographyReads(), 0);
});
