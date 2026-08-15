import type { Firestore } from "firebase-admin/firestore";

import { Wave4GapGovernedDraftService } from "../../application/rfx/wave4-gap-governed-draft-service.ts";
import { Wave4GapPublicationService } from "../../application/rfx/wave4-gap-publication-service.ts";
import { loadImmutableAmacsCatalog } from "../amacs/runtime.ts";
import { createServerFirebaseAccountSecurityService } from "../auth/firebase-account-security-runtime.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { createFirestoreOrganizationLocationRepositories } from "../firestore/organization-location.ts";
import { FirestoreRfxRepository } from "../firestore/rfx.ts";
import { FirestoreAiInterpretationRepository } from "../firestore/ai-interpretation-repository.ts";
import { getServerFirestore } from "../firestore/runtime.ts";
import { Iss006GovernedRfxRepository } from "./iss006-governed-rfx-repository.ts";
import { Wave4GapPublicationRepository } from "./wave4-gap-publication-repository.ts";

export async function createServerRfxDraftService(
  db: Firestore = getServerFirestore(),
) {
  const foundation = createFirestoreFoundationRepositories(db);
  const geography = createFirestoreGeographyRepositories(db);
  const organizationLocation =
    createFirestoreOrganizationLocationRepositories(db);
  const baseRepository = new FirestoreRfxRepository(db);
  return new Wave4GapGovernedDraftService({
    authorization: {
      accountSecurity: createServerFirebaseAccountSecurityService(),
      organizations: foundation.organizations.accounts,
      memberships: foundation.users.memberships,
      authorizations: foundation.organizationAuthorization,
      restrictions: foundation.lifecycle.restrictions,
    },
    catalog: await loadImmutableAmacsCatalog(),
    repository: new Iss006GovernedRfxRepository(db, baseRepository),
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
  const baseRepository = new FirestoreRfxRepository(db);
  return new Wave4GapPublicationService({
    authorization: {
      accountSecurity: createServerFirebaseAccountSecurityService(),
      organizations: foundation.organizations.accounts,
      memberships: foundation.users.memberships,
      authorizations: foundation.organizationAuthorization,
      restrictions: foundation.lifecycle.restrictions,
    },
    repository: new Wave4GapPublicationRepository(db, baseRepository),
    profiles: foundation.organizations.profiles,
    locations: organizationLocation.locations,
    geographies: geography.definitions,
  });
}