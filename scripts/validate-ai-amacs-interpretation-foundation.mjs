import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [gateway, provider, repository, rules, interpretRoute, dispositionRoute, tracker] = await Promise.all([
  read("src/application/ai-interpretation/gateway.ts"), read("src/infrastructure/ai-interpretation/openai-responses-adapter.ts"),
  read("src/infrastructure/firestore/ai-interpretation-repository.ts"), read("firestore.rules"),
  read("app/api/ai/amacs/interpret/route.ts"), read("app/api/ai/amacs/disposition/route.ts"),
  read("docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md"),
]);

assert.match(gateway, /human_confirmation_required: true/);
assert.match(gateway, /authoritative_effect: "none"/);
assert.match(gateway, /outside the bounded retrieval set/);
assert.doesNotMatch(gateway, /createOrganizationCapability|createRfxRequirement|publishRfx/);
assert.match(provider, /store: false/);
assert.match(provider, /json_schema/);
assert.match(provider, /OPENAI_API_KEY/);
assert.doesNotMatch(interpretRoute + dispositionRoute, /OPENAI_API_KEY|api\.openai\.com/);
for (const collection of ["aiInterpretationRecords", "aiInterpretationCandidates", "aiInterpretationProvenance", "aiInterpretationUsageEvents", "aiInterpretationEvents", "aiInterpretationQuotaBuckets"]) assert.match(rules, new RegExp(`match /${collection}`));
assert.match(repository, /Daily \$\{entry\.dimension\.kind\} AI interpretation quota is exhausted/);
assert.match(tracker, /AI\/AMACS Interpretation Foundation — COMPLETE VIA PR #124; no Feature IDs/);
assert.match(tracker, /Network completion remains \*\*11\/38\*\*/);

console.log("AI/AMACS interpretation foundation validation passed: non-authoritative, release-bound, private, metered, and tracker-neutral.");
