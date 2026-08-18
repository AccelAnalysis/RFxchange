import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  buildResourcesMobileProjection,
  resourcesMobileCopy,
  resourcesMobileValueLabel,
} from "../src/application/resource-network/mobile-resource-exchange.ts";
import { matchesResourceDiscoveryTerms, resourceDiscoveryTerms } from "../src/application/resource-network/resource-discovery-query.ts";
import { parseResourcesMobileWorkspaceQuery } from "../src/application/resource-network/resource-network-workspace.ts";

const NOW = "2026-08-18T12:00:00.000Z";
const provider = Object.freeze({
  organizationId: "org-provider",
  displayName: "Neighborhood Enterprise Center",
  publicationVersion: 2,
  sourceProfileVersion: 3,
  categories: ["technical-assistance"],
  services: [{ id: "service-capital", name: "Capital readiness", description: "Application support", availability: "available" }],
  populationsServed: "Local businesses",
  eligibility: "Organizations in the released locality",
  intakeMethod: "Platform request",
  modalities: ["virtual"],
  languages: ["English"],
  availability: "available",
  territory: { geographyId: "geo-1", name: "Released locality", releaseState: "released", geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } },
  marker: { id: "marker-provider", coordinate: [-77.01, 38.91], accessibleLocationLabel: "Approximate provider location", privacyTreatment: "approximate" },
  match: { score: 25, reasons: ["Serves this locality"] },
  publishedAt: NOW,
  updatedAt: NOW,
});
const resource = Object.freeze({
  id: "resource-1",
  organizationId: "org-provider",
  version: 2,
  kind: "program",
  title: "Capital readiness clinic",
  summary: "Application preparation support.",
  description: "A real published provider resource.",
  serviceIds: ["service-capital"],
  geographyIds: ["geo-1"],
  modalities: ["virtual"],
  eligibility: "Organizations in the locality",
  intakeUrl: null,
  startsAt: null,
  endsAt: null,
  visibility: "network",
  status: "published",
  publishedAt: NOW,
  withdrawnAt: null,
  createdAt: NOW,
  updatedAt: NOW,
  providerDisplayName: "Neighborhood Enterprise Center",
});
const request = Object.freeze({
  id: "request-1",
  role: "sender",
  purpose: "provider-connection",
  providerContext: { providerOrganizationId: "org-provider", serviceId: "service-capital", publicationVersion: 2 },
  recipientLabel: "Neighborhood Enterprise Center",
  senderOrganizationName: "Requester Works",
  summary: "We need capital-readiness support.",
  status: "sent",
  updatedAt: NOW,
});

function project(overrides = {}) {
  return buildResourcesMobileProjection({
    viewerOrganizationId: "org-viewer",
    geography: { id: "geo-1", label: "Released locality" },
    providers: [provider],
    resources: [resource],
    requests: [request],
    authorization: { openPlatform: true, referralManage: true, resourceManage: false },
    locale: "en-US",
    search: "capital",
    availability: "all",
    selection: {},
    ...overrides,
  });
}

test("Resources projects real providers, resources, requests and authoritative geography without duplicate markers", () => {
  const projection = project();
  assert.deepEqual(projection.actionRail.actions.map((action) => action.id), [
    "resources.offer-request",
    "resources.manage-view",
    "resources.share",
    "resources.save",
  ]);
  assert.equal(projection.discovery.results.status, "ready");
  assert.equal(projection.discovery.results.cards.length, 3);
  assert.equal(projection.discovery.map.objects.filter((object) => object.kind === "organization").length, 1);
  assert.equal(projection.discovery.map.objects.filter((object) => object.kind === "record").length, 0);
  assert.equal(projection.discovery.map.objects.find((object) => object.kind === "organization").privacy, "approximate");
  assert.equal(projection.serviceTerritories[0].geometry, provider.territory.geometry);
  assert.equal(projection.serviceTerritories[0].area.selectable, false);
  assert.equal(projection.serviceTerritories[0].area.associationSelectionKey, null);
  assert.deepEqual(projection.discovery.spatialResults.map((result) => result.kind), ["mapped", "list-only", "list-only"]);
});

test("private request hydration fails closed without blocking public Resources discovery", () => {
  const projection = project({ authorization: { openPlatform: true, referralManage: false, resourceManage: false } });
  assert.equal(projection.requestCards.length, 0);
  assert.equal(projection.providerCards.length, 1);
  assert.equal(projection.resourceCards.length, 1);
  assert.equal(projection.discovery.results.status, "ready");
});

test("valid long domain text is safely excerpted for bounded shared cards", () => {
  const projection = project({
    providers: [{
      ...provider,
      populationsServed: "p".repeat(2_000),
      eligibility: "e".repeat(2_000),
      services: [{ ...provider.services[0], name: "s".repeat(160), description: "d".repeat(600) }],
    }],
    resources: [{ ...resource, summary: "r".repeat(600), eligibility: "i".repeat(1_200) }],
    requests: [{ ...request, summary: "q".repeat(1_200) }],
    search: "",
  });
  for (const card of projection.discovery.results.cards) {
    assert.equal((card.summary?.length ?? 0) <= 240, true);
    assert.equal(card.metadata.every((item) => item.value.length <= 240), true);
  }
});

test("Resources filters every result family coherently and keeps private requests outside availability filtering", () => {
  const resourceSearch = project({ search: "preparation" });
  assert.deepEqual(resourceSearch.discovery.results.cards.map((card) => card.identity.selectionKey), [
    "organization:org-provider",
    "provider-resource:resource-1",
  ]);
  const availability = project({ search: "capital", availability: "available" });
  assert.deepEqual(availability.discovery.results.cards.map((card) => card.identity.selectionKey), [
    "organization:org-provider",
    "provider-resource:resource-1",
  ]);
  assert.equal(project({ search: "unmatched" }).discovery.results.status, "empty");
});

test("server and card query helpers require every bounded Unicode-aware term", () => {
  const terms = resourceDiscoveryTerms("  Solar  retrofit SOLAR  aide-économique ");
  assert.deepEqual(terms, ["solar", "retrofit", "aide", "économique"]);
  assert.equal(matchesResourceDiscoveryTerms(["Solar retrofit", "Aide économique"], terms), true);
  assert.equal(matchesResourceDiscoveryTerms(["Solar retrofit only"], terms), false);
  assert.equal(resourceDiscoveryTerms("a ".repeat(100)).length <= 20, true);
});

test("coincident provider territories render once and never invent a provider selection target", () => {
  const secondProvider = Object.freeze({
    ...provider,
    organizationId: "org-provider-2",
    displayName: "Second Provider",
    marker: { ...provider.marker, id: "marker-provider-2" },
  });
  const projection = project({ providers: [provider, secondProvider], search: "" });
  assert.equal(projection.serviceTerritories.length, 1);
  assert.equal(projection.serviceTerritories[0].area.selectable, false);
  assert.equal(projection.serviceTerritories[0].area.associationSelectionKey, null);
});

test("card and rail destinations preserve bounded RFx origin and current discovery context", () => {
  const projection = project({
    navigationContext: {
      query: "capital",
      availability: "all",
      rfxReference: "RFX-47",
      rfxGap: "Need capital readiness",
      returnTo: "/opportunities/RFX-47/assess?tab=gaps#gap-2",
    },
  });
  const hrefs = [
    ...projection.discovery.results.cards.flatMap((card) => [
      card.detailContext.canonicalHref,
      ...card.recordActions.map((action) => action.handler?.kind === "href" ? action.handler.href : null),
    ]),
    ...projection.actionRail.actions.map((action) => action.handler?.kind === "href" ? action.handler.href : null),
  ].filter(Boolean);
  assert.equal(hrefs.length > 0, true);
  for (const href of hrefs) {
    const parsed = new URL(href, "https://participant.invalid");
    assert.equal(parsed.searchParams.get("rfxReference"), "RFX-47", href);
    assert.equal(parsed.searchParams.get("rfxGap"), "Need capital readiness", href);
    assert.equal(parsed.searchParams.get("returnTo"), "/opportunities/RFX-47/assess?tab=gaps#gap-2", href);
    assert.equal(parsed.searchParams.get("q"), "capital", href);
  }
});

test("maximum discovery text cannot overflow shared canonical destinations", () => {
  const projection = project({
    search: "preparation",
    navigationContext: {
      query: "long-query ".repeat(20),
      availability: "available",
      rfxReference: "RFX-47",
      rfxGap: "Need capital readiness",
      returnTo: "/opportunities/RFX-47/assess?tab=gaps#gap-2",
    },
  });
  const resourceCard = projection.discovery.results.cards.find((card) => card.identity.recordType === "provider-resource");
  assert.ok(resourceCard?.detailContext.canonicalHref);
  assert.equal(resourceCard.detailContext.canonicalHref.length <= 240, true);
  const parsed = new URL(resourceCard.detailContext.canonicalHref, "https://participant.invalid");
  assert.equal(parsed.searchParams.get("resource"), resource.id);
  assert.equal(parsed.searchParams.get("rfxReference"), "RFX-47");
  assert.equal(parsed.searchParams.get("returnTo"), "/opportunities/RFX-47/assess?tab=gaps#gap-2");
});

test("route hydration gates private adjuncts and settles them independently from public discovery", () => {
  const page = fs.readFileSync(new URL("../app/resources/page.tsx", import.meta.url), "utf8");
  assert.match(page, /const referralsPromise = referralManage/);
  assert.match(page, /const ownerPromise = resourceManage/);
  assert.match(page, /Promise\.allSettled/);
  assert.match(page, /referralsResult\.status === "fulfilled" \? referralsResult\.value : \[\]/);
  assert.match(page, /ownerResult\.status === "fulfilled" \? ownerResult\.value : null/);
  assert.doesNotMatch(page, /throw referralsResult\.reason|throw ownerResult\.reason/);
  const workspace = fs.readFileSync(new URL("../src/components/resource-network/ResourceNetworkWorkspace.tsx", import.meta.url), "utf8");
  assert.match(workspace, /authorization\.referralManage \? <form action=\{connect\}/);
  assert.match(workspace, /data-resources-mobile-operations/);
  assert.match(workspace, /resource-management-mobile/);
});

test("selection preserves complete provider association and marker identity", () => {
  const selected = project({ selection: { resourceId: "resource-1", source: "card" } }).selection;
  assert.equal(selected.selectionKey, "provider-resource:resource-1");
  assert.equal(selected.focalIdentity.recordId, "resource-1");
  assert.equal(selected.selectedOrganization.selectionKey, "organization:org-provider");
  assert.equal(selected.selectedMarker.selectionKey, "organization:org-provider");
  assert.equal(selected.selectedMarker.markerId, "marker-provider");
});

test("missing coordinates remain truthful list-only results", () => {
  const projection = project({ providers: [{ ...provider, marker: null }] });
  const providerSpatial = projection.discovery.spatialResults.find((result) => result.identity.selectionKey === "organization:org-provider");
  assert.deepEqual(providerSpatial, {
    kind: "list-only",
    identity: providerSpatial.identity,
    reason: "missing-authoritative-coordinate",
    explanationKey: "mobileExchange.results.listOnly.missingCoordinate",
  });
  assert.equal(projection.discovery.map.objects.some((object) => object.kind === "organization"), false);
});

test("RFx gap origin is bounded, same-origin and preserved as non-authorizing query context", () => {
  const parsed = parseResourcesMobileWorkspaceQuery({
    q: "capital",
    rfxReference: "RFX-47",
    rfxGap: `  ${"gap ".repeat(80)} `,
    returnTo: "/opportunities/RFX-47/assess?tab=gaps#gap-2",
  });
  assert.equal(parsed.rfxReference, "RFX-47");
  assert.equal(parsed.rfxGap.length, 240);
  assert.equal(parsed.returnTo, "/opportunities/RFX-47/assess?tab=gaps#gap-2");
  assert.equal(parseResourcesMobileWorkspaceQuery({ returnTo: "https://evil.example/opportunities" }).returnTo, null);
  assert.equal(parseResourcesMobileWorkspaceQuery({ returnTo: "/account" }).returnTo, null);
  assert.equal(parseResourcesMobileWorkspaceQuery({ rfxReference: "RFX-47", returnTo: "/opportunities/RFX-OTHER/assess" }).returnTo, null);
});

test("Resources-owned copy is complete for the repository five-locale set", () => {
  for (const locale of ["en-US", "es", "fr", "it", "de"]) {
    const copy = resourcesMobileCopy(locale);
    assert.equal(Object.values(copy).every((value) => typeof value === "string" && value.length > 0), true, locale);
    for (const value of ["available", "limited", "unknown", "program", "funding-program", "technical-assistance", "published", "sent"]) {
      assert.equal(resourcesMobileValueLabel(locale, value) === value, false, `${locale}:${value}`);
    }
  }
});
