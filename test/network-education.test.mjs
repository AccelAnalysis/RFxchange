import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import {
  NETWORK_EDUCATION_CATALOG_VERSION,
  NETWORK_EDUCATION_PATHS,
  NETWORK_EXPLAINER_KEYS,
  recommendedEducationPath,
} from "../src/application/network-education/catalog.ts";
import { NetworkEducationError, NetworkEducationService } from "../src/application/network-education/network-education.ts";
import { NetworkEducationPersistenceConflictError } from "../src/domain/network-education/repository.ts";
import { createUserIdentity } from "../src/domain/users/model.ts";

const NOW = "2026-08-09T18:00:00.000Z";

function fixture() {
  const user = createUserIdentity({ id: "user-education", name: "Education Manager", primaryEmail: "education@example.test", loginProvider: "firebase", loginSubject: "subject-education", now: NOW });
  const context = authenticatedServerContext({ user, claims: { provider: "firebase", subject: user.login.subject, email: user.primaryEmail, displayName: user.name, emailVerified: true, isAnonymous: false, authenticatedAt: NOW, issuedAt: NOW, expiresAt: "2026-08-10T18:00:00.000Z" }, source: "session-cookie" });
  const state = { progress: new Map(), commands: new Map(), events: [], failPersistence: false, failConflict: false };
  const repository = {
    async getProgress(id) { return state.progress.get(id) ?? null; },
    async getCommand(id) { return state.commands.get(id) ?? null; },
    async save(input) {
      if (state.failConflict) {
        throw new NetworkEducationPersistenceConflictError("Injected education version conflict.");
      }
      if (state.failPersistence) throw new Error("Injected education persistence outage.");
      const current = state.progress.get(input.progress.id) ?? null;
      assert.equal(current?.version ?? null, input.expectedVersion);
      assert.equal(state.commands.has(input.command.id), false);
      state.progress.set(input.progress.id, input.progress);
      state.commands.set(input.command.id, input.command);
      state.events.push(input.event);
    },
  };
  const service = new NetworkEducationService(repository, () => NOW);
  const scope = (commandId, organizationId = "org-education", membershipId = "membership-education") => ({ context, organizationId, membershipId, commandId });
  return { service, state, scope };
}

test("EDU-016 defines four stable paths with allow-listed live links and truthful future stops", () => {
  assert.equal(NETWORK_EDUCATION_CATALOG_VERSION, 1);
  assert.deepEqual(NETWORK_EDUCATION_PATHS.map((path) => path.key), ["quick-start", "business", "issuer", "resource-provider"]);
  const allowed = new Set(["/organization-profile", "/geography/canvas", "/referrals", "/provider-application", "/resources"]);
  for (const path of NETWORK_EDUCATION_PATHS) {
    assert.ok(path.items.length >= 4);
    for (const item of path.items) {
      if (item.availability === "available") assert.equal(allowed.has(item.route), true);
      else assert.equal(item.route, null);
    }
  }
  assert.equal(NETWORK_EDUCATION_PATHS.find((path) => path.key === "issuer").items.find((item) => item.key === "issuer-rfx").availability, "planned");
});

test("education persistence outages remain dependency failures rather than domain conflicts", async () => {
  const f = fixture();
  f.state.failPersistence = true;
  await assert.rejects(
    f.service.mutate(f.scope("persistence-outage"), {
      action: "path-selected",
      expectedVersion: null,
      pathKey: "business",
    }, false),
    (error) => error instanceof Error && !(error instanceof NetworkEducationError) && /persistence outage/.test(error.message),
  );
  assert.equal(f.state.progress.size, 0);
  assert.equal(f.state.commands.size, 0);
  assert.equal(f.state.events.length, 0);
});

test("education persistence version races remain domain conflicts", async () => {
  const f = fixture();
  f.state.failConflict = true;
  await assert.rejects(
    f.service.mutate(f.scope("persistence-conflict"), {
      action: "path-selected",
      expectedVersion: null,
      pathKey: "business",
    }, false),
    (error) => error instanceof NetworkEducationError && error.code === "conflict",
  );
  assert.equal(f.state.progress.size, 0);
});

test("provider status changes recommendation only and never grants a path or domain authority", async () => {
  const f = fixture();
  const business = await f.service.snapshot(f.scope(undefined), false);
  const provider = await f.service.snapshot(f.scope(undefined), true);
  assert.equal(business.progress.recommendedPath, "business");
  assert.equal(provider.progress.recommendedPath, "resource-provider");
  assert.equal(recommendedEducationPath(false), "business");
  assert.equal(Object.hasOwn(provider.progress, "permissions"), false);
  assert.equal(Object.hasOwn(provider.progress, "providerStatus"), false);
  assert.equal(f.state.progress.size, 0, "recommendations do not persist or grant state on read");
});

test("progress is durable, dismissible, resumable, reopenable, versioned, and membership-bound", async () => {
  const f = fixture();
  const selected = await f.service.mutate(f.scope("select-business"), { action: "path-selected", expectedVersion: null, pathKey: "business" }, false);
  assert.equal(selected.progress.version, 1);
  const item = await f.service.mutate(f.scope("complete-profile"), { action: "item-completed", expectedVersion: 1, pathKey: "business", itemKey: "business-profile" }, false);
  assert.deepEqual(item.progress.completedItemKeys, ["business-profile"]);
  assert.equal(item.progress.resumeItemKey, "business-profile");
  const dismissed = await f.service.mutate(f.scope("dismiss-guide"), { action: "guide-dismissed", expectedVersion: 2 }, false);
  assert.equal(dismissed.progress.status, "dismissed");
  const reopened = await f.service.mutate(f.scope("reopen-guide"), { action: "guide-reopened", expectedVersion: 3 }, false);
  assert.equal(reopened.progress.status, "active");
  assert.deepEqual(reopened.progress.completedItemKeys, ["business-profile"]);
  const otherOrganization = await f.service.snapshot(f.scope(undefined, "org-other", "membership-other"), false);
  const otherMembership = await f.service.snapshot(f.scope(undefined, "org-education", "membership-replacement"), false);
  assert.notEqual(otherOrganization.progress.id, reopened.progress.id);
  assert.notEqual(otherMembership.progress.id, reopened.progress.id);
});

test("explainer evidence is idempotent and stale or cross-input replay fails closed", async () => {
  const f = fixture();
  const first = await f.service.mutate(f.scope("view-explainer"), { action: "explainer-viewed", expectedVersion: null, explainerKey: "referral-consent" }, false);
  const replay = await f.service.mutate(f.scope("view-explainer"), { action: "explainer-viewed", expectedVersion: null, explainerKey: "referral-consent" }, false);
  assert.equal(replay.replayed, true);
  assert.deepEqual(first.progress.viewedExplainerKeys, ["referral-consent"]);
  await assert.rejects(f.service.mutate(f.scope("view-explainer"), { action: "explainer-dismissed", expectedVersion: 1, explainerKey: "referral-consent" }, false), (error) => error instanceof NetworkEducationError && error.code === "conflict");
  await assert.rejects(f.service.mutate(f.scope("stale"), { action: "guide-dismissed", expectedVersion: 0 }, false), /current version is 1/);
  assert.equal(f.state.events.length, 1);
});

test("EDU-017 catalog and live surfaces expose all four questions without a modal wall", async () => {
  assert.equal(NETWORK_EXPLAINER_KEYS.length, 11);
  const [component, market, enrichment, referrals, providers, resources] = await Promise.all([
    readFile(new URL("../src/components/network-education/WorkflowExplainer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/market-profile/MarketProfilePanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/organization-enrichment/OrganizationEnrichmentPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/referrals/ReferralWorkspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/resource-providers/ProviderApplicationWorkspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/resource-network/ResourceNetworkWorkspace.tsx", import.meta.url), "utf8"),
  ]);
  for (const question of ["questions.what", "questions.why", "questions.happens", "questions.next"]) assert.ok(component.includes(question));
  assert.match(component, /<details/);
  assert.doesNotMatch(component, /role="dialog"|aria-modal/);
  const surfaces = [market, enrichment, referrals, providers, resources].join("\n");
  for (const key of NETWORK_EXPLAINER_KEYS) assert.ok(surfaces.includes(`explainerKey="${key}"`), key);
});

test("education persistence has no organization, referral, provider, RFx, analytics, or authority write dependency", () => {
  const source = `${NetworkEducationService}`;
  for (const forbidden of ["organizationRepository", "referralRepository", "providerRepository", "rfxRepository", "analytics", "permissionGrant", "verification", "credibility", "commercialEntitlement"]) {
    assert.doesNotMatch(source, new RegExp(forbidden, "i"));
  }
});
