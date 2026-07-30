import type { Firestore } from "firebase-admin/firestore";

import { PrimaryOperatingGeographyService } from "../../application/geography/primary-operating-geography.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

export function createServerPrimaryOperatingGeographyService(
  db: Firestore = getServerFirestore(),
  now: () => string = () => new Date().toISOString(),
): PrimaryOperatingGeographyService {
  const geography = createFirestoreGeographyRepositories(db);
  const foundation = createFirestoreFoundationRepositories(db);
  return new PrimaryOperatingGeographyService({
    definitions: geography.definitions,
    selections: geography.selections,
    authorizations: geography.authorizations,
    lifecycle: foundation.lifecycle.lifecycle,
    unitOfWork: geography.selectionUnitOfWork,
    now,
  });
}
