import {
  PHYSICAL_GEOGRAPHY_TYPES,
  acceptedPointFingerprint,
  createGeographyFabricCommand,
  createGeographyFabricEvent,
  createLocationGeographyMembership,
  createLocationGeographyProfile,
  geographyPoint,
  type GeographyDatasetSource,
  type GeographyDerivation,
  type GeographyPoint,
  type LocationGeographyProfile,
  type LocationVisibility,
} from "../../domain/geography-fabric/model.ts";
import type {
  AcceptedPointGeographyResolution,
  LocationProfileMaterializationPacket,
  ResolvedGeographyEntry,
} from "../../domain/geography-fabric/resolver.ts";

export interface AdditionalLocationOverlay {
  readonly entry: ResolvedGeographyEntry;
  readonly datasetSource: GeographyDatasetSource;
  readonly derivation: GeographyDerivation;
  readonly confidence?: number;
}

function uniqueById<T extends Readonly<{ id: string }>>(
  values: readonly T[],
  label: string,
): readonly T[] {
  const byId = new Map<string, T>();
  for (const value of values) {
    const existing = byId.get(value.id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(value)) {
      throw new Error(`${label} ${value.id} conflicts with another supplied record.`);
    }
    byId.set(value.id, value);
  }
  return Object.freeze([...byId.values()]);
}

export function buildLocationProfileMaterialization(input: Readonly<{
  locationId: string;
  organizationId?: string | null;
  operatingGeographyId?: string | null;
  acceptedPoint: GeographyPoint;
  visibility: LocationVisibility;
  profileVersion: number;
  sourceLocationUpdatedAt: string;
  resolution: AcceptedPointGeographyResolution;
  additionalOverlays?: readonly AdditionalLocationOverlay[];
  commandId: string;
  eventId: string;
  requestFingerprint: string;
  actorUserId?: string | null;
  actorMembershipId?: string | null;
  existingProfile?: LocationGeographyProfile | null;
}>): LocationProfileMaterializationPacket {
  const acceptedPoint = geographyPoint(input.acceptedPoint);
  const fingerprint = acceptedPointFingerprint(acceptedPoint);
  if (
    input.resolution.acceptedPointFingerprint !== fingerprint
    || acceptedPointFingerprint(input.resolution.acceptedPoint) !== fingerprint
  ) {
    throw new Error(
      "Resolved geography does not match the already accepted location coordinate.",
    );
  }

  const additionalOverlays = input.additionalOverlays ?? [];
  for (const overlay of additionalOverlays) {
    if ((PHYSICAL_GEOGRAPHY_TYPES as readonly string[]).includes(overlay.entry.reference.type)) {
      throw new Error("Additional location overlays cannot replace physical containment.");
    }
    if (overlay.entry.version.datasetSourceId !== overlay.datasetSource.id) {
      throw new Error("Additional overlay version must reference its supplied dataset source.");
    }
  }

  const entries = uniqueById(
    [
      ...input.resolution.entries,
      ...additionalOverlays.map((overlay) => overlay.entry),
    ],
    "Resolved geography entry",
  );
  const datasetSources = uniqueById(
    [
      ...input.resolution.datasetSources,
      ...additionalOverlays.map((overlay) => overlay.datasetSource),
    ],
    "Geography dataset source",
  );
  const overlayDerivation = new Map(
    additionalOverlays.map((overlay) => [overlay.entry.version.id, overlay] as const),
  );
  const organizationId = input.organizationId?.trim() || null;
  const memberships = Object.freeze(
    entries.map((entry) => {
      const overlay = overlayDerivation.get(entry.version.id);
      return createLocationGeographyMembership({
        locationId: input.locationId,
        organizationId,
        profileVersion: input.profileVersion,
        reference: entry.reference,
        derivation: overlay?.derivation ?? "accepted-coordinate",
        confidence: overlay?.confidence ?? 1,
        now: input.resolution.resolvedAt,
      });
    }),
  );
  const profile = createLocationGeographyProfile({
    locationId: input.locationId,
    organizationId,
    operatingGeographyId: input.operatingGeographyId,
    profileVersion: input.profileVersion,
    acceptedPoint,
    visibility: input.visibility,
    hierarchy: input.resolution.hierarchy,
    overlays: [
      ...input.resolution.overlays,
      ...additionalOverlays.map((overlay) => overlay.entry.reference),
    ],
    memberships,
    resolver: input.resolution.resolver,
    benchmark: input.resolution.benchmark,
    resolverVintage: input.resolution.vintage,
    sourceLocationUpdatedAt: input.sourceLocationUpdatedAt,
    resolvedAt: input.resolution.resolvedAt,
    existing: input.existingProfile,
  });
  const command = createGeographyFabricCommand({
    id: input.commandId,
    action: "materialize-location-profile",
    organizationId,
    subjectId: profile.id,
    requestFingerprint: input.requestFingerprint,
    actorUserId: input.actorUserId,
    actorMembershipId: input.actorMembershipId,
    recordedAt: input.resolution.resolvedAt,
  });
  const event = createGeographyFabricEvent({
    id: input.eventId,
    kind: "location-profile-materialized",
    organizationId,
    subjectId: profile.id,
    command,
    occurredAt: input.resolution.resolvedAt,
  });

  return Object.freeze({
    datasetSources,
    geographies: Object.freeze(entries.map((entry) => entry.geography)),
    versions: Object.freeze(entries.map((entry) => entry.version)),
    profile,
    memberships,
    command,
    event,
  });
}
