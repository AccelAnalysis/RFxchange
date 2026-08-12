import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (value) => fs.readFileSync(path.join(root, value), "utf8");

const domain = read("src/domain/rfx/discovery.ts");
const service = read("src/application/rfx/opportunity-discovery-service.ts");
const repository = read("src/infrastructure/firestore/opportunity-discovery.ts");
const route = read("app/api/opportunities/route.ts");
const page = read("app/opportunities/page.tsx");
const workspace = read("src/components/rfx/OpportunityDiscoveryWorkspace.tsx");
const map = read("src/components/map/ExchangeSpatialScene.tsx");
const templates = read("src/application/rfx/opportunity-alert-templates.ts");
const rules = read("firestore.rules");
const tracker = read("docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md");
const evidence = read("docs/architecture/WAVE_4_SLICE_4_5.md");

for (const contract of ["OpportunityDiscoveryQuery", "SavedOpportunitySearch", "OpportunityWatch", "OpportunitySavedSearchMatchEvent", "OpportunityAlertIntent", "OpportunityRelationCommandReceipt", "OpportunityRelationEvent"]) assert.match(domain, new RegExp(contract));
assert.match(domain, /opportunityQueryFingerprint/);
assert.match(domain, /opportunityWatchId/);
assert.match(domain, /unsupported structured filter/);
assert.match(domain, /requestFamilyIndexKey/);
assert.match(service, /projectionPermitted/);
assert.match(service, /opportunityMatchesQuery/);
assert.match(service, /opportunityDeadlineState/);
assert.match(service, /daily-digest/);
assert.match(service, /createTransactionalEmailRequest/);
assert.match(service, /saved-search criteria matched|oppmatch/);
assert.doesNotMatch(service, /recommendation|awardLikelihood|paidPlacement/);

assert.match(repository, /releasedProjections/);
assert.match(repository, /assertCurrentParticipant/);
assert.match(repository, /runTransaction/);
assert.match(repository, /mergeDailyAlert/);
for (const collection of ["opportunitySavedSearches", "opportunityWatches", "opportunitySavedSearchMatches", "opportunityAlertIntents", "opportunityRelationCommands", "opportunityRelationEvents"]) {
  assert.match(repository + rules, new RegExp(collection));
}
assert.doesNotMatch(workspace + page + route, /firebase-admin|firebase\/firestore/);
assert.match(route, /resolveParticipantRoute/);
assert.match(route, /Same-origin request required/);
assert.match(page, /loadAuthorizedParticipantMapProjection/);
assert.match(page, /createServerOpportunityDiscoveryService/);
assert.match(workspace, /ParticipantShell activeItem="opportunities-rfx"/);
assert.match(workspace, /opportunityMarkers=\{opportunityMarkers\}/);
assert.match(workspace, /data-selected-opportunity-reference/);
assert.match(workspace, /result\.deadlines\.next7Days/);
assert.match(workspace, /Discovery and watching do not mean|rfxWorkspace\.discovery\.detail\.disclaimer/);
assert.match(map, /OPPORTUNITY_MARKER_SOURCE_ID/);
assert.match(map, /#1769aa/i);
assert.doesNotMatch(map, /opportunity.*animation|pulse.*opportunity/i);
assert.match(templates, /rfx\.opportunity-alert/);
assert.match(templates, /not qualification, eligibility, endorsement, or an award prediction/);
assert.match(tracker, /438 total · 175 Done · 263 Not Started/);
assert.match(tracker, /RFx Core: \*\*23\/41\*\*/);
for (const id of ["DSC-004", "DSC-005", "DSC-006", "DSC-007", "DSC-008"]) {
  assert.match(tracker, new RegExp("\\[x\\] `" + id + "`"));
  assert.match(evidence, new RegExp(id));
}

for (const locale of ["en-US", "es", "fr", "it", "de"]) {
  const catalog = JSON.parse(read(`src/i18n/messages/rfx/${locale}.json`));
  assert.ok(catalog.discovery?.search?.truth);
  assert.ok(catalog.discovery?.deadlines?.source);
  assert.ok(catalog.discovery?.detail?.disclaimer);
}

console.log("Wave 4 Slice 4.5 opportunity discovery, saved search, alert, watch, and deadline guardrails validated.");
