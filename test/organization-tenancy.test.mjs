import assert from "node:assert/strict";
import test from "node:test";

import {
  createOrganizationAccount,
  createOrganizationProfile,
  linkOrganizationAccountAndProfile,
} from "../src/domain/organizations/model.ts";

const NOW = "2026-07-28T22:00:00-04:00";

test("organization account is the tenant root and profile is a separate linked record", () => {
  const account = createOrganizationAccount({ id: "org_001", now: NOW });
  const profile = createOrganizationProfile(account, {
    id: "profile_001",
    displayName: "Example Organization",
    now: NOW,
  });
  const context = linkOrganizationAccountAndProfile(account, profile);

  assert.equal(account.id, "org_001");
  assert.equal(profile.id, "profile_001");
  assert.notEqual(profile.id, account.id);
  assert.equal(profile.organizationId, account.id);
  assert.equal(context.organizationId, account.id);
  assert.equal(context.account, account);
  assert.equal(context.profile, profile);
  assert.equal(account.createdAt, "2026-07-29T02:00:00.000Z");
  assert.equal(profile.createdAt, "2026-07-29T02:00:00.000Z");
});

test("profile creation derives tenant ownership from the supplied organization account", () => {
  const account = createOrganizationAccount({ id: "org_owner", now: NOW });
  const profile = createOrganizationProfile(account, {
    id: "profile_owner",
    displayName: "Owner Organization",
    now: NOW,
  });

  assert.equal(profile.organizationId, "org_owner");
});

test("cross-tenant account/profile combinations are rejected", () => {
  const firstAccount = createOrganizationAccount({ id: "org_first", now: NOW });
  const secondAccount = createOrganizationAccount({ id: "org_second", now: NOW });
  const firstProfile = createOrganizationProfile(firstAccount, {
    id: "profile_first",
    displayName: "First Organization",
    now: NOW,
  });

  assert.throws(
    () => linkOrganizationAccountAndProfile(secondAccount, firstProfile),
    /different organization tenant/,
  );
});

test("required tenant and network fields reject empty or invalid values", () => {
  assert.throws(
    () => createOrganizationAccount({ id: "   ", now: NOW }),
    /Organization id is required/,
  );
  assert.throws(
    () => createOrganizationAccount({ id: "org_bad_time", now: "not-a-date" }),
    /valid ISO-compatible date-time/,
  );

  const account = createOrganizationAccount({ id: "org_valid", now: NOW });

  assert.throws(
    () =>
      createOrganizationProfile(account, {
        id: "profile_empty_name",
        displayName: "   ",
        now: NOW,
      }),
    /Organization display name is required/,
  );
});
