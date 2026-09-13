import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { discoverPublicResourceListings } from "../src/application/resource-network/public-resource-catalog.ts";
import { buildResourcesMobileProjection } from "../src/application/resource-network/mobile-resource-exchange.ts";
import { adaptLensMapProjection, createLensProjectionRenderModel } from "../src/application/participant/lens-map-projection-adapter.ts";
import { selectionMatchesCard, selectionMatchesMapObject } from "../src/application/participant/mobile-exchange-contracts.ts";

const scope = { geographyId: "us-va-portsmouth", releaseState: "released" };
const listings = discoverPublicResourceListings(scope);
const input = {
  viewerOrganizationId: "org-viewer", geography: { id: scope.geographyId, label: "Portsmouth" },
  providers: [], resources: [], requests: [], listings,
  authorization: { openPlatform: true, referralManage: true, resourceManage: true },
  locale: "en-US", search: "", availability: "all",
};

test("source catalog exposes all 32 public records and only the 22 accepted coordinates", async () => {
  const geocodes = JSON.parse(await readFile(new URL("../data/convergence/hampton-roads-va/geocodes.json", import.meta.url)));
  assert.equal(listings.length, 32);
  assert.equal(listings.filter((listing) => listing.coordinate).length, 22);
  for (const listing of listings) {
    const accepted = geocodes.accepted[listing.id];
    assert.deepEqual(listing.coordinate, accepted ? [accepted.longitude, accepted.latitude] : null);
    assert.equal("organizationId" in listing, false);
    assert.equal("intendedClaimState" in listing, false);
    assert.equal("primarySourceId" in listing, false);
  }
});

test("discovery remains scoped and never invents availability", () => {
  assert.deepEqual(discoverPublicResourceListings({ ...scope, releaseState: "restricted" }), []);
  assert.deepEqual(discoverPublicResourceListings({ ...scope, releaseState: "visible-unreleased" }), []);
  assert.deepEqual(discoverPublicResourceListings({ ...scope, geographyId: "us-ca-los-angeles" }), []);
  assert.deepEqual(discoverPublicResourceListings({ ...scope, availability: "available" }), []);
  assert.equal(discoverPublicResourceListings({ ...scope, availability: "unknown" }).length, 32);
});

test("search finds names, aliases, service descriptions and addresses with matching map results", () => {
  for (const search of ["HRSBDC", "capital", "101 W Main", "Portsmouth"]) {
    const server = discoverPublicResourceListings({ ...scope, query: search });
    assert.ok(server.length > 0, search);
    const result = buildResourcesMobileProjection({ ...input, listings: server, search });
    assert.equal(result.discovery.results.cards.length, server.length);
    assert.equal(result.discovery.map.objects.length, server.filter((listing) => listing.coordinate).length);
  }
  assert.equal(discoverPublicResourceListings({ ...scope, query: "zz-no-match" }).length, 0);
});

test("map and cards select the same resource, with no account, approval or private request authority", () => {
  const listing = listings.find((entry) => entry.coordinate);
  for (const locale of ["en-US", "es", "fr", "de", "it"]) {
    const result = buildResourcesMobileProjection({ ...input, locale, selection: { resourceId: listing.id, source: "marker" } });
    const card = result.discovery.results.cards.find((card) => card.identity.recordId === listing.id);
    const marker = result.discovery.map.objects.find((object) => object.identity?.recordId === listing.id);
    assert.ok(selectionMatchesCard(result.selection, card));
    assert.ok(selectionMatchesMapObject(result.selection, marker));
    assert.equal(card.identity.organizationId, null);
    assert.deepEqual(card.classifications, []);
    assert.equal(result.selection.selectedOrganization, null);
    assert.equal(result.actionRail.actions.find((action) => action.id === "resources.offer-request").availability, "disabled");
    assert.match(card.detailContext.canonicalHref, /resource=hrva-/);
  }
});

test("normal renderer clusters distant zooms, expands with zoom, and preserves selected markers", () => {
  const result = buildResourcesMobileProjection(input);
  const adapter = adaptLensMapProjection(result.discovery.map, result.selection);
  const wide = createLensProjectionRenderModel(adapter, [], { zoom: 8 });
  const close = createLensProjectionRenderModel(adapter, [], { zoom: 16 });
  assert.ok(wide.clusterByRenderId.size > 0);
  assert.ok(wide.data.features.length < close.data.features.length);
  assert.equal(close.selectableByRenderId.size, 22);
  assert.equal(wide.data.features.reduce((sum, feature) => sum + (feature.properties.kind === "cluster" ? feature.properties.count : 1), 0), 22);
  const listing = listings.find((entry) => entry.coordinate);
  const selected = buildResourcesMobileProjection({ ...input, selection: { resourceId: listing.id } });
  const rendered = createLensProjectionRenderModel(adaptLensMapProjection(selected.discovery.map, selected.selection), [], { zoom: 8 });
  assert.ok(rendered.data.features.some((feature) => feature.properties.selectionKey === `public-resource:${listing.id}` && feature.properties.selected === 1));
  assert.equal(result.discovery.results.cards.length, 32);
});

test("missing coordinates remain accessible in results and cannot inherit the user's marker", () => {
  const listing = listings.find((entry) => !entry.coordinate);
  const result = buildResourcesMobileProjection({ ...input, selection: { resourceId: listing.id } });
  assert.equal(result.selection.selectedMarker, null);
  assert.equal(result.discovery.spatialResults.find((entry) => entry.identity.recordId === listing.id).kind, "list-only");
  const closed = buildResourcesMobileProjection({ ...input, authorization: { ...input.authorization, openPlatform: false } });
  assert.equal(closed.discovery.results.cards.length, 0);
  assert.equal(closed.discovery.map.objects.length, 0);
});
