import {
  AccelPoCommandError,
  type AnyCommandDefinition,
  type CommandHandlerContext,
  type JsonObject,
} from "../../../../src/application/accelpo/command-port.ts";
import {
  FILE_EVIDENCE_COMMANDS,
  FILE_EVIDENCE_UPLOAD_AUTHORITIES,
  fileEvidenceObjectPath,
  fileEvidenceUploadAuthority,
  normalizeFileEvidencePurpose,
  validateFileEvidenceDescriptor,
  type FileEvidenceCommandData,
  type FileEvidenceReleaseStatus,
  type FileEvidenceStatus,
  type FileEvidenceUploadAuthority,
} from "./contracts.ts";

export const ACCELPO_EVIDENCE_COLLECTION = "accelpoEvidence" as const;
export const ACCELPO_EVIDENCE_HISTORY_COLLECTION = "accelpoEvidenceHistory" as const;
export const ACCELPO_PURCHASE_CASE_COLLECTION = "accelpoPurchaseCases" as const;
export const ACCELPO_EVIDENCE_OBJECTS_COLLECTION = "accelpoEvidenceObjects" as const;

function requiredIdentifier(payload: JsonObject, field: string): string {
  const value = payload[field];
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/.test(value)) {
    throw new AccelPoCommandError("validation-failure", `${field} is invalid.`);
  }
  return value;
}

function requiredText(payload: JsonObject, field: string): string {
  const value = payload[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new AccelPoCommandError("validation-failure", `${field} is required.`);
  }
  return value;
}

function requiredSize(payload: JsonObject): number {
  const value = payload.size;
  if (typeof value !== "number") {
    throw new AccelPoCommandError("validation-failure", "File size is required.");
  }
  return value;
}

function evidenceData(context: CommandHandlerContext): Readonly<Record<string, unknown>> {
  if (!context.target?.exists || !context.target.data) {
    throw new AccelPoCommandError("not-found", "That file is unavailable.");
  }
  return context.target.data;
}

function storedUploadAuthority(data: Readonly<Record<string, unknown>>): FileEvidenceUploadAuthority {
  const explicit = typeof data.uploadAuthority === "string"
    ? fileEvidenceUploadAuthority(data.uploadAuthority)
    : null;
  // Requester is the compatibility authority for records created before closeout upload support.
  return explicit ?? FILE_EVIDENCE_UPLOAD_AUTHORITIES[0];
}

function evidenceCommandData(data: Readonly<Record<string, unknown>>): FileEvidenceCommandData {
  const evidenceId = typeof data.id === "string" ? data.id : "";
  const organizationId = typeof data.organizationId === "string" ? data.organizationId : "";
  const purchaseCaseId = typeof data.purchaseCaseId === "string" ? data.purchaseCaseId : "";
  const purpose = typeof data.purpose === "string" ? normalizeFileEvidencePurpose(data.purpose) : null;
  const uploadAuthority = storedUploadAuthority(data);
  const descriptor = validateFileEvidenceDescriptor({
    originalFilename: typeof data.originalFilename === "string" ? data.originalFilename : "",
    contentType: typeof data.contentType === "string" ? data.contentType : "",
    size: typeof data.size === "number" ? data.size : 0,
  });
  const status: FileEvidenceStatus = data.status === "uploaded" ? "uploaded" : "pending-upload";
  const releaseStatus: FileEvidenceReleaseStatus = data.releaseStatus === "released" ? "released" : "private";
  const version = typeof data.version === "number" && Number.isSafeInteger(data.version) && data.version >= 0
    ? data.version
    : 0;
  if (!evidenceId || !organizationId || !purchaseCaseId || !purpose) {
    throw new AccelPoCommandError("unavailable-service", "File metadata is incomplete. Retry the request.");
  }
  return Object.freeze({
    evidenceId,
    organizationId,
    purchaseCaseId,
    purpose,
    uploadAuthority: uploadAuthority.key,
    ...descriptor,
    status,
    releaseStatus,
    version,
  });
}

function historyPath(commandId: string): string {
  return `${ACCELPO_EVIDENCE_HISTORY_COLLECTION}/${commandId}`;
}

function recordHistory(
  context: CommandHandlerContext,
  evidenceId: string,
  eventType: "initiated" | "uploaded" | "released" | "made-private",
  version: number,
  uploadAuthority?: string,
): void {
  context.transaction.create(historyPath(context.commandId), {
    id: context.commandId,
    organizationId: context.actor.organizationId,
    evidenceId,
    eventType,
    actorUserId: context.actor.userId,
    actorMembershipId: context.actor.membershipId,
    ...(uploadAuthority ? { uploadAuthority } : {}),
    occurredAt: context.now,
    version,
  });
}

function assertAuthority(
  data: Readonly<Record<string, unknown>>,
  authority: FileEvidenceUploadAuthority,
): void {
  if (storedUploadAuthority(data).key !== authority.key) {
    throw new AccelPoCommandError("forbidden", "This file upload must be completed through its original closeout authority.");
  }
}

function initiateUploadDefinition(authority: FileEvidenceUploadAuthority): AnyCommandDefinition {
  return Object.freeze({
    name: authority.initiateCommand,
    permission: authority.permission,
    idempotency: "required" as const,
    target: (payload: JsonObject) => Object.freeze({
      collection: ACCELPO_PURCHASE_CASE_COLLECTION,
      recordId: requiredIdentifier(payload, "purchaseCaseId"),
      organizationField: "organizationId",
      ...(authority.requesterOwned
        ? { owner: Object.freeze({ field: "requesterUserId", kind: "user" as const }) }
        : {}),
    }),
    handle: async (context: CommandHandlerContext) => {
      const purchaseCaseId = requiredIdentifier(context.command.payload, "purchaseCaseId");
      let purpose;
      let descriptor;
      try {
        purpose = normalizeFileEvidencePurpose(requiredText(context.command.payload, "purpose"));
        descriptor = validateFileEvidenceDescriptor({
          originalFilename: requiredText(context.command.payload, "originalFilename"),
          contentType: requiredText(context.command.payload, "contentType"),
          size: requiredSize(context.command.payload),
        });
      } catch (error) {
        throw new AccelPoCommandError(
          "validation-failure",
          error instanceof Error ? error.message : "The file information is invalid.",
        );
      }

      const suffix = context.commandId.replace(/^accelpo_cmd_/, "");
      const evidenceId = `evidence_${suffix}`;
      const record = Object.freeze({
        id: evidenceId,
        organizationId: context.actor.organizationId,
        owningRecord: Object.freeze({ type: "purchase-case", id: purchaseCaseId }),
        purchaseCaseId,
        uploaderUserId: context.actor.userId,
        uploaderMembershipId: context.actor.membershipId,
        uploadAuthority: authority.key,
        uploadPermission: authority.permission,
        purpose,
        originalFilename: descriptor.originalFilename,
        contentType: descriptor.contentType,
        size: descriptor.size,
        status: "pending-upload" as const,
        releaseStatus: "private" as const,
        sha256: null,
        createdAt: context.now,
        updatedAt: context.now,
        uploadedAt: null,
        releasedAt: null,
        releasedByUserId: null,
        version: 0,
      });
      context.transaction.create(`${ACCELPO_EVIDENCE_COLLECTION}/${evidenceId}`, record);
      recordHistory(context, evidenceId, "initiated", 0, authority.key);
      return Object.freeze({ data: evidenceCommandData(record), resultingVersion: null });
    },
  });
}

function authorizeUploadDefinition(authority: FileEvidenceUploadAuthority): AnyCommandDefinition {
  return Object.freeze({
    name: authority.authorizeCommand,
    permission: authority.permission,
    idempotency: "optional" as const,
    target: (payload: JsonObject) => Object.freeze({
      collection: ACCELPO_EVIDENCE_COLLECTION,
      recordId: requiredIdentifier(payload, "evidenceId"),
      organizationField: "organizationId",
      owner: Object.freeze({ field: "uploaderUserId", kind: "user" as const }),
    }),
    handle: async (context: CommandHandlerContext) => {
      const data = evidenceData(context);
      assertAuthority(data, authority);
      if (data.status !== "pending-upload") {
        throw new AccelPoCommandError("validation-failure", "This file upload is already finalized.");
      }
      return Object.freeze({
        data: Object.freeze({
          authorized: true,
          evidenceId: requiredIdentifier(context.command.payload, "evidenceId"),
        }),
        resultingVersion: null,
      });
    },
  });
}

function completeUploadDefinition(authority: FileEvidenceUploadAuthority): AnyCommandDefinition {
  return Object.freeze({
    name: authority.completeCommand,
    permission: authority.permission,
    idempotency: "required" as const,
    requiresExpectedVersion: true,
    target: (payload: JsonObject) => Object.freeze({
      collection: ACCELPO_EVIDENCE_COLLECTION,
      recordId: requiredIdentifier(payload, "evidenceId"),
      organizationField: "organizationId",
      owner: Object.freeze({ field: "uploaderUserId", kind: "user" as const }),
      versionField: "version",
    }),
    handle: async (context: CommandHandlerContext) => {
      const data = evidenceData(context);
      assertAuthority(data, authority);
      if (data.status !== "pending-upload") {
        throw new AccelPoCommandError("validation-failure", "This file upload is already finalized.");
      }
      const evidenceId = requiredIdentifier(context.command.payload, "evidenceId");
      const receipt = await context.transaction.get(`${ACCELPO_EVIDENCE_OBJECTS_COLLECTION}/${evidenceId}`);
      const stored = receipt.data;
      const storedSha = typeof stored?.sha256 === "string" ? stored.sha256 : "";
      let expectedObjectPath = "";
      try {
        expectedObjectPath = fileEvidenceObjectPath(context.actor.organizationId, evidenceId);
      } catch {
        // The validation below returns one non-enumerating mismatch response.
      }
      if (
        !receipt.exists ||
        !stored ||
        stored.organizationId !== context.actor.organizationId ||
        stored.evidenceId !== evidenceId ||
        stored.objectPath !== expectedObjectPath ||
        stored.status !== "uploaded" ||
        stored.uploadedByUserId !== context.actor.userId ||
        stored.originalFilename !== data.originalFilename ||
        stored.contentType !== data.contentType ||
        stored.size !== data.size ||
        !/^[a-f0-9]{64}$/.test(storedSha)
      ) {
        throw new AccelPoCommandError("validation-failure", "The uploaded file does not match the initiated file.");
      }
      const nextVersion = (context.currentVersion ?? 0) + 1;
      const updated = Object.freeze({
        ...data,
        status: "uploaded" as const,
        sha256: storedSha,
        uploadedAt: context.now,
        updatedAt: context.now,
        version: nextVersion,
      });
      context.transaction.update(`${ACCELPO_EVIDENCE_COLLECTION}/${evidenceId}`, {
        status: updated.status,
        sha256: updated.sha256,
        uploadedAt: updated.uploadedAt,
        updatedAt: updated.updatedAt,
        version: nextVersion,
      });
      recordHistory(context, evidenceId, "uploaded", nextVersion, authority.key);
      return Object.freeze({ data: evidenceCommandData(updated), resultingVersion: nextVersion });
    },
  });
}

function releaseDefinition(
  commandName: typeof FILE_EVIDENCE_COMMANDS.release | typeof FILE_EVIDENCE_COMMANDS.makePrivate,
  releaseStatus: FileEvidenceReleaseStatus,
): AnyCommandDefinition {
  return Object.freeze({
    name: commandName,
    permission: "rfx.publish",
    idempotency: "required",
    requiresExpectedVersion: true,
    target: (payload: JsonObject) => Object.freeze({
      collection: ACCELPO_EVIDENCE_COLLECTION,
      recordId: requiredIdentifier(payload, "evidenceId"),
      organizationField: "organizationId",
      versionField: "version",
    }),
    handle: async (context: CommandHandlerContext) => {
      const data = evidenceData(context);
      if (data.status !== "uploaded") {
        throw new AccelPoCommandError("validation-failure", "Finish the file upload before changing supplier access.");
      }
      const currentRelease = data.releaseStatus === "released" ? "released" : "private";
      if (currentRelease === releaseStatus) {
        throw new AccelPoCommandError(
          "validation-failure",
          releaseStatus === "released" ? "This file is already released." : "This file is already private.",
        );
      }
      const evidenceId = requiredIdentifier(context.command.payload, "evidenceId");
      const nextVersion = (context.currentVersion ?? 0) + 1;
      const released = releaseStatus === "released";
      const updated = Object.freeze({
        ...data,
        releaseStatus,
        releasedAt: released ? context.now : null,
        releasedByUserId: released ? context.actor.userId : null,
        updatedAt: context.now,
        version: nextVersion,
      });
      context.transaction.update(`${ACCELPO_EVIDENCE_COLLECTION}/${evidenceId}`, {
        releaseStatus,
        releasedAt: updated.releasedAt,
        releasedByUserId: updated.releasedByUserId,
        updatedAt: updated.updatedAt,
        version: nextVersion,
      });
      recordHistory(context, evidenceId, released ? "released" : "made-private", nextVersion);
      return Object.freeze({ data: evidenceCommandData(updated), resultingVersion: nextVersion });
    },
  });
}

export const CP07_FILE_EVIDENCE_COMMAND_DEFINITIONS: readonly AnyCommandDefinition[] = Object.freeze([
  ...FILE_EVIDENCE_UPLOAD_AUTHORITIES.flatMap((authority) => [
    initiateUploadDefinition(authority),
    authorizeUploadDefinition(authority),
    completeUploadDefinition(authority),
  ]),
  releaseDefinition(FILE_EVIDENCE_COMMANDS.release, "released"),
  releaseDefinition(FILE_EVIDENCE_COMMANDS.makePrivate, "private"),
]);
