import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const domain = await readFile("src/domain/acquisition/model.ts", "utf8");
const projection = await readFile("src/domain/acquisition/public-opportunity.ts", "utf8");
const service = await readFile("src/application/acquisition/acquisition-context.ts", "utf8");
const session = await readFile("app/api/auth/session/route.ts", "utf8");
const publicRoute = await readFile("app/api/acquisition/start/route.ts", "utf8");
const continuation = await readFile("app/acquisition/continue/page.tsx", "utf8");
const rules = await readFile("firestore.rules", "utf8");
const workflow = await readFile(".github/workflows/ci.yml", "utf8");

for (const kind of [
  "opportunity",
  "organization-claim",
  "referral",
  "team-invitation",
  "provider",
  "buyer-need",
  "direct",
]) {
  assert.ok(domain.includes(`\"${kind}\"`), `ACQ-003 semantic context is missing ${kind}.`);
}
for (const required of [
  "ACQUISITION_CONTEXT_VERSION",
  "browserSecretDigest",
  "boundUserId",
  "boundAccessJourneyId",
  "expiresAt",
  "firstResumedAt",
  "another participant journey",
]) {
  assert.ok(domain.includes(required), `Acquisition envelope is missing ${required}.`);
}
assert.ok(projection.includes("projectPermittedPublicOpportunity"));
assert.ok(projection.includes('publicationState !== "published"'));
assert.ok(projection.includes('visibility !== "public"'));
assert.ok(service.includes("issueTrusted") && service.includes("issuePublicOpportunity") && service.includes("async resume"));
assert.ok(!publicRoute.includes("issueTrusted"), "Public callers cannot mint protected workflow contexts.");
assert.ok(session.includes("activationJourneyIdForUser") && session.includes("acquisitionStatus"));
assert.ok(continuation.includes("It did not grant organization authority"));
assert.match(rules, /match \/acquisitionContexts\/\{documentId\}/);
assert.match(rules, /match \/acquisitionContextEvents\/\{documentId\}/);
assert.ok(workflow.includes("smoke-acquisition-continuity-emulator.mjs"));

console.log("ACQ-002/003 acquisition continuity architecture validated.");
