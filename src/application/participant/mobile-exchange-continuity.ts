import {
  MOBILE_EXCHANGE_ACCOUNT_UTILITY,
  MOBILE_EXCHANGE_CLIENT_STATE_POLICY,
  MOBILE_EXCHANGE_CONTRACT_VERSION,
  MOBILE_EXCHANGE_LENS_DEFINITIONS,
  createExchangeGeographyContext,
  createExchangeLensQuery,
  createExchangeSelectionState,
  mobileExchangeStateFromParticipantSpatialContext,
  type ExchangeDetailContext,
  type ExchangeLensQuery,
  type ExchangeMapBounds,
  type ExchangeSelectionState,
  type ExchangeSheetSnapPoint,
  type ExchangeFilterValue,
  type ExchangeSortState,
  type ExchangeSubjectIdentity,
  type LensDiscoveryProjection,
  type LensResultCardModel,
  type MobileExchangeState,
} from "./mobile-exchange-contracts.ts";
import type { ParticipantLensId } from "./participant-lens-registry.ts";
import {
  PARTICIPANT_SPATIAL_CONTEXT_VERSION,
  type ParticipantSpatialContext,
} from "./participant-spatial-context.ts";
import { isLocale, type Locale } from "../../i18n/config.ts";
import type { ParticipantMapCamera } from "../geography/map-view.ts";

export const MOBILE_EXCHANGE_CONTINUITY_VERSION = MOBILE_EXCHANGE_CONTRACT_VERSION;

export const MOBILE_EXCHANGE_INVALIDATION_REASONS = Object.freeze([
  "schema-version-changed",
  "session-changed",
  "participant-changed",
  "membership-changed",
  "viewer-organization-changed",
  "geography-changed",
  "selected-object-authority-changed",
  "associated-organization-authority-changed",
  "relationship-authority-changed",
] as const);

export type MobileExchangeInvalidationReason =
  (typeof MOBILE_EXCHANGE_INVALIDATION_REASONS)[number];

export interface MobileExchangeContinuityScope {
  readonly sessionContextId: string | null;
  readonly participantId: string;
  readonly membershipId: string;
  readonly viewerOrganizationId: string;
  readonly geographyId: string;
}

export type MobileExchangeContinuityState = MobileExchangeState & Readonly<{
  scope: MobileExchangeContinuityScope;
}>;

export interface MobileExchangeReturnContext {
  readonly returnLens: ParticipantLensId;
  readonly returnHref: string;
  readonly focusReturnKey: string | null;
}

export interface MobileExchangeQueryContext {
  readonly contractVersion: typeof MOBILE_EXCHANGE_CONTINUITY_VERSION;
  readonly queryId: string;
  readonly scope: MobileExchangeContinuityScope;
  readonly query: ExchangeLensQuery;
  readonly selection: ExchangeSelectionState;
  readonly sheet: MobileExchangeContinuityState["sheet"];
  readonly detail: MobileExchangeContinuityState["detail"];
  readonly resultIndex: number;
  readonly listScrollPosition: number;
  readonly clientStateGrantsAuthority: false;
}

export interface MobileExchangeReturnSnapshot {
  readonly scope: MobileExchangeContinuityScope;
  readonly query: ExchangeLensQuery;
  readonly selection: ExchangeSelectionState;
  readonly mapCamera: ParticipantMapCamera | null;
  readonly mapBounds: ExchangeMapBounds | null;
  readonly sheetSnapPoint: ExchangeSheetSnapPoint;
  readonly sheetScrollPosition: number;
  readonly listScrollPosition: number;
  readonly resultIndex: number;
  readonly activeLayerIds: readonly string[];
  readonly layerStateAuthority: MobileExchangeContinuityState["lensState"][ParticipantLensId]["layerStateAuthority"];
  readonly returnHref: string;
  readonly focusReturnKey: string | null;
}

export type MobileExchangeDetailNavigationState =
  | Readonly<{ status: "closed"; source: null; context: null; returnSnapshot: null; errorCode: null }>
  | Readonly<{
      status: "opening" | "open";
      source: "card" | "map" | "keyboard" | "deep-link";
      context: MobileExchangeDetailContext;
      returnSnapshot: MobileExchangeReturnSnapshot;
      errorCode: null;
    }>
  | Readonly<{
      status: "error";
      source: "card" | "map" | "keyboard" | "deep-link";
      context: MobileExchangeDetailContext;
      returnSnapshot: MobileExchangeReturnSnapshot;
      errorCode: string;
    }>;

export type MobileExchangeStage3ContinuityState = MobileExchangeContinuityState & Readonly<{
  locale: Locale;
  activeProjection: LensDiscoveryProjection | null;
  detailNavigation: MobileExchangeDetailNavigationState;
}>;

export interface MobileExchangeServerRevalidationResult {
  readonly expectedVersion: number;
  readonly expectedScope: MobileExchangeContinuityScope;
  readonly lens: ParticipantLensId;
  readonly locale: Locale;
  readonly geographyId: string;
  readonly queryId: string;
  readonly queryIdentity: string;
  readonly resultSetId: string | null;
  readonly focalIdentity: ExchangeSubjectIdentity | null;
  readonly focalSubjectAuthorized: boolean;
  readonly associatedOrganizationAuthorized: boolean;
  readonly relationshipAuthorized: boolean;
  readonly detailSubjectAuthorized: boolean;
  readonly detailCanonicalHref: string | null;
}

export type MobileExchangeProjectionRejectionReason =
  | MobileExchangeInvalidationReason
  | "lens-changed"
  | "locale-changed"
  | "query-changed"
  | "result-set-changed"
  | "detail-authority-changed";

export type MobileExchangeProjectionReconciliation =
  | Readonly<{ status: "accepted"; state: MobileExchangeStage3ContinuityState; projection: LensDiscoveryProjection }>
  | Readonly<{
      status: "rejected";
      reason: MobileExchangeProjectionRejectionReason;
      state: MobileExchangeStage3ContinuityState;
      safeState: MobileExchangeStage3ContinuityState | null;
    }>;

export type MobileExchangeDetailContext = ExchangeDetailContext & MobileExchangeReturnContext;

export interface MobileLensResultCardModel {
  readonly card: LensResultCardModel;
  readonly detailContext: MobileExchangeDetailContext;
}

export interface MobileExchangeSearchFilterContract {
  readonly placement: "map-overlay";
  readonly lens: ParticipantLensId;
  readonly search: string;
  readonly filters: Readonly<Record<string, ExchangeFilterValue>>;
  readonly sort: ExchangeSortState | null;
  readonly resultSetId: string | null;
  readonly cursor: string | null;
}

export interface MobileExchangeStage1ShellContract {
  readonly composition: "map-first";
  readonly state: MobileExchangeContinuityState;
  readonly searchFilter: MobileExchangeSearchFilterContract;
  readonly lenses: typeof MOBILE_EXCHANGE_LENS_DEFINITIONS;
  readonly accountUtility: typeof MOBILE_EXCHANGE_ACCOUNT_UTILITY;
  readonly accessibility: typeof MOBILE_EXCHANGE_ACCESSIBILITY_POLICY;
}

export type MobileExchangeContinuityDecision =
  | Readonly<{
      status: "valid";
      reason: null;
      state: MobileExchangeContinuityState;
      safeState: MobileExchangeContinuityState;
    }>
  | Readonly<{
      status: "invalid";
      reason: MobileExchangeInvalidationReason;
      state: MobileExchangeContinuityState;
      safeState: MobileExchangeContinuityState | null;
    }>;

export const MOBILE_EXCHANGE_ACCESSIBILITY_POLICY = Object.freeze({
  minimumTouchTargetPx: 44,
  safeAreaInsetsRequired: true,
  bottomSheetClearsBottomNavigationSafeArea: true,
  nonDragSheetPositionControlRequired: true,
  keyboardSelectionUsesSharedState: true,
  switchAccessUsesSharedState: true,
  selectedAndCurrentStateNotColorOnly: true,
  structuredListAlternativeRequired: true,
  focusRestorationKeyRequiredForDetail: true,
  reducedMotionRequired: true,
  orientationResizePreservesContinuity: true,
  softwareKeyboardPreservesReachability: true,
  sheetScrollStateRequired: true,
  resultCursorContinuityRequired: true,
} as const);

export const MOBILE_EXCHANGE_STAGE1_AUTHORITY_POLICY = Object.freeze({
  ...MOBILE_EXCHANGE_CLIENT_STATE_POLICY,
  scopeChangesInvalidateClientContinuity: true,
  selectedObjectsRequireServerRevalidation: true,
  associatedOrganizationsRequireServerRevalidation: true,
  relationshipsRequireServerRevalidationBeforeDisclosure: true,
  activeLayersRequireDomainRevalidation: true,
  returnContextNeverGrantsAuthority: true,
  carriedGeographyIsNotServerAuthority: true,
} as const);

const CANONICAL_LENS_HREFS: Readonly<Record<ParticipantLensId, string>> = Object.freeze({
  "opportunities-rfx": "/opportunities",
  resources: "/resources",
  intelligence: "/geography/canvas",
  // Capabilities is structurally present but unavailable until its Stage 4 adapter merges.
  // Continuity falls back inside the authorized map shell and never creates a placeholder route.
  capabilities: "/geography/canvas?lens=capabilities",
});

const CANONICAL_LENS_PATHS: Readonly<Record<ParticipantLensId, string>> = Object.freeze({
  "opportunities-rfx": "/opportunities",
  resources: "/resources",
  intelligence: "/geography/canvas",
  capabilities: "/geography/canvas",
});

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > 240) throw new Error(`${label} is invalid.`);
  return normalized;
}

function requiredUniqueList(values: readonly string[], label: string): readonly string[] {
  const normalized = values.map((value) => required(value, label));
  return Object.freeze([...new Set(normalized)]);
}

function safeReturnHref(value: string | null | undefined, returnLens: ParticipantLensId): string {
  const fallback = CANONICAL_LENS_HREFS[returnLens];
  if (!value) return fallback;
  try {
    const parsed = new URL(value, "https://participant.invalid");
    if (parsed.origin !== "https://participant.invalid") return fallback;
    const allowed = lensUrlMatches(parsed, returnLens);
    return allowed ? `${parsed.pathname}${parsed.search}` : fallback;
  } catch {
    return fallback;
  }
}

function lensUrlMatches(parsed: URL, lens: ParticipantLensId): boolean {
  const allowedPath = CANONICAL_LENS_PATHS[lens];
  if (parsed.pathname !== allowedPath && !parsed.pathname.startsWith(`${allowedPath}/`)) return false;
  const lensDiscriminator = parsed.searchParams.get("lens");
  if (lens === "capabilities") return lensDiscriminator === "capabilities";
  if (lens === "intelligence") return lensDiscriminator === null || lensDiscriminator === "intelligence";
  return lensDiscriminator === null || lensDiscriminator === lens;
}

function safeDetailHref(value: string | null, lens: ParticipantLensId): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value, "https://participant.invalid");
    return parsed.origin === "https://participant.invalid" && lensUrlMatches(parsed, lens)
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : null;
  } catch {
    return null;
  }
}

export function mobileExchangeContinuityScope(input: Readonly<{
  sessionContextId?: string | null;
  participantId: string;
  membershipId: string;
  viewerOrganizationId: string;
  geographyId: string;
}>): MobileExchangeContinuityScope {
  return Object.freeze({
    sessionContextId: input.sessionContextId
      ? required(input.sessionContextId, "Session context id")
      : null,
    participantId: required(input.participantId, "Participant id"),
    membershipId: required(input.membershipId, "Membership id"),
    viewerOrganizationId: required(input.viewerOrganizationId, "Viewer organization id"),
    geographyId: required(input.geographyId, "Geography id"),
  });
}

export function migrateParticipantSpatialContextToMobileExchangeContinuity(
  context: ParticipantSpatialContext,
  input: Readonly<{ sessionContextId?: string | null }> = {},
): MobileExchangeContinuityState {
  if (context.version !== PARTICIPANT_SPATIAL_CONTEXT_VERSION) {
    throw new Error("Unsupported participant spatial context version.");
  }
  const presentation = mobileExchangeStateFromParticipantSpatialContext(context);
  if (presentation.version !== MOBILE_EXCHANGE_CONTINUITY_VERSION) {
    throw new Error("Unsupported mobile Exchange contract version.");
  }
  return Object.freeze({
    ...presentation,
    scope: mobileExchangeContinuityScope({
      sessionContextId: input.sessionContextId ?? null,
      participantId: context.scope.participantId,
      membershipId: context.scope.membershipId,
      viewerOrganizationId: context.scope.organizationId,
      geographyId: context.scope.geographyId,
    }),
  });
}

export function mobileExchangeSearchFilter(
  state: MobileExchangeContinuityState,
): MobileExchangeSearchFilterContract {
  const lensState = state.lensState[state.activeLens];
  return Object.freeze({
    placement: "map-overlay",
    lens: state.activeLens,
    search: lensState.search,
    filters: lensState.filters,
    sort: lensState.sort,
    resultSetId: lensState.resultSetId,
    cursor: lensState.cursor,
  });
}

export function createMobileExchangeStage3ContinuityState(
  state: MobileExchangeContinuityState,
  input: Readonly<{ locale: string }>,
): MobileExchangeStage3ContinuityState {
  if (!isLocale(input.locale)) throw new Error("Unsupported Exchange locale.");
  return Object.freeze({
    ...state,
    locale: input.locale,
    activeProjection: null,
    detailNavigation: Object.freeze({
      status: "closed" as const,
      source: null,
      context: null,
      returnSnapshot: null,
      errorCode: null,
    }),
  });
}

export function mobileExchangeQueryContext(
  state: MobileExchangeStage3ContinuityState,
  input: Readonly<{ queryId: string }>,
): MobileExchangeQueryContext {
  const lensState = state.lensState[state.activeLens];
  return Object.freeze({
    contractVersion: MOBILE_EXCHANGE_CONTINUITY_VERSION,
    queryId: required(input.queryId, "Query id"),
    scope: state.scope,
    query: createExchangeLensQuery({
      lens: state.activeLens,
      locale: state.locale,
      geographyId: state.geography.geographyId,
      camera: state.mapCamera,
      bounds: state.mapBounds,
      search: lensState.search,
      filters: lensState.filters,
      sort: lensState.sort,
      cursor: lensState.cursor,
      resultPage: lensState.resultPage,
    }),
    selection: state.selection,
    sheet: state.sheet,
    detail: state.detail,
    resultIndex: lensState.resultIndex,
    listScrollPosition: lensState.listScrollPosition,
    clientStateGrantsAuthority: false,
  });
}

function subjectIdentityMatches(left: ExchangeSubjectIdentity, right: ExchangeSubjectIdentity): boolean {
  return left.subjectKind === right.subjectKind
    && left.selectionKey === right.selectionKey
    && left.organizationId === right.organizationId
    && left.recordType === right.recordType
    && left.recordId === right.recordId;
}

function scopeMatches(left: MobileExchangeContinuityScope, right: MobileExchangeContinuityScope): boolean {
  return left.sessionContextId === right.sessionContextId
    && left.participantId === right.participantId
    && left.membershipId === right.membershipId
    && left.viewerOrganizationId === right.viewerOrganizationId
    && left.geographyId === right.geographyId;
}

function selectionForDetailIdentity(
  identity: ExchangeSubjectIdentity,
  source: "card" | "map" | "keyboard" | "detail",
  markerId: string | null,
): ExchangeSelectionState {
  if (identity.subjectKind === "organization") {
    return createExchangeSelectionState({
      kind: "organization",
      source,
      selectedOrganization: { selectionKey: identity.selectionKey, organizationId: identity.organizationId },
      selectedMarker: markerId ? { selectionKey: identity.selectionKey, markerId } : null,
    });
  }
  return createExchangeSelectionState({
    kind: "record",
    source,
    selectedRecord: {
      selectionKey: identity.selectionKey,
      recordType: identity.recordType,
      recordId: identity.recordId,
      organizationId: identity.organizationId,
    },
    selectedOrganization: identity.organizationId
      ? {
          selectionKey: `organization:${identity.organizationId}`,
          organizationId: identity.organizationId,
          associationRole: "associated",
        }
      : null,
    selectedMarker: markerId ? { selectionKey: identity.selectionKey, markerId, role: "focal" } : null,
  });
}

function returnSnapshot(
  state: MobileExchangeStage3ContinuityState,
  queryContext: MobileExchangeQueryContext,
  detailContext: MobileExchangeDetailContext,
): MobileExchangeReturnSnapshot {
  return Object.freeze({
    scope: state.scope,
    query: queryContext.query,
    selection: state.selection,
    mapCamera: state.mapCamera,
    mapBounds: state.mapBounds,
    sheetSnapPoint: state.sheet.sheetSnapPoint,
    sheetScrollPosition: state.sheet.sheetScrollPosition,
    listScrollPosition: queryContext.listScrollPosition,
    resultIndex: queryContext.resultIndex,
    activeLayerIds: queryContext.query.lens === state.activeLens
      ? state.lensState[state.activeLens].activeLayerIds
      : Object.freeze([]),
    layerStateAuthority: state.lensState[state.activeLens].layerStateAuthority,
    returnHref: detailContext.returnHref,
    focusReturnKey: detailContext.focusReturnKey,
  });
}

export function openMobileExchangeDetailFromProjection(
  state: MobileExchangeStage3ContinuityState,
  input: Readonly<{
    source: "card" | "map" | "keyboard";
    identity: ExchangeSubjectIdentity;
    returnHref?: string | null;
    focusReturnKey: string;
    queryId: string;
  }>,
): MobileExchangeStage3ContinuityState {
  const projection = state.activeProjection;
  if (!projection || projection.lens !== state.activeLens || projection.queryId !== input.queryId) {
    throw new Error("Detail entry requires the accepted active discovery projection.");
  }
  const card = projection.results.status === "ready"
    ? projection.results.cards.find((candidate) => subjectIdentityMatches(candidate.identity, input.identity))
    : undefined;
  const mapObject = projection.map.objects.find(
    (candidate): candidate is Extract<typeof candidate, { kind: "organization" | "record" }> =>
      (candidate.kind === "organization" || candidate.kind === "record")
      && subjectIdentityMatches(candidate.identity, input.identity),
  );
  const spatialDisposition = projection.spatialResults.find((candidate) =>
    subjectIdentityMatches(candidate.identity, input.identity),
  );
  if (!card || !spatialDisposition) {
    throw new Error("Detail identity must be present in the accepted card and map/list projection.");
  }
  if (
    input.source === "map"
    && (
      spatialDisposition.kind !== "mapped"
      || !mapObject
      || mapObject.coordinate === null
      || !mapObject.selectable
    )
  ) {
    throw new Error("Map detail entry requires the visible selectable mapped disposition.");
  }
  const context = mobileExchangeDetailContext({
    identity: card.identity,
    canonicalHref: card.detailContext.canonicalHref,
    returnLens: state.activeLens,
  }, {
    returnHref: input.returnHref,
    focusReturnKey: required(input.focusReturnKey, "Focus return key"),
  });
  const queryContext = mobileExchangeQueryContext(state, { queryId: input.queryId });
  const snapshot = returnSnapshot(state, queryContext, context);
  const selection = selectionForDetailIdentity(
    card.identity,
    input.source,
    spatialDisposition.kind === "mapped" && mapObject ? mapObject.markerId : null,
  );
  return Object.freeze({
    ...state,
    selection,
    sheet: Object.freeze({ ...state.sheet, content: "detail" as const, detailContext: context }),
    detail: Object.freeze({ status: "opening" as const, detailContext: context, errorCode: null }),
    detailNavigation: Object.freeze({
      status: "opening" as const,
      source: input.source,
      context,
      returnSnapshot: snapshot,
      errorCode: null,
    }),
  });
}

export function beginMobileExchangeDeepLink(
  state: MobileExchangeStage3ContinuityState,
  input: Readonly<{
    requestedIdentity: ExchangeSubjectIdentity;
    canonicalHref: string;
    returnLens: ParticipantLensId;
    returnHref?: string | null;
    queryId: string;
  }>,
): MobileExchangeStage3ContinuityState {
  if (input.returnLens !== state.activeLens) {
    throw new Error("A detail deep link must preserve the active origin lens for safe return.");
  }
  const context = mobileExchangeDetailContext({
    identity: input.requestedIdentity,
    canonicalHref: input.canonicalHref,
    returnLens: input.returnLens,
  }, { returnHref: input.returnHref, focusReturnKey: null });
  if (!context.canonicalHref) {
    throw new Error("A detail deep link must use the canonical route family for its origin lens.");
  }
  const snapshot = returnSnapshot(state, mobileExchangeQueryContext(state, { queryId: input.queryId }), context);
  return Object.freeze({
    ...state,
    sheet: Object.freeze({ ...state.sheet, content: "detail" as const, detailContext: context }),
    detail: Object.freeze({ status: "opening" as const, detailContext: context, errorCode: null }),
    detailNavigation: Object.freeze({
      status: "opening" as const,
      source: "deep-link" as const,
      context,
      returnSnapshot: snapshot,
      errorCode: null,
    }),
  });
}

export function mobileExchangeDetailContext(
  context: ExchangeDetailContext,
  input: Readonly<{ returnHref?: string | null; focusReturnKey?: string | null }> = {},
): MobileExchangeDetailContext {
  return Object.freeze({
    ...context,
    canonicalHref: safeDetailHref(context.canonicalHref, context.returnLens),
    returnHref: safeReturnHref(input.returnHref, context.returnLens),
    focusReturnKey: input.focusReturnKey
      ? required(input.focusReturnKey, "Focus return key")
      : null,
  });
}

export function mobileLensResultCardModel(
  card: LensResultCardModel,
  input: Readonly<{ returnHref?: string | null; focusReturnKey?: string | null }> = {},
): MobileLensResultCardModel {
  return Object.freeze({
    card,
    detailContext: mobileExchangeDetailContext(card.detailContext, input),
  });
}

export function withServerRevalidatedMobileExchangeGeography(
  state: MobileExchangeContinuityState,
  input: Readonly<{ geographyId: string; label: string | null }>,
): MobileExchangeContinuityState {
  const geographyId = required(input.geographyId, "Geography id");
  if (geographyId !== state.scope.geographyId) {
    throw new Error("Server geography does not match the active continuity scope.");
  }
  return Object.freeze({
    ...state,
    geography: createExchangeGeographyContext({
      geographyId,
      label: input.label,
      serverRevalidated: true,
    }),
  });
}

/**
 * Reconcile browser-carried layer selections against the current domain layer
 * registry/projection. Unknown or removed IDs are discarded. The resulting IDs
 * remain presentation state and do not grant access to the layer or its data.
 */
export function withDomainRevalidatedMobileExchangeLayers(
  state: MobileExchangeContinuityState,
  input: Readonly<{
    lens: ParticipantLensId;
    activeLayerIds: readonly string[];
    availableLayerIds: readonly string[];
  }>,
): MobileExchangeContinuityState {
  const activeLayerIds = requiredUniqueList(input.activeLayerIds, "Active layer id");
  const available = new Set(requiredUniqueList(input.availableLayerIds, "Available layer id"));
  const retained = Object.freeze(activeLayerIds.filter((layerId) => available.has(layerId)));
  return Object.freeze({
    ...state,
    lensState: Object.freeze({
      ...state.lensState,
      [input.lens]: Object.freeze({
        ...state.lensState[input.lens],
        activeLayerIds: retained,
        layerStateAuthority: "domain-revalidated" as const,
      }),
    }),
  });
}

function rejectedStage3Projection(
  state: MobileExchangeStage3ContinuityState,
  reason: MobileExchangeProjectionRejectionReason,
  safeState: MobileExchangeStage3ContinuityState | null,
): MobileExchangeProjectionReconciliation {
  return Object.freeze({ status: "rejected", reason, state, safeState });
}

export function reconcileServerRevalidatedMobileExchangeProjection(
  state: MobileExchangeStage3ContinuityState,
  query: MobileExchangeQueryContext,
  projection: LensDiscoveryProjection,
  result: MobileExchangeServerRevalidationResult,
): MobileExchangeProjectionReconciliation {
  for (const [label, value] of [
    ["focal subject", result.focalSubjectAuthorized],
    ["associated organization", result.associatedOrganizationAuthorized],
    ["relationship", result.relationshipAuthorized],
    ["detail subject", result.detailSubjectAuthorized],
  ] as const) {
    if (typeof value !== "boolean") throw new Error(`Server revalidation must explicitly resolve ${label} authority.`);
  }
  const continuity = reconcileMobileExchangeContinuity(state, {
    expectedVersion: result.expectedVersion,
    expectedScope: result.expectedScope,
    focalSubjectAuthorized: result.focalSubjectAuthorized,
    associatedOrganizationAuthorized: result.associatedOrganizationAuthorized,
    relationshipAuthorized: result.relationshipAuthorized,
  });
  if (continuity.status === "invalid") {
    const safeState = continuity.safeState
      ? Object.freeze({ ...state, ...continuity.safeState, activeProjection: null })
      : null;
    return rejectedStage3Projection(state, continuity.reason, safeState);
  }
  if (!scopeMatches(query.scope, state.scope) || !scopeMatches(query.scope, result.expectedScope)) {
    return rejectedStage3Projection(state, "query-changed", null);
  }
  if (result.lens !== state.activeLens || query.query.lens !== result.lens || projection.lens !== result.lens) {
    return rejectedStage3Projection(state, "lens-changed", null);
  }
  if (result.locale !== state.locale || query.query.locale !== result.locale) {
    return rejectedStage3Projection(state, "locale-changed", null);
  }
  if (
    result.geographyId !== state.scope.geographyId
    || query.query.geographyId !== result.geographyId
    || projection.geographyId !== result.geographyId
  ) {
    return rejectedStage3Projection(state, "geography-changed", null);
  }
  const currentQuery = mobileExchangeQueryContext(state, { queryId: result.queryId });
  if (
    query.queryId !== result.queryId
    || projection.queryId !== result.queryId
    || query.query.requestIdentity !== result.queryIdentity
    || currentQuery.query.requestIdentity !== result.queryIdentity
  ) {
    return rejectedStage3Projection(state, "query-changed", null);
  }
  if (projection.results.resultSetId !== result.resultSetId) {
    return rejectedStage3Projection(state, "result-set-changed", null);
  }

  const pendingDetail = state.detailNavigation.status === "opening" ? state.detailNavigation : null;
  if (
    !pendingDetail
    && state.selection.kind !== "none"
    && (
      !result.focalIdentity
      || !subjectIdentityMatches(state.selection.focalIdentity, result.focalIdentity)
    )
  ) {
    return rejectedStage3Projection(state, "selected-object-authority-changed", Object.freeze({
      ...state,
      selection: createExchangeSelectionState({ kind: "none" }),
      activeProjection: null,
    }));
  }
  if (pendingDetail) {
    const canonicalHref = safeDetailHref(result.detailCanonicalHref, pendingDetail.context.returnLens);
    if (
      !result.detailSubjectAuthorized
      || !result.focalSubjectAuthorized
      || !result.focalIdentity
      || !subjectIdentityMatches(pendingDetail.context.identity, result.focalIdentity)
      || canonicalHref !== pendingDetail.context.canonicalHref
    ) {
      const safeState = Object.freeze({
        ...state,
        selection: createExchangeSelectionState({ kind: "none" }),
        sheet: Object.freeze({ ...state.sheet, content: "results" as const, detailContext: null }),
        detail: Object.freeze({ status: "error" as const, detailContext: pendingDetail.context, errorCode: "detail-unavailable" }),
        activeProjection: projection,
        detailNavigation: Object.freeze({
          status: "error" as const,
          source: pendingDetail.source,
          context: pendingDetail.context,
          returnSnapshot: pendingDetail.returnSnapshot,
          errorCode: "detail-unavailable",
        }),
      });
      return rejectedStage3Projection(state, "detail-authority-changed", safeState);
    }
  }

  let acceptedState: MobileExchangeStage3ContinuityState = Object.freeze({ ...state, activeProjection: projection });
  if (pendingDetail && result.focalIdentity) {
    const mapObject = projection.map.objects.find((candidate) =>
      (candidate.kind === "organization" || candidate.kind === "record")
      && subjectIdentityMatches(candidate.identity, result.focalIdentity!),
    );
    const selection = selectionForDetailIdentity(
      result.focalIdentity,
      "detail",
      mapObject && (mapObject.kind === "organization" || mapObject.kind === "record") ? mapObject.markerId : null,
    );
    acceptedState = Object.freeze({
      ...acceptedState,
      selection,
      detail: Object.freeze({ status: "open" as const, detailContext: pendingDetail.context, errorCode: null }),
      detailNavigation: Object.freeze({ ...pendingDetail, status: "open" as const }),
    });
  }
  return Object.freeze({ status: "accepted", state: acceptedState, projection });
}

export function closeMobileExchangeDetail(
  state: MobileExchangeStage3ContinuityState,
  input: Readonly<{ currentScope: MobileExchangeContinuityScope; stillAuthorized: boolean }>,
): Readonly<{ state: MobileExchangeStage3ContinuityState | null; returnHref: string; focusReturnKey: string | null }> {
  const navigation = state.detailNavigation;
  if (navigation.status === "closed") {
    return Object.freeze({
      state,
      returnHref: CANONICAL_LENS_HREFS[state.activeLens],
      focusReturnKey: null,
    });
  }
  const snapshot = navigation.returnSnapshot;
  if (!scopeMatches(snapshot.scope, input.currentScope)) {
    return Object.freeze({
      state: null,
      returnHref: CANONICAL_LENS_HREFS[snapshot.query.lens],
      focusReturnKey: null,
    });
  }
  if (!input.stillAuthorized) {
    const safeState = Object.freeze({
      ...state,
      selection: createExchangeSelectionState({ kind: "none" }),
      sheet: Object.freeze({ ...state.sheet, content: "results" as const, detailContext: null }),
      detail: Object.freeze({ status: "closed" as const, detailContext: null, errorCode: null }),
      activeProjection: null,
      detailNavigation: Object.freeze({
        status: "closed" as const,
        source: null,
        context: null,
        returnSnapshot: null,
        errorCode: null,
      }),
    });
    return Object.freeze({
      state: safeState,
      returnHref: CANONICAL_LENS_HREFS[snapshot.query.lens],
      focusReturnKey: null,
    });
  }
  const lensState = state.lensState[snapshot.query.lens];
  const restored = Object.freeze({
    ...state,
    activeLens: snapshot.query.lens,
    selection: snapshot.selection,
    mapCamera: snapshot.mapCamera,
    mapBounds: snapshot.mapBounds,
    lensState: Object.freeze({
      ...state.lensState,
      [snapshot.query.lens]: Object.freeze({
        ...lensState,
        search: snapshot.query.search,
        filters: snapshot.query.filters,
        sort: snapshot.query.sort,
        cursor: snapshot.query.cursor,
        resultSetId: null,
        resultPage: snapshot.query.resultPage,
        resultIndex: snapshot.resultIndex,
        listScrollPosition: snapshot.listScrollPosition,
        sheetScrollPosition: snapshot.sheetScrollPosition,
        activeLayerIds: snapshot.activeLayerIds,
        layerStateAuthority: snapshot.layerStateAuthority,
      }),
    }),
    sheet: Object.freeze({
      ...state.sheet,
      sheetSnapPoint: snapshot.sheetSnapPoint,
      sheetScrollPosition: snapshot.sheetScrollPosition,
      content: "results" as const,
      detailContext: null,
    }),
    detail: Object.freeze({ status: "closed" as const, detailContext: null, errorCode: null }),
    activeProjection: null,
    detailNavigation: Object.freeze({
      status: "closed" as const,
      source: null,
      context: null,
      returnSnapshot: null,
      errorCode: null,
    }),
  });
  return Object.freeze({ state: restored, returnHref: snapshot.returnHref, focusReturnKey: snapshot.focusReturnKey });
}

function closeDetail(
  state: MobileExchangeContinuityState,
): Pick<MobileExchangeContinuityState, "sheet" | "detail"> {
  return {
    sheet: Object.freeze({
      ...state.sheet,
      content: "results",
      detailContext: null,
    }),
    detail: Object.freeze({ status: "closed" as const, detailContext: null, errorCode: null }),
  };
}

function clearSelectedObject(
  state: MobileExchangeContinuityState,
): MobileExchangeContinuityState {
  return Object.freeze({
    ...state,
    selection: createExchangeSelectionState({ kind: "none" }),
    ...closeDetail(state),
  });
}

function narrowRecordSelectionToAssociatedOrganization(
  state: MobileExchangeContinuityState,
): MobileExchangeContinuityState {
  if (state.selection.kind !== "record" || !state.selection.selectedOrganization) {
    return clearSelectedObject(state);
  }
  const organization = state.selection.selectedOrganization;
  const associatedMarker = state.selection.selectedMarker?.role === "associated-organization"
    && state.selection.selectedMarker.selectionKey === organization.selectionKey
      ? state.selection.selectedMarker
      : null;
  return Object.freeze({
    ...state,
    selection: createExchangeSelectionState({
      kind: "organization",
      source: "restored",
      selectedOrganization: {
        selectionKey: organization.selectionKey,
        organizationId: organization.organizationId,
        associationRole: "subject",
      },
      selectedMarker: associatedMarker
        ? {
            selectionKey: associatedMarker.selectionKey,
            markerId: associatedMarker.markerId,
            role: "focal",
          }
        : null,
    }),
    ...closeDetail(state),
  });
}

function removeAssociatedOrganization(
  state: MobileExchangeContinuityState,
): MobileExchangeContinuityState {
  if (state.selection.kind !== "record" || !state.selection.selectedRecord) return state;
  const record = state.selection.selectedRecord;
  const selectedMarker = state.selection.selectedMarker?.role === "focal"
    ? state.selection.selectedMarker
    : null;
  return Object.freeze({
    ...state,
    selection: createExchangeSelectionState({
      kind: "record",
      source: state.selection.source,
      selectedRecord: {
        ...record,
        organizationId: null,
      },
      selectedMarker,
      selectedRelationship: state.selection.selectedRelationship,
    }),
  });
}

function removeRelationship(
  state: MobileExchangeContinuityState,
): MobileExchangeContinuityState {
  if (state.selection.kind === "none" || !state.selection.selectedRelationship) return state;
  if (state.selection.kind === "organization") {
    return Object.freeze({
      ...state,
      selection: createExchangeSelectionState({
        kind: "organization",
        source: state.selection.source,
        selectedOrganization: state.selection.selectedOrganization,
        selectedMarker: state.selection.selectedMarker,
      }),
    });
  }
  return Object.freeze({
    ...state,
    selection: createExchangeSelectionState({
      kind: "record",
      source: state.selection.source,
      selectedOrganization: state.selection.selectedOrganization,
      selectedRecord: state.selection.selectedRecord,
      selectedMarker: state.selection.selectedMarker,
    }),
  });
}

export function reconcileMobileExchangeContinuity(
  state: MobileExchangeContinuityState,
  input: Readonly<{
    expectedVersion: number;
    expectedScope: MobileExchangeContinuityScope;
    /** Legacy all-selected-context assertion retained for existing callers. */
    selectedObjectAuthorized?: boolean;
    /** Current server/domain result for the focal organization or domain record. */
    focalSubjectAuthorized?: boolean;
    /** Independently revalidated organization associated with a focal record. */
    associatedOrganizationAuthorized?: boolean;
    /** Independently revalidated relationship identity; never path disclosure authority by itself. */
    relationshipAuthorized?: boolean;
  }>,
): MobileExchangeContinuityDecision {
  let reason: MobileExchangeInvalidationReason | null = null;
  if (state.version !== input.expectedVersion) reason = "schema-version-changed";
  else if (state.scope.sessionContextId !== input.expectedScope.sessionContextId) {
    reason = "session-changed";
  } else if (state.scope.participantId !== input.expectedScope.participantId) {
    reason = "participant-changed";
  } else if (state.scope.membershipId !== input.expectedScope.membershipId) {
    reason = "membership-changed";
  } else if (state.scope.viewerOrganizationId !== input.expectedScope.viewerOrganizationId) {
    reason = "viewer-organization-changed";
  } else if (state.scope.geographyId !== input.expectedScope.geographyId) {
    reason = "geography-changed";
  }

  if (reason) {
    return Object.freeze({ status: "invalid", reason, state, safeState: null });
  }

  const legacy = input.selectedObjectAuthorized;
  const focalSubjectAuthorized = input.focalSubjectAuthorized ?? legacy ?? true;
  const associatedOrganizationAuthorized = input.associatedOrganizationAuthorized ?? legacy ?? true;
  const relationshipAuthorized = input.relationshipAuthorized ?? legacy ?? true;

  if (!focalSubjectAuthorized && state.selection.kind !== "none") {
    const safeState = state.selection.kind === "record"
      && state.selection.selectedOrganization
      && associatedOrganizationAuthorized
        ? narrowRecordSelectionToAssociatedOrganization(state)
        : clearSelectedObject(state);
    return Object.freeze({
      status: "invalid",
      reason: "selected-object-authority-changed",
      state,
      safeState,
    });
  }

  if (
    !associatedOrganizationAuthorized
    && state.selection.kind === "record"
    && state.selection.selectedOrganization
  ) {
    return Object.freeze({
      status: "invalid",
      reason: "associated-organization-authority-changed",
      state,
      safeState: removeAssociatedOrganization(state),
    });
  }

  if (
    !relationshipAuthorized
    && state.selection.kind !== "none"
    && state.selection.selectedRelationship
  ) {
    return Object.freeze({
      status: "invalid",
      reason: "relationship-authority-changed",
      state,
      safeState: removeRelationship(state),
    });
  }

  return Object.freeze({ status: "valid", reason: null, state, safeState: state });
}

export function transitionMobileExchangeContinuityLens(
  state: MobileExchangeContinuityState,
  activeLens: ParticipantLensId,
): MobileExchangeContinuityState {
  return Object.freeze({
    ...state,
    activeLens,
    sheet: Object.freeze({
      ...state.sheet,
      sheetScrollPosition: state.lensState[activeLens].sheetScrollPosition,
    }),
  });
}
