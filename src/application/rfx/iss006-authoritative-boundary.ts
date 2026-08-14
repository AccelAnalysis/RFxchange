import { geographyId } from "../../domain/geography/model.ts";
import type { GeographyDefinitionRepository } from "../../domain/geography/repository.ts";
import type { ConfirmedOrganizationLocationRepository } from "../../domain/organization-location/repository.ts";
import { organizationId } from "../../domain/organizations/model.ts";
import {
  RfxIss006GovernanceError,
  assertRfxIss006StructuredValueAuthority,
} from "../../domain/rfx/iss006-governance.ts";
import type {
  RfxPackageInput,
  RfxPerformanceLocationSelection,
  RfxSinglePerformanceLocationSelection,
} from "../../domain/rfx/model.ts";
import { RfxDraftError } from "./rfx-draft-service.ts";

export interface RfxIss006AuthorityDependencies {
  readonly geographies: GeographyDefinitionRepository;
  readonly locations: ConfirmedOrganizationLocationRepository;
}

function invalid(message: string): never {
  throw new RfxDraftError("invalid", message);
}

async function requireReleasedLocality(
  localityId: string,
  dependencies: RfxIss006AuthorityDependencies,
): Promise<void> {
  let id;
  try {
    id = geographyId(localityId);
  } catch {
    invalid("Performance locality is invalid.");
  }

  const locality = await dependencies.geographies.getById(id);
  if (!locality || String(locality.id) !== String(id)) {
    invalid("Performance locality is unavailable.");
  }
  if (locality.releaseState !== "released") {
    invalid("Performance locality is not eligible for RFx use.");
  }
}

async function requireCurrentOrganizationLocation(
  organizationIdValue: string,
  selection: Exclude<RfxSinglePerformanceLocationSelection, Readonly<{ mode: "locality"; localityId: string }>>,
  dependencies: RfxIss006AuthorityDependencies,
): Promise<void> {
  let issuerOrganizationId;
  try {
    issuerOrganizationId = organizationId(organizationIdValue);
  } catch {
    invalid("RFx organization is invalid.");
  }

  const location = await dependencies.locations.getByOrganizationId(issuerOrganizationId);
  if (
    !location ||
    String(location.organizationId) !== String(issuerOrganizationId) ||
    String(location.id) !== selection.organizationLocationId
  ) {
    invalid("Performance organization location is unavailable.");
  }

  await requireReleasedLocality(String(location.geographyId), dependencies);
}

async function validateSingleLocation(
  organizationIdValue: string,
  selection: RfxSinglePerformanceLocationSelection,
  dependencies: RfxIss006AuthorityDependencies,
): Promise<void> {
  if (selection.mode === "locality") {
    await requireReleasedLocality(selection.localityId, dependencies);
    return;
  }
  await requireCurrentOrganizationLocation(
    organizationIdValue,
    selection,
    dependencies,
  );
}

async function validatePerformanceLocation(
  organizationIdValue: string,
  selection: RfxPerformanceLocationSelection | null,
  dependencies: RfxIss006AuthorityDependencies,
): Promise<void> {
  if (!selection) return;
  if (selection.mode === "multiple") {
    for (const location of selection.locations) {
      await validateSingleLocation(organizationIdValue, location, dependencies);
    }
    return;
  }
  await validateSingleLocation(organizationIdValue, selection, dependencies);
}

/**
 * Authoritative ISS-006 pre-save boundary.
 *
 * This does not replace the canonical RFx package normalizer or the existing
 * organization authorization/version/idempotency transaction. It closes the
 * three Lane 06 gaps before the existing `savePackage` command is allowed to
 * persist anything:
 * - current governed locality must exist and be fully released;
 * - currency must be in the pinned AMACS 0.5.0 currency unit family;
 * - milestone completion may not precede milestone start.
 */
export async function assertRfxIss006AuthoritativeBoundary(
  input: Readonly<{
    organizationId: string;
    package: RfxPackageInput;
  }>,
  dependencies: RfxIss006AuthorityDependencies,
): Promise<void> {
  try {
    assertRfxIss006StructuredValueAuthority(input.package);
    await validatePerformanceLocation(
      input.organizationId,
      input.package.performanceLocation,
      dependencies,
    );
  } catch (error) {
    if (error instanceof RfxDraftError) throw error;
    if (error instanceof RfxIss006GovernanceError) {
      throw new RfxDraftError("invalid", error.message);
    }
    throw new RfxDraftError(
      "dependency-unavailable",
      "RFx package authority could not be revalidated.",
    );
  }
}
