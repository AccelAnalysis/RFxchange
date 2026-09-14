import assert from "node:assert/strict";
import test from "node:test";

import { CP06_EVENT_POLICIES } from "../apps/accelpo/src/task-notification/service.ts";
import {
  CP06_FIRESTORE_COLLECTIONS,
  CP06_FIRESTORE_COLLECTION_CONVENTIONS,
  CP06_FIRESTORE_SECURITY_POSTURE,
} from "../src/accelpo/cp06/firestore-schema.ts";

test("invitation attention stays inside the active organization permission model", () => {
  assert.equal(CP06_EVENT_POLICIES.invitation.notificationRequiredPermission, "organization.people.manage");
  assert.equal(CP06_EVENT_POLICIES.invitation.taskRequired, false);
});

test("CP-06 durable collections are organization-scoped and server managed", () => {
  assert.deepEqual(CP06_FIRESTORE_COLLECTIONS, {
    events: "accelpoTaskNotificationEvents",
    tasks: "accelpoTasks",
    notifications: "accelpoNotifications",
  });
  assert.equal(CP06_FIRESTORE_SECURITY_POSTURE, "server-managed-default-deny");
  for (const convention of Object.values(CP06_FIRESTORE_COLLECTION_CONVENTIONS)) {
    assert.equal(convention.scope, "organization-scoped");
    assert.equal(convention.organizationIdRequired, true);
    assert.equal(convention.directClientAccess, "server-managed-only");
  }
});
