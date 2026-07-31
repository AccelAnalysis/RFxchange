"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import {
  MAP_ROTATION_PREFERENCE_EVENT,
  readMapRotationPreference,
} from "./map-motion-preference";

import styles from "./ExchangeSpatialScene.module.css";

export type ExchangeSpatialSceneMode = "regional" | "locality" | "organization";

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

const LOCALITY_SOURCE_ID = "rfx-spatial-scene-locality";
const LOCALITY_FILL_LAYER_ID = "rfx-spatial-scene-locality-fill";
const LOCALITY_OUTLINE_LAYER_ID = "rfx-spatial-scene-locality-outline";
const HOME_MARKER_SOURCE_ID = "rfx-spatial-scene-home-marker";
const HOME_MARKER_HALO_LAYER_ID = "rfx-spatial-scene-home-marker-halo";
const HOME_MARKER_CORE_LAYER_ID = "rfx-spatial-scene-home-marker-core";
const HOME_MARKER_RF_LAYER_ID = "rfx-spatial-scene-home-marker-rf";
const HOME_MARKER_LABEL_LAYER_ID = "rfx-spatial-scene-home-marker-label";

export const EXCHANGE_ORBIT_PERIOD_MS = 225_000;
export const LOCALITY_ORBIT_PITCH = 60;
export const ORGANIZATION_ORBIT_PITCH = 75;
export const ORGANIZATION_ORBIT_ZOOM = 16;

const HAMPTON_ROADS_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [-76.515, 36.615],
  [-75.86, 37.085],
];

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
        },
        geometry: copyGeometry(selected.boundary.geometry),
      },
    ],
  };
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
  const homeMarkerGeoJsonRef = useRef(markerGeoJson(marker));
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? "";

  const homeGeoJson = useMemo(() => localityGeoJson(model), [model]);
  const homeMarkerGeoJson = useMemo(() => markerGeoJson(marker), [marker]);

  modeRef.current = mode;
  modelRef.current = model;
  markerRef.current = marker;
  activationOverlayRef.current = activationOverlay;
  homeGeoJsonRef.current = homeGeoJson;
  homeMarkerGeoJsonRef.current = homeMarkerGeoJson;

  const stopOrbit = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

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
      activeMap.jumpTo({ center: activeTarget, bearing });
      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);
  }, [stopOrbit]);

  const applyScene = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    stopOrbit();
    manuallyPausedRef.current = false;
    const padding = cameraPadding(activationOverlayRef.current);
    const activeMode = modeRef.current;
    const activeMarker = markerRef.current;

    if (activeMode === "organization" && activeMarker) {
      orbitTargetRef.current = activeMarker.coordinate;
      map.flyTo({
        center: activeMarker.coordinate,
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
  }, [startOrbit, stopOrbit]);

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
    }

    const pauseForInteraction = () => {
      manuallyPausedRef.current = true;
      stopOrbit();
    };
    map.on("dragstart", pauseForInteraction);
    map.on("rotatestart", pauseForInteraction);
    map.on("pitchstart", pauseForInteraction);
    map.on("wheel", pauseForInteraction);
    map.on("touchstart", pauseForInteraction);

    map.on("load", () => {
      mapLoadedRef.current = true;
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
        id: LOCALITY_OUTLINE_LAYER_ID,
        type: "line",
        source: LOCALITY_SOURCE_ID,
        paint: {
          "line-color": "#d6a23a",
          "line-opacity": 0.96,
          "line-width": 3,
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

      applyScene();
    });

    return () => {
      stopOrbit();
      mapLoadedRef.current = false;
      mapRef.current = null;
      map.remove();
    };
  }, [applyScene, interactive, stopOrbit, token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoadedRef.current || !map) return;
    const localitySource = map.getSource(LOCALITY_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    localitySource?.setData(homeGeoJson);
    const markerSource = map.getSource(HOME_MARKER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    markerSource?.setData(homeMarkerGeoJson);
    applyScene();
  }, [applyScene, homeGeoJson, homeMarkerGeoJson, mode, activationOverlay]);

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
      <figcaption className={styles.srOnly}>
        Edge-to-edge RFxchange map. Ambient rotation uses a 225-second orbit. Locality scenes use a
        60-degree pitch and fit the authoritative locality bounds. Organization scenes use a
        75-degree pitch at zoom 16 and orbit the persistent organization marker.
      </figcaption>
    </figure>
  );
}
