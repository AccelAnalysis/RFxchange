import type {
  createLensProjectionRenderModel,
  ExchangeLensSelectableProjection,
} from "../../application/participant/lens-map-projection-adapter";
import {
  HOME_MARKER_CORE_LAYER_ID,
  LENS_PROJECTION_AREA_FILL_LAYER_ID,
  LENS_PROJECTION_CLUSTER_LAYER_ID,
  LENS_PROJECTION_OBJECT_LAYER_ID,
  NETWORK_CLUSTER_CORE_LAYER_ID,
  NETWORK_MARKER_CORE_LAYER_ID,
  NETWORK_MARKER_SOURCE_ID,
  NETWORK_SELECTED_MARKER_CORE_LAYER_ID,
  OPPORTUNITY_CLUSTER_LAYER_ID,
  OPPORTUNITY_MARKER_LAYER_ID,
  OPPORTUNITY_MARKER_SOURCE_ID,
  OPPORTUNITY_SELECTED_MARKER_LAYER_ID,
  validCoordinatePair,
} from "./exchange-scene-data";

type RenderModel = ReturnType<typeof createLensProjectionRenderModel>;
export function installSceneInteractions(
  map: mapboxgl.Map,
  state: () => {
    reducedMotion: boolean;
    markerId?: string;
    selectable: RenderModel["selectableByRenderId"];
    clusters: RenderModel["clusterByRenderId"];
  },
  onInteraction: () => void,
  onOrganizationSelect: (id: string) => void,
  onOpportunitySelect: (id: string) => void,
  onProjectionSelect: (projection: ExchangeLensSelectableProjection) => void,
) {
  for (const layer of [
    HOME_MARKER_CORE_LAYER_ID,
    NETWORK_MARKER_CORE_LAYER_ID,
    NETWORK_SELECTED_MARKER_CORE_LAYER_ID,
    NETWORK_CLUSTER_CORE_LAYER_ID,
  ]) {
    map.on("mouseenter", layer, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", layer, () => {
      map.getCanvas().style.cursor = "";
    });
  }
  map.on("click", NETWORK_CLUSTER_CORE_LAYER_ID, (event) => {
    const feature = event.features?.[0] as unknown as
      | {
          readonly properties?: Readonly<Record<string, unknown>>;
          readonly geometry?: { readonly coordinates?: unknown };
        }
      | undefined;
    const clusterId = feature?.properties?.cluster_id;
    const coordinate = validCoordinatePair(feature?.geometry?.coordinates);
    const source = map.getSource(NETWORK_MARKER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (typeof clusterId !== "number" || !coordinate || !source) return;
    source.getClusterExpansionZoom(clusterId, (error, zoom) => {
      if (error || typeof zoom !== "number") return;
      onInteraction();
      map.easeTo({ center: [coordinate[0], coordinate[1]], zoom, duration: state().reducedMotion ? 0 : 650 });
    });
  });
  const selectNetworkMarker = (event: mapboxgl.MapLayerMouseEvent) => {
    const feature = event.features?.[0] as unknown as
      | { readonly properties?: Readonly<Record<string, unknown>> }
      | undefined;
    const markerId = feature?.properties?.id;
    if (typeof markerId === "string") {
      onOrganizationSelect?.(markerId);
    }
  };
  map.on("click", NETWORK_MARKER_CORE_LAYER_ID, selectNetworkMarker);
  map.on("click", NETWORK_SELECTED_MARKER_CORE_LAYER_ID, selectNetworkMarker);
  for (const layerId of [
    OPPORTUNITY_MARKER_LAYER_ID,
    OPPORTUNITY_SELECTED_MARKER_LAYER_ID,
    OPPORTUNITY_CLUSTER_LAYER_ID,
  ]) {
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  }
  map.on("click", OPPORTUNITY_CLUSTER_LAYER_ID, (event) => {
    const feature = event.features?.[0] as unknown as
      | {
          readonly properties?: Readonly<Record<string, unknown>>;
          readonly geometry?: { readonly coordinates?: unknown };
        }
      | undefined;
    const clusterId = feature?.properties?.cluster_id;
    const coordinate = validCoordinatePair(feature?.geometry?.coordinates);
    const source = map.getSource(OPPORTUNITY_MARKER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (typeof clusterId !== "number" || !coordinate || !source) return;
    source.getClusterExpansionZoom(clusterId, (error, zoom) => {
      if (error || typeof zoom !== "number") return;
      onInteraction();
      map.easeTo({ center: [coordinate[0], coordinate[1]], zoom, duration: state().reducedMotion ? 0 : 650 });
    });
  });
  const selectOpportunityMarker = (event: mapboxgl.MapLayerMouseEvent) => {
    const feature = event.features?.[0] as unknown as
      | { readonly properties?: Readonly<Record<string, unknown>> }
      | undefined;
    const markerId = feature?.properties?.id;
    if (typeof markerId === "string") onOpportunitySelect?.(markerId);
  };
  map.on("click", OPPORTUNITY_MARKER_LAYER_ID, selectOpportunityMarker);
  map.on("click", OPPORTUNITY_SELECTED_MARKER_LAYER_ID, selectOpportunityMarker);
  for (const layerId of [LENS_PROJECTION_OBJECT_LAYER_ID, LENS_PROJECTION_AREA_FILL_LAYER_ID]) {
    map.on("mouseenter", layerId, (event) => {
      const selectable = event.features?.[0]?.properties?.selectable === true;
      map.getCanvas().style.cursor = selectable ? "pointer" : "";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  }
  map.on("mouseenter", LENS_PROJECTION_CLUSTER_LAYER_ID, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", LENS_PROJECTION_CLUSTER_LAYER_ID, () => {
    map.getCanvas().style.cursor = "";
  });
  const lensProjectionForEvent = (event: mapboxgl.MapLayerMouseEvent) => {
    const feature = event.features?.[0] as unknown as
      | { readonly properties?: Readonly<Record<string, unknown>> }
      | undefined;
    const renderId = feature?.properties?.renderId;
    return typeof renderId === "string" ? (state().selectable.get(renderId) ?? null) : null;
  };
  map.on("click", LENS_PROJECTION_OBJECT_LAYER_ID, (event) => {
    const projection = lensProjectionForEvent(event);
    if (projection) onProjectionSelect?.(projection);
  });
  map.on("click", LENS_PROJECTION_AREA_FILL_LAYER_ID, (event) => {
    if (
      map.queryRenderedFeatures(event.point, {
        layers: [LENS_PROJECTION_OBJECT_LAYER_ID, HOME_MARKER_CORE_LAYER_ID, LENS_PROJECTION_CLUSTER_LAYER_ID],
      }).length > 0
    )
      return;
    const projection = lensProjectionForEvent(event);
    if (projection) onProjectionSelect?.(projection);
  });
  map.on("click", LENS_PROJECTION_CLUSTER_LAYER_ID, (event) => {
    if (
      map.queryRenderedFeatures(event.point, {
        layers: [LENS_PROJECTION_OBJECT_LAYER_ID, HOME_MARKER_CORE_LAYER_ID],
      }).length > 0
    )
      return;
    const feature = event.features?.[0] as unknown as
      | { readonly properties?: Readonly<Record<string, unknown>> }
      | undefined;
    const renderId = feature?.properties?.renderId;
    const cluster = typeof renderId === "string" ? state().clusters.get(renderId) : undefined;
    if (!cluster || cluster.projection.kind !== "cluster") return;
    onInteraction();
    map.easeTo({
      center: [cluster.coordinate[0], cluster.coordinate[1]],
      zoom: Math.min(map.getZoom() + 2, map.getMaxZoom()),
      duration: state().reducedMotion ? 0 : 650,
    });
  });
  map.on("click", HOME_MARKER_CORE_LAYER_ID, (event) => {
    if (
      map.queryRenderedFeatures(event.point, {
        layers: [
          NETWORK_CLUSTER_CORE_LAYER_ID,
          NETWORK_MARKER_CORE_LAYER_ID,
          NETWORK_SELECTED_MARKER_CORE_LAYER_ID,
          LENS_PROJECTION_OBJECT_LAYER_ID,
        ],
      }).length > 0
    )
      return;
    const markerId = state().markerId;
    if (markerId) onOrganizationSelect?.(markerId);
  });
}
