import test from "node:test";
import assert from "node:assert/strict";

import {
  ADMIN_COMMAND_CENTER_QUEUE_KEYS,
  ADMIN_HEALTH_DOMAIN_KEYS,
  buildAdminCommandCenterSnapshot,
} from "../src/application/admin/command-center.ts";
import {
  ADMINISTRATIVE_WORK_DOMAINS,
  UnifiedAdministrativeWorkQueueService,
  administrativeWorkReadPermission,
} from "../src/application/admin/unified-work-queue.ts";
import {
  ADMIN_UNIVERSAL_SEARCH_KINDS,
  AdminUniversalSearchService,
  adminUniversalSearchReadPermission,
} from "../src/application/admin/universal-search.ts";
import { requireCataloguedAdminPermission } from "../src/domain/admin-authorization/model.ts";
import {
  defaultAdminRolePreset,
  resolveAuthorityContextFromAdminRolePreset,
} from "../src/domain/admin-authorization/role-presets.ts";

const now = "2026-07-30T19:00:00.000Z";
const root = resolveAuthorityContextFromAdminRolePreset("admin-root", defaultAdminRolePreset("super-admin"));
const support = resolveAuthorityContextFromAdminRolePreset("admin-support", defaultAdminRolePreset("member-success-support-administrator"));
const technical = resolveAuthorityContextFromAdminRolePreset("admin-tech", defaultAdminRolePreset("technical-system-administrator"));

function healthMetric(key, value = 1) {
  return { key, label: key.replaceAll("-", " "), value, unit: null, state: "normal" };
}

function workItem(domain, overrides = {}) {
  return {
    id: `${domain}-1`,
    domain,
    type: `${domain}.review`,
    title: `${domain} item`,
    severity: "normal",
    status: "open",
    source: `test:${domain}`,
    object: { kind: domain, id: `${domain}-object-1` },
    organizationId: "org-alpha",
    userId: null,
    geographyId: "geo-1",
    assignedAdministratorId: null,
    createdAt: now,
    dueAt: null,
    ...overrides,
  };
}

function workSource(domain, calls, assignmentPermission = null) {
  return {
    domain,
    readPermission: administrativeWorkReadPermission(domain),
    assignmentPermission,
    async listOpenWork() {
      calls.push(domain);
      return [workItem(domain)];
    },
  };
}

function searchSource(kind, calls, resultOverrides = {}) {
  return {
    kind,
    readPermission: adminUniversalSearchReadPermission(kind),
    async search(query) {
      calls.push(kind);
      return [{
        kind,
        id: `${kind}-1`,
        title: `${kind} ${query}`,
        subtitle: null,
        href: `/admin/${kind}/${kind}-1`,
        organizationId: kind === "organization" ? `${kind}-1` : "org-alpha",
        matchedBy: ["name"],
        metadata: {},
        ...resultOverrides,
      }];
    },
  };
}

test("ADM-058 command center renders all ten attention queues for Super Admin with filtered destinations", () => {
  const counts = Object.fromEntries(ADMIN_COMMAND_CENTER_QUEUE_KEYS.map((key, index) => [key, index + 1]));
  const snapshot = buildAdminCommandCenterSnapshot(root, now, counts, {});
  assert.equal(snapshot.queueCards.length, 10);
  assert.equal(snapshot.attentionTotal, 55);
  for (const card of snapshot.queueCards) {
    assert.match(card.href, /^\/admin\/work-queues\?/);
    assert.match(card.href, /status=open/);
  }
});

test("ADM-058 command center filters workload by authority instead of exposing hidden queue counts", () => {
  const counts = Object.fromEntries(ADMIN_COMMAND_CENTER_QUEUE_KEYS.map((key) => [key, 9]));
  const snapshot = buildAdminCommandCenterSnapshot(technical, now, counts, {});
  assert.deepEqual(snapshot.queueCards.map((card) => card.key), ["integration-failures"]);
  assert.equal(snapshot.attentionTotal, 9);
});

test("ADM-059 health panels cover all seven domains and surface unknown expected metrics", () => {
  const snapshot = buildAdminCommandCenterSnapshot(root, now, {}, {
    organizations: [healthMetric("registered", 30)],
    systems: [healthMetric("overall", "operational")],
  });
  assert.deepEqual(snapshot.healthPanels.map((panel) => panel.domain), ADMIN_HEALTH_DOMAIN_KEYS);
  const organizations = snapshot.healthPanels.find((panel) => panel.domain === "organizations");
  assert.deepEqual(organizations.metrics.map((metric) => metric.key), ["registered", "claimed", "verified", "active"]);
  assert.equal(organizations.metrics.find((metric) => metric.key === "claimed").state, "unknown");
  const systems = snapshot.healthPanels.find((panel) => panel.domain === "systems");
  assert.equal(systems.metrics.find((metric) => metric.key === "overall").value, "operational");
});

test("ADM-059 preserves role-specific health visibility", () => {
  const snapshot = buildAdminCommandCenterSnapshot(technical, now, {}, {});
  assert.deepEqual(snapshot.healthPanels.map((panel) => panel.domain), ["systems"]);
  const supportSnapshot = buildAdminCommandCenterSnapshot(support, now, {}, {});
  assert.deepEqual(supportSnapshot.healthPanels.map((panel) => panel.domain), ["organizations"]);
});

test("ADM-060 aggregates all nine human-action domains for a fully authorized administrator", async () => {
  const calls = [];
  const sources = ADMINISTRATIVE_WORK_DOMAINS.map((domain) => workSource(domain, calls));
  const assignments = {
    async getAssignedAdministratorId() { return null; },
    async assign() {},
  };
  const queue = new UnifiedAdministrativeWorkQueueService(sources, assignments);
  const snapshot = await queue.list(root, now);
  assert.equal(snapshot.total, 9);
  assert.deepEqual(new Set(calls), new Set(ADMINISTRATIVE_WORK_DOMAINS));
  for (const domain of ADMINISTRATIVE_WORK_DOMAINS) assert.equal(snapshot.countsByDomain[domain], 1);
});

test("ADM-060 never queries work sources outside the administrator's authority", async () => {
  const calls = [];
  const sources = [
    workSource("support", calls, requireCataloguedAdminPermission("support.case.update")),
    workSource("commerce", calls),
    workSource("system", calls),
  ];
  const assigned = new Map();
  const assignments = {
    async getAssignedAdministratorId(id) { return assigned.get(id) ?? null; },
    async assign(id, administratorId) { assigned.set(id, administratorId); },
  };
  const queue = new UnifiedAdministrativeWorkQueueService(sources, assignments);
  const snapshot = await queue.list(support, now);
  assert.deepEqual(calls, ["support"]);
  assert.equal(snapshot.total, 1);
  await queue.assign(support, "support", "support-1", "admin-support");
  assert.equal(assigned.get("support-1"), "admin-support");
  await assert.rejects(() => queue.assign(support, "commerce", "commerce-1", "admin-support"), /assignment denied/);
});

test("ADM-060 sorts critical work before normal work and filters across domains", async () => {
  const sources = [{
    domain: "support",
    readPermission: administrativeWorkReadPermission("support"),
    assignmentPermission: requireCataloguedAdminPermission("support.case.update"),
    async listOpenWork() {
      return [
        workItem("support", { id: "normal", title: "normal", severity: "normal" }),
        workItem("support", { id: "critical", title: "critical", severity: "critical" }),
      ];
    },
  }];
  const queue = new UnifiedAdministrativeWorkQueueService(sources, {
    async getAssignedAdministratorId() { return null; },
    async assign() {},
  });
  const snapshot = await queue.list(support, now, { domains: ["support"], severities: ["critical", "normal"] });
  assert.deepEqual(snapshot.items.map((item) => item.id), ["critical", "normal"]);
});

test("ADM-091 searches every supported object family for Super Admin", async () => {
  const calls = [];
  const sources = ADMIN_UNIVERSAL_SEARCH_KINDS.map((kind) => searchSource(kind, calls));
  const search = new AdminUniversalSearchService(sources);
  const response = await search.search(root, "alpha", { limit: 100 });
  assert.equal(response.total, ADMIN_UNIVERSAL_SEARCH_KINDS.length);
  assert.deepEqual(new Set(response.searchedKinds), new Set(ADMIN_UNIVERSAL_SEARCH_KINDS));
  assert.deepEqual(new Set(calls), new Set(ADMIN_UNIVERSAL_SEARCH_KINDS));
});

test("ADM-091 does not query unauthorized search sources and supports domain narrowing", async () => {
  const calls = [];
  const sources = [
    searchSource("user", calls),
    searchSource("support-case", calls),
    searchSource("transaction", calls),
    searchSource("geography", calls),
  ];
  const search = new AdminUniversalSearchService(sources);
  const response = await search.search(support, "person@example.com");
  assert.deepEqual(response.searchedKinds, ["user", "support-case"]);
  assert.deepEqual(calls, ["user", "support-case"]);

  calls.length = 0;
  const narrowed = await search.search(root, "geo-1", { kinds: ["geography"] });
  assert.deepEqual(narrowed.searchedKinds, ["geography"]);
  assert.deepEqual(calls, ["geography"]);
});

test("ADM-091 ranks exact identifiers before broad title matches and validates source boundaries", async () => {
  const exactSource = {
    kind: "organization",
    readPermission: adminUniversalSearchReadPermission("organization"),
    async search() {
      return [
        { kind: "organization", id: "org-alpha", title: "Zeta Company", subtitle: null, href: "/admin/organizations/org-alpha", organizationId: "org-alpha", matchedBy: ["organizationId"], metadata: {} },
        { kind: "organization", id: "org-beta", title: "Org Alpha Services", subtitle: null, href: "/admin/organizations/org-beta", organizationId: "org-beta", matchedBy: ["name"], metadata: {} },
      ];
    },
  };
  const search = new AdminUniversalSearchService([exactSource]);
  const response = await search.search(root, "org-alpha");
  assert.equal(response.results[0].id, "org-alpha");

  assert.throws(
    () => new AdminUniversalSearchService([{ ...exactSource, readPermission: requireCataloguedAdminPermission("audit.event.read") }]),
    /wrong read permission/,
  );
});
