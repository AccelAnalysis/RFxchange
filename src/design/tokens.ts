export const colors = {
  exchangeBlack: "#0B0B0D",
  rfGold: "#D6A23A",
  warmIvory: "#F7F3EA",
  graphite: "#252932",
  signalBlue: "#2E5EAA",
  growthGreen: "#3B7B57",
} as const;

export const colorUsage = {
  canvas: 0.70,
  structure: 0.20,
  goldAccent: 0.07,
  dataColors: 0.03,
} as const;

export const participantSurfaces = {
  defaultCanvas: colors.warmIvory,
  lightGlass: "rgba(247, 243, 234, 0.84)",
  strongLightGlass: "rgba(247, 243, 234, 0.94)",
  structuralText: colors.exchangeBlack,
  secondaryStructure: colors.graphite,
} as const;

export const participantLayout = {
  navigationHeight: 64,
  compactNavigationHeight: 56,
  mapOverlayInset: 18,
  edgeSheetWidth: 430,
} as const;

export const typography = {
  display: '"Aptos Display", "Aptos", "Segoe UI", Helvetica, Arial, sans-serif',
  body: '"Aptos", "Segoe UI", Helvetica, Arial, sans-serif',
} as const;

export const trademark = {
  productName: "The RFxchange™",
  mark: "™",
  registeredMarkAllowed: false,
} as const;
