import type { QueryProjectionPort } from "../chassis/ports.ts";
import type {
  QueryProjectionInput,
  QueryProjectionResult,
} from "./contracts.ts";

export interface AccelPOQueryClientOptions {
  readonly endpoint?: string;
  readonly fetcher?: typeof fetch;
  /** Firebase ID token is used when AccelPO is hosted on its separate PWA origin. */
  readonly getIdToken?: () => Promise<string | null>;
  /** A CP-01 selection hint; the server revalidates the active membership and organization. */
  readonly getOrganizationId?: () => string | null;
}
const FAILURE_CODES = Object.freeze([
  "unauthenticated",
  "forbidden",
  "not-found",
  "validation-failure",
  "unavailable-service",
] as const);

function fallbackFailure(code: "unauthenticated" | "forbidden" | "not-found" | "validation-failure" | "unavailable-service"): QueryProjectionResult {
  const messages = {
    unauthenticated: "Sign in to view this information.",
    forbidden: "You do not have access to this information.",
    "not-found": "That information is not available.",
    "validation-failure": "The request could not be understood.",
    "unavailable-service": "This information is temporarily unavailable. Try again.",
  } as const;
  return Object.freeze({
    outcome: "failure" as const,
    projection: "unknown",
    code,
    message: messages[code],
  });
}

function isQueryResult(value: unknown): value is QueryProjectionResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.projection !== "string") return false;
  if (candidate.outcome === "failure") {
    return typeof candidate.message === "string" &&
      typeof candidate.code === "string" &&
      FAILURE_CODES.includes(candidate.code as (typeof FAILURE_CODES)[number]);
  }
  if ((candidate.outcome !== "success" && candidate.outcome !== "empty") || !Array.isArray(candidate.items)) {
    return false;
  }
  return candidate.nextCursor === null || typeof candidate.nextCursor === "string";
}

/** Browser transport for CP-04. It carries no raw collection access or client permission claims. */
export function createAccelPOQueryClient(
  options: AccelPOQueryClientOptions = {},
): QueryProjectionPort<QueryProjectionInput, QueryProjectionResult> {
  const fetcher = options.fetcher ?? fetch;
  const endpoint = options.endpoint ?? "/api/accelpo/query";
  return Object.freeze({
    async read(query: QueryProjectionInput): Promise<QueryProjectionResult> {
      let response: Response;
      try {
        const token = options.getIdToken ? await options.getIdToken() : null;
        response = await fetcher(endpoint, {
          method: "POST",
          credentials: "include",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            organizationId: options.getOrganizationId?.() ?? null,
            query,
          }),
        });
      } catch {
        return fallbackFailure("unavailable-service");
      }

      const body = await response.json().catch(() => null);
      if (isQueryResult(body)) return body;
      if (response.status === 401) return fallbackFailure("unauthenticated");
      if (response.status === 403) return fallbackFailure("forbidden");
      if (response.status === 404) return fallbackFailure("not-found");
      if (response.status === 400) return fallbackFailure("validation-failure");
      return fallbackFailure("unavailable-service");
    },
  });
}
