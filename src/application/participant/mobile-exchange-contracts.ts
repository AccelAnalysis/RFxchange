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

export const MOBILE_EXCHANGE_CONTRACT_VERSION = 1 as const;

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
      selectedOrganization: null;
      selectedRecord: null;
      selectedMarker: null;
    }>
  | Readonly<{
      kind: "organization" | "record";
      source: ExchangeSelectionSource;
      selectionKey: string;
      selectedOrganization: ExchangeOrganizationSelection | null;
      selectedRecord: ExchangeRecordSelection | null;
      selectedMarker: ExchangeMarkerSelection | null;
    }>;

export interface ExchangeMediaModel {
  readonly kind: ExchangeMediaKind;
  readonly assetReference: string | null;
  readonly alt: string;
  readonly posterReference: string | null;
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
  readonly privacy: "exact" | "approximate" | "locality-only" | "suppressed";
  readonly accessibleLabel: string;
  readonly selectable: boolean;
}

export interface ExchangeMapClusterProjection {
  readonly kind: "cluster";
  readonly clusterId: string;
  readonly coordinate: Readonly<{ longitude: number; latitude: number }>;
  readonly count: number;
  readonly accessibleLabel: string;
}

export type ExchangeMapProjection = ExchangeMapObjectProjection | ExchangeMapClusterProjection;

export interface LensMapProjection {
  readonly lens: ParticipantLensId;
  readonly geography: ExchangeGeographyContext;
  readonly objects: readonly ExchangeMapProjection[];
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
} as const);

export function createExchangeSelectionState(input: Readonly<{
  kind: "none" | "organization" | "record";
  source?: ExchangeSelectionSource;
  selectedOrganization?: ExchangeOrganizationSelection | null;
  selectedRecord?: ExchangeRecordSelection | null;
  selectedMarker?: ExchangeMarkerSelection | null;
}>): ExchangeSelectionState {
  if (input.kind === "none") {
    if (input.selectedOrganization || input.selectedRecord || input.selectedMarker) {
      throw new Error("An empty selection cannot contain selected objects.");
    }
    return Object.freeze({
      kind: "none",
      source: null,
      selectionKey: null,
      selectedOrganization: null,
      selectedRecord: null,
      selectedMarker: null,
    });
  }

  const references = [input.selectedOrganization, input.selectedRecord, input.selectedMarker].filter(
    (value): value is ExchangeOrganizationSelection | ExchangeRecordSelection | ExchangeMarkerSelection => Boolean(value),
  );
  if (references.length === 0) throw new Error("A selected object requires at least one stable reference.");
  const selectionKey = required(references[0]!.selectionKey, "Selection key");
  if (references.some((reference) => required(reference.selectionKey, "Selection key") !== selectionKey)) {
    throw new Error("Map, card, and detail selection references must share one selection key.");
  }
  if (input.kind === "organization" && (!input.selectedOrganization || input.selectedRecord)) {
    throw new Error("Organization selection must identify one organization and no domain record.");
  }
  if (input.kind === "record" && !input.selectedRecord) {
    throw new Error("Record selection must identify one domain record.");
  }

  return Object.freeze({
    kind: input.kind,
    source: input.source ?? "restored",
    selectionKey,
    selectedOrganization: input.selectedOrganization ?? null,
    selectedRecord: input.selectedRecord ?? null,
    selectedMarker: input.selectedMarker ?? null,
  });
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
  privacy: ExchangeMapObjectProjection["privacy"];
  accessibleLabel: string;
  selectable: boolean;
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
    }),
    selectedMarker: Object.freeze({
      selectionKey,
      markerId: context.selection.markerId,
    }),
  });
  const lensState = Object.freeze({
    "opportunities-rfx": continuityState(context.lensState["opportunities-rfx"]),
    resources: continuityState(context.lensState.resources),
    intelligence: continuityState(context.lensState.intelligence),
    referrals: continuityState(context.lensState.referrals),
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
    && selection.selectionKey !== null
    && selection.selectionKey === card.identity.selectionKey;
}

export function selectionMatchesMapObject(
  selection: ExchangeSelectionState,
  projection: ExchangeMapProjection,
): boolean {
  return projection.kind !== "cluster"
    && selection.selectionKey !== null
    && selection.selectionKey === projection.identity.selectionKey;
}
