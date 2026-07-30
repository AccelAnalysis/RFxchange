import type {
  AuthoritativeGeoJsonGeometry,
  GeographicPosition,
  GeoJsonPolygonCoordinates,
} from "../../domain/geography/boundary.ts";
import type { GeographyBounds } from "../../domain/geography/model.ts";

export interface MapViewport {
  readonly bounds: GeographyBounds;
  readonly width: number;
  readonly height: number;
}

export interface ProjectedPoint {
  readonly x: number;
  readonly y: number;
}

export const CONTROLLED_LOCALITY_ZOOM_LEVELS = Object.freeze([
  Object.freeze({ id: "nearby", contextPaddingRatio: 0.4 }),
  Object.freeze({ id: "locality", contextPaddingRatio: 0.16 }),
  Object.freeze({ id: "focus", contextPaddingRatio: 0.04 }),
] as const);

export type ControlledLocalityZoomLevel =
  (typeof CONTROLLED_LOCALITY_ZOOM_LEVELS)[number]["id"];

function positive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be positive.`);
  return value;
}

export function createMapViewport(
  focusBounds: GeographyBounds,
  width: number,
  height: number,
  contextPaddingRatio: number,
): MapViewport {
  positive(width, "Viewport width");
  positive(height, "Viewport height");
  if (
    !Number.isFinite(contextPaddingRatio) ||
    contextPaddingRatio < 0 ||
    contextPaddingRatio > 2
  ) {
    throw new Error("Context padding ratio must be between 0 and 2.");
  }
  const longitudeSpan = positive(focusBounds.east - focusBounds.west, "Longitude span");
  const latitudeSpan = positive(focusBounds.north - focusBounds.south, "Latitude span");
  const centerLongitude = (focusBounds.west + focusBounds.east) / 2;
  const centerLatitude = (focusBounds.south + focusBounds.north) / 2;
  let paddedLongitudeSpan = longitudeSpan * (1 + contextPaddingRatio * 2);
  let paddedLatitudeSpan = latitudeSpan * (1 + contextPaddingRatio * 2);
  const viewportAspect = width / height;
  const geographyAspect = paddedLongitudeSpan / paddedLatitudeSpan;
  if (geographyAspect > viewportAspect) {
    paddedLatitudeSpan = paddedLongitudeSpan / viewportAspect;
  } else {
    paddedLongitudeSpan = paddedLatitudeSpan * viewportAspect;
  }

  return Object.freeze({
    bounds: Object.freeze({
      west: centerLongitude - paddedLongitudeSpan / 2,
      south: centerLatitude - paddedLatitudeSpan / 2,
      east: centerLongitude + paddedLongitudeSpan / 2,
      north: centerLatitude + paddedLatitudeSpan / 2,
    }),
    width,
    height,
  });
}

export function viewportForZoom(
  focusBounds: GeographyBounds,
  width: number,
  height: number,
  zoom: ControlledLocalityZoomLevel,
): MapViewport {
  const level = CONTROLLED_LOCALITY_ZOOM_LEVELS.find((candidate) => candidate.id === zoom);
  if (!level) throw new Error(`Unsupported controlled-locality zoom level: ${zoom}.`);
  return createMapViewport(focusBounds, width, height, level.contextPaddingRatio);
}

export function projectGeographicPosition(
  position: GeographicPosition,
  viewport: MapViewport,
): ProjectedPoint {
  const longitudeSpan = viewport.bounds.east - viewport.bounds.west;
  const latitudeSpan = viewport.bounds.north - viewport.bounds.south;
  return Object.freeze({
    x: ((position[0] - viewport.bounds.west) / longitudeSpan) * viewport.width,
    y: ((viewport.bounds.north - position[1]) / latitudeSpan) * viewport.height,
  });
}

function number(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function polygonPath(
  coordinates: GeoJsonPolygonCoordinates,
  viewport: MapViewport,
): string {
  return coordinates
    .map((ring) =>
      ring
        .map((position, index) => {
          const point = projectGeographicPosition(position, viewport);
          return `${index === 0 ? "M" : "L"}${number(point.x)} ${number(point.y)}`;
        })
        .join(" ")
        .concat(" Z"),
    )
    .join(" ");
}

export function boundaryGeometryToSvgPath(
  geometry: AuthoritativeGeoJsonGeometry,
  viewport: MapViewport,
): string {
  return geometry.type === "Polygon"
    ? polygonPath(geometry.coordinates, viewport)
    : geometry.coordinates.map((coordinates) => polygonPath(coordinates, viewport)).join(" ");
}
