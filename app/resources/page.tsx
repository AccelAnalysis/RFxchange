import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  authorizedWorkspaceSelection,
  parseResourcesMobileWorkspaceQuery,
  resourcesFocusedOrganizationId,
} from "@/src/application/resource-network/resource-network-workspace";
import { ResourceNetworkWorkspace } from "@/src/components/resource-network/ResourceNetworkWorkspace";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import {
  ParticipantRouteDependencyUnavailableError,
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { loadAuthorizedParticipantMapProjection } from "@/src/infrastructure/geography/participant-map-runtime";
import { loadAuthorizedNetworkDiscovery } from "@/src/infrastructure/network-discovery/runtime";
import { createServerFirestoreFoundationRepositories, getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { createServerReferralNetworkService } from "@/src/infrastructure/referrals/runtime";
import { loadAuthorizedResourceDiscovery } from "@/src/infrastructure/resource-network/discovery-runtime";
import { createServerResourceNetworkService } from "@/src/infrastructure/resource-network/runtime";

interface Props {
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}

export interface ResourceSelectionOverride {
  readonly kind: "provider" | "resource" | "request";
  readonly id: string;
}

export async function renderResourcesPage({
  searchParams,
  selectionOverride = null,
}: Props & Readonly<{ selectionOverride?: ResourceSelectionOverride | null }>) {
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

  const parsedQueryState = parseResourcesMobileWorkspaceQuery(params);
  const queryState = selectionOverride
    ? Object.freeze({
        ...parsedQueryState,
        organizationId: null,
        providerId: selectionOverride.kind === "provider" ? selectionOverride.id : null,
        resourceId: selectionOverride.kind === "resource" ? selectionOverride.id : null,
        requestId: selectionOverride.kind === "request" ? selectionOverride.id : null,
      })
    : parsedQueryState;
  const organizationId = String(access.membership.organizationId);
  const membershipId = String(access.membership.id);
  const actor = Object.freeze({
    context: access.context,
    organizationId,
    membershipId,
  });
  const service = createServerResourceNetworkService();
  const authorization = await createServerFirestoreFoundationRepositories(
    getServerFirestore(),
  ).organizationAuthorization.getByMembershipId(access.membership.id);
  const referralManage = authorization?.permissions.includes("referral.manage") ?? false;
  const resourceManage = authorization?.permissions.includes("resource.manage") ?? false;

  // Optional/private adjuncts remain independently settled. A record-only canonical destination
  // may additionally resolve its already-authorized provider identity before Network discovery so
  // the carried provider can receive the same authoritative marker treatment beyond page one.
  const referralsPromise = referralManage
    ? createServerReferralNetworkService().snapshot(actor)
    : Promise.resolve([]);
  const ownerPromise = resourceManage ? service.ownerSnapshot(actor) : Promise.resolve(null);
  const independentHydrationPromise = Promise.allSettled([
    referralsPromise,
    ownerPromise,
  ] as const);
  const explicitFocusedOrganizationId = queryState.organizationId ?? queryState.providerId;
  const preliminaryResourcePromise = !explicitFocusedOrganizationId && queryState.resourceId
    ? loadAuthorizedResourceDiscovery({
        access,
        mapProjection,
        query: queryState.query,
        availability: queryState.availability === "all" ? null : queryState.availability,
        markers: [],
      })
    : Promise.resolve(null);
  const focusedOrganizationIdPromise = explicitFocusedOrganizationId
    ? Promise.resolve(explicitFocusedOrganizationId)
    : queryState.resourceId
      ? preliminaryResourcePromise.then((projection) => resourcesFocusedOrganizationId({
          resourceId: queryState.resourceId,
          resources: projection?.available ? projection.projection.resources : [],
        }))
      : queryState.requestId
        ? referralsPromise.then(
            (referrals) => resourcesFocusedOrganizationId({
              requestId: queryState.requestId,
              requests: referrals,
            }),
            () => null,
          )
        : Promise.resolve(null);

  const [network, [referralsResult, ownerResult]] = await Promise.all([
    focusedOrganizationIdPromise.then((focusedOrganizationId) => loadAuthorizedNetworkDiscovery({
      access,
      mapProjection,
      focusedOrganizationId,
    })),
    independentHydrationPromise,
  ]);
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

  const resourceProjection = await loadAuthorizedResourceDiscovery({
    access,
    mapProjection,
    query: queryState.query,
    availability: queryState.availability === "all" ? null : queryState.availability,
    markers,
  });
  const referrals = referralsResult.status === "fulfilled" ? referralsResult.value : [];
  const owner = ownerResult.status === "fulfilled" ? ownerResult.value : null;

  const requestReferrals = referrals.filter(
    (referral) => referral.purpose === "provider-connection",
  );
  const providers = resourceProjection.available
    ? resourceProjection.projection.providers
    : [];
  const selectedProviderId = authorizedWorkspaceSelection(
    queryState.providerId,
    providers.map((provider) => String(provider.organizationId)),
  );
  const selectedOrganizationId = authorizedWorkspaceSelection(
    queryState.organizationId,
    markers.map((organization) => organization.organizationId),
  );
  const selectedRequestId = authorizedWorkspaceSelection(
    queryState.requestId,
    requestReferrals.map((referral) => referral.id),
  );
  const selectedResourceId = authorizedWorkspaceSelection(
    queryState.resourceId,
    (resourceProjection.available ? resourceProjection.projection.resources : []).map((resource) => resource.id),
  );
  const selectedMessagesResult = selectedRequestId
    ? await service.messages(actor, selectedRequestId).then(
        (value) => Object.freeze({ status: "fulfilled" as const, value }),
        (reason: unknown) => Object.freeze({ status: "rejected" as const, reason }),
      )
    : null;
  const selectedMessages = selectedMessagesResult?.status === "fulfilled"
    ? selectedMessagesResult.value
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
      resources={resourceProjection.available ? resourceProjection.projection.resources : []}
      referrals={referrals}
      owner={owner}
      adjunctState={Object.freeze({
        requests: !referralManage ? "restricted" : referralsResult.status === "fulfilled" ? "available" : "unavailable",
        management: !resourceManage ? "restricted" : ownerResult.status === "fulfilled" ? "available" : "unavailable",
      })}
      authorization={Object.freeze({
        openPlatform: true,
        referralManage,
        resourceManage,
      })}
      commandRecoveryScope={commandRecoveryScope}
      queryState={Object.freeze({
        ...queryState,
        organizationId: selectedOrganizationId,
        providerId: selectedProviderId,
        requestId: selectedRequestId,
        resourceId: selectedResourceId,
      })}
      selectedMessages={selectedMessages}
      selectedMessagesUnavailable={selectedMessagesResult?.status === "rejected"}
    />
  );
}

export default async function ResourcesPage(props: Props) {
  return renderResourcesPage(props);
}
