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

export const FILE_EVIDENCE_UPLOAD_AUTHORITIES = Object.freeze([
  Object.freeze({
    key: "requester",
    permission: "purchasing.request",
    initiateCommand: FILE_EVIDENCE_COMMANDS.initiateUpload,
    authorizeCommand: FILE_EVIDENCE_COMMANDS.authorizeUpload,
    completeCommand: FILE_EVIDENCE_COMMANDS.completeUpload,
    requesterOwned: true,
  }),
  Object.freeze({
    key: "order",
    permission: "purchasing.order",
    initiateCommand: "file-evidence.initiate-upload-order",
    authorizeCommand: "file-evidence.authorize-upload-order",
    completeCommand: "file-evidence.complete-upload-order",
    requesterOwned: false,
  }),
  Object.freeze({
    key: "documentation",
    permission: "purchasing.documentation.review",
    initiateCommand: "file-evidence.initiate-upload-documentation",
    authorizeCommand: "file-evidence.authorize-upload-documentation",
    completeCommand: "file-evidence.complete-upload-documentation",
    requesterOwned: false,
  }),
  Object.freeze({
    key: "finance",
    permission: "purchasing.budget.manage",
    initiateCommand: "file-evidence.initiate-upload-finance",
    authorizeCommand: "file-evidence.authorize-upload-finance",
    completeCommand: "file-evidence.complete-upload-finance",
    requesterOwned: false,
  }),
  Object.freeze({
    key: "configure",
    permission: "purchasing.configure",
    initiateCommand: "file-evidence.initiate-upload-configure",
    authorizeCommand: "file-evidence.authorize-upload-configure",
    completeCommand: "file-evidence.complete-upload-configure",
    requesterOwned: false,
  }),
] as const);

export type FileEvidenceUploadAuthority = (typeof FILE_EVIDENCE_UPLOAD_AUTHORITIES)[number];
export type FileEvidenceUploadAuthorityKey = FileEvidenceUploadAuthority["key"];

export function fileEvidenceUploadAuthority(value: string): FileEvidenceUploadAuthority | null {
  return FILE_EVIDENCE_UPLOAD_AUTHORITIES.find((authority) => authority.key === value) ?? null;
}

export function selectFileEvidenceUploadAuthority(
  capabilities: readonly string[] = [],
): FileEvidenceUploadAuthority {
  const priority: readonly FileEvidenceUploadAuthorityKey[] = Object.freeze([
    "documentation",
    "order",
    "finance",
    "configure",
    "requester",
  ]);
  for (const key of priority) {
    const authority = FILE_EVIDENCE_UPLOAD_AUTHORITIES.find((candidate) => candidate.key === key)!;
    if (capabilities.includes(authority.permission)) return authority;
  }
  return FILE_EVIDENCE_UPLOAD_AUTHORITIES[0];
}

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
  readonly uploadAuthority: FileEvidenceUploadAuthorityKey;
  readonly status: FileEvidenceStatus;
  readonly releaseStatus: FileEvidenceReleaseStatus;
  readonly version: number;
}

export interface FileEvidenceUploadContext {
  readonly organizationId: string;
  readonly purchaseCaseId: string;
  readonly purpose: FileEvidencePurpose;
  /** CP-01 capability facts choose the command variant only; CP-03 re-authorizes server-side. */
  readonly capabilities?: readonly string[];
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
  readonly uploadAuthority: FileEvidenceUploadAuthorityKey;
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
