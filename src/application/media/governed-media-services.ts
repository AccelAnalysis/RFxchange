import { createHash } from "node:crypto";

import { createOrganizationActionAuditEvent } from "../../domain/audit/model.ts";
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
  type OrganizationIntroductionMediaId,
  type PublicMediaProjection,
  type PublicMediaProjectionId,
  type RfxAttachmentAudience,
  type RfxAttachmentPurpose,
  type RfxAttachmentReference,
  type RfxAttachmentReferenceId,
} from "../../domain/media/model.ts";
import {
  governedMediaAuditId,
  governedMediaCommandId,
  governedMediaEventId,
  type GovernedMediaMutationAction,
  type GovernedMediaMutationBundle,
} from "../../domain/media/mutation.ts";
import type {
  ExternalOrganizationVideoResolver,
  GovernedMediaMutationUnitOfWork,
  OrganizationIntroductionMediaRepository,
  PublicMediaProjectionRepository,
  RfxAttachmentReferenceRepository,
} from "../../domain/media/repository.ts";
import { rfxId } from "../../domain/rfx/model.ts";
import type { RfxRepository } from "../../domain/rfx/repository.ts";
import type { StoredAssetRepository } from "../../domain/storage/repository.ts";
import { storedAssetId } from "../../domain/storage/model.ts";
import type { OrganizationMembershipId } from "../../domain/users/model.ts";
import {
  authorizeOrganizationOperation,
  type OrganizationOperationAuthorizationDecision,
  type OrganizationOperationAuthorizationDependencies,
} from "../auth/authorize-organization-operation.ts";
import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import type { PrivateObjectStore } from "../storage/store-organization-asset.ts";

export interface OrganizationMediaActor {
  readonly context: AuthenticatedServerContext;
  readonly organizationId: OrganizationId;
  readonly membershipId: OrganizationMembershipId;
}

export interface GovernedMediaDependencies {
  readonly authorization: OrganizationOperationAuthorizationDependencies;
  readonly assets: StoredAssetRepository;
  readonly objects: PrivateObjectStore;
  readonly publicMedia: PublicMediaProjectionRepository;
  readonly introductions: OrganizationIntroductionMediaRepository;
  readonly attachments: RfxAttachmentReferenceRepository;
  readonly mutations: GovernedMediaMutationUnitOfWork;
  readonly externalVideos: ExternalOrganizationVideoResolver;
  readonly rfx: Pick<RfxRepository, "getById">;
}

type AllowedMediaDecision = Extract<
  OrganizationOperationAuthorizationDecision,
  Readonly<{ allowed: true }>
>;

async function authorizeMediaOperation(
  actor: OrganizationMediaActor,
  organizationId: OrganizationId,
  permission: OrganizationPermission,
  dependencies: GovernedMediaDependencies,
): Promise<AllowedMediaDecision> {
  if (actor.organizationId !== organizationId) {
    throw new Error("Media operation cannot cross Organization boundaries.");
  }
  const decision = await authorizeOrganizationOperation(
    {
      context: actor.context,
      organizationId,
      membershipId: actor.membershipId,
      permission,
    },
    dependencies.authorization,
  );
  if (!decision.allowed) {
    throw new Error(`Media operation is not currently authorized: ${decision.reason}.`);
  }
  return decision;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function evidence(
  decision: AllowedMediaDecision,
  action: GovernedMediaMutationAction,
  targetId: string,
  requestFingerprint: string,
  now: string,
): Pick<GovernedMediaMutationBundle, "command" | "event" | "audit"> {
  const commandId = governedMediaCommandId(action, targetId);
  return Object.freeze({
    command: Object.freeze({
      id: commandId,
      organizationId: decision.organization.id,
      action,
      targetId,
      requestFingerprint,
      actorUserId: decision.context.user.id,
      actorMembershipId: decision.membership.id,
      recordedAt: now,
    }),
    event: Object.freeze({
      id: governedMediaEventId(commandId),
      organizationId: decision.organization.id,
      action,
      targetId,
      commandId,
      actorUserId: decision.context.user.id,
      actorMembershipId: decision.membership.id,
      occurredAt: now,
    }),
    audit: createOrganizationActionAuditEvent(
      decision.context.user,
      decision.membership,
      decision.organization,
      {
        id: governedMediaAuditId(commandId),
        action: `media.${action}`,
        occurredAt: now,
      },
    ),
  });
}

async function isExactReplay(
  dependencies: GovernedMediaDependencies,
  decision: AllowedMediaDecision,
  action: GovernedMediaMutationAction,
  targetId: string,
  requestFingerprint: string,
): Promise<boolean> {
  const command = await dependencies.mutations.getCommand(
    governedMediaCommandId(action, targetId),
  );
  if (!command) return false;
  if (
    command.organizationId !== decision.organization.id
    || command.action !== action
    || command.targetId !== targetId
    || command.requestFingerprint !== requestFingerprint
    || command.actorUserId !== decision.context.user.id
    || command.actorMembershipId !== decision.membership.id
  ) {
    throw new Error("Governed media command identity was reused with different input or authority.");
  }
  return true;
}

async function commitMutation<T>(
  dependencies: GovernedMediaDependencies,
  bundle: GovernedMediaMutationBundle,
  reload: () => Promise<T | null>,
  created: T,
): Promise<T> {
  const outcome = await dependencies.mutations.commit(bundle);
  if (outcome === "created") return created;
  const authoritative = await reload();
  if (!authoritative) {
    throw new Error("Governed media replay evidence exists without its authoritative record.");
  }
  return authoritative;
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
  const decision = await authorizeMediaOperation(
    input.actor,
    input.actor.organizationId,
    "organization.profile.manage",
    dependencies,
  );
  const requestFingerprint = fingerprint({
    kind: input.kind,
    assetId: input.assetId,
    altText: input.altText,
  });
  if (await isExactReplay(
    dependencies,
    decision,
    "create-public-media-draft",
    input.id,
    requestFingerprint,
  )) {
    const prior = await dependencies.publicMedia.getById(input.id as PublicMediaProjectionId);
    if (!prior) throw new Error("Public media replay record was not found.");
    return prior;
  }
  const asset = await dependencies.assets.getById(storedAssetId(input.assetId));
  if (!asset) throw new Error("Public media source asset was not found.");
  const projection = createPublicMediaProjection({
    id: input.id,
    organizationId: decision.organization.id,
    kind: input.kind,
    asset,
    altText: input.altText,
    createdByUserId: decision.context.user.id,
    now: input.now,
  });
  const proof = evidence(
    decision,
    "create-public-media-draft",
    projection.id,
    requestFingerprint,
    input.now,
  );
  return commitMutation(
    dependencies,
    { record: { kind: "public-media", mode: "create", value: projection }, ...proof },
    () => dependencies.publicMedia.getById(projection.id),
    projection,
  );
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
  const decision = await authorizeMediaOperation(
    input.actor,
    input.actor.organizationId,
    "organization.profile.manage",
    dependencies,
  );
  const requestFingerprint = fingerprint({
    projectionId: input.projectionId,
    rationale: input.rationale,
  });
  if (await isExactReplay(
    dependencies,
    decision,
    "publish-public-media",
    input.projectionId,
    requestFingerprint,
  )) {
    const prior = await dependencies.publicMedia.getById(input.projectionId);
    if (!prior) throw new Error("Public media replay record was not found.");
    return prior;
  }
  const projection = await dependencies.publicMedia.getById(input.projectionId);
  if (!projection || projection.organizationId !== decision.organization.id) {
    throw new Error("Public media projection was not found in the authorized Organization.");
  }
  const asset = await dependencies.assets.getById(projection.sourceAssetId);
  if (!asset) throw new Error("Public media source asset was not found.");
  const published = publishPublicMediaProjection(projection, {
    asset,
    reviewedByUserId: decision.context.user.id,
    rationale: input.rationale,
    now: input.now,
  });
  const proof = evidence(
    decision,
    "publish-public-media",
    published.id,
    requestFingerprint,
    input.now,
  );
  return commitMutation(
    dependencies,
    { record: { kind: "public-media", mode: "save", value: published }, ...proof },
    () => dependencies.publicMedia.getById(published.id),
    published,
  );
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
  const decision = await authorizeMediaOperation(
    input.actor,
    input.actor.organizationId,
    "organization.profile.manage",
    dependencies,
  );
  const requestFingerprint = fingerprint({
    provider: input.provider,
    videoId: input.videoId,
    posterProjectionId: input.posterProjectionId ?? null,
  });
  if (await isExactReplay(
    dependencies,
    decision,
    "create-introduction-media",
    input.id,
    requestFingerprint,
  )) {
    const prior = await dependencies.introductions.getById(
      input.id as OrganizationIntroductionMediaId,
    );
    if (!prior) throw new Error("Introduction media replay record was not found.");
    return prior;
  }
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
    organizationId: decision.organization.id,
    video,
    posterProjectionId: input.posterProjectionId,
    createdByUserId: decision.context.user.id,
    now: input.now,
  });
  const proof = evidence(
    decision,
    "create-introduction-media",
    media.id,
    requestFingerprint,
    input.now,
  );
  return commitMutation(
    dependencies,
    { record: { kind: "introduction", mode: "create", value: media }, ...proof },
    () => dependencies.introductions.getById(media.id),
    media,
  );
}

export async function publishIntroductionMedia(
  input: Readonly<{
    readonly actor: OrganizationMediaActor;
    readonly media: OrganizationIntroductionMedia;
    readonly now: string;
  }>,
  dependencies: GovernedMediaDependencies,
): Promise<OrganizationIntroductionMedia> {
  const decision = await authorizeMediaOperation(
    input.actor,
    input.actor.organizationId,
    "organization.profile.manage",
    dependencies,
  );
  const requestFingerprint = fingerprint({ mediaId: input.media.id });
  if (await isExactReplay(
    dependencies,
    decision,
    "publish-introduction-media",
    input.media.id,
    requestFingerprint,
  )) {
    const prior = await dependencies.introductions.getById(input.media.id);
    if (!prior) throw new Error("Introduction publication replay record was not found.");
    return prior;
  }
  const current = await dependencies.introductions.getById(input.media.id);
  if (!current || current.organizationId !== decision.organization.id) {
    throw new Error("Organization introduction media was not found in the authorized Organization.");
  }
  if (current.posterProjectionId) {
    const poster = await dependencies.publicMedia.getById(current.posterProjectionId);
    if (
      !poster
      || poster.status !== "published"
      || poster.organizationId !== current.organizationId
      || poster.kind !== "organization-poster"
    ) {
      throw new Error("Organization introduction poster must be a published same-Organization poster projection.");
    }
  }
  if (current.source.kind === "uploaded-video") {
    const asset = await dependencies.assets.getById(current.source.assetId);
    if (
      !asset
      || asset.status !== "active"
      || asset.organizationId !== current.organizationId
      || asset.category !== "organization-intro-video"
      || asset.sha256 !== current.source.assetSha256
    ) {
      throw new Error("Uploaded Organization introduction source is no longer valid.");
    }
  }
  const published = publishOrganizationIntroductionMedia(current, input.now);
  const proof = evidence(
    decision,
    "publish-introduction-media",
    published.id,
    requestFingerprint,
    input.now,
  );
  return commitMutation(
    dependencies,
    { record: { kind: "introduction", mode: "save", value: published }, ...proof },
    () => dependencies.introductions.getById(published.id),
    published,
  );
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
  const decision = await authorizeMediaOperation(
    input.actor,
    input.actor.organizationId,
    "document.manage",
    dependencies,
  );
  const requestFingerprint = fingerprint({
    rfxId: input.rfxId,
    assetId: input.assetId,
    displayName: input.displayName,
    purpose: input.purpose,
    audience: input.audience,
  });
  if (await isExactReplay(
    dependencies,
    decision,
    "attach-rfx-document",
    input.id,
    requestFingerprint,
  )) {
    const prior = await dependencies.attachments.getById(input.id as RfxAttachmentReferenceId);
    if (!prior) throw new Error("RFx attachment replay record was not found.");
    return prior;
  }
  const targetRfx = await dependencies.rfx.getById(rfxId(input.rfxId));
  if (!targetRfx || targetRfx.issuerOrganizationId !== decision.organization.id) {
    throw new Error("RFx attachment target was not found in the authorized issuer Organization.");
  }
  if (input.purpose !== "issuer-document") {
    throw new Error("Current RFx attachment authority supports issuer documents only.");
  }
  const asset = await dependencies.assets.getById(storedAssetId(input.assetId));
  if (!asset) throw new Error("RFx attachment asset was not found.");
  const attachment = createRfxAttachmentReference({
    id: input.id,
    organizationId: decision.organization.id,
    rfxId: targetRfx.id,
    asset,
    displayName: input.displayName,
    purpose: input.purpose,
    audience: input.audience,
    createdByUserId: decision.context.user.id,
    now: input.now,
  });
  const proof = evidence(
    decision,
    "attach-rfx-document",
    attachment.id,
    requestFingerprint,
    input.now,
  );
  return commitMutation(
    dependencies,
    { record: { kind: "rfx-attachment", mode: "create", value: attachment }, ...proof },
    () => dependencies.attachments.getById(attachment.id),
    attachment,
  );
}

export async function removeRfxAttachment(
  input: Readonly<{
    readonly actor: OrganizationMediaActor;
    readonly attachment: RfxAttachmentReference;
    readonly now: string;
  }>,
  dependencies: GovernedMediaDependencies,
): Promise<RfxAttachmentReference> {
  const decision = await authorizeMediaOperation(
    input.actor,
    input.actor.organizationId,
    "document.manage",
    dependencies,
  );
  const requestFingerprint = fingerprint({ attachmentId: input.attachment.id });
  if (await isExactReplay(
    dependencies,
    decision,
    "remove-rfx-attachment",
    input.attachment.id,
    requestFingerprint,
  )) {
    const prior = await dependencies.attachments.getById(input.attachment.id);
    if (!prior) throw new Error("RFx attachment removal replay record was not found.");
    return prior;
  }
  const current = await dependencies.attachments.getById(input.attachment.id);
  if (!current || current.organizationId !== decision.organization.id) {
    throw new Error("RFx attachment was not found in the authorized Organization.");
  }
  const targetRfx = await dependencies.rfx.getById(rfxId(current.rfxId));
  if (!targetRfx || targetRfx.issuerOrganizationId !== decision.organization.id) {
    throw new Error("RFx attachment target is no longer controlled by the authorized issuer Organization.");
  }
  const removed = removeRfxAttachmentReference(current, input.now);
  const proof = evidence(
    decision,
    "remove-rfx-attachment",
    removed.id,
    requestFingerprint,
    input.now,
  );
  return commitMutation(
    dependencies,
    { record: { kind: "rfx-attachment", mode: "save", value: removed }, ...proof },
    () => dependencies.attachments.getById(removed.id),
    removed,
  );
}
