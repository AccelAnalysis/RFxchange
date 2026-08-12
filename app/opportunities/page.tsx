import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { OpportunityDiscoveryWorkspace } from "@/src/components/rfx/OpportunityDiscoveryWorkspace";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import {
  ParticipantRouteDependencyUnavailableError,
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { loadAuthorizedParticipantMapProjection } from "@/src/infrastructure/geography/participant-map-runtime";
import { createServerOpportunityDiscoveryService } from "@/src/infrastructure/rfx/opportunity-discovery-runtime";

interface Props {
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}

function first(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return Array.isArray(value) && value[0]?.trim() ? value[0].trim() : null;
}

function values(value: string | string[] | undefined): readonly string[] {
  return Object.freeze((Array.isArray(value) ? value : value ? [value] : []).flatMap((item) => item.split(",")).map((item) => item.trim()).filter(Boolean));
}

export default async function OpportunitiesPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const access = await resolveParticipantRoute({
    sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Fopportunities");
  if (access.kind === "access-resolution-required" || access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform") redirect(access.state.controlledPlatformUrl ?? "/join");
  const mapProjection = await loadAuthorizedParticipantMapProjection(access);
  if (!mapProjection) throw new ParticipantRouteDependencyUnavailableError("workspace-state", new Error("Authorized opportunity map projection is incomplete."));
  const geographyId = String(mapProjection.model.selectedGeography.id);
  const requestedLocalities = values(params.locality);
  const result = await createServerOpportunityDiscoveryService().discover({
    organizationId: access.membership.organizationId,
    userId: access.context.user.id,
    membershipId: access.membership.id,
  }, {
    text: first(params.q),
    requestFamilyKeys: values(params.requestFamily),
    capabilityIds: values(params.capability),
    localityIds: requestedLocalities.length ? requestedLocalities : [geographyId],
    deadlineWindow: first(params.deadline),
    watched: first(params.watched) === "true" ? true : first(params.watched) === "false" ? false : null,
    cursor: first(params.cursor),
  });
  const requestedSelection = first(params.selected);
  const selectedReference = requestedSelection && result.items.some((item) => item.reference === requestedSelection)
    ? requestedSelection
    : null;
  return <OpportunityDiscoveryWorkspace
    model={mapProjection.model}
    homeMarker={mapProjection.homeMarker}
    spatialScope={{
      participantId: String(access.context.user.id),
      membershipId: String(access.membership.id),
      organizationId: String(access.membership.organizationId),
      geographyId,
    }}
    result={result}
    selectedReference={selectedReference}
  />;
}
