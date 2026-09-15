import assert from "node:assert/strict";
import test from "node:test";

import {
  ACCELPO_TASK_NOTIFICATION_EVENT_TYPES,
  TaskNotificationError,
} from "../apps/accelpo/src/task-notification/contracts.ts";
import {
  CP06_EVENT_POLICIES,
  TaskNotificationService,
} from "../apps/accelpo/src/task-notification/service.ts";
import {
  commandNameForAttentionAction,
  loadDurableAttentionCounts,
  syncDurableAttentionBadge,
} from "../apps/accelpo/src/task-notification/attention.ts";
import {
  CP06_TASK_NOTIFICATION_PART,
  CP06_TASK_NOTIFICATION_REGISTRATION,
} from "../apps/accelpo/src/task-notification/part.ts";
import { createAccelPOPartRegistry } from "../apps/accelpo/src/chassis/registry.ts";
import {
  AccelPoCommandError,
  AccelPoCommandRegistry,
} from "../src/application/accelpo/command-port.ts";
import {
  createCP06TaskNotificationCommandDefinitions,
  registerCP06TaskNotificationCommands,
} from "../src/accelpo/cp06/commands.ts";

const baseEvent = Object.freeze({
  eventId: "evt-approval-001",
  eventType: "approval-submitted",
  organizationId: "org-alpha",
  purchaseCaseId: "case-one",
  actor: Object.freeze({ kind: "user", userId: "requester-one", membershipId: "membership-requester" }),
  timestamp: "2026-09-14T18:00:00.000Z",
  safeDisplayFacts: Object.freeze({ purchaseTitle: "Laptop stands", dueAt: "2026-09-16T17:00:00.000Z" }),
  permittedAction: "review-approval",
  deepLinkTarget: "/purchases/case-one?organization=org-alpha&action=review-approval",
  audience: Object.freeze({
    notificationRecipientUserIds: Object.freeze(["approver-one"]),
    taskAssigneeUserIds: Object.freeze(["approver-one"]),
  }),
});

class MemoryStore {
  constructor() {
    this.events = new Map();
    this.commits = 0;
  }

  async commit(input) {
    const prior = this.events.get(input.event.eventId);
    if (prior) {
      assert.deepEqual(input.drafts, prior.drafts);
      return Object.freeze({ status: "replayed", notificationIds: prior.notificationIds, taskIds: prior.taskIds });
    }
    this.commits += 1;
    const notificationIds = Object.freeze(input.drafts.filter((draft) => draft.kind === "notification").map((draft, index) => `notification-${index}-${draft.recipientUserId}`));
    const taskIds = Object.freeze(input.drafts.filter((draft) => draft.kind === "task").map((draft, index) => `task-${index}-${draft.recipientUserId}`));
    this.events.set(input.event.eventId, Object.freeze({ drafts: input.drafts, notificationIds, taskIds }));
    return Object.freeze({ status: "committed", notificationIds, taskIds });
  }
}

function acceptingAudience() {
  return Object.freeze({
    async resolve({ event, notificationRequiredPermission, taskRequiredPermission }) {
      assert.equal(notificationRequiredPermission, CP06_EVENT_POLICIES[event.eventType].notificationRequiredPermission);
      assert.equal(taskRequiredPermission, CP06_EVENT_POLICIES[event.eventType].taskRequiredPermission);
      return Object.freeze({
        notificationRecipientUserIds: event.audience.notificationRecipientUserIds,
        taskAssigneeUserIds: event.audience.taskAssigneeUserIds ?? Object.freeze([]),
      });
    },
  });
}

test("CP-06 is registered with the existing chassis and consumes CP-03/CP-04 rather than adding a route", () => {
  const registry = createAccelPOPartRegistry();
  assert.deepEqual(registry.get(CP06_TASK_NOTIFICATION_PART.id), CP06_TASK_NOTIFICATION_PART);
  assert.deepEqual(CP06_TASK_NOTIFICATION_PART.routes, []);
  assert.ok(CP06_TASK_NOTIFICATION_PART.connectionPoints.includes("CommandPort"));
  assert.ok(CP06_TASK_NOTIFICATION_PART.connectionPoints.includes("QueryProjection"));
  assert.deepEqual(CP06_TASK_NOTIFICATION_REGISTRATION.queries, ["task-summary", "notification-summary"]);
});

test("the CP-06 event catalog covers the required attention events", () => {
  assert.deepEqual(ACCELPO_TASK_NOTIFICATION_EVENT_TYPES, [
    "approval-submitted", "approval-decision", "disapproval", "revision-requested",
    "offer-review", "award-ready", "fulfillment-exception", "receiving-due",
    "evidence-due", "evidence-correction", "invitation", "seat-capacity", "setup-incomplete",
  ]);
  for (const eventType of ACCELPO_TASK_NOTIFICATION_EVENT_TYPES) assert.ok(CP06_EVENT_POLICIES[eventType]);
});

test("a committed event creates a durable notification and a separate task with display-safe fields", async () => {
  const store = new MemoryStore();
  const service = new TaskNotificationService({ audience: acceptingAudience(), store });
  const result = await service.publish(baseEvent);
  assert.equal(result.status, "committed");
  assert.equal(result.notificationIds.length, 1);
  assert.equal(result.taskIds.length, 1);

  const drafts = store.events.get(baseEvent.eventId).drafts;
  const notification = drafts.find((draft) => draft.kind === "notification");
  const task = drafts.find((draft) => draft.kind === "task");
  assert.equal(notification.requiredPermission, "purchasing.approve");
  assert.equal(task.requiredPermission, "purchasing.approve");
  assert.equal(notification.deepLink, "/purchases/case-one?organization=org-alpha&action=review-approval");
  assert.equal(task.deepLink, "/purchases/case-one?organization=org-alpha&action=review-approval");
  assert.doesNotMatch(JSON.stringify(drafts), /budget|receipt|approvalNote|fileUrl/i);
});

test("duplicate domain event delivery replays without creating duplicate tasks or notifications", async () => {
  const store = new MemoryStore();
  const service = new TaskNotificationService({ audience: acceptingAudience(), store });
  const first = await service.publish(baseEvent);
  const replay = await service.publish(baseEvent);
  assert.equal(first.status, "committed");
  assert.equal(replay.status, "replayed");
  assert.deepEqual(replay.taskIds, first.taskIds);
  assert.deepEqual(replay.notificationIds, first.notificationIds);
  assert.equal(store.commits, 1);
});

test("private or mismatched event payloads are rejected before persistence", async () => {
  const service = new TaskNotificationService({ audience: acceptingAudience(), store: new MemoryStore() });
  await assert.rejects(
    () => service.publish({ ...baseEvent, safeDisplayFacts: { ...baseEvent.safeDisplayFacts, budgetAmount: 4000 } }),
    (error) => error instanceof TaskNotificationError && error.code === "invalid-event",
  );
  await assert.rejects(
    () => service.publish({ ...baseEvent, deepLinkTarget: "/purchases/another-case?organization=org-alpha&action=review-approval" }),
    (error) => error instanceof TaskNotificationError && error.code === "invalid-event",
  );
  await assert.rejects(
    () => service.publish({ ...baseEvent, permittedAction: "award-provider" }),
    (error) => error instanceof TaskNotificationError && error.code === "invalid-event",
  );
});

test("CP-06 permission-specific commands cannot use a weaker command to complete stronger work", async () => {
  const definitions = createCP06TaskNotificationCommandDefinitions();
  const approval = definitions.find((definition) => definition.name === "accelpo.task.complete-approval");
  const request = definitions.find((definition) => definition.name === "accelpo.task.complete-request");
  assert.ok(approval);
  assert.ok(request);
  assert.equal(approval.permission, "purchasing.approve");
  assert.equal(approval.target({ taskId: "task-one" }).owner.field, "assignedToUserId");
  assert.equal(approval.target({ taskId: "task-one" }).versionField, "version");

  const updates = [];
  const context = {
    command: {
      commandName: approval.name,
      organizationContext: { organizationId: "org-alpha" },
      payload: { taskId: "task-one" },
      expectedVersion: 1,
      idempotencyKey: "complete-task-one",
      requestId: "request-task-one",
      actor: { userId: "approver-one", membershipId: "membership-approver", organizationId: "org-alpha" },
    },
    commandId: "command-one",
    actor: { userId: "approver-one", membershipId: "membership-approver", organizationId: "org-alpha" },
    permission: "purchasing.approve",
    target: {
      path: "accelpoTasks/task-one",
      exists: true,
      data: { organizationId: "org-alpha", assignedToUserId: "approver-one", requiredPermission: "purchasing.approve", status: "open", version: 1 },
    },
    currentVersion: 1,
    now: "2026-09-14T19:00:00.000Z",
    transaction: {
      get: async () => ({ path: "", exists: false, data: null }),
      create: () => {},
      set: () => {},
      update: (path, data) => updates.push({ path, data }),
    },
  };

  const outcome = await approval.handle(context);
  assert.equal(outcome.resultingVersion, 2);
  assert.equal(updates[0].path, "accelpoTasks/task-one");
  assert.equal(updates[0].data.status, "completed");

  assert.throws(
    () => request.handle({ ...context, permission: "purchasing.request", command: { ...context.command, commandName: request.name } }),
    (error) => error instanceof AccelPoCommandError && error.code === "forbidden",
  );
});

test("reading a notification changes only that notification; it does not complete a task", async () => {
  const definition = createCP06TaskNotificationCommandDefinitions().find((item) => item.name === "accelpo.notification.read-approval");
  assert.ok(definition);
  assert.equal(definition.target({ notificationId: "notification-one" }).owner.field, "recipientUserId");

  const updates = [];
  await definition.handle({
    command: {
      commandName: definition.name,
      organizationContext: { organizationId: "org-alpha" },
      payload: { notificationId: "notification-one" },
      expectedVersion: 1,
      idempotencyKey: "read-notification-one",
      requestId: "request-notification-one",
      actor: { userId: "approver-one", membershipId: "membership-approver", organizationId: "org-alpha" },
    },
    commandId: "command-notification-one",
    actor: { userId: "approver-one", membershipId: "membership-approver", organizationId: "org-alpha" },
    permission: "purchasing.approve",
    target: {
      path: "accelpoNotifications/notification-one",
      exists: true,
      data: { organizationId: "org-alpha", recipientUserId: "approver-one", requiredPermission: "purchasing.approve", readAt: null, version: 1 },
    },
    currentVersion: 1,
    now: "2026-09-14T19:00:00.000Z",
    transaction: {
      get: async () => ({ path: "", exists: false, data: null }),
      create: () => {},
      set: () => {},
      update: (path, data) => updates.push({ path, data }),
    },
  });
  assert.equal(updates.length, 1);
  assert.equal(updates[0].path, "accelpoNotifications/notification-one");
  assert.equal(updates[0].data.readAt, "2026-09-14T19:00:00.000Z");
  assert.equal("status" in updates[0].data, false);
});

test("CP-06 commands register idempotently into the one CP-03 registry", () => {
  const registry = new AccelPoCommandRegistry();
  registerCP06TaskNotificationCommands(registry);
  const firstCount = registry.list().length;
  registerCP06TaskNotificationCommands(registry);
  assert.equal(registry.list().length, firstCount);
  assert.equal(firstCount, CP06_TASK_NOTIFICATION_REGISTRATION.commands.length);
});

test("Home/Tasks/PWA counts are derived from durable CP-04 projections", async () => {
  const port = {
    async read({ query }) {
      if (query.projection === "task-summary") {
        assert.equal(query.filters[0].field, "status");
        return {
          outcome: "success", projection: "task-summary", nextCursor: null,
          items: [
            { id: "task-1", purchaseCaseId: "case-one", type: "approval-submitted", title: "Approval needed", summary: null, status: "open", dueAt: null, permittedAction: "review-approval", deepLink: "/purchases/case-one", createdAt: "2026-09-14T18:00:00.000Z" },
            { id: "task-2", purchaseCaseId: "case-two", type: "receiving-due", title: "Confirm receipt", summary: null, status: "open", dueAt: null, permittedAction: "confirm-receipt", deepLink: "/purchases/case-two", createdAt: "2026-09-14T18:01:00.000Z" },
          ],
        };
      }
      return {
        outcome: "success", projection: "notification-summary", nextCursor: null,
        items: [
          { id: "n-1", purchaseCaseId: "case-one", type: "approval-submitted", title: "Approval needed", body: null, readAt: null, permittedAction: "review-approval", deepLink: "/purchases/case-one", createdAt: "2026-09-14T18:00:00.000Z" },
          { id: "n-2", purchaseCaseId: "case-two", type: "approval-decision", title: "Approval updated", body: null, readAt: "2026-09-14T18:05:00.000Z", permittedAction: "view-decision", deepLink: "/purchases/case-two", createdAt: "2026-09-14T18:02:00.000Z" },
        ],
      };
    },
  };
  const counts = await loadDurableAttentionCounts(port, "org-alpha");
  assert.deepEqual(counts, { openTasks: 2, unreadNotifications: 1, badgeCount: 3 });
  assert.equal(commandNameForAttentionAction("task", "review-approval"), "accelpo.task.complete-approval");

  const badgeCalls = [];
  await syncDurableAttentionBadge(counts, { setAppBadge: async (value) => badgeCalls.push(value) });
  assert.deepEqual(badgeCalls, [3]);
});
