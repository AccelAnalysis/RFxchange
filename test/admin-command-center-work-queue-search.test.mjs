import test from "node:test";
import assert from "node:assert/strict";

import {
  ADMIN_ATTENTION_QUEUE_KEYS,
  ADMIN_HEALTH_PANEL_KEYS,
  buildAdministrativeCommandCenter,
} from "../src/application/admin/command-center.ts";
import { buildUnifiedAdministrativeWorkQueue } from "../src/application/admin/unified-work-queue.ts";
import {
  ADMIN_SEARCH_CATEGORIES,
  universalAdminSearch,
} from "../src/application/admin/universal-search.ts";
import { createAdministrativeWorkItem } from "../src/domain/admin-work-queue/model.ts";
import {
  defaultAdminRolePreset,
  resolveAuthorityContextFromAdminRolePreset,
} from "../src/domain/admin-authorization/role-presets.ts";

const root = resolveAuthorityContextFromAdminRolePreset("admin-root", defaultAdminRolePreset("super-admin"));
const support = resolveAuthorityContextFromAdminRolePreset("admin-support", defaultAdminRolePreset("member-success-support-administrator"));

const attentionPermissions = {
  "claims-awaiting-review": "organization.profile.read",
  "verification-reviews": "credibility.organization.verify",
  "resource-provider-applications": "provider.application.read",
  "rfx-flagged": "rfx.moderation.review",
  "trust-reports": "trust.report.read",
  "integrity-holds": "trust.case.review",
  "billing-exceptions": "commerce.account.read",
  "data-corrections": "support.case.read",
  "support-cases": "support.case.read",
  "failed-integrations": "system.health.read",
};

const healthPermissions = {
  organizations: "organization.profile.read",
  marketplace: "rfx.record.read",
  connections: "referral.record.read",
  network: "analytics.dashboard.read",
  commerce: "commerce.account.read",
  trust: "trust.report.read",
  systems: "system.health.read",
};

function queueProviders() {
  return ADMIN_ATTENTION_QUEUE_KEYS.map((key, index) => ({
    key,
    label: key.replaceAll("-", " "),
    requiredPermission: attentionPermissions[key],
    async count() { return index + 1; },
  }));
}

function healthProviders() {
  return ADMIN_HEALTH_PANEL_KEYS.map((key, index) => ({
    key,
    label: key,
    requiredPermission: healthPermissions[key],
    async load() {
      return {
        status: index === 6 ? "attention" : "healthy",
        metrics: [{ key: `${key}-metric`, label: `${key} metric`, value: index + 10, unit: "count" }],
      };
    },
  }));
}

test("ADM-058 command center includes all ten attention queues and is attention-first", async () => {
  const model = await buildAdministrativeCommandCenter(root, queueProviders(), healthProviders());
  assert.deepEqual(model.attentionQueues.map((queue) => queue.key), ADMIN_ATTENTION_QUEUE_KEYS);
  assert.equal(model.totalAttentionCount, 55);
  await assert.rejects(
    () => buildAdministrativeCommandCenter(root, queueProviders().slice(1), healthProviders()),
    /coverage mismatch/,
  );
});

test("ADM-059 exposes all seven platform-health domains while filtering unauthorized domains", async () => {
  const rootModel = await buildAdministrativeCommandCenter(root, queueProviders(), healthProviders());
  assert.deepEqual(rootModel.healthPanels.map((panel) => panel.key), ADMIN_HEALTH_PANEL_KEYS);

  const supportModel = await buildAdministrativeCommandCenter(support, queueProviders(), healthProviders());
  assert.ok(supportModel.healthPanels.some((panel) => panel.key === "organizations"));
  assert.equal(supportModel.healthPanels.some((panel) => panel.key === "commerce"), false);
  assert.equal(supportModel.healthPanels.some((panel) => panel.key === "systems"), false);
});

test("ADM-060 work item captures every required queue field and unified queue is permission-aware", async () => {
  const critical = createAdministrativeWorkItem({
    id: "work-1",
    caseNumber: "RFQ-0001",
    objectType: "support-case",
    objectId: "support-44",
    organizationId: "org-a",
    userId: "user-a",
    type: "support",
    severity: "critical",
    source: "support",
    geography: "Isle of Wight County, VA",
    assignedAdministratorId: "admin-support",
    createdAt: "2026-07-30T10:00:00.000Z",
    slaDueAt: "2026-07-30T12:00:00.000Z",
    status: "in-review",
    evidenceReferences: ["evidence-1"],
    relatedCaseNumbers: ["RFQ-0000"],
    requiredPermission: "support.case.read",
  });
  const commerce = createAdministrativeWorkItem({
    id: "work-2",
    caseNumber: "RFQ-0002",
    objectType: "billing-exception",
    objectId: "billing-1",
    organizationId: "org-b",
    type: "billing",
    severity: "high",
    source: "commerce",
    createdAt: "2026-07-30T11:00:00.000Z",
    status: "new",
    requiredPermission: "commerce.account.read",
  });
  assert.equal(critical.organizationId, "org-a");
  assert.equal(critical.userId, "user-a");
  assert.equal(critical.geography, "Isle of Wight County, VA");
  assert.equal(critical.evidenceReferences.length, 1);
  assert.equal(critical.relatedCaseNumbers.length, 1);

  const providers = [{ source: "fixture", async listOpenWork() { return [commerce, critical]; } }];
  const rootQueue = await buildUnifiedAdministrativeWorkQueue(root, providers, "2026-07-30T13:00:00.000Z");
  assert.deepEqual(rootQueue.map((item) => item.id), [critical.id, commerce.id]);
  const supportQueue = await buildUnifiedAdministrativeWorkQueue(support, providers, "2026-07-30T13:00:00.000Z");
  assert.deepEqual(supportQueue.map((item) => item.id), [critical.id]);
});

test("ADM-091 defines every specification search category and filters results by permission", async () => {
  assert.deepEqual(ADMIN_SEARCH_CATEGORIES, [
    "organization", "user", "email", "organization-id", "rfx", "response", "referral",
    "transaction", "support-case", "geography", "uei", "cage", "provider", "stripe-customer", "audit-event",
  ]);
  const providers = [{
    key: "fixture",
    async search() {
      return [
        { category: "organization", id: "org-a", title: "Alpha Works", route: "/admin/organizations/org-a", requiredPermission: "organization.profile.read" },
        { category: "transaction", id: "tx-1", title: "Payment transaction", route: "/admin/commerce/tx-1", requiredPermission: "commerce.account.read" },
        { category: "audit-event", id: "audit-1", title: "Access changed", route: "/admin/audit/audit-1", requiredPermission: "audit.event.read" },
      ];
    },
  }];
  const all = await universalAdminSearch({ authority: root, query: "alpha", providers });
  assert.equal(all.length, 3);
  const visible = await universalAdminSearch({ authority: support, query: "alpha", providers });
  assert.deepEqual(visible.map((result) => result.category), ["organization", "audit-event"]);
});
