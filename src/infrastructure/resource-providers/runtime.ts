import type { Firestore } from "firebase-admin/firestore";

import { ResourceProviderFoundationService } from "../../application/resource-providers/provider-foundation.ts";
import { createServerFirebaseAccountSecurityService } from "../auth/firebase-account-security-runtime.ts";
import { createFirestoreEssentialOrganizationProfileRepositories } from "../firestore/organization-profile.ts";
import { createFirestoreOrganizationLocationRepositories } from "../firestore/organization-location.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { FirestoreProviderEvidenceOwnershipReader, FirestoreResourceProviderRepository } from "../firestore/resource-providers.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

export function createServerResourceProviderFoundationService(db: Firestore = getServerFirestore()) {
  const foundation = createFirestoreFoundationRepositories(db);
  const profile = createFirestoreEssentialOrganizationProfileRepositories(db);
  const location = createFirestoreOrganizationLocationRepositories(db);
  return new ResourceProviderFoundationService({
    authorization: { accountSecurity: createServerFirebaseAccountSecurityService(), organizations: foundation.organizations.accounts, memberships: foundation.users.memberships, authorizations: foundation.organizationAuthorization, restrictions: foundation.lifecycle.restrictions },
    profiles: foundation.organizations.profiles,
    completions: profile.completions,
    locations: location.locations,
    serviceGeographies: location.serviceGeographies,
    evidence: new FirestoreProviderEvidenceOwnershipReader(db),
    repository: new FirestoreResourceProviderRepository(db),
  });
}
