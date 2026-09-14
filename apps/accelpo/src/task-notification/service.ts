import type { TaskNotificationPort } from "../chassis/ports.ts";
import {
  ACCELPO_TASK_NOTIFICATION_EVENT_TYPES,
  CP06_TASK_NOTIFICATION_VERSION,
  TaskNotificationError,
  type TaskNotificationAction,
  type TaskNotificationAudienceResolver,
  type TaskNotificationDomainEvent,
  type TaskNotificationDraft,
  type TaskNotificationEventType,
  type TaskNotificationPushIntentSink,
  type TaskNotificationPublishResult,
  type TaskNotificationSafeDisplayFacts,
  type TaskNotificationStore,
} from "./contracts.ts";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/;
const MAX_AUDIENCE = 100;
const MAX_TEXT = 160;
const SAFE_FACT_KEYS = Object.freeze([
  "purchaseTitle",
  "providerName",
  "organizationDisplayName",
  "dueAt",
  "setupArea",
] as const);

type SafeFactKey = (typeof SAFE_FACT_KEYS)[number];

interface EventPolicy {
  readonly caseScoped: boolean;
  readonly action: TaskNotificationAction;
  readonly notificationRequiredPermission: string;
  readonly taskRequiredPermission: string | null;
  readonly taskRequired: boolean;
  readonly title: string;
}

export const CP06_EVENT_POLICIES: Readonly<Record<TaskNotificationEventType, EventPolicy>> = Object.freeze({
  "approval-submitted": Object.freeze({ caseScoped: true, action: "review-approval", notificationRequiredPermission: "purchasing.approve", taskRequiredPermission: "purchasing.approve", taskRequired: true, title: "Approval needed" }),
  "approval-decision": Object.freeze({ caseScoped: true, action: "view-decision", notificationRequiredPermission: "purchasing.request", taskRequiredPermission: null, taskRequired: false, title: "Approval updated" }),
  disapproval: Object.freeze({ caseScoped: true, action: "revise-request", notificationRequiredPermission: "purchasing.request", taskRequiredPermission: "purchasing.request", taskRequired: true, title: "Purchase needs attention" }),
  "revision-requested": Object.freeze({ caseScoped: true, action: "revise-request", notificationRequiredPermission: "purchasing.request", taskRequiredPermission: "purchasing.request", taskRequired: true, title: "Revision requested" }),
  "offer-review": Object.freeze({ caseScoped: true, action: "review-offers", notificationRequiredPermission: "purchasing.sourcing.view", taskRequiredPermission: "purchasing.sourcing.view", taskRequired: true, title: "Offers ready to review" }),
  "award-ready": Object.freeze({ caseScoped: true, action: "award-provider", notificationRequiredPermission: "purchasing.award", taskRequiredPermission: "purchasing.award", taskRequired: true, title: "Supplier selection ready" }),
  "fulfillment-exception": Object.freeze({ caseScoped: true, action: "resolve-fulfillment", notificationRequiredPermission: "purchasing.order", taskRequiredPermission: "purchasing.order", taskRequired: true, title: "Delivery needs attention" }),
  "receiving-due": Object.freeze({ caseScoped: true, action: "confirm-receipt", notificationRequiredPermission: "purchasing.request", taskRequiredPermission: "purchasing.request", taskRequired: true, title: "Confirm receipt" }),
  "evidence-due": Object.freeze({ caseScoped: true, action: "add-evidence", notificationRequiredPermission: "purchasing.request", taskRequiredPermission: "purchasing.request", taskRequired: true, title: "Purchase documentation due" }),
  "evidence-correction": Object.freeze({ caseScoped: true, action: "correct-evidence", notificationRequiredPermission: "purchasing.request", taskRequiredPermission: "purchasing.request", taskRequired: true, title: "Update purchase documentation" }),
  invitation: Object.freeze({ caseScoped: false, action: "review-invitation", notificationRequiredPermission: "organization.people.manage", taskRequiredPermission: null, taskRequired: false, title: "Invitation activity" }),
  "seat-capacity": Object.freeze({ caseScoped: false, action: "manage-seats", notificationRequiredPermission: "organization.people.manage", taskRequiredPermission: "organization.people.manage", taskRequired: true, title: "Seat capacity reached" }),
  "setup-incomplete": Object.freeze({ caseScoped: false, action: "finish-setup", notificationRequiredPermission: "purchasing.configure", taskRequiredPermission: "purchasing.configure", taskRequired: true, title: "Finish organization setup" }),
});

function invalid(message: string): never {
  throw new TaskNotificationError("invalid-event", message);
}

function requiredIdentifier(value: unknown, label: string): string {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) invalid(`${label} is invalid.`);
  return value;
}

function normalizedText(value: unknown, label: string): string | null {
  if (value == null) return null;
  if (typeof value !== "string") invalid(`${label} is invalid.`);
  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_TEXT) invalid(`${label} is invalid.`);
  return normalized;
}

function iso(value: unknown, label: string): string {
  if (typeof value !== "string") invalid(`${label} is invalid.`);
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) invalid(`${label} is invalid.`);
  return new Date(parsed).toISOString();
}

function safeFacts(value: unknown): TaskNotificationSafeDisplayFacts {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid("Safe display facts are required.");
  const record = value as Readonly<Record<string, unknown>>;
  const unknown = Object.keys(record).filter((key) => !(SAFE_FACT_KEYS as readonly string[]).includes(key));
  if (unknown.length > 0) invalid("The event contains unsupported display facts.");
  const output: Partial<Record<SafeFactKey, string | null>> = {};
  for (const key of SAFE_FACT_KEYS) {
    if (!(key in record)) continue;
    output[key] = key === "dueAt" && record[key] != null
      ? iso(record[key], "Due date")
      : normalizedText(record[key], "Display fact");
  }
  return Object.freeze(output);
}

function audienceIds(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_AUDIENCE) {
    invalid(`${label} is invalid.`);
  }
  const ids = value.map((entry) => requiredIdentifier(entry, label));
  return Object.freeze([...new Set(ids)].sort());
}

function expectedDeepLink(
  policy: EventPolicy,
  organizationId: string,
  purchaseCaseId: string | null,
): string {
  const query = new URLSearchParams({ organization: organizationId, action: policy.action }).toString();
  return policy.caseScoped && purchaseCaseId
    ? `/purchases/${encodeURIComponent(purchaseCaseId)}?${query}`
    : `/organization?${query}`;
}

function normalizeEvent(input: unknown): TaskNotificationDomainEvent {
  if (!input || typeof input !== "object" || Array.isArray(input)) invalid("A committed domain event is required.");
  const record = input as Readonly<Record<string, unknown>>;
  const eventType = record.eventType;
  if (typeof eventType !== "string" || !(ACCELPO_TASK_NOTIFICATION_EVENT_TYPES as readonly string[]).includes(eventType)) {
    invalid("Event type is invalid.");
  }
  const policy = CP06_EVENT_POLICIES[eventType as TaskNotificationEventType];
  const eventId = requiredIdentifier(record.eventId, "Event identity");
  const organizationId = requiredIdentifier(record.organizationId, "Organization identity");
  const purchaseCaseId = record.purchaseCaseId == null ? null : requiredIdentifier(record.purchaseCaseId, "Purchase Case identity");
  if (policy.caseScoped !== Boolean(purchaseCaseId)) invalid("Purchase Case scope does not match the event type.");

  const actorValue = record.actor;
  if (!actorValue || typeof actorValue !== "object" || Array.isArray(actorValue)) invalid("Event actor is invalid.");
  const actorRecord = actorValue as Readonly<Record<string, unknown>>;
  const actor = actorRecord.kind === "system"
    ? Object.freeze({ kind: "system" as const, userId: null, membershipId: null })
    : actorRecord.kind === "user"
      ? Object.freeze({
          kind: "user" as const,
          userId: requiredIdentifier(actorRecord.userId, "Actor user identity"),
          membershipId: requiredIdentifier(actorRecord.membershipId, "Actor membership identity"),
        })
      : invalid("Event actor is invalid.");

  if (record.permittedAction !== policy.action) invalid("Permitted action does not match the event type.");
  const deepLinkTarget = normalizedText(record.deepLinkTarget, "Deep link");
  if (!deepLinkTarget || deepLinkTarget !== expectedDeepLink(policy, organizationId, purchaseCaseId)) {
    invalid("Deep link does not match the event scope.");
  }

  const audienceValue = record.audience;
  if (!audienceValue || typeof audienceValue !== "object" || Array.isArray(audienceValue)) invalid("Event audience is invalid.");
  const audienceRecord = audienceValue as Readonly<Record<string, unknown>>;
  const notificationRecipientUserIds = audienceIds(audienceRecord.notificationRecipientUserIds, "Notification recipients");
  const taskAssigneeUserIds = audienceRecord.taskAssigneeUserIds == null
    ? Object.freeze([] as string[])
    : audienceIds(audienceRecord.taskAssigneeUserIds, "Task assignees");
  if (policy.taskRequired && taskAssigneeUserIds.length === 0) invalid("This event requires an assigned task.");
  if (!policy.taskRequired && taskAssigneeUserIds.length > 0) invalid("This event does not create a task.");

  return Object.freeze({
    eventId,
    eventType: eventType as TaskNotificationEventType,
    organizationId,
    purchaseCaseId,
    actor,
    timestamp: iso(record.timestamp, "Event timestamp"),
    safeDisplayFacts: safeFacts(record.safeDisplayFacts),
    permittedAction: policy.action,
    deepLinkTarget,
    audience: Object.freeze({ notificationRecipientUserIds, taskAssigneeUserIds }),
  });
}

function subject(event: TaskNotificationDomainEvent): string {
  return event.safeDisplayFacts.purchaseTitle ?? "This purchase";
}

function bodyFor(event: TaskNotificationDomainEvent): string {
  switch (event.eventType) {
    case "approval-submitted": return `${subject(event)} is ready for review.`;
    case "approval-decision": return `${subject(event)} has an approval decision.`;
    case "disapproval": return `${subject(event)} was not approved.`;
    case "revision-requested": return `${subject(event)} needs changes before it can continue.`;
    case "offer-review": return `${subject(event)} has offers ready to review.`;
    case "award-ready": return `${subject(event)} is ready for supplier selection.`;
    case "fulfillment-exception": return `${subject(event)} has a delivery issue to resolve.`;
    case "receiving-due": return `${subject(event)} is ready for receipt confirmation.`;
    case "evidence-due": return `${subject(event)} needs purchase documentation.`;
    case "evidence-correction": return `${subject(event)} needs updated purchase documentation.`;
    case "invitation": return `${event.safeDisplayFacts.organizationDisplayName ?? "Your organization"} has an invitation update.`;
    case "seat-capacity": return "Your organization has reached its current seat capacity.";
    case "setup-incomplete": return `${event.safeDisplayFacts.setupArea ?? "Organization setup"} needs attention.`;
  }
}

function notificationDrafts(event: TaskNotificationDomainEvent, recipients: readonly string[]): readonly TaskNotificationDraft[] {
  const policy = CP06_EVENT_POLICIES[event.eventType];
  return Object.freeze(recipients.map((recipientUserId) => Object.freeze({
    kind: "notification" as const,
    recipientUserId,
    eventType: event.eventType,
    purchaseCaseId: event.purchaseCaseId ?? null,
    title: policy.title,
    body: bodyFor(event),
    dueAt: event.safeDisplayFacts.dueAt ?? null,
    permittedAction: policy.action,
    deepLink: event.deepLinkTarget,
    requiredPermission: policy.notificationRequiredPermission,
  })));
}

function taskDrafts(event: TaskNotificationDomainEvent, assignees: readonly string[]): readonly TaskNotificationDraft[] {
  const policy = CP06_EVENT_POLICIES[event.eventType];
  if (!policy.taskRequired || !policy.taskRequiredPermission) return Object.freeze([]);
  return Object.freeze(assignees.map((recipientUserId) => Object.freeze({
    kind: "task" as const,
    recipientUserId,
    eventType: event.eventType,
    purchaseCaseId: event.purchaseCaseId ?? null,
    title: policy.title,
    body: bodyFor(event),
    dueAt: event.safeDisplayFacts.dueAt ?? null,
    permittedAction: policy.action,
    deepLink: event.deepLinkTarget,
    requiredPermission: policy.taskRequiredPermission,
  })));
}

export class TaskNotificationService {
  private readonly audience: TaskNotificationAudienceResolver;
  private readonly store: TaskNotificationStore;
  private readonly push: TaskNotificationPushIntentSink | null;

  constructor(input: Readonly<{
    audience: TaskNotificationAudienceResolver;
    store: TaskNotificationStore;
    push?: TaskNotificationPushIntentSink | null;
  }>) {
    this.audience = input.audience;
    this.store = input.store;
    this.push = input.push ?? null;
  }

  async publish(input: unknown): Promise<TaskNotificationPublishResult> {
    const event = normalizeEvent(input);
    const policy = CP06_EVENT_POLICIES[event.eventType];
    const verified = await this.audience.resolve({
      event,
      notificationRequiredPermission: policy.notificationRequiredPermission,
      taskRequiredPermission: policy.taskRequiredPermission,
    });
    const notifications = notificationDrafts(event, verified.notificationRecipientUserIds);
    const tasks = taskDrafts(event, verified.taskAssigneeUserIds);
    const drafts = Object.freeze([...notifications, ...tasks]);
    let committed;
    try {
      committed = await this.store.commit({ event, drafts });
    } catch (error) {
      if (error instanceof TaskNotificationError) throw error;
      throw new TaskNotificationError("unavailable-service", "Task and notification delivery is temporarily unavailable.");
    }

    if (committed.status === "committed" && this.push) {
      const notificationIds = committed.notificationIds;
      await Promise.all(notifications.map(async (notification, index) => {
        const notificationId = notificationIds[index];
        if (!notificationId) return;
        try {
          await this.push?.enqueue(Object.freeze({
            notificationId,
            eventId: event.eventId,
            eventType: event.eventType,
            organizationId: event.organizationId,
            recipientUserId: notification.recipientUserId,
            title: notification.title,
            body: notification.body,
            deepLink: notification.deepLink,
          }));
        } catch {
          // Push is optional attention. The durable in-app notification remains source of truth.
        }
      }));
    }

    return Object.freeze({
      taskNotificationVersion: CP06_TASK_NOTIFICATION_VERSION,
      eventId: event.eventId,
      status: committed.status,
      replayed: committed.status === "replayed",
      notificationIds: Object.freeze([...committed.notificationIds]),
      taskIds: Object.freeze([...committed.taskIds]),
    });
  }
}

export function normalizeTaskNotificationEvent(input: unknown): TaskNotificationDomainEvent {
  return normalizeEvent(input);
}

/** Adapter for the chassis' fire-and-confirm TaskNotification port contract. */
export function createTaskNotificationPort(
  service: TaskNotificationService,
): TaskNotificationPort<unknown> {
  return Object.freeze({
    async publish(event: unknown): Promise<void> {
      await service.publish(event);
    },
  });
}
