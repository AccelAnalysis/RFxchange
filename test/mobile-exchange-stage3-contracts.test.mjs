import assert from "node:assert/strict";
import test from "node:test";

import { supportedLocales } from "../src/i18n/config.ts";
import {
  createExchangeGeographyContext,
  createExchangeLensQuery,
  createExchangeMapClusterProjection,
  createExchangeMapObjectProjection,
  createExchangeSubjectIdentity,
  createLensDiscoveryProjection,
  createLensMapProjection,
  createLensResultCardModel,
  createLensResultSetState,
  listOnlyMapObjects,
  projectDomainOwnedSaveState,
  resultCardMatchesMapObject,
} from "../src/application/participant/mobile-exchange-contracts.ts";

const identity = createExchangeSubjectIdentity({
  subjectKind: "record",
  selectionKey: "record:resource-1",
  organizationId: "org-provider",
  recordType: "resource",
  recordId: "resource-1",
});

const hiddenSave = projectDomainOwnedSaveState({
  visible: true,
  favorited: null,
  operational: false,
  applicable: true,
  authorized: true,
  handler: null,
});

function card() {
  return createLensResultCardModel({
    lens: "resources",
    identity,
    title: "Real resource record",
    accessibleLabel: "Open real resource record",
    organizationIdentity: "Provider organization",
    locality: "Example locality",
    summary: "Server-projected summary",
    status: { label: "Availability", value: "Available", emphasis: "positive" },
    dates: { updatedAt: "2026-08-18T12:00:00.000Z" },
    classifications: [{ id: "amacs:capability-1", label: "Capability", value: "Capability 1" }],
    favorite: hiddenSave,
    canonicalHref: "/resources/resource-1",
    returnLens: "resources",
  });
}

test("Stage 3 query contract preserves all five locales and validates presentation state", () => {
  for (const locale of supportedLocales) {
    const query = createExchangeLensQuery({
      lens: "resources",
      locale,
      geographyId: "geo-1",
      camera: { longitude: -76.7, latitude: 36.8, zoom: 11, pitch: 0, bearing: 0, viewMode: "2d" },
      bounds: { west: -77, south: 36, east: -76, north: 37 },
      search: "  fabrication  ",
      filters: { capability: ["welding", "welding", "machining"], available: true },
      sort: { id: "updated", direction: "descending" },
      cursor: "cursor-1",
      resultPage: 2,
    });
    assert.equal(query.locale, locale);
    assert.equal(query.search, "fabrication");
    assert.deepEqual(query.filters.capability, ["welding", "machining"]);
    assert.equal(query.resultPage, 2);
    assert.ok(Object.isFrozen(query));
  }

  assert.throws(() => createExchangeLensQuery({ lens: "resources", locale: "en", geographyId: "geo-1" }), /Unsupported Exchange locale/);
  assert.throws(() => createExchangeLensQuery({ lens: "resources", locale: "en-US", geographyId: "geo-1", cursor: " " }), /Result cursor/);
  assert.throws(() => createExchangeLensQuery({ lens: "resources", locale: "en-US", geographyId: "geo-1", resultPage: 0 }), /positive integer/);
  assert.throws(() => createExchangeLensQuery({ lens: "resources", locale: "en-US", geographyId: "geo-1", bounds: { west: 20, south: 10, east: 10, north: 20 } }), /ordered/);
  assert.throws(() => createExchangeLensQuery({ lens: "resources", locale: "en-US", geographyId: "geo-1", filters: { broken: Number.NaN } }), /non-finite/);
});

test("Stage 3 map contract preserves identity and never fabricates missing coordinates", () => {
  const mapped = createExchangeMapObjectProjection({
    identity,
    markerId: "marker-resource-1",
    coordinate: { longitude: -76.7, latitude: 36.8 },
    privacy: "approximate",
    accessibleLabel: "Resource record on map",
    selectable: true,
    layerIds: ["resources"],
  });
  const listOnly = createExchangeMapObjectProjection({
    identity: createExchangeSubjectIdentity({
      subjectKind: "record",
      selectionKey: "record:resource-2",
      organizationId: "org-provider",
      recordType: "resource",
      recordId: "resource-2",
    }),
    markerId: "marker-resource-2",
    coordinate: null,
    privacy: "locality-only",
    accessibleLabel: "Resource record available in list only",
    selectable: true,
    layerIds: ["resources"],
  });
  const cluster = createExchangeMapClusterProjection({
    clusterId: "cluster-resources-1",
    coordinate: { longitude: -76.72, latitude: 36.82 },
    count: 4,
    accessibleLabel: "Four resources",
    layerIds: ["resources"],
  });
  const map = createLensMapProjection({
    lens: "resources",
    geography: createExchangeGeographyContext({ geographyId: "geo-1", label: "Example", serverRevalidated: true }),
    objects: [mapped, listOnly, cluster],
    activeLayerIds: ["resources"],
    layerStateAuthority: "domain-revalidated",
  });

  assert.equal(listOnly.coordinate, null);
  assert.equal(listOnly.selectable, true);
  assert.deepEqual(listOnlyMapObjects(map).map((object) => object.identity.selectionKey), ["record:resource-2"]);
  assert.equal(resultCardMatchesMapObject(card(), mapped), true);
  assert.throws(() => createExchangeMapObjectProjection({ ...mapped, coordinate: { longitude: 181, latitude: 0 } }), /outside valid/);
  assert.throws(() => createExchangeMapObjectProjection({ ...mapped, privacy: "suppressed" }), /cannot disclose coordinates/);
  assert.throws(() => createExchangeMapClusterProjection({ clusterId: "bad", coordinate: { longitude: 0, latitude: 0 }, count: 1, accessibleLabel: "Bad" }), /at least two/);
});

test("Stage 3 result states are explicit, immutable, lens-coherent, and domain-owned", () => {
  const resultCard = card();
  assert.equal(resultCard.lens, "resources");
  assert.equal(resultCard.accessibleLabel, "Open real resource record");
  assert.equal(resultCard.status.value, "Available");
  assert.equal(resultCard.dates.updatedAt, "2026-08-18T12:00:00.000Z");
  assert.equal(hiddenSave.availability, "hidden");
  assert.equal(hiddenSave.persistenceOwner, "domain");

  const ready = createLensResultSetState({ status: "ready", lens: "resources", resultSetId: "set-1", cards: [resultCard] });
  const empty = createLensResultSetState({ status: "empty", lens: "resources", resultSetId: "set-empty", messageKey: "resources.empty" });
  const unavailable = createLensResultSetState({ status: "unavailable", lens: "capabilities", messageKey: "capabilities.unavailable" });
  const restricted = createLensResultSetState({ status: "restricted", lens: "resources", messageKey: "resources.restricted" });
  const loading = createLensResultSetState({ status: "loading", lens: "resources", messageKey: "resources.loading" });
  const error = createLensResultSetState({ status: "error", lens: "resources", messageKey: "resources.error", recovery: { kind: "intent", intent: "retry" } });
  assert.deepEqual([loading.status, ready.status, empty.status, unavailable.status, restricted.status, error.status], ["loading", "ready", "empty", "unavailable", "restricted", "error"]);
  assert.ok([empty, unavailable, restricted, loading, error].every((state) => state.cards.length === 0));
  assert.throws(() => createLensResultSetState({ status: "ready", lens: "resources", resultSetId: "set", cards: [] }), /cannot stand in for an empty/);
  assert.throws(() => createLensResultSetState({ status: "restricted", lens: "resources", resultSetId: "private-set", messageKey: "restricted" }), /cannot retain a protected/);
  assert.throws(() => createLensResultSetState({ status: "error", lens: "resources", messageKey: "error", recovery: { kind: "href", href: "//example.com/leak" } }), /same-origin/);
  assert.throws(() => createLensResultCardModel({ ...resultCard, lens: "intelligence", returnLens: "resources", favorite: hiddenSave }), /must match/);
});

test("whole-lens discovery requires server geography, domain layers, and one spatial disposition per ready card", () => {
  const resultCard = card();
  const mapped = createExchangeMapObjectProjection({
    identity,
    markerId: "marker-resource-1",
    coordinate: { longitude: -76.7, latitude: 36.8 },
    privacy: "approximate",
    accessibleLabel: "Resource record on map",
    selectable: true,
    layerIds: ["resources"],
  });
  const map = createLensMapProjection({
    lens: "resources",
    geography: createExchangeGeographyContext({ geographyId: "geo-1", serverRevalidated: true }),
    objects: [mapped],
    activeLayerIds: ["resources"],
    layerStateAuthority: "domain-revalidated",
  });
  const results = createLensResultSetState({ status: "ready", lens: "resources", resultSetId: "set-1", cards: [resultCard] });
  const discovery = createLensDiscoveryProjection({
    lens: "resources",
    queryId: "query-1",
    map,
    results,
    spatialResults: [{ kind: "mapped", identity, markerId: "marker-resource-1" }],
  });
  assert.equal(discovery.authoritySource, "server-derived");
  assert.throws(() => createLensDiscoveryProjection({ lens: "resources", queryId: "query-1", map, results, spatialResults: [] }), /exactly one/);
  const carried = createLensMapProjection({ ...map, geography: createExchangeGeographyContext({ geographyId: "geo-1", serverRevalidated: false }) });
  assert.throws(() => createLensDiscoveryProjection({ lens: "resources", queryId: "query-1", map: carried, results, spatialResults: [{ kind: "mapped", identity, markerId: "marker-resource-1" }] }), /server-revalidated geography/);
});
