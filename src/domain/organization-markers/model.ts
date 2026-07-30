import type { AuthoritativeGeoJsonGeometry, GeographicPosition } from "../geography/boundary.ts";
import type {
  GeographyDefinition,
  GeographyParticipationDecision,
} from "../geography/index.ts";
import type { AccessRestrictionRecord } from "../lifecycle/model.ts";
import {
  geographicPosition,
  geographicPositionWithinBoundary,
  projectPublicOrganizationLocation,
  type ConfirmedOrganizationLocation,
} from "../organization-location/model.ts";
import type { OrganizationProfileCompletion } from "../organization-profile/model.ts";
import {
  organizationId,
  type OrganizationAccount,
  type OrganizationId,
} from "../organizations/model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type OrganizationMarkerActivationId =
  Brand<string, "OrganizationMarkerActivationId">;
export type OrganizationMarkerEventId = Brand<string, "OrganizationMarkerEventId">;
export type OrganizationMarkerTimestamp = Brand<string, "OrganizationMarkerTimestamp">;

export const ORGANIZATION_MARKER_BLOCKING_REASONS = [
  "relationship-authority-missing",
  "geography-participation-denied",
  "confirmed-location-missing",
  "profile-incomplete",
  "organization-blocked",
] as const;

export type OrganizationMarkerBlockingReason =
  (typeof ORGANIZATION_MARKER_BLOCKING_REASONS)[number];

export interface OrganizationMarkerActivation {
  /** One current aggregate per organization; the stable id equals organizationId. */
  readonly id: OrganizationMarkerActivationId;
  readonly organizationId: OrganizationId;
  readonly geographyId: GeographyDefinition["id"];
  readonly status: "active" | "inactive";
  readonly coordinateSource: "confirmed-canonical-location";
  readonly blockingReasons: readonly OrganizationMarkerBlockingReason[];
  readonly sourceLocationUpdatedAt: string | null;
  readonly sourceProfileCompletionEvaluatedAt: string | null;
  readonly firstActivatedAt: OrganizationMarkerTimestamp | null;
  readonly lastTransitionAt: OrganizationMarkerTimestamp;
  readonly evaluatedAt: OrganizationMarkerTimestamp;
}

export interface OrganizationMarkerEvent {
  readonly id: OrganizationMarkerEventId;
  readonly organizationId: OrganizationId;
  readonly geographyId: GeographyDefinition["id"];
  readonly kind: "marker-activated" | "marker-deactivated";
  readonly priorStatus: OrganizationMarkerActivation["status"] | null;
  readonly newStatus: OrganizationMarkerActivation["status"];
  readonly blockingReasons: readonly OrganizationMarkerBlockingReason[];
  readonly reason: string;
  readonly occurredAt: OrganizationMarkerTimestamp;
}

export interface PublicOrganizationMarker {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly geographyId: GeographyDefinition["id"];
  readonly coordinate: GeographicPosition;
  readonly privacyTreatment: "exact" | "approximate" | "locality-presence";
  readonly accessibleLocationLabel: string;
}

function required(value: string, label: string, maximum = 600): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maximum) throw new Error(`${label} exceeds ${maximum} characters.`);
  return normalized;
}

function timestamp(value: string): OrganizationMarkerTimestamp {
  const parsed = Date.parse(required(value, "Organization marker timestamp", 64));
  if (!Number.isFinite(parsed)) {
    throw new Error("Organization marker timestamp must be a valid date-time.");
  }
  return new Date(parsed).toISOString() as OrganizationMarkerTimestamp;
}

function stableId<T extends string>(value: string, label: string): T {
  const normalized = required(value, label, 191);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/.test(normalized)) {
    throw new Error(`${label} must be a stable identifier.`);
  }
  return normalized as T;
}

export function organizationMarkerActivationId(
  value: string,
): OrganizationMarkerActivationId {
  return stableId<OrganizationMarkerActivationId>(
    value,
    "Organization marker activation id",
  );
}

export function organizationMarkerEventId(value: string): OrganizationMarkerEventId {
  return stableId<OrganizationMarkerEventId>(value, "Organization marker event id");
}

function isOrganizationBlocked(
  restriction: AccessRestrictionRecord | null,
  organizationId: OrganizationId,
): boolean {
  if (!restriction || restriction.state === "none") return false;
  if (
    restriction.target.kind !== "organization" ||
    restriction.target.organizationId !== organizationId
  ) {
    throw new Error("Marker restriction belongs to a different organization.");
  }
  return true;
}

export function evaluateOrganizationMarkerActivation(input: Readonly<{
  organization: OrganizationAccount;
  relationshipAuthorized: boolean;
  geography: GeographyDefinition;
  participation: GeographyParticipationDecision;
  location: ConfirmedOrganizationLocation | null;
  profileCompletion: OrganizationProfileCompletion | null;
  restriction: AccessRestrictionRecord | null;
  prior?: OrganizationMarkerActivation | null;
  now: string;
}>): OrganizationMarkerActivation {
  const organization = organizationId(input.organization.id);
  if (input.location && input.location.organizationId !== organization) {
    throw new Error("Marker location belongs to a different organization.");
  }
  if (
    input.profileCompletion &&
    input.profileCompletion.organizationId !== organization
  ) {
    throw new Error("Marker profile completion belongs to a different organization.");
  }
  if (input.location && input.location.geographyId !== input.geography.id) {
    throw new Error("Marker location does not belong to the governing geography.");
  }
  if (input.prior && input.prior.organizationId !== organization) {
    throw new Error("Prior marker activation belongs to a different organization.");
  }

  const blockingReasons: OrganizationMarkerBlockingReason[] = [];
  if (!input.relationshipAuthorized) {
    blockingReasons.push("relationship-authority-missing");
  }
  if (!input.participation.allowed) {
    blockingReasons.push("geography-participation-denied");
  }
  if (!input.location) blockingReasons.push("confirmed-location-missing");
  if (input.profileCompletion?.status !== "active") {
    blockingReasons.push("profile-incomplete");
  }
  if (isOrganizationBlocked(input.restriction, organization)) {
    blockingReasons.push("organization-blocked");
  }

  const evaluatedAt = timestamp(input.now);
  const status = blockingReasons.length === 0 ? "active" as const : "inactive" as const;
  const priorStatus = input.prior?.status ?? null;
  return Object.freeze({
    id: organizationMarkerActivationId(organization),
    organizationId: organization,
    geographyId: input.geography.id,
    status,
    coordinateSource: "confirmed-canonical-location" as const,
    blockingReasons: Object.freeze(blockingReasons),
    sourceLocationUpdatedAt: input.location?.updatedAt ?? null,
    sourceProfileCompletionEvaluatedAt:
      input.profileCompletion?.evaluatedAt ?? null,
    firstActivatedAt:
      input.prior?.firstActivatedAt ??
      (status === "active" ? evaluatedAt : null),
    lastTransitionAt:
      input.prior && priorStatus === status
        ? input.prior.lastTransitionAt
        : evaluatedAt,
    evaluatedAt,
  });
}

export function createOrganizationMarkerEvent(input: Readonly<{
  id: string;
  activation: OrganizationMarkerActivation;
  priorStatus?: OrganizationMarkerActivation["status"] | null;
  reason: string;
  now: string;
}>): OrganizationMarkerEvent {
  const priorStatus = input.priorStatus ?? null;
  if (priorStatus === input.activation.status) {
    throw new Error("Marker events are only created for lifecycle transitions.");
  }
  return Object.freeze({
    id: organizationMarkerEventId(input.id),
    organizationId: input.activation.organizationId,
    geographyId: input.activation.geographyId,
    kind:
      input.activation.status === "active"
        ? "marker-activated" as const
        : "marker-deactivated" as const,
    priorStatus,
    newStatus: input.activation.status,
    blockingReasons: input.activation.blockingReasons,
    reason: required(input.reason, "Organization marker event reason"),
    occurredAt: timestamp(input.now),
  });
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Produces a locality-derived point without reading the private canonical coordinate.
 * Candidate points are bounded around the canonical locality camera center and checked
 * against the authoritative locality geometry.
 */
export function localityPresenceCoordinate(
  organizationId: OrganizationId,
  geography: GeographyDefinition,
  geometry: AuthoritativeGeoJsonGeometry,
): GeographicPosition {
  const center = geographicPosition([
    geography.defaultCamera.center.longitude,
    geography.defaultCamera.center.latitude,
  ]);
  const longitudeRadius = (geography.bounds.east - geography.bounds.west) * 0.12;
  const latitudeRadius = (geography.bounds.north - geography.bounds.south) * 0.12;
  const hash = stableHash(`${organizationId}:${geography.id}:locality-presence`);

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const phase = ((hash % 360) + attempt * 137.508) * (Math.PI / 180);
    const radius = 0.2 + (attempt % 6) * 0.11;
    const candidate = geographicPosition([
      center[0] + Math.cos(phase) * longitudeRadius * radius,
      center[1] + Math.sin(phase) * latitudeRadius * radius,
    ]);
    if (geographicPositionWithinBoundary(candidate, geometry)) return candidate;
  }
  if (!geographicPositionWithinBoundary(center, geometry)) {
    throw new Error("Canonical locality camera center must fall within its authoritative boundary.");
  }
  return center;
}

export function projectPublicOrganizationMarker(input: Readonly<{
  activation: OrganizationMarkerActivation;
  location: ConfirmedOrganizationLocation;
  geography: GeographyDefinition;
  geographyGeometry: AuthoritativeGeoJsonGeometry;
}>): PublicOrganizationMarker {
  if (input.activation.status !== "active") {
    throw new Error("Only an active organization marker may be projected publicly.");
  }
  if (
    input.activation.organizationId !== input.location.organizationId ||
    input.activation.organizationId !== organizationId(input.location.organizationId) ||
    input.activation.geographyId !== input.geography.id
  ) {
    throw new Error("Public marker inputs do not share one organization/geography scope.");
  }
  const locationProjection = projectPublicOrganizationLocation(
    input.location,
    input.geography,
  );
  if (locationProjection.visibility === "locality-only") {
    return Object.freeze({
      id: `organization-marker:${input.activation.organizationId}`,
      organizationId: input.activation.organizationId,
      geographyId: input.geography.id,
      coordinate: localityPresenceCoordinate(
        input.activation.organizationId,
        input.geography,
        input.geographyGeometry,
      ),
      privacyTreatment: "locality-presence" as const,
      accessibleLocationLabel: `${input.geography.name} locality presence; exact location is private`,
    });
  }
  return Object.freeze({
    id: `organization-marker:${input.activation.organizationId}`,
    organizationId: input.activation.organizationId,
    geographyId: input.geography.id,
    coordinate: locationProjection.coordinate,
    privacyTreatment: locationProjection.visibility,
    accessibleLocationLabel:
      locationProjection.visibility === "exact"
        ? `Exact public location in ${input.geography.name}`
        : `Approximate public location in ${input.geography.name}`,
  });
}
