"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const LOCALITY_SOURCE_ID = "rfx-authoritative-localities";
const VIEWPORT_STORAGE_PREFIX = "rfxchange:map-camera:";
const EMPTY_POINT_OVERLAYS: readonly ControlledLocalityPointOverlay[] = Object.freeze([]);
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

function copyGeometry(
  geometry: ControlledLocalityMapModel["features"][number]["boundary"]["geometry"],
): LocalityGeometry {
  if (geometry.type === "Polygon") {
    return {
      type: "Polygon",
      coordinates: geometry.coordinates.map((ring) =>
        ring.map(([longitude, latitude]) => [longitude, latitude]),
      ),
    };
  }
  return {
    type: "MultiPolygon",
    coordinates: geometry.coordinates.map((polygon) =>
      polygon.map((ring) =>
        ring.map(([longitude, latitude]) => [longitude, latitude]),
      ),
    ),
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
      zoom: parsed.zoom as number,
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

export function MapboxLocalityCanvas({
  model,
  initialZoom = "locality",
  mobileControlPosition = "top",
  overlaySide = "split",
  pointOverlays = EMPTY_POINT_OVERLAYS,
}: MapboxLocalityCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [viewMode, setViewMode] = useState<MapViewMode>("2d");
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? "";
  const storageKey = `${VIEWPORT_STORAGE_PREFIX}${model.selectedGeography.id}`;

  const localityGeoJson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: model.features.map((feature) => ({
        type: "Feature" as const,
        geometry: copyGeometry(feature.boundary.geometry),
        properties: {
          geographyId: String(feature.geography.id),
          name: feature.geography.name,
          role: feature.role,
          releaseState: feature.geography.releaseState,
          fipsCode: feature.geography.fipsCode ? String(feature.geography.fipsCode) : "",
        },
      })),
    }),
    [model],
  );

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

  useEffect(() => {
    if (!containerRef.current || !token.startsWith("pk.")) return;

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
          showPointOfInterestLabels: false,
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
      minZoom: 2,
      maxZoom: model.camera.maximumZoom,
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
      map.addSource(LOCALITY_SOURCE_ID, {
        type: "geojson",
        data: localityGeoJson,
      });

      for (const layer of [...model.layers].sort((left, right) => left.order - right.order)) {
        const id = `rfx-locality-${layer.id}`;
        if (layer.purpose === "fill") {
          map.addLayer({
            id,
            type: "fill",
            source: LOCALITY_SOURCE_ID,
            filter: ["==", ["get", "role"], layer.featureRole],
            paint: {
              "fill-color": layer.style.fill,
              "fill-opacity": layer.featureRole === "selected"
                ? Math.min(layer.style.fillOpacity, 0.2)
                : Math.min(layer.style.fillOpacity, 0.1),
            },
          });
        } else {
          map.addLayer({
            id,
            type: "line",
            source: LOCALITY_SOURCE_ID,
            filter: ["==", ["get", "role"], layer.featureRole],
            paint: {
              "line-color": layer.style.stroke,
              "line-opacity": layer.style.strokeOpacity,
              "line-width": layer.style.strokeWidth,
            },
          });
        }
      }

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

      const interactiveLayerIds = [
        "rfx-locality-selected-fill",
        "rfx-locality-surrounding-fill",
      ].filter((id) => Boolean(map.getLayer(id)));

      for (const layerId of interactiveLayerIds) {
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("click", layerId, (event) => {
          const properties = featureProperties(event.features?.[0]);
          if (!properties) return;
          const popupContent = document.createElement("div");
          const title = document.createElement("strong");
          title.textContent = String(properties.name ?? "Locality");
          const detail = document.createElement("div");
          detail.textContent = releaseStateLabel(String(properties.releaseState ?? ""));
          const authority = document.createElement("small");
          authority.textContent = "Map exploration does not change operating-geography authority.";
          popupContent.append(title, detail, authority);
          const popup = new mapboxgl.Popup({ closeButton: true })
            .setLngLat(event.lngLat)
            .setDOMContent(popupContent)
            .addTo(map);
          popups.push(popup);
        });
      }

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
      mapRef.current = null;
      for (const popup of popups) popup.remove();
      for (const marker of markers) marker.remove();
      map.remove();
    };
  }, [initialZoom, localityGeoJson, mobileControlPosition, model, pointOverlays, storageKey, token]);

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
          {model.selectedGeography.name} is the active canonical operating geography.
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
        Boundary: {model.attribution.label} · {model.attribution.vintage}
      </a>
      <figcaption className={styles.srOnly}>
        Interactive Mapbox canvas. {model.selectedGeography.name} remains the server-authorized
        active geography while pan, zoom, pitch, bearing, map view mode, and surrounding-locality
        exploration change only the camera viewport.
      </figcaption>
    </figure>
  );
}
