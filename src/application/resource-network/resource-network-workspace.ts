const RESOURCE_QUERY_LIMIT = 160;
const WORKSPACE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/;

export type ResourceAvailabilityFilter = "all" | "available" | "limited" | "unknown";

export interface ResourceNetworkWorkspaceQuery {
  readonly query: string;
  readonly availability: ResourceAvailabilityFilter;
  readonly organizationId: string | null;
  readonly providerId: string | null;
  readonly requestId: string | null;
}

export interface ResourcesMobileWorkspaceQuery extends ResourceNetworkWorkspaceQuery {
  readonly resourceId: string | null;
  readonly manageMode: "offer" | "edit" | null;
  readonly rfxReference: string | null;
  readonly rfxGap: string | null;
  readonly returnTo: string | null;
}

export type ResourcesWorkspaceQueryUpdate = Readonly<Partial<Record<
  "q" | "availability" | "organization" | "provider" | "request" | "resource" | "manage",
  string | null | undefined
>>>;

function boundedText(value: SearchParamValue, maximum: number): string | null {
  const normalized = first(value).trim().replace(/\s+/g, " ").slice(0, maximum);
  return normalized || null;
}

function safeOpportunityReturn(value: SearchParamValue, rfxReference: string | null): string | null {
  const normalized = first(value).trim();
  if (!normalized || normalized.length > 240 || !rfxReference || normalized.startsWith("//")) return null;
  try {
    const parsed = new URL(normalized, "https://participant.invalid");
    if (
      parsed.origin !== "https://participant.invalid"
      || parsed.pathname !== `/opportunities/${encodeURIComponent(rfxReference)}/assess`
    ) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

type SearchParamValue = string | readonly string[] | undefined;

function first(value: SearchParamValue): string {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : "";
}

function workspaceId(value: SearchParamValue): string | null {
  const normalized = first(value).trim();
  return WORKSPACE_ID_PATTERN.test(normalized) ? normalized : null;
}

export function parseResourceWorkspaceId(value: SearchParamValue): string | null {
  return workspaceId(value);
}

export function parseResourceNetworkWorkspaceQuery(
  params: Readonly<Record<string, SearchParamValue>>,
): ResourceNetworkWorkspaceQuery {
  const query = first(params.q).trim().slice(0, RESOURCE_QUERY_LIMIT);
  const requestedAvailability = first(params.availability).trim();
  const availability: ResourceAvailabilityFilter = ["available", "limited", "unknown"].includes(
    requestedAvailability,
  )
    ? requestedAvailability as ResourceAvailabilityFilter
    : "all";

  return Object.freeze({
    query,
    availability,
    organizationId: workspaceId(params.organization),
    providerId: workspaceId(params.provider),
    requestId: workspaceId(params.request),
  });
}

export function parseResourcesMobileWorkspaceQuery(
  params: Readonly<Record<string, SearchParamValue>>,
): ResourcesMobileWorkspaceQuery {
  const rfxReference = workspaceId(params.rfxReference);
  return Object.freeze({
    ...parseResourceNetworkWorkspaceQuery(params),
    resourceId: workspaceId(params.resource),
    manageMode: ["offer", "edit"].includes(first(params.manage))
      ? first(params.manage) as "offer" | "edit"
      : null,
    rfxReference,
    rfxGap: boundedText(params.rfxGap, 240),
    returnTo: safeOpportunityReturn(params.returnTo, rfxReference),
  });
}

export function authorizedWorkspaceSelection(
  requestedId: string | null,
  authorizedIds: readonly string[],
): string | null {
  return requestedId && authorizedIds.includes(requestedId) ? requestedId : null;
}

export function resourcesWorkspaceMutationHref(
  currentSearch: string,
  queryState: ResourcesMobileWorkspaceQuery,
  updates: ResourcesWorkspaceQueryUpdate,
): string {
  const next = new URLSearchParams(currentSearch);
  const carriedContext = {
    rfxReference: queryState.rfxReference,
    rfxGap: queryState.rfxGap,
    returnTo: queryState.returnTo,
  } as const;
  for (const [key, value] of Object.entries(carriedContext)) {
    if (value && !next.has(key)) next.set(key, value);
  }
  const normalizedUpdates: Record<string, string | null | undefined> = { ...updates };
  if (typeof updates.provider === "string" && !("resource" in updates) && !("request" in updates)) {
    normalizedUpdates.resource = null;
    normalizedUpdates.request = null;
  }
  for (const [key, value] of Object.entries(normalizedUpdates)) {
    if (!value || (key === "availability" && value === "all")) next.delete(key);
    else next.set(key, value);
  }
  return `/resources${next.size ? `?${next.toString()}` : ""}`;
}

export function resourcesFocusedOrganizationId(input: Readonly<{
  explicitOrganizationId?: string | null;
  resourceId?: string | null;
  resources?: readonly Readonly<{ id: string; organizationId: unknown }>[];
  requestId?: string | null;
  requests?: readonly Readonly<{
    id: string;
    providerContext?: Readonly<{ providerOrganizationId?: unknown }> | null;
  }>[];
}>): string | null {
  if (input.explicitOrganizationId) return input.explicitOrganizationId;
  if (input.resourceId) {
    const organizationId = input.resources?.find((resource) => resource.id === input.resourceId)?.organizationId;
    return organizationId === null || organizationId === undefined ? null : String(organizationId);
  }
  if (input.requestId) {
    const organizationId = input.requests?.find((request) => request.id === input.requestId)?.providerContext?.providerOrganizationId;
    return organizationId === null || organizationId === undefined ? null : String(organizationId);
  }
  return null;
}
