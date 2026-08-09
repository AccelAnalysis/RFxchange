import { ControlledLocalityMapService, type ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map.ts";
import type { ExchangeHomeMarker } from "../../components/map/ExchangeSpatialScene.tsx";
import { projectPublicOrganizationMarker } from "../../domain/organization-markers/model.ts";
import type { ParticipantRouteResolution } from "../auth/participant-route-runtime.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { createFirestoreOrganizationLocationRepositories } from "../firestore/organization-location.ts";
import { createFirestoreOrganizationMarkerRepositories } from "../firestore/organization-marker.ts";
import { createServerFirestoreFoundationRepositories, getServerFirestore } from "../firestore/runtime.ts";
import { measureServerOperation } from "../observability/server-timing.ts";
import { TigerWebBoundarySnapshotRepository } from "./tigerweb-boundary-snapshot.ts";

type AuthorizedParticipant = Extract<ParticipantRouteResolution, { readonly kind: "authorized" }>;

export interface AuthenticatedMapProjection {
  readonly organizationId: string;
  readonly model: ControlledLocalityMapModel;
  readonly homeMarker: ExchangeHomeMarker;
}

export async function loadAuthorizedParticipantMapProjection(
  access: AuthorizedParticipant,
): Promise<AuthenticatedMapProjection | null> {
  const db = getServerFirestore();
  const foundation = createServerFirestoreFoundationRepositories(db);
  const geographyRepositories = createFirestoreGeographyRepositories(db);
  const locationRepositories = createFirestoreOrganizationLocationRepositories(db);
  const organizationId = access.membership.organizationId;
  const location = await measureServerOperation(
    "map-model.firestore-location",
    () => locationRepositories.locations.getByOrganizationId(organizationId),
    "participant home location",
  );
  if (!location) return null;

  const [geography, markerActivation, profile, selection] = await measureServerOperation(
    "map-model.firestore-projection",
    () => Promise.all([
      geographyRepositories.definitions.getById(location.geographyId),
      createFirestoreOrganizationMarkerRepositories(db).activations.getByOrganizationId(organizationId),
      foundation.organizations.profiles.getByOrganizationId(organizationId),
      geographyRepositories.selections.getByUserId(access.context.user.id),
    ]),
    "geography + marker + profile + selection",
  );
  if (!geography || !selection || selection.geographyId !== geography.id || markerActivation?.status !== "active") {
    return null;
  }

  const boundaries = new TigerWebBoundarySnapshotRepository(geographyRepositories.definitions);
  const boundary = await measureServerOperation(
    "map-model.boundary",
    () => boundaries.getByGeographyId(geography.id),
    "authoritative locality boundary",
  );
  if (!boundary) return null;
  const model = await measureServerOperation(
    "map-model",
    () => new ControlledLocalityMapService(
      geographyRepositories.definitions,
      boundaries,
    ).create(selection),
    "participant controlled locality projection",
  );
  const marker = projectPublicOrganizationMarker({
    activation: markerActivation,
    location,
    geography,
    geographyGeometry: boundary.geometry,
  });

  return Object.freeze({
    organizationId,
    model,
    homeMarker: Object.freeze({
      id: marker.id,
      coordinate: marker.coordinate,
      label: profile?.displayName ?? "Your organization",
      accessibleLocationLabel: marker.accessibleLocationLabel,
    }),
  });
}
