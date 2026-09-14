/**
 * Browser-facing CP-03 contract. The actor is intentionally absent from requests; the server
 * derives it from the authenticated RFxchange identity and active organization membership.
 */

export const CP03_COMMAND_PORT_VERSION = 1 as const;

export interface CommandJsonObject {
  readonly [key: string]: CommandJsonValue;
}

export type CommandJsonValue =
  | string
  | number
  | boolean
  | null
  | CommandJsonObject
  | readonly CommandJsonValue[];

export interface AccelPOCommandRequest<Payload extends CommandJsonObject = CommandJsonObject> {
  readonly commandName: string;
  readonly organizationContext: Readonly<{
    readonly organizationId: string;
  }>;
  readonly payload: Payload;
  readonly expectedVersion?: number;
  readonly idempotencyKey?: string;
  readonly requestId: string;
}

export interface AccelPOCommandResult<Result extends CommandJsonValue = CommandJsonValue> {
  readonly commandPortVersion: typeof CP03_COMMAND_PORT_VERSION;
  readonly commandId: string;
  readonly commandName: string;
  readonly requestId: string;
  readonly status: "committed" | "replayed";
  readonly replayed: boolean;
  readonly resultingVersion: number | null;
  readonly data: Result;
}

export type AccelPOCommandErrorCode =
  | "command-unauthenticated"
  | "command-forbidden"
  | "command-not-found"
  | "command-validation-failure"
  | "command-version-conflict"
  | "command-duplicate-request"
  | "command-unavailable-service";

export class AccelPOCommandClientError extends Error {
  readonly code: AccelPOCommandErrorCode;
  readonly details: Readonly<Record<string, string | number | boolean | null>> | null;

  constructor(
    code: AccelPOCommandErrorCode,
    message: string,
    details: Readonly<Record<string, string | number | boolean | null>> | null = null,
  ) {
    super(message);
    this.name = "AccelPOCommandClientError";
    this.code = code;
    this.details = details;
  }
}
