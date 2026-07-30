import type { Firestore } from "firebase-admin/firestore";

import { PrimaryOperatingGeographyService } from "../../application/onboarding/primary-operating-geography.ts";
import { FirestoreAccessLifecycleRepository } from "../firestore/repositories.ts";
import { FirestorePrimaryOperatingGeographySelectionRepository } from "../firestore/primary-operating-geography-repository.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

/** Compose GEO-001 against the canonical Firestore lifecycle and user-scoped selection adapters. */
export function createServerPrimaryOperatingGeographyService(
  db: Firestore = getServerFirestore(),
): PrimaryOperatingGeographyService {
  return new PrimaryOperatingGeographyService({
    selections: new FirestorePrimaryOperatingGeographySelectionRepository(db),
    lifecycle: new FirestoreAccessLifecycleRepository(db),
  });
}
