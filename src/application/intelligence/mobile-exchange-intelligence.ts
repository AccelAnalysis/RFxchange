import type { ControlledLocalityMapModel } from "../geography/controlled-locality-map.ts";
import type {
  NetworkDiscoveryOrganization,
  NetworkDiscoveryProjection,
} from "../network-discovery/network-discovery.ts";
import { projectExchangeRoomActions } from "../participant/exchange-room-actions.ts";
import {
  createExchangeGeographyContext,
  createExchangeLensQuery,
  createExchangeMapObjectProjection,
  createExchangeSubjectIdentity,
  createLensDiscoveryProjection,
  createLensMapProjection,
  createLensResultCardModel,
  createLensResultSetState,
  mobileLensActionRail,
  projectFavoriteState,
  type ExchangeResultClassification,
  type ExchangeResultMetadata,
  type ExchangeResultSpatialDisposition,
  type ExchangeSubjectIdentity,
  type LensActionRailContract,
  type LensDiscoveryProjection,
  type LensResultCardModel,
} from "../participant/mobile-exchange-contracts.ts";
import {
  createIntelligenceCoverageTruth,
  createIntelligenceOrganizationVisibility,
  createIntelligenceRecordTruth,
  CURRENT_APPROVED_INTELLIGENCE_LAYER_IDS,
  type IntelligenceCoverageTruth,
  type IntelligenceRecordTruth,
  type IntelligenceServerScopeAuthority,
} from "../../domain/intelligence/mobile-exchange-intelligence.ts";
import type { Locale } from "../../i18n/config.ts";

export const MOBILE_EXCHANGE_INTELLIGENCE_LENS_ID = "intelligence" as const;
// Mirrors the existing Network discovery hard cap without loading its service class
// into the provider-neutral projection boundary.
export const INTELLIGENCE_NETWORK_DISCOVERY_CANDIDATE_LIMIT = 250 as const;

type IntelligenceProjectionCopy = Readonly<{
  openOrganization: string;
  recordType: string;
  recordTypeValue: string;
  visibility: string;
  visibilityValue: string;
  source: string;
  sourceValue: string;
  geography: string;
  vintage: string;
  quality: string;
  qualityValue: string;
  coverage: string;
  coverageValue: string;
  noCapabilitySummary: string;
}>;

export const INTELLIGENCE_PROJECTION_COPY: Readonly<Record<Locale, IntelligenceProjectionCopy>> = Object.freeze({
  "en-US": Object.freeze({
    openOrganization: "Open organization intelligence for",
    recordType: "Record type",
    recordTypeValue: "Organization network result",
    visibility: "Visibility",
    visibilityValue: "Authorized participant organization",
    source: "Source",
    sourceValue: "RFxchange authoritative organization discovery",
    geography: "Geography",
    vintage: "Source vintage",
    quality: "Quality",
    qualityValue: "Authoritative current projection",
    coverage: "Coverage",
    coverageValue: "Bounded participant discovery",
    noCapabilitySummary: "No permitted capability summary is available.",
  }),
  es: Object.freeze({
    openOrganization: "Abrir inteligencia de la organización para",
    recordType: "Tipo de registro",
    recordTypeValue: "Resultado de la red de organizaciones",
    visibility: "Visibilidad",
    visibilityValue: "Organización participante autorizada",
    source: "Fuente",
    sourceValue: "Descubrimiento autorizado de organizaciones de RFxchange",
    geography: "Geografía",
    vintage: "Vigencia de la fuente",
    quality: "Calidad",
    qualityValue: "Proyección actual autorizada",
    coverage: "Cobertura",
    coverageValue: "Descubrimiento limitado de participantes",
    noCapabilitySummary: "No hay un resumen de capacidades permitido disponible.",
  }),
  fr: Object.freeze({
    openOrganization: "Ouvrir les renseignements sur l’organisation pour",
    recordType: "Type d’enregistrement",
    recordTypeValue: "Résultat du réseau d’organisations",
    visibility: "Visibilité",
    visibilityValue: "Organisation participante autorisée",
    source: "Source",
    sourceValue: "Découverte d’organisations autorisée par RFxchange",
    geography: "Zone géographique",
    vintage: "Millésime de la source",
    quality: "Qualité",
    qualityValue: "Projection actuelle autorisée",
    coverage: "Couverture",
    coverageValue: "Découverte limitée des participants",
    noCapabilitySummary: "Aucun résumé de capacité autorisé n’est disponible.",
  }),
  it: Object.freeze({
    openOrganization: "Apri le informazioni sull’organizzazione per",
    recordType: "Tipo di record",
    recordTypeValue: "Risultato della rete di organizzazioni",
    visibility: "Visibilità",
    visibilityValue: "Organizzazione partecipante autorizzata",
    source: "Fonte",
    sourceValue: "Ricerca autorizzata delle organizzazioni RFxchange",
    geography: "Area geografica",
    vintage: "Versione della fonte",
    quality: "Qualità",
    qualityValue: "Proiezione corrente autorizzata",
    coverage: "Copertura",
    coverageValue: "Ricerca limitata dei partecipanti",
    noCapabilitySummary: "Non è disponibile alcun riepilogo autorizzato delle capacità.",
  }),
  de: Object.freeze({
    openOrganization: "Organisationsinformationen öffnen für",
    recordType: "Datensatztyp",
    recordTypeValue: "Ergebnis des Organisationsnetzwerks",
    visibility: "Sichtbarkeit",
    visibilityValue: "Autorisierte Teilnehmerorganisation",
    source: "Quelle",
    sourceValue: "Autorisierte RFxchange-Organisationssuche",
    geography: "Geografie",
    vintage: "Stand der Quelle",
    quality: "Qualität",
    qualityValue: "Aktuelle autorisierte Projektion",
    coverage: "Abdeckung",
    coverageValue: "Begrenzte Teilnehmersuche",
    noCapabilitySummary: "Keine zulässige Zusammenfassung der Fähigkeiten ist verfügbar.",
  }),
});

export interface IntelligenceMobileExchangeProjection {
  readonly queryIdentity: string;
  readonly discovery: LensDiscoveryProjection;
  readonly actionRail: LensActionRailContract;
  readonly recordTruthBySelectionKey: Readonly<Record<string, IntelligenceRecordTruth>>;
  readonly coverage: IntelligenceCoverageTruth;
  readonly approvedLayerIds: readonly string[];
  readonly selectedOrganizationId: string;
  readonly sourceDisposition: "current-main" | "pr-220-reconciled-and-superseded";
}

function normalized(value: string, label: string, maximum = 240): string {
  const result = value.trim().replace(/\s+/g, " ");
  if (!result || result.length > maximum) throw new Error(`${label} is invalid.`);
  return result;
}

function organizationIdentity(organizationId: string): ExchangeSubjectIdentity {
  const id = normalized(organizationId, "Organization id", 191);
  return createExchangeSubjectIdentity({
    subjectKind: "organization",
    selectionKey: `organization:${id}`,
    organizationId: id,
    recordType: null,
    recordId: null,
  });
}

function orderedOrganizations(
  discovery: NetworkDiscoveryProjection | null,
  focusedOrganization: NetworkDiscoveryOrganization | null,
): readonly NetworkDiscoveryOrganization[] {
  const page = discovery?.organizations ?? [];
  if (!focusedOrganization) return Object.freeze([...page]);
  const focusedId = String(focusedOrganization.organizationId);
  return page.some((organization) => String(organization.organizationId) === focusedId)
    ? Object.freeze([...page])
    : Object.freeze([focusedOrganization, ...page]);
}

function capabilitySummary(
  organization: NetworkDiscoveryOrganization,
  copy: IntelligenceProjectionCopy,
): string {
  const labels = organization.capabilities.length > 0
    ? organization.capabilities.map((capability) => capability.label)
    : organization.profile.capabilities.map((capability) => capability.name);
  return labels.length > 0 ? labels.slice(0, 3).join(" · ") : copy.noCapabilitySummary;
}

function stableIdentity(value: string): string {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function canonicalOrganizationHref(
  organizationId: string,
  discovery: NetworkDiscoveryProjection | null,
): string {
  const params = new URLSearchParams();
  params.set("selectedOrganization", normalized(organizationId, "Organization id", 191));
  if (discovery?.query.capability) params.set("q", discovery.query.capability);
  if (discovery?.query.serviceGeographyId) params.set("serviceArea", discovery.query.serviceGeographyId);
  if ((discovery?.page ?? 1) > 1) params.set("page", String(discovery?.page));
  return `/geography/canvas?${params.toString()}`;
}

function classifications(copy: IntelligenceProjectionCopy): readonly ExchangeResultClassification[] {
  return Object.freeze([
    Object.freeze({ id: "record-type", label: copy.recordType, value: copy.recordTypeValue }),
    Object.freeze({ id: "visibility", label: copy.visibility, value: copy.visibilityValue }),
    Object.freeze({ id: "source", label: copy.source, value: copy.sourceValue }),
  ]);
}

function metadata(
  truth: IntelligenceRecordTruth,
  copy: IntelligenceProjectionCopy,
): readonly ExchangeResultMetadata[] {
  return Object.freeze([
    Object.freeze({ id: "geography", label: copy.geography, value: truth.geography.label }),
    Object.freeze({ id: "vintage", label: copy.vintage, value: truth.vintage.sourceVintage }),
    Object.freeze({ id: "quality", label: copy.quality, value: copy.qualityValue }),
    Object.freeze({ id: "coverage", label: copy.coverage, value: copy.coverageValue }),
  ]);
}

function hiddenFavorite() {
  return projectFavoriteState({
    visible: false,
    favorited: null,
    operational: false,
    applicable: false,
    authorized: false,
    handler: null,
  });
}

function resultCard(
  organization: NetworkDiscoveryOrganization,
  discovery: NetworkDiscoveryProjection | null,
  truth: IntelligenceRecordTruth,
  copy: IntelligenceProjectionCopy,
): LensResultCardModel {
  const identity = organizationIdentity(String(organization.organizationId));
  return createLensResultCardModel({
    lens: MOBILE_EXCHANGE_INTELLIGENCE_LENS_ID,
    identity,
    title: organization.profile.displayName,
    accessibleLabel: `${copy.openOrganization} ${organization.profile.displayName}`,
    organizationIdentity: organization.profile.displayName,
    locality: organization.profile.location.localityName,
    summary: capabilitySummary(organization, copy),
    status: Object.freeze({ label: copy.quality, value: copy.qualityValue, emphasis: "neutral" }),
    dates: Object.freeze({ updatedAt: truth.vintage.projectedAt }),
    classifications: classifications(copy),
    metadata: metadata(truth, copy),
    favorite: hiddenFavorite(),
    recordActions: Object.freeze([]),
    canonicalHref: canonicalOrganizationHref(String(organization.organizationId), discovery),
    returnLens: MOBILE_EXCHANGE_INTELLIGENCE_LENS_ID,
  });
}

function scopeAuthority(input: Readonly<{
  viewerUserId: string;
  viewerOrganizationId: string;
}>): IntelligenceServerScopeAuthority {
  return Object.freeze({
    authoritySource: "server-derived",
    viewerUserId: normalized(input.viewerUserId, "Viewer user id", 191),
    viewerOrganizationId: normalized(input.viewerOrganizationId, "Viewer organization id", 191),
    permittedTeamIds: Object.freeze([]),
    publicRecordsPermitted: true,
  });
}

function resultStateMessage(status: "empty" | "restricted" | "unavailable"): string {
  if (status === "empty") return "networkWorkspace.search.noResultsBody";
  if (status === "restricted") return "networkWorkspace.status.permission.body";
  return "networkWorkspace.status.error.body";
}

export function projectIntelligenceMobileExchange(input: Readonly<{
  locale: Locale;
  viewerUserId: string;
  viewerOrganizationId: string;
  mapModel: ControlledLocalityMapModel;
  discovery: NetworkDiscoveryProjection | null;
  unavailableReason?: "geography-not-permitted" | "dependency-unavailable" | null;
  focusedOrganization?: NetworkDiscoveryOrganization | null;
  selectedOrganizationId?: string | null;
  projectedAt: string;
}>): IntelligenceMobileExchangeProjection {
  const copy = INTELLIGENCE_PROJECTION_COPY[input.locale];
  const organizations = orderedOrganizations(input.discovery, input.focusedOrganization ?? null);
  const geographyId = String(input.mapModel.selectedGeography.id);
  const query = createExchangeLensQuery({
    lens: MOBILE_EXCHANGE_INTELLIGENCE_LENS_ID,
    locale: input.locale,
    geographyId,
    bounds: input.mapModel.camera.bounds,
    search: input.discovery?.query.capability ?? "",
    filters: input.discovery?.query.serviceGeographyId
      ? Object.freeze({ serviceArea: input.discovery.query.serviceGeographyId })
      : Object.freeze({}),
    resultPage: input.discovery?.page ?? 1,
  });
  const querySuffix = stableIdentity(query.requestIdentity);
  const queryId = `intelligence-query:${querySuffix}`;
  const resultSetId = `intelligence-results:${querySuffix}`;
  const coverage = createIntelligenceCoverageTruth({
    currentPageCount: input.discovery?.organizations.length ?? 0,
    projectedCount: organizations.length,
    totalMatched: Math.max(input.discovery?.totalMatched ?? 0, organizations.length),
    candidateLimit: INTELLIGENCE_NETWORK_DISCOVERY_CANDIDATE_LIMIT,
    geographyId,
  });
  const authority = scopeAuthority(input);
  const visibility = createIntelligenceOrganizationVisibility(input.viewerOrganizationId);
  const truthEntries = organizations.map((organization) => {
    const organizationId = String(organization.organizationId);
    const identity = organizationIdentity(organizationId);
    const truth = createIntelligenceRecordTruth({
      recordId: `network:${organizationId}`,
      organizationId,
      visibility,
      scopeAuthority: authority,
      geographyId,
      geographyLabel: input.mapModel.selectedGeography.name,
      geographyAuthority: input.mapModel.attribution.label,
      sourceLayerUrl: input.mapModel.attribution.sourceLayerUrl,
      sourceVintage: input.mapModel.attribution.vintage,
      projectedAt: input.projectedAt,
      caveats: Object.freeze([
        "A discovery result is not qualification, endorsement, availability, or a full-market observation.",
      ]),
      coverage,
    });
    return Object.freeze({ organization, identity, truth });
  });
  const cards = Object.freeze(truthEntries.map(({ organization, truth }) =>
    resultCard(organization, input.discovery, truth, copy)));
  const objects = Object.freeze(truthEntries.map(({ organization, identity }) =>
    createExchangeMapObjectProjection({
      identity,
      markerId: organization.marker.id,
      coordinate: Object.freeze({
        longitude: organization.marker.coordinate[0],
        latitude: organization.marker.coordinate[1],
      }),
      privacy: organization.profile.location.visibility,
      accessibleLabel: `${organization.marker.label} — ${organization.marker.accessibleLocationLabel}`,
      selectable: true,
      projectionRole: "result",
      layerIds: CURRENT_APPROVED_INTELLIGENCE_LAYER_IDS,
    })));
  const map = createLensMapProjection({
    lens: MOBILE_EXCHANGE_INTELLIGENCE_LENS_ID,
    geography: createExchangeGeographyContext({
      geographyId,
      label: input.mapModel.selectedGeography.name,
      serverRevalidated: true,
    }),
    objects,
    activeLayerIds: CURRENT_APPROVED_INTELLIGENCE_LAYER_IDS,
    layerStateAuthority: "domain-revalidated",
    bounds: input.mapModel.camera.bounds,
  });
  const resultStatus = input.unavailableReason === "geography-not-permitted"
    ? "restricted" as const
    : input.unavailableReason
      ? "unavailable" as const
      : cards.length === 0
        ? "empty" as const
        : "ready" as const;
  const results = resultStatus === "ready"
    ? createLensResultSetState({
        status: "ready",
        lens: MOBILE_EXCHANGE_INTELLIGENCE_LENS_ID,
        resultSetId,
        cards,
      })
    : createLensResultSetState({
        status: resultStatus,
        lens: MOBILE_EXCHANGE_INTELLIGENCE_LENS_ID,
        resultSetId: resultStatus === "empty" ? resultSetId : null,
        messageKey: resultStateMessage(resultStatus),
      });
  const spatialResults: readonly ExchangeResultSpatialDisposition[] = resultStatus === "ready"
    ? Object.freeze(truthEntries.map(({ identity, organization }) => Object.freeze({
        kind: "mapped" as const,
        identity,
        markerId: organization.marker.id,
      })))
    : Object.freeze([]);
  const lensDiscovery = createLensDiscoveryProjection({
    lens: MOBILE_EXCHANGE_INTELLIGENCE_LENS_ID,
    queryId,
    map,
    results,
    spatialResults,
  });
  const authorizedSelection = input.selectedOrganizationId
    ? organizations.find((organization) => String(organization.organizationId) === input.selectedOrganizationId)
    : null;
  const selectedOrganizationId = authorizedSelection
    ? String(authorizedSelection.organizationId)
    : normalized(input.viewerOrganizationId, "Viewer organization id", 191);
  const actionRail = mobileLensActionRail(
    MOBILE_EXCHANGE_INTELLIGENCE_LENS_ID,
    projectExchangeRoomActions({
      activeLens: MOBILE_EXCHANGE_INTELLIGENCE_LENS_ID,
      viewerOrganizationId: input.viewerOrganizationId,
      selectedOrganizationId,
      selectedOrganizationIsOfficialResourceProvider: false,
      openPlatformActionsAuthorized: false,
      networkDiscoveryAvailable: input.discovery !== null,
      actionAuthorization: Object.freeze({ rfxCreate: false, referralManage: false, resourceManage: false }),
      currentOpportunityReference: null,
    }),
  );
  return Object.freeze({
    queryIdentity: query.requestIdentity,
    discovery: lensDiscovery,
    actionRail,
    recordTruthBySelectionKey: Object.freeze(Object.fromEntries(
      truthEntries.map(({ identity, truth }) => [identity.selectionKey, truth]),
    )),
    coverage,
    approvedLayerIds: CURRENT_APPROVED_INTELLIGENCE_LAYER_IDS,
    selectedOrganizationId,
    sourceDisposition: "pr-220-reconciled-and-superseded",
  });
}
