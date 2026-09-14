/**
 * CP-06 TaskNotification contracts.
 *
 * Domain producers publish only display-safe facts. Durable task/notification projections remain
 * organization-scoped and are read through CP-04; completion/read writes are performed through CP-03.
 */

export const CP06_TASK_NOTIFICATION_VERSION = 1 as const;

export const ACCELPO_TASK_NOTIFICATION_EVENT_TYPES = Object.freeze([
  "approval-submitted",
  "approval-decision",
  "disapproval",
  "revision-requested",
  "offer-review",
  "award-ready",
  "fulfillment-exception",
  "receiving-due",
  "evidence-due",
  "evidence-correction",
  "invitation",
  "seat-capacity",
  "setup-incomplete",
] as const);

export type TaskNotificationEventType = (typeof ACCELPO_TASK_NOTIFICATION_EVENT_TYPES)[number];

export const ACCELPO_TASK_NOTIFICATION_ACTIONS = Object.freeze([
  "review-approval",
  "view-decision",
  "revise-request",
  "review-offers",
  "award-provider",
  "resolve-fulfillment",
  "confirm-receipt",
  "add-evidence",
  "correct-evidence",
  "review-invitation",
  "manage-seats",
  "finish-setup",
] as const);

export type TaskNotificationAction = (typeof ACCELPO_TASK_NOTIFICATION_ACTIONS)[number];

/** Deliberately narrow allowlist. Amounts, budgets, notes, receipts, and file references are absent. */
export interface TaskNotificationSafeDisplayFacts {
  readonly purchaseTitle?: string | null;
  readonly providerName?: string | null;
  readonly organizationDisplayName?: string | null;
  readonly dueAt?: string | null;
  readonly setupArea?: string | null;
}

export type TaskNotificationActor =
  | Readonly<{
      readonly kind: "system";
      readonly userId?: null;
      readonly membershipId?: null;
    }>
  | Readonly<{
      readonly kind: "user";
      readonly userId: string;
      readonly membershipId: string;
    }>;

export interface TaskNotificationAudience {
  /** Existing-account user IDs. Invitation email delivery remains outside CP-06. */
  readonly notificationRecipientUserIds: readonly string[];
  readonly taskAssigneeUserIds?: readonly string[];
}

export interface TaskNotificationDomainEvent {
  readonly eventId: string;
  readonly eventType: TaskNotificationEventType;
  readonly organizationId: string;
  readonly purchaseCaseId?: string | null;
  readonly actor: TaskNotificationActor;
  readonly timestamp: string;
  readonly safeDisplayFacts: TaskNotificationSafeDisplayFacts;
  readonly permittedAction: TaskNotificationAction;
  readonly deepLinkTarget: string;
  readonly audience: TaskNotificationAudience;
}

export interface VerifiedTaskNotificationAudience {
  readonly notificationRecipientUserIds: readonly string[];
  readonly taskAssigneeUserIds: readonly string[];
}

export interface TaskNotificationDraft {
  readonly kind: "notification" | "task";
  readonly recipientUserId: string;
  readonly eventType: TaskNotificationEventType;
  readonly purchaseCaseId: string | null;
  readonly title: string;
  readonly body: string;
  readonly dueAt: string | null;
  readonly permittedAction: TaskNotificationAction;
  readonly deepLink: string;
  readonly requiredPermission: string | null;
}

export interface TaskNotificationCommitResult {
  readonly status: "committed" | "replayed";
  readonly notificationIds: readonly string[];
  readonly taskIds: readonly string[];
}

export interface TaskNotificationPublishResult extends TaskNotificationCommitResult {
  readonly taskNotificationVersion: typeof CP06_TASK_NOTIFICATION_VERSION;
  readonly eventId: string;
  readonly replayed: boolean;
}

export interface TaskNotificationAudienceResolver {
  resolve(input: Readonly<{
    event: TaskNotificationDomainEvent;
    notificationRequiredPermission: string;
    taskRequiredPermission: string | null;
  }>): Promise<VerifiedTaskNotificationAudience>;
}

export interface TaskNotificationStore {
  commit(input: Readonly<{
    event: TaskNotificationDomainEvent;
    drafts: readonly TaskNotificationDraft[];
  }>): Promise<TaskNotificationCommitResult>;
}

export interface TaskNotificationPushIntent {
  readonly notificationId: string;
  readonly eventId: string;
  readonly eventType: TaskNotificationEventType;
  readonly organizationId: string;
  readonly recipientUserId: string;
  readonly title: string;
  readonly body: string;
  readonly deepLink: string;
}

export interface TaskNotificationPushIntentSink {
  enqueue(intent: TaskNotificationPushIntent): Promise<void>;
}

export type TaskNotificationErrorCode =
  | "invalid-event"
  | "audience-forbidden"
  | "event-conflict"
  | "unavailable-service";

export class TaskNotificationError extends Error {
  readonly code: TaskNotificationErrorCode;

  constructor(code: TaskNotificationErrorCode, message: string) {
    super(message);
    this.name = "TaskNotificationError";
    this.code = code;
  }
}
