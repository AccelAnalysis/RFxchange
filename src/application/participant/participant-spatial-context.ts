import {
  isParticipantMapCamera,
  type ParticipantMapCamera,
} from "../geography/map-view.ts";
import {
  migrateLegacyParticipantLensId,
  type ParticipantLensId,
} from "./participant-lens-registry.ts";

export const PARTICIPANT_SPATIAL_CONTEXT_VERSION = 2 as const;
export const PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX = "rfxchange:participant-spatial:v2:";
export const LEGACY_PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX = "rfxchange:participant-spatial:v1:";
export const PARTICIPANT_SPATIAL_ACTIVE_KEY = "rfxchange:participant-spatial:active";
export const PARTICIPANT_SPATIAL_CONTEXT_CHANGED_EVENT = "rfxchange:participant-spatial-changed";

export const PARTICIPANT_SHEET_SNAP_POINTS = Object.freeze([
  "peek",
  "partial",
  "expanded",
] as const);

export type ParticipantSheetSnapPoint = (typeof PARTICIPANT_SHEET_SNAP_POINTS)[number];

export interface ParticipantSpatialScope {
  readonly participantId: string;
  readonly membershipId: string;
  readonly organizationId: string;
  readonly geographyId: string;
}

export interface ParticipantSpatialSelection {
  readonly organizationId: string;
  readonly markerId: string;
  readonly relationshipId: string | null;
}

export interface ParticipantSpatialLensState {
  readonly search: string;
  readonly filters: Readonly<Record<string, string>>;
  readonly resultPage: number;
  readonly resultIndex: number;
  readonly listScrollTop: number;
}

export interface ParticipantSpatialWorkflowState {
  readonly referrals: ParticipantSpatialLensState;
}

export interface ParticipantSpatialContext {
  readonly version: typeof PARTICIPANT_SPATIAL_CONTEXT_VERSION;
  readonly scope: ParticipantSpatialScope;
  readonly activeLens: ParticipantLensId;
  readonly selection: ParticipantSpatialSelection;
  readonly camera: ParticipantMapCamera | null;
  readonly lensState: Readonly<Record<ParticipantLensId, ParticipantSpatialLensState>>;
  readonly workflowState: ParticipantSpatialWorkflowState;
  readonly panelOpen: boolean;
  readonly sheetSnapPoint: ParticipantSheetSnapPoint;
  readonly sheetScrollTop: number;
  readonly originLens: ParticipantLensId;
  readonly returnHref: string;
}

const LENSES = ["opportunities-rfx", "resources", "intelligence", "capabilities"] as const;
type AvailableParticipantLens = (typeof LENSES)[number];
type LegacyParticipantLens = Exclude<AvailableParticipantLens, "capabilities"> | "referrals";

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > 192) throw new Error(`${label} is invalid.`);
  return normalized;
}

function isAvailableLens(value: unknown): value is AvailableParticipantLens {
  return typeof value === "string" && LENSES.includes(value as AvailableParticipantLens);
}

function migratedLens(value: unknown, legacy: boolean): AvailableParticipantLens | null {
  if (isAvailableLens(value)) return value;
  return legacy ? migrateLegacyParticipantLensId(value) : null;
}

function isSheetSnapPoint(value: unknown): value is ParticipantSheetSnapPoint {
  return typeof value === "string"
    && PARTICIPANT_SHEET_SNAP_POINTS.includes(value as ParticipantSheetSnapPoint);
}

function emptyLensState(): ParticipantSpatialLensState {
  return Object.freeze({
    search: "",
    filters: Object.freeze({}),
    resultPage: 1,
    resultIndex: 0,
    listScrollTop: 0,
  });
}

export function participantSpatialScope(input: ParticipantSpatialScope): ParticipantSpatialScope {
  return Object.freeze({
    participantId: required(input.participantId, "Participant id"),
    membershipId: required(input.membershipId, "Membership id"),
    organizationId: required(input.organizationId, "Organization id"),
    geographyId: required(input.geographyId, "Geography id"),
  });
}

export function participantSpatialStorageKey(scopeInput: ParticipantSpatialScope): string {
  const scope = participantSpatialScope(scopeInput);
  return `${PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX}${[
    scope.participantId,
    scope.membershipId,
    scope.organizationId,
    scope.geographyId,
  ].map(encodeURIComponent).join(":")}`;
}

export function legacyParticipantSpatialStorageKey(scopeInput: ParticipantSpatialScope): string {
  const scope = participantSpatialScope(scopeInput);
  return `${LEGACY_PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX}${[
    scope.participantId,
    scope.membershipId,
    scope.organizationId,
    scope.geographyId,
  ].map(encodeURIComponent).join(":")}`;
}

export function createParticipantSpatialContext(input: Readonly<{
  scope: ParticipantSpatialScope;
  homeMarkerId: string;
  activeLens?: AvailableParticipantLens;
}>): ParticipantSpatialContext {
  const scope = participantSpatialScope(input.scope);
  const activeLens = input.activeLens ?? "intelligence";
  return Object.freeze({
    version: PARTICIPANT_SPATIAL_CONTEXT_VERSION,
    scope,
    activeLens,
    selection: Object.freeze({
      organizationId: scope.organizationId,
      markerId: required(input.homeMarkerId, "Home marker id"),
      relationshipId: null,
    }),
    camera: null,
    lensState: Object.freeze({
      resources: emptyLensState(),
      intelligence: emptyLensState(),
      capabilities: emptyLensState(),
      "opportunities-rfx": emptyLensState(),
    }),
    workflowState: Object.freeze({ referrals: emptyLensState() }),
    panelOpen: true,
    sheetSnapPoint: "partial",
    sheetScrollTop: 0,
    originLens: activeLens,
    returnHref: "/geography/canvas",
  });
}

function safeInteger(value: unknown, fallback: number, maximum: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? Math.min(value, maximum)
    : fallback;
}

function parseLensState(value: unknown): ParticipantSpatialLensState | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ParticipantSpatialLensState>;
  if (typeof candidate.search !== "string" || candidate.search.length > 240) return null;
  if (!candidate.filters || typeof candidate.filters !== "object" || Array.isArray(candidate.filters)) return null;
  const filters: Record<string, string> = {};
  for (const [key, filter] of Object.entries(candidate.filters)) {
    if (!key.trim() || key.length > 80 || typeof filter !== "string" || filter.length > 191) return null;
    filters[key] = filter;
  }
  return Object.freeze({
    search: candidate.search,
    filters: Object.freeze(filters),
    resultPage: Math.max(1, safeInteger(candidate.resultPage, 1, 100)),
    resultIndex: safeInteger(candidate.resultIndex, 0, 10_000),
    listScrollTop: safeInteger(candidate.listScrollTop, 0, 10_000_000),
  });
}

function safeReturnHref(value: unknown): string {
  if (typeof value !== "string") return "/geography/canvas";
  try {
    const parsed = new URL(value, "https://participant.invalid");
    if (parsed.origin !== "https://participant.invalid" || parsed.pathname !== "/geography/canvas") {
      return "/geography/canvas";
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return "/geography/canvas";
  }
}

export function parseParticipantSpatialContext(
  serialized: string | null,
  expectedScopeInput: ParticipantSpatialScope,
): ParticipantSpatialContext | null {
  if (!serialized) return null;
  const expectedScope = participantSpatialScope(expectedScopeInput);
  try {
    const parsed = JSON.parse(serialized) as Omit<Partial<ParticipantSpatialContext>,
      "version" | "activeLens" | "originLens" | "lensState"> & Readonly<{
      version?: number;
      activeLens?: ParticipantLensId | LegacyParticipantLens;
      originLens?: ParticipantLensId | LegacyParticipantLens;
      lensState?: Partial<Record<ParticipantLensId | LegacyParticipantLens, ParticipantSpatialLensState>>;
      workflowState?: Partial<ParticipantSpatialWorkflowState>;
    }>;
    const legacy = parsed.version === 1;
    if ((!legacy && parsed.version !== PARTICIPANT_SPATIAL_CONTEXT_VERSION) || !parsed.scope) return null;
    const capabilitiesState = parseLensState(
      legacy ? parsed.lensState?.referrals : parsed.lensState?.capabilities,
    );
    const referralWorkflowState = parseLensState(
      legacy ? parsed.lensState?.referrals : parsed.workflowState?.referrals,
    );
    if (!parseLensState(parsed.lensState?.resources)
      || !parseLensState(parsed.lensState?.intelligence)
      || !capabilitiesState
      || !referralWorkflowState) return null;
    const scope = participantSpatialScope(parsed.scope);
    if (Object.keys(expectedScope).some(
      (key) => scope[key as keyof ParticipantSpatialScope] !== expectedScope[key as keyof ParticipantSpatialScope],
    )) return null;
    const activeLens = migratedLens(parsed.activeLens, legacy);
    const originLens = migratedLens(parsed.originLens, legacy);
    if (!activeLens || !originLens) return null;
    if (!parsed.selection || typeof parsed.selection.organizationId !== "string" || typeof parsed.selection.markerId !== "string") return null;
    if (parsed.selection.relationshipId !== null && typeof parsed.selection.relationshipId !== "string") return null;
    if (parsed.camera !== null && !isParticipantMapCamera(parsed.camera)) return null;
    if (typeof parsed.panelOpen !== "boolean") return null;
    return Object.freeze({
      version: PARTICIPANT_SPATIAL_CONTEXT_VERSION,
      scope,
      activeLens,
      selection: Object.freeze({
        organizationId: required(parsed.selection.organizationId, "Selected organization id"),
        markerId: required(parsed.selection.markerId, "Selected marker id"),
        relationshipId: parsed.selection.relationshipId
          ? required(parsed.selection.relationshipId, "Relationship id")
          : null,
      }),
      camera: parsed.camera,
      lensState: Object.freeze({
        resources: parseLensState(parsed.lensState?.resources)!,
        intelligence: parseLensState(parsed.lensState?.intelligence)!,
        capabilities: capabilitiesState,
        "opportunities-rfx": parseLensState(parsed.lensState?.["opportunities-rfx"])
          ?? emptyLensState(),
      }),
      workflowState: Object.freeze({ referrals: referralWorkflowState }),
      panelOpen: parsed.panelOpen,
      // Backward-compatible defaults preserve valid Stage 1 contexts already stored in browsers.
      sheetSnapPoint: isSheetSnapPoint(parsed.sheetSnapPoint)
        ? parsed.sheetSnapPoint
        : parsed.panelOpen ? "partial" : "peek",
      sheetScrollTop: safeInteger(parsed.sheetScrollTop, 0, 10_000_000),
      originLens,
      returnHref: safeReturnHref(parsed.returnHref),
    });
  } catch {
    return null;
  }
}

export function serializeParticipantSpatialContext(context: ParticipantSpatialContext): string {
  return JSON.stringify({
    ...context,
    version: PARTICIPANT_SPATIAL_CONTEXT_VERSION,
    lensState: {
      "opportunities-rfx": context.lensState["opportunities-rfx"],
      resources: context.lensState.resources,
      intelligence: context.lensState.intelligence,
      capabilities: context.lensState.capabilities,
    },
    workflowState: { referrals: context.workflowState.referrals },
  });
}

export function clearParticipantSpatialContexts(): void {
  if (typeof window === "undefined") return;
  try {
    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith(PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX)
        || key?.startsWith(LEGACY_PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX)) {
        window.sessionStorage.removeItem(key);
      }
    }
    window.sessionStorage.removeItem(PARTICIPANT_SPATIAL_ACTIVE_KEY);
  } catch {
    // Optional continuity state never affects sign-out or participant authority.
  }
  window.dispatchEvent(new Event(PARTICIPANT_SPATIAL_CONTEXT_CHANGED_EVENT));
}

export function readActiveParticipantSpatialContext(): ParticipantSpatialContext | null {
  if (typeof window === "undefined") return null;
  try {
    const key = window.sessionStorage.getItem(PARTICIPANT_SPATIAL_ACTIVE_KEY);
    if (!key?.startsWith(PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX)
      && !key?.startsWith(LEGACY_PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX)) return null;
    const serialized = window.sessionStorage.getItem(key);
    if (!serialized) return null;
    const parsed = JSON.parse(serialized) as Partial<ParticipantSpatialContext>;
    return parsed.scope ? parseParticipantSpatialContext(serialized, parsed.scope) : null;
  } catch {
    return null;
  }
}

export function participantSpatialIntelligenceHref(
  context: ParticipantSpatialContext,
  safeQueryBaseHref: string = context.returnHref,
): string {
  const destination = new URL(safeReturnHref(safeQueryBaseHref), "https://participant.invalid");
  destination.searchParams.delete("lens");
  if (context.selection.organizationId !== context.scope.organizationId) {
    destination.searchParams.set("selectedOrganization", context.selection.organizationId);
  } else if (destination.searchParams.get("selectedOrganization") !== context.scope.organizationId) {
    destination.searchParams.delete("selectedOrganization");
  }
  return `${destination.pathname}${destination.search}`;
}

export function participantSpatialLensHref(lens: "capabilities"): null;
export function participantSpatialLensHref(lens: Exclude<ParticipantLensId, "capabilities">): string;
export function participantSpatialLensHref(lens: ParticipantLensId): string | null {
  if (lens === "capabilities") return null;
  const context = readActiveParticipantSpatialContext();
  if (!context) {
    return lens === "resources"
      ? "/resources"
      : lens === "opportunities-rfx"
          ? "/opportunities"
          : "/geography/canvas";
  }
  if (lens === "intelligence") return participantSpatialIntelligenceHref(context);
  if (lens === "opportunities-rfx") {
    const state = context.lensState["opportunities-rfx"];
    const params = new URLSearchParams();
    if (state.search) params.set("q", state.search);
    for (const [key, value] of Object.entries(state.filters)) if (value) params.set(key, value);
    return params.size ? `/opportunities?${params.toString()}` : "/opportunities";
  }
  const state = context.lensState.resources;
  const params = new URLSearchParams();
  if (state.search) params.set("q", state.search);
  for (const [key, value] of Object.entries(state.filters)) if (value) params.set(key, value);
  if (context.selection.organizationId !== context.scope.organizationId) {
    params.set("organization", context.selection.organizationId);
    params.set("provider", context.selection.organizationId);
  }
  return params.size ? `/resources?${params.toString()}` : "/resources";
}

export const participantSpatialContextPolicy = Object.freeze({
  storesAuthorization: false,
  storesPrivateCoordinates: false,
  storesDomainRecords: false,
  storesPresentationOnlySheetState: true,
  scopeIncludesParticipantMembershipOrganizationAndGeography: true,
  serverRevalidatesSelectedObjectsAndActions: true,
} as const);
