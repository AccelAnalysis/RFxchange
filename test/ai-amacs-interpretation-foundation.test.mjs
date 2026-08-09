import assert from "node:assert/strict";
import test from "node:test";

import { AiAmacsInterpretationGateway, InterpretationGatewayError } from "../src/application/ai-interpretation/gateway.ts";
import { ManualAmacsCatalogService } from "../src/application/ai-interpretation/manual-catalog.ts";
import { minimizeInterpretationSources } from "../src/application/ai-interpretation/privacy.ts";
import { AmacsInterpretationRetrievalService } from "../src/application/ai-interpretation/retrieval.ts";
import { DEFAULT_INTERPRETATION_QUOTA_POLICY } from "../src/domain/ai-interpretation/model.ts";
import { loadImmutableAmacsCatalog } from "../src/infrastructure/amacs/runtime.ts";
import { loadAmacsRuntimeSchemaValidator } from "../src/infrastructure/amacs/runtime-schema-validator.ts";
import { OpenAiResponsesInterpretationAdapter } from "../src/infrastructure/ai-interpretation/openai-responses-adapter.ts";

const root = new URL("..", import.meta.url).pathname;

function source(text, overrides = {}) {
  return { sourceRef: "participant:statement:1", sourceType: "participant_text", text, inclusionAuthorized: true, ...overrides };
}

function harness(providerProposal) {
  const state = { completed: null, failures: [], calls: 0, reservations: 0, dispositionCalls: [] };
  const repository = {
    async getRecord(id) { return state.completed?.record.id === id ? state.completed.record : null; },
    async getCandidate(id) { return state.completed?.candidates.find((candidate) => candidate.id === id) ?? null; },
    async saveCompleted(input) { state.completed = input; },
    async saveFailureEvidence(input) { state.failures.push(input); },
    async applyCandidateDisposition(input) { state.dispositionCalls.push(input); return state.completed.record; },
    async applyNoneOfThese(input) { state.noneOfThese = input; return state.completed.record; },
  };
  return { state, repository, dependencies: {
    authority: { async authorize(input) { return input.context === "deny" ? { allowed: false, reason: "missing-permission" } : { allowed: true, scope: { organizationId: input.organizationId, membershipId: input.membershipId, userId: "user-1", tenantId: input.organizationId } }; } },
    featurePolicy: { async inspect() { return { enabled: true, reason: "enabled" }; } },
    provider: { availability() { return { available: true, provider: "deterministic-fake", primaryModel: "eval-v1", escalationModel: null }; }, async interpret(input) { state.calls += 1; return { provider: "deterministic-fake", model: "eval-v1", providerRequestId: "fake-request-1", proposals: providerProposal(input), usage: { inputTokens: 42, outputTokens: 18, cachedInputTokens: 0 }, latencyMs: 7, estimatedCostMicrousd: 3, costBasis: "configured-estimate" }; } },
    repository, quota: { async reserve(input) { state.reservations += 1; return { id: "quota-1", policyVersion: input.policy.version, day: input.now.slice(0, 10), estimatedInputTokens: input.estimatedInputTokens }; } },
    observer: { record() {} }, now: () => "2026-08-08T12:00:00.000Z", id: (() => { let id = 0; return () => String(++id).padStart(4, "0"); })(),
  } };
}

test("privacy boundary redacts sensitive values and requires document opt-in", () => {
  const minimized = minimizeInterpretationSources([source("Email me at person@example.com; token=abc123secretlongvalue and call 202-555-0136")], DEFAULT_INTERPRETATION_QUOTA_POLICY);
  assert.doesNotMatch(minimized[0].minimizedText, /person@example|202-555|abc123secret/);
  assert.equal(minimized[0].redactionCount, 3);
  assert.throws(() => minimizeInterpretationSources([source("private file", { sourceType: "participant_document" })], DEFAULT_INTERPRETATION_QUOTA_POLICY), /opt-in/);
});

test("bounded retrieval finds release-valid HVAC and stormwater concepts", async () => {
  const catalog = await loadImmutableAmacsCatalog(root);
  const retrieval = new AmacsInterpretationRetrievalService(catalog);
  const hvac = await retrieval.retrieve(minimizeInterpretationSources([source("We install and maintain commercial HVAC systems and replace rooftop units")], DEFAULT_INTERPRETATION_QUOTA_POLICY));
  assert.ok(hvac.candidates.slice(0, 8).some((candidate) => candidate.conceptId === "AMACS-CAP-000016"));
  assert.equal(hvac.releaseVersion, "0.5.0");
  const stormwater = await retrieval.retrieve(minimizeInterpretationSources([source("Our parking lot floods during heavy rain before hurricane season")], DEFAULT_INTERPRETATION_QUOTA_POLICY));
  assert.ok(stormwater.candidates.slice(0, 8).some((candidate) => candidate.conceptId === "AMACS-CAP-000040"));
  assert.ok(stormwater.candidates.length <= 24);
});

test("gateway persists schema-valid suggestions with provenance and no authoritative effect", async () => {
  const catalog = await loadImmutableAmacsCatalog(root);
  const validator = await loadAmacsRuntimeSchemaValidator(root);
  const fixture = harness((input) => [{ amacsId: input.retrievedCandidates.find((candidate) => candidate.conceptId === "AMACS-CAP-000016").conceptId, targetKind: "organization_capability_assertion", rationale: "The participant explicitly states installation work.", confidence: 0.94, ambiguityStatus: "none", clarificationQuestion: null, sourceIndices: [0], provisionalLabel: null, provisionalDefinition: null }]);
  const gateway = new AiAmacsInterpretationGateway({ ...fixture.dependencies, catalog, validator });
  const result = await gateway.interpret({ context: null, organizationId: "org-1", membershipId: "membership-1", purpose: "seller_capability_declaration", sources: [source("We install and maintain commercial HVAC systems and replace rooftop units")] });
  assert.equal(result.authoritativeEffect, "none");
  assert.equal(result.record.record.human_confirmation_required, true);
  assert.equal(result.candidates[0].candidate.disposition, "suggested");
  assert.equal(fixture.state.completed.provenance.providerStore, false);
  assert.equal(fixture.state.completed.provenance.sourceRetention, "references-and-redacted-excerpts-only");
  assert.equal(fixture.state.completed.usage.organizationId, "org-1");
  assert.equal((await validator.validate("interpretation-record.schema.json", result.record.record)).valid, true);
  assert.equal((await validator.validate("interpretation-candidate.schema.json", result.candidates[0].candidate)).valid, true);
});

test("authorization occurs before quota or provider use and invented IDs fail closed", async () => {
  const catalog = await loadImmutableAmacsCatalog(root);
  const validator = await loadAmacsRuntimeSchemaValidator(root);
  const denied = harness(() => []);
  const deniedGateway = new AiAmacsInterpretationGateway({ ...denied.dependencies, catalog, validator });
  await assert.rejects(() => deniedGateway.interpret({ context: "deny", organizationId: "org-1", membershipId: "membership-1", purpose: "seller_capability_declaration", sources: [source("HVAC service")] }), (error) => error instanceof InterpretationGatewayError && error.code === "forbidden");
  assert.equal(denied.state.calls, 0); assert.equal(denied.state.reservations, 0);
  const invented = harness(() => [{ amacsId: "AMACS-CAP-999999", targetKind: "organization_capability_assertion", rationale: "Unsupported", confidence: 0.99, ambiguityStatus: "none", clarificationQuestion: null, sourceIndices: [0], provisionalLabel: null, provisionalDefinition: null }]);
  await assert.rejects(() => new AiAmacsInterpretationGateway({ ...invented.dependencies, catalog, validator }).interpret({ context: null, organizationId: "org-1", membershipId: "membership-1", purpose: "seller_capability_declaration", sources: [source("HVAC service")] }), /outside the bounded retrieval set/);
  assert.equal(invented.state.completed, null);
  assert.equal(invented.state.failures.length, 1);
  assert.equal(invented.state.failures[0].provenance.failureClass, "structured-output-provider");
});

test("none-of-these records disposition only and manual catalog works without a provider", async () => {
  const catalog = await loadImmutableAmacsCatalog(root);
  const validator = await loadAmacsRuntimeSchemaValidator(root);
  const fixture = harness((input) => [{ amacsId: input.retrievedCandidates[0].conceptId, targetKind: "organization_capability_assertion", rationale: "Possible match", confidence: 0.5, ambiguityStatus: "needs_clarification", clarificationQuestion: "Which work do you perform?", sourceIndices: [0], provisionalLabel: null, provisionalDefinition: null }]);
  const gateway = new AiAmacsInterpretationGateway({ ...fixture.dependencies, catalog, validator });
  const created = await gateway.interpret({ context: null, organizationId: "org-1", membershipId: "membership-1", purpose: "seller_capability_declaration", sources: [source("building services")] });
  await gateway.disposition({ context: null, organizationId: "org-1", membershipId: "membership-1", recordId: created.record.id, decision: { disposition: "none-of-these" } });
  assert.equal(fixture.state.noneOfThese.event.authoritativeEffect, "none");
  const manual = new ManualAmacsCatalogService(catalog);
  assert.equal((await manual.release()).version, "0.5.0");
  assert.ok((await manual.search({ query: "HVAC installation", page: 1, pageSize: 5 })).results.length > 0);
});

test("all participant disposition outcomes remain non-authoritative", async () => {
  const catalog = await loadImmutableAmacsCatalog(root);
  const validator = await loadAmacsRuntimeSchemaValidator(root);
  const fixture = harness((input) => [{ amacsId: input.retrievedCandidates[0].conceptId, targetKind: "organization_capability_assertion", rationale: "Candidate only", confidence: 0.6, ambiguityStatus: "needs_clarification", clarificationQuestion: "Confirm?", sourceIndices: [0], provisionalLabel: null, provisionalDefinition: null }]);
  const gateway = new AiAmacsInterpretationGateway({ ...fixture.dependencies, catalog, validator });
  const created = await gateway.interpret({ context: null, organizationId: "org-1", membershipId: "membership-1", purpose: "seller_capability_declaration", sources: [source("building maintenance")] });
  for (const disposition of ["accepted", "edited", "rejected", "unresolved", "withdrawn"]) {
    await gateway.disposition({ context: null, organizationId: "org-1", membershipId: "membership-1", recordId: created.record.id, candidateId: created.candidates[0].id, expectedUpdatedAt: created.candidates[0].updatedAt, decision: disposition === "edited" ? { disposition, editedTextValue: "Participant-corrected wording" } : { disposition } });
  }
  assert.deepEqual(fixture.state.dispositionCalls.map((call) => call.disposition), ["accepted", "edited", "rejected", "unresolved", "withdrawn"]);
  assert.ok(fixture.state.dispositionCalls.every((call) => call.event.authoritativeEffect === "none"));
});

test("OpenAI adapter reports truthful disabled states without network calls", () => {
  const priorEnabled = process.env.RFXCHANGE_AI_PROVIDER_ENABLED;
  delete process.env.RFXCHANGE_AI_PROVIDER_ENABLED;
  assert.deepEqual(new OpenAiResponsesInterpretationAdapter({ apiKey: "" }).availability(), { available: false, reason: "provider-disabled", provider: "openai" });
  process.env.RFXCHANGE_AI_PROVIDER_ENABLED = "true";
  assert.deepEqual(new OpenAiResponsesInterpretationAdapter({ apiKey: "" }).availability(), { available: false, reason: "missing-secret", provider: "openai" });
  if (priorEnabled === undefined) delete process.env.RFXCHANGE_AI_PROVIDER_ENABLED; else process.env.RFXCHANGE_AI_PROVIDER_ENABLED = priorEnabled;
});

test("all four AMACS semantic-entry schemas are loaded by the runtime validator", async () => {
  const validator = await loadAmacsRuntimeSchemaValidator(root);
  for (const schema of ["market-need.schema.json", "interpretation-record.schema.json", "interpretation-candidate.schema.json", "concept-interpretation-guidance.schema.json"]) {
    const result = await validator.validate(schema, {});
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
    assert.ok(result.errors.every((error) => !error.includes("Unsupported AMACS runtime schema")));
  }
});
