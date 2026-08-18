import assert from "node:assert/strict";
import test from "node:test";

import { adaptLensMapProjection, lensMapObjectForRenderId } from "../src/application/participant/lens-map-projection-adapter.ts";
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
  assert.equal(adapted.listOnlyObjects.length, 1);
  assert.equal(lensMapObjectForRenderId(adapted, "subject:organization:org-1"), adapted.points[0].projection);
  assert.equal(lensMapObjectForRenderId(adapted, "cluster:cluster-1"), null);
});

test("unvalidated geography and unvalidated layers fail map rendering closed", () => {
  const unvalidatedGeography = adaptLensMapProjection(projection(false), selection);
  assert.equal(unvalidatedGeography.points.length, 0);
  assert.equal(unvalidatedGeography.areas.length, 0);
  assert.equal(unvalidatedGeography.listOnlyObjects.length, 2);

  const unvalidatedLayers = adaptLensMapProjection(projection(true, "carried-unvalidated"), selection);
  assert.equal(unvalidatedLayers.points.length, 0);
  assert.equal(unvalidatedLayers.areas.length, 0);
  assert.equal(unvalidatedLayers.listOnlyObjects.length, 2);
});
