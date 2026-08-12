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

type SearchParamValue = string | readonly string[] | undefined;

function first(value: SearchParamValue): string {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : "";
}

function workspaceId(value: SearchParamValue): string | null {
  const normalized = first(value).trim();
  return WORKSPACE_ID_PATTERN.test(normalized) ? normalized : null;
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

export function authorizedWorkspaceSelection(
  requestedId: string | null,
  authorizedIds: readonly string[],
): string | null {
  return requestedId && authorizedIds.includes(requestedId) ? requestedId : null;
}
