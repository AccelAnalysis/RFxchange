import { createHash } from "node:crypto";

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
import {
  CENSUS_TIGERWEB_ORIGIN,
  CENSUS_TIGERWEB_VINTAGE,
  tigerWebLayerPathForFips,
} from "./census-tiger-locality-directory.ts";

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

interface GeoJsonFeatureCollection {
  readonly features?: readonly Readonly<{
    readonly properties?: Readonly<Record<string, unknown>>;
    readonly geometry?: unknown;
  }>[];
}

function normalizedGeometry(value: unknown): AuthoritativeGeoJsonGeometry {
  if (!value || typeof value !== "object") {
    throw new Error("Census TIGERweb boundary response did not include geometry.");
  }
  const candidate = value as { type?: unknown; coordinates?: unknown };
  if ((candidate.type !== "Polygon" && candidate.type !== "MultiPolygon") || !Array.isArray(candidate.coordinates)) {
    throw new Error("Census TIGERweb boundary response returned unsupported geometry.");
  }
  return candidate as AuthoritativeGeoJsonGeometry;
}

export class TigerWebBoundarySnapshotRepository
  implements AuthoritativeBoundaryGeometryRepository
{
  private readonly definitions: GeographyDefinitionRepository;
  private readonly fetcher: FetchLike;
  private readonly now: () => string;
  private readonly timeoutMs: number;

  constructor(
    definitions: GeographyDefinitionRepository,
    input: Readonly<{ fetcher?: FetchLike; now?: () => string; timeoutMs?: number }> = {},
  ) {
    this.definitions = definitions;
    this.fetcher = input.fetcher ?? fetch;
    this.now = input.now ?? (() => new Date().toISOString());
    this.timeoutMs = input.timeoutMs ?? 8_000;
  }

  private async dynamicBoundary(
    geographyId: GeographyId,
  ): Promise<AuthoritativeBoundaryGeometry | null> {
    const definition = await this.definitions.getById(geographyId);
    if (!definition?.fipsCode) return null;
    const fipsCode = String(definition.fipsCode);
    const layerPath = tigerWebLayerPathForFips(fipsCode);
    if (!layerPath) return null;

    const layerUrl = new URL(layerPath, CENSUS_TIGERWEB_ORIGIN);
    const queryUrl = new URL(`${layerPath}/query`, CENSUS_TIGERWEB_ORIGIN);
    queryUrl.searchParams.set("where", `GEOID='${fipsCode}'`);
    queryUrl.searchParams.set("outFields", "GEOID");
    queryUrl.searchParams.set("returnGeometry", "true");
    queryUrl.searchParams.set("outSR", "4326");
    queryUrl.searchParams.set("f", "geojson");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(queryUrl, {
        method: "GET",
        headers: { accept: "application/geo+json, application/json" },
        redirect: "error",
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Census TIGERweb boundary request returned HTTP ${response.status}.`);
      }
      const body = (await response.json()) as GeoJsonFeatureCollection;
      const feature = body.features?.[0];
      if (!feature || String(feature.properties?.GEOID ?? "") !== fipsCode) return null;
      const geometry = normalizedGeometry(feature.geometry);
      const geometrySha256 = createHash("sha256").update(JSON.stringify(geometry)).digest("hex");
      const retrievedAt = this.now();
      return createAuthoritativeBoundaryGeometry(definition, {
        id: `${geographyId}:${CENSUS_TIGERWEB_VINTAGE}:${geometrySha256.slice(0, 16)}`,
        provenance: {
          authority: definition.boundary.authority,
          dataset: definition.boundary.dataset,
          vintage: definition.boundary.vintage,
          sourceFeatureId: fipsCode,
          sourceLayerUrl: layerUrl.toString(),
          queryUrl: queryUrl.toString(),
          retrievedAt,
          coordinateReferenceSystem: "EPSG:4326",
          geometryPrecision: 6,
          maxAllowableOffsetDegrees: 0,
          geometrySha256,
        },
        geometry,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async getByGeographyId(
    geographyId: GeographyId,
  ): Promise<AuthoritativeBoundaryGeometry | null> {
    const feature = TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES.features.find(
      (candidate) => candidate.properties.geographyId === geographyId,
    );
    if (feature) {
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
    return this.dynamicBoundary(geographyId);
  }
}
