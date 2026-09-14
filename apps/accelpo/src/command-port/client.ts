import {
  AccelPOCommandClientError,
  CP03_COMMAND_PORT_VERSION,
  type AccelPOCommandRequest,
  type AccelPOCommandResult,
  type CommandJsonValue,
} from "./contracts.ts";

export interface AccelPOCommandClientOptions {
  readonly endpoint?: string;
  readonly fetcher?: typeof fetch;
  /** Firebase ID token is used when AccelPO is hosted on its separate PWA origin. */
  readonly getIdToken?: () => Promise<string | null>;
}

function errorCode(value: unknown): AccelPOCommandClientError["code"] {
  if (
    typeof value === "string" &&
    [
      "command-unauthenticated",
      "command-forbidden",
      "command-not-found",
      "command-validation-failure",
      "command-version-conflict",
      "command-duplicate-request",
      "command-unavailable-service",
    ].includes(value)
  ) {
    return value as AccelPOCommandClientError["code"];
  }
  return "command-unavailable-service";
}

function safeMessage(value: unknown): string {
  return typeof value === "string" && value.trim()
    ? value
    : "The action could not be completed. Retry the request.";
}

function safeDetails(value: unknown): Readonly<Record<string, string | number | boolean | null>> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value as Record<string, unknown>).filter(([, item]) =>
    item === null || typeof item === "string" || typeof item === "number" || typeof item === "boolean",
  );
  return entries.length
    ? Object.freeze(Object.fromEntries(entries) as Record<string, string | number | boolean | null>)
    : null;
}

/** One small transport adapter for all AccelPO consequential actions. */
export function createAccelPOCommandClient(
  options: AccelPOCommandClientOptions = {},
) {
  const fetcher = options.fetcher ?? fetch;
  const endpoint = options.endpoint ?? "/api/accelpo/commands";

  return Object.freeze({
    async execute<Result extends CommandJsonValue = CommandJsonValue>(
      request: AccelPOCommandRequest,
    ): Promise<AccelPOCommandResult<Result>> {
      const token = options.getIdToken ? await options.getIdToken() : null;
      const response = await fetcher(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(request),
      });
      const body = await response.json().catch(() => null) as Record<string, unknown> | null;
      if (!response.ok) {
        throw new AccelPOCommandClientError(
          errorCode(body?.code),
          safeMessage(body?.error),
          safeDetails(body?.details),
        );
      }
      if (
        !body ||
        body.commandPortVersion !== CP03_COMMAND_PORT_VERSION ||
        typeof body.commandId !== "string" ||
        typeof body.commandName !== "string" ||
        typeof body.requestId !== "string" ||
        (body.status !== "committed" && body.status !== "replayed") ||
        typeof body.replayed !== "boolean" ||
        (body.resultingVersion !== null && typeof body.resultingVersion !== "number") ||
        !("data" in body)
      ) {
        throw new AccelPOCommandClientError(
          "command-unavailable-service",
          "The action returned an invalid result. Retry the request.",
        );
      }
      return body as unknown as AccelPOCommandResult<Result>;
    },
  });
}
