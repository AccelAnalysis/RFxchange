import { ControlledLocalityMapService, type ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map.ts";
import type { ExchangeHomeMarker } from "../../components/map/ExchangeSpatialScene.tsx";
import { projectPublicOrganizationMarker } from "../../domain/organization-markers/model.ts";
import type { ParticipantRouteResolution } from "../auth/participant-route-runtime.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { createFirestoreOrganizationLocationRepositories } from "../firestore/organization-location.ts";
import { createFirestoreOrganizationMarkerRepositories } from "../firestore/organization-marker.ts";
import { createServerFirestoreFoundationRepositories, getServerFirestore } from "../firestore/runtime.ts";
import { TigerWebBoundarySnapshotRepository } from "./tigerweb-boundary-snapshot.ts";

type AuthorizedParticipant = Extract<ParticipantRouteResolution, { readonly kind: "authorized" }>;

export interface AuthenticatedMapProjection {
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
  const location = await locationRepositories.locations.getByOrganizationId(access.membership.organizationId);
  if (!location) return null;

  const [geography, markerActivation, profile, selection] = await Promise.all([
    geographyRepositories.definitions.getById(location.geographyId),
    createFirestoreOrganizationMarkerRepositories(db).activations.getByOrganizationId(access.membership.organizationId),
    foundation.organizations.profiles.getByOrganizationId(access.membership.organizationId),
    geographyRepositories.selections.getByUserId(access.context.user.id),
  ]);
  if (!geography || !selection || selection.geographyId !== geography.id || markerActivation?.status !== "active") {
    return null;
  }

  const boundaries = new TigerWebBoundarySnapshotRepository(geographyRepositories.definitions);
  const boundary = await boundaries.getByGeographyId(geography.id);
  if (!boundary) return null;
  const model = await new ControlledLocalityMapService(
    geographyRepositories.definitions,
    boundaries,
  ).create(selection);
  const marker = projectPublicOrganizationMarker({
    activation: markerActivation,
    location,
    geography,
    geographyGeometry: boundary.geometry,
  });

  return Object.freeze({
    model,
    homeMarker: Object.freeze({
      id: marker.id,
      coordinate: marker.coordinate,
      label: profile?.displayName ?? "Your organization",
      accessibleLocationLabel: marker.accessibleLocationLabel,
    }),
  });
}
