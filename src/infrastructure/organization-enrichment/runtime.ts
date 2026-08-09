import type { Firestore } from "firebase-admin/firestore";

import { OrganizationEnrichmentService } from "../../application/organization-enrichment/organization-enrichment.ts";
import type { ParticipantRouteResolution } from "../auth/participant-route-runtime.ts";
import { createServerFirebaseAccountSecurityService } from "../auth/firebase-account-security-runtime.ts";
import { getFirebaseAdminApp } from "../firebase/admin.ts";
import { CensusOrganizationGeocodingProvider } from "../geocoding/census-geocoder.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { FirestoreOrganizationEnrichmentRepository } from "../firestore/organization-enrichment.ts";
import { createFirestoreOrganizationLocationRepositories } from "../firestore/organization-location.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { getServerFirestore } from "../firestore/runtime.ts";
import { TigerWebBoundarySnapshotRepository } from "../geography/tigerweb-boundary-snapshot.ts";
import { FirebasePrivateObjectStore, firebaseStorageBucketFromEnvironment } from "../storage/firebase-private-object-store.ts";
import { FirestoreStoredAssetRepository } from "../storage/firestore-stored-asset-repository.ts";

type AuthorizedParticipant = Extract<ParticipantRouteResolution, { readonly kind: "authorized" }>;

export function createServerOrganizationEnrichmentService(
  db: Firestore = getServerFirestore(),
  now: () => string = () => new Date().toISOString(),
) {
  const foundation = createFirestoreFoundationRepositories(db);
  const geography = createFirestoreGeographyRepositories(db);
  const locations = createFirestoreOrganizationLocationRepositories(db);
  return new OrganizationEnrichmentService({
    authorization: {
      accountSecurity: createServerFirebaseAccountSecurityService(),
      organizations: foundation.organizations.accounts,
      memberships: foundation.users.memberships,
      authorizations: foundation.organizationAuthorization,
      restrictions: foundation.lifecycle.restrictions,
    },
    repository: new FirestoreOrganizationEnrichmentRepository(db),
    storedAssets: new FirestoreStoredAssetRepository(db),
    objects: new FirebasePrivateObjectStore(getFirebaseAdminApp(), firebaseStorageBucketFromEnvironment()),
    primaryLocations: locations.locations,
    geographies: geography.definitions,
    boundaries: new TigerWebBoundarySnapshotRepository(geography.definitions),
    geocoder: new CensusOrganizationGeocodingProvider({ now }),
    now,
  });
}

export async function loadAuthorizedOrganizationEnrichment(access: AuthorizedParticipant) {
  const db = getServerFirestore();
  const service = createServerOrganizationEnrichmentService(db);
  return Object.freeze({ snapshot: await service.snapshot(String(access.membership.organizationId)) });
}
