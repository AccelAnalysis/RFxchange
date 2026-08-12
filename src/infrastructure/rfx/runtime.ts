import type { Firestore } from "firebase-admin/firestore";

import { RfxDraftService } from "../../application/rfx/rfx-draft-service.ts";
import { loadImmutableAmacsCatalog } from "../amacs/runtime.ts";
import { createServerFirebaseAccountSecurityService } from "../auth/firebase-account-security-runtime.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { FirestoreRfxRepository } from "../firestore/rfx.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

export async function createServerRfxDraftService(db: Firestore = getServerFirestore()) {
  const foundation = createFirestoreFoundationRepositories(db);
  return new RfxDraftService({
    authorization: {
      accountSecurity: createServerFirebaseAccountSecurityService(),
      organizations: foundation.organizations.accounts,
      memberships: foundation.users.memberships,
      authorizations: foundation.organizationAuthorization,
      restrictions: foundation.lifecycle.restrictions,
    },
    catalog: await loadImmutableAmacsCatalog(),
    repository: new FirestoreRfxRepository(db),
  });
}
