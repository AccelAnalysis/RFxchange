import type { OrganizationPermission } from "../../domain/authorization/model";

export const ACCELPO_COMMAND_PORT_VERSION = 1 as const;

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/;
const COMMAND_NAME_PATTERN = /^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)+$/;

export type JsonPrimitive = string | number | boolean | null;
export interface JsonObject {
  readonly [key: string]: JsonValue;
}
export type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[];

export interface ClientCommandEnvelope {
  readonly commandName: string;
  readonly organizationContext: Readonly<{
    readonly organizationId: string;
  }>;
  readonly payload: JsonObject;
  readonly expectedVersion?: number;
  readonly idempotencyKey?: string;
  readonly requestId: string;
}

export interface TrustedCommandActor {
  readonly userId: string;
  readonly membershipId: string;
  readonly organizationId: string;
}

export interface TrustedCommandEnvelope<P extends JsonObject = JsonObject>
  extends ClientCommandEnvelope {
  readonly payload: P;
  readonly actor: TrustedCommandActor;
}

export type CommandProblemDetails = Readonly<
  Record<string, string | number | boolean | null>
>;

export type CommandPortErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not-found"
  | "validation-failure"
  | "version-conflict"
  | "duplicate-request"
  | "unavailable-service";

export class AccelPoCommandError extends Error {
  readonly code: CommandPortErrorCode;
  readonly details: CommandProblemDetails | null;

  constructor(
    code: CommandPortErrorCode,
    message: string,
    details: CommandProblemDetails | null = null,
  ) {
    super(message);
    this.name = "AccelPoCommandError";
    this.code = code;
    this.details = details;
  }
}

export interface CommandTargetDescriptor {
  readonly collection: string;
  readonly recordId: string;
  readonly organizationField?: string;
  readonly owner?: Readonly<{
    readonly field: string;
    readonly kind: "user" | "membership";
  }>;
  readonly versionField?: string;
}

export interface CommandRecordSnapshot {
  readonly path: string;
  readonly exists: boolean;
  readonly data: Readonly<Record<string, unknown>> | null;
}

/**
 * Provider-neutral transaction surface exposed to a registered AccelPO command handler.
 * Implementations must be backed by one server transaction. Handlers receive no direct client
 * write primitive, so a future part cannot accidentally bypass the command boundary.
 */
export interface CommandTransaction {
  get(path: string): Promise<CommandRecordSnapshot>;
  create(path: string, data: Readonly<Record<string, unknown>>): void;
  set(path: string, data: Readonly<Record<string, unknown>>): void;
  update(path: string, data: Readonly<Record<string, unknown>>): void;
}

export interface CommandHandlerContext<P extends JsonObject = JsonObject> {
  readonly command: TrustedCommandEnvelope<P>;
  readonly commandId: string;
  readonly actor: TrustedCommandActor;
  readonly permission: OrganizationPermission;
  readonly target: CommandRecordSnapshot | null;
  readonly currentVersion: number | null;
  readonly now: string;
  readonly transaction: CommandTransaction;
}

export interface CommandHandlerOutcome<R extends JsonValue = JsonValue> {
  readonly data: R;
  readonly resultingVersion?: number | null;
}

export interface CommandPortResult<R extends JsonValue = JsonValue> {
  readonly commandPortVersion: typeof ACCELPO_COMMAND_PORT_VERSION;
  readonly commandId: string;
  readonly commandName: string;
  readonly requestId: string;
  readonly status: "committed" | "replayed";
  readonly replayed: boolean;
  readonly resultingVersion: number | null;
  readonly data: R;
}

export interface CommandDefinition<
  P extends JsonObject = JsonObject,
  R extends JsonValue = JsonValue,
> {
  readonly name: string;
  readonly permission: OrganizationPermission;
  readonly idempotency?: "required" | "optional";
  readonly requiresExpectedVersion?: boolean;
  readonly target?: (payload: P) => CommandTargetDescriptor | null;
  readonly handle: (
    context: CommandHandlerContext<P>,
  ) => Promise<CommandHandlerOutcome<R>> | CommandHandlerOutcome<R>;
}

export type AnyCommandDefinition = CommandDefinition<JsonObject, JsonValue>;

export class AccelPoCommandRegistry {
  private readonly definitions = new Map<string, AnyCommandDefinition>();

  constructor(definitions: readonly AnyCommandDefinition[] = []) {
    for (const definition of definitions) this.register(definition);
  }

  register(definition: AnyCommandDefinition): void {
    if (!COMMAND_NAME_PATTERN.test(definition.name)) {
      throw new Error(`Command name is invalid: ${definition.name}`);
    }
    if (this.definitions.has(definition.name)) {
      throw new Error(`Command is already registered: ${definition.name}`);
    }
    this.definitions.set(definition.name, definition);
  }

  get(name: string): AnyCommandDefinition | null {
    return this.definitions.get(name) ?? null;
  }

  list(): readonly AnyCommandDefinition[] {
    return Object.freeze(
      [...this.definitions.values()].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    );
  }
}

/** The one server-side registry future AccelPO parts extend at composition time. */
export const ACCELPO_COMMAND_REGISTRY = new AccelPoCommandRegistry();

export function registerAccelPoCommand(definition: AnyCommandDefinition): void {
  ACCELPO_COMMAND_REGISTRY.register(definition);
}

export function validCommandIdentifier(value: unknown): value is string {
  return typeof value === "string" && IDENTIFIER_PATTERN.test(value);
}

export function validCommandName(value: unknown): value is string {
  return typeof value === "string" && COMMAND_NAME_PATTERN.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isJsonValue(value: unknown, depth = 0): value is JsonValue {
  if (depth > 12) return false;
  if (value === null) return true;
  if (typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every((item) => isJsonValue(item, depth + 1));
  if (!isRecord(value)) return false;
  return Object.values(value).every((item) => isJsonValue(item, depth + 1));
}

function invalid(message: string): never {
  throw new AccelPoCommandError("validation-failure", message);
}

function requiredIdentifier(value: unknown, label: string): string {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
    invalid(`${label} is invalid.`);
  }
  return value;
}

function requiredCommandName(value: unknown): string {
  if (!validCommandName(value)) invalid("The requested action is invalid.");
  return value;
}

/** Parse only the client-owned envelope. Actor and membership identity are intentionally absent. */
export function parseClientCommandEnvelope(input: unknown): ClientCommandEnvelope {
  if (!isRecord(input)) invalid("A command request is required.");
  if ("actor" in input || "userId" in input || "membershipId" in input) {
    invalid("Actor identity is provided by the authenticated server session.");
  }

  const organizationContext = input.organizationContext;
  if (!isRecord(organizationContext)) invalid("Organization context is required.");
  const organizationId = requiredIdentifier(
    organizationContext.organizationId,
    "Organization context",
  );
  const commandName = requiredCommandName(input.commandName);
  const requestId = requiredIdentifier(input.requestId, "Request identity");
  if (!isRecord(input.payload) || !isJsonValue(input.payload)) {
    invalid("Command payload must be a JSON object.");
  }

  const expectedVersion = input.expectedVersion;
  if (
    expectedVersion !== undefined &&
    (typeof expectedVersion !== "number" ||
      !Number.isSafeInteger(expectedVersion) ||
      expectedVersion < 0)
  ) {
    invalid("Expected record version is invalid.");
  }

  const idempotencyKey = input.idempotencyKey;
  if (
    idempotencyKey !== undefined &&
    (typeof idempotencyKey !== "string" || !IDENTIFIER_PATTERN.test(idempotencyKey))
  ) {
    invalid("Idempotency key is invalid.");
  }

  return Object.freeze({
    commandName,
    organizationContext: Object.freeze({ organizationId }),
    payload: Object.freeze(input.payload) as JsonObject,
    ...(expectedVersion === undefined ? {} : { expectedVersion }),
    ...(idempotencyKey === undefined ? {} : { idempotencyKey }),
    requestId,
  });
}

/** Stable serialization is used for server-side idempotency fingerprints. */
export function stableCommandSerialization(value: JsonValue): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Cannot serialize a non-finite command value.");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableCommandSerialization(item)).join(",")}]`;
  }
  const object = value as JsonObject;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableCommandSerialization(object[key])}`)
    .join(",")}}`;
}

export function commandTargetDescriptor(
  value: CommandTargetDescriptor,
): CommandTargetDescriptor {
  if (!/^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(value.collection)) {
    throw new AccelPoCommandError("validation-failure", "Command target collection is invalid.");
  }
  if (!validCommandIdentifier(value.recordId)) {
    throw new AccelPoCommandError("validation-failure", "Command target record is invalid.");
  }
  if (
    value.organizationField !== undefined &&
    !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(value.organizationField)
  ) {
    throw new AccelPoCommandError("validation-failure", "Command target organization field is invalid.");
  }
  if (value.owner && !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(value.owner.field)) {
    throw new AccelPoCommandError("validation-failure", "Command target owner field is invalid.");
  }
  if (value.versionField && !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(value.versionField)) {
    throw new AccelPoCommandError("validation-failure", "Command target version field is invalid.");
  }
  return Object.freeze({ ...value });
}
