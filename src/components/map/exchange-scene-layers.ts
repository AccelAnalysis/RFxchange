import { registerExchangeBeaconImages } from "./exchange-beacon-images";
import {
  EMPTY_FEATURE_COLLECTION,
  HOME_MARKER_CORE_LAYER_ID,
  HOME_MARKER_HALO_LAYER_ID,
  HOME_MARKER_IDENTITY_LAYER_ID,
  HOME_MARKER_LABEL_LAYER_ID,
  HOME_MARKER_SOURCE_ID,
  LENS_PROJECTION_AREA_FILL_LAYER_ID,
  LENS_PROJECTION_AREA_LINE_LAYER_ID,
  LENS_PROJECTION_CLUSTER_BACK_LAYER_ID,
  LENS_PROJECTION_CLUSTER_COUNT_LAYER_ID,
  LENS_PROJECTION_CLUSTER_LAYER_ID,
  LENS_PROJECTION_OBJECT_LAYER_ID,
  LENS_PROJECTION_SELECTED_HALO_LAYER_ID,
  LENS_PROJECTION_SELECTED_LABEL_LAYER_ID,
  LENS_PROJECTION_SOURCE_ID,
  LOCALITY_FILL_LAYER_ID,
  LOCALITY_MASK_LAYER_ID,
  LOCALITY_MASK_SOURCE_ID,
  LOCALITY_OUTLINE_LAYER_ID,
  LOCALITY_SOURCE_ID,
  NETWORK_CLUSTER_BACK_LAYER_ID,
  NETWORK_CLUSTER_CORE_LAYER_ID,
  NETWORK_CLUSTER_COUNT_LAYER_ID,
  NETWORK_MARKER_CORE_LAYER_ID,
  NETWORK_MARKER_HALO_LAYER_ID,
  NETWORK_MARKER_IDENTITY_LAYER_ID,
  NETWORK_MARKER_LABEL_LAYER_ID,
  NETWORK_MARKER_SOURCE_ID,
  NETWORK_SELECTED_MARKER_CORE_LAYER_ID,
  NETWORK_SELECTED_MARKER_SOURCE_ID,
  OPPORTUNITY_CLUSTER_BACK_LAYER_ID,
  OPPORTUNITY_CLUSTER_COUNT_LAYER_ID,
  OPPORTUNITY_CLUSTER_LAYER_ID,
  OPPORTUNITY_MARKER_LAYER_ID,
  OPPORTUNITY_MARKER_SOURCE_ID,
  OPPORTUNITY_SELECTED_HALO_LAYER_ID,
  OPPORTUNITY_SELECTED_LABEL_LAYER_ID,
  OPPORTUNITY_SELECTED_MARKER_LAYER_ID,
  OPPORTUNITY_SELECTED_MARKER_SOURCE_ID,
  RELATIONSHIP_PATH_LAYER_ID,
  RELATIONSHIP_PATH_SOURCE_ID,
  SEARCH_AREA_FILL_LAYER_ID,
  SEARCH_AREA_LINE_LAYER_ID,
  SEARCH_AREA_SOURCE_ID,
  SERVICE_FIELD_FILL_LAYER_ID,
  SERVICE_FIELD_LINE_LAYER_ID,
  SERVICE_FIELD_SOURCE_ID,
  TUTORIAL_NODE_CORE_LAYER_ID,
  TUTORIAL_NODE_GLYPH_LAYER_ID,
  TUTORIAL_NODE_HALO_LAYER_ID,
  TUTORIAL_NODE_LABEL_LAYER_ID,
  TUTORIAL_NODE_SOURCE_ID,
  TUTORIAL_PATH_LAYER_ID,
  TUTORIAL_PATH_SOURCE_ID,
} from "./exchange-scene-data";

type SceneData = Readonly<{
  homeGeoJson: mapboxgl.GeoJSONSourceSpecification["data"];
  homeMarkerGeoJson: mapboxgl.GeoJSONSourceSpecification["data"];
  homeMaskGeoJson: mapboxgl.GeoJSONSourceSpecification["data"];
  lensProjectionGeoJson: mapboxgl.GeoJSONSourceSpecification["data"];
  networkMarkerGeoJson: mapboxgl.GeoJSONSourceSpecification["data"];
  opportunityMarkerGeoJson: mapboxgl.GeoJSONSourceSpecification["data"];
  relationshipPathGeoJson: mapboxgl.GeoJSONSourceSpecification["data"];
  selectedNetworkMarkerGeoJson: mapboxgl.GeoJSONSourceSpecification["data"];
  selectedOpportunityMarkerGeoJson: mapboxgl.GeoJSONSourceSpecification["data"];
  serviceFieldGeoJson: mapboxgl.GeoJSONSourceSpecification["data"];
  tutorialNodeGeoJson: mapboxgl.GeoJSONSourceSpecification["data"];
  tutorialPathGeoJson: mapboxgl.GeoJSONSourceSpecification["data"];
}>;

export function installSceneLayers(map: mapboxgl.Map, data: SceneData, threeDimensional: boolean) {
  for (const layer of map.getStyle()?.layers ?? []) {
    if (layer.type === "symbol") map.setLayoutProperty(layer.id, "visibility", "none");
  }
  if (map.getSource("composite"))
    map.addLayer({
      id: "rfx-buildings",
      type: "fill-extrusion",
      source: "composite",
      "source-layer": "building",
      filter: ["==", "extrude", "true"],
      minzoom: 15,
      layout: { visibility: threeDimensional ? "visible" : "none" },
      paint: {
        "fill-extrusion-color": "#c9c5bd",
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-base": ["get", "min_height"],
        "fill-extrusion-opacity": 0.6,
      },
    });
  registerExchangeBeaconImages(map);
  map.addSource(LOCALITY_MASK_SOURCE_ID, { type: "geojson", data: data.homeMaskGeoJson });
  map.addLayer({
    id: LOCALITY_MASK_LAYER_ID,
    type: "fill",
    source: LOCALITY_MASK_SOURCE_ID,
    paint: {
      "fill-color": "#59606a",
      "fill-opacity": 0.3,
    },
  });

  map.addSource(LOCALITY_SOURCE_ID, { type: "geojson", data: data.homeGeoJson });
  map.addLayer({
    id: LOCALITY_FILL_LAYER_ID,
    type: "fill",
    source: LOCALITY_SOURCE_ID,
    paint: {
      "fill-color": "#2e5eaa",
      "fill-opacity": 0.04,
    },
  });
  map.addLayer({
    id: LOCALITY_OUTLINE_LAYER_ID,
    type: "line",
    source: LOCALITY_SOURCE_ID,
    paint: {
      "line-color": "#2e5eaa",
      "line-opacity": 0.96,
      "line-width": 2.5,
    },
  });

  map.addSource(SEARCH_AREA_SOURCE_ID, { type: "geojson", data: EMPTY_FEATURE_COLLECTION });
  map.addLayer({
    id: SEARCH_AREA_FILL_LAYER_ID,
    type: "fill",
    source: SEARCH_AREA_SOURCE_ID,
    paint: {
      "fill-color": "#2e5eaa",
      "fill-opacity": 0.09,
    },
  });
  map.addLayer({
    id: SEARCH_AREA_LINE_LAYER_ID,
    type: "line",
    source: SEARCH_AREA_SOURCE_ID,
    paint: {
      "line-color": "#2e5eaa",
      "line-opacity": 1,
      "line-width": 2.5,
      "line-dasharray": [1.5, 1.5],
    },
  });

  map.addSource(SERVICE_FIELD_SOURCE_ID, { type: "geojson", data: data.serviceFieldGeoJson });
  map.addLayer({
    id: SERVICE_FIELD_FILL_LAYER_ID,
    type: "fill",
    source: SERVICE_FIELD_SOURCE_ID,
    paint: {
      "fill-color": ["case", ["==", ["get", "selected"], true], "#2e5eaa", "#4f718f"],
      "fill-opacity": ["case", ["==", ["get", "selected"], true], 0.16, 0.07],
    },
  });
  map.addLayer({
    id: SERVICE_FIELD_LINE_LAYER_ID,
    type: "line",
    source: SERVICE_FIELD_SOURCE_ID,
    paint: {
      "line-color": ["case", ["==", ["get", "selected"], true], "#2e5eaa", "#4f718f"],
      "line-opacity": 0.75,
      "line-width": ["case", ["==", ["get", "selected"], true], 2.5, 1.25],
      "line-dasharray": [2, 1.5],
    },
  });
  map.addSource(LENS_PROJECTION_SOURCE_ID, {
    type: "geojson",
    data: data.lensProjectionGeoJson,
  });
  map.addLayer({
    id: LENS_PROJECTION_AREA_FILL_LAYER_ID,
    type: "fill",
    source: LENS_PROJECTION_SOURCE_ID,
    filter: ["==", ["get", "kind"], "area"],
    paint: {
      "fill-color": ["case", ["==", ["get", "selected"], 1], "#d6a23a", "#4f718f"],
      "fill-opacity": ["case", ["==", ["get", "emphasized"], 1], 0.18, 0.08],
    },
  });
  map.addLayer({
    id: LENS_PROJECTION_AREA_LINE_LAYER_ID,
    type: "line",
    source: LENS_PROJECTION_SOURCE_ID,
    filter: ["==", ["get", "kind"], "area"],
    paint: {
      "line-color": ["case", ["==", ["get", "selected"], 1], "#d6a23a", "#4f718f"],
      "line-opacity": 0.86,
      "line-width": ["case", ["==", ["get", "emphasized"], 1], 2.75, 1.5],
    },
  });
  map.addSource(RELATIONSHIP_PATH_SOURCE_ID, { type: "geojson", data: data.relationshipPathGeoJson });
  map.addLayer({
    id: RELATIONSHIP_PATH_LAYER_ID,
    type: "line",
    source: RELATIONSHIP_PATH_SOURCE_ID,
    paint: { "line-color": "#b98727", "line-opacity": 0.9, "line-width": 3, "line-dasharray": [2, 1.4] },
  });

  map.addSource(TUTORIAL_PATH_SOURCE_ID, { type: "geojson", data: data.tutorialPathGeoJson });
  map.addLayer({
    id: TUTORIAL_PATH_LAYER_ID,
    type: "line",
    source: TUTORIAL_PATH_SOURCE_ID,
    paint: {
      "line-color": [
        "match",
        ["get", "kind"],
        "demand-signal",
        "#d6a23a",
        "capability-match",
        "#2e5eaa",
        "teammate-discovery",
        "#3b7b57",
        "joint-response",
        "#d6a23a",
        "selected-outcome",
        "#3b7b57",
        "#2e5eaa",
      ],
      "line-opacity": ["case", ["==", ["get", "stage"], "network-effect"], 1, 0.9],
      "line-width": ["case", ["==", ["get", "stage"], "network-effect"], 5, 4],
      "line-dasharray": [1.6, 1.1],
    },
  });

  map.addSource(TUTORIAL_NODE_SOURCE_ID, { type: "geojson", data: data.tutorialNodeGeoJson });
  map.addLayer({
    id: TUTORIAL_NODE_HALO_LAYER_ID,
    type: "circle",
    source: TUTORIAL_NODE_SOURCE_ID,
    paint: { "circle-radius": 17, "circle-color": "rgba(46,94,170,0.16)" },
  });
  map.addLayer({
    id: TUTORIAL_NODE_CORE_LAYER_ID,
    type: "circle",
    source: TUTORIAL_NODE_SOURCE_ID,
    paint: {
      "circle-radius": 11,
      "circle-color": [
        "match",
        ["get", "role"],
        "issuer",
        "#d6a23a",
        "responder",
        "#2e5eaa",
        "teammate",
        "#3b7b57",
        "#8f3c32",
      ],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2.5,
    },
  });
  map.addLayer({
    id: TUTORIAL_NODE_GLYPH_LAYER_ID,
    type: "symbol",
    source: TUTORIAL_NODE_SOURCE_ID,
    layout: {
      "text-field": ["get", "glyph"],
      "text-size": 11,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
      "text-pitch-alignment": "viewport",
    },
    paint: { "text-color": "#ffffff" },
  });
  map.addLayer({
    id: TUTORIAL_NODE_LABEL_LAYER_ID,
    type: "symbol",
    source: TUTORIAL_NODE_SOURCE_ID,
    minzoom: 12.5,
    layout: {
      "text-field": ["get", "label"],
      "text-size": 12,
      "text-offset": [0, 1.8],
      "text-anchor": "top",
      "text-allow-overlap": true,
      "text-ignore-placement": true,
      "text-pitch-alignment": "viewport",
    },
    paint: {
      "text-color": "#1b2430",
      "text-halo-color": "rgba(255, 255, 255,0.96)",
      "text-halo-width": 2,
    },
  });

  map.addSource(NETWORK_MARKER_SOURCE_ID, {
    type: "geojson",
    data: data.networkMarkerGeoJson,
    cluster: true,
    clusterMaxZoom: 10,
    clusterRadius: 48,
  });
  map.addLayer({
    id: NETWORK_CLUSTER_BACK_LAYER_ID,
    type: "circle",
    source: NETWORK_MARKER_SOURCE_ID,
    filter: ["has", "point_count"],
    paint: {
      "circle-radius": ["step", ["get", "point_count"], 15, 10, 19, 40, 23],
      "circle-color": "#755014",
      "circle-opacity": 0.7,
      "circle-translate": [4, 4],
      "circle-translate-anchor": "viewport",
    },
  });
  map.addLayer({
    id: NETWORK_CLUSTER_CORE_LAYER_ID,
    type: "circle",
    source: NETWORK_MARKER_SOURCE_ID,
    filter: ["has", "point_count"],
    paint: {
      "circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 40, 22],
      "circle-color": "#1b2430",
      "circle-opacity": 0.97,
      "circle-stroke-color": "#2e5eaa",
      "circle-stroke-width": 2.25,
    },
  });
  map.addLayer({
    id: NETWORK_CLUSTER_COUNT_LAYER_ID,
    type: "symbol",
    source: NETWORK_MARKER_SOURCE_ID,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-size": 11,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: { "text-color": "#ffffff" },
  });
  map.addSource(NETWORK_SELECTED_MARKER_SOURCE_ID, {
    type: "geojson",
    data: data.selectedNetworkMarkerGeoJson,
  });
  map.addLayer({
    id: NETWORK_MARKER_HALO_LAYER_ID,
    type: "circle",
    source: NETWORK_SELECTED_MARKER_SOURCE_ID,
    paint: {
      "circle-radius": 18,
      "circle-color": "rgba(46,94,170,0.18)",
      "circle-stroke-color": "rgba(46,94,170,0.5)",
      "circle-stroke-width": 2,
    },
  });
  map.addLayer({
    id: NETWORK_MARKER_CORE_LAYER_ID,
    type: "symbol",
    source: NETWORK_MARKER_SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": ["get", "beaconImage"],
      "icon-size": 0.76,
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "icon-pitch-alignment": "viewport",
      "icon-rotation-alignment": "viewport",
    },
  });
  map.addLayer({
    id: NETWORK_SELECTED_MARKER_CORE_LAYER_ID,
    type: "symbol",
    source: NETWORK_SELECTED_MARKER_SOURCE_ID,
    layout: {
      "icon-image": ["get", "beaconImage"],
      "icon-size": 1.08,
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "icon-pitch-alignment": "viewport",
      "icon-rotation-alignment": "viewport",
    },
  });
  map.addLayer({
    id: NETWORK_MARKER_IDENTITY_LAYER_ID,
    type: "symbol",
    source: NETWORK_SELECTED_MARKER_SOURCE_ID,
    layout: {
      "text-field": "",
      "text-size": 1,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
      "text-pitch-alignment": "viewport",
      "text-rotation-alignment": "viewport",
    },
    paint: { "text-color": "#ffffff" },
  });
  map.addLayer({
    id: NETWORK_MARKER_LABEL_LAYER_ID,
    type: "symbol",
    source: NETWORK_SELECTED_MARKER_SOURCE_ID,
    minzoom: 8,
    layout: {
      "text-field": ["get", "label"],
      "text-size": 12,
      "text-offset": [0, 3.35],
      "text-anchor": "top",
      "text-allow-overlap": false,
      "text-pitch-alignment": "viewport",
      "text-rotation-alignment": "viewport",
    },
    paint: {
      "text-color": "#1b2430",
      "text-halo-color": "rgba(255, 255, 255,0.96)",
      "text-halo-width": 2,
    },
  });

  map.addSource(OPPORTUNITY_MARKER_SOURCE_ID, {
    type: "geojson",
    data: data.opportunityMarkerGeoJson,
    cluster: true,
    clusterMaxZoom: 13,
    clusterRadius: 36,
  });
  map.addLayer({
    id: OPPORTUNITY_CLUSTER_BACK_LAYER_ID,
    type: "circle",
    source: OPPORTUNITY_MARKER_SOURCE_ID,
    filter: ["has", "point_count"],
    paint: {
      "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 40, 24],
      "circle-color": "#755014",
      "circle-opacity": 0.7,
      "circle-translate": [4, 4],
      "circle-translate-anchor": "viewport",
    },
  });
  map.addLayer({
    id: OPPORTUNITY_CLUSTER_LAYER_ID,
    type: "circle",
    source: OPPORTUNITY_MARKER_SOURCE_ID,
    filter: ["has", "point_count"],
    paint: {
      "circle-radius": ["step", ["get", "point_count"], 15, 10, 19, 40, 23],
      "circle-color": "#1b2430",
      "circle-opacity": 0.97,
      "circle-stroke-color": "#2e5eaa",
      "circle-stroke-width": 2.25,
    },
  });
  map.addLayer({
    id: OPPORTUNITY_CLUSTER_COUNT_LAYER_ID,
    type: "symbol",
    source: OPPORTUNITY_MARKER_SOURCE_ID,
    filter: ["has", "point_count"],
    layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 11, "text-allow-overlap": true },
    paint: { "text-color": "#ffffff" },
  });
  map.addLayer({
    id: OPPORTUNITY_MARKER_LAYER_ID,
    type: "symbol",
    source: OPPORTUNITY_MARKER_SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": ["get", "beaconImage"],
      "icon-size": 0.8,
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "icon-pitch-alignment": "viewport",
      "icon-rotation-alignment": "viewport",
    },
  });
  map.addSource(OPPORTUNITY_SELECTED_MARKER_SOURCE_ID, {
    type: "geojson",
    data: data.selectedOpportunityMarkerGeoJson,
  });
  map.addLayer({
    id: OPPORTUNITY_SELECTED_HALO_LAYER_ID,
    type: "circle",
    source: OPPORTUNITY_SELECTED_MARKER_SOURCE_ID,
    paint: {
      "circle-radius": 23,
      "circle-color": "rgba(46,94,170,0.16)",
      "circle-stroke-color": "rgba(46,94,170,0.55)",
      "circle-stroke-width": 2,
      "circle-translate": [0, -18],
      "circle-translate-anchor": "viewport",
    },
  });
  map.addLayer({
    id: OPPORTUNITY_SELECTED_MARKER_LAYER_ID,
    type: "symbol",
    source: OPPORTUNITY_SELECTED_MARKER_SOURCE_ID,
    layout: {
      "icon-image": ["get", "beaconImage"],
      "icon-size": 1.1,
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "icon-pitch-alignment": "viewport",
      "icon-rotation-alignment": "viewport",
    },
  });
  map.addLayer({
    id: OPPORTUNITY_SELECTED_LABEL_LAYER_ID,
    type: "symbol",
    source: OPPORTUNITY_SELECTED_MARKER_SOURCE_ID,
    minzoom: 7,
    layout: {
      "text-field": ["get", "label"],
      "text-size": 12,
      "text-offset": [0, 3.65],
      "text-anchor": "top",
      "text-allow-overlap": false,
      "text-pitch-alignment": "viewport",
    },
    paint: { "text-color": "#1b2430", "text-halo-color": "rgba(255, 255, 255,0.98)", "text-halo-width": 2 },
  });

  map.addLayer({
    id: LENS_PROJECTION_CLUSTER_BACK_LAYER_ID,
    type: "circle",
    source: LENS_PROJECTION_SOURCE_ID,
    filter: ["==", ["get", "kind"], "cluster"],
    paint: {
      "circle-radius": ["step", ["get", "count"], 15, 10, 19, 40, 23],
      "circle-color": "#755014",
      "circle-opacity": 0.7,
      "circle-translate": [4, 4],
      "circle-translate-anchor": "viewport",
    },
  });
  map.addLayer({
    id: LENS_PROJECTION_CLUSTER_LAYER_ID,
    type: "circle",
    source: LENS_PROJECTION_SOURCE_ID,
    filter: ["==", ["get", "kind"], "cluster"],
    paint: {
      "circle-radius": ["step", ["get", "count"], 14, 10, 18, 40, 22],
      "circle-color": "#1b2430",
      "circle-opacity": 0.97,
      "circle-stroke-color": "#2e5eaa",
      "circle-stroke-width": 2.25,
    },
  });
  map.addLayer({
    id: LENS_PROJECTION_CLUSTER_COUNT_LAYER_ID,
    type: "symbol",
    source: LENS_PROJECTION_SOURCE_ID,
    filter: ["==", ["get", "kind"], "cluster"],
    layout: { "text-field": ["get", "count"], "text-size": 11, "text-allow-overlap": true },
    paint: { "text-color": "#ffffff" },
  });
  map.addLayer({
    id: LENS_PROJECTION_SELECTED_HALO_LAYER_ID,
    type: "circle",
    source: LENS_PROJECTION_SOURCE_ID,
    filter: ["all", ["in", ["get", "kind"], ["literal", ["organization", "record"]]], ["==", ["get", "selected"], 1]],
    paint: {
      "circle-radius": 17,
      "circle-color": "rgba(46,94,170,0.18)",
      "circle-stroke-color": "rgba(46,94,170,0.55)",
      "circle-stroke-width": 2,
    },
  });
  map.addLayer({
    id: LENS_PROJECTION_OBJECT_LAYER_ID,
    type: "symbol",
    source: LENS_PROJECTION_SOURCE_ID,
    filter: ["in", ["get", "kind"], ["literal", ["organization", "record"]]],
    layout: {
      "icon-image": ["get", "beaconImage"],
      "icon-size": ["case", ["==", ["get", "selected"], 1], 1.08, 0.76],
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "icon-pitch-alignment": "viewport",
      "icon-rotation-alignment": "viewport",
    },
  });
  map.addLayer({
    id: LENS_PROJECTION_SELECTED_LABEL_LAYER_ID,
    type: "symbol",
    source: LENS_PROJECTION_SOURCE_ID,
    filter: ["all", ["in", ["get", "kind"], ["literal", ["organization", "record"]]], ["==", ["get", "selected"], 1]],
    minzoom: 7,
    layout: {
      "text-field": ["get", "accessibleLabel"],
      "text-size": 12,
      "text-offset": [0, 3.45],
      "text-anchor": "top",
      "text-allow-overlap": false,
    },
    paint: { "text-color": "#1b2430", "text-halo-color": "rgba(255, 255, 255,0.98)", "text-halo-width": 2 },
  });

  map.addSource(HOME_MARKER_SOURCE_ID, { type: "geojson", data: data.homeMarkerGeoJson });
  map.addLayer({
    id: HOME_MARKER_HALO_LAYER_ID,
    type: "circle",
    source: HOME_MARKER_SOURCE_ID,
    paint: {
      "circle-radius": 20,
      "circle-color": "rgba(46,94,170,0.18)",
      "circle-stroke-color": "rgba(46,94,170,0.42)",
      "circle-stroke-width": 2,
    },
  });
  map.addLayer({
    id: HOME_MARKER_CORE_LAYER_ID,
    type: "symbol",
    source: HOME_MARKER_SOURCE_ID,
    layout: {
      "icon-image": ["get", "beaconImage"],
      "icon-size": 1.02,
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "icon-pitch-alignment": "viewport",
      "icon-rotation-alignment": "viewport",
    },
  });
  map.addLayer({
    id: HOME_MARKER_IDENTITY_LAYER_ID,
    type: "symbol",
    source: HOME_MARKER_SOURCE_ID,
    layout: {
      "text-field": "",
      "text-size": 1,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
      "text-pitch-alignment": "viewport",
      "text-rotation-alignment": "viewport",
    },
    paint: {
      "text-color": "#ffffff",
    },
  });
  map.addLayer({
    id: HOME_MARKER_LABEL_LAYER_ID,
    type: "symbol",
    source: HOME_MARKER_SOURCE_ID,
    layout: {
      "text-field": ["get", "label"],
      "text-size": 13,
      "text-offset": [0, 3.55],
      "text-anchor": "top",
      "text-allow-overlap": true,
      "text-ignore-placement": true,
      "text-pitch-alignment": "viewport",
      "text-rotation-alignment": "viewport",
    },
    paint: {
      "text-color": "#1b2430",
      "text-halo-color": "rgba(255, 255, 255,0.96)",
      "text-halo-width": 2.2,
      "text-halo-blur": 0.5,
    },
  });
}
