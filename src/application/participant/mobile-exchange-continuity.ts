import {
  MOBILE_EXCHANGE_ACCOUNT_UTILITY,
  MOBILE_EXCHANGE_CLIENT_STATE_POLICY,
  MOBILE_EXCHANGE_CONTRACT_VERSION,
  MOBILE_EXCHANGE_LENS_DEFINITIONS,
  createExchangeGeographyContext,
  createExchangeSelectionState,
  mobileExchangeStateFromParticipantSpatialContext,
  type ExchangeDetailContext,
  type ExchangeFilterValue,
  type ExchangeSortState,
  type LensResultCardModel,
  type MobileExchangeState,
} from "./mobile-exchange-contracts.ts";
import type { ParticipantLensId } from "./participant-lens-registry.ts";
import {
  PARTICIPANT_SPATIAL_CONTEXT_VERSION,
  type ParticipantSpatialContext,
} from "./participant-spatial-context.ts";

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
  referrals: "/referrals",
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
    const allowed = Object.values(CANONICAL_LENS_HREFS).some(
      (prefix) => parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`),
    );
    return allowed ? `${parsed.pathname}${parsed.search}` : fallback;
  } catch {
    return fallback;
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

export function mobileExchangeDetailContext(
  context: ExchangeDetailContext,
  input: Readonly<{ returnHref?: string | null; focusReturnKey?: string | null }> = {},
): MobileExchangeDetailContext {
  return Object.freeze({
    ...context,
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
