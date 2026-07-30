import type { Firestore } from "firebase-admin/firestore";

import { FeatureFlagAdministrationService } from "../../application/admin/feature-flag-administration.ts";
import { SystemMaintenanceOperationService } from "../../application/admin/system-maintenance-operations.ts";
import type {
  FeatureFlagEnvironment,
} from "../../domain/admin-system/feature-flags.ts";
import type {
  SystemMaintenanceEnvironment,
  SystemMaintenanceExecutor,
} from "../../domain/admin-system/maintenance-operations.ts";
import { getServerFirestore } from "../firestore/runtime.ts";
import { FirestoreFeatureFlagRepository } from "../firestore/feature-flag-repository.ts";
import { FirestoreSystemMaintenanceOperationStore } from "../firestore/system-maintenance-operation-store.ts";

export function createServerFeatureFlagAdministrationService(
  environment: FeatureFlagEnvironment,
  db: Firestore = getServerFirestore(),
): FeatureFlagAdministrationService {
  const repository = new FirestoreFeatureFlagRepository(db);
  return new FeatureFlagAdministrationService(repository, repository, environment);
}

export function createServerSystemMaintenanceOperationService(input: Readonly<{
  environment: SystemMaintenanceEnvironment;
  executor: SystemMaintenanceExecutor;
  db?: Firestore;
}>): SystemMaintenanceOperationService {
  const store = new FirestoreSystemMaintenanceOperationStore(input.db ?? getServerFirestore());
  return new SystemMaintenanceOperationService(store, input.executor, input.environment);
}
