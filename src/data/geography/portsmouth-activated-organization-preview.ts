import {
  evaluateOrganizationMarkerActivation,
  projectPublicOrganizationMarker,
} from "../../domain/organization-markers/model.ts";
import {
  confirmOrganizationLocationDraft,
  createConfirmedOrganizationLocation,
  createOrganizationGeocodeCandidate,
  createOrganizationLocationDraft,
  structuredPostalAddress,
} from "../../domain/organization-location/model.ts";
import {
  organizationProfileCompletionId,
  type OrganizationProfileCompletion,
} from "../../domain/organization-profile/model.ts";
import {
  createOrganizationAccount,
  organizationProfileId,
} from "../../domain/organizations/model.ts";
import { PORTSMOUTH_CONTROLLED_LOCALITY } from "./hampton-roads-controlled-locality.ts";
import { TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES } from "./tigerweb-2025-hampton-roads-boundaries.ts";

const NOW = "2026-07-30T17:30:00.000Z";
const ORGANIZATION_ID = "org-portsmouth-works";

export function createPortsmouthActivatedOrganizationPreview() {
  const organization = createOrganizationAccount({
    id: ORGANIZATION_ID,
    now: NOW,
  });
  const address = structuredPostalAddress({
    addressLine1: "200 High St",
    locality: "Portsmouth",
    regionCode: "VA",
    postalCode: "23704",
  });
  const candidate = createOrganizationGeocodeCandidate({
    id: "candidate-portsmouth-works",
    geographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
    coordinate: [-76.297933263584, 36.835462854397],
    matchedAddress: "200 HIGH ST, PORTSMOUTH, VA, 23704",
    quality: "address-range",
    provider: "U.S. Census Geocoder",
    providerReference: "122199924",
    benchmark: "Public_AR_Current",
    retrievedAt: NOW,
  });
  const draft = createOrganizationLocationDraft({
    id: "draft-portsmouth-works",
    organizationId: organization.id,
    requestedByUserId: "user-portsmouth-works",
    membershipId: "membership-portsmouth-works",
    primaryGeographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
    physicalAddress: address,
    isHomeOrPrivate: false,
    visibility: "approximate",
    candidates: [candidate],
    now: NOW,
  });
  const confirmed = confirmOrganizationLocationDraft(
    draft,
    candidate.id,
    NOW,
  );
  const location = createConfirmedOrganizationLocation({
    draft: confirmed.draft,
    candidate: confirmed.candidate,
    confirmedByUserId: "user-portsmouth-works",
    confirmedByMembershipId: "membership-portsmouth-works",
    now: NOW,
  });
  const completion: OrganizationProfileCompletion = Object.freeze({
    id: organizationProfileCompletionId(ORGANIZATION_ID),
    organizationId: organization.id,
    profileId: organizationProfileId("profile-portsmouth-works"),
    credentialFamily: "active",
    credentialKey: "profile-complete",
    status: "active",
    missingRequirements: Object.freeze([]),
    sourceProfileUpdatedAt: NOW,
    sourceLocationUpdatedAt: NOW,
    sourceServiceGeographyUpdatedAt: NOW,
    firstActivatedAt: NOW,
    lastTransitionAt: NOW,
    evaluatedAt: NOW,
  });
  const activation = evaluateOrganizationMarkerActivation({
    organization,
    relationshipAuthorized: true,
    geography: PORTSMOUTH_CONTROLLED_LOCALITY,
    participation: Object.freeze({ allowed: true as const, authority: "released" as const }),
    location,
    profileCompletion: completion,
    restriction: null,
    now: NOW,
  });
  const boundary = TIGERWEB_2025_HAMPTON_ROADS_BOUNDARIES.features.find(
    (feature) => feature.properties.geographyId === PORTSMOUTH_CONTROLLED_LOCALITY.id,
  );
  if (!boundary) throw new Error("Portsmouth preview boundary is missing.");
  const marker = projectPublicOrganizationMarker({
    activation,
    location,
    geography: PORTSMOUTH_CONTROLLED_LOCALITY,
    geographyGeometry: boundary.geometry,
  });
  return Object.freeze({ activation, marker });
}
