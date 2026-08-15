import type { Firestore } from "firebase-admin/firestore";

import { RfxPublicationService } from "../../application/rfx/rfx-publication-service.ts";
import {
  loadRfxQuantityDimensionAuthority,
  loadRfxQuantityUnitAuthority,
} from "../amacs/rfx-qualifier-authority.ts";
import { loadImmutableAmacsCatalog } from "../amacs/runtime.ts";
import { createServerFirebaseAccountSecurityService } from "../auth/firebase-account-security-runtime.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { createFirestoreOrganizationLocationRepositories } from "../firestore/organization-location.ts";
import { FirestoreRfxRepository } from "../firestore/rfx.ts";
import { FirestoreAiInterpretationRepository } from "../firestore/ai-interpretation-repository.ts";
import { getServerFirestore } from "../firestore/runtime.ts";
import { AuthoringAuthorityRfxDraftService } from "./authoring-authority-draft-service.ts";
import { Iss006GovernedRfxRepository } from "./iss006-governed-rfx-repository.ts";

export async function createServerRfxDraftService(
  db: Firestore = getServerFirestore(),
) {
  const foundation = createFirestoreFoundationRepositories(db);
  const geography = createFirestoreGeographyRepositories(db);
  const organizationLocation =
    createFirestoreOrganizationLocationRepositories(db);
  const baseRepository = new FirestoreRfxRepository(db);
  return new AuthoringAuthorityRfxDraftService({
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

export async function loadServerRfxQualifierAuthority(
  db: Firestore = getServerFirestore(),
) {
  const [units, dimensions, geographySnapshot] = await Promise.all([
    loadRfxQuantityUnitAuthority(),
    loadRfxQuantityDimensionAuthority(),
    db.collection("geographies").get(),
  ]);
  const localities = geographySnapshot.docs
    .flatMap((document) => {
      const data = document.data() as Record<string, unknown>;
      if (data.releaseState !== "released" || typeof data.name !== "string") return [];
      return [Object.freeze({ id: document.id, label: data.name })];
    })
    .sort((left, right) => left.label.localeCompare(right.label) || left.id.localeCompare(right.id));
  return Object.freeze({
    units,
    dimensions,
    localities: Object.freeze(localities),
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
