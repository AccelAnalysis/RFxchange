import type { Firestore } from "firebase-admin/firestore";

import { OpportunityPursuitService } from "../../application/rfx/opportunity-pursuit-service.ts";
import { createServerFirebaseAccountSecurityService } from "../auth/firebase-account-security-runtime.ts";
import { FirestoreOpportunityPursuitRepository } from "../firestore/opportunity-pursuit.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

export function createServerOpportunityPursuitService(db: Firestore = getServerFirestore()) {
  const foundation = createFirestoreFoundationRepositories(db);
  return new OpportunityPursuitService({
    authorization: {
      accountSecurity: createServerFirebaseAccountSecurityService(),
      organizations: foundation.organizations.accounts,
      memberships: foundation.users.memberships,
      authorizations: foundation.organizationAuthorization,
      restrictions: foundation.lifecycle.restrictions,
    },
    repository: new FirestoreOpportunityPursuitRepository(db),
  });
}
