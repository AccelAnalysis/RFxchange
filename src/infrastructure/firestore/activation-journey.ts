import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";

import type { ActivationJourneyContext } from "../../domain/onboarding/model.ts";
import type { ActivationJourneyContextRepository } from "../../domain/onboarding/repository.ts";
import type { UserId } from "../../domain/users/model.ts";
import { FIRESTORE_SCHEMA_VERSION } from "./schema.ts";

const COLLECTION = "activationJourneyContexts";

function isoTimestamp(value: unknown): string {
  if (typeof value === "string") return new Date(value).toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  throw new Error("Activation journey persistence is missing a valid timestamp.");
}

export class FirestoreActivationJourneyContextRepository
  implements ActivationJourneyContextRepository {
  constructor(private readonly db: Firestore) {}

  async getByUserId(userId: UserId): Promise<ActivationJourneyContext | null> {
    const snapshot = await this.db.collection(COLLECTION).doc(String(userId)).get();
    if (!snapshot.exists) return null;
    const data = snapshot.data();
    if (!data || data.schemaVersion !== FIRESTORE_SCHEMA_VERSION || data.userId !== userId) {
      throw new Error("Activation journey context failed schema or user identity validation.");
    }
    return Object.freeze({
      ...data,
      organizationRelationship: data.organizationRelationship ?? null,
      organizationIdentitySeed: Object.freeze({
        websiteDisposition: data.organizationIdentitySeed?.websiteDisposition ?? null,
        websiteUrl: data.organizationIdentitySeed?.websiteUrl ?? null,
        phone: data.organizationIdentitySeed?.phone ?? null,
      }),
      acquisitionContext: data.acquisitionContext
        ? Object.freeze({
            ...data.acquisitionContext,
            intent: Object.freeze({ ...data.acquisitionContext.intent }),
            source: Object.freeze({ ...data.acquisitionContext.source }),
            issuedAt: isoTimestamp(data.acquisitionContext.issuedAt),
            expiresAt: isoTimestamp(data.acquisitionContext.expiresAt),
            boundAt: isoTimestamp(data.acquisitionContext.boundAt),
          })
        : null,
      createdAt: isoTimestamp(data.createdAt),
      updatedAt: isoTimestamp(data.updatedAt),
    }) as ActivationJourneyContext;
  }

  async save(context: ActivationJourneyContext): Promise<void> {
    const ref = this.db.collection(COLLECTION).doc(String(context.userId));
    const snapshot = await ref.get();
    await ref.set({
      ...context,
      schemaVersion: FIRESTORE_SCHEMA_VERSION,
      createdAt: snapshot.exists
        ? snapshot.data()?.createdAt ?? FieldValue.serverTimestamp()
        : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}
