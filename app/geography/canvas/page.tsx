import { cookies } from "next/headers";

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
} from "@/src/infrastructure/auth/firebase-server-session";
import { createServerAuthenticationBoundary } from "@/src/infrastructure/auth/firebase-session-runtime";
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
  readonly homeGeographyId: string | null;
  readonly markerOverlay: ControlledLocalityPointOverlay | null;
}

function firstSearchParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
    return value[0].trim();
  }
  return null;
}

async function resolveAuthenticatedMapProjection(
  requestedOrganizationId: string | null,
): Promise<AuthenticatedMapProjection> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return Object.freeze({ homeGeographyId: null, markerOverlay: null });
  }

  try {
    const context = await createServerAuthenticationBoundary().authenticateSessionCookie({
      sessionCookie,
      now: new Date().toISOString(),
    });
    const db = getServerFirestore();
    const foundation = createServerFirestoreFoundationRepositories(db);
    const memberships = await foundation.users.memberships.listActiveByUserId(context.user.id);

    const membership = requestedOrganizationId
      ? memberships.find((candidate) => candidate.organizationId === requestedOrganizationId)
      : memberships.length === 1
        ? memberships[0]
        : null;

    const geographyRepositories = createFirestoreGeographyRepositories(db);
    if (membership) {
      const locationRepositories = createFirestoreOrganizationLocationRepositories(db);
      const location = await locationRepositories.locations.getByOrganizationId(
        membership.organizationId,
      );
      if (location) {
        const [geography, activation, profile] = await Promise.all([
          geographyRepositories.definitions.getById(location.geographyId),
          createFirestoreOrganizationMarkerRepositories(db).activations.getByOrganizationId(
            membership.organizationId,
          ),
          foundation.organizations.profiles.getByOrganizationId(membership.organizationId),
        ]);
        if (geography && activation?.status === "active") {
          const boundary = await new TigerWebBoundarySnapshotRepository(
            geographyRepositories.definitions,
          ).getByGeographyId(geography.id);
          if (boundary) {
            const marker = projectPublicOrganizationMarker({
              activation,
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
        }
        return Object.freeze({
          homeGeographyId: String(location.geographyId),
          markerOverlay: null,
        });
      }
    }

    const primarySelection = await geographyRepositories.selections.getByUserId(context.user.id);
    return Object.freeze({
      homeGeographyId: primarySelection ? String(primarySelection.geographyId) : null,
      markerOverlay: null,
    });
  } catch {
    // The map remains usable as a preview even when local auth/Firebase is not configured.
    return Object.freeze({ homeGeographyId: null, markerOverlay: null });
  }
}

export default async function GeographyCanvasPage({
  searchParams,
}: GeographyCanvasPageProps) {
  const params = searchParams ? await searchParams : {};
  const requestedOrganizationId = firstSearchParam(params.organizationId);
  const authenticated = await resolveAuthenticatedMapProjection(requestedOrganizationId);
  const bundledHomeGeographyId = authenticated.homeGeographyId &&
    HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS.some(
      (definition) => definition.id === authenticated.homeGeographyId,
    )
    ? authenticated.homeGeographyId
    : undefined;
  const model = await createControlledLocalityPreview(bundledHomeGeographyId);
  const pointOverlays = authenticated.markerOverlay
    ? Object.freeze([authenticated.markerOverlay])
    : Object.freeze([] as ControlledLocalityPointOverlay[]);

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
