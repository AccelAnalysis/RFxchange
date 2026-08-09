import type {
  AiInterpretationCandidateEnvelope,
  AiInterpretationEvent,
  AiInterpretationProvenance,
  AiInterpretationRecordEnvelope,
  AiInterpretationUsageEvent,
  InterpretationAuthorityScope,
  InterpretationQuotaPolicy,
  InterpretationQuotaReservation,
} from "./model.ts";

export interface AiInterpretationRepository {
  getRecord(id: string): Promise<AiInterpretationRecordEnvelope | null>;
  getCandidate(id: string): Promise<AiInterpretationCandidateEnvelope | null>;
  saveCompleted(input: Readonly<{
    record: AiInterpretationRecordEnvelope;
    candidates: readonly AiInterpretationCandidateEnvelope[];
    provenance: AiInterpretationProvenance;
    usage: AiInterpretationUsageEvent;
  }>): Promise<void>;
  saveFailureEvidence(input: Readonly<{
    provenance: AiInterpretationProvenance;
    usage: AiInterpretationUsageEvent;
  }>): Promise<void>;
  applyCandidateDisposition(input: Readonly<{
    scope: InterpretationAuthorityScope;
    candidate: AiInterpretationCandidateEnvelope;
    expectedUpdatedAt: string;
    disposition: "accepted" | "edited" | "rejected" | "unresolved" | "withdrawn";
    editedTextValue: string | null;
    now: string;
    event: AiInterpretationEvent;
  }>): Promise<AiInterpretationRecordEnvelope>;
  applyNoneOfThese(input: Readonly<{
    scope: InterpretationAuthorityScope;
    recordId: string;
    event: AiInterpretationEvent;
    now: string;
  }>): Promise<AiInterpretationRecordEnvelope>;
}

export interface InterpretationQuotaPort {
  reserve(input: Readonly<{
    scope: InterpretationAuthorityScope;
    policy: InterpretationQuotaPolicy;
    estimatedInputTokens: number;
    now: string;
  }>): Promise<InterpretationQuotaReservation>;
}
