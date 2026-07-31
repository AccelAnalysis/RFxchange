import { cookies } from "next/headers";

import { MapboxLocalityCanvas } from "@/src/components/map/MapboxLocalityCanvas";
import {
  ParticipantShell,
  SpatialWorkspace,
} from "@/src/components/participant/ParticipantWorkspace";
import { createControlledLocalityPreview } from "@/src/data/geography/portsmouth-controlled-locality-preview";
import { HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS } from "@/src/data/geography/hampton-roads-controlled-locality";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
} from "@/src/infrastructure/auth/firebase-server-session";
import { createServerAuthenticationBoundary } from "@/src/infrastructure/auth/firebase-session-runtime";
import { createFirestoreGeographyRepositories } from "@/src/infrastructure/firestore/geography-repositories";
import { createFirestoreOrganizationLocationRepositories } from "@/src/infrastructure/firestore/organization-location";
import {
  createServerFirestoreFoundationRepositories,
  getServerFirestore,
} from "@/src/infrastructure/firestore/runtime";

interface GeographyCanvasPageProps {
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}

function firstSearchParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
    return value[0].trim();
  }
  return null;
}

async function resolveAuthenticatedHomeGeographyId(
  requestedOrganizationId: string | null,
): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

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

    if (membership) {
      const locationRepositories = createFirestoreOrganizationLocationRepositories(db);
      const location = await locationRepositories.locations.getByOrganizationId(
        membership.organizationId,
      );
      if (location) return String(location.geographyId);
    }

    const geographyRepositories = createFirestoreGeographyRepositories(db);
    const primarySelection = await geographyRepositories.selections.getByUserId(context.user.id);
    return primarySelection ? String(primarySelection.geographyId) : null;
  } catch {
    // The map remains usable as a preview even when local auth/Firebase is not configured.
    return null;
  }
}

export default async function GeographyCanvasPage({
  searchParams,
}: GeographyCanvasPageProps) {
  const params = searchParams ? await searchParams : {};
  const requestedOrganizationId = firstSearchParam(params.organizationId);
  const authenticatedHomeGeographyId = await resolveAuthenticatedHomeGeographyId(
    requestedOrganizationId,
  );
  const bundledHomeGeographyId = authenticatedHomeGeographyId &&
    HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS.some(
      (definition) => definition.id === authenticatedHomeGeographyId,
    )
    ? authenticatedHomeGeographyId
    : undefined;
  const model = await createControlledLocalityPreview(bundledHomeGeographyId);

  return (
    <ParticipantShell activeItem="Intelligence">
      <SpatialWorkspace ariaLabel="RFxchange Intelligence geographic workspace">
        <MapboxLocalityCanvas
          model={model}
          initialZoom="locality"
          mobileControlPosition="bottom"
        />
      </SpatialWorkspace>
    </ParticipantShell>
  );
}
