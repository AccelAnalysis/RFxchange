import { createHash, randomUUID } from "node:crypto";

import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import type { AmacsCatalogPort, AmacsRuntimeContractValidatorPort } from "../amacs/catalog.ts";
import type {
  AmacsInterpretationCandidate,
  AmacsInterpretationPurpose,
  AmacsInterpretationRecord,
} from "../../domain/amacs/contracts.ts";
import type { AiInterpretationRepository, InterpretationQuotaPort } from "../../domain/ai-interpretation/repository.ts";
import {
  DEFAULT_INTERPRETATION_QUOTA_POLICY,
  type AiInterpretationCandidateEnvelope,
  type AiInterpretationProvenance,
  type AiInterpretationUsageEvent,
  type InterpretationDispositionInput,
  type InterpretationQuotaPolicy,
  type InterpretationSourceInput,
  type MinimizedInterpretationSource,
} from "../../domain/ai-interpretation/model.ts";
import type {
  ContentSafeInterpretationObserver,
  InterpretationAuthorityPort,
  InterpretationFeaturePolicyPort,
  InterpretationProviderPort,
} from "./ports.ts";
import { estimateInterpretationInputTokens, minimizeInterpretationSources, sourceExcerpt } from "./privacy.ts";
import { AmacsInterpretationRetrievalService } from "./retrieval.ts";

export const AI_INTERPRETATION_PROMPT_VERSION = "rfxchange-amacs-interpret-v1";
const INTERPRETATION_PURPOSES = new Set<AmacsInterpretationPurpose>(["seller_capability_declaration", "buyer_need_definition", "provider_service_definition", "evidence_linking", "request_structure", "response_assistance", "outcome_classification", "other"]);
const TARGET_KINDS = new Set(["market_need_dimension", "organization_capability_assertion", "rfx_capability_requirement", "request_family", "property_value", "credential_requirement", "response_section", "decision_factor", "market_role", "provisional_term"]);
const AMBIGUITY_STATUSES = new Set(["none", "needs_clarification", "conflicting_sources", "insufficient_support"]);

export class InterpretationGatewayError extends Error {
  readonly code: "forbidden" | "disabled" | "unavailable" | "quota" | "invalid" | "not-found" | "conflict" | "provider";
  constructor(code: InterpretationGatewayError["code"], message: string) {
    super(message);
    this.name = "InterpretationGatewayError";
    this.code = code;
  }
}

interface Dependencies {
  readonly authority: InterpretationAuthorityPort;
  readonly featurePolicy: InterpretationFeaturePolicyPort;
  readonly provider: InterpretationProviderPort;
  readonly catalog: AmacsCatalogPort;
  readonly validator: AmacsRuntimeContractValidatorPort;
  readonly repository: AiInterpretationRepository;
  readonly quota: InterpretationQuotaPort;
  readonly observer: ContentSafeInterpretationObserver;
  readonly quotaPolicy?: InterpretationQuotaPolicy;
  readonly now?: () => string;
  readonly id?: () => string;
}

export interface InterpretAmacsInput {
  readonly context: AuthenticatedServerContext | null;
  readonly organizationId: string;
  readonly membershipId: string;
  readonly purpose: AmacsInterpretationPurpose;
  readonly subjectRef?: string;
  readonly sources: readonly InterpretationSourceInput[];
}

function safetyIdentifier(userId: string, tenantId: string): string {
  return createHash("sha256").update(`${tenantId}:${userId}`).digest("hex");
}

function boundedText(value: string, field: string, maximum: number): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized || normalized.length > maximum) throw new InterpretationGatewayError("invalid", `${field} must contain 1-${maximum} characters.`);
  return normalized;
}

function sourceEvidence(sources: readonly MinimizedInterpretationSource[], indices: readonly number[]) {
  const unique = [...new Set(indices)];
  if (unique.length === 0 || unique.some((index) => !Number.isInteger(index) || index < 0 || index >= sources.length)) {
    throw new InterpretationGatewayError("provider", "Provider returned invalid source evidence references.");
  }
  return unique.map((index) => {
    const source = sources[index];
    if (!source) throw new InterpretationGatewayError("provider", "Provider source evidence was unavailable.");
    return Object.freeze({ source_ref: source.sourceRef, source_type: source.sourceType, locator: source.locator, excerpt: sourceExcerpt(source) });
  });
}

function assertProviderProposal(value: unknown): asserts value is import("../../domain/ai-interpretation/model.ts").ProviderInterpretationProposal {
  if (!value || typeof value !== "object") throw new InterpretationGatewayError("provider", "Provider returned a malformed interpretation proposal.");
  const proposal = value as Record<string, unknown>;
  if (!(proposal.amacsId === null || typeof proposal.amacsId === "string") || typeof proposal.targetKind !== "string" || !TARGET_KINDS.has(proposal.targetKind) || typeof proposal.rationale !== "string" || typeof proposal.confidence !== "number" || !Number.isFinite(proposal.confidence) || proposal.confidence < 0 || proposal.confidence > 1 || typeof proposal.ambiguityStatus !== "string" || !AMBIGUITY_STATUSES.has(proposal.ambiguityStatus) || !(proposal.clarificationQuestion === null || typeof proposal.clarificationQuestion === "string") || !Array.isArray(proposal.sourceIndices) || !(proposal.provisionalLabel === null || typeof proposal.provisionalLabel === "string") || !(proposal.provisionalDefinition === null || typeof proposal.provisionalDefinition === "string")) {
    throw new InterpretationGatewayError("provider", "Provider returned values outside the strict interpretation contract.");
  }
}

function evidence(input: Readonly<{
  id: string;
  organizationId: string;
  userId: string;
  tenantId: string;
  purpose: AmacsInterpretationPurpose;
  sources: readonly MinimizedInterpretationSource[];
  provider: string;
  model: string;
  providerRequestId: string | null;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  estimatedCostMicrousd: number | null;
  costBasis: "configured-estimate" | "unavailable";
  latencyMs: number;
  outcome: "succeeded" | "failed";
  failureClass: string | null;
  releaseVersion: string;
  retrievalVersion: string;
  cacheHit: boolean;
  now: string;
}>): Readonly<{ provenance: AiInterpretationProvenance; usage: AiInterpretationUsageEvent }> {
  const provenance = Object.freeze({
    id: `prov_${input.id}`, organizationId: input.organizationId, userId: input.userId, purpose: input.purpose,
    provider: input.provider, model: input.model, providerRequestId: input.providerRequestId,
    promptVersion: AI_INTERPRETATION_PROMPT_VERSION, retrievalVersion: input.retrievalVersion, amacsRelease: input.releaseVersion,
    inputTokens: input.inputTokens, outputTokens: input.outputTokens, cachedInputTokens: input.cachedInputTokens,
    estimatedCostMicrousd: input.estimatedCostMicrousd, costBasis: input.costBasis, latencyMs: input.latencyMs,
    outcome: input.outcome, failureClass: input.failureClass, sourceRefs: Object.freeze(input.sources.map((source) => source.sourceRef)),
    sourceContentSha256: Object.freeze(input.sources.map((source) => source.contentSha256)),
    sourceOriginalCharacters: input.sources.reduce((sum, source) => sum + source.originalCharacterCount, 0),
    sourceMinimizedCharacters: input.sources.reduce((sum, source) => sum + source.minimizedCharacterCount, 0),
    redactionCount: input.sources.reduce((sum, source) => sum + source.redactionCount, 0), providerStore: false as const,
    sourceRetention: "references-and-redacted-excerpts-only" as const, recordedAt: input.now,
  });
  const usage = Object.freeze({
    id: `usage_${input.id}`, organizationId: input.organizationId, userId: input.userId, tenantId: input.tenantId,
    purpose: input.purpose, provider: input.provider, model: input.model, inputTokens: input.inputTokens,
    outputTokens: input.outputTokens, estimatedCostMicrousd: input.estimatedCostMicrousd, latencyMs: input.latencyMs,
    outcome: input.outcome, failureClass: input.failureClass, retrievalCacheHit: input.cacheHit, occurredAt: input.now,
  });
  return Object.freeze({ provenance, usage });
}

export class AiAmacsInterpretationGateway {
  private readonly dependencies: Dependencies;
  private readonly retrieval: AmacsInterpretationRetrievalService;
  private readonly policy: InterpretationQuotaPolicy;
  private readonly now: () => string;
  private readonly id: () => string;

  constructor(dependencies: Dependencies) {
    this.dependencies = dependencies;
    this.retrieval = new AmacsInterpretationRetrievalService(dependencies.catalog);
    this.policy = dependencies.quotaPolicy ?? DEFAULT_INTERPRETATION_QUOTA_POLICY;
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.id = dependencies.id ?? randomUUID;
  }

  async interpret(input: InterpretAmacsInput) {
    if (!INTERPRETATION_PURPOSES.has(input.purpose)) throw new InterpretationGatewayError("invalid", "Unsupported interpretation purpose.");
    const authorization = await this.dependencies.authority.authorize(input);
    if (!authorization.allowed) throw new InterpretationGatewayError("forbidden", `Interpretation authorization denied: ${authorization.reason}.`);
    const feature = await this.dependencies.featurePolicy.inspect({ tenantId: authorization.scope.tenantId, organizationId: authorization.scope.organizationId, purpose: input.purpose });
    if (!feature.enabled) throw new InterpretationGatewayError("disabled", `AI interpretation is unavailable: ${feature.reason}.`);
    const availability = this.dependencies.provider.availability();
    if (!availability.available) throw new InterpretationGatewayError("unavailable", `AI interpretation is unavailable: ${availability.reason}.`);

    const sources = minimizeInterpretationSources(input.sources, this.policy);
    const retrieval = await this.retrieval.retrieve(sources);
    const requestId = `ai_${this.id()}`;
    const estimatedInputTokens = estimateInterpretationInputTokens(sources.reduce((sum, source) => sum + source.minimizedCharacterCount, 0));
    try {
      await this.dependencies.quota.reserve({ scope: authorization.scope, policy: this.policy, estimatedInputTokens, now: this.now() });
    } catch (cause) {
      throw new InterpretationGatewayError("quota", cause instanceof Error ? cause.message : "AI interpretation quota is exhausted.");
    }

    let result;
    try {
      result = await this.dependencies.provider.interpret({ requestId, purpose: input.purpose, releaseVersion: retrieval.releaseVersion, retrievalVersion: retrieval.retrievalVersion, promptVersion: AI_INTERPRETATION_PROMPT_VERSION, complexity: retrieval.complexity, sources, retrievedCandidates: retrieval.candidates, safetyIdentifier: safetyIdentifier(authorization.scope.userId, authorization.scope.tenantId) });
    } catch (cause) {
      const failedAt = this.now();
      const failed = evidence({ id: requestId, organizationId: authorization.scope.organizationId, userId: authorization.scope.userId, tenantId: authorization.scope.tenantId, purpose: input.purpose, sources, provider: availability.provider, model: availability.primaryModel, providerRequestId: null, inputTokens: estimatedInputTokens, outputTokens: 0, cachedInputTokens: 0, estimatedCostMicrousd: null, costBasis: "unavailable", latencyMs: 0, outcome: "failed", failureClass: cause instanceof Error ? cause.name : "unknown", releaseVersion: retrieval.releaseVersion, retrievalVersion: retrieval.retrievalVersion, cacheHit: retrieval.cacheHit, now: failedAt });
      await this.dependencies.repository.saveFailureEvidence(failed);
      this.dependencies.observer.record({ requestId, organizationId: authorization.scope.organizationId, userId: authorization.scope.userId, outcome: "failed", failureClass: failed.provenance.failureClass, latencyMs: failed.provenance.latencyMs });
      throw new InterpretationGatewayError("provider", "AI interpretation failed without changing authoritative organization or RFx records.");
    }

    try {
    const retrievedById = new Map(retrieval.candidates.map((candidate) => [candidate.conceptId, candidate]));
    const recordId = `interpretation_${this.id()}`;
    const now = this.now();
    const candidates: AiInterpretationCandidateEnvelope[] = [];
    for (const proposal of result.proposals.slice(0, 12)) {
      assertProviderProposal(proposal);
      const matched = proposal.amacsId ? retrievedById.get(proposal.amacsId) : null;
      if (proposal.amacsId && !matched) throw new InterpretationGatewayError("provider", "Provider selected an AMACS concept outside the bounded retrieval set.");
      if (!proposal.amacsId && proposal.targetKind !== "provisional_term") throw new InterpretationGatewayError("provider", "Only a provisional term may omit an AMACS concept identifier.");
      const candidateId = `candidate_${this.id()}`;
      const candidate: AmacsInterpretationCandidate = Object.freeze({
        candidate_id: candidateId, interpretation_record_id: recordId, amacs_release: retrieval.releaseVersion,
        target_kind: proposal.targetKind, source_evidence: Object.freeze(sourceEvidence(sources, proposal.sourceIndices)),
        candidate_value: matched ? Object.freeze({ amacs_id: matched.conceptId, label_snapshot: matched.preferredLabel }) : Object.freeze({ text_value: boundedText(proposal.provisionalLabel ?? "", "Provisional label", 300) }),
        rationale: boundedText(proposal.rationale, "Rationale", 2_000), confidence: proposal.confidence,
        ambiguity_status: proposal.ambiguityStatus,
        ...(proposal.clarificationQuestion ? { clarification_question: boundedText(proposal.clarificationQuestion, "Clarification question", 1_000) } : {}),
        mapping_method: "assisted", disposition: "suggested", authoritative_effect: "none", created_at: now,
      });
      const validation = await this.dependencies.validator.validate<AmacsInterpretationCandidate>("interpretation-candidate.schema.json", candidate);
      if (!validation.valid) throw new InterpretationGatewayError("provider", `Generated candidate violated AMACS 0.5.0: ${validation.errors.join("; ")}`);
      candidates.push(Object.freeze({ id: candidateId, organizationId: authorization.scope.organizationId, interpretationRecordId: recordId, candidate, createdAt: now, updatedAt: now }));
    }
    const record: AmacsInterpretationRecord = Object.freeze({ interpretation_record_id: recordId, organization_id: authorization.scope.organizationId, actor_user_id: authorization.scope.userId, purpose: input.purpose, ...(input.subjectRef?.trim() ? { subject_ref: boundedText(input.subjectRef, "Subject reference", 500) } : {}), amacs_release: retrieval.releaseVersion, mapping_method: "assisted", source_refs: Object.freeze(sources.map((source) => source.sourceRef)), candidate_ids: Object.freeze(candidates.map((candidate) => candidate.id)), record_status: "awaiting_confirmation", human_confirmation_required: true, authoritative_effect: "none", implementation_provenance_ref: `prov_${requestId}`, created_at: now, updated_at: now });
    const validation = await this.dependencies.validator.validate<AmacsInterpretationRecord>("interpretation-record.schema.json", record);
    if (!validation.valid) throw new InterpretationGatewayError("provider", `Generated record violated AMACS 0.5.0: ${validation.errors.join("; ")}`);
    const completed = evidence({ id: requestId, organizationId: authorization.scope.organizationId, userId: authorization.scope.userId, tenantId: authorization.scope.tenantId, purpose: input.purpose, sources, provider: result.provider, model: result.model, providerRequestId: result.providerRequestId, inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens, cachedInputTokens: result.usage.cachedInputTokens, estimatedCostMicrousd: result.estimatedCostMicrousd, costBasis: result.costBasis, latencyMs: result.latencyMs, outcome: "succeeded", failureClass: null, releaseVersion: retrieval.releaseVersion, retrievalVersion: retrieval.retrievalVersion, cacheHit: retrieval.cacheHit, now });
    const envelope = Object.freeze({ id: recordId, organizationId: authorization.scope.organizationId, record, createdAt: now, updatedAt: now });
    await this.dependencies.repository.saveCompleted({ record: envelope, candidates: Object.freeze(candidates), ...completed });
    this.dependencies.observer.record({ requestId, organizationId: authorization.scope.organizationId, userId: authorization.scope.userId, outcome: "succeeded", failureClass: null, latencyMs: result.latencyMs });
    return Object.freeze({ record: envelope, candidates: Object.freeze(candidates), provider: Object.freeze({ name: result.provider, model: result.model }), authoritativeEffect: "none" as const });
    } catch (cause) {
      const failureClass = cause instanceof InterpretationGatewayError ? `structured-output-${cause.code}` : cause instanceof Error ? cause.name : "unknown";
      const failed = evidence({ id: `${requestId}_post`, organizationId: authorization.scope.organizationId, userId: authorization.scope.userId, tenantId: authorization.scope.tenantId, purpose: input.purpose, sources, provider: result.provider, model: result.model, providerRequestId: result.providerRequestId, inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens, cachedInputTokens: result.usage.cachedInputTokens, estimatedCostMicrousd: result.estimatedCostMicrousd, costBasis: result.costBasis, latencyMs: result.latencyMs, outcome: "failed", failureClass, releaseVersion: retrieval.releaseVersion, retrievalVersion: retrieval.retrievalVersion, cacheHit: retrieval.cacheHit, now: this.now() });
      await this.dependencies.repository.saveFailureEvidence(failed);
      this.dependencies.observer.record({ requestId, organizationId: authorization.scope.organizationId, userId: authorization.scope.userId, outcome: "failed", failureClass, latencyMs: result.latencyMs });
      if (cause instanceof InterpretationGatewayError) throw cause;
      throw new InterpretationGatewayError("provider", "AI interpretation could not be validated or persisted; no authoritative record changed.");
    }
  }

  async disposition(input: Readonly<{ context: AuthenticatedServerContext | null; organizationId: string; membershipId: string; recordId: string; candidateId?: string; expectedUpdatedAt?: string; decision: InterpretationDispositionInput }>) {
    if (!input.decision || !["accepted", "edited", "rejected", "unresolved", "withdrawn", "none-of-these"].includes(input.decision.disposition)) {
      throw new InterpretationGatewayError("invalid", "Unsupported interpretation disposition.");
    }
    const record = await this.dependencies.repository.getRecord(input.recordId);
    if (!record || record.organizationId !== input.organizationId) throw new InterpretationGatewayError("not-found", "Interpretation record was not found.");
    const authorization = await this.dependencies.authority.authorize({ context: input.context, organizationId: input.organizationId, membershipId: input.membershipId, purpose: record.record.purpose });
    if (!authorization.allowed) throw new InterpretationGatewayError("forbidden", `Interpretation authorization denied: ${authorization.reason}.`);
    const now = this.now();
    if (input.decision.disposition === "none-of-these") {
      const updatedRecord = await this.dependencies.repository.applyNoneOfThese({ scope: authorization.scope, recordId: record.id, now, event: Object.freeze({ id: `aievent_${this.id()}`, organizationId: input.organizationId, interpretationRecordId: record.id, candidateId: null, actorUserId: authorization.scope.userId, kind: "none-of-these-recorded", priorDisposition: null, newDisposition: null, authoritativeEffect: "none", occurredAt: now }) });
      return Object.freeze({ record: updatedRecord, candidate: null, authoritativeEffect: "none" as const });
    }
    if (!input.candidateId || !input.expectedUpdatedAt) throw new InterpretationGatewayError("invalid", "Candidate and expected version are required.");
    const candidate = await this.dependencies.repository.getCandidate(input.candidateId);
    if (!candidate || candidate.organizationId !== input.organizationId || candidate.interpretationRecordId !== record.id) throw new InterpretationGatewayError("not-found", "Interpretation candidate was not found.");
    const editedTextValue = input.decision.disposition === "edited" ? boundedText(input.decision.editedTextValue ?? "", "Edited value", 4_000) : null;
    const updatedRecord = await this.dependencies.repository.applyCandidateDisposition({ scope: authorization.scope, candidate, expectedUpdatedAt: input.expectedUpdatedAt, disposition: input.decision.disposition, editedTextValue, now, event: Object.freeze({ id: `aievent_${this.id()}`, organizationId: input.organizationId, interpretationRecordId: record.id, candidateId: candidate.id, actorUserId: authorization.scope.userId, kind: "disposition-recorded", priorDisposition: candidate.candidate.disposition, newDisposition: input.decision.disposition, authoritativeEffect: "none", occurredAt: now }) });
    const updatedCandidate = await this.dependencies.repository.getCandidate(candidate.id);
    if (!updatedCandidate) throw new InterpretationGatewayError("not-found", "Updated interpretation candidate was unavailable.");
    return Object.freeze({ record: updatedRecord, candidate: updatedCandidate, authoritativeEffect: "none" as const });
  }
}
