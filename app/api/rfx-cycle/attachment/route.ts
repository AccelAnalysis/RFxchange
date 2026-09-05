import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  assertProfileAssetFileSignature,
  OrganizationAssetUploadBoundaryError,
  readBoundedProfileAssetMultipartBody,
} from "@/src/application/storage/organization-asset-upload-boundary";
import { storeOrganizationAsset, StoredAssetAccessError } from "@/src/application/storage/store-organization-asset";
import { STORED_ASSET_POLICIES, storedAssetId } from "@/src/domain/storage/model";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { getFirebaseAdminApp } from "@/src/infrastructure/firebase/admin";
import { createFirestoreFoundationRepositories } from "@/src/infrastructure/firestore/repositories";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { apiProblem } from "@/src/infrastructure/http/api-problem";
import { createServerRfxCycleService } from "@/src/infrastructure/rfx/rfx-cycle-runtime";
import { FirebasePrivateObjectStore, firebaseStorageBucketFromEnvironment } from "@/src/infrastructure/storage/firebase-private-object-store";
import { FirestoreStoredAssetRepository } from "@/src/infrastructure/storage/firestore-stored-asset-repository";

export const runtime = "nodejs";

const POLICY = STORED_ASSET_POLICIES["rfx-response-attachment"];

function validMachineId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/.test(value);
}

async function boundedMultipartForm(request: NextRequest): Promise<FormData> {
  const contentType = request.headers.get("content-type");
  if (!contentType?.startsWith("multipart/form-data")) {
    throw new OrganizationAssetUploadBoundaryError(
      "unsupported-content-type",
      415,
      "RFx response attachment must use multipart/form-data.",
    );
  }
  const boundedBody = await readBoundedProfileAssetMultipartBody(
    request.body,
    request.headers.get("content-length"),
  );
  return new Response(Buffer.from(boundedBody), { headers: { "content-type": contentType } }).formData();
}

function problem(request: NextRequest, error: unknown) {
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
  if (error instanceof StoredAssetAccessError) {
    return apiProblem(request, {
      status: 403,
      code: error.code,
      participantMessage: "Response attachment storage is unavailable for this organization membership.",
      cause: error,
    });
  }
  return apiProblem(request, {
    status: 500,
    code: "dependency-unavailable",
    participantMessage: "The response attachment could not be uploaded. Retry the request.",
    cause: error,
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
  }
  try {
    const form = await boundedMultipartForm(request);
    const commandId = String(form.get("commandId") ?? "");
    const reference = String(form.get("reference") ?? "");
    const sectionId = String(form.get("sectionId") ?? "");
    const file = form.get("file");
    if (!validMachineId(commandId) || !validMachineId(reference) || !validMachineId(sectionId) || !(file instanceof File)) {
      return NextResponse.json({ error: "Command, RFx reference, response section, and file are required." }, { status: 400 });
    }

    const access = await resolveParticipantRoute({
      sessionCookie: request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
    });
    if (access.kind === "unauthenticated") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (access.kind !== "authorized" || access.state.lifecycleState !== "open-platform") {
      return NextResponse.json({ error: "Current participant authority is required." }, { status: 403 });
    }

    const db = getServerFirestore();
    const actor = Object.freeze({
      context: access.context,
      organizationId: access.membership.organizationId,
      membershipId: access.membership.id,
      userId: access.context.user.id,
    });
    const workspace = await createServerRfxCycleService(db).responderWorkspace(actor, reference);
    if (!workspace.response || workspace.response.status !== "draft") {
      return NextResponse.json({ error: "Start an editable response before adding attachments." }, { status: 409 });
    }
    const item = workspace.response.items.find((candidate) => candidate.sectionId === sectionId);
    if (!item || (item.format !== "attachment" && !item.attachmentsAllowed)) {
      return NextResponse.json({ error: "This response section does not accept attachments." }, { status: 400 });
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
    const assetId = storedAssetId(`rfx_response_${createHash("sha256").update(`${access.membership.organizationId}:${reference}:${sectionId}:${commandId}`).digest("hex").slice(0, 48)}`);
    const authorization = await createFirestoreFoundationRepositories(db).organizationAuthorization.getByMembershipId(access.membership.id);
    if (!authorization || !authorization.permissions.includes("response.create")) {
      return NextResponse.json({ error: "Response creation permission is required." }, { status: 403 });
    }

    const assets = new FirestoreStoredAssetRepository(db);
    const existing = await assets.getById(assetId);
    if (existing) {
      if (
        existing.organizationId !== access.membership.organizationId ||
        existing.category !== "rfx-response-attachment" ||
        existing.status !== "active" ||
        existing.contentType !== contentType ||
        existing.sizeBytes !== bytes.byteLength ||
        existing.sha256 !== digest
      ) {
        return NextResponse.json({ error: "Attachment command identity was reused for different content." }, { status: 409 });
      }
      return NextResponse.json({
        assetId: existing.id,
        filename: existing.originalFilename,
        contentType: existing.contentType,
        sizeBytes: existing.sizeBytes,
        replayed: true,
      }, { headers: { "cache-control": "no-store" } });
    }

    const stored = await storeOrganizationAsset({
      actor: {
        kind: "organization-member",
        organizationId: access.membership.organizationId,
        permissions: authorization.permissions,
      },
      id: assetId,
      organizationId: access.membership.organizationId,
      category: "rfx-response-attachment",
      originalFilename: file.name,
      contentType,
      bytes,
      createdByUserId: access.context.user.id,
      now: new Date().toISOString(),
    }, {
      assets,
      objects: new FirebasePrivateObjectStore(getFirebaseAdminApp(), firebaseStorageBucketFromEnvironment()),
    });

    return NextResponse.json({
      assetId: stored.id,
      filename: stored.originalFilename,
      contentType: stored.contentType,
      sizeBytes: stored.sizeBytes,
      replayed: false,
    }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    return problem(request, error);
  }
}
