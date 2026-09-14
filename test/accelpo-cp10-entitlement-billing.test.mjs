import assert from "node:assert/strict";
import test from "node:test";

import {
  createAddSeatBillingHandoff,
  parseSharedSeatEntitlements,
  planMemberSeatRelease,
  resolveEntitlementBilling,
} from "../src/application/accelpo/entitlement-billing.ts";
import {
  CP10_COMMAND_NAMES,
  createCP10CommandDefinitions,
} from "../src/accelpo/cp10/commands.ts";
import { AccelPoCommandError } from "../src/application/accelpo/command-port.ts";
import {
  CP10_ENTITLEMENT_BILLING_PART,
} from "../apps/accelpo/src/entitlement-billing/part.ts";
import { createAccelPOPartRegistry } from "../apps/accelpo/src/chassis/registry.ts";

const commercial = (keys, overrides = {}) => ({
  plan: "configured-plan",
  entitlementKeys: keys,
  billingPeriod: "2026-10-01T00:00:00.000Z",
  entitlementVersion: "2026-09-14T19:00:00.000Z",
  ...overrides,
});

const seatKeys = ({ included = 3, addOn = 0, purchase = false, price = null } = {}) => [
  `organization.seats.included:${included}`,
  `organization.seats.addon.allowance:${addOn}`,
  ...(purchase ? ["organization.seats.addon.purchase"] : []),
  ...(price == null ? [] : [
    `organization.seats.addon.price-minor:${price}`,
    "organization.seats.addon.currency:usd",
  ]),
];

test("CP-10 parses seat quantities from shared entitlement keys, never a plan-name table", () => {
  assert.deepEqual(parseSharedSeatEntitlements(seatKeys({
    included: 7,
    addOn: 2,
    purchase: true,
    price: 1095,
  })), {
    includedSeats: 7,
    addOnSeatAllowance: 2,
    addOnPurchaseAllowed: true,
    addOnSeatPricing: { amountMinor: 1095, currency: "USD" },
  });
  assert.equal(parseSharedSeatEntitlements(["some.plan.name:growth"]), null);
  assert.equal(parseSharedSeatEntitlements([
    "organization.seats.included:3",
    "organization.seats.included:10",
  ]), null);
});

test("owner and every active member consume a seat while only live pending invitations reserve seats", () => {
  const projection = resolveEntitlementBilling({
    organizationId: "org-one",
    commercial: commercial(seatKeys({ included: 4 })),
    memberships: [
      { userId: "owner", status: "active" },
      { userId: "buyer", status: "active" },
      { userId: "former", status: "inactive" },
    ],
    invitations: [
      { id: "pending", status: "pending", expiresAt: "2026-09-15T00:00:00.000Z" },
      { id: "expired-by-time", status: "pending", expiresAt: "2026-09-13T00:00:00.000Z" },
      { id: "accepted", status: "accepted", expiresAt: "2026-09-20T00:00:00.000Z" },
    ],
    now: "2026-09-14T20:00:00.000Z",
  });
  assert.equal(projection.ownerCountsAsSeat, true);
  assert.equal(projection.activeSeats, 2);
  assert.equal(projection.reservedSeats, 1);
  assert.equal(projection.availableSeats, 1);
});

test("plan changes recompute availability without rewriting membership history", () => {
  const facts = {
    organizationId: "org-one",
    memberships: [
      { userId: "owner", status: "active" },
      { userId: "buyer", status: "active" },
    ],
    invitations: [],
    now: "2026-09-14T20:00:00.000Z",
  };
  const before = resolveEntitlementBilling({ ...facts, commercial: commercial(seatKeys({ included: 3 })) });
  const after = resolveEntitlementBilling({
    ...facts,
    commercial: commercial(seatKeys({ included: 10 }), {
      entitlementVersion: "2026-09-15T20:00:00.000Z",
    }),
  });
  assert.equal(before.activeSeats, after.activeSeats);
  assert.equal(before.availableSeats, 1);
  assert.equal(after.availableSeats, 8);
});

test("Add Seat handoff is contextual and carries no payment implementation", () => {
  const projection = resolveEntitlementBilling({
    organizationId: "org-one",
    commercial: commercial(seatKeys({ included: 1, purchase: true, price: 1095 })),
    memberships: [{ userId: "owner", status: "active" }],
    invitations: [],
    now: "2026-09-14T20:00:00.000Z",
  });
  assert.equal(projection.addSeatActionAllowed, true);
  assert.deepEqual(createAddSeatBillingHandoff(projection, "/organization/people"), {
    kind: "add-seat",
    organizationId: "org-one",
    quantity: 1,
    plan: "configured-plan",
    entitlementVersion: "2026-09-14T19:00:00.000Z",
    returnTo: "/organization/people",
    quotedUnitPrice: { amountMinor: 1095, currency: "USD" },
  });
  assert.equal(createAddSeatBillingHandoff(projection, "https://outside.example"), null);
});

test("member seat release fails closed for owner, open work, or unavailable responsibility checks", () => {
  assert.equal(planMemberSeatRelease({
    roleKey: "primary-admin-owner",
    responsibilities: { kind: "resolved", openResponsibilityIds: [] },
  }).reason, "owner-transfer-required");
  assert.equal(planMemberSeatRelease({
    roleKey: "buyer",
    responsibilities: { kind: "unavailable" },
  }).reason, "responsibility-check-unavailable");
  assert.deepEqual(planMemberSeatRelease({
    roleKey: "buyer",
    responsibilities: { kind: "open", openResponsibilityIds: ["task-1"] },
  }), {
    kind: "blocked",
    reason: "open-responsibilities",
    openResponsibilityIds: ["task-1"],
  });
  assert.deepEqual(planMemberSeatRelease({
    roleKey: "buyer",
    responsibilities: { kind: "resolved", openResponsibilityIds: [] },
  }), { kind: "allow" });
});

function record(path, data) {
  return { path, exists: data != null, data };
}

function commandContext({ definition, payload, memberships, invitations, commercialKeys }) {
  const created = [];
  const transaction = {
    async get(path) {
      if (path === "organizationRoleBundles/buyer-role") {
        return record(path, {
          key: "buyer-role",
          permissions: ["purchasing.request"],
        });
      }
      if (path === "organizationCommercialAccounts/org-one") {
        return record(path, { entitlementKeys: commercialKeys });
      }
      return record(path, null);
    },
    async listOrganizationRecords(query) {
      if (query.collection === "organizationMemberships") return memberships;
      if (query.collection === "organizationUserInvitations") return invitations;
      return [];
    },
    create(path, data) { created.push({ path, data }); },
    set() {},
    update() {},
  };
  return {
    context: {
      command: {
        commandName: definition.name,
        organizationContext: { organizationId: "org-one" },
        payload,
        idempotencyKey: "invite-once",
        requestId: "request-one",
        actor: { userId: "owner", membershipId: "owner-membership", organizationId: "org-one" },
      },
      commandId: "accelpo_cmd_1234567890abcdef1234567890abcdef1234567890abcdef",
      actor: { userId: "owner", membershipId: "owner-membership", organizationId: "org-one" },
      permission: "organization.people.manage",
      target: null,
      currentVersion: null,
      now: "2026-09-14T20:00:00.000Z",
      transaction,
    },
    created,
  };
}

test("seat-backed invitation command reserves atomically and rejects exhausted capacity", async () => {
  const invite = createCP10CommandDefinitions().find((definition) => definition.name === CP10_COMMAND_NAMES.invite);
  assert.ok(invite);
  const payload = {
    email: "new@example.com",
    roleBundleKey: "buyer-role",
    expiresAt: "2026-09-20T00:00:00.000Z",
  };
  const oneActive = [record("organizationMemberships/owner", {
    organizationId: "org-one",
    userId: "owner",
    status: "active",
  })];

  const allowed = commandContext({
    definition: invite,
    payload,
    memberships: oneActive,
    invitations: [],
    commercialKeys: seatKeys({ included: 2 }),
  });
  const outcome = await invite.handle(allowed.context);
  assert.equal(allowed.created.length, 1);
  assert.equal(outcome.data.seats.reservedSeats, 1);
  assert.equal(outcome.data.seats.availableSeats, 0);

  const exhausted = commandContext({
    definition: invite,
    payload,
    memberships: oneActive,
    invitations: [],
    commercialKeys: seatKeys({ included: 1, purchase: true }),
  });
  await assert.rejects(
    () => invite.handle(exhausted.context),
    (error) => error instanceof AccelPoCommandError &&
      error.code === "forbidden" &&
      error.details.reason === "seat-capacity-exhausted" &&
      error.details.addSeatActionAllowed === true,
  );
  assert.equal(exhausted.created.length, 0);
});

test("CP-10 is registered on the shared chassis and its writes remain CP-03 commands", () => {
  const registry = createAccelPOPartRegistry();
  assert.deepEqual(registry.get(CP10_ENTITLEMENT_BILLING_PART.id), CP10_ENTITLEMENT_BILLING_PART);
  const commands = createCP10CommandDefinitions();
  assert.deepEqual(commands.map((definition) => definition.name).sort(), [
    "entitlement.invitation.create",
    "entitlement.invitation.revoke",
    "entitlement.membership.deactivate",
  ]);
  assert.ok(commands.every((definition) => definition.permission === "organization.people.manage"));
  assert.ok(commands.every((definition) => definition.idempotency === "required"));
});
