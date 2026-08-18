import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ResourceNetworkError } from "@/src/application/resource-network/resource-network";
import {
  authorizedWorkspaceSelection,
  parseResourceNetworkWorkspaceQuery,
} from "@/src/application/resource-network/resource-network-workspace";
import { ResourceNetworkWorkspace } from "@/src/components/resource-network/ResourceNetworkWorkspace";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import {
  ParticipantRouteDependencyUnavailableError,
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { createServerFirestoreFoundationRepositories } from "@/src/infrastructure/firestore/runtime";
import { loadAuthorizedParticipantMapProjection } from "@/src/infrastructure/geography/participant-map-runtime";
import { loadAuthorizedNetworkDiscovery } from "@/src/infrastructure/network-discovery/runtime";
import { createServerReferralNetworkService } from "@/src/infrastructure/referrals/runtime";
import { loadAuthorizedResourceDiscovery } from "@/src/infrastructure/resource-network/discovery-runtime";
import { createServerResourceNetworkService } from "@/src/infrastructure/resource-network/runtime";

interface Props {
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}

export default async function ResourcesPage({ searchParams }: Props) {
  const access = await resolveParticipantRoute({
    sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Fresources");
  if (access.kind === "access-resolution-required") redirect(participantEntryDestination(access));
  if (access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") {
    redirect(access.state.controlledPlatformUrl ?? "/join");
  }
  if (access.kind === "restricted") {
    redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  }
  if (access.state.lifecycleState !== "open-platform") {
    redirect(access.state.controlledPlatformUrl ?? "/join");
  }

  const [mapProjection, params] = await Promise.all([
    loadAuthorizedParticipantMapProjection(access),
    searchParams ?? Promise.resolve({}),
  ]);
  if (!mapProjection) {
    throw new ParticipantRouteDependencyUnavailableError(
      "workspace-state",
      new Error("Authorized Resource Network map projection is incomplete."),
    );
  }

  const queryState = parseResourceNetworkWorkspaceQuery(params);
  const organizationId = String(access.membership.organizationId);
  const membershipId = String(access.membership.id);
  const actor = Object.freeze({
    context: access.context,
    organizationId,
    membershipId,
  });
  const service = createServerResourceNetworkService();

  // Discovery and permission resolution are independent. Provider/resource discovery remains
  // available to an authorized OPEN participant even when request or provider-management
  // permissions are absent; only those private adjunct projections are omitted.
  const networkPromise = loadAuthorizedNetworkDiscovery({
    access,
    mapProjection,
    focusedOrganizationId: queryState.organizationId ?? queryState.providerId,
  });
  const authorizationPromise = createServerFirestoreFoundationRepositories()
    .organizationAuthorization
    .getByMembershipId(access.membership.id);
  const [network, authorization] = await Promise.all([
    networkPromise,
    authorizationPromise,
  ]);
  const permissions = authorization?.permissions ?? [];
  const referralManage = permissions.includes("referral.manage");
  const resourceManage = permissions.includes("resource.manage");

  const referralsPromise = referralManage
    ? createServerReferralNetworkService().snapshot(actor)
    : Promise.resolve([]);
  const ownerPromise = resourceManage
    ? service.ownerSnapshot(actor).catch((error: unknown) => {
        if (error instanceof ResourceNetworkError && error.code === "forbidden") return null;
        throw error;
      })
    : Promise.resolve(null);
  const independentHydrationPromise = Promise.allSettled([
    referralsPromise,
    ownerPromise,
  ] as const);

  const markers = network.available
    ? network.projection.organizations.map((organization) => Object.freeze({
        organizationId: String(organization.organizationId),
        marker: Object.freeze({
          id: organization.marker.id,
          coordinate: organization.marker.coordinate,
          accessibleLocationLabel: organization.marker.accessibleLocationLabel,
        }),
      }))
    : [];

  const resourcePromise = loadAuthorizedResourceDiscovery({
    access,
    mapProjection,
    query: queryState.query,
    availability: queryState.availability === "all" ? null : queryState.availability,
    markers,
  });
  const [resourceProjection, [referralsResult, ownerResult]] = await Promise.all([
    resourcePromise,
    independentHydrationPromise,
  ]);
  if (referralsResult.status === "rejected") throw referralsResult.reason;
  if (ownerResult.status === "rejected") throw ownerResult.reason;
  const referrals = referralsResult.value;
  const owner = ownerResult.value;

  const requestReferrals = referrals.filter(
    (referral) => referral.purpose === "provider-connection",
  );
  const providers = resourceProjection.available
    ? resourceProjection.projection.providers
    : [];
  const resources = resourceProjection.available
    ? resourceProjection.projection.resources
    : [];
  const selectedProviderId = authorizedWorkspaceSelection(
    queryState.providerId,
    providers.map((provider) => String(provider.organizationId)),
  );
  const selectedOrganizationId = authorizedWorkspaceSelection(
    queryState.organizationId,
    markers.map((organization) => organization.organizationId),
  );
  const selectedResourceId = authorizedWorkspaceSelection(
    queryState.resourceId,
    resources.map((resource) => resource.id),
  );
  const selectedRequestId = authorizedWorkspaceSelection(
    queryState.requestId,
    requestReferrals.map((referral) => referral.id),
  );
  const selectedMessages = selectedRequestId
    ? await service.messages(actor, selectedRequestId)
    : [];
  const commandRecoveryScope = `${String(access.membership.organizationId)}:${String(access.membership.id)}`;

  return (
    <ResourceNetworkWorkspace
      model={mapProjection.model}
      homeMarker={mapProjection.homeMarker}
      spatialScope={{
        participantId: String(access.context.user.id),
        membershipId: String(access.membership.id),
        organizationId: String(access.membership.organizationId),
        geographyId: String(mapProjection.model.selectedGeography.id),
      }}
      organizations={network.available ? network.projection.organizations.map((organization) => Object.freeze({
        organizationId: String(organization.organizationId),
        marker: Object.freeze({
          id: organization.marker.id,
          coordinate: organization.marker.coordinate,
          label: organization.profile.displayName,
          accessibleLocationLabel: organization.marker.accessibleLocationLabel,
        }),
      })) : []}
      providers={providers}
      resources={resources}
      referrals={referrals}
      owner={owner}
      commandRecoveryScope={commandRecoveryScope}
      queryState={Object.freeze({
        ...queryState,
        organizationId: selectedOrganizationId,
        providerId: selectedProviderId,
        resourceId: selectedResourceId,
        requestId: selectedRequestId,
      })}
      selectedMessages={selectedMessages}
    />
  );
}
