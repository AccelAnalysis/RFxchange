import type { AdminPermissionKey } from "../admin-authorization/model";
import type { OrganizationPermission } from "../authorization/model";
import type { OrganizationId } from "../organizations/model";
import type { UserId } from "../users/model";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type StoredAssetId = Brand<string, "StoredAssetId">;
export type StoredAssetTimestamp = Brand<string, "StoredAssetTimestamp">;

export const STORED_ASSET_CATEGORIES = [
  "organization-logo",
  "organization-media",
  "organization-intro-video",
  "organization-document",
  "authority-evidence",
  "verification-evidence",
  "rfx-document",
] as const;

export type StoredAssetCategory = (typeof STORED_ASSET_CATEGORIES)[number];
export type StoredAssetSensitivity = "standard" | "sensitive-evidence";
export type StoredAssetStatus = "pending-upload" | "active" | "deleted";
export type StoredAssetOperation = "create" | "read" | "delete";

export interface StoredAssetPolicy {
  readonly category: StoredAssetCategory;
  readonly sensitivity: StoredAssetSensitivity;
  readonly maximumBytes: number;
  readonly permittedContentTypes: readonly string[];
  readonly organizationPermission: OrganizationPermission;
}

const MEBIBYTE = 1024 * 1024;

export const STORED_ASSET_POLICIES: Readonly<Record<StoredAssetCategory, StoredAssetPolicy>> =
  Object.freeze({
    "organization-logo": Object.freeze({
      category: "organization-logo" as const,
      sensitivity: "standard" as const,
      maximumBytes: 5 * MEBIBYTE,
      permittedContentTypes: Object.freeze(["image/jpeg", "image/png", "image/webp"]),
      organizationPermission: "organization.profile.manage" as const,
    }),
    "organization-media": Object.freeze({
      category: "organization-media" as const,
      sensitivity: "standard" as const,
      maximumBytes: 15 * MEBIBYTE,
      permittedContentTypes: Object.freeze(["image/jpeg", "image/png", "image/webp"]),
      organizationPermission: "organization.profile.manage" as const,
    }),
    "organization-intro-video": Object.freeze({
      category: "organization-intro-video" as const,
      sensitivity: "standard" as const,
      maximumBytes: 25 * MEBIBYTE,
      permittedContentTypes: Object.freeze(["video/mp4", "video/webm"]),
      organizationPermission: "organization.profile.manage" as const,
    }),
    "organization-document": Object.freeze({
      category: "organization-document" as const,
      sensitivity: "standard" as const,
      maximumBytes: 25 * MEBIBYTE,
      permittedContentTypes: Object.freeze([
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]),
      organizationPermission: "document.manage" as const,
    }),
    "authority-evidence": Object.freeze({
      category: "authority-evidence" as const,
      sensitivity: "sensitive-evidence" as const,
      maximumBytes: 25 * MEBIBYTE,
      permittedContentTypes: Object.freeze(["application/pdf", "image/jpeg", "image/png"]),
      organizationPermission: "document.manage" as const,
    }),
    "verification-evidence": Object.freeze({
      category: "verification-evidence" as const,
      sensitivity: "sensitive-evidence" as const,
      maximumBytes: 25 * MEBIBYTE,
      permittedContentTypes: Object.freeze(["application/pdf", "image/jpeg", "image/png"]),
      organizationPermission: "credibility.manage" as const,
    }),
    "rfx-document": Object.freeze({
      category: "rfx-document" as const,
      sensitivity: "standard" as const,
      maximumBytes: 50 * MEBIBYTE,
      permittedContentTypes: Object.freeze([
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]),
      organizationPermission: "document.manage" as const,
    }),
  });

export interface StoredAsset {
  readonly id: StoredAssetId;
  readonly organizationId: OrganizationId;
  readonly category: StoredAssetCategory;
  readonly sensitivity: StoredAssetSensitivity;
  readonly visibility: "private";
  readonly status: StoredAssetStatus;
  readonly objectPath: string;
  readonly originalFilename: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly sha256: string | null;
  readonly createdByUserId: UserId;
  readonly retentionAssignmentId: string | null;
  readonly createdAt: StoredAssetTimestamp;
  readonly updatedAt: StoredAssetTimestamp;
  readonly uploadedAt: StoredAssetTimestamp | null;
  readonly deletedAt: StoredAssetTimestamp | null;
}

export interface StoredAssetObjectReceipt {
  readonly objectPath: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly sha256: string;
}

export type StoredAssetAccessActor =
  | Readonly<{
      readonly kind: "organization-member";
      readonly organizationId: OrganizationId;
      readonly permissions: readonly OrganizationPermission[];
    }>
  | Readonly<{
      readonly kind: "platform-administrator";
      readonly permissions: readonly AdminPermissionKey[];
    }>;

export interface StoredAssetAccessTarget {
  readonly organizationId: OrganizationId;
  readonly category: StoredAssetCategory;
}

export type StoredAssetAccessDecision =
  | Readonly<{ readonly allowed: true; readonly requiredPermission: string }>
  | Readonly<{
      readonly allowed: false;
      readonly reason: "wrong-organization" | "missing-permission";
      readonly requiredPermission: string;
    }>;

function requiredValue(value: string, field: string, maximumLength = 256): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  if (normalized.length > maximumLength) throw new Error(`${field} is too long.`);
  return normalized;
}

function timestamp(value: string, field: string): StoredAssetTimestamp {
  const normalized = requiredValue(value, field, 64);
  const parsed = Date.parse(normalized);
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid date-time.`);
  return new Date(parsed).toISOString() as StoredAssetTimestamp;
}

export function storedAssetId(value: string): StoredAssetId {
  const normalized = requiredValue(value, "Stored asset id", 128);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(normalized)) {
    throw new Error("Stored asset id must be a stable machine-readable identifier.");
  }
  return normalized as StoredAssetId;
}

export function storedAssetCategory(value: string): StoredAssetCategory {
  const normalized = requiredValue(value, "Stored asset category", 64);
  if (!(STORED_ASSET_CATEGORIES as readonly string[]).includes(normalized)) {
    throw new Error(`Unsupported stored asset category: ${normalized}.`);
  }
  return normalized as StoredAssetCategory;
}

function canonicalFilename(value: string): string {
  const normalized = requiredValue(value, "Original filename", 180)
    .normalize("NFKC")
    .replace(/[\\/\u0000-\u001f\u007f]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized === "." || normalized === "..") throw new Error("Original filename is invalid.");
  return normalized;
}

function extensionFor(contentType: string): string {
  const extensions: Readonly<Record<string, string>> = Object.freeze({
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  });
  const extension = extensions[contentType];
  if (!extension) throw new Error(`No canonical extension exists for ${contentType}.`);
  return extension;
}

function boundedSize(value: number, maximum: number): number {
  if (!Number.isInteger(value) || value <= 0) throw new Error("Stored asset size must be a positive integer.");
  if (value > maximum) throw new Error(`Stored asset exceeds the ${maximum}-byte category limit.`);
  return value;
}

function normalizedContentType(value: string, policy: StoredAssetPolicy): string {
  const normalized = requiredValue(value, "Stored asset content type", 160).toLowerCase();
  if (!policy.permittedContentTypes.includes(normalized)) {
    throw new Error(`Content type ${normalized} is not permitted for ${policy.category}.`);
  }
  return normalized;
}

export function createStoredAssetDraft(input: Readonly<{
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly category: string;
  readonly originalFilename: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly createdByUserId: UserId;
  readonly retentionAssignmentId?: string | null;
  readonly now: string;
}>): StoredAsset {
  const id = storedAssetId(input.id);
  const category = storedAssetCategory(input.category);
  const policy = STORED_ASSET_POLICIES[category];
  const contentType = normalizedContentType(input.contentType, policy);
  const now = timestamp(input.now, "Stored asset timestamp");
  const sizeBytes = boundedSize(input.sizeBytes, policy.maximumBytes);
  const objectPath = `organizations/${input.organizationId}/private/${category}/${id}/object.${extensionFor(contentType)}`;

  return Object.freeze({
    id,
    organizationId: input.organizationId,
    category,
    sensitivity: policy.sensitivity,
    visibility: "private" as const,
    status: "pending-upload" as const,
    objectPath,
    originalFilename: canonicalFilename(input.originalFilename),
    contentType,
    sizeBytes,
    sha256: null,
    createdByUserId: input.createdByUserId,
    retentionAssignmentId: input.retentionAssignmentId?.trim() || null,
    createdAt: now,
    updatedAt: now,
    uploadedAt: null,
    deletedAt: null,
  });
}

export function activateStoredAsset(
  draft: StoredAsset,
  receipt: StoredAssetObjectReceipt,
  nowValue: string,
): StoredAsset {
  if (draft.status !== "pending-upload") throw new Error("Only a pending stored asset can be activated.");
  if (receipt.objectPath !== draft.objectPath) throw new Error("Stored object path does not match metadata.");
  if (receipt.contentType !== draft.contentType) throw new Error("Stored object content type does not match metadata.");
  if (receipt.sizeBytes !== draft.sizeBytes) throw new Error("Stored object size does not match metadata.");
  const sha256 = requiredValue(receipt.sha256, "Stored object SHA-256", 64).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(sha256)) throw new Error("Stored object SHA-256 is invalid.");
  const now = timestamp(nowValue, "Stored asset activation timestamp");

  return Object.freeze({
    ...draft,
    status: "active" as const,
    sha256,
    updatedAt: now,
    uploadedAt: now,
  });
}

export function deleteStoredAssetMetadata(asset: StoredAsset, nowValue: string): StoredAsset {
  if (asset.status === "deleted") return asset;
  const now = timestamp(nowValue, "Stored asset deletion timestamp");
  return Object.freeze({ ...asset, status: "deleted" as const, updatedAt: now, deletedAt: now });
}

export function evaluateStoredAssetAccess(
  actor: StoredAssetAccessActor,
  target: StoredAssetAccessTarget,
  operation: StoredAssetOperation,
): StoredAssetAccessDecision {
  if (actor.kind === "organization-member") {
    const requiredPermission = STORED_ASSET_POLICIES[target.category].organizationPermission;
    if (actor.organizationId !== target.organizationId) {
      return Object.freeze({ allowed: false as const, reason: "wrong-organization" as const, requiredPermission });
    }
    if (!actor.permissions.includes(requiredPermission)) {
      return Object.freeze({ allowed: false as const, reason: "missing-permission" as const, requiredPermission });
    }
    return Object.freeze({ allowed: true as const, requiredPermission });
  }

  const requiredPermission = operation === "read" ? "organization.asset.read" : "organization.asset.manage";
  if (!actor.permissions.includes(requiredPermission as AdminPermissionKey)) {
    return Object.freeze({ allowed: false as const, reason: "missing-permission" as const, requiredPermission });
  }
  return Object.freeze({ allowed: true as const, requiredPermission });
}
