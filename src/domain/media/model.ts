import type { OrganizationId } from "../organizations/model.ts";
import type {
  StoredAsset,
  StoredAssetId,
} from "../storage/model.ts";
import type { UserId } from "../users/model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type PublicMediaProjectionId = Brand<string, "PublicMediaProjectionId">;
export type OrganizationIntroductionMediaId = Brand<
  string,
  "OrganizationIntroductionMediaId"
>;
export type RfxAttachmentReferenceId = Brand<string, "RfxAttachmentReferenceId">;

export const PUBLIC_MEDIA_KINDS = [
  "organization-logo",
  "organization-poster",
  "organization-intro-video",
] as const;
export type PublicMediaKind = (typeof PUBLIC_MEDIA_KINDS)[number];

export const EXTERNAL_VIDEO_PROVIDERS = ["youtube", "vimeo"] as const;
export type ExternalVideoProvider = (typeof EXTERNAL_VIDEO_PROVIDERS)[number];

export const RFX_ATTACHMENT_PURPOSES = [
  "issuer-document",
  "response-support",
  "submission-package",
  "collaboration-file",
] as const;
export type RfxAttachmentPurpose = (typeof RFX_ATTACHMENT_PURPOSES)[number];

export const RFX_ATTACHMENT_AUDIENCES = [
  "organization-private",
  "team-private",
  "issuer-on-submission",
] as const;
export type RfxAttachmentAudience = (typeof RFX_ATTACHMENT_AUDIENCES)[number];

export interface VerifiedExternalVideo {
  readonly provider: ExternalVideoProvider;
  readonly videoId: string;
  readonly canonicalUrl: string;
  readonly embedUrl: string;
  readonly durationSeconds: number;
  readonly resolver: string;
  readonly verifiedAt: string;
}

export interface PublicMediaProjection {
  readonly id: PublicMediaProjectionId;
  readonly organizationId: OrganizationId;
  readonly kind: PublicMediaKind;
  readonly sourceAssetId: StoredAssetId;
  readonly sourceAssetSha256: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly status: "draft" | "published" | "withdrawn";
  readonly altText: string;
  readonly reviewedByUserId: UserId | null;
  readonly reviewRationale: string | null;
  readonly createdByUserId: UserId;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly publishedAt: string | null;
  readonly withdrawnAt: string | null;
}

export type OrganizationIntroductionMediaSource =
  | Readonly<{
      readonly kind: "linked-video";
      readonly video: VerifiedExternalVideo;
    }>
  | Readonly<{
      readonly kind: "uploaded-video";
      readonly assetId: StoredAssetId;
      readonly assetSha256: string;
      readonly contentType: "video/mp4" | "video/webm";
      readonly durationSeconds: number;
      readonly verifiedAt: string;
      readonly verifier: string;
    }>;

export interface OrganizationIntroductionMedia {
  readonly id: OrganizationIntroductionMediaId;
  readonly organizationId: OrganizationId;
  readonly source: OrganizationIntroductionMediaSource;
  readonly posterProjectionId: PublicMediaProjectionId | null;
  readonly status: "draft" | "published" | "withdrawn";
  readonly createdByUserId: UserId;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly publishedAt: string | null;
  readonly withdrawnAt: string | null;
}

export interface RfxAttachmentReference {
  readonly id: RfxAttachmentReferenceId;
  readonly organizationId: OrganizationId;
  readonly rfxId: string;
  readonly assetId: StoredAssetId;
  readonly assetSha256: string;
  readonly displayName: string;
  readonly purpose: RfxAttachmentPurpose;
  readonly audience: RfxAttachmentAudience;
  readonly status: "attached" | "removed";
  readonly revision: number;
  readonly createdByUserId: UserId;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly removedAt: string | null;
}

function required(value: string, label: string, maximum = 500): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized || normalized.length > maximum) {
    throw new Error(`${label} must contain 1-${maximum} characters.`);
  }
  return normalized;
}

function machineId<T extends string>(value: string, label: string): T {
  const normalized = required(value, label, 160);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(normalized)) {
    throw new Error(`${label} must be a stable machine-readable identifier.`);
  }
  return normalized as T;
}

function timestamp(value: string, label: string): string {
  const parsed = Date.parse(required(value, label, 80));
  if (Number.isNaN(parsed)) throw new Error(`${label} must be ISO-compatible.`);
  return new Date(parsed).toISOString();
}

function sha256(value: string): string {
  const normalized = required(value, "Media source SHA-256", 64).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new Error("Media source SHA-256 must contain 64 lowercase hexadecimal characters.");
  }
  return normalized;
}

function duration(value: number, maximum: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0 || value > maximum) {
    throw new Error(`${label} must be greater than 0 and no more than ${maximum} seconds.`);
  }
  return Math.round(value * 1000) / 1000;
}

function publicAssetKind(asset: StoredAsset): PublicMediaKind | null {
  if (asset.category === "organization-logo") return "organization-logo";
  if (asset.category === "organization-media") return "organization-poster";
  if (asset.category === "organization-intro-video") return "organization-intro-video";
  return null;
}

function assertActiveAsset(
  asset: StoredAsset,
  organizationId: OrganizationId,
): asserts asset is StoredAsset & Readonly<{ status: "active"; sha256: string }> {
  if (asset.organizationId !== organizationId) {
    throw new Error("Media source asset belongs to a different Organization.");
  }
  if (asset.status !== "active" || !asset.sha256) {
    throw new Error("Media source asset must be active with verified object integrity.");
  }
}

export function verifiedExternalVideo(input: Readonly<{
  readonly provider: string;
  readonly videoId: string;
  readonly durationSeconds: number;
  readonly resolver: string;
  readonly verifiedAt: string;
}>): VerifiedExternalVideo {
  if (!(EXTERNAL_VIDEO_PROVIDERS as readonly string[]).includes(input.provider)) {
    throw new Error("Organization introduction video provider is not allowlisted.");
  }
  const provider = input.provider as ExternalVideoProvider;
  const videoId = required(input.videoId, "External video id", 100);
  if (
    provider === "youtube"
      ? !/^[A-Za-z0-9_-]{6,20}$/.test(videoId)
      : !/^\d{5,20}$/.test(videoId)
  ) {
    throw new Error("External video id does not match the selected provider.");
  }
  return Object.freeze({
    provider,
    videoId,
    canonicalUrl: provider === "youtube"
      ? `https://www.youtube.com/watch?v=${videoId}`
      : `https://vimeo.com/${videoId}`,
    embedUrl: provider === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : `https://player.vimeo.com/video/${videoId}`,
    durationSeconds: duration(
      input.durationSeconds,
      30,
      "Linked Organization introduction video duration",
    ),
    resolver: required(input.resolver, "External video resolver", 200),
    verifiedAt: timestamp(input.verifiedAt, "External video verification timestamp"),
  });
}

export function createPublicMediaProjection(input: Readonly<{
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly kind: PublicMediaKind;
  readonly asset: StoredAsset;
  readonly altText: string;
  readonly createdByUserId: UserId;
  readonly now: string;
}>): PublicMediaProjection {
  assertActiveAsset(input.asset, input.organizationId);
  const inferredKind = publicAssetKind(input.asset);
  if (!inferredKind || inferredKind !== input.kind) {
    throw new Error("Stored asset category is not eligible for the requested public media kind.");
  }
  if (
    input.kind === "organization-intro-video"
    && !["video/mp4", "video/webm"].includes(input.asset.contentType)
  ) {
    throw new Error("Uploaded public introduction video must use an approved video content type.");
  }
  const now = timestamp(input.now, "Public media projection timestamp");
  return Object.freeze({
    id: machineId<PublicMediaProjectionId>(input.id, "Public media projection id"),
    organizationId: input.organizationId,
    kind: input.kind,
    sourceAssetId: input.asset.id,
    sourceAssetSha256: sha256(input.asset.sha256),
    contentType: input.asset.contentType,
    sizeBytes: input.asset.sizeBytes,
    status: "draft",
    altText: required(input.altText, "Public media alternative text", 500),
    reviewedByUserId: null,
    reviewRationale: null,
    createdByUserId: input.createdByUserId,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    withdrawnAt: null,
  });
}

export function publishPublicMediaProjection(
  projection: PublicMediaProjection,
  input: Readonly<{
    readonly asset: StoredAsset;
    readonly reviewedByUserId: UserId;
    readonly rationale: string;
    readonly now: string;
  }>,
): PublicMediaProjection {
  if (projection.status !== "draft") {
    throw new Error("Only a draft public media projection can be published.");
  }
  assertActiveAsset(input.asset, projection.organizationId);
  if (
    input.asset.id !== projection.sourceAssetId
    || input.asset.sha256 !== projection.sourceAssetSha256
    || input.asset.contentType !== projection.contentType
    || input.asset.sizeBytes !== projection.sizeBytes
  ) {
    throw new Error("Public media source asset changed after projection review began.");
  }
  const now = timestamp(input.now, "Public media publication timestamp");
  return Object.freeze({
    ...projection,
    status: "published",
    reviewedByUserId: input.reviewedByUserId,
    reviewRationale: required(input.rationale, "Public media review rationale", 1_000),
    updatedAt: now,
    publishedAt: now,
  });
}

export function withdrawPublicMediaProjection(
  projection: PublicMediaProjection,
  nowValue: string,
): PublicMediaProjection {
  if (projection.status === "withdrawn") return projection;
  const now = timestamp(nowValue, "Public media withdrawal timestamp");
  return Object.freeze({
    ...projection,
    status: "withdrawn",
    updatedAt: now,
    withdrawnAt: now,
  });
}

export function createLinkedOrganizationIntroductionMedia(input: Readonly<{
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly video: VerifiedExternalVideo;
  readonly posterProjectionId?: PublicMediaProjectionId | null;
  readonly createdByUserId: UserId;
  readonly now: string;
}>): OrganizationIntroductionMedia {
  const now = timestamp(input.now, "Organization introduction media timestamp");
  return Object.freeze({
    id: machineId<OrganizationIntroductionMediaId>(
      input.id,
      "Organization introduction media id",
    ),
    organizationId: input.organizationId,
    source: Object.freeze({ kind: "linked-video", video: input.video }),
    posterProjectionId: input.posterProjectionId ?? null,
    status: "draft",
    createdByUserId: input.createdByUserId,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    withdrawnAt: null,
  });
}

export function createUploadedOrganizationIntroductionMedia(input: Readonly<{
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly asset: StoredAsset;
  readonly durationSeconds: number;
  readonly verifier: string;
  readonly verifiedAt: string;
  readonly posterProjectionId?: PublicMediaProjectionId | null;
  readonly createdByUserId: UserId;
  readonly now: string;
}>): OrganizationIntroductionMedia {
  assertActiveAsset(input.asset, input.organizationId);
  if (
    input.asset.category !== "organization-intro-video"
    || !["video/mp4", "video/webm"].includes(input.asset.contentType)
  ) {
    throw new Error("Uploaded Organization introduction media requires an approved intro-video asset.");
  }
  const now = timestamp(input.now, "Organization introduction media timestamp");
  return Object.freeze({
    id: machineId<OrganizationIntroductionMediaId>(
      input.id,
      "Organization introduction media id",
    ),
    organizationId: input.organizationId,
    source: Object.freeze({
      kind: "uploaded-video",
      assetId: input.asset.id,
      assetSha256: sha256(input.asset.sha256),
      contentType: input.asset.contentType as "video/mp4" | "video/webm",
      durationSeconds: duration(
        input.durationSeconds,
        15,
        "Uploaded Organization introduction video duration",
      ),
      verifiedAt: timestamp(input.verifiedAt, "Uploaded video verification timestamp"),
      verifier: required(input.verifier, "Uploaded video verifier", 200),
    }),
    posterProjectionId: input.posterProjectionId ?? null,
    status: "draft",
    createdByUserId: input.createdByUserId,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    withdrawnAt: null,
  });
}

export function publishOrganizationIntroductionMedia(
  media: OrganizationIntroductionMedia,
  nowValue: string,
): OrganizationIntroductionMedia {
  if (media.status !== "draft") {
    throw new Error("Only draft Organization introduction media can be published.");
  }
  const now = timestamp(nowValue, "Organization introduction publication timestamp");
  return Object.freeze({
    ...media,
    status: "published",
    updatedAt: now,
    publishedAt: now,
  });
}

export function withdrawOrganizationIntroductionMedia(
  media: OrganizationIntroductionMedia,
  nowValue: string,
): OrganizationIntroductionMedia {
  if (media.status === "withdrawn") return media;
  const now = timestamp(nowValue, "Organization introduction withdrawal timestamp");
  return Object.freeze({
    ...media,
    status: "withdrawn",
    updatedAt: now,
    withdrawnAt: now,
  });
}

export function createRfxAttachmentReference(input: Readonly<{
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly rfxId: string;
  readonly asset: StoredAsset;
  readonly displayName: string;
  readonly purpose: RfxAttachmentPurpose;
  readonly audience: RfxAttachmentAudience;
  readonly createdByUserId: UserId;
  readonly now: string;
}>): RfxAttachmentReference {
  assertActiveAsset(input.asset, input.organizationId);
  if (input.asset.category !== "rfx-document") {
    throw new Error("RFx attachment reference requires an active rfx-document asset.");
  }
  if (!(RFX_ATTACHMENT_PURPOSES as readonly string[]).includes(input.purpose)) {
    throw new Error("RFx attachment purpose is not governed.");
  }
  if (!(RFX_ATTACHMENT_AUDIENCES as readonly string[]).includes(input.audience)) {
    throw new Error("RFx attachment audience is not governed.");
  }
  const now = timestamp(input.now, "RFx attachment timestamp");
  return Object.freeze({
    id: machineId<RfxAttachmentReferenceId>(input.id, "RFx attachment reference id"),
    organizationId: input.organizationId,
    rfxId: machineId<string>(input.rfxId, "RFx id"),
    assetId: input.asset.id,
    assetSha256: sha256(input.asset.sha256),
    displayName: required(input.displayName, "RFx attachment display name", 240),
    purpose: input.purpose,
    audience: input.audience,
    status: "attached",
    revision: 1,
    createdByUserId: input.createdByUserId,
    createdAt: now,
    updatedAt: now,
    removedAt: null,
  });
}

export function removeRfxAttachmentReference(
  attachment: RfxAttachmentReference,
  nowValue: string,
): RfxAttachmentReference {
  if (attachment.status === "removed") return attachment;
  const now = timestamp(nowValue, "RFx attachment removal timestamp");
  return Object.freeze({
    ...attachment,
    status: "removed",
    revision: attachment.revision + 1,
    updatedAt: now,
    removedAt: now,
  });
}
