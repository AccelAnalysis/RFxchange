type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type ProviderSeedCandidateId = Brand<string, "ProviderSeedCandidateId">;
export type ProviderCanonicalComparisonId = Brand<string, "ProviderCanonicalComparisonId">;
export type ProviderPromotionApprovalId = Brand<string, "ProviderPromotionApprovalId">;
export type ProviderPromotionCommandId = Brand<string, "ProviderPromotionCommandId">;
export type ProviderPromotionEventId = Brand<string, "ProviderPromotionEventId">;

export const PROVIDER_SEED_DISPOSITIONS = [
  "ready_for_canonical_comparison",
  "needs_identity_review",
  "needs_geocode_review",
  "off_map_unresolved",
  "held_out",
] as const;
export type ProviderSeedDisposition = (typeof PROVIDER_SEED_DISPOSITIONS)[number];

export const PROVIDER_GEOGRAPHY_ENRICHMENT_STATUSES = [
  "ready_for_profile_materialization",
  "needs_geography_resolution",
  "not-applicable",
] as const;
export type ProviderGeographyEnrichmentStatus =
  (typeof PROVIDER_GEOGRAPHY_ENRICHMENT_STATUSES)[number];

export const PROVIDER_CANONICAL_COMPARISON_OUTCOMES = [
  "create-new-organization",
  "attach-to-existing-organization",
  "identity-review-required",
  "reject-candidate",
] as const;
export type ProviderCanonicalComparisonOutcome =
  (typeof PROVIDER_CANONICAL_COMPARISON_OUTCOMES)[number];

export const PROVIDER_CANONICAL_MATCH_BASIS = [
  "authoritative-source-id",
  "website-domain",
  "accepted-address",
  "display-name",
  "alias",
  "manual-research",
] as const;
export type ProviderCanonicalMatchBasis =
  (typeof PROVIDER_CANONICAL_MATCH_BASIS)[number];

export const PROVIDER_PROMOTION_DECISIONS = [
  "approve-new-organization",
  "approve-existing-organization",
  "reject-candidate",
  "defer-identity-review",
] as const;
export type ProviderPromotionDecision =
  (typeof PROVIDER_PROMOTION_DECISIONS)[number];

export const PROVIDER_PROMOTION_COMMAND_ACTIONS = [
  "preview-approved-provider-promotion",
  "commit-approved-provider-promotion",
] as const;
export type ProviderPromotionCommandAction =
  (typeof PROVIDER_PROMOTION_COMMAND_ACTIONS)[number];

export const PROVIDER_PROMOTION_EVENT_KINDS = [
  "provider-promotion-previewed",
  "provider-promotion-committed",
] as const;
export type ProviderPromotionEventKind =
  (typeof PROVIDER_PROMOTION_EVENT_KINDS)[number];

export interface ProviderSeedPromotionCandidate {
  readonly id: ProviderSeedCandidateId;
  readonly marketKey: string;
  readonly seedKey: string;
  readonly displayName: string;
  readonly providerClass: string;
  readonly participationPolicy: string;
  readonly providerType: string;
  readonly resourceCategory: string;
  readonly serviceName: string;
  readonly website: string | null;
  readonly aliases: readonly string[];
  readonly primarySourceId: string;
  readonly disposition: ProviderSeedDisposition;
  readonly acceptedLocationKey: string | null;
  readonly acceptedPointFingerprint: string | null;
  readonly geographyEnrichmentStatus: ProviderGeographyEnrichmentStatus;
  readonly geographyProfileFingerprint: string | null;
  readonly sourcePlanFingerprint: string;
  readonly sourceRecordFingerprint: string;
  readonly donorRepository: string;
  readonly donorCommit: string;
  readonly preparedAt: string;
}

export interface ProviderCanonicalMatchEvidence {
  readonly organizationId: string;
  readonly displayName: string;
  readonly basis: readonly ProviderCanonicalMatchBasis[];
  readonly confidence: number;
  readonly evidenceSummary: string;
}

export interface ProviderCanonicalComparison {
  readonly id: ProviderCanonicalComparisonId;
  readonly candidateId: ProviderSeedCandidateId;
  readonly candidateRecordFingerprint: string;
  readonly geographyProfileFingerprint: string;
  readonly canonicalSearchFingerprint: string;
  readonly matches: readonly ProviderCanonicalMatchEvidence[];
  readonly outcome: ProviderCanonicalComparisonOutcome;
  readonly selectedOrganizationId: string | null;
  readonly rationale: string;
  readonly comparisonFingerprint: string;
  readonly reviewedByAdministratorId: string;
  readonly authorityContextId: string;
  readonly reviewedAt: string;
}

export interface ProviderPromotionApproval {
  readonly id: ProviderPromotionApprovalId;
  readonly candidateId: ProviderSeedCandidateId;
  readonly comparisonId: ProviderCanonicalComparisonId;
  readonly decision: ProviderPromotionDecision;
  readonly state: "approved" | "rejected" | "deferred";
  readonly targetOrganizationMode: "create" | "attach-existing" | null;
  readonly targetOrganizationId: string | null;
  readonly candidateRecordFingerprint: string;
  readonly geographyProfileFingerprint: string;
  readonly comparisonFingerprint: string;
  readonly rationale: string;
  readonly approvedByAdministratorId: string;
  readonly authorityContextId: string;
  readonly approvedAt: string;
}

export interface ProviderPromotionCommand {
  readonly id: ProviderPromotionCommandId;
  readonly action: ProviderPromotionCommandAction;
  readonly marketKey: string;
  readonly candidateId: ProviderSeedCandidateId;
  readonly comparisonId: ProviderCanonicalComparisonId;
  readonly approvalId: ProviderPromotionApprovalId;
  readonly targetOrganizationMode: "create" | "attach-existing";
  readonly targetOrganizationId: string;
  readonly targetLocationId: string;
  readonly targetProviderResourceId: string;
  readonly geographyProfileId: string;
  readonly candidateRecordFingerprint: string;
  readonly geographyProfileFingerprint: string;
  readonly comparisonFingerprint: string;
  readonly approvalFingerprint: string;
  readonly requestFingerprint: string;
  readonly publishProviderDiscovery: false;
  readonly publishResource: false;
  readonly actorAdministratorId: string;
  readonly authorityContextId: string;
  readonly recordedAt: string;
}

export interface ProviderPromotionEvent {
  readonly id: ProviderPromotionEventId;
  readonly kind: ProviderPromotionEventKind;
  readonly candidateId: ProviderSeedCandidateId;
  readonly targetOrganizationId: string;
  readonly commandId: ProviderPromotionCommandId;
  readonly occurredAt: string;
}

function normalized(value: string, label: string, maximum = 300): string {
  const result = value.trim().replace(/\s+/g, " ");
  if (!result || result.length > maximum) {
    throw new Error(`${label} must contain 1-${maximum} characters.`);
  }
  return result;
}

function optional(value: string | null | undefined, label: string, maximum = 500): string | null {
  return value?.trim() ? normalized(value, label, maximum) : null;
}

function stable<T extends string>(value: string, label: string): T {
  const result = normalized(value, label, 240).toLowerCase();
  if (!/^[a-z0-9][a-z0-9._:-]{1,239}$/.test(result)) {
    throw new Error(`${label} must be a stable lowercase identifier.`);
  }
  return result as T;
}

function foreignId(value: string, label: string): string {
  const result = normalized(value, label, 191);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/.test(result)) {
    throw new Error(`${label} must be a stable identifier.`);
  }
  return result;
}

function timestamp(value: string, label: string): string {
  const parsed = Date.parse(normalized(value, label, 80));
  if (Number.isNaN(parsed)) throw new Error(`${label} must be ISO-compatible.`);
  return new Date(parsed).toISOString();
}

function oneOf<T extends string>(value: string, values: readonly T[], label: string): T {
  if (!values.includes(value as T)) throw new Error(`Unsupported ${label}: ${value}.`);
  return value as T;
}

function uniqueStrings(values: readonly string[], label: string): readonly string[] {
  return Object.freeze([...new Set(values.map((value) => normalized(value, label, 300)))]);
}

function safeUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const url = new URL(value.trim());
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error("Provider website must be a safe HTTP(S) URL.");
  }
  return url.toString();
}

function acceptedDisposition(disposition: ProviderSeedDisposition): boolean {
  return disposition === "ready_for_canonical_comparison" || disposition === "needs_identity_review";
}

export function createProviderSeedPromotionCandidate(input: Readonly<{
  id?: string;
  marketKey: string;
  seedKey: string;
  displayName: string;
  providerClass: string;
  participationPolicy: string;
  providerType: string;
  resourceCategory: string;
  serviceName: string;
  website?: string | null;
  aliases?: readonly string[];
  primarySourceId: string;
  disposition: string;
  acceptedLocationKey?: string | null;
  acceptedPointFingerprint?: string | null;
  geographyEnrichmentStatus: string;
  geographyProfileFingerprint?: string | null;
  sourcePlanFingerprint: string;
  sourceRecordFingerprint: string;
  donorRepository: string;
  donorCommit: string;
  preparedAt: string;
}>): ProviderSeedPromotionCandidate {
  const marketKey = stable<string>(input.marketKey, "Provider seed market key");
  const seedKey = stable<string>(input.seedKey, "Provider seed key");
  const disposition = oneOf(input.disposition, PROVIDER_SEED_DISPOSITIONS, "provider seed disposition");
  const geographyEnrichmentStatus = oneOf(
    input.geographyEnrichmentStatus,
    PROVIDER_GEOGRAPHY_ENRICHMENT_STATUSES,
    "provider geography enrichment status",
  );
  const acceptedLocationKey = optional(input.acceptedLocationKey, "Accepted location key", 191);
  const acceptedPointFingerprint = optional(
    input.acceptedPointFingerprint,
    "Accepted point fingerprint",
    120,
  );
  const geographyProfileFingerprint = optional(
    input.geographyProfileFingerprint,
    "Geography profile fingerprint",
    500,
  );
  if (acceptedDisposition(disposition)) {
    if (!acceptedLocationKey || !acceptedPointFingerprint) {
      throw new Error("Accepted provider candidates require an accepted location and point fingerprint.");
    }
    if (geographyEnrichmentStatus !== "ready_for_profile_materialization" || !geographyProfileFingerprint) {
      throw new Error("Accepted provider candidates require completed geography enrichment.");
    }
  } else if (geographyEnrichmentStatus === "ready_for_profile_materialization") {
    throw new Error("Unresolved or held-out candidates cannot be geography-promotion ready.");
  }
  return Object.freeze({
    id: stable<ProviderSeedCandidateId>(input.id ?? `${marketKey}:${seedKey}`, "Provider seed candidate id"),
    marketKey,
    seedKey,
    displayName: normalized(input.displayName, "Provider display name", 200),
    providerClass: stable<string>(input.providerClass, "Provider class"),
    participationPolicy: stable<string>(input.participationPolicy, "Participation policy"),
    providerType: stable<string>(input.providerType, "Provider type"),
    resourceCategory: stable<string>(input.resourceCategory, "Resource category"),
    serviceName: normalized(input.serviceName, "Provider service name", 240),
    website: safeUrl(input.website),
    aliases: uniqueStrings(input.aliases ?? [], "Provider alias"),
    primarySourceId: foreignId(input.primarySourceId, "Provider primary source id"),
    disposition,
    acceptedLocationKey,
    acceptedPointFingerprint,
    geographyEnrichmentStatus,
    geographyProfileFingerprint,
    sourcePlanFingerprint: normalized(input.sourcePlanFingerprint, "Source plan fingerprint", 500),
    sourceRecordFingerprint: normalized(input.sourceRecordFingerprint, "Source record fingerprint", 500),
    donorRepository: normalized(input.donorRepository, "Donor repository", 240),
    donorCommit: normalized(input.donorCommit, "Donor commit", 120),
    preparedAt: timestamp(input.preparedAt, "Provider candidate preparation timestamp"),
  });
}

function createMatch(input: ProviderCanonicalMatchEvidence): ProviderCanonicalMatchEvidence {
  const confidence = input.confidence;
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error("Canonical match confidence must be between zero and one.");
  }
  const basis = Object.freeze([
    ...new Set(input.basis.map((value) => oneOf(value, PROVIDER_CANONICAL_MATCH_BASIS, "canonical match basis"))),
  ]);
  if (!basis.length) throw new Error("Canonical match evidence requires at least one basis.");
  return Object.freeze({
    organizationId: foreignId(input.organizationId, "Canonical match organization id"),
    displayName: normalized(input.displayName, "Canonical match display name", 200),
    basis,
    confidence,
    evidenceSummary: normalized(input.evidenceSummary, "Canonical match evidence summary", 1_000),
  });
}

export function createProviderCanonicalComparison(input: Readonly<{
  id: string;
  candidate: ProviderSeedPromotionCandidate;
  canonicalSearchFingerprint: string;
  matches?: readonly ProviderCanonicalMatchEvidence[];
  outcome: string;
  selectedOrganizationId?: string | null;
  rationale: string;
  comparisonFingerprint: string;
  reviewedByAdministratorId: string;
  authorityContextId: string;
  reviewedAt: string;
}>): ProviderCanonicalComparison {
  if (!acceptedDisposition(input.candidate.disposition)) {
    throw new Error("Only accepted-coordinate candidates may enter canonical comparison.");
  }
  const matches = Object.freeze((input.matches ?? []).map(createMatch));
  const organizationIds = new Set(matches.map((match) => match.organizationId));
  if (organizationIds.size !== matches.length) {
    throw new Error("Canonical comparison cannot repeat an Organization match.");
  }
  const outcome = oneOf(
    input.outcome,
    PROVIDER_CANONICAL_COMPARISON_OUTCOMES,
    "provider canonical comparison outcome",
  );
  const selectedOrganizationId = input.selectedOrganizationId?.trim()
    ? foreignId(input.selectedOrganizationId, "Selected canonical organization id")
    : null;
  if (outcome === "identity-review-required") {
    if (input.candidate.disposition !== "needs_identity_review" || selectedOrganizationId) {
      throw new Error("Identity-review outcome requires a flagged candidate and no selected Organization.");
    }
  } else if (input.candidate.disposition === "needs_identity_review") {
    throw new Error("A flagged identity cannot be approved or rejected through ordinary canonical comparison.");
  }
  if (outcome === "attach-to-existing-organization") {
    if (!selectedOrganizationId || !organizationIds.has(selectedOrganizationId)) {
      throw new Error("Existing-Organization attachment requires a selected Organization in recorded match evidence.");
    }
  } else if (selectedOrganizationId) {
    throw new Error("Only an existing-Organization comparison may select a canonical Organization.");
  }
  return Object.freeze({
    id: stable<ProviderCanonicalComparisonId>(input.id, "Provider canonical comparison id"),
    candidateId: input.candidate.id,
    candidateRecordFingerprint: input.candidate.sourceRecordFingerprint,
    geographyProfileFingerprint: input.candidate.geographyProfileFingerprint!,
    canonicalSearchFingerprint: normalized(
      input.canonicalSearchFingerprint,
      "Canonical search fingerprint",
      500,
    ),
    matches,
    outcome,
    selectedOrganizationId,
    rationale: normalized(input.rationale, "Canonical comparison rationale", 2_000),
    comparisonFingerprint: normalized(input.comparisonFingerprint, "Comparison fingerprint", 500),
    reviewedByAdministratorId: foreignId(
      input.reviewedByAdministratorId,
      "Comparison reviewer administrator id",
    ),
    authorityContextId: foreignId(input.authorityContextId, "Comparison authority context id"),
    reviewedAt: timestamp(input.reviewedAt, "Comparison review timestamp"),
  });
}

function expectedDecision(outcome: ProviderCanonicalComparisonOutcome): ProviderPromotionDecision {
  if (outcome === "create-new-organization") return "approve-new-organization";
  if (outcome === "attach-to-existing-organization") return "approve-existing-organization";
  if (outcome === "reject-candidate") return "reject-candidate";
  return "defer-identity-review";
}

export function createProviderPromotionApproval(input: Readonly<{
  id: string;
  candidate: ProviderSeedPromotionCandidate;
  comparison: ProviderCanonicalComparison;
  decision: string;
  targetOrganizationId?: string | null;
  candidateRecordFingerprint: string;
  geographyProfileFingerprint: string;
  comparisonFingerprint: string;
  rationale: string;
  approvedByAdministratorId: string;
  authorityContextId: string;
  approvedAt: string;
}>): ProviderPromotionApproval {
  if (input.comparison.candidateId !== input.candidate.id) {
    throw new Error("Promotion comparison belongs to a different provider candidate.");
  }
  if (
    input.candidateRecordFingerprint !== input.candidate.sourceRecordFingerprint
    || input.candidateRecordFingerprint !== input.comparison.candidateRecordFingerprint
    || input.geographyProfileFingerprint !== input.candidate.geographyProfileFingerprint
    || input.geographyProfileFingerprint !== input.comparison.geographyProfileFingerprint
    || input.comparisonFingerprint !== input.comparison.comparisonFingerprint
  ) {
    throw new Error("Provider promotion approval is stale relative to candidate, geography, or comparison evidence.");
  }
  const decision = oneOf(input.decision, PROVIDER_PROMOTION_DECISIONS, "provider promotion decision");
  if (decision !== expectedDecision(input.comparison.outcome)) {
    throw new Error("Provider promotion decision does not match the reviewed comparison outcome.");
  }
  const targetOrganizationId = input.targetOrganizationId?.trim()
    ? foreignId(input.targetOrganizationId, "Promotion target organization id")
    : null;
  if (decision === "approve-new-organization" && !targetOrganizationId) {
    throw new Error("New-Organization approval requires a reserved target Organization id.");
  }
  if (
    decision === "approve-existing-organization"
    && targetOrganizationId !== input.comparison.selectedOrganizationId
  ) {
    throw new Error("Existing-Organization approval must retain the selected canonical Organization.");
  }
  if (
    (decision === "reject-candidate" || decision === "defer-identity-review")
    && targetOrganizationId
  ) {
    throw new Error("Rejected or deferred candidates cannot reserve a target Organization.");
  }
  const state = decision.startsWith("approve-")
    ? "approved" as const
    : decision === "reject-candidate"
      ? "rejected" as const
      : "deferred" as const;
  return Object.freeze({
    id: stable<ProviderPromotionApprovalId>(input.id, "Provider promotion approval id"),
    candidateId: input.candidate.id,
    comparisonId: input.comparison.id,
    decision,
    state,
    targetOrganizationMode: decision === "approve-new-organization"
      ? "create"
      : decision === "approve-existing-organization"
        ? "attach-existing"
        : null,
    targetOrganizationId,
    candidateRecordFingerprint: input.candidateRecordFingerprint,
    geographyProfileFingerprint: input.geographyProfileFingerprint,
    comparisonFingerprint: input.comparisonFingerprint,
    rationale: normalized(input.rationale, "Provider promotion approval rationale", 2_000),
    approvedByAdministratorId: foreignId(
      input.approvedByAdministratorId,
      "Promotion approver administrator id",
    ),
    authorityContextId: foreignId(input.authorityContextId, "Promotion approval authority context id"),
    approvedAt: timestamp(input.approvedAt, "Provider promotion approval timestamp"),
  });
}

export function createProviderPromotionCommand(input: Readonly<{
  id: string;
  action: string;
  candidate: ProviderSeedPromotionCandidate;
  comparison: ProviderCanonicalComparison;
  approval: ProviderPromotionApproval;
  targetLocationId: string;
  targetProviderResourceId: string;
  geographyProfileId: string;
  approvalFingerprint: string;
  requestFingerprint: string;
  actorAdministratorId: string;
  authorityContextId: string;
  confirmation?: string | null;
  recordedAt: string;
}>): ProviderPromotionCommand {
  if (
    input.approval.state !== "approved"
    || !input.approval.targetOrganizationMode
    || !input.approval.targetOrganizationId
  ) {
    throw new Error("Only an explicitly approved provider candidate can produce a promotion command.");
  }
  if (
    input.approval.candidateId !== input.candidate.id
    || input.approval.comparisonId !== input.comparison.id
    || input.approval.candidateRecordFingerprint !== input.candidate.sourceRecordFingerprint
    || input.approval.geographyProfileFingerprint !== input.candidate.geographyProfileFingerprint
    || input.approval.comparisonFingerprint !== input.comparison.comparisonFingerprint
  ) {
    throw new Error("Provider promotion command evidence is stale or cross-bound.");
  }
  const action = oneOf(
    input.action,
    PROVIDER_PROMOTION_COMMAND_ACTIONS,
    "provider promotion command action",
  );
  if (
    action === "commit-approved-provider-promotion"
    && input.confirmation !== "PROMOTE APPROVED PROVIDER"
  ) {
    throw new Error("Committed provider promotion requires the exact production confirmation phrase.");
  }
  if (
    input.actorAdministratorId !== input.approval.approvedByAdministratorId
    || input.authorityContextId !== input.approval.authorityContextId
  ) {
    throw new Error("Provider promotion command must use the approving administrator authority context.");
  }
  return Object.freeze({
    id: stable<ProviderPromotionCommandId>(input.id, "Provider promotion command id"),
    action,
    marketKey: input.candidate.marketKey,
    candidateId: input.candidate.id,
    comparisonId: input.comparison.id,
    approvalId: input.approval.id,
    targetOrganizationMode: input.approval.targetOrganizationMode,
    targetOrganizationId: input.approval.targetOrganizationId,
    targetLocationId: foreignId(input.targetLocationId, "Promotion target location id"),
    targetProviderResourceId: foreignId(
      input.targetProviderResourceId,
      "Promotion target provider Resource id",
    ),
    geographyProfileId: foreignId(input.geographyProfileId, "Promotion geography profile id"),
    candidateRecordFingerprint: input.approval.candidateRecordFingerprint,
    geographyProfileFingerprint: input.approval.geographyProfileFingerprint,
    comparisonFingerprint: input.approval.comparisonFingerprint,
    approvalFingerprint: normalized(input.approvalFingerprint, "Promotion approval fingerprint", 500),
    requestFingerprint: normalized(input.requestFingerprint, "Promotion request fingerprint", 500),
    publishProviderDiscovery: false,
    publishResource: false,
    actorAdministratorId: foreignId(
      input.actorAdministratorId,
      "Promotion actor administrator id",
    ),
    authorityContextId: foreignId(input.authorityContextId, "Promotion authority context id"),
    recordedAt: timestamp(input.recordedAt, "Provider promotion command timestamp"),
  });
}

export function createProviderPromotionEvent(input: Readonly<{
  id: string;
  command: ProviderPromotionCommand;
  occurredAt: string;
}>): ProviderPromotionEvent {
  return Object.freeze({
    id: stable<ProviderPromotionEventId>(input.id, "Provider promotion event id"),
    kind: input.command.action === "commit-approved-provider-promotion"
      ? "provider-promotion-committed"
      : "provider-promotion-previewed",
    candidateId: input.command.candidateId,
    targetOrganizationId: input.command.targetOrganizationId,
    commandId: input.command.id,
    occurredAt: timestamp(input.occurredAt, "Provider promotion event timestamp"),
  });
}
