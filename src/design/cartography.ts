export const EXCHANGE_LIGHT_MAPBOX_STYLE = "mapbox://styles/mapbox/standard" as const;

export const exchangeLightBasemapConfig = Object.freeze({
  lightPreset: "day",
  theme: "faded",
  showPointOfInterestLabels: true,
  showTransitLabels: false,
  show3dObjects: true,
} as const);

export const exchangeLightCartography = Object.freeze({
  landFallback: "#e3e0d7",
  spatialFallback: "#d7e4e8",
  nonFocusMask: "#59606a",
  nonFocusMaskOpacity: 0.3,
  selectedLocalityFill: "#d6a23a",
  selectedLocalityFillOpacity: 0.075,
  selectedLocalityContrast: "#0b0b0d",
  selectedLocalityContrastOpacity: 0.86,
  selectedLocalityContrastWidth: 5,
  selectedLocalityAccent: "#d6a23a",
  selectedLocalityAccentOpacity: 0.96,
  selectedLocalityAccentWidth: 2.5,
  searchFill: "#2e5eaa",
  searchFillOpacity: 0.09,
  searchLine: "#2e5eaa",
  searchLineWidth: 2.5,
  organizationNodeFill: "#0b0b0d",
  organizationNodeRing: "#d6a23a",
  organizationNodeForeground: "#f7f3ea",
  organizationNodeHalo: "rgba(214,162,58,0.18)",
  additionalLocationFill: "#f7f3ea",
  additionalLocationRing: "#8a6418",
  candidateNodeFill: "#2e5eaa",
  confirmedNodeFill: "#3b7b57",
  lowContrastBuildingOpacity: 0.42,
} as const);

export const progressiveMapDetail = Object.freeze({
  localityLabelsMinZoom: 7,
  organizationLabelsMinZoom: 12.5,
  additionalLocationLabelsMinZoom: 14,
  buildingDetailMinZoom: 14.5,
  denseObjectClusteringMaxZoom: 11.5,
} as const);

export const proprietaryDensityGradient = Object.freeze([
  Object.freeze({ density: 0, color: "rgba(247,243,234,0)" }),
  Object.freeze({ density: 0.25, color: "rgba(46,94,170,0.10)" }),
  Object.freeze({ density: 0.55, color: "rgba(46,94,170,0.22)" }),
  Object.freeze({ density: 0.8, color: "rgba(214,162,58,0.30)" }),
  Object.freeze({ density: 1, color: "rgba(214,162,58,0.48)" }),
] as const);

export const focalTargetGeometry = Object.freeze({
  protectedCenterRadiusPixels: 42,
  organizationNodeRadiusPixels: 13,
  organizationHaloRadiusPixels: 20,
  additionalLocationRadiusPixels: 8,
  minimumInteractiveTargetPixels: 44,
  labelOffsetEm: 2.15,
} as const);

export const cartographyDomainPolicy = Object.freeze({
  opportunityBeaconRequiresPublishedProjection: true,
  serviceFieldRequiresProviderTerritory: true,
  relationshipPathRequiresAuthoritativeEvent: true,
  credibilitySealRequiresEvidence: true,
  outcomePathRequiresEvidence: true,
  syntheticLiveObjectsAllowed: false,
  nonSpatialObjectsMayNotReceivePointCoordinates: true,
} as const);
