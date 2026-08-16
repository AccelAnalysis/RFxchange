import {
  MOBILE_EXCHANGE_ACCOUNT_UTILITY,
  MOBILE_EXCHANGE_CLIENT_STATE_POLICY,
  MOBILE_EXCHANGE_CONTRACT_VERSION,
  MOBILE_EXCHANGE_LENS_DEFINITIONS,
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

export type MobileLensResultCardModel = Omit<LensResultCardModel, "detailContext"> & Readonly<{
  detailContext: MobileExchangeDetailContext;
}>;

export interface MobileExchangeSearchFilterContract {
  readonly placement: "map-overlay";
  readonly lens: ParticipantLensId;
  readonly search: string;
  readonly filters: Readonly<Record<string, ExchangeFilterValue>>;
  readonly sort: ExchangeSortState | null;
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
  nonDragSheetPositionControlRequired: true,
  keyboardSelectionUsesSharedState: true,
  switchAccessUsesSharedState: true,
  selectedAndCurrentStateNotColorOnly: true,
  structuredListAlternativeRequired: true,
  focusRestorationKeyRequiredForDetail: true,
  reducedMotionRequired: true,
  orientationResizePreservesContinuity: true,
} as const);

export const MOBILE_EXCHANGE_STAGE1_AUTHORITY_POLICY = Object.freeze({
  ...MOBILE_EXCHANGE_CLIENT_STATE_POLICY,
  scopeChangesInvalidateClientContinuity: true,
  selectedObjectsRequireServerRevalidation: true,
  returnContextNeverGrantsAuthority: true,
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

function clearSelectedObject(
  state: MobileExchangeContinuityState,
): MobileExchangeContinuityState {
  return Object.freeze({
    ...state,
    selection: createExchangeSelectionState({ kind: "none" }),
    sheet: Object.freeze({
      ...state.sheet,
      content: "results",
      detailContext: null,
    }),
    detail: Object.freeze({ status: "closed", detailContext: null, errorCode: null }),
  });
}

export function reconcileMobileExchangeContinuity(
  state: MobileExchangeContinuityState,
  input: Readonly<{
    expectedVersion: number;
    expectedScope: MobileExchangeContinuityScope;
    selectedObjectAuthorized: boolean;
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
  } else if (!input.selectedObjectAuthorized && state.selection.kind !== "none") {
    reason = "selected-object-authority-changed";
  }

  if (!reason) {
    return Object.freeze({ status: "valid", reason: null, state, safeState: state });
  }
  return Object.freeze({
    status: "invalid",
    reason,
    state,
    safeState: reason === "selected-object-authority-changed"
      ? clearSelectedObject(state)
      : null,
  });
}

export function transitionMobileExchangeContinuityLens(
  state: MobileExchangeContinuityState,
  activeLens: ParticipantLensId,
): MobileExchangeContinuityState {
  return Object.freeze({ ...state, activeLens });
}
