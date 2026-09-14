import { createHash } from "node:crypto";

import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";

import {
  CP06_EVENT_POLICIES,
  TaskNotificationService,
} from "../../../apps/accelpo/src/task-notification/service.ts";
import {
  TaskNotificationError,
  type TaskNotificationAudienceResolver,
  type TaskNotificationCommitResult,
  type TaskNotificationDomainEvent,
  type TaskNotificationDraft,
  type TaskNotificationPushIntentSink,
  type TaskNotificationStore,
  type VerifiedTaskNotificationAudience,
} from "../../../apps/accelpo/src/task-notification/contracts.ts";
import { userId as domainUserId } from "../../domain/users/model.ts";
import { createFirestoreFoundationRepositories } from "../../infrastructure/firestore/repositories.ts";
import { getServerFirestore } from "../../infrastructure/firestore/runtime.ts";
import { CP06_FIRESTORE_COLLECTIONS } from "./firestore-schema.ts";

const EVENT_COLLECTION = CP06_FIRESTORE_COLLECTIONS.events;
const TASK_COLLECTION = CP06_FIRESTORE_COLLECTIONS.tasks;
const NOTIFICATION_COLLECTION = CP06_FIRESTORE_COLLECTIONS.notifications;
const RECORD_SCHEMA_VERSION = 1 as const;

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 48);
}

function eventDocumentId(eventId: string): string {
  return `accelpo_evt_${digest(eventId)}`;
}

function notificationDocumentId(eventId: string, userId: string): string {
  return `accelpo_ntf_${digest(`${eventId}\u0000${userId}`)}`;
}

function taskDocumentId(eventId: string, userId: string): string {
  return `accelpo_task_${digest(`${eventId}\u0000${userId}`)}`;
}

function eventFingerprint(event: TaskNotificationDomainEvent, drafts: readonly TaskNotificationDraft[]): string {
  return createHash("sha256").update(JSON.stringify({ event, drafts }), "utf8").digest("hex");
}

function stringArray(value: unknown): readonly string[] | null {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) return null;
  return Object.freeze([...value] as string[]);
}

class FirestoreTaskNotificationStore implements TaskNotificationStore {
  constructor(private readonly db: Firestore) {}

  async commit(input: Readonly<{
    event: TaskNotificationDomainEvent;
    drafts: readonly TaskNotificationDraft[];
  }>): Promise<TaskNotificationCommitResult> {
    const fingerprint = eventFingerprint(input.event, input.drafts);
    const eventRef = this.db.doc(`${EVENT_COLLECTION}/${eventDocumentId(input.event.eventId)}`);

    return this.db.runTransaction(async (transaction) => {
      const existing = await transaction.get(eventRef);
      if (existing.exists) {
        const data = existing.data() ?? {};
        const notificationIds = stringArray(data.notificationIds);
        const taskIds = stringArray(data.taskIds);
        if (data.eventId !== input.event.eventId || data.fingerprint !== fingerprint || !notificationIds || !taskIds) {
          throw new TaskNotificationError("event-conflict", "That domain event identity was already used for different work.");
        }
        return Object.freeze({ status: "replayed" as const, notificationIds, taskIds });
      }

      const occurredAt = Timestamp.fromDate(new Date(input.event.timestamp));
      const notificationIds: string[] = [];
      const taskIds: string[] = [];

      for (const draft of input.drafts) {
        if (draft.kind === "notification") {
          const id = notificationDocumentId(input.event.eventId, draft.recipientUserId);
          notificationIds.push(id);
          transaction.create(this.db.doc(`${NOTIFICATION_COLLECTION}/${id}`), {
            schemaVersion: RECORD_SCHEMA_VERSION,
            id,
            organizationId: input.event.organizationId,
            purchaseCaseId: draft.purchaseCaseId,
            sourceEventId: input.event.eventId,
            type: draft.eventType,
            title: draft.title,
            body: draft.body,
            recipientUserId: draft.recipientUserId,
            recipientUserIds: [draft.recipientUserId],
            visibleToUserIds: [draft.recipientUserId],
            permittedAction: draft.permittedAction,
            requiredPermission: draft.requiredPermission,
            deepLink: draft.deepLink,
            readAt: null,
            version: 1,
            createdAt: occurredAt,
            updatedAt: occurredAt,
          });
          continue;
        }

        const id = taskDocumentId(input.event.eventId, draft.recipientUserId);
        taskIds.push(id);
        transaction.create(this.db.doc(`${TASK_COLLECTION}/${id}`), {
          schemaVersion: RECORD_SCHEMA_VERSION,
          id,
          organizationId: input.event.organizationId,
          purchaseCaseId: draft.purchaseCaseId,
          sourceEventId: input.event.eventId,
          type: draft.eventType,
          title: draft.title,
          summary: draft.body,
          status: "open",
          assignedToUserId: draft.recipientUserId,
          assigneeUserId: draft.recipientUserId,
          visibleToUserIds: [draft.recipientUserId],
          dueAt: draft.dueAt ? Timestamp.fromDate(new Date(draft.dueAt)) : null,
          permittedAction: draft.permittedAction,
          requiredPermission: draft.requiredPermission,
          deepLink: draft.deepLink,
          version: 1,
          createdAt: occurredAt,
          updatedAt: occurredAt,
        });
      }

      transaction.create(eventRef, {
        schemaVersion: RECORD_SCHEMA_VERSION,
        id: eventRef.id,
        eventId: input.event.eventId,
        eventType: input.event.eventType,
        organizationId: input.event.organizationId,
        purchaseCaseId: input.event.purchaseCaseId ?? null,
        actor: input.event.actor,
        occurredAt,
        safeDisplayFacts: input.event.safeDisplayFacts,
        permittedAction: input.event.permittedAction,
        deepLinkTarget: input.event.deepLinkTarget,
        notificationRecipientUserIds: input.event.audience.notificationRecipientUserIds,
        taskAssigneeUserIds: input.event.audience.taskAssigneeUserIds ?? [],
        notificationIds,
        taskIds,
        fingerprint,
        createdAt: FieldValue.serverTimestamp(),
      });

      return Object.freeze({
        status: "committed" as const,
        notificationIds: Object.freeze(notificationIds),
        taskIds: Object.freeze(taskIds),
      });
    });
  }
}

interface UserAccess {
  readonly membershipId: string;
  readonly permissions: readonly string[];
}

class FirestoreTaskNotificationAudienceResolver implements TaskNotificationAudienceResolver {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  private async accessFor(userId: string, organizationId: string): Promise<UserAccess | null> {
    const foundation = createFirestoreFoundationRepositories(this.db);
    const memberships = await foundation.users.memberships.listActiveByUserId(domainUserId(userId));
    const matches = memberships.filter((membership) => String(membership.organizationId) === organizationId);
    if (matches.length !== 1 || !matches[0]) return null;
    const membershipId = String(matches[0].id);
    const authorization = await this.db.doc(`organizationAuthorizations/${membershipId}`).get();
    if (!authorization.exists) return null;
    const data = authorization.data() ?? {};
    if (
      data.organizationId !== organizationId ||
      data.userId !== userId ||
      data.membershipId !== membershipId ||
      !Array.isArray(data.permissions) ||
      data.permissions.some((permission: unknown) => typeof permission !== "string")
    ) return null;
    return Object.freeze({ membershipId, permissions: Object.freeze([...data.permissions] as string[]) });
  }

  private async requirePermission(userId: string, organizationId: string, permission: string): Promise<UserAccess> {
    const access = await this.accessFor(userId, organizationId);
    if (!access || !access.permissions.includes(permission)) {
      throw new TaskNotificationError("audience-forbidden", "A task or notification recipient is not authorized for this organization.");
    }
    return access;
  }

  async resolve(input: Readonly<{
    event: TaskNotificationDomainEvent;
    notificationRequiredPermission: string;
    taskRequiredPermission: string | null;
  }>): Promise<VerifiedTaskNotificationAudience> {
    const { event } = input;
    if (event.actor.kind === "user") {
      const actorAccess = await this.accessFor(event.actor.userId, event.organizationId);
      if (!actorAccess || actorAccess.membershipId !== event.actor.membershipId) {
        throw new TaskNotificationError("audience-forbidden", "The event actor is not an active member of this organization.");
      }
    }

    for (const userId of event.audience.notificationRecipientUserIds) {
      await this.requirePermission(userId, event.organizationId, input.notificationRequiredPermission);
    }

    const taskAssigneeUserIds = event.audience.taskAssigneeUserIds ?? [];
    if (taskAssigneeUserIds.length > 0 && !input.taskRequiredPermission) {
      throw new TaskNotificationError("invalid-event", "The event cannot assign a task without an authority requirement.");
    }
    for (const userId of taskAssigneeUserIds) {
      await this.requirePermission(userId, event.organizationId, input.taskRequiredPermission!);
    }

    return Object.freeze({
      notificationRecipientUserIds: Object.freeze([...event.audience.notificationRecipientUserIds]),
      taskAssigneeUserIds: Object.freeze([...taskAssigneeUserIds]),
    });
  }
}

export interface ServerTaskNotificationOptions {
  readonly db?: Firestore;
  readonly push?: TaskNotificationPushIntentSink | null;
}

/**
 * Server-only event-to-work port. Producers call this only for committed domain events; event IDs
 * are durable dedupe keys, so retrying after an ambiguous delivery does not duplicate work.
 */
export function createServerTaskNotificationService(
  options: ServerTaskNotificationOptions = {},
): TaskNotificationService {
  const db = options.db ?? getServerFirestore();
  return new TaskNotificationService({
    audience: new FirestoreTaskNotificationAudienceResolver(db),
    store: new FirestoreTaskNotificationStore(db),
    push: options.push ?? null,
  });
}

export const CP06_SERVER_COLLECTIONS = CP06_FIRESTORE_COLLECTIONS;

export function taskNotificationPolicyFor(eventType: TaskNotificationDomainEvent["eventType"]) {
  return CP06_EVENT_POLICIES[eventType];
}
