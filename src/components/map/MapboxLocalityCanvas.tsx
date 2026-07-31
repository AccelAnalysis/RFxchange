"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import mapboxgl from "mapbox-gl";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import type { ControlledLocalityZoomLevel } from "../../application/geography/geographic-projection";

import styles from "./MapboxLocalityCanvas.module.css";

export interface ControlledLocalityPointOverlay {
  readonly id: string;
  readonly position: readonly [longitude: number, latitude: number];
  readonly label: string;
  readonly kind: "location-candidate" | "confirmed-location" | "organization-marker";
  readonly privacyLabel?: string;
  readonly activated?: boolean;
}

export interface MapboxLocalityCanvasProps {
  readonly model: ControlledLocalityMapModel;
  readonly initialZoom?: ControlledLocalityZoomLevel;
  readonly mobileControlPosition?: "top" | "bottom";
  readonly overlaySide?: "left" | "right" | "split";
  readonly pointOverlays?: readonly ControlledLocalityPointOverlay[];
}

type LocalityGeometry =
  | { readonly type: "Polygon"; readonly coordinates: number[][][] }
  | { readonly type: "MultiPolygon"; readonly coordinates: number[][][][] };

type MapViewMode = "2d" | "perspective" | "3d";

type PersistedCamera = Readonly<{
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
  viewMode: MapViewMode;
}>;

type MapSearchResult = Readonly<{
  id: string;
  name: string;
  context: string;
  featureType: string;
  center: readonly [number, number];
  bbox: readonly [number, number, number, number] | null;
}>;

const HOME_LOCALITY_SOURCE_ID = "rfx-home-locality";
const HOME_MASK_SOURCE_ID = "rfx-home-locality-mask";
const HOME_FILL_LAYER_ID = "rfx-home-locality-fill";
const HOME_MASK_LAYER_ID = "rfx-home-locality-mask-fill";
const HOME_OUTLINE_CONTRAST_LAYER_ID = "rfx-home-locality-outline-contrast";
const HOME_OUTLINE_ACCENT_LAYER_ID = "rfx-home-locality-outline-accent";
const SEARCH_AREA_SOURCE_ID = "rfx-search-result-area";
const SEARCH_AREA_FILL_LAYER_ID = "rfx-search-result-area-fill";
const SEARCH_AREA_LINE_LAYER_ID = "rfx-search-result-area-line";
const VIEWPORT_STORAGE_PREFIX = "rfxchange:map-camera:";
const MAPBOX_MAX_ZOOM = 24;
const WEB_MERCATOR_MAX_LATITUDE = 85.05112878;
const EMPTY_POINT_OVERLAYS: readonly ControlledLocalityPointOverlay[] = Object.freeze([]);
const EMPTY_FEATURE_COLLECTION = Object.freeze({
  type: "FeatureCollection" as const,
  features: Object.freeze([]) as readonly never[],
});

const VIEW_MODE_OPTIONS: readonly Readonly<{
  id: MapViewMode;
  label: string;
  pitch: number;
  resetBearing: boolean;
  description: string;
}>[] = [
  {
    id: "2d",
    label: "2D",
    pitch: 0,
    resetBearing: true,
    description: "Flat north-up operational map",
  },
  {
    id: "perspective",
    label: "Perspective",
    pitch: 35,
    resetBearing: false,
    description: "Tilted spatial context",
  },
  {
    id: "3d",
    label: "3D",
    pitch: 58,
    resetBearing: false,
    description: "Deep 3D spatial view",
  },
] as const;

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

/**
 * Build a Web-Mercator world polygon whose holes are the home-locality exterior rings.
 * Interior holes in the authoritative locality are added back as masked polygons so excluded
 * enclaves/water remain outside the visual home-locality focus.
 */
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

function releaseStateLabel(state: string): string {
  switch (state) {
    case "released":
      return "Released locality";
    case "visible-unreleased":
      return "Visible · not yet released";
    case "limited":
      return "Limited locality";
    case "restricted":
      return "Restricted locality";
    default:
      return "Locality status unavailable";
  }
}

function featureProperties(feature: unknown): Readonly<Record<string, unknown>> | null {
  if (!feature || typeof feature !== "object" || !("properties" in feature)) return null;
  const properties = (feature as { readonly properties?: unknown }).properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) return null;
  return properties as Readonly<Record<string, unknown>>;
}

function mapViewModeForPitch(pitch: number): MapViewMode {
  if (pitch >= 48) return "3d";
  if (pitch >= 15) return "perspective";
  return "2d";
}

function isMapViewMode(value: unknown): value is MapViewMode {
  return value === "2d" || value === "perspective" || value === "3d";
}

function readPersistedCamera(key: string): PersistedCamera | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedCamera>;
    const values = [parsed.longitude, parsed.latitude, parsed.zoom, parsed.pitch, parsed.bearing];
    if (values.some((value) => typeof value !== "number" || !Number.isFinite(value))) {
      return null;
    }
    return {
      longitude: parsed.longitude as number,
      latitude: parsed.latitude as number,
      zoom: Math.min(parsed.zoom as number, MAPBOX_MAX_ZOOM),
      pitch: parsed.pitch as number,
      bearing: parsed.bearing as number,
      viewMode: isMapViewMode(parsed.viewMode)
        ? parsed.viewMode
        : mapViewModeForPitch(parsed.pitch as number),
    };
  } catch {
    return null;
  }
}

function boundsForInitialView(
  model: ControlledLocalityMapModel,
  initialZoom: ControlledLocalityZoomLevel,
): mapboxgl.LngLatBoundsLike {
  const features = initialZoom === "nearby"
    ? model.features
    : model.features.filter((feature) => feature.role === "selected");
  const bounds = new mapboxgl.LngLatBounds();
  for (const feature of features) {
    bounds.extend([feature.boundary.bounds.west, feature.boundary.bounds.south]);
    bounds.extend([feature.boundary.bounds.east, feature.boundary.bounds.north]);
  }
  return bounds;
}

function homeBounds(model: ControlledLocalityMapModel): mapboxgl.LngLatBoundsLike {
  const bounds = model.selectedGeography.bounds;
  return [
    [bounds.west, bounds.south],
    [bounds.east, bounds.north],
  ];
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
      const properties = featureProperties(feature);
      if (!geometry || typeof geometry !== "object" || !properties) return [];
      const coordinates = validCoordinatePair(
        "coordinates" in geometry ? (geometry as { coordinates?: unknown }).coordinates : null,
      );
      if (!coordinates) return [];
      const name = typeof properties.name === "string" ? properties.name.trim() : "";
      if (!name) return [];
      const id = typeof properties.mapbox_id === "string" && properties.mapbox_id.trim()
        ? properties.mapbox_id.trim()
        : `mapbox-search-${index}-${coordinates[0]}-${coordinates[1]}`;
      const placeFormatted = typeof properties.place_formatted === "string"
        ? properties.place_formatted.trim()
        : "";
      const fullAddress = typeof properties.full_address === "string"
        ? properties.full_address.trim()
        : "";
      const featureType = typeof properties.feature_type === "string"
        ? properties.feature_type.trim()
        : "place";
      return [Object.freeze({
        id,
        name,
        context: fullAddress || placeFormatted,
        featureType,
        center: coordinates,
        bbox: validBbox(properties.bbox),
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

export function MapboxLocalityCanvas({
  model,
  initialZoom = "locality",
  mobileControlPosition = "top",
  overlaySide = "split",
  pointOverlays = EMPTY_POINT_OVERLAYS,
}: MapboxLocalityCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const [viewMode, setViewMode] = useState<MapViewMode>("2d");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<readonly MapSearchResult[]>([]);
  const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "error">("idle");
  const [activeSearchResultId, setActiveSearchResultId] = useState<string | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? "";
  const storageKey = `${VIEWPORT_STORAGE_PREFIX}${model.selectedGeography.id}`;

  const homeFeature = useMemo(
    () => model.features.find((feature) => feature.role === "selected") ?? null,
    [model.features],
  );

  const homeGeoJson = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: homeFeature
      ? [{
          type: "Feature" as const,
          geometry: copyGeometry(homeFeature.boundary.geometry),
          properties: {
            geographyId: String(homeFeature.geography.id),
            name: homeFeature.geography.name,
            role: "selected",
            releaseState: homeFeature.geography.releaseState,
            fipsCode: homeFeature.geography.fipsCode ? String(homeFeature.geography.fipsCode) : "",
          },
        }]
      : [],
  }), [homeFeature]);

  const homeMaskGeoJson = useMemo(
    () => homeFeature
      ? createHomeLocalityMask(copyGeometry(homeFeature.boundary.geometry))
      : EMPTY_FEATURE_COLLECTION,
    [homeFeature],
  );

  const selectedStyles = useMemo(() => {
    const fill = model.layers.find((layer) => layer.id === "selected-fill")?.style;
    const contrast = model.layers.find((layer) => layer.id === "selected-outline-contrast")?.style;
    const accent = model.layers.find((layer) => layer.id === "selected-outline-accent")?.style;
    return {
      fill: fill ?? { fill: "#d6a23a", fillOpacity: 0.08, stroke: "none", strokeOpacity: 0, strokeWidth: 0 },
      contrast: contrast ?? { fill: "none", fillOpacity: 0, stroke: "#0b0b0d", strokeOpacity: 0.9, strokeWidth: 5 },
      accent: accent ?? { fill: "none", fillOpacity: 0, stroke: "#d6a23a", strokeOpacity: 1, strokeWidth: 2.5 },
    };
  }, [model.layers]);

  const selectViewMode = (nextMode: MapViewMode) => {
    const map = mapRef.current;
    if (!map) return;
    const option = VIEW_MODE_OPTIONS.find((candidate) => candidate.id === nextMode);
    if (!option) return;

    setViewMode(nextMode);
    map.easeTo({
      pitch: option.pitch,
      bearing: option.resetBearing ? 0 : map.getBearing(),
      duration: 650,
    });
  };

  const fitHomeLocality = () => {
    const map = mapRef.current;
    if (!map) return;
    map.fitBounds(homeBounds(model), {
      padding: model.camera.paddingPixels,
      pitch: map.getPitch(),
      bearing: map.getBearing(),
      maxZoom: model.camera.maximumZoom,
      duration: 700,
    });
  };

  const clearSearchHighlight = () => {
    searchMarkerRef.current?.remove();
    searchMarkerRef.current = null;
    setActiveSearchResultId(null);
    const map = mapRef.current;
    const source = map?.getSource(SEARCH_AREA_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    source?.setData(EMPTY_FEATURE_COLLECTION);
  };

  const selectSearchResult = (result: MapSearchResult) => {
    const map = mapRef.current;
    if (!map) return;
    clearSearchHighlight();
    setActiveSearchResultId(result.id);

    const marker = new mapboxgl.Marker({ color: "#2e5eaa", scale: 0.9 })
      .setLngLat([result.center[0], result.center[1]])
      .addTo(map);
    searchMarkerRef.current = marker;

    const source = map.getSource(SEARCH_AREA_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    source?.setData(bboxFeatureCollection(result.bbox));

    if (result.bbox) {
      const [west, south, east, north] = result.bbox;
      map.fitBounds([[west, south], [east, north]], {
        padding: 72,
        maxZoom: 17,
        duration: 700,
      });
    } else {
      map.flyTo({
        center: [result.center[0], result.center[1]],
        zoom: Math.min(searchZoom(result.featureType), MAPBOX_MAX_ZOOM),
        duration: 700,
      });
    }
  };

  const submitMapSearch = async (event: FormEvent<HTMLFormElement>) => {
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
  };

  useEffect(() => {
    if (!containerRef.current || !token.startsWith("pk.") || !homeFeature) return;

    const persistedCamera = readPersistedCamera(storageKey);
    const initialViewMode = persistedCamera?.viewMode ?? mapViewModeForPitch(model.camera.pitchDegrees);
    setViewMode(initialViewMode);

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
      center: persistedCamera
        ? [persistedCamera.longitude, persistedCamera.latitude]
        : [model.camera.center.longitude, model.camera.center.latitude],
      zoom: persistedCamera?.zoom ?? 9,
      pitch: persistedCamera?.pitch ?? model.camera.pitchDegrees,
      bearing: persistedCamera?.bearing ?? model.camera.bearingDegrees,
      minZoom: 0,
      maxZoom: MAPBOX_MAX_ZOOM,
    });
    mapRef.current = map;

    map.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true, showZoom: true, showCompass: true }),
      mobileControlPosition === "bottom" ? "bottom-right" : "top-right",
    );
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: "imperial" }), "bottom-right");

    const markers: mapboxgl.Marker[] = [];
    const popups: mapboxgl.Popup[] = [];

    map.on("load", () => {
      map.addSource(HOME_MASK_SOURCE_ID, {
        type: "geojson",
        data: homeMaskGeoJson,
      });
      map.addLayer({
        id: HOME_MASK_LAYER_ID,
        type: "fill",
        source: HOME_MASK_SOURCE_ID,
        paint: {
          "fill-color": "#59606a",
          "fill-opacity": 0.34,
        },
      });

      map.addSource(HOME_LOCALITY_SOURCE_ID, {
        type: "geojson",
        data: homeGeoJson,
      });
      map.addLayer({
        id: HOME_FILL_LAYER_ID,
        type: "fill",
        source: HOME_LOCALITY_SOURCE_ID,
        paint: {
          "fill-color": selectedStyles.fill.fill === "none" ? "#d6a23a" : selectedStyles.fill.fill,
          "fill-opacity": Math.min(selectedStyles.fill.fillOpacity, 0.08),
        },
      });
      map.addLayer({
        id: HOME_OUTLINE_CONTRAST_LAYER_ID,
        type: "line",
        source: HOME_LOCALITY_SOURCE_ID,
        paint: {
          "line-color": selectedStyles.contrast.stroke,
          "line-opacity": selectedStyles.contrast.strokeOpacity,
          "line-width": Math.max(selectedStyles.contrast.strokeWidth, 4),
        },
      });
      map.addLayer({
        id: HOME_OUTLINE_ACCENT_LAYER_ID,
        type: "line",
        source: HOME_LOCALITY_SOURCE_ID,
        paint: {
          "line-color": selectedStyles.accent.stroke,
          "line-opacity": selectedStyles.accent.strokeOpacity,
          "line-width": Math.max(selectedStyles.accent.strokeWidth, 2.5),
        },
      });

      map.addSource(SEARCH_AREA_SOURCE_ID, {
        type: "geojson",
        data: EMPTY_FEATURE_COLLECTION,
      });
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

      for (const overlay of pointOverlays) {
        const element = document.createElement("button");
        element.type = "button";
        element.className = styles.markerButton;
        element.dataset.kind = overlay.kind;
        element.dataset.activated = String(overlay.activated ?? false);
        element.setAttribute(
          "aria-label",
          `${overlay.label}. ${overlay.privacyLabel ?? "Geographically anchored RFxchange map point."}`,
        );

        const popupContent = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = overlay.label;
        const detail = document.createElement("div");
        detail.textContent = overlay.privacyLabel ?? "RFxchange geographic point";
        popupContent.append(title, detail);

        const popup = new mapboxgl.Popup({ offset: 28, closeButton: true }).setDOMContent(popupContent);
        const marker = new mapboxgl.Marker({ element, anchor: "bottom" })
          .setLngLat([overlay.position[0], overlay.position[1]])
          .setPopup(popup)
          .addTo(map);
        markers.push(marker);
        popups.push(popup);
      }

      map.on("mouseenter", HOME_FILL_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", HOME_FILL_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("click", HOME_FILL_LAYER_ID, (event) => {
        const properties = featureProperties(event.features?.[0]);
        if (!properties) return;
        const popupContent = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = `${String(properties.name ?? "Locality")} · Home locality`;
        const detail = document.createElement("div");
        detail.textContent = releaseStateLabel(String(properties.releaseState ?? ""));
        const authority = document.createElement("small");
        authority.textContent = "Search and map navigation change the viewport only; home-locality authority remains server controlled.";
        popupContent.append(title, detail, authority);
        const popup = new mapboxgl.Popup({ closeButton: true })
          .setLngLat(event.lngLat)
          .setDOMContent(popupContent)
          .addTo(map);
        popups.push(popup);
      });

      if (!persistedCamera) {
        map.fitBounds(boundsForInitialView(model, initialZoom), {
          padding: model.camera.paddingPixels,
          pitch: model.camera.pitchDegrees,
          bearing: model.camera.bearingDegrees,
          maxZoom:
            initialZoom === "focus"
              ? model.camera.maximumZoom
              : initialZoom === "nearby"
                ? 9.5
                : 11.5,
          duration: 0,
        });
      }
    });

    map.on("moveend", () => {
      const center = map.getCenter();
      const resolvedViewMode = mapViewModeForPitch(map.getPitch());
      setViewMode(resolvedViewMode);
      const camera: PersistedCamera = {
        longitude: center.lng,
        latitude: center.lat,
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
        viewMode: resolvedViewMode,
      };
      try {
        window.sessionStorage.setItem(storageKey, JSON.stringify(camera));
      } catch {
        // Viewport persistence is an enhancement; map interaction remains functional without it.
      }
    });

    return () => {
      searchAbortRef.current?.abort();
      searchMarkerRef.current?.remove();
      searchMarkerRef.current = null;
      mapRef.current = null;
      for (const popup of popups) popup.remove();
      for (const marker of markers) marker.remove();
      map.remove();
    };
  }, [
    homeFeature,
    homeGeoJson,
    homeMaskGeoJson,
    initialZoom,
    mobileControlPosition,
    model,
    pointOverlays,
    selectedStyles,
    storageKey,
    token,
  ]);

  if (!token.startsWith("pk.")) {
    return (
      <figure
        className={styles.figure}
        data-selected-geography={model.selectedGeography.id}
        data-overlay-side={overlaySide}
      >
        <div className={styles.tokenNotice} role="status">
          <div className={styles.tokenNoticeContent}>
            <strong>Mapbox public access token required</strong>
            <span>
              The authoritative RFxchange geography model is ready, but the Mapbox basemap cannot
              load until a browser-safe public token is configured locally.
            </span>
            <code>NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk...</code>
          </div>
        </div>
        <figcaption className={styles.srOnly}>
          {model.selectedGeography.name} is the active canonical home locality.
        </figcaption>
      </figure>
    );
  }

  return (
    <figure
      className={styles.figure}
      data-selected-geography={model.selectedGeography.id}
      data-overlay-side={overlaySide}
    >
      <div
        ref={containerRef}
        className={styles.map}
        aria-label={`${model.selectedGeography.name} RFxchange interactive map`}
      />

      <section className={styles.searchPanel} aria-label="Search the map">
        <form className={styles.searchForm} role="search" onSubmit={submitMapSearch}>
          <label className={styles.searchField}>
            <span className={styles.srOnly}>Search any geography, address, or place</span>
            <span aria-hidden="true" className={styles.searchGlyph}>⌕</span>
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
        {searchStatus === "idle" && searchQuery.trim() && searchResults.length === 0 ? (
          <p className={styles.searchHint}>Search moves the camera only and never changes your home locality.</p>
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
      </section>

      <div className={styles.viewModeControl} role="group" aria-label="Map view mode">
        {VIEW_MODE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={styles.viewModeButton}
            data-active={viewMode === option.id}
            aria-pressed={viewMode === option.id}
            title={option.description}
            onClick={() => selectViewMode(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <a
        className={styles.attribution}
        href={model.attribution.sourceLayerUrl}
        target="_blank"
        rel="noreferrer"
      >
        Home boundary: {model.attribution.label} · {model.attribution.vintage}
      </a>
      <figcaption className={styles.srOnly}>
        Interactive Mapbox canvas. {model.selectedGeography.name} is the home-locality focus with an
        authoritative outline and an outside-locality focus mask. Search, pan, full-range zoom,
        pitch, bearing, and map view mode change only the exploratory viewport and never geography
        participation authority.
      </figcaption>
    </figure>
  );
}
