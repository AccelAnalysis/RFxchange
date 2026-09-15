import type { AccelPOPartContract } from "../chassis/ports.ts";
import type { AccelPOPartRegistry } from "../chassis/registry.ts";
import { ACCELPO_CONNECTION_POINTS } from "../chassis/ports.ts";
import { ACCELPO_TASK_NOTIFICATION_EVENT_TYPES } from "./contracts.ts";

export const CP06_NOTIFICATION_READ_COMMANDS = Object.freeze([
  "accelpo.notification.read-request",
  "accelpo.notification.read-approval",
  "accelpo.notification.read-sourcing",
  "accelpo.notification.read-award",
  "accelpo.notification.read-order",
  "accelpo.notification.read-people",
  "accelpo.notification.read-configure",
] as const);

export const CP06_TASK_COMPLETE_COMMANDS = Object.freeze([
  "accelpo.task.complete-request",
  "accelpo.task.complete-approval",
  "accelpo.task.complete-sourcing",
  "accelpo.task.complete-award",
  "accelpo.task.complete-order",
  "accelpo.task.complete-people",
  "accelpo.task.complete-configure",
] as const);

export const CP06_TASK_NOTIFICATION_COMMANDS = Object.freeze([
  ...CP06_NOTIFICATION_READ_COMMANDS,
  ...CP06_TASK_COMPLETE_COMMANDS,
] as const);

export const CP06_TASK_NOTIFICATION_QUERIES = Object.freeze([
  "task-summary",
  "notification-summary",
] as const);

export const CP06_TASK_NOTIFICATION_PART: AccelPOPartContract = Object.freeze({
  id: "CP-06-task-notification",
  routes: Object.freeze([]),
  permissions: Object.freeze([
    "purchasing.request",
    "purchasing.approve",
    "purchasing.sourcing.view",
    "purchasing.award",
    "purchasing.order",
    "organization.people.manage",
    "purchasing.configure",
  ]),
  connectionPoints: Object.freeze([
    ACCELPO_CONNECTION_POINTS.CP_01_IDENTITY_CONTEXT,
    ACCELPO_CONNECTION_POINTS.CP_03_COMMAND_PORT,
    ACCELPO_CONNECTION_POINTS.CP_04_QUERY_PROJECTION,
    ACCELPO_CONNECTION_POINTS.CP_06_TASK_NOTIFICATION,
  ]),
});

export function registerCP06TaskNotification(registry: AccelPOPartRegistry): void {
  registry.register(CP06_TASK_NOTIFICATION_PART);
}

export const CP06_TASK_NOTIFICATION_REGISTRATION = Object.freeze({
  partId: CP06_TASK_NOTIFICATION_PART.id,
  events: ACCELPO_TASK_NOTIFICATION_EVENT_TYPES,
  commands: CP06_TASK_NOTIFICATION_COMMANDS,
  queries: CP06_TASK_NOTIFICATION_QUERIES,
  ownedCollections: Object.freeze([
    "accelpoTaskNotificationEvents",
    "accelpoTasks",
    "accelpoNotifications",
  ]),
  externalPorts: Object.freeze(["optional-push-intent"]),
});
