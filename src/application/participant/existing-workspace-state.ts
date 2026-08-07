export type ExistingWorkspaceViewportIntent =
  | "organization-home"
  | "selected-object";

export interface ExistingWorkspaceState {
  readonly version: 1;
  readonly organizationId: string;
  readonly selectedObjectId: string;
  readonly panelOpen: boolean;
  readonly viewportIntent: ExistingWorkspaceViewportIntent;
}

export const EXISTING_WORKSPACE_STATE_VERSION = 1 as const;

const DEFAULT_EXISTING_WORKSPACE_STATE = Object.freeze({
  viewportIntent: "organization-home" as const,
});

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > 192) throw new Error(`${label} cannot exceed 192 characters.`);
  return normalized;
}

function viewportIntent(
  value: string | null | undefined,
): ExistingWorkspaceViewportIntent {
  return value === "selected-object"
    ? "selected-object"
    : DEFAULT_EXISTING_WORKSPACE_STATE.viewportIntent;
}

export function existingWorkspaceStorageKey(organizationId: string): string {
  return `rfxchange.workspace.v1.${encodeURIComponent(required(organizationId, "Organization id"))}`;
}

export function createExistingWorkspaceState(input: Readonly<{
  organizationId: string;
  selectedObjectId?: string;
  panelOpen?: boolean;
  viewportIntent?: ExistingWorkspaceViewportIntent;
}>): ExistingWorkspaceState {
  const organizationId = required(input.organizationId, "Organization id");
  return Object.freeze({
    version: EXISTING_WORKSPACE_STATE_VERSION,
    organizationId,
    selectedObjectId: required(
      input.selectedObjectId ?? organizationId,
      "Selected object id",
    ),
    panelOpen: input.panelOpen ?? true,
    viewportIntent: viewportIntent(input.viewportIntent),
  });
}

export function serializeExistingWorkspaceState(state: ExistingWorkspaceState): string {
  return JSON.stringify(state);
}

export function parseExistingWorkspaceState(
  value: string | null,
  organizationId: string,
): ExistingWorkspaceState | null {
  if (!value) return null;
  const expectedOrganizationId = required(organizationId, "Organization id");
  try {
    const parsed = JSON.parse(value) as Partial<ExistingWorkspaceState>;
    if (
      parsed.version !== EXISTING_WORKSPACE_STATE_VERSION ||
      parsed.organizationId !== expectedOrganizationId ||
      !["organization-home", "selected-object"].includes(parsed.viewportIntent ?? "") ||
      typeof parsed.selectedObjectId !== "string" ||
      !parsed.selectedObjectId.trim() ||
      typeof parsed.panelOpen !== "boolean"
    ) {
      return null;
    }
    return createExistingWorkspaceState({
      organizationId: expectedOrganizationId,
      selectedObjectId: parsed.selectedObjectId,
      panelOpen: parsed.panelOpen,
      viewportIntent: parsed.viewportIntent,
    });
  } catch {
    return null;
  }
}

export const existingWorkspaceStatePolicy = Object.freeze({
  storesAuthorization: false,
  storesPrivateCoordinates: false,
  storesDomainRecords: false,
  deterministicViewportIntent: DEFAULT_EXISTING_WORKSPACE_STATE.viewportIntent,
  selectedObjectMustBeAuthorizedProjection: true,
} as const);
