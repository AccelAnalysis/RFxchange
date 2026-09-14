export const CP06_FIRESTORE_COLLECTIONS = Object.freeze({
  events: "accelpoTaskNotificationEvents",
  tasks: "accelpoTasks",
  notifications: "accelpoNotifications",
} as const);

export const CP06_FIRESTORE_COLLECTION_CONVENTIONS = Object.freeze({
  events: Object.freeze({
    collection: CP06_FIRESTORE_COLLECTIONS.events,
    scope: "organization-scoped" as const,
    organizationIdRequired: true,
    appendOnly: true,
    mutable: false,
    directClientAccess: "server-managed-only" as const,
  }),
  tasks: Object.freeze({
    collection: CP06_FIRESTORE_COLLECTIONS.tasks,
    scope: "organization-scoped" as const,
    organizationIdRequired: true,
    appendOnly: false,
    mutable: true,
    directClientAccess: "server-managed-only" as const,
  }),
  notifications: Object.freeze({
    collection: CP06_FIRESTORE_COLLECTIONS.notifications,
    scope: "organization-scoped" as const,
    organizationIdRequired: true,
    appendOnly: false,
    mutable: true,
    directClientAccess: "server-managed-only" as const,
  }),
});

/**
 * CP-06 collections intentionally remain behind the repository's catch-all Firestore default deny.
 * Browser reads use CP-04 projections and consequential browser writes use CP-03 commands.
 */
export const CP06_FIRESTORE_SECURITY_POSTURE = "server-managed-default-deny" as const;
