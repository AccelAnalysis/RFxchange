import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(path), "utf8");
const catalog = read("src/application/network-education/catalog.ts");
const service = read("src/application/network-education/network-education.ts");
const route = read("app/api/network-education/route.ts");
const page = read("app/quick-start/page.tsx");
const workspace = read("src/components/network-education/QuickStartWorkspace.tsx");
const explainer = read("src/components/network-education/WorkflowExplainer.tsx");
const rules = read("firestore.rules");
const tracker = read("docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md");
const architecture = read("docs/architecture/WAVE_3_SLICE_3_8.md");
const workflow = read(".github/workflows/ci.yml");

for (const key of ["quick-start", "business", "issuer", "resource-provider"]) assert.ok(catalog.includes(`key: "${key}"`));
for (const routeValue of ["/organization-profile", "/geography/canvas", "/referrals", "/provider-application", "/resources"]) assert.ok(catalog.includes(`"${routeValue}"`));
assert.match(catalog, /"issuer-rfx"[\s\S]*?"planned", null/);
assert.match(catalog, /"business-credibility"[\s\S]*?"planned", null/);
assert.match(service, /networkEducationProgressId\(userId: string, organizationId: string, membershipId: string\)/);
assert.match(service, /getCommand\(idempotencyKey\)/);
assert.match(service, /Education progress changed/);
assert.match(route, /resolveParticipantRoute/);
assert.match(route, /lifecycleState !== "open-platform"/);
assert.match(page, /createServerNetworkEducationService\(\)\.snapshot/);
assert.match(workspace, /Understandable|valueSpine/);
assert.match(workspace, /catalogUpdateAvailable/);
assert.match(workspace, /className=\{styles\.recommendation\} aria-label=\{t\("networkEducation\.recommended"\)\}/);
assert.doesNotMatch(workspace, /aria-labelledby="education-recommendation"/);
for (const question of ["questions.what", "questions.why", "questions.happens", "questions.next"]) assert.ok(explainer.includes(question));
assert.match(explainer, /<details/);
assert.doesNotMatch(explainer, /aria-modal|role="dialog"/);
for (const collection of ["networkEducationProgress", "networkEducationEvents", "networkEducationCommands"]) {
  assert.match(rules, new RegExp(`match \\/${collection}\\/\\{documentId\\}`));
}
for (const locale of ["en-US", "es", "fr", "it", "de"]) {
  const messages = JSON.parse(read(`src/i18n/messages/network-education/${locale}.json`));
  assert.equal(Object.keys(messages.explainers).length, 11);
  for (const value of Object.values(messages.explainers)) {
    assert.ok(value.what && value.why && value.happens && value.next);
  }
}
assert.match(tracker, /438 total · 157 Done · 281 Not Started/);
assert.match(tracker, /Network: \*\*38\/38\*\*/);
assert.match(tracker, /\[x\] `EDU-016`/);
assert.match(tracker, /\[x\] `EDU-017`/);
assert.match(architecture, /438\/438 architecture tests/);
assert.match(architecture, /zero residual education records/);
assert.match(workflow, /smoke-resource-network-emulator\.mjs/);
assert.match(workflow, /smoke-network-education-emulator\.mjs/);
console.log("Slice 3.8 Persistent Network Education validation passed: versioned role paths, durable isolated progress, truthful future stops, four-question explainers, five locales, and server-only authority boundaries are present.");
