import type { FileEvidencePort, QueryProjectionPort } from "../chassis/ports.ts";
import type { AccelPOCommandRequest, AccelPOCommandResult, CommandJsonObject } from "../command-port/contracts.ts";
import type { EvidenceMetadataProjection, QueryProjectionInput, QueryProjectionResult } from "../query-projection/contracts.ts";
import {
  FILE_EVIDENCE_COMMANDS,
  fileEvidenceUploadAuthority,
  normalizeFileEvidencePurpose,
  selectFileEvidenceUploadAuthority,
  validateFileEvidenceDescriptor,
  type FileEvidenceCommandData,
  type FileEvidenceReference,
  type FileEvidenceUploadContext,
} from "./contracts.ts";

export interface FileEvidenceCommandPort {
  execute(command: AccelPOCommandRequest): Promise<AccelPOCommandResult>;
}

export interface AccelPOFileEvidenceClientOptions {
  readonly commandPort: FileEvidenceCommandPort;
  readonly queryProjection: QueryProjectionPort<QueryProjectionInput, QueryProjectionResult>;
  readonly fetcher?: typeof fetch;
  readonly idFactory?: () => string;
  readonly contentEndpoint?: (evidenceId: string) => string;
  /** Firebase ID token is used when AccelPO is hosted on its separate PWA origin. */
  readonly getIdToken?: () => Promise<string | null>;
}

function defaultIdFactory(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `request-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function commandData(result: AccelPOCommandResult): FileEvidenceCommandData {
  const data = result.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("The file action returned an invalid result.");
  }
  return data as unknown as FileEvidenceCommandData;
}

function reference(data: FileEvidenceCommandData): FileEvidenceReference {
  return Object.freeze({
    evidenceId: data.evidenceId,
    organizationId: data.organizationId,
    purchaseCaseId: data.purchaseCaseId,
    purpose: data.purpose,
    uploadAuthority: data.uploadAuthority,
    originalFilename: data.originalFilename,
    contentType: data.contentType,
    size: data.size,
    status: data.status,
    releaseStatus: data.releaseStatus,
    version: data.version,
  });
}

function command(
  commandName: string,
  organizationId: string,
  payload: CommandJsonObject,
  requestId: string,
  idempotencyKey: string,
  expectedVersion?: number,
): AccelPOCommandRequest {
  return Object.freeze({
    commandName,
    organizationContext: Object.freeze({ organizationId }),
    payload,
    requestId,
    idempotencyKey,
    ...(expectedVersion === undefined ? {} : { expectedVersion }),
  });
}

export class AccelPOFileEvidenceClient
  implements FileEvidencePort<FileEvidenceUploadContext, FileEvidenceReference> {
  private readonly commandPort: FileEvidenceCommandPort;
  private readonly queryProjection: QueryProjectionPort<QueryProjectionInput, QueryProjectionResult>;
  private readonly fetcher: typeof fetch;
  private readonly idFactory: () => string;
  private readonly contentEndpoint: (evidenceId: string) => string;
  private readonly getIdToken: (() => Promise<string | null>) | null;

  constructor(options: AccelPOFileEvidenceClientOptions) {
    this.commandPort = options.commandPort;
    this.queryProjection = options.queryProjection;
    this.fetcher = options.fetcher ?? fetch;
    this.idFactory = options.idFactory ?? defaultIdFactory;
    this.contentEndpoint = options.contentEndpoint ?? ((evidenceId) => `/api/accelpo/evidence/${encodeURIComponent(evidenceId)}/content`);
    this.getIdToken = options.getIdToken ?? null;
  }

  async upload(context: FileEvidenceUploadContext, file: File): Promise<FileEvidenceReference> {
    const purpose = normalizeFileEvidencePurpose(context.purpose);
    const descriptor = validateFileEvidenceDescriptor({
      originalFilename: file.name,
      contentType: file.type,
      size: file.size,
    });
    const authority = selectFileEvidenceUploadAuthority(context.capabilities);
    const operationId = this.idFactory();
    const initiated = commandData(await this.commandPort.execute(command(
      authority.initiateCommand,
      context.organizationId,
      Object.freeze({
        purchaseCaseId: context.purchaseCaseId,
        purpose,
        originalFilename: descriptor.originalFilename,
        contentType: descriptor.contentType,
        size: descriptor.size,
      }),
      `file-init-${operationId}`,
      `file-init-${operationId}`,
    )));
    const initiatedAuthority = fileEvidenceUploadAuthority(initiated.uploadAuthority);
    if (!initiatedAuthority) throw new Error("The file action returned an invalid upload authority.");

    const form = new FormData();
    form.set("organizationId", context.organizationId);
    form.set("file", file);
    const token = this.getIdToken ? await this.getIdToken() : null;
    const upload = await this.fetcher(this.contentEndpoint(initiated.evidenceId), {
      method: "POST",
      body: form,
      credentials: "include",
      headers: {
        "x-accelpo-upload-id": operationId,
        "x-accelpo-upload-authority": initiatedAuthority.key,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!upload.ok) {
      throw new Error(upload.status === 413
        ? "The file is larger than the current upload limit."
        : upload.status === 415
          ? "That file type is not supported."
          : "The file could not be uploaded. Retry the request.");
    }

    const completed = commandData(await this.commandPort.execute(command(
      initiatedAuthority.completeCommand,
      context.organizationId,
      Object.freeze({ evidenceId: initiated.evidenceId }),
      `file-complete-${operationId}`,
      `file-complete-${operationId}`,
      initiated.version,
    )));
    return reference(completed);
  }

  async metadata(organizationId: string, evidenceId: string): Promise<EvidenceMetadataProjection | null> {
    if (!organizationId.trim()) throw new Error("Organization identity is required.");
    const result = await this.queryProjection.read(Object.freeze({
      projection: "evidence-metadata",
      scope: "record",
      recordId: evidenceId,
    }));
    if (result.outcome === "failure") throw new Error(result.message);
    const item = result.items[0];
    return item && "releaseStatus" in item ? item as EvidenceMetadataProjection : null;
  }

  async download(organizationId: string, evidenceId: string): Promise<Blob> {
    const token = this.getIdToken ? await this.getIdToken() : null;
    const response = await this.fetcher(`${this.contentEndpoint(evidenceId)}?organizationId=${encodeURIComponent(organizationId)}`, {
      method: "GET",
      credentials: "include",
      headers: {
        accept: "application/octet-stream",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error("The file is unavailable or you no longer have access to it.");
    return response.blob();
  }

  async release(organizationId: string, evidenceId: string, expectedVersion: number): Promise<FileEvidenceReference> {
    return this.changeRelease(FILE_EVIDENCE_COMMANDS.release, organizationId, evidenceId, expectedVersion);
  }

  async makePrivate(organizationId: string, evidenceId: string, expectedVersion: number): Promise<FileEvidenceReference> {
    return this.changeRelease(FILE_EVIDENCE_COMMANDS.makePrivate, organizationId, evidenceId, expectedVersion);
  }

  private async changeRelease(
    commandName: typeof FILE_EVIDENCE_COMMANDS.release | typeof FILE_EVIDENCE_COMMANDS.makePrivate,
    organizationId: string,
    evidenceId: string,
    expectedVersion: number,
  ): Promise<FileEvidenceReference> {
    const operationId = this.idFactory();
    const result = commandData(await this.commandPort.execute(command(
      commandName,
      organizationId,
      Object.freeze({ evidenceId }),
      `file-release-${operationId}`,
      `file-release-${operationId}`,
      expectedVersion,
    )));
    return reference(result);
  }
}

export function releasedEvidenceReference(
  metadata: EvidenceMetadataProjection,
): Readonly<{
  readonly evidenceId: string;
  readonly originalFilename: string;
  readonly contentType: string;
  readonly size: number | null;
}> | null {
  if (metadata.status !== "uploaded" || metadata.releaseStatus !== "released") return null;
  return Object.freeze({
    evidenceId: metadata.id,
    originalFilename: metadata.originalFilename,
    contentType: metadata.contentType,
    size: metadata.size,
  });
}
