import assert from "node:assert/strict";
import test from "node:test";

import {
  adaptLensMapProjection,
  createLensProjectionRenderModel,
  lensMapObjectForRenderId,
  lensProjectionContainsOrganizationMarker,
} from "../src/application/participant/lens-map-projection-adapter.ts";
import {
  createExchangeGeographyContext,
  createExchangeMapAreaProjection,
  createExchangeMapClusterProjection,
  createExchangeMapObjectProjection,
  createExchangeSelectionState,
  createExchangeSubjectIdentity,
  createLensMapProjection,
} from "../src/application/participant/mobile-exchange-contracts.ts";

const identity = createExchangeSubjectIdentity({
  subjectKind: "organization",
  selectionKey: "organization:org-1",
  organizationId: "org-1",
  recordType: null,
  recordId: null,
});
const selection = createExchangeSelectionState({
  kind: "organization",
  source: "keyboard",
  selectedOrganization: { selectionKey: identity.selectionKey, organizationId: identity.organizationId },
});
function projection(serverRevalidated = true, layerStateAuthority = "domain-revalidated") {
  return createLensMapProjection({
    lens: "intelligence",
    geography: createExchangeGeographyContext({ geographyId: "geo-1", serverRevalidated }),
    activeLayerIds: ["network"],
    layerStateAuthority,
    objects: [
      createExchangeMapObjectProjection({
        identity,
        markerId: "marker-org-1",
        coordinate: { longitude: -76.7, latitude: 36.8 },
        privacy: "exact",
        accessibleLabel: "Organization one",
        selectable: true,
        layerIds: ["network"],
      }),
      createExchangeMapObjectProjection({
        identity: createExchangeSubjectIdentity({ subjectKind: "record", selectionKey: "record:private", organizationId: null, recordType: "intelligence", recordId: "private" }),
        markerId: "marker-private",
        coordinate: null,
        privacy: "suppressed",
        accessibleLabel: "Restricted list result",
        selectable: true,
        layerIds: ["network"],
      }),
      createExchangeMapClusterProjection({
        clusterId: "cluster-1",
        coordinate: { longitude: -76.72, latitude: 36.82 },
        count: 3,
        accessibleLabel: "Three results",
        layerIds: ["network"],
      }),
      createExchangeMapAreaProjection({
        areaId: "area-1",
        associationSelectionKey: identity.selectionKey,
        geographyId: "geo-1",
        geometryReference: "geometry-1",
        privacy: "approximate",
        release: "released",
        accessibleLabel: "Governed service area",
        selectable: true,
        selected: true,
        emphasized: true,
        layerIds: ["network"],
      }),
    ],
  });
}

test("provider-neutral map adapter renders only authoritative active-layer projections", () => {
  const adapted = adaptLensMapProjection(projection(), selection);
  assert.equal(adapted.points.length, 2);
  assert.equal(adapted.points[0].selected, true);
  assert.equal(adapted.points[1].projection.kind, "cluster");
  assert.equal(adapted.areas.length, 1);
  assert.equal(adapted.areas[0].selected, true);
  assert.equal(adapted.listOnlyObjects.length, 1);
  assert.equal(lensMapObjectForRenderId(adapted, "subject:organization:org-1"), adapted.points[0].projection);
  assert.equal(lensMapObjectForRenderId(adapted, "cluster:cluster-1"), null);
  assert.equal(lensProjectionContainsOrganizationMarker(adapted, "marker-org-1"), true);

  const noSelection = createExchangeSelectionState({ kind: "none" });
  assert.equal(adaptLensMapProjection(projection(), noSelection).areas[0].selected, false);
});

test("home-marker deduplication applies only to the same organization projection", () => {
  const recordIdentity = createExchangeSubjectIdentity({
    subjectKind: "record",
    selectionKey: "record:resource-1",
    organizationId: "org-1",
    recordType: "resource",
    recordId: "resource-1",
  });
  const recordProjection = createLensMapProjection({
    lens: "resources",
    geography: createExchangeGeographyContext({ geographyId: "geo-1", serverRevalidated: true }),
    activeLayerIds: [],
    layerStateAuthority: "domain-revalidated",
    objects: [createExchangeMapObjectProjection({
      identity: recordIdentity,
      markerId: "marker-org-1",
      coordinate: { longitude: -76.7, latitude: 36.8 },
      privacy: "exact",
      accessibleLabel: "Resource at the home organization",
      selectable: true,
      layerIds: [],
    })],
  });
  const adapted = adaptLensMapProjection(recordProjection, createExchangeSelectionState({ kind: "none" }));
  assert.equal(lensProjectionContainsOrganizationMarker(adapted, "marker-org-1"), false);
});

test("nonselectable features remain visible without presenting a selection target", () => {
  const nonselectable = createLensMapProjection({
    lens: "intelligence",
    geography: createExchangeGeographyContext({ geographyId: "geo-1", serverRevalidated: true }),
    activeLayerIds: [],
    layerStateAuthority: "domain-revalidated",
    objects: [createExchangeMapObjectProjection({
      identity,
      markerId: "marker-org-1",
      coordinate: { longitude: -76.7, latitude: 36.8 },
      privacy: "exact",
      accessibleLabel: "Visible context only",
      selectable: false,
      projectionRole: "context",
      layerIds: [],
    })],
  });
  const renderModel = createLensProjectionRenderModel(
    adaptLensMapProjection(nonselectable, createExchangeSelectionState({ kind: "none" })),
    [],
  );
  assert.equal(renderModel.data.features[0].properties.selectable, false);
  assert.equal(renderModel.data.features[0].properties.projectionRole, "context");
  assert.equal(renderModel.selectableByRenderId.size, 0);
});

test("unvalidated geography and unvalidated layers fail map rendering closed", () => {
  const unvalidatedGeography = adaptLensMapProjection(projection(false), selection);
  assert.equal(unvalidatedGeography.points.length, 0);
  assert.equal(unvalidatedGeography.areas.length, 0);
  assert.equal(unvalidatedGeography.listOnlyObjects.length, 1);
  assert.equal(unvalidatedGeography.omittedObjects.length, 1);

  const unvalidatedLayers = adaptLensMapProjection(projection(true, "carried-unvalidated"), selection);
  assert.equal(unvalidatedLayers.points.length, 0);
  assert.equal(unvalidatedLayers.areas.length, 0);
  assert.equal(unvalidatedLayers.listOnlyObjects.length, 1);
  assert.equal(unvalidatedLayers.omittedObjects.length, 1);
});

test("Mapbox render data preserves original authority and exact governed geometry", () => {
  const adapted = adaptLensMapProjection(projection(), selection);
  const geometry = {
    type: "Polygon",
    coordinates: [[[-76.8, 36.7], [-76.6, 36.7], [-76.6, 36.9], [-76.8, 36.7]]],
  };
  const rendered = createLensProjectionRenderModel(adapted, [{
    areaId: "area-1",
    geographyId: "geo-1",
    geometryReference: "geometry-1",
    geometry,
  }]);
  assert.deepEqual(rendered.data.features.map((feature) => feature.properties.kind), [
    "organization",
    "cluster",
    "area",
  ]);
  assert.equal(rendered.data.features[0].properties.selected, 1);
  assert.equal(rendered.data.features[2].geometry, geometry);
  assert.equal(rendered.selectableByRenderId.get("subject:organization:org-1"), adapted.points[0].projection);
  assert.equal(rendered.selectableByRenderId.get("area:area-1"), adapted.areas[0].projection);
  assert.equal(rendered.clusterByRenderId.get("cluster:cluster-1"), adapted.points[1]);

  const mismatch = createLensProjectionRenderModel(adapted, [{
    areaId: "area-1",
    geographyId: "other-geography",
    geometryReference: "geometry-1",
    geometry,
  }]);
  assert.equal(mismatch.data.features.some((feature) => feature.properties.kind === "area"), false);
  assert.equal(mismatch.selectableByRenderId.has("area:area-1"), false);

  const noSelection = createExchangeSelectionState({ kind: "none" });
  const updated = createLensProjectionRenderModel(adaptLensMapProjection(projection(), noSelection), []);
  assert.equal(updated.data.features[0].properties.selected, 0);
  assert.doesNotThrow(() => updated.data.features.push(updated.data.features[0]));
});
