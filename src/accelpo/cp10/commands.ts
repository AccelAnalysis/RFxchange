import {
  entitlementGuardDocumentPath,
  invitationReservesSeat,
  parseSharedSeatEntitlements,
  planMemberSeatRelease,
  type ResponsibilityResolution,
} from "../../application/accelpo/entitlement-billing.ts";
import {
  ACCELPO_COMMAND_REGISTRY,
  AccelPoCommandError,
  type AccelPoCommandRegistry,
  type AnyCommandDefinition,
  type CommandHandlerContext,
  type CommandRecordSnapshot,
  type CommandTransaction,
  type JsonObject,
  type JsonValue,
} from "../../application/accelpo/command-port.ts";
import { organizationPermission } from "../../domain/authorization/model.ts";

export const CP10_COMMAND_NAMES = Object.freeze({
  invite: "entitlement.invitation.create",
  revokeInvitation: "entitlement.invitation.revoke",
  deactivateMembership: "entitlement.membership.deactivate",
} as const);

const INVITATION_COLLECTION = "organizationUserInvitations";
const MEMBERSHIP_COLLECTION = "organizationMemberships";
const AUTHORIZATION_COLLECTION = "organizationAuthorizations";
const ROLE_BUNDLE_COLLECTION = "organizationRoleBundles";
const COMMERCIAL_ACCOUNT_COLLECTION = "organizationCommercialAccounts";
const TRANSACTION_SET_LIMIT = 500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/;

export interface CP10CommandDependencies {
  /**
   * P1/P6 must supply a trusted responsibility resolver before membership deactivation is enabled.
   * The resolver is invoked inside the CP-03 command and receives the same transaction surface.
   */
  readonly resolveResponsibilities?: (
    input: Readonly<{
      organizationId: string;
      membershipId: string;
      userId: string;
      transaction: CommandTransaction;
    }>,
  ) => Promise<ResponsibilityResolution>;
}

type EntitlementGuard = Readonly<{
  path: string;
  exists: boolean;
  revision: number;
}>;

function validation(message: string, details: Record<string, string | number | boolean | null> | null = null): never {
  throw new AccelPoCommandError("validation-failure", message, details);
}

function forbidden(message: string, details: Record<string, string | number | boolean | null> | null = null): never {
  throw new AccelPoCommandError("forbidden", message, details);
}

function requiredString(payload: JsonObject, key: string, label: string): string {
  const value = payload[key];
  if (typeof value !== "string" || !value.trim()) validation(`${label} is required.`);
  return value.trim();
}

function identifier(payload: JsonObject, key: string, label: string): string {
  const value = requiredString(payload, key, label);
  if (!IDENTIFIER_PATTERN.test(value)) validation(`${label} is invalid.`);
  return value;
}

function normalizedEmail(payload: JsonObject): string {
  const value = requiredString(payload, "email", "Email").toLowerCase();
  if (!EMAIL_PATTERN.test(value) || value.length > 320) validation("Enter a valid email address.");
  return value;
}

function futureTimestamp(payload: JsonObject, key: string, label: string, now: string): string {
  const value = requiredString(payload, key, label);
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || parsed <= Date.parse(now)) {
    validation(`${label} must be in the future.`);
  }
  return new Date(parsed).toISOString();
}

function stringArray(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string" && entry.trim())) {
    throw new AccelPoCommandError("unavailable-service", `${label} is unavailable. Retry the request.`);
  }
  return Object.freeze(value.map((entry) => entry.trim()));
}

function activeMembershipCount(records: readonly Readonly<{ data: Readonly<Record<string, unknown>> | null }>[]): number {
  return records.filter((record) => record.data?.status === "active").length;
}

function liveReservationCount(
  records: readonly Readonly<{ path: string; data: Readonly<Record<string, unknown>> | null }>[],
  now: string,
): number {
  return records.filter((record) => {
    const data = record.data;
    if (!data) return false;
    return invitationReservesSeat({
      id: record.path.split("/").at(-1) ?? record.path,
      status: typeof data.status === "string" ? data.status : "",
      expiresAt: typeof data.expiresAt === "string" ? data.expiresAt : null,
    }, now);
  }).length;
}

async function readEntitlementGuard(
  context: CommandHandlerContext<JsonObject>,
): Promise<EntitlementGuard> {
  const path = entitlementGuardDocumentPath(context.actor.organizationId);
  const record: CommandRecordSnapshot = await context.transaction.get(path);
  if (!record.exists) return Object.freeze({ path, exists: false, revision: 0 });

  const organizationId = record.data?.organizationId;
  const revision = record.data?.revision;
  if (
    organizationId !== context.actor.organizationId ||
    typeof revision !== "number" ||
    !Number.isSafeInteger(revision) ||
    revision < 1
  ) {
    throw new AccelPoCommandError(
      "unavailable-service",
      "Seat coordination data is unavailable. Retry after organization access data is reconciled.",
    );
  }
  return Object.freeze({ path, exists: true, revision });
}

function bumpEntitlementGuard(
  context: CommandHandlerContext<JsonObject>,
  guard: EntitlementGuard,
): void {
  const next = guard.revision + 1;
  if (!Number.isSafeInteger(next)) {
    throw new AccelPoCommandError(
      "unavailable-service",
      "Seat coordination data is unavailable. Retry after organization access data is reconciled.",
    );
  }
  if (guard.exists) {
    context.transaction.update(guard.path, {
      organizationId: context.actor.organizationId,
      revision: next,
      updatedAt: context.now,
    });
    return;
  }
  context.transaction.create(guard.path, {
    organizationId: context.actor.organizationId,
    revision: 1,
    createdAt: context.now,
    updatedAt: context.now,
  });
}

async function organizationSeatSets(context: CommandHandlerContext<JsonObject>) {
  const [memberships, invitations] = await Promise.all([
    context.transaction.listOrganizationRecords({
      collection: MEMBERSHIP_COLLECTION,
      organizationId: context.actor.organizationId,
      limit: TRANSACTION_SET_LIMIT,
    }),
    context.transaction.listOrganizationRecords({
      collection: INVITATION_COLLECTION,
      organizationId: context.actor.organizationId,
      limit: TRANSACTION_SET_LIMIT,
    }),
  ]);
  if (memberships.length === TRANSACTION_SET_LIMIT || invitations.length === TRANSACTION_SET_LIMIT) {
    throw new AccelPoCommandError(
      "unavailable-service",
      "Seat capacity could not be verified safely. Retry after organization access data is reconciled.",
    );
  }
  return Object.freeze({ memberships, invitations });
}

async function entitlementConfiguration(context: CommandHandlerContext<JsonObject>) {
  const account = await context.transaction.get(
    `${COMMERCIAL_ACCOUNT_COLLECTION}/${context.actor.organizationId}`,
  );
  const rawKeys = account.data?.entitlementKeys;
  const keys = Array.isArray(rawKeys)
    ? rawKeys.filter((value): value is string => typeof value === "string")
    : [];
  const configuration = parseSharedSeatEntitlements(keys);
  if (!account.exists || !configuration) {
    forbidden(
      "Seat capacity is not configured for this organization.",
      { reason: "seat-entitlement-not-configured" },
    );
  }
  return configuration;
}

function seatResult(input: Readonly<{
  activeSeats: number;
  reservedSeats: number;
  includedSeats: number;
  addOnSeatAllowance: number;
  addOnPurchaseAllowed: boolean;
}>): JsonObject {
  const capacity = input.includedSeats + input.addOnSeatAllowance;
  const availableSeats = Math.max(0, capacity - input.activeSeats - input.reservedSeats);
  return Object.freeze({
    includedSeats: input.includedSeats,
    activeSeats: input.activeSeats,
    reservedSeats: input.reservedSeats,
    availableSeats,
    addOnSeatAllowance: input.addOnSeatAllowance,
    addSeatActionAllowed: input.addOnPurchaseAllowed && availableSeats === 0,
    ownerCountsAsSeat: true,
  });
}

function createInviteDefinition(): AnyCommandDefinition {
  return Object.freeze({
    name: CP10_COMMAND_NAMES.invite,
    permission: "organization.people.manage",
    idempotency: "required" as const,
    async handle(context: CommandHandlerContext<JsonObject>) {
      const email = normalizedEmail(context.command.payload);
      const roleBundleKey = identifier(context.command.payload, "roleBundleKey", "Access role");
      const expiresAt = futureTimestamp(context.command.payload, "expiresAt", "Invitation expiration", context.now);
      const invitationId = `accelpo_inv_${context.commandId.replace(/^accelpo_cmd_/, "").slice(0, 48)}`;

      // Every seat-consuming transition reads the same organization guard before any writes. A
      // concurrent invite/accept/remove changes the guard and forces Firestore to retry this work.
      const guard = await readEntitlementGuard(context);
      const existing = await context.transaction.get(`${INVITATION_COLLECTION}/${invitationId}`);
      if (existing.exists) {
        throw new AccelPoCommandError(
          "duplicate-request",
          "That invitation request has already been used.",
        );
      }

      const roleBundle = await context.transaction.get(`${ROLE_BUNDLE_COLLECTION}/${roleBundleKey}`);
      if (!roleBundle.exists || !roleBundle.data || roleBundle.data.key !== roleBundleKey) {
        validation("The selected access role is unavailable.");
      }
      const rolePermissions = stringArray(roleBundle.data.permissions, "The selected access role");
      try {
        rolePermissions.forEach((permission) => organizationPermission(permission));
      } catch {
        throw new AccelPoCommandError(
          "unavailable-service",
          "The selected access role is unavailable. Retry the request.",
        );
      }

      const { memberships, invitations } = await organizationSeatSets(context);
      const duplicatePending = invitations.some((record) => {
        const data = record.data;
        if (!data || data.email !== email) return false;
        return invitationReservesSeat({
          id: record.path.split("/").at(-1) ?? record.path,
          status: typeof data.status === "string" ? data.status : "",
          expiresAt: typeof data.expiresAt === "string" ? data.expiresAt : null,
        }, context.now);
      });
      if (duplicatePending) validation("An active invitation already exists for that email address.");

      const configuration = await entitlementConfiguration(context);
      const activeSeats = activeMembershipCount(memberships);
      const reservedSeats = liveReservationCount(invitations, context.now);
      const capacity = configuration.includedSeats + configuration.addOnSeatAllowance;
      if (activeSeats + reservedSeats >= capacity) {
        forbidden("No seats are currently available for another invitation.", {
          reason: "seat-capacity-exhausted",
          addSeatActionAllowed: configuration.addOnPurchaseAllowed,
          availableSeats: 0,
        });
      }

      bumpEntitlementGuard(context, guard);
      context.transaction.create(`${INVITATION_COLLECTION}/${invitationId}`, {
        schemaVersion: 1,
        id: invitationId,
        organizationId: context.actor.organizationId,
        email,
        invitedByUserId: context.actor.userId,
        invitedByMembershipId: context.actor.membershipId,
        roleKey: roleBundleKey,
        permissions: rolePermissions,
        status: "pending",
        createdAt: context.now,
        expiresAt,
        acceptedAt: null,
        acceptedByUserId: null,
        acceptedMembershipId: null,
        revokedAt: null,
      });

      return Object.freeze({
        data: Object.freeze({
          invitationId,
          status: "pending",
          seats: seatResult({
            activeSeats,
            reservedSeats: reservedSeats + 1,
            includedSeats: configuration.includedSeats,
            addOnSeatAllowance: configuration.addOnSeatAllowance,
            addOnPurchaseAllowed: configuration.addOnPurchaseAllowed,
          }),
        }) as JsonValue,
      });
    },
  }) as AnyCommandDefinition;
}

function revokeInvitationDefinition(): AnyCommandDefinition {
  return Object.freeze({
    name: CP10_COMMAND_NAMES.revokeInvitation,
    permission: "organization.people.manage",
    idempotency: "required" as const,
    target: (payload: JsonObject) => ({
      collection: INVITATION_COLLECTION,
      recordId: identifier(payload, "invitationId", "Invitation"),
      organizationField: "organizationId",
    }),
    async handle(context: CommandHandlerContext<JsonObject>) {
      const target = context.target?.data;
      if (!target) throw new AccelPoCommandError("not-found", "The invitation is unavailable.");
      if (target.status !== "pending") {
        validation("Only a pending invitation can be revoked.");
      }
      const guard = await readEntitlementGuard(context);
      bumpEntitlementGuard(context, guard);
      context.transaction.update(context.target!.path, {
        status: "revoked",
        revokedAt: context.now,
      });
      return Object.freeze({
        data: Object.freeze({
          invitationId: context.target!.path.split("/").at(-1) ?? context.target!.path,
          status: "revoked",
          seatReleased: true,
        }),
      });
    },
  }) as AnyCommandDefinition;
}

function deactivateMembershipDefinition(
  dependencies: CP10CommandDependencies,
): AnyCommandDefinition {
  return Object.freeze({
    name: CP10_COMMAND_NAMES.deactivateMembership,
    permission: "organization.people.manage",
    idempotency: "required" as const,
    target: (payload: JsonObject) => ({
      collection: MEMBERSHIP_COLLECTION,
      recordId: identifier(payload, "membershipId", "Team member"),
      organizationField: "organizationId",
    }),
    async handle(context: CommandHandlerContext<JsonObject>) {
      const target = context.target?.data;
      if (!target) throw new AccelPoCommandError("not-found", "The team member is unavailable.");
      if (target.status !== "active") validation("That team member is not active.");
      const userId = typeof target.userId === "string" ? target.userId : null;
      if (!userId) throw new AccelPoCommandError("unavailable-service", "Team member access data is unavailable.");
      if (userId === context.actor.userId) {
        forbidden("Use an ownership or administrator transfer flow before removing your own access.", {
          reason: "self-deactivation-not-allowed",
        });
      }

      const guard = await readEntitlementGuard(context);
      const membershipId = context.target!.path.split("/").at(-1) ?? "";
      const authorization = await context.transaction.get(`${AUTHORIZATION_COLLECTION}/${membershipId}`);
      const authorizationData = authorization.data;
      const roleKey = typeof authorizationData?.roleKey === "string" ? authorizationData.roleKey.trim() : "";
      if (
        !authorization.exists ||
        !authorizationData ||
        authorizationData.organizationId !== context.actor.organizationId ||
        authorizationData.membershipId !== membershipId ||
        authorizationData.userId !== userId ||
        !roleKey
      ) {
        throw new AccelPoCommandError(
          "unavailable-service",
          "Team member authorization data is unavailable. Reconcile access before removing this member.",
        );
      }
      const responsibilities = dependencies.resolveResponsibilities
        ? await dependencies.resolveResponsibilities({
            organizationId: context.actor.organizationId,
            membershipId,
            userId,
            transaction: context.transaction,
          })
        : Object.freeze({ kind: "unavailable" as const });
      const release = planMemberSeatRelease({ roleKey, responsibilities });
      if (release.kind === "blocked") {
        if (release.reason === "responsibility-check-unavailable") {
          throw new AccelPoCommandError(
            "unavailable-service",
            "Open responsibilities could not be verified. Reassign or resolve work before removing this member.",
            { reason: release.reason },
          );
        }
        forbidden(
          release.reason === "owner-transfer-required"
            ? "Transfer organization ownership before removing this member."
            : "Reassign or resolve this member's open work before removing access.",
          {
            reason: release.reason,
            openResponsibilityCount: release.openResponsibilityIds.length,
          },
        );
      }

      bumpEntitlementGuard(context, guard);
      context.transaction.update(context.target!.path, {
        status: "inactive",
        updatedAt: context.now,
      });
      return Object.freeze({
        data: Object.freeze({
          membershipId,
          status: "inactive",
          seatReleased: true,
        }),
      });
    },
  }) as AnyCommandDefinition;
}

export function createCP10CommandDefinitions(
  dependencies: CP10CommandDependencies = {},
): readonly AnyCommandDefinition[] {
  return Object.freeze([
    createInviteDefinition(),
    revokeInvitationDefinition(),
    deactivateMembershipDefinition(dependencies),
  ]);
}

/**
 * Adds CP-10 commands to the existing CP-03 registry. Registration is intentionally idempotent so
 * Next.js module reloads do not create a second command infrastructure.
 */
export function ensureCP10CommandRegistration(
  registry: AccelPoCommandRegistry = ACCELPO_COMMAND_REGISTRY,
  dependencies: CP10CommandDependencies = {},
): void {
  for (const definition of createCP10CommandDefinitions(dependencies)) {
    if (!registry.get(definition.name)) registry.register(definition);
  }
}
