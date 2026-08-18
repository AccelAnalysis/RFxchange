import type { ParticipantMapCamera } from "../geography/map-view.ts";
import {
  createExchangeGeographyContext,
  createExchangeMapAreaProjection,
  createExchangeMapObjectProjection,
  createExchangeSelectionState,
  createExchangeSubjectIdentity,
  createLensDiscoveryProjection,
  createLensMapProjection,
  createLensResultCardModel,
  createLensResultSetState,
  mobileLensActionRail,
  projectFavoriteState,
  projectRecordAction,
  selectionContainsKey,
  type ExchangeMapAreaProjection,
  type ExchangeResultSpatialDisposition,
  type ExchangeSelectionSource,
  type ExchangeSelectionState,
  type LensActionRailContract,
  type LensDiscoveryProjection,
  type LensResultCardModel,
} from "../participant/mobile-exchange-contracts.ts";
import {
  exchangeRoomActionDefinitionsForLens,
  type ExchangeRoomActionDisabledReason,
  type ExchangeRoomActionProjection,
} from "../participant/exchange-room-actions.ts";
import type { Locale } from "../../i18n/config.ts";
import type {
  ProviderDiscoveryProjection,
  ProviderResourceProjection,
  ProviderServiceTerritoryProjection,
} from "../../domain/resource-network/model.ts";
import type { RecipientReferralProjection, SenderReferralProjection } from "../../domain/referrals/model.ts";

type RequestProjection = SenderReferralProjection | RecipientReferralProjection;
type ProviderRequest = RequestProjection & Readonly<{
  purpose: "provider-connection";
  providerContext: NonNullable<RequestProjection["providerContext"]>;
}>;

export interface ResourcesMobileAuthorization {
  readonly openPlatform: boolean;
  readonly referralManage: boolean;
  readonly resourceManage: boolean;
}

export interface ResourcesMobileSelectionInput {
  readonly providerOrganizationId?: string | null;
  readonly resourceId?: string | null;
  readonly requestId?: string | null;
  readonly source?: ExchangeSelectionSource;
}

export interface ResourcesMobileServiceTerritoryBinding {
  readonly providerOrganizationId: string;
  readonly area: ExchangeMapAreaProjection;
  readonly geometryReference: string;
  readonly geometry: ProviderServiceTerritoryProjection["geometry"];
}

export interface ResourcesMobileProjection {
  readonly discovery: LensDiscoveryProjection;
  readonly selection: ExchangeSelectionState;
  readonly actionRail: LensActionRailContract;
  readonly serviceTerritories: readonly ResourcesMobileServiceTerritoryBinding[];
  readonly providerCards: readonly LensResultCardModel[];
  readonly resourceCards: readonly LensResultCardModel[];
  readonly requestCards: readonly LensResultCardModel[];
}

export const RESOURCES_MOBILE_LAYER_IDS = Object.freeze({
  providers: "resources.providers",
  serviceTerritories: "resources.service-territories",
} as const);

export const RESOURCES_MOBILE_RECORD_ACTION_KEYS = Object.freeze({
  viewProvider: "resources.recordActions.viewProvider",
  viewResource: "resources.recordActions.viewResource",
  requestSupport: "resources.recordActions.requestSupport",
  viewRequest: "resources.recordActions.viewRequest",
} as const);

const COPY = Object.freeze({
  "en-US": Object.freeze({ results: "Resources", empty: "No published resources or providers match these filters.", available: "Availability", services: "Services", eligibility: "Eligibility", official: "Official Resource Provider", request: "Provider request", fallback: "Resource information", context: "RFx resource gap context", return: "Return to RFx", contextOnly: "Context only. Provider eligibility and authority are revalidated independently.", peek: "Peek", partial: "Partial", expanded: "Expanded", open: "Open", save: "Save", remove: "Remove", unavailable: "Unavailable" }),
  es: Object.freeze({ results: "Recursos", empty: "Ningún recurso o proveedor publicado coincide con estos filtros.", available: "Disponibilidad", services: "Servicios", eligibility: "Elegibilidad", official: "Proveedor oficial de recursos", request: "Solicitud al proveedor", fallback: "Información del recurso", context: "Contexto de la brecha de recursos de RFx", return: "Volver a RFx", contextOnly: "Solo contexto. La elegibilidad y la autoridad del proveedor se revalidan por separado.", peek: "Vista previa", partial: "Parcial", expanded: "Expandido", open: "Abrir", save: "Guardar", remove: "Quitar", unavailable: "No disponible" }),
  fr: Object.freeze({ results: "Ressources", empty: "Aucune ressource ni aucun fournisseur publié ne correspond à ces filtres.", available: "Disponibilité", services: "Services", eligibility: "Admissibilité", official: "Fournisseur officiel de ressources", request: "Demande au fournisseur", fallback: "Informations sur la ressource", context: "Contexte du besoin de ressources RFx", return: "Retour au RFx", contextOnly: "Contexte uniquement. L’admissibilité et l’autorité du fournisseur sont revalidées séparément.", peek: "Aperçu", partial: "Partiel", expanded: "Développé", open: "Ouvrir", save: "Enregistrer", remove: "Retirer", unavailable: "Indisponible" }),
  de: Object.freeze({ results: "Ressourcen", empty: "Keine veröffentlichten Ressourcen oder Anbieter entsprechen diesen Filtern.", available: "Verfügbarkeit", services: "Leistungen", eligibility: "Berechtigung", official: "Offizieller Ressourcenanbieter", request: "Anbieteranfrage", fallback: "Ressourceninformationen", context: "Kontext der RFx-Ressourcenlücke", return: "Zurück zum RFx", contextOnly: "Nur Kontext. Anbieterberechtigung und Befugnis werden unabhängig erneut geprüft.", peek: "Vorschau", partial: "Teilweise", expanded: "Erweitert", open: "Öffnen", save: "Speichern", remove: "Entfernen", unavailable: "Nicht verfügbar" }),
  it: Object.freeze({ results: "Risorse", empty: "Nessuna risorsa o fornitore pubblicato corrisponde a questi filtri.", available: "Disponibilità", services: "Servizi", eligibility: "Idoneità", official: "Fornitore ufficiale di risorse", request: "Richiesta al fornitore", fallback: "Informazioni sulla risorsa", context: "Contesto del divario di risorse RFx", return: "Torna alla RFx", contextOnly: "Solo contesto. L’idoneità e l’autorità del fornitore vengono riconvalidate separatamente.", peek: "Anteprima", partial: "Parziale", expanded: "Espanso", open: "Apri", save: "Salva", remove: "Rimuovi", unavailable: "Non disponibile" }),
});

export function resourcesMobileCopy(locale: Locale) { return COPY[locale]; }

function organizationKey(id: string) { return `organization:${id}`; }
function resourceKey(id: string) { return `provider-resource:${id}`; }
function requestKey(id: string) { return `provider-request:${id}`; }
function providerHref(id: string) { const encoded = encodeURIComponent(id); return `/resources?organization=${encoded}&provider=${encoded}`; }
function resourceHref(resource: ProviderResourceProjection) { return `/resources?provider=${encodeURIComponent(String(resource.organizationId))}&resource=${encodeURIComponent(resource.id)}`; }
function requestHref(id: string) { return `/resources?request=${encodeURIComponent(id)}`; }

function identityForProvider(provider: ProviderDiscoveryProjection) {
  const id = String(provider.organizationId);
  return createExchangeSubjectIdentity({ subjectKind: "organization", selectionKey: organizationKey(id), organizationId: id, recordType: null, recordId: null });
}

function identityForResource(resource: ProviderResourceProjection) {
  return createExchangeSubjectIdentity({ subjectKind: "record", selectionKey: resourceKey(resource.id), organizationId: String(resource.organizationId), recordType: "provider-resource", recordId: resource.id });
}

function identityForRequest(request: ProviderRequest) {
  return createExchangeSubjectIdentity({ subjectKind: "record", selectionKey: requestKey(request.id), organizationId: String(request.providerContext.providerOrganizationId), recordType: "provider-request", recordId: request.id });
}

function favorite() {
  return projectFavoriteState({ visible: false, favorited: null, operational: false, applicable: false, authorized: false, handler: null });
}

function providerCard(provider: ProviderDiscoveryProjection, authorization: ResourcesMobileAuthorization, locale: Locale) {
  const copy = resourcesMobileCopy(locale);
  const id = String(provider.organizationId);
  return createLensResultCardModel({
    lens: "resources",
    identity: identityForProvider(provider),
    title: provider.displayName,
    organizationIdentity: provider.displayName,
    locality: provider.territory.name,
    summary: provider.populationsServed,
    indicator: { label: copy.available, value: provider.availability, emphasis: provider.availability === "available" ? "positive" : "neutral" },
    classifications: provider.categories.map((value, index) => ({ id: `category-${index}`, label: copy.official, value })),
    metadata: [
      { id: "services", label: copy.services, value: provider.services.map((service) => service.name).join(" · ") },
      { id: "eligibility", label: copy.eligibility, value: provider.eligibility },
    ],
    dates: { publishedAt: provider.publishedAt, updatedAt: provider.updatedAt },
    favorite: favorite(),
    recordActions: [
      projectRecordAction({ id: "resources.view-provider", labelKey: RESOURCES_MOBILE_RECORD_ACTION_KEYS.viewProvider, operational: true, applicable: true, authorized: authorization.openPlatform, handler: { kind: "href", href: providerHref(id) } }),
      projectRecordAction({ id: "resources.request-support", labelKey: RESOURCES_MOBILE_RECORD_ACTION_KEYS.requestSupport, operational: true, applicable: true, authorized: authorization.referralManage, handler: { kind: "href", href: providerHref(id) } }),
    ],
    canonicalHref: providerHref(id),
    returnLens: "resources",
  });
}

function resourceCard(resource: ProviderResourceProjection, provider: ProviderDiscoveryProjection | null, authorization: ResourcesMobileAuthorization, locale: Locale) {
  const copy = resourcesMobileCopy(locale);
  return createLensResultCardModel({
    lens: "resources",
    identity: identityForResource(resource),
    title: resource.title,
    organizationIdentity: resource.providerDisplayName,
    locality: provider?.territory.name ?? null,
    summary: resource.summary,
    indicator: { label: copy.available, value: resource.status, emphasis: "neutral" },
    metadata: [{ id: "eligibility", label: copy.eligibility, value: resource.eligibility }],
    dates: { publishedAt: resource.publishedAt, updatedAt: resource.updatedAt, closesAt: resource.endsAt },
    favorite: favorite(),
    recordActions: [projectRecordAction({ id: "resources.view-resource", labelKey: RESOURCES_MOBILE_RECORD_ACTION_KEYS.viewResource, operational: true, applicable: true, authorized: authorization.openPlatform, handler: { kind: "href", href: resourceHref(resource) } })],
    canonicalHref: resourceHref(resource),
    returnLens: "resources",
  });
}

function requestCard(request: ProviderRequest, authorization: ResourcesMobileAuthorization, locale: Locale) {
  const copy = resourcesMobileCopy(locale);
  const title = request.role === "sender" ? request.recipientLabel : request.senderOrganizationName;
  return createLensResultCardModel({
    lens: "resources",
    identity: identityForRequest(request),
    title,
    organizationIdentity: title,
    summary: request.summary,
    indicator: { label: copy.request, value: request.status, emphasis: ["declined", "expired"].includes(request.status) ? "attention" : "neutral" },
    dates: { updatedAt: request.updatedAt },
    favorite: favorite(),
    recordActions: [projectRecordAction({ id: "resources.view-request", labelKey: RESOURCES_MOBILE_RECORD_ACTION_KEYS.viewRequest, operational: true, applicable: true, authorized: authorization.referralManage, handler: { kind: "href", href: requestHref(request.id) } })],
    canonicalHref: requestHref(request.id),
    returnLens: "resources",
  });
}

function isProviderRequest(request: RequestProjection): request is ProviderRequest {
  return request.purpose === "provider-connection" && request.providerContext !== null;
}

function selectionFor(input: ResourcesMobileProjectionInput, providers: readonly ProviderDiscoveryProjection[], resources: readonly ProviderResourceProjection[], requests: readonly ProviderRequest[]): ExchangeSelectionState {
  const source = input.selection?.source ?? "restored";
  const resource = resources.find((candidate) => candidate.id === input.selection?.resourceId);
  if (resource) {
    const organizationId = String(resource.organizationId);
    const provider = providers.find((candidate) => String(candidate.organizationId) === organizationId);
    return createExchangeSelectionState({ kind: "record", source, selectedRecord: { selectionKey: resourceKey(resource.id), recordType: "provider-resource", recordId: resource.id, organizationId }, selectedOrganization: { selectionKey: organizationKey(organizationId), organizationId, associationRole: "provider" }, selectedMarker: provider?.marker ? { selectionKey: organizationKey(organizationId), markerId: provider.marker.id, role: "associated-organization" } : null });
  }
  const request = requests.find((candidate) => candidate.id === input.selection?.requestId);
  if (request) {
    const organizationId = String(request.providerContext.providerOrganizationId);
    const provider = providers.find((candidate) => String(candidate.organizationId) === organizationId);
    return createExchangeSelectionState({ kind: "record", source, selectedRecord: { selectionKey: requestKey(request.id), recordType: "provider-request", recordId: request.id, organizationId }, selectedOrganization: { selectionKey: organizationKey(organizationId), organizationId, associationRole: "provider" }, selectedMarker: provider?.marker ? { selectionKey: organizationKey(organizationId), markerId: provider.marker.id, role: "associated-organization" } : null });
  }
  const provider = providers.find((candidate) => String(candidate.organizationId) === input.selection?.providerOrganizationId);
  if (!provider) return createExchangeSelectionState({ kind: "none" });
  const organizationId = String(provider.organizationId);
  return createExchangeSelectionState({ kind: "organization", source, selectedOrganization: { selectionKey: organizationKey(organizationId), organizationId, associationRole: "subject" }, selectedMarker: provider.marker ? { selectionKey: organizationKey(organizationId), markerId: provider.marker.id, role: "focal" } : null });
}

function actionProjection(definition: ReturnType<typeof exchangeRoomActionDefinitionsForLens>[number], input: ResourcesMobileProjectionInput, selection: ExchangeSelectionState): ExchangeRoomActionProjection {
  const selectedOrganizationId = selection.selectedOrganization?.organizationId ?? input.viewerOrganizationId;
  const own = selectedOrganizationId === input.viewerOrganizationId;
  const variant = own ? "own" as const : "external" as const;
  const selectedResource = selection.selectedRecord?.recordType === "provider-resource";
  const operational = definition.id === "resources.offer-request" || definition.id === "resources.manage-view";
  const applicable = definition.id === "resources.offer-request" ? (own || selection.selectedOrganization !== null) : definition.id === "resources.manage-view" ? (!own && selectedResource) : true;
  const authorized = input.authorization.openPlatform && (definition.id === "resources.offer-request" ? (own ? input.authorization.resourceManage : input.authorization.referralManage) : true);
  const href = definition.id === "resources.offer-request"
    ? own ? "/resources?manage=offer#resource-management" : providerHref(selectedOrganizationId)
    : definition.id === "resources.manage-view" && selectedResource ? `/resources?provider=${encodeURIComponent(selectedOrganizationId)}&resource=${encodeURIComponent(selection.selectedRecord!.recordId)}` : null;
  const reason: ExchangeRoomActionDisabledReason | null = !operational ? "not-operational" : !applicable ? "not-applicable" : !authorized ? "not-authorized" : href ? null : "not-operational";
  return Object.freeze({ ...definition, labelKey: variant === "own" ? definition.labelKey : definition.externalLabelKey, variant, operational, applicable, authorized, authorization: variant === "own" ? definition.authorization : definition.externalAuthorization, availability: reason === null ? "active" : "disabled", disabledReason: reason, resolvedHandler: reason === null && href ? Object.freeze({ kind: "href" as const, href }) : null });
}

export interface ResourcesMobileProjectionInput {
  readonly viewerOrganizationId: string;
  readonly geography: Readonly<{ id: string; label: string | null }>;
  readonly providers: readonly ProviderDiscoveryProjection[];
  readonly resources: readonly ProviderResourceProjection[];
  readonly requests: readonly RequestProjection[];
  readonly authorization: ResourcesMobileAuthorization;
  readonly locale: Locale;
  readonly search: string;
  readonly availability: string;
  readonly selection?: ResourcesMobileSelectionInput;
  readonly camera?: ParticipantMapCamera | null;
}

export function buildResourcesMobileProjection(input: ResourcesMobileProjectionInput): ResourcesMobileProjection {
  const providers = Object.freeze(input.authorization.openPlatform ? input.providers.filter((provider) => provider.territory.releaseState === "released") : []);
  const resources = Object.freeze(input.authorization.openPlatform ? input.resources.filter((resource) => resource.status === "published") : []);
  const requests = Object.freeze(input.authorization.referralManage ? input.requests.filter(isProviderRequest) : []);
  const selection = selectionFor(input, providers, resources, requests);
  const providerCards = Object.freeze(providers.map((provider) => providerCard(provider, input.authorization, input.locale)));
  const resourceCards = Object.freeze(resources.map((resource) => resourceCard(resource, providers.find((provider) => provider.organizationId === resource.organizationId) ?? null, input.authorization, input.locale)));
  const requestCards = Object.freeze(requests.map((request) => requestCard(request, input.authorization, input.locale)));
  const cards = Object.freeze([...providerCards, ...resourceCards, ...requestCards]);
  const serviceTerritories = Object.freeze(providers.map((provider): ResourcesMobileServiceTerritoryBinding => {
    const organizationId = String(provider.organizationId);
    const geometryReference = `resource-territory:${organizationId}`;
    const area = createExchangeMapAreaProjection({ areaId: geometryReference, associationSelectionKey: organizationKey(organizationId), geographyId: provider.territory.geographyId, geometryReference, privacy: "locality-only", release: "released", accessibleLabel: `${provider.displayName}: ${provider.territory.name}`, selectable: true, selected: selectionContainsKey(selection, organizationKey(organizationId)), emphasized: selectionContainsKey(selection, organizationKey(organizationId)), layerIds: [RESOURCES_MOBILE_LAYER_IDS.serviceTerritories] });
    return Object.freeze({ providerOrganizationId: organizationId, area, geometryReference, geometry: provider.territory.geometry });
  }));
  const providerObjects = providers.flatMap((provider) => provider.marker ? [createExchangeMapObjectProjection({ identity: identityForProvider(provider), markerId: provider.marker.id, coordinate: { longitude: provider.marker.coordinate[0], latitude: provider.marker.coordinate[1] }, privacy: provider.marker.privacyTreatment, accessibleLabel: provider.marker.accessibleLocationLabel, selectable: true, layerIds: [RESOURCES_MOBILE_LAYER_IDS.providers] })] : []);
  const spatialResults: ExchangeResultSpatialDisposition[] = [
    ...providers.map((provider) => provider.marker ? ({ kind: "mapped" as const, identity: identityForProvider(provider), markerId: provider.marker.id }) : ({ kind: "list-only" as const, identity: identityForProvider(provider), reason: "missing-authoritative-coordinate" as const, explanationKey: "mobileExchange.results.listOnly.missingCoordinate" })),
    ...resources.map((resource) => ({ kind: "list-only" as const, identity: identityForResource(resource), reason: "non-point-record" as const, explanationKey: "mobileExchange.results.listOnly.nonPointRecord" })),
    ...requests.map((request) => ({ kind: "list-only" as const, identity: identityForRequest(request), reason: "non-point-record" as const, explanationKey: "mobileExchange.results.listOnly.nonPointRecord" })),
  ];
  const resultSetId = `resources:${input.geography.id}:${input.search}:${input.availability}`.slice(0, 240);
  const results = createLensResultSetState({ status: cards.length ? "ready" : "empty", lens: "resources", resultSetId, cards: cards.length ? cards : undefined, messageKey: cards.length ? null : "resourceNetworkWorkspace.empty" });
  const map = createLensMapProjection({ lens: "resources", geography: createExchangeGeographyContext({ geographyId: input.geography.id, label: input.geography.label, serverRevalidated: true }), objects: cards.length ? [...providerObjects, ...serviceTerritories.map((binding) => binding.area)] : [], activeLayerIds: [RESOURCES_MOBILE_LAYER_IDS.providers, RESOURCES_MOBILE_LAYER_IDS.serviceTerritories], layerStateAuthority: "domain-revalidated", camera: input.camera ?? null });
  const discovery = createLensDiscoveryProjection({ lens: "resources", queryId: resultSetId, map, results, spatialResults: cards.length ? spatialResults : [] });
  const actionRail = mobileLensActionRail("resources", exchangeRoomActionDefinitionsForLens("resources").map((definition) => actionProjection(definition, input, selection)));
  return Object.freeze({ discovery, selection, actionRail, serviceTerritories, providerCards, resourceCards, requestCards });
}
