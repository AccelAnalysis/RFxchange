import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  authorizedWorkspaceSelection,
  parseResourceNetworkWorkspaceQuery,
} from "../src/application/resource-network/resource-network-workspace.ts";
import { settleOptionalWorkspacePanel } from "../src/application/workspace/optional-workspace-panel.ts";
import { supportedLocales } from "../src/i18n/config.ts";

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("Resource Network query state normalizes the bounded URL contract", () => {
  assert.deepEqual(
    parseResourceNetworkWorkspaceQuery({
      q: "  capital assistance  ",
      availability: "limited",
      organization: "org-focus.1",
      provider: "org-provider.1",
      request: ["referral:1", "ignored"],
    }),
    {
      query: "capital assistance",
      availability: "limited",
      organizationId: "org-focus.1",
      providerId: "org-provider.1",
      resourceId: null,
      requestId: "referral:1",
    },
  );

  const invalid = parseResourceNetworkWorkspaceQuery({
    q: "x".repeat(200),
    availability: "fabricated",
    organization: "../not-authority",
    provider: "../not-authority",
    resource: "../not-authority",
    request: "",
  });
  assert.equal(invalid.query.length, 160);
  assert.equal(invalid.availability, "all");
  assert.equal(invalid.organizationId, null);
  assert.equal(invalid.providerId, null);
  assert.equal(invalid.resourceId, null);
  assert.equal(invalid.requestId, null);
});

test("selected provider, Resource, and request identities must remain in the authorized projection", () => {
  assert.equal(authorizedWorkspaceSelection("org-2", ["org-1", "org-2"]), "org-2");
  assert.equal(authorizedWorkspaceSelection("org-private", ["org-1", "org-2"]), null);
  assert.equal(authorizedWorkspaceSelection(null, ["org-1"]), null);
});

test("optional workspace dependencies settle to truthful independent availability", async () => {
  const reports = [];
  const available = settleOptionalWorkspacePanel("market-profile", Promise.resolve({ version: 3 }), (label, error) => reports.push({ label, error }));
  const unavailable = settleOptionalWorkspacePanel("map", Promise.reject(new Error("provider timeout")), (label, error) => reports.push({ label, error }));

  assert.deepEqual(await available, { available: true, value: { version: 3 } });
  assert.deepEqual(await unavailable, { available: false });
  assert.equal(reports.length, 1);
  assert.equal(reports[0].label, "map");
  assert.match(String(reports[0].error), /provider timeout/);
});

test("changed workspace copy remains complete in all supported locales", () => {
  for (const locale of supportedLocales) {
    const resourceNetwork = JSON.parse(read(`src/i18n/messages/resource-network/${locale}.json`));
    const workspaceResilience = JSON.parse(read(`src/i18n/messages/workspace-resilience/${locale}.json`));
    for (const key of ["applyFilters", "viewCommunication", "noMessages"]) {
      assert.ok(resourceNetwork[key], `${locale} is missing Resource Network ${key}.`);
    }
    for (const key of ["geographyTitle", "geographyLoading", "geographyUnavailable", "marketProfileTitle", "marketProfileLoading", "marketProfileUnavailable", "enrichmentTitle", "enrichmentLoading", "enrichmentUnavailable"]) {
      assert.ok(workspaceResilience[key], `${locale} is missing workspace resilience ${key}.`);
    }
  }
});

test("live workspace sources retain bounded hydration, scoped refresh, and streaming isolation", () => {
  const resourcePage = read("app/resources/page.tsx");
  const resourceWorkspace = read("src/components/resource-network/ResourceNetworkWorkspace.tsx");
  const accountPage = read("app/organization-profile/page.tsx");
  const marketProfileRuntime = read("src/infrastructure/market-profile/runtime.ts");

  assert.match(resourcePage, /selectedRequestId\s*\?\s*await service\.messages/);
  assert.match(resourcePage, /Promise\.allSettled\(\[\s*referralsPromise,\s*ownerPromise/);
  assert.doesNotMatch(resourcePage, /Promise\.all\(requestReferrals\.map/);
  assert.doesNotMatch(resourceWorkspace, /window\.location\.reload/);
  assert.match(resourceWorkspace, /router\.refresh\(\)/);
  for (const parameter of ["q", "availability", "provider", "resource", "request"]) {
    assert.match(resourceWorkspace, new RegExp(`"${parameter}"`));
  }
  assert.match(accountPage, /settleOptionalWorkspacePanel/);
  assert.ok((accountPage.match(/<Suspense/g) ?? []).length >= 3);
  assert.doesNotMatch(accountPage, /Promise\.all\(\[pendingEnrichment, pendingMap\]\)/);
  assert.match(accountPage, /const enrichmentResult = await pendingEnrichment/);
  assert.match(accountPage, /<EnrichmentLocationMapSection/);
  assert.match(marketProfileRuntime, /geographyDefinitions\.getById\(id\)/);
  assert.match(accountPage, /serviceGeographies=\{marketProfile\.serviceGeographies\}/);
  assert.doesNotMatch(accountPage, /label:\s*id/);
});
