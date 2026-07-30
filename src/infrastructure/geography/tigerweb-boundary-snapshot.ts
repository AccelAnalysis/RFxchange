import type { AuthoritativeBoundaryGeometryRepository } from "../../domain/geography/boundary-repository.ts";
import {
  createAuthoritativeBoundaryGeometry,
  type AuthoritativeBoundaryGeometry,
  type AuthoritativeGeoJsonGeometry,
} from "../../domain/geography/boundary.ts";
import type {
  GeographyId,
} from "../../domain/geography/model.ts";
import type { GeographyDefinitionRepository } from "../../domain/geography/repository.ts";
import { TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES } from "../../data/geography/tigerweb-2025-hampton-roads-boundaries.ts";

export class TigerWebBoundarySnapshotRepository
  implements AuthoritativeBoundaryGeometryRepository
{
  private readonly definitions: GeographyDefinitionRepository;

  constructor(definitions: GeographyDefinitionRepository) {
    this.definitions = definitions;
  }

  async getByGeographyId(
    geographyId: GeographyId,
  ): Promise<AuthoritativeBoundaryGeometry | null> {
    const feature = TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES.features.find(
      (candidate) => candidate.properties.geographyId === geographyId,
    );
    if (!feature) return null;
    const definition = await this.definitions.getById(geographyId);
    if (!definition) {
      throw new Error(`Boundary snapshot has no canonical definition for ${geographyId}.`);
    }
    const provenance = TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES.provenance;
    return createAuthoritativeBoundaryGeometry(definition, {
      id: `${geographyId}:${provenance.vintage}:${feature.properties.geometrySha256.slice(0, 16)}`,
      provenance: {
        authority: provenance.authority,
        dataset: provenance.dataset,
        vintage: provenance.vintage,
        sourceFeatureId: feature.properties.geoid,
        sourceLayerUrl: provenance.sourceLayerUrl,
        queryUrl: provenance.queryUrl,
        retrievedAt: provenance.retrievedAt,
        coordinateReferenceSystem: provenance.coordinateReferenceSystem,
        geometryPrecision: provenance.geometryPrecision,
        maxAllowableOffsetDegrees: provenance.maxAllowableOffsetDegrees,
        geometrySha256: feature.properties.geometrySha256,
      },
      geometry: feature.geometry as AuthoritativeGeoJsonGeometry,
    });
  }
}
