import type {
  AuthoritativeBoundaryReference,
  GeographyBounds,
  GeographyDefinition,
  GeographyId,
} from "./model";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type BoundaryGeometryId = Brand<string, "BoundaryGeometryId">;
export type BoundaryGeometrySha256 = Brand<string, "BoundaryGeometrySha256">;
export type GeographicPosition = readonly [longitude: number, latitude: number];
export type GeoJsonLinearRing = readonly GeographicPosition[];
export type GeoJsonPolygonCoordinates = readonly GeoJsonLinearRing[];
export type GeoJsonMultiPolygonCoordinates = readonly GeoJsonPolygonCoordinates[];

export type AuthoritativeGeoJsonGeometry =
  | Readonly<{
      readonly type: "Polygon";
      readonly coordinates: GeoJsonPolygonCoordinates;
    }>
  | Readonly<{
      readonly type: "MultiPolygon";
      readonly coordinates: GeoJsonMultiPolygonCoordinates;
    }>;

export interface BoundaryGeometryProvenance extends AuthoritativeBoundaryReference {
  readonly sourceLayerUrl: string;
  readonly queryUrl: string;
  readonly retrievedAt: string;
  readonly coordinateReferenceSystem: "EPSG:4326";
  readonly geometryPrecision: number;
  readonly maxAllowableOffsetDegrees: number;
  readonly geometrySha256: BoundaryGeometrySha256;
}

export interface AuthoritativeBoundaryGeometry {
  readonly id: BoundaryGeometryId;
  readonly geographyId: GeographyId;
  readonly provenance: BoundaryGeometryProvenance;
  readonly geometry: AuthoritativeGeoJsonGeometry;
  readonly bounds: GeographyBounds;
  readonly vertexCount: number;
}

export interface CreateAuthoritativeBoundaryGeometryInput {
  readonly id: string;
  readonly provenance: Omit<BoundaryGeometryProvenance, "geometrySha256"> &
    Readonly<{ readonly geometrySha256: string }>;
  readonly geometry: AuthoritativeGeoJsonGeometry;
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function boundaryGeometryId(value: string): BoundaryGeometryId {
  const normalized = required(value, "Boundary geometry id").toLowerCase();
  if (!/^[a-z0-9][a-z0-9._:-]{2,191}$/.test(normalized)) {
    throw new Error("Boundary geometry id must be a stable lowercase identifier.");
  }
  return normalized as BoundaryGeometryId;
}

function geometrySha256(value: string): BoundaryGeometrySha256 {
  const normalized = required(value, "Boundary geometry SHA-256").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new Error("Boundary geometry SHA-256 must contain 64 hexadecimal characters.");
  }
  return normalized as BoundaryGeometrySha256;
}

function validUrl(value: string, label: string): string {
  const normalized = required(value, label);
  const parsed = new URL(normalized);
  if (parsed.protocol !== "https:") throw new Error(`${label} must use HTTPS.`);
  return parsed.toString();
}

function finiteCoordinate(
  value: number,
  minimum: number,
  maximum: number,
  label: string,
): number {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  }
  return value;
}

function position(value: GeographicPosition): GeographicPosition {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error("GeoJSON position must contain longitude and latitude.");
  }
  return Object.freeze([
    finiteCoordinate(value[0], -180, 180, "Boundary longitude"),
    finiteCoordinate(value[1], -90, 90, "Boundary latitude"),
  ]);
}

function samePosition(left: GeographicPosition, right: GeographicPosition): boolean {
  return left[0] === right[0] && left[1] === right[1];
}

function linearRing(value: GeoJsonLinearRing): GeoJsonLinearRing {
  if (!Array.isArray(value) || value.length < 4) {
    throw new Error("GeoJSON linear ring must contain at least four positions.");
  }
  const normalized = Object.freeze(value.map(position));
  if (!samePosition(normalized[0], normalized[normalized.length - 1])) {
    throw new Error("GeoJSON linear ring must be closed.");
  }
  return normalized;
}

function polygon(value: GeoJsonPolygonCoordinates): GeoJsonPolygonCoordinates {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("GeoJSON polygon must contain at least one linear ring.");
  }
  return Object.freeze(value.map(linearRing));
}

function geometry(value: AuthoritativeGeoJsonGeometry): AuthoritativeGeoJsonGeometry {
  if (value.type === "Polygon") {
    return Object.freeze({ type: "Polygon" as const, coordinates: polygon(value.coordinates) });
  }
  if (value.type === "MultiPolygon") {
    if (!Array.isArray(value.coordinates) || value.coordinates.length === 0) {
      throw new Error("GeoJSON multipolygon must contain at least one polygon.");
    }
    return Object.freeze({
      type: "MultiPolygon" as const,
      coordinates: Object.freeze(value.coordinates.map(polygon)),
    });
  }
  throw new Error("Authoritative locality geometry must be Polygon or MultiPolygon.");
}

export function boundaryPositions(
  value: AuthoritativeGeoJsonGeometry,
): readonly GeographicPosition[] {
  return Object.freeze(
    value.type === "Polygon"
      ? value.coordinates.flatMap((ring) => ring)
      : value.coordinates.flatMap((polygonCoordinates) =>
          polygonCoordinates.flatMap((ring) => ring),
        ),
  );
}

export function calculateBoundaryBounds(
  value: AuthoritativeGeoJsonGeometry,
): GeographyBounds {
  const positions = boundaryPositions(value);
  if (positions.length === 0) throw new Error("Boundary geometry has no positions.");
  const longitudes = positions.map(([longitude]) => longitude);
  const latitudes = positions.map(([, latitude]) => latitude);
  return Object.freeze({
    west: Math.min(...longitudes),
    south: Math.min(...latitudes),
    east: Math.max(...longitudes),
    north: Math.max(...latitudes),
  });
}

function matchesReference(
  actual: BoundaryGeometryProvenance,
  expected: AuthoritativeBoundaryReference,
): boolean {
  return (
    actual.authority === expected.authority &&
    actual.dataset === expected.dataset &&
    actual.vintage === expected.vintage &&
    actual.sourceFeatureId === expected.sourceFeatureId
  );
}

export function createAuthoritativeBoundaryGeometry(
  definition: GeographyDefinition,
  input: CreateAuthoritativeBoundaryGeometryInput,
): AuthoritativeBoundaryGeometry {
  const normalizedGeometry = geometry(input.geometry);
  const retrievedAt = new Date(input.provenance.retrievedAt);
  if (Number.isNaN(retrievedAt.valueOf())) {
    throw new Error("Boundary retrieval time must be a valid date-time.");
  }
  if (
    !Number.isInteger(input.provenance.geometryPrecision) ||
    input.provenance.geometryPrecision < 0 ||
    input.provenance.geometryPrecision > 12
  ) {
    throw new Error("Boundary geometry precision must be an integer between 0 and 12.");
  }
  if (
    !Number.isFinite(input.provenance.maxAllowableOffsetDegrees) ||
    input.provenance.maxAllowableOffsetDegrees < 0 ||
    input.provenance.maxAllowableOffsetDegrees > 1
  ) {
    throw new Error("Boundary generalization offset must be between 0 and 1 degree.");
  }

  const provenance = Object.freeze({
    authority: required(input.provenance.authority, "Boundary authority"),
    dataset: required(input.provenance.dataset, "Boundary dataset"),
    vintage: required(input.provenance.vintage, "Boundary vintage"),
    sourceFeatureId: required(
      input.provenance.sourceFeatureId,
      "Boundary source feature id",
    ),
    sourceLayerUrl: validUrl(input.provenance.sourceLayerUrl, "Boundary source layer URL"),
    queryUrl: validUrl(input.provenance.queryUrl, "Boundary query URL"),
    retrievedAt: retrievedAt.toISOString(),
    coordinateReferenceSystem: input.provenance.coordinateReferenceSystem,
    geometryPrecision: input.provenance.geometryPrecision,
    maxAllowableOffsetDegrees: input.provenance.maxAllowableOffsetDegrees,
    geometrySha256: geometrySha256(input.provenance.geometrySha256),
  });
  if (provenance.coordinateReferenceSystem !== "EPSG:4326") {
    throw new Error("Boundary geometry must use EPSG:4326 longitude/latitude coordinates.");
  }
  if (!matchesReference(provenance, definition.boundary)) {
    throw new Error("Boundary geometry provenance does not match canonical geography metadata.");
  }

  const positions = boundaryPositions(normalizedGeometry);
  return Object.freeze({
    id: boundaryGeometryId(input.id),
    geographyId: definition.id,
    provenance,
    geometry: normalizedGeometry,
    bounds: calculateBoundaryBounds(normalizedGeometry),
    vertexCount: positions.length,
  });
}
