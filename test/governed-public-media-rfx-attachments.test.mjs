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
  publishIntroductionMedia,
  readPublishedPublicMedia,
  removeRfxAttachment,
} from "../src/application/media/governed-media-services.ts";
import {
  activateStoredAsset,
  createStoredAssetDraft,
  STORED_ASSET_POLICIES,
} from "../src/domain/storage/model.ts";
import {
  createOrganizationAccount,
  organizationId,
} from "../src/domain/organizations/model.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
  userId,
} from "../src/domain/users/model.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import { rfxId } from "../src/domain/rfx/model.ts";

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

function authorizationFixture() {
  const account = createOrganizationAccount({ id: org1, now });
  const user = createUserIdentity({
    id: user1,
    name: "Media Operator",
    primaryEmail: "media@example.test",
    loginProvider: "firebase",
    loginSubject: "firebase-media-1",
    now,
  });
  const membership = createOrganizationMembership(user, account, {
    id: "membership-media-1",
    now,
  });
  const state = {
    authorization: createOrganizationUserAuthorization(membership, account, {
      roleKey: "organization-admin",
      permissions: ["organization.profile.manage", "document.manage"],
      now,
    }),
    organizationRestriction: null,
    membershipRestriction: null,
  };
  const context = authenticatedServerContext({
    user,
    source: "session-cookie",
    claims: {
      provider: "firebase",
      subject: "firebase-media-1",
      email: "media@example.test",
      displayName: "Media Operator",
      emailVerified: true,
      isAnonymous: false,
      authenticatedAt: now,
      issuedAt: now,
      expiresAt: "2026-08-25T00:30:00.000Z",
    },
  });
  return {
    account,
    user,
    membership,
    state,
    context,
    dependencies: {
      accountSecurity: {
        async inspect() {
          return {
            provider: "firebase",
            subject: "firebase-media-1",
            email: "media@example.test",
            emailVerified: true,
            disabled: false,
            mfaEnrolled: false,
            tokensValidAfter: null,
            lastSignInAt: now,
          };
        },
      },
      organizations: {
        async getById(id) {
          return id === account.id ? account : null;
        },
      },
      memberships: {
        async getById(id) {
          return id === membership.id ? membership : null;
        },
      },
      authorizations: {
        async getByMembershipId(id) {
          return id === membership.id ? state.authorization : null;
        },
      },
      restrictions: {
        async getForOrganization() {
          return state.organizationRestriction;
        },
        async getForMembership() {
          return state.membershipRestriction;
        },
      },
    },
  };
}

function memoryDependencies(assets) {
  const auth = authorizationFixture();
  const byAsset = new Map(assets.map((asset) => [asset.id, asset]));
  const projections = new Map();
  const introductionRecords = new Map();
  const introductionSlots = new Map();
  const attachmentRecords = new Map();
  const bytesByPath = new Map();
  const commands = new Map();
  const events = new Map();
  const audits = new Map();
  const rfxRecords = new Map([
    [
      "rfx-opportunity-1",
      {
        id: rfxId("rfx-opportunity-1"),
        issuerOrganizationId: org1,
        lifecycleState: "draft",
      },
    ],
    [
      "rfx-other-org",
      {
        id: rfxId("rfx-other-org"),
        issuerOrganizationId: org2,
        lifecycleState: "published",
      },
    ],
  ]);
  for (const asset of assets) {
    bytesByPath.set(asset.objectPath, new Uint8Array(asset.sizeBytes).fill(7));
  }

  const publicMedia = {
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
  };
  const introductions = {
    async getById(id) {
      return introductionRecords.get(id) ?? null;
    },
    async getPublishedByOrganizationId(organizationIdValue) {
      const mediaId = introductionSlots.get(organizationIdValue);
      return mediaId ? introductionRecords.get(mediaId) ?? null : null;
    },
    async create(media) {
      introductionRecords.set(media.id, media);
    },
    async save(media) {
      introductionRecords.set(media.id, media);
    },
  };
  const attachments = {
    async getById(id) {
      return attachmentRecords.get(id) ?? null;
    },
    async listByRfxId(organizationIdValue, targetRfxId) {
      return [...attachmentRecords.values()].filter(
        (attachment) =>
          attachment.organizationId === organizationIdValue
          && attachment.rfxId === targetRfxId,
      );
    },
    async create(attachment) {
      attachmentRecords.set(attachment.id, attachment);
    },
    async save(attachment) {
      attachmentRecords.set(attachment.id, attachment);
    },
  };

  return {
    authorization: auth.dependencies,
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
    publicMedia,
    introductions,
    attachments,
    mutations: {
      async getCommand(id) {
        return commands.get(id) ?? null;
      },
      async commit(bundle) {
        const prior = commands.get(bundle.command.id);
        if (prior) {
          if (
            prior.organizationId === bundle.command.organizationId
            && prior.action === bundle.command.action
            && prior.targetId === bundle.command.targetId
            && prior.requestFingerprint === bundle.command.requestFingerprint
            && prior.actorUserId === bundle.command.actorUserId
            && prior.actorMembershipId === bundle.command.actorMembershipId
          ) return "replayed";
          throw new Error("Governed media command identity collision.");
        }
        const map = bundle.record.kind === "public-media"
          ? projections
          : bundle.record.kind === "introduction"
            ? introductionRecords
            : attachmentRecords;
        if (bundle.record.mode === "create" && map.has(bundle.record.value.id)) {
          throw new Error("Governed media target already exists without matching command evidence.");
        }
        if (bundle.record.mode === "save" && !map.has(bundle.record.value.id)) {
          throw new Error("Governed media target disappeared before mutation.");
        }
        if (
          bundle.record.kind === "introduction"
          && bundle.record.value.status === "published"
        ) {
          const current = introductionSlots.get(bundle.record.value.organizationId);
          if (current && current !== bundle.record.value.id) {
            throw new Error("Organization already has another published introduction media record.");
          }
          introductionSlots.set(
            bundle.record.value.organizationId,
            bundle.record.value.id,
          );
        }
        map.set(bundle.record.value.id, bundle.record.value);
        commands.set(bundle.command.id, bundle.command);
        events.set(bundle.event.id, bundle.event);
        audits.set(bundle.audit.id, bundle.audit);
        return "created";
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
    rfx: {
      async getById(id) {
        return rfxRecords.get(id) ?? null;
      },
    },
    actor: {
      context: auth.context,
      organizationId: org1,
      membershipId: auth.membership.id,
    },
    authState: auth.state,
    projections,
    introductionRecords,
    introductionSlots,
    attachmentRecords,
    bytesByPath,
    commands,
    events,
    audits,
    rfxRecords,
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

test("linked introduction service re-verifies provider output under fresh organization authority", async () => {
  const dependencies = memoryDependencies([]);
  const media = await createLinkedIntroductionMedia(
    {
      actor: dependencies.actor,
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
        actor: dependencies.actor,
        id: "intro-linked-too-long",
        provider: "vimeo",
        videoId: "987654321",
        now,
      },
      {
        ...dependencies,
        externalVideos: {
          async resolve() {
            return {
              provider: "vimeo",
              videoId: "987654321",
              canonicalUrl: "https://vimeo.com/987654321",
              embedUrl: "https://player.vimeo.com/video/987654321",
              durationSeconds: 31,
              resolver: "fixture-provider-api",
              verifiedAt: now,
            };
          },
        },
      },
    ),
    /no more than 30 seconds/,
  );
});

test("media mutations revalidate revoked permissions and active restrictions", async () => {
  const dependencies = memoryDependencies([]);
  dependencies.authState.authorization = {
    ...dependencies.authState.authorization,
    permissions: ["document.manage"],
    updatedAt: now,
  };
  await assert.rejects(
    createLinkedIntroductionMedia(
      {
        actor: dependencies.actor,
        id: "intro-revoked",
        provider: "vimeo",
        videoId: "123456789",
        now,
      },
      dependencies,
    ),
    /missing-permission/,
  );

  dependencies.authState.authorization = {
    ...dependencies.authState.authorization,
    permissions: ["organization.profile.manage", "document.manage"],
  };
  dependencies.authState.organizationRestriction = { state: "suspended" };
  await assert.rejects(
    createLinkedIntroductionMedia(
      {
        actor: dependencies.actor,
        id: "intro-restricted",
        provider: "vimeo",
        videoId: "123456789",
        now,
      },
      dependencies,
    ),
    /organization-access-restricted/,
  );
});

test("only one Organization introduction can be published and exact publication replay is stable", async () => {
  const dependencies = memoryDependencies([]);
  const first = await createLinkedIntroductionMedia(
    {
      actor: dependencies.actor,
      id: "intro-singleton-1",
      provider: "vimeo",
      videoId: "111111111",
      now,
    },
    dependencies,
  );
  const second = await createLinkedIntroductionMedia(
    {
      actor: dependencies.actor,
      id: "intro-singleton-2",
      provider: "vimeo",
      videoId: "222222222",
      now,
    },
    dependencies,
  );
  const published = await publishIntroductionMedia(
    { actor: dependencies.actor, media: first, now },
    dependencies,
  );
  const replay = await publishIntroductionMedia(
    { actor: dependencies.actor, media: first, now: "2026-08-24T00:35:00.000Z" },
    dependencies,
  );
  assert.equal(replay.id, published.id);
  assert.equal(dependencies.introductionSlots.get(org1), first.id);
  await assert.rejects(
    publishIntroductionMedia(
      { actor: dependencies.actor, media: second, now },
      dependencies,
    ),
    /another published introduction/,
  );
});

test("RFx attachment requires a canonical same-Organization issuer RFx", async () => {
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
      actor: dependencies.actor,
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

  await assert.rejects(
    attachRfxDocument(
      {
        actor: dependencies.actor,
        id: "rfx-attachment-missing",
        rfxId: "rfx-missing",
        assetId: document.id,
        displayName: "Missing target",
        purpose: "issuer-document",
        audience: "organization-private",
        now,
      },
      dependencies,
    ),
    /not found in the authorized issuer Organization/,
  );
  await assert.rejects(
    attachRfxDocument(
      {
        actor: dependencies.actor,
        id: "rfx-attachment-cross-org",
        rfxId: "rfx-other-org",
        assetId: document.id,
        displayName: "Cross organization",
        purpose: "issuer-document",
        audience: "organization-private",
        now,
      },
      dependencies,
    ),
    /not found in the authorized issuer Organization/,
  );
  await assert.rejects(
    attachRfxDocument(
      {
        actor: dependencies.actor,
        id: "rfx-attachment-future-response",
        rfxId: "rfx-opportunity-1",
        assetId: document.id,
        displayName: "Response support",
        purpose: "response-support",
        audience: "team-private",
        now,
      },
      dependencies,
    ),
    /issuer documents only/,
  );

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

test("media mutation commits immutable command event and organization audit evidence with replay", async () => {
  const bytes = new Uint8Array([3, 3, 3]);
  const document = activeAsset({
    id: "asset-rfx-evidence",
    category: "rfx-document",
    contentType: "application/pdf",
    bytes,
  });
  const dependencies = memoryDependencies([document]);
  const input = {
    actor: dependencies.actor,
    id: "rfx-attachment-evidence",
    rfxId: "rfx-opportunity-1",
    assetId: document.id,
    displayName: "Evidence package",
    purpose: "issuer-document",
    audience: "organization-private",
    now,
  };
  const created = await attachRfxDocument(input, dependencies);
  const replay = await attachRfxDocument(
    { ...input, now: "2026-08-24T00:40:00.000Z" },
    dependencies,
  );
  assert.equal(replay.id, created.id);
  assert.equal(dependencies.commands.size, 1);
  assert.equal(dependencies.events.size, 1);
  assert.equal(dependencies.audits.size, 1);
  assert.equal([...dependencies.audits.values()][0].actor.userId, user1);

  await assert.rejects(
    attachRfxDocument(
      { ...input, displayName: "Changed after command", now },
      dependencies,
    ),
    /reused with different input/,
  );
});

test("RFx attachment removal is replay-safe", async () => {
  const bytes = new Uint8Array([5, 5, 5]);
  const document = activeAsset({
    id: "asset-rfx-remove",
    category: "rfx-document",
    contentType: "application/pdf",
    bytes,
  });
  const dependencies = memoryDependencies([document]);
  const attachment = await attachRfxDocument(
    {
      actor: dependencies.actor,
      id: "rfx-attachment-remove",
      rfxId: "rfx-opportunity-1",
      assetId: document.id,
      displayName: "Remove me",
      purpose: "issuer-document",
      audience: "organization-private",
      now,
    },
    dependencies,
  );
  const removed = await removeRfxAttachment(
    { actor: dependencies.actor, attachment, now },
    dependencies,
  );
  const replay = await removeRfxAttachment(
    {
      actor: dependencies.actor,
      attachment,
      now: "2026-08-24T00:45:00.000Z",
    },
    dependencies,
  );
  assert.equal(removed.status, "removed");
  assert.equal(replay.status, "removed");
  assert.equal(replay.revision, removed.revision);
});

test("public media implementation exposes no signed URL, download token, arbitrary iframe, or trusted permission snapshot", () => {
  const domain = read("src/domain/media/model.ts");
  const service = read("src/application/media/governed-media-services.ts");
  const mutation = read("src/domain/media/mutation.ts");
  const firestoreMutation = read("src/infrastructure/firestore/media-mutation-unit-of-work.ts");
  const firestoreRepositories = read("src/infrastructure/firestore/media-repositories.ts");
  assert.doesNotMatch(
    `${domain}\n${service}`,
    /getSignedUrl|signedUrl|downloadToken|firebaseStorageDownloadTokens|allow\s+read|arbitrary iframe/i,
  );
  assert.match(domain, /youtube-nocookie\.com/);
  assert.match(domain, /player\.vimeo\.com/);
  assert.match(service, /authorizeOrganizationOperation/);
  assert.doesNotMatch(service, /readonly permissions:/);
  assert.match(service, /dependencies\.rfx\.getById/);
  assert.match(mutation, /requestFingerprint/);
  assert.match(firestoreMutation, /organizationAuditEvents/);
  assert.match(firestoreMutation, /organizationIntroductionPublishedSlots/);
  assert.match(firestoreRepositories, /existing\.status === "removed"/);
});
