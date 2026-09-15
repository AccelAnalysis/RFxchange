import {
  ACCELPO_COMMAND_REGISTRY,
  AccelPoCommandError,
  type AccelPoCommandRegistry,
  type AnyCommandDefinition,
  type CommandHandlerContext,
  type JsonObject,
} from "../../application/accelpo/command-port.ts";
import type { OrganizationPermission } from "../../domain/authorization/model.ts";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/;

const CP06_ATTENTION_PERMISSIONS = Object.freeze([
  "purchasing.request",
  "purchasing.approve",
  "purchasing.sourcing.view",
  "purchasing.award",
  "purchasing.order",
  "organization.people.manage",
  "purchasing.configure",
] as const satisfies readonly OrganizationPermission[]);

type CP06AttentionPermission = (typeof CP06_ATTENTION_PERMISSIONS)[number];

export const CP06_PERMISSION_COMMAND_SUFFIX: Readonly<Record<CP06AttentionPermission, string>> = Object.freeze({
  "purchasing.request": "request",
  "purchasing.approve": "approval",
  "purchasing.sourcing.view": "sourcing",
  "purchasing.award": "award",
  "purchasing.order": "order",
  "organization.people.manage": "people",
  "purchasing.configure": "configure",
});

function requiredId(payload: JsonObject, field: "notificationId" | "taskId"): string {
  const value = payload[field];
  if (typeof value !== "string" || !IDENTIFIER.test(value)) {
    throw new AccelPoCommandError("validation-failure", "The attention item is invalid.");
  }
  return value;
}

function currentVersion(context: CommandHandlerContext): number {
  if (context.currentVersion === null) {
    throw new AccelPoCommandError("version-conflict", "The attention item changed. Refresh and try again.");
  }
  return context.currentVersion;
}

function targetData(context: CommandHandlerContext): Readonly<Record<string, unknown>> {
  if (!context.target?.exists || !context.target.data) {
    throw new AccelPoCommandError("not-found", "The attention item is unavailable.");
  }
  return context.target.data;
}

function assertStoredPermission(
  context: CommandHandlerContext,
  permission: CP06AttentionPermission,
): void {
  const data = targetData(context);
  if (data.requiredPermission !== permission) {
    throw new AccelPoCommandError("forbidden", "You are not authorized to complete this item.");
  }
}

function notificationDefinition(permission: CP06AttentionPermission): AnyCommandDefinition {
  const suffix = CP06_PERMISSION_COMMAND_SUFFIX[permission];
  return Object.freeze({
    name: `accelpo.notification.read-${suffix}`,
    permission,
    idempotency: "required" as const,
    requiresExpectedVersion: true,
    target(payload: JsonObject) {
      return Object.freeze({
        collection: "accelpoNotifications",
        recordId: requiredId(payload, "notificationId"),
        organizationField: "organizationId",
        owner: Object.freeze({ field: "recipientUserId", kind: "user" as const }),
        versionField: "version",
      });
    },
    handle(context: CommandHandlerContext) {
      const data = targetData(context);
      assertStoredPermission(context, permission);
      if (data.readAt !== null && data.readAt !== undefined) {
        throw new AccelPoCommandError("validation-failure", "This notification is already read.");
      }
      const version = currentVersion(context) + 1;
      context.transaction.update(context.target!.path, Object.freeze({
        readAt: context.now,
        readByUserId: context.actor.userId,
        updatedAt: context.now,
        version,
      }));
      return Object.freeze({
        data: Object.freeze({ notificationId: requiredId(context.command.payload, "notificationId"), readAt: context.now }),
        resultingVersion: version,
      });
    },
  });
}

function taskDefinition(permission: CP06AttentionPermission): AnyCommandDefinition {
  const suffix = CP06_PERMISSION_COMMAND_SUFFIX[permission];
  return Object.freeze({
    name: `accelpo.task.complete-${suffix}`,
    permission,
    idempotency: "required" as const,
    requiresExpectedVersion: true,
    target(payload: JsonObject) {
      return Object.freeze({
        collection: "accelpoTasks",
        recordId: requiredId(payload, "taskId"),
        organizationField: "organizationId",
        owner: Object.freeze({ field: "assignedToUserId", kind: "user" as const }),
        versionField: "version",
      });
    },
    handle(context: CommandHandlerContext) {
      const data = targetData(context);
      assertStoredPermission(context, permission);
      if (data.status !== "open") {
        throw new AccelPoCommandError("validation-failure", "This task is no longer open.");
      }
      const version = currentVersion(context) + 1;
      context.transaction.update(context.target!.path, Object.freeze({
        status: "completed",
        completedAt: context.now,
        completedByUserId: context.actor.userId,
        updatedAt: context.now,
        version,
      }));
      return Object.freeze({
        data: Object.freeze({ taskId: requiredId(context.command.payload, "taskId"), completedAt: context.now }),
        resultingVersion: version,
      });
    },
  });
}

export function createCP06TaskNotificationCommandDefinitions(): readonly AnyCommandDefinition[] {
  return Object.freeze([
    ...CP06_ATTENTION_PERMISSIONS.map(notificationDefinition),
    ...CP06_ATTENTION_PERMISSIONS.map(taskDefinition),
  ]);
}

/** Idempotent composition for Next module reloads and future server entry points. */
export function registerCP06TaskNotificationCommands(
  registry: AccelPoCommandRegistry = ACCELPO_COMMAND_REGISTRY,
): void {
  for (const definition of createCP06TaskNotificationCommandDefinitions()) {
    if (!registry.get(definition.name)) registry.register(definition);
  }
}

export function isCP06AttentionPermission(value: unknown): value is CP06AttentionPermission {
  return typeof value === "string" &&
    (CP06_ATTENTION_PERMISSIONS as readonly string[]).includes(value);
}
