import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  buildResourcesMobileProjection,
  resourcesMobileCopy,
} from "../src/application/resource-network/mobile-resource-exchange.ts";
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
    availability: "available",
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
  assert.deepEqual(projection.discovery.spatialResults.map((result) => result.kind), ["mapped", "list-only", "list-only"]);
});

test("private request hydration fails closed without blocking public Resources discovery", () => {
  const projection = project({ authorization: { openPlatform: true, referralManage: false, resourceManage: false } });
  assert.equal(projection.requestCards.length, 0);
  assert.equal(projection.providerCards.length, 1);
  assert.equal(projection.resourceCards.length, 1);
  assert.equal(projection.discovery.results.status, "ready");
});

test("route hydration gates private adjuncts and settles them independently from public discovery", () => {
  const page = fs.readFileSync(new URL("../app/resources/page.tsx", import.meta.url), "utf8");
  assert.match(page, /const referralsPromise = referralManage/);
  assert.match(page, /const ownerPromise = resourceManage/);
  assert.match(page, /Promise\.allSettled/);
  assert.match(page, /referralsResult\.status === "fulfilled" \? referralsResult\.value : \[\]/);
  assert.match(page, /ownerResult\.status === "fulfilled" \? ownerResult\.value : null/);
  assert.doesNotMatch(page, /throw referralsResult\.reason|throw ownerResult\.reason/);
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
  }
});
