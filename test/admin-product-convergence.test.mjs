import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  IMPLEMENTED_ADMIN_RUNTIME_DESTINATION_KEYS,
} from "../src/application/admin/portal-navigation.ts";

function read(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("the administrative product authority defines an attention-first restrained control plane", async () => {
  const authority = await read("docs/design/ADMIN_PORTAL_PRODUCT_AUTHORITY.md");
  const context = await read("docs/context/ADMINISTRATION.md");
  assert.match(authority, /attention-first, scope-visible operating workspace/i);
  assert.match(authority, /Less container chrome/);
  assert.match(authority, /Human language over implementation language/);
  assert.match(authority, /only destinations with a truthful implemented runtime/i);
  assert.match(
    authority,
    /authority, verification, provider status, commerce, and credibility remain visibly separate/i,
  );
  assert.match(context, /ADMIN_PORTAL_PRODUCT_AUTHORITY\.md/);
  assert.doesNotMatch(authority, /binary `isAdmin` authorization is permitted/i);
});

test("only truthful current admin runtimes remain registered", () => {
  assert.deepEqual(
    IMPLEMENTED_ADMIN_RUNTIME_DESTINATION_KEYS,
    ["overview", "work-queues", "organization-claims", "resource-providers"],
  );
});

test("live administrative surfaces share one product shell", async () => {
  const claimsPage = await read("app/admin/organization-claims/page.tsx");
  const providerPage = await read("app/admin/resource-providers/page.tsx");
  const organizationPage = await read("app/admin/organizations/[organizationId]/page.tsx");
  const overviewPage = await read("app/admin/overview/page.tsx");
  const queuesPage = await read("app/admin/work-queues/page.tsx");

  for (const source of [claimsPage, providerPage, organizationPage, overviewPage, queuesPage]) {
    assert.match(source, /AdminPortalShell/);
  }

  assert.doesNotMatch(claimsPage, /styles\.sidebar/);
  assert.doesNotMatch(claimsPage, /Runtime convergence/);
  assert.doesNotMatch(claimsPage, /Grant \{/);
  assert.doesNotMatch(organizationPage, /page\.module\.css/);
});

test("the shared shell keeps scope visible, exposes bounded search and uses compact responsive navigation", async () => {
  const shell = await read("src/components/admin/AdminPortalShell.tsx");
  const commandBar = await read("src/components/admin/AdminPortalCommandBar.tsx");
  const navigation = await read("src/components/admin/AdminPortalNavigation.tsx");
  const styles = await read("src/components/admin/AdminPortalShell.module.css");

  assert.match(shell, /Current access/);
  assert.match(shell, /All authorized records/);
  assert.match(commandBar, /\/admin\/search/);
  assert.match(commandBar, /minLength=\{2\}/);
  assert.match(navigation, /aria-expanded=\{open\}/);
  assert.match(navigation, /Available now/);
  assert.match(styles, /\.navigation\[data-open="true"\] \.navigationBody/);
  assert.match(styles, /var\(--warm-ivory/);
  assert.match(styles, /var\(--rf-gold/);
  assert.doesNotMatch(styles, /overflow-x:\s*auto/);
});

test("provider review presents organization identity and canonical action hierarchy", async () => {
  const consoleSource = await read("src/components/resource-providers/ProviderReviewConsole.tsx");
  const styles = await read("src/components/resource-providers/ProviderReviewConsole.module.css");

  assert.match(consoleSource, /readonly displayName: string/);
  assert.match(consoleSource, /application\.displayName/);
  assert.match(consoleSource, /Minimum-necessary application projection/);
  assert.match(consoleSource, /Decision workspace/);
  assert.match(consoleSource, /primaryAction/);
  assert.match(consoleSource, /secondaryAction/);
  assert.match(consoleSource, /dangerAction/);
  assert.doesNotMatch(consoleSource, />Minimum-necessary application</);
  assert.doesNotMatch(consoleSource, /Protected application detail/);
  assert.doesNotMatch(styles, /Georgia\s*,\s*serif/);
  assert.doesNotMatch(styles, /#173a31/i);
  assert.match(styles, /var\(--graphite/);
});

test("Organization 360 avoids a second dashboard shell and developer-facing primary copy", async () => {
  const organizationSource = await read("src/components/admin/Organization360.tsx");
  const styles = await read("src/components/admin/Organization360.module.css");

  assert.match(organizationSource, /Authority|Account &amp; access/);
  assert.match(organizationSource, /Separate from credibility and verification/);
  assert.doesNotMatch(organizationSource, /Organization scope/);
  assert.doesNotMatch(organizationSource, /Scoped context/);
  assert.doesNotMatch(organizationSource, /fabricating future-domain data/);
  assert.doesNotMatch(organizationSource, /<code>\{projection\.scope\.organizationId\}<\/code>/);
  assert.match(styles, /var\(--warm-ivory/);
  assert.match(styles, /box-shadow:\s*inset 3px 0 var\(--rf-gold/);
  assert.doesNotMatch(styles, /overflow-x:\s*auto/);
});

test("operating core uses real providers, canonical cases and responsive list-to-inspector continuity", async () => {
  const runtime = await read("src/infrastructure/admin/operating-core-runtime.ts");
  const queue = await read("src/components/admin/AdminWorkQueueWorkspace.tsx");
  const casePage = await read("app/admin/cases/[caseId]/page.tsx");
  const caseApi = await read("app/api/admin/cases/[caseId]/transition/route.ts");
  const searchPage = await read("app/admin/search/page.tsx");
  const styles = await read("src/components/admin/AdminOperatingCore.module.css");

  for (const collection of [
    "organizationAuthorityClaims",
    "providerApplications",
    "administrative",
    "accessRestrictions",
    "backgroundJobs",
  ]) assert.match(runtime, new RegExp(collection));
  assert.match(runtime, /authorityWithActiveGlobalGrants/);
  assert.match(queue, /Open full case/);
  assert.match(casePage, /CASE:/);
  assert.match(caseApi, /expectedStatus/);
  assert.match(searchPage, /universalAdminSearch/);
  assert.match(styles, /\.queueLayout/);
  assert.match(styles, /@media \(max-width: 980px\)/);
  assert.doesNotMatch(queue, /<table/);
});
