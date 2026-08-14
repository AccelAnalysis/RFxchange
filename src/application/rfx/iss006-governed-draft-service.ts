import { createHash } from "node:crypto";

import {
  authorizeOrganizationOperation,
} from "../auth/authorize-organization-operation.ts";
import { geographyId } from "../../domain/geography/model.ts";
import { organizationId, type OrganizationId } from "../../domain/organizations/model.ts";
import {
  RfxIss006GovernanceError,
  assertRfxIss006StructuredValueAuthority,
} from "../../domain/rfx/iss006-governance.ts";
import {
  rfxId,
  type RfxPackageInput,
  type RfxPerformanceLocationSelection,
  type RfxSinglePerformanceLocationSelection,
} from "../../domain/rfx/model.ts";
import type { OrganizationMembershipId } from "../../domain/users/model.ts";
import {
  RfxDraftError,
  RfxDraftService,
  type RfxCommandScope,
  type RfxDraftServiceDependencies,
} from "./rfx-draft-service.ts";

function stableCommandId(value: string): string {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) {
    throw new RfxDraftError("invalid", "Command identity is invalid.");
  }
  return normalized;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export class RfxIss006GovernedDraftService extends RfxDraftService {
  private readonly iss006Dependencies: RfxDraftServiceDependencies;

  constructor(dependencies: RfxDraftServiceDependencies) {
    super(dependencies);
    this.iss006Dependencies = dependencies;
  }

  private async releasedGeography(value: string) {
    let id;
    try {
      id = geographyId(value);
    } catch {
      throw new RfxDraftError("invalid", "The selected performance locality is invalid.");
    }
    let geography;
    try {
      geography = await this.iss006Dependencies.geographies.getById(id);
    } catch {
      throw new RfxDraftError(
        "dependency-unavailable",
        "Performance locality authority is temporarily unavailable.",
      );
    }
    if (!geography || geography.releaseState !== "released") {
      throw new RfxDraftError(
        "invalid",
        "The selected performance locality is unavailable.",
      );
    }
    return geography;
  }

  private async validateSingleLocation(
    selection: RfxSinglePerformanceLocationSelection,
    issuerOrganizationId: OrganizationId,
  ): Promise<void> {
    if (selection.mode === "locality") {
      await this.releasedGeography(selection.localityId);
      return;
    }
    let location;
    try {
      location = await this.iss006Dependencies.locations.getByOrganizationId(
        issuerOrganizationId,
      );
    } catch {
      throw new RfxDraftError(
        "dependency-unavailable",
        "Organization location authority is temporarily unavailable.",
      );
    }
    if (!location || String(location.id) !== selection.organizationLocationId) {
      throw new RfxDraftError(
        "invalid",
        "The selected organization location is unavailable.",
      );
    }
    await this.releasedGeography(String(location.geographyId));
  }

  private async validatePerformanceLocation(
    selection: RfxPerformanceLocationSelection | null,
    issuerOrganizationId: OrganizationId,
  ): Promise<void> {
    if (selection === null) return;
    if (!selection || typeof selection !== "object" || typeof selection.mode !== "string") {
      throw new RfxDraftError("invalid", "Performance location is invalid.");
    }
    if (selection.mode === "multiple") {
      if (!Array.isArray(selection.locations)) {
        throw new RfxDraftError("invalid", "Multiple performance locations are invalid.");
      }
      for (const item of selection.locations) {
        await this.validateSingleLocation(item, issuerOrganizationId);
      }
      return;
    }
    if (
      ![
        "issuer-primary-location",
        "organization-location",
        "exact-address",
        "locality",
      ].includes(selection.mode)
    ) {
      throw new RfxDraftError("invalid", "Performance location is invalid.");
    }
    await this.validateSingleLocation(selection, issuerOrganizationId);
  }

  override async savePackage(
    scope: RfxCommandScope,
    input: Readonly<{
      rfxId: string;
      expectedVersion: number;
      package: RfxPackageInput;
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
      this.iss006Dependencies.authorization,
    );
    if (!authorization.allowed) {
      throw new RfxDraftError(
        "forbidden",
        `RFx workspace access is unavailable (${authorization.reason}).`,
      );
    }

    const aggregateId = rfxId(input.rfxId);
    const requestFingerprint = fingerprint({
      action: "save-package",
      issuerOrganizationId: authorization.organization.id,
      rfxId: aggregateId,
      expectedVersion: input.expectedVersion,
      package: input.package,
    });

    // Exact replay is deliberately resolved before any current geography/value
    // revalidation. A committed command remains recoverable even when current
    // authority changes after the original successful transaction.
    const existingCommand = await this.iss006Dependencies.repository.getCommand(commandId);
    if (existingCommand) {
      if (
        existingCommand.issuerOrganizationId !== authorization.organization.id ||
        existingCommand.rfxId !== aggregateId ||
        existingCommand.action !== "save-package" ||
        existingCommand.requestFingerprint !== requestFingerprint
      ) {
        throw new RfxDraftError(
          "conflict",
          "Command identity was already used for different RFx intent.",
        );
      }
      const existing = await this.iss006Dependencies.repository.getById(aggregateId);
      if (!existing || existing.issuerOrganizationId !== authorization.organization.id) {
        throw new RfxDraftError(
          "dependency-unavailable",
          "The committed RFx package is temporarily unavailable.",
        );
      }
      return Object.freeze({
        aggregate: existing,
        receipt: existingCommand,
        replayed: true as const,
      });
    }

    try {
      assertRfxIss006StructuredValueAuthority(input.package);
    } catch (error) {
      if (error instanceof RfxIss006GovernanceError) {
        throw new RfxDraftError("invalid", error.message);
      }
      throw error;
    }
    await this.validatePerformanceLocation(
      input.package.performanceLocation,
      authorization.organization.id,
    );

    // The base service retains canonical normalization, interpretation checks,
    // optimistic concurrency, audit/event/receipt creation and reauthorization.
    // Its repository is wrapped so final geography release-state validation is
    // repeated atomically with the package persistence transaction.
    return super.savePackage(scope, input);
  }
}
