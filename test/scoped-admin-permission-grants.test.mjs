import test from "node:test";
import assert from "node:assert/strict";

import {
  authorizeScopedAdministrativeAction,
  createAdminPermissionGrant,
  createScopedAdministrativeActionRequirement,
  parseAdminGrantScope,
} from "../src/domain/admin-authorization/grants.ts";
import { createPlatformAdministratorAuthorityContext } from "../src/domain/admin-authorization/model.ts";

const now = "2026-07-29T13:15:00.000Z";

function context(permissions = ["organization.profile.read", "organization.profile.update"]) {
  return createPlatformAdministratorAuthorityContext({
    administratorId: "admin-1",
    rolePresetKeys: ["platform-admin-placeholder"],
    effectivePermissions: permissions,
  });
}

function grant(overrides = {}) {
  return createAdminPermissionGrant({
    id: "grant-1",
    administratorId: "admin-1",
    permission: "organization.profile.read",
    scope: "ORGANIZATION:org-alpha",
    createdAt: "2026-07-29T12:00:00.000Z",
    ...overrides,
  });
}

test("supports GLOBAL, GEOGRAPHY, ORGANIZATION and CASE scope values", () => {
  assert.deepEqual(parseAdminGrantScope("GLOBAL"), { kind: "GLOBAL", value: "GLOBAL" });
  assert.deepEqual(parseAdminGrantScope("GEOGRAPHY:geo-1"), {
    kind: "GEOGRAPHY",
    targetId: "geo-1",
    value: "GEOGRAPHY:geo-1",
  });
  assert.deepEqual(parseAdminGrantScope("ORGANIZATION:org-1"), {
    kind: "ORGANIZATION",
    targetId: "org-1",
    value: "ORGANIZATION:org-1",
  });
  assert.deepEqual(parseAdminGrantScope("CASE:case-1"), {
    kind: "CASE",
    targetId: "case-1",
    value: "CASE:case-1",
  });
});

test("GLOBAL grant can authorize the same permission across resolved scopes", () => {
  const global = grant({ scope: "GLOBAL" });
  for (const scope of ["GEOGRAPHY:geo-1", "ORGANIZATION:org-1", "CASE:case-1"]) {
    const requirement = createScopedAdministrativeActionRequirement({
      permission: "organization.profile.read",
      access: "read",
      scope,
    });
    assert.equal(
      authorizeScopedAdministrativeAction(context(), [global], requirement, { now }).kind,
      "allow",
    );
  }
});

test("organization-scoped read grant allows only the exact organization", () => {
  const scopedGrant = grant();
  const allowed = createScopedAdministrativeActionRequirement({
    permission: "organization.profile.read",
    access: "read",
    scope: "ORGANIZATION:org-alpha",
  });
  const denied = createScopedAdministrativeActionRequirement({
    permission: "organization.profile.read",
    access: "read",
    scope: "ORGANIZATION:org-beta",
  });

  assert.equal(authorizeScopedAdministrativeAction(context(), [scopedGrant], allowed, { now }).kind, "allow");
  assert.equal(
    authorizeScopedAdministrativeAction(context(), [scopedGrant], denied, { now }).reason,
    "scope-not-satisfied",
  );
});

test("scoped write grant enforces scope independently of read grants", () => {
  const writeGrant = grant({
    id: "grant-write",
    permission: "organization.profile.update",
    scope: "ORGANIZATION:org-alpha",
  });
  const requirement = createScopedAdministrativeActionRequirement({
    permission: "organization.profile.update",
    access: "write",
    scope: "ORGANIZATION:org-alpha",
  });
  const decision = authorizeScopedAdministrativeAction(context(), [writeGrant], requirement, { now });

  assert.equal(decision.kind, "allow");
  assert.equal(decision.access, "write");
});

test("geography, organization and case grants do not cross scope kinds or target IDs", () => {
  const geographyGrant = grant({ scope: "GEOGRAPHY:geo-1" });
  const organizationRequirement = createScopedAdministrativeActionRequirement({
    permission: "organization.profile.read",
    access: "read",
    scope: "ORGANIZATION:org-alpha",
  });
  const otherGeographyRequirement = createScopedAdministrativeActionRequirement({
    permission: "organization.profile.read",
    access: "read",
    scope: "GEOGRAPHY:geo-2",
  });

  assert.equal(
    authorizeScopedAdministrativeAction(context(), [geographyGrant], organizationRequirement, { now }).reason,
    "scope-not-satisfied",
  );
  assert.equal(
    authorizeScopedAdministrativeAction(context(), [geographyGrant], otherGeographyRequirement, { now }).reason,
    "scope-not-satisfied",
  );
});

test("expired grants fail closed", () => {
  const expired = grant({ expiresAt: "2026-07-29T13:00:00.000Z" });
  const requirement = createScopedAdministrativeActionRequirement({
    permission: "organization.profile.read",
    access: "read",
    scope: "ORGANIZATION:org-alpha",
  });

  assert.equal(
    authorizeScopedAdministrativeAction(context(), [expired], requirement, { now }).reason,
    "grant-expired",
  );
});

test("grant conditions must be satisfied by evaluation evidence", () => {
  const conditioned = grant({ conditionKeys: ["ticket-linked", "manager-approved"] });
  const requirement = createScopedAdministrativeActionRequirement({
    permission: "organization.profile.read",
    access: "read",
    scope: "ORGANIZATION:org-alpha",
  });

  assert.equal(
    authorizeScopedAdministrativeAction(context(), [conditioned], requirement, {
      now,
      satisfiedConditionKeys: ["ticket-linked"],
    }).reason,
    "conditions-not-satisfied",
  );
  assert.equal(
    authorizeScopedAdministrativeAction(context(), [conditioned], requirement, {
      now,
      satisfiedConditionKeys: ["ticket-linked", "manager-approved"],
    }).kind,
    "allow",
  );
});

test("permission name must exist in both effective authority and a matching scoped grant", () => {
  const scopedGrant = grant();
  const requirement = createScopedAdministrativeActionRequirement({
    permission: "organization.profile.read",
    access: "read",
    scope: "ORGANIZATION:org-alpha",
  });

  assert.equal(
    authorizeScopedAdministrativeAction(context([]), [scopedGrant], requirement, { now }).reason,
    "permission-not-granted",
  );
  assert.equal(
    authorizeScopedAdministrativeAction(context(), [], requirement, { now }).reason,
    "scoped-grant-not-found",
  );
});

test("grants for another administrator never authorize the current administrator", () => {
  const otherAdminGrant = grant({ administratorId: "admin-2" });
  const requirement = createScopedAdministrativeActionRequirement({
    permission: "organization.profile.read",
    access: "read",
    scope: "ORGANIZATION:org-alpha",
  });

  assert.equal(
    authorizeScopedAdministrativeAction(context(), [otherAdminGrant], requirement, { now }).reason,
    "scoped-grant-not-found",
  );
});

test("grant creation validates catalogued permissions, expiry and immutable values", () => {
  assert.throws(
    () => grant({ permission: "organization.profile.destroy" }),
    /not in the catalog/,
  );
  assert.throws(
    () => grant({ expiresAt: "2026-07-29T11:00:00.000Z" }),
    /expiry must be later/,
  );
  assert.throws(
    () => parseAdminGrantScope("ORGANIZATION:"),
    /must be GLOBAL, GEOGRAPHY/,
  );

  const created = grant({ conditionKeys: ["ticket-linked", "ticket-linked"] });
  assert.deepEqual(created.conditionKeys, ["ticket-linked"]);
  assert.ok(Object.isFrozen(created));
  assert.ok(Object.isFrozen(created.scope));
  assert.ok(Object.isFrozen(created.conditionKeys));
});
