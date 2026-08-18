import type { ParticipantMapCamera } from "../geography/map-view.ts";
import {
  EXCHANGE_SHEET_SNAP_POINTS,
  createExchangeGeographyContext,
  createExchangeMapAreaProjection,
  createExchangeMapObjectProjection,
  createExchangeSelectionState,
  createExchangeSubjectIdentity,
  createLensResultCardModel,
  mobileLensActionRail,
  projectFavoriteState,
  projectRecordAction,
  selectionContainsKey,
  selectionMatchesCard,
  type ExchangeBottomSheetContract,
  type ExchangeDetailState,
  type ExchangeMapAreaProjection,
  type ExchangeSelectionSource,
  type ExchangeSheetState,
  type ExchangeSelectionState,
  type LensActionRailContract,
  type LensMapProjection,
  type LensResultCardModel,
} from "../participant/mobile-exchange-contracts.ts";
import {
  exchangeRoomActionDefinitionsForLens,
  type ExchangeRoomActionDisabledReason,
  type ExchangeRoomActionHandler,
  type ExchangeRoomActionProjection,
} from "../participant/exchange-room-actions.ts";
import type {
  ProviderDiscoveryProjection,
  ProviderResourceKind,
  ProviderResourceProjection,
  ProviderResourceStatus,
  ProviderServiceTerritoryProjection,
} from "../../domain/resource-network/model.ts";
import type {
  ProviderAvailability,
  ProviderCategory,
  ProviderModality,
} from "../../domain/resource-providers/model.ts";
import type {
  RecipientReferralProjection,
  ReferralStatus,
  SenderReferralProjection,
} from "../../domain/referrals/model.ts";

export type ResourcesMobileRequestProjection =
  | SenderReferralProjection
  | RecipientReferralProjection;

type GovernedProviderRequest = ResourcesMobileRequestProjection & Readonly<{
  purpose: "provider-connection";
  providerContext: NonNullable<ResourcesMobileRequestProjection["providerContext"]>;
}>;

export interface ResourcesMobileAuthorization {
  readonly openPlatform: boolean;
  readonly referralManage: boolean;
  readonly resourceManage: boolean;
}

export interface ResourcesMobileCopy {
  readonly providerStatusLabel: string;
  readonly officialProviderValue: string;
  readonly statusLabel: string;
  readonly servicesLabel: string;
  readonly categoriesLabel: string;
  readonly eligibilityLabel: string;
  readonly intakeLabel: string;
  readonly modalitiesLabel: string;
  readonly relevanceLabel: string;
  readonly resourceKindLabel: string;
  readonly providerAvailabilityLabel: string;
  readonly requestRoleLabel: string;
  readonly updatedLabel: string;
  availability(value: ProviderAvailability): string;
  category(value: ProviderCategory): string;
  modality(value: ProviderModality): string;
  resourceKind(value: ProviderResourceKind): string;
  resourceStatus(value: ProviderResourceStatus): string;
  requestStatus(value: ReferralStatus): string;
  requestRole(value: "sender" | "recipient"): string;
}

export interface ResourcesMobileSelectionInput {
  readonly providerOrganizationId?: string | null;
  readonly resourceId?: string | null;
  readonly requestId?: string | null;
  readonly source?: ExchangeSelectionSource;
}

export interface ResourcesMobileProjectionInput {
  readonly viewerOrganizationId: string;
  readonly geography: Readonly<{ id: string; label: string | null }>;
  readonly providers: readonly ProviderDiscoveryProjection[];
  readonly resources: readonly ProviderResourceProjection[];
  readonly requests: readonly ResourcesMobileRequestProjection[];
  readonly authorization: ResourcesMobileAuthorization;
  readonly copy: ResourcesMobileCopy;
  readonly selection?: ResourcesMobileSelectionInput;
  readonly camera?: ParticipantMapCamera | null;
  readonly sheetState: ExchangeSheetState;
}

export interface ResourcesMobileServiceTerritoryBinding {
  readonly providerOrganizationId: string;
  readonly area: ExchangeMapAreaProjection;
  readonly geometryReference: string;
  readonly geometry: ProviderServiceTerritoryProjection["geometry"];
}

export interface ResourcesMobileProjection {
  readonly lens: "resources";
  readonly selection: ExchangeSelectionState;
  readonly map: LensMapProjection;
  readonly serviceTerritories: readonly ResourcesMobileServiceTerritoryBinding[];
  readonly actionRail: LensActionRailContract;
  readonly sheet: ExchangeBottomSheetContract;
  readonly providerCards: readonly LensResultCardModel[];
  readonly resourceCards: readonly LensResultCardModel[];
  readonly requestCards: readonly LensResultCardModel[];
  readonly cards: readonly LensResultCardModel[];
  readonly detail: ExchangeDetailState;
}

export const RESOURCES_MOBILE_LAYER_IDS = Object.freeze({
  providers: "resources.providers",
  serviceTerritories: "resources.service-territories",
} as const);

export const RESOURCES_MOBILE_RECORD_ACTION_KEYS = Object.freeze({
  viewProvider: "resources.recordActions.viewProvider",
  viewResource: "resources.recordActions.viewResource",
  requestSupport: "resources.recordActions.requestSupport",
  openIntake: "resources.recordActions.openIntake",
  viewRequest: "resources.recordActions.viewRequest",
} as const);

export const RESOURCES_MOBILE_PROJECTION_POLICY = Object.freeze({
  acceptsOnlyServerAuthorizedProjections: true,
  providerStatusIsNeverClientDerived: true,
  paymentNeverGrantsProviderStatus: true,
  resourceMarkersAreNeverFabricated: true,
  favoritePersistenceRequiresResourcesDomainAuthority: true,
} as const);

function organizationKey(organizationId: string): string {
  return `organization:${organizationId}`;
}

function resourceKey(resourceId: string): string {
  return `provider-resource:${resourceId}`;
}

function requestKey(requestId: string): string {
  return `provider-request:${requestId}`;
}

function providerHref(organizationId: string): string {
  const encoded = encodeURIComponent(organizationId);
  return `/resources?organization=${encoded}&provider=${encoded}`;
}

function resourceHref(resource: ProviderResourceProjection): string {
  return `/resources?provider=${encodeURIComponent(String(resource.organizationId))}&resource=${encodeURIComponent(resource.id)}`;
}

function requestHref(requestId: string): string {
  return `/resources?request=${encodeURIComponent(requestId)}`;
}

function isGovernedProviderRequest(
  request: ResourcesMobileRequestProjection,
): request is GovernedProviderRequest {
  return request.purpose === "provider-connection" && request.providerContext !== null;
}

function providerFor(
  providers: readonly ProviderDiscoveryProjection[],
  organizationId: string,
): ProviderDiscoveryProjection | null {
  return providers.find((provider) => String(provider.organizationId) === organizationId) ?? null;
}

function markerFor(
  provider: ProviderDiscoveryProjection | null,
): Readonly<{ id: string; coordinate: readonly [number, number]; accessibleLocationLabel: string }> | null {
  return provider?.marker ?? null;
}

function requestCounterpartyName(request: GovernedProviderRequest): string {
  return request.role === "sender" ? request.recipientLabel : request.senderOrganizationName;
}

function disabledReason(
  operational: boolean,
  applicable: boolean,
  authorized: boolean,
): ExchangeRoomActionDisabledReason | null {
  if (!operational) return "not-operational";
  if (!applicable) return "not-applicable";
  if (!authorized) return "not-authorized";
  return null;
}

function projectResourcesActions(
  authorization: ResourcesMobileAuthorization,
  selectedOrganizationId: string,
  viewerOrganizationId: string,
): readonly ExchangeRoomActionProjection[] {
  return Object.freeze(exchangeRoomActionDefinitionsForLens("resources").map((definition) => {
    const operational = definition.operational;
    const applicable = definition.id === "resources.provider-status"
      ? selectedOrganizationId === viewerOrganizationId
      : true;
    const authorized = definition.id === "resources.my-requests"
      ? authorization.openPlatform && authorization.referralManage
      : definition.id === "resources.provider-status"
        ? authorization.openPlatform && authorization.resourceManage
        : authorization.openPlatform;
    const authorizationRule = definition.id === "resources.find-providers"
      || definition.id === "resources.browse-resources"
      ? "open-platform" as const
      : definition.authorization;
    const handler: ExchangeRoomActionHandler | null = definition.id === "resources.provider-status"
      ? Object.freeze({ kind: "href" as const, href: "/provider-application" })
      : Object.freeze({ kind: "href" as const, href: "/resources" });
    const reason = disabledReason(operational, applicable, authorized);
    const enabled = reason === null && handler !== null;
    return Object.freeze({
      ...definition,
      authorization: authorizationRule,
      operational,
      applicable,
      authorized,
      availability: enabled ? "active" as const : "disabled" as const,
      disabledReason: enabled ? null : reason ?? "not-operational",
      resolvedHandler: enabled ? handler : null,
    });
  }));
}

function providerCard(
  provider: ProviderDiscoveryProjection,
  authorization: ResourcesMobileAuthorization,
  copy: ResourcesMobileCopy,
): LensResultCardModel {
  const organizationId = String(provider.organizationId);
  const identity = createExchangeSubjectIdentity({
    subjectKind: "organization",
    selectionKey: organizationKey(organizationId),
    organizationId,
    recordType: null,
    recordId: null,
  });
  return createLensResultCardModel({
    identity,
    title: provider.displayName,
    organizationIdentity: provider.displayName,
    locality: provider.territory.name,
    summary: provider.populationsServed,
    indicator: Object.freeze({
      label: copy.providerStatusLabel,
      value: copy.officialProviderValue,
      emphasis: "neutral" as const,
    }),
    metadata: Object.freeze([
      Object.freeze({ id: "availability", label: copy.providerAvailabilityLabel, value: copy.availability(provider.availability) }),
      Object.freeze({ id: "services", label: copy.servicesLabel, value: provider.services.map((service) => service.name).join(" · ") }),
      Object.freeze({ id: "categories", label: copy.categoriesLabel, value: provider.categories.map((category) => copy.category(category)).join(" · ") }),
      Object.freeze({ id: "eligibility", label: copy.eligibilityLabel, value: provider.eligibility }),
      Object.freeze({ id: "intake", label: copy.intakeLabel, value: provider.intakeMethod }),
      Object.freeze({ id: "relevance", label: copy.relevanceLabel, value: provider.match.reasons.join(" · ") }),
      Object.freeze({ id: "updated", label: copy.updatedLabel, value: provider.updatedAt }),
    ]),
    media: null,
    favorite: projectFavoriteState({
      visible: false,
      favorited: null,
      operational: false,
      applicable: false,
      authorized: false,
      handler: null,
    }),
    recordActions: Object.freeze([
      projectRecordAction({
        id: "resources.view-provider",
        labelKey: RESOURCES_MOBILE_RECORD_ACTION_KEYS.viewProvider,
        operational: true,
        applicable: true,
        authorized: authorization.openPlatform,
        handler: Object.freeze({ kind: "href" as const, href: providerHref(organizationId) }),
      }),
      projectRecordAction({
        id: "resources.request-support",
        labelKey: RESOURCES_MOBILE_RECORD_ACTION_KEYS.requestSupport,
        operational: true,
        applicable: true,
        authorized: authorization.openPlatform && authorization.referralManage,
        handler: Object.freeze({ kind: "href" as const, href: providerHref(organizationId) }),
      }),
    ]),
    canonicalHref: providerHref(organizationId),
    returnLens: "resources",
  });
}

function resourceCard(
  resource: ProviderResourceProjection,
  provider: ProviderDiscoveryProjection | null,
  authorization: ResourcesMobileAuthorization,
  copy: ResourcesMobileCopy,
): LensResultCardModel {
  const organizationId = String(resource.organizationId);
  const identity = createExchangeSubjectIdentity({
    subjectKind: "record",
    selectionKey: resourceKey(resource.id),
    organizationId,
    recordType: "provider-resource",
    recordId: resource.id,
  });
  const serviceNames = resource.serviceIds.map((serviceId) => (
    provider?.services.find((service) => service.id === serviceId)?.name ?? serviceId
  ));
  const actions = [
    projectRecordAction({
      id: "resources.view-resource",
      labelKey: RESOURCES_MOBILE_RECORD_ACTION_KEYS.viewResource,
      operational: true,
      applicable: true,
      authorized: authorization.openPlatform,
      handler: Object.freeze({ kind: "href" as const, href: resourceHref(resource) }),
    }),
    projectRecordAction({
      id: "resources.view-provider",
      labelKey: RESOURCES_MOBILE_RECORD_ACTION_KEYS.viewProvider,
      operational: true,
      applicable: true,
      authorized: authorization.openPlatform,
      handler: Object.freeze({ kind: "href" as const, href: providerHref(organizationId) }),
    }),
    projectRecordAction({
      id: "resources.request-support",
      labelKey: RESOURCES_MOBILE_RECORD_ACTION_KEYS.requestSupport,
      operational: true,
      applicable: true,
      authorized: authorization.openPlatform && authorization.referralManage,
      handler: Object.freeze({ kind: "href" as const, href: providerHref(organizationId) }),
    }),
  ];
  if (resource.intakeUrl) {
    actions.push(projectRecordAction({
      id: "resources.open-intake",
      labelKey: RESOURCES_MOBILE_RECORD_ACTION_KEYS.openIntake,
      operational: true,
      applicable: true,
      authorized: authorization.openPlatform,
      handler: Object.freeze({ kind: "href" as const, href: resource.intakeUrl }),
    }));
  }
  return createLensResultCardModel({
    identity,
    title: resource.title,
    organizationIdentity: resource.providerDisplayName,
    locality: provider?.territory.name ?? null,
    summary: resource.summary,
    indicator: Object.freeze({
      label: copy.statusLabel,
      value: copy.resourceStatus(resource.status),
      emphasis: "neutral" as const,
    }),
    metadata: Object.freeze([
      Object.freeze({ id: "kind", label: copy.resourceKindLabel, value: copy.resourceKind(resource.kind) }),
      Object.freeze({ id: "services", label: copy.servicesLabel, value: serviceNames.join(" · ") }),
      Object.freeze({ id: "eligibility", label: copy.eligibilityLabel, value: resource.eligibility }),
      Object.freeze({ id: "modalities", label: copy.modalitiesLabel, value: resource.modalities.map((modality) => copy.modality(modality)).join(" · ") }),
      ...(provider ? [Object.freeze({ id: "provider-availability", label: copy.providerAvailabilityLabel, value: copy.availability(provider.availability) })] : []),
      Object.freeze({ id: "updated", label: copy.updatedLabel, value: resource.updatedAt }),
    ]),
    media: null,
    favorite: projectFavoriteState({
      visible: true,
      favorited: null,
      operational: false,
      applicable: true,
      authorized: true,
      handler: null,
    }),
    recordActions: Object.freeze(actions),
    canonicalHref: resourceHref(resource),
    returnLens: "resources",
  });
}

function requestCard(
  request: GovernedProviderRequest,
  provider: ProviderDiscoveryProjection | null,
  authorization: ResourcesMobileAuthorization,
  copy: ResourcesMobileCopy,
): LensResultCardModel {
  const providerOrganizationId = String(request.providerContext.providerOrganizationId);
  const identity = createExchangeSubjectIdentity({
    subjectKind: "record",
    selectionKey: requestKey(request.id),
    organizationId: providerOrganizationId,
    recordType: "provider-request",
    recordId: request.id,
  });
  const actions = [
    projectRecordAction({
      id: "resources.view-request",
      labelKey: RESOURCES_MOBILE_RECORD_ACTION_KEYS.viewRequest,
      operational: true,
      applicable: true,
      authorized: authorization.openPlatform && authorization.referralManage,
      handler: Object.freeze({ kind: "href" as const, href: requestHref(request.id) }),
    }),
    projectRecordAction({
      id: "resources.view-provider",
      labelKey: RESOURCES_MOBILE_RECORD_ACTION_KEYS.viewProvider,
      operational: true,
      applicable: provider !== null,
      authorized: authorization.openPlatform,
      handler: provider
        ? Object.freeze({ kind: "href" as const, href: providerHref(providerOrganizationId) })
        : null,
    }),
  ];
  return createLensResultCardModel({
    identity,
    title: requestCounterpartyName(request),
    organizationIdentity: provider?.displayName ?? (request.role === "sender" ? request.recipientLabel : null),
    locality: provider?.territory.name ?? null,
    summary: request.summary,
    indicator: Object.freeze({
      label: copy.statusLabel,
      value: copy.requestStatus(request.status),
      emphasis: request.status === "declined" || request.status === "expired"
        ? "attention" as const
        : "neutral" as const,
    }),
    metadata: Object.freeze([
      Object.freeze({ id: "role", label: copy.requestRoleLabel, value: copy.requestRole(request.role) }),
      Object.freeze({ id: "updated", label: copy.updatedLabel, value: request.updatedAt }),
    ]),
    media: null,
    favorite: projectFavoriteState({
      visible: false,
      favorited: null,
      operational: false,
      applicable: false,
      authorized: false,
      handler: null,
    }),
    recordActions: Object.freeze(actions),
    canonicalHref: requestHref(request.id),
    returnLens: "resources",
  });
}

function selectedState(
  input: ResourcesMobileProjectionInput,
  providers: readonly ProviderDiscoveryProjection[],
  resources: readonly ProviderResourceProjection[],
  requests: readonly GovernedProviderRequest[],
): ExchangeSelectionState {
  const selectedResourceId = input.selection?.resourceId ?? null;
  const selectedResource = selectedResourceId
    ? resources.find((resource) => resource.id === selectedResourceId) ?? null
    : null;
  if (selectedResource) {
    const providerOrganizationId = String(selectedResource.organizationId);
    const provider = providerFor(providers, providerOrganizationId);
    const marker = markerFor(provider);
    return createExchangeSelectionState({
      kind: "record",
      source: input.selection?.source ?? "restored",
      selectedRecord: Object.freeze({
        selectionKey: resourceKey(selectedResource.id),
        recordType: "provider-resource",
        recordId: selectedResource.id,
        organizationId: providerOrganizationId,
      }),
      selectedOrganization: Object.freeze({
        selectionKey: organizationKey(providerOrganizationId),
        organizationId: providerOrganizationId,
        associationRole: "provider" as const,
      }),
      selectedMarker: marker ? Object.freeze({
        selectionKey: organizationKey(providerOrganizationId),
        markerId: marker.id,
        role: "associated-organization" as const,
      }) : null,
    });
  }

  const selectedRequestId = input.selection?.requestId ?? null;
  const selectedRequest = selectedRequestId
    ? requests.find((request) => request.id === selectedRequestId) ?? null
    : null;
  if (selectedRequest) {
    const providerOrganizationId = String(selectedRequest.providerContext.providerOrganizationId);
    const provider = providerFor(providers, providerOrganizationId);
    const marker = markerFor(provider);
    return createExchangeSelectionState({
      kind: "record",
      source: input.selection?.source ?? "restored",
      selectedRecord: Object.freeze({
        selectionKey: requestKey(selectedRequest.id),
        recordType: "provider-request",
        recordId: selectedRequest.id,
        organizationId: providerOrganizationId,
      }),
      selectedOrganization: Object.freeze({
        selectionKey: organizationKey(providerOrganizationId),
        organizationId: providerOrganizationId,
        associationRole: "provider" as const,
      }),
      selectedMarker: marker ? Object.freeze({
        selectionKey: organizationKey(providerOrganizationId),
        markerId: marker.id,
        role: "associated-organization" as const,
      }) : null,
    });
  }

  const selectedProviderOrganizationId = input.selection?.providerOrganizationId ?? null;
  const selectedProvider = selectedProviderOrganizationId
    ? providerFor(providers, selectedProviderOrganizationId)
    : null;
  if (selectedProvider) {
    const organizationId = String(selectedProvider.organizationId);
    const marker = markerFor(selectedProvider);
    return createExchangeSelectionState({
      kind: "organization",
      source: input.selection?.source ?? "restored",
      selectedOrganization: Object.freeze({
        selectionKey: organizationKey(organizationId),
        organizationId,
        associationRole: "subject" as const,
      }),
      selectedMarker: marker ? Object.freeze({
        selectionKey: organizationKey(organizationId),
        markerId: marker.id,
        role: "focal" as const,
      }) : null,
    });
  }

  return createExchangeSelectionState({ kind: "none" });
}

function detailFor(
  selection: ExchangeSelectionState,
  cards: readonly LensResultCardModel[],
): ExchangeDetailState {
  const selectedCard = cards.find((card) => selectionMatchesCard(selection, card)) ?? null;
  if (!selectedCard) {
    return Object.freeze({ status: "closed", detailContext: null, errorCode: null });
  }
  return Object.freeze({
    status: "open",
    detailContext: selectedCard.detailContext,
    errorCode: null,
  });
}

export function buildResourcesMobileProjection(
  input: ResourcesMobileProjectionInput,
): ResourcesMobileProjection {
  const providers = Object.freeze(input.authorization.openPlatform
    ? input.providers.filter((provider) => provider.territory.releaseState === "released")
    : []);
  const resources = Object.freeze(input.authorization.openPlatform
    ? input.resources.filter((resource) => resource.status === "published")
    : []);
  const requests = Object.freeze(input.authorization.openPlatform && input.authorization.referralManage
    ? input.requests.filter(isGovernedProviderRequest)
    : []);
  const selection = selectedState(input, providers, resources, requests);

  const providerCards = Object.freeze(providers.map((provider) => providerCard(provider, input.authorization, input.copy)));
  const resourceCards = Object.freeze(resources.map((resource) => resourceCard(
    resource,
    providerFor(providers, String(resource.organizationId)),
    input.authorization,
    input.copy,
  )));
  const requestCards = Object.freeze(requests.map((request) => requestCard(
    request,
    providerFor(providers, String(request.providerContext.providerOrganizationId)),
    input.authorization,
    input.copy,
  )));
  const cards = Object.freeze([...providerCards, ...resourceCards, ...requestCards]);

  const serviceTerritories = Object.freeze(providers.map((provider): ResourcesMobileServiceTerritoryBinding => {
    const providerOrganizationId = String(provider.organizationId);
    const geometryReference = `territory:${providerOrganizationId}`;
    const area = createExchangeMapAreaProjection({
      areaId: geometryReference,
      associationSelectionKey: organizationKey(providerOrganizationId),
      geographyId: provider.territory.geographyId,
      geometryReference,
      privacy: "locality-only",
      release: "released",
      accessibleLabel: `${provider.displayName}: ${provider.territory.name}`,
      selectable: true,
      selected: selectionContainsKey(selection, organizationKey(providerOrganizationId)),
      emphasized: selectionContainsKey(selection, organizationKey(providerOrganizationId)),
      layerIds: [RESOURCES_MOBILE_LAYER_IDS.serviceTerritories],
    });
    return Object.freeze({
      providerOrganizationId,
      area,
      geometryReference,
      geometry: provider.territory.geometry,
    });
  }));

  const providerMarkers = providers.flatMap((provider) => {
    if (!provider.marker) return [];
    const organizationId = String(provider.organizationId);
    return [createExchangeMapObjectProjection({
      identity: createExchangeSubjectIdentity({
        subjectKind: "organization",
        selectionKey: organizationKey(organizationId),
        organizationId,
        recordType: null,
        recordId: null,
      }),
      markerId: provider.marker.id,
      coordinate: Object.freeze({
        longitude: provider.marker.coordinate[0],
        latitude: provider.marker.coordinate[1],
      }),
      privacy: "approximate",
      accessibleLabel: provider.marker.accessibleLocationLabel,
      selectable: true,
      layerIds: [RESOURCES_MOBILE_LAYER_IDS.providers],
    })];
  });
  const mapObjects = Object.freeze([
    ...providerMarkers,
    ...serviceTerritories.map((territory) => territory.area),
  ]);
  const map = Object.freeze({
    lens: "resources" as const,
    geography: createExchangeGeographyContext({
      geographyId: input.geography.id,
      label: input.geography.label,
      serverRevalidated: true,
    }),
    objects: mapObjects,
    activeLayerIds: Object.freeze([
      RESOURCES_MOBILE_LAYER_IDS.providers,
      RESOURCES_MOBILE_LAYER_IDS.serviceTerritories,
    ]),
    layerStateAuthority: "domain-revalidated" as const,
    camera: input.camera ?? null,
    bounds: null,
  });

  const selectedOrganizationId = selection.selectedOrganization?.organizationId
    ?? input.viewerOrganizationId;
  const actionRail = mobileLensActionRail(
    "resources",
    projectResourcesActions(input.authorization, selectedOrganizationId, input.viewerOrganizationId),
  );
  const sheet = Object.freeze({
    snapPoints: EXCHANGE_SHEET_SNAP_POINTS,
    state: input.sheetState,
    actionRail,
    cards,
  });

  return Object.freeze({
    lens: "resources",
    selection,
    map,
    serviceTerritories,
    actionRail,
    sheet,
    providerCards,
    resourceCards,
    requestCards,
    cards,
    detail: detailFor(selection, cards),
  });
}
