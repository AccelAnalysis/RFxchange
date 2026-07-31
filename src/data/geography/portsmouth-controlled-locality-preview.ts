import { ControlledLocalityMapService } from "../../application/geography/controlled-locality-map.ts";
import { accessJourneyId } from "../../domain/lifecycle/model.ts";
import {
  createPrimaryOperatingGeographySelection,
  geographyId,
} from "../../domain/geography/model.ts";
import { userId } from "../../domain/users/model.ts";
import { StaticGeographyDefinitionRepository } from "../../infrastructure/geography/static-geography-definitions.ts";
import { TigerWebBoundarySnapshotRepository } from "../../infrastructure/geography/tigerweb-boundary-snapshot.ts";
import {
  HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS,
  PORTSMOUTH_CONTROLLED_LOCALITY,
} from "./hampton-roads-controlled-locality.ts";
import { TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES } from "./tigerweb-2025-hampton-roads-boundaries.ts";

/**
 * Deterministic local/dev map model for the currently bundled authoritative boundary snapshot.
 *
 * The selected geography is the profile/home-locality focus, not a viewport lock. The production
 * Mapbox renderer may pan/search anywhere while this model continues to identify the home locality
 * whose authoritative boundary receives focus treatment.
 */
export async function createControlledLocalityPreview(
  homeGeographyId: string = PORTSMOUTH_CONTROLLED_LOCALITY.id,
) {
  const definitions = new StaticGeographyDefinitionRepository(
    HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS,
  );
  const selectedId = geographyId(homeGeographyId);
  const supported = await definitions.getById(selectedId);
  if (!supported) {
    throw new Error(`Bundled authoritative boundary snapshot does not include ${selectedId}.`);
  }

  const service = new ControlledLocalityMapService(
    definitions,
    new TigerWebBoundarySnapshotRepository(definitions),
  );
  const selection = createPrimaryOperatingGeographySelection(
    userId("preview-geography-user"),
    accessJourneyId("preview-geography-journey"),
    supported.id,
    TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES.provenance.retrievedAt,
  );
  return service.create(selection);
}

export async function createPortsmouthControlledLocalityPreview() {
  return createControlledLocalityPreview(PORTSMOUTH_CONTROLLED_LOCALITY.id);
}
