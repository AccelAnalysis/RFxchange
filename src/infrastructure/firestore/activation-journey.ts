import { FieldValue, type Firestore } from "firebase-admin/firestore";

import type { ActivationJourneyContext } from "../../domain/onboarding/model.ts";
import type { ActivationJourneyContextRepository } from "../../domain/onboarding/repository.ts";
import type { UserId } from "../../domain/users/model.ts";
import { FIRESTORE_SCHEMA_VERSION } from "./schema.ts";

const COLLECTION = "activationJourneyContexts";

export class FirestoreActivationJourneyContextRepository
  implements ActivationJourneyContextRepository {
  constructor(private readonly db: Firestore) {}

  async getByUserId(userId: UserId): Promise<ActivationJourneyContext | null> {
    const snapshot = await this.db.collection(COLLECTION).doc(String(userId)).get();
    return snapshot.exists ? (snapshot.data() as ActivationJourneyContext) : null;
  }

  async save(context: ActivationJourneyContext): Promise<void> {
    const ref = this.db.collection(COLLECTION).doc(String(context.userId));
    const snapshot = await ref.get();
    await ref.set({
      ...context,
      schemaVersion: FIRESTORE_SCHEMA_VERSION,
      createdAt: snapshot.exists ? snapshot.data()?.createdAt ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}
