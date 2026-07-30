import type { Firestore } from "firebase-admin/firestore";

import { AdministrativeAuditCorrectionService } from "../../application/admin/administrative-audit-correction-service.ts";
import { getServerFirestore } from "../firestore/runtime.ts";
import { FirestorePlatformAdministrativeAuditRepository } from "../firestore/platform-admin-audit-repository.ts";

export function createServerAdministrativeAuditCorrectionService(
  db: Firestore = getServerFirestore(),
): AdministrativeAuditCorrectionService {
  return new AdministrativeAuditCorrectionService(
    new FirestorePlatformAdministrativeAuditRepository(db),
  );
}
