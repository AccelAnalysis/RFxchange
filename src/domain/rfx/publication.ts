import { createHash } from "node:crypto";

import type { OrganizationId } from "../organizations/model.ts";
import type {
  EngagementTerm,
  EstimatedValue,
  PerformanceLocation,
  RfxAggregate,
  RfxDefinition,
  RfxEvaluationFactorTreatment,
  RfxFoundationRequirement,
  RfxId,
  RfxRequirementLevel,
  RfxRequirementQualifier,
  RfxResponseSectionFormat,
  RfxTiming,
} from "./model.ts";

export const RFX_PUBLICATION_SCHEMA_VERSION = 1 as const;

export type RfxPublicationAudience = "public" | "authenticated-participants";

export interface RequirementReadinessStatus {
  readonly requirementId: string;
  readonly status: "ready" | "blocked";
  readonly findingCodes: readonly string[];
}

export interface ReadinessFinding {
  readonly code: string;
  readonly severity: "blocking" | "advisory";
  readonly sourcePath: string;
  readonly workspaceTarget: string;
  readonly relatedRecordId: string | null;
}

export interface PublicationReadinessResult {
  readonly rfxId: RfxId;
  readonly aggregateVersion: number;
  readonly evaluatedAt: string;
  readonly status: "ready" | "blocked";
  readonly requirementStatus: readonly RequirementReadinessStatus[];
  readonly findings: readonly ReadinessFinding[];
}

export interface PublicationLocalitySnapshot {
  readonly id: string;
  readonly label: string;
  readonly indexKey: string;
  readonly authorityUpdatedAt: string;
}

export interface ResponderRequirementProjection {
  readonly title: string;
  readonly description: string;
  readonly level: RfxRequirementLevel;
  readonly requirementTypeLabel: string;
  readonly capabilityLabel: string | null;
  readonly capabilityDefinition: string | null;
  readonly qualifiers: readonly RfxRequirementQualifier[];
  readonly evidence: readonly string[];
}

export interface ResponderOpportunityPayload {
  readonly title: string;
  readonly summary: string;
  readonly issuerDisplayName: string;
  readonly requestFamilyLabel: string;
  readonly requestFamilyPurpose: string;
  readonly timing: RfxTiming;
  readonly localities: readonly Readonly<{ id: string; label: string }>[];
  readonly estimatedValue: EstimatedValue;
  readonly engagementTerm: EngagementTerm;
  readonly requestedOutputs: readonly Readonly<{
    title: string;
    description: string;
    quantity: Readonly<{ amount: number; unit: string }> | null;
    dueDate: string | null;
  }>[];
  readonly foundationRequirements: readonly Omit<RfxFoundationRequirement, "id">[];
  readonly requirements: readonly ResponderRequirementProjection[];
  readonly responseSections: readonly Readonly<{
    title: string;
    instructions: string;
    format: RfxResponseSectionFormat;
    required: boolean;
    characterLimit: number | null;
    itemLimit: number | null;
    attachmentsAllowed: boolean;
  }>[];
  readonly evaluation: Readonly<{
    methodLabel: string | null;
    weightingRequired: boolean;
    factors: readonly Readonly<{
      title: string;
      description: string;
      treatment: RfxEvaluationFactorTreatment;
      weightBasisPoints: number | null;
    }>[];
  }>;
}

export interface ResponderOpportunityProjection {
  readonly schemaVersion: typeof RFX_PUBLICATION_SCHEMA_VERSION;
  readonly reference: string;
  readonly audience: RfxPublicationAudience;
  readonly aggregateVersion: number;
  readonly mode: "preview" | "published";
  readonly digest: string;
  readonly payload: ResponderOpportunityPayload;
  readonly publishedAt: string | null;
  readonly requestFamilyIndexKey: string;
  readonly localityIndexKeys: readonly string[];
  readonly capabilityIndexKeys: readonly string[];
}

export interface RfxPublicationSnapshot {
  readonly schemaVersion: typeof RFX_PUBLICATION_SCHEMA_VERSION;
  readonly id: string;
  readonly reference: string;
  readonly rfxId: RfxId;
  readonly issuerOrganizationId: OrganizationId;
  readonly audience: RfxPublicationAudience;
  readonly aggregateVersion: number;
  readonly aggregate: RfxAggregate;
  readonly amacsReleaseVersion: string;
  readonly amacsSourceCommit: string;
  readonly projectionDigest: string;
  readonly publishedAt: string;
}

function stableDigest(payload: ResponderOpportunityPayload): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function rfxPublicationReference(rfxId: RfxId): string {
  return `opp_${createHash("sha256").update(`${rfxId}:publication`).digest("hex").slice(0, 40)}`;
}

export function rfxPublicationSnapshotId(rfxId: RfxId): string {
  return `rfxpublication_${createHash("sha256").update(String(rfxId)).digest("hex").slice(0, 40)}`;
}

function locations(value: PerformanceLocation): readonly string[] {
  return value.mode === "multiple"
    ? Object.freeze(value.locations.map((item) => item.localityId))
    : Object.freeze([value.localityId]);
}

function evidenceLabels(
  definition: RfxDefinition,
  evidenceIds: readonly string[],
): readonly string[] {
  const labels = evidenceIds.flatMap((id) => {
    const requirement = definition.requirements.find((item) => item.id === id);
    return requirement ? [requirement.title] : [];
  });
  return Object.freeze(labels);
}

export function projectResponderOpportunity(input: Readonly<{
  aggregate: RfxAggregate;
  issuerDisplayName: string;
  localities: readonly PublicationLocalitySnapshot[];
  audience: RfxPublicationAudience;
  reference: string;
  mode: "preview" | "published";
  publishedAt?: string | null;
}>): ResponderOpportunityProjection {
  const { aggregate } = input;
  if (!aggregate.package || !aggregate.definition)
    throw new Error("RFx projection requires a complete package and definition.");
  const localityIds = new Set(locations(aggregate.package.performanceLocation!));
  const permittedLocalities = input.localities
    .filter((item) => localityIds.has(item.id))
    .sort((left, right) => left.id.localeCompare(right.id));
  if (permittedLocalities.length !== localityIds.size)
    throw new Error("RFx projection locality authority is incomplete.");

  const payload: ResponderOpportunityPayload = Object.freeze({
    title: aggregate.package.title,
    summary: [
      aggregate.package.marketNeed.observedCondition,
      aggregate.package.marketNeed.desiredOutcome,
    ].filter(Boolean).join(" "),
    issuerDisplayName: input.issuerDisplayName.trim(),
    requestFamilyLabel: aggregate.requestFamily.labelSnapshot,
    requestFamilyPurpose: aggregate.requestFamily.purposeSnapshot,
    timing: aggregate.package.timing,
    localities: Object.freeze(
      permittedLocalities.map((item) => Object.freeze({ id: item.id, label: item.label })),
    ),
    estimatedValue: aggregate.package.estimatedValue,
    engagementTerm: aggregate.package.engagementTerm,
    requestedOutputs: Object.freeze(
      aggregate.package.requestedOutputs.map((item) => Object.freeze({
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        dueDate: item.dueDate,
      })),
    ),
    foundationRequirements: Object.freeze(
      aggregate.package.requirements.map((item) => Object.freeze({
        kind: item.kind,
        title: item.title,
        description: item.description,
        mandatory: item.mandatory,
        quantity: item.quantity,
        dueDate: item.dueDate,
        evidenceDescription: item.evidenceDescription,
      })),
    ),
    requirements: Object.freeze(
      aggregate.definition.requirements.map((requirement) =>
        Object.freeze({
          title: requirement.title,
          description: requirement.description,
          level: requirement.level,
          requirementTypeLabel: requirement.requirementType.labelSnapshot,
          capabilityLabel: requirement.capability?.labelSnapshot ?? null,
          capabilityDefinition: requirement.capability?.definitionSnapshot ?? null,
          qualifiers: requirement.qualifiers,
          evidence: evidenceLabels(
            aggregate.definition!,
            requirement.evidenceRequirementIds,
          ),
        }),
      ),
    ),
    responseSections: Object.freeze(
      [...aggregate.definition.responseStructure.sections]
        .sort((left, right) => left.order - right.order)
        .map((item) => Object.freeze({
          title: item.title,
          instructions: item.instructions,
          format: item.format,
          required: item.required,
          characterLimit: item.characterLimit,
          itemLimit: item.itemLimit,
          attachmentsAllowed: item.attachmentsAllowed,
        })),
    ),
    evaluation: Object.freeze({
      methodLabel:
        aggregate.definition.evaluationDefinition.sourceTemplate?.labelSnapshot ?? null,
      weightingRequired: aggregate.definition.evaluationDefinition.weightingRequired,
      factors: Object.freeze(
        [...aggregate.definition.evaluationDefinition.factors]
          .sort((left, right) => left.order - right.order)
          .map((item) => Object.freeze({
            title: item.title,
            description: item.description,
            treatment: item.treatment,
            weightBasisPoints: item.weightBasisPoints,
          })),
      ),
    }),
  });
  if (!payload.issuerDisplayName) throw new Error("Issuer display identity is unavailable.");
  return Object.freeze({
    schemaVersion: RFX_PUBLICATION_SCHEMA_VERSION,
    reference: input.reference,
    audience: input.audience,
    aggregateVersion: aggregate.version,
    mode: input.mode,
    digest: stableDigest(payload),
    payload,
    publishedAt: input.mode === "published" ? (input.publishedAt ?? null) : null,
    requestFamilyIndexKey: aggregate.requestFamily.requestFamilyId,
    localityIndexKeys: Object.freeze(permittedLocalities.map((item) => item.indexKey)),
    capabilityIndexKeys: Object.freeze(
      [...new Set(aggregate.definition.requirements.flatMap((item) =>
        item.capability ? [item.capability.id] : [],
      ))].sort(),
    ),
  });
}

function finding(
  code: string,
  sourcePath: string,
  workspaceTarget: string,
  relatedRecordId: string | null = null,
  severity: ReadinessFinding["severity"] = "blocking",
): ReadinessFinding {
  return Object.freeze({ code, severity, sourcePath, workspaceTarget, relatedRecordId });
}

function packageWorkspaceTarget(key: string): string {
  switch (key) {
    case "marketNeed": return "#rfx-need";
    case "scopeOutputs": return "#rfx-scope-outputs";
    case "timing": return "#rfx-timing";
    case "performanceLocation": return "#rfx-performance-location";
    case "valueTerm": return "#rfx-value-term";
    case "requirements": return "#rfx-requirements";
    default: return "#rfx-package";
  }
}

function definitionWorkspaceTarget(key: string): string {
  switch (key) {
    case "requirements": return "#rfx-definition-requirements";
    case "responseStructure": return "#rfx-definition-responseStructure";
    case "evaluationDefinition": return "#rfx-definition-evaluationDefinition";
    default: return "#rfx-definition";
  }
}

export function evaluatePublicationReadiness(input: Readonly<{
  aggregate: RfxAggregate;
  audience: RfxPublicationAudience;
  evaluatedAt: string;
  localities: readonly PublicationLocalitySnapshot[];
  publishAuthorized: boolean;
  issuerDisplayNameAvailable: boolean;
}>): PublicationReadinessResult {
  const { aggregate } = input;
  const findings: ReadinessFinding[] = [];
  if (aggregate.lifecycleState !== "draft")
    findings.push(finding("lifecycle.not-draft", "lifecycleState", "#rfx-readiness"));
  if (
    aggregate.requestFamily.amacsReleaseVersion !== "0.5.0" ||
    !aggregate.requestFamily.amacsSourceCommit
  ) findings.push(finding("amacs.provenance-incomplete", "requestFamily", "#rfx-request-family"));
  if (!aggregate.package) {
    findings.push(finding("package.missing", "package", "#rfx-package"));
  } else {
    for (const [key, state] of Object.entries(aggregate.package.moduleStatus)) {
      if (state !== "complete")
        findings.push(finding(`package.${key}.incomplete`, `package.moduleStatus.${key}`, packageWorkspaceTarget(key)));
    }
    const now = Date.parse(input.evaluatedAt);
    const deadline = aggregate.package.timing.responseDeadline;
    if (!deadline || Date.parse(`${deadline}T23:59:59.999Z`) <= now)
      findings.push(finding("timing.response-deadline-invalid", "package.timing.responseDeadline", "#rfx-timing"));
    const start = aggregate.package.timing.anticipatedStartDate;
    const completion = aggregate.package.timing.anticipatedCompletionDate;
    if (start && completion && start > completion)
      findings.push(finding("timing.sequence-invalid", "package.timing", "#rfx-timing"));
    if (!aggregate.package.performanceLocation)
      findings.push(finding("geography.performance-location-missing", "package.performanceLocation", "#rfx-performance-location"));
    else if (!input.localities.length)
      findings.push(finding("geography.authority-unavailable", "package.performanceLocation", "#rfx-performance-location"));
  }
  if (!aggregate.definition) {
    findings.push(finding("definition.missing", "definition", "#rfx-definition"));
  } else {
    for (const [key, state] of Object.entries(aggregate.definition.moduleStatus)) {
      if (state !== "complete")
        findings.push(finding(`definition.${key}.incomplete`, `definition.moduleStatus.${key}`, definitionWorkspaceTarget(key)));
    }
    if (
      aggregate.definition.evaluationDefinition.weightingRequired &&
      aggregate.definition.evaluationDefinition.factors
        .filter((item) => item.weightBasisPoints !== null)
        .reduce((sum, item) => sum + (item.weightBasisPoints ?? 0), 0) !== 10_000
    ) findings.push(finding("evaluation.weights-not-10000", "definition.evaluationDefinition.factors", "#rfx-definition-evaluationDefinition"));
  }
  if (!input.issuerDisplayNameAvailable)
    findings.push(finding("issuer.display-identity-unavailable", "issuerOrganizationId", "#rfx-readiness"));
  if (!input.publishAuthorized)
    findings.push(finding(
      "authority.publish-unavailable",
      "authorization.rfx.publish",
      "#rfx-readiness",
      null,
      "advisory",
    ));

  const requirementStatus = Object.freeze(
    (aggregate.definition?.requirements ?? []).map((requirement) => {
      const codes: string[] = [];
      const isRequired = requirement.level === "required";
      const hasResponseOrEvidence =
        requirement.linkedResponseSectionIds.length > 0 ||
        requirement.evidenceRequirementIds.length > 0 ||
        requirement.linkedFoundationRequirementIds.length > 0;
      const linkedFactors = aggregate.definition!.evaluationDefinition.factors.filter(
        (factor) => factor.linkedRequirementIds.includes(requirement.id),
      );
      const hasRequiredDecisionTreatment =
        requirement.decisionTreatment === "gate_only"
          ? linkedFactors.some((factor) =>
              factor.treatment === "required-condition" ||
              factor.treatment === "required-and-scored")
          : requirement.decisionTreatment === "scored_only"
            ? linkedFactors.some((factor) =>
                factor.treatment === "scored-factor" ||
                factor.treatment === "required-and-scored")
            : requirement.decisionTreatment === "gate_and_scored_depth"
              ? linkedFactors.some((factor) =>
                  factor.treatment === "required-condition" ||
                  factor.treatment === "required-and-scored") &&
                linkedFactors.some((factor) =>
                  factor.treatment === "scored-factor" ||
                  factor.treatment === "required-and-scored")
              : linkedFactors.length > 0;
      if (isRequired && !hasResponseOrEvidence)
        codes.push("requirement.response-link-missing");
      if (isRequired && !hasRequiredDecisionTreatment)
        codes.push("requirement.evaluation-link-missing");
      for (const code of codes)
        findings.push(finding(code, `definition.requirements.${requirement.id}`, `#rfx-requirement-${requirement.id}`, requirement.id));
      return Object.freeze({
        requirementId: requirement.id,
        status: codes.length ? "blocked" as const : "ready" as const,
        findingCodes: Object.freeze(codes),
      });
    }),
  );
  return Object.freeze({
    rfxId: aggregate.id,
    aggregateVersion: aggregate.version,
    evaluatedAt: new Date(input.evaluatedAt).toISOString(),
    status: findings.some((item) => item.severity === "blocking") ? "blocked" : "ready",
    requirementStatus,
    findings: Object.freeze(findings),
  });
}

export function publishedAggregate(
  aggregate: RfxAggregate,
  actor: Readonly<{ userId: RfxAggregate["updatedByUserId"]; membershipId: RfxAggregate["updatedByMembershipId"] }>,
  now: string,
): RfxAggregate {
  if (aggregate.lifecycleState !== "draft") throw new Error("Only a draft RFx can be published.");
  return Object.freeze({
    ...aggregate,
    lifecycleState: "published" as const,
    version: aggregate.version + 1,
    updatedByUserId: actor.userId,
    updatedByMembershipId: actor.membershipId,
    updatedAt: new Date(now).toISOString(),
  });
}
