import {
  createOrganizationAccount,
  createOrganizationProfile,
} from "../../domain/organizations/model.ts";
import {
  createOrganizationDataProvenance,
  createOrganizationDiscoveryRecord,
  projectUnclaimedOrganizationProfile,
} from "../../domain/organization-resolution/model.ts";
import { matchOrganizations } from "../../domain/organization-resolution/matching.ts";
import { PORTSMOUTH_CONTROLLED_LOCALITY } from "../geography/hampton-roads-controlled-locality.ts";

const PREVIEW_TIME = "2026-07-30T15:00:00.000Z";

export function createPortsmouthOrganizationResolutionPreview() {
  const account = createOrganizationAccount({
    id: "org-preview-harborlight",
    now: PREVIEW_TIME,
  });
  const profile = createOrganizationProfile(account, {
    id: "profile-preview-harborlight",
    displayName: "Harborlight Fabrication LLC",
    now: PREVIEW_TIME,
  });
  const discovery = createOrganizationDiscoveryRecord(account, profile, {
    id: "discovery-preview-harborlight",
    origin: "seeded",
    identity: {
      displayName: profile.displayName,
      aliases: ["Harborlight Fabrication"],
      categories: ["Metal Fabrication", "Marine Industrial"],
      geographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
      address: {
        line1: "100 Harbor Way",
        locality: "Portsmouth",
        region: "VA",
        postalCode: "23704",
        countryCode: "US",
      },
      domain: "harborlight.example",
      phone: "757-555-0100",
    },
    provenance: createOrganizationDataProvenance({
      kind: "seeded-public",
      sourceLabel: "Demonstration launch seed · non-production",
      sourceRecordId: "preview-seed-harborlight",
      observedAt: PREVIEW_TIME,
    }),
    publicAddress: true,
    publicDomain: true,
    publicPhone: false,
    publicGovernmentIdentifiers: false,
    now: PREVIEW_TIME,
  });
  const provisionalIdentity = Object.freeze({
    displayName: "Harborlight Fabrication",
    geographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id,
    domain: "harborlight.example",
  });
  return Object.freeze({
    geographyName: PORTSMOUTH_CONTROLLED_LOCALITY.name,
    publicProfile: projectUnclaimedOrganizationProfile(discovery),
    provisionalIdentity,
    candidates: matchOrganizations(provisionalIdentity, [discovery]),
  });
}
