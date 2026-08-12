import type { Firestore } from "firebase-admin/firestore";

import { RfxDraftService } from "../../application/rfx/rfx-draft-service.ts";
import { RfxPublicationService } from "../../application/rfx/rfx-publication-service.ts";
import { loadImmutableAmacsCatalog } from "../amacs/runtime.ts";
import { createServerFirebaseAccountSecurityService } from "../auth/firebase-account-security-runtime.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { createFirestoreOrganizationLocationRepositories } from "../firestore/organization-location.ts";
import { FirestoreRfxRepository } from "../firestore/rfx.ts";
import { FirestoreAiInterpretationRepository } from "../firestore/ai-interpretation-repository.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

export async function createServerRfxDraftService(
  db: Firestore = getServerFirestore(),
) {
  const foundation = createFirestoreFoundationRepositories(db);
  const geography = createFirestoreGeographyRepositories(db);
  const organizationLocation =
    createFirestoreOrganizationLocationRepositories(db);
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
    locations: organizationLocation.locations,
    geographies: geography.definitions,
    interpretations: new FirestoreAiInterpretationRepository(db),
  });
}

export function createServerRfxPublicationService(
  db: Firestore = getServerFirestore(),
) {
  const foundation = createFirestoreFoundationRepositories(db);
  const geography = createFirestoreGeographyRepositories(db);
  const organizationLocation = createFirestoreOrganizationLocationRepositories(db);
  return new RfxPublicationService({
    authorization: {
      accountSecurity: createServerFirebaseAccountSecurityService(),
      organizations: foundation.organizations.accounts,
      memberships: foundation.users.memberships,
      authorizations: foundation.organizationAuthorization,
      restrictions: foundation.lifecycle.restrictions,
    },
    repository: new FirestoreRfxRepository(db),
    profiles: foundation.organizations.profiles,
    locations: organizationLocation.locations,
    geographies: geography.definitions,
  });
}
