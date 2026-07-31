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
  MAP_ROTATION_PREFERENCE_EVENT,
  readMapRotationPreference,
} from "./map-motion-preference";

import styles from "./ExchangeSpatialScene.module.css";

export type ExchangeSpatialSceneMode = "regional" | "locality" | "organization";
type MapViewMode = "2d" | "perspective" | "3d";

export interface ExchangeHomeMarker {
  readonly id: string;
  readonly coordinate: readonly [longitude: number, latitude: number];
  readonly label: string;
  readonly accessibleLocationLabel?: string;
}

export interface ExchangeSpatialSceneProps {
  readonly model: ControlledLocalityMapModel;
  readonly mode: ExchangeSpatialSceneMode;
  readonly marker?: ExchangeHomeMarker | null;
  readonly interactive?: boolean;
  readonly activationOverlay?: boolean;
  readonly className?: string;
}

type LocalityGeometry =
  | { readonly type: "Polygon"; readonly coordinates: number[][][] }
  | { readonly type: "MultiPolygon"; readonly coordinates: number[][][][] };

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
const HOME_MARKER_SOURCE_ID = "rfx-spatial-scene-home-marker";
const HOME_MARKER_HALO_LAYER_ID = "rfx-spatial-scene-home-marker-halo";
const HOME_MARKER_CORE_LAYER_ID = "rfx-spatial-scene-home-marker-core";
const HOME_MARKER_RF_LAYER_ID = "rfx-spatial-scene-home-marker-rf";
const HOME_MARKER_LABEL_LAYER_ID = "rfx-spatial-scene-home-marker-label";
const SEARCH_AREA_SOURCE_ID = "rfx-spatial-scene-search-area";
const SEARCH_AREA_FILL_LAYER_ID = "rfx-spatial-scene-search-fill";
const SEARCH_AREA_LINE_LAYER_ID = "rfx-spatial-scene-search-line";

export const EXCHANGE_ORBIT_PERIOD_MS = 225_000;
export const LOCALITY_ORBIT_PITCH = 60;
export const ORGANIZATION_ORBIT_PITCH = 75;
export const ORGANIZATION_ORBIT_ZOOM = 16;

const WEB_MERCATOR_MAX_LATITUDE = 85.05112878;
const HAMPTON_ROADS_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [-76.515, 36.615],
  [-75.86, 37.085],
];

const VIEW_MODE_OPTIONS: readonly Readonly<{
  id: MapViewMode;
  label: string;
  pitch: number;
  resetBearing: boolean;
}>[] = [
  { id: "2d", label: "2D", pitch: 0, resetBearing: true },
  { id: "perspective", label: "Perspective", pitch: 35, resetBearing: false },
  { id: "3d", label: "3D", pitch: ORGANIZATION_ORBIT_PITCH, resetBearing: false },
] as const;

const EMPTY_FEATURE_COLLECTION = Object.freeze({
  type: "FeatureCollection" as const,
  features: Object.freeze([]) as readonly never[],
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

function mapViewModeForPitch(pitch: number): MapViewMode {
  if (pitch >= 48) return "3d";
  if (pitch >= 15) return "perspective";
  return "2d";
}

function cameraPadding(activationOverlay: boolean) {
  if (!activationOverlay) {
    return { top: 84, right: 36, bottom: 36, left: 36 };
  }
  if (typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches) {
    return { top: 72, right: 22, bottom: Math.min(window.innerHeight * 0.58, 520), left: 22 };
  }
  return { top: 88, right: 72, bottom: 62, left: Math.min(window.innerWidth * 0.48, 620) };
}

export function ExchangeSpatialScene({
  model,
  mode,
  marker = null,
  interactive = false,
  activationOverlay = false,
  className,
}: ExchangeSpatialSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const orbitStartRef = useRef(0);
  const orbitBearingRef = useRef(0);
  const orbitTargetRef = useRef<readonly [number, number] | null>(null);
  const mapLoadedRef = useRef(false);
  const manuallyPausedRef = useRef(false);
  const rotationEnabledRef = useRef(true);
  const reducedMotionRef = useRef(false);
  const modeRef = useRef(mode);
  const modelRef = useRef(model);
  const markerRef = useRef(marker);
  const activationOverlayRef = useRef(activationOverlay);
  const homeGeoJsonRef = useRef(localityGeoJson(model));
  const homeMaskGeoJsonRef = useRef(localityMaskGeoJson(model));
  const homeMarkerGeoJsonRef = useRef(markerGeoJson(marker));
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const [viewMode, setViewMode] = useState<MapViewMode>("3d");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<readonly MapSearchResult[]>([]);
  const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "error">("idle");
  const [activeSearchResultId, setActiveSearchResultId] = useState<string | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? "";

  const homeGeoJson = useMemo(() => localityGeoJson(model), [model]);
  const homeMaskGeoJson = useMemo(() => localityMaskGeoJson(model), [model]);
  const homeMarkerGeoJson = useMemo(() => markerGeoJson(marker), [marker]);

  modeRef.current = mode;
  modelRef.current = model;
  markerRef.current = marker;
  activationOverlayRef.current = activationOverlay;
  homeGeoJsonRef.current = homeGeoJson;
  homeMaskGeoJsonRef.current = homeMaskGeoJson;
  homeMarkerGeoJsonRef.current = homeMarkerGeoJson;

  const stopOrbit = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
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
    const padding = cameraPadding(activationOverlayRef.current);
    const activeMode = modeRef.current;
    const activeMarker = markerRef.current;
    setLocalityLayerVisibility(activeMode !== "regional");

    if (activeMode === "organization" && activeMarker) {
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
      map.once("moveend", startOrbit);
      return;
    }

    const bounds = activeMode === "regional"
      ? HAMPTON_ROADS_BOUNDS
      : localityBounds(modelRef.current);
    setViewMode("3d");
    map.fitBounds(bounds, {
      padding,
      pitch: LOCALITY_ORBIT_PITCH,
      bearing: map.getBearing(),
      maxZoom: activeMode === "regional" ? 9.3 : 12.2,
      duration: reducedMotionRef.current ? 0 : 2_400,
    });
    map.once("moveend", () => {
      const center = map.getCenter();
      orbitTargetRef.current = [center.lng, center.lat];
      startOrbit();
    });
  }, [setLocalityLayerVisibility, startOrbit, stopOrbit]);

  const fitHomeLocality = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    pauseForInteraction();
    setLocalityLayerVisibility(true);
    map.fitBounds(localityBounds(modelRef.current), {
      padding: cameraPadding(false),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
      maxZoom: 12.2,
      duration: reducedMotionRef.current ? 0 : 900,
    });
  }, [pauseForInteraction, setLocalityLayerVisibility]);

  const selectViewMode = useCallback((nextMode: MapViewMode) => {
    const map = mapRef.current;
    const option = VIEW_MODE_OPTIONS.find((candidate) => candidate.id === nextMode);
    if (!map || !option) return;
    pauseForInteraction();
    setViewMode(nextMode);
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
      interactive,
      attributionControl: true,
    });
    mapRef.current = map;

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
        id: HOME_MARKER_RF_LAYER_ID,
        type: "symbol",
        source: HOME_MARKER_SOURCE_ID,
        layout: {
          "text-field": "RF",
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
        map.on("click", HOME_MARKER_CORE_LAYER_ID, (event) => {
          const feature = event.features?.[0] as unknown as
            | { readonly properties?: Readonly<Record<string, unknown>> }
            | undefined;
          const properties = feature?.properties ?? {};
          const popup = document.createElement("div");
          const title = document.createElement("strong");
          title.textContent = String(properties.label ?? markerRef.current?.label ?? "Your organization");
          const detail = document.createElement("div");
          detail.textContent = String(
            properties.accessibleLocationLabel ??
              markerRef.current?.accessibleLocationLabel ??
              "RFxchange organization marker",
          );
          popup.append(title, detail);
          new mapboxgl.Popup({ offset: 24 })
            .setLngLat(event.lngLat)
            .setDOMContent(popup)
            .addTo(map);
        });
      }

      applyScene();
    });

    map.on("moveend", () => setViewMode(mapViewModeForPitch(map.getPitch())));

    return () => {
      searchAbortRef.current?.abort();
      searchMarkerRef.current?.remove();
      stopOrbit();
      mapLoadedRef.current = false;
      mapRef.current = null;
      map.remove();
    };
  }, [applyScene, interactive, pauseForInteraction, stopOrbit, token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoadedRef.current || !map) return;
    const localitySource = map.getSource(LOCALITY_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    localitySource?.setData(homeGeoJson);
    const maskSource = map.getSource(LOCALITY_MASK_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    maskSource?.setData(homeMaskGeoJson);
    const markerSource = map.getSource(HOME_MARKER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    markerSource?.setData(homeMarkerGeoJson);
    applyScene();
  }, [applyScene, homeGeoJson, homeMaskGeoJson, homeMarkerGeoJson, mode, activationOverlay]);

  if (!token.startsWith("pk.")) {
    return (
      <div className={`${styles.tokenNotice} ${className ?? ""}`} role="status">
        Mapbox public access token required for the spatial activation background.
      </div>
    );
  }

  return (
    <figure
      className={`${styles.scene} ${className ?? ""}`}
      data-scene={mode}
      data-interactive={interactive}
      aria-label={`RFxchange ${mode} spatial scene`}
    >
      <div ref={containerRef} className={styles.map} />

      {interactive ? (
        <>
          <section className={styles.searchPanel} aria-label="Search the Exchange map">
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
          </section>

          <div className={styles.viewModeControl} role="group" aria-label="Map view mode">
            {VIEW_MODE_OPTIONS.map((option) => (
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
          </div>
        </>
      ) : null}

      <figcaption className={styles.srOnly}>
        Edge-to-edge RFxchange map. Ambient rotation uses a 225-second orbit. Locality scenes use a
        60-degree pitch and fit the authoritative locality bounds. Organization scenes use a
        75-degree pitch at zoom 16 and orbit the persistent organization marker.
      </figcaption>
    </figure>
  );
}
