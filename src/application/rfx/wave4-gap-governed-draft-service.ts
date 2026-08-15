import { createHash } from "node:crypto";

import { authorizeOrganizationOperation } from "../auth/authorize-organization-operation.ts";
import { createOrganizationActionAuditEvent } from "../../domain/audit/model.ts";
import type { AmacsCapability, AmacsRegistryRecord } from "../../domain/amacs/model.ts";
import { organizationId } from "../../domain/organizations/model.ts";
import {
  normalizeRfxDefinition,
  rfxId,
  RFX_AMACS_RELEASE_VERSION,
  RFX_AMACS_SOURCE_COMMIT,
  saveRfxDefinition,
  type AmacsDefinitionSnapshot,
  type RfxCommandReceipt,
  type RfxDefinition,
  type RfxDefinitionInput,
  type RfxDecisionTreatment,
  type RfxEvaluationFactorTreatment,
  type RfxEvent,
  type RfxPackageInput,
} from "../../domain/rfx/model.ts";
import {
  RfxPersistenceConflictError,
} from "../../domain/rfx/repository.ts";
import type { OrganizationMembershipId } from "../../domain/users/model.ts";
import { RfxIss006GovernedDraftService } from "./iss006-governed-draft-service.ts";
import {
  RfxDraftError,
  type RfxCommandScope,
  type RfxDefinitionSelectionInput,
  type RfxDraftServiceDependencies,
} from "./rfx-draft-service.ts";

function stable(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) {
    throw new RfxDraftError("invalid", `${label} is invalid.`);
  }
  return normalized;
}

function optionalStable(value: unknown, label: string): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return stable(value, label);
}

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RfxDraftError("invalid", `${label} is invalid.`);
  }
  return value as Record<string, unknown>;
}

function recordText(record: AmacsRegistryRecord, key: string, label: string): string {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new RfxDraftError("dependency-unavailable", `${label} is unavailable.`);
  }
  return value.trim();
}

function active(record: AmacsRegistryRecord | null): record is AmacsRegistryRecord {
  return Boolean(record && record.status === "active");
}

function registrySnapshot(
  record: AmacsRegistryRecord,
  input: Readonly<{
    kind: AmacsDefinitionSnapshot["kind"];
    idKey: string;
    definitionKey: string;
  }>,
): AmacsDefinitionSnapshot {
  return Object.freeze({
    kind: input.kind,
    id: recordText(record, input.idKey, "AMACS record identity"),
    labelSnapshot: recordText(record, "preferred_label", "AMACS record label"),
    definitionSnapshot: recordText(record, input.definitionKey, "AMACS record definition"),
    amacsReleaseVersion: RFX_AMACS_RELEASE_VERSION,
    amacsSourceCommit: RFX_AMACS_SOURCE_COMMIT,
  });
}

function capabilitySnapshot(capability: AmacsCapability): AmacsDefinitionSnapshot {
  return Object.freeze({
    kind: "capability",
    id: capability.conceptId,
    labelSnapshot: capability.preferredLabel,
    definitionSnapshot: capability.definition,
    amacsReleaseVersion: RFX_AMACS_RELEASE_VERSION,
    amacsSourceCommit: RFX_AMACS_SOURCE_COMMIT,
  });
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function deterministicId(prefix: string, commandId: string, organization: string): string {
  return `${prefix}_${createHash("sha256").update(`${organization}:${commandId}`).digest("hex").slice(0, 40)}`;
}

export function factorRequirementTreatmentCompatible(
  factorTreatment: RfxEvaluationFactorTreatment,
  requirementTreatment: RfxDecisionTreatment,
): boolean {
  if (requirementTreatment === "gate_only") {
    return factorTreatment === "required-condition";
  }
  if (requirementTreatment === "scored_only") {
    return factorTreatment === "scored-factor";
  }
  if (requirementTreatment === "gate_and_scored_depth") {
    return (
      factorTreatment === "required-condition" ||
      factorTreatment === "scored-factor" ||
      factorTreatment === "required-and-scored"
    );
  }
  return factorTreatment === "informational-only";
}

function assertFactorRequirementTreatmentCompatibility(definition: RfxDefinition): void {
  const requirements = new Map(
    definition.requirements.map((requirement) => [requirement.id, requirement]),
  );
  for (const factor of definition.evaluationDefinition.factors) {
    for (const requirementId of factor.linkedRequirementIds) {
      const requirement = requirements.get(requirementId);
      if (
        requirement &&
        !factorRequirementTreatmentCompatible(factor.treatment, requirement.decisionTreatment)
      ) {
        throw new RfxDraftError(
          "invalid",
          `Evaluation factor ${factor.id} linked requirement treatment is incompatible with ${requirement.id}.`,
        );
      }
    }
  }
}

function qualifierKind(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const kind = (value as Record<string, unknown>).kind;
  return typeof kind === "string" ? kind : null;
}

type TextQualifierIntent = "preserve" | "set" | "remove";

function textQualifierIntent(value: unknown): TextQualifierIntent | null {
  if (value === undefined || value === null) return null;
  if (value === "preserve" || value === "set" || value === "remove") return value;
  throw new RfxDraftError("invalid", "Text qualifier intent is invalid.");
}

function mergeLosslessQualifiers(
  current: RfxDefinition | null,
  input: RfxDefinitionSelectionInput,
): RfxDefinitionSelectionInput {
  if (!current || !Array.isArray(input.requirements)) return input;
  const currentRequirements = new Map(
    current.requirements.map((requirement) => [requirement.id, requirement]),
  );
  const requirements = input.requirements.map((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
    const requirement = raw as Record<string, unknown>;
    const {
      textQualifierIntent: rawIntent,
      textQualifierBaseValue: rawBaseValue,
      ...canonicalRequirement
    } = requirement;
    const id = typeof requirement.id === "string" ? requirement.id : "";
    const existing = currentRequirements.get(id);
    if (!existing) return Object.freeze(canonicalRequirement);
    const hasExplicitQualifiers = Array.isArray(requirement.qualifiers);
    const incoming = hasExplicitQualifiers ? requirement.qualifiers as unknown[] : [];
    const firstExistingTextIndex = existing.qualifiers.findIndex(
      (item) => item.kind === "text",
    );
    const firstExistingText = firstExistingTextIndex >= 0
      ? (existing.qualifiers[firstExistingTextIndex] as Extract<
          (typeof existing.qualifiers)[number],
          { kind: "text" }
        >)
      : null;
    const preserved = existing.qualifiers.filter(
      (_item, index) => index !== firstExistingTextIndex,
    );
    const intent = textQualifierIntent(rawIntent);

    if (intent) {
      const currentValue = firstExistingText?.value ?? "";
      const baseValue = typeof rawBaseValue === "string" ? rawBaseValue : "";
      if (intent !== "preserve" && currentValue !== baseValue) {
        throw new RfxDraftError(
          "conflict",
          "The text qualifier changed before this definition save.",
        );
      }
      const incomingText = incoming.find((item) => qualifierKind(item) === "text");
      if (intent === "set" && !incomingText) {
        throw new RfxDraftError("invalid", "Text qualifier value is required.");
      }
      const effectiveText = intent === "preserve"
        ? firstExistingText
          ? [firstExistingText]
          : []
        : intent === "set"
          ? [incomingText]
          : [];
      return Object.freeze({
        ...canonicalRequirement,
        qualifiers: Object.freeze([...effectiveText, ...preserved]),
      });
    }

    // Structured qualifier authoring sends the entire qualifier set. An explicit empty array is
    // therefore a deliberate removal, not a legacy partial update that may resurrect old values.
    if (hasExplicitQualifiers) {
      return Object.freeze({
        ...canonicalRequirement,
        qualifiers: Object.freeze([...incoming]),
      });
    }
    return Object.freeze({
      ...canonicalRequirement,
      qualifiers: Object.freeze([...existing.qualifiers]),
    });
  });
  return Object.freeze({
    ...input,
    requirements: Object.freeze(requirements),
  });
}

export class Wave4GapGovernedDraftService extends RfxIss006GovernedDraftService {
  private readonly gapDependencies: RfxDraftServiceDependencies;
  private readonly currentTime: () => string;

  constructor(dependencies: RfxDraftServiceDependencies) {
    super(dependencies);
    this.gapDependencies = dependencies;
    this.currentTime = dependencies.now ?? (() => new Date().toISOString());
  }

  private async canonicalDefinitionInputWithPartialTemplates(
    input: RfxDefinitionSelectionInput,
  ): Promise<RfxDefinitionInput> {
    if (!Array.isArray(input.requirements) || input.requirements.length > 100) {
      throw new RfxDraftError("invalid", "RFx requirements are invalid.");
    }

    const requirements = await Promise.all(
      input.requirements.map(async (item, index) => {
        const source = objectValue(item, `RFx requirement ${index + 1}`);
        const requirementTypeId = stable(
          String(source.requirementTypeId ?? ""),
          `RFx requirement ${index + 1} type`,
        );
        const requirementType = await this.gapDependencies.catalog.getRequirementType(
          requirementTypeId,
        );
        if (!active(requirementType)) {
          throw new RfxDraftError(
            "invalid",
            `RFx requirement ${index + 1} type is unavailable.`,
          );
        }
        const requirementTypeCode = recordText(
          requirementType,
          "code",
          "Requirement type",
        );
        const treatments = requirementType.allowed_decision_treatments;
        if (
          !Array.isArray(treatments) ||
          !treatments.every((treatment) => typeof treatment === "string")
        ) {
          throw new RfxDraftError(
            "dependency-unavailable",
            "A governed requirement type is malformed.",
          );
        }
        const capabilityId = optionalStable(
          source.capabilityId,
          `RFx requirement ${index + 1} capability`,
        );
        const capability = capabilityId
          ? await this.gapDependencies.catalog.getCapability(capabilityId)
          : null;
        if (capabilityId && (!capability || capability.status !== "active")) {
          throw new RfxDraftError(
            "invalid",
            `RFx requirement ${index + 1} capability is unavailable.`,
          );
        }
        return Object.freeze({
          ...source,
          requirementType: registrySnapshot(requirementType, {
            kind: "requirement-type",
            idKey: "requirement_type_id",
            definitionKey: "definition",
          }),
          requirementTypeCode,
          allowedDecisionTreatments: Object.freeze([...treatments]),
          teamCoverageAllowed: requirementType.team_coverage_allowed === true,
          capability: capability ? capabilitySnapshot(capability) : null,
          capabilityBreadcrumb: capability
            ? `${capability.domainLabel} / ${capability.familyLabel} / ${capability.preferredLabel}`
            : null,
        });
      }),
    );

    const responseInput = objectValue(input.responseStructure, "Response structure");
    const responseTemplateId = optionalStable(
      responseInput.responseTemplateId,
      "Response template",
    );
    const responseTemplate = responseTemplateId
      ? await this.gapDependencies.catalog.getResponseTemplate(responseTemplateId)
      : null;
    if (responseTemplateId && !active(responseTemplate)) {
      throw new RfxDraftError("invalid", "The selected response template is unavailable.");
    }
    if (!Array.isArray(responseInput.sections) || responseInput.sections.length > 50) {
      throw new RfxDraftError("invalid", "Response sections are invalid.");
    }
    const sections = await Promise.all(
      responseInput.sections.map(async (item, index) => {
        const source = objectValue(item, `Response section ${index + 1}`);
        const sourceSectionId = optionalStable(
          source.sourceSectionId,
          `Response section ${index + 1} source`,
        );
        const section = sourceSectionId
          ? await this.gapDependencies.catalog.getResponseSection(sourceSectionId)
          : null;
        if (sourceSectionId && !active(section)) {
          throw new RfxDraftError(
            "invalid",
            `Response section ${index + 1} source is unavailable.`,
          );
        }
        return Object.freeze({
          ...source,
          sourceSection: section
            ? registrySnapshot(section, {
                kind: "response-section",
                idKey: "response_section_id",
                definitionKey: "purpose",
              })
            : null,
        });
      }),
    );

    const evaluationInput = objectValue(
      input.evaluationDefinition,
      "Evaluation definition",
    );
    const decisionTemplateId = optionalStable(
      evaluationInput.decisionTemplateId,
      "Decision template",
    );
    const decisionTemplate = decisionTemplateId
      ? await this.gapDependencies.catalog.getDecisionTemplate(decisionTemplateId)
      : null;
    if (decisionTemplateId && !active(decisionTemplate)) {
      throw new RfxDraftError("invalid", "The selected decision template is unavailable.");
    }
    if (!Array.isArray(evaluationInput.factors) || evaluationInput.factors.length > 50) {
      throw new RfxDraftError("invalid", "Evaluation factors are invalid.");
    }
    const factors = await Promise.all(
      evaluationInput.factors.map(async (item, index) => {
        const source = objectValue(item, `Evaluation factor ${index + 1}`);
        const sourceFactorId = optionalStable(
          source.sourceFactorId,
          `Evaluation factor ${index + 1} source`,
        );
        const factor = sourceFactorId
          ? await this.gapDependencies.catalog.getDecisionFactor(sourceFactorId)
          : null;
        if (sourceFactorId && !active(factor)) {
          throw new RfxDraftError(
            "invalid",
            `Evaluation factor ${index + 1} source is unavailable.`,
          );
        }
        return Object.freeze({
          ...source,
          sourceFactor: factor
            ? registrySnapshot(factor, {
                kind: "decision-factor",
                idKey: "decision_factor_id",
                definitionKey: "definition",
              })
            : null,
          sourceMethod: factor ? recordText(factor, "method", "Decision factor") : null,
        });
      }),
    );

    return Object.freeze({
      requirements: Object.freeze(requirements),
      responseStructure: Object.freeze({
        sourceTemplate: responseTemplate
          ? registrySnapshot(responseTemplate, {
            kind: "response-template",
            idKey: "response_template_id",
            definitionKey: "description",
          })
          : null,
        sections: Object.freeze(sections),
      }),
      evaluationDefinition: Object.freeze({
        sourceTemplate: decisionTemplate
          ? registrySnapshot(decisionTemplate, {
            kind: "decision-template",
            idKey: "decision_template_id",
            definitionKey: "description",
          })
          : null,
        weightingRequired: decisionTemplate
          ? decisionTemplate.weighting_required === true
          : evaluationInput.weightingRequired === true,
        factors: Object.freeze(factors),
      }),
      interpretationRecordIds: input.interpretationRecordIds,
    });
  }

  override async savePackage(
    scope: RfxCommandScope,
    input: Readonly<{
      rfxId: string;
      expectedVersion: number;
      package: RfxPackageInput;
    }>,
  ) {
    const result = await super.savePackage(scope, input);
    if (result.replayed) return result;
    const committed = await this.gapDependencies.repository.getById(result.aggregate.id);
    if (
      !committed ||
      committed.issuerOrganizationId !== result.aggregate.issuerOrganizationId ||
      committed.version !== result.aggregate.version
    ) {
      throw new RfxDraftError(
        "dependency-unavailable",
        "The committed RFx package is temporarily unavailable.",
      );
    }
    return Object.freeze({
      ...result,
      aggregate: committed,
    });
  }

  override async saveDefinition(
    scope: RfxCommandScope,
    input: Readonly<{
      rfxId: string;
      expectedVersion: number;
      definition: RfxDefinitionSelectionInput;
    }>,
  ) {
    const commandId = stable(scope.commandId, "Command identity");
    let issuerOrganizationId;
    try {
      issuerOrganizationId = organizationId(scope.organizationId);
    } catch {
      throw new RfxDraftError("forbidden", "RFx workspace access is unavailable.");
    }
    const authorization = await authorizeOrganizationOperation(
      {
        context: scope.context,
        organizationId: issuerOrganizationId,
        membershipId: scope.membershipId as OrganizationMembershipId,
        permission: "rfx.create",
      },
      this.gapDependencies.authorization,
    );
    if (!authorization.allowed) {
      throw new RfxDraftError(
        "forbidden",
        `RFx workspace access is unavailable (${authorization.reason}).`,
      );
    }

    const aggregateId = rfxId(input.rfxId);
    const requestFingerprint = fingerprint({
      action: "save-definition",
      issuerOrganizationId: authorization.organization.id,
      rfxId: aggregateId,
      expectedVersion: input.expectedVersion,
      definition: input.definition,
    });

    const existingCommand = await this.gapDependencies.repository.getCommand(commandId);
    if (existingCommand) {
      if (
        existingCommand.issuerOrganizationId !== authorization.organization.id ||
        existingCommand.rfxId !== aggregateId ||
        existingCommand.action !== "save-definition" ||
        existingCommand.requestFingerprint !== requestFingerprint
      ) {
        throw new RfxDraftError(
          "conflict",
          "Command identity was already used for different RFx intent.",
        );
      }
      const existing = await this.gapDependencies.repository.getById(aggregateId);
      if (!existing || existing.issuerOrganizationId !== authorization.organization.id) {
        throw new RfxDraftError(
          "dependency-unavailable",
          "The committed RFx definition is temporarily unavailable.",
        );
      }
      return Object.freeze({
        aggregate: existing,
        receipt: existingCommand,
        replayed: true as const,
      });
    }

    const current = await this.gapDependencies.repository.getById(aggregateId);
    if (!current || current.issuerOrganizationId !== authorization.organization.id) {
      throw new RfxDraftError("not-found", "The requested RFx draft is unavailable.");
    }
    if (!Number.isInteger(input.expectedVersion) || input.expectedVersion !== current.version) {
      throw new RfxDraftError(
        "conflict",
        `RFx changed; current version is ${current.version}.`,
      );
    }

    let definition: RfxDefinition;
    try {
      const losslessInput = mergeLosslessQualifiers(
        current.definition,
        input.definition,
      );
      const canonical = await this.canonicalDefinitionInputWithPartialTemplates(losslessInput);
      definition = normalizeRfxDefinition(
        canonical,
        current.package?.requirements.map((requirement) => requirement.id) ?? [],
      );
      assertFactorRequirementTreatmentCompatibility(definition);
      for (const recordId of definition.interpretationRecordIds) {
        const interpretation = await this.gapDependencies.interpretations.getRecord(recordId);
        if (
          !interpretation ||
          interpretation.organizationId !== authorization.organization.id ||
          interpretation.record.organization_id !== authorization.organization.id ||
          interpretation.record.purpose !== "request_structure" ||
          interpretation.record.subject_ref !== aggregateId ||
          !["partially_confirmed", "confirmed"].includes(
            interpretation.record.record_status,
          )
        ) {
          throw new RfxDraftError(
            "invalid",
            "A reviewed request-structure interpretation reference is unavailable.",
          );
        }
      }
    } catch (error) {
      if (error instanceof RfxDraftError) throw error;
      throw new RfxDraftError(
        "invalid",
        error instanceof Error ? error.message : "The RFx definition is invalid.",
      );
    }

    const now = this.currentTime();
    const aggregate = saveRfxDefinition({
      aggregate: current,
      expectedVersion: input.expectedVersion,
      definition,
      actorUserId: authorization.context.user.id,
      actorMembershipId: authorization.membership.id,
      now,
    });
    const event: RfxEvent = Object.freeze({
      id: deterministicId("rfxevent", commandId, String(authorization.organization.id)),
      rfxId: aggregate.id,
      issuerOrganizationId: aggregate.issuerOrganizationId,
      kind: "rfx-definition-saved",
      aggregateVersion: aggregate.version,
      actorUserId: authorization.context.user.id,
      actorMembershipId: authorization.membership.id,
      commandId,
      requestFamily: aggregate.requestFamily,
      priorRequestFamily: null,
      package: aggregate.package,
      priorPackage: current.package ?? null,
      definition: aggregate.definition,
      priorDefinition: current.definition ?? null,
      occurredAt: now,
    });
    const receipt: RfxCommandReceipt = Object.freeze({
      id: commandId,
      issuerOrganizationId: aggregate.issuerOrganizationId,
      rfxId: aggregate.id,
      action: "save-definition",
      requestFingerprint,
      resultingVersion: aggregate.version,
      recordedAt: now,
    });

    try {
      const persistence = await this.gapDependencies.repository.save({
        aggregate,
        expectedVersion: input.expectedVersion,
        event,
        command: receipt,
        audit: createOrganizationActionAuditEvent(
          authorization.context.user,
          authorization.membership,
          authorization.organization,
          {
            id: deterministicId("audit", commandId, String(authorization.organization.id)),
            action: "rfx.definition-saved",
            occurredAt: now,
          },
        ),
      });
      if (persistence === "replayed") {
        const [committedAggregate, committedReceipt] = await Promise.all([
          this.gapDependencies.repository.getById(aggregate.id),
          this.gapDependencies.repository.getCommand(commandId),
        ]);
        if (
          !committedAggregate ||
          committedAggregate.issuerOrganizationId !== authorization.organization.id ||
          !committedReceipt ||
          committedReceipt.action !== "save-definition" ||
          committedReceipt.requestFingerprint !== requestFingerprint
        ) {
          throw new RfxDraftError(
            "dependency-unavailable",
            "The committed RFx definition is temporarily unavailable.",
          );
        }
        return Object.freeze({
          aggregate: committedAggregate,
          receipt: committedReceipt,
          replayed: true as const,
        });
      }
      return Object.freeze({ aggregate, receipt, replayed: false as const });
    } catch (error) {
      if (error instanceof RfxPersistenceConflictError) {
        throw new RfxDraftError("conflict", error.message);
      }
      throw error;
    }
  }
}
