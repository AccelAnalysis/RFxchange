import { createHash } from "node:crypto";

import type { OrganizationPermission } from "../../domain/authorization/model.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import {
  createLinkedOrganizationIntroductionMedia,
  createPublicMediaProjection,
  createRfxAttachmentReference,
  publishOrganizationIntroductionMedia,
  publishPublicMediaProjection,
  removeRfxAttachmentReference,
  verifiedExternalVideo,
  type OrganizationIntroductionMedia,
  type PublicMediaProjection,
  type PublicMediaProjectionId,
  type RfxAttachmentAudience,
  type RfxAttachmentPurpose,
  type RfxAttachmentReference,
} from "../../domain/media/model.ts";
import type {
  ExternalOrganizationVideoResolver,
  OrganizationIntroductionMediaRepository,
  PublicMediaProjectionRepository,
  RfxAttachmentReferenceRepository,
} from "../../domain/media/repository.ts";
import type { StoredAssetRepository } from "../../domain/storage/repository.ts";
import { storedAssetId } from "../../domain/storage/model.ts";
import type { UserId } from "../../domain/users/model.ts";
import type { PrivateObjectStore } from "../storage/store-organization-asset.ts";

export interface OrganizationMediaActor {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly permissions: readonly OrganizationPermission[];
}

export interface GovernedMediaDependencies {
  readonly assets: StoredAssetRepository;
  readonly objects: PrivateObjectStore;
  readonly publicMedia: PublicMediaProjectionRepository;
  readonly introductions: OrganizationIntroductionMediaRepository;
  readonly attachments: RfxAttachmentReferenceRepository;
  readonly externalVideos: ExternalOrganizationVideoResolver;
}

function assertPermission(
  actor: OrganizationMediaActor,
  organizationId: OrganizationId,
  permission: OrganizationPermission,
): void {
  if (actor.organizationId !== organizationId) {
    throw new Error("Media operation cannot cross Organization boundaries.");
  }
  if (!actor.permissions.includes(permission)) {
    throw new Error(`Media operation requires ${permission}.`);
  }
}

export async function createPublicMediaDraft(
  input: Readonly<{
    readonly actor: OrganizationMediaActor;
    readonly id: string;
    readonly kind:
      | "organization-logo"
      | "organization-poster"
      | "organization-intro-video";
    readonly assetId: string;
    readonly altText: string;
    readonly now: string;
  }>,
  dependencies: GovernedMediaDependencies,
): Promise<PublicMediaProjection> {
  assertPermission(
    input.actor,
    input.actor.organizationId,
    "organization.profile.manage",
  );
  const asset = await dependencies.assets.getById(storedAssetId(input.assetId));
  if (!asset) throw new Error("Public media source asset was not found.");
  const projection = createPublicMediaProjection({
    id: input.id,
    organizationId: input.actor.organizationId,
    kind: input.kind,
    asset,
    altText: input.altText,
    createdByUserId: input.actor.userId,
    now: input.now,
  });
  await dependencies.publicMedia.create(projection);
  return projection;
}

export async function publishPublicMedia(
  input: Readonly<{
    readonly actor: OrganizationMediaActor;
    readonly projectionId: PublicMediaProjectionId;
    readonly rationale: string;
    readonly now: string;
  }>,
  dependencies: GovernedMediaDependencies,
): Promise<PublicMediaProjection> {
  const projection = await dependencies.publicMedia.getById(input.projectionId);
  if (!projection) throw new Error("Public media projection was not found.");
  assertPermission(
    input.actor,
    projection.organizationId,
    "organization.profile.manage",
  );
  const asset = await dependencies.assets.getById(projection.sourceAssetId);
  if (!asset) throw new Error("Public media source asset was not found.");
  const published = publishPublicMediaProjection(projection, {
    asset,
    reviewedByUserId: input.actor.userId,
    rationale: input.rationale,
    now: input.now,
  });
  await dependencies.publicMedia.save(published);
  return published;
}

export async function readPublishedPublicMedia(
  projectionId: PublicMediaProjectionId,
  dependencies: GovernedMediaDependencies,
): Promise<Readonly<{
  readonly projection: PublicMediaProjection;
  readonly bytes: Uint8Array;
  readonly contentType: string;
  readonly etag: string;
}>> {
  const projection = await dependencies.publicMedia.getById(projectionId);
  if (!projection || projection.status !== "published") {
    throw new Error("Public media projection is unavailable.");
  }
  const asset = await dependencies.assets.getById(projection.sourceAssetId);
  if (
    !asset
    || asset.status !== "active"
    || !asset.sha256
    || asset.organizationId !== projection.organizationId
    || asset.sha256 !== projection.sourceAssetSha256
    || asset.contentType !== projection.contentType
    || asset.sizeBytes !== projection.sizeBytes
  ) {
    throw new Error("Published media no longer matches its private source asset.");
  }
  const object = await dependencies.objects.get(asset.objectPath);
  const digest = createHash("sha256").update(object.bytes).digest("hex");
  if (
    object.contentType !== projection.contentType
    || object.bytes.byteLength !== projection.sizeBytes
    || digest !== projection.sourceAssetSha256
  ) {
    throw new Error("Published media delivery failed source-object integrity verification.");
  }
  return Object.freeze({
    projection,
    bytes: object.bytes,
    contentType: projection.contentType,
    etag: `"sha256-${projection.sourceAssetSha256}"`,
  });
}

export async function createLinkedIntroductionMedia(
  input: Readonly<{
    readonly actor: OrganizationMediaActor;
    readonly id: string;
    readonly provider: "youtube" | "vimeo";
    readonly videoId: string;
    readonly posterProjectionId?: PublicMediaProjectionId | null;
    readonly now: string;
  }>,
  dependencies: GovernedMediaDependencies,
): Promise<OrganizationIntroductionMedia> {
  assertPermission(
    input.actor,
    input.actor.organizationId,
    "organization.profile.manage",
  );
  const resolved = await dependencies.externalVideos.resolve({
    provider: input.provider,
    videoId: input.videoId,
  });
  const video = verifiedExternalVideo({
    provider: resolved.provider,
    videoId: resolved.videoId,
    durationSeconds: resolved.durationSeconds,
    resolver: resolved.resolver,
    verifiedAt: resolved.verifiedAt,
  });
  const media = createLinkedOrganizationIntroductionMedia({
    id: input.id,
    organizationId: input.actor.organizationId,
    video,
    posterProjectionId: input.posterProjectionId,
    createdByUserId: input.actor.userId,
    now: input.now,
  });
  await dependencies.introductions.create(media);
  return media;
}

export async function publishIntroductionMedia(
  input: Readonly<{
    readonly actor: OrganizationMediaActor;
    readonly media: OrganizationIntroductionMedia;
    readonly now: string;
  }>,
  dependencies: GovernedMediaDependencies,
): Promise<OrganizationIntroductionMedia> {
  assertPermission(
    input.actor,
    input.media.organizationId,
    "organization.profile.manage",
  );
  if (input.media.posterProjectionId) {
    const poster = await dependencies.publicMedia.getById(
      input.media.posterProjectionId,
    );
    if (
      !poster
      || poster.status !== "published"
      || poster.organizationId !== input.media.organizationId
      || poster.kind !== "organization-poster"
    ) {
      throw new Error("Organization introduction poster must be a published same-Organization poster projection.");
    }
  }
  if (input.media.source.kind === "uploaded-video") {
    const asset = await dependencies.assets.getById(input.media.source.assetId);
    if (
      !asset
      || asset.status !== "active"
      || asset.organizationId !== input.media.organizationId
      || asset.category !== "organization-intro-video"
      || asset.sha256 !== input.media.source.assetSha256
    ) {
      throw new Error("Uploaded Organization introduction source is no longer valid.");
    }
  }
  const published = publishOrganizationIntroductionMedia(
    input.media,
    input.now,
  );
  await dependencies.introductions.save(published);
  return published;
}

export async function attachRfxDocument(
  input: Readonly<{
    readonly actor: OrganizationMediaActor;
    readonly id: string;
    readonly rfxId: string;
    readonly assetId: string;
    readonly displayName: string;
    readonly purpose: RfxAttachmentPurpose;
    readonly audience: RfxAttachmentAudience;
    readonly now: string;
  }>,
  dependencies: GovernedMediaDependencies,
): Promise<RfxAttachmentReference> {
  assertPermission(input.actor, input.actor.organizationId, "document.manage");
  const asset = await dependencies.assets.getById(storedAssetId(input.assetId));
  if (!asset) throw new Error("RFx attachment asset was not found.");
  const attachment = createRfxAttachmentReference({
    id: input.id,
    organizationId: input.actor.organizationId,
    rfxId: input.rfxId,
    asset,
    displayName: input.displayName,
    purpose: input.purpose,
    audience: input.audience,
    createdByUserId: input.actor.userId,
    now: input.now,
  });
  await dependencies.attachments.create(attachment);
  return attachment;
}

export async function removeRfxAttachment(
  input: Readonly<{
    readonly actor: OrganizationMediaActor;
    readonly attachment: RfxAttachmentReference;
    readonly now: string;
  }>,
  dependencies: GovernedMediaDependencies,
): Promise<RfxAttachmentReference> {
  assertPermission(input.actor, input.attachment.organizationId, "document.manage");
  const removed = removeRfxAttachmentReference(input.attachment, input.now);
  await dependencies.attachments.save(removed);
  return removed;
}
