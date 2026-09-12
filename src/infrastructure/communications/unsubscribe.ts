import { createHash, randomBytes } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
export const unsubscribeTokenDigest = (token: string) => {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error("invalid-token");
  return createHash("sha256").update(token).digest("hex");
};
/** Capability grants only withdrawal for one email address; no account read or subscription grant. */
export async function createEmailUnsubscribeUrl(db: Firestore, input: { userId: string; addressKey: string; origin: string; now: number }) {
  const origin = new URL(input.origin);
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) throw new Error("invalid-origin");
  const token = randomBytes(32).toString("base64url");
  await db.collection("communicationUnsubscribeTokens").doc(unsubscribeTokenDigest(token)).create({
    userId: input.userId, addressKey: input.addressKey, channel: "email", purpose: "marketing", createdAt: new Date(input.now).toISOString(),
    expiresAt: new Date(input.now + 365 * 86_400_000).toISOString(), usedAt: null,
  });
  return new URL(`/communications/unsubscribe/${token}`, origin).href;
}
export async function unsubscribeEmail(db: Firestore, token: string, now = Date.now()) {
  const digest = unsubscribeTokenDigest(token);
  return db.runTransaction(async tx => {
    const ref = db.collection("communicationUnsubscribeTokens").doc(digest);
    const grant = await tx.get(ref);
    if (!grant.exists || grant.get("channel") !== "email" || grant.get("purpose") !== "marketing" ||
      typeof grant.get("expiresAt") !== "string" || !Number.isFinite(Date.parse(grant.get("expiresAt"))) || Date.parse(grant.get("expiresAt")) <= now ||
      !/^[a-f0-9]{64}$/.test(grant.get("addressKey"))) throw new Error("link-unavailable");
    if (grant.get("usedAt")) return;
    const suppressionRef = db.collection("communicationSuppressions").doc(grant.get("addressKey"));
    const previous = await tx.get(suppressionRef);
    const occurredAt = new Date(now).toISOString();
    // Preserve stronger provider/abuse suppression rather than making it releasable by a preference save.
    if (!previous.get("suppressed")) tx.set(suppressionRef, { channel: "email", suppressed: true, source: "email-unsubscribe", occurredAt });
    tx.update(ref, { usedAt: occurredAt });
    tx.create(db.collection("communicationConsentEvents").doc(`unsubscribe-${digest}`), {
      userId: grant.get("userId"), channel: "email", action: "withdrawn", source: "email-unsubscribe", occurredAt,
    });
  });
}
