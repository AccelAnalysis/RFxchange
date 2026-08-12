"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import mapboxgl from "mapbox-gl";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import {
  PARTICIPANT_MAP_VIEW_OPTIONS,
  mapViewModeForPitch,
  type MapViewMode,
  type ParticipantMapCamera,
} from "../../application/geography/map-view";
import type { SyntheticOrientationMapOverlay } from "../../application/orientation/synthetic-scenario";
import {
  MAP_ROTATION_PREFERENCE_EVENT,
  readMapRotationPreference,
} from "./map-motion-preference";

import styles from "./ExchangeSpatialScene.module.css";

export type ExchangeSpatialSceneMode = "regional" | "locality" | "organization";
export type ExchangeContinuousMotion = "instructional" | "milestone";

export interface ExchangeHomeMarker {
  readonly id: string;
  readonly coordinate: readonly [longitude: number, latitude: number];
  readonly label: string;
  readonly accessibleLocationLabel?: string;
}

export type ExchangeOrganizationMarker = ExchangeHomeMarker;

export type ExchangeSpatialGeometry =
  | { readonly type: "Polygon"; readonly coordinates: number[][][] }
  | { readonly type: "MultiPolygon"; readonly coordinates: number[][][][] };

export interface ExchangeRelationshipPath {
  readonly id: string;
  readonly from: readonly [number, number];
  readonly to: readonly [number, number];
  readonly label: string;
  readonly status: "sent" | "accepted" | "contacted" | "closed";
}

export interface ExchangeServiceField {
  readonly id: string;
  readonly label: string;
  readonly geometry: ExchangeSpatialGeometry;
  readonly selected?: boolean;
}

export interface ExchangeSpatialSceneProps {
  readonly model: ControlledLocalityMapModel;
  readonly mode: ExchangeSpatialSceneMode;
  readonly marker?: ExchangeHomeMarker | null;
  readonly organizationMarkers?: readonly ExchangeOrganizationMarker[];
  readonly relationshipPaths?: readonly ExchangeRelationshipPath[];
  readonly serviceFields?: readonly ExchangeServiceField[];
  readonly focusedMarkerId?: string | null;
  readonly onOrganizationMarkerSelect?: (markerId: string) => void;
  readonly initialCamera?: ParticipantMapCamera | null;
  readonly onCameraChange?: (camera: ParticipantMapCamera) => void;
  readonly interactive?: boolean;
  readonly activationOverlay?: boolean;
  readonly workspaceOverlay?: "left" | "right" | null;
  readonly showSearch?: boolean;
  readonly tutorialOverlay?: SyntheticOrientationMapOverlay | null;
  readonly continuousMotion?: ExchangeContinuousMotion | null;
  readonly className?: string;
}

type LocalityGeometry = ExchangeSpatialGeometry;

type MapSearchResult = Readonly<{
  id: string;
  name: string;
  context: string;
  featureType: string;
  center: readonly [number, number];
  bbox: readonly [number, number, number, number] | null;
}>;

const LOCALITY_SOURCE_ID = "rfx-spatial-scene-locality";
const LOCALITY_MASK_SOURCE_ID = "rfx-spatial-scene-locality-mask";
const LOCALITY_MASK_LAYER_ID = "rfx-spatial-scene-locality-mask-fill";
const LOCALITY_FILL_LAYER_ID = "rfx-spatial-scene-locality-fill";
const LOCALITY_OUTLINE_CONTRAST_LAYER_ID = "rfx-spatial-scene-locality-outline-contrast";
const LOCALITY_OUTLINE_LAYER_ID = "rfx-spatial-scene-locality-outline";
const NETWORK_MARKER_SOURCE_ID = "rfx-spatial-scene-network-organizations";
const NETWORK_SELECTED_MARKER_SOURCE_ID = "rfx-spatial-scene-selected-network-organization";
const NETWORK_CLUSTER_CORE_LAYER_ID = "rfx-spatial-scene-network-cluster-core";
const NETWORK_CLUSTER_COUNT_LAYER_ID = "rfx-spatial-scene-network-cluster-count";
const NETWORK_MARKER_HALO_LAYER_ID = "rfx-spatial-scene-network-organization-halo";
const NETWORK_MARKER_CORE_LAYER_ID = "rfx-spatial-scene-network-organization-core";
const NETWORK_SELECTED_MARKER_CORE_LAYER_ID = "rfx-spatial-scene-selected-network-organization-core";
const NETWORK_MARKER_IDENTITY_LAYER_ID = "rfx-spatial-scene-network-organization-identity";
const NETWORK_MARKER_LABEL_LAYER_ID = "rfx-spatial-scene-network-organization-label";
const HOME_MARKER_SOURCE_ID = "rfx-spatial-scene-home-marker";
const HOME_MARKER_HALO_LAYER_ID = "rfx-spatial-scene-home-marker-halo";
const HOME_MARKER_CORE_LAYER_ID = "rfx-spatial-scene-home-marker-core";
const HOME_MARKER_IDENTITY_LAYER_ID = "rfx-spatial-scene-home-marker-identity";
const HOME_MARKER_LABEL_LAYER_ID = "rfx-spatial-scene-home-marker-label";
const SEARCH_AREA_SOURCE_ID = "rfx-spatial-scene-search-area";
const SEARCH_AREA_FILL_LAYER_ID = "rfx-spatial-scene-search-fill";
const SEARCH_AREA_LINE_LAYER_ID = "rfx-spatial-scene-search-line";
const TUTORIAL_PATH_SOURCE_ID = "rfx-spatial-scene-tutorial-paths";
const TUTORIAL_PATH_LAYER_ID = "rfx-spatial-scene-tutorial-paths-line";
const TUTORIAL_NODE_SOURCE_ID = "rfx-spatial-scene-tutorial-nodes";
const TUTORIAL_NODE_HALO_LAYER_ID = "rfx-spatial-scene-tutorial-node-halo";
const TUTORIAL_NODE_CORE_LAYER_ID = "rfx-spatial-scene-tutorial-node-core";
const TUTORIAL_NODE_GLYPH_LAYER_ID = "rfx-spatial-scene-tutorial-node-glyph";
const TUTORIAL_NODE_LABEL_LAYER_ID = "rfx-spatial-scene-tutorial-node-label";
const RELATIONSHIP_PATH_SOURCE_ID = "rfx-spatial-scene-relationship-paths";
const RELATIONSHIP_PATH_LAYER_ID = "rfx-spatial-scene-relationship-paths-line";
const SERVICE_FIELD_SOURCE_ID = "rfx-spatial-scene-service-fields";
const SERVICE_FIELD_FILL_LAYER_ID = "rfx-spatial-scene-service-fields-fill";
const SERVICE_FIELD_LINE_LAYER_ID = "rfx-spatial-scene-service-fields-line";

export const EXCHANGE_ORBIT_PERIOD_MS = 225_000;
export const LOCALITY_ORBIT_PITCH = 60;
export const ORGANIZATION_ORBIT_PITCH = 75;
export const ORGANIZATION_ORBIT_ZOOM = 16;

const WEB_MERCATOR_MAX_LATITUDE = 85.05112878;
const HAMPTON_ROADS_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [-76.515, 36.615],
  [-75.86, 37.085],
];

const EMPTY_FEATURE_COLLECTION = Object.freeze({
  type: "FeatureCollection" as const,
  features: [] as never[],
});

function copyRing(ring: readonly (readonly [number, number])[]): number[][] {
  return ring.map(([longitude, latitude]) => [longitude, latitude]);
}

function copyGeometry(
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

function createHomeLocalityMask(geometry: LocalityGeometry) {
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
          coordinates: [
            [worldRing, ...exteriorRings],
            ...interiorPolygons,
          ],
        },
      },
    ],
  };
}

function localityBounds(model: ControlledLocalityMapModel): mapboxgl.LngLatBoundsLike {
  const bounds = model.selectedGeography.bounds;
  return [
    [bounds.west, bounds.south],
    [bounds.east, bounds.north],
  ];
}

function localityGeoJson(model: ControlledLocalityMapModel) {
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

function localityMaskGeoJson(model: ControlledLocalityMapModel) {
  const selected = model.features.find((feature) => feature.role === "selected");
  return selected
    ? createHomeLocalityMask(copyGeometry(selected.boundary.geometry))
    : EMPTY_FEATURE_COLLECTION;
}

function markerGeoJson(marker?: ExchangeHomeMarker | null) {
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
        },
        geometry: {
          type: "Point" as const,
          coordinates: [marker.coordinate[0], marker.coordinate[1]],
        },
      },
    ],
  };
}

function organizationMarkerGeoJson(
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
      },
      geometry: {
        type: "Point" as const,
        coordinates: [marker.coordinate[0], marker.coordinate[1]],
      },
    })),
  };
}

function relationshipPathGeoJson(paths: readonly ExchangeRelationshipPath[]) {
  return {
    type: "FeatureCollection" as const,
    features: paths.map((path) => ({
      type: "Feature" as const,
      properties: { id: path.id, label: path.label, status: path.status },
      geometry: { type: "LineString" as const, coordinates: [[...path.from], [...path.to]] },
    })),
  };
}

function serviceFieldGeoJson(fields: readonly ExchangeServiceField[]) {
  return {
    type: "FeatureCollection" as const,
    features: fields.map((field) => ({
      type: "Feature" as const,
      properties: { id: field.id, label: field.label, selected: field.selected === true },
      geometry: field.geometry,
    })),
  };
}

function organizationInitials(label: string): string {
  return label
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase("en-US"))
    .join("") || "•";
}

function tutorialNodeGeoJson(overlay?: SyntheticOrientationMapOverlay | null) {
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

function tutorialPathGeoJson(overlay?: SyntheticOrientationMapOverlay | null) {
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

function validCoordinatePair(value: unknown): readonly [number, number] | null {
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

function validBbox(value: unknown): readonly [number, number, number, number] | null {
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

function parseMapboxSearchResults(payload: unknown): readonly MapSearchResult[] {
  if (!payload || typeof payload !== "object" || !("features" in payload)) return [];
  const features = (payload as { readonly features?: unknown }).features;
  if (!Array.isArray(features)) return [];

  return Object.freeze(
    features.flatMap((feature, index) => {
      if (!feature || typeof feature !== "object") return [];
      const geometry = "geometry" in feature ? (feature as { geometry?: unknown }).geometry : null;
      const properties = "properties" in feature
        ? (feature as { properties?: unknown }).properties
        : null;
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
      const id = typeof propertyMap.mapbox_id === "string" && propertyMap.mapbox_id.trim()
        ? propertyMap.mapbox_id.trim()
        : `mapbox-search-${index}-${coordinates[0]}-${coordinates[1]}`;
      const fullAddress = typeof propertyMap.full_address === "string"
        ? propertyMap.full_address.trim()
        : "";
      const placeFormatted = typeof propertyMap.place_formatted === "string"
        ? propertyMap.place_formatted.trim()
        : "";
      const featureType = typeof propertyMap.feature_type === "string"
        ? propertyMap.feature_type.trim()
        : "place";
      return [Object.freeze({
        id,
        name,
        context: fullAddress || placeFormatted,
        featureType,
        center: coordinates,
        bbox: validBbox(propertyMap.bbox),
      })];
    }),
  );
}

function bboxFeatureCollection(bbox: MapSearchResult["bbox"]) {
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
          coordinates: [[
            [west, south],
            [east, south],
            [east, north],
            [west, north],
            [west, south],
          ]],
        },
      },
    ],
  };
}

function searchZoom(featureType: string): number {
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

function cameraPadding(activationOverlay: boolean, workspaceOverlay: "left" | "right" | null) {
  const overlay = workspaceOverlay ?? (activationOverlay ? "left" : null);
  if (!overlay) {
    return { top: 84, right: 36, bottom: 36, left: 36 };
  }
  if (typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches) {
    return { top: 72, right: 22, bottom: Math.min(window.innerHeight * 0.58, 520), left: 22 };
  }
  const panelSpace = Math.min(window.innerWidth * 0.48, 620);
  return overlay === "left"
    ? { top: 88, right: 72, bottom: 62, left: panelSpace }
    : { top: 88, right: panelSpace, bottom: 62, left: 72 };
}

function renderedMapPadding(map: mapboxgl.Map) {
  const padding = map.getPadding();
  return {
    top: padding.top ?? 0,
    right: padding.right ?? 0,
    bottom: padding.bottom ?? 0,
    left: padding.left ?? 0,
  };
}

export function ExchangeSpatialScene({
  model,
  mode,
  marker = null,
  organizationMarkers = [],
  relationshipPaths = [],
  serviceFields = [],
  focusedMarkerId = null,
  onOrganizationMarkerSelect,
  initialCamera = null,
  onCameraChange,
  interactive = false,
  activationOverlay = false,
  workspaceOverlay = null,
  showSearch = interactive,
  tutorialOverlay = null,
  continuousMotion = null,
  className,
}: ExchangeSpatialSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const paddingRepairFrameRef = useRef<number | null>(null);
  const orbitStartRef = useRef(0);
  const orbitBearingRef = useRef(0);
  const orbitTargetRef = useRef<readonly [number, number] | null>(null);
  const mapLoadedRef = useRef(false);
  const sceneInitializationStartedRef = useRef(false);
  const manuallyPausedRef = useRef(false);
  const rotationEnabledRef = useRef(true);
  const reducedMotionRef = useRef(false);
  const modeRef = useRef(mode);
  const modelRef = useRef(model);
  const markerRef = useRef(marker);
  const onOrganizationMarkerSelectRef = useRef(onOrganizationMarkerSelect);
  const initialCameraRef = useRef(initialCamera);
  const onCameraChangeRef = useRef(onCameraChange);
  const activationOverlayRef = useRef(activationOverlay);
  const continuousMotionRef = useRef(continuousMotion);
  const workspaceOverlayRef = useRef(workspaceOverlay);
  const appliedOverlayRef = useRef({ activationOverlay, workspaceOverlay });
  const homeGeoJsonRef = useRef(localityGeoJson(model));
  const homeMaskGeoJsonRef = useRef(localityMaskGeoJson(model));
  const homeMarkerGeoJsonRef = useRef(markerGeoJson(marker));
  const networkMarkerGeoJsonRef = useRef(organizationMarkerGeoJson(
    organizationMarkers.filter((candidate) => candidate.id !== focusedMarkerId),
    null,
  ));
  const selectedNetworkMarkerGeoJsonRef = useRef(organizationMarkerGeoJson(
    organizationMarkers.filter((candidate) => candidate.id === focusedMarkerId),
    focusedMarkerId,
  ));
  const relationshipPathGeoJsonRef = useRef(relationshipPathGeoJson(relationshipPaths));
  const serviceFieldGeoJsonRef = useRef(serviceFieldGeoJson(serviceFields));
  const tutorialNodeGeoJsonRef = useRef(tutorialNodeGeoJson(tutorialOverlay));
  const tutorialPathGeoJsonRef = useRef(tutorialPathGeoJson(tutorialOverlay));
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const [viewMode, setViewMode] = useState<MapViewMode>("3d");
  const [settledPitch, setSettledPitch] = useState(ORGANIZATION_ORBIT_PITCH);
  const [settledCamera, setSettledCamera] = useState<ParticipantMapCamera>(() => initialCamera ?? Object.freeze({
    longitude: marker?.coordinate[0] ?? model.camera.center.longitude,
    latitude: marker?.coordinate[1] ?? model.camera.center.latitude,
    zoom: ORGANIZATION_ORBIT_ZOOM,
    pitch: ORGANIZATION_ORBIT_PITCH,
    bearing: 0,
    viewMode: "3d",
  }));
  const [renderedClusterCount, setRenderedClusterCount] = useState(0);
  const [renderedClusterPoint, setRenderedClusterPoint] = useState("");
  const [renderedSelectedMarkerCount, setRenderedSelectedMarkerCount] = useState(0);
  const [settledPadding, setSettledPadding] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [mapReady, setMapReady] = useState(false);
  const [cameraInitialization, setCameraInitialization] = useState<"pending" | "restored" | "organization" | "locality">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<readonly MapSearchResult[]>([]);
  const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "error">("idle");
  const [activeSearchResultId, setActiveSearchResultId] = useState<string | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? "";

  const homeGeoJson = useMemo(() => localityGeoJson(model), [model]);
  const homeMaskGeoJson = useMemo(() => localityMaskGeoJson(model), [model]);
  const homeMarkerGeoJson = useMemo(() => markerGeoJson(marker), [marker]);
  const networkMarkersGeoJson = useMemo(
    () => organizationMarkerGeoJson(
      organizationMarkers.filter((candidate) => candidate.id !== focusedMarkerId),
      null,
    ),
    [focusedMarkerId, organizationMarkers],
  );
  const selectedNetworkMarkerGeoJson = useMemo(
    () => organizationMarkerGeoJson(
      organizationMarkers.filter((candidate) => candidate.id === focusedMarkerId),
      focusedMarkerId,
    ),
    [focusedMarkerId, organizationMarkers],
  );
  const relationshipPathsGeoJson = useMemo(() => relationshipPathGeoJson(relationshipPaths), [relationshipPaths]);
  const serviceFieldsGeoJson = useMemo(() => serviceFieldGeoJson(serviceFields), [serviceFields]);
  const tutorialNodes = useMemo(() => tutorialNodeGeoJson(tutorialOverlay), [tutorialOverlay]);
  const tutorialPaths = useMemo(() => tutorialPathGeoJson(tutorialOverlay), [tutorialOverlay]);

  modeRef.current = mode;
  modelRef.current = model;
  markerRef.current = marker;
  if (!sceneInitializationStartedRef.current) initialCameraRef.current = initialCamera;
  onOrganizationMarkerSelectRef.current = onOrganizationMarkerSelect;
  onCameraChangeRef.current = onCameraChange;
  activationOverlayRef.current = activationOverlay;
  continuousMotionRef.current = continuousMotion;
  workspaceOverlayRef.current = workspaceOverlay;
  homeGeoJsonRef.current = homeGeoJson;
  homeMaskGeoJsonRef.current = homeMaskGeoJson;
  homeMarkerGeoJsonRef.current = homeMarkerGeoJson;
  networkMarkerGeoJsonRef.current = networkMarkersGeoJson;
  selectedNetworkMarkerGeoJsonRef.current = selectedNetworkMarkerGeoJson;
  relationshipPathGeoJsonRef.current = relationshipPathsGeoJson;
  serviceFieldGeoJsonRef.current = serviceFieldsGeoJson;
  tutorialNodeGeoJsonRef.current = tutorialNodes;
  tutorialPathGeoJsonRef.current = tutorialPaths;

  const stopOrbit = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const repairGovernedPaddingAfterMovement = useCallback(() => {
    if (paddingRepairFrameRef.current !== null) {
      window.cancelAnimationFrame(paddingRepairFrameRef.current);
    }
    const repair = () => {
      const map = mapRef.current;
      if (!map || !mapLoadedRef.current) {
        paddingRepairFrameRef.current = null;
        return;
      }
      if (map.isMoving()) {
        paddingRepairFrameRef.current = window.requestAnimationFrame(repair);
        return;
      }
      paddingRepairFrameRef.current = null;
      const expectedPadding = cameraPadding(activationOverlayRef.current, workspaceOverlayRef.current);
      const actualPadding = renderedMapPadding(map);
      const paddingIsSettled = (["top", "right", "bottom", "left"] as const).every(
        (side) => Math.abs(actualPadding[side] - expectedPadding[side]) < 0.5,
      );
      if (paddingIsSettled) return;
      map.jumpTo({ padding: expectedPadding });
      setSettledPadding(renderedMapPadding(map));
    };
    paddingRepairFrameRef.current = window.requestAnimationFrame(repair);
  }, []);

  const pauseForInteraction = useCallback(() => {
    manuallyPausedRef.current = true;
    stopOrbit();
  }, [stopOrbit]);

  const startOrbit = useCallback(() => {
    const map = mapRef.current;
    const target = orbitTargetRef.current;
    stopOrbit();
    if (
      !map ||
      !target ||
      !continuousMotionRef.current ||
      !rotationEnabledRef.current ||
      reducedMotionRef.current ||
      manuallyPausedRef.current
    ) {
      return;
    }

    orbitStartRef.current = performance.now();
    orbitBearingRef.current = map.getBearing();

    const animate = (timestamp: number) => {
      const activeMap = mapRef.current;
      const activeTarget = orbitTargetRef.current;
      if (
        !activeMap ||
        !activeTarget ||
        !continuousMotionRef.current ||
        !rotationEnabledRef.current ||
        reducedMotionRef.current ||
        manuallyPausedRef.current
      ) {
        animationFrameRef.current = null;
        return;
      }
      const elapsed = timestamp - orbitStartRef.current;
      const bearing = orbitBearingRef.current + (elapsed / EXCHANGE_ORBIT_PERIOD_MS) * 360;
      activeMap.jumpTo({ center: [activeTarget[0], activeTarget[1]], bearing });
      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);
  }, [stopOrbit]);

  const setLocalityLayerVisibility = useCallback((visible: boolean) => {
    const map = mapRef.current;
    if (!map) return;
    const visibility = visible ? "visible" : "none";
    for (const layerId of [
      LOCALITY_MASK_LAYER_ID,
      LOCALITY_FILL_LAYER_ID,
      LOCALITY_OUTLINE_CONTRAST_LAYER_ID,
      LOCALITY_OUTLINE_LAYER_ID,
    ]) {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, "visibility", visibility);
    }
  }, []);

  const applyScene = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    stopOrbit();
    manuallyPausedRef.current = false;
    const padding = cameraPadding(activationOverlayRef.current, workspaceOverlayRef.current);
    const activeMode = modeRef.current;
    const activeMarker = markerRef.current;
    setLocalityLayerVisibility(activeMode !== "regional");

    const persistedCamera = initialCameraRef.current;
    if (persistedCamera) {
      setCameraInitialization("restored");
      orbitTargetRef.current = [persistedCamera.longitude, persistedCamera.latitude];
      map.jumpTo({
        center: [persistedCamera.longitude, persistedCamera.latitude],
        zoom: persistedCamera.zoom,
        pitch: persistedCamera.pitch,
        bearing: persistedCamera.bearing,
        padding,
      });
      setSettledPadding(renderedMapPadding(map));
      setViewMode(mapViewModeForPitch(map.getPitch()));
      return;
    }

    if (activeMode === "organization" && activeMarker) {
      setCameraInitialization("organization");
      orbitTargetRef.current = activeMarker.coordinate;
      setViewMode("3d");
      map.flyTo({
        center: [activeMarker.coordinate[0], activeMarker.coordinate[1]],
        zoom: ORGANIZATION_ORBIT_ZOOM,
        pitch: ORGANIZATION_ORBIT_PITCH,
        bearing: map.getBearing(),
        padding,
        duration: reducedMotionRef.current ? 0 : 2_400,
        essential: true,
      });
      if (continuousMotionRef.current) map.once("moveend", startOrbit);
      return;
    }

    const bounds = activeMode === "regional"
      ? HAMPTON_ROADS_BOUNDS
      : localityBounds(modelRef.current);
    setViewMode("3d");
    setCameraInitialization("locality");
    map.fitBounds(bounds, {
      padding,
      pitch: LOCALITY_ORBIT_PITCH,
      bearing: map.getBearing(),
      maxZoom: activeMode === "regional" ? 9.3 : 12.2,
      duration: reducedMotionRef.current ? 0 : 2_400,
    });
    if (continuousMotionRef.current) {
      map.once("moveend", () => {
        const center = map.getCenter();
        orbitTargetRef.current = [center.lng, center.lat];
        startOrbit();
      });
    }
  }, [setLocalityLayerVisibility, startOrbit, stopOrbit]);

  const fitHomeLocality = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    pauseForInteraction();
    setLocalityLayerVisibility(true);
    map.fitBounds(localityBounds(modelRef.current), {
      padding: cameraPadding(activationOverlayRef.current, workspaceOverlayRef.current),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
      maxZoom: 12.2,
      duration: reducedMotionRef.current ? 0 : 900,
    });
  }, [pauseForInteraction, setLocalityLayerVisibility]);

  const selectViewMode = useCallback((nextMode: MapViewMode) => {
    const map = mapRef.current;
    const option = PARTICIPANT_MAP_VIEW_OPTIONS.find((candidate) => candidate.id === nextMode);
    if (!map || !option) return;
    pauseForInteraction();
    map.easeTo({
      pitch: option.pitch,
      bearing: option.resetBearing ? 0 : map.getBearing(),
      duration: reducedMotionRef.current ? 0 : 650,
    });
  }, [pauseForInteraction]);

  const clearSearchHighlight = useCallback(() => {
    searchMarkerRef.current?.remove();
    searchMarkerRef.current = null;
    setActiveSearchResultId(null);
    const source = mapRef.current?.getSource(SEARCH_AREA_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    source?.setData(EMPTY_FEATURE_COLLECTION);
  }, []);

  const selectSearchResult = useCallback((result: MapSearchResult) => {
    const map = mapRef.current;
    if (!map) return;
    pauseForInteraction();
    clearSearchHighlight();
    setActiveSearchResultId(result.id);

    searchMarkerRef.current = new mapboxgl.Marker({ color: "#2e5eaa", scale: 0.9 })
      .setLngLat([result.center[0], result.center[1]])
      .addTo(map);
    const source = map.getSource(SEARCH_AREA_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    source?.setData(bboxFeatureCollection(result.bbox));

    if (result.bbox) {
      const [west, south, east, north] = result.bbox;
      map.fitBounds([[west, south], [east, north]], {
        padding: 72,
        maxZoom: 17,
        duration: reducedMotionRef.current ? 0 : 850,
      });
    } else {
      map.flyTo({
        center: [result.center[0], result.center[1]],
        zoom: searchZoom(result.featureType),
        duration: reducedMotionRef.current ? 0 : 850,
      });
    }
  }, [clearSearchHighlight, pauseForInteraction]);

  const submitMapSearch = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query || !token.startsWith("pk.")) return;

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setSearchStatus("loading");

    try {
      const map = mapRef.current;
      const params = new URLSearchParams({
        q: query,
        access_token: token,
        language: "en",
        limit: "6",
        types: "country,region,district,place,city,locality,neighborhood,street,address,poi",
      });
      if (map) {
        const center = map.getCenter();
        params.set("proximity", `${center.lng},${center.lat}`);
      }
      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/forward?${params.toString()}`,
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error(`Mapbox search failed with HTTP ${response.status}.`);
      const results = parseMapboxSearchResults(await response.json());
      setSearchResults(results);
      setSearchStatus("idle");
      if (results.length === 1) selectSearchResult(results[0]);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setSearchResults([]);
      setSearchStatus("error");
    }
  }, [searchQuery, selectSearchResult, token]);

  useEffect(() => {
    rotationEnabledRef.current = readMapRotationPreference();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => {
      reducedMotionRef.current = media.matches;
      if (media.matches) stopOrbit();
      else startOrbit();
    };
    updateReducedMotion();
    media.addEventListener("change", updateReducedMotion);

    const updatePreference = (event: Event) => {
      const custom = event as CustomEvent<boolean>;
      rotationEnabledRef.current = typeof custom.detail === "boolean"
        ? custom.detail
        : readMapRotationPreference();
      if (rotationEnabledRef.current) startOrbit();
      else stopOrbit();
    };
    window.addEventListener(MAP_ROTATION_PREFERENCE_EVENT, updatePreference);
    return () => {
      media.removeEventListener("change", updateReducedMotion);
      window.removeEventListener(MAP_ROTATION_PREFERENCE_EVENT, updatePreference);
    };
  }, [startOrbit, stopOrbit]);

  useEffect(() => {
    if (!containerRef.current || !token.startsWith("pk.")) return;

    const map = new mapboxgl.Map({
      accessToken: token,
      container: containerRef.current,
      style: "mapbox://styles/mapbox/standard",
      config: {
        basemap: {
          lightPreset: "day",
          theme: "faded",
          showPointOfInterestLabels: true,
          showTransitLabels: false,
          show3dObjects: true,
        },
      },
      center: [-76.12, 36.82],
      zoom: 8.4,
      pitch: LOCALITY_ORBIT_PITCH,
      bearing: -24,
      minZoom: 0,
      maxZoom: 24,
      maxPitch: 85,
      interactive,
      attributionControl: true,
    });
    mapRef.current = map;
    const captureRenderedClusters = () => {
      if (!map.getLayer(NETWORK_CLUSTER_CORE_LAYER_ID)) return;
      const renderedClusters = map.queryRenderedFeatures({ layers: [NETWORK_CLUSTER_CORE_LAYER_ID] });
      const clusterIds = new Set(renderedClusters
        .map((feature) => feature.properties?.cluster_id)
        .filter((clusterId): clusterId is number => typeof clusterId === "number"));
      setRenderedClusterCount(clusterIds.size);
      const firstCluster = renderedClusters[0]?.toJSON();
      const clusterCoordinate = validCoordinatePair(firstCluster?.geometry.type === "Point"
        ? firstCluster.geometry.coordinates
        : null);
      if (clusterCoordinate) {
        const projected = map.project([clusterCoordinate[0], clusterCoordinate[1]]);
        setRenderedClusterPoint(`${projected.x.toFixed(1)},${projected.y.toFixed(1)}`);
      } else {
        setRenderedClusterPoint("");
      }
      const selectedMarkers = map.getLayer(NETWORK_SELECTED_MARKER_CORE_LAYER_ID)
        ? map.queryRenderedFeatures({ layers: [NETWORK_SELECTED_MARKER_CORE_LAYER_ID] })
        : [];
      setRenderedSelectedMarkerCount(selectedMarkers.length);
    };

    if (interactive) {
      map.addControl(
        new mapboxgl.NavigationControl({ showCompass: true, showZoom: true, visualizePitch: true }),
        "bottom-right",
      );
      map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: "imperial" }), "bottom-right");
    }

    map.on("dragstart", pauseForInteraction);
    map.on("rotatestart", pauseForInteraction);
    map.on("pitchstart", pauseForInteraction);
    map.on("wheel", pauseForInteraction);
    map.on("touchstart", pauseForInteraction);

    map.on("load", () => {
      mapLoadedRef.current = true;
      setMapReady(true);
      map.addSource(LOCALITY_MASK_SOURCE_ID, { type: "geojson", data: homeMaskGeoJsonRef.current });
      map.addLayer({
        id: LOCALITY_MASK_LAYER_ID,
        type: "fill",
        source: LOCALITY_MASK_SOURCE_ID,
        paint: {
          "fill-color": "#59606a",
          "fill-opacity": 0.3,
        },
      });

      map.addSource(LOCALITY_SOURCE_ID, { type: "geojson", data: homeGeoJsonRef.current });
      map.addLayer({
        id: LOCALITY_FILL_LAYER_ID,
        type: "fill",
        source: LOCALITY_SOURCE_ID,
        paint: {
          "fill-color": "#d6a23a",
          "fill-opacity": 0.075,
        },
      });
      map.addLayer({
        id: LOCALITY_OUTLINE_CONTRAST_LAYER_ID,
        type: "line",
        source: LOCALITY_SOURCE_ID,
        paint: {
          "line-color": "#0b0b0d",
          "line-opacity": 0.86,
          "line-width": 5,
        },
      });
      map.addLayer({
        id: LOCALITY_OUTLINE_LAYER_ID,
        type: "line",
        source: LOCALITY_SOURCE_ID,
        paint: {
          "line-color": "#d6a23a",
          "line-opacity": 0.96,
          "line-width": 2.5,
        },
      });

      map.addSource(SEARCH_AREA_SOURCE_ID, { type: "geojson", data: EMPTY_FEATURE_COLLECTION });
      map.addLayer({
        id: SEARCH_AREA_FILL_LAYER_ID,
        type: "fill",
        source: SEARCH_AREA_SOURCE_ID,
        paint: {
          "fill-color": "#2e5eaa",
          "fill-opacity": 0.09,
        },
      });
      map.addLayer({
        id: SEARCH_AREA_LINE_LAYER_ID,
        type: "line",
        source: SEARCH_AREA_SOURCE_ID,
        paint: {
          "line-color": "#2e5eaa",
          "line-opacity": 1,
          "line-width": 2.5,
          "line-dasharray": [1.5, 1.5],
        },
      });

      map.addSource(SERVICE_FIELD_SOURCE_ID, { type: "geojson", data: serviceFieldGeoJsonRef.current });
      map.addLayer({
        id: SERVICE_FIELD_FILL_LAYER_ID,
        type: "fill",
        source: SERVICE_FIELD_SOURCE_ID,
        paint: {
          "fill-color": ["case", ["==", ["get", "selected"], true], "#2e5eaa", "#4f718f"],
          "fill-opacity": ["case", ["==", ["get", "selected"], true], 0.16, 0.07],
        },
      });
      map.addLayer({
        id: SERVICE_FIELD_LINE_LAYER_ID,
        type: "line",
        source: SERVICE_FIELD_SOURCE_ID,
        paint: {
          "line-color": ["case", ["==", ["get", "selected"], true], "#2e5eaa", "#4f718f"],
          "line-opacity": 0.75,
          "line-width": ["case", ["==", ["get", "selected"], true], 2.5, 1.25],
          "line-dasharray": [2, 1.5],
        },
      });
      map.addSource(RELATIONSHIP_PATH_SOURCE_ID, { type: "geojson", data: relationshipPathGeoJsonRef.current });
      map.addLayer({
        id: RELATIONSHIP_PATH_LAYER_ID,
        type: "line",
        source: RELATIONSHIP_PATH_SOURCE_ID,
        paint: { "line-color": "#b98727", "line-opacity": 0.9, "line-width": 3, "line-dasharray": [2, 1.4] },
      });

      map.addSource(TUTORIAL_PATH_SOURCE_ID, { type: "geojson", data: tutorialPathGeoJsonRef.current });
      map.addLayer({
        id: TUTORIAL_PATH_LAYER_ID,
        type: "line",
        source: TUTORIAL_PATH_SOURCE_ID,
        paint: {
          "line-color": [
            "match", ["get", "kind"],
            "demand-signal", "#d6a23a",
            "capability-match", "#2e5eaa",
            "teammate-discovery", "#3b7b57",
            "joint-response", "#d6a23a",
            "selected-outcome", "#3b7b57",
            "#2e5eaa",
          ],
          "line-opacity": ["case", ["==", ["get", "stage"], "network-effect"], 1, 0.9],
          "line-width": ["case", ["==", ["get", "stage"], "network-effect"], 5, 4],
          "line-dasharray": [1.6, 1.1],
        },
      });

      map.addSource(TUTORIAL_NODE_SOURCE_ID, { type: "geojson", data: tutorialNodeGeoJsonRef.current });
      map.addLayer({
        id: TUTORIAL_NODE_HALO_LAYER_ID,
        type: "circle",
        source: TUTORIAL_NODE_SOURCE_ID,
        paint: { "circle-radius": 17, "circle-color": "rgba(46,94,170,0.16)" },
      });
      map.addLayer({
        id: TUTORIAL_NODE_CORE_LAYER_ID,
        type: "circle",
        source: TUTORIAL_NODE_SOURCE_ID,
        paint: {
          "circle-radius": 11,
          "circle-color": ["match", ["get", "role"], "issuer", "#d6a23a", "responder", "#2e5eaa", "teammate", "#3b7b57", "#8f3c32"],
          "circle-stroke-color": "#f7f3ea",
          "circle-stroke-width": 2.5,
        },
      });
      map.addLayer({
        id: TUTORIAL_NODE_GLYPH_LAYER_ID,
        type: "symbol",
        source: TUTORIAL_NODE_SOURCE_ID,
        layout: {
          "text-field": ["get", "glyph"], "text-size": 11, "text-allow-overlap": true,
          "text-ignore-placement": true, "text-pitch-alignment": "viewport",
        },
        paint: { "text-color": "#f7f3ea" },
      });
      map.addLayer({
        id: TUTORIAL_NODE_LABEL_LAYER_ID,
        type: "symbol",
        source: TUTORIAL_NODE_SOURCE_ID,
        minzoom: 12.5,
        layout: {
          "text-field": ["get", "label"], "text-size": 12, "text-offset": [0, 1.8],
          "text-anchor": "top", "text-allow-overlap": true, "text-ignore-placement": true,
          "text-pitch-alignment": "viewport",
        },
        paint: {
          "text-color": "#0b0b0d", "text-halo-color": "rgba(247,243,234,0.96)",
          "text-halo-width": 2,
        },
      });

      map.addSource(NETWORK_MARKER_SOURCE_ID, {
        type: "geojson",
        data: networkMarkerGeoJsonRef.current,
        cluster: true,
        clusterMaxZoom: 10,
        clusterRadius: 48,
      });
      map.addLayer({
        id: NETWORK_CLUSTER_CORE_LAYER_ID,
        type: "circle",
        source: NETWORK_MARKER_SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 40, 22],
          "circle-color": "#252932",
          "circle-opacity": 0.92,
        },
      });
      map.addLayer({
        id: NETWORK_CLUSTER_COUNT_LAYER_ID,
        type: "symbol",
        source: NETWORK_MARKER_SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 11,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: { "text-color": "#f7f3ea" },
      });
      map.addSource(NETWORK_SELECTED_MARKER_SOURCE_ID, {
        type: "geojson",
        data: selectedNetworkMarkerGeoJsonRef.current,
      });
      map.addLayer({
        id: NETWORK_MARKER_HALO_LAYER_ID,
        type: "circle",
        source: NETWORK_SELECTED_MARKER_SOURCE_ID,
        paint: {
          "circle-radius": 18,
          "circle-color": "rgba(214,162,58,0.18)",
          "circle-stroke-color": "rgba(214,162,58,0.5)",
          "circle-stroke-width": 2,
        },
      });
      map.addLayer({
        id: NETWORK_MARKER_CORE_LAYER_ID,
        type: "circle",
        source: NETWORK_MARKER_SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 6,
          "circle-color": "#252932",
          "circle-stroke-color": "rgba(0,0,0,0)",
          "circle-stroke-width": 0,
        },
      });
      map.addLayer({
        id: NETWORK_SELECTED_MARKER_CORE_LAYER_ID,
        type: "circle",
        source: NETWORK_SELECTED_MARKER_SOURCE_ID,
        paint: {
          "circle-radius": 12,
          "circle-color": "#252932",
          "circle-stroke-color": "#d6a23a",
          "circle-stroke-width": 3,
        },
      });
      map.addLayer({
        id: NETWORK_MARKER_IDENTITY_LAYER_ID,
        type: "symbol",
        source: NETWORK_SELECTED_MARKER_SOURCE_ID,
        layout: {
          "text-field": ["get", "identity"],
          "text-size": 10,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
          "text-pitch-alignment": "viewport",
          "text-rotation-alignment": "viewport",
        },
        paint: { "text-color": "#f7f3ea" },
      });
      map.addLayer({
        id: NETWORK_MARKER_LABEL_LAYER_ID,
        type: "symbol",
        source: NETWORK_SELECTED_MARKER_SOURCE_ID,
        minzoom: 8,
        layout: {
          "text-field": ["get", "label"],
          "text-size": 12,
          "text-offset": [0, 1.9],
          "text-anchor": "top",
          "text-allow-overlap": false,
          "text-pitch-alignment": "viewport",
          "text-rotation-alignment": "viewport",
        },
        paint: {
          "text-color": "#0b0b0d",
          "text-halo-color": "rgba(247,243,234,0.96)",
          "text-halo-width": 2,
        },
      });

      map.addSource(HOME_MARKER_SOURCE_ID, { type: "geojson", data: homeMarkerGeoJsonRef.current });
      map.addLayer({
        id: HOME_MARKER_HALO_LAYER_ID,
        type: "circle",
        source: HOME_MARKER_SOURCE_ID,
        paint: {
          "circle-radius": 20,
          "circle-color": "rgba(214,162,58,0.18)",
          "circle-stroke-color": "rgba(214,162,58,0.42)",
          "circle-stroke-width": 2,
        },
      });
      map.addLayer({
        id: HOME_MARKER_CORE_LAYER_ID,
        type: "circle",
        source: HOME_MARKER_SOURCE_ID,
        paint: {
          "circle-radius": 13,
          "circle-color": "#0b0b0d",
          "circle-stroke-color": "#d6a23a",
          "circle-stroke-width": 3,
        },
      });
      map.addLayer({
        id: HOME_MARKER_IDENTITY_LAYER_ID,
        type: "symbol",
        source: HOME_MARKER_SOURCE_ID,
        layout: {
          "text-field": ["get", "identity"],
          "text-size": 12,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
          "text-pitch-alignment": "viewport",
          "text-rotation-alignment": "viewport",
        },
        paint: {
          "text-color": "#f7f3ea",
        },
      });
      map.addLayer({
        id: HOME_MARKER_LABEL_LAYER_ID,
        type: "symbol",
        source: HOME_MARKER_SOURCE_ID,
        layout: {
          "text-field": ["get", "label"],
          "text-size": 13,
          "text-offset": [0, 2.15],
          "text-anchor": "top",
          "text-allow-overlap": true,
          "text-ignore-placement": true,
          "text-pitch-alignment": "viewport",
          "text-rotation-alignment": "viewport",
        },
        paint: {
          "text-color": "#0b0b0d",
          "text-halo-color": "rgba(247,243,234,0.96)",
          "text-halo-width": 2.2,
          "text-halo-blur": 0.5,
        },
      });

      if (interactive) {
        map.on("mouseenter", HOME_MARKER_CORE_LAYER_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", HOME_MARKER_CORE_LAYER_ID, () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("mouseenter", NETWORK_MARKER_CORE_LAYER_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", NETWORK_MARKER_CORE_LAYER_ID, () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("mouseenter", NETWORK_SELECTED_MARKER_CORE_LAYER_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", NETWORK_SELECTED_MARKER_CORE_LAYER_ID, () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("mouseenter", NETWORK_CLUSTER_CORE_LAYER_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", NETWORK_CLUSTER_CORE_LAYER_ID, () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("click", NETWORK_CLUSTER_CORE_LAYER_ID, (event) => {
          const feature = event.features?.[0] as unknown as
            | { readonly properties?: Readonly<Record<string, unknown>>; readonly geometry?: { readonly coordinates?: unknown } }
            | undefined;
          const clusterId = feature?.properties?.cluster_id;
          const coordinate = validCoordinatePair(feature?.geometry?.coordinates);
          const source = map.getSource(NETWORK_MARKER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
          if (typeof clusterId !== "number" || !coordinate || !source) return;
          source.getClusterExpansionZoom(clusterId, (error, zoom) => {
            if (error || typeof zoom !== "number") return;
            pauseForInteraction();
            map.easeTo({ center: [coordinate[0], coordinate[1]], zoom, duration: reducedMotionRef.current ? 0 : 650 });
          });
        });
        const selectNetworkMarker = (event: mapboxgl.MapLayerMouseEvent) => {
          const feature = event.features?.[0] as unknown as
            | { readonly properties?: Readonly<Record<string, unknown>> }
            | undefined;
          const markerId = feature?.properties?.id;
          if (typeof markerId === "string") {
            onOrganizationMarkerSelectRef.current?.(markerId);
          }
        };
        map.on("click", NETWORK_MARKER_CORE_LAYER_ID, selectNetworkMarker);
        map.on("click", NETWORK_SELECTED_MARKER_CORE_LAYER_ID, selectNetworkMarker);
        map.on("click", HOME_MARKER_CORE_LAYER_ID, (event) => {
          if (map.queryRenderedFeatures(event.point, {
            layers: [
              NETWORK_CLUSTER_CORE_LAYER_ID,
              NETWORK_MARKER_CORE_LAYER_ID,
              NETWORK_SELECTED_MARKER_CORE_LAYER_ID,
            ],
          }).length > 0) return;
          const markerId = markerRef.current?.id;
          if (markerId) onOrganizationMarkerSelectRef.current?.(markerId);
        });
      }

      sceneInitializationStartedRef.current = true;
      applyScene();
    });

    map.on("moveend", () => {
      if (!sceneInitializationStartedRef.current) return;
      const center = map.getCenter();
      const settledMode = mapViewModeForPitch(map.getPitch());
      const camera = Object.freeze({
        longitude: center.lng,
        latitude: center.lat,
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
        viewMode: settledMode,
      });
      setViewMode(settledMode);
      setSettledPitch(map.getPitch());
      setSettledCamera(camera);
      setSettledPadding(renderedMapPadding(map));
      captureRenderedClusters();
      onCameraChangeRef.current?.(camera);
      repairGovernedPaddingAfterMovement();
    });
    map.on("idle", captureRenderedClusters);

    return () => {
      searchAbortRef.current?.abort();
      searchMarkerRef.current?.remove();
      stopOrbit();
      if (paddingRepairFrameRef.current !== null) {
        window.cancelAnimationFrame(paddingRepairFrameRef.current);
        paddingRepairFrameRef.current = null;
      }
      mapLoadedRef.current = false;
      sceneInitializationStartedRef.current = false;
      setMapReady(false);
      mapRef.current = null;
      map.remove();
    };
  }, [applyScene, interactive, pauseForInteraction, repairGovernedPaddingAfterMovement, stopOrbit, token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoadedRef.current || !map) return;
    const localitySource = map.getSource(LOCALITY_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    localitySource?.setData(homeGeoJson);
    const maskSource = map.getSource(LOCALITY_MASK_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    maskSource?.setData(homeMaskGeoJson);
    const markerSource = map.getSource(HOME_MARKER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    markerSource?.setData(homeMarkerGeoJson);
    const networkMarkerSource = map.getSource(NETWORK_MARKER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    networkMarkerSource?.setData(networkMarkersGeoJson);
    const selectedNetworkMarkerSource = map.getSource(NETWORK_SELECTED_MARKER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    selectedNetworkMarkerSource?.setData(selectedNetworkMarkerGeoJson);
    const relationshipPathSource = map.getSource(RELATIONSHIP_PATH_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    relationshipPathSource?.setData(relationshipPathsGeoJson);
    const serviceFieldSource = map.getSource(SERVICE_FIELD_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    serviceFieldSource?.setData(serviceFieldsGeoJson);
    const tutorialNodeSource = map.getSource(TUTORIAL_NODE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    tutorialNodeSource?.setData(tutorialNodes);
    const tutorialPathSource = map.getSource(TUTORIAL_PATH_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    tutorialPathSource?.setData(tutorialPaths);
  }, [
    homeGeoJson,
    homeMaskGeoJson,
    homeMarkerGeoJson,
    networkMarkersGeoJson,
    selectedNetworkMarkerGeoJson,
    relationshipPathsGeoJson,
    serviceFieldsGeoJson,
    tutorialNodes,
    tutorialPaths,
  ]);

  useEffect(() => {
    applyScene();
  }, [applyScene, continuousMotion, mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoadedRef.current || !map || !mapReady) return;
    const previous = appliedOverlayRef.current;
    if (
      previous.activationOverlay === activationOverlay
      && previous.workspaceOverlay === workspaceOverlay
    ) return;
    appliedOverlayRef.current = { activationOverlay, workspaceOverlay };
    map.jumpTo({ padding: cameraPadding(activationOverlay, workspaceOverlay) });
    setSettledPadding(renderedMapPadding(map));
  }, [activationOverlay, mapReady, workspaceOverlay]);

  if (!token.startsWith("pk.")) {
    return (
      <div className={`${styles.tokenNotice} ${className ?? ""}`} role="status">
        Mapbox public access token required for the spatial activation background.
      </div>
    );
  }

  const focusedOrganizationMarker = organizationMarkers.find((candidate) => candidate.id === focusedMarkerId);
  const selectedMarkerIdentity = organizationInitials(focusedOrganizationMarker?.label ?? marker?.label ?? "Organization");

  return (
    <figure
      className={`${styles.scene} ${className ?? ""}`}
      data-scene={mode}
      data-interactive={interactive}
      data-workspace-overlay={workspaceOverlay ?? "none"}
      data-map-view-mode={viewMode}
      data-map-pitch={settledPitch.toFixed(2)}
      data-map-bearing={settledCamera.bearing.toFixed(2)}
      data-map-center={`${settledCamera.longitude.toFixed(6)},${settledCamera.latitude.toFixed(6)}`}
      data-map-zoom={settledCamera.zoom.toFixed(2)}
      data-selected-marker-id={focusedMarkerId ?? marker?.id ?? ""}
      data-selected-marker-identity={selectedMarkerIdentity}
      data-network-marker-count={organizationMarkers.length}
      data-rendered-cluster-count={renderedClusterCount}
      data-rendered-cluster-point={renderedClusterPoint}
      data-rendered-selected-marker-count={renderedSelectedMarkerCount}
      data-map-padding={`${settledPadding.top},${settledPadding.right},${settledPadding.bottom},${settledPadding.left}`}
      data-map-ready={mapReady}
      data-camera-initialization={cameraInitialization}
      aria-label={`RFxchange ${mode} spatial scene`}
    >
      <div ref={containerRef} className={styles.map} />

      {interactive ? (
        <>
          {showSearch ? <section className={styles.searchPanel} aria-label="Search the Exchange map">
            <form className={styles.searchForm} role="search" onSubmit={submitMapSearch}>
              <label>
                <span aria-hidden="true" className={styles.searchGlyph}>⌕</span>
                <span className={styles.srOnly}>Search any geography, address, or place</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search any geography or place"
                  autoComplete="off"
                />
              </label>
              <button type="submit" disabled={!searchQuery.trim() || searchStatus === "loading"}>
                {searchStatus === "loading" ? "Searching…" : "Search"}
              </button>
            </form>
            <div className={styles.homeContext}>
              <span>Home locality</span>
              <strong>{model.selectedGeography.name}</strong>
              <button type="button" onClick={fitHomeLocality}>Fit home</button>
            </div>
            {searchStatus === "error" ? (
              <p className={styles.searchMessage} role="status">
                Search is temporarily unavailable. Map navigation remains available.
              </p>
            ) : null}
            {searchResults.length > 0 ? (
              <ul className={styles.searchResults} aria-label="Map search results">
                {searchResults.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      data-active={activeSearchResultId === result.id}
                      onClick={() => selectSearchResult(result)}
                    >
                      <strong>{result.name}</strong>
                      <span>{result.context || result.featureType}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {activeSearchResultId ? (
              <button type="button" className={styles.clearSearch} onClick={clearSearchHighlight}>
                Clear search highlight
              </button>
            ) : null}
            <p className={styles.searchHint}>
              Search moves the camera only and never changes your home locality.
            </p>
          </section> : null}

          <div className={styles.viewModeControl} role="group" aria-label="Map view">
            {PARTICIPANT_MAP_VIEW_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                data-active={viewMode === option.id}
                aria-pressed={viewMode === option.id}
                onClick={() => selectViewMode(option.id)}
              >
                {option.label}
              </button>
            ))}
            <button type="button" onClick={fitHomeLocality}>Fit home</button>
          </div>
        </>
      ) : null}

      <figcaption className={styles.srOnly}>
        Edge-to-edge RFxchange map. {continuousMotion
          ? "This instructional or milestone scene may use a 225-second ambient orbit."
          : "This daily workspace scene settles into a stable interactive camera."} Locality scenes use a
        60-degree pitch and fit the authoritative locality bounds. Organization scenes use a
        75-degree pitch at zoom 16 and preserve the persistent organization marker.
        {tutorialOverlay ? ` ${tutorialOverlay.accessibleSummary} All tutorial entities are synthetic and are not live Exchange activity.` : ""}
      </figcaption>
    </figure>
  );
}
