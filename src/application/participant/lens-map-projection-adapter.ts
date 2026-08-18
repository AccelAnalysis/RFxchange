import {
  selectionMatchesMapObject,
  type ExchangeMapAreaProjection,
  type ExchangeMapClusterProjection,
  type ExchangeMapObjectProjection,
  type ExchangeSelectionState,
  type LensMapProjection,
} from "./mobile-exchange-contracts.ts";

export type ExchangeSpatialProjectionPoint = Readonly<{
  renderId: string;
  projection: ExchangeMapObjectProjection | ExchangeMapClusterProjection;
  coordinate: readonly [longitude: number, latitude: number];
  accessibleLabel: string;
  selected: boolean;
  selectable: boolean;
  count: number | null;
}>;

export type ExchangeSpatialProjectionArea = Readonly<{
  projection: ExchangeMapAreaProjection;
  selected: boolean;
}>;

export interface ExchangeSpatialProjectionAdapter {
  readonly lens: LensMapProjection["lens"];
  readonly points: readonly ExchangeSpatialProjectionPoint[];
  readonly areas: readonly ExchangeSpatialProjectionArea[];
  readonly listOnlyObjects: readonly ExchangeMapObjectProjection[];
  readonly omittedObjects: readonly ExchangeMapObjectProjection[];
  readonly activeLayerIds: readonly string[];
}

export type ExchangeSpatialGeometry =
  | { readonly type: "Polygon"; readonly coordinates: number[][][] }
  | { readonly type: "MultiPolygon"; readonly coordinates: number[][][][] };

export interface ExchangeGovernedAreaGeometry {
  readonly areaId: string;
  readonly geographyId: string;
  readonly geometryReference: string | null;
  readonly geometry: ExchangeSpatialGeometry;
}

export type ExchangeLensSelectableProjection = ExchangeMapObjectProjection | ExchangeMapAreaProjection;

export interface ExchangeLensProjectionRenderModel {
  readonly data: {
    type: "FeatureCollection";
    features: Array<{
      type: "Feature";
      properties: Record<string, string | number | boolean>;
      geometry: { type: "Point"; coordinates: number[] } | ExchangeSpatialGeometry;
    }>;
  };
  readonly selectableByRenderId: ReadonlyMap<string, ExchangeLensSelectableProjection>;
  readonly clusterByRenderId: ReadonlyMap<string, ExchangeSpatialProjectionPoint>;
}

/**
 * Converts the shared, provider-neutral contract into render instructions for the
 * existing map scene. It filters suppressed/unreleased material and never invents
 * geometry, coordinates, selection, or authority from browser state.
 */
export function adaptLensMapProjection(
  projection: LensMapProjection,
  selection: ExchangeSelectionState,
): ExchangeSpatialProjectionAdapter {
  const points: ExchangeSpatialProjectionPoint[] = [];
  const areas: ExchangeSpatialProjectionArea[] = [];
  const listOnlyObjects: ExchangeMapObjectProjection[] = [];
  const omittedObjects: ExchangeMapObjectProjection[] = [];

  const layerVisible = (layerIds: readonly string[]) => layerIds.length === 0 || (
    projection.layerStateAuthority === "domain-revalidated"
    && layerIds.some((layerId) => projection.activeLayerIds.includes(layerId))
  );

  if (projection.geography.authority !== "server-revalidated") {
    return Object.freeze({
      lens: projection.lens,
      points: Object.freeze([]),
      areas: Object.freeze([]),
      listOnlyObjects: Object.freeze(projection.objects.filter(
        (object): object is ExchangeMapObjectProjection =>
          (object.kind === "organization" || object.kind === "record")
          && (object.coordinate === null || object.privacy === "suppressed"),
      )),
      omittedObjects: Object.freeze(projection.objects.filter(
        (object): object is ExchangeMapObjectProjection =>
          (object.kind === "organization" || object.kind === "record")
          && object.coordinate !== null
          && object.privacy !== "suppressed",
      )),
      activeLayerIds: projection.activeLayerIds,
    });
  }

  for (const object of projection.objects) {
    if (object.kind === "organization" || object.kind === "record") {
      if (object.coordinate === null || object.privacy === "suppressed") {
        listOnlyObjects.push(object);
        continue;
      }
      if (!layerVisible(object.layerIds)) {
        omittedObjects.push(object);
        continue;
      }
      points.push(Object.freeze({
        renderId: `subject:${object.identity.selectionKey}`,
        projection: object,
        coordinate: Object.freeze([object.coordinate.longitude, object.coordinate.latitude] as const),
        accessibleLabel: object.accessibleLabel,
        selected: selectionMatchesMapObject(selection, object),
        selectable: object.selectable,
        count: null,
      }));
      continue;
    }
    if (object.kind === "cluster" && layerVisible(object.layerIds)) {
      points.push(Object.freeze({
        renderId: `cluster:${object.clusterId}`,
        projection: object,
        coordinate: Object.freeze([object.coordinate.longitude, object.coordinate.latitude] as const),
        accessibleLabel: object.accessibleLabel,
        selected: false,
        selectable: false,
        count: object.count,
      }));
      continue;
    }
    if (
      object.kind === "area"
      && object.release === "released"
      && object.privacy !== "suppressed"
      && layerVisible(object.layerIds)
    ) {
      areas.push(Object.freeze({
        projection: object,
        selected: selectionMatchesMapObject(selection, object),
      }));
    }
  }

  return Object.freeze({
    lens: projection.lens,
    points: Object.freeze(points),
    areas: Object.freeze(areas),
    listOnlyObjects: Object.freeze(listOnlyObjects),
    omittedObjects: Object.freeze(omittedObjects),
    activeLayerIds: projection.activeLayerIds,
  });
}

export function lensMapObjectForRenderId(
  adapter: ExchangeSpatialProjectionAdapter,
  renderId: string,
): ExchangeMapObjectProjection | null {
  const point = adapter.points.find((candidate) => candidate.renderId === renderId);
  return point?.projection.kind === "organization" || point?.projection.kind === "record"
    ? point.projection
    : null;
}

export function lensProjectionContainsOrganizationMarker(
  adapter: ExchangeSpatialProjectionAdapter,
  markerId: string,
  organizationId: string | null | undefined,
): boolean {
  if (!organizationId) return false;
  return adapter.points.some(
    (point) => point.projection.kind === "organization"
      && point.projection.markerId === markerId
      && point.projection.identity.organizationId === organizationId,
  );
}

/**
 * Creates mutable GeoJSON for Mapbox while retaining immutable original projections
 * in private lookup tables. Governed area geometry is accepted only on an exact
 * authority-key match; feature properties are never reconstructed as authority.
 */
export function createLensProjectionRenderModel(
  adapter: ExchangeSpatialProjectionAdapter,
  geometries: readonly ExchangeGovernedAreaGeometry[],
): ExchangeLensProjectionRenderModel {
  const selectableByRenderId = new Map<string, ExchangeLensSelectableProjection>();
  const clusterByRenderId = new Map<string, ExchangeSpatialProjectionPoint>();
  const features: ExchangeLensProjectionRenderModel["data"]["features"] = [];

  for (const point of adapter.points) {
    const projection = point.projection;
    const renderId = point.renderId;
    if (projection.kind === "cluster") clusterByRenderId.set(renderId, point);
    else if (point.selectable) selectableByRenderId.set(renderId, projection);
    features.push({
      type: "Feature",
      properties: projection.kind === "cluster"
        ? {
            renderId,
            kind: "cluster",
            clusterId: projection.clusterId,
            accessibleLabel: point.accessibleLabel,
            selectable: false,
            selected: 0,
            count: projection.count,
          }
        : {
            renderId,
            kind: projection.kind,
            projectionRole: projection.projectionRole,
            markerId: projection.markerId,
            selectionKey: projection.identity.selectionKey,
            accessibleLabel: point.accessibleLabel,
            selectable: point.selectable,
            selected: point.selected ? 1 : 0,
            count: 0,
          },
      geometry: { type: "Point", coordinates: [point.coordinate[0], point.coordinate[1]] },
    });
  }

  for (const renderedArea of adapter.areas) {
    const area = renderedArea.projection;
    const governed = geometries.find((candidate) =>
      candidate.areaId === area.areaId
      && candidate.geographyId === area.geographyId
      && candidate.geometryReference === area.geometryReference,
    );
    if (!governed) continue;
    const renderId = `area:${area.areaId}`;
    if (area.selectable && area.associationSelectionKey !== null) selectableByRenderId.set(renderId, area);
    features.push({
      type: "Feature",
      properties: {
        renderId,
        kind: "area",
        areaId: area.areaId,
        associationSelectionKey: area.associationSelectionKey ?? "",
        accessibleLabel: area.accessibleLabel,
        selectable: area.selectable,
        selected: renderedArea.selected ? 1 : 0,
        emphasized: area.emphasized ? 1 : 0,
        count: 0,
      },
      geometry: governed.geometry,
    });
  }

  return {
    data: { type: "FeatureCollection", features },
    selectableByRenderId,
    clusterByRenderId,
  };
}
