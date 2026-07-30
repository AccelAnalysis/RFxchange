import { ControlledLocalityMapService } from "../../application/geography/controlled-locality-map.ts";
import { accessJourneyId } from "../../domain/lifecycle/model.ts";
import { createPrimaryOperatingGeographySelection } from "../../domain/geography/model.ts";
import { userId } from "../../domain/users/model.ts";
import { StaticGeographyDefinitionRepository } from "../../infrastructure/geography/static-geography-definitions.ts";
import { TigerWebBoundarySnapshotRepository } from "../../infrastructure/geography/tigerweb-boundary-snapshot.ts";
import {
  HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS,
  PORTSMOUTH_CONTROLLED_LOCALITY,
} from "./hampton-roads-controlled-locality.ts";
import { TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES } from "./tigerweb-2025-hampton-roads-boundaries.ts";

export async function createPortsmouthControlledLocalityPreview() {
  const definitions = new StaticGeographyDefinitionRepository(
    HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS,
  );
  const service = new ControlledLocalityMapService(
    definitions,
    new TigerWebBoundarySnapshotRepository(definitions),
  );
  const selection = createPrimaryOperatingGeographySelection(
    userId("preview-geography-user"),
    accessJourneyId("preview-geography-journey"),
    PORTSMOUTH_CONTROLLED_LOCALITY.id,
    TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES.provenance.retrievedAt,
  );
  return service.create(selection);
}
