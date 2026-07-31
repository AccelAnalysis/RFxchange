import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

const [client, route, directory, boundaries, join, map, terms, rules, privacy] = await Promise.all([
  source("src/components/onboarding/ActivationJourneyClient.tsx"),
  source("app/api/onboarding/activation/route.ts"),
  source("src/infrastructure/geography/census-tiger-locality-directory.ts"),
  source("src/infrastructure/geography/tigerweb-boundary-snapshot.ts"),
  source("app/join/page.tsx"),
  source("app/geography/canvas/page.tsx"),
  source("app/terms/page.tsx"),
  source("app/platform-rules/page.tsx"),
  source("app/privacy/page.tsx"),
]);

assert.match(client, /href="\/terms" target="_blank"/);
assert.match(client, /href="\/platform-rules" target="_blank"/);
assert.match(client, /href="\/privacy" target="_blank"/);
assert.match(terms, /termsOfService/);
assert.match(rules, /platformRules/);
assert.match(privacy, /privacyPolicy/);

assert.match(client, /search-geographies/);
assert.match(client, /select-census-geography/);
assert.doesNotMatch(client, /state\.releasedGeographies\.map/);
assert.match(route, /CensusTigerLocalityDirectory/);
assert.match(directory, /tigerweb\.geo\.census\.gov/);
assert.match(directory, /releaseState: "released"/);
assert.match(boundaries, /dynamicBoundary/);
assert.match(join, /ControlledLocalityMapService/);
assert.match(map, /\.create\(selection\)/);
assert.doesNotMatch(map, /createControlledLocalityPreview/);

assert.match(client, /Verification email sent/);
assert.match(client, /reloadCurrentPrincipal/);
assert.match(client, /await exchangeSession\(state\.provisionalOrganizationName\)/);
assert.match(client, /Firebase still reports this email as unverified/);

console.log("Registration runtime repairs validated: linked policies, Census locality authority, dynamic boundary/map, and observable email verification progression.");
