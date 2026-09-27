"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  PARTICIPANT_MAP_VIEW_OPTIONS,
  mapViewModeForPitch,
  type MapViewMode,
} from "../../application/geography/map-view";
import {
  adaptLensMapProjection,
  createLensProjectionRenderModel,
  lensProjectionContainsOrganizationMarker,
} from "../../application/participant/lens-map-projection-adapter";
import {
  MAP_ROTATION_PREFERENCE_EVENT,
  readMapRotationPreference,
  startAmbientMapRotation,
} from "./map-motion-preference";

import { useI18n } from "../i18n/I18nProvider";
import {
  EMPTY_LENS_PROJECTION_ADAPTER,
  HAMPTON_ROADS_BOUNDS,
  HOME_MARKER_SOURCE_ID,
  LENS_PROJECTION_SOURCE_ID,
  LOCALITY_FILL_LAYER_ID,
  LOCALITY_MASK_LAYER_ID,
  LOCALITY_MASK_SOURCE_ID,
  LOCALITY_OUTLINE_LAYER_ID,
  LOCALITY_SOURCE_ID,
  MAP_BASEMAP_PRESETS,
  MapBasemapPresetId,
  NETWORK_MARKER_SOURCE_ID,
  NETWORK_SELECTED_MARKER_SOURCE_ID,
  OPPORTUNITY_MARKER_SOURCE_ID,
  OPPORTUNITY_SELECTED_MARKER_SOURCE_ID,
  ORGANIZATION_ORBIT_ZOOM,
  RELATIONSHIP_PATH_SOURCE_ID,
  SERVICE_FIELD_SOURCE_ID,
  TUTORIAL_NODE_SOURCE_ID,
  TUTORIAL_PATH_SOURCE_ID,
  cameraPadding,
  localityBounds,
  localityGeoJson,
  localityMaskGeoJson,
  markerGeoJson,
  opportunityMarkerGeoJson,
  organizationMarkerGeoJson,
  relationshipPathGeoJson,
  renderedMapPadding,
  serviceFieldGeoJson,
  tutorialNodeGeoJson,
  tutorialPathGeoJson,
} from "./exchange-scene-data";
import { installSceneInteractions } from "./exchange-scene-interactions";
import { installSceneLayers } from "./exchange-scene-layers";
import type { ExchangeSpatialSceneProps } from "./exchange-scene-types";
import { ExchangeMapSearch } from "./ExchangeMapSearch";
import styles from "./ExchangeSpatialScene.module.css";
export type {
  ExchangeGovernedAreaGeometry,
  ExchangeLensSelectableProjection,
  ExchangeSpatialGeometry,
} from "../../application/participant/lens-map-projection-adapter";
export type * from "./exchange-scene-types";

export const ExchangeSceneContext = createContext<((props: ExchangeSpatialSceneProps) => () => void) | null>(null);

export function ExchangeSpatialScene(props: ExchangeSpatialSceneProps) {
  const registerScene = useContext(ExchangeSceneContext);
  useLayoutEffect(() => {
    if (registerScene && !props.embedded) return registerScene(props);
  }, [props, registerScene]);
  return registerScene && !props.embedded ? null : <ExchangeSpatialRenderer {...props} />;
}

const EMPTY_ITEMS = Object.freeze([]);

export function ExchangeSpatialRenderer({
  model,
  mode,
  marker = null,
  organizationMarkers = EMPTY_ITEMS,
  opportunityMarkers = EMPTY_ITEMS,
  relationshipPaths = EMPTY_ITEMS,
  serviceFields = EMPTY_ITEMS,
  lensProjection = null,
  lensSelection = null,
  governedAreaGeometries = EMPTY_ITEMS,
  onLensProjectionSelect,
  focusedMarkerId = null,
  onOrganizationMarkerSelect,
  onOpportunityMarkerSelect,
  initialCamera = null,
  onCameraChange,
  interactive = false,
  activationOverlay = false,
  workspaceOverlay = null,
  adaptiveWorkspace = false,
  showSearch = interactive,
  homeLocalityFocus = !interactive,
  tutorialOverlay = null,
  continuousMotion = null,
  className,
  embedded = false,
}: ExchangeSpatialSceneProps) {
  const { t } = useI18n();
  if (lensProjection && (organizationMarkers.length > 0 || opportunityMarkers.length > 0 || serviceFields.length > 0)) {
    throw new Error("A shared lens projection cannot be combined with legacy domain overlay props.");
  }
  const lensProjectionAdapter = useMemo(
    () =>
      lensProjection && lensSelection
        ? adaptLensMapProjection(lensProjection, lensSelection)
        : lensProjection
          ? adaptLensMapProjection(lensProjection, {
              kind: "none",
              source: null,
              selectionKey: null,
              focalIdentity: null,
              selectedOrganization: null,
              selectedRecord: null,
              selectedMarker: null,
              selectedRelationship: null,
            })
          : EMPTY_LENS_PROJECTION_ADAPTER,
    [lensProjection, lensSelection],
  );
  const lensProjectionRenderModel = useMemo(
    () =>
      createLensProjectionRenderModel(lensProjectionAdapter, governedAreaGeometries, {
        ownOrganizationId: marker?.organizationId ?? null,
        zoom: lensProjection?.camera?.zoom ?? initialCamera?.zoom ?? ORGANIZATION_ORBIT_ZOOM,
      }),
    [
      governedAreaGeometries,
      initialCamera?.zoom,
      lensProjection?.camera?.zoom,
      lensProjectionAdapter,
      marker?.organizationId,
    ],
  );
  const homeMarkerIsProjected = useMemo(
    () =>
      marker !== null &&
      lensProjectionContainsOrganizationMarker(lensProjectionAdapter, marker.id, marker.organizationId),
    [lensProjectionAdapter, marker],
  );
  const sceneMarker = homeMarkerIsProjected ? null : marker;
  const homeGeoJson = useMemo(() => localityGeoJson(model), [model]);
  const homeMaskGeoJson = useMemo(() => localityMaskGeoJson(model), [model]);
  const homeMarkerGeoJson = useMemo(() => markerGeoJson(sceneMarker), [sceneMarker]);
  const networkMarkersGeoJson = useMemo(
    () =>
      organizationMarkerGeoJson(
        organizationMarkers.filter((candidate) => candidate.id !== focusedMarkerId),
        null,
      ),
    [focusedMarkerId, organizationMarkers],
  );
  const selectedNetworkMarkerGeoJson = useMemo(
    () =>
      organizationMarkerGeoJson(
        organizationMarkers.filter((candidate) => candidate.id === focusedMarkerId),
        focusedMarkerId,
      ),
    [focusedMarkerId, organizationMarkers],
  );
  const opportunityMarkersGeoJson = useMemo(
    () =>
      opportunityMarkerGeoJson(
        opportunityMarkers.filter((candidate) => candidate.id !== focusedMarkerId),
        null,
      ),
    [focusedMarkerId, opportunityMarkers],
  );
  const selectedOpportunityMarkerGeoJson = useMemo(
    () =>
      opportunityMarkerGeoJson(
        opportunityMarkers.filter((candidate) => candidate.id === focusedMarkerId),
        focusedMarkerId,
      ),
    [focusedMarkerId, opportunityMarkers],
  );
  const relationshipPathsGeoJson = useMemo(() => relationshipPathGeoJson(relationshipPaths), [relationshipPaths]);
  const serviceFieldsGeoJson = useMemo(() => serviceFieldGeoJson(serviceFields), [serviceFields]);
  const tutorialNodes = useMemo(() => tutorialNodeGeoJson(tutorialOverlay), [tutorialOverlay]);
  const tutorialPaths = useMemo(() => tutorialPathGeoJson(tutorialOverlay), [tutorialOverlay]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const sdkRef = useRef<typeof import("mapbox-gl").default | null>(null);
  const stopRotationRef = useRef<(() => void) | null>(null);
  const orbitTargetRef = useRef<readonly [number, number] | null>(null);
  const mapLoadedRef = useRef(false);
  const sceneInitializationStartedRef = useRef(false);
  const manuallyPausedRef = useRef(false);
  const rotationEnabledRef = useRef(true);
  const reducedMotionRef = useRef(false);
  const modeRef = useRef(mode);
  const modelRef = useRef(model);
  // The governed home marker remains the organization-mode camera anchor even
  // when its legacy visual source is deduplicated against a lens projection.
  const markerRef = useRef(marker);
  const onOrganizationMarkerSelectRef = useRef(onOrganizationMarkerSelect);
  const onOpportunityMarkerSelectRef = useRef(onOpportunityMarkerSelect);
  const onLensProjectionSelectRef = useRef(onLensProjectionSelect);
  const initialCameraRef = useRef(initialCamera);
  const onCameraChangeRef = useRef(onCameraChange);
  const activationOverlayRef = useRef(activationOverlay);
  const continuousMotionRef = useRef(continuousMotion);
  const workspaceOverlayRef = useRef(workspaceOverlay);
  const adaptiveWorkspaceRef = useRef(adaptiveWorkspace);
  const appliedOverlayRef = useRef({ activationOverlay, workspaceOverlay, adaptiveWorkspace });
  const homeLocalityFocusRef = useRef(homeLocalityFocus);
  homeLocalityFocusRef.current = homeLocalityFocus;
  const homeGeoJsonRef = useRef(homeGeoJson);
  const homeMaskGeoJsonRef = useRef(homeMaskGeoJson);
  const homeMarkerGeoJsonRef = useRef(homeMarkerGeoJson);
  const networkMarkerGeoJsonRef = useRef(networkMarkersGeoJson);
  const selectedNetworkMarkerGeoJsonRef = useRef(selectedNetworkMarkerGeoJson);
  const opportunityMarkerGeoJsonRef = useRef(opportunityMarkersGeoJson);
  const lensProjectionGeoJsonRef = useRef(lensProjectionRenderModel.data);
  const lensProjectionSelectableRef = useRef(lensProjectionRenderModel.selectableByRenderId);
  const lensProjectionClusterRef = useRef(lensProjectionRenderModel.clusterByRenderId);
  const selectedOpportunityMarkerGeoJsonRef = useRef(selectedOpportunityMarkerGeoJson);
  const relationshipPathGeoJsonRef = useRef(relationshipPathsGeoJson);
  const serviceFieldGeoJsonRef = useRef(serviceFieldsGeoJson);
  const tutorialNodeGeoJsonRef = useRef(tutorialNodes);
  const tutorialPathGeoJsonRef = useRef(tutorialPaths);
  const [viewMode, setViewMode] = useState<MapViewMode>(initialCamera?.viewMode ?? "2d");
  const [basemapPreset, setBasemapPreset] = useState<MapBasemapPresetId>("exchange");
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? "";

  modeRef.current = mode;
  modelRef.current = model;
  markerRef.current = marker;
  if (!sceneInitializationStartedRef.current) initialCameraRef.current = initialCamera;
  onOrganizationMarkerSelectRef.current = onOrganizationMarkerSelect;
  onOpportunityMarkerSelectRef.current = onOpportunityMarkerSelect;
  onLensProjectionSelectRef.current = onLensProjectionSelect;
  onCameraChangeRef.current = onCameraChange;
  activationOverlayRef.current = activationOverlay;
  continuousMotionRef.current = continuousMotion;
  workspaceOverlayRef.current = workspaceOverlay;
  adaptiveWorkspaceRef.current = adaptiveWorkspace;
  homeGeoJsonRef.current = homeGeoJson;
  homeMaskGeoJsonRef.current = homeMaskGeoJson;
  homeMarkerGeoJsonRef.current = homeMarkerGeoJson;
  networkMarkerGeoJsonRef.current = networkMarkersGeoJson;
  selectedNetworkMarkerGeoJsonRef.current = selectedNetworkMarkerGeoJson;
  opportunityMarkerGeoJsonRef.current = opportunityMarkersGeoJson;
  selectedOpportunityMarkerGeoJsonRef.current = selectedOpportunityMarkerGeoJson;
  lensProjectionGeoJsonRef.current = lensProjectionRenderModel.data;
  lensProjectionSelectableRef.current = lensProjectionRenderModel.selectableByRenderId;
  lensProjectionClusterRef.current = lensProjectionRenderModel.clusterByRenderId;
  relationshipPathGeoJsonRef.current = relationshipPathsGeoJson;
  serviceFieldGeoJsonRef.current = serviceFieldsGeoJson;
  tutorialNodeGeoJsonRef.current = tutorialNodes;
  tutorialPathGeoJsonRef.current = tutorialPaths;

  const stopOrbit = useCallback(() => {
    const stop = stopRotationRef.current;
    stopRotationRef.current = null;
    stop?.();
  }, []);

  const repairGovernedPaddingAfterMovement = useCallback(() => {
    const map = mapRef.current;
    // moveend is the scheduling boundary; never poll an active camera every frame.
    if (!map || !mapLoadedRef.current || map.isMoving()) return;
    const expected = cameraPadding(
      activationOverlayRef.current,
      workspaceOverlayRef.current,
      adaptiveWorkspaceRef.current,
    );
    const actual = renderedMapPadding(map);
    if ((["top", "right", "bottom", "left"] as const).every((side) => Math.abs(actual[side] - expected[side]) < 0.5))
      return;
    map.setPadding(expected);
  }, []);

  const pauseForInteraction = useCallback(() => {
    manuallyPausedRef.current = true;
    stopOrbit();
  }, [stopOrbit]);

  useEffect(() => {
    // Work in a form, sheet or menu also ends ambient motion.
    document.addEventListener("pointerdown", pauseForInteraction, { passive: true });
    document.addEventListener("keydown", pauseForInteraction);
    return () => {
      document.removeEventListener("pointerdown", pauseForInteraction);
      document.removeEventListener("keydown", pauseForInteraction);
    };
  }, [pauseForInteraction]);

  const startOrbit = useCallback(() => {
    stopOrbit();
    const map = mapRef.current;
    if (!map || !orbitTargetRef.current) return;
    stopRotationRef.current = startAmbientMapRotation(map, () =>
      Boolean(
        continuousMotionRef.current &&
          rotationEnabledRef.current &&
          !reducedMotionRef.current &&
          !manuallyPausedRef.current &&
          !document.hidden,
      ),
    );
  }, [stopOrbit]);

  const setLocalityLayerVisibility = useCallback((visible: boolean) => {
    const map = mapRef.current;
    if (!map) return;
    const visibility = visible ? "visible" : "none";
    for (const layerId of [LOCALITY_MASK_LAYER_ID, LOCALITY_FILL_LAYER_ID, LOCALITY_OUTLINE_LAYER_ID]) {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, "visibility", visibility);
    }
  }, []);

  const applyScene = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    stopOrbit();
    manuallyPausedRef.current = false;
    const padding = cameraPadding(
      activationOverlayRef.current,
      workspaceOverlayRef.current,
      adaptiveWorkspaceRef.current,
    );
    const activeMode = modeRef.current;
    const activeMarker = markerRef.current;
    setLocalityLayerVisibility(homeLocalityFocusRef.current && activeMode !== "regional");

    const persistedCamera = initialCameraRef.current;
    if (persistedCamera) {
      orbitTargetRef.current = [persistedCamera.longitude, persistedCamera.latitude];
      map.jumpTo({
        center: [persistedCamera.longitude, persistedCamera.latitude],
        zoom: persistedCamera.zoom,
        pitch: persistedCamera.pitch,
        bearing: persistedCamera.bearing,
        padding,
      });
      setViewMode(mapViewModeForPitch(map.getPitch()));
      return;
    }

    if (activeMode === "organization" && activeMarker) {
      orbitTargetRef.current = activeMarker.coordinate;
      setViewMode("2d");
      map.flyTo({
        center: [activeMarker.coordinate[0], activeMarker.coordinate[1]],
        zoom: ORGANIZATION_ORBIT_ZOOM,
        pitch: 0,
        bearing: map.getBearing(),
        padding,
        duration: reducedMotionRef.current ? 0 : 650,
      });
      if (continuousMotionRef.current) map.once("moveend", startOrbit);
      return;
    }

    const bounds = activeMode === "regional" ? HAMPTON_ROADS_BOUNDS : localityBounds(modelRef.current);
    setViewMode("2d");
    map.fitBounds(bounds, {
      padding,
      pitch: 0,
      bearing: map.getBearing(),
      maxZoom: activeMode === "regional" ? 9.3 : 12.2,
      duration: reducedMotionRef.current ? 0 : 650,
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
      padding: cameraPadding(activationOverlayRef.current, workspaceOverlayRef.current, adaptiveWorkspaceRef.current),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
      maxZoom: 12.2,
      duration: reducedMotionRef.current ? 0 : 900,
    });
  }, [pauseForInteraction, setLocalityLayerVisibility]);

  const selectViewMode = useCallback(
    (nextMode: MapViewMode) => {
      const map = mapRef.current;
      const option = PARTICIPANT_MAP_VIEW_OPTIONS.find((candidate) => candidate.id === nextMode);
      if (!map || !option) return;
      pauseForInteraction();
      if (map.getLayer("rfx-buildings"))
        map.setLayoutProperty("rfx-buildings", "visibility", nextMode === "3d" ? "visible" : "none");
      map.easeTo({
        pitch: option.pitch,
        bearing: option.resetBearing ? 0 : map.getBearing(),
        duration: reducedMotionRef.current ? 0 : 650,
      });
    },
    [pauseForInteraction],
  );

  const selectBasemapPreset = useCallback(
    (nextPreset: MapBasemapPresetId) => {
      const map = mapRef.current;
      const preset = MAP_BASEMAP_PRESETS.find((candidate) => candidate.id === nextPreset);
      if (!map || !preset) return;
      pauseForInteraction();
      for (const layer of map.getStyle()?.layers ?? []) {
        if (layer.type === "symbol" && !layer.id.startsWith("rfx-")) {
          map.setLayoutProperty(layer.id, "visibility", nextPreset === "street" ? "visible" : "none");
        }
      }
      setBasemapPreset(nextPreset);
    },
    [pauseForInteraction],
  );

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
      rotationEnabledRef.current = typeof custom.detail === "boolean" ? custom.detail : readMapRotationPreference();
      if (rotationEnabledRef.current) startOrbit();
      else stopOrbit();
    };
    const visibilityChanged = () => (document.hidden ? stopOrbit() : startOrbit());
    document.addEventListener("visibilitychange", visibilityChanged);
    window.addEventListener(MAP_ROTATION_PREFERENCE_EVENT, updatePreference);
    return () => {
      document.removeEventListener("visibilitychange", visibilityChanged);
      media.removeEventListener("change", updateReducedMotion);
      window.removeEventListener(MAP_ROTATION_PREFERENCE_EVENT, updatePreference);
    };
  }, [startOrbit, stopOrbit]);

  useEffect(() => {
    if (!containerRef.current || !token.startsWith("pk.")) return;

    let disposed = false;
    let teardown: (() => void) | undefined;
    void import("mapbox-gl")
      .then(({ default: mapboxgl }) => {
        if (disposed || !containerRef.current) return;
        sdkRef.current = mapboxgl;
        const map = new mapboxgl.Map({
          accessToken: token,
          container: containerRef.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: [-76.12, 36.82],
          zoom: 8.4,
          pitch: 0,
          bearing: -24,
          minZoom: 0,
          maxZoom: 24,
          maxPitch: 85,
          interactive,
          attributionControl: true,
        });
        mapRef.current = map;

        if (interactive) {
          map.addControl(
            new mapboxgl.NavigationControl({ showCompass: true, showZoom: true, visualizePitch: true }),
            "top-right",
          );
        }

        const pauseForMapInteraction = (event: object) => {
          if ("originalEvent" in event && event.originalEvent) pauseForInteraction();
        };
        map.on("error", () => {
          if (!mapLoadedRef.current) setMapError(true);
        });
        map.on("dragstart", pauseForMapInteraction);
        map.on("rotatestart", pauseForMapInteraction);
        map.on("pitchstart", pauseForMapInteraction);
        map.on("wheel", pauseForMapInteraction);
        map.on("touchstart", pauseForMapInteraction);

        map.on("load", () => {
          mapLoadedRef.current = true;
          setMapReady(true);
          setMapError(false);
          installSceneLayers(
            map,
            {
              homeGeoJson: homeGeoJsonRef.current,
              homeMarkerGeoJson: homeMarkerGeoJsonRef.current,
              homeMaskGeoJson: homeMaskGeoJsonRef.current,
              lensProjectionGeoJson: lensProjectionGeoJsonRef.current,
              networkMarkerGeoJson: networkMarkerGeoJsonRef.current,
              opportunityMarkerGeoJson: opportunityMarkerGeoJsonRef.current,
              relationshipPathGeoJson: relationshipPathGeoJsonRef.current,
              selectedNetworkMarkerGeoJson: selectedNetworkMarkerGeoJsonRef.current,
              selectedOpportunityMarkerGeoJson: selectedOpportunityMarkerGeoJsonRef.current,
              serviceFieldGeoJson: serviceFieldGeoJsonRef.current,
              tutorialNodeGeoJson: tutorialNodeGeoJsonRef.current,
              tutorialPathGeoJson: tutorialPathGeoJsonRef.current,
            },
            initialCameraRef.current?.viewMode === "3d",
          );

          if (interactive)
            installSceneInteractions(
              map,
              () => ({
                reducedMotion: reducedMotionRef.current,
                markerId: markerRef.current?.id,
                selectable: lensProjectionSelectableRef.current,
                clusters: lensProjectionClusterRef.current,
              }),
              pauseForInteraction,
              (id) => onOrganizationMarkerSelectRef.current?.(id),
              (id) => onOpportunityMarkerSelectRef.current?.(id),
              (projection) => onLensProjectionSelectRef.current?.(projection),
            );

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
          onCameraChangeRef.current?.(camera);
          repairGovernedPaddingAfterMovement();
        });

        teardown = () => {
          stopOrbit();
          mapLoadedRef.current = false;
          sceneInitializationStartedRef.current = false;
          setMapReady(false);
          mapRef.current = null;
          sdkRef.current = null;
          map.remove();
        };
      })
      .catch(() => {
        if (!disposed) setMapError(true);
      });
    return () => {
      disposed = true;
      teardown?.();
    };
  }, [applyScene, interactive, pauseForInteraction, repairGovernedPaddingAfterMovement, stopOrbit, token]);

  useEffect(() => {
    if (!mapReady) return;
    setLocalityLayerVisibility(homeLocalityFocus && mode !== "regional" && !searchActive);
  }, [homeLocalityFocus, mode, searchActive, mapReady, setLocalityLayerVisibility]);

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
    const selectedNetworkMarkerSource = map.getSource(NETWORK_SELECTED_MARKER_SOURCE_ID) as
      | mapboxgl.GeoJSONSource
      | undefined;
    selectedNetworkMarkerSource?.setData(selectedNetworkMarkerGeoJson);
    const opportunityMarkerSource = map.getSource(OPPORTUNITY_MARKER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    opportunityMarkerSource?.setData(opportunityMarkersGeoJson);
    const selectedOpportunityMarkerSource = map.getSource(OPPORTUNITY_SELECTED_MARKER_SOURCE_ID) as
      | mapboxgl.GeoJSONSource
      | undefined;
    selectedOpportunityMarkerSource?.setData(selectedOpportunityMarkerGeoJson);
    const lensProjectionSource = map.getSource(LENS_PROJECTION_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    lensProjectionSource?.setData(lensProjectionRenderModel.data);
    const relationshipPathSource = map.getSource(RELATIONSHIP_PATH_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    relationshipPathSource?.setData(relationshipPathsGeoJson);
    const serviceFieldSource = map.getSource(SERVICE_FIELD_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    serviceFieldSource?.setData(serviceFieldsGeoJson);
    const tutorialNodeSource = map.getSource(TUTORIAL_NODE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    tutorialNodeSource?.setData(tutorialNodes);
    const tutorialPathSource = map.getSource(TUTORIAL_PATH_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    tutorialPathSource?.setData(tutorialPaths);
  }, [
    mapReady,
    homeGeoJson,
    homeMaskGeoJson,
    homeMarkerGeoJson,
    networkMarkersGeoJson,
    selectedNetworkMarkerGeoJson,
    opportunityMarkersGeoJson,
    selectedOpportunityMarkerGeoJson,
    lensProjectionRenderModel,
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
      previous.activationOverlay === activationOverlay &&
      previous.workspaceOverlay === workspaceOverlay &&
      previous.adaptiveWorkspace === adaptiveWorkspace
    )
      return;
    appliedOverlayRef.current = { activationOverlay, workspaceOverlay, adaptiveWorkspace };
    map.jumpTo({ padding: cameraPadding(activationOverlay, workspaceOverlay, adaptiveWorkspace) });
  }, [activationOverlay, adaptiveWorkspace, mapReady, workspaceOverlay]);

  if (!token.startsWith("pk.")) {
    return (
      <div className={`${styles.tokenNotice} ${className ?? ""}`} data-embedded={embedded || undefined} role="status">
        {t("interface.map.unavailable")}
      </div>
    );
  }

  return (
    <figure
      className={`${styles.scene} ${className ?? ""}`}
      data-scene={mode}
      data-embedded={embedded || undefined}
      data-interactive={interactive}
      data-workspace-overlay={workspaceOverlay ?? "none"}
      data-adaptive-workspace={adaptiveWorkspace || undefined}
      data-map-ready={mapReady}
      aria-label={`RFxchange ${mode} spatial scene`}
    >
      <div ref={containerRef} className={styles.map} />
      {mapError ? (
        <div role="status" className={styles.tokenNotice}>
          {t("interface.map.unavailable")}
        </div>
      ) : null}

      {interactive ? (
        <>
          {showSearch && mapReady ? (
            <ExchangeMapSearch
              map={mapRef.current!}
              sdk={sdkRef.current!}
              token={token}
              localityName={model.selectedGeography.name}
              onFitLocality={fitHomeLocality}
              onInteraction={pauseForInteraction}
              onHighlightChange={setSearchActive}
            />
          ) : null}

          <details className={styles.mapOptions}>
            <summary>{t("interface.map.options")}</summary>
            <div className={styles.viewModeControl} role="group" aria-label={t("interface.map.options")}>
              {PARTICIPANT_MAP_VIEW_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  data-active={viewMode === option.id}
                  aria-pressed={viewMode === option.id}
                  onClick={() => selectViewMode(option.id)}
                >
                  {t(`interface.map.${option.id}`)}
                </button>
              ))}
              <span className={styles.controlDivider} aria-hidden="true" />
              <span className={styles.basemapLabel}>{t("interface.map.basemapLabel")}</span>
              {MAP_BASEMAP_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  data-active={basemapPreset === preset.id}
                  aria-pressed={basemapPreset === preset.id}
                  onClick={() => selectBasemapPreset(preset.id)}
                >
                  {t(`interface.map.${preset.id}`)}
                </button>
              ))}
              <button type="button" onClick={fitHomeLocality}>
                {t("interface.map.fitHome")}
              </button>
            </div>
          </details>
        </>
      ) : null}

      <figcaption className={styles.srOnly}>
        {t("interface.map.description")}
        {tutorialOverlay ? ` ${tutorialOverlay.accessibleSummary} ${t("interface.map.tutorialNotice")}` : ""}
      </figcaption>
    </figure>
  );
}
