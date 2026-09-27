import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import type { SyntheticOrientationMapOverlay } from "../../application/orientation/synthetic-scenario";
import type {
  ExchangeSpatialGeometry,
  ExchangeSpatialProjectionAdapter,
} from "../../application/participant/lens-map-projection-adapter";
import { beaconImageId } from "./exchange-beacon-images";
import type {
  ExchangeHomeMarker,
  ExchangeOpportunityMarker,
  ExchangeOrganizationMarker,
  ExchangeRelationshipPath,
  ExchangeServiceField,
} from "./exchange-scene-types";
import { workspaceMapPadding } from "./workspaceMapPadding";
export type LocalityGeometry = ExchangeSpatialGeometry;

export type MapSearchResult = Readonly<{
  id: string;
  name: string;
  context: string;
  featureType: string;
  center: readonly [number, number];
  bbox: readonly [number, number, number, number] | null;
}>;

export type MapBasemapPresetId = "exchange" | "street";
export type MapBasemapPreset = Readonly<{
  id: MapBasemapPresetId;
  label: string;
  lightPreset: "day";
  theme: "faded" | "default";
  showTransitLabels: boolean;
  showRoadLabels: boolean;
  showPlaceLabels: boolean;
  showPointOfInterestLabels: boolean;
}>;

export const MAP_BASEMAP_PRESETS: readonly MapBasemapPreset[] = Object.freeze([
  Object.freeze({
    id: "exchange",
    label: "Exchange",
    lightPreset: "day",
    theme: "faded",
    showTransitLabels: false,
    showRoadLabels: false,
    showPlaceLabels: false,
    showPointOfInterestLabels: false,
  }),
  Object.freeze({
    id: "street",
    label: "Street",
    lightPreset: "day",
    theme: "default",
    showTransitLabels: true,
    showRoadLabels: true,
    showPlaceLabels: true,
    showPointOfInterestLabels: true,
  }),
]);

export const LOCALITY_SOURCE_ID = "rfx-spatial-scene-locality";
export const LOCALITY_MASK_SOURCE_ID = "rfx-spatial-scene-locality-mask";
export const LOCALITY_MASK_LAYER_ID = "rfx-spatial-scene-locality-mask-fill";
export const LOCALITY_FILL_LAYER_ID = "rfx-spatial-scene-locality-fill";
export const LOCALITY_OUTLINE_LAYER_ID = "rfx-spatial-scene-locality-outline";
export const NETWORK_MARKER_SOURCE_ID = "rfx-spatial-scene-network-organizations";
export const NETWORK_SELECTED_MARKER_SOURCE_ID = "rfx-spatial-scene-selected-network-organization";
export const NETWORK_CLUSTER_BACK_LAYER_ID = "rfx-spatial-scene-network-cluster-back";
export const NETWORK_CLUSTER_CORE_LAYER_ID = "rfx-spatial-scene-network-cluster-core";
export const NETWORK_CLUSTER_COUNT_LAYER_ID = "rfx-spatial-scene-network-cluster-count";
export const NETWORK_MARKER_HALO_LAYER_ID = "rfx-spatial-scene-network-organization-halo";
export const NETWORK_MARKER_CORE_LAYER_ID = "rfx-spatial-scene-network-organization-core";
export const NETWORK_SELECTED_MARKER_CORE_LAYER_ID = "rfx-spatial-scene-selected-network-organization-core";
export const NETWORK_MARKER_IDENTITY_LAYER_ID = "rfx-spatial-scene-network-organization-identity";
export const NETWORK_MARKER_LABEL_LAYER_ID = "rfx-spatial-scene-network-organization-label";
export const OPPORTUNITY_MARKER_SOURCE_ID = "rfx-spatial-scene-opportunities";
export const OPPORTUNITY_SELECTED_MARKER_SOURCE_ID = "rfx-spatial-scene-selected-opportunity";
export const OPPORTUNITY_CLUSTER_BACK_LAYER_ID = "rfx-spatial-scene-opportunity-cluster-back";
export const OPPORTUNITY_CLUSTER_LAYER_ID = "rfx-spatial-scene-opportunity-cluster";
export const OPPORTUNITY_CLUSTER_COUNT_LAYER_ID = "rfx-spatial-scene-opportunity-cluster-count";
export const OPPORTUNITY_MARKER_LAYER_ID = "rfx-spatial-scene-opportunity-beacon";
export const OPPORTUNITY_SELECTED_HALO_LAYER_ID = "rfx-spatial-scene-selected-opportunity-halo";
export const OPPORTUNITY_SELECTED_MARKER_LAYER_ID = "rfx-spatial-scene-selected-opportunity-beacon";
export const OPPORTUNITY_SELECTED_LABEL_LAYER_ID = "rfx-spatial-scene-selected-opportunity-label";
export const LENS_PROJECTION_SOURCE_ID = "rfx-spatial-scene-lens-projection";
export const LENS_PROJECTION_AREA_FILL_LAYER_ID = "rfx-spatial-scene-lens-area-fill";
export const LENS_PROJECTION_AREA_LINE_LAYER_ID = "rfx-spatial-scene-lens-area-line";
export const LENS_PROJECTION_CLUSTER_BACK_LAYER_ID = "rfx-spatial-scene-lens-cluster-back";
export const LENS_PROJECTION_CLUSTER_LAYER_ID = "rfx-spatial-scene-lens-cluster";
export const LENS_PROJECTION_CLUSTER_COUNT_LAYER_ID = "rfx-spatial-scene-lens-cluster-count";
export const LENS_PROJECTION_OBJECT_LAYER_ID = "rfx-spatial-scene-lens-object";
export const LENS_PROJECTION_SELECTED_HALO_LAYER_ID = "rfx-spatial-scene-lens-selected-halo";
export const LENS_PROJECTION_SELECTED_LABEL_LAYER_ID = "rfx-spatial-scene-lens-selected-label";
export const EMPTY_LENS_PROJECTION_ADAPTER: ExchangeSpatialProjectionAdapter = Object.freeze({
  lens: "opportunities-rfx",
  points: Object.freeze([]),
  areas: Object.freeze([]),
  listOnlyObjects: Object.freeze([]),
  omittedObjects: Object.freeze([]),
  activeLayerIds: Object.freeze([]),
});
export const HOME_MARKER_SOURCE_ID = "rfx-spatial-scene-home-marker";
export const HOME_MARKER_HALO_LAYER_ID = "rfx-spatial-scene-home-marker-halo";
export const HOME_MARKER_CORE_LAYER_ID = "rfx-spatial-scene-home-marker-core";
export const HOME_MARKER_IDENTITY_LAYER_ID = "rfx-spatial-scene-home-marker-identity";
export const HOME_MARKER_LABEL_LAYER_ID = "rfx-spatial-scene-home-marker-label";
export const SEARCH_AREA_SOURCE_ID = "rfx-spatial-scene-search-area";
export const SEARCH_AREA_FILL_LAYER_ID = "rfx-spatial-scene-search-fill";
export const SEARCH_AREA_LINE_LAYER_ID = "rfx-spatial-scene-search-line";
export const TUTORIAL_PATH_SOURCE_ID = "rfx-spatial-scene-tutorial-paths";
export const TUTORIAL_PATH_LAYER_ID = "rfx-spatial-scene-tutorial-paths-line";
export const TUTORIAL_NODE_SOURCE_ID = "rfx-spatial-scene-tutorial-nodes";
export const TUTORIAL_NODE_HALO_LAYER_ID = "rfx-spatial-scene-tutorial-node-halo";
export const TUTORIAL_NODE_CORE_LAYER_ID = "rfx-spatial-scene-tutorial-node-core";
export const TUTORIAL_NODE_GLYPH_LAYER_ID = "rfx-spatial-scene-tutorial-node-glyph";
export const TUTORIAL_NODE_LABEL_LAYER_ID = "rfx-spatial-scene-tutorial-node-label";
export const RELATIONSHIP_PATH_SOURCE_ID = "rfx-spatial-scene-relationship-paths";
export const RELATIONSHIP_PATH_LAYER_ID = "rfx-spatial-scene-relationship-paths-line";
export const SERVICE_FIELD_SOURCE_ID = "rfx-spatial-scene-service-fields";
export const SERVICE_FIELD_FILL_LAYER_ID = "rfx-spatial-scene-service-fields-fill";
export const SERVICE_FIELD_LINE_LAYER_ID = "rfx-spatial-scene-service-fields-line";

export const ORGANIZATION_ORBIT_ZOOM = 16;

export const WEB_MERCATOR_MAX_LATITUDE = 85.05112878;
export const HAMPTON_ROADS_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [-76.515, 36.615],
  [-75.86, 37.085],
];

export const EMPTY_FEATURE_COLLECTION = Object.freeze({
  type: "FeatureCollection" as const,
  features: [] as never[],
});

export function copyRing(ring: readonly (readonly [number, number])[]): number[][] {
  return ring.map(([longitude, latitude]) => [longitude, latitude]);
}

export function copyGeometry(
  geometry: ControlledLocalityMapModel["features"][number]["boundary"]["geometry"],
): LocalityGeometry {
  if (geometry.type === "Polygon") {
    return {
      type: "Polygon",
      coordinates: geometry.coordinates.map(copyRing),
    };
  }
  return {
    type: "MultiPolygon",
    coordinates: geometry.coordinates.map((polygon) => polygon.map(copyRing)),
  };
}

export function createHomeLocalityMask(geometry: LocalityGeometry) {
  const worldRing = [
    [-180, -WEB_MERCATOR_MAX_LATITUDE],
    [180, -WEB_MERCATOR_MAX_LATITUDE],
    [180, WEB_MERCATOR_MAX_LATITUDE],
    [-180, WEB_MERCATOR_MAX_LATITUDE],
    [-180, -WEB_MERCATOR_MAX_LATITUDE],
  ];
  const exteriorRings: number[][][] = [];
  const interiorPolygons: number[][][][] = [];
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

  for (const polygon of polygons) {
    if (polygon[0]) exteriorRings.push(polygon[0].map((point) => [...point]));
    for (const interiorRing of polygon.slice(1)) {
      interiorPolygons.push([interiorRing.map((point) => [...point])]);
    }
  }

  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: { purpose: "home-locality-mask" },
        geometry: {
          type: "MultiPolygon" as const,
          coordinates: [[worldRing, ...exteriorRings], ...interiorPolygons],
        },
      },
    ],
  };
}

export function localityBounds(model: ControlledLocalityMapModel): mapboxgl.LngLatBoundsLike {
  const bounds = model.selectedGeography.bounds;
  return [
    [bounds.west, bounds.south],
    [bounds.east, bounds.north],
  ];
}

export function localityGeoJson(model: ControlledLocalityMapModel) {
  const selected = model.features.find((feature) => feature.role === "selected");
  if (!selected) return EMPTY_FEATURE_COLLECTION;
  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {
          geographyId: String(selected.geography.id),
          name: selected.geography.name,
          releaseState: selected.geography.releaseState,
        },
        geometry: copyGeometry(selected.boundary.geometry),
      },
    ],
  };
}

export function localityMaskGeoJson(model: ControlledLocalityMapModel) {
  const selected = model.features.find((feature) => feature.role === "selected");
  return selected ? createHomeLocalityMask(copyGeometry(selected.boundary.geometry)) : EMPTY_FEATURE_COLLECTION;
}

export function markerGeoJson(marker?: ExchangeHomeMarker | null) {
  if (!marker) return EMPTY_FEATURE_COLLECTION;
  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {
          id: marker.id,
          label: marker.label,
          identity: organizationInitials(marker.label),
          accessibleLocationLabel: marker.accessibleLocationLabel ?? "RFxchange organization marker",
          precision: marker.precision ?? "exact",
          beaconImage: beaconImageId("own", marker.precision === "approximate" ? "approximate" : "default"),
        },
        geometry: {
          type: "Point" as const,
          coordinates: [marker.coordinate[0], marker.coordinate[1]],
        },
      },
    ],
  };
}

export function organizationMarkerGeoJson(
  markers: readonly ExchangeOrganizationMarker[],
  focusedMarkerId: string | null,
) {
  return {
    type: "FeatureCollection" as const,
    features: markers.map((marker) => ({
      type: "Feature" as const,
      properties: {
        id: marker.id,
        label: marker.label,
        identity: organizationInitials(marker.label),
        selected: marker.id === focusedMarkerId ? 1 : 0,
        precision: marker.precision ?? "exact",
        beaconImage: beaconImageId(
          "organization",
          marker.id === focusedMarkerId
            ? marker.precision === "approximate"
              ? "selected-approximate"
              : "selected"
            : marker.precision === "approximate"
              ? "approximate"
              : "default",
        ),
      },
      geometry: {
        type: "Point" as const,
        coordinates: [marker.coordinate[0], marker.coordinate[1]],
      },
    })),
  };
}

export function opportunityMarkerGeoJson(
  markers: readonly ExchangeOpportunityMarker[],
  focusedMarkerId: string | null,
) {
  return {
    type: "FeatureCollection" as const,
    features: markers.map((marker) => ({
      type: "Feature" as const,
      properties: {
        id: marker.id,
        label: marker.label,
        selected: marker.id === focusedMarkerId ? 1 : 0,
        precision: marker.precision ?? "exact",
        beaconImage: beaconImageId(
          "opportunities-rfx",
          marker.id === focusedMarkerId
            ? marker.precision === "approximate"
              ? "selected-approximate"
              : "selected"
            : marker.precision === "approximate"
              ? "approximate"
              : "default",
        ),
      },
      geometry: {
        type: "Point" as const,
        coordinates: [marker.coordinate[0], marker.coordinate[1]],
      },
    })),
  };
}

export function relationshipPathGeoJson(paths: readonly ExchangeRelationshipPath[]) {
  return {
    type: "FeatureCollection" as const,
    features: paths.map((path) => ({
      type: "Feature" as const,
      properties: { id: path.id, label: path.label, status: path.status },
      geometry: { type: "LineString" as const, coordinates: [[...path.from], [...path.to]] },
    })),
  };
}

export function serviceFieldGeoJson(fields: readonly ExchangeServiceField[]) {
  return {
    type: "FeatureCollection" as const,
    features: fields.map((field) => ({
      type: "Feature" as const,
      properties: { id: field.id, label: field.label, selected: field.selected === true },
      geometry: field.geometry,
    })),
  };
}

export function organizationInitials(label: string): string {
  return (
    label
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toLocaleUpperCase("en-US"))
      .join("") || "•"
  );
}

export function tutorialNodeGeoJson(overlay?: SyntheticOrientationMapOverlay | null) {
  if (!overlay) return EMPTY_FEATURE_COLLECTION;
  return {
    type: "FeatureCollection" as const,
    features: overlay.nodes.map((node) => ({
      type: "Feature" as const,
      properties: {
        id: node.id,
        label: node.label,
        role: node.role,
        glyph: node.role === "opportunity" ? "!" : node.role === "issuer" ? "I" : node.role === "responder" ? "R" : "T",
        provenance: node.provenance,
      },
      geometry: { type: "Point" as const, coordinates: [node.coordinate[0], node.coordinate[1]] },
    })),
  };
}

export function tutorialPathGeoJson(overlay?: SyntheticOrientationMapOverlay | null) {
  if (!overlay) return EMPTY_FEATURE_COLLECTION;
  return {
    type: "FeatureCollection" as const,
    features: overlay.paths.map((path) => ({
      type: "Feature" as const,
      properties: { id: path.id, kind: path.kind, stage: overlay.stage, provenance: path.provenance },
      geometry: {
        type: "LineString" as const,
        coordinates: path.coordinates.map(([longitude, latitude]) => [longitude, latitude]),
      },
    })),
  };
}

export function validCoordinatePair(value: unknown): readonly [number, number] | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const longitude = value[0];
  const latitude = value[1];
  if (
    typeof longitude !== "number" ||
    typeof latitude !== "number" ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    return null;
  }
  return [longitude, latitude] as const;
}

export function validBbox(value: unknown): readonly [number, number, number, number] | null {
  if (!Array.isArray(value) || value.length !== 4) return null;
  if (value.some((coordinate) => typeof coordinate !== "number" || !Number.isFinite(coordinate))) {
    return null;
  }
  const [west, south, east, north] = value as number[];
  if (west >= east || south >= north || west < -180 || east > 180 || south < -90 || north > 90) {
    return null;
  }
  return [west, south, east, north] as const;
}

export function parseMapboxSearchResults(payload: unknown): readonly MapSearchResult[] {
  if (!payload || typeof payload !== "object" || !("features" in payload)) return [];
  const features = (payload as { readonly features?: unknown }).features;
  if (!Array.isArray(features)) return [];

  return Object.freeze(
    features.flatMap((feature, index) => {
      if (!feature || typeof feature !== "object") return [];
      const geometry = "geometry" in feature ? (feature as { geometry?: unknown }).geometry : null;
      const properties = "properties" in feature ? (feature as { properties?: unknown }).properties : null;
      if (!geometry || typeof geometry !== "object" || !properties || typeof properties !== "object") {
        return [];
      }
      const propertyMap = properties as Readonly<Record<string, unknown>>;
      const coordinates = validCoordinatePair(
        "coordinates" in geometry ? (geometry as { coordinates?: unknown }).coordinates : null,
      );
      if (!coordinates) return [];
      const name = typeof propertyMap.name === "string" ? propertyMap.name.trim() : "";
      if (!name) return [];
      const id =
        typeof propertyMap.mapbox_id === "string" && propertyMap.mapbox_id.trim()
          ? propertyMap.mapbox_id.trim()
          : `mapbox-search-${index}-${coordinates[0]}-${coordinates[1]}`;
      const fullAddress = typeof propertyMap.full_address === "string" ? propertyMap.full_address.trim() : "";
      const placeFormatted = typeof propertyMap.place_formatted === "string" ? propertyMap.place_formatted.trim() : "";
      const featureType = typeof propertyMap.feature_type === "string" ? propertyMap.feature_type.trim() : "place";
      return [
        Object.freeze({
          id,
          name,
          context: fullAddress || placeFormatted,
          featureType,
          center: coordinates,
          bbox: validBbox(propertyMap.bbox),
        }),
      ];
    }),
  );
}

export function bboxFeatureCollection(bbox: MapSearchResult["bbox"]) {
  if (!bbox) return EMPTY_FEATURE_COLLECTION;
  const [west, south, east, north] = bbox;
  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: { purpose: "search-result-extent" },
        geometry: {
          type: "Polygon" as const,
          coordinates: [
            [
              [west, south],
              [east, south],
              [east, north],
              [west, north],
              [west, south],
            ],
          ],
        },
      },
    ],
  };
}

export function searchZoom(featureType: string): number {
  switch (featureType) {
    case "address":
    case "poi":
      return 17;
    case "street":
    case "neighborhood":
      return 15;
    case "locality":
    case "place":
    case "city":
      return 12;
    case "district":
      return 10;
    case "region":
      return 7;
    case "country":
      return 4;
    default:
      return 13;
  }
}

export function cameraPadding(
  activationOverlay: boolean,
  workspaceOverlay: "left" | "right" | null,
  adaptiveWorkspace = false,
) {
  return workspaceMapPadding(
    workspaceOverlay ?? (activationOverlay ? "left" : null),
    {
      width: typeof window === "undefined" ? 1280 : window.innerWidth,
      height: typeof window === "undefined" ? 800 : window.innerHeight,
    },
    adaptiveWorkspace,
  );
}

export function renderedMapPadding(map: mapboxgl.Map) {
  const padding = map.getPadding();
  return {
    top: padding.top ?? 0,
    right: padding.right ?? 0,
    bottom: padding.bottom ?? 0,
    left: padding.left ?? 0,
  };
}

// Spatial pages publish their projection; the root shell owns the single renderer.
// Embedded onboarding/account previews render in their own bounded container.
