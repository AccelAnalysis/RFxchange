import type {
  AuthoritativeGeoJsonGeometry,
  GeographicPosition,
  GeoJsonLinearRing,
  GeoJsonPolygonCoordinates,
} from "../geography/boundary.ts";
import type { GeographyDefinition, GeographyId } from "../geography/model.ts";
import { geographyId } from "../geography/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import { organizationId } from "../organizations/model.ts";
import type {
  OrganizationMembershipId,
  UserId,
} from "../users/model.ts";
import {
  organizationMembershipId,
  userId,
} from "../users/model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type OrganizationLocationDraftId = Brand<string, "OrganizationLocationDraftId">;
export type OrganizationLocationId = Brand<string, "OrganizationLocationId">;
export type OrganizationLocationEventId = Brand<string, "OrganizationLocationEventId">;
export type OrganizationServiceGeographyId = Brand<string, "OrganizationServiceGeographyId">;
export type OrganizationLocationTimestamp = Brand<string, "OrganizationLocationTimestamp">;

export const LOCATION_VISIBILITY_LEVELS = [
  "exact",
  "approximate",
  "locality-only",
] as const;
export type LocationVisibility = (typeof LOCATION_VISIBILITY_LEVELS)[number];

export const GEOCODE_QUALITY_LEVELS = [
  "rooftop",
  "parcel",
  "address-range",
  "street",
  "locality",
] as const;
export type GeocodeQuality = (typeof GEOCODE_QUALITY_LEVELS)[number];

export interface StructuredPostalAddress {
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly locality: string;
  readonly regionCode: string;
  readonly postalCode: string;
  readonly countryCode: string;
}

export interface GeocodeProvenance {
  readonly provider: string;
  readonly providerReference: string;
  readonly benchmark: string;
  readonly retrievedAt: OrganizationLocationTimestamp;
}

export interface OrganizationGeocodeCandidate {
  readonly id: string;
  readonly geographyId: GeographyId;
  readonly coordinate: GeographicPosition;
  readonly matchedAddress: string;
  readonly quality: GeocodeQuality;
  readonly provenance: GeocodeProvenance;
}

export type OrganizationLocationDraftState = "geocoded" | "confirmed" | "superseded";

export interface OrganizationLocationDraft {
  readonly id: OrganizationLocationDraftId;
  readonly organizationId: OrganizationId;
  readonly requestedByUserId: UserId;
  readonly membershipId: OrganizationMembershipId;
  readonly primaryGeographyId: GeographyId;
  readonly physicalAddress: StructuredPostalAddress;
  readonly mailingAddress: StructuredPostalAddress | null;
  readonly isHomeOrPrivate: boolean;
  readonly visibility: LocationVisibility;
  readonly candidates: readonly OrganizationGeocodeCandidate[];
  readonly selectedCandidateId: string | null;
  readonly state: OrganizationLocationDraftState;
  readonly createdAt: OrganizationLocationTimestamp;
  readonly updatedAt: OrganizationLocationTimestamp;
}

export interface ConfirmedOrganizationLocation {
  /** One current location aggregate per organization; this stable id equals organizationId. */
  readonly id: OrganizationLocationId;
  readonly organizationId: OrganizationId;
  readonly sourceDraftId: OrganizationLocationDraftId;
  readonly geographyId: GeographyId;
  readonly physicalAddress: StructuredPostalAddress;
  readonly mailingAddress: StructuredPostalAddress | null;
  readonly isHomeOrPrivate: boolean;
  readonly visibility: LocationVisibility;
  readonly coordinate: GeographicPosition;
  readonly geocodeQuality: GeocodeQuality;
  readonly geocodeProvenance: GeocodeProvenance;
  readonly confirmedByUserId: UserId;
  readonly confirmedByMembershipId: OrganizationMembershipId;
  readonly confirmedAt: OrganizationLocationTimestamp;
  readonly updatedAt: OrganizationLocationTimestamp;
}

export interface OrganizationServiceGeography {
  /** One current service-geography aggregate per organization; this stable id equals organizationId. */
  readonly id: OrganizationServiceGeographyId;
  readonly organizationId: OrganizationId;
  readonly primaryGeographyId: GeographyId;
  readonly serviceGeographyIds: readonly GeographyId[];
  readonly updatedByUserId: UserId;
  readonly updatedByMembershipId: OrganizationMembershipId;
  readonly updatedAt: OrganizationLocationTimestamp;
}

export type OrganizationLocationEventKind =
  | "address-geocoded"
  | "location-confirmed"
  | "visibility-changed"
  | "service-geographies-changed";

export interface OrganizationLocationEvent {
  readonly id: OrganizationLocationEventId;
  readonly organizationId: OrganizationId;
  readonly actor: Readonly<{
    readonly userId: UserId;
    readonly membershipId: OrganizationMembershipId;
  }>;
  readonly kind: OrganizationLocationEventKind;
  readonly subjectId: string;
  readonly priorState: Readonly<Record<string, unknown>> | null;
  readonly newState: Readonly<Record<string, unknown>>;
  readonly reason: string;
  readonly occurredAt: OrganizationLocationTimestamp;
}

export type PublicOrganizationLocation =
  | Readonly<{
      readonly visibility: "exact";
      readonly organizationId: OrganizationId;
      readonly geographyId: GeographyId;
      readonly localityName: string;
      readonly coordinate: GeographicPosition;
      readonly displayAddress: StructuredPostalAddress;
    }>
  | Readonly<{
      readonly visibility: "approximate";
      readonly organizationId: OrganizationId;
      readonly geographyId: GeographyId;
      readonly localityName: string;
      readonly coordinate: GeographicPosition;
    }>
  | Readonly<{
      readonly visibility: "locality-only";
      readonly organizationId: OrganizationId;
      readonly geographyId: GeographyId;
      readonly localityName: string;
    }>;

function required(value: string, label: string, maximum = 240): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maximum) throw new Error(`${label} exceeds ${maximum} characters.`);
  return normalized;
}

function optional(value: string | null | undefined, label: string, maximum = 240): string | null {
  if (value == null || !value.trim()) return null;
  return required(value, label, maximum);
}

function timestamp(value: string): OrganizationLocationTimestamp {
  const parsed = new Date(required(value, "Location timestamp"));
  if (Number.isNaN(parsed.valueOf())) {
    throw new Error("Location timestamp must be a valid date-time.");
  }
  return parsed.toISOString() as OrganizationLocationTimestamp;
}

function stableId<T extends string>(value: string, label: string): T {
  const normalized = required(value, label, 191);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/.test(normalized)) {
    throw new Error(`${label} must be a stable identifier.`);
  }
  return normalized as T;
}

export function organizationLocationDraftId(value: string): OrganizationLocationDraftId {
  return stableId<OrganizationLocationDraftId>(value, "Organization location draft id");
}

export function organizationLocationId(value: string): OrganizationLocationId {
  return stableId<OrganizationLocationId>(value, "Organization location id");
}

export function organizationLocationEventId(value: string): OrganizationLocationEventId {
  return stableId<OrganizationLocationEventId>(value, "Organization location event id");
}

export function organizationServiceGeographyId(value: string): OrganizationServiceGeographyId {
  return stableId<OrganizationServiceGeographyId>(value, "Organization service geography id");
}

export function locationVisibility(value: string): LocationVisibility {
  if (!LOCATION_VISIBILITY_LEVELS.includes(value as LocationVisibility)) {
    throw new Error(`Unsupported location visibility: ${value}.`);
  }
  return value as LocationVisibility;
}

export function geocodeQuality(value: string): GeocodeQuality {
  if (!GEOCODE_QUALITY_LEVELS.includes(value as GeocodeQuality)) {
    throw new Error(`Unsupported geocode quality: ${value}.`);
  }
  return value as GeocodeQuality;
}

export function geographicPosition(value: readonly [number, number]): GeographicPosition {
  const [longitude, latitude] = value;
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("Longitude must be between -180 and 180.");
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error("Latitude must be between -90 and 90.");
  }
  return Object.freeze([longitude, latitude]);
}

export function structuredPostalAddress(input: Readonly<{
  addressLine1: string;
  addressLine2?: string | null;
  locality: string;
  regionCode: string;
  postalCode: string;
  countryCode?: string;
}>): StructuredPostalAddress {
  const regionCode = required(input.regionCode, "Address region", 8).toUpperCase();
  const postalCode = required(input.postalCode, "Postal code", 16).toUpperCase();
  const countryCode = required(input.countryCode ?? "US", "Country code", 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) throw new Error("Country code must contain two letters.");
  if (!/^[A-Z0-9 -]{3,16}$/.test(postalCode)) throw new Error("Postal code is malformed.");
  return Object.freeze({
    addressLine1: required(input.addressLine1, "Address line 1"),
    addressLine2: optional(input.addressLine2, "Address line 2"),
    locality: required(input.locality, "Address locality", 120),
    regionCode,
    postalCode,
    countryCode,
  });
}

export function defaultLocationVisibility(isHomeOrPrivate: boolean): LocationVisibility {
  return isHomeOrPrivate ? "locality-only" : "approximate";
}

export function createOrganizationGeocodeCandidate(input: Readonly<{
  id: string;
  geographyId: string;
  coordinate: readonly [number, number];
  matchedAddress: string;
  quality: string;
  provider: string;
  providerReference: string;
  benchmark: string;
  retrievedAt: string;
}>): OrganizationGeocodeCandidate {
  return Object.freeze({
    id: stableId<string>(input.id, "Geocode candidate id"),
    geographyId: geographyId(input.geographyId),
    coordinate: geographicPosition(input.coordinate),
    matchedAddress: required(input.matchedAddress, "Matched address", 320),
    quality: geocodeQuality(input.quality),
    provenance: Object.freeze({
      provider: required(input.provider, "Geocode provider", 120),
      providerReference: required(input.providerReference, "Geocode provider reference", 240),
      benchmark: required(input.benchmark, "Geocode benchmark", 160),
      retrievedAt: timestamp(input.retrievedAt),
    }),
  });
}

export function createOrganizationLocationDraft(input: Readonly<{
  id: string;
  organizationId: string;
  requestedByUserId: string;
  membershipId: string;
  primaryGeographyId: string;
  physicalAddress: StructuredPostalAddress;
  mailingAddress?: StructuredPostalAddress | null;
  isHomeOrPrivate: boolean;
  visibility?: string;
  candidates: readonly OrganizationGeocodeCandidate[];
  now: string;
}>): OrganizationLocationDraft {
  if (input.candidates.length === 0) {
    throw new Error("Location draft requires at least one geocode candidate.");
  }
  const primaryGeographyId = geographyId(input.primaryGeographyId);
  if (input.candidates.some((candidate) => candidate.geographyId !== primaryGeographyId)) {
    throw new Error("Every geocode candidate must belong to the selected primary geography.");
  }
  const now = timestamp(input.now);
  return Object.freeze({
    id: organizationLocationDraftId(input.id),
    organizationId: organizationId(input.organizationId),
    requestedByUserId: userId(input.requestedByUserId),
    membershipId: organizationMembershipId(input.membershipId),
    primaryGeographyId,
    physicalAddress: Object.freeze({ ...input.physicalAddress }),
    mailingAddress: input.mailingAddress
      ? Object.freeze({ ...input.mailingAddress })
      : null,
    isHomeOrPrivate: input.isHomeOrPrivate,
    visibility: locationVisibility(
      input.visibility ?? defaultLocationVisibility(input.isHomeOrPrivate),
    ),
    candidates: Object.freeze([...input.candidates]),
    selectedCandidateId: null,
    state: "geocoded" as const,
    createdAt: now,
    updatedAt: now,
  });
}

export function confirmOrganizationLocationDraft(
  draft: OrganizationLocationDraft,
  candidateId: string,
  now: string,
): Readonly<{
  draft: OrganizationLocationDraft;
  candidate: OrganizationGeocodeCandidate;
}> {
  if (draft.state !== "geocoded") throw new Error("Only a geocoded location draft may be confirmed.");
  const candidate = draft.candidates.find((entry) => entry.id === candidateId);
  if (!candidate) throw new Error("Selected geocode candidate does not belong to this draft.");
  return Object.freeze({
    candidate,
    draft: Object.freeze({
      ...draft,
      selectedCandidateId: candidate.id,
      state: "confirmed" as const,
      updatedAt: timestamp(now),
    }),
  });
}

export function createConfirmedOrganizationLocation(input: Readonly<{
  draft: OrganizationLocationDraft;
  candidate: OrganizationGeocodeCandidate;
  confirmedByUserId: string;
  confirmedByMembershipId: string;
  now: string;
}>): ConfirmedOrganizationLocation {
  if (input.draft.state !== "confirmed" || input.draft.selectedCandidateId !== input.candidate.id) {
    throw new Error("Canonical location requires an explicitly confirmed draft candidate.");
  }
  const now = timestamp(input.now);
  return Object.freeze({
    id: organizationLocationId(input.draft.organizationId),
    organizationId: input.draft.organizationId,
    sourceDraftId: input.draft.id,
    geographyId: input.candidate.geographyId,
    physicalAddress: input.draft.physicalAddress,
    mailingAddress: input.draft.mailingAddress,
    isHomeOrPrivate: input.draft.isHomeOrPrivate,
    visibility: input.draft.visibility,
    coordinate: input.candidate.coordinate,
    geocodeQuality: input.candidate.quality,
    geocodeProvenance: input.candidate.provenance,
    confirmedByUserId: userId(input.confirmedByUserId),
    confirmedByMembershipId: organizationMembershipId(input.confirmedByMembershipId),
    confirmedAt: now,
    updatedAt: now,
  });
}

export function changeConfirmedLocationVisibility(
  location: ConfirmedOrganizationLocation,
  visibility: string,
  now: string,
): ConfirmedOrganizationLocation {
  return Object.freeze({
    ...location,
    visibility: locationVisibility(visibility),
    updatedAt: timestamp(now),
  });
}

export function createOrganizationServiceGeography(input: Readonly<{
  organizationId: string;
  primaryGeographyId: string;
  serviceGeographyIds: readonly string[];
  updatedByUserId: string;
  updatedByMembershipId: string;
  now: string;
}>): OrganizationServiceGeography {
  const serviceGeographyIds = Object.freeze([
    ...new Set(input.serviceGeographyIds.map(geographyId)),
  ]);
  if (serviceGeographyIds.length === 0) {
    throw new Error("At least one service geography is required.");
  }
  return Object.freeze({
    id: organizationServiceGeographyId(input.organizationId),
    organizationId: organizationId(input.organizationId),
    primaryGeographyId: geographyId(input.primaryGeographyId),
    serviceGeographyIds,
    updatedByUserId: userId(input.updatedByUserId),
    updatedByMembershipId: organizationMembershipId(input.updatedByMembershipId),
    updatedAt: timestamp(input.now),
  });
}

export function createOrganizationLocationEvent(input: Readonly<{
  id: string;
  organizationId: string;
  userId: string;
  membershipId: string;
  kind: OrganizationLocationEventKind;
  subjectId: string;
  priorState?: Readonly<Record<string, unknown>> | null;
  newState: Readonly<Record<string, unknown>>;
  reason: string;
  now: string;
}>): OrganizationLocationEvent {
  return Object.freeze({
    id: organizationLocationEventId(input.id),
    organizationId: organizationId(input.organizationId),
    actor: Object.freeze({
      userId: userId(input.userId),
      membershipId: organizationMembershipId(input.membershipId),
    }),
    kind: input.kind,
    subjectId: required(input.subjectId, "Location event subject"),
    priorState: input.priorState ? Object.freeze({ ...input.priorState }) : null,
    newState: Object.freeze({ ...input.newState }),
    reason: required(input.reason, "Location event reason", 600),
    occurredAt: timestamp(input.now),
  });
}

function pointInRing(point: GeographicPosition, ring: GeoJsonLinearRing): boolean {
  let inside = false;
  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
    const [currentX, currentY] = ring[current];
    const [previousX, previousY] = ring[previous];
    const crosses =
      currentY > point[1] !== previousY > point[1] &&
      point[0] <
        ((previousX - currentX) * (point[1] - currentY)) /
          (previousY - currentY || Number.EPSILON) +
          currentX;
    if (crosses) inside = !inside;
  }
  return inside;
}

function pointInPolygon(
  point: GeographicPosition,
  coordinates: GeoJsonPolygonCoordinates,
): boolean {
  return pointInRing(point, coordinates[0]) &&
    !coordinates.slice(1).some((hole) => pointInRing(point, hole));
}

export function geographicPositionWithinBoundary(
  point: GeographicPosition,
  geometry: AuthoritativeGeoJsonGeometry,
): boolean {
  return geometry.type === "Polygon"
    ? pointInPolygon(point, geometry.coordinates)
    : geometry.coordinates.some((polygon) => pointInPolygon(point, polygon));
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function approximateCoordinate(
  location: ConfirmedOrganizationLocation,
  geography: GeographyDefinition,
): GeographicPosition {
  const grid = 0.02;
  const hash = stableHash(`${location.organizationId}:${location.geographyId}`);
  const longitudeOffset = (((hash & 0xffff) / 0xffff) - 0.5) * grid * 0.4;
  const latitudeOffset = ((((hash >>> 16) & 0xffff) / 0xffff) - 0.5) * grid * 0.4;
  const longitude =
    Math.floor(location.coordinate[0] / grid) * grid + grid / 2 + longitudeOffset;
  const latitude =
    Math.floor(location.coordinate[1] / grid) * grid + grid / 2 + latitudeOffset;
  return geographicPosition([
    clamp(longitude, geography.bounds.west + 0.001, geography.bounds.east - 0.001),
    clamp(latitude, geography.bounds.south + 0.001, geography.bounds.north - 0.001),
  ]);
}

export function projectPublicOrganizationLocation(
  location: ConfirmedOrganizationLocation,
  geography: GeographyDefinition,
): PublicOrganizationLocation {
  if (location.geographyId !== geography.id) {
    throw new Error("Public location projection geography does not match canonical location.");
  }
  if (location.visibility === "exact") {
    return Object.freeze({
      visibility: "exact" as const,
      organizationId: location.organizationId,
      geographyId: location.geographyId,
      localityName: geography.name,
      coordinate: location.coordinate,
      displayAddress: location.physicalAddress,
    });
  }
  if (location.visibility === "approximate") {
    return Object.freeze({
      visibility: "approximate" as const,
      organizationId: location.organizationId,
      geographyId: location.geographyId,
      localityName: geography.name,
      coordinate: approximateCoordinate(location, geography),
    });
  }
  return Object.freeze({
    visibility: "locality-only" as const,
    organizationId: location.organizationId,
    geographyId: location.geographyId,
    localityName: geography.name,
  });
}
