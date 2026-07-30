import { createHash } from "node:crypto";

import type { App } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

import type { PrivateObjectStore } from "../../application/storage/store-organization-asset";
import type { StoredAssetObjectReceipt } from "../../domain/storage/model";

function requiredBucketName(value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error("Firebase Storage bucket is required.");
  if (normalized.startsWith("gs://")) return normalized.slice(5);
  if (/^https?:\/\//i.test(normalized)) throw new Error("Firebase Storage bucket must be a bucket name, not a URL.");
  return normalized;
}

export function firebaseStorageBucketFromEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): string {
  return requiredBucketName(
    environment.RFXCHANGE_FIREBASE_STORAGE_BUCKET ??
      environment.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
      "",
  );
}

export class FirebasePrivateObjectStore implements PrivateObjectStore {
  private readonly app: App;
  private readonly bucketName: string;

  constructor(app: App, bucketName: string) {
    this.app = app;
    this.bucketName = requiredBucketName(bucketName);
  }

  async put(input: Readonly<{
    readonly objectPath: string;
    readonly contentType: string;
    readonly bytes: Uint8Array;
    readonly metadata: Readonly<Record<string, string>>;
  }>): Promise<StoredAssetObjectReceipt> {
    const file = getStorage(this.app).bucket(this.bucketName).file(input.objectPath);
    await file.save(Buffer.from(input.bytes), {
      resumable: false,
      validation: false,
      metadata: {
        contentType: input.contentType,
        cacheControl: "private, no-store, max-age=0",
        metadata: { ...input.metadata },
      },
    });

    return Object.freeze({
      objectPath: input.objectPath,
      contentType: input.contentType,
      sizeBytes: input.bytes.byteLength,
      sha256: createHash("sha256").update(input.bytes).digest("hex"),
    });
  }

  async get(objectPath: string): Promise<Readonly<{ readonly contentType: string; readonly bytes: Uint8Array }>> {
    const file = getStorage(this.app).bucket(this.bucketName).file(objectPath);
    const [metadata] = await file.getMetadata();
    const [bytes] = await file.download();
    return Object.freeze({
      contentType: metadata.contentType ?? "application/octet-stream",
      bytes: new Uint8Array(bytes),
    });
  }

  async delete(objectPath: string): Promise<void> {
    await getStorage(this.app).bucket(this.bucketName).file(objectPath).delete({ ignoreNotFound: true });
  }
}
