export type AmacsInterpretationPurpose =
  | "seller_capability_declaration"
  | "buyer_need_definition"
  | "provider_service_definition"
  | "evidence_linking"
  | "request_structure"
  | "response_assistance"
  | "outcome_classification"
  | "other";

export type AmacsMappingMethod =
  | "human"
  | "assisted"
  | "algorithmic"
  | "imported"
  | "other";

export type AmacsInterpretationDisposition =
  | "suggested"
  | "accepted"
  | "edited"
  | "rejected"
  | "unresolved"
  | "withdrawn";

export interface AmacsInterpretationRecord {
  readonly interpretation_record_id: string;
  readonly organization_id: string;
  readonly actor_user_id?: string;
  readonly purpose: AmacsInterpretationPurpose;
  readonly subject_ref?: string;
  readonly amacs_release: string;
  readonly mapping_method: AmacsMappingMethod;
  readonly source_refs: readonly string[];
  readonly candidate_ids: readonly string[];
  readonly record_status:
    | "draft"
    | "processing"
    | "awaiting_confirmation"
    | "partially_confirmed"
    | "confirmed"
    | "failed"
    | "withdrawn";
  readonly human_confirmation_required: true;
  readonly authoritative_effect: "none";
  readonly implementation_provenance_ref?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AmacsInterpretationCandidate {
  readonly candidate_id: string;
  readonly interpretation_record_id: string;
  readonly amacs_release: string;
  readonly target_kind:
    | "market_need_dimension"
    | "organization_capability_assertion"
    | "rfx_capability_requirement"
    | "request_family"
    | "property_value"
    | "credential_requirement"
    | "response_section"
    | "decision_factor"
    | "market_role"
    | "provisional_term";
  readonly source_evidence: readonly Readonly<{
    source_ref: string;
    source_type:
      | "participant_text"
      | "participant_selection"
      | "participant_document"
      | "organization_profile"
      | "public_source"
      | "prior_transaction"
      | "other";
    locator: string;
    excerpt: string;
  }>[];
  readonly candidate_value: Readonly<{
    amacs_id?: string;
    label_snapshot?: string;
    text_value?: string;
    structured_value?: unknown;
  }>;
  readonly rationale: string;
  readonly confidence: number;
  readonly ambiguity_status:
    | "none"
    | "needs_clarification"
    | "conflicting_sources"
    | "insufficient_support";
  readonly clarification_question?: string;
  readonly mapping_method: AmacsMappingMethod;
  readonly disposition: AmacsInterpretationDisposition;
  readonly disposition_by_user_id?: string;
  readonly disposition_at?: string;
  readonly resulting_record_ref?: string;
  readonly provisional_proposal_id?: string;
  readonly authoritative_effect: "none";
  readonly created_at: string;
}

export interface AmacsMarketNeed {
  readonly market_need_id: string;
  readonly organization_id: string;
  readonly request_id?: string;
  readonly amacs_release: string;
  readonly need_status:
    | "draft"
    | "clarifying"
    | "ready_for_structure"
    | "structured"
    | "superseded"
    | "withdrawn";
  readonly source_statement: string;
  readonly observed_condition: string;
  readonly desired_outcome: string;
  readonly affected_context: readonly string[];
  readonly success_measures: readonly Readonly<{
    measure: string;
    target_value: unknown;
    unit_id: string | null;
  }>[];
  readonly geography_refs: readonly string[];
  readonly geography_description?: string;
  readonly timing: Readonly<{
    urgency: "unspecified" | "routine" | "time_sensitive" | "urgent" | "emergency";
    required_by: string | null;
    duration_text: string;
  }>;
  readonly commercial_context: Readonly<{
    value_status: "unknown" | "planning_estimate" | "target" | "range" | "maximum_budget" | "fixed";
    currency: string;
    minimum_value: number | null;
    maximum_value: number | null;
  }>;
  readonly constraints: readonly Readonly<{
    constraint_type: string;
    statement: string;
    knowledge_status: "known" | "assumed" | "unresolved";
  }>[];
  readonly known_facts: readonly string[];
  readonly assumptions: readonly string[];
  readonly unresolved_questions: readonly string[];
  readonly solution_posture: "open" | "outcome_constrained" | "approach_constrained" | "specified_solution";
  readonly proposed_solution_text?: string;
  readonly prohibited_approaches: readonly string[];
  readonly required_outputs: readonly string[];
  readonly interpretation_record_ids: readonly string[];
  readonly confirmed_requirement_ids: readonly string[];
  readonly confirmation_status: "unreviewed" | "participant_reviewed" | "participant_confirmed" | "superseded";
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AmacsConceptGuidanceRecord {
  readonly concept_id: string;
  readonly amacs_release: string;
  readonly inclusion_notes: string;
  readonly exclusion_notes: string;
  readonly example_activities: readonly string[];
  readonly example_outputs: readonly string[];
  readonly common_confusion_concept_ids: readonly string[];
  readonly clarification_questions: readonly string[];
  readonly guidance_status: "draft" | "reviewed" | "approved" | "deprecated";
  readonly version_introduced: string;
}

export type AmacsRuntimeContract =
  | AmacsMarketNeed
  | AmacsInterpretationRecord
  | AmacsInterpretationCandidate
  | AmacsConceptGuidanceRecord;
