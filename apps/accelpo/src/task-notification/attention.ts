import type { TaskNotificationAction } from "./contracts.ts";
import type {
  NotificationSummaryProjection,
  QueryProjectionPortImplementation,
  QueryProjectionResult,
  TaskSummaryProjection,
} from "../query-projection/contracts.ts";

export interface DurableAttentionCounts {
  readonly openTasks: number;
  readonly unreadNotifications: number;
  readonly badgeCount: number;
}

async function pageThrough(
  port: QueryProjectionPortImplementation,
  organizationId: string,
  projection: "task-summary" | "notification-summary",
  filters: readonly Readonly<{ field: string; operator: "=="; value: string }>[] = [],
): Promise<readonly (TaskSummaryProjection | NotificationSummaryProjection)[]> {
  const items: (TaskSummaryProjection | NotificationSummaryProjection)[] = [];
  let cursor: string | null = null;
  const seen = new Set<string>();

  do {
    const result: QueryProjectionResult = await port.read({
      requestedOrganizationId: organizationId,
      query: Object.freeze({ projection, scope: "list" as const, filters, cursor, limit: 100 }),
    });
    if (result.outcome === "failure") throw new Error(result.message);
    items.push(...result.items as readonly (TaskSummaryProjection | NotificationSummaryProjection)[]);
    cursor = result.nextCursor;
    if (cursor && seen.has(cursor)) throw new Error("Attention count pagination did not advance.");
    if (cursor) seen.add(cursor);
  } while (cursor);

  return Object.freeze(items);
}

/** Counts are derived only from durable CP-04 projections, never transient browser events. */
export async function loadDurableAttentionCounts(
  port: QueryProjectionPortImplementation,
  organizationId: string,
): Promise<DurableAttentionCounts> {
  const [tasks, notifications] = await Promise.all([
    pageThrough(port, organizationId, "task-summary", Object.freeze([
      Object.freeze({ field: "status", operator: "==" as const, value: "open" }),
    ])),
    pageThrough(port, organizationId, "notification-summary"),
  ]);
  const openTasks = tasks.filter((item): item is TaskSummaryProjection => "status" in item && item.status === "open").length;
  const unreadNotifications = notifications.filter((item): item is NotificationSummaryProjection => "readAt" in item && item.readAt === null).length;
  return Object.freeze({ openTasks, unreadNotifications, badgeCount: openTasks + unreadNotifications });
}

interface BadgeNavigator {
  readonly setAppBadge?: (contents?: number) => Promise<void>;
  readonly clearAppBadge?: () => Promise<void>;
}

/** Best-effort PWA badge synchronization. The durable counts remain authoritative if unsupported. */
export async function syncDurableAttentionBadge(
  counts: DurableAttentionCounts,
  navigatorLike: BadgeNavigator | null | undefined = typeof navigator === "undefined" ? null : navigator as unknown as BadgeNavigator,
): Promise<void> {
  if (!navigatorLike) return;
  if (counts.badgeCount > 0 && navigatorLike.setAppBadge) {
    await navigatorLike.setAppBadge(counts.badgeCount);
    return;
  }
  if (counts.badgeCount === 0 && navigatorLike.clearAppBadge) {
    await navigatorLike.clearAppBadge();
  }
}

const ACTION_COMMAND_SUFFIX: Readonly<Record<TaskNotificationAction, string>> = Object.freeze({
  "review-approval": "approval",
  "view-decision": "request",
  "revise-request": "request",
  "review-offers": "sourcing",
  "award-provider": "award",
  "resolve-fulfillment": "order",
  "confirm-receipt": "request",
  "add-evidence": "request",
  "correct-evidence": "request",
  "review-invitation": "request",
  "manage-seats": "people",
  "finish-setup": "configure",
});

/** Internal CP-03 command choice derived from the server-projected permitted action. */
export function commandNameForAttentionAction(
  kind: "notification" | "task",
  action: TaskNotificationAction,
): string {
  const suffix = ACTION_COMMAND_SUFFIX[action];
  return kind === "notification"
    ? `accelpo.notification.read-${suffix}`
    : `accelpo.task.complete-${suffix}`;
}
