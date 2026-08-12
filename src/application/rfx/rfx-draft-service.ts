import { createHash } from "node:crypto";

import { authorizeOrganizationOperation } from "../auth/authorize-organization-operation.ts";
import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import type { AmacsCatalogPort } from "../amacs/catalog.ts";
import { createOrganizationActionAuditEvent } from "../../domain/audit/model.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import type { GeographyDefinitionRepository } from "../../domain/geography/repository.ts";
import type { ConfirmedOrganizationLocationRepository } from "../../domain/organization-location/repository.ts";
import type { AiInterpretationRepository } from "../../domain/ai-interpretation/repository.ts";
import type {
  AmacsCapability,
  AmacsRegistryRecord,
} from "../../domain/amacs/model.ts";
import {
  changeRfxRequestFamily,
  createRfxDraft,
  normalizeRfxPackage,
  normalizeRfxDefinition,
  performanceLocationFromConfirmed,
  performanceLocationFromLocality,
  requestFamilySnapshotFromAmacs,
  RFX_AMACS_RELEASE_VERSION,
  RFX_AMACS_SOURCE_COMMIT,
  rfxId,
  saveRfxPackage,
  saveRfxDefinition,
  type AmacsDefinitionSnapshot,
  type PerformanceLocation,
  type RequestFamilySnapshot,
  type RfxAggregate,
  type RfxCommandReceipt,
  type RfxEvent,
  type RfxPackageInput,
  type RfxDefinitionInput,
  type RfxPerformanceLocationSelection,
  type RfxSinglePerformanceLocationSelection,
} from "../../domain/rfx/model.ts";
import {
  RfxPersistenceConflictError,
  type RfxRepository,
} from "../../domain/rfx/repository.ts";
import type { OrganizationMembershipId } from "../../domain/users/model.ts";
import type { OrganizationOperationAuthorizationDependencies } from "../auth/authorize-organization-operation.ts";

export type RfxDraftErrorCode =
  "invalid" | "forbidden" | "not-found" | "conflict" | "dependency-unavailable";

export class RfxDraftError extends Error {
  readonly code: RfxDraftErrorCode;

  constructor(code: RfxDraftErrorCode, message: string) {
    super(message);
    this.name = "RfxDraftError";
    this.code = code;
  }
}

export interface RfxCommandScope {
  readonly context: AuthenticatedServerContext | null;
  readonly organizationId: string;
  readonly membershipId: string;
  readonly commandId: string;
}

export interface RfxRequestFamilyOption {
  readonly id: string;
  readonly label: string;
  readonly purpose: string;
  readonly lifecycle: readonly string[];
}

export interface RfxDraftServiceDependencies {
  readonly authorization: OrganizationOperationAuthorizationDependencies;
  readonly catalog: AmacsCatalogPort;
  readonly repository: RfxRepository;
  readonly locations: ConfirmedOrganizationLocationRepository;
  readonly geographies: GeographyDefinitionRepository;
  readonly interpretations: Pick<AiInterpretationRepository, "getRecord">;
  readonly now?: () => string;
}

export interface RfxPerformanceLocationOption {
  readonly organizationLocationId: string;
  readonly localityId: string;
  readonly localityLabel: string;
  readonly exactAddressAvailable: boolean;
}

export interface RfxAmacsCatalogOption {
  readonly id: string;
  readonly label: string;
  readonly definition: string;
}

export interface RfxRequirementTypeOption extends RfxAmacsCatalogOption {
  readonly code: string;
  readonly allowedDecisionTreatments: readonly string[];
  readonly teamCoverageAllowed: boolean;
}

export interface RfxResponseSectionOption extends RfxAmacsCatalogOption {
  readonly responseType: string;
  readonly attachmentsAllowed: boolean;
}

export interface RfxResponseTemplateOption extends RfxAmacsCatalogOption {
  readonly sections: readonly RfxResponseSectionOption[];
}

export interface RfxDecisionFactorOption extends RfxAmacsCatalogOption {
  readonly method: string;
}

export interface RfxDecisionTemplateOption extends RfxAmacsCatalogOption {
  readonly weightingRequired: boolean;
  readonly factors: readonly RfxDecisionFactorOption[];
}

export interface RfxCapabilityOption extends RfxAmacsCatalogOption {
  readonly domainLabel: string;
  readonly familyLabel: string;
}

export interface RfxDefinitionCatalog {
  readonly releaseVersion: string;
  readonly domains: readonly Readonly<{
    id: string;
    label: string;
    definition: string;
    families: readonly RfxAmacsCatalogOption[];
  }>[];
  readonly requirementTypes: readonly RfxRequirementTypeOption[];
  readonly responseTemplates: readonly RfxResponseTemplateOption[];
  readonly decisionTemplates: readonly RfxDecisionTemplateOption[];
}

export interface RfxDefinitionSelectionInput {
  readonly requirements: unknown;
  readonly responseStructure: unknown;
  readonly evaluationDefinition: unknown;
  readonly interpretationRecordIds: unknown;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function stable(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) {
    throw new RfxDraftError("invalid", `${label} is invalid.`);
  }
  return normalized;
}

function deterministicId(
  prefix: string,
  commandId: string,
  organizationId: string,
): string {
  return `${prefix}_${createHash("sha256").update(`${organizationId}:${commandId}`).digest("hex").slice(0, 40)}`;
}

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new RfxDraftError("invalid", `${label} is invalid.`);
  return value as Record<string, unknown>;
}

function recordText(
  record: AmacsRegistryRecord,
  key: string,
  label: string,
): string {
  const value = record[key];
  if (typeof value !== "string" || !value.trim())
    throw new RfxDraftError("dependency-unavailable", `${label} is unavailable.`);
  return value.trim();
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
    definitionSnapshot: recordText(
      record,
      input.definitionKey,
      "AMACS record definition",
    ),
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

function active(record: AmacsRegistryRecord | null): record is AmacsRegistryRecord {
  return Boolean(record && record.status === "active");
}

export class RfxDraftService {
  private readonly dependencies: RfxDraftServiceDependencies;
  private readonly now: () => string;

  constructor(dependencies: RfxDraftServiceDependencies) {
    this.dependencies = dependencies;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  private async authorize(scope: Omit<RfxCommandScope, "commandId">) {
    let organizationId: OrganizationId;
    let membershipId: OrganizationMembershipId;
    try {
      organizationId = scope.organizationId as OrganizationId;
      membershipId = scope.membershipId as OrganizationMembershipId;
    } catch {
      throw new RfxDraftError(
        "forbidden",
        "RFx workspace access is unavailable.",
      );
    }
    const decision = await authorizeOrganizationOperation(
      {
        context: scope.context,
        organizationId,
        membershipId,
        permission: "rfx.create",
      },
      this.dependencies.authorization,
    );
    if (!decision.allowed) {
      throw new RfxDraftError(
        "forbidden",
        `RFx workspace access is unavailable (${decision.reason}).`,
      );
    }
    return decision;
  }

  private async familySnapshot(
    requestFamilyId: string,
    selectedAt: string,
  ): Promise<RequestFamilySnapshot> {
    const familyId = stable(requestFamilyId, "Request type");
    try {
      const [release, record] = await Promise.all([
        this.dependencies.catalog.getRelease(),
        this.dependencies.catalog.getRequestFamily(familyId),
      ]);
      if (!record)
        throw new RfxDraftError(
          "invalid",
          "The selected request type is unavailable.",
        );
      return requestFamilySnapshotFromAmacs({ release, record, selectedAt });
    } catch (error) {
      if (error instanceof RfxDraftError) throw error;
      throw new RfxDraftError(
        "invalid",
        error instanceof Error
          ? error.message
          : "The selected request type is unavailable.",
      );
    }
  }

  async requestFamilies(): Promise<readonly RfxRequestFamilyOption[]> {
    const [release, records] = await Promise.all([
      this.dependencies.catalog.getRelease(),
      this.dependencies.catalog.listRequestFamilies(),
    ]);
    if (
      release.version !== RFX_AMACS_RELEASE_VERSION ||
      release.sourceCommit !== RFX_AMACS_SOURCE_COMMIT
    ) {
      throw new RfxDraftError(
        "dependency-unavailable",
        "The governed request-type catalog is unavailable.",
      );
    }
    return Object.freeze(
      records
        .flatMap((record) => {
          if (
            record.status !== "active" ||
            typeof record.request_family_id !== "string" ||
            typeof record.preferred_label !== "string" ||
            typeof record.purpose !== "string" ||
            !Array.isArray(record.lifecycle) ||
            !record.lifecycle.every((item) => typeof item === "string")
          )
            return [];
          return [
            Object.freeze({
              id: record.request_family_id,
              label: record.preferred_label,
              purpose: record.purpose,
              lifecycle: Object.freeze([
                ...record.lifecycle,
              ]) as readonly string[],
            }),
          ];
        })
        .sort((left, right) => left.label.localeCompare(right.label)),
    );
  }

  async definitionCatalog(): Promise<RfxDefinitionCatalog> {
    const [release, domains, requirementRecords, responseRecords, decisionRecords] =
      await Promise.all([
        this.dependencies.catalog.getRelease(),
        this.dependencies.catalog.listDomains(),
        this.dependencies.catalog.listRequirementTypes(),
        this.dependencies.catalog.listResponseTemplates(),
        this.dependencies.catalog.listDecisionTemplates(),
      ]);
    if (
      release.version !== RFX_AMACS_RELEASE_VERSION ||
      release.sourceCommit !== RFX_AMACS_SOURCE_COMMIT
    )
      throw new RfxDraftError(
        "dependency-unavailable",
        "The governed RFx definition catalog is unavailable.",
      );
    const requirementTypes = Object.freeze(
      requirementRecords.flatMap((record) => {
        if (!active(record)) return [];
        const treatments = record.allowed_decision_treatments;
        if (!Array.isArray(treatments) || !treatments.every((item) => typeof item === "string"))
          return [];
        return [
          Object.freeze({
            id: recordText(record, "requirement_type_id", "Requirement type"),
            label: recordText(record, "preferred_label", "Requirement type"),
            definition: recordText(record, "definition", "Requirement type"),
            code: recordText(record, "code", "Requirement type"),
            allowedDecisionTreatments: Object.freeze([...treatments]) as readonly string[],
            teamCoverageAllowed: record.team_coverage_allowed === true,
          }),
        ];
      }),
    );
    const domainOptions = Object.freeze(
      await Promise.all(
        domains
          .filter((domain) => domain.status === "active")
          .map(async (domain) =>
            Object.freeze({
              id: domain.domainId,
              label: domain.preferredLabel,
              definition: domain.definition,
              families: Object.freeze(
                (await this.dependencies.catalog.listFamilies(domain.domainId))
                  .filter((family) => family.status === "active")
                  .map((family) =>
                    Object.freeze({
                      id: family.familyId,
                      label: family.preferredLabel,
                      definition: family.definition,
                    }),
                  ),
              ),
            }),
          ),
      ),
    );
    const responseTemplates = Object.freeze(
      await Promise.all(
        responseRecords.filter(active).map(async (record) => {
          const sectionIds = record.section_ids;
          if (!Array.isArray(sectionIds) || !sectionIds.every((item) => typeof item === "string"))
            throw new RfxDraftError("dependency-unavailable", "A governed response template is malformed.");
          const sections = await Promise.all(
            sectionIds.map(async (id) => {
              const section = await this.dependencies.catalog.getResponseSection(id);
              if (!active(section))
                throw new RfxDraftError("dependency-unavailable", "A governed response section is unavailable.");
              return Object.freeze({
                id,
                label: recordText(section, "preferred_label", "Response section"),
                definition: recordText(section, "purpose", "Response section"),
                responseType: recordText(section, "response_type", "Response section"),
                attachmentsAllowed: section.attachments_allowed === true,
              });
            }),
          );
          return Object.freeze({
            id: recordText(record, "response_template_id", "Response template"),
            label: recordText(record, "preferred_label", "Response template"),
            definition: recordText(record, "description", "Response template"),
            sections: Object.freeze(sections),
          });
        }),
      ),
    );
    const decisionTemplates = Object.freeze(
      await Promise.all(
        decisionRecords.filter(active).map(async (record) => {
          const factorIds = record.factor_ids;
          if (!Array.isArray(factorIds) || !factorIds.every((item) => typeof item === "string"))
            throw new RfxDraftError("dependency-unavailable", "A governed decision template is malformed.");
          const factors = await Promise.all(
            factorIds.map(async (id) => {
              const factor = await this.dependencies.catalog.getDecisionFactor(id);
              if (!active(factor))
                throw new RfxDraftError("dependency-unavailable", "A governed decision factor is unavailable.");
              return Object.freeze({
                id,
                label: recordText(factor, "preferred_label", "Decision factor"),
                definition: recordText(factor, "definition", "Decision factor"),
                method: recordText(factor, "method", "Decision factor"),
              });
            }),
          );
          return Object.freeze({
            id: recordText(record, "decision_template_id", "Decision template"),
            label: recordText(record, "preferred_label", "Decision template"),
            definition: recordText(record, "description", "Decision template"),
            weightingRequired: record.weighting_required === true,
            factors: Object.freeze(factors),
          });
        }),
      ),
    );
    return Object.freeze({
      releaseVersion: release.version,
      domains: domainOptions,
      requirementTypes,
      responseTemplates,
      decisionTemplates,
    });
  }

  async searchCapabilities(
    scope: Omit<RfxCommandScope, "commandId">,
    input: Readonly<{
      query: string;
      domainId?: string | null;
      familyId?: string | null;
    }>,
  ): Promise<readonly RfxCapabilityOption[]> {
    await this.authorize(scope);
    const page = await this.dependencies.catalog.searchCapabilities({
      query: input.query.trim().slice(0, 240),
      domainId: input.domainId ?? null,
      familyId: input.familyId ?? null,
      pageSize: 40,
      page: 1,
    });
    if (
      page.release.version !== RFX_AMACS_RELEASE_VERSION ||
      page.release.sourceCommit !== RFX_AMACS_SOURCE_COMMIT
    )
      throw new RfxDraftError("dependency-unavailable", "Capability search is unavailable.");
    return Object.freeze(
      page.results.map(({ capability }) =>
        Object.freeze({
          id: capability.conceptId,
          label: capability.preferredLabel,
          definition: capability.definition,
          domainLabel: capability.domainLabel,
          familyLabel: capability.familyLabel,
        }),
      ),
    );
  }

  async workspace(scope: Omit<RfxCommandScope, "commandId">) {
    const authorization = await this.authorize(scope);
    const [drafts, requestFamilies, definitionCatalog, confirmedLocation] = await Promise.all([
      this.dependencies.repository.listByIssuerOrganizationId(
        authorization.organization.id,
      ),
      this.requestFamilies(),
      this.definitionCatalog(),
      this.dependencies.locations.getByOrganizationId(
        authorization.organization.id,
      ),
    ]);
    let performanceLocationOption: RfxPerformanceLocationOption | null = null;
    if (confirmedLocation) {
      const geography = await this.dependencies.geographies.getById(
        confirmedLocation.geographyId,
      );
      if (geography && geography.releaseState !== "restricted") {
        performanceLocationOption = Object.freeze({
          organizationLocationId: String(confirmedLocation.id),
          localityId: String(geography.id),
          localityLabel: geography.name,
          exactAddressAvailable: true,
        });
      }
    }
    return Object.freeze({
      drafts,
      requestFamilies,
      definitionCatalog,
      performanceLocationOption,
    });
  }

  private async singlePerformanceLocation(
    selection: RfxSinglePerformanceLocationSelection,
    organizationId: OrganizationId,
  ): Promise<Exclude<PerformanceLocation, { mode: "multiple" }>> {
    if (selection.mode === "locality") {
      const geography = await this.dependencies.geographies.getById(
        selection.localityId as never,
      );
      if (!geography || geography.releaseState === "restricted") {
        throw new RfxDraftError(
          "invalid",
          "The selected performance locality is unavailable.",
        );
      }
      return performanceLocationFromLocality({
        localityId: String(geography.id),
        localityLabel: geography.name,
        bounds: geography.bounds,
      });
    }
    const location =
      await this.dependencies.locations.getByOrganizationId(organizationId);
    if (!location || String(location.id) !== selection.organizationLocationId) {
      throw new RfxDraftError(
        "invalid",
        "The selected organization location is unavailable.",
      );
    }
    const geography = await this.dependencies.geographies.getById(
      location.geographyId,
    );
    if (!geography || geography.releaseState === "restricted") {
      throw new RfxDraftError(
        "invalid",
        "The selected performance locality is unavailable.",
      );
    }
    return performanceLocationFromConfirmed({
      mode: selection.mode,
      organizationLocationId: String(location.id),
      geographyId: String(geography.id),
      coordinate: location.coordinate,
      physicalAddress: location.physicalAddress,
      provenance: location.geocodeProvenance,
    });
  }

  private async performanceLocation(
    selection: RfxPerformanceLocationSelection | null,
    organizationId: OrganizationId,
  ): Promise<PerformanceLocation | null> {
    if (selection === null) return null;
    if (
      !selection ||
      typeof selection !== "object" ||
      typeof selection.mode !== "string"
    ) {
      throw new RfxDraftError("invalid", "Performance location is invalid.");
    }
    if (
      ![
        "issuer-primary-location",
        "organization-location",
        "exact-address",
        "locality",
        "multiple",
      ].includes(selection.mode)
    ) {
      throw new RfxDraftError("invalid", "Performance location is invalid.");
    }
    if (selection.mode !== "multiple")
      return this.singlePerformanceLocation(selection, organizationId);
    if (
      !Array.isArray(selection.locations) ||
      selection.locations.length < 2 ||
      selection.locations.length > 8
    ) {
      throw new RfxDraftError(
        "invalid",
        "Multiple performance locations are invalid.",
      );
    }
    const locations = await Promise.all(
      selection.locations.map((item) =>
        this.singlePerformanceLocation(item, organizationId),
      ),
    );
    return Object.freeze({
      mode: "multiple",
      locations: Object.freeze(locations),
    });
  }

  private async canonicalDefinitionInput(
    input: RfxDefinitionSelectionInput,
  ): Promise<RfxDefinitionInput> {
    if (!Array.isArray(input.requirements) || input.requirements.length > 100)
      throw new RfxDraftError("invalid", "RFx requirements are invalid.");
    const requirements = await Promise.all(
      input.requirements.map(async (item, index) => {
        const source = objectValue(item, `RFx requirement ${index + 1}`);
        const requirementTypeId = stable(
          String(source.requirementTypeId ?? ""),
          `RFx requirement ${index + 1} type`,
        );
        const requirementType =
          await this.dependencies.catalog.getRequirementType(requirementTypeId);
        if (!active(requirementType))
          throw new RfxDraftError(
            "invalid",
            `RFx requirement ${index + 1} type is unavailable.`,
          );
        const requirementTypeCode = recordText(
          requirementType,
          "code",
          "Requirement type",
        );
        const treatments = requirementType.allowed_decision_treatments;
        if (
          !Array.isArray(treatments) ||
          !treatments.every((treatment) => typeof treatment === "string")
        )
          throw new RfxDraftError(
            "dependency-unavailable",
            "A governed requirement type is malformed.",
          );
        const capabilityId =
          typeof source.capabilityId === "string" && source.capabilityId.trim()
            ? stable(source.capabilityId, `RFx requirement ${index + 1} capability`)
            : null;
        const capability = capabilityId
          ? await this.dependencies.catalog.getCapability(capabilityId)
          : null;
        if (capabilityId && (!capability || capability.status !== "active"))
          throw new RfxDraftError(
            "invalid",
            `RFx requirement ${index + 1} capability is unavailable.`,
          );
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
    const responseInput = objectValue(
      input.responseStructure,
      "Response structure",
    );
    const responseTemplateId = stable(
      String(responseInput.responseTemplateId ?? ""),
      "Response template",
    );
    const responseTemplate =
      await this.dependencies.catalog.getResponseTemplate(responseTemplateId);
    if (!active(responseTemplate))
      throw new RfxDraftError("invalid", "The selected response template is unavailable.");
    if (!Array.isArray(responseInput.sections) || responseInput.sections.length > 50)
      throw new RfxDraftError("invalid", "Response sections are invalid.");
    const sections = await Promise.all(
      responseInput.sections.map(async (item, index) => {
        const source = objectValue(item, `Response section ${index + 1}`);
        const sourceSectionId =
          typeof source.sourceSectionId === "string" && source.sourceSectionId.trim()
            ? stable(source.sourceSectionId, `Response section ${index + 1} source`)
            : null;
        const section = sourceSectionId
          ? await this.dependencies.catalog.getResponseSection(sourceSectionId)
          : null;
        if (sourceSectionId && !active(section))
          throw new RfxDraftError(
            "invalid",
            `Response section ${index + 1} source is unavailable.`,
          );
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
    const decisionTemplateId = stable(
      String(evaluationInput.decisionTemplateId ?? ""),
      "Decision template",
    );
    const decisionTemplate =
      await this.dependencies.catalog.getDecisionTemplate(decisionTemplateId);
    if (!active(decisionTemplate))
      throw new RfxDraftError("invalid", "The selected decision template is unavailable.");
    if (!Array.isArray(evaluationInput.factors) || evaluationInput.factors.length > 50)
      throw new RfxDraftError("invalid", "Evaluation factors are invalid.");
    const factors = await Promise.all(
      evaluationInput.factors.map(async (item, index) => {
        const source = objectValue(item, `Evaluation factor ${index + 1}`);
        const sourceFactorId =
          typeof source.sourceFactorId === "string" && source.sourceFactorId.trim()
            ? stable(source.sourceFactorId, `Evaluation factor ${index + 1} source`)
            : null;
        const factor = sourceFactorId
          ? await this.dependencies.catalog.getDecisionFactor(sourceFactorId)
          : null;
        if (sourceFactorId && !active(factor))
          throw new RfxDraftError(
            "invalid",
            `Evaluation factor ${index + 1} source is unavailable.`,
          );
        return Object.freeze({
          ...source,
          sourceFactor: factor
            ? registrySnapshot(factor, {
                kind: "decision-factor",
                idKey: "decision_factor_id",
                definitionKey: "definition",
              })
            : null,
          sourceMethod: factor
            ? recordText(factor, "method", "Decision factor")
            : null,
        });
      }),
    );
    return Object.freeze({
      requirements: Object.freeze(requirements),
      responseStructure: Object.freeze({
        sourceTemplate: registrySnapshot(responseTemplate, {
          kind: "response-template",
          idKey: "response_template_id",
          definitionKey: "description",
        }),
        sections: Object.freeze(sections),
      }),
      evaluationDefinition: Object.freeze({
        sourceTemplate: registrySnapshot(decisionTemplate, {
          kind: "decision-template",
          idKey: "decision_template_id",
          definitionKey: "description",
        }),
        weightingRequired: decisionTemplate.weighting_required === true,
        factors: Object.freeze(factors),
      }),
      interpretationRecordIds: input.interpretationRecordIds,
    });
  }

  async createDraft(
    scope: RfxCommandScope,
    input: Readonly<{ requestFamilyId: string }>,
  ) {
    const commandId = stable(scope.commandId, "Command identity");
    const authorization = await this.authorize(scope);
    const requestFingerprint = fingerprint({
      action: "create-draft",
      issuerOrganizationId: authorization.organization.id,
      requestFamilyId: input.requestFamilyId,
      creationSource: { kind: "blank", schemaVersion: 1 },
    });
    const existingCommand =
      await this.dependencies.repository.getCommand(commandId);
    if (existingCommand) {
      if (
        existingCommand.issuerOrganizationId !==
          authorization.organization.id ||
        existingCommand.action !== "create-draft" ||
        existingCommand.requestFingerprint !== requestFingerprint
      )
        throw new RfxDraftError(
          "conflict",
          "Command identity was already used for different RFx intent.",
        );
      const existing = await this.dependencies.repository.getById(
        existingCommand.rfxId,
      );
      if (
        !existing ||
        existing.issuerOrganizationId !== authorization.organization.id
      ) {
        throw new RfxDraftError(
          "dependency-unavailable",
          "The committed RFx draft is temporarily unavailable.",
        );
      }
      return Object.freeze({
        aggregate: existing,
        receipt: existingCommand,
        replayed: true as const,
      });
    }

    const now = this.now();
    const requestFamily = await this.familySnapshot(input.requestFamilyId, now);
    const aggregate = createRfxDraft({
      id: deterministicId(
        "rfx",
        commandId,
        String(authorization.organization.id),
      ),
      issuerOrganizationId: authorization.organization.id,
      requestFamily,
      actorUserId: authorization.context.user.id,
      actorMembershipId: authorization.membership.id,
      now,
    });
    const event: RfxEvent = Object.freeze({
      id: deterministicId(
        "rfxevent",
        commandId,
        String(authorization.organization.id),
      ),
      rfxId: aggregate.id,
      issuerOrganizationId: aggregate.issuerOrganizationId,
      kind: "rfx-draft-created",
      aggregateVersion: aggregate.version,
      actorUserId: authorization.context.user.id,
      actorMembershipId: authorization.membership.id,
      commandId,
      requestFamily,
      priorRequestFamily: null,
      package: aggregate.package,
      priorPackage: null,
      definition: aggregate.definition,
      priorDefinition: null,
      occurredAt: now,
    });
    const receipt: RfxCommandReceipt = Object.freeze({
      id: commandId,
      issuerOrganizationId: aggregate.issuerOrganizationId,
      rfxId: aggregate.id,
      action: "create-draft",
      requestFingerprint,
      resultingVersion: aggregate.version,
      recordedAt: now,
    });
    try {
      const persistence = await this.dependencies.repository.save({
        aggregate,
        expectedVersion: null,
        event,
        command: receipt,
        audit: createOrganizationActionAuditEvent(
          authorization.context.user,
          authorization.membership,
          authorization.organization,
          {
            id: deterministicId(
              "audit",
              commandId,
              String(authorization.organization.id),
            ),
            action: "rfx.draft-created",
            occurredAt: now,
          },
        ),
      });
      if (persistence === "replayed") {
        const [committedAggregate, committedReceipt] = await Promise.all([
          this.dependencies.repository.getById(aggregate.id),
          this.dependencies.repository.getCommand(commandId),
        ]);
        if (
          !committedAggregate ||
          committedAggregate.issuerOrganizationId !==
            authorization.organization.id ||
          !committedReceipt ||
          committedReceipt.issuerOrganizationId !==
            authorization.organization.id ||
          committedReceipt.rfxId !== aggregate.id ||
          committedReceipt.action !== "create-draft" ||
          committedReceipt.requestFingerprint !== requestFingerprint
        ) {
          throw new RfxDraftError(
            "dependency-unavailable",
            "The committed RFx draft is temporarily unavailable.",
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
      if (error instanceof RfxPersistenceConflictError)
        throw new RfxDraftError("conflict", error.message);
      throw error;
    }
  }

  async changeRequestFamily(
    scope: RfxCommandScope,
    input: Readonly<{
      rfxId: string;
      expectedVersion: number;
      requestFamilyId: string;
    }>,
  ) {
    const commandId = stable(scope.commandId, "Command identity");
    const authorization = await this.authorize(scope);
    const aggregateId = rfxId(input.rfxId);
    const requestFingerprint = fingerprint({
      action: "change-request-family",
      issuerOrganizationId: authorization.organization.id,
      rfxId: aggregateId,
      expectedVersion: input.expectedVersion,
      requestFamilyId: input.requestFamilyId,
    });
    const existingCommand =
      await this.dependencies.repository.getCommand(commandId);
    if (existingCommand) {
      if (
        existingCommand.issuerOrganizationId !==
          authorization.organization.id ||
        existingCommand.rfxId !== aggregateId ||
        existingCommand.action !== "change-request-family" ||
        existingCommand.requestFingerprint !== requestFingerprint
      )
        throw new RfxDraftError(
          "conflict",
          "Command identity was already used for different RFx intent.",
        );
      const existing = await this.dependencies.repository.getById(
        existingCommand.rfxId,
      );
      if (
        !existing ||
        existing.issuerOrganizationId !== authorization.organization.id
      ) {
        throw new RfxDraftError(
          "dependency-unavailable",
          "The committed RFx draft is temporarily unavailable.",
        );
      }
      return Object.freeze({
        aggregate: existing,
        receipt: existingCommand,
        replayed: true as const,
      });
    }

    const current = await this.dependencies.repository.getById(aggregateId);
    if (
      !current ||
      current.issuerOrganizationId !== authorization.organization.id
    ) {
      throw new RfxDraftError(
        "not-found",
        "The requested RFx draft is unavailable.",
      );
    }
    if (
      !Number.isInteger(input.expectedVersion) ||
      input.expectedVersion !== current.version
    ) {
      throw new RfxDraftError(
        "conflict",
        `RFx changed; current version is ${current.version}.`,
      );
    }
    const now = this.now();
    const requestFamily = await this.familySnapshot(input.requestFamilyId, now);
    let aggregate: RfxAggregate;
    try {
      aggregate = changeRfxRequestFamily({
        aggregate: current,
        expectedVersion: input.expectedVersion,
        requestFamily,
        actorUserId: authorization.context.user.id,
        actorMembershipId: authorization.membership.id,
        now,
      });
    } catch (error) {
      throw new RfxDraftError(
        error instanceof Error && /current version/.test(error.message)
          ? "conflict"
          : "invalid",
        error instanceof Error
          ? error.message
          : "The request type change is invalid.",
      );
    }
    const event: RfxEvent = Object.freeze({
      id: deterministicId(
        "rfxevent",
        commandId,
        String(authorization.organization.id),
      ),
      rfxId: aggregate.id,
      issuerOrganizationId: aggregate.issuerOrganizationId,
      kind: "rfx-request-family-changed",
      aggregateVersion: aggregate.version,
      actorUserId: authorization.context.user.id,
      actorMembershipId: authorization.membership.id,
      commandId,
      requestFamily,
      priorRequestFamily: current.requestFamily,
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
      action: "change-request-family",
      requestFingerprint,
      resultingVersion: aggregate.version,
      recordedAt: now,
    });
    try {
      const persistence = await this.dependencies.repository.save({
        aggregate,
        expectedVersion: input.expectedVersion,
        event,
        command: receipt,
        audit: createOrganizationActionAuditEvent(
          authorization.context.user,
          authorization.membership,
          authorization.organization,
          {
            id: deterministicId(
              "audit",
              commandId,
              String(authorization.organization.id),
            ),
            action: "rfx.request-family-changed",
            occurredAt: now,
          },
        ),
      });
      if (persistence === "replayed") {
        const [committedAggregate, committedReceipt] = await Promise.all([
          this.dependencies.repository.getById(aggregate.id),
          this.dependencies.repository.getCommand(commandId),
        ]);
        if (
          !committedAggregate ||
          committedAggregate.issuerOrganizationId !==
            authorization.organization.id ||
          !committedReceipt ||
          committedReceipt.issuerOrganizationId !==
            authorization.organization.id ||
          committedReceipt.rfxId !== aggregate.id ||
          committedReceipt.action !== "change-request-family" ||
          committedReceipt.requestFingerprint !== requestFingerprint
        ) {
          throw new RfxDraftError(
            "dependency-unavailable",
            "The committed RFx draft is temporarily unavailable.",
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
      if (error instanceof RfxPersistenceConflictError)
        throw new RfxDraftError("conflict", error.message);
      throw error;
    }
  }

  async savePackage(
    scope: RfxCommandScope,
    input: Readonly<{
      rfxId: string;
      expectedVersion: number;
      package: RfxPackageInput;
    }>,
  ) {
    const commandId = stable(scope.commandId, "Command identity");
    const authorization = await this.authorize(scope);
    const aggregateId = rfxId(input.rfxId);
    const requestFingerprint = fingerprint({
      action: "save-package",
      issuerOrganizationId: authorization.organization.id,
      rfxId: aggregateId,
      expectedVersion: input.expectedVersion,
      package: input.package,
    });
    const existingCommand =
      await this.dependencies.repository.getCommand(commandId);
    if (existingCommand) {
      if (
        existingCommand.issuerOrganizationId !==
          authorization.organization.id ||
        existingCommand.rfxId !== aggregateId ||
        existingCommand.action !== "save-package" ||
        existingCommand.requestFingerprint !== requestFingerprint
      )
        throw new RfxDraftError(
          "conflict",
          "Command identity was already used for different RFx intent.",
        );
      const existing = await this.dependencies.repository.getById(aggregateId);
      if (
        !existing ||
        existing.issuerOrganizationId !== authorization.organization.id
      )
        throw new RfxDraftError(
          "dependency-unavailable",
          "The committed RFx package is temporarily unavailable.",
        );
      return Object.freeze({
        aggregate: existing,
        receipt: existingCommand,
        replayed: true as const,
      });
    }
    const current = await this.dependencies.repository.getById(aggregateId);
    if (
      !current ||
      current.issuerOrganizationId !== authorization.organization.id
    )
      throw new RfxDraftError(
        "not-found",
        "The requested RFx draft is unavailable.",
      );
    if (
      !Number.isInteger(input.expectedVersion) ||
      input.expectedVersion !== current.version
    )
      throw new RfxDraftError(
        "conflict",
        `RFx changed; current version is ${current.version}.`,
      );
    const now = this.now();
    let packageRecord;
    try {
      const performanceLocation = await this.performanceLocation(
        input.package.performanceLocation,
        authorization.organization.id,
      );
      packageRecord = normalizeRfxPackage({
        ...input.package,
        performanceLocation,
      });
      for (const recordId of packageRecord.marketNeed.interpretationRecordIds) {
        const interpretation =
          await this.dependencies.interpretations.getRecord(recordId);
        if (
          !interpretation ||
          interpretation.organizationId !== authorization.organization.id ||
          interpretation.record.organization_id !==
            authorization.organization.id ||
          interpretation.record.purpose !== "buyer_need_definition" ||
          interpretation.record.subject_ref !== aggregateId ||
          !["partially_confirmed", "confirmed"].includes(
            interpretation.record.record_status,
          )
        ) {
          throw new RfxDraftError(
            "invalid",
            "A reviewed need interpretation reference is unavailable.",
          );
        }
      }
    } catch (error) {
      if (error instanceof RfxDraftError) throw error;
      throw new RfxDraftError(
        "invalid",
        error instanceof Error ? error.message : "The RFx package is invalid.",
      );
    }
    const aggregate = saveRfxPackage({
      aggregate: current,
      expectedVersion: input.expectedVersion,
      package: packageRecord,
      actorUserId: authorization.context.user.id,
      actorMembershipId: authorization.membership.id,
      now,
    });
    const event: RfxEvent = Object.freeze({
      id: deterministicId(
        "rfxevent",
        commandId,
        String(authorization.organization.id),
      ),
      rfxId: aggregate.id,
      issuerOrganizationId: aggregate.issuerOrganizationId,
      kind: "rfx-package-saved",
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
      action: "save-package",
      requestFingerprint,
      resultingVersion: aggregate.version,
      recordedAt: now,
    });
    try {
      const persistence = await this.dependencies.repository.save({
        aggregate,
        expectedVersion: input.expectedVersion,
        event,
        command: receipt,
        audit: createOrganizationActionAuditEvent(
          authorization.context.user,
          authorization.membership,
          authorization.organization,
          {
            id: deterministicId(
              "audit",
              commandId,
              String(authorization.organization.id),
            ),
            action: "rfx.package-saved",
            occurredAt: now,
          },
        ),
      });
      if (persistence === "replayed") {
        const [committedAggregate, committedReceipt] = await Promise.all([
          this.dependencies.repository.getById(aggregate.id),
          this.dependencies.repository.getCommand(commandId),
        ]);
        if (
          !committedAggregate ||
          committedAggregate.issuerOrganizationId !==
            authorization.organization.id ||
          !committedReceipt ||
          committedReceipt.action !== "save-package" ||
          committedReceipt.requestFingerprint !== requestFingerprint
        )
          throw new RfxDraftError(
            "dependency-unavailable",
            "The committed RFx package is temporarily unavailable.",
          );
        return Object.freeze({
          aggregate: committedAggregate,
          receipt: committedReceipt,
          replayed: true as const,
        });
      }
      return Object.freeze({ aggregate, receipt, replayed: false as const });
    } catch (error) {
      if (error instanceof RfxPersistenceConflictError)
        throw new RfxDraftError("conflict", error.message);
      throw error;
    }
  }

  async saveDefinition(
    scope: RfxCommandScope,
    input: Readonly<{
      rfxId: string;
      expectedVersion: number;
      definition: RfxDefinitionSelectionInput;
    }>,
  ) {
    const commandId = stable(scope.commandId, "Command identity");
    const authorization = await this.authorize(scope);
    const aggregateId = rfxId(input.rfxId);
    const requestFingerprint = fingerprint({
      action: "save-definition",
      issuerOrganizationId: authorization.organization.id,
      rfxId: aggregateId,
      expectedVersion: input.expectedVersion,
      definition: input.definition,
    });
    const existingCommand =
      await this.dependencies.repository.getCommand(commandId);
    if (existingCommand) {
      if (
        existingCommand.issuerOrganizationId !== authorization.organization.id ||
        existingCommand.rfxId !== aggregateId ||
        existingCommand.action !== "save-definition" ||
        existingCommand.requestFingerprint !== requestFingerprint
      )
        throw new RfxDraftError(
          "conflict",
          "Command identity was already used for different RFx intent.",
        );
      const existing = await this.dependencies.repository.getById(aggregateId);
      if (!existing || existing.issuerOrganizationId !== authorization.organization.id)
        throw new RfxDraftError(
          "dependency-unavailable",
          "The committed RFx definition is temporarily unavailable.",
        );
      return Object.freeze({
        aggregate: existing,
        receipt: existingCommand,
        replayed: true as const,
      });
    }
    const current = await this.dependencies.repository.getById(aggregateId);
    if (!current || current.issuerOrganizationId !== authorization.organization.id)
      throw new RfxDraftError("not-found", "The requested RFx draft is unavailable.");
    if (
      !Number.isInteger(input.expectedVersion) ||
      input.expectedVersion !== current.version
    )
      throw new RfxDraftError(
        "conflict",
        `RFx changed; current version is ${current.version}.`,
      );
    let definition;
    try {
      const canonical = await this.canonicalDefinitionInput(input.definition);
      definition = normalizeRfxDefinition(
        canonical,
        current.package?.requirements.map((requirement) => requirement.id) ?? [],
      );
      for (const recordId of definition.interpretationRecordIds) {
        const interpretation =
          await this.dependencies.interpretations.getRecord(recordId);
        if (
          !interpretation ||
          interpretation.organizationId !== authorization.organization.id ||
          interpretation.record.organization_id !== authorization.organization.id ||
          interpretation.record.purpose !== "request_structure" ||
          interpretation.record.subject_ref !== aggregateId ||
          !["partially_confirmed", "confirmed"].includes(
            interpretation.record.record_status,
          )
        )
          throw new RfxDraftError(
            "invalid",
            "A reviewed request-structure interpretation reference is unavailable.",
          );
      }
    } catch (error) {
      if (error instanceof RfxDraftError) throw error;
      throw new RfxDraftError(
        "invalid",
        error instanceof Error ? error.message : "The RFx definition is invalid.",
      );
    }
    const now = this.now();
    const aggregate = saveRfxDefinition({
      aggregate: current,
      expectedVersion: input.expectedVersion,
      definition,
      actorUserId: authorization.context.user.id,
      actorMembershipId: authorization.membership.id,
      now,
    });
    const event: RfxEvent = Object.freeze({
      id: deterministicId(
        "rfxevent",
        commandId,
        String(authorization.organization.id),
      ),
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
      const persistence = await this.dependencies.repository.save({
        aggregate,
        expectedVersion: input.expectedVersion,
        event,
        command: receipt,
        audit: createOrganizationActionAuditEvent(
          authorization.context.user,
          authorization.membership,
          authorization.organization,
          {
            id: deterministicId(
              "audit",
              commandId,
              String(authorization.organization.id),
            ),
            action: "rfx.definition-saved",
            occurredAt: now,
          },
        ),
      });
      if (persistence === "replayed") {
        const [committedAggregate, committedReceipt] = await Promise.all([
          this.dependencies.repository.getById(aggregate.id),
          this.dependencies.repository.getCommand(commandId),
        ]);
        if (
          !committedAggregate ||
          committedAggregate.issuerOrganizationId !== authorization.organization.id ||
          !committedReceipt ||
          committedReceipt.action !== "save-definition" ||
          committedReceipt.requestFingerprint !== requestFingerprint
        )
          throw new RfxDraftError(
            "dependency-unavailable",
            "The committed RFx definition is temporarily unavailable.",
          );
        return Object.freeze({
          aggregate: committedAggregate,
          receipt: committedReceipt,
          replayed: true as const,
        });
      }
      return Object.freeze({ aggregate, receipt, replayed: false as const });
    } catch (error) {
      if (error instanceof RfxPersistenceConflictError)
        throw new RfxDraftError("conflict", error.message);
      throw error;
    }
  }
}
