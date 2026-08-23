import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createLinkedOrganizationIntroductionMedia,
  createPublicMediaProjection,
  createRfxAttachmentReference,
  createUploadedOrganizationIntroductionMedia,
  publishPublicMediaProjection,
  verifiedExternalVideo,
} from "../src/domain/media/model.ts";
import {
  attachRfxDocument,
  createLinkedIntroductionMedia,
  readPublishedPublicMedia,
} from "../src/application/media/governed-media-services.ts";
import {
  activateStoredAsset,
  createStoredAssetDraft,
  STORED_ASSET_POLICIES,
} from "../src/domain/storage/model.ts";
import { organizationId } from "../src/domain/organizations/model.ts";
import { userId } from "../src/domain/users/model.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const now = "2026-08-24T00:30:00.000Z";
const org1 = organizationId("org-media-1");
const org2 = organizationId("org-media-2");
const user1 = userId("user-media-1");

function activeAsset({
  id,
  organizationId: owner = org1,
  category,
  contentType,
  bytes,
}) {
  const draft = createStoredAssetDraft({
    id,
    organizationId: owner,
    category,
    originalFilename: `${id}.source`,
    contentType,
    sizeBytes: bytes.byteLength,
    createdByUserId: user1,
    now,
  });
  return activateStoredAsset(
    draft,
    {
      objectPath: draft.objectPath,
      contentType: draft.contentType,
      sizeBytes: draft.sizeBytes,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    },
    now,
  );
}

function memoryDependencies(assets) {
  const byAsset = new Map(assets.map((asset) => [asset.id, asset]));
  const projections = new Map();
  const introductions = new Map();
  const attachments = new Map();
  const bytesByPath = new Map();
  for (const asset of assets) {
    bytesByPath.set(asset.objectPath, new Uint8Array(asset.sizeBytes).fill(7));
  }
  return {
    assets: {
      async getById(id) {
        return byAsset.get(id) ?? null;
      },
      async listByOrganizationId(organizationIdValue) {
        return [...byAsset.values()].filter(
          (asset) => asset.organizationId === organizationIdValue,
        );
      },
      async create(asset) {
        byAsset.set(asset.id, asset);
      },
      async save(asset) {
        byAsset.set(asset.id, asset);
      },
    },
    objects: {
      async put() {
        throw new Error("Public media tests never upload through the delivery boundary.");
      },
      async get(objectPath) {
        const bytes = bytesByPath.get(objectPath);
        if (!bytes) throw new Error("Missing fixture object.");
        const asset = [...byAsset.values()].find(
          (candidate) => candidate.objectPath === objectPath,
        );
        return { contentType: asset.contentType, bytes };
      },
      async delete() {},
    },
    publicMedia: {
      async getById(id) {
        return projections.get(id) ?? null;
      },
      async listByOrganizationId(organizationIdValue) {
        return [...projections.values()].filter(
          (projection) => projection.organizationId === organizationIdValue,
        );
      },
      async create(projection) {
        projections.set(projection.id, projection);
      },
      async save(projection) {
        projections.set(projection.id, projection);
      },
    },
    introductions: {
      async getById(id) {
        return introductions.get(id) ?? null;
      },
      async getPublishedByOrganizationId(organizationIdValue) {
        return [...introductions.values()].find(
          (media) =>
            media.organizationId === organizationIdValue
            && media.status === "published",
        ) ?? null;
      },
      async create(media) {
        introductions.set(media.id, media);
      },
      async save(media) {
        introductions.set(media.id, media);
      },
    },
    attachments: {
      async getById(id) {
        return attachments.get(id) ?? null;
      },
      async listByRfxId(organizationIdValue, rfxId) {
        return [...attachments.values()].filter(
          (attachment) =>
            attachment.organizationId === organizationIdValue
            && attachment.rfxId === rfxId,
        );
      },
      async create(attachment) {
        attachments.set(attachment.id, attachment);
      },
      async save(attachment) {
        attachments.set(attachment.id, attachment);
      },
    },
    externalVideos: {
      async resolve({ provider, videoId }) {
        return verifiedExternalVideo({
          provider,
          videoId,
          durationSeconds: 25,
          resolver: "fixture-provider-api",
          verifiedAt: now,
        });
      },
    },
    projections,
    introductions,
    attachments,
    bytesByPath,
  };
}

test("Storage foundation has a distinct uploaded intro-video policy", () => {
  const policy = STORED_ASSET_POLICIES["organization-intro-video"];
  assert.ok(policy);
  assert.equal(policy.organizationPermission, "organization.profile.manage");
  assert.deepEqual(policy.permittedContentTypes, ["video/mp4", "video/webm"]);
  assert.ok(policy.maximumBytes > 0);
});

test("linked Organization introductions are provider-allowlisted and no longer than 30 seconds", () => {
  const youtube = verifiedExternalVideo({
    provider: "youtube",
    videoId: "AbCdEf12345",
    durationSeconds: 30,
    resolver: "youtube-data-api",
    verifiedAt: now,
  });
  assert.equal(youtube.canonicalUrl, "https://www.youtube.com/watch?v=AbCdEf12345");
  assert.equal(youtube.embedUrl, "https://www.youtube-nocookie.com/embed/AbCdEf12345");
  assert.throws(
    () =>
      verifiedExternalVideo({
        provider: "arbitrary-stream",
        videoId: "unsafe-video",
        durationSeconds: 10,
        resolver: "untrusted",
        verifiedAt: now,
      }),
    /not allowlisted/,
  );
  assert.throws(
    () =>
      verifiedExternalVideo({
        provider: "youtube",
        videoId: "AbCdEf12345",
        durationSeconds: 30.001,
        resolver: "youtube-data-api",
        verifiedAt: now,
      }),
    /no more than 30 seconds/,
  );
});

test("public projection snapshots only eligible private source integrity", () => {
  const bytes = new TextEncoder().encode("logo-source");
  const logo = activeAsset({
    id: "asset-logo-1",
    category: "organization-logo",
    contentType: "image/png",
    bytes,
  });
  const projection = createPublicMediaProjection({
    id: "public-logo-1",
    organizationId: org1,
    kind: "organization-logo",
    asset: logo,
    altText: "Example Organization logo",
    createdByUserId: user1,
    now,
  });
  assert.equal(projection.status, "draft");
  assert.equal("objectPath" in projection, false);
  assert.equal(JSON.stringify(projection).includes("organizations/"), false);

  const rfxDocument = activeAsset({
    id: "asset-rfx-private-1",
    category: "rfx-document",
    contentType: "application/pdf",
    bytes,
  });
  assert.throws(
    () =>
      createPublicMediaProjection({
        id: "public-invalid-rfx",
        organizationId: org1,
        kind: "organization-poster",
        asset: rfxDocument,
        altText: "Must remain private",
        createdByUserId: user1,
        now,
      }),
    /not eligible/,
  );
});

test("published media delivery rechecks metadata and private object bytes", async () => {
  const bytes = new Uint8Array([7, 7, 7, 7]);
  const logo = activeAsset({
    id: "asset-logo-delivery",
    category: "organization-logo",
    contentType: "image/png",
    bytes,
  });
  const dependencies = memoryDependencies([logo]);
  dependencies.bytesByPath.set(logo.objectPath, bytes);
  const draft = createPublicMediaProjection({
    id: "public-logo-delivery",
    organizationId: org1,
    kind: "organization-logo",
    asset: logo,
    altText: "Delivery logo",
    createdByUserId: user1,
    now,
  });
  const published = publishPublicMediaProjection(draft, {
    asset: logo,
    reviewedByUserId: user1,
    rationale: "Source, ownership, and presentation reviewed.",
    now,
  });
  dependencies.projections.set(published.id, published);
  const delivered = await readPublishedPublicMedia(published.id, dependencies);
  assert.deepEqual(delivered.bytes, bytes);
  assert.equal(delivered.contentType, "image/png");
  assert.match(delivered.etag, /^"sha256-/);

  dependencies.bytesByPath.set(logo.objectPath, new Uint8Array([1, 2, 3, 4]));
  await assert.rejects(
    readPublishedPublicMedia(published.id, dependencies),
    /integrity verification/,
  );
});

test("uploaded Organization introduction video uses a distinct 15-second limit", () => {
  const bytes = new Uint8Array([9, 8, 7]);
  const videoAsset = activeAsset({
    id: "asset-intro-video-1",
    category: "organization-intro-video",
    contentType: "video/mp4",
    bytes,
  });
  const media = createUploadedOrganizationIntroductionMedia({
    id: "intro-uploaded-1",
    organizationId: org1,
    asset: videoAsset,
    durationSeconds: 15,
    verifier: "media-duration-probe",
    verifiedAt: now,
    createdByUserId: user1,
    now,
  });
  assert.equal(media.source.kind, "uploaded-video");
  assert.throws(
    () =>
      createUploadedOrganizationIntroductionMedia({
        id: "intro-uploaded-too-long",
        organizationId: org1,
        asset: videoAsset,
        durationSeconds: 15.001,
        verifier: "media-duration-probe",
        verifiedAt: now,
        createdByUserId: user1,
        now,
      }),
    /no more than 15 seconds/,
  );
});

test("linked introduction service re-verifies provider output and organization permission", async () => {
  const dependencies = memoryDependencies([]);
  const actor = {
    organizationId: org1,
    userId: user1,
    permissions: ["organization.profile.manage"],
  };
  const media = await createLinkedIntroductionMedia(
    {
      actor,
      id: "intro-linked-1",
      provider: "vimeo",
      videoId: "123456789",
      now,
    },
    dependencies,
  );
  assert.equal(media.source.kind, "linked-video");
  assert.equal(media.source.video.provider, "vimeo");

  await assert.rejects(
    createLinkedIntroductionMedia(
      {
        actor: { ...actor, organizationId: org2 },
        id: "intro-linked-cross-org",
        provider: "vimeo",
        videoId: "123456789",
        now,
      },
      {
        ...dependencies,
        externalVideos: {
          async resolve() {
            return verifiedExternalVideo({
              provider: "vimeo",
              videoId: "123456789",
              durationSeconds: 31,
              resolver: "fixture-provider-api",
              verifiedAt: now,
            });
          },
        },
      },
    ),
    /no more than 30 seconds/,
  );
});

test("RFx attachment is a private same-Organization rfx-document reference", async () => {
  const bytes = new Uint8Array([2, 4, 6]);
  const document = activeAsset({
    id: "asset-rfx-attachment-1",
    category: "rfx-document",
    contentType: "application/pdf",
    bytes,
  });
  const dependencies = memoryDependencies([document]);
  const attachment = await attachRfxDocument(
    {
      actor: {
        organizationId: org1,
        userId: user1,
        permissions: ["document.manage"],
      },
      id: "rfx-attachment-1",
      rfxId: "rfx-opportunity-1",
      assetId: document.id,
      displayName: "Technical requirements",
      purpose: "issuer-document",
      audience: "organization-private",
      now,
    },
    dependencies,
  );
  assert.equal(attachment.status, "attached");
  assert.equal(attachment.audience, "organization-private");
  assert.equal("publicUrl" in attachment, false);
  assert.equal("objectPath" in attachment, false);

  const logo = activeAsset({
    id: "asset-not-rfx-document",
    category: "organization-logo",
    contentType: "image/png",
    bytes,
  });
  assert.throws(
    () =>
      createRfxAttachmentReference({
        id: "invalid-rfx-attachment",
        organizationId: org1,
        rfxId: "rfx-opportunity-1",
        asset: logo,
        displayName: "Wrong category",
        purpose: "response-support",
        audience: "team-private",
        createdByUserId: user1,
        now,
      }),
    /requires an active rfx-document asset/,
  );
});

test("public media implementation exposes no signed URL, download token, or arbitrary iframe", () => {
  const domain = read("src/domain/media/model.ts");
  const service = read("src/application/media/governed-media-services.ts");
  assert.doesNotMatch(
    `${domain}\n${service}`,
    /getSignedUrl|signedUrl|downloadToken|firebaseStorageDownloadTokens|allow\s+read|arbitrary iframe/i,
  );
  assert.match(domain, /youtube-nocookie\.com/);
  assert.match(domain, /player\.vimeo\.com/);
  assert.match(service, /sha256/);
});
