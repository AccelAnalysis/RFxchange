import { NextRequest, NextResponse } from "next/server";

import type { RfxResponse } from "@/src/domain/rfx/cycle";
import { storedAssetId } from "@/src/domain/storage/model";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { getFirebaseAdminApp } from "@/src/infrastructure/firebase/admin";
import { createFirestoreFoundationRepositories } from "@/src/infrastructure/firestore/repositories";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { FirebasePrivateObjectStore, firebaseStorageBucketFromEnvironment } from "@/src/infrastructure/storage/firebase-private-object-store";
import { FirestoreStoredAssetRepository } from "@/src/infrastructure/storage/firestore-stored-asset-repository";

export const runtime = "nodejs";

function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^A-Za-z0-9._ -]/g, "_").slice(0, 160) || "attachment";
  return `attachment; filename="${ascii.replaceAll('"', "_")}"`;
}

export async function GET(request: NextRequest, { params }: Readonly<{ params: Promise<{ assetId: string }> }>) {
  const { assetId: assetIdValue } = await params;
  let assetId;
  try {
    assetId = storedAssetId(assetIdValue);
  } catch {
    return NextResponse.json({ error: "Attachment identity is invalid." }, { status: 400 });
  }
  const access = await resolveParticipantRoute({
    sessionCookie: request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind === "unauthenticated") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (access.kind !== "authorized" || access.state.lifecycleState !== "open-platform") {
    return NextResponse.json({ error: "Current participant authority is required." }, { status: 403 });
  }

  const db = getServerFirestore();
  const assets = new FirestoreStoredAssetRepository(db);
  const asset = await assets.getById(assetId);
  if (!asset || asset.status !== "active" || asset.category !== "rfx-response-attachment") {
    return NextResponse.json({ error: "Response attachment is unavailable." }, { status: 404 });
  }
  const authorization = await createFirestoreFoundationRepositories(db).organizationAuthorization.getByMembershipId(access.membership.id);
  if (!authorization) return NextResponse.json({ error: "Organization authorization is unavailable." }, { status: 403 });

  let allowed = asset.organizationId === access.membership.organizationId && authorization.permissions.includes("response.create");
  if (!allowed && (authorization.permissions.includes("evaluation.review") || authorization.permissions.includes("rfx.publish"))) {
    const issuerResponses = await db.collection("rfxResponses").where("issuerOrganizationId", "==", access.membership.organizationId).get();
    allowed = issuerResponses.docs
      .map((item) => item.data() as RfxResponse)
      .filter((item) => item.status === "submitted")
      .some((item) => item.items.some((section) => section.attachmentAssetIds.includes(asset.id)));
  }
  if (!allowed) return NextResponse.json({ error: "Response attachment access is unavailable." }, { status: 403 });

  const object = await new FirebasePrivateObjectStore(getFirebaseAdminApp(), firebaseStorageBucketFromEnvironment()).get(asset.objectPath);
  if (object.contentType !== asset.contentType || object.bytes.byteLength !== asset.sizeBytes) {
    return NextResponse.json({ error: "Response attachment no longer matches its stored record." }, { status: 503 });
  }
  return new NextResponse(Buffer.from(object.bytes), {
    headers: {
      "content-type": asset.contentType,
      "content-length": String(asset.sizeBytes),
      "content-disposition": contentDisposition(asset.originalFilename),
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
