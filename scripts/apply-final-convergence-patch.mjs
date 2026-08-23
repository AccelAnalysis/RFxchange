import { readFileSync, writeFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

function write(path, content) {
  writeFileSync(path, content, "utf8");
}

function replaceOnce(path, from, to) {
  const source = read(path);
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${path}: expected one exact match, found ${count}`);
  write(path, source.replace(from, to));
}

function replaceRegexOnce(path, pattern, replacement) {
  const source = read(path);
  const matches = source.match(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`)) ?? [];
  if (matches.length !== 1) throw new Error(`${path}: expected one regex match, found ${matches.length}: ${pattern}`);
  write(path, source.replace(pattern, replacement));
}

const mapPath = "src/components/map/ExchangeSpatialScene.tsx";
const cssPath = "src/components/map/ExchangeSpatialScene.module.css";
const opportunityPath = "src/components/rfx/OpportunityDiscoveryWorkspace.tsx";
const participantMapPath = "src/infrastructure/geography/participant-map-runtime.ts";

replaceOnce(
  mapPath,
  `import {\n  MAP_ROTATION_PREFERENCE_EVENT,\n  readMapRotationPreference,\n} from "./map-motion-preference";`,
  `import { beaconImageId, registerExchangeBeaconImages } from "./exchange-beacon-images";\nimport {\n  MAP_ROTATION_PREFERENCE_EVENT,\n  readMapRotationPreference,\n} from "./map-motion-preference";`,
);
replaceOnce(
  mapPath,
  `  readonly label: string;\n  readonly accessibleLocationLabel?: string;`,
  `  readonly label: string;\n  readonly accessibleLocationLabel?: string;\n  readonly precision?: "exact" | "approximate";`,
);
replaceOnce(
  mapPath,
  `type MapSearchResult = Readonly<{\n  id: string;\n  name: string;\n  context: string;\n  featureType: string;\n  center: readonly [number, number];\n  bbox: readonly [number, number, number, number] | null;\n}>;`,
  `type MapSearchResult = Readonly<{\n  id: string;\n  name: string;\n  context: string;\n  featureType: string;\n  center: readonly [number, number];\n  bbox: readonly [number, number, number, number] | null;\n}>;\n\ntype MapBasemapPresetId = "exchange" | "street" | "night";\ntype MapBasemapPreset = Readonly<{\n  id: MapBasemapPresetId;\n  label: string;\n  lightPreset: "day" | "night";\n  theme: "faded" | "default";\n  showTransitLabels: boolean;\n  showPointOfInterestLabels: boolean;\n}>;\n\nexport const MAP_BASEMAP_PRESETS: readonly MapBasemapPreset[] = Object.freeze([\n  Object.freeze({ id: "exchange", label: "Exchange", lightPreset: "day", theme: "faded", showTransitLabels: false, showPointOfInterestLabels: true }),\n  Object.freeze({ id: "street", label: "Street", lightPreset: "day", theme: "default", showTransitLabels: true, showPointOfInterestLabels: true }),\n  Object.freeze({ id: "night", label: "Night", lightPreset: "night", theme: "default", showTransitLabels: false, showPointOfInterestLabels: true }),\n]);`,
);
replaceOnce(mapPath, `const NETWORK_CLUSTER_CORE_LAYER_ID = "rfx-spatial-scene-network-cluster-core";`, `const NETWORK_CLUSTER_BACK_LAYER_ID = "rfx-spatial-scene-network-cluster-back";\nconst NETWORK_CLUSTER_CORE_LAYER_ID = "rfx-spatial-scene-network-cluster-core";`);
replaceOnce(mapPath, `const OPPORTUNITY_CLUSTER_LAYER_ID = "rfx-spatial-scene-opportunity-cluster";`, `const OPPORTUNITY_CLUSTER_BACK_LAYER_ID = "rfx-spatial-scene-opportunity-cluster-back";\nconst OPPORTUNITY_CLUSTER_LAYER_ID = "rfx-spatial-scene-opportunity-cluster";`);
replaceOnce(mapPath, `const LENS_PROJECTION_CLUSTER_LAYER_ID = "rfx-spatial-scene-lens-cluster";`, `const LENS_PROJECTION_CLUSTER_BACK_LAYER_ID = "rfx-spatial-scene-lens-cluster-back";\nconst LENS_PROJECTION_CLUSTER_LAYER_ID = "rfx-spatial-scene-lens-cluster";`);
replaceOnce(
  mapPath,
  `          accessibleLocationLabel: marker.accessibleLocationLabel ?? "RFxchange organization marker",`,
  `          accessibleLocationLabel: marker.accessibleLocationLabel ?? "RFxchange organization marker",\n          precision: marker.precision ?? "exact",\n          beaconImage: beaconImageId("own", marker.precision === "approximate" ? "approximate" : "default"),`,
);
replaceOnce(
  mapPath,
  `        identity: organizationInitials(marker.label),\n        selected: marker.id === focusedMarkerId ? 1 : 0,`,
  `        identity: organizationInitials(marker.label),\n        selected: marker.id === focusedMarkerId ? 1 : 0,\n        precision: marker.precision ?? "exact",\n        beaconImage: beaconImageId(\n          "organization",\n          marker.id === focusedMarkerId\n            ? "selected"\n            : marker.precision === "approximate"\n              ? "approximate"\n              : "default",\n        ),`,
);
replaceOnce(
  mapPath,
  `        id: marker.id,\n        label: marker.label,\n        selected: marker.id === focusedMarkerId ? 1 : 0,`,
  `        id: marker.id,\n        label: marker.label,\n        selected: marker.id === focusedMarkerId ? 1 : 0,\n        precision: marker.precision ?? "exact",\n        beaconImage: beaconImageId(\n          "opportunities-rfx",\n          marker.id === focusedMarkerId\n            ? "selected"\n            : marker.precision === "approximate"\n              ? "approximate"\n              : "default",\n        ),`,
);
replaceOnce(
  mapPath,
  `  const lensProjectionRenderModel = useMemo(\n    () => createLensProjectionRenderModel(lensProjectionAdapter, governedAreaGeometries),\n    [governedAreaGeometries, lensProjectionAdapter],\n  );`,
  `  const lensProjectionRenderModel = useMemo(\n    () => createLensProjectionRenderModel(\n      lensProjectionAdapter,\n      governedAreaGeometries,\n      { ownOrganizationId: marker?.organizationId ?? null },\n    ),\n    [governedAreaGeometries, lensProjectionAdapter, marker?.organizationId],\n  );`,
);
replaceOnce(
  mapPath,
  `  const [viewMode, setViewMode] = useState<MapViewMode>("3d");`,
  `  const [viewMode, setViewMode] = useState<MapViewMode>("3d");\n  const [basemapPreset, setBasemapPreset] = useState<MapBasemapPresetId>("exchange");`,
);
replaceOnce(
  mapPath,
  `  const clearSearchHighlight = useCallback(() => {`,
  `  const selectBasemapPreset = useCallback((nextPreset: MapBasemapPresetId) => {\n    const map = mapRef.current;\n    const preset = MAP_BASEMAP_PRESETS.find((candidate) => candidate.id === nextPreset);\n    if (!map || !preset) return;\n    pauseForInteraction();\n    map.setConfigProperty("basemap", "lightPreset", preset.lightPreset);\n    map.setConfigProperty("basemap", "theme", preset.theme);\n    map.setConfigProperty("basemap", "showTransitLabels", preset.showTransitLabels);\n    map.setConfigProperty("basemap", "showPointOfInterestLabels", preset.showPointOfInterestLabels);\n    setBasemapPreset(nextPreset);\n  }, [pauseForInteraction]);\n\n  const clearSearchHighlight = useCallback(() => {`,
);
replaceOnce(
  mapPath,
  `    map.on("load", () => {\n      mapLoadedRef.current = true;\n      setMapReady(true);`,
  `    map.on("load", () => {\n      mapLoadedRef.current = true;\n      setMapReady(true);\n      registerExchangeBeaconImages(map);`,
);

replaceOnce(
  mapPath,
  `      map.addLayer({\n        id: NETWORK_CLUSTER_CORE_LAYER_ID,`,
  `      map.addLayer({\n        id: NETWORK_CLUSTER_BACK_LAYER_ID,\n        type: "circle",\n        source: NETWORK_MARKER_SOURCE_ID,\n        filter: ["has", "point_count"],\n        paint: {\n          "circle-radius": ["step", ["get", "point_count"], 15, 10, 19, 40, 23],\n          "circle-color": "#755014",\n          "circle-opacity": 0.7,\n          "circle-translate": [4, 4],\n          "circle-translate-anchor": "viewport",\n        },\n      });\n      map.addLayer({\n        id: NETWORK_CLUSTER_CORE_LAYER_ID,`,
);
replaceRegexOnce(
  mapPath,
  /      map\.addLayer\(\{\n        id: NETWORK_CLUSTER_CORE_LAYER_ID,[\s\S]*?\n      \}\);/,
  `      map.addLayer({\n        id: NETWORK_CLUSTER_CORE_LAYER_ID,\n        type: "circle",\n        source: NETWORK_MARKER_SOURCE_ID,\n        filter: ["has", "point_count"],\n        paint: {\n          "circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 40, 22],\n          "circle-color": "#252932",\n          "circle-opacity": 0.97,\n          "circle-stroke-color": "#d6a23a",\n          "circle-stroke-width": 2.25,\n        },\n      });`,
);
replaceRegexOnce(
  mapPath,
  /      map\.addLayer\(\{\n        id: NETWORK_MARKER_CORE_LAYER_ID,[\s\S]*?\n      \}\);/,
  `      map.addLayer({\n        id: NETWORK_MARKER_CORE_LAYER_ID,\n        type: "symbol",\n        source: NETWORK_MARKER_SOURCE_ID,\n        filter: ["!", ["has", "point_count"]],\n        layout: {\n          "icon-image": ["get", "beaconImage"],\n          "icon-size": 0.76,\n          "icon-anchor": "bottom",\n          "icon-allow-overlap": true,\n          "icon-ignore-placement": true,\n          "icon-pitch-alignment": "viewport",\n          "icon-rotation-alignment": "viewport",\n        },\n      });`,
);
replaceRegexOnce(
  mapPath,
  /      map\.addLayer\(\{\n        id: NETWORK_SELECTED_MARKER_CORE_LAYER_ID,[\s\S]*?\n      \}\);/,
  `      map.addLayer({\n        id: NETWORK_SELECTED_MARKER_CORE_LAYER_ID,\n        type: "symbol",\n        source: NETWORK_SELECTED_MARKER_SOURCE_ID,\n        layout: {\n          "icon-image": ["get", "beaconImage"],\n          "icon-size": 1.08,\n          "icon-anchor": "bottom",\n          "icon-allow-overlap": true,\n          "icon-ignore-placement": true,\n          "icon-pitch-alignment": "viewport",\n          "icon-rotation-alignment": "viewport",\n        },\n      });`,
);
replaceOnce(mapPath, `          "text-field": ["get", "identity"],\n          "text-size": 10,`, `          "text-field": "",\n          "text-size": 1,`);
replaceOnce(mapPath, `          "text-offset": [0, 1.9],`, `          "text-offset": [0, 3.35],`);

replaceOnce(
  mapPath,
  `      map.addLayer({\n        id: OPPORTUNITY_CLUSTER_LAYER_ID,`,
  `      map.addLayer({\n        id: OPPORTUNITY_CLUSTER_BACK_LAYER_ID,\n        type: "circle",\n        source: OPPORTUNITY_MARKER_SOURCE_ID,\n        filter: ["has", "point_count"],\n        paint: {\n          "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 40, 24],\n          "circle-color": "#755014",\n          "circle-opacity": 0.7,\n          "circle-translate": [4, 4],\n          "circle-translate-anchor": "viewport",\n        },\n      });\n      map.addLayer({\n        id: OPPORTUNITY_CLUSTER_LAYER_ID,`,
);
replaceRegexOnce(
  mapPath,
  /      map\.addLayer\(\{\n        id: OPPORTUNITY_CLUSTER_LAYER_ID,[\s\S]*?\n      \}\);/,
  `      map.addLayer({\n        id: OPPORTUNITY_CLUSTER_LAYER_ID,\n        type: "circle",\n        source: OPPORTUNITY_MARKER_SOURCE_ID,\n        filter: ["has", "point_count"],\n        paint: {\n          "circle-radius": ["step", ["get", "point_count"], 15, 10, 19, 40, 23],\n          "circle-color": "#252932",\n          "circle-opacity": 0.97,\n          "circle-stroke-color": "#d6a23a",\n          "circle-stroke-width": 2.25,\n        },\n      });`,
);
replaceRegexOnce(
  mapPath,
  /      map\.addLayer\(\{\n        id: OPPORTUNITY_MARKER_LAYER_ID,[\s\S]*?\n      \}\);/,
  `      map.addLayer({\n        id: OPPORTUNITY_MARKER_LAYER_ID,\n        type: "symbol",\n        source: OPPORTUNITY_MARKER_SOURCE_ID,\n        filter: ["!", ["has", "point_count"]],\n        layout: {\n          "icon-image": ["get", "beaconImage"],\n          "icon-size": 0.8,\n          "icon-anchor": "bottom",\n          "icon-allow-overlap": true,\n          "icon-ignore-placement": true,\n          "icon-pitch-alignment": "viewport",\n          "icon-rotation-alignment": "viewport",\n        },\n      });`,
);
replaceRegexOnce(
  mapPath,
  /      map\.addLayer\(\{\n        id: OPPORTUNITY_SELECTED_HALO_LAYER_ID,[\s\S]*?\n      \}\);/,
  `      map.addLayer({\n        id: OPPORTUNITY_SELECTED_HALO_LAYER_ID,\n        type: "circle",\n        source: OPPORTUNITY_SELECTED_MARKER_SOURCE_ID,\n        paint: {\n          "circle-radius": 23,\n          "circle-color": "rgba(214,162,58,0.16)",\n          "circle-stroke-color": "rgba(214,162,58,0.55)",\n          "circle-stroke-width": 2,\n          "circle-translate": [0, -18],\n          "circle-translate-anchor": "viewport",\n        },\n      });`,
);
replaceRegexOnce(
  mapPath,
  /      map\.addLayer\(\{\n        id: OPPORTUNITY_SELECTED_MARKER_LAYER_ID,[\s\S]*?\n      \}\);/,
  `      map.addLayer({\n        id: OPPORTUNITY_SELECTED_MARKER_LAYER_ID,\n        type: "symbol",\n        source: OPPORTUNITY_SELECTED_MARKER_SOURCE_ID,\n        layout: {\n          "icon-image": ["get", "beaconImage"],\n          "icon-size": 1.1,\n          "icon-anchor": "bottom",\n          "icon-allow-overlap": true,\n          "icon-ignore-placement": true,\n          "icon-pitch-alignment": "viewport",\n          "icon-rotation-alignment": "viewport",\n        },\n      });`,
);
replaceOnce(mapPath, `"text-offset": [0, 2.25]`, `"text-offset": [0, 3.65]`);

replaceOnce(
  mapPath,
  `      map.addLayer({\n        id: LENS_PROJECTION_CLUSTER_LAYER_ID,`,
  `      map.addLayer({\n        id: LENS_PROJECTION_CLUSTER_BACK_LAYER_ID,\n        type: "circle",\n        source: LENS_PROJECTION_SOURCE_ID,\n        filter: ["==", ["get", "kind"], "cluster"],\n        paint: {\n          "circle-radius": ["step", ["get", "count"], 15, 10, 19, 40, 23],\n          "circle-color": "#755014",\n          "circle-opacity": 0.7,\n          "circle-translate": [4, 4],\n          "circle-translate-anchor": "viewport",\n        },\n      });\n      map.addLayer({\n        id: LENS_PROJECTION_CLUSTER_LAYER_ID,`,
);
replaceRegexOnce(
  mapPath,
  /      map\.addLayer\(\{\n        id: LENS_PROJECTION_CLUSTER_LAYER_ID,[\s\S]*?\n      \}\);/,
  `      map.addLayer({\n        id: LENS_PROJECTION_CLUSTER_LAYER_ID,\n        type: "circle",\n        source: LENS_PROJECTION_SOURCE_ID,\n        filter: ["==", ["get", "kind"], "cluster"],\n        paint: {\n          "circle-radius": ["step", ["get", "count"], 14, 10, 18, 40, 22],\n          "circle-color": "#252932",\n          "circle-opacity": 0.97,\n          "circle-stroke-color": "#d6a23a",\n          "circle-stroke-width": 2.25,\n        },\n      });`,
);
replaceRegexOnce(
  mapPath,
  /      map\.addLayer\(\{\n        id: LENS_PROJECTION_OBJECT_LAYER_ID,[\s\S]*?\n      \}\);/,
  `      map.addLayer({\n        id: LENS_PROJECTION_OBJECT_LAYER_ID,\n        type: "symbol",\n        source: LENS_PROJECTION_SOURCE_ID,\n        filter: ["in", ["get", "kind"], ["literal", ["organization", "record"]]],\n        layout: {\n          "icon-image": ["get", "beaconImage"],\n          "icon-size": ["case", ["==", ["get", "selected"], 1], 1.08, 0.76],\n          "icon-anchor": "bottom",\n          "icon-allow-overlap": true,\n          "icon-ignore-placement": true,\n          "icon-pitch-alignment": "viewport",\n          "icon-rotation-alignment": "viewport",\n        },\n      });`,
);
replaceOnce(mapPath, `          "text-offset": [0, 1.9],\n          "text-anchor": "top",`, `          "text-offset": [0, 3.45],\n          "text-anchor": "top",`);

replaceRegexOnce(
  mapPath,
  /      map\.addLayer\(\{\n        id: HOME_MARKER_CORE_LAYER_ID,[\s\S]*?\n      \}\);/,
  `      map.addLayer({\n        id: HOME_MARKER_CORE_LAYER_ID,\n        type: "symbol",\n        source: HOME_MARKER_SOURCE_ID,\n        layout: {\n          "icon-image": ["get", "beaconImage"],\n          "icon-size": 1.02,\n          "icon-anchor": "bottom",\n          "icon-allow-overlap": true,\n          "icon-ignore-placement": true,\n          "icon-pitch-alignment": "viewport",\n          "icon-rotation-alignment": "viewport",\n        },\n      });`,
);
replaceOnce(mapPath, `          "text-field": ["get", "identity"],\n          "text-size": 12,`, `          "text-field": "",\n          "text-size": 1,`);
replaceOnce(mapPath, `          "text-offset": [0, 2.15],`, `          "text-offset": [0, 3.55],`);

replaceOnce(
  mapPath,
  `      data-map-view-mode={viewMode}\n      data-map-pitch={settledPitch.toFixed(2)}`,
  `      data-map-view-mode={viewMode}\n      data-map-basemap={basemapPreset}\n      data-map-pitch={settledPitch.toFixed(2)}`,
);
replaceOnce(
  mapPath,
  `            <button type="button" onClick={fitHomeLocality}>Fit home</button>\n          </div>`,
  `            <span className={styles.controlDivider} aria-hidden="true" />\n            <span className={styles.basemapLabel}>Map</span>\n            {MAP_BASEMAP_PRESETS.map((preset) => (\n              <button\n                key={preset.id}\n                type="button"\n                data-active={basemapPreset === preset.id}\n                aria-pressed={basemapPreset === preset.id}\n                aria-label={\`Use ${preset.label} map appearance\`}\n                onClick={() => selectBasemapPreset(preset.id)}\n              >\n                {preset.label}\n              </button>\n            ))}\n            <button type="button" onClick={fitHomeLocality}>Fit home</button>\n          </div>`,
);

const css = read(cssPath);
if (!css.includes(".controlDivider")) {
  write(cssPath, `${css}\n\n.controlDivider { width: 1px; min-height: 26px; align-self: center; background: var(--semantic-border-subtle); }\n.basemapLabel { align-self: center; padding-inline: 5px 2px; color: var(--semantic-text-muted); font: 800 0.62rem/1 var(--type-interface-family); letter-spacing: 0.09em; text-transform: uppercase; }\n@media (max-width: 760px) { .viewModeControl { max-width: calc(100vw - 20px); flex-wrap: wrap; justify-content: flex-end; } .basemapLabel { display: none; } .controlDivider { min-height: 22px; } }\n`);
}

replaceOnce(
  participantMapPath,
  `    homeMarker: Object.freeze({\n      id: marker.id,\n      coordinate: marker.coordinate,\n      label: profile?.displayName ?? "Your organization",\n      accessibleLocationLabel: marker.accessibleLocationLabel,\n    }),`,
  `    homeMarker: Object.freeze({\n      id: marker.id,\n      organizationId: String(marker.organizationId),\n      coordinate: marker.coordinate,\n      label: profile?.displayName ?? "Your organization",\n      accessibleLocationLabel: marker.accessibleLocationLabel,\n      precision: marker.privacyTreatment === "exact" ? "exact" : "approximate",\n    }),`,
);

replaceOnce(
  opportunityPath,
  `import type { ParticipantSpatialScope } from "../../application/participant/participant-spatial-context";`,
  `import { projectExchangeRoomActions } from "../../application/participant/exchange-room-actions";\nimport type { ParticipantSpatialScope } from "../../application/participant/participant-spatial-context";`,
);
replaceOnce(
  opportunityPath,
  `import { useParticipantSpatialContext } from "../participant/useParticipantSpatialContext";`,
  `import { ExchangeRoomActionController } from "../participant/ExchangeRoomActionController";\nimport { useParticipantSpatialContext } from "../participant/useParticipantSpatialContext";`,
);
replaceOnce(
  opportunityPath,
  `  const selected = result.items.find((item) => item.reference === selectedReference)\n    ?? result.items.find((item) => markerId(item.reference) === spatialContext.selection.markerId)\n    ?? null;`,
  `  const selected = result.items.find((item) => item.reference === selectedReference)\n    ?? result.items.find((item) => markerId(item.reference) === spatialContext.selection.markerId)\n    ?? null;\n  const exchangeActions = useMemo(() => projectExchangeRoomActions({\n    activeLens: "opportunities-rfx",\n    viewerOrganizationId: spatialScope.organizationId,\n    selectedOrganizationId: spatialScope.organizationId,\n    selectedOrganizationIsOfficialResourceProvider: false,\n    openPlatformActionsAuthorized: true,\n    actionAuthorization: Object.freeze({ rfxCreate: false, referralManage: false, resourceManage: false }),\n    currentOpportunityReference: selected?.reference ?? null,\n  }), [selected?.reference, spatialScope.organizationId]);`,
);
replaceRegexOnce(
  opportunityPath,
  /<div className=\{styles\.detailActions\}>[\s\S]*?<\/div><p className=\{styles\.disclaimer\}>/,
  `<ExchangeRoomActionController\n          activeLens="opportunities-rfx"\n          actions={exchangeActions}\n          onNetworkFocus={() => undefined}\n          onActionIntent={(intent) => {\n            if (intent === "opportunity-watch" && busy === null) void setWatch(selected);\n          }}\n          placement="sheet"\n        /><p className={styles.disclaimer}>`,
);

for (const testPath of [
  "test/exchange-room-phase2-review-findings.test.mjs",
  "test/exchange-room-phase2-reopen.test.mjs",
]) {
  const source = read(testPath);
  const target = `assert.match(controller, /opportunities\\.create-view/);`;
  if (source.includes(target)) write(testPath, source.replace(target, `assert.match(controller, /action\\.handlerCandidate/);`));
}

console.log("Applied final convergence Mapbox and action integration patch.");
