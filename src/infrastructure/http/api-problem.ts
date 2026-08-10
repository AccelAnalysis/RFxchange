import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server.js";

const API_PROBLEM_STATUSES = new Set([
  400,
  401,
  403,
  404,
  409,
  413,
  415,
  422,
  428,
  429,
  500,
  502,
  503,
]);
const OPAQUE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PUBLIC_CODE_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;

export interface ApiProblemRequest {
  readonly headers: Pick<Headers, "get">;
  readonly method: string;
  readonly url: string;
}

export interface ApiProblemInput {
  readonly status: number;
  readonly participantMessage: string;
  readonly code?: string;
  readonly cause?: unknown;
}

interface ApiProblemDependencies {
  readonly id?: () => string;
  readonly report?: (event: Readonly<Record<string, unknown>>) => void;
}

function opaqueRequestId(value: string | null): string | null {
  const normalized = value?.trim() ?? "";
  return OPAQUE_ID_PATTERN.test(normalized) ? normalized.toLowerCase() : null;
}

function nextOpaqueId(id: () => string): string {
  return opaqueRequestId(id()) ?? randomUUID();
}

function boundedStatus(value: number): number {
  return API_PROBLEM_STATUSES.has(value) ? value : 500;
}

function publicCode(value: string | undefined): string | undefined {
  const normalized = value?.trim() ?? "";
  return PUBLIC_CODE_PATTERN.test(normalized) ? normalized : undefined;
}

function boundedParticipantMessage(value: string): string {
  const normalized = value.trim();
  return normalized && normalized.length <= 240
    ? normalized
    : "The request could not be completed.";
}

function diagnosticErrorCode(cause: unknown): string | null {
  if (!cause || typeof cause !== "object" || !("code" in cause)) return null;
  const value = String(cause.code);
  return /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,95}$/.test(value) ? value : null;
}

/**
 * Produces the common participant-facing API failure envelope. Callers supply only allow-listed
 * copy and status/code semantics; provider messages, response bodies, stacks, and causes remain
 * server-side. Correlation and support identifiers are opaque UUIDs rather than authority-bearing
 * identifiers. Only a valid opaque inbound correlation identifier may be continued.
 */
export function apiProblem(
  request: ApiProblemRequest,
  input: ApiProblemInput,
  dependencies: ApiProblemDependencies = {},
): NextResponse {
  const id = dependencies.id ?? randomUUID;
  const correlationId = opaqueRequestId(request.headers.get("x-rfxchange-correlation-id")) ?? nextOpaqueId(id);
  const supportId = nextOpaqueId(id);
  const status = boundedStatus(input.status);
  const code = publicCode(input.code);
  const participantMessage = boundedParticipantMessage(input.participantMessage);
  const pathname = (() => {
    try {
      return new URL(request.url).pathname;
    } catch {
      return "unavailable";
    }
  })();
  const causeName = input.cause instanceof Error ? input.cause.name : typeof input.cause;
  const event = Object.freeze({
    event: "api.problem",
    correlationId,
    supportId,
    method: request.method,
    pathname,
    status,
    publicCode: code ?? null,
    causeName,
    causeCode: diagnosticErrorCode(input.cause),
  });

  (dependencies.report ?? ((value) => console.error(JSON.stringify(value))))(event);

  return NextResponse.json(
    {
      error: participantMessage,
      ...(code ? { code } : {}),
      correlationId,
      supportId,
    },
    {
      status,
      headers: {
        "cache-control": "no-store",
        "x-rfxchange-correlation-id": correlationId,
        "x-rfxchange-support-id": supportId,
      },
    },
  );
}
