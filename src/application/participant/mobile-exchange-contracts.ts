import type { ParticipantMapCamera } from "../geography/map-view.ts";
import {
  exchangeRoomActionDefinitionsForLens,
  type ExchangeRoomActionDisabledReason,
  type ExchangeRoomActionHandler,
  type ExchangeRoomActionId,
  type ExchangeRoomActionProjection,
} from "./exchange-room-actions.ts";
import {
  PARTICIPANT_LENSES,
  PARTICIPANT_LENS_IDS,
  PARTICIPANT_UTILITY_DESTINATIONS,
  type ParticipantLensDefinition,
  type ParticipantLensId,
} from "./participant-lens-registry.ts";
import type {
  ParticipantSpatialContext,
  ParticipantSpatialLensState,
} from "./participant-spatial-context.ts";

export const MOBILE_EXCHANGE_CONTRACT_VERSION = 2 as const;

export const EXCHANGE_SHEET_SNAP_POINTS = Object.freeze([
  "peek",
  "partial",
  "expanded",
] as const);

export type ExchangeSheetSnapPoint = (typeof EXCHANGE_SHEET_SNAP_POINTS)[number];
export type ExchangeActionPosition = 1 | 2 | 3 | 4;
export type ExchangeSelectionSource = "map" | "card" | "keyboard" | "detail" | "restored";
export type ExchangeAvailability = "enabled" | "disabled";
export type ExchangeDetailStatus = "closed" | "opening" | "open" | "error";
export type ExchangeGeographyAuthority = "carried-unvalidated" | "server-revalidated";
export type ExchangeLayerStateAuthority = "carried-unvalidated" | "domain-revalidated";
export type ExchangeRelationshipAuthority = "carried-unvalidated" | "server-revalidated";
export type ExchangeOrganizationAssociationRole =
  | "subject"
  | "issuer"
  | "provider"
  | "counterparty"
  | "owner"
  | "associated";
export type ExchangeMarkerSelectionRole = "focal" | "associated-organization";
export type ExchangeMapPrivacy = "exact" | "approximate" | "locality-only" | "suppressed";

export const EXCHANGE_MEDIA_KINDS = Object.freeze([
  "organization-logo",
  "business-photo",
  "facility-photo",
  "product-image",
  "service-image",
  "project-image",
  "branded-media",
  "video-poster",
  "fallback",
] as const);

export const MOBILE_EXCHANGE_UNAVAILABLE_EXPLANATION_KEY =
  "networkWorkspace.actionReasons.exchange-action-unavailable" as const;

export type ExchangeMediaKind = (typeof EXCHANGE_MEDIA_KINDS)[number];

export interface ExchangeMapBounds {
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
}

export interface ExchangeGeographyContext {
  readonly geographyId: string;
  readonly label: string | null;
  readonly authority: ExchangeGeographyAuthority;
}

export interface ExchangeSortState {
  readonly id: string;
  readonly direction: "ascending" | "descending";
}

export type ExchangeFilterValue = string | readonly string[] | number | boolean | null;

export interface ExchangeOrganizationSelection {
  readonly selectionKey: string;
  readonly organizationId: string;
  readonly associationRole: ExchangeOrganizationAssociationRole;
}

export interface ExchangeRecordSelection {
  readonly selectionKey: string;
  readonly recordType: string;
  readonly recordId: string;
  readonly organizationId: string | null;
}

export interface ExchangeMarkerSelection {
  readonly selectionKey: string;
  readonly markerId: string;
  readonly role: ExchangeMarkerSelectionRole;
}

export interface ExchangeRelationshipSelection {
  readonly relationshipId: string;
  readonly authority: ExchangeRelationshipAuthority;
}

export type ExchangeSubjectIdentity =
  | Readonly<{
      subjectKind: "organization";
      selectionKey: string;
      organizationId: string;
      recordType: null;
      recordId: null;
    }>
  | Readonly<{
      subjectKind: "record";
      selectionKey: string;
      organizationId: string | null;
      recordType: string;
      recordId: string;
    }>;

export type ExchangeSelectionState =
  | Readonly<{
      kind: "none";
      source: null;
      selectionKey: null;
      focalIdentity: null;
      selectedOrganization: null;
      selectedRecord: null;
      selectedMarker: null;
      selectedRelationship: null;
    }>
  | Readonly<{
      kind: "organization" | "record";
      source: ExchangeSelectionSource;
      selectionKey: string;
      focalIdentity: ExchangeSubjectIdentity;
      selectedOrganization: ExchangeOrganizationSelection | null;
      selectedRecord: ExchangeRecordSelection | null;
      selectedMarker: ExchangeMarkerSelection | null;
      selectedRelationship: ExchangeRelationshipSelection | null;
    }>;

export interface ExchangeVideoSource {
  readonly assetReference: string;
  readonly authoritySource: "server-derived";
}

export interface ExchangeMediaModel {
  readonly kind: ExchangeMediaKind;
  readonly assetReference: string | null;
  readonly alt: string;
  readonly posterReference: string | null;
  readonly videoSource: ExchangeVideoSource | null;
  readonly fallbackLabel: string | null;
}

export type RecordActionHandler =
  | Readonly<{ kind: "href"; href: string }>
  | Readonly<{ kind: "intent"; intent: string }>;

export interface RecordActionDefinition {
  readonly id: string;
  readonly labelKey: string;
  readonly operational: boolean;
  readonly applicable: boolean;
  readonly authorized: boolean;
  readonly availability: ExchangeAvailability;
  readonly disabledReason: ExchangeRoomActionDisabledReason | null;
  readonly disabledExplanationKey: typeof MOBILE_EXCHANGE_UNAVAILABLE_EXPLANATION_KEY | null;
  readonly handler: RecordActionHandler | null;
  readonly authoritySource: "server-derived";
}

export interface FavoriteState {
  readonly visible: boolean;
  readonly favorited: boolean | null;
  readonly operational: boolean;
  readonly applicable: boolean;
  readonly authorized: boolean;
  readonly availability: "hidden" | ExchangeAvailability;
  readonly disabledReason: ExchangeRoomActionDisabledReason | null;
  readonly disabledExplanationKey: typeof MOBILE_EXCHANGE_UNAVAILABLE_EXPLANATION_KEY | null;
  readonly handler: RecordActionHandler | null;
  readonly persistenceOwner: "domain";
  readonly authoritySource: "server-derived";
}

export interface ExchangeDetailContext {
  readonly identity: ExchangeSubjectIdentity;
  readonly canonicalHref: string | null;
  readonly returnLens: ParticipantLensId;
}

export type ExchangeDetailState =
  | Readonly<{ status: "closed"; detailContext: null; errorCode: null }>
  | Readonly<{
      status: Exclude<ExchangeDetailStatus, "closed">;
      detailContext: ExchangeDetailContext;
      errorCode: string | null;
    }>;

export interface ExchangeSheetState {
  readonly sheetSnapPoint: ExchangeSheetSnapPoint;
  readonly sheetScrollPosition: number;
  readonly content: "results" | "detail";
  readonly detailContext: ExchangeDetailContext | null;
}

export interface ExchangeMapObjectProjection {
  readonly kind: "organization" | "record";
  readonly identity: ExchangeSubjectIdentity;
  readonly markerId: string;
  readonly coordinate: Readonly<{ longitude: number; latitude: number }> | null;
  readonly privacy: ExchangeMapPrivacy;
  readonly accessibleLabel: string;
  readonly selectable: boolean;
  readonly layerIds: readonly string[];
}

export interface ExchangeMapClusterProjection {
  readonly kind: "cluster";
  readonly clusterId: string;
  readonly coordinate: Readonly<{ longitude: number; latitude: number }>;
  readonly count: number;
  readonly accessibleLabel: string;
  readonly layerIds: readonly string[];
}

/**
 * Provider-neutral non-point projection. Geometry stays behind the existing
 * geography/map authority: this seam carries an authoritative geography or
 * opaque governed geometry reference, never arbitrary browser-created shape authority.
 */
export interface ExchangeMapAreaProjection {
  readonly kind: "area";
  readonly areaId: string;
  readonly associationSelectionKey: string | null;
  readonly geographyId: string;
  readonly geometryReference: string | null;
  readonly privacy: ExchangeMapPrivacy;
  readonly release: "released" | "suppressed";
  readonly accessibleLabel: string;
  readonly selectable: boolean;
  readonly selected: boolean;
  readonly emphasized: boolean;
  readonly layerIds: readonly string[];
  readonly authoritySource: "server-derived";
}

export type ExchangeRelationshipPathState = "authorized-path" | "no-path";

/**
 * A relationship path is rendered only from a current server/domain projection.
 * The explicit no-path form carries no endpoints or geometry and is the truthful
 * representation for unavailable, external, expired, declined or suppressed paths.
 */
export interface ExchangeMapRelationshipProjection {
  readonly kind: "relationship";
  readonly relationshipId: string;
  readonly pathState: ExchangeRelationshipPathState;
  readonly endpointOrganizationIds: readonly [string, string] | null;
  readonly geometryReference: string | null;
  readonly privacy: "permitted" | "suppressed";
  readonly accessibleLabel: string;
  readonly layerIds: readonly string[];
  readonly authoritySource: "server-derived";
}

export type ExchangeMapProjection =
  | ExchangeMapObjectProjection
  | ExchangeMapClusterProjection
  | ExchangeMapAreaProjection
  | ExchangeMapRelationshipProjection;

export interface LensMapProjection {
  readonly lens: ParticipantLensId;
  readonly geography: ExchangeGeographyContext;
  readonly objects: readonly ExchangeMapProjection[];
  readonly activeLayerIds: readonly string[];
  readonly layerStateAuthority: ExchangeLayerStateAuthority;
  readonly camera: ParticipantMapCamera | null;
  readonly bounds: ExchangeMapBounds | null;
}

export interface ExchangeResultIndicator {
  readonly label: string;
  readonly value: string;
  readonly emphasis: "neutral" | "positive" | "attention" | "critical";
}

export interface ExchangeResultMetadata {
  readonly id: string;
  readonly label: string;
  readonly value: string;
}

declare const VALIDATED_RESULT_CARD: unique symbol;

export interface LensResultCardModel {
  readonly [VALIDATED_RESULT_CARD]: true;
  readonly identity: ExchangeSubjectIdentity;
  readonly title: string;
  readonly organizationIdentity: string | null;
  readonly locality: string | null;
  readonly summary: string | null;
  readonly indicator: ExchangeResultIndicator | null;
  readonly metadata: readonly ExchangeResultMetadata[];
  readonly media: ExchangeMediaModel | null;
  readonly favorite: FavoriteState;
  readonly recordActions: readonly RecordActionDefinition[];
  readonly detailContext: ExchangeDetailContext;
}

export interface LensContinuityState {
  readonly search: string;
  readonly filters: Readonly<Record<string, ExchangeFilterValue>>;
  readonly sort: ExchangeSortState | null;
  readonly resultSetId: string | null;
  readonly cursor: string | null;
  readonly resultPage: number;
  readonly resultIndex: number;
  readonly listScrollPosition: number;
  readonly sheetScrollPosition: number;
  readonly activeLayerIds: readonly string[];
  readonly layerStateAuthority: ExchangeLayerStateAuthority;
}

export interface MobileExchangeState {
  readonly version: typeof MOBILE_EXCHANGE_CONTRACT_VERSION;
  readonly activeLens: ParticipantLensId;
  readonly selection: ExchangeSelectionState;
  readonly mapCamera: ParticipantMapCamera | null;
  readonly mapBounds: ExchangeMapBounds | null;
  readonly geography: ExchangeGeographyContext;
  readonly lensState: Readonly<Record<ParticipantLensId, LensContinuityState>>;
  readonly sheet: ExchangeSheetState;
  readonly detail: ExchangeDetailState;
}

export interface LensActionDefinition {
  readonly id: ExchangeRoomActionId;
  readonly lens: ParticipantLensId;
  readonly position: ExchangeActionPosition;
  readonly labelKey: string;
  readonly operational: boolean;
  readonly applicable: boolean;
  readonly authorized: boolean;
  readonly availability: ExchangeAvailability;
  readonly disabledReason: ExchangeRoomActionDisabledReason | null;
  readonly disabledExplanationKey: typeof MOBILE_EXCHANGE_UNAVAILABLE_EXPLANATION_KEY | null;
  readonly handler: ExchangeRoomActionHandler | null;
  readonly authoritySource: "server-derived";
}

export type LensActionDefinitionTuple = readonly [
  LensActionDefinition,
  LensActionDefinition,
  LensActionDefinition,
  LensActionDefinition,
];

export type LensActionIdTuple = readonly [
  ExchangeRoomActionId,
  ExchangeRoomActionId,
  ExchangeRoomActionId,
  ExchangeRoomActionId,
];

export interface LensDefinition {
  readonly id: ParticipantLensId;
  readonly order: ExchangeActionPosition;
  readonly labelKey: string;
  readonly href: string | null;
  readonly availability: ParticipantLensDefinition["availability"];
  readonly navigationRole: "lens";
  readonly actionIds: LensActionIdTuple;
}

export type LensDefinitionTuple = readonly [
  LensDefinition,
  LensDefinition,
  LensDefinition,
  LensDefinition,
];

export interface MobileExchangeShellContract {
  readonly composition: "map-first";
  readonly state: MobileExchangeState;
  readonly lenses: LensDefinitionTuple;
  readonly accountUtility: typeof MOBILE_EXCHANGE_ACCOUNT_UTILITY;
}

export interface MobileLensNavigationContract {
  readonly placement: "bottom";
  readonly persistent: true;
  readonly activeLens: ParticipantLensId;
  readonly lenses: LensDefinitionTuple;
  readonly accountUtility: typeof MOBILE_EXCHANGE_ACCOUNT_UTILITY;
}

export interface ExchangeBottomSheetContract {
  readonly snapPoints: typeof EXCHANGE_SHEET_SNAP_POINTS;
  readonly state: ExchangeSheetState;
  readonly actionRail: LensActionRailContract;
  readonly cards: readonly LensResultCardModel[];
}

export interface LensActionRailContract {
  readonly placement: "sheet-top";
  readonly lens: ParticipantLensId;
  readonly actions: LensActionDefinitionTuple;
}

export interface ExchangeResultCardContract {
  readonly card: LensResultCardModel;
  readonly selected: boolean;
}

export interface ExchangeMediaContract {
  readonly media: ExchangeMediaModel | null;
}

export interface ExchangeFavoriteContract {
  readonly favorite: FavoriteState;
}

export interface ExchangeSelectionContract {
  readonly selection: ExchangeSelectionState;
}

export interface ExchangeMapProjectionContract {
  readonly projection: LensMapProjection;
  readonly selection: ExchangeSelectionState;
}

export interface ExchangeDetailContract {
  readonly detail: ExchangeDetailState;
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > 240) throw new Error(`${label} is invalid.`);
  return normalized;
}

function optionalRequired(value: string | null, label: string): string | null {
  return value === null ? null : required(value, label);
}

function requiredList(values: readonly string[] | undefined, label: string): readonly string[] {
  if (!values) return Object.freeze([]);
  const normalized = values.map((value) => required(value, label));
  return Object.freeze([...new Set(normalized)]);
}

function selectionKeyForOrganization(organizationId: string): string {
  return `organization:${required(organizationId, "Organization id")}`;
}

function asFour<T>(values: readonly T[], label: string): readonly [T, T, T, T] {
  if (values.length !== 4) throw new Error(`${label} must contain exactly four positions.`);
  return Object.freeze([values[0]!, values[1]!, values[2]!, values[3]!]);
}

function participantLens(id: ParticipantLensId): ParticipantLensDefinition {
  const definition = PARTICIPANT_LENSES.find((lens) => lens.id === id);
  if (!definition) throw new Error(`Participant lens ${id} is not registered.`);
  return definition;
}

export function createExchangeSubjectIdentity(input: Readonly<{
  subjectKind: "organization" | "record";
  selectionKey: string;
  organizationId: string | null;
  recordType: string | null;
  recordId: string | null;
}>): ExchangeSubjectIdentity {
  const selectionKey = required(input.selectionKey, "Selection key");
  if (input.subjectKind === "organization") {
    if (!input.organizationId || input.recordType !== null || input.recordId !== null) {
      throw new Error("Organization identity requires one organization and no domain record.");
    }
    return Object.freeze({
      subjectKind: "organization",
      selectionKey,
      organizationId: required(input.organizationId, "Organization id"),
      recordType: null,
      recordId: null,
    });
  }
  if (!input.recordType || !input.recordId) {
    throw new Error("Record identity requires a record type and record id.");
  }
  return Object.freeze({
    subjectKind: "record",
    selectionKey,
    organizationId: optionalRequired(input.organizationId, "Organization id"),
    recordType: required(input.recordType, "Record type"),
    recordId: required(input.recordId, "Record id"),
  });
}

function sameSubjectIdentity(left: ExchangeSubjectIdentity, right: ExchangeSubjectIdentity): boolean {
  return left.subjectKind === right.subjectKind
    && left.selectionKey === right.selectionKey
    && left.organizationId === right.organizationId
    && left.recordType === right.recordType
    && left.recordId === right.recordId;
}

export function createExchangeGeographyContext(input: Readonly<{
  geographyId: string;
  label?: string | null;
  serverRevalidated: boolean;
}>): ExchangeGeographyContext {
  return Object.freeze({
    geographyId: required(input.geographyId, "Geography id"),
    label: input.label ? required(input.label, "Geography label") : null,
    authority: input.serverRevalidated ? "server-revalidated" : "carried-unvalidated",
  });
}

function lensDefinition(id: ParticipantLensId, order: ExchangeActionPosition): LensDefinition {
  const lens = participantLens(id);
  const actions = asFour(
    exchangeRoomActionDefinitionsForLens(id).map((action) => action.id),
    `${id} action registry`,
  );
  return Object.freeze({
    id,
    order,
    labelKey: lens.labelKey,
    href: lens.availability === "enabled" ? lens.href : null,
    availability: lens.availability,
    navigationRole: "lens",
    actionIds: actions,
  });
}

export const MOBILE_EXCHANGE_LENS_DEFINITIONS: LensDefinitionTuple = Object.freeze([
  lensDefinition(PARTICIPANT_LENS_IDS[0], 1),
  lensDefinition(PARTICIPANT_LENS_IDS[1], 2),
  lensDefinition(PARTICIPANT_LENS_IDS[2], 3),
  lensDefinition(PARTICIPANT_LENS_IDS[3], 4),
]);

export const MOBILE_EXCHANGE_ACCOUNT_UTILITY = Object.freeze({
  id: "account" as const,
  navigationRole: "utility" as const,
  presentation: "menu" as const,
  href: PARTICIPANT_UTILITY_DESTINATIONS.account.href,
});

export const MOBILE_EXCHANGE_COMPOSITION_POLICY = Object.freeze({
  shell: "map-first",
  searchFilterPlacement: "map-overlay",
  lensNavigationPlacement: "bottom",
  accountUtilityPlacement: "menu",
  sheetSnapPoints: EXCHANGE_SHEET_SNAP_POINTS,
  lensActionRailPlacement: "sheet-top",
  resultCardPlacement: "sheet",
} as const);

export const MOBILE_EXCHANGE_CLIENT_STATE_POLICY = Object.freeze({
  storesAuthorization: false,
  grantsProtectedRouteAccess: false,
  grantsActionPermission: false,
  serverRevalidatesSelectedObjects: true,
  serverDerivesProtectedActionPermission: true,
  favoritePersistenceIsDomainOwned: true,
  sheetAndCameraStateArePresentationOnly: true,
  activeLayersArePresentationOnly: true,
  relationshipSelectionNeverGrantsDisclosure: true,
} as const);

function normalizedOrganizationSelection(
  value: Readonly<{
    selectionKey: string;
    organizationId: string;
    associationRole?: ExchangeOrganizationAssociationRole;
  }>,
  role: ExchangeOrganizationAssociationRole,
): ExchangeOrganizationSelection {
  return Object.freeze({
    selectionKey: required(value.selectionKey, "Organization selection key"),
    organizationId: required(value.organizationId, "Organization id"),
    associationRole: value.associationRole ?? role,
  });
}

function normalizedRecordSelection(value: ExchangeRecordSelection): ExchangeRecordSelection {
  return Object.freeze({
    selectionKey: required(value.selectionKey, "Record selection key"),
    recordType: required(value.recordType, "Record type"),
    recordId: required(value.recordId, "Record id"),
    organizationId: optionalRequired(value.organizationId, "Organization id"),
  });
}

function normalizedRelationshipSelection(
  value: Readonly<{
    relationshipId: string;
    authority?: ExchangeRelationshipAuthority;
  }> | null | undefined,
): ExchangeRelationshipSelection | null {
  if (!value) return null;
  return Object.freeze({
    relationshipId: required(value.relationshipId, "Relationship id"),
    authority: value.authority ?? "carried-unvalidated",
  });
}

export function createExchangeSelectionState(input: Readonly<{
  kind: "none" | "organization" | "record";
  source?: ExchangeSelectionSource;
  selectedOrganization?: Readonly<{
    selectionKey: string;
    organizationId: string;
    associationRole?: ExchangeOrganizationAssociationRole;
  }> | null;
  selectedRecord?: ExchangeRecordSelection | null;
  selectedMarker?: Readonly<{
    selectionKey: string;
    markerId: string;
    role?: ExchangeMarkerSelectionRole;
  }> | null;
  selectedRelationship?: Readonly<{
    relationshipId: string;
    authority?: ExchangeRelationshipAuthority;
  }> | null;
}>): ExchangeSelectionState {
  if (input.kind === "none") {
    if (input.selectedOrganization || input.selectedRecord || input.selectedMarker || input.selectedRelationship) {
      throw new Error("An empty selection cannot contain selected context.");
    }
    return Object.freeze({
      kind: "none",
      source: null,
      selectionKey: null,
      focalIdentity: null,
      selectedOrganization: null,
      selectedRecord: null,
      selectedMarker: null,
      selectedRelationship: null,
    });
  }

  if (input.kind === "organization") {
    if (!input.selectedOrganization || input.selectedRecord) {
      throw new Error("Organization selection must identify one organization and no domain record.");
    }
    const selectedOrganization = normalizedOrganizationSelection(input.selectedOrganization, "subject");
    if (selectedOrganization.associationRole !== "subject") {
      throw new Error("A focal organization must use the subject association role.");
    }
    const selectionKey = selectedOrganization.selectionKey;
    const focalIdentity = createExchangeSubjectIdentity({
      subjectKind: "organization",
      selectionKey,
      organizationId: selectedOrganization.organizationId,
      recordType: null,
      recordId: null,
    });
    let selectedMarker: ExchangeMarkerSelection | null = null;
    if (input.selectedMarker) {
      const markerKey = required(input.selectedMarker.selectionKey, "Marker selection key");
      if (markerKey !== selectionKey) {
        throw new Error("Map, card, and detail selection references must share one selection key for the focal organization.");
      }
      selectedMarker = Object.freeze({
        selectionKey: markerKey,
        markerId: required(input.selectedMarker.markerId, "Marker id"),
        role: "focal",
      });
    }
    return Object.freeze({
      kind: "organization",
      source: input.source ?? "restored",
      selectionKey,
      focalIdentity,
      selectedOrganization,
      selectedRecord: null,
      selectedMarker,
      selectedRelationship: normalizedRelationshipSelection(input.selectedRelationship),
    });
  }

  if (!input.selectedRecord) {
    throw new Error("Record selection must identify one domain record.");
  }
  const selectedRecord = normalizedRecordSelection(input.selectedRecord);
  const selectionKey = selectedRecord.selectionKey;
  const focalIdentity = createExchangeSubjectIdentity({
    subjectKind: "record",
    selectionKey,
    organizationId: selectedRecord.organizationId,
    recordType: selectedRecord.recordType,
    recordId: selectedRecord.recordId,
  });
  const selectedOrganization = input.selectedOrganization
    ? normalizedOrganizationSelection(input.selectedOrganization, "associated")
    : null;
  if (selectedOrganization?.associationRole === "subject") {
    throw new Error("A record's associated organization cannot use the subject association role.");
  }
  if (
    selectedRecord.organizationId
    && selectedOrganization
    && selectedRecord.organizationId !== selectedOrganization.organizationId
  ) {
    throw new Error("Record organization association must match the separately keyed organization context.");
  }

  let selectedMarker: ExchangeMarkerSelection | null = null;
  if (input.selectedMarker) {
    const markerKey = required(input.selectedMarker.selectionKey, "Marker selection key");
    const inferredRole: ExchangeMarkerSelectionRole = markerKey === selectionKey
      ? "focal"
      : "associated-organization";
    const role = input.selectedMarker.role ?? inferredRole;
    if (role === "focal" && markerKey !== selectionKey) {
      throw new Error("A focal record marker must share the focal record selection key.");
    }
    if (
      role === "associated-organization"
      && (!selectedOrganization || markerKey !== selectedOrganization.selectionKey)
    ) {
      throw new Error("An associated organization marker must match the separately keyed organization context.");
    }
    selectedMarker = Object.freeze({
      selectionKey: markerKey,
      markerId: required(input.selectedMarker.markerId, "Marker id"),
      role,
    });
  }

  return Object.freeze({
    kind: "record",
    source: input.source ?? "restored",
    selectionKey,
    focalIdentity,
    selectedOrganization,
    selectedRecord,
    selectedMarker,
    selectedRelationship: normalizedRelationshipSelection(input.selectedRelationship),
  });
}

export function selectionContainsKey(selection: ExchangeSelectionState, selectionKey: string): boolean {
  if (selection.kind === "none") return false;
  const key = required(selectionKey, "Selection key");
  return selection.selectionKey === key || selection.selectedOrganization?.selectionKey === key;
}

function disabledReasonFor(
  operational: boolean,
  applicable: boolean,
  authorized: boolean,
): ExchangeRoomActionDisabledReason | null {
  if (!operational) return "not-operational";
  if (!applicable) return "not-applicable";
  if (!authorized) return "not-authorized";
  return null;
}

function disabledExplanationKey(
  reason: ExchangeRoomActionDisabledReason | null,
): typeof MOBILE_EXCHANGE_UNAVAILABLE_EXPLANATION_KEY | null {
  return reason ? MOBILE_EXCHANGE_UNAVAILABLE_EXPLANATION_KEY : null;
}

export function projectRecordAction(input: Readonly<{
  id: string;
  labelKey: string;
  operational: boolean;
  applicable: boolean;
  authorized: boolean;
  handler: RecordActionHandler | null;
}>): RecordActionDefinition {
  const disabledReason = disabledReasonFor(input.operational, input.applicable, input.authorized);
  const enabled = disabledReason === null && input.handler !== null;
  const projectedReason = enabled ? null : disabledReason ?? "not-operational";
  return Object.freeze({
    id: required(input.id, "Record action id"),
    labelKey: required(input.labelKey, "Record action label key"),
    operational: input.operational,
    applicable: input.applicable,
    authorized: input.authorized,
    availability: enabled ? "enabled" : "disabled",
    disabledReason: projectedReason,
    disabledExplanationKey: disabledExplanationKey(projectedReason),
    handler: enabled ? input.handler : null,
    authoritySource: "server-derived",
  });
}

export function projectFavoriteState(input: Readonly<{
  visible: boolean;
  favorited: boolean | null;
  operational: boolean;
  applicable: boolean;
  authorized: boolean;
  handler: RecordActionHandler | null;
}>): FavoriteState {
  if (!input.visible) {
    return Object.freeze({
      visible: false,
      favorited: null,
      operational: input.operational,
      applicable: input.applicable,
      authorized: input.authorized,
      availability: "hidden",
      disabledReason: null,
      disabledExplanationKey: null,
      handler: null,
      persistenceOwner: "domain",
      authoritySource: "server-derived",
    });
  }
  const disabledReason = disabledReasonFor(input.operational, input.applicable, input.authorized);
  const enabled = disabledReason === null && input.handler !== null && typeof input.favorited === "boolean";
  const projectedReason = enabled ? null : disabledReason ?? "not-operational";
  return Object.freeze({
    visible: true,
    favorited: typeof input.favorited === "boolean" ? input.favorited : null,
    operational: input.operational,
    applicable: input.applicable,
    authorized: input.authorized,
    availability: enabled ? "enabled" : "disabled",
    disabledReason: projectedReason,
    disabledExplanationKey: disabledExplanationKey(projectedReason),
    handler: enabled ? input.handler : null,
    persistenceOwner: "domain",
    authoritySource: "server-derived",
  });
}

export function createExchangeMediaModel(input: Readonly<{
  kind: ExchangeMediaKind;
  assetReference?: string | null;
  alt: string;
  posterReference?: string | null;
  videoSource?: Readonly<{ assetReference: string }> | null;
  fallbackLabel?: string | null;
}>): ExchangeMediaModel {
  const assetReference = input.assetReference ? required(input.assetReference, "Media asset reference") : null;
  const posterReference = input.posterReference ? required(input.posterReference, "Media poster reference") : null;
  const videoSource = input.videoSource
    ? Object.freeze({
        assetReference: required(input.videoSource.assetReference, "Video asset reference"),
        authoritySource: "server-derived" as const,
      })
    : null;
  if (videoSource && input.kind !== "video-poster") {
    throw new Error("An actual video source must be represented separately from its video-poster presentation.");
  }
  if (input.kind === "fallback" && (assetReference || posterReference || videoSource)) {
    throw new Error("Fallback media cannot carry asset or video references.");
  }
  return Object.freeze({
    kind: input.kind,
    assetReference,
    alt: required(input.alt, "Media alt text"),
    posterReference,
    videoSource,
    fallbackLabel: input.fallbackLabel ? required(input.fallbackLabel, "Media fallback label") : null,
  });
}

export function createLensResultCardModel(input: Readonly<{
  identity: ExchangeSubjectIdentity;
  title: string;
  organizationIdentity?: string | null;
  locality?: string | null;
  summary?: string | null;
  indicator?: ExchangeResultIndicator | null;
  metadata?: readonly ExchangeResultMetadata[];
  media?: ExchangeMediaModel | null;
  favorite: FavoriteState;
  recordActions?: readonly RecordActionDefinition[];
  canonicalHref?: string | null;
  returnLens: ParticipantLensId;
}>): LensResultCardModel {
  const identity = createExchangeSubjectIdentity(input.identity);
  const detailContext = Object.freeze({
    identity,
    canonicalHref: input.canonicalHref ? required(input.canonicalHref, "Canonical detail href") : null,
    returnLens: input.returnLens,
  });
  return Object.freeze({
    identity,
    title: required(input.title, "Card title"),
    organizationIdentity: input.organizationIdentity
      ? required(input.organizationIdentity, "Organization identity")
      : null,
    locality: input.locality ? required(input.locality, "Locality") : null,
    summary: input.summary ? required(input.summary, "Card summary") : null,
    indicator: input.indicator ?? null,
    metadata: Object.freeze([...(input.metadata ?? [])]),
    media: input.media ?? null,
    favorite: input.favorite,
    recordActions: Object.freeze([...(input.recordActions ?? [])]),
    detailContext,
  }) as LensResultCardModel;
}

export function resultCardIdentityIsCoherent(card: LensResultCardModel): boolean {
  return sameSubjectIdentity(card.identity, card.detailContext.identity);
}

export function createExchangeMapObjectProjection(input: Readonly<{
  identity: ExchangeSubjectIdentity;
  markerId: string;
  coordinate: Readonly<{ longitude: number; latitude: number }> | null;
  privacy: ExchangeMapPrivacy;
  accessibleLabel: string;
  selectable: boolean;
  layerIds?: readonly string[];
}>): ExchangeMapObjectProjection {
  const identity = createExchangeSubjectIdentity(input.identity);
  return Object.freeze({
    kind: identity.subjectKind,
    identity,
    markerId: required(input.markerId, "Marker id"),
    coordinate: input.coordinate,
    privacy: input.privacy,
    accessibleLabel: required(input.accessibleLabel, "Accessible map label"),
    selectable: input.selectable,
    layerIds: requiredList(input.layerIds, "Layer id"),
  });
}

export function createExchangeMapAreaProjection(input: Readonly<{
  areaId: string;
  associationSelectionKey?: string | null;
  geographyId: string;
  geometryReference?: string | null;
  privacy: ExchangeMapPrivacy;
  release: "released" | "suppressed";
  accessibleLabel: string;
  selectable: boolean;
  selected: boolean;
  emphasized: boolean;
  layerIds?: readonly string[];
}>): ExchangeMapAreaProjection {
  if (input.release === "suppressed" && input.selectable) {
    throw new Error("A suppressed map area cannot be selectable.");
  }
  if (input.release === "suppressed" && input.privacy !== "suppressed") {
    throw new Error("A suppressed map area cannot expose released geography detail.");
  }
  return Object.freeze({
    kind: "area",
    areaId: required(input.areaId, "Area id"),
    associationSelectionKey: input.associationSelectionKey
      ? required(input.associationSelectionKey, "Area association selection key")
      : null,
    geographyId: required(input.geographyId, "Area geography id"),
    geometryReference: input.geometryReference
      ? required(input.geometryReference, "Area geometry reference")
      : null,
    privacy: input.privacy,
    release: input.release,
    accessibleLabel: required(input.accessibleLabel, "Accessible area label"),
    selectable: input.selectable,
    selected: input.selected,
    emphasized: input.emphasized,
    layerIds: requiredList(input.layerIds, "Layer id"),
    authoritySource: "server-derived",
  });
}

export function createExchangeMapRelationshipProjection(input: Readonly<{
  relationshipId: string;
  pathState: ExchangeRelationshipPathState;
  endpointOrganizationIds?: readonly [string, string] | null;
  geometryReference?: string | null;
  accessibleLabel: string;
  layerIds?: readonly string[];
}>): ExchangeMapRelationshipProjection {
  const relationshipId = required(input.relationshipId, "Relationship id");
  if (input.pathState === "no-path") {
    if (input.endpointOrganizationIds || input.geometryReference) {
      throw new Error("An explicit no-path relationship cannot disclose endpoints or geometry.");
    }
    return Object.freeze({
      kind: "relationship",
      relationshipId,
      pathState: "no-path",
      endpointOrganizationIds: null,
      geometryReference: null,
      privacy: "suppressed",
      accessibleLabel: required(input.accessibleLabel, "Accessible relationship label"),
      layerIds: requiredList(input.layerIds, "Layer id"),
      authoritySource: "server-derived",
    });
  }
  if (!input.endpointOrganizationIds) {
    throw new Error("An authorized relationship path requires two permitted organization endpoints.");
  }
  const endpointOrganizationIds = Object.freeze([
    required(input.endpointOrganizationIds[0], "Relationship endpoint organization id"),
    required(input.endpointOrganizationIds[1], "Relationship endpoint organization id"),
  ]) as readonly [string, string];
  return Object.freeze({
    kind: "relationship",
    relationshipId,
    pathState: "authorized-path",
    endpointOrganizationIds,
    geometryReference: input.geometryReference
      ? required(input.geometryReference, "Relationship geometry reference")
      : null,
    privacy: "permitted",
    accessibleLabel: required(input.accessibleLabel, "Accessible relationship label"),
    layerIds: requiredList(input.layerIds, "Layer id"),
    authoritySource: "server-derived",
  });
}

export function mobileLensActionRail(
  lens: ParticipantLensId,
  projections: readonly ExchangeRoomActionProjection[],
): LensActionRailContract {
  const canonical = asFour(
    exchangeRoomActionDefinitionsForLens(lens),
    `${lens} canonical action registry`,
  );
  const ordered = [...projections]
    .filter((projection) => projection.lens === lens)
    .sort((left, right) => left.order - right.order);
  const source = asFour(ordered, `${lens} projected action rail`);
  source.forEach((projection, index) => {
    const definition = canonical[index];
    if (projection.id !== definition.id || projection.order !== definition.order) {
      throw new Error(`${lens} projected action rail must match the canonical action id and position.`);
    }
  });
  if (new Set(source.map((projection) => projection.id)).size !== 4) {
    throw new Error(`${lens} projected action rail cannot contain duplicate action ids.`);
  }

  const actions = asFour(
    source.map((projection): LensActionDefinition => {
      const enabled = projection.operational
        && projection.applicable
        && projection.authorized
        && projection.resolvedHandler !== null;
      const projectedReason = enabled
        ? null
        : projection.disabledReason
          ?? disabledReasonFor(
            projection.operational,
            projection.applicable,
            projection.authorized,
          )
          ?? "not-operational";
      return Object.freeze({
        id: projection.id,
        lens: projection.lens,
        position: projection.order,
        labelKey: projection.labelKey,
        operational: projection.operational,
        applicable: projection.applicable,
        authorized: projection.authorized,
        availability: enabled ? "enabled" : "disabled",
        disabledReason: projectedReason,
        disabledExplanationKey: disabledExplanationKey(projectedReason),
        handler: enabled ? projection.resolvedHandler : null,
        authoritySource: "server-derived",
      });
    }),
    `${lens} projected action rail`,
  );
  return Object.freeze({ placement: "sheet-top", lens, actions });
}

function continuityState(state: ParticipantSpatialLensState): LensContinuityState {
  return Object.freeze({
    search: state.search,
    filters: Object.freeze({ ...state.filters }),
    sort: null,
    resultSetId: null,
    cursor: null,
    resultPage: state.resultPage,
    resultIndex: state.resultIndex,
    listScrollPosition: state.listScrollTop,
    sheetScrollPosition: state.listScrollTop,
    activeLayerIds: Object.freeze([]),
    layerStateAuthority: "carried-unvalidated",
  });
}

export function mobileExchangeStateFromParticipantSpatialContext(
  context: ParticipantSpatialContext,
): MobileExchangeState {
  const selectionKey = selectionKeyForOrganization(context.selection.organizationId);
  const selection = createExchangeSelectionState({
    kind: "organization",
    source: "restored",
    selectedOrganization: Object.freeze({
      selectionKey,
      organizationId: context.selection.organizationId,
      associationRole: "subject",
    }),
    selectedMarker: Object.freeze({
      selectionKey,
      markerId: context.selection.markerId,
      role: "focal",
    }),
    selectedRelationship: context.selection.relationshipId
      ? Object.freeze({
          relationshipId: context.selection.relationshipId,
          authority: "carried-unvalidated",
        })
      : null,
  });
  const lensState = Object.freeze({
    "opportunities-rfx": continuityState(context.lensState["opportunities-rfx"]),
    resources: continuityState(context.lensState.resources),
    intelligence: continuityState(context.lensState.intelligence),
    capabilities: continuityState(context.lensState.capabilities),
  });

  return Object.freeze({
    version: MOBILE_EXCHANGE_CONTRACT_VERSION,
    activeLens: context.activeLens,
    selection,
    mapCamera: context.camera,
    mapBounds: null,
    geography: createExchangeGeographyContext({
      geographyId: context.scope.geographyId,
      label: null,
      serverRevalidated: false,
    }),
    lensState,
    sheet: Object.freeze({
      sheetSnapPoint: context.panelOpen ? "partial" : "peek",
      sheetScrollPosition: lensState[context.activeLens].sheetScrollPosition,
      content: "results",
      detailContext: null,
    }),
    detail: Object.freeze({ status: "closed", detailContext: null, errorCode: null }),
  });
}

export function transitionMobileExchangeLens(
  state: MobileExchangeState,
  activeLens: ParticipantLensId,
): MobileExchangeState {
  if (!PARTICIPANT_LENS_IDS.includes(activeLens)) throw new Error("Unknown participant lens.");
  return Object.freeze({
    ...state,
    activeLens,
    sheet: Object.freeze({
      ...state.sheet,
      sheetScrollPosition: state.lensState[activeLens].sheetScrollPosition,
    }),
  });
}

export function selectionMatchesCard(
  selection: ExchangeSelectionState,
  card: LensResultCardModel,
): boolean {
  return resultCardIdentityIsCoherent(card)
    && selection.kind !== "none"
    && selection.selectionKey === card.identity.selectionKey
    && sameSubjectIdentity(selection.focalIdentity, card.identity);
}

export function selectionMatchesMapObject(
  selection: ExchangeSelectionState,
  projection: ExchangeMapProjection,
): boolean {
  if (selection.kind === "none" || projection.kind === "cluster") return false;
  if (projection.kind === "relationship") {
    return selection.selectedRelationship?.relationshipId === projection.relationshipId;
  }
  if (projection.kind === "area") {
    return projection.associationSelectionKey !== null
      && selectionContainsKey(selection, projection.associationSelectionKey);
  }
  if (projection.identity.subjectKind === "organization") {
    if (projection.identity.selectionKey === selection.selectionKey) return true;
    return selection.selectedOrganization?.selectionKey === projection.identity.selectionKey
      && selection.selectedOrganization.organizationId === projection.identity.organizationId;
  }
  return projection.identity.selectionKey === selection.selectionKey
    && sameSubjectIdentity(selection.focalIdentity, projection.identity);
}
