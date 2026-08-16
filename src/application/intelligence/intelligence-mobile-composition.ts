import type { ControlledLocalityMapModel } from "../geography/controlled-locality-map.ts";
import type {
  PublicOrganizationAdditionalLocation,
  PublicOrganizationProfileAsset,
} from "../../domain/organization-enrichment/model.ts";
import type {
  NetworkDiscoveryOrganization,
  NetworkDiscoveryProjection,
} from "../network-discovery/network-discovery.ts";
import { projectExchangeRoomActions } from "../participant/exchange-room-actions.ts";
import {
  EXCHANGE_SHEET_SNAP_POINTS,
  createExchangeMapObjectProjection,
  createExchangeMediaModel,
  createExchangeSelectionState,
  createExchangeSubjectIdentity,
  createLensResultCardModel,
  mobileLensActionRail,
  projectFavoriteState,
  type ExchangeBottomSheetContract,
  type ExchangeMapPrivacy,
  type ExchangeMediaModel,
  type ExchangeResultMetadata,
  type ExchangeSelectionState,
  type ExchangeSubjectIdentity,
  type LensActionRailContract,
  type LensMapProjection,
  type LensResultCardModel,
} from "../participant/mobile-exchange-contracts.ts";
import {
  transitionMobileExchangeContinuityLens,
  withDomainRevalidatedMobileExchangeLayers,
  withServerRevalidatedMobileExchangeGeography,
  type MobileExchangeContinuityState,
} from "../participant/mobile-exchange-continuity.ts";

export const INTELLIGENCE_MOBILE_LENS_ID = "intelligence" as const;

/**
 * Current production truth: Intelligence has no governed analytical layer runtime yet.
 * The shared layer state is still revalidated so stale or fabricated layer ids fail out.
 */
export const CURRENT_INTELLIGENCE_ANALYTICAL_LAYER_IDS: readonly string[] = Object.freeze([]);

export const INTELLIGENCE_MOBILE_COVERAGE_CAVEAT =
  "Organization results are the current authorized RFxchange Network discovery projection; "
  + "its reported total is not full-market size, economic activity, density, capability concentration, or a market-gap measure.";

export type IntelligenceMobileCapabilityContext =
  | Readonly<{
      source: "amacs-claim";
      capabilityId: string;
      label: string;
      definition: string;
      domainLabel: string;
      familyLabel: string;
      specialties: readonly string[];
      amacsReleaseVersion: string;
      assertionStatus: "self_reported" | "evidence_submitted" | "verified";
      provenanceLabel: "Organization claimed";
    }>
  | Readonly<{
      source: "organization-profile";
      capabilityId: string;
      label: string;
      definition: string;
      category: string;
      amacsReleaseVersion: null;
      assertionStatus: null;
      provenanceLabel: "Organization profile";
    }>;

export interface IntelligenceMobilePublicEnrichment {
  readonly assets: readonly PublicOrganizationProfileAsset[];
  readonly additionalLocations: readonly PublicOrganizationAdditionalLocation[];
}

export interface IntelligenceMobileLocationDetail {
  readonly identity: ExchangeSubjectIdentity;
  readonly organizationId: string;
  readonly organizationTitle: string;
  readonly label: string;
  readonly locality: string;
  readonly geographyId: string;
  readonly visibility: "exact" | "approximate" | "locality-only";
  readonly displayAddress: PublicOrganizationAdditionalLocation["displayAddress"] | null;
  readonly mapProjected: boolean;
  readonly relationship: "subordinate-location";
}

export interface IntelligenceMobileOrganizationDetail {
  readonly identity: ExchangeSubjectIdentity;
  readonly organizationId: string;
  readonly title: string;
  readonly website: string | null;
  readonly locality: string;
  readonly location: Readonly<{
    visibility: "exact" | "approximate" | "locality-only";
    geographyId: string;
    localityName: string;
    coordinateIncluded: false;
    addressIncluded: false;
  }>;
  readonly capabilities: readonly IntelligenceMobileCapabilityContext[];
  readonly publishedLocations: readonly IntelligenceMobileLocationDetail[];
  readonly geographyProvenance: Readonly<{
    authority: string;
    sourceLayerUrl: string;
    vintage: string;
    retrievedAt: string;
  }>;
  readonly caveats: readonly string[];
}

export interface IntelligenceMobileCardBinding {
  readonly card: LensResultCardModel;
  readonly source: "result-page" | "focused-context" | "selected-location-context";
}

export interface IntelligenceMobileCoverage {
  readonly source: "authorized-network-discovery";
  readonly currentPageOrganizationCount: number;
  readonly projectedCardCount: number;
  readonly reportedTotalMatched: number | null;
  readonly reportedTotalMatchedMeaning: "bounded-authorized-discovery-set";
  readonly caveat: typeof INTELLIGENCE_MOBILE_COVERAGE_CAVEAT;
}

export interface IntelligenceMobileDomainAvailability {
  readonly organizations: boolean;
  readonly capabilityContext: boolean;
  readonly locations: boolean;
  readonly sites: false;
  readonly analyticalLayers: false;
  readonly watchFavorite: false;
  readonly compare: false;
}

export interface IntelligenceMobileComposition {
  readonly lens: typeof INTELLIGENCE_MOBILE_LENS_ID;
  readonly state: MobileExchangeContinuityState;
  readonly selection: ExchangeSelectionState;
  readonly mapProjection: LensMapProjection;
  readonly actionRail: LensActionRailContract;
  readonly cards: readonly LensResultCardModel[];
  readonly cardBindings: readonly IntelligenceMobileCardBinding[];
  readonly bottomSheet: ExchangeBottomSheetContract;
  readonly details: readonly IntelligenceMobileOrganizationDetail[];
  readonly locationDetails: readonly IntelligenceMobileLocationDetail[];
  readonly currentAnalyticalLayerIds: readonly string[];
  readonly coverage: IntelligenceMobileCoverage;
  readonly domainAvailability: IntelligenceMobileDomainAvailability;
}

function required(value: string, label: string, maximum = 240): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maximum) throw new Error(`${label} exceeds ${maximum} characters.`);
  return normalized;
}

function organizationSelectionKey(organizationId: string): string {
  return `organization:${required(organizationId, "Organization id", 191)}`;
}

function organizationIdentity(
  organization: NetworkDiscoveryOrganization,
): ExchangeSubjectIdentity {
  const organizationId = String(organization.organizationId);
  return createExchangeSubjectIdentity({
    subjectKind: "organization",
    selectionKey: organizationSelectionKey(organizationId),
    organizationId,
    recordType: null,
    recordId: null,
  });
}

function publicEnrichmentFor(
  enrichmentByOrganizationId: Readonly<Record<string, IntelligenceMobilePublicEnrichment>> | undefined,
  organizationId: string,
): IntelligenceMobilePublicEnrichment {
  const enrichment = enrichmentByOrganizationId?.[organizationId];
  return enrichment ?? Object.freeze({ assets: Object.freeze([]), additionalLocations: Object.freeze([]) });
}

function selectedOrganizationMedia(
  enrichment: IntelligenceMobilePublicEnrichment,
): ExchangeMediaModel | null {
  const candidate = enrichment.assets.find((asset) => asset.kind === "logo")
    ?? enrichment.assets.find((asset) => asset.kind === "image")
    ?? enrichment.assets.find((asset) => asset.kind === "portfolio")
    ?? null;
  if (!candidate || candidate.kind === "document") return null;
  const kind = candidate.kind === "logo"
    ? "organization-logo" as const
    : candidate.kind === "portfolio"
      ? "project-image" as const
      : "business-photo" as const;
  return createExchangeMediaModel({
    kind,
    assetReference: candidate.deliveryPath,
    alt: candidate.altText ?? candidate.title,
  });
}

function locationIdentity(
  location: PublicOrganizationAdditionalLocation,
): ExchangeSubjectIdentity {
  const organizationId = String(location.organizationId);
  return createExchangeSubjectIdentity({
    subjectKind: "record",
    selectionKey: `organization-location:${required(location.id, "Additional location id", 191)}`,
    organizationId,
    recordType: "organization-additional-location",
    recordId: String(location.id),
  });
}

function locationDetail(
  organization: NetworkDiscoveryOrganization,
  location: PublicOrganizationAdditionalLocation,
): IntelligenceMobileLocationDetail {
  return Object.freeze({
    identity: locationIdentity(location),
    organizationId: String(organization.organizationId),
    organizationTitle: organization.profile.displayName,
    label: location.label,
    locality: location.localityName,
    geographyId: String(location.geographyId),
    visibility: location.visibility,
    displayAddress: location.visibility === "exact" ? location.displayAddress ?? null : null,
    mapProjected: location.visibility !== "locality-only" && Boolean(location.coordinate),
    relationship: location.relationship,
  });
}

function privacyFor(
  organization: NetworkDiscoveryOrganization,
): ExchangeMapPrivacy {
  return organization.profile.location.visibility;
}

function formatLocationVisibility(
  visibility: NetworkDiscoveryOrganization["profile"]["location"]["visibility"],
): string {
  if (visibility === "locality-only") return "Locality only";
  if (visibility === "approximate") return "Approximate";
  return "Exact";
}

function formatAssertionStatus(
  status: "self_reported" | "evidence_submitted" | "verified",
): string {
  if (status === "self_reported") return "Self reported";
  if (status === "evidence_submitted") return "Evidence submitted";
  return "Verified";
}

function capabilityContexts(
  organization: NetworkDiscoveryOrganization,
): readonly IntelligenceMobileCapabilityContext[] {
  if (organization.capabilities.length > 0) {
    return Object.freeze(organization.capabilities.map((capability) => Object.freeze({
      source: "amacs-claim" as const,
      capabilityId: capability.capabilityId,
      label: capability.label,
      definition: capability.definition,
      domainLabel: capability.domainLabel,
      familyLabel: capability.familyLabel,
      specialties: Object.freeze([...capability.specialties]),
      amacsReleaseVersion: capability.amacsReleaseVersion,
      assertionStatus: capability.assertionStatus,
      provenanceLabel: capability.provenanceLabel,
    })));
  }

  return Object.freeze(organization.profile.capabilities.map((capability) => Object.freeze({
    source: "organization-profile" as const,
    capabilityId: String(capability.id),
    label: capability.name,
    definition: capability.description,
    category: capability.category,
    amacsReleaseVersion: null,
    assertionStatus: null,
    provenanceLabel: "Organization profile" as const,
  })));
}

function cardMetadata(
  organization: NetworkDiscoveryOrganization,
  capabilities: readonly IntelligenceMobileCapabilityContext[],
): readonly ExchangeResultMetadata[] {
  const metadata: ExchangeResultMetadata[] = [
    Object.freeze({
      id: "location-precision",
      label: "Location",
      value: formatLocationVisibility(organization.profile.location.visibility),
    }),
  ];

  const amacsClaims = capabilities.filter(
    (capability): capability is Extract<IntelligenceMobileCapabilityContext, { source: "amacs-claim" }> =>
      capability.source === "amacs-claim",
  );
  if (amacsClaims.length > 0) {
    metadata.push(Object.freeze({
      id: "capability-provenance",
      label: "Provenance",
      value: "Organization claimed",
    }));
    metadata.push(Object.freeze({
      id: "amacs-release",
      label: "AMACS",
      value: [...new Set(amacsClaims.map((claim) => claim.amacsReleaseVersion))].join(", "),
    }));
    metadata.push(Object.freeze({
      id: "capability-status",
      label: "Capability status",
      value: [...new Set(amacsClaims.map((claim) => formatAssertionStatus(claim.assertionStatus)))].join(", "),
    }));
  } else if (capabilities.length > 0) {
    metadata.push(Object.freeze({
      id: "capability-provenance",
      label: "Provenance",
      value: "Organization profile",
    }));
  }

  return Object.freeze(metadata);
}

function cardSummary(
  capabilities: readonly IntelligenceMobileCapabilityContext[],
): string | null {
  if (capabilities.length === 0) return null;
  return required(
    capabilities.slice(0, 3).map((capability) => capability.label).join(" · "),
    "Capability summary",
  );
}

function intelligenceOrganizationHref(baseHref: string, organizationId: string): string {
  const fallback = new URL("/geography/canvas", "https://participant.invalid");
  let destination = fallback;
  try {
    const parsed = new URL(baseHref, "https://participant.invalid");
    if (parsed.origin === "https://participant.invalid" && parsed.pathname === "/geography/canvas") {
      destination = parsed;
    }
  } catch {
    destination = fallback;
  }
  destination.searchParams.set("selectedOrganization", required(organizationId, "Organization id", 191));
  return `${destination.pathname}${destination.search}`;
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

function organizationCard(
  organization: NetworkDiscoveryOrganization,
  baseHref: string,
  enrichment: IntelligenceMobilePublicEnrichment,
): LensResultCardModel {
  const capabilities = capabilityContexts(organization);
  return createLensResultCardModel({
    identity: organizationIdentity(organization),
    title: organization.profile.displayName,
    organizationIdentity: organization.profile.displayName,
    locality: organization.profile.location.localityName,
    summary: cardSummary(capabilities),
    indicator: null,
    metadata: cardMetadata(organization, capabilities),
    media: selectedOrganizationMedia(enrichment),
    favorite: hiddenFavorite(),
    recordActions: Object.freeze([]),
    canonicalHref: intelligenceOrganizationHref(baseHref, String(organization.organizationId)),
    returnLens: INTELLIGENCE_MOBILE_LENS_ID,
  });
}

function organizationDetail(
  organization: NetworkDiscoveryOrganization,
  mapModel: ControlledLocalityMapModel,
  enrichment: IntelligenceMobilePublicEnrichment,
): IntelligenceMobileOrganizationDetail {
  const location = organization.profile.location;
  return Object.freeze({
    identity: organizationIdentity(organization),
    organizationId: String(organization.organizationId),
    title: organization.profile.displayName,
    website: organization.profile.website,
    locality: location.localityName,
    location: Object.freeze({
      visibility: location.visibility,
      geographyId: String(location.geographyId),
      localityName: location.localityName,
      coordinateIncluded: false as const,
      addressIncluded: false as const,
    }),
    capabilities: capabilityContexts(organization),
    publishedLocations: Object.freeze(enrichment.additionalLocations.map((location) => locationDetail(organization, location))),
    geographyProvenance: Object.freeze({
      authority: mapModel.attribution.label,
      sourceLayerUrl: mapModel.attribution.sourceLayerUrl,
      vintage: mapModel.attribution.vintage,
      retrievedAt: mapModel.attribution.retrievedAt,
    }),
    caveats: Object.freeze([INTELLIGENCE_MOBILE_COVERAGE_CAVEAT]),
  });
}

function organizationMapProjection(
  organization: NetworkDiscoveryOrganization,
) {
  return createExchangeMapObjectProjection({
    identity: organizationIdentity(organization),
    markerId: organization.marker.id,
    coordinate: Object.freeze({
      longitude: organization.marker.coordinate[0],
      latitude: organization.marker.coordinate[1],
    }),
    privacy: privacyFor(organization),
    accessibleLabel: required(
      `${organization.marker.label} — ${organization.marker.accessibleLocationLabel}`,
      "Organization map label",
    ),
    selectable: true,
    layerIds: CURRENT_INTELLIGENCE_ANALYTICAL_LAYER_IDS,
  });
}

function additionalLocationMapProjection(
  organization: NetworkDiscoveryOrganization,
  location: PublicOrganizationAdditionalLocation,
) {
  if (location.visibility === "locality-only" || !location.coordinate) return null;
  const identity = locationIdentity(location);
  return createExchangeMapObjectProjection({
    identity,
    markerId: `additional-location:${String(location.id)}`,
    coordinate: Object.freeze({ longitude: location.coordinate[0], latitude: location.coordinate[1] }),
    privacy: location.visibility,
    accessibleLabel: required(
      `${organization.profile.displayName} — ${location.label}, ${location.localityName}`,
      "Additional location map label",
    ),
    selectable: true,
    layerIds: CURRENT_INTELLIGENCE_ANALYTICAL_LAYER_IDS,
  });
}

function selectedLocationContext(
  state: MobileExchangeContinuityState,
  organizations: readonly NetworkDiscoveryOrganization[],
  enrichmentByOrganizationId: Readonly<Record<string, IntelligenceMobilePublicEnrichment>> | undefined,
): Readonly<{ organization: NetworkDiscoveryOrganization; location: PublicOrganizationAdditionalLocation }> | null {
  if (state.selection.kind !== "record"
    || state.selection.selectedRecord?.recordType !== "organization-additional-location") return null;
  const recordId = state.selection.selectedRecord.recordId;
  const organizationId = state.selection.selectedRecord.organizationId;
  if (!organizationId) return null;
  const organization = organizations.find((candidate) => String(candidate.organizationId) === organizationId);
  if (!organization) return null;
  const location = publicEnrichmentFor(enrichmentByOrganizationId, organizationId).additionalLocations.find(
    (candidate) => String(candidate.id) === recordId,
  );
  return location ? Object.freeze({ organization, location }) : null;
}

function selectedLocationCard(
  organization: NetworkDiscoveryOrganization,
  location: PublicOrganizationAdditionalLocation,
): LensResultCardModel {
  return createLensResultCardModel({
    identity: locationIdentity(location),
    title: location.label,
    organizationIdentity: organization.profile.displayName,
    locality: location.localityName,
    summary: null,
    indicator: null,
    metadata: Object.freeze([
      Object.freeze({ id: "location-relationship", label: "Context", value: "Additional organization location" }),
      Object.freeze({ id: "location-precision", label: "Location", value: formatLocationVisibility(location.visibility) }),
    ]),
    media: null,
    favorite: hiddenFavorite(),
    recordActions: Object.freeze([]),
    canonicalHref: null,
    returnLens: INTELLIGENCE_MOBILE_LENS_ID,
  });
}

function orderedOrganizations(
  discovery: NetworkDiscoveryProjection | null,
  focusedOrganization: NetworkDiscoveryOrganization | null,
): readonly NetworkDiscoveryOrganization[] {
  const page = discovery?.organizations ?? [];
  if (!focusedOrganization) return Object.freeze([...page]);
  const focusedId = String(focusedOrganization.organizationId);
  if (page.some((organization) => String(organization.organizationId) === focusedId)) {
    return Object.freeze([...page]);
  }
  return Object.freeze([focusedOrganization, ...page]);
}

function cardSource(
  organization: NetworkDiscoveryOrganization,
  discovery: NetworkDiscoveryProjection | null,
): IntelligenceMobileCardBinding["source"] {
  return discovery?.organizations.some(
    (candidate) => String(candidate.organizationId) === String(organization.organizationId),
  )
    ? "result-page"
    : "focused-context";
}

function withFocusedOrganizationSelection(
  state: MobileExchangeContinuityState,
  focusedOrganization: NetworkDiscoveryOrganization | null,
): MobileExchangeContinuityState {
  if (!focusedOrganization) return state;
  const organizationId = String(focusedOrganization.organizationId);
  if (
    state.selection.kind === "record"
    && state.selection.selectedRecord?.recordType === "organization-additional-location"
    && state.selection.selectedRecord.organizationId === organizationId
  ) {
    return state;
  }
  const selectionKey = organizationSelectionKey(organizationId);
  const selection = createExchangeSelectionState({
    kind: "organization",
    source: "restored",
    selectedOrganization: {
      selectionKey,
      organizationId,
      associationRole: "subject",
    },
    selectedMarker: {
      selectionKey,
      markerId: focusedOrganization.marker.id,
      role: "focal",
    },
  });
  const selectionChanged = state.selection.kind === "none"
    || state.selection.selectionKey !== selection.selectionKey;
  return Object.freeze({
    ...state,
    selection,
    sheet: selectionChanged
      ? Object.freeze({
          ...state.sheet,
          content: "results" as const,
          detailContext: null,
        })
      : state.sheet,
    detail: selectionChanged
      ? Object.freeze({ status: "closed" as const, detailContext: null, errorCode: null })
      : state.detail,
  });
}

function selectOrganizationForIntelligence(
  state: MobileExchangeContinuityState,
  organization: NetworkDiscoveryOrganization,
): MobileExchangeContinuityState {
  const organizationId = String(organization.organizationId);
  const selectionKey = organizationSelectionKey(organizationId);
  return Object.freeze({
    ...state,
    selection: createExchangeSelectionState({
      kind: "organization",
      source: "restored",
      selectedOrganization: {
        selectionKey,
        organizationId,
        associationRole: "subject",
      },
      selectedMarker: {
        selectionKey,
        markerId: organization.marker.id,
        role: "focal",
      },
    }),
    sheet: Object.freeze({ ...state.sheet, content: "results" as const, detailContext: null }),
    detail: Object.freeze({ status: "closed" as const, detailContext: null, errorCode: null }),
  });
}

function clearNonApplicableIntelligenceSelection(
  state: MobileExchangeContinuityState,
): MobileExchangeContinuityState {
  return Object.freeze({
    ...state,
    selection: createExchangeSelectionState({ kind: "none" }),
    sheet: Object.freeze({ ...state.sheet, content: "results" as const, detailContext: null }),
    detail: Object.freeze({ status: "closed" as const, detailContext: null, errorCode: null }),
  });
}

function reconcileSelectionForCurrentIntelligence(
  state: MobileExchangeContinuityState,
  organizations: readonly NetworkDiscoveryOrganization[],
  enrichmentByOrganizationId: Readonly<Record<string, IntelligenceMobilePublicEnrichment>> | undefined,
): MobileExchangeContinuityState {
  if (state.selection.kind !== "record") return state;

  if (state.selection.selectedRecord?.recordType === "organization-additional-location") {
    if (selectedLocationContext(state, organizations, enrichmentByOrganizationId)) return state;
    const associatedOrganizationId = state.selection.selectedRecord.organizationId;
    const associatedOrganization = associatedOrganizationId
      ? organizations.find((organization) => String(organization.organizationId) === associatedOrganizationId) ?? null
      : null;
    return associatedOrganization
      ? selectOrganizationForIntelligence(state, associatedOrganization)
      : clearNonApplicableIntelligenceSelection(state);
  }

  const associatedOrganizationId = state.selection.selectedOrganization?.organizationId
    ?? state.selection.selectedRecord?.organizationId
    ?? null;
  const associatedOrganization = associatedOrganizationId
    ? organizations.find((organization) => String(organization.organizationId) === associatedOrganizationId) ?? null
    : null;
  return associatedOrganization
    ? selectOrganizationForIntelligence(state, associatedOrganization)
    : clearNonApplicableIntelligenceSelection(state);
}

function selectedOrganizationIdForActions(
  selection: ExchangeSelectionState,
  viewerOrganizationId: string,
): string {
  if (selection.kind === "organization") {
    return selection.selectedOrganization.organizationId;
  }
  if (selection.kind === "record" && selection.selectedOrganization) {
    return selection.selectedOrganization.organizationId;
  }
  return viewerOrganizationId;
}

export function projectIntelligenceMobileComposition(input: Readonly<{
  state: MobileExchangeContinuityState;
  viewerOrganizationId: string;
  mapModel: ControlledLocalityMapModel;
  discovery: NetworkDiscoveryProjection | null;
  focusedOrganization?: NetworkDiscoveryOrganization | null;
  publicEnrichmentByOrganizationId?: Readonly<Record<string, IntelligenceMobilePublicEnrichment>>;
  intelligenceHref?: string;
}>): IntelligenceMobileComposition {
  const focusedOrganization = input.focusedOrganization ?? null;
  if (focusedOrganization && !input.discovery) {
    throw new Error("Focused Intelligence organization requires an available authorized discovery projection.");
  }

  let state = input.state.activeLens === INTELLIGENCE_MOBILE_LENS_ID
    ? input.state
    : transitionMobileExchangeContinuityLens(input.state, INTELLIGENCE_MOBILE_LENS_ID);
  state = withServerRevalidatedMobileExchangeGeography(state, {
    geographyId: String(input.mapModel.selectedGeography.id),
    label: input.mapModel.selectedGeography.name,
  });
  state = withDomainRevalidatedMobileExchangeLayers(state, {
    lens: INTELLIGENCE_MOBILE_LENS_ID,
    activeLayerIds: state.lensState.intelligence.activeLayerIds,
    availableLayerIds: CURRENT_INTELLIGENCE_ANALYTICAL_LAYER_IDS,
  });
  state = withFocusedOrganizationSelection(state, focusedOrganization);

  const organizations = orderedOrganizations(input.discovery, focusedOrganization);
  state = reconcileSelectionForCurrentIntelligence(
    state,
    organizations,
    input.publicEnrichmentByOrganizationId,
  );
  const baseHref = input.intelligenceHref ?? "/geography/canvas";
  const organizationCardBindings = organizations.map((organization) => Object.freeze({
    card: organizationCard(
      organization,
      baseHref,
      publicEnrichmentFor(input.publicEnrichmentByOrganizationId, String(organization.organizationId)),
    ),
    source: cardSource(organization, input.discovery),
  }));
  const selectedLocation = selectedLocationContext(
    state,
    organizations,
    input.publicEnrichmentByOrganizationId,
  );
  const locationCardBinding = selectedLocation
    ? Object.freeze({
        card: selectedLocationCard(selectedLocation.organization, selectedLocation.location),
        source: "selected-location-context" as const,
      })
    : null;
  const cardBindings = Object.freeze(locationCardBinding
    ? [locationCardBinding, ...organizationCardBindings]
    : organizationCardBindings);
  const cards = Object.freeze(cardBindings.map((binding) => binding.card));
  const details = Object.freeze(organizations.map((organization) => organizationDetail(
    organization,
    input.mapModel,
    publicEnrichmentFor(input.publicEnrichmentByOrganizationId, String(organization.organizationId)),
  )));
  const locationDetails = Object.freeze(details.flatMap((detail) => detail.publishedLocations));
  const actionRail = mobileLensActionRail(
    INTELLIGENCE_MOBILE_LENS_ID,
    projectExchangeRoomActions({
      activeLens: INTELLIGENCE_MOBILE_LENS_ID,
      viewerOrganizationId: required(input.viewerOrganizationId, "Viewer organization id", 191),
      selectedOrganizationId: selectedOrganizationIdForActions(
        state.selection,
        input.viewerOrganizationId,
      ),
      selectedOrganizationIsOfficialResourceProvider: false,
      openPlatformActionsAuthorized: false,
      networkDiscoveryAvailable: input.discovery !== null,
      actionAuthorization: Object.freeze({
        rfxCreate: false,
        referralManage: false,
        resourceManage: false,
      }),
      currentOpportunityReference: null,
    }),
  );
  const mapProjection: LensMapProjection = Object.freeze({
    lens: INTELLIGENCE_MOBILE_LENS_ID,
    geography: state.geography,
    objects: Object.freeze(organizations.flatMap((organization) => {
      const enrichment = publicEnrichmentFor(
        input.publicEnrichmentByOrganizationId,
        String(organization.organizationId),
      );
      const locationObjects = enrichment.additionalLocations.flatMap((location) => {
        const projection = additionalLocationMapProjection(organization, location);
        return projection ? [projection] : [];
      });
      return [organizationMapProjection(organization), ...locationObjects];
    })),
    activeLayerIds: state.lensState.intelligence.activeLayerIds,
    layerStateAuthority: state.lensState.intelligence.layerStateAuthority,
    camera: state.mapCamera,
    bounds: Object.freeze({ ...input.mapModel.selectedGeography.bounds }),
  });
  const bottomSheet: ExchangeBottomSheetContract = Object.freeze({
    snapPoints: EXCHANGE_SHEET_SNAP_POINTS,
    state: state.sheet,
    actionRail,
    cards,
  });
  const coverage: IntelligenceMobileCoverage = Object.freeze({
    source: "authorized-network-discovery",
    currentPageOrganizationCount: input.discovery?.organizations.length ?? 0,
    projectedCardCount: cards.length,
    reportedTotalMatched: input.discovery?.totalMatched ?? null,
    reportedTotalMatchedMeaning: "bounded-authorized-discovery-set",
    caveat: INTELLIGENCE_MOBILE_COVERAGE_CAVEAT,
  });
  const domainAvailability: IntelligenceMobileDomainAvailability = Object.freeze({
    organizations: input.discovery !== null,
    capabilityContext: input.discovery !== null,
    locations: locationDetails.length > 0,
    sites: false,
    analyticalLayers: false,
    watchFavorite: false,
    compare: false,
  });

  return Object.freeze({
    lens: INTELLIGENCE_MOBILE_LENS_ID,
    state,
    selection: state.selection,
    mapProjection,
    actionRail,
    cards,
    cardBindings,
    bottomSheet,
    details,
    locationDetails,
    currentAnalyticalLayerIds: CURRENT_INTELLIGENCE_ANALYTICAL_LAYER_IDS,
    coverage,
    domainAvailability,
  });
}
