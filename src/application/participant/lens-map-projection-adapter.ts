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

export interface ExchangeSpatialProjectionAdapter {
  readonly lens: LensMapProjection["lens"];
  readonly points: readonly ExchangeSpatialProjectionPoint[];
  readonly areas: readonly ExchangeMapAreaProjection[];
  readonly listOnlyObjects: readonly ExchangeMapObjectProjection[];
  readonly activeLayerIds: readonly string[];
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
  const areas: ExchangeMapAreaProjection[] = [];
  const listOnlyObjects: ExchangeMapObjectProjection[] = [];

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
        (object): object is ExchangeMapObjectProjection => object.kind === "organization" || object.kind === "record",
      )),
      activeLayerIds: projection.activeLayerIds,
    });
  }

  for (const object of projection.objects) {
    if (object.kind === "organization" || object.kind === "record") {
      if (object.coordinate === null || object.privacy === "suppressed" || !layerVisible(object.layerIds)) {
        listOnlyObjects.push(object);
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
      areas.push(object);
    }
  }

  return Object.freeze({
    lens: projection.lens,
    points: Object.freeze(points),
    areas: Object.freeze(areas),
    listOnlyObjects: Object.freeze(listOnlyObjects),
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
