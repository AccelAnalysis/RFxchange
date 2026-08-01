import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ExchangeSpatialScene,
} from "@/src/components/map/ExchangeSpatialScene";
import {
  ParticipantShell,
  SpatialWorkspace,
} from "@/src/components/participant/ParticipantWorkspace";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { loadAuthorizedParticipantMapProjection } from "@/src/infrastructure/geography/participant-map-runtime";

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

function signInUrl(requestedOrganizationId: string | null): string {
  const returnTo = requestedOrganizationId
    ? `/geography/canvas?organizationId=${encodeURIComponent(requestedOrganizationId)}`
    : "/geography/canvas";
  return `/signin?returnTo=${encodeURIComponent(returnTo)}`;
}

async function resolveAuthenticatedMapProjection(requestedOrganizationId: string | null) {
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

  return await loadAuthorizedParticipantMapProjection(access) ?? redirect("/join");
}

export default async function GeographyCanvasPage({
  searchParams,
}: GeographyCanvasPageProps) {
  const params = searchParams ? await searchParams : {};
  const requestedOrganizationId = firstSearchParam(params.organizationId);
  const authenticated = await resolveAuthenticatedMapProjection(requestedOrganizationId);

  return (
    <ParticipantShell activeItem="Intelligence">
      <SpatialWorkspace ariaLabel="RFxchange Intelligence geographic workspace">
        <ExchangeSpatialScene
          model={authenticated.model}
          mode="organization"
          marker={authenticated.homeMarker}
          interactive
        />
      </SpatialWorkspace>
    </ParticipantShell>
  );
}
