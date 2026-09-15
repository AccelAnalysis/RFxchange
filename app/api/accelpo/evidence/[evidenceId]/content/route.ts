import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  fileEvidenceObjectPath,
  fileEvidenceUploadAuthority,
  validateFileEvidenceDescriptor,
  FileEvidenceValidationError,
} from "@/apps/accelpo/src/file-evidence/contracts";
import type { EvidenceMetadataProjection } from "@/apps/accelpo/src/query-projection/contracts";
import { AccelPoCommandError } from "@/src/application/accelpo/command-port";
import { ServerSessionError, type AuthenticatedServerContext } from "@/src/application/auth/server-session";
import {
  assertProfileAssetFileSignature,
  OrganizationAssetUploadBoundaryError,
  readBoundedProfileAssetMultipartBody,
} from "@/src/application/storage/organization-asset-upload-boundary";
import { createServerAccelPoQueryProjection } from "@/src/accelpo/cp04/server-runtime";
import { createCP07ServerCommandRegistry } from "@/src/accelpo/cp07/server-runtime";
import { createServerAuthenticationBoundary } from "@/src/infrastructure/auth/firebase-session-runtime";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { createServerAccelPoCommandPort } from "@/src/infrastructure/accelpo/command-port-runtime";
import { getFirebaseAdminApp } from "@/src/infrastructure/firebase/admin";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { isApplicationRequestOrigin } from "@/src/infrastructure/http/application-request-origin";
import { FirebasePrivateObjectStore, firebaseStorageBucketFromEnvironment } from "@/src/infrastructure/storage/firebase-private-object-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OBJECT_RECEIPTS_COLLECTION = "accelpoEvidenceObjects";

function bearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization")?.trim() ?? "";
  if (!header) return null;
  return /^Bearer\s+(.+)$/i.exec(header)?.[1]?.trim() || null;
}

async function authenticate(request: NextRequest): Promise<AuthenticatedServerContext> {
  const boundary = createServerAuthenticationBoundary();
  const now = new Date().toISOString();
  const token = bearerToken(request);
  if (token) return boundary.authenticateIdToken({ idToken: token, now });
  const sessionCookie = request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value?.trim();
  if (!sessionCookie) throw new ServerSessionError("credential-required", "Authentication is required.");
  return boundary.authenticateSessionCookie({ sessionCookie, now });
}

function machineId(value: string): string | null {
  const normalized = value.trim();
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/.test(normalized) ? normalized : null;
}

async function evidenceMetadata(
  context: AuthenticatedServerContext,
  organizationId: string,
  evidenceId: string,
): Promise<EvidenceMetadataProjection | null> {
  const result = await createServerAccelPoQueryProjection(context).read({
    requestedOrganizationId: organizationId,
    query: Object.freeze({
      projection: "evidence-metadata",
      scope: "record",
      recordId: evidenceId,
    }),
  });
  if (result.outcome === "failure") {
    if (result.code === "unauthenticated") throw new ServerSessionError("credential-required", result.message);
    if (result.code === "forbidden") throw new AccelPoCommandError("forbidden", result.message);
    if (result.code === "not-found") return null;
    throw new AccelPoCommandError("unavailable-service", result.message);
  }
  const item = result.items[0];
  return item && "releaseStatus" in item ? item as EvidenceMetadataProjection : null;
}

async function authorizeUpload(
  context: AuthenticatedServerContext,
  organizationId: string,
  evidenceId: string,
  requestId: string,
  authorityKey: string,
): Promise<void> {
  const authority = fileEvidenceUploadAuthority(authorityKey);
  if (!authority) {
    throw new AccelPoCommandError("validation-failure", "The file upload authority is invalid.");
  }
  await createServerAccelPoCommandPort({
    registry: createCP07ServerCommandRegistry(),
  }).execute(Object.freeze({
    commandName: authority.authorizeCommand,
    organizationContext: Object.freeze({ organizationId }),
    payload: Object.freeze({ evidenceId }),
    requestId,
  }), context);
}

async function multipartForm(request: NextRequest): Promise<FormData> {
  const contentType = request.headers.get("content-type");
  if (!contentType?.startsWith("multipart/form-data")) {
    throw new OrganizationAssetUploadBoundaryError(
      "unsupported-content-type",
      415,
      "File upload must use multipart/form-data.",
    );
  }
  const body = await readBoundedProfileAssetMultipartBody(
    request.body,
    request.headers.get("content-length"),
  );
  return new Response(Buffer.from(body), { headers: { "content-type": contentType } }).formData();
}

function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^A-Za-z0-9._ -]/g, "_").slice(0, 160) || "evidence";
  return `attachment; filename="${ascii.replaceAll('"', "_")}"`;
}

function errorResponse(error: unknown): NextResponse {
  if (error instanceof FileEvidenceValidationError) {
    const status = error.message.includes("larger than") ? 413 : error.message.includes("file type") ? 415 : 400;
    return NextResponse.json(
      { error: error.message },
      { status, headers: { "cache-control": "no-store" } },
    );
  }
  if (error instanceof OrganizationAssetUploadBoundaryError) {
    return NextResponse.json(
      { error: error.status === 413 ? "The file is too large." : error.status === 415 ? "That file type is not supported." : "The file could not be read." },
      { status: error.status, headers: { "cache-control": "no-store" } },
    );
  }
  if (error instanceof ServerSessionError) {
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: error.code === "authentication-backend-unavailable" ? 503 : 401, headers: { "cache-control": "no-store" } },
    );
  }
  if (error instanceof AccelPoCommandError) {
    const status = error.code === "forbidden" ? 403 : error.code === "not-found" ? 404 : error.code === "validation-failure" ? 400 : error.code === "duplicate-request" || error.code === "version-conflict" ? 409 : 503;
    return NextResponse.json({ error: error.message }, { status, headers: { "cache-control": "no-store" } });
  }
  return NextResponse.json(
    { error: "The file service is temporarily unavailable. Retry the request." },
    { status: 503, headers: { "cache-control": "no-store" } },
  );
}

export async function POST(
  request: NextRequest,
  { params }: Readonly<{ params: Promise<{ evidenceId: string }> }>,
) {
  if (!isApplicationRequestOrigin(request, "purchasing")) {
    return NextResponse.json({ error: "A trusted AccelPO application origin is required." }, { status: 403 });
  }
  try {
    const { evidenceId: rawEvidenceId } = await params;
    const evidenceId = machineId(rawEvidenceId);
    if (!evidenceId) return NextResponse.json({ error: "File identity is invalid." }, { status: 400 });

    const context = await authenticate(request);
    const form = await multipartForm(request);
    const organizationId = machineId(String(form.get("organizationId") ?? ""));
    const file = form.get("file");
    if (!organizationId || !(file instanceof File)) {
      return NextResponse.json({ error: "Organization and file are required." }, { status: 400 });
    }

    const metadata = await evidenceMetadata(context, organizationId, evidenceId);
    if (!metadata) return NextResponse.json({ error: "The file is unavailable." }, { status: 404 });
    if (metadata.status !== "pending-upload" && metadata.status !== "uploaded") {
      return NextResponse.json({ error: "This file cannot accept an upload." }, { status: 409 });
    }

    const uploadRequestId = machineId(request.headers.get("x-accelpo-upload-id") ?? "") ?? `upload-${evidenceId}`;
    const uploadAuthority = request.headers.get("x-accelpo-upload-authority")?.trim() || "requester";
    await authorizeUpload(context, organizationId, evidenceId, `authorize-${uploadRequestId}`, uploadAuthority);

    const descriptor = validateFileEvidenceDescriptor({
      originalFilename: file.name,
      contentType: file.type,
      size: file.size,
    });
    if (
      descriptor.originalFilename !== metadata.originalFilename ||
      descriptor.contentType !== metadata.contentType ||
      descriptor.size !== metadata.size
    ) {
      return NextResponse.json({ error: "The selected file does not match the initiated upload." }, { status: 409 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    assertProfileAssetFileSignature(descriptor.contentType, bytes);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const objectPath = fileEvidenceObjectPath(organizationId, evidenceId);
    const db = getServerFirestore();
    const receiptRef = db.doc(`${OBJECT_RECEIPTS_COLLECTION}/${evidenceId}`);

    const claim = await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(receiptRef);
      if (existing.exists) {
        const value = existing.data();
        const same = value?.organizationId === organizationId &&
          value.evidenceId === evidenceId &&
          value.objectPath === objectPath &&
          value.originalFilename === descriptor.originalFilename &&
          value.contentType === descriptor.contentType &&
          value.size === descriptor.size &&
          value.sha256 === sha256 &&
          value.uploadedByUserId === String(context.user.id);
        if (!same) throw new AccelPoCommandError("duplicate-request", "This file upload was already claimed with different content.");
        return Object.freeze({ replayed: value?.status === "uploaded" });
      }
      transaction.create(receiptRef, {
        id: evidenceId,
        organizationId,
        evidenceId,
        objectPath,
        originalFilename: descriptor.originalFilename,
        contentType: descriptor.contentType,
        size: descriptor.size,
        sha256,
        uploadedByUserId: String(context.user.id),
        uploadAuthority,
        status: "uploading",
        createdAt: new Date().toISOString(),
        uploadedAt: null,
      });
      return Object.freeze({ replayed: false });
    });

    if (!claim.replayed) {
      const objects = new FirebasePrivateObjectStore(
        getFirebaseAdminApp(),
        firebaseStorageBucketFromEnvironment(),
      );
      const stored = await objects.put({
        objectPath,
        contentType: descriptor.contentType,
        bytes,
        metadata: Object.freeze({
          rfxOrganizationId: organizationId,
          rfxAccelPoEvidenceId: evidenceId,
          rfxSensitivity: "private-evidence",
        }),
      });
      if (
        stored.objectPath !== objectPath ||
        stored.contentType !== descriptor.contentType ||
        stored.sizeBytes !== descriptor.size ||
        stored.sha256 !== sha256
      ) {
        throw new AccelPoCommandError("unavailable-service", "Stored file verification failed. Retry the request.");
      }
      await db.runTransaction(async (transaction) => {
        const current = await transaction.get(receiptRef);
        const value = current.data();
        if (!current.exists || value?.sha256 !== sha256 || value?.organizationId !== organizationId) {
          throw new AccelPoCommandError("duplicate-request", "The file upload changed before it could be finalized.");
        }
        transaction.update(receiptRef, { status: "uploaded", uploadedAt: new Date().toISOString() });
      });
    }

    return NextResponse.json({
      evidenceId,
      status: "uploaded",
      replayed: claim.replayed,
    }, {
      status: claim.replayed ? 200 : 201,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: Readonly<{ params: Promise<{ evidenceId: string }> }>,
) {
  try {
    const { evidenceId: rawEvidenceId } = await params;
    const evidenceId = machineId(rawEvidenceId);
    const organizationId = machineId(request.nextUrl.searchParams.get("organizationId") ?? "");
    if (!evidenceId || !organizationId) {
      return NextResponse.json({ error: "File identity and organization are required." }, { status: 400 });
    }
    const context = await authenticate(request);
    const metadata = await evidenceMetadata(context, organizationId, evidenceId);
    if (!metadata || metadata.status !== "uploaded") {
      return NextResponse.json({ error: "The file is unavailable." }, { status: 404 });
    }
    const objectPath = fileEvidenceObjectPath(organizationId, evidenceId);
    const object = await new FirebasePrivateObjectStore(
      getFirebaseAdminApp(),
      firebaseStorageBucketFromEnvironment(),
    ).get(objectPath);
    if (object.contentType !== metadata.contentType || object.bytes.byteLength !== metadata.size) {
      throw new AccelPoCommandError("unavailable-service", "The stored file no longer matches its metadata.");
    }
    return new NextResponse(Buffer.from(object.bytes), {
      headers: {
        "content-type": metadata.contentType,
        "content-length": String(metadata.size ?? object.bytes.byteLength),
        "content-disposition": contentDisposition(metadata.originalFilename),
        "cache-control": "private, no-store, max-age=0",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
