import {
  STORED_ASSET_POLICIES,
  type StoredAssetCategory,
} from "../../domain/storage/model.ts";

const MEBIBYTE = 1024 * 1024;
const MULTIPART_ENVELOPE_ALLOWANCE_BYTES = MEBIBYTE;
const PROFILE_ASSET_CATEGORIES = [
  "organization-logo",
  "organization-media",
  "organization-document",
] as const satisfies readonly StoredAssetCategory[];

const MAX_PROFILE_ASSET_BYTES = Math.max(
  ...PROFILE_ASSET_CATEGORIES.map((category) => STORED_ASSET_POLICIES[category].maximumBytes),
);

/**
 * The multipart stream is bounded before it is handed to `formData()`. The allowance covers form
 * fields and multipart framing; the selected file is then checked against its exact category limit
 * before `File.arrayBuffer()` allocates another in-memory copy.
 */
export const MAX_PROFILE_ASSET_MULTIPART_BYTES =
  MAX_PROFILE_ASSET_BYTES + MULTIPART_ENVELOPE_ALLOWANCE_BYTES;

export type OrganizationAssetUploadBoundaryErrorCode =
  | "invalid-content-length"
  | "request-body-required"
  | "request-too-large"
  | "content-length-mismatch"
  | "unsupported-kind"
  | "empty-file"
  | "file-too-large"
  | "unsupported-content-type"
  | "content-type-mismatch";

export type OrganizationAssetUploadBoundaryStatus = 400 | 413 | 415;

export class OrganizationAssetUploadBoundaryError extends Error {
  readonly code: OrganizationAssetUploadBoundaryErrorCode;
  readonly status: OrganizationAssetUploadBoundaryStatus;

  constructor(
    code: OrganizationAssetUploadBoundaryErrorCode,
    status: OrganizationAssetUploadBoundaryStatus,
    message: string,
  ) {
    super(message);
    this.name = "OrganizationAssetUploadBoundaryError";
    this.code = code;
    this.status = status;
  }
}

function declaredContentLength(value: string | null): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new OrganizationAssetUploadBoundaryError(
      "invalid-content-length",
      400,
      "Profile asset upload Content-Length is invalid.",
    );
  }
  return parsed;
}

/**
 * Reads an HTTP request body incrementally and stops as soon as the multipart envelope crosses the
 * approved upper bound. A missing Content-Length remains safe because the stream itself is counted.
 */
export async function readBoundedProfileAssetMultipartBody(
  body: ReadableStream<Uint8Array> | null,
  declaredLengthHeader: string | null,
): Promise<Uint8Array> {
  const declaredLength = declaredContentLength(declaredLengthHeader);
  if (declaredLength !== null && declaredLength > MAX_PROFILE_ASSET_MULTIPART_BYTES) {
    throw new OrganizationAssetUploadBoundaryError(
      "request-too-large",
      413,
      `Profile asset upload exceeds the ${MAX_PROFILE_ASSET_MULTIPART_BYTES}-byte request limit.`,
    );
  }
  if (!body) {
    throw new OrganizationAssetUploadBoundaryError(
      "request-body-required",
      400,
      "Profile asset upload body is required.",
    );
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      if (!result.value?.byteLength) continue;
      total += result.value.byteLength;
      if (total > MAX_PROFILE_ASSET_MULTIPART_BYTES) {
        await reader.cancel("Profile asset multipart limit exceeded.").catch(() => undefined);
        throw new OrganizationAssetUploadBoundaryError(
          "request-too-large",
          413,
          `Profile asset upload exceeds the ${MAX_PROFILE_ASSET_MULTIPART_BYTES}-byte request limit.`,
        );
      }
      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }

  if (declaredLength !== null && declaredLength !== total) {
    throw new OrganizationAssetUploadBoundaryError(
      "content-length-mismatch",
      400,
      "Profile asset upload length does not match the declared Content-Length.",
    );
  }

  const bounded = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bounded.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bounded;
}

export function profileAssetCategory(kind: string): StoredAssetCategory {
  if (kind === "logo") return "organization-logo";
  if (kind === "image" || kind === "portfolio") return "organization-media";
  if (kind === "document") return "organization-document";
  throw new OrganizationAssetUploadBoundaryError(
    "unsupported-kind",
    400,
    "Unsupported organization profile asset kind.",
  );
}

export function validateProfileAssetFileMetadata(input: Readonly<{
  kind: string;
  sizeBytes: number;
  contentType: string;
}>): Readonly<{
  category: StoredAssetCategory;
  contentType: string;
  maximumBytes: number;
}> {
  const category = profileAssetCategory(input.kind);
  const policy = STORED_ASSET_POLICIES[category];
  const contentType = input.contentType.trim().toLowerCase();

  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes <= 0) {
    throw new OrganizationAssetUploadBoundaryError(
      "empty-file",
      400,
      "Profile asset file must contain data.",
    );
  }
  if (input.sizeBytes > policy.maximumBytes) {
    throw new OrganizationAssetUploadBoundaryError(
      "file-too-large",
      413,
      `Profile asset exceeds the ${policy.maximumBytes}-byte ${category} limit.`,
    );
  }
  if (!policy.permittedContentTypes.includes(contentType)) {
    throw new OrganizationAssetUploadBoundaryError(
      "unsupported-content-type",
      415,
      `Content type ${contentType || "unknown"} is not permitted for ${category}.`,
    );
  }

  return Object.freeze({
    category,
    contentType,
    maximumBytes: policy.maximumBytes,
  });
}

function startsWith(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  if (bytes.byteLength < offset + signature.length) return false;
  return signature.every((value, index) => bytes[offset + index] === value);
}

function containsAscii(bytes: Uint8Array, text: string, searchLimit = bytes.byteLength): boolean {
  const signature = [...text].map((character) => character.charCodeAt(0));
  const maximumStart = Math.min(bytes.byteLength, searchLimit) - signature.length;
  for (let start = 0; start <= maximumStart; start += 1) {
    if (startsWith(bytes, signature, start)) return true;
  }
  return false;
}

function signatureMatches(contentType: string, bytes: Uint8Array): boolean {
  switch (contentType) {
    case "image/jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp":
      return startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8);
    case "application/pdf":
      return containsAscii(bytes, "%PDF-", Math.min(bytes.byteLength, 1024));
    case "application/msword":
      return startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) &&
        containsAscii(bytes, "[Content_Types].xml") &&
        containsAscii(bytes, "word/");
    default:
      return false;
  }
}

/**
 * Browser-provided MIME metadata is not sufficient to establish file type. This verifies the
 * bounded bytes against the canonical signature for every profile-asset content type currently
 * permitted by the storage policy. It is a type-confusion boundary, not a malware scanner.
 */
export function assertProfileAssetFileSignature(
  contentType: string,
  bytes: Uint8Array,
): void {
  if (!signatureMatches(contentType.trim().toLowerCase(), bytes)) {
    throw new OrganizationAssetUploadBoundaryError(
      "content-type-mismatch",
      415,
      "Profile asset bytes do not match the declared content type.",
    );
  }
}
