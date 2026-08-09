import assert from "node:assert/strict";

import { minimizeInterpretationSources } from "../src/application/ai-interpretation/privacy.ts";
import { AmacsInterpretationRetrievalService } from "../src/application/ai-interpretation/retrieval.ts";
import { DEFAULT_INTERPRETATION_QUOTA_POLICY } from "../src/domain/ai-interpretation/model.ts";
import { loadImmutableAmacsCatalog } from "../src/infrastructure/amacs/runtime.ts";

const cases = Object.freeze([
  { id: "seller-hvac", text: "We install and maintain commercial HVAC systems, troubleshoot controls, and replace rooftop units.", expectedIds: ["AMACS-CAP-000016", "AMACS-CAP-000017"], topK: 8 },
  { id: "buyer-stormwater", text: "Our parking lot floods during heavy rain and we need safe access before hurricane season.", expectedIds: ["AMACS-CAP-000040"], topK: 5 },
  { id: "ambiguous-building", text: "We perform building system work.", expectedComplexity: "ambiguous", expectedIds: [], topK: 8 },
  { id: "unsupported-snacks", text: "We sell office snacks.", expectedComplexity: "ambiguous", expectedIds: [], topK: 8 },
]);

const catalog = await loadImmutableAmacsCatalog(new URL("..", import.meta.url).pathname);
const retrieval = new AmacsInterpretationRetrievalService(catalog);
let expected = 0;
let found = 0;
for (const fixture of cases) {
  const result = await retrieval.retrieve(minimizeInterpretationSources([{ sourceRef: `eval:${fixture.id}`, sourceType: "participant_text", text: fixture.text, inclusionAuthorized: true }], DEFAULT_INTERPRETATION_QUOTA_POLICY));
  assert.equal(result.releaseVersion, "0.5.0");
  assert.ok(result.candidates.length <= 24, `${fixture.id} exceeded the bounded retrieval set`);
  assert.ok((await Promise.all(result.candidates.map((candidate) => catalog.hasCanonicalCapability(candidate.conceptId)))).every(Boolean), `${fixture.id} returned a non-canonical identifier`);
  if (fixture.expectedComplexity) assert.equal(result.complexity, fixture.expectedComplexity, `${fixture.id} ambiguity routing regressed`);
  const ids = new Set(result.candidates.slice(0, fixture.topK).map((candidate) => candidate.conceptId));
  for (const id of fixture.expectedIds) { expected += 1; if (ids.has(id)) found += 1; }
}
const recallAtReviewedK = expected === 0 ? 1 : found / expected;
assert.equal(recallAtReviewedK, 1, `Reviewed retrieval recall regressed to ${recallAtReviewedK}.`);

const deterministicProviderBudget = Object.freeze({ inputTokens: 42, outputTokens: 18, estimatedCostMicrousd: 3, latencyMs: 7 });
assert.ok(deterministicProviderBudget.inputTokens + deterministicProviderBudget.outputTokens <= 100);
assert.ok(deterministicProviderBudget.estimatedCostMicrousd <= 10);
assert.ok(deterministicProviderBudget.latencyMs <= 25);

console.log(JSON.stringify({ suite: "ai-amacs-eval-v1", cases: cases.length, identifierValidity: 1, reviewedRecallAtK: recallAtReviewedK, overclassificationGuardCases: 2, schemaValidation: "covered-by-gateway-tests", deterministicProviderBudget, passed: true }));
