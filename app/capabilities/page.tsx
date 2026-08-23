import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { parseCapabilitiesQuery } from "@/src/application/organizations/capabilities-exchange";
import { CapabilitiesWorkspace } from "@/src/components/capabilities/CapabilitiesWorkspace";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import {
  ParticipantRouteDependencyUnavailableError,
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { loadAuthorizedParticipantMapProjection } from "@/src/infrastructure/geography/participant-map-runtime";
import { loadAuthorizedCapabilitiesExchange } from "@/src/infrastructure/organizations/capabilities-runtime";
import { getRequestDictionary } from "@/src/i18n/server";

interface CapabilitiesPageProps {
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}

export default async function CapabilitiesPage({ searchParams }: CapabilitiesPageProps) {
  const access = await resolveParticipantRoute({
    sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Fcapabilities");
  if (access.kind === "access-resolution-required" || access.kind === "activation-required") {
    redirect(participantEntryDestination(access));
  }
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform") redirect(access.state.controlledPlatformUrl ?? "/join");

  const [mapProjection, params, { locale }] = await Promise.all([
    loadAuthorizedParticipantMapProjection(access),
    searchParams ?? Promise.resolve({}),
    getRequestDictionary(),
  ]);
  if (!mapProjection) {
    throw new ParticipantRouteDependencyUnavailableError(
      "workspace-state",
      new Error("Authorized Capabilities map projection is incomplete."),
    );
  }
  const runtime = await loadAuthorizedCapabilitiesExchange({
    access,
    mapProjection,
    query: parseCapabilitiesQuery(params),
    locale,
  });
  return (
    <CapabilitiesWorkspace
      model={mapProjection.model}
      homeMarker={{ ...mapProjection.homeMarker, organizationId: mapProjection.organizationId }}
      projection={runtime.projection}
      serviceAreaOptions={runtime.serviceAreaOptions}
      locale={locale}
    />
  );
}
