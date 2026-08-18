import assert from "node:assert/strict";
import test from "node:test";

import {
  RESOURCES_MOBILE_PROJECTION_POLICY,
  buildResourcesMobileProjection,
} from "../src/application/resource-network/mobile-resource-exchange.ts";
import {
  selectionMatchesCard,
  selectionMatchesMapObject,
} from "../src/application/participant/mobile-exchange-contracts.ts";

const copy = Object.freeze({
  providerStatusLabel: "Provider status",
  officialProviderValue: "Official Resource Provider",
  statusLabel: "Status",
  servicesLabel: "Services",
  categoriesLabel: "Categories",
  eligibilityLabel: "Eligibility",
  intakeLabel: "Intake",
  modalitiesLabel: "Modalities",
  relevanceLabel: "Why this may be relevant",
  resourceKindLabel: "Resource type",
  providerAvailabilityLabel: "Provider availability",
  requestRoleLabel: "Your role",
  updatedLabel: "Updated",
  availability: (value) => value,
  category: (value) => value,
  modality: (value) => value,
  resourceKind: (value) => value,
  resourceStatus: (value) => value,
  requestStatus: (value) => value,
  requestRole: (value) => value,
});

const geometry = Object.freeze({
  type: "Polygon",
  coordinates: Object.freeze([[[-76.8, 36.7], [-76.5, 36.7], [-76.5, 36.9], [-76.8, 36.7]]]),
});

const provider = Object.freeze({
  organizationId: "org-provider",
  displayName: "Regional Business Support Center",
  publicationVersion: 3,
  sourceProfileVersion: 7,
  categories: Object.freeze(["technical-assistance"]),
  services: Object.freeze([
    Object.freeze({ id: "service-1", name: "Business planning", description: "Structured planning support.", availability: "limited" }),
  ]),
  populationsServed: "Small businesses and entrepreneurs",
  eligibility: "Businesses operating in the service territory",
  intakeMethod: "Complete the provider intake form",
  modalities: Object.freeze(["virtual", "in-person"]),
  languages: Object.freeze(["English"]),
  availability: "limited",
  territory: Object.freeze({
    geographyId: "geo-service-1",
    name: "Hampton Roads",
    releaseState: "released",
    geometry,
  }),
  marker: Object.freeze({
    id: "marker-provider",
    coordinate: Object.freeze([-76.65, 36.82]),
    accessibleLocationLabel: "Approximate provider office location in Hampton Roads",
  }),
  match: Object.freeze({ score: 2, reasons: Object.freeze(["Business planning service", "Serves Hampton Roads"]) }),
  publishedAt: "2026-08-01T12:00:00.000Z",
  updatedAt: "2026-08-10T12:00:00.000Z",
});

const unpublishedProvider = Object.freeze({
  ...provider,
  organizationId: "org-suppressed",
  displayName: "Suppressed Provider",
  territory: Object.freeze({ ...provider.territory, geographyId: "geo-private", releaseState: "restricted" }),
  marker: null,
});

const publishedResource = Object.freeze({
  id: "resource-1",
  organizationId: "org-provider",
  version: 2,
  kind: "program",
  title: "Growth planning clinic",
  summary: "A bounded planning clinic for growing businesses.",
  description: "Participants work with an advisor on milestones, operating assumptions, and next actions.",
  serviceIds: Object.freeze(["service-1"]),
  geographyIds: Object.freeze(["geo-service-1"]),
  modalities: Object.freeze(["virtual"]),
  eligibility: "Current small business owner",
  intakeUrl: "https://example.org/intake",
  startsAt: "2026-09-01T13:00:00.000Z",
  endsAt: "2026-09-30T21:00:00.000Z",
  visibility: "network",
  status: "published",
  publishedAt: "2026-08-10T12:00:00.000Z",
  withdrawnAt: null,
  createdAt: "2026-08-05T12:00:00.000Z",
  updatedAt: "2026-08-10T12:00:00.000Z",
  providerDisplayName: "Regional Business Support Center",
});

const draftResource = Object.freeze({
  ...publishedResource,
  id: "resource-draft",
  title: "Private draft",
  status: "draft",
  publishedAt: null,
});

const providerRequest = Object.freeze({
  role: "sender",
  id: "request-1",
  version: 2,
  senderOrganizationId: "org-viewer",
  recipientLabel: "Regional Business Support Center",
  recipientKind: "organization",
  recipientOrganizationId: "org-provider",
  need: "introduction",
  summary: "We need help structuring a growth plan.",
  urgency: "standard",
  preferredContactMethod: "platform",
  purpose: "provider-connection",
  opportunityReference: null,
  providerContext: Object.freeze({ providerOrganizationId: "org-provider", serviceId: "service-1", publicationVersion: 3 }),
  providerRedirect: null,
  sharedFields: Object.freeze(["sender-organization", "summary"]),
  status: "sent",
  outcome: null,
  correlationId: "correlation-1",
  notificationStatus: "accepted",
  createdAt: "2026-08-11T12:00:00.000Z",
  sentAt: "2026-08-11T12:00:00.000Z",
  expiresAt: "2026-09-10T12:00:00.000Z",
  updatedAt: "2026-08-11T12:00:00.000Z",
});

const ordinaryReferral = Object.freeze({
  ...providerRequest,
  id: "referral-ordinary",
  purpose: "business-introduction",
  providerContext: null,
});

function projection({
  authorization = { openPlatform: true, referralManage: true, resourceManage: true },
  providers = [provider],
  resources = [publishedResource],
  requests = [providerRequest],
  selection = {},
} = {}) {
  return buildResourcesMobileProjection({
    viewerOrganizationId: "org-viewer",
    geography: { id: "geo-home", label: "Isle of Wight County" },
    providers,
    resources,
    requests,
    authorization,
    copy,
    selection,
    camera: null,
    sheetState: Object.freeze({
      sheetSnapPoint: "partial",
      sheetScrollPosition: 0,
      content: "results",
      detailContext: null,
    }),
  });
}

test("Resources binds exactly four governed actions with independent authorization truth", () => {
  const result = projection({
    authorization: { openPlatform: true, referralManage: false, resourceManage: false },
  });
  assert.deepEqual(result.actionRail.actions.map((action) => action.id), [
    "resources.find-providers",
    "resources.browse-resources",
    "resources.my-requests",
    "resources.provider-status",
  ]);
  assert.deepEqual(result.actionRail.actions.map((action) => action.position), [1, 2, 3, 4]);
  assert.equal(result.actionRail.actions[0].availability, "enabled");
  assert.equal(result.actionRail.actions[1].availability, "enabled");
  assert.equal(result.actionRail.actions[2].availability, "disabled");
  assert.equal(result.actionRail.actions[2].disabledReason, "not-authorized");
  assert.equal(result.actionRail.actions[3].availability, "disabled");
  assert.equal(result.actionRail.actions[3].disabledReason, "not-authorized");

  const external = projection({ selection: { providerOrganizationId: "org-provider" } });
  assert.equal(external.actionRail.actions[3].availability, "disabled");
  assert.equal(external.actionRail.actions[3].disabledReason, "not-applicable");
});

test("only current released providers and published resources become shared cards", () => {
  const result = projection({
    providers: [provider, unpublishedProvider],
    resources: [publishedResource, draftResource],
  });
  assert.equal(result.providerCards.length, 1);
  assert.equal(result.providerCards[0].identity.subjectKind, "organization");
  assert.equal(result.providerCards[0].indicator.value, "Official Resource Provider");
  assert.equal(result.resourceCards.length, 1);
  assert.equal(result.resourceCards[0].identity.subjectKind, "record");
  assert.equal(result.resourceCards[0].identity.recordType, "provider-resource");
  assert.equal(result.resourceCards[0].organizationIdentity, provider.displayName);
  assert.equal(result.resourceCards[0].locality, provider.territory.name);
  assert.ok(result.resourceCards[0].metadata.some((item) => item.id === "eligibility" && item.value === publishedResource.eligibility));
  assert.equal(result.resourceCards[0].media, null);
});

test("service territory uses authoritative area geometry while provider marker stays distinct", () => {
  const result = projection({ selection: { resourceId: "resource-1", source: "card" } });
  assert.equal(result.serviceTerritories.length, 1);
  assert.equal(result.serviceTerritories[0].area.kind, "area");
  assert.equal(result.serviceTerritories[0].area.geographyId, "geo-service-1");
  assert.strictEqual(result.serviceTerritories[0].geometry, geometry);
  assert.equal(result.serviceTerritories[0].area.selected, true);

  const providerMarker = result.map.objects.find((object) => object.kind === "organization");
  assert.ok(providerMarker);
  assert.equal(providerMarker.markerId, "marker-provider");
  assert.equal(result.map.objects.some((object) => object.kind === "record"), false);
  assert.equal(RESOURCES_MOBILE_PROJECTION_POLICY.resourceMarkersAreNeverFabricated, true);
});

test("resource selection keeps provider, marker, card, area, and detail coherent", () => {
  const result = projection({ selection: { resourceId: "resource-1", source: "card" } });
  assert.equal(result.selection.kind, "record");
  assert.equal(result.selection.selectedRecord.recordType, "provider-resource");
  assert.equal(result.selection.selectedOrganization.organizationId, "org-provider");
  assert.equal(result.selection.selectedMarker.role, "associated-organization");
  assert.equal(selectionMatchesCard(result.selection, result.resourceCards[0]), true);
  const providerMarker = result.map.objects.find((object) => object.kind === "organization");
  assert.equal(selectionMatchesMapObject(result.selection, providerMarker), true);
  assert.equal(result.detail.status, "open");
  assert.equal(result.detail.detailContext.identity.recordId, "resource-1");
  assert.equal(result.sheet.cards.includes(result.resourceCards[0]), true);
});

test("Resource favorite remains visibly disabled until a governed persistence relation exists", () => {
  const result = projection();
  const favorite = result.resourceCards[0].favorite;
  assert.equal(favorite.visible, true);
  assert.equal(favorite.availability, "disabled");
  assert.equal(favorite.disabledReason, "not-operational");
  assert.equal(favorite.favorited, null);
  assert.equal(favorite.handler, null);
  assert.equal(RESOURCES_MOBILE_PROJECTION_POLICY.favoritePersistenceRequiresResourcesDomainAuthority, true);
});

test("request cards require exact provider-purpose records and referral.manage", () => {
  const denied = projection({
    requests: [providerRequest, ordinaryReferral],
    authorization: { openPlatform: true, referralManage: false, resourceManage: true },
  });
  assert.equal(denied.requestCards.length, 0);
  assert.equal(denied.actionRail.actions[2].availability, "disabled");

  const allowed = projection({ requests: [providerRequest, ordinaryReferral] });
  assert.equal(allowed.requestCards.length, 1);
  assert.equal(allowed.requestCards[0].identity.recordType, "provider-request");
  assert.equal(allowed.requestCards[0].identity.recordId, "request-1");
});

test("closed Exchange authority projects no provider, resource, request, or map disclosure", () => {
  const result = projection({
    providers: [provider],
    resources: [publishedResource],
    requests: [providerRequest],
    authorization: { openPlatform: false, referralManage: true, resourceManage: true },
  });
  assert.equal(result.providerCards.length, 0);
  assert.equal(result.resourceCards.length, 0);
  assert.equal(result.requestCards.length, 0);
  assert.equal(result.map.objects.length, 0);
  assert.ok(result.actionRail.actions.every((action) => action.availability === "disabled"));
  assert.equal(RESOURCES_MOBILE_PROJECTION_POLICY.providerStatusIsNeverClientDerived, true);
  assert.equal(RESOURCES_MOBILE_PROJECTION_POLICY.paymentNeverGrantsProviderStatus, true);
});
