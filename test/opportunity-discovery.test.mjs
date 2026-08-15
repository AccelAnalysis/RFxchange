import assert from "node:assert/strict";
import test from "node:test";

import { OpportunityDiscoveryService } from "../src/application/rfx/opportunity-discovery-service.ts";
import { opportunityAlertTransactionalEmailCatalog } from "../src/application/rfx/opportunity-alert-templates.ts";
import {
  createOpportunityDiscoveryQuery,
  opportunityMatchesQuery,
  opportunityWatchId,
} from "../src/domain/rfx/discovery.ts";

const NOW = "2026-08-12T14:00:00.000Z";

function projection(reference, deadline, overrides = {}) {
  return Object.freeze({
    schemaVersion: 1,
    reference,
    audience: "authenticated-participants",
    aggregateVersion: 8,
    mode: "published",
    digest: `${reference}-digest`,
    publishedAt: "2026-08-10T12:00:00.000Z",
    requestFamilyIndexKey: "rfq",
    localityIndexKeys: ["locality:alpha"],
    capabilityIndexKeys: ["capability.alpha"],
    payload: Object.freeze({
      title: `Opportunity ${reference}`,
      summary: "Replace and integrate a governed inventory system.",
      issuerDisplayName: "Issuer Organization",
      requestFamilyLabel: "Request for Quote",
      requestFamilyPurpose: "Obtain structured pricing.",
      timing: Object.freeze({ responseDeadline: deadline }),
      localities: Object.freeze([{ id: "locality-alpha", label: "Alpha" }]),
      requirements: Object.freeze([{ title: "Integration", description: "Connect current systems.", capabilityLabel: "Systems integration", capabilityDefinition: "Integrates systems." }]),
    }),
    ...overrides,
  });
}

class MemoryRepository {
  constructor(projections = []) {
    this.projections = projections;
    this.searches = new Map();
    this.watches = new Map();
    this.commands = new Map();
    this.matches = new Map();
    this.alerts = new Map();
  }
  async listProjections(limit) { return this.projections.slice(0, limit); }
  async getProjection(reference) { return this.projections.find((item) => item.reference === reference) ?? null; }
  async listSavedSearches(organizationId, userId) { return [...this.searches.values()].filter((item) => item.organizationId === organizationId && item.userId === userId); }
  async getSavedSearch(id) { return this.searches.get(id) ?? null; }
  async listWatches(organizationId, userId) { return [...this.watches.values()].filter((item) => item.organizationId === organizationId && item.userId === userId); }
  async getWatch(id) { return this.watches.get(id) ?? null; }
  async getCommand(id) { return this.commands.get(id) ?? null; }
  async getAlertRecipient(search) { return { userId: search.userId, displayName: "Participant", primaryEmail: "participant@example.com" }; }
  async listActiveSavedSearches() { return [...this.searches.values()].filter((item) => item.status === "active"); }
  async saveSavedSearch(bundle) { this.searches.set(bundle.record.id, bundle.record); this.commands.set(bundle.command.id, bundle.command); return "created"; }
  async saveWatch(bundle) { this.watches.set(bundle.record.id, bundle.record); this.commands.set(bundle.command.id, bundle.command); return "created"; }
  async saveMatch(bundle) {
    if (this.matches.has(bundle.match.id)) return "replayed";
    this.matches.set(bundle.match.id, bundle.match);
    if (bundle.alert) {
      const current = this.alerts.get(bundle.alert.id);
      this.alerts.set(bundle.alert.id, current
        ? { ...current, matchEventIds: [...new Set([...current.matchEventIds, ...bundle.alert.matchEventIds])], opportunityReferences: [...new Set([...current.opportunityReferences, ...bundle.alert.opportunityReferences])] }
        : bundle.alert);
    }
    return "created";
  }
}

const scope = Object.freeze({ organizationId: "org-alpha", userId: "user-alpha", membershipId: "membership-alpha" });

test("opportunity discovery validates structured filters and uses one deterministic predicate", () => {
  assert.throws(() => createOpportunityDiscoveryQuery({ capabilityIds: ["not a governed id"] }), /unsupported structured filter/);
  assert.throws(() => createOpportunityDiscoveryQuery({ cursor: "bad!" }), /cursor is malformed/);
  const query = createOpportunityDiscoveryQuery({ text: "inventory integration", requestFamilyKeys: ["rfq"], capabilityIds: ["capability.alpha"], localityIds: ["locality-alpha"], deadlineWindow: "next-30-days" });
  assert.equal(opportunityMatchesQuery({ projection: projection("opp-a", "2026-08-30"), query: { ...query, cursor: undefined }, watched: false, now: NOW }), true);
  assert.equal(opportunityMatchesQuery({ projection: projection("opp-b", "2026-10-01"), query: { ...query, cursor: undefined }, watched: false, now: NOW }), false);
});

test("discovery excludes draft, expired, and unsupported-audience records and orders by canonical deadline", async () => {
  const repository = new MemoryRepository([
    projection("opp-later", "2026-09-20"),
    projection("opp-soon", "2026-08-16"),
    projection("opp-expired", "2026-08-01"),
    projection("opp-draft", "2026-08-20", { mode: "preview", publishedAt: null }),
    projection("opp-private", "2026-08-20", { audience: "issuer-only" }),
  ]);
  repository.watches.set(opportunityWatchId(scope.organizationId, scope.userId, "opp-soon"), { id: opportunityWatchId(scope.organizationId, scope.userId, "opp-soon"), organizationId: scope.organizationId, userId: scope.userId, opportunityReference: "opp-soon", status: "watching" });
  const result = await new OpportunityDiscoveryService(repository, () => NOW).discover(scope, { localityIds: ["locality-alpha"] });
  assert.deepEqual(result.items.map((item) => item.reference), ["opp-soon", "opp-later"]);
  assert.equal(result.items[0].watched, true);
  assert.deepEqual(result.deadlines.next7Days.map((item) => item.reference), ["opp-soon"]);
});

test("saved searches and watches preserve command replay, ownership, and unique relation identity", async () => {
  const repository = new MemoryRepository([projection("opp-a", "2026-08-30")]);
  const service = new OpportunityDiscoveryService(repository, () => NOW);
  const saved = await service.saveSearch(scope, { commandId: "command-save-a", label: "Inventory", alertPolicy: "immediate", query: { text: "inventory", localityIds: ["locality-alpha"] } });
  const replay = await service.saveSearch(scope, { commandId: "command-save-a", label: "Inventory", alertPolicy: "immediate", query: { text: "inventory", localityIds: ["locality-alpha"] } });
  assert.equal(replay.replayed, true);
  assert.equal(replay.savedSearch.id, saved.savedSearch.id);
  await assert.rejects(() => service.saveSearch(scope, { commandId: "command-save-a", label: "Altered", alertPolicy: "off", query: {} }), /reused for different intent/);
  const firstWatch = await service.setWatch(scope, { commandId: "command-watch-a", reference: "opp-a", watching: true });
  const replayWatch = await service.setWatch(scope, { commandId: "command-watch-a", reference: "opp-a", watching: true });
  assert.equal(replayWatch.replayed, true);
  assert.equal(firstWatch.watch.id, opportunityWatchId(scope.organizationId, scope.userId, "opp-a"));
});

test("new projection evaluation creates one minimized versioned alert request and exact replay is inert", async () => {
  const item = projection("opp-a", "2026-08-30");
  const repository = new MemoryRepository([item]);
  const service = new OpportunityDiscoveryService(repository, () => NOW, "https://example.test");
  await service.saveSearch(scope, { commandId: "command-save-alert", label: "Inventory", alertPolicy: "immediate", query: { text: "inventory", localityIds: ["locality-alpha"] } });
  assert.deepEqual(await service.evaluatePublishedProjection(item), { matches: 1, alerts: 1 });
  assert.deepEqual(await service.evaluatePublishedProjection(item), { matches: 0, alerts: 0 });
  assert.equal(repository.matches.size, 1);
  assert.equal(repository.alerts.size, 1);
  const alert = [...repository.alerts.values()][0];
  assert.equal(alert.request.eventKey, "rfx.opportunity-alert");
  assert.equal(alert.request.variables.opportunity_count, 1);
  assert.equal(String(alert.request.recipient.email), "participant@example.com");
  const rendered = await opportunityAlertTransactionalEmailCatalog.render(alert.request);
  assert.match(rendered.text, /not qualification/);
  assert.doesNotMatch(rendered.text, /capabilityIndexKeys|projectionDigest|actor/);
});

test("recipient unavailability suppresses only delivery and preserves the authoritative match fact", async () => {
  const item = projection("opp-a", "2026-08-30");
  const repository = new MemoryRepository([item]);
  repository.getAlertRecipient = async () => null;
  const service = new OpportunityDiscoveryService(repository, () => NOW, "https://example.test");
  await service.saveSearch(scope, { commandId: "command-save-no-recipient", label: "Inventory", alertPolicy: "immediate", query: { text: "inventory", localityIds: ["locality-alpha"] } });
  assert.deepEqual(await service.evaluatePublishedProjection(item), { matches: 1, alerts: 0 });
  assert.equal(repository.matches.size, 1);
  assert.equal(repository.alerts.size, 0);
});

test("daily digest matches share one deterministic evaluation-day intent", async () => {
  const repository = new MemoryRepository([projection("opp-a", "2026-08-30"), projection("opp-b", "2026-09-01")]);
  const service = new OpportunityDiscoveryService(repository, () => NOW, "https://example.test");
  await service.saveSearch(scope, { commandId: "command-save-digest", label: "All", alertPolicy: "daily-digest", query: { localityIds: ["locality-alpha"] } });
  await service.evaluatePublishedProjection(repository.projections[0]);
  await service.evaluatePublishedProjection(repository.projections[1]);
  assert.equal(repository.matches.size, 2);
  assert.equal(repository.alerts.size, 1);
  const alert = [...repository.alerts.values()][0];
  assert.equal(alert.windowKey, "2026-08-12");
  assert.equal(alert.opportunityReferences.length, 2);
});
