import type { Firestore } from "firebase-admin/firestore";

import { GovernedConfigurationService } from "../../application/admin/governed-configuration-service.ts";
import { getServerFirestore } from "../firestore/server.ts";
import { FirestoreGovernedConfigurationRepository } from "../firestore/governed-configuration-repository.ts";

export function createServerGovernedConfigurationService(
  db: Firestore = getServerFirestore(),
): GovernedConfigurationService {
  const repository = new FirestoreGovernedConfigurationRepository(db);
  return new GovernedConfigurationService({ repository, changes: repository });
}
