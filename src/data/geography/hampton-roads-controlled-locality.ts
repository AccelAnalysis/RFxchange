import {
  calculateBoundaryBounds,
  type AuthoritativeGeoJsonGeometry,
} from "../../domain/geography/boundary.ts";
import {
  createGeographyDefinition,
  type GeographyDefinition,
} from "../../domain/geography/model.ts";
import { TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES } from "./tigerweb-2025-hampton-roads-boundaries.ts";

const adjacency: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "us-va-portsmouth": Object.freeze([
    "us-va-norfolk",
    "us-va-suffolk",
    "us-va-chesapeake",
  ]),
  "us-va-norfolk": Object.freeze(["us-va-portsmouth"]),
  "us-va-suffolk": Object.freeze(["us-va-portsmouth"]),
  "us-va-chesapeake": Object.freeze(["us-va-portsmouth"]),
});

export const HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS: readonly GeographyDefinition[] =
  Object.freeze(
    TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES.features.map((feature) => {
      const bounds = calculateBoundaryBounds(
        feature.geometry as AuthoritativeGeoJsonGeometry,
      );
      return createGeographyDefinition({
        id: feature.properties.geographyId,
        countryCode: "US",
        fipsCode: feature.properties.geoid,
        name: feature.properties.baseName,
        type: "independent-city",
        boundary: {
          authority: TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES.provenance.authority,
          dataset: TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES.provenance.dataset,
          vintage: TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES.provenance.vintage,
          sourceFeatureId: feature.properties.geoid,
        },
        releaseState:
          feature.properties.geographyId === "us-va-portsmouth"
            ? "released"
            : "visible-unreleased",
        parentGeographyId: "us-va",
        adjacentGeographyIds: adjacency[feature.properties.geographyId] ?? [],
        bounds,
        defaultCamera: {
          center: {
            longitude: (bounds.west + bounds.east) / 2,
            latitude: (bounds.south + bounds.north) / 2,
          },
          pitchDegrees: 38,
          bearingDegrees: 0,
          paddingPixels: 56,
          maximumZoom: 13,
        },
        now: TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES.provenance.retrievedAt,
      });
    }),
  );

export const PORTSMOUTH_CONTROLLED_LOCALITY = (() => {
  const definition = HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS.find(
    (candidate) => candidate.id === "us-va-portsmouth",
  );
  if (!definition) throw new Error("Portsmouth controlled-locality definition is missing.");
  return definition;
})();
