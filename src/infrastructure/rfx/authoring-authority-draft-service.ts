import { authorizeOrganizationOperation } from "../../application/auth/authorize-organization-operation.ts";
import { geographyId } from "../../domain/geography/model.ts";
import type { AmacsRegistryRecord } from "../../domain/amacs/model.ts";
import { organizationId } from "../../domain/organizations/model.ts";
import type { OrganizationMembershipId } from "../../domain/users/model.ts";
import { Wave4GapGovernedDraftService } from "../../application/rfx/wave4-gap-governed-draft-service.ts";
import {
  RfxDraftError,
  type RfxCommandScope,
  type RfxDefinitionSelectionInput,
  type RfxDraftServiceDependencies,
} from "../../application/rfx/rfx-draft-service.ts";
import {
  loadRfxQuantityDimensionAuthority,
  loadRfxQuantityUnitAuthority,
} from "../amacs/rfx-qualifier-authority.ts";

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function active(record: AmacsRegistryRecord | null): record is AmacsRegistryRecord {
  return Boolean(record && record.status === "active");
}

function expectedFactorTreatment(method: string): string | null {
  if (method === "gate") return "required-condition";
  if (method === "narrative") return "informational-only";
  if (method === "scored" || method === "formula") return "scored-factor";
  return null;
}

function stableCommandId(value: string): string {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) {
    throw new RfxDraftError("invalid", "Command identity is invalid.");
  }
  return normalized;
}

function assertAuthorityInputBounds(input: RfxDefinitionSelectionInput): void {
  if (!Array.isArray(input.requirements) || input.requirements.length > 100) {
    throw new RfxDraftError("invalid", "RFx requirements are invalid.");
  }
  for (const rawRequirement of input.requirements) {
    const requirement = objectValue(rawRequirement);
    if (!requirement) throw new RfxDraftError("invalid", "RFx requirement is invalid.");
    if (!Array.isArray(requirement.qualifiers) || requirement.qualifiers.length > 32) {
      throw new RfxDraftError("invalid", "RFx requirement qualifiers are invalid.");
    }
    for (const rawQualifier of requirement.qualifiers) {
      const qualifier = objectValue(rawQualifier);
      if (!qualifier) throw new RfxDraftError("invalid", "RFx requirement qualifier is invalid.");
      if (
        qualifier.kind === "geography" &&
        (!Array.isArray(qualifier.localityIds) || qualifier.localityIds.length > 16)
      ) {
        throw new RfxDraftError("invalid", "Geography qualifier localities are invalid.");
      }
    }
  }
  const evaluation = objectValue(input.evaluationDefinition);
  if (!evaluation || !Array.isArray(evaluation.factors) || evaluation.factors.length > 50) {
    throw new RfxDraftError("invalid", "Evaluation factors are invalid.");
  }
}

export class AuthoringAuthorityRfxDraftService extends Wave4GapGovernedDraftService {
  constructor(private readonly authorityDependencies: RfxDraftServiceDependencies) {
    super(authorityDependencies);
  }

  private async assertStructuredAuthority(input: RfxDefinitionSelectionInput): Promise<void> {
    if (!Array.isArray(input.requirements)) {
      throw new RfxDraftError("invalid", "RFx requirements are invalid.");
    }
    const [units, dimensions] = await Promise.all([
      loadRfxQuantityUnitAuthority(),
      loadRfxQuantityDimensionAuthority(),
    ]);
    const unitById = new Map(units.map((unit) => [unit.id, unit]));
    const dimensionById = new Map(dimensions.map((dimension) => [dimension.id, dimension]));

    for (const rawRequirement of input.requirements) {
      const requirement = objectValue(rawRequirement)!;
      for (const rawQualifier of requirement.qualifiers as readonly unknown[]) {
        const qualifier = objectValue(rawQualifier)!;
        if (qualifier.kind === "quantity") {
          const unitId = typeof qualifier.unit === "string" ? qualifier.unit.trim() : "";
          const unit = unitById.get(unitId);
          if (!unit) {
            throw new RfxDraftError("invalid", "Quantity qualifier unit is unavailable in pinned AMACS 0.5.0 authority.");
          }
          const propertyId = typeof qualifier.propertyId === "string"
            ? qualifier.propertyId.trim()
            : "";
          const label = typeof qualifier.label === "string" ? qualifier.label.trim() : "";
          const dimension = propertyId
            ? dimensionById.get(propertyId)
            : dimensions.find((candidate) =>
                candidate.label === label && candidate.allowedUnitIds.includes(unitId),
              );
          if (!dimension) {
            throw new RfxDraftError(
              "invalid",
              "Quantity qualifier dimension is unavailable in pinned AMACS 0.5.0 authority.",
            );
          }
          if (
            label !== dimension.label ||
            !dimension.allowedUnitIds.includes(unitId) ||
            unit.unitFamily !== dimension.unitFamily
          ) {
            throw new RfxDraftError(
              "invalid",
              "Quantity qualifier unit is incompatible with its AMACS dimension.",
            );
          }
        }
        if (qualifier.kind === "geography") {
          for (const value of qualifier.localityIds as readonly unknown[]) {
            if (typeof value !== "string") {
              throw new RfxDraftError("invalid", "Geography qualifier locality is invalid.");
            }
            let id;
            try {
              id = geographyId(value);
            } catch {
              throw new RfxDraftError("invalid", "Geography qualifier locality is invalid.");
            }
            const geography = await this.authorityDependencies.geographies.getById(id);
            if (!geography || geography.releaseState !== "released") {
              throw new RfxDraftError("invalid", "Geography qualifier locality is unavailable.");
            }
          }
        }
      }
    }
  }

  private async assertFactorMethodAuthority(input: RfxDefinitionSelectionInput): Promise<void> {
    const evaluation = objectValue(input.evaluationDefinition)!;
    for (const rawFactor of evaluation.factors as readonly unknown[]) {
      const factor = objectValue(rawFactor);
      if (!factor || typeof factor.sourceFactorId !== "string" || !factor.sourceFactorId.trim()) continue;
      const authoritative = await this.authorityDependencies.catalog.getDecisionFactor(factor.sourceFactorId.trim());
      if (!active(authoritative) || typeof authoritative.method !== "string") {
        throw new RfxDraftError("invalid", "Evaluation factor source is unavailable.");
      }
      const expected = expectedFactorTreatment(authoritative.method);
      if (!expected || factor.treatment !== expected) {
        throw new RfxDraftError(
          "invalid",
          `Evaluation factor treatment is incompatible with AMACS ${authoritative.method} method.`,
        );
      }
    }
  }

  override async saveDefinition(
    scope: RfxCommandScope,
    input: Readonly<{
      rfxId: string;
      expectedVersion: number;
      definition: RfxDefinitionSelectionInput;
    }>,
  ) {
    const commandId = stableCommandId(scope.commandId);
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
      this.authorityDependencies.authorization,
    );
    if (!authorization.allowed) {
      throw new RfxDraftError(
        "forbidden",
        `RFx workspace access is unavailable (${authorization.reason}).`,
      );
    }

    // Exact replay must not depend on current AMACS/geography authority. The superclass validates
    // the persisted command fingerprint and returns the authoritative committed aggregate.
    if (await this.authorityDependencies.repository.getCommand(commandId)) {
      return super.saveDefinition(scope, input);
    }

    // Bound attacker-controlled collections before any catalog or Firestore authority fan-out.
    assertAuthorityInputBounds(input.definition);
    await Promise.all([
      this.assertStructuredAuthority(input.definition),
      this.assertFactorMethodAuthority(input.definition),
    ]);
    return super.saveDefinition(scope, input);
  }
}
