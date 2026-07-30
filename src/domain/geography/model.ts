import type { AccessJourneyId } from "../lifecycle/model";
import type { OrganizationId } from "../organizations/model";
import type { UserId } from "../users/model";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type GeographyId = Brand<string, "GeographyId">;
export type FipsCode = Brand<string, "FipsCode">;
export type GeographyParticipationAuthorizationId = Brand<
  string,
  "GeographyParticipationAuthorizationId"
>;
export type GeographyTimestamp = Brand<string, "GeographyTimestamp">;

export const GEOGRAPHY_TYPES = [
  "county",
  "county-equivalent",
  "independent-city",
  "municipality",
  "state",
  "region",
  "other",
] as const;

export type GeographyType = (typeof GEOGRAPHY_TYPES)[number];

export const GEOGRAPHY_RELEASE_STATES = [
  "released",
  "visible-unreleased",
  "limited",
  "restricted",
] as const;

export type GeographyReleaseState = (typeof GEOGRAPHY_RELEASE_STATES)[number];

export const GEOGRAPHY_PARTICIPATION_ACTIVITIES = [
  "primary-geography-selection",
  "orientation",
  "organization-activation",
  "network-participation",
] as const;

export type GeographyParticipationActivity =
  (typeof GEOGRAPHY_PARTICIPATION_ACTIVITIES)[number];

export interface GeographyBounds {
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
}

export interface GeographyDefaultCamera {
  readonly center: Readonly<{
    readonly longitude: number;
    readonly latitude: number;
  }>;
  readonly pitchDegrees: number;
  readonly bearingDegrees: number;
  readonly paddingPixels: number;
  readonly maximumZoom: number;
}

export interface AuthoritativeBoundaryReference {
  readonly authority: string;
  readonly dataset: string;
  readonly vintage: string;
  readonly sourceFeatureId: string;
}

export interface GeographyDefinition {
  readonly id: GeographyId;
  readonly countryCode: string;
  readonly fipsCode: FipsCode | null;
  readonly name: string;
  readonly type: GeographyType;
  readonly boundary: AuthoritativeBoundaryReference;
  readonly releaseState: GeographyReleaseState;
  readonly limitedParticipationActivities: readonly GeographyParticipationActivity[];
  readonly parentGeographyId: GeographyId | null;
  readonly adjacentGeographyIds: readonly GeographyId[];
  readonly bounds: GeographyBounds;
  readonly defaultCamera: GeographyDefaultCamera;
  readonly createdAt: GeographyTimestamp;
  readonly updatedAt: GeographyTimestamp;
}

export interface CreateGeographyDefinitionInput {
  readonly id: string;
  readonly countryCode: string;
  readonly fipsCode?: string | null;
  readonly name: string;
  readonly type: string;
  readonly boundary: Readonly<{
    readonly authority: string;
    readonly dataset: string;
    readonly vintage: string;
    readonly sourceFeatureId: string;
  }>;
  readonly releaseState: string;
  readonly limitedParticipationActivities?: readonly string[];
  readonly parentGeographyId?: string | null;
  readonly adjacentGeographyIds?: readonly string[];
  readonly bounds: GeographyBounds;
  readonly defaultCamera: GeographyDefaultCamera;
  readonly now: string;
}

export interface PrimaryOperatingGeographySelection {
  readonly userId: UserId;
  readonly accessJourneyId: AccessJourneyId;
  readonly geographyId: GeographyId;
  readonly selectedAt: GeographyTimestamp;
  readonly updatedAt: GeographyTimestamp;
}

export type GeographyParticipationSubject =
  | Readonly<{ readonly kind: "user"; readonly userId: UserId }>
  | Readonly<{ readonly kind: "organization"; readonly organizationId: OrganizationId }>;

export type GeographyParticipationAuthorizationStatus = "active" | "revoked";

export interface GeographyParticipationAuthorization {
  readonly id: GeographyParticipationAuthorizationId;
  readonly geographyId: GeographyId;
  readonly subject: GeographyParticipationSubject;
  readonly activities: readonly GeographyParticipationActivity[];
  readonly status: GeographyParticipationAuthorizationStatus;
  readonly issuedAt: GeographyTimestamp;
  readonly expiresAt: GeographyTimestamp | null;
  readonly updatedAt: GeographyTimestamp;
}

export interface CreateGeographyParticipationAuthorizationInput {
  readonly id: string;
  readonly subject: GeographyParticipationSubject;
  readonly activities: readonly string[];
  readonly status?: GeographyParticipationAuthorizationStatus;
  readonly expiresAt?: string | null;
  readonly now: string;
}

export interface GeographyCameraPlan {
  readonly mode: "fit-authoritative-bounds";
  readonly geographyId: GeographyId;
  readonly bounds: GeographyBounds;
  readonly center: GeographyDefaultCamera["center"];
  readonly pitchDegrees: number;
  readonly bearingDegrees: number;
  readonly paddingPixels: number;
  readonly maximumZoom: number;
}

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function geographyTimestamp(value: string): GeographyTimestamp {
  const normalized = requiredValue(value, "Geography timestamp");
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) {
    throw new Error("Geography timestamp must be a valid ISO-compatible date-time value.");
  }
  return new Date(parsed).toISOString() as GeographyTimestamp;
}

function finiteCoordinate(value: number, minimum: number, maximum: number, field: string): number {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${field} must be between ${minimum} and ${maximum}.`);
  }
  return value;
}

function boundedNumber(value: number, minimum: number, maximum: number, field: string): number {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${field} must be between ${minimum} and ${maximum}.`);
  }
  return value;
}

export function geographyId(value: string): GeographyId {
  const normalized = requiredValue(value, "Geography id").toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{1,95}$/.test(normalized)) {
    throw new Error("Geography id must be a stable lowercase identifier.");
  }
  return normalized as GeographyId;
}

export function fipsCode(value: string): FipsCode {
  const normalized = requiredValue(value, "FIPS code");
  if (!/^(?:\d{2}|\d{5}|\d{7})$/.test(normalized)) {
    throw new Error("FIPS code must contain 2, 5, or 7 digits.");
  }
  return normalized as FipsCode;
}

export function geographyType(value: string): GeographyType {
  if (!GEOGRAPHY_TYPES.includes(value as GeographyType)) {
    throw new Error(`Unsupported geography type: ${value}.`);
  }
  return value as GeographyType;
}

export function geographyReleaseState(value: string): GeographyReleaseState {
  if (!GEOGRAPHY_RELEASE_STATES.includes(value as GeographyReleaseState)) {
    throw new Error(`Unsupported geography release state: ${value}.`);
  }
  return value as GeographyReleaseState;
}

export function geographyParticipationActivity(value: string): GeographyParticipationActivity {
  if (!GEOGRAPHY_PARTICIPATION_ACTIVITIES.includes(value as GeographyParticipationActivity)) {
    throw new Error(`Unsupported geography participation activity: ${value}.`);
  }
  return value as GeographyParticipationActivity;
}

function geographyBounds(value: GeographyBounds): GeographyBounds {
  const west = finiteCoordinate(value.west, -180, 180, "West longitude");
  const east = finiteCoordinate(value.east, -180, 180, "East longitude");
  const south = finiteCoordinate(value.south, -90, 90, "South latitude");
  const north = finiteCoordinate(value.north, -90, 90, "North latitude");
  if (west >= east) throw new Error("Geography bounds west must be less than east.");
  if (south >= north) throw new Error("Geography bounds south must be less than north.");
  return Object.freeze({ west, south, east, north });
}

function defaultCamera(
  value: GeographyDefaultCamera,
  bounds: GeographyBounds,
): GeographyDefaultCamera {
  const longitude = finiteCoordinate(
    value.center.longitude,
    -180,
    180,
    "Camera center longitude",
  );
  const latitude = finiteCoordinate(value.center.latitude, -90, 90, "Camera center latitude");
  if (
    longitude < bounds.west ||
    longitude > bounds.east ||
    latitude < bounds.south ||
    latitude > bounds.north
  ) {
    throw new Error("Default camera center must fall within geography bounds.");
  }
  return Object.freeze({
    center: Object.freeze({ longitude, latitude }),
    pitchDegrees: boundedNumber(value.pitchDegrees, 0, 85, "Camera pitch"),
    bearingDegrees: boundedNumber(value.bearingDegrees, -180, 180, "Camera bearing"),
    paddingPixels: boundedNumber(value.paddingPixels, 0, 500, "Camera padding"),
    maximumZoom: boundedNumber(value.maximumZoom, 0, 24, "Camera maximum zoom"),
  });
}

function normalizedActivities(values: readonly string[]): readonly GeographyParticipationActivity[] {
  return Object.freeze([...new Set(values.map(geographyParticipationActivity))]);
}

export function createGeographyDefinition(
  input: CreateGeographyDefinitionInput,
): GeographyDefinition {
  const id = geographyId(input.id);
  const releaseState = geographyReleaseState(input.releaseState);
  const activities = normalizedActivities(input.limitedParticipationActivities ?? []);
  if (releaseState === "limited" && activities.length === 0) {
    throw new Error("Limited geography must declare at least one permitted activity.");
  }
  if (releaseState !== "limited" && activities.length > 0) {
    throw new Error("Only a limited geography may declare limited participation activities.");
  }

  const parentGeographyId = input.parentGeographyId
    ? geographyId(input.parentGeographyId)
    : null;
  if (parentGeographyId === id) throw new Error("Geography cannot be its own parent.");

  const adjacentGeographyIds = Object.freeze([
    ...new Set((input.adjacentGeographyIds ?? []).map(geographyId)),
  ]);
  if (adjacentGeographyIds.includes(id)) {
    throw new Error("Geography cannot be adjacent to itself.");
  }

  const bounds = geographyBounds(input.bounds);
  const now = geographyTimestamp(input.now);
  const countryCode = requiredValue(input.countryCode, "Country code").toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    throw new Error("Country code must be an ISO 3166-1 alpha-2 code.");
  }

  return Object.freeze({
    id,
    countryCode,
    fipsCode: input.fipsCode ? fipsCode(input.fipsCode) : null,
    name: requiredValue(input.name, "Geography name"),
    type: geographyType(input.type),
    boundary: Object.freeze({
      authority: requiredValue(input.boundary.authority, "Boundary authority"),
      dataset: requiredValue(input.boundary.dataset, "Boundary dataset"),
      vintage: requiredValue(input.boundary.vintage, "Boundary vintage"),
      sourceFeatureId: requiredValue(
        input.boundary.sourceFeatureId,
        "Boundary source feature id",
      ),
    }),
    releaseState,
    limitedParticipationActivities: activities,
    parentGeographyId,
    adjacentGeographyIds,
    bounds,
    defaultCamera: defaultCamera(input.defaultCamera, bounds),
    createdAt: now,
    updatedAt: now,
  });
}

export function createPrimaryOperatingGeographySelection(
  userId: UserId,
  accessJourneyId: AccessJourneyId,
  geographyId: GeographyId,
  now: string,
  existing: PrimaryOperatingGeographySelection | null = null,
): PrimaryOperatingGeographySelection {
  if (existing && existing.userId !== userId) {
    throw new Error("Primary geography selection belongs to a different user.");
  }
  if (existing && existing.accessJourneyId !== accessJourneyId) {
    throw new Error("Primary geography selection belongs to a different access journey.");
  }
  const timestamp = geographyTimestamp(now);
  return Object.freeze({
    userId,
    accessJourneyId,
    geographyId,
    selectedAt: existing?.selectedAt ?? timestamp,
    updatedAt: timestamp,
  });
}

export function createGeographyParticipationAuthorization(
  geography: GeographyDefinition,
  input: CreateGeographyParticipationAuthorizationInput,
): GeographyParticipationAuthorization {
  const issuedAt = geographyTimestamp(input.now);
  const expiresAt = input.expiresAt ? geographyTimestamp(input.expiresAt) : null;
  if (expiresAt && expiresAt <= issuedAt) {
    throw new Error("Geography participation authorization expiry must follow issuance.");
  }
  const activities = normalizedActivities(input.activities);
  if (activities.length === 0) {
    throw new Error("Geography participation authorization requires at least one activity.");
  }
  return Object.freeze({
    id: requiredValue(
      input.id,
      "Geography participation authorization id",
    ) as GeographyParticipationAuthorizationId,
    geographyId: geography.id,
    subject: Object.freeze({ ...input.subject }),
    activities,
    status: input.status ?? "active",
    issuedAt,
    expiresAt,
    updatedAt: issuedAt,
  });
}

export function resolveGeographyCameraPlan(
  geography: GeographyDefinition,
): GeographyCameraPlan {
  return Object.freeze({
    mode: "fit-authoritative-bounds" as const,
    geographyId: geography.id,
    bounds: geography.bounds,
    center: geography.defaultCamera.center,
    pitchDegrees: geography.defaultCamera.pitchDegrees,
    bearingDegrees: geography.defaultCamera.bearingDegrees,
    paddingPixels: geography.defaultCamera.paddingPixels,
    maximumZoom: geography.defaultCamera.maximumZoom,
  });
}
