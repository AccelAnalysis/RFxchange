import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  MapboxLocalityCanvas,
  type ControlledLocalityPointOverlay,
} from "@/src/components/map/MapboxLocalityCanvas";
import {
  ParticipantShell,
  SpatialWorkspace,
} from "@/src/components/participant/ParticipantWorkspace";
import { createControlledLocalityPreview } from "@/src/data/geography/portsmouth-controlled-locality-preview";
import { HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS } from "@/src/data/geography/hampton-roads-controlled-locality";
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
  readonly homeGeographyId: string;
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

  const [geography, markerActivation, profile] = await Promise.all([
    geographyRepositories.definitions.getById(location.geographyId),
    createFirestoreOrganizationMarkerRepositories(db).activations.getByOrganizationId(
      access.membership.organizationId,
    ),
    foundation.organizations.profiles.getByOrganizationId(access.membership.organizationId),
  ]);
  if (!geography || markerActivation?.status !== "active") redirect("/join");

  const boundary = await new TigerWebBoundarySnapshotRepository(
    geographyRepositories.definitions,
  ).getByGeographyId(geography.id);
  if (!boundary) redirect("/join");

  const marker = projectPublicOrganizationMarker({
    activation: markerActivation,
    location,
    geography,
    geographyGeometry: boundary.geometry,
  });

  return Object.freeze({
    homeGeographyId: String(location.geographyId),
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
  const bundledHomeGeographyId = HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS.some(
    (definition) => definition.id === authenticated.homeGeographyId,
  )
    ? authenticated.homeGeographyId
    : undefined;
  const model = await createControlledLocalityPreview(bundledHomeGeographyId);
  const pointOverlays = Object.freeze([authenticated.markerOverlay]);

  return (
    <ParticipantShell activeItem="Intelligence">
      <SpatialWorkspace ariaLabel="RFxchange Intelligence geographic workspace">
        <MapboxLocalityCanvas
          model={model}
          initialZoom="locality"
          mobileControlPosition="bottom"
          pointOverlays={pointOverlays}
        />
      </SpatialWorkspace>
    </ParticipantShell>
  );
}
