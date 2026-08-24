import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [model, service, repository, runtime, route, page, panel, styles, discovery, workspace, rules, schema, tests, smoke, slice, copy] = await Promise.all([
  read("src/domain/market-profile/model.ts"), read("src/application/market-profile/market-profile.ts"),
  read("src/infrastructure/firestore/market-profile.ts"), read("src/infrastructure/market-profile/runtime.ts"),
  read("app/api/organization-market-profile/route.ts"), read("app/organization-profile/page.tsx"),
  read("src/components/market-profile/MarketProfilePanel.tsx"), read("src/components/market-profile/MarketProfilePanel.module.css"),
  read("src/application/network-discovery/network-discovery.ts"), read("src/components/participant/ExistingWorkspaceFoundation.tsx"),
  read("firestore.rules"), read("src/infrastructure/firestore/schema.ts"), read("test/market-profile-enrichment.test.mjs"),
  read("scripts/smoke-market-profile-enrichment-emulator.mjs"), read("docs/slices/SLICE_3_3_MARKET_PROFILE_ENRICHMENT.md"),
  read("src/i18n/messages/market-profile/en-US.json"),
]);

for (const id of ["ORG-013", "ORG-014", "ORG-016", "ORG-017"]) assert.match(slice, new RegExp(id));
assert.match(model, /OrganizationCapabilityClaim/);
assert.match(model, /amacsReleaseVersion/);
assert.match(model, /assertionStatus: "self_reported"/);
assert.match(model, /OrganizationIndustryProfile/);
assert.match(model, /OrganizationPastPerformance/);
assert.match(model, /OrganizationMarketPreferences/);
assert.match(model, /OrganizationProvisionalTerm/);
assert.match(model, /counterparty_confirmed/);
assert.match(model, /independently_verified/);
assert.match(service, /permission: "organization\.profile\.manage"/);
assert.match(service, /catalog\.getCapability/);
assert.match(service, /catalog\.listMarketRoles/);
assert.match(service, /naicsCatalog\.getIndustry/);
assert.match(service, /candidate\.updatedAt !== input\.source\.candidateUpdatedAt/);
assert.match(service, /\["accepted", "edited"\]/);
assert.match(service, /requestFingerprint/);
assert.match(service, /createOrganizationActionAuditEvent/);
assert.match(repository, /runTransaction/);
assert.match(repository, /organizationMarketProfileCommands/);
assert.match(runtime, /loadImmutableAmacsCatalog/);
assert.match(runtime, /loadImmutableNaicsCatalog/);
assert.match(route, /Same-origin request required/);
assert.match(route, /resolveParticipantRoute/);
assert.match(route, /requestedOrganizationId/);
assert.match(page, /loadAuthorizedMarketProfile/);
assert.match(page, /MarketProfilePanel/);
assert.match(panel, /marketProfile\.catalog\.title/);
assert.match(panel, /marketProfile\.assistance\.saveEdit/);
assert.match(panel, /disposition\(envelope, "edited"/);
assert.match(panel, /useI18n/);
assert.match(panel, /aria-pressed/);
assert.match(panel, /marketProfile\.catalog\.resultCount/);
assert.match(panel, /marketProfile\.industry\.selectorTitle/);
assert.doesNotMatch(panel, /name="naicsTitle"|name="naicsVersion"/);
assert.match(copy, /Browse Domain → Family → Capability/);
assert.match(copy, /Search all 615 capabilities/);
assert.match(copy, /None of these describe it/);
assert.match(copy, /Organization-provided capability/);
assert.match(copy, /Verification, RFx qualification, and credibility are separate/);
assert.match(copy, /Assistance is unavailable/);
assert.match(copy, /Save capability/);
assert.match(copy, /not independently verified/i);
assert.doesNotMatch(copy, /Organization-claimed information|Save organization claim|authoritative write|governed NAICS/i);
assert.match(styles, /@media \(max-width: 520px\)/);
assert.match(styles, /prefers-reduced-motion/);
assert.match(discovery, /confirmed-structured/);
assert.match(discovery, /legacy-essential/);
assert.match(discovery, /projectOrganizationCapabilityClaim/);
assert.doesNotMatch(workspace, /provenanceLabel/);
assert.doesNotMatch(workspace, /Legacy activation profile capability/);
assert.doesNotMatch(`${model}\n${service}\n${panel}`, /paid.*(rank|verified)|guaranteed|universal qualification/i);
for (const collection of ["organizationCapabilityClaims", "organizationIndustryProfiles", "organizationPastPerformance", "organizationMarketPreferences", "organizationProvisionalTerms", "organizationMarketProfileEvents", "organizationMarketProfileCommands"]) {
  assert.match(schema, new RegExp(collection));
  assert.match(rules, new RegExp(`match /${collection}`));
  assert.match(smoke, new RegExp(collection));
}
assert.match(tests, /invented catalog IDs/);
assert.match(tests, /wrong organization/);
assert.match(tests, /viewer without profile-management permission/);
assert.match(smoke, /permission-denied/);
assert.match(smoke, /idempotency/);
console.log("Slice 3.3 Market Profile Enrichment architecture validated with customer-language capability confirmation boundaries.");
