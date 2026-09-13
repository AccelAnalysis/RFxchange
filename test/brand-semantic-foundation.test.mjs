import assert from "node:assert/strict";
import test from "node:test";

import {
  brandPalette,
  borders,
  colors,
  defaultSemanticColorMode,
  elevation,
  focus,
  fontFamilies,
  motionDurations,
  motionEasing,
  objectSemanticTokens,
  participantSurfaces,
  radii,
  semanticColorModes,
  semanticTokenPolicy,
  spacing,
  typography,
  typographyRoles,
} from "../src/design/tokens.ts";

function rgb(hex) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16) / 255);
}

function luminance(hex) {
  const channels = rgb(hex).map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test("Design System v2 preserves the bright palette and legacy access", () => {
  assert.deepEqual(brandPalette, {
    canvasCloud: "#F8FAFC",
    surfaceWhite: "#FFFFFF",
    surfaceMist: "#F1F4F8",
    exchangeSlate: "#1B2430",
    secondarySlate: "#475467",
    exchangeBlack: "#1B2430",
    warmIvory: "#F8FAFC",
    graphite: "#1B2430",
    rfGold: "#D6A23A",
    accessibleDarkGold: "#7A5710",
    signalBlue: "#2E5EAA",
    growthGreen: "#3B7B57",
  });
  assert.equal(colors, brandPalette);
  assert.equal(participantSurfaces.defaultCanvas, colors.warmIvory);
});

test("Brand B1 defines Exchange Light through semantic roles rather than raw component choices", () => {
  assert.equal(defaultSemanticColorMode, "exchangeLight");
  const mode = semanticColorModes.exchangeLight;
  assert.equal(mode.canvas.base, brandPalette.warmIvory);
  assert.equal(mode.text.primary, brandPalette.exchangeBlack);
  assert.equal(mode.text.connectionSmall, brandPalette.accessibleDarkGold);
  assert.equal(mode.text.intelligence, brandPalette.signalBlue);
  assert.equal(mode.text.outcome, brandPalette.growthGreen);
  assert.equal(mode.action.selectedBackground, brandPalette.signalBlue);
  assert.equal(mode.action.selectedForeground, brandPalette.exchangeBlack);
  assert.equal(semanticTokenPolicy.darkModeAuthorized, false);
});

test("Gold Text is the normal-text gold role on Canvas Cloud", () => {
  assert.ok(contrast(brandPalette.accessibleDarkGold, brandPalette.warmIvory) >= 4.5);
  assert.ok(contrast(brandPalette.rfGold, brandPalette.warmIvory) < 4.5);
});

test("Brand B1 defines complete structural, focus, type and motion token families", () => {
  assert.deepEqual(Object.keys(spacing), [
    "none",
    "hairline",
    "xxs",
    "xs",
    "sm",
    "md",
    "lg",
    "xl",
    "xxl",
    "section",
    "immersive",
  ]);
  assert.equal(radii.panel, 16);
  assert.equal(elevation.overlay, "0 24px 72px rgba(27, 36, 48, 0.16)");
  assert.equal(borders.width.focus, 3);
  assert.equal(focus.outlineColor, brandPalette.signalBlue);
  assert.equal(typography.display, fontFamilies.display);
  assert.equal(typography.body, fontFamilies.interface);
  assert.equal(typographyRoles.data.fontVariantNumeric, "tabular-nums");
  assert.equal(motionDurations.microFast, 120);
  assert.equal(motionDurations.panel, 320);
  assert.equal(motionDurations.spatial, 1200);
  assert.equal(motionEasing.spatial, "cubic-bezier(0.22, 1, 0.36, 1)");
  assert.equal(semanticTokenPolicy.bundledFontAssetsAllowed, false);
});

test("Brand B1 object semantics preserve meaning without granting domain state", () => {
  assert.equal(objectSemanticTokens.node.organization.fill, brandPalette.graphite);
  assert.equal(objectSemanticTokens.node.organization.selectedRing, brandPalette.signalBlue);
  assert.equal(objectSemanticTokens.beacon.opportunity.fill, brandPalette.signalBlue);
  assert.equal(objectSemanticTokens.path.connection.stroke, brandPalette.rfGold);
  assert.equal(objectSemanticTokens.path.information.stroke, brandPalette.signalBlue);
  assert.equal(objectSemanticTokens.path.outcome.stroke, brandPalette.growthGreen);
  assert.equal(objectSemanticTokens.field.serviceTerritory.outline, brandPalette.signalBlue);
  assert.equal(objectSemanticTokens.seal.evidence.structure, brandPalette.graphite);
  assert.equal(objectSemanticTokens.locality.limited, brandPalette.accessibleDarkGold);
  assert.equal(semanticTokenPolicy.domainObjectTokensAuthorizeRuntimeObjects, false);
});
