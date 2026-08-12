import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { FoundingAcquisitionContinuation } from "@/src/components/acquisition/FoundingAcquisitionContinuation";
import { ExistingWorkspaceFoundation } from "@/src/components/participant/ExistingWorkspaceFoundation";
import {
  RFXCHANGE_FOUNDING_ACQUISITION_INTENT,
  type FoundingAcquisitionIntent,
} from "@/src/infrastructure/acquisition/founding-intent";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import {
  ParticipantRouteDependencyUnavailableError,
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { loadAuthorizedParticipantMapProjection } from "@/src/infrastructure/geography/participant-map-runtime";
import { loadAuthorizedNetworkDiscovery } from "@/src/infrastructure/network-discovery/runtime";
import { loadOptionalOfficialResourceProviderOrganizationIds } from "@/src/infrastructure/resource-network/discovery-runtime";

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

function resolveAcquisitionIntent(value: string | null): FoundingAcquisitionIntent | null {
  return value === RFXCHANGE_FOUNDING_ACQUISITION_INTENT
    ? RFXCHANGE_FOUNDING_ACQUISITION_INTENT
    : null;
}

function canvasUrl(
  requestedOrganizationId: string | null,
  acquisitionIntent: FoundingAcquisitionIntent | null,
): string {
  const params = new URLSearchParams();
  if (requestedOrganizationId) params.set("organizationId", requestedOrganizationId);
  if (acquisitionIntent) params.set("acquisition", acquisitionIntent);
  const query = params.toString();
  return query ? `/geography/canvas?${query}` : "/geography/canvas";
}

function signInUrl(
  requestedOrganizationId: string | null,
  acquisitionIntent: FoundingAcquisitionIntent | null,
): string {
  return `/signin?returnTo=${encodeURIComponent(canvasUrl(requestedOrganizationId, acquisitionIntent))}`;
}

async function resolveAuthenticatedMapProjection(
  requestedOrganizationId: string | null,
  acquisitionIntent: FoundingAcquisitionIntent | null,
) {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
    requestedOrganizationId,
  });

  if (access.kind === "unauthenticated") {
    redirect(signInUrl(requestedOrganizationId, acquisitionIntent));
  }
  if (access.kind === "access-resolution-required") {
    redirect(participantEntryDestination(access));
  }
  if (access.kind === "activation-required") {
    redirect(participantEntryDestination(
      access,
      acquisitionIntent ? "/acquisition/founding" : "/join",
    ));
  }
  if (access.kind === "wrong-organization") {
    redirect(access.state.controlledPlatformUrl ?? "/join");
  }
  if (access.kind === "restricted") {
    redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  }
  if (access.state.lifecycleState !== "open-platform") {
    redirect(access.state.controlledPlatformUrl ?? "/join");
  }

  const mapProjection = await loadAuthorizedParticipantMapProjection(access);
  if (!mapProjection) {
    throw new ParticipantRouteDependencyUnavailableError(
      "workspace-state",
      new Error("Authorized participant map projection is incomplete."),
    );
  }
  return Object.freeze({ access, mapProjection });
}

export default async function GeographyCanvasPage({
  searchParams,
}: GeographyCanvasPageProps) {
  const params = searchParams ? await searchParams : {};
  const requestedOrganizationId = firstSearchParam(params.organizationId);
  const selectedOrganizationId = firstSearchParam(params.selectedOrganization);
  const capability = firstSearchParam(params.q);
  const serviceGeographyId = firstSearchParam(params.serviceArea);
  const page = firstSearchParam(params.page);
  const acquisitionIntent = resolveAcquisitionIntent(firstSearchParam(params.acquisition));
  const authenticated = await resolveAuthenticatedMapProjection(
    requestedOrganizationId,
    acquisitionIntent,
  );
  const discovery = await loadAuthorizedNetworkDiscovery({
    access: authenticated.access,
    mapProjection: authenticated.mapProjection,
    capability,
    serviceGeographyId,
    page,
    focusedOrganizationId: selectedOrganizationId,
  });
  let focusedOrganization = discovery.available && selectedOrganizationId
    ? discovery.projection.organizations.find(
        (organization) => String(organization.organizationId) === selectedOrganizationId,
      ) ?? null
    : null;
  if (selectedOrganizationId && !focusedOrganization) {
    const focusedDiscovery = await loadAuthorizedNetworkDiscovery({
      access: authenticated.access,
      mapProjection: authenticated.mapProjection,
      focusedOrganizationId: selectedOrganizationId,
    });
    focusedOrganization = focusedDiscovery.available
      ? focusedDiscovery.projection.organizations.find(
          (organization) => String(organization.organizationId) === selectedOrganizationId,
        ) ?? null
      : null;
  }
  const providerStatusOrganizationIds = discovery.available
    ? [
        ...(focusedOrganization ? [String(focusedOrganization.organizationId)] : []),
        ...discovery.projection.organizations.map((organization) => String(organization.organizationId)),
      ].filter((organizationId, index, values) => values.indexOf(organizationId) === index)
    : [];
  const officialResourceProviderOrganizationIds = discovery.available
    ? await loadOptionalOfficialResourceProviderOrganizationIds({
      access: authenticated.access,
      organizationIds: providerStatusOrganizationIds,
      selectedGeographyId: String(authenticated.mapProjection.model.selectedGeography.id),
    })
    : [];

  return (
    <>
      {acquisitionIntent ? <FoundingAcquisitionContinuation /> : null}
      <ExistingWorkspaceFoundation
        model={authenticated.mapProjection.model}
        homeMarker={authenticated.mapProjection.homeMarker}
        organizationId={authenticated.mapProjection.organizationId}
        spatialScope={{
          participantId: String(authenticated.access.context.user.id),
          membershipId: String(authenticated.access.membership.id),
          organizationId: authenticated.mapProjection.organizationId,
          geographyId: String(authenticated.mapProjection.model.selectedGeography.id),
        }}
        discovery={discovery.available ? discovery.projection : null}
        focusedOrganization={focusedOrganization}
        serviceAreaOptions={discovery.available ? discovery.serviceAreaOptions : []}
        officialResourceProviderOrganizationIds={officialResourceProviderOrganizationIds}
      />
    </>
  );
}
