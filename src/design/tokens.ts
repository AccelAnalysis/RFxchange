export const brandPalette = {
  exchangeBlack: "#0B0B0D",
  warmIvory: "#F7F3EA",
  graphite: "#252932",
  rfGold: "#D6A23A",
  accessibleDarkGold: "#8A6418",
  signalBlue: "#2E5EAA",
  growthGreen: "#3B7B57",
} as const;

export const supportPalette = {
  white: "#FFFFFF",
  mutedInk: "#62656D",
  atmosphericBlue: "#D7E4E8",
  warmSand: "#EFE6D4",
  transparent: "transparent",
} as const;

/**
 * Compatibility export for existing Wave 0–3 consumers. New work should select a semantic role
 * from semanticColorModes or objectSemanticTokens rather than choosing a raw palette color.
 */
export const colors = brandPalette;

export const colorUsage = {
  canvas: 0.70,
  structure: 0.20,
  goldAccent: 0.07,
  dataColors: 0.03,
} as const;

export const semanticColorModes = {
  exchangeLight: {
    canvas: {
      base: brandPalette.warmIvory,
      elevated: supportPalette.white,
      dense: brandPalette.graphite,
      inverse: brandPalette.exchangeBlack,
      spatialFallback: supportPalette.atmosphericBlue,
    },
    surface: {
      glass: "rgba(247, 243, 234, 0.84)",
      glassStrong: "rgba(247, 243, 234, 0.94)",
      control: "rgba(255, 255, 255, 0.55)",
      intelligenceSubtle: "rgba(46, 94, 170, 0.08)",
      connectionSubtle: "rgba(214, 162, 58, 0.16)",
      outcomeSubtle: "rgba(59, 123, 87, 0.08)",
    },
    text: {
      primary: brandPalette.exchangeBlack,
      secondary: brandPalette.graphite,
      muted: supportPalette.mutedInk,
      inverse: supportPalette.white,
      connectionSmall: brandPalette.accessibleDarkGold,
      intelligence: brandPalette.signalBlue,
      outcome: brandPalette.growthGreen,
    },
    border: {
      subtle: "rgba(37, 41, 50, 0.14)",
      strong: "rgba(37, 41, 50, 0.28)",
      inverse: "rgba(255, 255, 255, 0.16)",
      glass: "rgba(247, 243, 234, 0.66)",
      focus: brandPalette.rfGold,
    },
    action: {
      primaryBackground: brandPalette.exchangeBlack,
      primaryForeground: supportPalette.white,
      selectedBackground: brandPalette.rfGold,
      selectedForeground: brandPalette.exchangeBlack,
      link: brandPalette.signalBlue,
      focusRing: brandPalette.rfGold,
    },
    state: {
      information: brandPalette.signalBlue,
      positiveResolution: brandPalette.growthGreen,
      connectionFocus: brandPalette.rfGold,
      connectionText: brandPalette.accessibleDarkGold,
      neutral: brandPalette.graphite,
      disabled: "rgba(37, 41, 50, 0.48)",
      restricted: brandPalette.graphite,
    },
  },
} as const;

export type SemanticColorMode = keyof typeof semanticColorModes;
export const defaultSemanticColorMode: SemanticColorMode = "exchangeLight";

export const spacing = {
  none: 0,
  hairline: 1,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 80,
  immersive: 128,
} as const;

export const radii = {
  square: 0,
  compact: 10,
  control: 14,
  panel: 18,
  immersive: 24,
  pill: 999,
} as const;

export const elevation = {
  none: "none",
  soft: "0 24px 70px rgba(11, 11, 13, 0.08)",
  control: "0 12px 34px rgba(11, 11, 13, 0.12)",
  overlay: "0 24px 72px rgba(11, 11, 13, 0.20)",
  focus: "0 0 0 4px rgba(214, 162, 58, 0.18)",
} as const;

export const borders = {
  width: {
    hairline: 1,
    emphasis: 2,
    focus: 3,
  },
  style: "solid",
  subtle: semanticColorModes.exchangeLight.border.subtle,
  strong: semanticColorModes.exchangeLight.border.strong,
  inverse: semanticColorModes.exchangeLight.border.inverse,
} as const;

export const focus = {
  outlineWidth: borders.width.focus,
  outlineStyle: borders.style,
  outlineColor: semanticColorModes.exchangeLight.action.focusRing,
  outlineOffset: 3,
  highVisibilityOffset: 4,
} as const;

export const fontFamilies = {
  display: '"Aptos Display", "Aptos", "Segoe UI", Helvetica, Arial, sans-serif',
  interface: '"Aptos", "Segoe UI", Helvetica, Arial, sans-serif',
} as const;

export const typographyRoles = {
  displayHero: {
    family: fontFamilies.display,
    weight: 750,
    lineHeight: 0.92,
    letterSpacing: "-0.065em",
  },
  displaySection: {
    family: fontFamilies.display,
    weight: 700,
    lineHeight: 0.98,
    letterSpacing: "-0.05em",
  },
  heading: {
    family: fontFamilies.display,
    weight: 700,
    lineHeight: 1.08,
    letterSpacing: "-0.035em",
  },
  interface: {
    family: fontFamilies.interface,
    weight: 500,
    lineHeight: 1.5,
    letterSpacing: "normal",
  },
  interfaceStrong: {
    family: fontFamilies.interface,
    weight: 700,
    lineHeight: 1.35,
    letterSpacing: "normal",
  },
  eyebrow: {
    family: fontFamilies.interface,
    weight: 750,
    lineHeight: 1.2,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  status: {
    family: fontFamilies.interface,
    weight: 750,
    lineHeight: 1.2,
    letterSpacing: "0.08em",
  },
  data: {
    family: fontFamilies.interface,
    weight: 600,
    lineHeight: 1.3,
    fontVariantNumeric: "tabular-nums",
  },
} as const;

/** Existing compatibility shape retained until B2 migrates all consumers to typographyRoles. */
export const typography = {
  display: fontFamilies.display,
  body: fontFamilies.interface,
} as const;

export const motionDurations = {
  instant: 0,
  microFast: 120,
  micro: 180,
  panelFast: 220,
  panel: 320,
  spatialFast: 600,
  spatial: 1200,
  milestone: 3000,
} as const;

export const motionEasing = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  enter: "cubic-bezier(0.16, 1, 0.3, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  spatial: "cubic-bezier(0.22, 1, 0.36, 1)",
  linear: "linear",
} as const;

/**
 * Semantic contracts for the proprietary market grammar. Declaring a token does not authorize a
 * runtime object. Beacons, service fields, live paths, seals and outcomes remain gated by their
 * authoritative product domains.
 */
export const objectSemanticTokens = {
  node: {
    organization: {
      fill: brandPalette.graphite,
      foreground: supportPalette.white,
      selectedRing: brandPalette.rfGold,
      mutedOpacity: 0.52,
    },
    additionalLocation: {
      fill: brandPalette.graphite,
      foreground: supportPalette.white,
      relationshipRing: brandPalette.accessibleDarkGold,
      scale: 0.72,
    },
  },
  beacon: {
    opportunity: {
      fill: brandPalette.signalBlue,
      foreground: supportPalette.white,
      focusRing: brandPalette.rfGold,
    },
  },
  field: {
    localitySelected: {
      fill: "rgba(214, 162, 58, 0.10)",
      outline: brandPalette.rfGold,
    },
    localitySurrounding: {
      fill: "rgba(37, 41, 50, 0.04)",
      outline: "rgba(37, 41, 50, 0.30)",
    },
    localityRestricted: {
      fill: "rgba(37, 41, 50, 0.12)",
      outline: brandPalette.graphite,
    },
    serviceTerritory: {
      fill: "rgba(46, 94, 170, 0.12)",
      outline: brandPalette.signalBlue,
    },
  },
  path: {
    connection: {
      stroke: brandPalette.rfGold,
      mutedStroke: "rgba(214, 162, 58, 0.34)",
    },
    outcome: {
      stroke: brandPalette.growthGreen,
      mutedStroke: "rgba(59, 123, 87, 0.34)",
    },
    information: {
      stroke: brandPalette.signalBlue,
      mutedStroke: "rgba(46, 94, 170, 0.34)",
    },
  },
  seal: {
    evidence: {
      structure: brandPalette.graphite,
      accent: brandPalette.rfGold,
      foreground: supportPalette.white,
    },
    unavailable: {
      structure: "rgba(37, 41, 50, 0.40)",
      foreground: brandPalette.graphite,
    },
  },
  locality: {
    selected: brandPalette.rfGold,
    released: brandPalette.signalBlue,
    surrounding: "rgba(37, 41, 50, 0.30)",
    limited: brandPalette.accessibleDarkGold,
    restricted: brandPalette.graphite,
  },
} as const;

export const participantSurfaces = {
  defaultCanvas: colors.warmIvory,
  lightGlass: semanticColorModes.exchangeLight.surface.glass,
  strongLightGlass: semanticColorModes.exchangeLight.surface.glassStrong,
  structuralText: colors.exchangeBlack,
  secondaryStructure: colors.graphite,
} as const;

export const participantLayout = {
  navigationHeight: 64,
  compactNavigationHeight: 56,
  mapOverlayInset: 18,
  edgeSheetWidth: 430,
} as const;

export const semanticTokenPolicy = {
  rawPaletteUse: "tokens-and-compatibility-boundaries-only",
  defaultMode: defaultSemanticColorMode,
  bundledFontAssetsAllowed: false,
  darkModeAuthorized: false,
  domainObjectTokensAuthorizeRuntimeObjects: false,
} as const;

export const trademark = {
  productName: "The RFxchange™",
  mark: "™",
  registeredMarkAllowed: false,
} as const;
