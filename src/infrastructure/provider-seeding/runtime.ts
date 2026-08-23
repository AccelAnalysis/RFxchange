import "server-only";

import type { Firestore } from "firebase-admin/firestore";

import { FirestoreProviderPromotionAdapter } from "../firestore/provider-promotion-adapter.ts";
import { FirestoreProviderPromotionEvidenceRepository } from "../firestore/provider-promotion-evidence-repository.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

export function createServerProviderPromotionEvidenceRepository(
  db: Firestore = getServerFirestore(),
): FirestoreProviderPromotionEvidenceRepository {
  return new FirestoreProviderPromotionEvidenceRepository(db);
}

export function createServerProviderPromotionAdapter(
  db: Firestore = getServerFirestore(),
): FirestoreProviderPromotionAdapter {
  return new FirestoreProviderPromotionAdapter(db);
}
