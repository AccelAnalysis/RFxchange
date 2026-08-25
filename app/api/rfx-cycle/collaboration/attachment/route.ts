import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  assertProfileAssetFileSignature,
  OrganizationAssetUploadBoundaryError,
  readBoundedProfileAssetMultipartBody,
} from "@/src/application/storage/organization-asset-upload-boundary";
import {
  activateStoredAsset,
  createStoredAssetDraft,
  STORED_ASSET_POLICIES,
  storedAssetId,
} from "@/src/domain/storage/model";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { getFirebaseAdminApp } from "@/src/infrastructure/firebase/admin";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { apiProblem } from "@/src/infrastructure/http/api-problem";
import {
  createServerRfxResponseCollaborationService,
  type RfxCollaborationActor,
} from "@/src/infrastructure/rfx/rfx-response-collaboration-runtime";
import {
  FirebasePrivateObjectStore,
  firebaseStorageBucketFromEnvironment,
} from "@/src/infrastructure/storage/firebase-private-object-store";
import { FirestoreStoredAssetRepository } from "@/src/infrastructure/storage/firestore-stored-asset-repository";

export const runtime = "nodejs";

const POLICY = STORED_ASSET_POLICIES["rfx-response-attachment"];

function validMachineId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/.test(value);
}

async function actor(request: NextRequest): Promise<RfxCollaborationActor | NextResponse> {
  const access = await resolveParticipantRoute({
    sessionCookie: request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind === "unauthenticated") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (access.kind !== "authorized" || access.state.lifecycleState !== "open-platform") {
    return NextResponse.json({ error: "Current participant authority is required." }, { status: 403 });
  }
  return Object.freeze({
    context: access.context,
    organizationId: access.membership.organizationId,
    membershipId: access.membership.id,
    userId: access.context.user.id,
  });
}

async function boundedMultipartForm(request: NextRequest): Promise<FormData> {
  const contentType = request.headers.get("content-type");
  if (!contentType?.startsWith("multipart/form-data")) {
    throw new OrganizationAssetUploadBoundaryError("unsupported-content-type", 415, "RFx response attachment must use multipart/form-data.");
  }
  const boundedBody = await readBoundedProfileAssetMultipartBody(request.body, request.headers.get("content-length"));
  return new Response(Buffer.from(boundedBody), { headers: { "content-type": contentType } }).formData();
}

function responseProblem(request: NextRequest, error: unknown) {
  if (error instanceof OrganizationAssetUploadBoundaryError) {
    return apiProblem(request, {
      status: error.status,
      code: error.code,
      participantMessage: error.status === 413
        ? "The response attachment is too large."
        : error.status === 415
          ? "That response attachment file type is not supported."
          : "The response attachment could not be read.",
      cause: error,
    });
  }
  return apiProblem(request, {
    status: 500,
    code: "dependency-unavailable",
    participantMessage: "The response attachment could not be processed.",
    cause: error,
  });
}

function disposition(filename: string): string {
  const ascii = filename.replace(/[^A-Za-z0-9._ -]/g, "_").slice(0, 160) || "attachment";
  return `attachment; filename="${ascii.replaceAll('"', "_")}"`;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
  }
  try {
    const participant = await actor(request);
    if (participant instanceof NextResponse) return participant;
    const form = await boundedMultipartForm(request);
    const commandId = String(form.get("commandId") ?? "");
    const reference = String(form.get("reference") ?? "");
    const leadOrganizationId = String(form.get("leadOrganizationId") ?? "");
    const sectionId = String(form.get("sectionId") ?? "");
    const file = form.get("file");
    if (!validMachineId(commandId) || !validMachineId(reference) || !validMachineId(leadOrganizationId) || !validMachineId(sectionId) || !(file instanceof File)) {
      return NextResponse.json({ error: "Command, RFx, lead organization, section, and file are required." }, { status: 400 });
    }

    const db = getServerFirestore();
    const collaboration = createServerRfxResponseCollaborationService(db);
    const access = await collaboration.assertContributorSection(participant, { reference, leadOrganizationId, sectionId });
    const item = access.response.items.find((candidate) => candidate.sectionId === sectionId);
    if (!item || (item.format !== "attachment" && !item.attachmentsAllowed)) {
      return NextResponse.json({ error: "This assigned response section does not accept attachments." }, { status: 400 });
    }

    const contentType = file.type.trim().toLowerCase();
    if (!file.size || file.size > POLICY.maximumBytes) {
      return NextResponse.json({ error: "The response attachment is empty or too large." }, { status: file.size > POLICY.maximumBytes ? 413 : 400 });
    }
    if (!POLICY.permittedContentTypes.includes(contentType)) {
      return NextResponse.json({ error: "That response attachment file type is not supported." }, { status: 415 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    assertProfileAssetFileSignature(contentType, bytes);
    const digest = createHash("sha256").update(bytes).digest("hex");
    const assetId = storedAssetId(`rfx_collab_${createHash("sha256").update(`${participant.organizationId}:${leadOrganizationId}:${reference}:${sectionId}:${commandId}`).digest("hex").slice(0, 48)}`);
    const assets = new FirestoreStoredAssetRepository(db);
    const existing = await assets.getById(assetId);
    if (existing?.status === "active") {
      if (existing.organizationId !== access.leadOrganizationId || existing.sha256 !== digest || existing.sizeBytes !== bytes.byteLength || existing.contentType !== contentType) {
        return NextResponse.json({ error: "Attachment command identity was reused for different content." }, { status: 409 });
      }
      return NextResponse.json({ assetId: existing.id, filename: existing.originalFilename, replayed: true }, { headers: { "cache-control": "no-store" } });
    }

    const now = new Date().toISOString();
    const draft = existing ?? createStoredAssetDraft({
      id: assetId,
      organizationId: access.leadOrganizationId,
      category: "rfx-response-attachment",
      originalFilename: file.name,
      contentType,
      sizeBytes: bytes.byteLength,
      createdByUserId: participant.userId,
      now,
    });
    if (!existing) await assets.create(draft);
    const objects = new FirebasePrivateObjectStore(getFirebaseAdminApp(), firebaseStorageBucketFromEnvironment());
    const receipt = await objects.put({
      objectPath: draft.objectPath,
      contentType: draft.contentType,
      bytes,
      metadata: {
        assetId: String(draft.id),
        organizationId: String(access.leadOrganizationId),
        category: draft.category,
        contributorOrganizationId: String(participant.organizationId),
        responseId: access.response.id,
        sectionId,
      },
    });
    const active = activateStoredAsset(draft, receipt, new Date().toISOString());
    await assets.save(active);
    return NextResponse.json({ assetId: active.id, filename: active.originalFilename, replayed: false }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    return responseProblem(request, error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const participant = await actor(request);
    if (participant instanceof NextResponse) return participant;
    const assetIdValue = request.nextUrl.searchParams.get("assetId") ?? "";
    const reference = request.nextUrl.searchParams.get("reference") ?? "";
    const leadOrganizationId = request.nextUrl.searchParams.get("lead") ?? "";
    const sectionId = request.nextUrl.searchParams.get("section") ?? "";
    const assetId = storedAssetId(assetIdValue);
    const db = getServerFirestore();
    const access = await createServerRfxResponseCollaborationService(db).assertContributorSection(participant, { reference, leadOrganizationId, sectionId });
    const item = access.response.items.find((candidate) => candidate.sectionId === sectionId);
    if (!item?.attachmentAssetIds.includes(assetId)) return NextResponse.json({ error: "Attachment is not part of this assigned section." }, { status: 403 });
    const asset = await new FirestoreStoredAssetRepository(db).getById(assetId);
    if (!asset || asset.status !== "active" || asset.organizationId !== access.leadOrganizationId || asset.category !== "rfx-response-attachment") {
      return NextResponse.json({ error: "Response attachment is unavailable." }, { status: 404 });
    }
    const object = await new FirebasePrivateObjectStore(getFirebaseAdminApp(), firebaseStorageBucketFromEnvironment()).get(asset.objectPath);
    return new NextResponse(Buffer.from(object.bytes), {
      headers: {
        "content-type": asset.contentType,
        "content-length": String(asset.sizeBytes),
        "content-disposition": disposition(asset.originalFilename),
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return responseProblem(request, error);
  }
}
