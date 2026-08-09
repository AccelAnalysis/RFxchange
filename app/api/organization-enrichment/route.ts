import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  OrganizationEnrichmentError,
} from "@/src/application/organization-enrichment/organization-enrichment";
import {
  assertProfileAssetFileSignature,
  OrganizationAssetUploadBoundaryError,
  readBoundedProfileAssetMultipartBody,
  validateProfileAssetFileMetadata,
} from "@/src/application/storage/organization-asset-upload-boundary";
import { storeOrganizationAsset, StoredAssetAccessError } from "@/src/application/storage/store-organization-asset";
import { createOrganizationProfileAsset } from "@/src/domain/organization-enrichment/model";
import { storedAssetId } from "@/src/domain/storage/model";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { getFirebaseAdminApp } from "@/src/infrastructure/firebase/admin";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { createFirestoreFoundationRepositories } from "@/src/infrastructure/firestore/repositories";
import { createServerOrganizationEnrichmentService } from "@/src/infrastructure/organization-enrichment/runtime";
import { FirebasePrivateObjectStore, firebaseStorageBucketFromEnvironment } from "@/src/infrastructure/storage/firebase-private-object-store";
import { FirestoreStoredAssetRepository } from "@/src/infrastructure/storage/firestore-stored-asset-repository";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function responseFor(error: unknown) {
  if (error instanceof OrganizationAssetUploadBoundaryError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }
  if (error instanceof OrganizationEnrichmentError) {
    const status = error.code === "forbidden" ? 403 : error.code === "not-found" ? 404 : error.code === "invalid" ? 400 : 409;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }
  if (error instanceof StoredAssetAccessError) {
    return NextResponse.json({ error: "You do not have permission to store this organization asset.", code: error.code }, { status: 403 });
  }
  return NextResponse.json({ error: error instanceof Error ? error.message : "Organization enrichment could not be saved." }, { status: 409 });
}

function validCommand(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/.test(value);
}

async function authorized(request: NextRequest, organizationId: string) {
  return resolveParticipantRoute({
    sessionCookie: request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
    requestedOrganizationId: organizationId,
  });
}

function scope(access: Extract<Awaited<ReturnType<typeof authorized>>, { kind: "authorized" }>, organizationId: string, commandId: string) {
  return { context: access.context, organizationId, membershipId: String(access.membership.id), commandId } as const;
}

async function boundedMultipartForm(request: NextRequest): Promise<FormData> {
  const contentType = request.headers.get("content-type");
  if (!contentType?.startsWith("multipart/form-data")) {
    throw new OrganizationAssetUploadBoundaryError(
      "unsupported-content-type",
      415,
      "Profile asset upload must use multipart/form-data.",
    );
  }
  const boundedBody = await readBoundedProfileAssetMultipartBody(
    request.body,
    request.headers.get("content-length"),
  );
  return new Response(Buffer.from(boundedBody), {
    headers: { "content-type": contentType },
  }).formData();
}

async function upload(request: NextRequest) {
  const form = await boundedMultipartForm(request);
  const organizationId = String(form.get("organizationId") ?? "");
  const commandId = String(form.get("commandId") ?? "");
  const kind = String(form.get("kind") ?? "");
  const title = String(form.get("title") ?? "");
  const description = String(form.get("description") ?? "");
  const altText = String(form.get("altText") ?? "");
  const file = form.get("file");
  if (!organizationId || !validCommand(commandId) || !(file instanceof File)) {
    return NextResponse.json({ error: "Organization, command, and file are required." }, { status: 400 });
  }
  const access = await authorized(request, organizationId);
  if (access.kind === "unauthenticated") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (access.kind !== "authorized") return NextResponse.json({ error: "Current participant authority is required." }, { status: 403 });

  // Validate category, exact file size, and declared MIME before allocating the second in-memory
  // copy created by File.arrayBuffer(). The complete multipart stream was bounded before parsing.
  const uploadPolicy = validateProfileAssetFileMetadata({
    kind,
    sizeBytes: file.size,
    contentType: file.type,
  });
  const { category, contentType } = uploadPolicy;

  const storedId = storedAssetId(`stored_${createHash("sha256").update(`${organizationId}:${commandId}`).digest("hex").slice(0, 48)}`);
  const profileId = `profile_asset_${createHash("sha256").update(commandId).digest("hex").slice(0, 48)}`;
  try {
    createOrganizationProfileAsset({
      id: profileId,
      organizationId: access.membership.organizationId,
      storedAssetId: storedId,
      kind,
      title,
      description: description || null,
      altText: altText || null,
      userId: access.context.user.id,
      membershipId: access.membership.id,
      now: new Date().toISOString(),
    });
  } catch (error) {
    throw new OrganizationEnrichmentError("invalid", error instanceof Error ? error.message : "Profile asset metadata is invalid.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  assertProfileAssetFileSignature(contentType, bytes);
  const digest = createHash("sha256").update(bytes).digest("hex");
  const db = getServerFirestore();
  const assets = new FirestoreStoredAssetRepository(db);
  const objects = new FirebasePrivateObjectStore(getFirebaseAdminApp(), firebaseStorageBucketFromEnvironment());
  const authorization = await createFirestoreFoundationRepositories(db).organizationAuthorization.getByMembershipId(access.membership.id);
  if (!authorization || !authorization.permissions.includes("organization.profile.manage")) {
    throw new OrganizationEnrichmentError("forbidden", "Organization profile management permission is required.");
  }
  let stored = await assets.getById(storedId);
  if (stored) {
    if (stored.organizationId !== access.membership.organizationId || stored.category !== category || stored.status !== "active" ||
      stored.contentType !== contentType || stored.sizeBytes !== bytes.byteLength || stored.sha256 !== digest) {
      throw new OrganizationEnrichmentError("conflict", "Upload command identity already refers to different asset bytes or metadata.");
    }
  } else {
    stored = await storeOrganizationAsset({
      actor: { kind: "organization-member", organizationId: access.membership.organizationId, permissions: authorization.permissions },
      id: storedId, organizationId: access.membership.organizationId, category,
      originalFilename: file.name, contentType, bytes,
      createdByUserId: access.context.user.id, now: new Date().toISOString(),
    }, { assets, objects });
  }
  const service = createServerOrganizationEnrichmentService(db);
  const result = await service.registerProfileAsset(scope(access, organizationId, commandId), {
    id: profileId,
    storedAssetId: stored.id, kind, title, description: description || null, altText: altText || null,
  });
  return NextResponse.json(result, { status: result.replayed ? 200 : 201, headers: { "cache-control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
  try {
    if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
      return await upload(request);
    }
    if (Number(request.headers.get("content-length") ?? 0) > 262_144) return NextResponse.json({ error: "Enrichment request is too large." }, { status: 413 });
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || typeof body.organizationId !== "string" || !validCommand(body.commandId) || typeof body.action !== "string" || !isRecord(body.input)) {
      return NextResponse.json({ error: "Organization, command, action, and input are required." }, { status: 400 });
    }
    const access = await authorized(request, body.organizationId);
    if (access.kind === "unauthenticated") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (access.kind !== "authorized") return NextResponse.json({ error: "Current participant authority is required." }, { status: 403 });
    const service = createServerOrganizationEnrichmentService();
    const commandScope = scope(access, body.organizationId, body.commandId);
    const result = body.action === "upsert-credential"
      ? await service.upsertCredential(commandScope, body.input as Parameters<typeof service.upsertCredential>[1])
      : body.action === "retire-credential"
        ? await service.retireCredential(commandScope, body.input as Parameters<typeof service.retireCredential>[1])
        : body.action === "set-asset-publication"
          ? await service.setAssetPublication(commandScope, body.input as Parameters<typeof service.setAssetPublication>[1])
          : body.action === "retire-asset"
            ? await service.retireAsset(commandScope, body.input as Parameters<typeof service.retireAsset>[1])
            : body.action === "begin-additional-location"
              ? await service.beginAdditionalLocation(commandScope, body.input as Parameters<typeof service.beginAdditionalLocation>[1])
              : body.action === "confirm-additional-location"
                ? await service.confirmAdditionalLocation(commandScope, body.input as Parameters<typeof service.confirmAdditionalLocation>[1])
                : body.action === "set-location-publication"
                  ? await service.setLocationPublication(commandScope, body.input as Parameters<typeof service.setLocationPublication>[1])
                  : body.action === "retire-additional-location"
                    ? await service.retireLocation(commandScope, body.input as Parameters<typeof service.retireLocation>[1])
                    : null;
    if (!result) return NextResponse.json({ error: "Unsupported organization enrichment action." }, { status: 400 });
    return NextResponse.json(result, { status: result.replayed ? 200 : 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    return responseFor(error);
  }
}

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get("organizationId")?.trim() ?? "";
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/.test(organizationId)) {
    return NextResponse.json({ error: "A valid organization identity is required." }, { status: 400 });
  }
  try {
    const snapshot = await createServerOrganizationEnrichmentService().snapshot(organizationId);
    return NextResponse.json({
      organizationId,
      credentials: snapshot.publicCredentials,
      assets: snapshot.publicAssets,
      additionalLocations: snapshot.publicAdditionalLocations,
    }, { headers: { "cache-control": "public, max-age=60, must-revalidate" } });
  } catch {
    return NextResponse.json({ error: "Published organization enrichment is unavailable." }, { status: 409 });
  }
}
