import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  PARTICIPANT_SHEET_SNAP_POINTS,
  createParticipantSpatialContext,
  parseParticipantSpatialContext,
  serializeParticipantSpatialContext,
} from "../src/application/participant/participant-spatial-context.ts";
import { PARTICIPANT_LENS_IDS } from "../src/application/participant/participant-lens-registry.ts";
import { MOBILE_EXCHANGE_STAGE2_LENS_IDS } from "../src/application/participant/mobile-exchange-stage2-legacy.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const paths = Object.freeze({
  navigation: "src/components/participant/ParticipantTopNavigation.tsx",
  navigationCss: "src/components/participant/ParticipantTopNavigation.module.css",
  primitives: "src/components/participant/MobileExchangePrimitives.tsx",
  primitivesCss: "src/components/participant/MobileExchangePrimitives.module.css",
  workspace: "src/components/participant/ExistingWorkspaceFoundation.tsx",
  workspaceCss: "src/components/participant/ExistingWorkspaceFoundation.module.css",
  actionController: "src/components/participant/ExchangeRoomActionController.tsx",
  actionCss: "src/components/participant/ExchangeRoomActionController.module.css",
  shellCss: "src/components/participant/PersistentParticipantShell.module.css",
  i18nProvider: "src/components/i18n/I18nProvider.tsx",
});

test("MOB-02 keeps the mobile Exchange map-first with floating search, dynamic viewport, and safe areas", async () => {
  const [workspace, workspaceCss, shellCss] = await Promise.all([
    read(paths.workspace),
    read(paths.workspaceCss),
    read(paths.shellCss),
  ]);
  assert.match(workspace, /<ExchangeSpatialScene/);
  assert.match(workspace, /className=\{styles\.mobileSearchOverlay\}/);
  assert.match(workspaceCss, /\.mobileSearchOverlay\s*\{[\s\S]*position: fixed/);
  assert.match(workspaceCss, /env\(safe-area-inset-top/);
  assert.match(shellCss, /100svh/);
  assert.match(shellCss, /100dvh/);
  assert.match(shellCss, /env\(safe-area-inset-bottom/);
  assert.match(workspace, /desktopSearchOverlay/);
  assert.match(workspace, /desktopDetailSheet/);
  assert.match(workspace, /networkWorkspace\.match\.disclaimer/);
});

test("MOB-03 preserves the four permanent successor lenses and adds Menu as a separate fifth mobile utility", async () => {
  const [navigation, navigationCss] = await Promise.all([
    read(paths.navigation),
    read(paths.navigationCss),
  ]);
  assert.deepEqual([...MOBILE_EXCHANGE_STAGE2_LENS_IDS], [
    "opportunities-rfx",
    "resources",
    "intelligence",
    "referrals",
  ]);
  assert.deepEqual([...PARTICIPANT_LENS_IDS], [
    "opportunities-rfx",
    "resources",
    "intelligence",
    "capabilities",
  ]);
  assert.match(navigation, /data-mobile-lens-navigation="persistent-bottom"/);
  assert.match(navigation, /PARTICIPANT_LENSES\.map/);
  assert.match(navigation, /data-mobile-menu-trigger/);
  assert.doesNotMatch(navigation, /<details/);
  assert.doesNotMatch(navigation, /MobileLensMenu/);
  assert.match(navigationCss, /\.mobileBottomNavigation,[\s\S]*?\.mobileMenuUtility\s*\{\s*display: none;/);
  assert.match(navigationCss, /@media \(max-width: 760px\)[\s\S]*?\.mobileBottomNavigation\s*\{[\s\S]*?position: fixed/);
  assert.match(navigationCss, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(navigationCss, /env\(safe-area-inset-bottom/);
  assert.match(navigation, /PARTICIPANT_UTILITY_DESTINATIONS\.account\.href/);
});

test("MOB-04 implements three sheet states, touch dragging, accessible controls, internal scrolling, and reduced motion", async () => {
  const [primitives, css] = await Promise.all([
    read(paths.primitives),
    read(paths.primitivesCss),
  ]);
  assert.deepEqual([...PARTICIPANT_SHEET_SNAP_POINTS], ["peek", "partial", "expanded"]);
  assert.match(primitives, /onPointerDown=\{beginDrag\}/);
  assert.match(primitives, /onPointerMove=\{moveDrag\}/);
  assert.match(primitives, /velocityY/);
  assert.match(primitives, /data-snap-control=\{point\}/);
  assert.match(primitives, /aria-pressed=\{snapPoint === point\}/);
  assert.match(primitives, /data-sheet-scroll-region/);
  assert.match(css, /overscroll-behavior: contain/);
  assert.match(css, /touch-action: pan-y/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /orientation: landscape/);
  assert.match(css, /bottom: calc\(var\(--participant-mobile-nav-height/);
});

test("MOB-05 renders the existing 16-action projection as four stable sheet positions without collapsing authority facts", async () => {
  const [controller, css] = await Promise.all([
    read(paths.actionController),
    read(paths.actionCss),
  ]);
  assert.match(controller, /data-action-rail-placement=\{placement\}/);
  assert.match(controller, /data-operational/);
  assert.match(controller, /data-applicable/);
  assert.match(controller, /data-authorized/);
  assert.match(controller, /data-disabled-reason/);
  assert.match(controller, /disabled/);
  assert.match(css, /data-action-rail-placement="sheet"/);
  assert.match(css, /grid-template-columns: repeat\(4/);
});

test("shared cards, media, favorites, detail, and marker selection converge on one production seam", async () => {
  const [primitives, workspace, i18nProvider] = await Promise.all([
    read(paths.primitives),
    read(paths.workspace),
    read(paths.i18nProvider),
  ]);
  assert.match(primitives, /export function ExchangeMedia/);
  assert.match(primitives, /export function ExchangeFavorite/);
  assert.match(primitives, /export function ExchangeResultCard/);
  assert.match(primitives, /data-selection-key=\{card\.identity\.selectionKey\}/);
  assert.match(primitives, /resolveRecordActionLabel\(action\.labelKey\)/);
  assert.match(primitives, /data-action-label-key=\{action\.labelKey\}/);
  assert.ok((primitives.match(/\{label\}/g) ?? []).length >= 3, "enabled and disabled record actions must render resolved labels");
  assert.doesNotMatch(primitives, />\{action\.labelKey\}</);
  assert.match(workspace, /resolveRecordActionLabel=\{\(labelKey\) => t\(labelKey\)\}/);
  assert.match(i18nProvider, /mobileExchangeRecordActionLabel\(locale, key\)/);
  assert.match(workspace, /focusedMarkerId=\{selectedObjectId\}/);
  assert.match(workspace, /data-mobile-result-stream/);
  assert.match(workspace, /onOrganizationMarkerSelect=\{\(markerId\) => selectObject\(markerId\)\}/);
  assert.match(workspace, /onSelect=\{\(\) => selectObject\(organization\.marker\.id, index\)\}/);
  assert.match(workspace, /cardRefs\.current\.get\(selectedObjectId\)/);
  assert.match(workspace, /setMobileDetailOpen\(true\)/);
  assert.match(workspace, /sheetSnapPoint: "expanded"/);
  assert.doesNotMatch(workspace, /synthetic|fixture/i);
});

test("sheet continuity remains presentation-only and accepts valid pre-Stage-2 stored contexts", () => {
  const scope = {
    participantId: "participant-1",
    membershipId: "membership-1",
    organizationId: "organization-1",
    geographyId: "geography-1",
  };
  const current = createParticipantSpatialContext({ scope, homeMarkerId: "marker-home" });
  assert.equal(current.sheetSnapPoint, "partial");
  assert.equal(current.sheetScrollTop, 0);
  assert.equal(parseParticipantSpatialContext(serializeParticipantSpatialContext(current), scope)?.sheetSnapPoint, "partial");

  const legacy = JSON.parse(serializeParticipantSpatialContext(current));
  delete legacy.sheetSnapPoint;
  delete legacy.sheetScrollTop;
  const restored = parseParticipantSpatialContext(JSON.stringify(legacy), scope);
  assert.equal(restored?.sheetSnapPoint, "partial");
  assert.equal(restored?.sheetScrollTop, 0);
});

test("all five governed locales carry complete Stage 2 sheet, card, and record-action copy", async () => {
  const localePaths = ["en-US", "es", "fr", "it", "de"].map(
    (locale) => `src/i18n/messages/network/mobile-exchange-stage2/${locale}.json`,
  );
  const catalogs = await Promise.all(localePaths.map(async (path) => JSON.parse(await read(path))));
  const expectedSheetKeys = ["region", "dragHandle", "peek", "partial", "expanded"];
  const expectedCardKeys = ["openDetail", "addFavorite", "removeFavorite", "favoriteUnavailable", "mediaFallback"];
  const expectedRecordActionKeys = [
    "resources.recordActions.viewProvider",
    "resources.recordActions.viewResource",
    "resources.recordActions.requestSupport",
    "resources.recordActions.openIntake",
    "resources.recordActions.viewRequest",
  ];
  for (const catalog of catalogs) {
    assert.deepEqual(Object.keys(catalog.sheet), expectedSheetKeys);
    assert.deepEqual(Object.keys(catalog.card), expectedCardKeys);
    assert.deepEqual(Object.keys(catalog.recordActions), expectedRecordActionKeys);
    assert.ok(Object.values(catalog.sheet).every((value) => typeof value === "string" && value.length > 0));
    assert.ok(Object.values(catalog.card).every((value) => typeof value === "string" && value.length > 0));
    for (const key of expectedRecordActionKeys) {
      assert.equal(typeof catalog.recordActions[key], "string");
      assert.ok(catalog.recordActions[key].length > 0);
      assert.notEqual(catalog.recordActions[key], key);
    }
  }
});
