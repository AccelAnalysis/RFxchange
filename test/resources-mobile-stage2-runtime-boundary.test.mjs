import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  authorizedWorkspaceSelection,
  parseResourceNetworkWorkspaceQuery,
} from "../src/application/resource-network/resource-network-workspace.ts";

test("Resources workspace parses and bounds selected Resource identity independently", () => {
  const parsed = parseResourceNetworkWorkspaceQuery({
    q: "  capital support  ",
    availability: "limited",
    organization: "org-provider",
    provider: "org-provider",
    resource: "resource-123",
    request: "request-456",
  });
  assert.deepEqual(parsed, {
    query: "capital support",
    availability: "limited",
    organizationId: "org-provider",
    providerId: "org-provider",
    resourceId: "resource-123",
    requestId: "request-456",
  });
  assert.equal(authorizedWorkspaceSelection(parsed.resourceId, ["resource-123"]), "resource-123");
  assert.equal(authorizedWorkspaceSelection(parsed.resourceId, ["resource-other"]), null);
});

test("Resources discovery remains independent from private request and provider-management permissions", async () => {
  const source = await readFile(new URL("../app/resources/page.tsx", import.meta.url), "utf8");
  assert.match(source, /const referralManage = permissions\.includes\("referral\.manage"\);/);
  assert.match(source, /const resourceManage = permissions\.includes\("resource\.manage"\);/);
  assert.match(
    source,
    /const referralsPromise = referralManage[\s\S]*?createServerReferralNetworkService\(\)\.snapshot\(actor\)[\s\S]*?: Promise\.resolve\(\[\]\);/,
  );
  assert.match(
    source,
    /const ownerPromise = resourceManage[\s\S]*?service\.ownerSnapshot\(actor\)[\s\S]*?: Promise\.resolve\(null\);/,
  );
  assert.doesNotMatch(
    source,
    /const referralsPromise = createServerReferralNetworkService\(\)\.snapshot\(actor\);/,
  );
  assert.match(source, /const selectedResourceId = authorizedWorkspaceSelection\(/);
  assert.match(source, /resourceId: selectedResourceId/);
});
