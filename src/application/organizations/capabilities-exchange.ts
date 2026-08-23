import { createHash } from "node:crypto";

import type { AmacsCapability, AmacsCapabilitySearchResult, AmacsDomain, AmacsReleaseMetadata } from "../../domain/amacs/model.ts";
import type {
  CapabilityAssertionStatus,
  OrganizationCapabilityClaim,
  PublicOrganizationCapabilityClaim,
} from "../../domain/market-profile/model.ts";
import type { NetworkDiscoveryOrganization } from "../network-discovery/network-discovery.ts";
import {
  createExchangeGeographyContext,
  createExchangeLensQuery,
  createExchangeMapObjectProjection,
  createExchangeMediaModel,
  createExchangeSubjectIdentity,
  createLensDiscoveryProjection,
  createLensMapProjection,
  createLensResultCardModel,
  createLensResultSetState,
  mobileLensActionRail,
  projectDomainOwnedSaveState,
  projectRecordAction,
  type ExchangeLensQuery,
  type LensActionRailContract,
  type LensDiscoveryProjection,
  type LensResultCardModel,
} from "../participant/mobile-exchange-contracts.ts";
import {
  exchangeRoomActionDefinitionsForLens,
  type ExchangeRoomActionProjection,
} from "../participant/exchange-room-actions.ts";
import type { Locale } from "../../i18n/config.ts";

export const CAPABILITIES_LAYER_ID = "capabilities.organizations" as const;

export type CapabilityEvidenceFilter = "all" | "self-reported" | "evidence-submitted" | "verified";
export type CapabilitiesView = "discover" | "gaps" | "catalog";

export interface CapabilitiesQuery {
  readonly search: string;
  readonly serviceGeographyId: string | null;
  readonly evidence: CapabilityEvidenceFilter;
  readonly selectedOrganizationId: string | null;
  readonly view: CapabilitiesView;
  readonly amacsSearch: string;
  readonly amacsDomainId: string | null;
  readonly page: number;
}

export interface CapabilityClaimProjection {
  readonly claimId: string;
  readonly capabilityId: string;
  readonly label: string;
  readonly definition: string;
  readonly domainLabel: string;
  readonly familyLabel: string;
  readonly amacsReleaseVersion: string;
  readonly assertionStatus: CapabilityAssertionStatus;
  readonly provenanceLabel: "Organization claimed";
  readonly evidenceCount: number | null;
  readonly serviceGeographyIds: readonly string[];
  readonly marketRoleIds: readonly string[];
  readonly specialties: readonly string[];
  readonly currentAmacsConcept: boolean;
}

export interface CapabilityGapProjection {
  readonly id: "no-claims" | "historical-amacs" | "coverage" | "market-role" | "evidence";
  readonly count: number;
}

export interface CapabilityOrganizationProjection {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly locality: string;
  readonly markerId: string;
  readonly coordinate: readonly [longitude: number, latitude: number];
  readonly ownOrganization: boolean;
  readonly claims: readonly CapabilityClaimProjection[];
  readonly serviceGeographyIds: readonly string[];
  readonly readiness: "structured" | "needs-review" | "not-ready";
  readonly gaps: readonly CapabilityGapProjection[];
  readonly card: LensResultCardModel;
}

export interface CapabilitiesAmacsBrowseProjection {
  readonly release: AmacsReleaseMetadata;
  readonly domains: readonly AmacsDomain[];
  readonly query: string;
  readonly domainId: string | null;
  readonly results: readonly AmacsCapabilitySearchResult[];
}

export interface CapabilitiesExchangeProjection {
  readonly query: ExchangeLensQuery;
  readonly domainQuery: CapabilitiesQuery;
  readonly discovery: LensDiscoveryProjection;
  readonly organizations: readonly CapabilityOrganizationProjection[];
  readonly selectedOrganizationId: string;
  readonly actionProjections: readonly ExchangeRoomActionProjection[];
  readonly actionRail: LensActionRailContract;
  readonly amacs: CapabilitiesAmacsBrowseProjection;
  readonly policy: Readonly<{
    clientStateAuthorizesNothing: true;
    assistanceCandidatesAffectProjection: false;
    rfxMatchingImplemented: false;
    savedRelationImplemented: false;
    referralEntryImplemented: false;
  }>;
}

export interface CapabilityCardCopy {
  readonly viewAccessible: string;
  readonly emptySummary: string;
  readonly assertions: string;
  readonly capability: string;
  readonly classification: string;
  readonly evidenceSubmitted: string;
  readonly verifiedAssertions: string;
  readonly currentRelease: string;
  readonly historicalRelease: string;
}

export interface CapabilityOrganizationSource {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly locality: string;
  readonly markerId: string;
  readonly coordinate: readonly [longitude: number, latitude: number];
  readonly ownOrganization: boolean;
  readonly claims: readonly (OrganizationCapabilityClaim | PublicOrganizationCapabilityClaim)[];
  readonly serviceGeographyIds: readonly string[];
}

const EVIDENCE_FILTERS = Object.freeze(["all", "self-reported", "evidence-submitted", "verified"] as const);
const VIEWS = Object.freeze(["discover", "gaps", "catalog"] as const);

function bounded(value: unknown, maximum = 160): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maximum) : "";
}

function positivePage(value: unknown): number {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? Math.min(parsed, 100) : 1;
}

export function parseCapabilitiesQuery(
  params: Readonly<Record<string, string | string[] | undefined>>,
): CapabilitiesQuery {
  const first = (key: string): string => {
    const value = params[key];
    return bounded(Array.isArray(value) ? value[0] : value);
  };
  const evidenceInput = first("evidence");
  const viewInput = first("view");
  return Object.freeze({
    search: first("q"),
    serviceGeographyId: first("serviceArea") || null,
    evidence: EVIDENCE_FILTERS.includes(evidenceInput as CapabilityEvidenceFilter)
      ? evidenceInput as CapabilityEvidenceFilter
      : "all",
    selectedOrganizationId: first("selectedOrganization") || null,
    view: VIEWS.includes(viewInput as CapabilitiesView) ? viewInput as CapabilitiesView : "discover",
    amacsSearch: first("amacs"),
    amacsDomainId: first("domain") || null,
    page: positivePage(first("page")),
  });
}

function evidenceStatus(status: CapabilityAssertionStatus): Exclude<CapabilityEvidenceFilter, "all"> {
  if (status === "verified") return "verified";
  if (status === "evidence_submitted") return "evidence-submitted";
  return "self-reported";
}

function fullClaim(claim: OrganizationCapabilityClaim | PublicOrganizationCapabilityClaim): claim is OrganizationCapabilityClaim {
  return "labelSnapshot" in claim;
}

function projectClaim(
  claim: OrganizationCapabilityClaim | PublicOrganizationCapabilityClaim,
  canonicalCapabilityIds: ReadonlySet<string>,
  serviceGeographyIds: readonly string[],
): CapabilityClaimProjection {
  return Object.freeze({
    claimId: claim.id,
    capabilityId: claim.capabilityId,
    label: fullClaim(claim) ? claim.labelSnapshot : claim.label,
    definition: fullClaim(claim) ? claim.definitionSnapshot : claim.definition,
    domainLabel: fullClaim(claim) ? claim.domainLabelSnapshot : claim.domainLabel,
    familyLabel: fullClaim(claim) ? claim.familyLabelSnapshot : claim.familyLabel,
    amacsReleaseVersion: claim.amacsReleaseVersion,
    assertionStatus: claim.assertionStatus,
    provenanceLabel: "Organization claimed",
    evidenceCount: fullClaim(claim) ? claim.evidenceIds.length : null,
    serviceGeographyIds: Object.freeze(fullClaim(claim) ? [...claim.serviceGeographyIds] : [...serviceGeographyIds]),
    marketRoleIds: Object.freeze(fullClaim(claim) ? [...claim.marketRoleIds] : []),
    specialties: Object.freeze([...claim.specialties]),
    currentAmacsConcept: canonicalCapabilityIds.has(claim.capabilityId),
  });
}

function gapsFor(claims: readonly CapabilityClaimProjection[]): readonly CapabilityGapProjection[] {
  if (claims.length === 0) return Object.freeze([{ id: "no-claims", count: 1 }]);
  const candidates: CapabilityGapProjection[] = [
    { id: "historical-amacs", count: claims.filter((claim) => !claim.currentAmacsConcept).length },
    { id: "coverage", count: claims.filter((claim) => claim.serviceGeographyIds.length === 0).length },
    { id: "market-role", count: claims.filter((claim) => claim.marketRoleIds.length === 0).length },
    { id: "evidence", count: claims.filter((claim) => claim.evidenceCount === 0).length },
  ];
  return Object.freeze(candidates.filter((gap) => gap.count > 0).map((gap) => Object.freeze(gap)));
}

function readinessFor(
  claims: readonly CapabilityClaimProjection[],
  gaps: readonly CapabilityGapProjection[],
): CapabilityOrganizationProjection["readiness"] {
  if (claims.length === 0 || claims.every((claim) => claim.assertionStatus === "suspended")) return "not-ready";
  return gaps.some((gap) => gap.id !== "evidence") ? "needs-review" : "structured";
}

function deterministicId(prefix: string, value: unknown): string {
  return `${prefix}_${createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 32)}`;
}

function hiddenSave() {
  return projectDomainOwnedSaveState({
    visible: true,
    favorited: null,
    operational: false,
    applicable: true,
    authorized: false,
    handler: null,
  });
}

function actionProjection(input: Readonly<{
  own: boolean;
  organizationId: string;
  canManageProfile: boolean;
}>): readonly ExchangeRoomActionProjection[] {
  return Object.freeze(exchangeRoomActionDefinitionsForLens("capabilities").map((definition) => {
    const own = input.own;
    const labelKey = own ? definition.labelKey : definition.externalLabelKey;
    let operational = false;
    const applicable = true;
    let authorized = true;
    let handlerCandidate: ExchangeRoomActionProjection["handlerCandidate"] = null;
    let resolvedHandler: ExchangeRoomActionProjection["resolvedHandler"] = null;

    if (own && definition.id === "capabilities.manage-view") {
      operational = true;
      authorized = input.canManageProfile;
      handlerCandidate = Object.freeze({
        kind: "href" as const,
        href: "/organization-profile#market-profile-title",
      });
      resolvedHandler = authorized ? handlerCandidate : null;
    } else if (own && definition.id === "capabilities.classify-match") {
      operational = true;
      authorized = input.canManageProfile;
      handlerCandidate = Object.freeze({
        kind: "href" as const,
        href: "/organization-profile#describe-capability-title",
      });
      resolvedHandler = authorized ? handlerCandidate : null;
    } else if (own && definition.id === "capabilities.gaps-save") {
      operational = true;
      handlerCandidate = Object.freeze({
        kind: "href" as const,
        href: `/capabilities?view=gaps&selectedOrganization=${encodeURIComponent(input.organizationId)}`,
      });
      resolvedHandler = handlerCandidate;
    } else if (!own && definition.id === "capabilities.manage-view") {
      operational = true;
      handlerCandidate = Object.freeze({
        kind: "href" as const,
        href: `/capabilities?selectedOrganization=${encodeURIComponent(input.organizationId)}`,
      });
      resolvedHandler = handlerCandidate;
    }

    const disabledReason = !operational
      ? "not-operational" as const
      : !applicable
        ? "not-applicable" as const
        : !authorized
          ? "not-authorized" as const
          : resolvedHandler
            ? null
            : "not-operational" as const;
    return Object.freeze({
      ...definition,
      labelKey,
      variant: own ? "own" as const : "external" as const,
      operational,
      applicable,
      authorized,
      authorization: "room-participant" as const,
      availability: resolvedHandler ? "active" as const : "disabled" as const,
      disabledReason,
      handlerCandidate,
      resolvedHandler,
    });
  }));
}

function recordActions(input: Readonly<{
  organizationId: string;
  own: boolean;
  canManageProfile: boolean;
}>): LensResultCardModel["recordActions"] {
  const view = projectRecordAction({
    id: "capabilities.view",
    labelKey: "capabilities.record.view",
    operational: true,
    applicable: true,
    authorized: true,
    handler: { kind: "href", href: `/capabilities?selectedOrganization=${encodeURIComponent(input.organizationId)}` },
  });
  const compare = projectRecordAction({
    id: "capabilities.compare",
    labelKey: "capabilities.record.compare",
    operational: true,
    applicable: !input.own,
    authorized: true,
    handler: input.own ? null : { kind: "intent", intent: `compare:${input.organizationId}` },
  });
  const manage = projectRecordAction({
    id: "capabilities.manage",
    labelKey: "capabilities.record.manage",
    operational: input.own,
    applicable: input.own,
    authorized: input.canManageProfile,
    handler: input.own && input.canManageProfile
      ? { kind: "href", href: "/organization-profile#market-profile-title" }
      : null,
  });
  return Object.freeze(input.own ? [manage] : [view, compare]);
}

function organizationProjection(input: Readonly<{
  source: CapabilityOrganizationSource;
  canonicalCapabilityIds: ReadonlySet<string>;
  release: AmacsReleaseMetadata;
  canManageProfile: boolean;
  copy: CapabilityCardCopy;
}>): CapabilityOrganizationProjection {
  const claims = Object.freeze(input.source.claims
    .filter((claim) => claim.assertionStatus !== "suspended")
    .map((claim) => projectClaim(claim, input.canonicalCapabilityIds, input.source.serviceGeographyIds))
    .sort((left, right) => left.label.localeCompare(right.label)));
  const gaps = gapsFor(claims);
  const identity = createExchangeSubjectIdentity({
    subjectKind: "organization",
    selectionKey: `organization:${input.source.organizationId}`,
    organizationId: input.source.organizationId,
    recordType: null,
    recordId: null,
  });
  const evidenceSubmitted = claims.filter((claim) => claim.assertionStatus === "evidence_submitted").length;
  const verified = claims.filter((claim) => claim.assertionStatus === "verified").length;
  const releaseState = claims.every((claim) => claim.amacsReleaseVersion === input.release.version && claim.currentAmacsConcept)
    ? input.copy.currentRelease.replace("{version}", input.release.version)
    : input.copy.historicalRelease;
  const card = createLensResultCardModel({
    lens: "capabilities",
    identity,
    title: input.source.organizationName,
    accessibleLabel: input.copy.viewAccessible.replace("{organization}", input.source.organizationName),
    organizationIdentity: input.source.organizationName,
    locality: input.source.locality,
    summary: claims.length > 0
      ? claims.slice(0, 3).map((claim) => claim.label).join(" · ")
      : input.copy.emptySummary,
    indicator: {
      label: input.copy.assertions,
      value: String(claims.length),
      emphasis: claims.length > 0 ? "neutral" : "attention",
    },
    classifications: claims.slice(0, 4).map((claim) => ({
      id: claim.capabilityId,
      label: input.copy.capability,
      value: claim.label,
    })),
    metadata: [
      { id: "amacs-release", label: input.copy.classification, value: releaseState },
      { id: "evidence", label: input.copy.evidenceSubmitted, value: String(evidenceSubmitted) },
      { id: "verified", label: input.copy.verifiedAssertions, value: String(verified) },
    ],
    media: createExchangeMediaModel({
      kind: "fallback",
      alt: input.source.organizationName,
      fallbackLabel: input.source.organizationName,
    }),
    favorite: hiddenSave(),
    recordActions: recordActions({
      organizationId: input.source.organizationId,
      own: input.source.ownOrganization,
      canManageProfile: input.canManageProfile,
    }),
    canonicalHref: `/capabilities?selectedOrganization=${encodeURIComponent(input.source.organizationId)}`,
    returnLens: "capabilities",
  });
  return Object.freeze({
    organizationId: input.source.organizationId,
    organizationName: input.source.organizationName,
    locality: input.source.locality,
    markerId: input.source.markerId,
    coordinate: input.source.coordinate,
    ownOrganization: input.source.ownOrganization,
    claims,
    serviceGeographyIds: Object.freeze([...input.source.serviceGeographyIds]),
    readiness: readinessFor(claims, gaps),
    gaps,
    card,
  });
}

function matchesEvidence(
  organization: CapabilityOrganizationProjection,
  filter: CapabilityEvidenceFilter,
): boolean {
  return filter === "all" || organization.claims.some((claim) => evidenceStatus(claim.assertionStatus) === filter);
}

export function externalCapabilitySource(organization: NetworkDiscoveryOrganization): CapabilityOrganizationSource {
  return Object.freeze({
    organizationId: String(organization.organizationId),
    organizationName: organization.profile.displayName,
    locality: organization.profile.location.localityName,
    markerId: organization.marker.id,
    coordinate: organization.marker.coordinate,
    ownOrganization: false,
    claims: organization.capabilities,
    serviceGeographyIds: organization.serviceGeographyIds,
  });
}

export function createCapabilitiesExchangeProjection(input: Readonly<{
  locale: Locale;
  geographyId: string;
  geographyLabel: string;
  query: CapabilitiesQuery;
  viewerOrganizationId: string;
  canManageProfile: boolean;
  sources: readonly CapabilityOrganizationSource[];
  canonicalCapabilities: readonly AmacsCapability[];
  amacs: CapabilitiesAmacsBrowseProjection;
  cardCopy: CapabilityCardCopy;
}>): CapabilitiesExchangeProjection {
  const canonicalCapabilityIds = new Set(input.canonicalCapabilities.map((capability) => capability.conceptId));
  const organizations = input.sources
    .map((source) => organizationProjection({
      source,
      canonicalCapabilityIds,
      release: input.amacs.release,
      canManageProfile: input.canManageProfile,
      copy: input.cardCopy,
    }))
    .filter((organization) => organization.claims.length > 0 || organization.ownOrganization)
    .filter((organization) => matchesEvidence(organization, input.query.evidence));
  const selectedOrganizationId = organizations.some(
    (organization) => organization.organizationId === input.query.selectedOrganizationId,
  )
    ? input.query.selectedOrganizationId!
    : organizations.find((organization) => organization.organizationId === input.viewerOrganizationId)?.organizationId
      ?? organizations[0]?.organizationId
      ?? input.viewerOrganizationId;
  const query = createExchangeLensQuery({
    lens: "capabilities",
    locale: input.locale,
    geographyId: input.geographyId,
    search: input.query.search,
    filters: {
      evidence: input.query.evidence,
      serviceArea: input.query.serviceGeographyId,
      view: input.query.view,
      amacsDomain: input.query.amacsDomainId,
    },
    resultPage: input.query.page,
  });
  const mapObjects = organizations.map((organization) => createExchangeMapObjectProjection({
    identity: organization.card.identity,
    markerId: organization.markerId,
    coordinate: { longitude: organization.coordinate[0], latitude: organization.coordinate[1] },
    privacy: "approximate",
    accessibleLabel: `${organization.organizationName} capability profile`,
    selectable: true,
    projectionRole: "result",
    layerIds: [CAPABILITIES_LAYER_ID],
  }));
  const geography = createExchangeGeographyContext({
    geographyId: input.geographyId,
    label: input.geographyLabel,
    serverRevalidated: true,
  });
  const resultSetId = deterministicId("capabilities_result", {
    query: query.requestIdentity,
    organizations: organizations.map((organization) => organization.organizationId),
  });
  const results = organizations.length > 0
    ? createLensResultSetState({
        status: "ready",
        lens: "capabilities",
        resultSetId,
        cards: organizations.map((organization) => organization.card),
      })
    : createLensResultSetState({
        status: "empty",
        lens: "capabilities",
        resultSetId,
        messageKey: "capabilities.empty",
      });
  const map = createLensMapProjection({
    lens: "capabilities",
    geography,
    objects: mapObjects,
    activeLayerIds: [CAPABILITIES_LAYER_ID],
    layerStateAuthority: "domain-revalidated",
  });
  const discovery = createLensDiscoveryProjection({
    lens: "capabilities",
    queryId: deterministicId("capabilities_query", query.requestIdentity),
    map,
    results,
    spatialResults: organizations.map((organization) => Object.freeze({
      kind: "mapped" as const,
      identity: organization.card.identity,
      markerId: organization.markerId,
    })),
  });
  const actions = actionProjection({
    own: selectedOrganizationId === input.viewerOrganizationId,
    organizationId: selectedOrganizationId,
    canManageProfile: input.canManageProfile,
  });
  const actionRail = mobileLensActionRail("capabilities", actions);
  return Object.freeze({
    query,
    domainQuery: input.query,
    discovery,
    organizations: Object.freeze(organizations),
    selectedOrganizationId,
    actionProjections: actions,
    actionRail,
    amacs: input.amacs,
    policy: Object.freeze({
      clientStateAuthorizesNothing: true,
      assistanceCandidatesAffectProjection: false,
      rfxMatchingImplemented: false,
      savedRelationImplemented: false,
      referralEntryImplemented: false,
    }),
  });
}
