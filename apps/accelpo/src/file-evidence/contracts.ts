import type { CommandJsonObject } from "../command-port/contracts.ts";

export const CP07_FILE_EVIDENCE_VERSION = 1 as const;
export const FILE_EVIDENCE_MAX_BYTES = 25 * 1024 * 1024;

export const FILE_EVIDENCE_PURPOSES = Object.freeze([
  "quote",
  "receipt",
  "photo",
  "service-completion",
  "attachment",
] as const);

export type FileEvidencePurpose = (typeof FILE_EVIDENCE_PURPOSES)[number];
export type FileEvidenceStatus = "pending-upload" | "uploaded";
export type FileEvidenceReleaseStatus = "private" | "released";

export const FILE_EVIDENCE_CONTENT_TYPES = Object.freeze([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const);

export type FileEvidenceContentType = (typeof FILE_EVIDENCE_CONTENT_TYPES)[number];

export const FILE_EVIDENCE_COMMANDS = Object.freeze({
  initiateUpload: "file-evidence.initiate-upload",
  authorizeUpload: "file-evidence.authorize-upload",
  completeUpload: "file-evidence.complete-upload",
  release: "file-evidence.release",
  makePrivate: "file-evidence.make-private",
} as const);

export interface FileEvidenceDescriptor {
  readonly originalFilename: string;
  readonly contentType: FileEvidenceContentType;
  readonly size: number;
}

export interface FileEvidenceReference extends FileEvidenceDescriptor {
  readonly evidenceId: string;
  readonly organizationId: string;
  readonly purchaseCaseId: string;
  readonly purpose: FileEvidencePurpose;
  readonly status: FileEvidenceStatus;
  readonly releaseStatus: FileEvidenceReleaseStatus;
  readonly version: number;
}

export interface FileEvidenceUploadContext {
  readonly organizationId: string;
  readonly purchaseCaseId: string;
  readonly purpose: FileEvidencePurpose;
}

export interface InitiateFileEvidencePayload extends CommandJsonObject {
  readonly purchaseCaseId: string;
  readonly purpose: FileEvidencePurpose;
  readonly originalFilename: string;
  readonly contentType: FileEvidenceContentType;
  readonly size: number;
}

export interface CompleteFileEvidencePayload extends CommandJsonObject {
  readonly evidenceId: string;
}

export interface ReleaseFileEvidencePayload extends CommandJsonObject {
  readonly evidenceId: string;
}

export interface FileEvidenceCommandData extends CommandJsonObject {
  readonly evidenceId: string;
  readonly organizationId: string;
  readonly purchaseCaseId: string;
  readonly purpose: FileEvidencePurpose;
  readonly originalFilename: string;
  readonly contentType: FileEvidenceContentType;
  readonly size: number;
  readonly status: FileEvidenceStatus;
  readonly releaseStatus: FileEvidenceReleaseStatus;
  readonly version: number;
}

export class FileEvidenceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileEvidenceValidationError";
  }
}

function canonicalFilename(value: string): string {
  const normalized = value
    .trim()
    .normalize("NFKC")
    .replace(/[\\/\u0000-\u001f\u007f]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized || normalized.length > 180 || normalized === "." || normalized === "..") {
    throw new FileEvidenceValidationError("Choose a file with a valid filename.");
  }
  return normalized;
}

export function normalizeFileEvidencePurpose(value: string): FileEvidencePurpose {
  const normalized = value.trim().toLowerCase();
  if (!(FILE_EVIDENCE_PURPOSES as readonly string[]).includes(normalized)) {
    throw new FileEvidenceValidationError("Choose a supported evidence type.");
  }
  return normalized as FileEvidencePurpose;
}

export function validateFileEvidenceDescriptor(input: Readonly<{
  readonly originalFilename: string;
  readonly contentType: string;
  readonly size: number;
}>): FileEvidenceDescriptor {
  const contentType = input.contentType.trim().toLowerCase();
  if (!(FILE_EVIDENCE_CONTENT_TYPES as readonly string[]).includes(contentType)) {
    throw new FileEvidenceValidationError("That file type is not supported.");
  }
  if (!Number.isSafeInteger(input.size) || input.size <= 0) {
    throw new FileEvidenceValidationError("The file is empty or its size is invalid.");
  }
  if (input.size > FILE_EVIDENCE_MAX_BYTES) {
    throw new FileEvidenceValidationError("The file is larger than 25 MB.");
  }
  return Object.freeze({
    originalFilename: canonicalFilename(input.originalFilename),
    contentType: contentType as FileEvidenceContentType,
    size: input.size,
  });
}

export function fileEvidenceObjectPath(organizationId: string, evidenceId: string): string {
  const organization = organizationId.trim();
  const evidence = evidenceId.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/.test(organization)) {
    throw new FileEvidenceValidationError("Organization identity is invalid.");
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,150}$/.test(evidence)) {
    throw new FileEvidenceValidationError("Evidence identity is invalid.");
  }
  return `organizations/${organization}/private/accelpo-evidence/${evidence}/object`;
}
