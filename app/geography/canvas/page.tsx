import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ControlledLocalityMapService, type ControlledLocalityMapModel } from "@/src/application/geography/controlled-locality-map";
import {
  MapboxLocalityCanvas,
  type ControlledLocalityPointOverlay,
} from "@/src/components/map/MapboxLocalityCanvas";
import {
  ParticipantShell,
  SpatialWorkspace,
} from "@/src/components/participant/ParticipantWorkspace";
import { projectPublicOrganizationMarker } from "@/src/domain/organization-markers/model";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { createFirestoreGeographyRepositories } from "@/src/infrastructure/firestore/geography-repositories";
import { createFirestoreOrganizationLocationRepositories } from "@/src/infrastructure/firestore/organization-location";
import { createFirestoreOrganizationMarkerRepositories } from "@/src/infrastructure/firestore/organization-marker";
import {
  createServerFirestoreFoundationRepositories,
  getServerFirestore,
} from "@/src/infrastructure/firestore/runtime";
import { TigerWebBoundarySnapshotRepository } from "@/src/infrastructure/geography/tigerweb-boundary-snapshot";

interface GeographyCanvasPageProps {
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}

interface AuthenticatedMapProjection {
  readonly model: ControlledLocalityMapModel;
  readonly markerOverlay: ControlledLocalityPointOverlay;
}

function firstSearchParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
    return value[0].trim();
  }
  return null;
}

function signInUrl(requestedOrganizationId: string | null): string {
  const returnTo = requestedOrganizationId
    ? `/geography/canvas?organizationId=${encodeURIComponent(requestedOrganizationId)}`
    : "/geography/canvas";
  return `/signin?returnTo=${encodeURIComponent(returnTo)}`;
}

async function resolveAuthenticatedMapProjection(
  requestedOrganizationId: string | null,
): Promise<AuthenticatedMapProjection> {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
    requestedOrganizationId,
  });

  if (access.kind === "unauthenticated") redirect(signInUrl(requestedOrganizationId));
  if (access.kind === "activation-required") redirect("/join");
  if (access.kind === "wrong-organization") {
    redirect(access.state.controlledPlatformUrl ?? "/join");
  }
  if (access.kind === "restricted") {
    redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  }

  const db = getServerFirestore();
  const foundation = createServerFirestoreFoundationRepositories(db);
  const geographyRepositories = createFirestoreGeographyRepositories(db);
  const locationRepositories = createFirestoreOrganizationLocationRepositories(db);
  const location = await locationRepositories.locations.getByOrganizationId(
    access.membership.organizationId,
  );
  if (!location) redirect("/join");

  const [geography, markerActivation, profile, selection] = await Promise.all([
    geographyRepositories.definitions.getById(location.geographyId),
    createFirestoreOrganizationMarkerRepositories(db).activations.getByOrganizationId(
      access.membership.organizationId,
    ),
    foundation.organizations.profiles.getByOrganizationId(access.membership.organizationId),
    geographyRepositories.selections.getByUserId(access.context.user.id),
  ]);
  if (!geography || !selection || selection.geographyId !== geography.id || markerActivation?.status !== "active") {
    redirect("/join");
  }

  const boundaries = new TigerWebBoundarySnapshotRepository(geographyRepositories.definitions);
  const boundary = await boundaries.getByGeographyId(geography.id);
  if (!boundary) redirect("/join");
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
    markerOverlay: Object.freeze({
      id: marker.id,
      position: marker.coordinate,
      label: profile?.displayName ?? "Your organization",
      kind: "organization-marker" as const,
      privacyLabel: marker.accessibleLocationLabel,
      activated: true,
    }),
  });
}

export default async function GeographyCanvasPage({
  searchParams,
}: GeographyCanvasPageProps) {
  const params = searchParams ? await searchParams : {};
  const requestedOrganizationId = firstSearchParam(params.organizationId);
  const authenticated = await resolveAuthenticatedMapProjection(requestedOrganizationId);
  const pointOverlays = Object.freeze([authenticated.markerOverlay]);

  return (
    <ParticipantShell activeItem="Intelligence">
      <SpatialWorkspace ariaLabel="RFxchange Intelligence geographic workspace">
        <MapboxLocalityCanvas
          model={authenticated.model}
          initialZoom="locality"
          mobileControlPosition="bottom"
          pointOverlays={pointOverlays}
        />
      </SpatialWorkspace>
    </ParticipantShell>
  );
}
