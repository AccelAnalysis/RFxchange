import type {
  AuthoritativeBoundaryGeometry,
  BoundaryGeometryProvenance,
} from "../../domain/geography/boundary.ts";
import type { AuthoritativeBoundaryGeometryRepository } from "../../domain/geography/boundary-repository.ts";
import type {
  GeographyCameraPlan,
  GeographyDefinition,
  PrimaryOperatingGeographySelection,
} from "../../domain/geography/model.ts";
import { resolveGeographyCameraPlan } from "../../domain/geography/model.ts";
import type { GeographyDefinitionRepository } from "../../domain/geography/repository.ts";

export type LocalityLayerId =
  | "surrounding-fill"
  | "selected-fill"
  | "surrounding-outline"
  | "selected-outline-contrast"
  | "selected-outline-accent";

export interface LocalityLayerStyle {
  readonly fill: string;
  readonly fillOpacity: number;
  readonly stroke: string;
  readonly strokeOpacity: number;
  readonly strokeWidth: number;
}

export interface ControlledLocalityFeature {
  readonly geography: GeographyDefinition;
  readonly boundary: AuthoritativeBoundaryGeometry;
  readonly role: "selected" | "surrounding";
}

export interface ControlledLocalityLayer {
  readonly id: LocalityLayerId;
  readonly order: number;
  readonly purpose: "fill" | "outline";
  readonly featureRole: ControlledLocalityFeature["role"];
  readonly style: LocalityLayerStyle;
  readonly features: readonly ControlledLocalityFeature[];
}

export interface ControlledLocalityMapModel {
  readonly selectedGeography: GeographyDefinition;
  readonly camera: GeographyCameraPlan;
  readonly features: readonly ControlledLocalityFeature[];
  readonly layers: readonly ControlledLocalityLayer[];
  readonly attribution: Readonly<{
    readonly label: string;
    readonly sourceLayerUrl: string;
    readonly vintage: string;
    readonly retrievedAt: string;
  }>;
}

export class ControlledLocalityMapError extends Error {
  readonly code:
    | "selected-geography-not-found"
    | "boundary-not-found"
    | "surrounding-geography-not-found"
    | "mixed-boundary-provenance";

  constructor(code: ControlledLocalityMapError["code"], message: string) {
    super(message);
    this.name = "ControlledLocalityMapError";
    this.code = code;
  }
}

export const CONTROLLED_LOCALITY_LAYER_ORDER: readonly LocalityLayerId[] = Object.freeze([
  "surrounding-fill",
  "selected-fill",
  "surrounding-outline",
  "selected-outline-contrast",
  "selected-outline-accent",
]);

/**
 * Provider-neutral semantic layer contract for controlled-map content. Providers may
 * use different numeric layer IDs, but geography, relationships, markers, emphasis,
 * labels, and UI must preserve this deterministic ordering.
 */
export const CONTROLLED_MAP_SEMANTIC_LAYER_ORDER = Object.freeze({
  "surrounding-fill": 10,
  "selected-fill": 20,
  "surrounding-outline": 30,
  "selected-outline-contrast": 40,
  "selected-outline-accent": 50,
  "service-area": 55,
  "locality-label": 60,
  "relationship-path": 65,
  "entity-marker": 70,
  "marker-emphasis": 80,
  "entity-label": 90,
  "map-ui": 100,
} as const);

export const CONTROLLED_LOCALITY_LAYER_STYLES: Readonly<
  Record<LocalityLayerId, LocalityLayerStyle>
> = Object.freeze({
  "surrounding-fill": Object.freeze({
    fill: "#6d737d",
    fillOpacity: 0.24,
    stroke: "none",
    strokeOpacity: 0,
    strokeWidth: 0,
  }),
  "selected-fill": Object.freeze({
    fill: "#5d8b70",
    fillOpacity: 0.9,
    stroke: "none",
    strokeOpacity: 0,
    strokeWidth: 0,
  }),
  "surrounding-outline": Object.freeze({
    fill: "none",
    fillOpacity: 0,
    stroke: "#5d626c",
    strokeOpacity: 0.74,
    strokeWidth: 1.35,
  }),
  "selected-outline-contrast": Object.freeze({
    fill: "none",
    fillOpacity: 0,
    stroke: "#0b0b0d",
    strokeOpacity: 0.92,
    strokeWidth: 6,
  }),
  "selected-outline-accent": Object.freeze({
    fill: "none",
    fillOpacity: 0,
    stroke: "#d6a23a",
    strokeOpacity: 1,
    strokeWidth: 3.25,
  }),
});

function sameSource(
  left: BoundaryGeometryProvenance,
  right: BoundaryGeometryProvenance,
): boolean {
  return (
    left.authority === right.authority &&
    left.dataset === right.dataset &&
    left.vintage === right.vintage &&
    left.sourceLayerUrl === right.sourceLayerUrl &&
    left.coordinateReferenceSystem === right.coordinateReferenceSystem
  );
}

function layer(
  id: LocalityLayerId,
  order: number,
  purpose: ControlledLocalityLayer["purpose"],
  featureRole: ControlledLocalityFeature["role"],
  features: readonly ControlledLocalityFeature[],
): ControlledLocalityLayer {
  return Object.freeze({
    id,
    order,
    purpose,
    featureRole,
    style: CONTROLLED_LOCALITY_LAYER_STYLES[id],
    features: Object.freeze(features.filter((feature) => feature.role === featureRole)),
  });
}

export class ControlledLocalityMapService {
  private readonly definitions: GeographyDefinitionRepository;
  private readonly boundaries: AuthoritativeBoundaryGeometryRepository;

  constructor(
    definitions: GeographyDefinitionRepository,
    boundaries: AuthoritativeBoundaryGeometryRepository,
  ) {
    this.definitions = definitions;
    this.boundaries = boundaries;
  }

  async create(
    selection: PrimaryOperatingGeographySelection,
  ): Promise<ControlledLocalityMapModel> {
    const selectedGeography = await this.definitions.getById(selection.geographyId);
    if (!selectedGeography) {
      throw new ControlledLocalityMapError(
        "selected-geography-not-found",
        "Selected canonical geography was not found.",
      );
    }
    const selectedBoundary = await this.boundaries.getByGeographyId(selectedGeography.id);
    if (!selectedBoundary) {
      throw new ControlledLocalityMapError(
        "boundary-not-found",
        `Authoritative boundary is missing for ${selectedGeography.id}.`,
      );
    }

    const surroundingFeatures = await Promise.all(
      selectedGeography.adjacentGeographyIds.map(async (adjacentGeographyId) => {
        const geography = await this.definitions.getById(adjacentGeographyId);
        if (!geography) {
          throw new ControlledLocalityMapError(
            "surrounding-geography-not-found",
            `Canonical surrounding geography is missing: ${adjacentGeographyId}.`,
          );
        }
        const boundary = await this.boundaries.getByGeographyId(geography.id);
        if (!boundary) {
          throw new ControlledLocalityMapError(
            "boundary-not-found",
            `Authoritative boundary is missing for ${geography.id}.`,
          );
        }
        if (!sameSource(selectedBoundary.provenance, boundary.provenance)) {
          throw new ControlledLocalityMapError(
            "mixed-boundary-provenance",
            "Controlled locality canvas cannot mix incompatible boundary sources or vintages.",
          );
        }
        return Object.freeze({
          geography,
          boundary,
          role: "surrounding" as const,
        });
      }),
    );
    const selectedFeature = Object.freeze({
      geography: selectedGeography,
      boundary: selectedBoundary,
      role: "selected" as const,
    });
    const features = Object.freeze([selectedFeature, ...surroundingFeatures]);
    const layers = Object.freeze([
      layer("surrounding-fill", 10, "fill", "surrounding", features),
      layer("selected-fill", 20, "fill", "selected", features),
      layer("surrounding-outline", 30, "outline", "surrounding", features),
      layer("selected-outline-contrast", 40, "outline", "selected", features),
      layer("selected-outline-accent", 50, "outline", "selected", features),
    ]);

    return Object.freeze({
      selectedGeography,
      camera: resolveGeographyCameraPlan(selectedGeography),
      features,
      layers,
      attribution: Object.freeze({
        label: selectedBoundary.provenance.authority,
        sourceLayerUrl: selectedBoundary.provenance.sourceLayerUrl,
        vintage: selectedBoundary.provenance.vintage,
        retrievedAt: selectedBoundary.provenance.retrievedAt,
      }),
    });
  }
}
