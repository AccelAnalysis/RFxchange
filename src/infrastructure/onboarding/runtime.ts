import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";

import { ActivationJourneyService } from "../../application/onboarding/activation-journey.ts";
import { ParticipantCreatedOrganizationAuthorityService } from "../../application/onboarding/participant-created-authority.ts";
import { OrganizationAuthorityService } from "../../application/organization-claims/organization-authority.ts";
import { OrganizationLocationService } from "../../application/organization-location/organization-location.ts";
import { EssentialOrganizationProfileService } from "../../application/organization-profile/essential-profile.ts";
import { OrganizationMarkerActivationService } from "../../application/geography/organization-marker-activation.ts";
import { HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS } from "../../data/geography/hampton-roads-controlled-locality.ts";
import { FirebaseAccountSecurityService } from "../auth/firebase-account-security.ts";
import { getServerFirebaseAuth } from "../auth/firebase-server.ts";
import { CensusOrganizationGeocodingProvider } from "../geocoding/census-geocoder.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { FirestoreActivationJourneyContextRepository } from "../firestore/activation-journey.ts";
import { createFirestoreOrganizationAuthorityClaims } from "../firestore/organization-authority-claims.ts";
import { createFirestoreOrganizationLocationRepositories } from "../firestore/organization-location.ts";
import { createFirestoreOrganizationMarkerRepositories } from "../firestore/organization-marker.ts";
import { createFirestoreEssentialOrganizationProfileRepositories } from "../firestore/organization-profile.ts";
import { createFirestoreOrganizationResolutionRepositories } from "../firestore/organization-resolution-repositories.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { getServerFirestore } from "../firestore/runtime.ts";
import {
  createServerPrimaryOperatingGeographyService,
} from "../geography/runtime.ts";
import { TigerWebBoundarySnapshotRepository } from "../geography/tigerweb-boundary-snapshot.ts";
import { createServerOrganizationResolutionService } from "../organization-resolution/runtime.ts";

export function createServerActivationJourneyService(
  db: Firestore = getServerFirestore(),
  now: () => string = () => new Date().toISOString(),
): ActivationJourneyService {
  const foundation = createFirestoreFoundationRepositories(db);
  const geography = createFirestoreGeographyRepositories(db);
  const resolutionRepositories = createFirestoreOrganizationResolutionRepositories(db);
  const claims = createFirestoreOrganizationAuthorityClaims(db);
  const locationRepositories = createFirestoreOrganizationLocationRepositories(db);
  const profileRepositories = createFirestoreEssentialOrganizationProfileRepositories(db);
  const markerRepositories = createFirestoreOrganizationMarkerRepositories(db);
  const accountSecurity = new FirebaseAccountSecurityService(getServerFirebaseAuth());
  const authorization = {
    accountSecurity,
    organizations: foundation.organizations.accounts,
    memberships: foundation.users.memberships,
    authorizations: foundation.organizationAuthorization,
    restrictions: foundation.lifecycle.restrictions,
  } as const;
  const boundaryRepository = new TigerWebBoundarySnapshotRepository(geography.definitions);

  const authorityService = new OrganizationAuthorityService({
    claims: claims.claims,
    unitOfWork: claims.unitOfWork,
    resolutions: resolutionRepositories.resolutions,
    lifecycle: foundation.lifecycle.lifecycle,
    ids: {
      claim: () => `org-claim-${randomUUID()}`,
      event: () => `org-claim-event-${randomUUID()}`,
      decision: () => `org-claim-decision-${randomUUID()}`,
      membership: () => `membership-${randomUUID()}`,
      audit: () => `audit-${randomUUID()}`,
    },
    now,
  });

  const participantCreatedAuthority = new ParticipantCreatedOrganizationAuthorityService(
    claims.unitOfWork,
    accountSecurity,
    {
      membership: () => `membership-${randomUUID()}`,
      audit: () => `audit-${randomUUID()}`,
    },
    now,
  );

  const locationService = new OrganizationLocationService({
    authorization,
    selections: geography.selections,
    geographies: geography.definitions,
    geographyAuthorizations: geography.authorizations,
    boundaries: boundaryRepository,
    geocoder: new CensusOrganizationGeocodingProvider({ now }),
    repositories: locationRepositories,
    ids: {
      draft: () => `location-draft-${randomUUID()}`,
      event: () => `location-event-${randomUUID()}`,
      audit: () => `audit-${randomUUID()}`,
    },
    now,
  });

  const profileService = new EssentialOrganizationProfileService({
    authorization,
    profiles: foundation.organizations.profiles,
    locations: locationRepositories.locations,
    serviceGeographies: locationRepositories.serviceGeographies,
    geographies: geography.definitions,
    repositories: profileRepositories,
    ids: {
      event: () => `profile-event-${randomUUID()}`,
      audit: () => `audit-${randomUUID()}`,
    },
    now,
  });

  const markerService = new OrganizationMarkerActivationService({
    authorization,
    geographies: geography.definitions,
    geographyAuthorizations: geography.authorizations,
    locations: locationRepositories.locations,
    completions: profileRepositories.completions,
    restrictions: foundation.lifecycle.restrictions,
    markers: markerRepositories,
  });

  return new ActivationJourneyService({
    contexts: new FirestoreActivationJourneyContextRepository(db),
    lifecycle: foundation.lifecycle.lifecycle,
    definitions: geography.definitions,
    selections: geography.selections,
    releasedGeographies: HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS,
    geography: createServerPrimaryOperatingGeographyService(db, now),
    resolution: createServerOrganizationResolutionService(db, now),
    resolutions: resolutionRepositories.resolutions,
    participantCreatedAuthority,
    claims: authorityService,
    claimRepository: claims.claims,
    location: locationService,
    locations: locationRepositories.locations,
    serviceGeographies: locationRepositories.serviceGeographies,
    profile: profileService,
    completions: profileRepositories.completions,
    marker: markerService,
    markerActivations: markerRepositories.activations,
    accounts: foundation.organizations.accounts,
    profiles: foundation.organizations.profiles,
    memberships: foundation.users.memberships,
    accountSecurity,
    ids: {
      markerEvent: () => `marker-event-${randomUUID()}`,
      markerAudit: () => `audit-${randomUUID()}`,
    },
    now,
  });
}
