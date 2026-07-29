import { createHash } from "node:crypto";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function backgroundJobDocumentId(jobName: string, idempotencyKey: string): string {
  return sha256Hex(`${jobName}\u0000${idempotencyKey}`);
}

export function backgroundJobPayloadFingerprint(value: unknown): string {
  return sha256Hex(JSON.stringify(value));
}
