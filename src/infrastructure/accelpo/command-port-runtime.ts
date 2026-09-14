import { createHash } from "node:crypto";

import type {
  DocumentData,
  DocumentSnapshot,
  Firestore,
  Transaction,
} from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

import {
  authorizeOrganizationOperation,
  type OrganizationOperationAuthorizationDependencies,
} from "../../application/auth/authorize-organization-operation";
import type { AuthenticatedServerContext } from "../../application/auth/server-session";
import {
  AccelPoCommandError,
  AccelPoCommandRegistry,
  ACCELPO_COMMAND_REGISTRY,
  ACCELPO_COMMAND_PORT_VERSION,
  commandTargetDescriptor,
  parseClientCommandEnvelope,
  stableCommandSerialization,
  type AnyCommandDefinition,
  type ClientCommandEnvelope,
  type CommandHandlerContext,
  type CommandPortResult,
  type CommandRecordSnapshot,
  type CommandTargetDescriptor,
  type CommandTransaction,
  type JsonObject,
  type JsonValue,
  type TrustedCommandActor,
  type TrustedCommandEnvelope,
} from "../../application/accelpo/command-port";
import { organizationId } from "../../domain/organizations/model";
import { organizationMembershipId } from "../../domain/users/model";
import { createServerFirebaseAccountSecurityService } from "../auth/firebase-account-security-runtime";
import { createFirestoreFoundationRepositories } from "../firestore/repositories";
import { getServerFirestore } from "../firestore/runtime";

const COMMAND_RECEIPTS_COLLECTION = "accelPoCommandReceipts";
const COMMAND_RECEIPT_SCHEMA_VERSION = 1 as const;
const MAX_RESULT_BYTES = 64 * 1024;
const MAX_DOCUMENT_PATH_SEGMENTS = 12;

interface PersistedCommandReceipt {
  readonly id: string;
  readonly commandName: string;
  readonly organizationId: string;
  readonly actorUserId: string;
  readonly actorMembershipId: string;
  readonly requestId: string;
  readonly idempotencyKey: string | null;
  readonly fingerprint: string;
  readonly status: "committed";
  readonly result: JsonValue;
  readonly resultingVersion: number | null;
}

export interface ServerAccelPoCommandPortOptions {
  readonly db?: Firestore;
  readonly registry?: AccelPoCommandRegistry;
  readonly now?: () => string;
}

export interface ServerAccelPoCommandPort {
  execute(
    input: unknown,
    context: AuthenticatedServerContext,
  ): Promise<CommandPortResult<JsonValue>>;
}

function fingerprint(input: ClientCommandEnvelope): string {
  const value: JsonObject = {
    commandName: input.commandName,
    organizationId: input.organizationContext.organizationId,
    payload: input.payload,
    ...(input.expectedVersion === undefined
      ? {}
      : { expectedVersion: input.expectedVersion }),
  };
  return createHash("sha256")
    .update(stableCommandSerialization(value), "utf8")
    .digest("hex");
}

function commandId(input: ClientCommandEnvelope, actor: TrustedCommandActor): string {
  const identity = [
    actor.organizationId,
    actor.userId,
    actor.membershipId,
    input.commandName,
    input.idempotencyKey ?? input.requestId,
  ].join("\u0000");
  return `accelpo_cmd_${createHash("sha256").update(identity, "utf8").digest("hex").slice(0, 48)}`;
}

function documentPath(value: string): string {
  const normalized = value.trim();
  const segments = normalized.split("/");
  if (
    !normalized ||
    segments.length < 2 ||
    segments.length > MAX_DOCUMENT_PATH_SEGMENTS ||
    segments.length % 2 !== 0 ||
    segments.some((segment) => !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(segment))
  ) {
    throw new AccelPoCommandError("validation-failure", "The command target path is invalid.");
  }
  return normalized;
}

function snapshotFromDocument(snapshot: DocumentSnapshot): CommandRecordSnapshot {
  return Object.freeze({
    path: snapshot.ref.path,
    exists: snapshot.exists,
    data: snapshot.exists ? Object.freeze({ ...(snapshot.data() ?? {}) }) : null,
  });
}

class FirestoreCommandTransaction implements CommandTransaction {
  constructor(
    private readonly db: Firestore,
    private readonly transaction: Transaction,
  ) {}

  async get(path: string): Promise<CommandRecordSnapshot> {
    const snapshot = await this.transaction.get(this.db.doc(documentPath(path)));
    return snapshotFromDocument(snapshot);
  }

  create(path: string, data: Readonly<Record<string, unknown>>): void {
    this.transaction.create(this.db.doc(documentPath(path)), data as DocumentData);
  }

  set(path: string, data: Readonly<Record<string, unknown>>): void {
    this.transaction.set(this.db.doc(documentPath(path)), data as DocumentData);
  }

  update(path: string, data: Readonly<Record<string, unknown>>): void {
    this.transaction.update(this.db.doc(documentPath(path)), data as DocumentData);
  }
}

function authorizationDependencies(
  db: Firestore,
): OrganizationOperationAuthorizationDependencies {
  const foundation = createFirestoreFoundationRepositories(db);
  return Object.freeze({
    accountSecurity: createServerFirebaseAccountSecurityService(),
    organizations: foundation.organizations.accounts,
    memberships: foundation.users.memberships,
    authorizations: foundation.organizationAuthorization,
    restrictions: foundation.lifecycle.restrictions,
  });
}

async function authorizedActor(
  db: Firestore,
  context: AuthenticatedServerContext,
  input: ClientCommandEnvelope,
  definition: AnyCommandDefinition,
): Promise<TrustedCommandActor> {
  const organizationIdValue = input.organizationContext.organizationId;
  const foundation = createFirestoreFoundationRepositories(db);
  const memberships = await foundation.users.memberships.listActiveByUserId(context.user.id);
  const matches = memberships.filter(
    (membership) => String(membership.organizationId) === organizationIdValue,
  );
  const membership = matches[0];
  if (matches.length !== 1 || !membership) {
    throw new AccelPoCommandError(
      "forbidden",
      "This action is unavailable for the selected organization.",
    );
  }

  let requestedOrganization;
  let requestedMembership;
  try {
    requestedOrganization = organizationId(organizationIdValue);
    requestedMembership = organizationMembershipId(String(membership.id));
  } catch {
    throw new AccelPoCommandError(
      "forbidden",
      "This action is unavailable for the selected organization.",
    );
  }

  const decision = await authorizeOrganizationOperation(
    {
      context,
      organizationId: requestedOrganization,
      membershipId: requestedMembership,
      permission: definition.permission,
    },
    authorizationDependencies(db),
  );
  if (!decision.allowed) {
    throw new AccelPoCommandError(
      decision.reason === "organization-not-found" ? "not-found" : "forbidden",
      decision.reason === "organization-not-found"
        ? "The selected organization is unavailable."
        : "You are not authorized to perform this action.",
    );
  }

  return Object.freeze({
    userId: String(context.user.id),
    membershipId: String(membership.id),
    organizationId: organizationIdValue,
  });
}

async function revalidateAuthorization(
  transaction: Transaction,
  db: Firestore,
  actor: TrustedCommandActor,
  context: AuthenticatedServerContext,
  permission: string,
): Promise<void> {
  const organizationSnapshot = await transaction.get(
    db.doc(`organizations/${actor.organizationId}`),
  );
  const membershipSnapshot = await transaction.get(
    db.doc(`organizationMemberships/${actor.membershipId}`),
  );
  const authorizationSnapshot = await transaction.get(
    db.doc(`organizationAuthorizations/${actor.membershipId}`),
  );
  const restrictionsSnapshot = await transaction.get(
    db
      .collection("accessRestrictions")
      .where("target.organizationId", "==", actor.organizationId),
  );

  const membership = membershipSnapshot.data();
  const authorization = authorizationSnapshot.data();
  if (!organizationSnapshot.exists || !membershipSnapshot.exists || !authorizationSnapshot.exists) {
    throw new AccelPoCommandError(
      "forbidden",
      "This action is unavailable for the selected organization.",
    );
  }
  if (
    membership?.organizationId !== actor.organizationId ||
    membership.userId !== String(context.user.id) ||
    membership.status !== "active" ||
    authorization?.organizationId !== actor.organizationId ||
    authorization.userId !== String(context.user.id) ||
    authorization.membershipId !== actor.membershipId ||
    !Array.isArray(authorization.permissions) ||
    !authorization.permissions.includes(permission)
  ) {
    throw new AccelPoCommandError(
      "forbidden",
      "You are not authorized to perform this action.",
    );
  }

  const restricted = restrictionsSnapshot.docs.some((document) => {
    const value = document.data();
    const target = value.target;
    if (!target || value.state === "none") return false;
    return target.kind === "organization"
      ? target.organizationId === actor.organizationId
      : target.kind === "membership" && target.membershipId === actor.membershipId;
  });
  if (restricted) {
    throw new AccelPoCommandError(
      "forbidden",
      "This action is unavailable while organization access is restricted.",
    );
  }
}

function targetFor(
  definition: AnyCommandDefinition,
  payload: JsonObject,
): CommandTargetDescriptor | null {
  if (!definition.target) return null;
  try {
    const target = definition.target(payload);
    return target ? commandTargetDescriptor(target) : null;
  } catch (error) {
    if (error instanceof AccelPoCommandError) throw error;
    throw new AccelPoCommandError("validation-failure", "The command target is invalid.");
  }
}

function currentVersionFor(
  target: CommandRecordSnapshot | null,
  descriptor: CommandTargetDescriptor | null,
): number | null {
  if (!target || !descriptor?.versionField) return null;
  const value = target.data?.[descriptor.versionField];
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new AccelPoCommandError(
      "version-conflict",
      "The record version is unavailable. Refresh and try again.",
    );
  }
  return Number(value);
}

function validateTarget(
  target: CommandRecordSnapshot | null,
  descriptor: CommandTargetDescriptor | null,
  actor: TrustedCommandActor,
  expectedVersion: number | undefined,
): number | null {
  if (!descriptor) {
    if (expectedVersion !== undefined) {
      throw new AccelPoCommandError(
        "validation-failure",
        "Expected record version cannot be used without a command target.",
      );
    }
    return null;
  }
  if (!target?.exists || !target.data) {
    throw new AccelPoCommandError("not-found", "The requested record is unavailable.");
  }
  const organizationField = descriptor.organizationField ?? "organizationId";
  if (target.data[organizationField] !== actor.organizationId) {
    throw new AccelPoCommandError("not-found", "The requested record is unavailable.");
  }
  if (descriptor.owner) {
    const expectedOwner = descriptor.owner.kind === "user" ? actor.userId : actor.membershipId;
    if (target.data[descriptor.owner.field] !== expectedOwner) {
      throw new AccelPoCommandError("forbidden", "You are not authorized to act on this record.");
    }
  }
  const currentVersion = currentVersionFor(target, descriptor);
  if (descriptor.versionField && expectedVersion === undefined) {
    throw new AccelPoCommandError(
      "validation-failure",
      "A current record version is required for this action.",
    );
  }
  if (
    descriptor.versionField &&
    expectedVersion !== undefined &&
    currentVersion !== expectedVersion
  ) {
    throw new AccelPoCommandError(
      "version-conflict",
      "This record changed before the action could be completed. Refresh and try again.",
      { currentVersion },
    );
  }
  return currentVersion;
}

function resultVersion(
  outcome: { readonly resultingVersion?: number | null },
  currentVersion: number | null,
  descriptor: CommandTargetDescriptor | null,
): number | null {
  const version = outcome.resultingVersion === undefined
    ? currentVersion
    : outcome.resultingVersion;
  if (version !== null && (!Number.isSafeInteger(version) || version < 0)) {
    throw new AccelPoCommandError("validation-failure", "The command returned an invalid record version.");
  }
  if (
    descriptor?.versionField &&
    currentVersion !== null &&
    version !== currentVersion + 1
  ) {
    throw new AccelPoCommandError(
      "validation-failure",
      "The command must commit the next record version.",
    );
  }
  return version;
}

function persistedReceipt(
  snapshot: DocumentSnapshot,
  input: Readonly<{
    readonly commandId: string;
    readonly command: TrustedCommandEnvelope;
    readonly actor: TrustedCommandActor;
    readonly fingerprint: string;
  }>,
): CommandPortResult<JsonValue> | null {
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (!data || data.status !== "committed") {
    throw new AccelPoCommandError(
      "unavailable-service",
      "The previous action is still being recovered. Retry shortly.",
    );
  }
  if (
    data.fingerprint !== input.fingerprint ||
    data.commandName !== input.command.commandName ||
    data.organizationId !== input.actor.organizationId ||
    data.actorUserId !== input.actor.userId ||
    data.actorMembershipId !== input.actor.membershipId
  ) {
    throw new AccelPoCommandError(
      "duplicate-request",
      "That request identity was already used for different information.",
    );
  }
  if (
    data.result === undefined ||
    (data.resultingVersion !== null &&
      (!Number.isSafeInteger(data.resultingVersion) || data.resultingVersion < 0))
  ) {
    throw new AccelPoCommandError("unavailable-service", "The previous action result is unavailable. Retry shortly.");
  }
  try {
    if (resultSize(data.result as JsonValue) > MAX_RESULT_BYTES) {
      throw new Error("result-too-large");
    }
  } catch {
    throw new AccelPoCommandError("unavailable-service", "The previous action result is unavailable. Retry shortly.");
  }
  return Object.freeze({
    commandPortVersion: ACCELPO_COMMAND_PORT_VERSION,
    commandId: input.commandId,
    commandName: input.command.commandName,
    requestId: input.command.requestId,
    status: "replayed" as const,
    replayed: true as const,
    resultingVersion: data.resultingVersion as number | null,
    data: data.result as JsonValue,
  });
}

function resultSize(value: JsonValue): number {
  return Buffer.byteLength(stableCommandSerialization(value), "utf8");
}

function handlerContext(
  command: TrustedCommandEnvelope,
  commandIdValue: string,
  actor: TrustedCommandActor,
  definition: AnyCommandDefinition,
  target: CommandRecordSnapshot | null,
  currentVersion: number | null,
  now: string,
  transaction: CommandTransaction,
): CommandHandlerContext {
  return Object.freeze({
    command,
    commandId: commandIdValue,
    actor,
    permission: definition.permission,
    target,
    currentVersion,
    now,
    transaction,
  });
}

export function createServerAccelPoCommandPort(
  options: ServerAccelPoCommandPortOptions = {},
): ServerAccelPoCommandPort {
  const db = options.db ?? getServerFirestore();
  const registry = options.registry ?? ACCELPO_COMMAND_REGISTRY;
  const now = options.now ?? (() => new Date().toISOString());

  return Object.freeze({
    async execute(input: unknown, context: AuthenticatedServerContext) {
      const command = parseClientCommandEnvelope(input);
      const definition = registry.get(command.commandName);
      if (!definition) {
        throw new AccelPoCommandError("validation-failure", "That action is not available.");
      }
      if (definition.idempotency === "required" && !command.idempotencyKey) {
        throw new AccelPoCommandError(
          "validation-failure",
          "A retry-safe request identity is required for this action.",
        );
      }
      if (definition.requiresExpectedVersion && command.expectedVersion === undefined) {
        throw new AccelPoCommandError(
          "validation-failure",
          "A current record version is required for this action.",
        );
      }

      const actor = await authorizedActor(db, context, command, definition);
      const descriptor = targetFor(definition, command.payload);
      const commandIdValue = commandId(command, actor);
      const commandFingerprint = fingerprint(command);
      const trustedCommand = Object.freeze({ ...command, actor }) as TrustedCommandEnvelope;

      try {
        return await db.runTransaction(async (transaction) => {
          const receiptRef = db.doc(`${COMMAND_RECEIPTS_COLLECTION}/${commandIdValue}`);
          const receiptSnapshot = await transaction.get(receiptRef);
          await revalidateAuthorization(
            transaction,
            db,
            actor,
            context,
            definition.permission,
          );
          const replay = persistedReceipt(receiptSnapshot, {
            commandId: commandIdValue,
            command: trustedCommand,
            actor,
            fingerprint: commandFingerprint,
          });
          if (replay) return replay;

          const target = descriptor
            ? snapshotFromDocument(
                await transaction.get(db.doc(`${descriptor.collection}/${descriptor.recordId}`)),
              )
            : null;
          const currentVersion = validateTarget(
            target,
            descriptor,
            actor,
            command.expectedVersion,
          );
          const transactionAdapter = new FirestoreCommandTransaction(db, transaction);
          const outcome = await definition.handle(
            handlerContext(
              trustedCommand,
              commandIdValue,
              actor,
              definition,
              target,
              currentVersion,
              now(),
              transactionAdapter,
            ),
          );
          if (!outcome || typeof outcome !== "object" || !("data" in outcome)) {
            throw new AccelPoCommandError(
              "unavailable-service",
              "The action returned an invalid result. Retry the request.",
            );
          }
          const data = outcome.data as JsonValue;
          try {
            stableCommandSerialization(data);
            if (resultSize(data) > MAX_RESULT_BYTES) {
              throw new Error("result-too-large");
            }
          } catch (error) {
            if (error instanceof AccelPoCommandError) throw error;
            throw new AccelPoCommandError(
              "unavailable-service",
              "The action returned an unsupported result. Retry the request.",
            );
          }
          const resultingVersion = resultVersion(outcome, currentVersion, descriptor);
          const receipt: PersistedCommandReceipt = Object.freeze({
            id: commandIdValue,
            commandName: command.commandName,
            organizationId: actor.organizationId,
            actorUserId: actor.userId,
            actorMembershipId: actor.membershipId,
            requestId: command.requestId,
            idempotencyKey: command.idempotencyKey ?? null,
            fingerprint: commandFingerprint,
            status: "committed" as const,
            result: data,
            resultingVersion,
          });
          transaction.create(receiptRef, {
            ...receipt,
            schemaVersion: COMMAND_RECEIPT_SCHEMA_VERSION,
            createdAt: FieldValue.serverTimestamp(),
          });
          return Object.freeze({
            commandPortVersion: ACCELPO_COMMAND_PORT_VERSION,
            commandId: commandIdValue,
            commandName: command.commandName,
            requestId: command.requestId,
            status: "committed" as const,
            replayed: false as const,
            resultingVersion,
            data,
          });
        });
      } catch (error) {
        if (error instanceof AccelPoCommandError) throw error;
        console.error(JSON.stringify({
          event: "accelpo.command.failed",
          commandName: command.commandName,
          organizationId: actor.organizationId,
          commandId: commandIdValue,
          error: error instanceof Error ? error.name : typeof error,
        }));
        throw new AccelPoCommandError(
          "unavailable-service",
          "The action could not be completed. Retry the request.",
        );
      }
    },
  });
}
