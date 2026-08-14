import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("Intelligence query actions preserve the revalidated selected organization", () => {
  const workspace = read("src/components/participant/ExistingWorkspaceFoundation.tsx");

  assert.match(
    workspace,
    /selectedOrganizationId\?: string \| null;[\s\S]*params\.set\("selectedOrganization", input\.selectedOrganizationId\)/,
    "The shared Intelligence URL builder must carry selectedOrganization when one is present.",
  );
  assert.match(
    workspace,
    /const selectedOrganizationQueryId = selectedHome \? null : selectedOrganizationId;/,
    "Only a currently selected external organization should be carried as selectedOrganization.",
  );
  assert.match(
    workspace,
    /const returnHref = buildDiscoveryUrl\(\{[\s\S]*?selectedOrganizationId: selectedOrganizationQueryId,[\s\S]*?page,/,
    "The saved Intelligence return URL must preserve the selected organization.",
  );
  assert.match(
    workspace,
    /name="selectedOrganization" value=\{selectedOrganizationQueryId\}/,
    "The Intelligence GET search form must submit selectedOrganization.",
  );
  assert.match(
    workspace,
    /const clearHref = buildDiscoveryUrl\(\{[\s\S]*?capability: "",[\s\S]*?serviceAreaId: null,[\s\S]*?selectedOrganizationId: selectedOrganizationQueryId,/,
    "Clear must remove search/filter criteria without dropping the selected organization.",
  );

  const paginationStart = workspace.indexOf("className={styles.networkPagination}");
  const paginationEnd = workspace.indexOf("<p className={styles.matchDisclaimer}", paginationStart);
  assert.ok(paginationStart >= 0 && paginationEnd > paginationStart, "Intelligence pagination block was not found.");
  const pagination = workspace.slice(paginationStart, paginationEnd);
  assert.equal(
    pagination.match(/selectedOrganizationId: selectedOrganizationQueryId/g)?.length ?? 0,
    2,
    "Both previous and next pagination links must preserve selectedOrganization.",
  );
});

test("the server still revalidates carried Intelligence focus instead of trusting client state", () => {
  const page = read("app/geography/canvas/page.tsx");

  assert.match(page, /const selectedOrganizationId = firstSearchParam\(params\.selectedOrganization\)/);
  assert.match(page, /focusedOrganizationId: selectedOrganizationId/);
  assert.match(
    page,
    /if \(selectedOrganizationId && !focusedOrganization\)[\s\S]*loadAuthorizedNetworkDiscovery\(\{[\s\S]*focusedOrganizationId: selectedOrganizationId/,
    "A carried selectedOrganization must remain subject to current server-authorized discovery/revalidation.",
  );
});
