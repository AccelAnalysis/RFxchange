import type {
  AmacsInterpretationCandidate,
  AmacsInterpretationDisposition,
  AmacsInterpretationPurpose,
  AmacsInterpretationRecord,
} from "../amacs/contracts.ts";

export const INTERPRETATION_SOURCE_TYPES = [
  "participant_text",
  "participant_selection",
  "participant_document",
  "organization_profile",
  "public_source",
  "prior_transaction",
  "other",
] as const;

export type InterpretationSourceType = (typeof INTERPRETATION_SOURCE_TYPES)[number];

export interface InterpretationSourceInput {
  readonly sourceRef: string;
  readonly sourceType: InterpretationSourceType;
  readonly text: string;
  readonly locator?: string;
  readonly inclusionAuthorized: boolean;
  readonly attachmentOptIn?: boolean;
}

export interface MinimizedInterpretationSource {
  readonly sourceRef: string;
  readonly sourceType: InterpretationSourceType;
  readonly minimizedText: string;
  readonly locator: string;
  readonly originalCharacterCount: number;
  readonly minimizedCharacterCount: number;
  readonly redactionCount: number;
  readonly contentSha256: string;
}

export interface InterpretationAuthorityScope {
  readonly organizationId: string;
  readonly membershipId: string;
  readonly userId: string;
  readonly tenantId: string;
}

export interface RetrievedAmacsCandidate {
  readonly conceptId: string;
  readonly preferredLabel: string;
  readonly definition: string;
  readonly domainId: string;
  readonly domainLabel: string;
  readonly familyId: string;
  readonly familyLabel: string;
  readonly aliases: readonly string[];
  readonly replacementConceptIds: readonly string[];
  readonly interpretationGuidance: Readonly<{
    readonly inclusionNotes: string;
    readonly exclusionNotes: string;
    readonly exampleActivities: readonly string[];
    readonly exampleOutputs: readonly string[];
    readonly commonConfusionConceptIds: readonly string[];
    readonly clarificationQuestions: readonly string[];
  }> | null;
  readonly releaseVersion: string;
  readonly retrievalScore: number;
  readonly matchedTerms: readonly string[];
}

export interface InterpretationRetrievalResult {
  readonly releaseVersion: string;
  readonly retrievalVersion: string;
  readonly candidates: readonly RetrievedAmacsCandidate[];
  readonly complexity: "simple" | "ambiguous";
  readonly cacheHit: boolean;
}

export interface ProviderInterpretationProposal {
  readonly amacsId: string | null;
  readonly targetKind: AmacsInterpretationCandidate["target_kind"];
  readonly rationale: string;
  readonly confidence: number;
  readonly ambiguityStatus: AmacsInterpretationCandidate["ambiguity_status"];
  readonly clarificationQuestion: string | null;
  readonly sourceIndices: readonly number[];
  readonly provisionalLabel: string | null;
  readonly provisionalDefinition: string | null;
}

export interface InterpretationProviderRequest {
  readonly requestId: string;
  readonly purpose: AmacsInterpretationPurpose;
  readonly releaseVersion: string;
  readonly retrievalVersion: string;
  readonly promptVersion: string;
  readonly complexity: "simple" | "ambiguous";
  readonly sources: readonly MinimizedInterpretationSource[];
  readonly retrievedCandidates: readonly RetrievedAmacsCandidate[];
  readonly safetyIdentifier: string;
}

export interface InterpretationProviderUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cachedInputTokens: number;
}

export interface InterpretationProviderResult {
  readonly provider: string;
  readonly model: string;
  readonly providerRequestId: string | null;
  readonly proposals: readonly ProviderInterpretationProposal[];
  readonly usage: InterpretationProviderUsage;
  readonly latencyMs: number;
  readonly estimatedCostMicrousd: number | null;
  readonly costBasis: "configured-estimate" | "unavailable";
}

export type InterpretationProviderAvailability =
  | Readonly<{ available: true; provider: string; primaryModel: string; escalationModel: string | null }>
  | Readonly<{ available: false; reason: "provider-disabled" | "missing-secret"; provider: string }>;

export interface AiInterpretationRecordEnvelope {
  readonly id: string;
  readonly organizationId: string;
  readonly record: AmacsInterpretationRecord;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AiInterpretationCandidateEnvelope {
  readonly id: string;
  readonly organizationId: string;
  readonly interpretationRecordId: string;
  readonly candidate: AmacsInterpretationCandidate;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AiInterpretationProvenance {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly purpose: AmacsInterpretationPurpose;
  readonly provider: string;
  readonly model: string;
  readonly providerRequestId: string | null;
  readonly promptVersion: string;
  readonly retrievalVersion: string;
  readonly amacsRelease: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cachedInputTokens: number;
  readonly estimatedCostMicrousd: number | null;
  readonly costBasis: "configured-estimate" | "unavailable";
  readonly latencyMs: number;
  readonly outcome: "succeeded" | "failed";
  readonly failureClass: string | null;
  readonly sourceRefs: readonly string[];
  readonly sourceContentSha256: readonly string[];
  readonly sourceOriginalCharacters: number;
  readonly sourceMinimizedCharacters: number;
  readonly redactionCount: number;
  readonly providerStore: false;
  readonly sourceRetention: "references-and-redacted-excerpts-only";
  readonly recordedAt: string;
}

export interface AiInterpretationUsageEvent {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly tenantId: string;
  readonly purpose: AmacsInterpretationPurpose;
  readonly provider: string;
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly estimatedCostMicrousd: number | null;
  readonly latencyMs: number;
  readonly outcome: "succeeded" | "failed";
  readonly failureClass: string | null;
  readonly retrievalCacheHit: boolean;
  readonly occurredAt: string;
}

export type InterpretationEventKind = "disposition-recorded" | "none-of-these-recorded";

export interface AiInterpretationEvent {
  readonly id: string;
  readonly organizationId: string;
  readonly interpretationRecordId: string;
  readonly candidateId: string | null;
  readonly actorUserId: string;
  readonly kind: InterpretationEventKind;
  readonly priorDisposition: AmacsInterpretationDisposition | null;
  readonly newDisposition: AmacsInterpretationDisposition | null;
  readonly authoritativeEffect: "none";
  readonly occurredAt: string;
}

export interface InterpretationQuotaPolicy {
  readonly version: string;
  readonly maxSourcesPerRequest: number;
  readonly maxSourceCharacters: number;
  readonly maxInputTokensPerRequest: number;
  readonly maxRequestsPerUserPerDay: number;
  readonly maxRequestsPerOrganizationPerDay: number;
  readonly maxRequestsPerTenantPerDay: number;
  readonly maxInputTokensPerUserPerDay: number;
  readonly maxInputTokensPerOrganizationPerDay: number;
  readonly maxInputTokensPerTenantPerDay: number;
}

export interface InterpretationQuotaReservation {
  readonly id: string;
  readonly policyVersion: string;
  readonly day: string;
  readonly estimatedInputTokens: number;
}

export type InterpretationDispositionInput =
  | Readonly<{
      disposition: Exclude<AmacsInterpretationDisposition, "suggested">;
      editedTextValue?: string | null;
    }>
  | Readonly<{ disposition: "none-of-these"; editedTextValue?: never }>;

export const DEFAULT_INTERPRETATION_QUOTA_POLICY: InterpretationQuotaPolicy = Object.freeze({
  version: "ai-amacs-quota-v1",
  maxSourcesPerRequest: 8,
  maxSourceCharacters: 12_000,
  maxInputTokensPerRequest: 6_000,
  maxRequestsPerUserPerDay: 40,
  maxRequestsPerOrganizationPerDay: 200,
  maxRequestsPerTenantPerDay: 5_000,
  maxInputTokensPerUserPerDay: 120_000,
  maxInputTokensPerOrganizationPerDay: 600_000,
  maxInputTokensPerTenantPerDay: 15_000_000,
});
